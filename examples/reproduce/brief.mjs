// An asset judged against a written brief, not an original (rubric.md, "Original creation" and its amendment for
// the brief legs): the original mod's assets and every brief leg's are measured and judged here.
//
//   BRIEFS, briefPrompt({ brief, replaces, make, verdict, accept })   -> the requests, and a brief leg's maker prompt
//   ownOfKind(kind)                                     -> Half-Life's own models of a kind, with their size
//   judgeAgainstBrief(kind, label, dir, pictures, measured, caps, { brief, what })
//   judgeModelAgainstBrief(kind, label, src, dir, { brief, what, asked, list, extra, extraPictures, sizeFrom })
//   judgeSpriteAgainstBrief, judgeSoundAgainstBrief, judgeTexturesAgainstBrief (as one set, or each texture alone)
//   weaponSizeIn(src)                                   -> a weapon's size in its first-person model, hands left out
import { readFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { join, basename } from "node:path";
import { HERE, GAME, POSE, readModel, boxOf, picturesOf, savePng, flatOf, scaled, onCanvas } from "./lib.mjs";
import { runJudge, failedByMeasure } from "./agents.mjs";
import { itemsOf, settle, combine, askScores, dryAnswer, band, MODEL_GUIDE } from "./scoring.mjs";
import * as smak from "../../src/index.mjs";
import { tile, render, framing } from "../../src/render.mjs";
import { PROP_TRIANGLES, HELD_SCALE } from "../../src/spec/model.mjs";
import { measureSprite, againstClass, SPRITE_CLASSES } from "../../src/sprite/measure.mjs";
import { sheetOf } from "../../src/sprite/draw.mjs";

const A = smak.audio;

const RUBRIC = readFileSync(join(HERE, "rubric.md"), "utf8");
/** Every brief leg's requests, one file for every kind (briefs.json). */
export const BRIEFS = JSON.parse(readFileSync(join(HERE, "briefs.json"), "utf8"));

/**
 * A brief leg's maker prompt: the modder's request in their words, what it takes the place of, how this kind is
 * made (`make`: the spec and the files it is fitted into), and who decides (`verdict`). The same for every kind.
 */
export function briefPrompt({ brief, replaces, make, verdict = "look at it in the game beside Half-Life's own", accept = false }) {
  return `A modder asks you: "${brief}". It is for their GoldSrc mod, in the place of the game's own ${replaces}. ${make} They will ${verdict} and decide whether it is at least as good as the game's own. Build until the build says OK, and tell them what you made and how.${accept ? " For this test the person accepts the licences of the local generators, non-commercial ones included." : ""}`;
}
const round = (v, k = 1) => Math.round(v * 10 ** k) / 10 ** k;
/** The rubric's table each kind of asset is scored on. */
const TABLE = { model: "model", weapon: "weapon", character: "character", enemy: "contracted", player: "contracted", map: "map", texture: "texture", sound: "sound", sprite: "sprite", mod: "mod" };
const MODELS = ["model", "weapon", "character", "enemy", "player"];

// ── Half-Life's own, to set beside ─────────────────────────────────────────

const CREATURES = ["headcrab", "babycrab", "leech", "roach", "snark", "chumtoad", "houndeye", "bullsquid"];
const PEOPLE = ["barney", "scientist", "gman", "hgrunt", "zombie", "islave", "hassassin", "otis"];
/** Half-Life's weapons, by their world models: an ammunition box or a pickup is not one of them. */
const WEAPONS = ["crowbar", "9mmhandgun", "357", "9mmar", "shotgun", "crossbow", "rpg", "gauss", "egon", "hgun", "grenade", "satchel", "sqknest"];
/**
 * Models that are not a thing standing in the world, by name (the game's models carry no kind): pieces flung off a
 * break, templates and tests, spent shells, sprite holders, projectiles in flight, a body's bones, effects, aircraft.
 */
const NOT_PROPS = /gib|template|test|shell|shrapnel|sprites|bolt|hornet|rocket|spit|hvr|^models\/grenade|bones|pelvis|rib|hair|skeleton|bubbles|teleport|protozoa|osprey|apache|stealth|sphere/i;
/** An animation a prop has: none, or idle (activity 0 or 1). A creature's or a person's walk, run or attack is not. */
const PROP_ACTIVITY = new Set([0, 1]);
/**
 * Half-Life's own models of a kind, each with its size: props (what stands in the world, pickups too; no
 * creature, no person, no gibs), weapons (their world models), creatures and people; or the files named, read
 * from `root` (`files`: a mod's stock players). The line-ups pick from these. Side files (<name>t.mdl,
 * <name>01.mdl) are never models.
 */
export function ownOfKind(kind, root = GAME, files) {
  const read = (file) => {
    try {
      const src = readModel(join(root, file));
      return { file, src, diagonal: Math.hypot(...boxOf(src).size) };
    } catch {
      return null;
    }
  };
  const models = join(root, "models");
  const named = (names) => names.map((n) => `models/${n}.mdl`).filter((f) => existsSync(join(root, f)));
  if (files) return files.filter((f) => existsSync(join(root, f))).map(read).filter(Boolean);
  if (kind === "model")
    return smak.modelsIn(models)
      .map((f) => `models/${basename(f)}`)
      .filter((f) => !/^models\/(v_|p_)/i.test(f) && !NOT_PROPS.test(f))
      .map(read)
      .filter((x) => x && smak.sequences(x.src).every((q) => PROP_ACTIVITY.has(q.activity)));
  if (kind === "weapon") return named(WEAPONS.map((n) => `w_${n}`)).map(read).filter(Boolean);
  if (kind === "enemy") return named(CREATURES).map(read).filter(Boolean);
  if (kind === "character") return named([...PEOPLE, ...CREATURES]).map(read).filter(Boolean);
  throw new Error(`ownOfKind: no models of kind ${kind}`);
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

/** How many times the line-up is put to a fresh judge, and how many of those picks of ours make M6 a 1. */
const DETECT_READINGS = 3;
const DETECT_CAUGHT = 2;

/**
 * M6 as a test a player would sit: the line-up of four, three of them Valve's own, put to a fresh judge
 * DETECT_READINGS times, "which one was not made by Valve?". Picked DETECT_CAUGHT times or more, it is told apart
 * (M6 at most 1); else it passes for one of the game's. A Valve original is picked about a quarter of the time,
 * and passes about 84 rounds of 100 (rubric.md, 2026-10-16). Returns { letter, picks, caught }.
 */
async function detect(dir, letter) {
  if (process.env.DRY) return { letter, picks: [], caught: false };
  // a folder of the line-up alone: the asset's own pictures beside it would tell which one it is
  const alone = join(dir, "detect");
  mkdirSync(alone, { recursive: true });
  copyFileSync(join(dir, "lineup.png"), join(alone, "lineup.png"));
  const ask = `${alone}/lineup.png shows four models, A to D, drawn by one camera at one scale. Three were made by Valve's artists for Half-Life; one was not. Which one was not? Look closely at all four. Reply with the one letter alone.`;
  const answers = await Promise.all(Array.from({ length: DETECT_READINGS }, (_, draw) => runJudge({ read: alone, hours: 0.25, prompt: ask, draw })));
  const picks = answers.map((r) => ((r.answer ?? "").match(/\b([A-D])\b/) ?? [])[1] ?? null);
  return { letter, picks, caught: picks.filter((p) => p === letter).length >= DETECT_CAUGHT };
}

// ── judging ────────────────────────────────────────────────────────────────

/**
 * One asset's scores against its brief, held to the caps; passed by the rubric's "Passing". A model is read twice
 * and each item takes the better reading (rubric.md, "two readings"), and its judge is told how to find parts and
 * tell paint from shape (MODEL_GUIDE). `what`: what the asset is, for the judge's first line.
 */
export async function judgeAgainstBrief(kind, label, dir, pictures, measured, caps, { brief, what = "one asset made for Half-Life from a written brief" }) {
  const table = TABLE[kind];
  const { items, must } = itemsOf(table);
  const failed = failedByMeasure(caps, must);
  if (failed.length) return { kind, label, measured, caps, passes: false, failedByMeasure: failed, total: 0, of: 2 * items.length };
  const model = MODELS.includes(kind);
  const prompt = `You are an independent judge of ${what}. Judge it strictly by the rubric below: the "Original creation" section and its amendments, with its kind's table read against what the brief asks, and "Passing" and "Keeping the judge honest". A measured item may score lower than its measurement allows, never higher.

The asset: ${label}.

The pictures: ${pictures}. Look at every picture closely.

The measurements:
${JSON.stringify(measured, null, 1)}
${model ? `\n${MODEL_GUIDE("what the brief asks")}\n\nM6 is measured apart, by the line-up put to other judges (which of the four was not made by Valve), and that caps it: score M6 2 here.\n` : ""}
${askScores(items)}

THE BRIEF
${brief}

THE RUBRIC
${RUBRIC}`;
  // DRY=1: the harness alone, every judge's score a 1, to test the pictures and measures with no agent run
  const readings = process.env.DRY ? [{ answer: dryAnswer(items) }] : await Promise.all((model ? [prompt, `${prompt}\n\n(Second reading.)`] : [prompt]).map((p) => runJudge({ read: dir, hours: 0.5, prompt: p })));
  const judged = combine(readings.map((r) => r.answer), "better");
  if (!judged) return { kind, label, error: "the judge's answer was not JSON", answer: readings[0].answer, ended: readings[0].ended };
  return { kind, label, measured, caps, ...settle(table, judged, caps) };
}

/** How many triangles a model's first body has. */
const trianglesOf = (src) => smak.readMdl(src).bodyparts.reduce((n, b) => n + (b.models[0]?.meshes.reduce((m, x) => m + x.numtris, 0) ?? 0), 0);
/** A size the brief gives against the model's: the share it is off by, at the worst of those given. */
function sizeOff(asked, size) {
  const offs = [];
  if (asked?.high) offs.push(Math.abs(size[2] - asked.high) / asked.high);
  if (asked?.across) offs.push(Math.abs(Math.max(size[0], size[1]) - asked.across) / asked.across);
  if (asked?.long) offs.push(Math.abs(Math.max(...size) - asked.long) / asked.long);
  return offs.length ? round(Math.max(...offs), 3) : null;
}

/**
 * A weapon's real length, read off the model another player holds (p_): the file Valve draws nearest life size,
 * at HELD_SCALE.p of the real weapon (research/weapon-size.md; Steven, 2026-10-16: "can't you measure both").
 * The first-person model is drawn with the hands and the camera's nearness, and its first frame may hold pieces
 * apart from it (the .357's reload).
 */
export function weaponSizeIn(p) {
  return boxOf(p).size.map((v) => v / HELD_SCALE.p);
}

/** The median, third quartile and most of the triangles a list of models spends. */
function spentBy(list) {
  const all = list.map((x) => trianglesOf(x.src)).sort((a, b) => a - b);
  return { median: all[Math.floor((all.length - 1) / 2)], q3: all[Math.floor(0.75 * (all.length - 1))], most: all.at(-1) };
}

/**
 * A model judged against its brief: its sides, a line-up beside Half-Life's own of its kind, its size and triangles
 * measured. `byKind`: a model that is no prop (a creature built as a model) is held to the triangles of `list`.
 * `replaces`: the game's own model it takes the place of, whose triangles count among Valve's most.
 */
export async function judgeModelAgainstBrief(kind, label, src, dir, { brief, what, asked, list, extra = {}, extraPictures = "", sizeFrom, byKind = false, replaces }) {
  mkdirSync(dir, { recursive: true });
  const pictures = picturesOf(src, { size: 384 });
  savePng(join(dir, "sides.png"), tile(pictures.map((p) => p.picture), 5, pictures.map((p) => p.name)));
  const size = sizeFrom ?? boxOf(src).size;
  const line = lineupOf(src, list, dir, label);
  const told = await detect(dir, line.letter);
  const triangles = trianglesOf(src);
  // what Half-Life's own of its kind spend: a prop by its size (PROP_TRIANGLES, measured over the game's props); any
  // other kind (a weapon, a creature, a person) by the models it is lined up from
  const spent = kind === "model" && !byKind ? PROP_TRIANGLES.find((b) => Math.hypot(...size) < b.under) : spentBy(list);
  const { median, q3 } = spent;
  // the game's own in the place it takes (`replaces`) is Valve's of its kind too: what it spends is never too much
  const most = Math.max(spent.most, replaces ? trianglesOf(replaces) : 0);
  const off = sizeOff(asked, size);
  const check = smak.check(src);
  const measured = { size: size.map((v) => round(v)), sizeAsked: asked ?? null, sizeOff: off, triangles, halfLifeMedianOfItsKind: median, halfLifeThreeQuartersUnder: q3, halfLifeMost: most, checkErrors: check.errors, lineup: `the asset is one of A to D in lineup.png beside ${line.others.join(", ")}`, lineupTest: `asked ${DETECT_READINGS} times which of the four was not made by Valve, judges picked ${told.picks.join(", ") || "none"}; the asset is ${told.letter}: ${told.caught ? "told apart" : "passed for one of the game's"}`, ...extra.measured };
  const caps = { M2: off === null ? 2 : band(off, 0.15, 0.3, true), // over the most Valve spends on its kind and size: none of Valve's own is (rubric.md, 2026-10-16 amendment)
    M8: check.errors.length ? 0 : triangles > most ? 1 : 2,
    M6: told.caught ? 1 : 2, ...extra.caps };
  return judgeAgainstBrief(kind, label, dir, `${dir}/sides.png (ten views at one scale), ${dir}/lineup.png (four models at one scale: one is the asset, three are Half-Life's own of its size; M6 is measured on it apart)${extraPictures}`, measured, caps, { brief, what });
}

/** A sprite judged against its brief: its frames as the engine blends them, its measures against Half-Life's own of its class (R2 to R4). */
export async function judgeSpriteAgainstBrief(label, bytes, dir, { brief, what, class: kind, caps = {}, measured = {} }) {
  mkdirSync(dir, { recursive: true });
  const spr = smak.maps.readSpr(bytes);
  savePng(join(dir, "frames.png"), sheetOf(spr, { cols: 8, cell: 128 }));
  const m = measureSprite(spr, { loop: spr.frames.length > 2 });
  const against = SPRITE_CLASSES[kind] ? againstClass(m, kind) : null;
  return judgeAgainstBrief("sprite", label, dir, `${dir}/frames.png (its frames as the engine blends them, numbered)`, { size: [spr.width, spr.height], frames: spr.frames.length, type: spr.type, format: spr.format, measures: m, class: kind, againstClass: against, ...measured }, caps, { brief, what });
}

/** A sound judged against its brief: its picture, its features against its class's range or the game's own sound it stands in for. */
export async function judgeSoundAgainstBrief(label, bytes, dir, { brief, what, class: kind, like }) {
  mkdirSync(dir, { recursive: true });
  const wav = A.readWav(bytes);
  const f = A.features(wav);
  const loop = Boolean(wav.cue?.length);
  const shown = [{ name: label, x: wav.x, rate: wav.rate, loop: loop ? 0 : undefined }];
  let against;
  if (kind) against = A.scoreAgainst(f, kind);
  else {
    const game = A.readWav(readFileSync(join(GAME, like)));
    shown.push({ name: `the game's own ${like}`, x: game.x, rate: game.rate });
    const g = A.features(game);
    against = { gameOwn: { length: round(g.length, 3), centroid: Math.round(g.centroid), t20: round(g.t20, 3), bands: g.bands } };
  }
  savePng(join(dir, "sound.png"), A.soundPicture(shown, { width: 960 }));
  const checks = A.checks(wav, { loop });
  return judgeAgainstBrief("sound", label, dir, `${dir}/sound.png (its waveform over its spectrogram${kind ? "" : ", above the game's own sound it stands in for"})`, { features: f, class: kind ?? null, against, engineFaults: checks.faults }, { S5: checks.faults.length ? 0 : 2 }, { brief, what });
}

/** A texture's fine detail: the mean of its luminance's Laplacian, wrapped (research/asset-reproduction-failures.md, Table 4). */
export function textureDetail(t) {
  const L = (x, y) => {
    const c = t.pixels[((y + t.height) % t.height) * t.width + ((x + t.width) % t.width)] * 3;
    return 0.3 * t.palette[c] + 0.59 * t.palette[c + 1] + 0.11 * t.palette[c + 2];
  };
  let d = 0;
  for (let y = 0; y < t.height; y++) for (let x = 0; x < t.width; x++) d += Math.abs(4 * L(x, y) - L(x - 1, y) - L(x + 1, y) - L(x, y - 1) - L(x, y + 1));
  return round(d / (t.width * t.height));
}
let valveDetail;
/** Half-Life's own textures' fine detail (halflife.wad): its quartiles, the band a texture's T5 is held to. */
function halfLifeDetail() {
  if (!valveDetail) {
    const all = smak.maps.readWad(readFileSync(join(GAME, "halflife.wad"))).textures.map(textureDetail).sort((a, b) => a - b);
    const quartile = (q) => all[Math.floor(q * (all.length - 1))];
    valveDetail = { q1: quartile(0.25), median: quartile(0.5), q3: quartile(0.75) };
  }
  return valveDetail;
}

/**
 * Textures judged against their brief, each flat at a whole-number scale with its fine detail against Half-Life's
 * own. As one set (the original mod's .wad: T6 held by `least`, how many it asks for), or `each`: a texture's own
 * line of the brief by its name, every one scored and passed alone (T6: its name and size as `sizes` gives them).
 */
export async function judgeTexturesAgainstBrief(label, textures, dir, { brief, what, least, each, sizes = {} }) {
  mkdirSync(dir, { recursive: true });
  savePng(join(dir, "textures.png"), tile(textures.map((t) => onCanvas(scaled(flatOf(t), 192), 192, 192)), 6, textures.map((t) => `${t.name} ${t.width}x${t.height}`)));
  const rows = textures.map((t) => ({ name: t.name, size: [t.width, t.height], detail: textureDetail(t) }));
  const pictures = `${dir}/textures.png (every texture flat, at a whole-number scale)`;
  if (!each) return judgeAgainstBrief("texture", label, dir, pictures, { count: textures.length, least, textures: rows, halfLifeDetail: halfLifeDetail() }, { T6: textures.length >= least ? 2 : 1 }, { brief, what });
  // each texture its own asset: one judge reads the set, each row capped by its own T6 and settled alone
  const { items } = itemsOf("texture");
  const asked = Object.entries(each).map(([name, line]) => ({ name, line, size: sizes[name] ?? null, made: rows.find((r) => r.name.toLowerCase() === name.toLowerCase()) ?? null }));
  const prompt = `You are an independent judge of ${what ?? "textures made for Half-Life from a written brief"}. Judge each texture strictly by the rubric below: the "Original creation" section and its amendments, the Textures table read against its own line of the brief, and "Passing" and "Keeping the judge honest". A measured item may score lower than its measurement allows, never higher.

The textures: ${label}.

The pictures: ${pictures}. Look at every picture closely.

The measurements, texture by texture (line: what the brief asks of it; size: the size it must keep; made: the texture made under that name, its size and fine detail, or null when none was):
${JSON.stringify({ textures: asked, halfLifeDetail: halfLifeDetail() }, null, 1)}

${askScores(items, { each: "texture" })}

THE BRIEF
${brief}

THE RUBRIC
${RUBRIC}`;
  const r = process.env.DRY ? { answer: JSON.stringify(Object.fromEntries(asked.map((a) => [a.name, JSON.parse(dryAnswer(items))]))) } : await runJudge({ read: dir, hours: 1, prompt });
  const judged = combine([r.answer], "better") ?? {};
  const results = asked.map((a) => {
    const caps = { T6: a.made && (!a.size || (a.made.size[0] === a.size[0] && a.made.size[1] === a.size[1])) ? 2 : 0 };
    return { texture: a.name, measured: a, caps, ...settle("texture", judged[a.name], caps) };
  });
  const passed = results.filter((x) => x.passes).length;
  return { kind: "texture", label, textures: results, passed, of: results.length, passes: passed >= 0.8 * results.length, total: passed, error: Object.keys(judged).length ? undefined : "the judge's answer was not JSON" };
}
