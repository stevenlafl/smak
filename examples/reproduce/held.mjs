// The reproduction test for weapons, characters and creatures (rubric.md, "Weapons, characters and
// creatures"). A weapon is built into the game's own v_, p_ and w_ files, which the reproducer's server may
// fit into but never shows it (--hide); a character or creature goes on another model's skeleton, its own
// refused (--refuse). The judge scores M1 to M8 and W1 (in the hands) or C1 (in motion), with a line-up of
// the originals of its kind and a plain decoy that must fail.
//
//   node examples/reproduce/held.mjs inputs|describe|reproduce|judge [weapons|characters] [subject ...] [--again]
//
// held/<kind>/<id>/: input/ (Valve's pictures, out of git), words.md, <leg>/ (spec.json, answer.md, run.json,
// judge.json; built/ out of git).
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, copyFileSync, rmSync } from "node:fs";
import { join, basename } from "node:path";
import { execFileSync } from "node:child_process";
import { HERE, GAME, POSE, SIDES, ANGLES, readModel, boxOf, picturesOf, savePng, besides } from "./lib.mjs";
import { runAgent } from "./agents.mjs";
import { measureModel } from "./judge.mjs";
import { tile, render, framing, strip } from "../../src/render.mjs";
import { sequences } from "../../src/index.mjs";
import { buildModelSpec } from "../../src/spec/model.mjs";

const ROOT = join(HERE, "held");
const RUBRIC = readFileSync(join(HERE, "rubric.md"), "utf8");
const words = process.argv.slice(2);
const step = words.shift();
const again = words.includes("--again") && words.splice(words.indexOf("--again"), 1);
const KINDS = ["weapons", "characters"];
const kinds = KINDS.filter((k) => !words.some((w) => KINDS.includes(w)) || words.includes(k));
const named = words.filter((w) => !KINDS.includes(w));
const LEGS = ["pictures", "words"];

const SUBJECTS = {
  weapons: [
    { id: "crowbar", like: "crowbar", what: "a crowbar" },
    { id: "shotgun", like: "shotgun", what: "a pump shotgun" },
    { id: "9mmhandgun", like: "9mmhandgun", what: "a pistol" },
  ].map((s) => ({ ...s, files: ["v", "p", "w"].map((v) => `models/${v}_${s.like}.mdl`), file: `models/w_${s.like}.mdl` })),
  characters: [
    { id: "barney", file: "models/barney.mdl", motion: "run" },
    { id: "scientist", file: "models/scientist.mdl", motion: "run" },
    { id: "zombie", file: "models/zombie.mdl", motion: "walk" },
    { id: "houndeye", file: "models/houndeye.mdl", motion: "run" },
  ],
};
const LINEUP_EXTRAS = { weapons: ["models/w_357.mdl", "models/w_rpg.mdl", "models/w_crossbow.mdl", "models/w_9mmAR.mdl"], characters: ["models/gman.mdl", "models/hgrunt.mdl", "models/islave.mdl", "models/bullsquid.mdl"] };
const chosen = (kind) => SUBJECTS[kind].filter((s) => !named.length || named.includes(s.id));
const folderOf = (kind, id) => join(ROOT, kind, id);
const round = (v) => Math.round(v * 10) / 10;
const game = (file) => readModel(join(GAME, file));

/** A model's animation by a word in its name, or its first. */
function animation(src, pattern) {
  const list = sequences(src);
  const at = list.findIndex((s) => pattern.test(s.name));
  return at >= 0 ? at : 0;
}
const ATTACK = /attack1$|^attack|shoot$|^shoot|fire/i;

/** The first-person view of a v_ model: its first frame, and its attack as a strip. */
function firstPerson(src) {
  const still = render(src, { seq: 0, frame: 0, view: "first", width: 480, height: 360 });
  const attack = strip(src, { seq: animation(src, ATTACK), count: 8, cols: 4, view: "first", width: 240, height: 180 });
  return { still, attack };
}

// ── inputs ────────────────────────────────────────────────────────────────

