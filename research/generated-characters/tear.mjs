// How much a character tears in motion, measured as the model spec's check measures it (src/spec/model.mjs,
// TORN_IN_MOTION): each triangle's worst stretch over its runs and walks, every third frame, against the first
// frame of its first animation. Also counts the triangles whose corners sit on bones far apart in the skeleton
// (hand and thigh), which tear in any motion.
//
//   node research/generated-characters/tear.mjs <mdl> [body]
import { readFileSync } from "node:fs";
import { posed } from "../../src/render.mjs";
import { sequences, bones } from "../../src/index.mjs";

const [file, bodyArg] = process.argv.slice(2);
const mdl = readFileSync(file);
const body = Number(bodyArg ?? 0);
const list = bones(mdl);
const depthOf = (b) => (b < 0 ? -1 : 1 + depthOf(list[b].parent));
/** the number of joints between two bones along the tree */
const apart = (a, b) => {
  let [x, y, n] = [a, b, 0];
  while (x !== y) {
    if (depthOf(x) >= depthOf(y)) x = list[x].parent;
    else y = list[y].parent;
    n++;
  }
  return n;
};
const edgesOf = (tris) => tris.map((t) => [0, 1, 2].map((k) => Math.hypot(...t.c[k].p.map((v, i) => v - t.c[(k + 1) % 3].p[i]))));
const still = posed(mdl, { seq: 0, frame: 0, body }).tris;
const rest = edgesOf(still);
const worst = new Float64Array(rest.length);
const strides = sequences(mdl).map((q, n) => [q, n]).filter(([q]) => /run|walk/i.test(q.name) && !q.group).slice(0, 3);
for (const [q, n] of strides)
  for (let f = 0; f < q.frames; f += 3)
    edgesOf(posed(mdl, { seq: n, frame: f, body }).tris).forEach((t, i) => t.forEach((l, k) => (worst[i] = Math.max(worst[i], l / Math.max(0.3, rest[i][k])))));
const torn = [...worst].filter((w) => w > 3).length;
const far = still.filter((t) => Math.max(...t.c.flatMap((c, k) => t.c.map((d) => apart(c.bone, d.bone)))) >= 4).length;
const pairs = new Map();
still.forEach((t, i) => {
  if (worst[i] <= 3) return;
  const key = [...new Set(t.c.map((c) => list[c.bone].name.replace(/^Bip0\d /, "")))].sort().join(" + ");
  pairs.set(key, (pairs.get(key) ?? 0) + 1);
});
console.log(JSON.stringify({ triangles: still.length, torn, tornShare: Math.round((torn / still.length) * 1000) / 10, farApart: far, worstPairs: [...pairs].sort((a, b) => b[1] - a[1]).slice(0, 6) }));
