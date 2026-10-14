// How far a cheaper judge's scores stand from Opus's: legs already judged (their judge.json, by Opus) judged
// again on SMAK_JUDGE_MODEL (Haiku unless told), the two set side by side item by item. Nothing already judged
// is written over: the second judge's results go to <leg>/judge-<model>.json.
//
//   node examples/reproduce/calibrate.mjs [subject:leg ...]      models and maps of subjects.json (default: every
//                                                                 model's pictures leg, and their box decoys)
//   prints: per item, how often the two agree exactly and within 1; pass or fail agreement; whether every decoy
//   still fails; and writes calibration-<model>.md
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { HERE, SUBJECTS } from "./lib.mjs";
import { JUDGE_MODEL } from "./agents.mjs";
import { judgeModel, judgeMap } from "./judge.mjs";

const asked = process.argv.slice(2);
const legs = asked.length
  ? asked.map((a) => a.split(":"))
  : SUBJECTS.models.map((m) => [m.id, "pictures"]);

const pairs = [];
async function one(id, leg) {
  const model = SUBJECTS.models.find((m) => m.id === id);
  const map = SUBJECTS.maps.find((m) => m.id === id);
  const opusFile = join(HERE, id, leg, "judge.json");
  if (!existsSync(opusFile)) return console.log(`${id}:${leg}: no judge.json to set beside`);
  const opus = JSON.parse(readFileSync(opusFile, "utf8"));
  const built = join(HERE, id, leg, "built", model ? `${id}.mdl` : `${id}_copy.bsp`);
  if (!existsSync(built)) return console.log(`${id}:${leg}: nothing built`);
  const cheap = model ? await judgeModel(model, leg, built) : await judgeMap(map, leg, built);
  writeFileSync(join(HERE, id, leg, `judge-${JUDGE_MODEL}.json`), `${JSON.stringify(cheap, null, 1)}\n`);
  pairs.push({ name: `${id}:${leg}`, opus, cheap });
  console.log(`${id}:${leg}: opus ${opus.total} of ${opus.of} ${opus.passes ? "passes" : "fails"}; ${JUDGE_MODEL} ${cheap.error ?? `${cheap.total} of ${cheap.of} ${cheap.passes ? "passes" : "fails"}`}`);
}
// two at a time: a judge is short
const queue = [...legs];
await Promise.all([0, 1].map(async () => {
  while (queue.length) {
    const [id, leg] = queue.shift();
    try {
      await one(id, leg);
    } catch (error) {
      console.log(`${id}:${leg}: failed: ${error.message.split("\n")[0]}`);
    }
  }
}));

const items = [...new Set(pairs.flatMap((p) => Object.keys(p.opus.scores ?? {})))];
const lines = [`# ${JUDGE_MODEL} against Opus, on ${pairs.length} judged legs`, "", "| Item | Same | Within 1 | Opus higher | Lower |", "| --- | --- | --- | --- | --- |"];
for (const item of items) {
  const both = pairs.filter((p) => p.opus.scores?.[item] && p.cheap.scores?.[item]);
  const d = both.map((p) => p.cheap.scores[item].score - p.opus.scores[item].score);
  lines.push(`| ${item} | ${d.filter((v) => v === 0).length} of ${d.length} | ${d.filter((v) => Math.abs(v) <= 1).length} | ${d.filter((v) => v < 0).length} | ${d.filter((v) => v > 0).length} |`);
}
const agree = pairs.filter((p) => p.cheap.passes === p.opus.passes).length;
lines.push("", `Pass or fail the same on ${agree} of ${pairs.length}.`, "", "| Leg | Opus | " + JUDGE_MODEL + " |", "| --- | --- | --- |");
for (const p of pairs) lines.push(`| ${p.name} | ${p.opus.total} of ${p.opus.of} ${p.opus.passes ? "passes" : "fails"} | ${p.cheap.error ?? `${p.cheap.total} of ${p.cheap.of} ${p.cheap.passes ? "passes" : "fails"}`} |`);
writeFileSync(join(HERE, `calibration-${JUDGE_MODEL}.md`), `${lines.join("\n")}\n`);
console.log(lines.join("\n"));