function inputs(kind, s) {
  const out = join(folderOf(kind, s.id), "input");
  mkdirSync(out, { recursive: true });
  const main = game(s.file);
  const pictures = picturesOf(main, { size: 512 });
  const sides = pictures.filter((p) => SIDES.some(([n]) => n === p.name));
  savePng(join(out, "sides.png"), tile(sides.map((p) => p.picture), 3, sides.map((p) => p.name)));
  for (const p of pictures.filter((p) => ANGLES.some(([n]) => n === p.name))) savePng(join(out, `${p.name}.png`), p.picture);
  const { size } = boxOf(main);
  let facts = `${round(size[0])} units long, ${round(size[1])} wide, ${round(size[2])} high.`;
  if (kind === "weapons") {
    const v = firstPerson(game(s.files[0]));
    savePng(join(out, "first-person.png"), v.still);
    savePng(join(out, "first-person-attack.png"), v.attack);
    const p = game(s.files[1]);
    savePng(join(out, "in-hand.png"), render(p, { seq: 0, frame: 0, yaw: 35, pitch: 20, width: 512, height: 512 }));
    facts = `The world model (sides.png and the angles) is ${facts} first-person.png is the player's own view of it in the hands, first-person-attack.png its attack frame by frame, in-hand.png the model another player is seen holding.`;
  } else {
    savePng(join(out, "motion.png"), strip(main, { seq: animation(main, new RegExp(`^${s.motion}`)), count: 8, cols: 4, view: "side", ground: true, width: 256, height: 256 }));
    facts = `It is ${facts} motion.png shows it ${s.motion === "run" ? "running" : "walking"}, frame by frame from the side.`;
  }
  writeFileSync(join(out, "facts.txt"), `${facts}\n`);
  return out;
}

// ── the agents ────────────────────────────────────────────────────────────

const RULES = "Do not name the game, the file, the series or the company. Reply with the description alone, plain text.";
const DESCRIBE = (kind, dir) =>
  kind === "weapons"
    ? `You are looking at pictures of one weapon of a video game, in ${dir}: the model that lies in the world (sides.png, all to one scale, and four close angles), the player's first-person view of it in the hands (first-person.png, and first-person-attack.png frame by frame), and the model another player holds (in-hand.png); facts.txt gives its size. Someone who will never see them must make it again from your words, and will be judged against it in all three: describe its shape, every part with its size against the whole, its colours and materials, its markings and wear, how it sits in the hands and which end points away, and how it moves in its attack. At most 450 words.`
    : `You are looking at pictures of one character of a video game, in ${dir}: sides.png (six sides, one scale), four close angles, and motion.png (it moving, frame by frame); facts.txt gives its size. Someone who will never see them must make it again from your words: describe its build and proportions, its head and face, its clothes or skin, every part and its colours and materials, its markings, and how it moves. At most 450 words.`;

function reproducePrompt(kind, s, given) {
  const judged = "It will be judged side by side with the original, from the same cameras and at the same scale, to high standards, by someone who sees only the two sets of pictures.";
  if (kind === "weapons")
    return `Make this weapon for the GoldSrc engine with a model spec of kind "held" with weapon: { like: "${s.like}" } (guide { doc: "spec" }, "A weapon in place of a game's"): it is fitted into the game's own v_${s.like}.mdl, p_${s.like}.mdl and w_${s.like}.mdl, keeping their hands and animations, and replaces the weapon in them. Make it as close to the original as you can: its shape, size, parts, colours and markings, held the way the original is, in all three views. Name the spec ${s.id}.mdl. ${judged} Build until the build says OK.\n\n${given}`;
  return `Make this character for the GoldSrc engine with a model spec of kind "character" (guide { doc: "spec" }, "A character on a game's skeleton"), on a skeleton of the game's models (player/gordon/gordon.mdl, or another that suits it; its own is not available), keeping that skeleton's animations. Make it as close to the original as you can: its build and proportions, every part, its colours and markings, standing as the original stands in the first frame of its first animation. Name it ${s.id}.mdl. ${judged} Build until the build says OK.\n\n${given}`;
}

async function describe(kind, s) {
  const dir = join(folderOf(kind, s.id), "input");
  const r = await runAgent({ prompt: `${DESCRIBE(kind, dir)}\n${RULES}`, read: dir, hours: 0.5 });
  writeFileSync(join(folderOf(kind, s.id), "words.md"), `${r.answer.trim()}\n`);
  return `${kind}/${s.id}: ${r.answer.split(/\s+/).length} words`;
}

