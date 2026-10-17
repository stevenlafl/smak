// The judge: for each reproduction, the harness measures it against the original and draws the two from the
// same cameras at the same scale; then a fresh agent, who may read only that folder of pictures and is given
// the rubric and the measurements, scores it. It never sees a spec, an input or the reproducer's answer.
// Decoys (a plain box or room of the original's size, and another subject's reproduction) are judged the
// same way, unknown to the judge, and must fail.
//
//   node examples/reproduce/judge.mjs [subject[:leg] ...] [--again]
//
// <id>/<leg>/judge.json: the measurements, the judge's scores and reasons, the capped scores, the total and
// whether it passes. `identical` (or identical:<id>) judges each original against itself as a control:
// <id>/judge/control-identical.json. <id>/judge/: the pictures the judge saw (kept out of git: Valve's art is in them).
// scores.md: every result in one table.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { HERE, KIT, SUBJECTS, GAME, POSE, SIDES, ANGLES, readModel, boxOf, picturesOf, savePng, besides, silhouettes, colourDifference, fitness } from "./lib.mjs";
import { runAgent, runJudge, JUDGE_MODEL, failedByMeasure } from "./agents.mjs";
import { framing, tile, render } from "../../src/render.mjs";
import { buildModelSpec } from "../../src/spec/model.mjs";
import { maps, unpng } from "../../src/index.mjs";
import { buildMapSpec } from "../../src/spec/map.mjs";
import { findCompilers } from "../../src/maps/compile.mjs";
import { itemsOf, parseAnswer, settle, lowered, combine, askScores, band, PASS_SHARE, MODEL_GUIDE } from "./scoring.mjs";

const words = process.argv.slice(2);
const again = words.includes("--again") && words.splice(words.indexOf("--again"), 1);
const chosen = (id, leg) => !words.length || words.some((w) => w === id || w === `${id}:${leg}`);
const RUBRIC = readFileSync(join(HERE, "rubric.md"), "utf8");
const { items: MODEL_ITEMS, must: MODEL_MUST } = itemsOf("model");
const { items: MAP_ITEMS, must: MAP_MUST } = itemsOf("map");

// ── models ────────────────────────────────────────────────────────────────

/** The measurements of a reproduced model against its original, and what each allows. */
export function measureModel(original, copy) {
  const sil = silhouettes(original, copy);
  const a = boxOf(original);
  const b = boxOf(copy);
  const sizeOff = a.size.map((v, i) => Math.abs(b.size[i] - v) / v);
  const far = Math.max(framing(original, [POSE]).far, framing(copy, [POSE]).far);
  const views = [...SIDES, ...ANGLES];
  const pa = picturesOf(original, { within: { ...framing(original, [POSE]), far }, size: 384, views });
  const pb = picturesOf(copy, { within: { ...framing(copy, [POSE]), far }, size: 384, views });
  const colour = pa.map((p, i) => ({ view: p.name, ...colourDifference(p.picture, pb[i].picture) }));
  // over the views where the two share an outline: a view the original shows nothing in (an open underside
  // seen from below) has no colour to compare, by the rubric's own words ("inside the shared outline")
  const compared = colour.filter((c) => c.deltaE !== null);
  const meanDeltaE = compared.length ? Math.round((10 * compared.reduce((s, c) => s + c.deltaE, 0)) / compared.length) / 10 : 100;
  const fitO = fitness(original);
  const fitC = fitness(copy);
  const measured = {
    silhouetteOverlap: sil,
    size: { original: a.size.map((v) => Math.round(v * 10) / 10), reproduction: b.size.map((v) => Math.round(v * 10) / 10), offShare: sizeOff.map((v) => Math.round(v * 1000) / 1000) },
    colour: { meanDeltaE, byView: colour },
    triangles: { original: fitO.triangles, reproduction: fitC.triangles },
    checkErrors: fitC.errors,
  };
  const caps = {
    M1: band(Math.min(...Object.values(sil)), 0.8, 0.6),
    M2: band(Math.max(...sizeOff), 0.1, 0.25, true),
    M4: band(meanDeltaE, 15, 25, true),
    M8: fitC.errors.length ? 0 : band(fitC.triangles / fitO.triangles, 2, 3, true),
  };
  return { measured, caps, pictures: { original: pa, reproduction: pb } };
}

