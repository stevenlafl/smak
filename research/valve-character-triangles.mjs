// Half-Life's creatures and people by size: the triangles of their first body at the median, the third quartile
// and the most, in bands of the length of their box's diagonal. The pool is the line-up's (examples/reproduce/
// brief.mjs, ownOfKind("character"): its people and creatures). The numbers go into src/spec/model.mjs
// (CHARACTER_TRIANGLES); nothing of the game's is written.
//
//   node research/valve-character-triangles.mjs        (the game's folder: examples/reproduce/subjects.json, "game")
import * as smak from "../src/index.mjs";
import { ownOfKind } from "../examples/reproduce/brief.mjs";

const BANDS = [48, 96, Infinity];
const trianglesOf = (src) => smak.readMdl(src).bodyparts.reduce((n, b) => n + (b.models[0]?.meshes.reduce((m, x) => m + x.numtris, 0) ?? 0), 0);
const all = ownOfKind("character").map((p) => ({ file: p.file, diagonal: p.diagonal, tris: trianglesOf(p.src) }));
const at = (list, share) => list[Math.floor(share * (list.length - 1))];
let below = 0;
console.log(`${all.length} creatures and people`);
for (const under of BANDS) {
  const some = all.filter((p) => p.diagonal >= below && p.diagonal < under);
  const tris = some.map((p) => p.tris).sort((a, b) => a - b);
  console.log(`  { under: ${under === Infinity ? "Infinity" : under}, median: ${at(tris, 0.5)}, q3: ${at(tris, 0.75)}, most: ${tris.at(-1)} },   // ${tris.length}: ${some.map((p) => p.file.replace(/^models\/|\.mdl$/g, "")).join(", ")}`);
  below = under;
}
