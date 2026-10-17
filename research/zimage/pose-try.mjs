// The OpenPose picture of a base in the generated stance, beside and over the grey guide of the same view:
//   node research/zimage/pose-try.mjs <game valve folder> <out folder> [base]
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import * as smak from "../../src/index.mjs";
import { aimedBase } from "../../src/spec/model.mjs";
import { openPosePicture } from "../../src/openpose.mjs";

const [game, out, base = "player/gordon/gordon.mdl"] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const src = aimedBase(base, { folder: out, games: [game] });
const size = 1024;
const guide = smak.render(src, { seq: 0, frame: 0, view: "front", width: size, height: size, background: [255, 255, 255] });
const pose = openPosePicture(src, { seq: 0, frame: 0, view: "front", width: size, height: size });
writeFileSync(join(out, "pose.png"), smak.png(size, size, pose.rgba));
const over = new Uint8Array(guide.rgba);
for (let i = 0; i < size * size; i++) if (pose.rgba[i * 4] + pose.rgba[i * 4 + 1] + pose.rgba[i * 4 + 2] > 0) over.set(pose.rgba.subarray(i * 4, i * 4 + 3), i * 4);
writeFileSync(join(out, "pose-over-guide.png"), smak.png(size, size, over));
console.log(JSON.stringify(pose.points.map((p) => p.map(Math.round))));