/** The judge's pictures: each view, the original beside the reproduction. */
/**
 * The control's second form: one pixel of the reproduction's half of each comparison picture lightened a little,
 * at a seeded random place on the thing, so a judge cannot tell the two halves apart by their bytes alone.
 */
function touchOnePixel(dir) {
  let seed = Number(process.env.SMAK_TOUCH_SEED ?? 20261014);
  const random = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
  for (const name of ["compare-sides.png", "compare-angles.png"]) {
    const picture = unpng(readFileSync(join(dir, name)));
    const { width, height, rgba } = picture;
    const ground = [rgba[0], rgba[1], rgba[2]];
    for (let tries = 0; tries < 100000; tries++) {
      // the tiles are pairs two to a row, ORIGINAL | REPRODUCTION: the second and fourth quarters across
      const x = Math.floor(((random() < 0.5 ? 1 : 3) + random()) * (width / 4));
      const y = Math.floor(random() * height);
      const i = (y * width + x) * 4;
      if (Math.abs(rgba[i] - ground[0]) + Math.abs(rgba[i + 1] - ground[1]) + Math.abs(rgba[i + 2] - ground[2]) < 30) continue;
      for (let k = 0; k < 3; k++) rgba[i + k] = Math.min(255, rgba[i + k] + 12);
      savePng(join(dir, name), picture);
      break;
    }
  }
}

export function comparePictures(dir, pictures) {
  mkdirSync(dir, { recursive: true });
  const pairs = pictures.original.map((p, i) => ({ name: p.name, pair: besides([p.picture, pictures.reproduction[i].picture]) }));
  const sides = pairs.filter((p) => SIDES.some(([n]) => n === p.name));
  const angles = pairs.filter((p) => ANGLES.some(([n]) => n === p.name));
  savePng(join(dir, "compare-sides.png"), tile(sides.map((p) => p.pair), 2, sides.map((p) => `${p.name}: ORIGINAL | REPRODUCTION`)));
  savePng(join(dir, "compare-angles.png"), tile(angles.map((p) => p.pair), 2, angles.map((p) => `${p.name}: ORIGINAL | REPRODUCTION`)));
}

/**
 * M6's line-up: which original is this? `files` are the originals shown (the props' subjects and five other props
 * unless told), read from `root`, shuffled by a fixed rule from `seedOf` so a run can be repeated. Returns
 * { picked, right, letters }.
 */
export async function lineup(dir, copy, rightFile, { files = [...SUBJECTS.models.map((m) => m.file), ...SUBJECTS.lineupExtras], root = GAME, seedOf = dir, cols = 5 } = {}) {
  mkdirSync(dir, { recursive: true });
  let seed = [...seedOf].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const order = files.map((f) => ({ f, k: (seed = (seed * 1103515245 + 12345) >>> 0) })).sort((a, b) => a.k - b.k).map((x) => x.f);
  const letters = "ABCDEFGHIJKLMNOP";
  const shots = order.map((f) => {
    const src = readModel(join(root, f));
    return render(src, { ...POSE, view: "orbit", within: framing(src, [POSE]), yaw: 35, pitch: 20, width: 256, height: 256 });
  });
  savePng(join(dir, "lineup.png"), tile(shots, cols, order.map((_, i) => letters[i])));
  savePng(join(dir, "mystery.png"), render(copy, { ...POSE, view: "orbit", within: framing(copy, [POSE]), yaw: 35, pitch: 20, width: 384, height: 384 }));
  // asked again when no letter comes back (a session cut off, or an answer of words): a pick never made caps M6
  let r;
  let picked = null;
  for (let attempt = 1; attempt <= 3 && !picked; attempt++) {
    r = await runAgent({
      model: JUDGE_MODEL,
      read: dir,
      hours: 0.25,
      prompt: `${dir}/mystery.png shows a model made to copy one of the game models in ${dir}/lineup.png (labelled ${letters.slice(0, order.length).split("").join(", ")}).
Which one is it a copy of? Look at both pictures. Reply with the one letter alone.`,
    });
    const answer = (r.answer ?? "").trim();
    picked = (answer.match(/\b([A-P])\b/) ?? answer.match(/^\W*([a-p])\W*$/i) ?? [])[1]?.toUpperCase() ?? null;
  }
  return { picked, right: letters[order.indexOf(rightFile)], letters: Object.fromEntries(order.map((f, i) => [letters[i], f])), answer: (r.answer ?? "").slice(0, 300), ended: r.ended };
}

