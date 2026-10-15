// The original-creation test (rubric.md, "Original creation"): one fresh agent with only the MCP server makes a
// small mod from original/brief.md alone, under the file names of original/assets.json; a judge that never sees
// its specs or words scores each asset on its kind's table against the brief, with measures against Half-Life's
// own of its kind, and the mod as a whole on O1 to O4. A plain mod the harness makes itself is the decoy.
//
//   node examples/reproduce/original.mjs make [--again]     the maker's run: original/made/ (out of git)
//   node examples/reproduce/original.mjs collect             what the last run made, taken again from its work folder
//   node examples/reproduce/original.mjs judge [made|decoy]  original/judge/<which>/...json and scores.md
//
// The made files are the maker's, built over the game's own (the crowbar's and the headcrab's files): kept out
// of git, as everything that holds the game's bones and animations is.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, copyFileSync, rmSync, renameSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { HERE, GAME, SDHLT, POSE, readModel, boxOf, picturesOf, savePng, besides, SIDES } from "./lib.mjs";
import { runAgent, runJudge, failedByMeasure } from "./agents.mjs";
import * as smak from "../../src/index.mjs";
import { tile, render, framing, strip } from "../../src/render.mjs";
import { contractOf, compareContract } from "../../src/contract.mjs";
import { measureSprite, againstClass, SPRITE_CLASSES } from "../../src/sprite/measure.mjs";
import { sheetOf } from "../../src/sprite/draw.mjs";
import { buildModelSpec } from "../../src/spec/model.mjs";
import { buildMapSpec } from "../../src/spec/map.mjs";
import { findCompilers } from "../../src/maps/compile.mjs";
import { writeSpr } from "../../src/sprite/spr.mjs";

const { maps, audio: A } = smak;
const ROOT = join(HERE, "original");
const BRIEF = readFileSync(join(ROOT, "brief.md"), "utf8");
const ASSETS = JSON.parse(readFileSync(join(ROOT, "assets.json"), "utf8"));
const RUBRIC = readFileSync(join(HERE, "rubric.md"), "utf8");
const words = process.argv.slice(2);
const step = words.shift();
const again = words.includes("--again");
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
made.

THE BRIEF

