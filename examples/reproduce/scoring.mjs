// The rubric's items and how a judge's answer becomes scores, one place for every test (rubric.md): the models',
// maps', assets', held models', houses' and the original mod's judges all settle here.
//
//   itemsOf(kind)                          -> { items, must }: the kind's table, with its extra items
//   parseAnswer(answer)                    -> the judge's JSON, or null
//   settle(kind, judged, caps)             -> { scores, total, of, passes }
//   lowered(caps, more)                    -> caps with `more` applied where it is lower
//   band(value, two, one, lowerIsBetter)   -> 2, 1 or 0 by the rubric's lines

/** The share of the most points an asset must reach, with every must-have item at 2 (rubric.md, "Passing"). */
export const PASS_SHARE = 0.85;

const M = ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8"];
const M_MUST = ["M1", "M2", "M3", "M4", "M6", "M8"];
/** Each kind's items and its must-haves (rubric.md's tables, and the extra items of its sections). */
const TABLES = {
  model: { items: M, must: M_MUST },
  weapon: { items: [...M, "W1"], must: [...M_MUST, "W1"] },
  character: { items: [...M, "C1"], must: [...M_MUST, "C1"] },
  // a character the game's code plays by its base's contract: a mod's player, the original mod's enemy
  contracted: { items: [...M, "C1", "C2"], must: [...M_MUST, "C1", "C2"] },
  map: { items: ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9"], must: ["P1", "P2", "P3", "P4", "P8", "P9"] },
  texture: { items: ["T1", "T2", "T3", "T4", "T5", "T6"], must: ["T1", "T2", "T3", "T5", "T6"] },
  sound: { items: ["S1", "S2", "S3", "S4", "S5"], must: ["S1", "S2", "S3", "S5"] },
  sprite: { items: ["R1", "R2", "R3", "R4", "R5"], must: ["R1", "R2", "R3", "R4", "R5"] },
  mod: { items: ["O1", "O2", "O3", "O4"], must: ["O1", "O2", "O3"] },
};

export function itemsOf(kind) {
  const table = TABLES[kind];
  if (!table) throw new Error(`no rubric table for ${kind}: one of ${Object.keys(TABLES).join(", ")}`);
  return table;
}

/** The JSON object in a judge's answer (the first { to the last }), or null when there is none. */
export function parseAnswer(answer) {
  if (typeof answer !== "string") return null;
  try {
    return JSON.parse(answer.slice(answer.indexOf("{"), answer.lastIndexOf("}") + 1));
  } catch {
    return null;
  }
}

/**
 * A judge's scores held to the measures' caps, and whether they pass. `judged` is the parsed answer ({ M1: {
 * score, reason, of? } }): an item missing scores 0. Each score keeps what the judge gave (`judge`), its cap (null
 * when nothing capped it) and, from several judges, the scores they gave (`judges`).
 */
export function settle(kind, judged, caps = {}) {
  const { items, must } = itemsOf(kind);
  const scores = {};
  for (const item of items) {
    const given = Math.max(0, Math.min(2, Number(judged?.[item]?.score ?? 0)));
    scores[item] = { judge: given, cap: caps[item] ?? null, score: Math.min(given, caps[item] ?? 2), reason: judged?.[item]?.reason ?? "", ...(judged?.[item]?.of ? { judges: judged[item].of } : {}) };
  }
  const total = items.reduce((t, i) => t + scores[i].score, 0);
  return { scores, total, of: 2 * items.length, passes: must.every((i) => scores[i].score === 2) && total >= PASS_SHARE * 2 * items.length };
}

/** Caps with more caps laid over them where those are lower (a line-up's pick over the measures'). */
export function lowered(caps, more) {
  const out = { ...caps };
  for (const [item, cap] of Object.entries(more)) if (cap < (out[item] ?? 2)) out[item] = cap;
  return out;
}

/** What a measurement allows an item: 2 at the rubric's line, 1 at the second line, else 0 (and 0 for none). */
export const band = (value, two, one, lowerIsBetter = false) =>
  value === null || value === undefined || Number.isNaN(value) ? 0 : lowerIsBetter ? (value <= two ? 2 : value <= one ? 1 : 0) : value >= two ? 2 : value >= one ? 1 : 0;

/** The end of every judge's prompt: score these items, each reason naming what is wrong and where (rubric.md, "Keeping the judge honest"), as JSON alone. */
export function askScores(items, { each } = {}) {
  const one = `{${items.map((i) => `"${i}": { "score": 0, "reason": "..." }`).join(", ")}}`;
  return `Score ${each ? `EVERY ${each}, items` : "every item,"} ${items.join(", ")}, 0, 1 or 2, each with a reason that names what is wrong and where (or what makes it right). Reply with JSON alone, of this form:
${each ? `{ "<${each} name>": ${one}, ... }` : one}`;
}

/**
 * What every judge of a model is told before it scores (rubric.md, amendment "the model judge's prompt", from
 * Steven's reviews: the headcrab's missing claws and the battery's 7-sided cylinder seen by neither judge, texture
 * faults charged to shape). `against`: what it is held to, "the original" or "what the brief asks".
 */
export const MODEL_GUIDE = (against = "the original") => `For M3, first list ${against === "the original" ? "the original's parts down to the small ones, as the close angles show them" : "the parts the brief asks for down to the small ones"}: claws, teeth, rivets, handles, tabs, the number of sides or facets of a round part. Then find each in the ${against === "the original" ? "reproduction" : "asset"}. A small part missing, or a round part with a different number of sides, makes M3 at most 1.

Tell paint from shape. A difference only in the painted picture (stripes in another place, softer detail, a smear, wear) is M4 or M5, not M1 or M3; a shape that is really different (a part missing, too big, the wrong form) is M1 or M3. Before you charge a shape item, check in the side and angle views that the outline itself differs, not just the paint on it.${against === "the original" ? "" : `

A part may be painted. Valve paints what lies on a surface (a filing cabinet's handles and labels, a tie, buttons, pockets, the folds of cloth) and models only what changes the outline. A part the brief asks for counts as there when it is painted and reads clearly at the size the game shows it; it is missing only when neither its shape nor its paint is there.`}`;

/**
 * Several judges' answers as one. "better": each item the higher score, with its reason (a model is read twice and
 * takes the better: a fault that is there shows in both, one a reading made up seldom does; rubric.md, "two
 * readings"). "middle": each item the middle score, with the scores given (--judges n of the assets' test). Answers
 * of one level ({ M1: { score } }) or two ({ name: { T1: { score } } }).
 */
export function combine(answers, how) {
  const good = answers.map(parseAnswer).filter(Boolean);
  if (good.length < 2) return good[0] ?? null;
  const pick = (list) => {
    const scored = list.filter((x) => x && Number.isFinite(Number(x.score))).sort((a, b) => Number(a.score) - Number(b.score));
    if (!scored.length) return undefined;
    // the better: the first reading's of the highest (as judges were read before this module)
    if (how === "better") return list.filter((x) => x && Number.isFinite(Number(x.score))).reduce((a, b) => (Number(b.score) > Number(a.score) ? b : a));
    return { ...scored[Math.floor((scored.length - 1) / 2)], of: scored.map((x) => Number(x.score)) };
  };
  const merge = (objects) => {
    const keys = [...new Set(objects.flatMap((o) => Object.keys(o ?? {})))];
    return Object.fromEntries(keys.map((k) => {
      const vals = objects.map((o) => o?.[k]);
      return [k, vals.some((v) => v && typeof v === "object" && "score" in v) ? pick(vals) : merge(vals)];
    }));
  };
  return merge(good);
}

/** DRY=1: the harness alone, every item a 1, to test the pictures and measures with no judge run. */
export const dryAnswer = (items) => JSON.stringify(Object.fromEntries(items.map((i) => [i, { score: 1, reason: "dry run" }])));
