// The original-creation test (rubric.md, "Original creation"): one fresh agent with only the MCP server makes a
// small mod from original/brief.md alone, under the file names of original/assets.json; a judge that never sees
// its specs or words scores each asset on its kind's table against the brief, with measures against Half-Life's
// own of its kind, and the mod as a whole on O1 to O4. A plain mod the harness makes itself is the decoy.
//
//   node examples/reproduce/original.mjs make [--again] [--generators <dir>] [--materials <dir>]   the maker's run: original/made/ (out of git)
//   node examples/reproduce/original.mjs collect             what the last run made, taken again from its work folder
//   node examples/reproduce/original.mjs judge [made|decoy]  original/judge/<which>/...json and scores.md
//   node examples/reproduce/original.mjs rounds [--again] [--most n] [--generators <dir>] [--materials <dir>]   made, judged, revised from the judges' notes until it passes or stalls
//
// The made files are the maker's, built over the game's own (the crowbar's and the headcrab's files): kept out
// of git, as everything that holds the game's bones and animations is.
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, copyFileSync, rmSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import { HERE, GAME, SDHLT, POSE, readModel, boxOf, savePng, besides, kitCommit, keepRound, filesOf } from "./lib.mjs";
import { runAgent } from "./agents.mjs";
import { ownOfKind, judgeAgainstBrief, judgeModelAgainstBrief, judgeSpriteAgainstBrief, judgeSoundAgainstBrief, judgeTexturesAgainstBrief, weaponSizeIn, notesOf } from "./brief.mjs";
import { band } from "./scoring.mjs";
import * as smak from "../../src/index.mjs";
import { tile, render, strip } from "../../src/render.mjs";
import { contractOf, compareContract } from "../../src/contract.mjs";
import { buildModelSpec } from "../../src/spec/model.mjs";
import { buildMapSpec } from "../../src/spec/map.mjs";
import { findCompilers } from "../../src/maps/compile.mjs";
import { writeSpr } from "../../src/sprite/spr.mjs";

const { maps, audio: A } = smak;
const ROOT = join(HERE, "original");
const BRIEF = readFileSync(join(ROOT, "brief.md"), "utf8");
const ASSETS = JSON.parse(readFileSync(join(ROOT, "assets.json"), "utf8"));
const words = process.argv.slice(2);
const step = words.shift();
const again = words.includes("--again");
// the server as a person runs it: the local generators (sounds, shapes) and the material library of photographs,
// from --generators and --materials or SMAK_GENERATORS and SMAK_MATERIALS, as the assets' legs take them
const option = (name, env) => (words.includes(name) ? words.splice(words.indexOf(name), 2)[1] : process.env[env]);
const GENERATORS = option("--generators", "SMAK_GENERATORS");
const MATERIALS = option("--materials", "SMAK_MATERIALS");
/** What the original mod's judge is told each asset is. */
const MOD_ASSET = "one asset of a small mod made for Half-Life from a written brief";
const round = (v, k = 1) => Math.round(v * 10 ** k) / 10 ** k;

/** Every file the test looks for, by its path in the made folder. */
const WEAPON_FILES = ["v", "p", "w"].map((v) => `models/${v}_${ASSETS.weapon.like}.mdl`);
const LOOKED_FOR = [
  ...ASSETS.maps.map((m) => `maps/${m.name}.bsp`),
  ...ASSETS.props.map((p) => p.file),
  ...WEAPON_FILES,
  ASSETS.enemy.file,
  ASSETS.wad.file,
  ...ASSETS.sprites.map((s) => s.file),
  ...ASSETS.sounds.map((s) => s.file),
  ...ASSETS.show,
];

// ── the maker ──────────────────────────────────────────────────────────────

