// A character's first-frame stance fitted to pictures of the thing it is made from: the outline it has in each
// view, set against the thing's outline there, both at their true proportions (each scaled by its height in
// that view, and centred on each other). Only the swings an animator would use are tried: hips, knees, ankles,
// spine and arms forward and back, the upper arms a little out, nothing twisted. Outlines alone are ambiguous,
// and with every axis free a fit twists a spine and crosses legs to match them (research/held-reproduction-
// failures.md, section 3.2); within these limits the poses stay plausible.
//
// The search is coordinate descent at steps of 24, 12, 6 and 3 degrees, one swing at a time, each kept when it
// raises the mean overlap of the views.
//
//   fitPose(src, views, { joints }) -> { keys: { bone: { turn } }, before, after, tried }
import { posed } from "../render.mjs";
import { bones as bonesOf, readSequence } from "../mdl.mjs";
import * as A from "../animate.mjs";
import { boneIn } from "../biped.mjs";
import { viewAxes, foregroundOf, outlineBox } from "./project.mjs";

/** The swings tried, by bone (any Biped language), each about a model axis with its limits in degrees. */
const SWINGS = [
  ["Bip01 Spine1", "y", -30, 30],
  ["Bip01 L Thigh", "y", -45, 45],
  ["Bip01 R Thigh", "y", -45, 45],
  ["Bip01 L Calf", "y", -10, 60],
  ["Bip01 R Calf", "y", -10, 60],
  ["Bip01 L UpperArm", "y", -60, 60],
  ["Bip01 R UpperArm", "y", -60, 60],
  ["Bip01 L UpperArm", "x", -15, 15],
  ["Bip01 R UpperArm", "x", -15, 15],
  ["Bip01 L Forearm", "y", -90, 30],
  ["Bip01 R Forearm", "y", -90, 30],
];
const STEPS = [24, 12, 6, 3];
/** The grid the outlines are compared on: this many cells high, as wide as the proportions make it. */
const CELLS = 64;

/** A view's target: the thing's outline in its picture, as a grid of cells CELLS high, centred. */
function targetOf(view) {
  const { picture } = view;
  const area = view.area ?? [0, 0, picture.width, picture.height];
  const mask = foregroundOf(picture, area);
  // a strip's floor: a line drawn right across the area, which is no part of the thing
  if (view.ground)
    for (let y = area[1]; y < area[3]; y++) {
      let lit = 0;
      for (let x = area[0]; x < area[2]; x++) lit += mask[y * picture.width + x];
      if (lit > (area[2] - area[0]) * 0.8) for (let x = area[0]; x < area[2]; x++) mask[y * picture.width + x] = 0;
    }
  const rect = view.rect ?? outlineBox(mask, picture.width, area);
  if (!rect) return null;
  const [x0, y0, x1, y1] = rect;
  const k = CELLS / (y1 - y0);
  const width = Math.max(1, Math.round((x1 - x0) * k));
  const cells = new Uint8Array(width * CELLS);
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++)
      if (mask[y * picture.width + x]) cells[Math.min(CELLS - 1, Math.floor((y - y0) * k)) * width + Math.min(width - 1, Math.floor((x - x0) * k))] = 1;
  return { width, cells, axes: viewAxes(view.yaw, view.pitch) };
}

/**
 * Triangles' outline in a view: a grid of cells, 1 where a triangle covers a cell's middle. Unless `frame` is
 * given, CELLS high at the triangles' own proportions; `frame: { a0, h1, k, width, height }` lays them on a grid
 * of one's own (k cells a unit, a0 and h1 its left and top in the view's units), so that several sets share it.
 */
