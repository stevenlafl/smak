// The reproduction test for weapons, characters and creatures (rubric.md, "Weapons, characters and
// creatures"). A weapon is built into the game's own v_, p_ and w_ files, which the reproducer's server may
// fit into but never shows it (--hide); a character or creature goes on another model's skeleton, its own
// refused (--refuse). The judge scores M1 to M8 and W1 (in the hands) or C1 (in motion), with a line-up of
// the originals of its kind and a plain decoy that must fail.
//
//   node examples/reproduce/held.mjs inputs|describe|reproduce|judge [weapons|characters] [subject ...] [--again] [--form]
//
// held/<kind>/<id>/: input/ (Valve's pictures, out of git), words.md, <leg>/ (spec.json, answer.md, run.json,
// judge.json; built/ out of git).
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, copyFileSync, rmSync } from "node:fs";
import { join, basename } from "node:path";
import { HERE, GAME, SIDES, ANGLES, readModel, boxOf, picturesOf, savePng, besides, notTheOriginal, kitCommit, keepRound, filesOf } from "./lib.mjs";
import { runAgent, runJudge, failedByMeasure } from "./agents.mjs";
import { measureModel, lineup } from "./judge.mjs";
import { itemsOf, settle, lowered, combine, askScores, MODEL_GUIDE } from "./scoring.mjs";
import { BRIEFS, briefPrompt, ownOfKind, judgeModelAgainstBrief, weaponSizeIn } from "./brief.mjs";
import { tile, render, strip } from "../../src/render.mjs";
import { sequences } from "../../src/index.mjs";
import { contractOf, compareContract } from "../../src/contract.mjs";
import { buildModelSpec } from "../../src/spec/model.mjs";

const ROOT = join(HERE, "held");
const RUBRIC = readFileSync(join(HERE, "rubric.md"), "utf8");
const words = process.argv.slice(2);
const step = words.shift();
const again = words.includes("--again") && words.splice(words.indexOf("--again"), 1);
// --form: the describer fills in a form, not free prose (FORM_CHARACTER below), an experiment
const FORM = words.includes("--form") && words.splice(words.indexOf("--form"), 1);
// --generators <folder>: the words leg's server offers the tool generate (generators/README.md), an experiment
const GENERATORS = words.includes("--generators") ? words.splice(words.indexOf("--generators"), 2)[1] : null;
const KINDS = ["weapons", "characters", "players"];
/** The Specialists, a mod whose code uses its player models' bones and animations by name and number. */
const TS = join(GAME, "..", "ts");
const TS_BASE = "player/gordon/gordon.mdl";
const kinds = KINDS.filter((k) => !words.some((w) => KINDS.includes(w)) || words.includes(k));
const named = words.filter((w) => !KINDS.includes(w));
const LEGS = ["pictures", "brief"];

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
  players: [
    { id: "seal", file: "models/player/seal/seal.mdl", motion: "run", stunt: "dive_f", root: TS, base: TS_BASE },
    { id: "merc", file: "models/player/merc/merc.mdl", motion: "run", stunt: "dive_f", root: TS, base: TS_BASE },
  ],
};
const LINEUP_EXTRAS = { weapons: ["models/w_357.mdl", "models/w_rpg.mdl", "models/w_crossbow.mdl", "models/w_9mmAR.mdl"], characters: ["models/gman.mdl", "models/hgrunt.mdl", "models/islave.mdl", "models/bullsquid.mdl"], players: ["models/player/gordon/gordon.mdl", "models/player/agent/agent.mdl", "models/player/castor/castor.mdl", "models/player/terror/terror.mdl", "models/player/terrorist/terrorist.mdl"] };
const chosen = (kind) => SUBJECTS[kind].filter((s) => !named.length || named.includes(s.id));
const folderOf = (kind, id) => join(ROOT, kind, id);
const round = (v) => Math.round(v * 10) / 10;
const game = (file, root = GAME) => readModel(join(root, file));
/** A subject's own game folder: Half-Life's, or a mod's. */
const rootOf = (s) => s.root ?? GAME;

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
  const main = game(s.file, rootOf(s));
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
    if (s.stunt) {
      savePng(join(out, "stunt.png"), strip(main, { seq: animation(main, new RegExp(`^${s.stunt}`)), count: 8, cols: 4, view: "side", ground: true, width: 256, height: 256 }));
      facts += " stunt.png shows it diving forward, frame by frame from the side.";
    }
  }
  writeFileSync(join(out, "facts.txt"), `${facts}\n`);
  return out;
}