${BRIEF}`;
}

async function make() {
  const out = join(ROOT, "made");
  if (existsSync(join(ROOT, "run.json")) && !again) return console.log("made before (--again to make it again)");
  if (existsSync(join(ROOT, "run.json"))) {
    const n = readdirSync(ROOT).filter((f) => /^round-\d+$/.test(f)).length + 1;
    const keep = join(ROOT, `round-${n}`);
    mkdirSync(keep);
    for (const f of ["run.json", "answer.md", "specs", "made", "judge"]) if (existsSync(join(ROOT, f))) renameSync(join(ROOT, f), join(keep, f));
  }
  const kit = execFileSync("git", ["-C", HERE, "rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
  const r = await runAgent({ prompt: makePrompt(), server: { wads: true }, hours: 10 });
  writeFileSync(join(ROOT, "answer.md"), `${r.answer.trim()}\n`);
  const { found } = collect(r.work);
  writeFileSync(join(ROOT, "run.json"), `${JSON.stringify({ kit, model: r.model, seconds: r.seconds, turns: r.turns, cost: r.cost, tokens: r.tokens, error: r.error, ended: r.ended, found, missing: LOOKED_FOR.filter((f) => !found.includes(f)), folder: r.folder }, null, 1)}\n`);
  console.log(`made in ${r.seconds} s, ${r.turns} turns: ${found.length} of ${LOOKED_FOR.length} files${r.error ? ` (${r.error})` : ""}`);
}


/** What the maker made, from its work folder: each file looked for (the newest of that path, or of that name),
 * every .wad beside them, and its specs. `node original.mjs collect` does it again from the last run's folder. */
function collect(work) {
  const out = join(ROOT, "made");
  // what it made: each file looked for, the newest of that path (or of that name) in the work folder; and its specs
  const all = [];
  const look = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) look(p);
      else all.push({ p, rel: p.slice(work.length + 1), name: e.name, at: statSync(p).mtimeMs });
    }
  };
  look(work);
  const newest = (test) => all.filter(test).sort((a, b) => b.at - a.at)[0];
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
  mkdirSync(join(ROOT, "specs"), { recursive: true });
  for (const f of all.filter((x) => x.name.endsWith(".spec.json"))) copyFileSync(f.p, join(ROOT, "specs", f.name));
  return { found };
}

// ── Half-Life's own, to set beside ─────────────────────────────────────────

/** Half-Life's props (three bones or fewer, no weapon's file) with their size: the line-ups pick from these. */
function gameProps() {
  const out = [];
  for (const f of readdirSync(join(GAME, "models"))) {
    if (!/\.mdl$/.test(f) || /t\.mdl$|\d\d\.mdl$|^(v_|p_|w_)/.test(f)) continue;
    try {
      const src = readModel(join(GAME, "models", f));
      if (smak.readMdl(src).bones.length > 3) continue;
      const { size } = boxOf(src);
      out.push({ file: `models/${f}`, src, diagonal: Math.hypot(...size) });
    } catch {}
  }
  return out;
}
/** The three of `list` nearest in size, drawn at one scale with ours, in a shuffled line-up; where ours is. */
function lineupOf(ours, list, dir, name) {
  const { size } = boxOf(ours);
  const d = Math.hypot(...size);
  const near = list.filter((x) => x.src !== ours).sort((a, b) => Math.abs(a.diagonal - d) - Math.abs(b.diagonal - d)).slice(0, 3);
  const all = [{ src: ours, ours: true }, ...near];
  let seed = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 11);
  const order = all.map((x) => ({ x, k: (seed = (seed * 1103515245 + 12345) >>> 0) })).sort((a, b) => a.k - b.k).map((o) => o.x);
  // one camera for all four, about the largest, reaching round every one of them: the same scale for each
  const frames = order.map((o) => framing(o.src, [POSE]));
  const mid = frames.reduce((a, b) => (b.far > a.far ? b : a)).mid;
  const within = { mid, far: Math.max(...frames.map((f) => Math.hypot(...f.mid.map((v, k) => v - mid[k])) + f.far)) };
  const shots = order.map((o) => render(o.src, { ...POSE, view: "orbit", yaw: 35, pitch: 20, width: 320, height: 320, within }));
  savePng(join(dir, "lineup.png"), tile(shots, 4, order.map((_, i) => "ABCD"[i])));
  return { letter: "ABCD"[order.findIndex((o) => o.ours)], others: near.map((x) => x.file) };
}

// ── judging ────────────────────────────────────────────────────────────────

const ITEMS = {
  model: ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8"],
  weapon: ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "W1"],
  enemy: ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "C1", "C2"],
  map: ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9"],
  texture: ["T1", "T2", "T3", "T4", "T5", "T6"],
  sound: ["S1", "S2", "S3", "S4", "S5"],
  sprite: ["R1", "R2", "R3", "R4", "R5"],
  mod: ["O1", "O2", "O3", "O4"],
};
const MUST = {
  model: ["M1", "M2", "M3", "M4", "M6", "M8"],
  weapon: ["M1", "M2", "M3", "M4", "M6", "M8", "W1"],
  enemy: ["M1", "M2", "M3", "M4", "M6", "M8", "C1", "C2"],
  map: ["P1", "P2", "P3", "P4", "P8", "P9"],
  texture: ["T1", "T2", "T3", "T5", "T6"],
  sound: ["S1", "S2", "S3", "S5"],
  sprite: ["R1", "R2", "R3", "R4", "R5"],
  mod: ["O1", "O2", "O3"],
};
const band = (ok, near) => (ok ? 2 : near ? 1 : 0);

/** One judge's scores held to the caps; passed by the rubric's "Passing". */
async function judge(kind, label, dir, pictures, measured, caps = {}) {
  const items = ITEMS[kind];
  const failed = failedByMeasure(caps, MUST[kind]);
  if (failed.length) return { kind, label, measured, caps, passes: false, failedByMeasure: failed, total: 0, of: 2 * items.length };
  // DRY=1: the harness alone, every judge's score a 1, to test the pictures and measures with no agent run
  const r = process.env.DRY ? { answer: JSON.stringify(Object.fromEntries(items.map((i) => [i, { score: 1, reason: "dry run" }]))) } : await runJudge({
    read: dir,
    hours: 0.5,
    prompt: `You are an independent judge of one asset of a small mod made for Half-Life from a written brief. Judge it strictly by the rubric below: the "Original creation" section, with its kind's table read against what the brief asks, and "Passing" and "Keeping the judge honest". A measured item may score lower than its measurement allows, never higher.