function makePrompt() {
  return `Make this mod for Half-Life (GoldSrc) with the SMAK MCP server: every asset of the brief below, each with
the server's build tool (model, weapon, map, wad, sprite, sound and video specs: guide { doc: "spec" }). It will
be judged against the brief, beside Half-Life's own assets of each kind, to high standards, by someone who sees
only pictures and measurements of what you made.

Write each file under exactly this name, in the work folder (a spec's name sets where its file goes; a weapon's
three files are written for you under the game's names):
${LOOKED_FOR.map((f) => `- ${f}`).join("\n")}

The game's folder is there for its .wad textures and for the files you fit into: the weapon replaces the
crowbar's three models (a model spec of kind "held" with weapon: { like: "crowbar" }), and the enemy replaces
the headcrab's model on its own skeleton, keeping its animations and contract (a character spec with base
{ file: "headcrab.mdl" } and contract: { file: "headcrab.mdl" }). The maps chain by trigger_changelevel and
info_landmark, each map's level change naming the next map and a landmark of the same name in both. The
sounds replace the game's own where the brief's sound is one the game already plays (the names above say which).

Check every file, look at every picture you are given, and keep going until each is right. Then say what you
made.${GENERATORS ? " For this test the person accepts the licences of the local generators, non-commercial ones included." : ""}

THE BRIEF

${BRIEF}`;
}

/**
 * The words of a revision of the mod: what was made, what the person says of each asset not yet right (from
 * the judges' lines under 2 and the measures that failed it: notesOf, no scores, no rubric names), what to do.
 */
const revisionWords = ({ answer, notes }) => `THIS IS A REVISION. You made this mod before; the work folder is as you left it (its specs, its
files). What you said then:

${answer.trim()}

The person looked at each asset, in pictures and measures beside Half-Life's own, and says what is not yet right:

${notes.map(({ label, lines }) => `${label}:\n${lines.map((l) => `- ${l}`).join("\n")}`).join("\n\n")}

Change what they say, keep what is right (every asset not named here is right: leave it), build again until each
build says OK, and put every file where the list above says. Then say what you changed.`;

async function make(revision = null) {
  const out = join(ROOT, "made");
  if (existsSync(join(ROOT, "run.json")) && !again && !revision) return console.log("made before (--again to make it again)");
  if (existsSync(join(ROOT, "run.json"))) {
    const n = keepRound(ROOT, { move: ["run.json", "answer.md", "specs", "made", "judge"] });
  }
  const kit = kitCommit();
  const prompt = revision ? `${makePrompt()}\n\n${revisionWords(revision)}` : makePrompt();
  const r = await runAgent({ prompt, start: revision?.start ?? null, server: { wads: true, generators: GENERATORS, materials: MATERIALS }, hours: 10 });
  writeFileSync(join(ROOT, "answer.md"), `${r.answer.trim()}\n`);
  const { found } = collect(r.work);
  writeFileSync(join(ROOT, "run.json"), `${JSON.stringify({ kit, model: r.model, generators: GENERATORS ? "generate" : null, materials: MATERIALS ? "library" : null, seconds: r.seconds, turns: r.turns, cost: r.cost, tokens: r.tokens, error: r.error, ended: r.ended, found, missing: LOOKED_FOR.filter((f) => !found.includes(f)), folder: r.folder, revision: revision ? revision.round : null }, null, 1)}\n`);
  console.log(`made in ${r.seconds} s, ${r.turns} turns: ${found.length} of ${LOOKED_FOR.length} files${r.error ? ` (${r.error})` : ""}`);
}


/** What the maker made, from its work folder: each file looked for (the newest of that path, or of that name),
 * every .wad beside them, and its specs. `node original.mjs collect` does it again from the last run's folder. */
function collect(work) {
  const out = join(ROOT, "made");
  // what it made: each file looked for, the newest of that path (or of that name) in the work folder; and its specs
  const { all, newest } = filesOf(work);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const found = [];
  for (const want of LOOKED_FOR) {
    const f = newest((x) => x.rel === want || x.rel.endsWith(`/${want}`)) ?? newest((x) => x.name === basename(want));
    if (!f) continue;
    mkdirSync(dirname(join(out, want)), { recursive: true });
    copyFileSync(f.p, join(out, want));
    found.push(want);
  }
  // every .wad it made beside them: a map names its own, and the textures are found by those names
  for (const f of all.filter((x) => x.name.endsWith(".wad") && !found.includes(x.name))) copyFileSync(f.p, join(out, f.name));
  rmSync(join(ROOT, "specs"), { recursive: true, force: true });
  // by their path in the work folder: a map's spec and a video's may share a name
  for (const f of all.filter((x) => x.name.endsWith(".spec.json"))) {
    mkdirSync(dirname(join(ROOT, "specs", f.rel)), { recursive: true });
    copyFileSync(f.p, join(ROOT, "specs", f.rel));
  }
  return { found };
}


