// Draw a house's key (key.json) as plans, one storey beside the next, so that it can be checked against the
// drawings by eye. Node 18, no dependencies beyond the kit.
//
//   node examples/reproduce/blueprints/draw-key.mjs <house>/key.json [-o out.png] [--scale 24] [--no-sheet]
//
// The picture goes to <house>/input/key.png (git-ignored, as it carries the sheet) unless -o names another.
//
// x (east) is to the right and y (north) up, `--scale` pixels a foot, a grid line each foot and a darker one each
// five. Rooms are tinted and named, doors are red bars across their opening (orange when marked uncertain),
// openings without a door green, windows blue, stairs a black arrow from foot to head. Where the key's `plans`
// say which sheet a storey is drawn on and how it lies (its TIFF in <house>/input/, the pixel of the house's
// origin, pixels a foot and which way x and y run on the sheet), the sheet is drawn under the key, turned to the
// key's axes, so that every line of the key can be laid on the drawing's.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { readTiff, pngOf } from "./tiff.mjs";
import { textMask } from "../../../src/render.mjs";

const args = process.argv.slice(2);
const keyFile = args.find((a) => a.endsWith(".json"));
if (!keyFile) throw new Error("usage: draw-key.mjs <house>/key.json [-o out.png] [--scale 24] [--no-sheet]");
const opt = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const S = Number(opt("--scale", 24));
const out = opt("-o", join(dirname(keyFile), "input", "key.png"));
const withSheet = !args.includes("--no-sheet");
const key = JSON.parse(readFileSync(keyFile, "utf8"));
const input = join(dirname(keyFile), "input");

const MARGIN = 3; // feet about the house
const all = [...key.rooms.flatMap((r) => r.outline), ...(key.outside?.outline ?? [])];
const x0 = Math.min(...all.map((p) => p[0])) - MARGIN, x1 = Math.max(...all.map((p) => p[0])) + MARGIN;
const y0 = Math.min(...all.map((p) => p[1])) - MARGIN, y1 = Math.max(...all.map((p) => p[1])) + MARGIN;
const PW = Math.ceil((x1 - x0) * S), PH = Math.ceil((y1 - y0) * S) + 30;
const storeys = key.storeys.map((s) => s.name);
const W = PW * storeys.length + 10 * (storeys.length - 1), H = PH;
const rgb = new Uint8Array(W * H * 3).fill(255);

const blend = (px, py, c, a = 1) => {
  if (px < 0 || py < 0 || px >= W || py >= H) return;
  const i = (py * W + px) * 3;
  for (let k = 0; k < 3; k++) rgb[i + k] = Math.round(rgb[i + k] * (1 - a) + c[k] * a);
};
const write = (text, px, py, c, k = 2) => {
  const m = textMask(text, k);
  for (let y = -1; y <= m.height; y++) for (let x = -1; x <= m.width; x++) blend(px + x, py + y, [255, 255, 255], 0.7);
  for (let y = 0; y < m.height; y++) for (let x = 0; x < m.width; x++) if (m.at(x, y)) blend(px + x, py + y, c);
};
const inside = (poly, x, y) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
// the nearest edge of any room of the storey to a point: the wall a door or window is in, and its direction
function wallAt(rooms, p) {
  let best = null;
  for (const r of rooms)
    for (let i = 0; i < r.outline.length; i++) {
      const a = r.outline[i], b = r.outline[(i + 1) % r.outline.length];
      const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
      const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (len * len)));
      const d = Math.hypot(a[0] + t * dx - p[0], a[1] + t * dy - p[1]);
      if (!best || d < best.d) best = { d, dir: [dx / len, dy / len] };
    }
  return best?.dir ?? [1, 0];
}
const TINTS = [[255, 205, 150], [170, 220, 170], [170, 200, 255], [240, 190, 240], [250, 235, 140], [160, 230, 230], [230, 200, 170], [200, 200, 200]];

