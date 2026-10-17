// How Valve lays its models' pictures: for each texture of a model, its size, its triangles, and how many of
// them face along the texture's own main way (front, back, up, down, a side): a texture painted as one flat
// picture of a region seen from one side has nearly all its triangles facing that way. Numbers only; nothing of
// the game's is written. node research/valve-uv/survey.mjs <the game's valve folder> [model ...]
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as smak from "../../src/index.mjs";

const game = process.argv[2];
const names = process.argv.slice(3).length ? process.argv.slice(3) : ["barney", "scientist", "gman", "hgrunt", "zombie", "houndeye", "headcrab", "bullsquid", "islave", "v_shotgun", "v_9mmhandgun", "v_crowbar"];
const AXES = [["front", [1, 0, 0]], ["back", [-1, 0, 0]], ["left", [0, 1, 0]], ["right", [0, -1, 0]], ["up", [0, 0, 1]], ["down", [0, 0, -1]]];
for (const name of names) {
  const src = smak.readStudio(join(game, "models", `${name}.mdl`)).src;
  const surf = smak.surface(src, { seq: 0, frame: 0 });
  const info = smak.readMdl(src);
  const byTex = new Map();
  for (const t of surf) {
    const e = byTex.get(t.tex) ?? byTex.set(t.tex, { n: [0, 0, 0], tris: [] }).get(t.tex);
    e.tris.push(t);
  }
  const rows = [];
  let one = 0;
  let all = 0;
  for (const [tex, e] of byTex) {
    const counts = AXES.map(([way, a]) => [way, e.tris.filter((t) => t.n[0] * a[0] + t.n[1] * a[1] + t.n[2] * a[2] > 0.5).length]);
    const [way, most] = counts.sort((a, b) => b[1] - a[1])[0];
    const t = info.textures.find((x) => x.name === tex);
    rows.push(`${tex} ${t?.width}x${t?.height} ${e.tris.length} tris, ${Math.round((100 * most) / e.tris.length)}% ${way}`);
    one += most;
    all += e.tris.length;
  }
  console.log(`${name}: ${byTex.size} textures, ${all} triangles; ${Math.round((100 * one) / all)}% face their texture's main way\n  ${rows.join("\n  ")}`);
}