async function reproduce(kind, s, leg) {
  const base = folderOf(kind, s.id);
  const out = join(base, leg);
  if (existsSync(join(out, "run.json")) && !again) return `${kind}/${s.id}:${leg}: done before`;
  const input = join(base, "input");
  const files = {};
  let given;
  if (leg === "pictures") {
    for (const f of readdirSync(input)) files[`pictures/${f}`] = join(input, f);
    given = `The original, in pictures: every file of ${input} (also in the server's work folder under pictures/): sides.png (front, left, back, right, top, below, each a 512-dot square of the sheet in that order, three across) and four close angles with no perspective, ${ANGLES.map(([n, yaw, pitch]) => `${n}.png (yaw ${yaw}, pitch ${pitch})`).join(", ")}. ${readFileSync(join(input, "facts.txt"), "utf8")}`;
  } else given = `The original, as someone who has seen it describes it:\n\n${readFileSync(join(base, "words.md"), "utf8")}`;
  const hidden = kind === "weapons" ? s.files : [s.file];
  const kit = execFileSync("git", ["-C", HERE, "rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
  const r = await runAgent({ prompt: reproducePrompt(kind, s, given), read: leg === "pictures" ? input : null, server: { wads: true, hide: hidden, refuse: hidden }, files, hours: 1.5 });
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "answer.md"), `${r.answer.trim()}\n`);
  const all = [];
  const look = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) look(p);
      else all.push({ p, name: e.name, at: statSync(p).mtimeMs });
    }
  };
  look(r.work);
  const newest = (test) => all.filter((f) => test(f.name)).sort((a, b) => b.at - a.at)[0];
  const spec = newest((n) => n.endsWith(".spec.json"));
  if (spec) writeFileSync(join(out, "spec.json"), readFileSync(spec.p));
  const built = join(out, "built");
  rmSync(built, { recursive: true, force: true });
  mkdirSync(built, { recursive: true });
  const kept = [];
  for (const want of kind === "weapons" ? s.files.map((f) => basename(f)) : [`${s.id}.mdl`]) {
    const f = newest((n) => n === want);
    if (f) {
      copyFileSync(f.p, join(built, want));
      kept.push(want);
    }
  }
  writeFileSync(join(out, "run.json"), `${JSON.stringify({ kit, seconds: r.seconds, turns: r.turns, cost: r.cost, error: r.error, built: kept }, null, 1)}\n`);
  return `${kind}/${s.id}:${leg}: ${r.seconds} s, built ${kept.join(", ") || "nothing"}`;
}

// ── the judge ─────────────────────────────────────────────────────────────

const ITEMS = ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8"];
const MUST = ["M1", "M2", "M3", "M4", "M6", "M8"];