async function judgeAll(which) {
  const made = which === "decoy" ? join(ROOT, "decoy") : join(ROOT, "made");
  const out = join(ROOT, "judge", which);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const has = (f) => existsSync(join(made, f));
  const results = [];
  const jobs = [];
  const props = ownOfKind("model");

  // props
  for (const p of ASSETS.props)
    jobs.push(async () => (has(p.file) ? judgeModelAgainstBrief("model", `${p.file}: ${p.what}`, readModel(join(made, p.file)), join(out, basename(p.file, ".mdl")), { brief: BRIEF, what: MOD_ASSET, asked: p.size, list: props }) : { kind: "model", label: p.file, missing: true, passes: false }));
  // the weapon: measured on w_ but for its size (on v_, its hands left out), seen in all three
  jobs.push(async () => {
    if (!WEAPON_FILES.every(has)) return { kind: "weapon", label: "the wrench", missing: true, passes: false };
    const dir = join(out, "weapon");
    mkdirSync(dir, { recursive: true });
    const v = readModel(join(made, WEAPON_FILES[0]));
    const attack = sequencesIndex(v, /attack|hit|swing/i);
    savePng(join(dir, "first-person.png"), besides([render(v, { seq: 0, frame: 0, view: "first", width: 480, height: 360 }), render(readModel(join(GAME, WEAPON_FILES[0])), { seq: 0, frame: 0, view: "first", width: 480, height: 360 })]));
    savePng(join(dir, "attack.png"), strip(v, { seq: attack, count: 8, cols: 4, view: "first", width: 240, height: 180 }));
    savePng(join(dir, "in-hand.png"), render(readModel(join(made, WEAPON_FILES[1])), { seq: 0, frame: 0, yaw: 35, pitch: 20, width: 384, height: 384 }));
    const weapons = ownOfKind("weapon");
    return judgeModelAgainstBrief("weapon", `the wrench (${WEAPON_FILES.join(", ")}): ${ASSETS.weapon.what}`, readModel(join(made, WEAPON_FILES[2])), dir, { asked: { long: ASSETS.weapon.long }, sizeFrom: weaponSizeIn(readModel(join(made, WEAPON_FILES[1]))), brief: BRIEF, what: MOD_ASSET, list: weapons, beside: ["models/w_crowbar.mdl"], group: "melee", extraPictures: `, ${dir}/first-person.png (this mod's first-person view left, the game's crowbar right, for where it sits), ${dir}/attack.png (its attack frame by frame) and ${dir}/in-hand.png (the model another player holds); sides.png and lineup.png show the w_ model` });
  });
  // the enemy: its contract with the game's headcrab, and its motion
  jobs.push(async () => {
    if (!has(ASSETS.enemy.file)) return { kind: "enemy", label: "the crawler", missing: true, passes: false };
    const dir = join(out, "enemy");
    mkdirSync(dir, { recursive: true });
    const src = readModel(join(made, ASSETS.enemy.file));
    const faults = compareContract(contractOf(readModel(join(GAME, ASSETS.enemy.like))), contractOf(src)).faults;
    for (const [name, pattern] of [["run", /run|walk/i], ["attack", /attack|jump/i]]) savePng(join(dir, `${name}.png`), strip(src, { seq: sequencesIndex(src, pattern), count: 8, cols: 4, view: "side", ground: true, width: 192, height: 192 }));
    const creatures = ownOfKind("enemy");
    return judgeModelAgainstBrief("enemy", `the crawler (${ASSETS.enemy.file}): ${ASSETS.enemy.what}`, src, dir, { brief: BRIEF, what: MOD_ASSET, group: "creature", asked: { long: round(Math.max(...boxOf(readModel(join(GAME, ASSETS.enemy.like))).size)) }, list: creatures.filter((c) => c.file !== ASSETS.enemy.like), extra: { measured: { contract: faults.length ? faults : "keeps the headcrab's bones, animations, attachments and bodyparts" }, caps: { C2: faults.length ? 0 : 2 } }, extraPictures: `, ${dir}/run.png and ${dir}/attack.png (its run and its attack, frame by frame from the side, the floor a line)` });
  });
  // maps
  for (const m of ASSETS.maps)
    jobs.push(async () => {
      const file = `maps/${m.name}.bsp`;
      if (!has(file)) return { kind: "map", label: file, missing: true, passes: false };
      const dir = join(out, m.name);
      mkdirSync(dir, { recursive: true });
      const bytes = readFileSync(join(made, file));
      const bsp = maps.readBsp(bytes);
      const folders = [made, GAME];
      savePng(join(dir, "plan.png"), maps.planOf(bsp, { heights: true, legend: true, folders }));
      savePng(join(dir, "views.png"), maps.viewsOf(bsp, { count: 8, folders, models: true, aim: true }));
      const check = maps.checkBsp(bytes, { folders });
      const reach = maps.reachOf(bsp, { exits: ["trigger_changelevel"] });
      const ents = bsp.entities.map((e) => Object.fromEntries(e));
      const classes = ents.map((e) => e.classname);
      const { mins, maxs } = bsp.models[0];
      const size = [0, 1].map((k) => round(maxs[k] - mins[k]));
      const measured = {
        size,
        sizeAsked: m.size ?? (m.long ? { long: m.long } : null),
        checkErrors: check.errors,
        lit: maps.lightReport ? undefined : undefined,
        notReached: reach.entities.filter((e) => reach.unreached.includes(e.number)).map((e) => `${e.classname} ${e.number}`),
        reachWarnings: reach.warnings.slice(0, 8),
        changelevels: ents.filter((e) => e.classname === "trigger_changelevel").map((e) => ({ map: e.map, landmark: e.landmark })),
        landmarks: ents.filter((e) => e.classname === "info_landmark").map((e) => e.targetname),
        itemsAsked: m.items ?? [],
        itemsFound: (m.items ?? []).map((c) => `${c}: ${classes.filter((x) => x === c).length}`),
      };
      const big = Math.max(...size);
      const asked = m.size ? Math.max(...m.size) : m.long ?? null;
      const sizeOk = asked ? Math.abs(big - asked) / asked : null;
      const caps = { P2: sizeOk === null ? 2 : band(sizeOk, 0.25, 0.5, true), P8: check.errors.length ? 0 : reach.unreached.length ? 1 : 2 };
      return judgeAgainstBrief("map", `${file}: ${m.what}`, dir, `${dir}/plan.png (from above: floor heights, every entity marked and listed) and ${dir}/views.png (from inside, at a player's eye, with its models)`, measured, caps, { brief: BRIEF, what: MOD_ASSET });
    });
  // textures: every one flat, its fine detail against Half-Life's
  jobs.push(async () => {
    if (!has(ASSETS.wad.file)) return { kind: "texture", label: ASSETS.wad.file, missing: true, passes: false };
    const textures = maps.readWad(readFileSync(join(made, ASSETS.wad.file))).textures;
    return judgeTexturesAgainstBrief(`${ASSETS.wad.file}, the mod's textures, judged as one set: ${ASSETS.wad.what}`, textures, join(out, "textures"), { brief: BRIEF, what: MOD_ASSET, least: ASSETS.wad.least });
  });
  for (const s of ASSETS.sprites)
    jobs.push(async () => (has(s.file) ? judgeSpriteAgainstBrief(`${s.file}: ${s.what}`, readFileSync(join(made, s.file)), join(out, basename(s.file, ".spr")), { brief: BRIEF, what: MOD_ASSET, class: s.class }) : { kind: "sprite", label: s.file, missing: true, passes: false }));
  // sounds: against their class's range, or the game's own sound they stand in for
  for (const s of ASSETS.sounds)
    jobs.push(async () => (has(s.file) ? judgeSoundAgainstBrief(`${s.file}: ${s.what}`, readFileSync(join(made, s.file)), join(out, basename(s.file, ".wav")), { brief: BRIEF, what: MOD_ASSET, class: s.class, like: s.like }) : { kind: "sound", label: s.file, missing: true, passes: false }));
  await pool(jobs, 4, results);

  // the mod: complete, wired, one place, shown
  const dir = join(out, "mod");
  mkdirSync(dir, { recursive: true });
  const missing = LOOKED_FOR.filter((f) => !has(f));
  const chain = ASSETS.maps.map((m) => {
    if (!has(`maps/${m.name}.bsp`)) return { map: m.name, missing: true };
    const ents = maps.readBsp(readFileSync(join(made, `maps/${m.name}.bsp`))).entities.map((e) => Object.fromEntries(e));
    return { map: m.name, leadsTo: ents.filter((e) => e.classname === "trigger_changelevel").map((e) => e.map), landmarks: ents.filter((e) => e.classname === "info_landmark").map((e) => e.targetname), asked: m.next ?? null };
  });
  const shots = [];
  for (const p of ASSETS.props) if (has(p.file)) shots.push(render(readModel(join(made, p.file)), { ...POSE, yaw: 35, pitch: 20, width: 256, height: 256 }));
  if (has(ASSETS.enemy.file)) shots.push(render(readModel(join(made, ASSETS.enemy.file)), { ...POSE, yaw: 35, pitch: 20, width: 256, height: 256 }));
  if (has(WEAPON_FILES[2])) shots.push(render(readModel(join(made, WEAPON_FILES[2])), { ...POSE, yaw: 35, pitch: 20, width: 256, height: 256 }));
  for (const m of ASSETS.maps) if (has(`maps/${m.name}.bsp`)) shots.push(maps.drawMap(maps.readBsp(readFileSync(join(made, `maps/${m.name}.bsp`))), { width: 256, height: 256, folders: [made, GAME], ...firstView(join(made, `maps/${m.name}.bsp`)) }));
  if (shots.length) savePng(join(dir, "everything.png"), tile(shots, 5, []));
  const shown = ASSETS.show.map((f) => ({ file: f, there: has(f), bytes: has(f) ? statSync(join(made, f)).size : 0 }));
  const failedChecks = results.filter((r) => r.measured?.checkErrors?.length).map((r) => r.label);
  const caps = { O1: missing.length || failedChecks.length ? 0 : 2, O2: chain.every((c, i) => c.missing || !c.asked || c.leadsTo.includes(c.asked)) && chain.every((c) => !c.missing) ? 2 : 0 };
  results.push(await judgeAgainstBrief("mod", "the mod as a whole", dir, `${dir}/everything.png (every prop, the crawler, the wrench and a view of each map, side by side)`, { missing, failedChecks, chain, shown }, caps, { brief: BRIEF, what: MOD_ASSET }));
  for (const r of results) writeFileSync(join(out, `${(r.label ?? r.kind).replace(/[^\w.-]+/g, "_").slice(0, 60)}.json`), `${JSON.stringify(r, null, 1)}\n`);
  scores(which, results);
  return results;
}