export function outlineOf(tris, axes, frame) {
  const { right, up } = axes;
  const dot = (p, a) => p[0] * a[0] + p[1] * a[1] + p[2] * a[2];
  const pts = tris.map((t) => t.map((p) => [dot(p, right), dot(p, up)]));
  let a0, h1, k, width, height;
  if (frame) ({ a0, h1, k, width, height } = frame);
  else {
    let [a1, h0] = [-Infinity, Infinity];
    [a0, h1] = [Infinity, -Infinity];
    for (const t of pts) for (const [a, h] of t) [a0, a1, h0, h1] = [Math.min(a0, a), Math.max(a1, a), Math.min(h0, h), Math.max(h1, h)];
    k = CELLS / (h1 - h0 || 1);
    width = Math.max(1, Math.round((a1 - a0) * k));
    height = CELLS;
  }
  const cells = new Uint8Array(width * height);
  for (const t of pts) {
    const q = t.map(([a, h]) => [(a - a0) * k, (h1 - h) * k]);
    const [A0, B, C] = q;
    const area2 = (B[0] - A0[0]) * (C[1] - A0[1]) - (C[0] - A0[0]) * (B[1] - A0[1]);
    if (Math.abs(area2) < 1e-9) continue;
    for (let y = Math.max(0, Math.floor(Math.min(A0[1], B[1], C[1]))); y <= Math.min(height - 1, Math.ceil(Math.max(A0[1], B[1], C[1]))); y++)
      for (let x = Math.max(0, Math.floor(Math.min(A0[0], B[0], C[0]))); x <= Math.min(width - 1, Math.ceil(Math.max(A0[0], B[0], C[0]))); x++) {
        const w1 = ((x + 0.5 - A0[0]) * (C[1] - A0[1]) - (C[0] - A0[0]) * (y + 0.5 - A0[1])) / area2;
        const w2 = ((B[0] - A0[0]) * (y + 0.5 - A0[1]) - (x + 0.5 - A0[0]) * (B[1] - A0[1])) / area2;
        if (w1 >= 0 && w2 >= 0 && 1 - w1 - w2 >= 0) cells[y * width + x] = 1;
      }
  }
  return { width, cells };
}

/** The share of two grids' cells that are in both, of those in either, the two centred across. */
function overlap(a, b) {
  const width = Math.max(a.width, b.width);
  const shift = (g) => Math.floor((width - g.width) / 2);
  const [sa, sb] = [shift(a), shift(b)];
  let both = 0;
  let either = 0;
  for (let y = 0; y < CELLS; y++)
    for (let x = 0; x < width; x++) {
      const inA = x - sa >= 0 && x - sa < a.width && a.cells[y * a.width + x - sa];
      const inB = x - sb >= 0 && x - sb < b.width && b.cells[y * b.width + x - sb];
      if (inA && inB) both++;
      if (inA || inB) either++;
    }
  return either ? both / either : 0;
}

/**
 * The stance of `src` (a character, its body in place) that best fits the outlines of `views` ({ picture, yaw,
 * pitch, area, rect }, as a spec's `project` gives them), as `pose.keys` takes it. `before` and `after` are the
 * mean overlaps; `tried` how many stances were drawn.
 */
export function fitPose(src, views, { swings = SWINGS } = {}) {
  const targets = views.map(targetOf).filter(Boolean);
  if (!targets.length) throw new Error("fitPose: no outline was found in any of the pictures: give each view its rect");
  const { keys, before, after, tried } = fitFrame(src, targets, { swings, seq: 0, frame: 0 });
  return { keys, before, after, tried };
}

/**
 * The stance of `src` that best fits a shape of its own, `tris` ([[p, p, p]] in model space: a generated body),
 * by its outlines from the front and the side (`yaws`). Its outline from the side settles the forward and back
 * swings that a front picture alone guesses (a guard's fit to its one picture swung a leg back it could not see,
 * research/generated-characters.md), and its bones are laid in the shape's limbs before each corner takes one.
 */
export function fitPoseToShape(src, tris, { yaws = [0, 90], swings = SWINGS } = {}) {
  const targets = yaws.map((yaw) => {
    const axes = viewAxes(yaw, 0);
    return { ...outlineOf(tris, axes), axes };
  });
  const { keys, before, after, tried } = fitFrame(src, targets, { swings, seq: 0, frame: 0 });
  return { keys, before, after, tried };
}

/** The swings of `swings` this skeleton has, by its own bones' names. */
function usableSwings(src, swings) {
  const names = bonesOf(src).map((b) => b.name);
  const usable = swings.map(([bone, axis, lo, hi]) => [boneIn(bone, names), axis, lo, hi]).filter(([bone]) => bone);
  // no swings asked: only the outline as it stands is scored
  if (!usable.length && swings.length) throw new Error(`fitPose: none of the Biped's limbs is in this skeleton (${names.slice(0, 8).join(", ")} ...)`);
  return usable;
}

