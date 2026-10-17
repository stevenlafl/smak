// A character's rig seen from the front: each triangle of its first frame filled in the colour of its first
// corner's bone (flat, no light), and the skeleton's joints and bones drawn over it in white. Where a limb's
// colour runs onto the trunk, or a bone lies outside the limb it should carry, the rig will tear.
//
//   node research/generated-characters/rig-plot.mjs <mdl> <out.png> [yaw]
import { readFileSync, writeFileSync } from "node:fs";
import { posed } from "../../src/render.mjs";
import { png, bones } from "../../src/index.mjs";

const [file, out, yawArg] = process.argv.slice(2);
const mdl = readFileSync(file);
const yaw = (Number(yawArg ?? 0) * Math.PI) / 180;
const list = bones(mdl);
const { tris, pose } = posed(mdl, { seq: 0, frame: 0 });
const W = 600, H = 800;
const rgba = Buffer.alloc(W * H * 4);
for (let i = 0; i < W * H; i++) rgba.set([30, 30, 34, 255], i * 4);
// seen from +x turned by yaw: screen x is the model's -y (its right on the picture's left), screen y its z
const across = (p) => -p[1] * Math.cos(yaw) + p[0] * Math.sin(yaw);
const depth = (p) => p[0] * Math.cos(yaw) + p[1] * Math.sin(yaw);
const all = tris.flatMap((t) => t.c.map((c) => c.p));
const [x0, x1] = [Math.min(...all.map(across)), Math.max(...all.map(across))];
const [z0, z1] = [Math.min(...all.map((p) => p[2])), Math.max(...all.map((p) => p[2]))];
const s = Math.min((W - 40) / (x1 - x0), (H - 40) / (z1 - z0));
const at = (p) => [20 + (across(p) - x0) * s, H - 20 - (p[2] - z0) * s];
const zbuf = new Float64Array(W * H).fill(-Infinity);
const colour = (b) => {
  const h = (b * 137.5) % 360, c = 0.75, x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const [r, g, bl] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [r, g, bl].map((v) => Math.round((v + 0.15) * 255));
};
for (const t of tris) {
  const [a, b, c] = t.c.map((k) => at(k.p));
  const d = t.c.reduce((sum, k) => sum + depth(k.p), 0) / 3;
  const col = colour(t.c[0].bone);
  const [mx0, mx1] = [Math.floor(Math.min(a[0], b[0], c[0])), Math.ceil(Math.max(a[0], b[0], c[0]))];
  const [my0, my1] = [Math.floor(Math.min(a[1], b[1], c[1])), Math.ceil(Math.max(a[1], b[1], c[1]))];
  const area = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
  if (!area) continue;
  for (let y = Math.max(0, my0); y <= Math.min(H - 1, my1); y++)
    for (let x = Math.max(0, mx0); x <= Math.min(W - 1, mx1); x++) {
      const w0 = ((b[0] - x) * (c[1] - y) - (c[0] - x) * (b[1] - y)) / area;
      const w1 = ((c[0] - x) * (a[1] - y) - (a[0] - x) * (c[1] - y)) / area;
      const w2 = 1 - w0 - w1;
      if (w0 < 0 || w1 < 0 || w2 < 0 || d < zbuf[y * W + x]) continue;
      zbuf[y * W + x] = d;
      rgba.set([...col, 255], (y * W + x) * 4);
    }
}
// the skeleton: each bone's joint and the line to its parent's, over everything
const joint = pose.map((m) => [m[0][3], m[1][3], m[2][3]]);
const dot = (x, y) => x >= 0 && y >= 0 && x < W && y < H && rgba.set([255, 255, 255, 255], (Math.round(y) * W + Math.round(x)) * 4);
list.forEach((b, i) => {
  if (b.parent < 0) return;
  const [p, q] = [at(joint[i]), at(joint[b.parent])];
  for (let k = 0; k <= 60; k++) dot(p[0] + ((q[0] - p[0]) * k) / 60, p[1] + ((q[1] - p[1]) * k) / 60);
});
writeFileSync(out, png(W, H, rgba));
