// Moved from the character-texturing research (research/character-texturing.md, E4; prototype charts.mjs).
// View charts: each face to the direction that sees it best (Potts-smoothed), its texture coordinates its
// orthographic projection along that direction (as a picture of that side lays it), charts split where two faces
// of one direction would share texels (the arm in front of the chest), then packed by a shelf packer at the one
// scale that fills the sheet. What a 1998 artist's planar mapping per region does, found automatically.
import { viewAxes } from "./project.mjs";

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a) => {
  const l = Math.hypot(...a) || 1;
  return a.map((v) => v / l);
};
const key = (p) => p.map((v) => Math.round(v * 1000)).join(",");

/**
 * tris: [[p, p, p]] (outward). dirs: [[yaw, pitch]]. Returns { charts: [{ dir, faces }], uv: per face [[u,v]x3]
 * in 0..1, scale (texels a unit), used (share of the sheet covered by chart boxes) }.
 */
export function viewCharts(tris, dirs, { size = [512, 512], pad = 2, potts = 0.5, sweeps = 8, mirror = false, weight = null } = {}) {
  const axes = dirs.map(([y, p]) => viewAxes(y, p));
  const n = tris.map((t) => unit(cross(sub(t[1], t[0]), sub(t[2], t[0]))));
  const area = tris.map((t) => Math.hypot(...cross(sub(t[1], t[0]), sub(t[2], t[0]))) / 2);
  // edges between faces: shared corner pairs
  const edgeMap = new Map();
  tris.forEach((t, f) => {
    for (let k = 0; k < 3; k++) {
      const a = key(t[k]);
      const b = key(t[(k + 1) % 3]);
      const e = a < b ? `${a}|${b}` : `${b}|${a}`;
      if (!edgeMap.has(e)) edgeMap.set(e, []);
      edgeMap.get(e).push([f, Math.hypot(...sub(t[k], t[(k + 1) % 3]))]);
    }
  });
  const nbr = tris.map(() => []);
  for (const list of edgeMap.values())
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) (nbr[list[i][0]].push([list[j][0], list[i][1]]), nbr[list[j][0]].push([list[i][0], list[i][1]]));
  // data term: (1 - cos) x area; forbid views more than ~84 degrees off
  const cost = (f, l) => {
    const c = dot(n[f], axes[l].back);
    return c < 0.1 ? 1e6 : (1 - c) * area[f];
  };
  let label = tris.map((_, f) => dirs.reduce((b, _, l) => (cost(f, l) < cost(f, b) ? l : b), 0));
  for (let s = 0; s < sweeps; s++)
    label = label.map((_, f) => {
      let best = label[f];
      let bestE = Infinity;
      for (let l = 0; l < dirs.length; l++) {
        let e = cost(f, l);
        for (const [g, len] of nbr[f]) if (label[g] !== l) e += potts * len * len;
        if (e < bestE) [best, bestE] = [l, e];
      }
      return best;
    });
  // project each face along its direction (right, up in units)
  const proj = tris.map((t, f) => t.map((p) => [dot(p, axes[label[f]].right), -dot(p, axes[label[f]].up)]));
  const depth = tris.map((t, f) => dot([0, 1, 2].map((k) => (t[0][k] + t[1][k] + t[2][k]) / 3), axes[label[f]].back));
  // charts: connected faces of one label; then split a chart where its faces overlap in projection, nearest first
  const seen = new Int32Array(tris.length).fill(-1);
  let charts = [];
  for (let f = 0; f < tris.length; f++) {
    if (seen[f] >= 0) continue;
    const faces = [];
    const stack = [f];
    seen[f] = charts.length;
    while (stack.length) {
      const g = stack.pop();
      faces.push(g);
      for (const [h] of nbr[g]) if (seen[h] < 0 && label[h] === label[f]) (seen[h] = charts.length, stack.push(h));
    }
    charts.push({ dir: label[f], faces });
  }
  // overlap split: rasterise at 1/4 unit, faces nearest the camera claim dots first; a face whose dots are
  // mostly claimed by another face of the chart goes to a new chart (as layers)
  const R = 4;
  const split = [];
  for (const chart of charts) {
    let rest = [...chart.faces].sort((a, b) => depth[b] - depth[a]);
    while (rest.length) {
      const claimed = new Map();
      const keep = [];
      const later = [];
      for (const f of rest) {
        const q = proj[f].map(([u, v]) => [u * R, v * R]);
        const dots = rasterDots(q);
        let over = 0;
        for (const d of dots) if (claimed.has(d)) over++;
        if (dots.length && over > dots.length * 0.3) later.push(f);
        else {
          keep.push(f);
          for (const d of dots) claimed.set(d, f);
        }
      }
      // keep only the connected pieces of what is kept (a removed face may cut a chart in two)
      split.push(...components(keep, nbr).map((faces) => ({ dir: chart.dir, faces })));
      rest = later;
    }
  }
  charts = split;
  // boxes of charts in units
  for (const c of charts) {
    const pts = c.faces.flatMap((f) => proj[f]);
    c.min = [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1]))];
    c.max = [Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
    c.w = c.max[0] - c.min[0];
    c.h = c.max[1] - c.min[1];
    c.k = weight ? weight(c) : 1; // a chart's texel weight (the head at 2)
  }
  // pack by shelves at the largest scale that fits
  const fits = (s) => {
    const order = [...charts].sort((a, b) => b.h * b.k - a.h * a.k);
    let x = 0;
    let y = 0;
    let row = 0;
    for (const c of order) {
      const w = c.w * s * c.k + 2 * pad;
      const h = c.h * s * c.k + 2 * pad;
      if (w > size[0]) return null;
      if (x + w > size[0]) (y += row, (x = 0), (row = 0));
      c.at = [x + pad, y + pad];
      x += w;
      row = Math.max(row, h);
    }
    return y + row <= size[1];
  };
  let lo = 0.01;
  let hi = 100;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (fits(mid)) lo = mid;
    else hi = mid;
  }
  fits(lo);
  const uv = new Array(tris.length);
  let boxArea = 0;
  for (const c of charts) {
    boxArea += c.w * lo * c.k * c.h * lo * c.k;
    for (const f of c.faces) uv[f] = proj[f].map(([u, v]) => [(c.at[0] + (u - c.min[0]) * lo * c.k) / size[0], (c.at[1] + (v - c.min[1]) * lo * c.k) / size[1]]);
  }
  return { charts, uv, label, scale: lo, used: boxArea / (size[0] * size[1]), small: charts.filter((c) => c.faces.length <= 3).length };
}

