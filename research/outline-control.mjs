// A control for the characters words leg's outline gate (M1): the game's own body of another model, set against an
// original as the judge measures a copy. If a real body of the game, in the best frame of an animation, cannot reach
// the gate, the gate measures the stance (where each arm and leg is) more than the body. 2026-10-16: Gordon's body
// in the best frame of his walk, against the scientist (whose first animation is a walk), reaches front 0.71, side
// 0.59 and above 0.56; against Barney standing, 0.84, 0.80 and 0.60. The gate gives 2 at 0.8 and 1 at 0.6 of the
// least of the three. Reads the game's files only; prints a line a frame.
//   node research/outline-control.mjs <original.mdl> <other.mdl> [animation] [--every n]
import { measureModel } from "../examples/reproduce/judge.mjs";
import { readModel, GAME } from "../examples/reproduce/lib.mjs";
import { readSequence, replaceSequence } from "../src/index.mjs";

const words = process.argv.slice(2);
const every = words.includes("--every") ? Number(words.splice(words.indexOf("--every"), 2)[1]) : 2;
const [original, other, seq] = words;
if (!other) throw new Error("node research/outline-control.mjs <original.mdl> <other.mdl> [animation] [--every n]");
const read = (name) => readModel(name.includes("/") && !name.startsWith("player/") ? name : `${GAME}/models/${name}`);
const orig = read(original);
const body = read(other);
const frames = seq ? readSequence(body, seq).frames : [null];
for (let f = 0; f < frames.length; f += seq ? every : 1) {
  const posed = frames[f] ? replaceSequence(body, 0, { frames: [frames[f]] }) : body;
  const { measured } = measureModel(orig, posed);
  const s = measured.silhouetteOverlap;
  console.log(`${other}${seq ? ` ${seq} frame ${f}` : " first frame"}: front ${s["front/back"]}, side ${s["left/right"]}, above ${s["top/below"]}; size off ${measured.size.offShare.join(", ")}`);
}