// ── the agents ────────────────────────────────────────────────────────────

const RULES = "Do not name the game, the file, the series or the company. Reply with the description alone, plain text.";
const DESCRIBE = (kind, dir) =>
  kind === "players"
    ? `You are looking at pictures of one player model of a video game, in ${dir}: sides.png (six sides, one scale), four close angles, motion.png (it running, frame by frame) and stunt.png (it diving); facts.txt gives its size. Someone who will never see them must make it again from your words: describe its build and proportions, its head and face, its clothes, gear and skin, every part and its colours and materials, and its markings. At most 450 words.`
    : kind === "weapons"
    ? `You are looking at pictures of one weapon of a video game, in ${dir}: the model that lies in the world (sides.png, all to one scale, and four close angles), the player's first-person view of it in the hands (first-person.png, and first-person-attack.png frame by frame), and the model another player holds (in-hand.png); facts.txt gives its size. Someone who will never see them must make it again from your words, and will be judged against it in all three: describe its shape, every part with its size against the whole, its colours and materials, its markings and wear, how it sits in the hands and which end points away, and how it moves in its attack. At most 450 words.`
    : `You are looking at pictures of one character of a video game, in ${dir}: sides.png (six sides, one scale), four close angles, and motion.png (it moving, frame by frame); facts.txt gives its size. Someone who will never see them must make it again from your words: describe its build and proportions, its head and face, its clothes or skin, every part and its colours and materials, its markings, and how it moves. At most 450 words.`;

// --form: the description as a form, each field answered from the pictures, in place of free prose. What words lose
// of a picture is its places, sizes and fine attributes (research: structured captions with fixed fields, a region
// at a time, positions and relations spelled out); the characters words leg failed its outline gate on the stance,
// which free prose left as "standing, arms at its sides". An experiment beside the prose describer, not in its place
const FORM_CHARACTER = (dir) => `You are looking at pictures of one character of a video game, in ${dir}: sides.png (six sides, one scale, the character standing as it does in the first frame of its first animation), four close angles, and motion.png (it moving, frame by frame); facts.txt gives its size. Someone who will never see them must make it again from your words, and will be judged on its outline from every side, its size, its colours and its parts. Fill in this form from what the pictures show, every field, in plain text under these headings. Give lengths as a share of its height (0.5 is half its height), angles in degrees, and colours as RGB from 0 to 255 read off the pictures.

WHAT IT IS: one line.
SIZE AND BUILD: its height, its width across the shoulders and across the hips, how long its legs are against its body, how heavy or thin.
STANCE, as sides.png shows it (the first frame of its first animation; the outline is judged in it):
- torso: upright or leaning, and how many degrees forward or back
- head: turned or tilted, which way
- each upper arm: degrees out from the body seen from the front, degrees forward or back seen from the side
- each forearm: the elbow's bend in degrees, and where the hand is (beside the hip, in front of the chest, at mid thigh)
- legs: standing together, apart, or mid-stride; which foot is forward; the stride's length; each knee's bend
- anything held, and in which hand
REGIONS, each in turn (head and face; neck; torso front and back; each arm; hands; hips; each leg; feet), for each:
- its shape and its size against the whole
- what covers it (skin, cloth, armour) and its colour as RGB, with any second colour and where
- details on it (a pocket, a badge, a seam, glasses, a strap, a buckle), each with its place, size and colour
MARKINGS AND WEAR: any writing, logos, dirt, damage, and where.
MOTION, as motion.png shows it: what it does, its stride, how the arms swing, any lean.

At most 650 words.`;

/** How each kind is made and fitted into the game, the same in every leg. */
function makeOf(kind, s) {
  if (kind === "weapons")
    return `Make it with a model spec of kind "held" with weapon: { like: "${s.like}" } (guide { doc: "spec" }, "A weapon in place of a game's"): it is fitted into the game's own v_${s.like}.mdl, p_${s.like}.mdl and w_${s.like}.mdl, keeping their hands and animations, and replaces the weapon in them. Name the spec ${s.id}.mdl.`;
  if (kind === "players")
    return `Make it with a model spec of kind "character" (guide { doc: "spec" }, "A character on a game's skeleton") on the mod's own player, ${s.base}: its skeleton and its 171 animations (every stunt, dive, roll and wall jump), which the mod's code plays by name and by number and whose bones, attachments and bodyparts it uses. Keep all of that as it is, and give the spec contract: { file: "${s.base}" } so the build checks it. Name it ${s.id}.mdl.`;
  return `Make it with a model spec of kind "character" (guide { doc: "spec" }, "A character on a game's skeleton"), on a skeleton of the game's models (player/gordon/gordon.mdl, or another that suits it; its own is not available), keeping that skeleton's animations. It is a monster, which stands with its feet at its origin: give the spec "floor": 0. Name it ${s.id}.mdl.`;
}