/**
 * The mod made, judged, and revised from the judges' notes until every asset passes, `most` rounds in all, or two
 * rounds in a row reach no new best count of passes. The decoy is judged once. rounds.json keeps each round.
 */
async function rounds(most) {
  if (!existsSync(join(ROOT, "run.json")) || again) await make();
  await judgeAll("decoy");
  const record = [];
  for (let round = 1; ; round++) {
    const results = await judgeAll("made");
    const assets = results.filter((r) => r.kind !== "mod");
    const run = JSON.parse(readFileSync(join(ROOT, "run.json"), "utf8"));
    const byKind = {};
    for (const r of assets) (byKind[r.kind] ??= [0, 0])[r.passes ? 0 : 1]++;
    record.push({ round, passes: assets.filter((r) => r.passes).length, of: assets.length, byKind, cost: run.cost, seconds: run.seconds, kit: run.kit });
    writeFileSync(join(ROOT, "rounds.json"), `${JSON.stringify(record, null, 1)}\n`);
    console.log(`round ${round}: ${record.at(-1).passes} of ${assets.length} pass`);
    const bestBefore = Math.max(...record.slice(0, -2).map((r) => r.passes));
    const stalled = round >= 3 && Math.max(...record.slice(-2).map((r) => r.passes)) <= bestBefore;
    if (assets.every((r) => r.passes) || round >= most || stalled) return record;
    const notes = assets.filter((r) => !r.passes).map((r) => ({ label: r.label, lines: notesOf(r) })).filter((n) => n.lines.length);
    await make({ round: round + 1, notes, answer: readFileSync(join(ROOT, "answer.md"), "utf8"), start: join(run.folder, "work") });
  }
}

