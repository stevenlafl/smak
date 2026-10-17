// The brief leg's line-up test (examples/reproduce/brief.mjs detect), on any model: it beside gman, scientist and
// hassassin at one scale, four readings each in its own shuffled order, a fresh judge (Haiku unless
// SMAK_JUDGE_MODEL) asked which of the four was not made by Valve.
//
//   node research/generated-characters/detect.mjs <model.mdl> <out folder> [label]
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { png, withTextures } from "../../src/index.mjs";
import { render, tile, framing } from "../../src/render.mjs";
import { runAgent, JUDGE_MODEL } from "../../examples/reproduce/agents.mjs";

const GAME = "/media/Data1/SteamLibrary/steamapps/common/Half-Life/valve";
const [file, out, label = "generated"] = process.argv.slice(2);
const readModel = (f) => {
  let src = readFileSync(f);
  const side = f.replace(/\.mdl$/i, "t.mdl");
  if (src.length > 184 && !src.readInt32LE(180) && existsSync(side)) src = withTextures(src, readFileSync(side));
  return src;
};
const POSE = { seq: 0, frame: 0 };
const all = [...["gman", "scientist", "hassassin"].map((n) => readModel(join(GAME, `models/${n}.mdl`))), readFileSync(file)];
const frames = all.map((src) => framing(src, [POSE]));
const mid = frames.reduce((a, b) => (b.far > a.far ? b : a)).mid;
const within = { mid, far: Math.max(...frames.map((f) => Math.hypot(...f.mid.map((v, k) => v - mid[k])) + f.far)) };
const shots = all.map((src) => render(src, { ...POSE, view: "orbit", yaw: 35, pitch: 20, width: 320, height: 320, within }));
const results = [];
for (let draw = 0; draw < 4; draw++) {
  let seed = [...`${label}#${draw}`].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 13);
  const order = shots.map((shot, i) => ({ shot, i, k: (seed = (seed * 1103515245 + 12345) >>> 0) })).sort((a, b) => a.k - b.k);
  const dir = join(out, `detect-${draw}`);
  mkdirSync(dir, { recursive: true });
  const picture = tile(order.map((o) => o.shot), 4, order.map((_, i) => "ABCD"[i]));
  writeFileSync(join(dir, "lineup.png"), png(picture.width, picture.height, picture.rgba));
  const letter = "ABCD"[order.findIndex((o) => o.i === 3)];
  const r = await runAgent({ model: JUDGE_MODEL, read: dir, hours: 0.25, prompt: `${dir}/lineup.png shows four models, A to D, drawn by one camera at one scale. Three were made by Valve's artists for Half-Life; one was not. Which one was not? Look closely at all four. Reply with the one letter alone.` });
  const pick = ((r.answer ?? "").match(/\b([A-D])\b/) ?? [])[1] ?? null;
  results.push({ draw, letter, pick, answer: (r.answer ?? "").slice(0, 200) });
  console.log(`reading ${draw}: ours ${letter}, picked ${pick}`);
}
const caught = results.filter((r) => r.pick === r.letter).length;
console.log(`${label}: picked ${caught} of 4 (the harness calls 3 or more "told apart"); judge ${JUDGE_MODEL}`);
writeFileSync(join(out, "detect.json"), JSON.stringify({ label, judge: JUDGE_MODEL, results, caught }, null, 1));