function judgePrompt(kind, dir, measured) {
  const items = kind === "model" ? MODEL_ITEMS : MAP_ITEMS;
  const pictures =
    kind === "model"
      ? `${dir}/compare-sides.png and ${dir}/compare-angles.png: each view drawn twice by the same camera at the same scale, the ORIGINAL on the left and the REPRODUCTION on the right.`
      : `${dir}/plans.png (from above, the ORIGINAL first, at one scale), ${dir}/storeys-original.png and storeys-reproduction.png, ${dir}/sections.png (the same cut through each, ORIGINAL above), and ${dir}/views.png (from the original's places to start, the same points in both, each pair ORIGINAL | REPRODUCTION).`;
  return `You are an independent judge. A reproduction was made of a game ${kind} by someone who could not open the original's files. Judge how closely it matches, strictly, by the rubric below (the "${kind === "model" ? "Models" : "Maps"}" table, and "Passing" and "Keeping the judge honest").

The pictures: ${pictures} Look at every picture closely before you score.

The harness's measurements (computed from the files; a measured item may score lower than its measurement allows, never higher):
${JSON.stringify(measured, null, 1)}

${kind === "model" ? `${MODEL_GUIDE()}

For M6, judge only whether a player would take it for the original side by side at the size the game shows it; the line-up is run separately.` : ""}

${askScores(items)}

THE RUBRIC
${RUBRIC}`;
}

/** The judge's scores, held to the measurements, totalled and passed or not by the rubric. */
function settleAnswer(kind, answer, caps, extra = {}) {
  const judged = typeof answer === "string" ? parseAnswer(answer) : answer;
  if (!judged) return { error: "the judge's answer was not JSON", answer };
  return settle(kind, judged, lowered(caps, extra));
}

/** The items where Haiku scored under Opus on the calibration: a point lower on some legs, higher on none. */
const STRICT_ON = ["M3", "M4", "M6"];
/**
 * Whether a cheap judge's fail is one Opus might pass: every must-have item short of 2 is one Haiku is strict on,
 * at 1 and held there by the judge, not by a measure; and a point more on each strict item the judge held down
 * would bring the total to the bar. Off when the judge is Opus.
 */
export function closeCall(settled) {
  // off unless asked (SMAK_OPUS_CLOSE_CALLS): Steven's blind reviews of round 7 (reviews/) put the battery at about
  // 95% and the headcrab at 80% ("needs work to be perfect"), and he holds the stricter rubric right; on both Haiku
  // failed and Opus passed. Haiku's verdict stands
  if (!process.env.SMAK_OPUS_CLOSE_CALLS) return false;
  if (JUDGE_MODEL === "opus" || settled.passes || !settled.scores) return false;
  const held = ([item, s]) => STRICT_ON.includes(item) && s.score < 2 && s.judge < (s.cap ?? 2);
  const entries = Object.entries(settled.scores);
  const mustShort = entries.filter(([item, s]) => MODEL_MUST.includes(item) && s.score < 2);
  if (!mustShort.every((e) => held(e) && e[1].score === 1)) return false;
  const raisable = entries.filter(held).length;
  return raisable > 0 && settled.total + raisable >= PASS_SHARE * settled.of;
}