let sheets = 0;
storeys.forEach((name, n) => {
  const ox = n * (PW + 10);
  const P = (x, y) => [ox + Math.round((x - x0) * S), 30 + Math.round((y1 - y) * S)];
  const F = (px, py) => [x0 + (px - ox + 0.5) / S, y1 - (py - 30 + 0.5) / S];
  // the sheet under it
  const plan = withSheet && key.plans?.find((p) => p.storey === name);
  if (plan && existsSync(join(input, plan.tif))) {
    sheets++;
    const img = readTiff(readFileSync(join(input, plan.tif)));
    const at = (x, y) => {
      let u = plan.origin[0], v = plan.origin[1];
      for (const [dir, val] of [[plan.x, x], [plan.y, y]]) {
        const d = (dir[0] === "-" ? -1 : 1) * val * plan.pxPerFoot;
        if (dir[1] === "u") u += d; else v += d;
      }
      return [u, v];
    };
    const r = Math.max(0, Math.floor(plan.pxPerFoot / S / 2));
    for (let py = 30; py < PH; py++)
      for (let px = ox; px < ox + PW; px++) {
        const [u, v] = at(...F(px, py)).map(Math.round);
        let g = 255;
        for (let dv = -r; dv <= r; dv++)
          for (let du = -r; du <= r; du++) {
            const uu = u + du, vv = v + dv;
            if (uu >= 0 && vv >= 0 && uu < img.width && vv < img.height) g = Math.min(g, img.data[(vv * img.width + uu) * img.channels]);
          }
        blend(px, py, [g, g, g]);
      }
  }
  // grid
  for (let py = 30; py < PH; py++)
    for (let px = ox; px < ox + PW; px++) {
      const [x, y] = F(px, py), [xa, ya] = F(px + 1, py + 1);
      const onX = Math.floor(xa) !== Math.floor(x), onY = Math.floor(ya) !== Math.floor(y);
      if (onX || onY) {
        const five = (onX && Math.floor(xa) % 5 === 0) || (onY && Math.floor(y) % 5 === 0);
        const zero = (onX && Math.floor(xa) === 0) || (onY && Math.floor(y) === 0);
        blend(px, py, zero ? [0, 0, 0] : [120, 120, 160], zero ? 0.6 : five ? 0.35 : 0.12);
      }
    }
  const rooms = key.rooms.filter((r) => r.storey === name);
  // rooms: tinted, outlined
  rooms.forEach((room, i) => {
    const tint = TINTS[i % TINTS.length];
    const xs = room.outline.map((p) => p[0]), ys = room.outline.map((p) => p[1]);
    const [ax, ay] = P(Math.min(...xs), Math.max(...ys)), [bx, by] = P(Math.max(...xs), Math.min(...ys));
    for (let py = ay; py <= by; py++)
      for (let px = ax; px <= bx; px++) {
        const [x, y] = F(px, py);
        if (!inside(room.outline, x, y)) continue;
        const edge = !inside(room.outline, x + 2 / S, y) || !inside(room.outline, x - 2 / S, y) || !inside(room.outline, x, y + 2 / S) || !inside(room.outline, x, y - 2 / S);
        blend(px, py, edge ? tint.map((c) => c * 0.45) : tint, edge ? 0.9 : 0.4);
      }
  });
  rooms.forEach((room) => {
    const cx = room.outline.reduce((s, p) => s + p[0], 0) / room.outline.length, cy = room.outline.reduce((s, p) => s + p[1], 0) / room.outline.length;
    const [px, py] = P(cx, cy);
    const label = room.name.toUpperCase();
    write(label, px - Math.round(textMask(label, 2).width / 2), py - 5, [20, 20, 20]);
  });
  // doors, openings, windows: a bar along the wall, the opening's width
  const bar = (p, width, colour, thick) => {
    const [dx, dy] = wallAt(rooms, p);
    for (let t = -width / 2; t <= width / 2; t += 0.5 / S)
      for (let s = -thick / 2; s <= thick / 2; s += 0.5 / S) {
        const [px, py] = P(p[0] + dx * t - dy * s, p[1] + dy * t + dx * s);
        blend(px, py, colour, 0.85);
      }
  };
  const mine = (list, field) => (list ?? []).filter((d) => [d[field]].flat().some((rn) => rooms.some((r) => r.name === rn)));
  for (const w of mine(key.windows, "room")) bar(w.at, w.width, [30, 90, 255], 0.5);
  for (const o of mine(key.openings, "between")) bar(o.at, o.width, [0, 170, 0], 0.7);
  for (const d of mine(key.doors, "between")) bar(d.at, d.width, d.uncertain ? [255, 150, 0] : [230, 0, 0], 0.8);
  // stairs: an arrow from foot to head on both storeys it joins
  for (const st of (key.stairs ?? []).filter((s) => s.from === name || s.to === name)) {
    const a = st.at, b = st.top ?? st.at, len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    for (let t = 0; t <= len; t += 0.5 / S) {
      const [px, py] = P(a[0] + ((b[0] - a[0]) * t) / len, a[1] + ((b[1] - a[1]) * t) / len);
      for (let k = -1; k <= 1; k++) blend(px + k, py, [0, 0, 0]), blend(px, py + k, [0, 0, 0]);
    }
    const [hx, hy] = P(...b);
    for (let k = -4; k <= 4; k++) for (let j = -4; j <= 4; j++) if (Math.abs(k) + Math.abs(j) <= 4) blend(hx + k, hy + j, [0, 0, 0]);
  }
  const f = key.storeys.find((s) => s.name === name);
  write(`${name} floor ${f.floor} ceiling ${f.ceiling}`, ox + 4, 6, [0, 0, 0], 3);
});
writeFileSync(out, pngOf({ width: W, height: H, channels: 3, data: rgb }));
console.log(`${out}: ${storeys.length} storeys, ${key.rooms.length} rooms, ${key.doors.length} doors, ${key.windows.length} windows, ${W} x ${H}${sheets ? `, ${sheets} drawn over their sheets` : ""}`);