/** A view from the map's first place to start, or from its middle. */
function firstView(file) {
  const bsp = maps.readBsp(readFileSync(file));
  const start = bsp.entities.map((e) => Object.fromEntries(e)).find((e) => /info_player_(start|deathmatch)/.test(e.classname));
  if (start?.origin) return { from: start.origin.split(" ").map(Number).map((v, k) => (k === 2 ? v + 28 : v)), yaw: start.angles !== undefined ? Number(String(start.angles).split(" ")[1]) || 0 : Number(start.angle ?? 0) || 0 };
  const { mins, maxs } = bsp.models[0];
  return { from: [0, 1, 2].map((k) => (mins[k] + maxs[k]) / 2), yaw: 0 };
}
/** An animation's number by a word in its name, or the first. */
function sequencesIndex(src, pattern) {
  const at = smak.sequences(src).findIndex((s) => pattern.test(s.name));
  return at < 0 ? 0 : at;
}

async function pool(jobs, atOnce, out) {
  const queue = [...jobs];
  await Promise.all(
    Array.from({ length: Math.min(atOnce, queue.length) }, async () => {
      while (queue.length) {
        try {
          const r = await queue.shift()();
          out.push(r);
          console.log(`${r.kind} ${r.label?.slice(0, 50)}: ${r.missing ? "MISSING" : r.error ?? `${r.total} of ${r.of}, ${r.passes ? "PASSES" : "fails"}`}`);
        } catch (error) {
          console.log(`failed: ${error.message.split("\n")[0]}`);
        }
      }
    }),
  );
}