export async function judgeModel(model, leg, copyFile, { decoy } = {}) {
  const original = readModel(join(GAME, model.file));
  const copy = readModel(copyFile);
  const dir = join(HERE, model.id, "judge", decoy ? `decoy-${decoy}` : leg);
  rmSync(dir, { recursive: true, force: true });
  const { measured, caps, pictures } = measureModel(original, copy);
  comparePictures(dir, pictures);
  if (decoy === "identical-touched") touchOnePixel(dir);
  // failed already by a measure of a must-have item: no line-up and no judge are asked (agents.mjs)
  const failed = failedByMeasure(caps, MODEL_MUST);
  if (failed.length) return { subject: model.id, leg: decoy ? `decoy: ${decoy}` : leg, measured, caps, passes: false, failedByMeasure: failed };
  const line = await lineup(join(dir, "lineup"), copy, model.file);
  const prompt = judgePrompt("model", dir, measured);
  const extra = { M6: line.picked === line.right ? 2 : 1 };
  // two readings, each item scored the better of the two: Haiku, given an original against itself, docks surface
  // detail it made up about half the time (rubric, the judge's control) but a fault that is there shows in both
  const readings = await Promise.all([prompt, `${prompt}\n\n(Second reading.)`].map((p) => runJudge({ read: dir, hours: 0.5, prompt: p })));
  let settled = settleAnswer("model", combine(readings.map((r) => r.answer), "better") ?? readings[0].answer, caps, extra);
  settled.readings = readings.map((r) => settleAnswer("model", r.answer, caps, extra)).map((x) => (x.scores ? Object.fromEntries(Object.entries(x.scores).map(([k, v]) => [k, v.judge])) : x.error));
  // a close call on Haiku goes to Opus (calibration-haiku.md: Haiku stood a point under Opus on these, never over)
  if (closeCall(settled)) {
    const second = await runJudge({ read: dir, hours: 0.5, prompt, model: "opus" });
    settled = { ...settleAnswer("model", second.answer, caps, extra), first: { model: JUDGE_MODEL, total: settled.total, passes: settled.passes, scores: settled.scores }, judgedBy: "opus" };
  }
  return { subject: model.id, leg: decoy ? `decoy: ${decoy}` : leg, measured, caps, lineup: line, ...settled };
}

/** A plain box the size of the original: the decoy that must fail. */
function boxDecoy(model) {
  const { size } = boxOf(readModel(join(GAME, model.file)));
  const { mdl } = buildModelSpec({ spec: "smak.model/1", name: "decoy.mdl", kind: "prop", parts: [{ id: "box", kind: "box", size: size.map((v) => Math.max(v, 0.5)), material: { base: "paint", tone: [0.5, 0.5, 0.5] } }] });
  const file = join(HERE, model.id, "judge", "decoy-box.mdl");
  mkdirSync(join(HERE, model.id, "judge"), { recursive: true });
  writeFileSync(file, mdl);
  return file;
}

// ── maps ──────────────────────────────────────────────────────────────────

/** A compiled map's entities as objects: { classname, origin: [x, y, z], ...keys }. */
export const entitiesOf = (bytes) =>
  maps.readBsp(bytes).entities.map((pairs) => {
    const e = Object.fromEntries(pairs);
    if (e.origin) e.origin = e.origin.split(/\s+/).map(Number);
    return e;
  });

const GAMEPLAY = /^(info_player_|weapon_|ammo_|item_|func_door|func_plat|func_train|func_button|func_rot_button|func_tracktrain|trigger_teleport|trigger_push|func_ladder|func_breakable|func_pushable)/;

/**
 * The floor a player walks, as cells of 16: Map "x,y" -> [heights]. `every`: every floor a player fits on, walked
 * to from the places to start or not (a campaign map's walk is cut short by what its scripts open: c1a2's covers
 * 1,667 cells of the 6,000 a player fits on, research/map-geometry.md).
 */
export function floorOf(bsp, { every = false } = {}) {
  const read = maps.readBsp(bsp);
  const r = maps.reachOf(read);
  const at = every ? r.stands : r.walked;
  const { mins, maxs } = read.models[0];
  const [x0, y0, x1, y1] = [mins[0], mins[1], maxs[0], maxs[1]];
  const cells = new Map();
  for (let x = Math.floor(x0 / 16) * 16; x <= x1; x += 16)
    for (let y = Math.floor(y0 / 16) * 16; y <= y1; y += 16) {
      const heights = [];
      let under;
      for (let k = 0; k < 6; k++) {
        const h = at(x + 8, y + 8, under);
        if (h === null || h === undefined) break;
        heights.push(h);
        under = h - 40;
      }
      if (heights.length) cells.set(`${x},${y}`, heights);
    }
  return { cells, reach: r };
}

/** A map whose standable floor is this share or more under or over another floor is held on every floor. */
const MULTI_STOREY = 0.1;

/** The overlap of two walked floors moved by (dx, dy, dz): cells with a floor in both within 24 units. */
function floorOverlap(a, b, dx, dy, dz) {
  let both = 0;
  let countA = 0;
  let countB = 0;
  for (const hs of a.cells.values()) countA += hs.length;
  for (const hs of b.cells.values()) countB += hs.length;
  for (const [key, hs] of a.cells) {
    const [x, y] = key.split(",").map(Number);
    const other = b.cells.get(`${x + dx},${y + dy}`);
    if (!other) continue;
    for (const h of hs) if (other.some((g) => Math.abs(g - dz - h) <= 24)) both++;
  }
  return both / (countA + countB - both || 1);
}

