// An asset judged against a written brief, not an original (rubric.md, "Original creation" and its amendment for
// the brief legs): the original mod's assets and every brief leg's are measured and judged here.
//
//   ownOfKind(kind)                                     -> Half-Life's own models of a kind, with their size
//   judgeAgainstBrief(kind, label, dir, pictures, measured, caps, { brief, what })
//   judgeModelAgainstBrief(kind, label, src, dir, { brief, what, asked, list, extra, extraPictures, sizeFrom })
//   weaponSizeIn(src)                                   -> a weapon's size in its first-person model, hands left out
import { readFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { HERE, GAME, POSE, readModel, boxOf, picturesOf, savePng } from "./lib.mjs";
import { runJudge, failedByMeasure } from "./agents.mjs";
import { itemsOf, settle, combine, askScores, dryAnswer, band, MODEL_GUIDE } from "./scoring.mjs";
import * as smak from "../../src/index.mjs";
import { tile, render, framing } from "../../src/render.mjs";
import { HANDS } from "../../src/fit.mjs";
import { PROP_TRIANGLES } from "../../src/spec/model.mjs";

const RUBRIC = readFileSync(join(HERE, "rubric.md"), "utf8");
const round = (v, k = 1) => Math.round(v * 10 ** k) / 10 ** k;
/** The rubric's table each kind of asset is scored on. */
const TABLE = { model: "model", weapon: "weapon", character: "character", enemy: "contracted", player: "contracted", map: "map", texture: "texture", sound: "sound", sprite: "sprite", mod: "mod" };
const MODELS = ["model", "weapon", "character", "enemy", "player"];

// ── Half-Life's own, to set beside ─────────────────────────────────────────

const CREATURES = ["headcrab", "babycrab", "leech", "roach", "snark", "chumtoad", "houndeye", "bullsquid"];
const PEOPLE = ["barney", "scientist", "gman", "hgrunt", "zombie", "islave", "hassassin", "otis"];
/**
 * Half-Life's own models of a kind, each with its size: props (three bones or fewer, no weapon's file), weapons
 * (their w_ models), creatures, people, and players (models/player/*). The line-ups pick from these.
 */
export function ownOfKind(kind, root = GAME) {
  const read = (file) => {
    try {
      const src = readModel(join(root, file));
      return { file, src, diagonal: Math.hypot(...boxOf(src).size) };
    } catch {
      return null;
    }
  };
  const models = join(root, "models");
  let files;
  if (kind === "model") files = readdirSync(models).filter((f) => /\.mdl$/.test(f) && !/t\.mdl$|\d\d\.mdl$|^(v_|p_|w_)/.test(f)).map((f) => `models/${f}`);
  else if (kind === "weapon") files = readdirSync(models).filter((f) => /^w_.*\.mdl$/.test(f) && !/t\.mdl$/.test(f)).map((f) => `models/${f}`);
  else if (kind === "enemy") files = CREATURES.map((n) => `models/${n}.mdl`);
  else if (kind === "character") files = [...PEOPLE, ...CREATURES].map((n) => `models/${n}.mdl`);
  else if (kind === "player") files = existsSync(join(models, "player")) ? readdirSync(join(models, "player")).map((d) => `models/player/${d}/${d}.mdl`) : [];
  else throw new Error(`ownOfKind: no models of kind ${kind}`);
  return files.filter((f) => existsSync(join(root, f))).map(read).filter((x) => x && (kind !== "model" || smak.readMdl(x.src).bones.length <= 3));
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
${model ? `\n${MODEL_GUIDE("what the brief asks")}\n` : ""}
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
 * A weapon's size as it is drawn in first person, its hands left out: Valve's world models are drawn about twice
 * life size for small things (a Glock 15 units, the .357 28), so a brief's real length is held against the
 * first-person model (Steven, 2026-10-15). Valve's crowbar measures 25.7 there.
 */
export function weaponSizeIn(src) {
  const points = [];
  smak.dropTriangles(src, (t) => {
    if (!HANDS.test(t.tex ?? "")) points.push(...t.p);
    return false;
  }, POSE);
  return [0, 1, 2].map((k) => Math.max(...points.map((p) => p[k])) - Math.min(...points.map((p) => p[k])));
}

/** A model judged against its brief: its sides, a line-up beside Half-Life's own of its kind, its size and triangles measured. */
export async function judgeModelAgainstBrief(kind, label, src, dir, { brief, what, asked, list, extra = {}, extraPictures = "", sizeFrom }) {
  mkdirSync(dir, { recursive: true });
  const pictures = picturesOf(src, { size: 384 });
  savePng(join(dir, "sides.png"), tile(pictures.map((p) => p.picture), 5, pictures.map((p) => p.name)));
  const size = sizeFrom ?? boxOf(src).size;
  const line = lineupOf(src, list, dir, label);
  const triangles = trianglesOf(src);
  const { median, q3 } = PROP_TRIANGLES.find((b) => Math.hypot(...size) < b.under);
  const off = sizeOff(asked, size);
  const check = smak.check(src);
  const measured = { size: size.map((v) => round(v)), sizeAsked: asked ?? null, sizeOff: off, triangles, ...(kind === "model" ? { halfLifeMedianOfThisSize: median, halfLifeThreeQuartersUnder: q3 } : {}), checkErrors: check.errors, lineup: `ours is one of A to D in lineup.png beside ${line.others.join(", ")}: the judge does not know which`, ...extra.measured };
  const caps = { M2: off === null ? 2 : band(off, 0.15, 0.3, true), M8: check.errors.length ? 0 : kind === "model" && triangles > 2 * median && triangles > q3 ? 1 : 2, ...extra.caps };
  return judgeAgainstBrief(kind, label, dir, `${dir}/sides.png (ten views at one scale), ${dir}/lineup.png (four models at one scale: one is the asset, three are Half-Life's own of its size; M6 asks whether a player would take the asset for one of the game's)${extraPictures}`, measured, caps, { brief, what });
}
