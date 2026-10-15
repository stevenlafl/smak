// An animation made of frames of one the model has (addSequenceFrom, `smak sequence-add --from`): a kneel out
// of a sit-and-stand played backwards, a held pose out of a frame and the next, as the First Warden's were made.
import { writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as smak from "../src/index.mjs";
import { test, sure, tmp, runSmak, runRefused, SMAK_CLI } from "./helper.mjs";

const bones = [
  { name: "root", parent: -1, pos: [0, 0, 0] },
  { name: "arm", parent: 0, pos: [0, 0, 10] },
];
/** Ten frames in which the arm turns a tenth of a turn a frame, and an event at frame 3. */
const rising = Array.from({ length: 10 }, (_, f) => [[0, 0, 0, 0, 0, 0], [0, 0, 10, 0, 0.1 * f, 0]]);
const tri = [
  { p: [0, 0, 10], uv: [0, 0], bone: 1 },
  { p: [4, 0, 10], uv: [1, 0], bone: 1 },
  { p: [4, 0, 14], uv: [1, 1], bone: 1 },
];
const texture = smak.indexed({ width: 8, height: 8, rgb: new Uint8Array(8 * 8 * 3).fill(128) }, "grey.bmp");
const src = smak.buildMdl({
  name: "arm.mdl",
  bones,
  bodyparts: [{ name: "body", models: [{ name: "arm", meshes: [{ tris: [tri], texture }] }] }],
  sequences: [
    { name: "idle", fps: 10, loops: true, frames: [rising[0], rising[0]] },
    { name: "rise", fps: 20, frames: rising, events: [{ frame: 3, event: 1004, options: "step.wav" }] },
  ],
});
const turnOf = (mdl, seq, frame) => smak.readSequence(mdl, seq).frames[frame][1][4];
const refuses = (run, pattern) => {
  try {
    run();
  } catch (e) {
    return pattern.test(e.message) ? true : `it said: ${e.message}`;
  }
  return "it did not refuse";
};

test("frameNumbers: ranges both ways, lists, and frames past the end refused", () => {
  sure(smak.frameNumbers("3-0", 10).join() === "3,2,1,0", "backwards");
  sure(smak.frameNumbers("7-9,9,8", 10).join() === "7,8,9,9,8", "a list of ranges");
  sure(smak.frameNumbers([5, 6, 5], 10).join() === "5,6,5", "a list");
  sure(refuses(() => smak.frameNumbers("8-10", 10), /10 is past the last frame, 9/), "past the end");
  sure(refuses(() => smak.frameNumbers("a-b", 10), /a frame, a range/), "no number");
});

test("addSequenceFrom: frames backwards at the source's rate, a held loop, events carried when asked", () => {
  const down = smak.addSequenceFrom(src, { from: "rise", frames: "9-4", name: "sink" });
  const made = smak.sequences(down).at(-1);
  sure(made.name === "sink" && made.frames === 6 && made.fps === 20 && !made.loops, JSON.stringify(made));
  for (let f = 0; f < 6; f++) sure(Math.abs(turnOf(down, "sink", f) - turnOf(src, "rise", 9 - f)) < 1e-3, `frame ${f}`);
  sure(smak.sequences(down).length === 3 && smak.sequences(down)[1].name === "rise", "the others keep their numbers");
  sure(!smak.events(down, "sink").length, "no events unless asked");
  const held = smak.addSequenceFrom(down, { from: 1, frames: "4,5,4", name: "held", fps: 2, loops: true, events: true });
  const last = smak.sequences(held).at(-1);
  sure(last.loops && last.fps === 2 && last.frames === 3, JSON.stringify(last));
  const back = smak.addSequenceFrom(src, { from: "rise", frames: "5-0", name: "back", events: true });
  const ev = smak.events(back, "back");
  sure(ev.length === 1 && ev[0].frame === 2 && ev[0].options === "step.wav", JSON.stringify(ev));
  sure(!smak.check(held).errors.length, smak.check(held).errors.join("; "));
  sure(refuses(() => smak.addSequenceFrom(src, { from: "fall", frames: "1-2", name: "x" }), /no animation fall/), "a source it has not");
  sure(refuses(() => smak.addSequenceFrom(src, { from: "rise", frames: "1-2" }), /name the new animation/), "no name");
});

test("smak sequence-add --from: the same from the command line, and what it lacks said", () => {
  const file = join(tmp, "arm.mdl");
  writeFileSync(file, src);
  const out = join(tmp, "arm-kneel.mdl");
  const said = runSmak("sequence-add", file, "--from", "rise", "--frames", "9-4", "--name", "kneel_down", "--fps", "25", "-o", out);
  sure(/kneel_down added as animation 2: 6 frames of rise \(9-4\) at 25 fps/.test(said), said);
  const made = readFileSync(out);
  sure(Math.abs(turnOf(made, "kneel_down", 0) - turnOf(src, "rise", 9)) < 1e-3, "frame 0 is rise's 9");
  const looped = runSmak("sequence-add", out, "--from", "rise", "--frames", "4,5,4", "--name", "kneel", "--loop", "-o", join(tmp, "arm-kneel2.mdl"));
  sure(/looping/.test(looped), looped);
  const noName = runRefused(SMAK_CLI, "sequence-add", file, "--from", "rise", "--frames", "1-2", "-o", out);
  sure(noName.code === 1 && /--name/.test(noName.err), noName.err);
  const past = runRefused(SMAK_CLI, "sequence-add", file, "--from", "rise", "--frames", "1-20", "--name", "x", "-o", out);
  sure(past.code === 1 && /20 is past the last frame/.test(past.err), past.err);
});