/** The best move of the reproduction onto the original: by the walked floors' boxes, then searched near. */
export function alignMaps(a, b) {
  const boxOfCells = (f) => {
    const xs = [...f.cells.keys()].map((k) => k.split(",").map(Number));
    const hs = [...f.cells.values()].flat();
    return { x: Math.min(...xs.map((p) => p[0])), y: Math.min(...xs.map((p) => p[1])), h: Math.min(...hs), X: Math.max(...xs.map((p) => p[0])), Y: Math.max(...xs.map((p) => p[1])) };
  };
  const ba = boxOfCells(a);
  const bb = boxOfCells(b);
  const start = [Math.round(((bb.x + bb.X) / 2 - (ba.x + ba.X) / 2) / 16) * 16, Math.round(((bb.y + bb.Y) / 2 - (ba.y + ba.Y) / 2) / 16) * 16, bb.h - ba.h];
  // searched about the boxes' match and about where the copy was built (no move at all): a copy built where the
  // original stands, whose walked floor reaches less far, scored 0.44 by its box where it scores 0.79 in place
  // (c1a1, research/map-geometry.md)
  let best = { overlap: -1, move: start };
  for (const from of [start, [0, 0, 0]])
    for (const dz of [from[2] - 32, from[2] - 16, from[2], from[2] + 16, from[2] + 32])
      for (let dx = from[0] - 128; dx <= from[0] + 128; dx += 16)
        for (let dy = from[1] - 128; dy <= from[1] + 128; dy += 16) {
          const o = floorOverlap(a, b, dx, dy, dz);
          if (o > best.overlap) best = { overlap: o, move: [dx, dy, dz] };
        }
  return best;
}

/** P4: the original's gameplay entities matched by class within 64 units of where they should be. */
export function matchEntities(a, b, move) {
  const of = (ents) => ents.filter((e) => GAMEPLAY.test(e.classname ?? "") && e.origin);
  const theirs = of(a);
  const mine = of(b).map((e) => ({ ...e, used: false }));
  let matched = 0;
  const missing = [];
  for (const e of theirs) {
    const want = [e.origin[0] + move[0], e.origin[1] + move[1], e.origin[2] + move[2]];
    const found = mine.find((m) => !m.used && m.classname === e.classname && Math.hypot(m.origin[0] - want[0], m.origin[1] - want[1], m.origin[2] - want[2]) <= 64);
    if (found) {
      found.used = true;
      matched++;
    } else missing.push(`${e.classname} at ${e.origin.map(Math.round).join(" ")}`);
  }
  return { original: theirs.length, reproduction: mine.length, matched, share: theirs.length ? Math.round((1000 * matched) / theirs.length) / 1000 : 1, missing: missing.slice(0, 20) };
}

const smak = (...args) => execFileSync(process.execPath, [join(KIT, "bin", "smak.mjs"), ...args], { encoding: "utf8", maxBuffer: 64 << 20 });

