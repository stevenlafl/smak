// Whether Valve's pictures are laid by flat projection: for each island of each texture (uvIslands), u and v
// fitted as u = a.p + b over its corners in the model at rest (least squares); the residual, in texels, of a
// picture laid by projecting the region from one side is near nothing. Also the way it was projected from: the
// direction the fit's (u, v) plane looks. Numbers only. node research/valve-uv/planar.mjs <valve> [model ...]
import { join } from "node:path";
import * as smak from "../../src/index.mjs";

const game = process.argv[2];
const names = process.argv.slice(3).length ? process.argv.slice(3) : ["barney", "scientist", "gman", "hgrunt", "zombie", "houndeye", "headcrab", "bullsquid", "v_shotgun", "v_9mmhandgun", "v_crowbar"];
const solve3 = (A, b) => { // 4x4 normal equations by Gauss
  const n = 4, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; [M[c], M[p]] = [M[p], M[c]]; if (Math.abs(M[c][c]) < 1e-12) return null; for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; } }
  return M.map((r, i) => r[n] / r[i]);
};
for (const name of names) {
  const src = smak.readStudio(join(game, "models", `${name}.mdl`)).src;
  const pose = process.env.POSE === "idle" ? { seq: 0, frame: 0 } : { seq: null };
  const isl = smak.uvIslands(src, pose);
  const posed = smak.posed(src, pose);
  // each island's corners: model-space point and pixel uv, from the posed triangles
  const corners = new Map();
  for (const t of posed.tris) {
    const id = isl.of(t);
    const list = corners.get(id) ?? corners.set(id, []).get(id);
    for (const c of t.c) list.push({ p: c.p, u: c.u, v: c.v });
  }
  let good = 0, all = 0, tris = 0, goodTris = 0;
  const ways = {};
  for (const [id, list] of corners) {
    if (list.length < 4) continue;
    const X = list.map((c) => [c.p[0], c.p[1], c.p[2], 1]);
    const AtA = [0, 1, 2, 3].map((i) => [0, 1, 2, 3].map((j) => X.reduce((s, r) => s + r[i] * r[j], 0)));
    const fit = (key) => solve3(AtA, [0, 1, 2, 3].map((i) => X.reduce((s, r, k) => s + r[i] * list[k][key], 0)));
    const a = fit("u"), b = fit("v");
    if (!a || !b) continue;
    const res = Math.sqrt(list.reduce((s, c, k) => s + (X[k].reduce((x, v, i) => x + v * a[i], 0) - c.u) ** 2 + (X[k].reduce((x, v, i) => x + v * b[i], 0) - c.v) ** 2, 0) / list.length);
    const n = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const big = n.map(Math.abs).indexOf(Math.max(...n.map(Math.abs)));
    const way = ["x", "y", "z"][big];
    const count = isl.list[id]?.tris ?? 0;
    all++; tris += count;
    if (res < 1.5) { good++; goodTris += count; ways[way] = (ways[way] ?? 0) + count; }
  }
  console.log(`${name}: ${good} of ${all} islands laid by flat projection (residual under 1.5 texels), ${Math.round((100 * goodTris) / tris)}% of the triangles; projected along ${JSON.stringify(ways)}`);
}
