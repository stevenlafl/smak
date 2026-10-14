// What the reproduction harness shares: where things are, a model read with its textures, the cameras both an
// original and its reproduction are drawn from, and the measurements the rubric names (M1 silhouette overlap,
// M2 size, M4 colour difference, M8 triangles and check).
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import * as smak from "../../src/index.mjs";
import { posed, framing, render } from "../../src/render.mjs";

export const HERE = dirname(fileURLToPath(import.meta.url));
export const KIT = join(HERE, "..", "..");
export const SUBJECTS = JSON.parse(readFileSync(join(HERE, "subjects.json"), "utf8"));
export const GAME = SUBJECTS.game.replace(/^~/, homedir());
export const STEAM = join(homedir(), ".steam/steam/steamapps/common");
export const SDHLT = join(KIT, "..", "SDHLT", "tools");

/** A model's bytes, with the textures of its <name>t.mdl when it keeps them there. */
export function readModel(file) {
  let src = readFileSync(file);
  const side = file.replace(/\.mdl$/i, "t.mdl");
  if (src.length > 184 && !src.readInt32LE(180) && existsSync(side)) src = smak.withTextures(src, readFileSync(side));
  return src;
}

/** The pose everything is drawn and measured in: the first animation's first frame, as the game shows it. */
export const POSE = { seq: 0, frame: 0 };

/** The views of the pictures: six sides, then four close angles. [name, yaw, pitch] */
export const SIDES = [
  ["front", 0, 0],
  ["left", 90, 0],
  ["back", 180, 0],
  ["right", 270, 0],
  ["top", 0, 90],
  ["below", 0, -90],
];
export const ANGLES = [
  ["front-left", 35, 20],
  ["front-right", -35, 20],
  ["back-left", 145, 20],
  ["back-right", 215, 20],
];

/** The box of a model's points in the pose: { mn, mx, size }. */
export function boxOf(src) {
  const points = posed(src, POSE).tris.flatMap((t) => t.c.map((c) => c.p));
  const mn = [0, 1, 2].map((a) => Math.min(...points.map((p) => p[a])));
  const mx = [0, 1, 2].map((a) => Math.max(...points.map((p) => p[a])));
  return { mn, mx, size: mx.map((v, a) => v - mn[a]) };
}

/**
 * Pictures of a model from every view, each `size` square, framed by `within` (so that two models drawn with
 * one `far` are to one scale). Returns [{ name, picture }].
 */
export function picturesOf(src, { within = framing(src, [POSE]), size = 512, views = [...SIDES, ...ANGLES] } = {}) {
  return views.map(([name, yaw, pitch]) => ({ name, picture: render(src, { ...POSE, view: "orbit", within, yaw, pitch, width: size, height: size }) }));
}

/** Writes a picture ({ width, height, rgba }) as a PNG. */
export function savePng(file, picture) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, smak.png(picture.width, picture.height, picture.rgba));
}

/** Pictures side by side, each with a caption over it: { width, height, rgba }. */
export function besides(pictures) {
  const height = Math.max(...pictures.map((p) => p.height));
  const width = pictures.reduce((sum, p) => sum + p.width, 0);
  const rgba = new Uint8Array(width * height * 4);
  let x0 = 0;
  for (const p of pictures) {
    for (let y = 0; y < p.height; y++) rgba.set(p.rgba.subarray(y * p.width * 4, (y + 1) * p.width * 4), (y * width + x0) * 4);
    x0 += p.width;
  }
  return { width, height, rgba };
}

// ── measurements ──────────────────────────────────────────────────────────

/** The outline of a model seen along one axis (0 x, 1 y, 2 z) at `per` pixels a unit: a set of filled pixels. */
function outline(src, axis, per) {
  const [a, b] = [0, 1, 2].filter((k) => k !== axis);
  const tris = posed(src, POSE).tris.map((t) => t.c.map((c) => [c.p[a], c.p[b]]));
  const pts = tris.flat();
  const mn = [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1]))];
  const mx = [Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
  const mid = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2];
  const cells = new Set();
  for (const t of tris) {
    const q = t.map(([u, v]) => [(u - mid[0]) * per, (v - mid[1]) * per]);
    const x0 = Math.floor(Math.min(...q.map((p) => p[0])));
    const x1 = Math.ceil(Math.max(...q.map((p) => p[0])));
    const y0 = Math.floor(Math.min(...q.map((p) => p[1])));
    const y1 = Math.ceil(Math.max(...q.map((p) => p[1])));
    const [A, B, C] = q;
    const area = (B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1]);
    if (Math.abs(area) < 1e-9) continue;
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const px = x + 0.5;
        const py = y + 0.5;
        const w1 = ((px - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (py - A[1])) / area;
        const w2 = ((B[0] - A[0]) * (py - A[1]) - (px - A[0]) * (B[1] - A[1])) / area;
        if (w1 >= 0 && w2 >= 0 && w1 + w2 <= 1) cells.add(`${x},${y}`);
      }
  }
  return cells;
}

