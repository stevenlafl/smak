// The closed surface of a grid of cells, some inside a solid and some out: marching tetrahedra over the cells'
// middles (closed, and with no edge of more than two faces), each point put where the solid's own test says its
// boundary crosses between two cells, then smoothed a little (Taubin's, which does not shrink). What carve.mjs
// surfaces a visual hull with, and blob.mjs a body of blended pieces.
//
//   surfaceOf({ inside, dims, cellPoint, within, step, smooth })  ->  [[{ p }, x3]]
//
// `inside`: one byte a cell, 1 for the solid's (cell i, j, k at i + X * (j + Y * k)); `dims`: [X, Y, Z];
// `cellPoint(c)`: a cell's middle; `within(p)`: whether a point is in the solid (the edge is halved by it);
// `step`: a cell's size each way; `smooth`: rounds of smoothing.

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** The cube's six tetrahedra about its long diagonal (corner bits: x 1, y 2, z 4): the same in every cube. */
const TETRAHEDRA = [
  [0, 1, 3, 7],
  [0, 1, 5, 7],
  [0, 2, 3, 7],
  [0, 2, 6, 7],
  [0, 4, 5, 7],
  [0, 4, 6, 7],
];
/** How many halvings find where the boundary crosses an edge between two cells: to a 256th of a cell. */
const REFINE = 8;
/** How far smoothing may move a point from where the boundary put it, in cells. */
const SMOOTH_REACH = 0.25;

export function surfaceOf({ inside, dims: [X, Y, Z], cellPoint, within, step, smooth }) {
  const at = (i, j, k) => i + X * (j + Y * k);
  const pointOf = new Map();
  const points = [];
  const faces = [];
  const corner = (a, b) => {
    const key = a < b ? a * X * Y * Z + b : b * X * Y * Z + a;
    let v = pointOf.get(key);
    if (v === undefined) {
      // where the outlines cross the edge from the inside cell's middle to the outside one's, found by halving
      const pa = cellPoint(a);
      const pb = cellPoint(b);
      const along = (t) => [pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t, pa[2] + (pb[2] - pa[2]) * t];
      let t = 0.5;
      if (within(pa)) {
        let [t0, t1] = [0, 1];
        for (let k = 0; k < REFINE; k++) {
          const tm = (t0 + t1) / 2;
          if (within(along(tm))) t0 = tm;
          else t1 = tm;
        }
        t = (t0 + t1) / 2;
      }
      v = points.push(along(t)) - 1;
      pointOf.set(key, v);
    }
    return v;
  };
  // a triangle turned to face from the inside cells to the outside ones
  const face = (tri, inC, outC) => {
    const [a, b, c] = tri.map((v) => points[v]);
    const nrm = cross(sub(b, a), sub(c, a));
    faces.push(dot(nrm, sub(outC, inC)) >= 0 ? tri : [tri[0], tri[2], tri[1]]);
  };
  const cube = new Array(8);
  for (let k = 0; k < Z - 1; k++)
    for (let j = 0; j < Y - 1; j++)
      for (let i = 0; i < X - 1; i++) {
        let some = 0;
        for (let b = 0; b < 8; b++) {
          cube[b] = at(i + (b & 1), j + ((b >> 1) & 1), k + ((b >> 2) & 1));
          some += inside[cube[b]];
        }
        if (some === 0 || some === 8) continue;
        for (const tet of TETRAHEDRA) {
          const ins = tet.filter((b) => inside[cube[b]]).map((b) => cube[b]);
          const outs = tet.filter((b) => !inside[cube[b]]).map((b) => cube[b]);
          if (!ins.length || !outs.length) continue;
          const mean = (list) => list.map(cellPoint).reduce((s, p) => [s[0] + p[0] / list.length, s[1] + p[1] / list.length, s[2] + p[2] / list.length], [0, 0, 0]);
          const inC = mean(ins);
          const outC = mean(outs);
          if (ins.length === 1) face(outs.map((o) => corner(ins[0], o)), inC, outC);
          else if (outs.length === 1) face(ins.map((v) => corner(v, outs[0])), inC, outC);
          else {
            const [a, b] = ins;
            const [c, d] = outs;
            const q = [corner(a, c), corner(a, d), corner(b, d), corner(b, c)];
            face([q[0], q[1], q[2]], inC, outC);
            face([q[0], q[2], q[3]], inC, outC);
          }
        }
      }

  // smoothed a little (Taubin: a step in, a step out), each point kept within a quarter of a cell of where it
  // was found
  const near = points.map(() => new Set());
  for (const f of faces) for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (a !== b) near[f[a]].add(f[b]);
  const home = points.map((p) => [...p]);
  const lists = near.map((s) => [...s]);
  for (let round = 0; round < smooth; round++)
    for (const weight of [0.5, -0.53]) {
      const moved = points.map((p, v) => {
        const list = lists[v];
        if (!list.length) return p;
        const m = [0, 0, 0];
        for (const w of list) for (let a = 0; a < 3; a++) m[a] += points[w][a] / list.length;
        return p.map((x, a) => {
          const to = x + weight * (m[a] - x);
          return Math.min(home[v][a] + step[a] * SMOOTH_REACH, Math.max(home[v][a] - step[a] * SMOOTH_REACH, to));
        });
      });
      moved.forEach((p, v) => (points[v] = p));
    }
  return faces.map((f) => f.map((v) => ({ p: points[v] })));
}