export async function judgeMap(map, leg, copyFile, { decoy } = {}) {
  const originalFile = join(GAME, map.file);
  const original = readFileSync(originalFile);
  const copy = readFileSync(copyFile);
  const dir = join(HERE, map.id, "judge", decoy ? `decoy-${decoy}` : leg);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  // a map of storeys over storeys is held on every floor a player fits on (rubric amendment, Steven 2026-10-16:
  // "that makes sense when multi-story is present"): a tenth of its standable floor or more under or over another
  const walkedA = floorOf(original);
  const everyA = floorOf(original, { every: true });
  const cellsOf = (f) => [...f.cells.values()].reduce((n, hs) => n + hs.length, 0);
  const stacked = [...everyA.cells.values()].reduce((n, hs) => n + (hs.length > 1 ? hs.length : 0), 0);
  const storeys = stacked >= MULTI_STOREY * cellsOf(everyA);
  const a = storeys ? everyA : walkedA;
  const b = floorOf(copy, { every: storeys });
  const { overlap, move } = alignMaps(a, b);
  const ents = matchEntities(entitiesOf(original), entitiesOf(copy), move);
  const unreached = b.reach.unreached?.length ?? 0;
  const theirUnreached = walkedA.reach.unreached?.length ?? 0;
  let checkErrors = [];
  try {
    smak("map-check", copyFile, "--game", GAME);
  } catch (error) {
    checkErrors = String(error.stdout ?? error.message).split("\n").filter((l) => /^ERROR|^FAULT/.test(l)).slice(0, 10);
  }
  const measured = {
    floorOverlap: Math.round(overlap * 1000) / 1000,
    floorMeasured: storeys ? `every floor a player fits on (storeys: ${Math.round((100 * stacked) / cellsOf(everyA))}% of its floor under or over another)` : "the floor walked from the places to start",
    alignment: { move, note: "the reproduction is this far from where the original has the same floor" },
    entities: ents,
    walkTest: { unreachedInReproduction: unreached, unreachedInOriginal: theirUnreached },
    // what a player walking each finds (src/maps/sweep.mjs): drops that hurt, lights in mid-air, the original's beside
    sweep: Object.fromEntries([["original", original, a], ["reproduction", copy, b]].map(([name, bytes, floor]) => {
      const swept = maps.sweepOf(bytes, { reach: floor.reach });
      return [name, { hurtingDrops: swept.drops.length, glowsInMidAir: swept.floating.filter((f) => f.seen).length, lightEntitiesInOpenAir: swept.floating.filter((f) => !f.seen).length, solidInMidAir: swept.islands.length }];
    })),
    checkErrors,
  };
  const caps = {
    P2: band(overlap, 0.7, 0.45),
    P4: band(ents.share, 0.8, 0.5),
    P8: checkErrors.length ? 0 : unreached > theirUnreached ? 1 : 2,
  };
  // the pictures: both plans at one scale, the storeys, the same section through both, the same views
  const game = ["--game", GAME];
  smak("map-compare", originalFile, copyFile, "-o", join(dir, "plans.png"), "--names", "ORIGINAL,REPRODUCTION", ...game);
  smak("map-storeys", originalFile, "-o", join(dir, "storeys-original.png"), ...game);
  smak("map-storeys", copyFile, "-o", join(dir, "storeys-reproduction.png"), ...game);
  const bounds = JSON.parse(smak("map-info", originalFile, "--json")).bounds;
  const midY = Math.round((bounds.mins[1] + bounds.maxs[1]) / 2);
  smak("map-section", originalFile, "-o", join(dir, "section-original.png"), "--from", `${bounds.mins[0]},${midY}`, "--to", `${bounds.maxs[0]},${midY}`, ...game);
  smak("map-section", copyFile, "-o", join(dir, "section-reproduction.png"), "--from", `${bounds.mins[0] + move[0]},${midY + move[1]}`, "--to", `${bounds.maxs[0] + move[0]},${midY + move[1]}`, ...game);
  const secs = ["section-original.png", "section-reproduction.png"].map((f) => unpng(readFileSync(join(dir, f))));
  savePng(join(dir, "sections.png"), tile(secs, 1, ["ORIGINAL", "REPRODUCTION"]));
  // views from the original's places to start (at most eight), the same points moved onto the reproduction
  const starts = entitiesOf(original).filter((e) => /^info_player_/.test(e.classname ?? "") && e.origin).slice(0, 8);
  const pairs = [];
  for (const [n, e] of starts.entries()) {
    // the way the player faces: `angles`' second number, or `angle` (frenzy's starts give only `angle`; read as
    // "0 0 0" they were all drawn facing east, into walls the original's player does not face)
    const yaw = e.angles !== undefined ? Number(String(e.angles).split(/\s+/)[1]) || 0 : Number(e.angle ?? 0) || 0;
    const eye = [e.origin[0], e.origin[1], e.origin[2] + 28];
    const there = eye.map((v, i) => v + move[i]);
    smak("map-view", originalFile, "-o", join(dir, `v${n}a.png`), "--from", eye.join(","), "--yaw", String(yaw), "--width", "480", "--height", "300", "--entities", "game", "--no-labels", ...game);
    smak("map-view", copyFile, "-o", join(dir, `v${n}b.png`), "--from", there.join(","), "--yaw", String(yaw), "--width", "480", "--height", "300", "--entities", "game", "--no-labels", ...game);
    pairs.push(besides([unpng(readFileSync(join(dir, `v${n}a.png`))), unpng(readFileSync(join(dir, `v${n}b.png`)))]));
  }
  savePng(join(dir, "views.png"), tile(pairs, 2, starts.map((e, n) => `start ${n + 1}: ORIGINAL | REPRODUCTION`)));
  for (const f of readdirSync(dir)) if (/^v\d+[ab]\.png$|^section-/.test(f)) rmSync(join(dir, f));
  const failed = failedByMeasure(caps, MAP_MUST);
  if (failed.length) return { subject: map.id, leg: decoy ? `decoy: ${decoy}` : leg, measured, caps, passes: false, failedByMeasure: failed };
  const r = await runJudge({ read: dir, hours: 0.75, prompt: judgePrompt("map", dir, measured) });
  return { subject: map.id, leg: decoy ? `decoy: ${decoy}` : leg, measured, caps, ...settleAnswer("map", r.answer, caps) };
}

