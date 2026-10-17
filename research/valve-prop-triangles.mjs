// Half-Life's props by size: the triangles of their first body at the median, the third quartile and the most,
// in bands of the length of their box's diagonal. The props are the line-up's pool (examples/reproduce/brief.mjs,
// ownOfKind("model")): what stands in the world, pickups too; no creature, no person, no gibs. The numbers go into
// src/spec/model.mjs (PROP_TRIANGLES); nothing of the game's is written.
//
//   node research/valve-prop-triangles.mjs        (the game's folder: examples/reproduce/subjects.json, "game")
import * as smak from "../src/index.mjs";
import { ownOfKind } from "../examples/reproduce/brief.mjs";

const BANDS = [16, 32, 64, 128, Infinity];
const trianglesOf = (src) => smak.readMdl(src).bodyparts.reduce((n, b) => n + (b.models[0]?.meshes.reduce((m, x) => m + x.numtris, 0) ?? 0), 0);
const props = ownOfKind("model").map((p) => ({ diagonal: p.diagonal, tris: trianglesOf(p.src) }));
const at = (list, share) => list[Math.floor(share * (list.length - 1))];
let below = 0;
console.log(`${props.length} props`);
for (const under of BANDS) {
  const tris = props.filter((p) => p.diagonal >= below && p.diagonal < under).map((p) => p.tris).sort((a, b) => a - b);
  console.log(`  { under: ${under === Infinity ? "Infinity" : under}, median: ${at(tris, 0.5)}, q3: ${at(tris, 0.75)}, most: ${tris.at(-1)} },   // ${tris.length} props`);
  below = under;
}