function rasterDots(q) {
  const [A, B, C] = q;
  const a2 = (B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1]);
  const out = [];
  if (Math.abs(a2) < 1e-12) return out;
  for (let y = Math.floor(Math.min(A[1], B[1], C[1])); y <= Math.ceil(Math.max(A[1], B[1], C[1])); y++)
    for (let x = Math.floor(Math.min(A[0], B[0], C[0])); x <= Math.ceil(Math.max(A[0], B[0], C[0])); x++) {
      const w1 = ((x + 0.5 - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (y + 0.5 - A[1])) / a2;
      const w2 = ((B[0] - A[0]) * (y + 0.5 - A[1]) - (x + 0.5 - A[0]) * (B[1] - A[1])) / a2;
      if (w1 >= 0 && w2 >= 0 && w1 + w2 <= 1) out.push(`${x},${y}`);
    }
  return out;
}

function components(faces, nbr) {
  const set = new Set(faces);
  const done = new Set();
  const out = [];
  for (const f of faces) {
    if (done.has(f)) continue;
    const comp = [];
    const stack = [f];
    done.add(f);
    while (stack.length) {
      const g = stack.pop();
      comp.push(g);
      for (const [h] of nbr[g]) if (set.has(h) && !done.has(h)) (done.add(h), stack.push(h));
    }
    out.push(comp);
  }
  return out;
}