function reproducePrompt(kind, s, leg, given) {
  if (leg === "brief") return briefPrompt({ brief: BRIEFS[kind][s.id].brief, replaces: kind === "weapons" ? s.files.join(", ") : s.file, make: makeOf(kind, s) });
  const judged = "It will be judged side by side with the original, from the same cameras and at the same scale, to high standards, by someone who sees only the two sets of pictures.";
  const aim =
    kind === "weapons"
      ? "Make it as close to the original as you can: its shape, size, parts, colours and markings, held the way the original is, in all three views."
      : "Make the body as close to the original as you can: its build and proportions, every part, its colours and markings, standing as the original stands in the first frame of its first animation.";
  const what = kind === "weapons" ? "this weapon for the GoldSrc engine" : kind === "players" ? "this player model for The Specialists, a GoldSrc mod" : "this character for the GoldSrc engine";
  return `Make ${what}. ${makeOf(kind, s)} ${aim} ${judged} Build until the build says OK.\n\n${given}`;
}

async function describe(kind, s) {
  const dir = join(folderOf(kind, s.id), "input");
  const asked = FORM && kind === "characters" ? FORM_CHARACTER(dir) : DESCRIBE(kind, dir);
  const r = await runAgent({ prompt: `${asked}\n${RULES}`, read: dir, hours: 0.5 });
  writeFileSync(join(folderOf(kind, s.id), "words.md"), `${r.answer.trim()}\n`);
  return `${kind}/${s.id}: ${r.answer.split(/\s+/).length} words`;
}

async function reproduce(kind, s, leg) {
  const base = folderOf(kind, s.id);
  const out = join(base, leg);
  if (existsSync(join(out, "run.json")) && !again) return `${kind}/${s.id}:${leg}: done before`;
  // the last round kept: its records and what it built, under round-<n>
  if (existsSync(join(out, "run.json"))) {
    const n = keepRound(out, { move: ["spec.json", "answer.md", "run.json", "judge.json", "built"] });
  }
  const input = join(base, "input");
  const files = {};
  let given;
  if (leg === "pictures") {
    for (const f of readdirSync(input)) files[`pictures/${f}`] = join(input, f);
    given = `The original, in pictures: every file of ${input} (also in the server's work folder under pictures/): sides.png (front, left, back, right, top, below, each a 512-dot square of the sheet in that order, three across) and four close angles with no perspective, ${ANGLES.map(([n, yaw, pitch]) => `${n}.png (yaw ${yaw}, pitch ${pitch})`).join(", ")}. ${readFileSync(join(input, "facts.txt"), "utf8")}`;
  } else if (leg === "words") given = `The original, as someone who has seen it describes it:\n\n${readFileSync(join(base, "words.md"), "utf8")}`;
  const hidden = kind === "weapons" ? s.files : [s.file];
  const kit = kitCommit();
  // the words leg may be offered the local generators (--generators): a shape made from words, carved by no picture
  const r = await runAgent({ prompt: reproducePrompt(kind, s, leg, given), read: leg === "pictures" ? input : null, server: { wads: true, games: s.root ? [s.root] : [], hide: hidden, refuse: hidden, ...(GENERATORS && leg === "words" ? { generators: GENERATORS } : {}) }, files, hours: 1.5 });
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "answer.md"), `${r.answer.trim()}\n`);
  const { all, newest: newestOf } = filesOf(r.work);
  const newest = (test) => newestOf((f) => test(f.name));
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
  writeFileSync(join(out, "run.json"), `${JSON.stringify({ kit, model: r.model, generators: GENERATORS && leg === "words" ? "generate" : null, seconds: r.seconds, turns: r.turns, cost: r.cost, tokens: r.tokens, error: r.error, built: kept }, null, 1)}\n`);
  return `${kind}/${s.id}:${leg}: ${r.seconds} s, built ${kept.join(", ") || "nothing"}`;
}

// ── the judge ─────────────────────────────────────────────────────────────

