// The reproduction harness's scoring (examples/reproduce/scoring.mjs), which every judge of the test settles by:
// the rubric's tables, a judge's answer capped by the measures, the pass rule, and judges' answers combined.
import { test, sure } from "./helper.mjs";
import { itemsOf, parseAnswer, settle, lowered, combine, band, askScores } from "../examples/reproduce/scoring.mjs";

const all = (items, score) => Object.fromEntries(items.map((i) => [i, { score, reason: "r" }]));

test("scoring: an answer capped by its measures, passing only with every must-have at 2 and 85% of the points", () => {
  const { items } = itemsOf("model");
  const full = settle("model", all(items, 2), {});
  sure(full.passes && full.total === 16 && full.of === 16, JSON.stringify(full));
  const capped = settle("model", all(items, 2), { M1: 1 });
  sure(!capped.passes && capped.scores.M1.score === 1 && capped.scores.M1.judge === 2 && capped.scores.M1.cap === 1 && capped.scores.M2.cap === null, "a cap on a must-have fails it");
  const soft = settle("model", { ...all(items, 2), M5: { score: 0 }, M7: { score: 1 } }, {});
  sure(!soft.passes && soft.total === 13, "13 of 16 is under 85%");
  const near = settle("model", { ...all(items, 2), M5: { score: 1 } }, {});
  sure(near.passes && near.total === 15, "15 of 16 passes with the must-haves at 2");
  sure(settle("weapon", all(itemsOf("weapon").items, 2), { W1: 0 }).passes === false && itemsOf("contracted").must.includes("C2"), "the extra items are must-haves");
  sure(settle("map", null, {}).total === 0, "no answer scores 0");
});

test("scoring: caps laid over where lower, bands, the judge's answer and its instruction", () => {
  sure(JSON.stringify(lowered({ M2: 1 }, { M6: 2, M2: 2 })) === JSON.stringify({ M2: 1 }) && lowered({}, { M6: 1 }).M6 === 1, "only lower caps are laid over");
  sure(band(0.9, 0.8, 0.6) === 2 && band(0.7, 0.8, 0.6) === 1 && band(0.1, 0.8, 0.6) === 0 && band(null, 1, 2) === 0, "higher is better");
  sure(band(10, 15, 25, true) === 2 && band(20, 15, 25, true) === 1 && band(30, 15, 25, true) === 0, "lower is better");
  sure(parseAnswer('Here: {"M1": {"score": 2}} done').M1.score === 2 && parseAnswer("no json") === null, "the JSON in an answer");
  sure(/names what is wrong and where/.test(askScores(["M1"])) && /EVERY texture, items T1/.test(askScores(["T1"], { each: "texture" })), "one instruction, by item or each of a set");
});

test("scoring: two readings take the better, several judges the middle, at one or two levels", () => {
  const a = '{"M1": {"score": 1, "reason": "first"}, "M3": {"score": 2, "reason": "a"}}';
  const b = '{"M1": {"score": 2, "reason": "second"}, "M3": {"score": 2, "reason": "b"}}';
  const better = combine([a, b, "not json"], "better");
  sure(better.M1.reason === "second" && better.M3.reason === "a", JSON.stringify(better));
  const middle = combine(['{"x": {"T1": {"score": 0}}}', '{"x": {"T1": {"score": 2}}}', '{"x": {"T1": {"score": 1}}}'], "middle");
  sure(middle.x.T1.score === 1 && middle.x.T1.of.join() === "0,1,2", JSON.stringify(middle));
  sure(settle("texture", middle.x, {}).scores.T1.judges.join() === "0,1,2", "the judges' scores kept");
  sure(combine(["nope"], "better") === null && combine([a], "middle").M1.score === 1, "none, or one, as it is");
});