function scores(which, results) {
  const kinds = ["model", "weapon", "enemy", "map", "texture", "sprite", "sound"];
  const lines = [`# Original creation, ${which}`, "", "| Kind | Passed | Of |", "| --- | --- | --- |"];
  for (const k of kinds) {
    const of = results.filter((r) => r.kind === k);
    lines.push(`| ${k} | ${of.filter((r) => r.passes).length} | ${of.length} |`);
  }
  const mod = results.find((r) => r.kind === "mod");
  const share = (k) => {
    const of = results.filter((r) => r.kind === k);
    return of.length ? of.filter((r) => r.passes).length / of.length : 0;
  };
  const kindsPass = kinds.every((k) => share(k) >= 0.8);
  // a mod judged with no scores (failed by its measures before a judge was asked, as a decoy is) scores 0 on each
  const modScore = (i) => mod?.scores?.[i]?.score ?? 0;
  const modPasses = mod && !mod.error && ["O1", "O2", "O3"].every((i) => modScore(i) === 2);
  lines.push("", `The mod: ${mod?.error ?? (mod ? ["O1", "O2", "O3", "O4"].map((i) => `${i} ${modScore(i)}`).join(", ") + (mod.scores ? "" : " (no judge: failed by its measures)") : "not judged")}. It ${modPasses && kindsPass ? "PASSES" : "fails"}.`, "");
  writeFileSync(join(ROOT, `scores-${which}.md`), `${lines.join("\n")}\n`);
  console.log(lines.join("\n"));
}

// ── the decoy: the brief made plainly by the harness ─────────────────────────