The asset: ${label}.

The pictures: ${pictures}. Look at every picture closely.

The measurements:
${JSON.stringify(measured, null, 1)}

Score every item, ${items.join(", ")}, 0, 1 or 2, each with a reason. Reply with JSON alone: {${items.map((i) => `"${i}": { "score": 0, "reason": "..." }`).join(", ")}}

THE BRIEF
${BRIEF}

THE RUBRIC
${RUBRIC}`,
  });
  let judged = null;
  try {
    judged = JSON.parse(r.answer.slice(r.answer.indexOf("{"), r.answer.lastIndexOf("}") + 1));
  } catch {}
  if (!judged) return { kind, label, error: "the judge's answer was not JSON", answer: r.answer, ended: r.ended };
  const scores = {};
  for (const item of items) {
    const given = Math.max(0, Math.min(2, Number(judged[item]?.score ?? 0)));
    scores[item] = { judge: given, cap: caps[item] ?? null, score: Math.min(given, caps[item] ?? 2), reason: judged[item]?.reason ?? "" };
  }
  const total = items.reduce((t, i) => t + scores[i].score, 0);
  const passes = MUST[kind].every((i) => scores[i].score === 2) && total >= 0.85 * 2 * items.length;
  return { kind, label, measured, caps, scores, total, of: 2 * items.length, passes };
}

/** How many triangles a model's first body has. */
const trianglesOf = (src) => smak.readMdl(src).bodyparts.reduce((n, b) => n + (b.models[0]?.meshes.reduce((m, x) => m + x.numtris, 0) ?? 0), 0);
/** Half-Life's props by size: the median triangles a prop of this size has (docs/SPEC.md, "How many triangles"). */
const PROP_MEDIAN = [[16, 20], [32, 51], [64, 62], [128, 105], [Infinity, 288]];
/** A size the brief gives against the model's: the share it is off by, at the worst of those given. */
function sizeOff(asked, size) {
  const offs = [];
  if (asked?.high) offs.push(Math.abs(size[2] - asked.high) / asked.high);
  if (asked?.across) offs.push(Math.abs(Math.max(size[0], size[1]) - asked.across) / asked.across);
  if (asked?.long) offs.push(Math.abs(Math.max(...size) - asked.long) / asked.long);
  return offs.length ? round(Math.max(...offs), 3) : null;
}

async function judgeModelAsset(kind, label, src, dir, { asked, list, extra = {}, extraPictures = "" }) {
  mkdirSync(dir, { recursive: true });
  const pictures = picturesOf(src, { size: 384 });
  savePng(join(dir, "sides.png"), tile(pictures.map((p) => p.picture), 5, pictures.map((p) => p.name)));
  const { size } = boxOf(src);
  const line = lineupOf(src, list, dir, label);
  const triangles = trianglesOf(src);
  const median = PROP_MEDIAN.find(([under]) => Math.hypot(...size) < under)[1];
  const off = sizeOff(asked, size);
  const check = smak.check(src);
  const measured = { size: size.map((v) => round(v)), sizeAsked: asked ?? null, sizeOff: off, triangles, ...(kind === "model" ? { halfLifeMedianOfThisSize: median } : {}), checkErrors: check.errors, lineup: `ours is one of A to D in lineup.png beside ${line.others.join(", ")}: the judge does not know which`, ...extra.measured };
  const caps = { M2: off === null ? 2 : band(off <= 0.15, off <= 0.3), M8: check.errors.length ? 0 : kind === "model" && triangles > 2 * median ? 1 : 2, ...extra.caps };
  return judge(kind, label, dir, `${dir}/sides.png (ten views at one scale), ${dir}/lineup.png (four models at one scale: one is this mod's, three are Half-Life's own of its size; M6 asks whether a player would take this mod's for one of the game's)${extraPictures}`, measured, caps);
}

async function judgeAll(which) {
  const made = which === "decoy" ? join(ROOT, "decoy") : join(ROOT, "made");
  const out = join(ROOT, "judge", which);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const has = (f) => existsSync(join(made, f));
  const results = [];
  const jobs = [];
  const props = gameProps();

  // props
  for (const p of ASSETS.props)
    jobs.push(async () => (has(p.file) ? judgeModelAsset("model", `${p.file}: ${p.what}`, readModel(join(made, p.file)), join(out, basename(p.file, ".mdl")), { asked: p.size, list: props }) : { kind: "model", label: p.file, missing: true, passes: false }));
  // the weapon: measured on w_, seen in all three
  jobs.push(async () => {
    if (!WEAPON_FILES.every(has)) return { kind: "weapon", label: "the wrench", missing: true, passes: false };
    const dir = join(out, "weapon");
    mkdirSync(dir, { recursive: true });
    const v = readModel(join(made, WEAPON_FILES[0]));
    const attack = sequencesIndex(v, /attack|hit|swing/i);
    savePng(join(dir, "first-person.png"), besides([render(v, { seq: 0, frame: 0, view: "first", width: 480, height: 360 }), render(readModel(join(GAME, WEAPON_FILES[0])), { seq: 0, frame: 0, view: "first", width: 480, height: 360 })]));
    savePng(join(dir, "attack.png"), strip(v, { seq: attack, count: 8, cols: 4, view: "first", width: 240, height: 180 }));
    savePng(join(dir, "in-hand.png"), render(readModel(join(made, WEAPON_FILES[1])), { seq: 0, frame: 0, yaw: 35, pitch: 20, width: 384, height: 384 }));
    const weapons = readdirSync(join(GAME, "models")).filter((f) => /^w_.*\.mdl$/.test(f) && !/t\.mdl$/.test(f)).map((f) => ({ file: `models/${f}`, src: readModel(join(GAME, "models", f)) })).map((x) => ({ ...x, diagonal: Math.hypot(...boxOf(x.src).size) }));
    return judgeModelAsset("weapon", `the wrench (${WEAPON_FILES.join(", ")}): ${ASSETS.weapon.what}`, readModel(join(made, WEAPON_FILES[2])), dir, { asked: { long: ASSETS.weapon.long }, list: weapons, extraPictures: `, ${dir}/first-person.png (this mod's first-person view left, the game's crowbar right, for where it sits), ${dir}/attack.png (its attack frame by frame) and ${dir}/in-hand.png (the model another player holds); sides.png and lineup.png show the w_ model` });
  });
  // the enemy: its contract with the game's headcrab, and its motion
  jobs.push(async () => {
    if (!has(ASSETS.enemy.file)) return { kind: "enemy", label: "the crawler", missing: true, passes: false };
    const dir = join(out, "enemy");
    mkdirSync(dir, { recursive: true });
    const src = readModel(join(made, ASSETS.enemy.file));
    const faults = compareContract(contractOf(readModel(join(GAME, ASSETS.enemy.like))), contractOf(src)).faults;
    for (const [name, pattern] of [["run", /run|walk/i], ["attack", /attack|jump/i]]) savePng(join(dir, `${name}.png`), strip(src, { seq: sequencesIndex(src, pattern), count: 8, cols: 4, view: "side", ground: true, width: 192, height: 192 }));
    const creatures = ["headcrab", "babycrab", "leech", "roach", "snark", "chumtoad", "houndeye", "bullsquid"].filter((n) => existsSync(join(GAME, "models", `${n}.mdl`))).map((n) => ({ file: `models/${n}.mdl`, src: readModel(join(GAME, "models", `${n}.mdl`)) })).map((x) => ({ ...x, diagonal: Math.hypot(...boxOf(x.src).size) }));
    return judgeModelAsset("enemy", `the crawler (${ASSETS.enemy.file}): ${ASSETS.enemy.what}`, src, dir, { list: creatures.filter((c) => c.file !== ASSETS.enemy.like), extra: { measured: { contract: faults.length ? faults : "keeps the headcrab's bones, animations, attachments and bodyparts" }, caps: { C2: faults.length ? 0 : 2 } }, extraPictures: `, ${dir}/run.png and ${dir}/attack.png (its run and its attack, frame by frame from the side, the floor a line)` });
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
      savePng(join(dir, "views.png"), maps.viewsOf(bsp, { count: 8, folders, models: true }));
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
        notReached: reach.unreached.map((e) => `${e.classname} ${e.number}`),
        reachWarnings: reach.warnings.slice(0, 8),
        changelevels: ents.filter((e) => e.classname === "trigger_changelevel").map((e) => ({ map: e.map, landmark: e.landmark })),
        landmarks: ents.filter((e) => e.classname === "info_landmark").map((e) => e.targetname),
        itemsAsked: m.items ?? [],
        itemsFound: (m.items ?? []).map((c) => `${c}: ${classes.filter((x) => x === c).length}`),
      };
      const big = Math.max(...size);
      const asked = m.size ? Math.max(...m.size) : m.long ?? null;
      const sizeOk = asked ? Math.abs(big - asked) / asked : null;
      const caps = { P2: sizeOk === null ? 2 : band(sizeOk <= 0.25, sizeOk <= 0.5), P8: check.errors.length ? 0 : reach.unreached.length ? 1 : 2 };
      return judge("map", `${file}: ${m.what}`, dir, `${dir}/plan.png (from above: floor heights, every entity marked and listed) and ${dir}/views.png (from inside, at a player's eye, with its models)`, measured, caps);
    });
  // textures: every one flat, its fine detail against Half-Life's
  jobs.push(async () => {
    if (!has(ASSETS.wad.file)) return { kind: "texture", label: ASSETS.wad.file, missing: true, passes: false };
    const dir = join(out, "textures");
    mkdirSync(dir, { recursive: true });
    const textures = maps.readWad(readFileSync(join(made, ASSETS.wad.file))).textures;
    const flat = (t) => {
      const rgba = new Uint8Array(t.width * t.height * 4);
      for (let i = 0; i < t.width * t.height; i++) rgba.set([...t.palette.subarray(t.pixels[i] * 3, t.pixels[i] * 3 + 3), 255], i * 4);
      return { width: t.width, height: t.height, rgba };
    };
    const scaled = (p) => {
      const k = Math.max(1, Math.floor(192 / Math.max(p.width, p.height)));
      const rgba = new Uint8Array(192 * 192 * 4).fill(30);
      for (let y = 0; y < Math.min(192, p.height * k); y++) for (let x = 0; x < Math.min(192, p.width * k); x++) rgba.set(p.rgba.subarray((((y / k) | 0) * p.width + ((x / k) | 0)) * 4, (((y / k) | 0) * p.width + ((x / k) | 0)) * 4 + 4), (y * 192 + x) * 4);
      return { width: 192, height: 192, rgba };
    };
    savePng(join(dir, "textures.png"), tile(textures.map((t) => scaled(flat(t))), 6, textures.map((t) => `${t.name} ${t.width}x${t.height}`)));
    const detail = (t) => {
      const L = (x, y) => {
        const c = t.pixels[((y + t.height) % t.height) * t.width + ((x + t.width) % t.width)] * 3;
        return 0.3 * t.palette[c] + 0.59 * t.palette[c + 1] + 0.11 * t.palette[c + 2];
      };
      let d = 0;
      for (let y = 0; y < t.height; y++) for (let x = 0; x < t.width; x++) d += Math.abs(4 * L(x, y) - L(x - 1, y) - L(x + 1, y) - L(x, y - 1) - L(x, y + 1));
      return round(d / (t.width * t.height));
    };
    const valve = maps.readWad(readFileSync(join(GAME, "halflife.wad"))).textures.map(detail).sort((a, b) => a - b);
    const quartile = (q) => valve[Math.floor(q * (valve.length - 1))];
    const measured = { count: textures.length, least: ASSETS.wad.least, textures: textures.map((t) => ({ name: t.name, size: [t.width, t.height], detail: detail(t) })), halfLifeDetail: { q1: quartile(0.25), median: quartile(0.5), q3: quartile(0.75) } };
    const caps = { T6: textures.length >= ASSETS.wad.least ? 2 : 1 };
    return judge("texture", `${ASSETS.wad.file}, the mod's textures, judged as one set: ${ASSETS.wad.what}`, dir, `${dir}/textures.png (every texture flat, at a whole-number scale)`, measured, caps);
  });
  // sprites
  for (const s of ASSETS.sprites)
    jobs.push(async () => {
      if (!has(s.file)) return { kind: "sprite", label: s.file, missing: true, passes: false };
      const dir = join(out, basename(s.file, ".spr"));
      mkdirSync(dir, { recursive: true });
      const spr = maps.readSpr(readFileSync(join(made, s.file)));
      savePng(join(dir, "frames.png"), sheetOf(spr, { cols: 8, cell: 128 }));
      const m = measureSprite(spr, { loop: spr.frames.length > 2 });
      const against = SPRITE_CLASSES[s.class] ? againstClass(m, s.class) : null;
      return judge("sprite", `${s.file}: ${s.what}`, dir, `${dir}/frames.png (its frames as the engine blends them, numbered)`, { size: [spr.width, spr.height], frames: spr.frames.length, type: spr.type, format: spr.format, measures: m, class: s.class, againstClass: against }, {});
    });
  // sounds: against their class's range, or the game's own sound they stand in for
  for (const s of ASSETS.sounds)
    jobs.push(async () => {
      if (!has(s.file)) return { kind: "sound", label: s.file, missing: true, passes: false };
      const dir = join(out, basename(s.file, ".wav"));
      mkdirSync(dir, { recursive: true });
      const wav = A.readWav(readFileSync(join(made, s.file)));
      const f = A.features(wav);
      const loop = Boolean(wav.cue?.length);
      const shown = [{ name: s.file, x: wav.x, rate: wav.rate, loop: loop ? 0 : undefined }];
      let against;
      if (s.class) against = A.scoreAgainst(f, s.class);
      else {
        const game = A.readWav(readFileSync(join(GAME, s.like)));
        shown.push({ name: `the game's own ${s.like}`, x: game.x, rate: game.rate });
        const g = A.features(game);
        against = { gameOwn: { length: round(g.length, 3), centroid: Math.round(g.centroid), t20: round(g.t20, 3), bands: g.bands } };
      }
      savePng(join(dir, "sound.png"), A.soundPicture(shown, { width: 960 }));
      const checks = A.checks(wav, { loop });
      return judge("sound", `${s.file}: ${s.what}`, dir, `${dir}/sound.png (its waveform over its spectrogram${s.class ? "" : ", above the game's own sound it stands in for"})`, { features: f, class: s.class ?? null, against, engineFaults: checks.faults }, { S5: checks.faults.length ? 0 : 2 });
    });
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
  results.push(await judge("mod", "the mod as a whole", dir, `${dir}/everything.png (every prop, the crawler, the wrench and a view of each map, side by side)`, { missing, failedChecks, chain, shown }, caps));
  for (const r of results) writeFileSync(join(out, `${(r.label ?? r.kind).replace(/[^\w.-]+/g, "_").slice(0, 60)}.json`), `${JSON.stringify(r, null, 1)}\n`);
  scores(which, results);
}

/** A view from the map's first place to start, or from its middle. */
function firstView(file) {
  const bsp = maps.readBsp(readFileSync(file));
  const start = bsp.entities.map((e) => Object.fromEntries(e)).find((e) => /info_player_(start|deathmatch)/.test(e.classname));
  if (start?.origin) return { from: start.origin.split(" ").map(Number).map((v, k) => (k === 2 ? v + 28 : v)), yaw: Number((start.angles ?? "0 0 0").split(" ")[1]) || 0 };
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
} else console.log("node examples/reproduce/original.mjs make [--again] | decoy | judge [made|decoy]");