/**
 * M1: the overlap (intersection over union) of the two outlines seen along each axis, each centred on its
 * box, at true scale: { "front/back", "left/right", "top/below" } (a view and its opposite have one outline).
 */
export function silhouettes(original, copy) {
  const { size } = boxOf(original);
  const per = 256 / Math.max(...size);
  const out = {};
  for (const [name, axis] of [["front/back", 0], ["left/right", 1], ["top/below", 2]]) {
    const a = outline(original, axis, per);
    const b = outline(copy, axis, per);
    let both = 0;
    for (const cell of a) if (b.has(cell)) both++;
    out[name] = Math.round((1000 * both) / (a.size + b.size - both || 1)) / 1000;
  }
  return out;
}

/** sRGB (0 to 255) to CIE Lab. */
function lab([r, g, b]) {
  const lin = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const X = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047;
  const Y = 0.2126 * R + 0.7152 * G + 0.0722 * B;
  const Z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}

/**
 * M4: the mean colour difference (CIE76 ΔE) between two pictures of one view, each smoothed first (the grain
 * left to M5), over the dots both models cover
 * (each drawn on its own background colour, which is left out), and the share of dots both cover.
 */
/**
 * A picture smoothed over (2r + 1)^2 dots, inside the thing only (its background dots neither taken nor
 * changed): colour without the grain of the texture, which is M5's to judge (rubric amendment 2026-10-14).
 */
function smoothed(p, r, isBg) {
  const { width, height, rgba } = p;
  const out = new Uint8Array(rgba);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (isBg(rgba, i)) continue;
      let s0 = 0;
      let s1 = 0;
      let s2 = 0;
      let n = 0;
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue;
          const j = (yy * width + xx) * 4;
          if (isBg(rgba, j)) continue;
          s0 += rgba[j];
          s1 += rgba[j + 1];
          s2 += rgba[j + 2];
          n++;
        }
      out[i] = s0 / n;
      out[i + 1] = s1 / n;
      out[i + 2] = s2 / n;
    }
  return { width, height, rgba: out };
}

/** How far each picture is smoothed before its colours are compared (at the judge's 384-dot pictures). */
export const COLOUR_SMOOTH = 3;

export function colourDifference(a0, b0, background = [58, 62, 70]) {
  let sum = 0;
  let n = 0;
  let either = 0;
  const isBg = (p, i) => Math.abs(p[i] - background[0]) < 3 && Math.abs(p[i + 1] - background[1]) < 3 && Math.abs(p[i + 2] - background[2]) < 3;
  const a = smoothed(a0, COLOUR_SMOOTH, isBg);
  const b = smoothed(b0, COLOUR_SMOOTH, isBg);
  for (let i = 0; i < a.rgba.length; i += 4) {
    const ia = !isBg(a.rgba, i);
    const ib = !isBg(b.rgba, i);
    if (ia || ib) either++;
    if (!(ia && ib)) continue;
    const p = lab([a.rgba[i], a.rgba[i + 1], a.rgba[i + 2]]);
    const q = lab([b.rgba[i], b.rgba[i + 1], b.rgba[i + 2]]);
    sum += Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
    n++;
  }
  return { deltaE: n ? Math.round((10 * sum) / n) / 10 : null, shared: either ? Math.round((1000 * n) / either) / 1000 : 0 };
}

/** M8: triangles in the pose, and the kit's check for GoldSrc. */
export function fitness(src) {
  const triangles = posed(src, POSE).tris.length;
  const report = smak.check(src, "goldsrc");
  return { triangles, errors: report.errors, warnings: report.warnings.length };
}