/** The rubric's table a held subject is scored on: a weapon's, a character's, or a player's with its contract. */
const tableOf = (kind, s) => (kind === "weapons" ? "weapon" : s.stunt ? "contracted" : "character");

async function judgeOne(kind, s, leg, built, { decoy } = {}) {
  const dir = join(folderOf(kind, s.id), "judge", decoy ? "decoy" : leg);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const original = game(s.file, rootOf(s));
  const copy = readModel(join(built, basename(s.file).replace(/^.*\//, "")));
  const { measured, caps, pictures } = measureModel(original, copy);
  // the pictures: the sides and angles of the measured model, original beside copy
  const pairs = pictures.original.map((p, i) => ({ name: p.name, pair: besides([p.picture, pictures.reproduction[i].picture]) }));
  savePng(join(dir, "compare-sides.png"), tile(pairs.filter((p) => SIDES.some(([n]) => n === p.name)).map((p) => p.pair), 2, pairs.filter((p) => SIDES.some(([n]) => n === p.name)).map((p) => `${p.name}: ORIGINAL | REPRODUCTION`)));
  savePng(join(dir, "compare-angles.png"), tile(pairs.filter((p) => ANGLES.some(([n]) => n === p.name)).map((p) => p.pair), 2, pairs.filter((p) => ANGLES.some(([n]) => n === p.name)).map((p) => `${p.name}: ORIGINAL | REPRODUCTION`)));
  let extra;
  if (kind === "weapons") {
    const vo = firstPerson(game(s.files[0]));
    const vc = firstPerson(readModel(join(built, basename(s.files[0]))));
    savePng(join(dir, "first-person.png"), besides([vo.still, vc.still]));
    savePng(join(dir, "first-person-attack.png"), tile([vo.attack, vc.attack], 1, ["ORIGINAL attack", "REPRODUCTION attack"]));
    const po = game(s.files[1]);
    const pc = readModel(join(built, basename(s.files[1])));
    savePng(join(dir, "in-hand.png"), besides([render(po, { seq: 0, frame: 0, yaw: 35, pitch: 20, width: 384, height: 384 }), render(pc, { seq: 0, frame: 0, yaw: 35, pitch: 20, width: 384, height: 384 })]));
    extra = `${dir}/first-person.png (the player's view, ORIGINAL left, REPRODUCTION right), ${dir}/first-person-attack.png (the attack frame by frame, the ORIGINAL's above) and ${dir}/in-hand.png (the model another player holds, ORIGINAL left). The world model (w_) is the one measured and drawn in compare-sides.png and compare-angles.png.`;
  } else {
    const motionOf = (src, name = s.motion) => strip(src, { seq: animation(src, new RegExp(`^${name}`)), count: 8, cols: 4, view: "side", ground: true, width: 192, height: 192 });
    savePng(join(dir, "motion.png"), tile([motionOf(original), motionOf(copy)], 1, [`ORIGINAL ${s.motion}`, `REPRODUCTION ${s.motion}`]));
    extra = `${dir}/motion.png (the ORIGINAL ${s.motion === "run" ? "running" : "walking"} above, the REPRODUCTION below, frame by frame from the side).`;
    if (s.stunt) {
      savePng(join(dir, "stunt.png"), tile([motionOf(original, s.stunt), motionOf(copy, s.stunt)], 1, ["ORIGINAL forward dive", "REPRODUCTION forward dive"]));
      extra += ` ${dir}/stunt.png (a forward dive, the ORIGINAL above).`;
      // the contract the mod's code relies on: the base's, measured
      const faults = compareContract(contractOf(game(join("models", s.base), rootOf(s))), contractOf(copy)).faults;
      measured.contract = faults.length ? faults : "keeps every bone, animation, attachment and bodypart of the base";
      caps.C2 = faults.length ? 0 : 2;
    }
  }
  const { items, must } = itemsOf(tableOf(kind, s));
  // failed already by a measure of a must-have item: no line-up and no judge are asked
  const failed = failedByMeasure(caps, must);
  if (failed.length) return { kind, subject: s.id, leg: decoy ? "decoy: box" : leg, measured, caps, passes: false, failedByMeasure: failed, total: 0, of: 2 * items.length };
  const files = [...SUBJECTS[kind].map((x) => x.file), ...LINEUP_EXTRAS[kind]].filter((f) => existsSync(join(rootOf(s), f)));
  const line = await lineup(join(dir, "lineup"), copy, s.file, { files, root: rootOf(s), seedOf: s.id, cols: 4 });
  const prompt = `You are an independent judge. A reproduction was made of a game ${kind === "weapons" ? "weapon" : kind === "players" ? "player model" : "character"} by someone who could not open the original's files. Judge it strictly by the rubric below (the "Models" table, the "Weapons, characters and creatures" section, "Passing", "Keeping the judge honest" and the "Amendments"). A measured item may score lower than its measurement allows, never higher.\n\nThe pictures: ${dir}/compare-sides.png and ${dir}/compare-angles.png (each view twice, the same camera and scale, ORIGINAL left, REPRODUCTION right), ${extra} Look at every picture closely.\n\nThe measurements:\n${JSON.stringify(measured, null, 1)}\n\n${MODEL_GUIDE()}\n\nFor M6, judge only whether a player would take it for the original; the line-up is run separately.\n\n${askScores(items)}\n\nTHE RUBRIC\n${RUBRIC}`;
  // two readings, each item the better of the two (rubric.md, "two readings"), as every model is judged
  const readings = await Promise.all([prompt, `${prompt}\n\n(Second reading.)`].map((p) => runJudge({ read: dir, hours: 0.5, prompt: p })));
  const judged = combine(readings.map((r) => r.answer), "better");
  if (!judged) return { kind, subject: s.id, leg, error: "the judge's answer was not JSON" };
  const capped = lowered(caps, { M6: line.picked === line.right ? 2 : 1 });
  return { kind, subject: s.id, leg: decoy ? "decoy: box" : leg, measured, caps: capped, lineup: line, ...settle(tableOf(kind, s), judged, capped) };
}

/**
 * A brief leg's build judged against its modder's request (briefs.json), not its original: the rubric's
 * "Original creation" measures and line-up beside Half-Life's own of its kind (never the original itself), with
 * what keeps it working in the game measured as for the pictures leg: a weapon in the hands (W1), a character in
 * motion (C1), a player's contract with its base (C2).
 */
async function judgeBrief(kind, s, built, { decoy, from = s } = {}) {
  const dir = join(folderOf(kind, s.id), "judge", decoy ? `decoy-brief-${decoy}` : "brief");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const { brief, asked } = BRIEFS[kind][s.id];
  const label = `${s.id}, in the place of the game's ${kind === "weapons" ? s.files.join(", ") : s.file}`;
  // `from`: whose files the folder holds (another subject's, for the swap decoy)
  const copy = readModel(join(built, basename(from.file)));
  const ownKind = { weapons: "weapon", characters: "character", players: "player" }[kind];
  // a mod's players: its stock ones (LINEUP_EXTRAS), its folder holding thousands more from packs
  const list = ownOfKind(ownKind, rootOf(s), kind === "players" ? [...SUBJECTS.players.map((x) => x.file), ...LINEUP_EXTRAS.players] : undefined).filter((x) => x.file !== s.file);
  if (kind === "weapons") {
    const v = readModel(join(built, basename(from.files[0])));
    const mine = firstPerson(v);
    savePng(join(dir, "first-person.png"), besides([mine.still, firstPerson(game(s.files[0])).still]));
    savePng(join(dir, "attack.png"), mine.attack);
    savePng(join(dir, "in-hand.png"), render(readModel(join(built, basename(from.files[1]))), { seq: 0, frame: 0, yaw: 35, pitch: 20, width: 384, height: 384 }));
    const r = await judgeModelAgainstBrief("weapon", label, copy, dir, { brief, asked, list, sizeFrom: weaponSizeIn(readModel(join(built, basename(from.files[1])))), extraPictures: `, ${dir}/first-person.png (its first-person view left, the game's own of this weapon right, for where it sits in the hands), ${dir}/attack.png (its attack frame by frame) and ${dir}/in-hand.png (the model another player holds); sides.png and lineup.png show the w_ model` });
    return { kind, subject: s.id, leg: decoy ? `decoy: brief ${decoy}` : "brief", ...r };
  }
  const motionOf = (name) => strip(copy, { seq: animation(copy, new RegExp(`^${name}`)), count: 8, cols: 4, view: "side", ground: true, width: 192, height: 192 });
  savePng(join(dir, "motion.png"), motionOf(s.motion));
  let extraPictures = `, ${dir}/motion.png (it ${s.motion === "run" ? "running" : "walking"}, frame by frame from the side, the floor a line)`;
  const extra = { measured: {}, caps: {} };
  if (s.stunt) {
    savePng(join(dir, "stunt.png"), motionOf(s.stunt));
    extraPictures += ` and ${dir}/stunt.png (a forward dive)`;
    const faults = compareContract(contractOf(game(join("models", s.base), rootOf(s))), contractOf(copy)).faults;
    extra.measured.contract = faults.length ? faults : "keeps every bone, animation, attachment and bodypart of the base";
    extra.caps.C2 = faults.length ? 0 : 2;
  }
  const r = await judgeModelAgainstBrief(ownKind, label, copy, dir, { brief, asked, list, extra, extraPictures });
  return { kind, subject: s.id, leg: decoy ? `decoy: brief ${decoy}` : "brief", ...r };
}

/** A plain box of the original's size, for a character; for a weapon a box in each of its three files' place. */
function decoyOf(kind, s) {
  const dir = join(folderOf(kind, s.id), "judge", "decoy-built");
  mkdirSync(dir, { recursive: true });
  const { size } = boxOf(game(s.file, rootOf(s)));
  const { mdl } = buildModelSpec({ spec: "smak.model/1", name: "decoy.mdl", kind: "prop", parts: [{ id: "box", kind: "box", size: size.map((v) => Math.max(v, 0.5)), material: { base: "paint", tone: [0.5, 0.5, 0.5] } }] });
  if (kind === "weapons") {
    // the weapon's place in v_ and p_ taken by the same box: the game's files with the box swapped in
    const spec = { spec: "smak.model/1", name: "decoy.mdl", kind: "held", parts: [{ id: "box", kind: "box", size: size.map((v) => Math.max(v, 0.5)), material: { base: "paint", tone: [0.5, 0.5, 0.5] } }], weapon: { like: s.like } };
    const built = buildModelSpec(spec, { games: [GAME] });
    if (!built.report?.ok) throw new Error(`${s.id}: the decoy did not build: ${[...(built.report?.errors ?? []), ...(built.report?.faults ?? [])].slice(0, 3).join(" | ")}`);
    for (const f of built.files ?? []) if (f.mdl) writeFileSync(join(dir, f.name), notTheOriginal(f.mdl, readModel(join(GAME, "models", f.name)), `${s.id}'s decoy ${f.name}`));
  } else writeFileSync(join(dir, basename(s.file)), notTheOriginal(mdl, game(s.file, rootOf(s)), `${s.id}'s decoy`));
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
          jobs.push(() => (leg === "brief" ? judgeBrief(k, s, built) : judgeOne(k, s, leg, built)).then((r) => (writeFileSync(join(folderOf(k, s.id), leg, "judge.json"), `${JSON.stringify(r, null, 1)}\n`), `${k}/${s.id}:${leg}: ${r.error ?? `${r.total} of ${r.of}, ${r.passes ? "PASSES" : "fails"}`}`)));
      }
      jobs.push(() => judgeOne(k, s, "decoy", decoyOf(k, s), { decoy: true }).then((r) => (writeFileSync(join(folderOf(k, s.id), "judge", "decoy.json"), `${JSON.stringify(r, null, 1)}\n`), `${k}/${s.id} decoy: ${r.error ?? `${r.total} of ${r.of}, ${r.passes ? "PASSES (the judge is lenient)" : "fails, as it must"}`}`)));
    }
  // the brief leg's decoys: a box of the subject's size, and another subject's brief build held to this brief
  for (const k of kinds) {
    const briefed = chosen(k).filter((s) => existsSync(join(folderOf(k, s.id), "brief", "built", basename(s.file))));
    const said = (k2, s, name) => (r) => (writeFileSync(join(folderOf(k2, s.id), "judge", `decoy-brief-${name}.json`), `${JSON.stringify(r, null, 1)}\n`), `${k2}/${s.id} brief decoy ${name}: ${r.error ?? `${r.total} of ${r.of}, ${r.passes ? "PASSES (the judge is lenient)" : "fails, as it must"}`}`);
    for (const s of briefed) jobs.push(() => judgeBrief(k, s, decoyOf(k, s), { decoy: "box" }).then(said(k, s, "box")));
    if (briefed.length >= 2) jobs.push(() => judgeBrief(k, briefed[1], join(folderOf(k, briefed[0].id), "brief", "built"), { decoy: `swap-${briefed[0].id}`, from: briefed[0] }).then(said(k, briefed[1], "swap")));
  }
  await pool(jobs, 4);
} else console.log("node examples/reproduce/held.mjs inputs|describe|reproduce|judge [weapons|characters] [subject ...] [--again]");