function decoy() {
  const out = join(ROOT, "decoy");
  rmSync(out, { recursive: true, force: true });
  const put = (f, bytes) => {
    mkdirSync(dirname(join(out, f)), { recursive: true });
    writeFileSync(join(out, f), bytes);
  };
  const box = (size) => buildModelSpec({ spec: "smak.model/1", name: "decoy.mdl", kind: "prop", finish: false, parts: [{ id: "box", kind: "box", size, material: { base: "paint", tone: [0.5, 0.5, 0.5] } }] }).mdl;
  for (const p of ASSETS.props) put(p.file, box([p.size?.across ?? 24, p.size?.across ?? 24, p.size?.high ?? 24]));
  const weapon = buildModelSpec({ spec: "smak.model/1", name: "decoy.mdl", kind: "held", weapon: { like: ASSETS.weapon.like }, parts: [{ id: "box", kind: "box", size: [ASSETS.weapon.long, 1.5, 1.5], material: { base: "paint", tone: [0.5, 0.5, 0.5] } }] }, { games: [GAME] });
  for (const f of weapon.files ?? []) if (f.mdl) put(`models/${f.name}`, f.mdl);
  const enemy = buildModelSpec({ spec: "smak.model/1", name: "headcrab.mdl", kind: "character", base: { file: "headcrab.mdl" }, parts: [{ id: "box", kind: "box", size: [12, 10, 6], at: [0, 0, 0], material: { base: "paint", tone: [0.5, 0.5, 0.5] } }] }, { games: [GAME] });
  if (enemy.mdl) put(ASSETS.enemy.file, enemy.mdl);
  const compilers = findCompilers({ folder: SDHLT });
  for (const [i, m] of ASSETS.maps.entries()) {
    const next = ASSETS.maps[i + 1];
    const size = [m.size?.[0] ?? m.long ?? 1024, m.size?.[1] ?? 768, 256];
    const entities = [{ class: "info_player_start", room: "hall", at: "centre" }, ...(m.items ?? []).map((c) => ({ class: c, room: "hall", at: "corner ne" }))];
    const { files } = buildMapSpec({ spec: "smak.map/1", name: m.name, wads: ["halflife.wad"], rooms: [{ id: "hall", size, at: [0, 0, 0] }], entities }, { out: join(out, "build", m.name), compilers, wads: [GAME] });
    if (files.bsp) put(`maps/${m.name}.bsp`, readFileSync(files.bsp));
    void next;
  }
  const flat = (name) => ({ name, image: { width: 64, height: 64, rgb: new Uint8Array(64 * 64 * 3).fill(128) } });
  put(ASSETS.wad.file, maps.writeWad(Array.from({ length: ASSETS.wad.least }, (_, i) => flat(`fw_plain${i}`))));
  for (const s of ASSETS.sprites) {
    const palette = new Uint8Array(768).fill(200);
    palette.set([0, 0, 0], 0);
    const pixels = new Uint8Array(32 * 32);
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) pixels[y * 32 + x] = Math.hypot(x - 15.5, y - 15.5) < 12 ? 1 : 0;
    put(s.file, writeSpr({ type: "parallel", format: "additive", palette, frames: [{ width: 32, height: 32, pixels }] }));
  }
  for (const s of ASSETS.sounds) {
    const x = new Float32Array(11025 * 0.5).map(() => (Math.random() * 2 - 1) * 0.3);
    put(s.file, A.writeWav(x, { rate: 11025, bits: 16 }));
  }
  console.log(`the decoy made in ${out}`);
}

if (step === "make") await make();
else if (step === "collect") {
  const run = JSON.parse(readFileSync(join(ROOT, "run.json"), "utf8"));
  const { found } = collect(join(run.folder, "work"));
  writeFileSync(join(ROOT, "run.json"), `${JSON.stringify({ ...run, found, missing: LOOKED_FOR.filter((f) => !found.includes(f)) }, null, 1)}\n`);
  console.log(`${found.length} of ${LOOKED_FOR.length} files`);
}
else if (step === "decoy") decoy();
else if (step === "judge") {
  const which = words.find((w) => ["made", "decoy"].includes(w)) ?? "made";
  if (which === "decoy" && !existsSync(join(ROOT, "decoy"))) decoy();
  await judgeAll(which);
} else if (step === "rounds") await rounds(words.includes("--most") ? Number(words[words.indexOf("--most") + 1]) : 5);
else console.log("node examples/reproduce/original.mjs make [--again] | decoy | judge [made|decoy] | rounds [--again] [--most n]");
