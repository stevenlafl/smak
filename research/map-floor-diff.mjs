// Where a reproduced map's walked floor differs from the original's: the judge's own measure (P2's floor
// overlap, examples/reproduce/judge.mjs) split by floor height and drawn.
//
//   node research/map-floor-diff.mjs original.bsp copy.bsp [-o diff.png]
//
// It prints, for each band of 32 units of floor height (after the judge's alignment), the cells of 16 x 16 the
// original walks, the copy walks, and both (heights within 24). The picture is the plan of both, a cell a
// pixel at 1/4: green in both, red only in the original, blue only in the copy, brighter for higher floors.
// It reads the two files and writes only the picture; nothing of a game's map goes into the repository.
import { readFileSync, writeFileSync } from "node:fs";
import { floorOf, alignMaps } from "../examples/reproduce/judge.mjs";
import { png } from "../src/image.mjs";

const args = process.argv.slice(2);
const out = args.includes("-o") ? args.splice(args.indexOf("-o"), 2)[1] : null;
const [origFile, copyFile] = args;
const a = floorOf(readFileSync(origFile));
const b = floorOf(readFileSync(copyFile));
const { overlap, move } = alignMaps(a, b);
const [dx, dy, dz] = move;
console.log(`overlap ${overlap.toFixed(3)} with the copy moved by ${-dx} ${-dy} ${-dz} onto the original`);

// every floor cell of either map, in the original's frame: key "x,y,h"
const bands = new Map();
const add = (h, k) => {
  const band = Math.floor(h / 32) * 32;
  if (!bands.has(band)) bands.set(band, { orig: 0, copy: 0, both: 0 });
  bands.get(band)[k]++;
};
const cells = [];
for (const [key, hs] of a.cells) {
  const [x, y] = key.split(",").map(Number);
  const other = b.cells.get(`${x + dx},${y + dy}`) ?? [];
  for (const h of hs) {
    const hit = other.some((g) => Math.abs(g - dz - h) <= 24);
    add(h, "orig");
    if (hit) add(h, "both");
    cells.push({ x, y, h, kind: hit ? "both" : "orig" });
  }
}
for (const [key, hs] of b.cells) {
  const [x, y] = key.split(",").map(Number);
  const mine = a.cells.get(`${x - dx},${y - dy}`) ?? [];
  for (const g of hs) {
    const h = g - dz;
    add(h, "copy");
    if (!mine.some((o) => Math.abs(o - h) <= 24)) cells.push({ x: x - dx, y: y - dy, h, kind: "copy" });
  }
}
console.log("floor z band   original   copy   both   original missed   copy extra   (cells of 16 x 16)");
for (const band of [...bands.keys()].sort((p, q) => p - q)) {
  const s = bands.get(band);
  if (s.orig + s.copy < 8) continue;
  console.log(`${String(band).padStart(6)} to ${String(band + 32).padEnd(6)} ${String(s.orig).padStart(8)} ${String(s.copy).padStart(6)} ${String(s.both).padStart(6)} ${String(s.orig - s.both).padStart(14)} ${String(s.copy - s.both).padStart(12)}`);
}
const tot = [...bands.values()].reduce((t, s) => ({ orig: t.orig + s.orig, copy: t.copy + s.copy, both: t.both + s.both }), { orig: 0, copy: 0, both: 0 });
console.log(`total: original ${tot.orig}, copy ${tot.copy}, both ${tot.both}; IoU ${(tot.both / (tot.orig + tot.copy - tot.both)).toFixed(3)}`);

if (out) {
  const xs = cells.map((c) => c.x), ys = cells.map((c) => c.y), hs = cells.map((c) => c.h);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const [h0, h1] = [Math.min(...hs), Math.max(...hs)];
  const S = 4; // pixels a cell
  const W = ((x1 - x0) / 16 + 1) * S, H = ((y1 - y0) / 16 + 1) * S;
  const rgba = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i++) rgba.set([20, 20, 24, 255], i * 4);
  // draw lower floors first so the highest shows
  for (const c of cells.sort((p, q) => p.h - q.h)) {
    const lit = 0.45 + 0.55 * ((c.h - h0) / (h1 - h0 || 1));
    const col = c.kind === "both" ? [60, 220, 90] : c.kind === "orig" ? [235, 60, 50] : [70, 120, 255];
    const px = ((c.x - x0) / 16) * S, py = ((y1 - c.y) / 16) * S;
    for (let u = 0; u < S; u++) for (let v = 0; v < S; v++) rgba.set([...col.map((k) => Math.round(k * lit)), 255], ((py + v) * W + px + u) * 4);
  }
  writeFileSync(out, png(W, H, rgba));
  console.log(`wrote ${out}: ${W} x ${H}, x ${x0} to ${x1}, y ${y0} to ${y1}`);
}