/** One frame of an animation fitted to outlines: { angles (by swing), keys, before, after, tried }. */
function fitFrame(src, targets, { swings = SWINGS, seq = 0, frame = 0 } = {}) {
  const usable = usableSwings(src, swings);
  const rig = A.rigOf(src);
  const base = A.poseOfValues(rig, readSequence(src, seq).frames[frame]);
  const angles = usable.map(() => 0);
  let tried = 0;
  const score = (values) => {
    tried++;
    const keys = {};
    usable.forEach(([bone, axis], i) => {
      if (!values[i]) return;
      keys[bone] ??= { turn: {} };
      keys[bone].turn[axis] = values[i];
    });
    const matrices = A.matricesOf(rig, A.turnedInPose(rig, base, keys));
    const tris = posed(src, { pose: matrices }).tris.map((t) => t.c.map((c) => c.p));
    return { keys, mean: targets.reduce((s, t) => s + overlap(t, outlineOf(tris, t.axes)), 0) / targets.length };
  };
  const first = score(angles);
  let best = first;
  for (const step of STEPS) {
    let better = true;
    while (better) {
      better = false;
      for (let i = 0; i < usable.length; i++)
        for (const sign of [1, -1]) {
          const next = angles[i] + sign * step;
          if (next < usable[i][2] || next > usable[i][3]) continue;
          const tryAngles = angles.map((v, j) => (j === i ? next : v));
          const result = score(tryAngles);
          if (result.mean > best.mean + 1e-4) {
            best = result;
            angles[i] = next;
            better = true;
          }
        }
    }
  }
  return { angles, keys: best.keys, before: Math.round(first.mean * 1000) / 1000, after: Math.round(best.mean * 1000) / 1000, tried, score };
}

/**
 * An animation (`seq`, a run or a walk) fitted to a strip of pictures of the original doing it (`picture`, its
 * frames `count` in a grid `cols` across, each seen from `view`, the floor drawn as a line), as `strip` draws
 * them. The original's cycle may start at another point of the stride: of the strip's frames taken round by
 * each offset, the one whose outlines the animation already fits best is matched. Each matched frame is fitted
 * by the same swings as a pose; the swings found are spread over every frame of the animation, round the loop,
 * and written into it. `{ frames (the animation's new values, for replaceSequence), offset, before, after }`.
 */
export function fitMotion(src, { seq, picture, count = 8, cols = 4, view = "left", swings = SWINGS }) {
  const [yaw, pitch] = { left: [90, 0], right: [270, 0], front: [0, 0], back: [180, 0] }[view] ?? [90, 0];
  const cell = Math.floor(picture.width / cols);
  const rows = Math.ceil(count / cols);
  const cellH = Math.floor(picture.height / rows);
  const targets = Array.from({ length: count }, (_, i) => targetOf({ picture, yaw, pitch, ground: true, area: [(i % cols) * cell, Math.floor(i / cols) * cellH, (i % cols) * cell + cell, Math.floor(i / cols) * cellH + cellH] }));
  if (targets.some((t) => !t)) throw new Error("fitMotion: a frame of the strip shows nothing: give the strip's count and cols as it was drawn");
  const n = readSequence(src, seq).frames.length;
  const ours = Array.from({ length: count }, (_, i) => Math.round((i * (n - 1)) / Math.max(1, count - 1)));
  // the offset round the cycle at which the animation as it is fits the strip best
  let offset = 0;
  let bestStart = -1;
  for (let o = 0; o < count; o++) {
    let sum = 0;
    for (let i = 0; i < count; i++) sum += fitFrame(src, [targets[(i + o) % count]], { swings: [], seq, frame: ours[i] }).before;
    if (sum > bestStart) [bestStart, offset] = [sum, o];
  }
  const fits = ours.map((frame, i) => fitFrame(src, [targets[(i + offset) % count]], { swings, seq, frame }));
  const usable = usableSwings(src, swings);
  const rig = A.rigOf(src);
  const values = readSequence(src, seq).frames;
  const frames = values.map((frame, f) => {
    // where this frame falls between the fitted ones, round the loop
    const at = (f / Math.max(1, n - 1)) * (count - 1);
    const i = Math.min(count - 2, Math.floor(at));
    const t = at - i;
    const keys = {};
    usable.forEach(([bone, axis], k) => {
      const angle = fits[i].angles[k] * (1 - t) + fits[i + 1].angles[k] * t;
      if (!angle) return;
      keys[bone] ??= { turn: {} };
      keys[bone].turn[axis] = angle;
    });
    return A.valuesOf(rig, A.turnedInPose(rig, A.poseOfValues(rig, frame), keys));
  });
  const mean = (list, key) => Math.round((list.reduce((a, f) => a + f[key], 0) / list.length) * 1000) / 1000;
  return { frames, offset, before: mean(fits, "before"), after: mean(fits, "after") };
}

/**
 * How well a shape's outline fits pictures of the thing: for each view ({ picture, yaw, pitch, area, rect }, as
 * `project` takes them) the share of cells in both outlines of those in either, both at their true proportions,
 * or null where no outline is found in the picture. `tris`: triangles as lists of three points in model space.
 */
export function outlineFit(tris, views) {
  return views.map((view) => {
    const target = targetOf(view);
    return target ? Math.round(overlap(target, outlineOf(tris, target.axes)) * 1000) / 1000 : null;
  });
}