/** A single room the size of the original's floor, with one place to start: the decoy that must fail. */
function roomDecoy(map) {
  // built apart from judge/decoy-room, which the judging clears before it draws
  const out = join(HERE, map.id, "judge", "decoy-room-built");
  mkdirSync(out, { recursive: true });
  const bounds = JSON.parse(smak("map-info", join(GAME, map.file), "--json")).bounds;
  const size = [Math.min(4000, bounds.maxs[0] - bounds.mins[0] - 64), Math.min(4000, bounds.maxs[1] - bounds.mins[1] - 64), 256];
  const { files } = buildMapSpec(
    { spec: "smak.map/1", name: "decoy_room", wads: ["halflife.wad"], rooms: [{ id: "hall", size, at: [bounds.mins[0] + 32, bounds.mins[1] + 32, bounds.mins[2] + 16] }], entities: [{ class: "info_player_deathmatch", room: "hall", at: "centre" }] },
    { out, compilers: findCompilers({ folder: join(KIT, "..", "SDHLT", "tools") }), wads: [GAME] },
  );
  if (!files.bsp) throw new Error("the room decoy did not compile");
  return files.bsp;
}

// ── all of them ───────────────────────────────────────────────────────────

// run only when started as a script (its measurements are imported by the tests)
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) await main();

async function main() {
  const jobs = [];
  for (const model of SUBJECTS.models)
    for (const leg of SUBJECTS.legs.models) {
      const built = join(HERE, model.id, leg, "built", `${model.id}.mdl`);
      if (chosen(model.id, leg) && existsSync(built)) jobs.push(() => judgeModel(model, leg, built).then((r) => [join(HERE, model.id, leg, "judge.json"), r]));
    }
  for (const map of SUBJECTS.maps)
    for (const leg of SUBJECTS.legs.maps) {
      const built = join(HERE, map.id, leg, "built", `${map.id}_copy.bsp`);
      if (chosen(map.id, leg) && existsSync(built)) jobs.push(() => judgeMap(map, leg, built).then((r) => [join(HERE, map.id, leg, "judge.json"), r]));
    }
  // the control: the original judged against itself, told it is the reproduction. A fair judge gives it every
  // point; what it takes off is the judge's own harshness, not any fault of a copy
  // `identical` for every model, `identical:<id>` for one
  const identical = words.filter((w) => /^identical(:|$)/.test(w)).map((w) => w.split(":")[1]);
  if (identical.length)
    for (const model of SUBJECTS.models.filter((m) => identical.includes(undefined) || identical.includes(m.id)))
      jobs.push(() => judgeModel(model, "identical", join(GAME, model.file), { decoy: "identical" }).then((r) => [join(HERE, model.id, "judge", "control-identical.json"), r]));
  if (words.includes("touched"))
    for (const model of SUBJECTS.models.filter((m) => identical.includes(undefined) || identical.includes(m.id)))
      jobs.push(() => judgeModel(model, "identical", join(GAME, model.file), { decoy: "identical-touched" }).then((r) => [join(HERE, model.id, "judge", "control-identical-touched.json"), r]));
  if (identical.length)
    for (const map of SUBJECTS.maps.filter((m) => identical.includes(undefined) || identical.includes(m.id)))
      jobs.push(() => judgeMap(map, "identical", join(GAME, map.file), { decoy: "identical" }).then((r) => [join(HERE, map.id, "judge", "control-identical.json"), r]));
  // the decoys: a box for each model, a swapped reproduction, a room for each map
  if (!words.length || words.includes("decoys")) {
    for (const model of SUBJECTS.models) jobs.push(() => judgeModel(model, "box", boxDecoy(model), { decoy: "box" }).then((r) => [join(HERE, model.id, "judge", "decoy-box.json"), r]));
    const withCopies = SUBJECTS.models.filter((m) => existsSync(join(HERE, m.id, "pictures", "built", `${m.id}.mdl`)));
    if (withCopies.length >= 2) {
      const [x, y] = withCopies;
      jobs.push(() => judgeModel(y, "swap", join(HERE, x.id, "pictures", "built", `${x.id}.mdl`), { decoy: `swap-${x.id}` }).then((r) => [join(HERE, y.id, "judge", "decoy-swap.json"), r]));
    }
    for (const map of SUBJECTS.maps) jobs.push(() => judgeMap(map, "room", roomDecoy(map), { decoy: "room" }).then((r) => [join(HERE, map.id, "judge", "decoy-room.json"), r]));
  }

  const results = [];
  process.on("exit", () => writeScores());
  const queue = [...jobs];
  await Promise.all(
    Array.from({ length: Math.min(4, queue.length) }, async () => {
      while (queue.length) {
        // one job's failure is its own: told, and the others go on
      let file;
      let result;
      try {
        [file, result] = await queue.shift()();
      } catch (error) {
        console.log(`a judgement failed: ${error.message.split("\n")[0]}`);
        continue;
      }
        writeFileSync(file, `${JSON.stringify(result, null, 1)}\n`);
        results.push(result);
        console.log(`${result.subject} ${result.leg}: ${result.error ?? (result.failedByMeasure ? `fails on its measures (${result.failedByMeasure.join(", ")}), no judge asked` : `${result.total} of ${result.of}, ${result.passes ? "PASSES" : "fails"}`)}`);
      }
    }),
  );
}

