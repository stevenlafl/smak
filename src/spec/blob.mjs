// A body of blended pieces: capsules along limbs and ellipsoids at joints, joined by a smooth minimum of their
// distances so that a shoulder runs into an arm and a coat into its hem with no seam or edge, as a sculpted body
// does. The parts a spec builds one by one meet at hard seams and read stiff (the reproduction test's characters,
// M6: "the coat is a stiff box"); a blob is one surface.
//
//   blob(pieces, { cells, blend, smooth, target })  ->  { tris: [[{ p }, x3]], pieceOf(p), report }
//   nearestPiece(pieces, p)                         ->  the piece whose own surface is nearest p
//
// A piece: { kind: "capsule", a, b, r: [ra, rb], bone } (a cone with round ends, from a to b, its radius going
// from ra to rb) or { kind: "ellipsoid", c, r: [rx, ry, rz], bone }, in model space. `blend`: how far, in units,
// two pieces melt into each other (0: a plain union, with a crease where they meet); `cells`: cells along the
// longest side of the whole; `target`: the triangles wanted. `pieceOf(p)` is the piece whose own surface is
// nearest a point: the bone a corner hangs on.
import { surfaceOf } from "./surface.mjs";
import { reduce } from "../qem.mjs";

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a) => Math.sqrt(dot(a, a));

/** A piece's signed distance at p: under 0 inside. */
export function distanceOf(piece, p) {
  if (piece.kind === "capsule") {
    const ab = sub(piece.b, piece.a);
    const t = Math.max(0, Math.min(1, dot(sub(p, piece.a), ab) / (dot(ab, ab) || 1e-12)));
    const q = [piece.a[0] + ab[0] * t, piece.a[1] + ab[1] * t, piece.a[2] + ab[2] * t];
    return len(sub(p, q)) - (piece.r[0] + (piece.r[1] - piece.r[0]) * t);
  }
  // an ellipsoid, by Quilez's bound: exact on its axes, close elsewhere
  const d = sub(p, piece.c);
  const k0 = len(d.map((v, i) => v / piece.r[i]));
  const k1 = len(d.map((v, i) => v / (piece.r[i] * piece.r[i])));
  return k1 > 0 ? (k0 * (k0 - 1)) / k1 : -Math.min(...piece.r);
}

/** The smooth minimum (polynomial): a and b melted together over `k` units. */
const smin = (a, b, k) => {
  if (k <= 0) return Math.min(a, b);
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};

/** The pieces' reach: their box, grown by `pad`. */
function boxOf(pieces, pad) {
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (const piece of pieces) {
    const ends = piece.kind === "capsule" ? [[piece.a, piece.r[0]], [piece.b, piece.r[1]]] : [[piece.c, Math.max(...piece.r)]];
    for (const [p, r] of ends)
      for (let k = 0; k < 3; k++) {
        lo[k] = Math.min(lo[k], p[k] - r - pad);
        hi[k] = Math.max(hi[k], p[k] + r + pad);
      }
  }
  return { lo, hi };
}

export function blob(pieces, { cells = 64, blend = 2, smooth = 4, target } = {}) {
  if (!pieces?.length) throw new Error("blob: no pieces");
  const field = (p) => {
    let d = Infinity;
    for (const piece of pieces) d = d === Infinity ? distanceOf(piece, p) : smin(d, distanceOf(piece, p), blend);
    return d;
  };
  const { lo, hi } = boxOf(pieces, blend + 1);
  const size = hi.map((v, k) => v - lo[k]);
  const h = Math.max(...size) / cells;
  const n = size.map((s) => Math.max(2, Math.ceil(s / h)));
  const step = size.map((s, k) => s / n[k]);
  const [X, Y, Z] = n;
  const cellPoint = (c) => {
    const i = c % X;
    const j = ((c - i) / X) % Y;
    const k = (c - i - X * j) / (X * Y);
    return [lo[0] + (i + 0.5) * step[0], lo[1] + (j + 0.5) * step[1], lo[2] + (k + 0.5) * step[2]];
  };
  const inside = new Uint8Array(X * Y * Z);
  for (let c = 0; c < inside.length; c++) inside[c] = field(cellPoint(c)) < 0 ? 1 : 0;
  let tris = surfaceOf({ inside, dims: [X, Y, Z], cellPoint, within: (p) => field(p) < 0, step, smooth });
  const surfaced = tris.length;
  let reduced = null;
  if (target && target < tris.length) {
    const r = reduce(tris, { target });
    tris = r.tris;
    reduced = r.report;
  }
  return { tris, pieceOf: (p) => nearestPiece(pieces, p), report: { cells: n, surfaced, triangles: tris.length, reduced } };
}

export function nearestPiece(pieces, p) {
  let best = pieces[0];
  let bestD = Infinity;
  for (const piece of pieces) {
    const d = distanceOf(piece, p);
    if (d < bestD) [best, bestD] = [piece, d];
  }
  return best;
}