async function lineup(kind, s, copy, dir) {
  const files = [...SUBJECTS[kind].map((x) => x.file), ...LINEUP_EXTRAS[kind]].filter((f) => existsSync(join(GAME, f)));
  let seed = [...s.id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const order = files.map((f) => ({ f, k: (seed = (seed * 1103515245 + 12345) >>> 0) })).sort((a, b) => a.k - b.k).map((x) => x.f);
  const letters = "ABCDEFGHIJKLMNOP";
  const shots = order.map((f) => {
    const src = game(f);
    return render(src, { ...POSE, view: "orbit", within: framing(src, [POSE]), yaw: 35, pitch: 20, width: 256, height: 256 });
  });
  mkdirSync(join(dir, "lineup"), { recursive: true });
  savePng(join(dir, "lineup", "lineup.png"), tile(shots, 4, order.map((_, i) => letters[i])));
  savePng(join(dir, "lineup", "mystery.png"), render(copy, { ...POSE, view: "orbit", within: framing(copy, [POSE]), yaw: 35, pitch: 20, width: 384, height: 384 }));
  const r = await runAgent({ read: join(dir, "lineup"), hours: 0.25, prompt: `${dir}/lineup/mystery.png shows a model made to copy one of the game models in ${dir}/lineup/lineup.png (labelled ${letters.slice(0, order.length).split("").join(", ")}). Which one is it a copy of? Reply with the one letter alone.` });
  const picked = (r.answer.match(/\b([A-P])\b/) ?? [])[1] ?? null;
  return { picked, right: letters[order.indexOf(s.file)] };
}

async function judgeOne(kind, s, leg, built, { decoy } = {}) {
  const dir = join(folderOf(kind, s.id), "judge", decoy ? "decoy" : leg);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const original = game(s.file);
  const copy = readModel(join(built, basename(s.file).replace(/^.*\//, "")));
  const { measured, caps, pictures } = measureModel(original, copy);
  // the pictures: the sides and angles of the measured model, original beside copy
  const pairs = pictures.original.map((p, i) => ({ name: p.name, pair: besides([p.picture, pictures.reproduction[i].picture]) }));
  savePng(join(dir, "compare-sides.png"), tile(pairs.filter((p) => SIDES.some(([n]) => n === p.name)).map((p) => p.pair), 2, pairs.filter((p) => SIDES.some(([n]) => n === p.name)).map((p) => `${p.name}: ORIGINAL | REPRODUCTION`)));
  savePng(join(dir, "compare-angles.png"), tile(pairs.filter((p) => ANGLES.some(([n]) => n === p.name)).map((p) => p.pair), 2, pairs.filter((p) => ANGLES.some(([n]) => n === p.name)).map((p) => `${p.name}: ORIGINAL | REPRODUCTION`)));
  let extra;
  let item;
  if (kind === "weapons") {
    const vo = firstPerson(game(s.files[0]));
    const vc = firstPerson(readModel(join(built, basename(s.files[0]))));
    savePng(join(dir, "first-person.png"), besides([vo.still, vc.still]));
    savePng(join(dir, "first-person-attack.png"), tile([vo.attack, vc.attack], 1, ["ORIGINAL attack", "REPRODUCTION attack"]));
    const po = game(s.files[1]);
    const pc = readModel(join(built, basename(s.files[1])));
    savePng(join(dir, "in-hand.png"), besides([render(po, { seq: 0, frame: 0, yaw: 35, pitch: 20, width: 384, height: 384 }), render(pc, { seq: 0, frame: 0, yaw: 35, pitch: 20, width: 384, height: 384 })]));
    extra = `${dir}/first-person.png (the player's view, ORIGINAL left, REPRODUCTION right), ${dir}/first-person-attack.png (the attack frame by frame, the ORIGINAL's above) and ${dir}/in-hand.png (the model another player holds, ORIGINAL left). The world model (w_) is the one measured and drawn in compare-sides.png and compare-angles.png.`;
    item = "W1";
  } else {
    const motionOf = (src) => strip(src, { seq: animation(src, new RegExp(`^${s.motion}`)), count: 8, cols: 4, view: "side", ground: true, width: 192, height: 192 });
    savePng(join(dir, "motion.png"), tile([motionOf(original), motionOf(copy)], 1, [`ORIGINAL ${s.motion}`, `REPRODUCTION ${s.motion}`]));
    extra = `${dir}/motion.png (the ORIGINAL ${s.motion === "run" ? "running" : "walking"} above, the REPRODUCTION below, frame by frame from the side).`;
    item = "C1";
  }
  const line = await lineup(kind, s, copy, dir);
  const items = [...ITEMS, item];
  const r = await runAgent({
    read: dir,
    hours: 0.5,
    prompt: `You are an independent judge. A reproduction was made of a game ${kind === "weapons" ? "weapon" : "character"} by someone who could not open the original's files. Judge it strictly by the rubric below (the "Models" table, the "Weapons, characters and creatures" section, "Passing" and "Keeping the judge honest"). A measured item may score lower than its measurement allows, never higher.\n\nThe pictures: ${dir}/compare-sides.png and ${dir}/compare-angles.png (each view twice, the same camera and scale, ORIGINAL left, REPRODUCTION right), ${extra} Look at every picture closely.\n\nThe measurements:\n${JSON.stringify(measured, null, 1)}\n\nFor M6, judge only whether a player would take it for the original; the line-up is run separately.\n\nScore every item, ${items.join(", ")}, 0, 1 or 2, each with a reason. Reply with JSON alone: {${items.map((i) => `"${i}": { "score": 0, "reason": "..." }`).join(", ")}}\n\nTHE RUBRIC\n${RUBRIC}`,
  });
  let judged = null;
  try {
    judged = JSON.parse(r.answer.slice(r.answer.indexOf("{"), r.answer.lastIndexOf("}") + 1));
  } catch {}
  if (!judged) return { kind, subject: s.id, leg, error: "the judge's answer was not JSON" };
  const capped = { ...caps, M6: Math.min(caps.M6 ?? 2, line.picked === line.right ? 2 : 1) };
  const scores = {};
  for (const i of items) {
    const given = Math.max(0, Math.min(2, Number(judged[i]?.score ?? 0)));
    scores[i] = { judge: given, cap: capped[i] ?? null, score: Math.min(given, capped[i] ?? 2), reason: judged[i]?.reason ?? "" };
  }
  const total = items.reduce((t, i) => t + scores[i].score, 0);
  const passes = [...MUST, item].every((i) => scores[i].score === 2) && total >= 0.85 * 2 * items.length;
  return { kind, subject: s.id, leg: decoy ? "decoy: box" : leg, measured, caps: capped, lineup: line, scores, total, of: 2 * items.length, passes };
}

/** A plain box of the original's size, for a character; for a weapon a box in each of its three files' place. */
function decoyOf(kind, s) {
  const dir = join(folderOf(kind, s.id), "judge", "decoy-built");
  mkdirSync(dir, { recursive: true });
  const { size } = boxOf(game(s.file));
  const { mdl } = buildModelSpec({ spec: "smak.model/1", name: "decoy.mdl", kind: "prop", parts: [{ id: "box", kind: "box", size: size.map((v) => Math.max(v, 0.5)), material: { base: "paint", tone: [0.5, 0.5, 0.5] } }] });
  if (kind === "weapons") {
    // the weapon's place in v_ and p_ taken by the same box: the game's files with the box swapped in
    const spec = { spec: "smak.model/1", name: "decoy.mdl", kind: "held", parts: [{ id: "box", kind: "box", size: size.map((v) => Math.max(v, 0.5)), material: { base: "paint", tone: [0.5, 0.5, 0.5] } }], weapon: { like: s.like } };
    const built = buildModelSpec(spec, { games: [GAME] });
    for (const f of built.files ?? []) if (f.mdl) writeFileSync(join(dir, f.name), f.mdl);
  } else writeFileSync(join(dir, basename(s.file)), mdl);
  return dir;
}

// ── the steps ─────────────────────────────────────────────────────────────

async function pool(jobs, atOnce = 4) {
  const queue = [...jobs];
  await Promise.all(
    Array.from({ length: Math.min(atOnce, queue.length) }, async () => {
      while (queue.length) {
        try {
          console.log(await queue.shift()());
        } catch (error) {
          console.log(`failed: ${error.message.split("\n")[0]}`);
        }
      }
    }),
  );
}

if (step === "inputs") for (const kind of kinds) for (const s of chosen(kind)) console.log(`${kind}/${s.id}: ${inputs(kind, s)}`);
else if (step === "describe") await pool(kinds.flatMap((k) => chosen(k).filter((s) => again || !existsSync(join(folderOf(k, s.id), "words.md"))).map((s) => () => describe(k, s))), 6);
else if (step === "reproduce") await pool(kinds.flatMap((k) => chosen(k).flatMap((s) => LEGS.map((leg) => () => reproduce(k, s, leg)))), 4);
else if (step === "judge") {
  const jobs = [];
  for (const k of kinds)
    for (const s of chosen(k)) {
      for (const leg of LEGS) {
        const built = join(folderOf(k, s.id), leg, "built");
        if (existsSync(join(built, basename(s.file))))
          jobs.push(() => judgeOne(k, s, leg, built).then((r) => (writeFileSync(join(folderOf(k, s.id), leg, "judge.json"), `${JSON.stringify(r, null, 1)}\n`), `${k}/${s.id}:${leg}: ${r.error ?? `${r.total} of ${r.of}, ${r.passes ? "PASSES" : "fails"}`}`)));
      }
      jobs.push(() => judgeOne(k, s, "decoy", decoyOf(k, s), { decoy: true }).then((r) => (writeFileSync(join(folderOf(k, s.id), "judge", "decoy.json"), `${JSON.stringify(r, null, 1)}\n`), `${k}/${s.id} decoy: ${r.error ?? `${r.total} of ${r.of}, ${r.passes ? "PASSES (the judge is lenient)" : "fails, as it must"}`}`)));
    }
  await pool(jobs, 4);
} else console.log("node examples/reproduce/held.mjs inputs|describe|reproduce|judge [weapons|characters] [subject ...] [--again]");