/** scores.md: every judgement of every round, newest round last, and the share that passes by kind. */
function writeScores() {
  const rows = [];
  for (const kind of ["models", "maps"])
    for (const subject of SUBJECTS[kind])
      for (const leg of SUBJECTS.legs[kind]) {
        const dir = join(HERE, subject.id, leg);
        if (!existsSync(dir)) continue;
        const rounds = readdirSync(dir).filter((f) => /^round-\d+$/.test(f)).sort((a, b) => Number(a.slice(6)) - Number(b.slice(6)));
        const files = [...rounds.map((r) => [r, join(dir, r, "judge.json")]), [`round-${rounds.length + 1}`, join(dir, "judge.json")]];
        for (const [round, file] of files) {
          if (!existsSync(file)) continue;
          const j = JSON.parse(readFileSync(file, "utf8"));
          if (!j.scores) continue;
          const kit = (() => {
            try {
              return JSON.parse(readFileSync(join(dirname(file), "run.json"), "utf8")).kit ?? "";
            } catch {
              return "";
            }
          })();
          rows.push({ kind, round, subject: subject.id, leg, total: j.total, of: j.of, passes: j.passes, items: Object.entries(j.scores).map(([k, v]) => `${k} ${v.score}`).join(", "), kit });
        }
      }
  const lines = ["# Reproduction scores", "", "Written by judge.mjs from every judge.json (rounds kept under each leg's round-<n>/). The rubric is rubric.md.", ""];
  for (const kind of ["models", "maps"]) {
    const of = rows.filter((r) => r.kind === kind);
    if (!of.length) continue;
    lines.push(`## ${kind === "models" ? "Models" : "Maps"}`, "", "| Round | Subject | Leg | Score | Passes | Items | Kit |", "| --- | --- | --- | --- | --- | --- | --- |");
    for (const r of of) lines.push(`| ${r.round.slice(6)} | ${r.subject} | ${r.leg} | ${r.total} of ${r.of} | ${r.passes ? "yes" : "no"} | ${r.items} | ${r.kit} |`);
    const latest = new Map();
    for (const r of of) latest.set(`${r.subject}:${r.leg}`, r);
    const pass = [...latest.values()].filter((r) => r.passes).length;
    lines.push("", `Latest round: ${pass} of ${latest.size} pass.`, "");
  }
  writeFileSync(join(HERE, "scores.md"), `${lines.join("\n")}\n`);
}
