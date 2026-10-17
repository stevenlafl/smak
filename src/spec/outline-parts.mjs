// What of each part a player sees: the model drawn from every side at the size the game shows it, and for each
// part the cells of the outline that it alone covers. A part that alone covers next to nothing from every side
// changes no outline; Valve keeps such a piece only as a few flat triangles (teeth, a tongue, the glasses' lenses
// and rim, a sole: 1 to 24 each over its scientist, Barney and grunt), and paints the rest: a tie, a belt,
// buttons, the folds of cloth (research/paint-or-geometry.md).
//
//   outlineShares(tris, { k })   -> { [part]: { most, view, tris } }: the most cells it alone covers in a view,
//                                   that view, and its triangles
import { outlineOf } from "./posefit.mjs";
import { viewAxes, VIEW_NAMES } from "./project.mjs";

/** Cells a unit: about the size the game shows a person across a room (72 units, some 150 pixels high). */
export const GAME_CELLS_A_UNIT = 2;
/** A part that alone covers no more cells than this in every view changes no outline a player sees. */
export const OUTLINE_CELLS_MOST = 4;
/** The most triangles Valve spends on a piece that changes no outline (its scientist's glasses, Barney's hand). */
export const UNSEEN_TRIS_MOST = 24;

/**
 * For each part, the most cells of the outline it alone covers in any of the six views, and that view. `tris`:
 * [{ p: [three points], part }], the model as built (its parts' ids).
 */
export function outlineShares(tris, { k = GAME_CELLS_A_UNIT } = {}) {
  const byPart = new Map();
  for (const t of tris) {
    if (!byPart.has(t.part)) byPart.set(t.part, []);
    byPart.get(t.part).push(t.p);
  }
  const shares = Object.fromEntries([...byPart].map(([part, list]) => [part, { most: 0, view: null, tris: list.length }]));
  for (const [view, [yaw, pitch]] of Object.entries(VIEW_NAMES)) {
    const axes = viewAxes(yaw, pitch);
    const dot = (p, a) => p[0] * a[0] + p[1] * a[1] + p[2] * a[2];
    let [a0, a1, h0, h1] = [Infinity, -Infinity, Infinity, -Infinity];
    for (const t of tris)
      for (const p of t.p) {
        const [a, h] = [dot(p, axes.right), dot(p, axes.up)];
        [a0, a1, h0, h1] = [Math.min(a0, a), Math.max(a1, a), Math.min(h0, h), Math.max(h1, h)];
      }
    const frame = { a0: a0 - 1, h1: h1 + 1, k, width: Math.ceil((a1 - a0 + 2) * k), height: Math.ceil((h1 - h0 + 2) * k) };
    // how many parts cover each cell, and each part's own cells
    const count = new Uint8Array(frame.width * frame.height);
    const own = new Map();
    for (const [part, list] of byPart) {
      const { cells } = outlineOf(list, axes, frame);
      own.set(part, cells);
      for (let i = 0; i < cells.length; i++) if (cells[i] && count[i] < 255) count[i]++;
    }
    for (const [part, cells] of own) {
      let alone = 0;
      for (let i = 0; i < cells.length; i++) if (cells[i] && count[i] === 1) alone++;
      if (alone > shares[part].most) shares[part] = { ...shares[part], most: alone, view };
    }
  }
  return shares;
}
