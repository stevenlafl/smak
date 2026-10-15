// A model from a spec: a description in plain JSON that a person's words are turned into (by the agent that
// reads them, never by this kit), built here with no code of the agent's own, then checked and drawn.
//
//   buildModelSpec(spec, { folder, prefabs })  -> { mdl, report, pieces }
//   validateModelSpec(spec)                    -> sentences of what is wrong with it, each with its path
//
// A spec is a list of named parts, each a shape the workshop builds (a box, a turned part, a tube, a leaf,
// a band or a stud on another part, a kit's weapon, or a prefab: another spec built on its own and put in),
// placed by saying where it sits on another part rather than by world numbers. docs/SPEC.md is the guide.
// The checks that follow every build: the engine's (`check`), the shape's (`shapeSoundness`: holes, faces
// turned inwards, parts floating apart) and the pictures' (`seeThrough`).
import { boneIn, otherSideOf } from "../biped.mjs";
import { fitPose, fitMotion } from "./posefit.mjs";
import { carve, masksFromPicture, sheetViews } from "./carve.mjs";
import { readObj, objMeshes } from "../obj.mjs";
import { reduce } from "../qem.mjs";
import { blob, nearestPiece } from "./blob.mjs";
import { sub, cross } from "../vec.mjs";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { shape, sheet, allot } from "../workshop.mjs";
import { buildMdl, swapMesh } from "../build.mjs";
import { HANDS } from "../fit.mjs";
import { indexed, shrink, masked } from "../image.mjs";
import { check } from "../check.mjs";
import { readMdl, bones as bonesOf, sequences as sequencesOf, withTextures, addMesh, replaceMesh, inverse34, apply34, readSequence, replaceSequence, events as eventsOf, setEvents } from "../mdl.mjs";
import { buildSoundSpec } from "./sound.mjs";
import * as A from "../animate.mjs";
import { posed, render } from "../render.mjs";
import { meshOf } from "../mesh.mjs";
import { putBody } from "../bodies.mjs";
import { soundness } from "../sound.mjs";
import { shapeSoundness, seeThrough } from "../sound.mjs";
import { sword, taper } from "../../kits/swordkit.mjs";
import { axe } from "../../kits/axekit.mjs";
import { blunt } from "../../kits/bluntkit.mjs";
import { bow } from "../../kits/bowkit.mjs";
import { lookOf, modelLookOf, VALVE_MODELS } from "./look.mjs";
import { materialOf, flagsOf, zonePainter, colourAt, HOLE_RGB, photoMaterial } from "./paint.mjs";
import { paintFinish, FINISH } from "./finish.mjs";
import { paintMarks } from "./marks.mjs";
import { bakeParts } from "./bake.mjs";
import { contractOf, compareContract } from "../contract.mjs";
import { paintPanels, paintWords, faceSize } from "./faces.mjs";
import { paintProjections, viewFit, VIEW_NAMES } from "./project.mjs";
import { outlineFit } from "./posefit.mjs";
/** An outline sharing less than this with its picture's is warned of: the reproduction test's own line (M1). */
const OUTLINE_FAIR = 0.8;
/** A character's outline sharing less than this with a picture's is a fault. */
const OUTLINE_FAULT = 0.7;
/**
 * A painted look is warned of past these against a picture: set between Steven's reviews of round 8 (the filing
 * cabinet at 98% and the headcrab at 95% gave means of 4 to 8 and worst cells to 34; the medkit he failed for its
 * sides, means 10 to 15 and worst cells 52 to 78).
 */
const LOOK_MEAN = 10;
const LOOK_WORST = 45;
import { unpicture } from "../image.mjs";

/** A character's finish unless told: cloth and skin do not rub bright as metal and wood do. */
const CHARACTER_FINISH = { wear: 0.15, grime: 0.3 };

/** The spec's own name and version: written at its top, so that a later version can tell it apart. */
export const MODEL_SPEC = "smak.model/1";
/** Each kind of part with the fields it takes beside the ones every part takes. */
const KINDS = {
  box: ["size", "panels"],
  cylinder: ["radius", "height", "sides", "top"],
  sphere: ["radius", "sides"],
  superquadric: ["size", "round", "sides"],
  carved: ["size", "sheet", "pictures", "cells", "triangles", "symmetric"],
  mesh: ["size", "file", "triangles", "up", "turn", "symmetric"],
  blob: ["pieces", "blend", "cells", "triangles", "symmetric"],
  turn: ["rings", "caps", "sides", "lining", "axis"],
  tube: ["path", "sides", "caps"],
  leaf: ["width", "height", "rows", "bend"],
  cards: ["size", "count", "card", "tilt"],
  band: ["on", "width", "height"],
  boss: ["on", "radius", "height", "sides"],
  ridge: ["on", "width", "height", "ends"],
  studs: ["on", "count", "radius", "height"],
  "kit:sword": ["options"],
  "kit:axe": ["options"],
  "kit:blunt": ["options"],
  "kit:bow": ["options"],
  prefab: ["prefab", "spec", "file", "scale"],
};
/** The fields every part takes. */
const COMMON = ["id", "kind", "material", "at", "attach", "rotate", "mirror", "repeat", "open", "loose", "bone", "span", "finish", "smooth", "print", "marks", "paint", "texels", "views", "note"];
/** The kinds that sit on another part's surface, and move with it. */
const ON_SURFACE = new Set(["band", "boss", "ridge", "studs"]);
/** The anchors every part has: the middles of the faces of its box, and its middle. */
const BOX_ANCHORS = ["top", "bottom", "front", "back", "left", "right", "centre"];
/** The fields a spec takes at its top. */
const TOP = ["spec", "name", "kind", "size", "texture", "seed", "materials", "parts", "prefabs", "allow", "base", "weapon", "finish", "smooth", "project", "budget", "fidelity", "contract", "floor", "pose", "motion", "note"];
/**
 * How finely a model is made: "game" (unless told) holds it to Half-Life's own of its kind and size, warning past
 * them; "high" (a person's own model, made to look its best) gets the larger picture and is told its triangles
 * against Half-Life's as a fact, not warned. A `budget` still binds either way.
 */
const FIDELITY = ["game", "high"];
/** A texture's side unless told; a kit's picture is made this much smaller (the kits paint at 1024 wide). */
const SHEET_SIZE = 256;
const KIT_SHRINK = 2;
/** Three quarters of Half-Life's props, plants, creatures and people have fewer triangles than this (docs/SPEC.md). */
const PROP_BUDGET = 576;
/**
 * Half-Life's props (models of three bones or fewer, not v_ or p_) by the length of their box's diagonal, in
 * units: the triangles of their first body at the median and the third quartile. Measured on the game's 74 such
 * models (2026-10-14); numbers only.
 */
const PROP_TRIANGLES = [
  { under: 16, median: 20, q3: 32 },
  { under: 32, median: 51, q3: 88 },
  { under: 64, median: 62, q3: 156 },
  { under: 128, median: 105, q3: 238 },
  { under: Infinity, median: 288, q3: 288 },
];
/**
 * A mesh part's triangles: its .obj read and stood up (`up`, `turn`), its loose crumbs dropped, reduced to
 * `triangles` (unless told, three quarters of Half-Life's props of its size have under that), then stretched to
 * `size`, centred on x and y and standing on z 0, as a carved part is. What was done is told in the report.
 */
function meshPart(part, readText, report, warnings) {
  let obj;
  try {
    obj = readObj(readText(part.file).toString("utf8"));
  } catch (error) {
    throw new Error(`${part.id}: ${part.file}: ${error.message}`);
  }
  const { meshes } = objMeshes(obj, { up: part.up ?? "y", turn: part.turn ?? 0 });
  const all = meshes.flatMap((m) => m.tris).map((t) => t.map((c) => ({ p: c.p })));
  if (!all.length) throw new Error(`${part.id}: ${part.file} has no triangles`);
  const band = PROP_TRIANGLES.find((b) => Math.hypot(...part.size) < b.under);
  const target = part.triangles ?? band.q3;
  const reduced = all.length > target ? reduce(all, { target }).tris : all;
  const lo = [0, 1, 2].map((k) => Math.min(...reduced.flatMap((t) => t.map((c) => c.p[k]))));
  const hi = [0, 1, 2].map((k) => Math.max(...reduced.flatMap((t) => t.map((c) => c.p[k]))));
  const own = hi.map((v, k) => v - lo[k] || 1e-6);
  const k = part.size.map((v, i) => v / own[i]);
  let fitted = reduced.map((t) => t.map((c) => ({ p: [(c.p[0] - (lo[0] + hi[0]) / 2) * k[0], (c.p[1] - (lo[1] + hi[1]) / 2) * k[1], (c.p[2] - lo[2]) * k[2]] })));
  // faces that look inwards on the whole (a file wound the other way): its signed volume under 0, turned round
  const volume = fitted.reduce((v, [a, b, c]) => v + (a.p[0] * (b.p[1] * c.p[2] - b.p[2] * c.p[1]) - a.p[1] * (b.p[0] * c.p[2] - b.p[2] * c.p[0]) + a.p[2] * (b.p[0] * c.p[1] - b.p[1] * c.p[0])) / 6, 0);
  if (volume < 0) {
    fitted = fitted.map(([a, b, c]) => [a, c, b]);
    report.notes.push(`${part.id}: ${part.file}'s faces looked inwards on the whole: turned round`);
  }
  report.facts.push(`${part.id}: the shape of ${part.file}, ${all.length} triangles reduced to ${fitted.length}, fitted to ${part.size.join(" x ")} (its own proportions ${own.map((v) => Math.round((v / Math.max(...own)) * 100) / 100).join(" : ")})`);
  const stretch = Math.max(...k) / Math.min(...k);
  if (stretch > 1.15)
    warnings.push(`${part.id}: fitted to ${part.size.join(" x ")} it is stretched ${Math.round((stretch - 1) * 100)}% more one way than another: give size its own proportions (${own.map((v) => Math.round((v / Math.max(...own)) * Math.max(...part.size))).join(" x ")} at that height), unless the generator got them wrong`);
  return fitted;
}

/**
 * A blob part made: its pieces resolved to capsules and ellipsoids in model space (a span from joint to joint, an
 * `at` round a joint or a point, a from-to), blended (blob.mjs), reduced to `triangles` (unless told, as many as a
 * character's limb parts would have: 60 a piece), and given the part's own space. Its pieces stay on the part,
 * resolved, for each corner's bone.
 */
const BLOB_MOST = 600;
function blobPart(part, skeleton, report) {
  const names = skeleton ? [...skeleton.joints.keys()] : [];
  const jointAt = (name, where) => {
    const own = boneIn(name, names) ?? name;
    const joint = skeleton?.joints.get(own);
    if (!joint) throw new Error(`${part.id}.${where}: the base has no bone "${name}"`);
    return { own, joint };
  };
  const plus = (p, o) => (o ? p.map((v, k) => v + o[k]) : p);
  const resolved = part.pieces.map((piece, k) => {
    const r = piece.radius;
    if (piece.span) {
      const [a, b] = piece.span.map((name, j) => jointAt(name, `pieces[${k}].span[${j}]`));
      return { kind: "capsule", a: plus(a.joint, piece.offset), b: plus(b.joint, piece.offset), r: isNumber(r) ? [r, r] : [r[0], r[1] ?? r[0]], bone: piece.bone ?? a.own };
    }
    if (piece.from) return { kind: "capsule", a: piece.from, b: piece.to, r: isNumber(r) ? [r, r] : [r[0], r[1] ?? r[0]], bone: piece.bone ?? (skeleton ? nearestJoint(skeleton, piece.from) : "root") };
    const at = typeof piece.at === "string" ? jointAt(piece.at, `pieces[${k}].at`) : null;
    const c = plus(at ? at.joint : piece.at, piece.offset);
    return { kind: "ellipsoid", c, r: isNumber(r) ? [r, r, r] : r.length === 3 ? r : [r[0], r[0], r[1]], bone: piece.bone ?? (at ? at.own : skeleton ? nearestJoint(skeleton, c) : "root") };
  });
  // unless told, 40 triangles a piece and 600 at most: a whole body in one blob of 28 pieces at 60 each came to 1,680,
  // past twice the original character's 785 that a copy is held to (the reproduction test's M8)
  // symmetric: each piece's twin, on the other side's bones (by name: the base's pose may not be symmetric, Gordon's
  // right hand holds a gun) or, placed by points, mirrored through y 0; a piece on a middle bone or at y 0 has none
  if (part.symmetric) {
    const twins = part.pieces.flatMap((piece, k) => {
      const swap = (name) => otherSideOf(name);
      if (piece.span) {
        const other = piece.span.map(swap);
        if (other.every((b, j) => b === piece.span[j])) return [];
        const [a, b] = other.map((name, j) => jointAt(name, `pieces[${k}] (mirrored).span[${j}]`));
        const r = piece.radius;
        return [{ kind: "capsule", a: plus(a.joint, piece.offset && [piece.offset[0], -piece.offset[1], piece.offset[2]]), b: plus(b.joint, piece.offset && [piece.offset[0], -piece.offset[1], piece.offset[2]]), r: isNumber(r) ? [r, r] : [r[0], r[1] ?? r[0]], bone: piece.bone ? swap(piece.bone) : a.own }];
      }
      if (typeof piece.at === "string") {
        if (swap(piece.at) === piece.at) return [];
        const at = jointAt(swap(piece.at), `pieces[${k}] (mirrored).at`);
        const r = piece.radius;
        return [{ kind: "ellipsoid", c: plus(at.joint, piece.offset && [piece.offset[0], -piece.offset[1], piece.offset[2]]), r: isNumber(r) ? [r, r, r] : r.length === 3 ? r : [r[0], r[0], r[1]], bone: piece.bone ? swap(piece.bone) : at.own }];
      }
      const done = resolved[k];
      const flip = (p) => [p[0], -p[1], p[2]];
      if (done.kind === "capsule") return Math.abs(done.a[1]) < 0.5 && Math.abs(done.b[1]) < 0.5 ? [] : [{ ...done, a: flip(done.a), b: flip(done.b), bone: swap(done.bone) }];
      return Math.abs(done.c[1]) < 0.5 ? [] : [{ ...done, c: flip(done.c), bone: swap(done.bone) }];
    });
    resolved.push(...twins);
    report.facts.push(`${part.id}: symmetric: ${twins.length} pieces mirrored to the other side`);
  }
  const made = blob(resolved, { cells: part.cells ?? 64, blend: part.blend ?? 3, target: part.triangles ?? Math.min(BLOB_MOST, Math.max(120, 40 * resolved.length)) });
  const lo = [0, 1, 2].map((k) => Math.min(...made.tris.flatMap((t) => t.map((c) => c.p[k]))));
  const hi = [0, 1, 2].map((k) => Math.max(...made.tris.flatMap((t) => t.map((c) => c.p[k]))));
  const at = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, lo[2]];
  const own = made.tris.map((t) => t.map((c) => ({ p: [c.p[0] - at[0], c.p[1] - at[1], c.p[2] - at[2]] })));
  report.facts.push(`${part.id}: a blob of ${resolved.length} pieces blended over ${part.blend ?? 3} units, ${made.report.surfaced} triangles surfaced and reduced to ${made.report.triangles}; its corners on ${[...new Set(resolved.map((p) => p.bone))].length} bones`);
  return { ...part, at, size: hi.map((v, k) => Math.max(0.01, v - lo[k])), carvedTris: own, blobPieces: resolved };
}

/**
 * A shape made symmetric through y 0 (its own space, centred on x and y): the +y half kept, each triangle that
 * crosses the middle cut there, then mirrored with its winding turned, so the two halves meet on the same points.
 */
function symmetrized(tris, part, report) {
  const half = [];
  const cut = (a, b) => {
    const t = a.p[1] / (a.p[1] - b.p[1]);
    return { p: [a.p[0] + (b.p[0] - a.p[0]) * t, 0, a.p[2] + (b.p[2] - a.p[2]) * t] };
  };
  for (const tri of tris) {
    const poly = [];
    for (let i = 0; i < 3; i++) {
      const [a, b] = [tri[i], tri[(i + 1) % 3]];
      const [ina, inb] = [a.p[1] >= 0, b.p[1] >= 0];
      if (ina) poly.push({ p: [...a.p] });
      if (ina !== inb) poly.push(cut(a, b));
    }
    for (let i = 1; i + 1 < poly.length; i++) half.push([poly[0], poly[i], poly[i + 1]]);
  }
  const mirrored = half.map(([a, b, c]) => [c, b, a].map((v) => ({ p: [v.p[0], -v.p[1], v.p[2]] })));
  report.facts.push(`${part.id}: symmetric: its +y half kept (${half.length} triangles) and mirrored`);
  return [...half, ...mirrored];
}

/** The joint of a skeleton nearest a point. */
function nearestJoint(skeleton, p) {
  let best = null;
  for (const [name, joint] of skeleton.joints) {
    const d = Math.hypot(...joint.map((v, k) => v - p[k]));
    if (!best || d < best.d) best = { name, d };
  }
  return best.name;
}

/**
 * A skeleton's limbs: each bone's joint to each of its children's, the stretch that moves with it, and each joint
 * with no child on its own. Bones at one place (Bip01 on its pelvis) make no limb.
 */
function limbsOf(skeleton) {
  const list = bonesOf(skeleton.src);
  const limbs = [];
  list.forEach((bone, i) => {
    const a = skeleton.joints.get(bone.name);
    const children = list.filter((other) => other.parent === i);
    for (const child of children) {
      const b = skeleton.joints.get(child.name);
      if (Math.hypot(...a.map((v, k) => v - b[k])) > 0.5) limbs.push({ bone: bone.name, a, b });
    }
    if (!children.length) limbs.push({ bone: bone.name, a, b: a });
  });
  return limbs;
}

/** The bone whose limb is nearest a point. */
function nearestLimb(limbs, p) {
  let best = null;
  for (const { bone, a, b } of limbs) {
    const ab = b.map((v, k) => v - a[k]);
    const t = Math.max(0, Math.min(1, ab.reduce((s, v, k) => s + v * (p[k] - a[k]), 0) / (ab.reduce((s, v) => s + v * v, 0) || 1)));
    const d = Math.hypot(...p.map((v, k) => v - a[k] - ab[k] * t));
    if (!best || d < best.d) best = { bone, d };
  }
  return best.bone;
}

/** How far the size may be off what the spec asks before it is warned of, and before it is an error. */
const SIZE_WARN = 0.1;
const SIZE_ERROR = 0.25;
/** A prop lifted or lowered by more than this to stand on the floor is said to have been. */
const GROUND_SAID = 0.5;

const degrees = (d) => (d * Math.PI) / 180;
const isNumber = (v) => typeof v === "number" && Number.isFinite(v);
const isPoint = (v) => Array.isArray(v) && v.length === 3 && v.every(isNumber);

/** The nearest of some names to a misspelt one, for "did you mean". */
function nearest(word, names) {
  const distance = (a, b) => {
    const row = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      let last = row[0];
      row[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const kept = row[j];
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, last + (a[i - 1] === b[j - 1] ? 0 : 1));
        last = kept;
      }
    }
    return row[b.length];
  };
  const best = names.map((n) => [n, distance(String(word), n)]).sort((a, b) => a[1] - b[1])[0];
  return best && best[1] <= Math.max(2, String(word).length / 3) ? ` Did you mean "${best[0]}"?` : "";
}

/**
 * What is wrong with a model spec, before anything is built: a list of sentences, each starting with the
 * place in the spec it is about (`parts[2].attach.to`). Unknown fields are not errors but are told as
 * warnings: a misspelt field is otherwise quietly left out. Returns { errors, warnings }.
 */
export function validateModelSpec(spec, { prefabs = {} } = {}) {
  const errors = [];
  const warnings = [];
  if (!spec || typeof spec !== "object") return { errors: ["the spec is not an object"], warnings };
  if (spec.spec !== MODEL_SPEC) errors.push(`spec: "${MODEL_SPEC}" says what this is; it has ${JSON.stringify(spec.spec)}`);
  for (const key of Object.keys(spec))
    if (!TOP.includes(key)) warnings.push(`${key}: not a field of a model spec, left out.${nearest(key, TOP)}`);
  if (spec.name !== undefined && !/^[\w.-]+\.mdl$/i.test(spec.name))
    errors.push(`name: a file name ending .mdl, of letters, digits, _ . and -: not ${JSON.stringify(spec.name)}`);
  if (spec.kind !== undefined && !["prop", "held", "piece", "character"].includes(spec.kind))
    errors.push(`kind: "prop" (stands on the floor), "held" (lies along +x, its grip at the origin), "piece" (as built) or "character" (a body on a base model's skeleton): not ${JSON.stringify(spec.kind)}`);
  if (spec.base !== undefined && typeof (spec.base?.file ?? spec.base) !== "string")
    errors.push(`base: { file: "player/gordon/gordon.mdl", bodypart, bodies, pose }: the model whose skeleton and animations the parts are put on`);
  const finishErrors = (value, where) => {
    if (value === undefined || value === false) return;
    if (!value || typeof value !== "object" || Object.entries(value).some(([k, v]) => !(k in FINISH) || !isNumber(v) || v < 0 || v > 1))
      errors.push(`${where}: false (none), or { ${Object.keys(FINISH).join(", ")} }, each 0 to 1`);
  };
  finishErrors(spec.finish, "finish");
  if (spec.budget !== undefined && !(Number.isInteger(spec.budget) && spec.budget > 0)) errors.push("budget: the most triangles the model may have, a whole number");
  if (spec.fidelity !== undefined && !FIDELITY.includes(spec.fidelity)) errors.push(`fidelity: ${FIDELITY.map((f) => `"${f}"`).join(" or ")}`);
  if (spec.floor !== undefined && !(typeof spec.floor === "number" && Number.isFinite(spec.floor))) errors.push("floor: where its feet stand, 0 for a monster (its origin at its feet) or -36 for a player (its origin the middle of its hull)");
  if (spec.motion !== undefined) {
    if (!spec.base) errors.push("motion: a character's, on a base model's skeleton: give the spec a base");
    if (!Array.isArray(spec.motion) || !spec.motion.every((m) => typeof m?.seq === "string" && typeof m?.fit?.picture === "string"))
      errors.push(`motion: [{ seq: "run", fit: { picture: "pictures/motion.png", count: 8, cols: 4, view: "left" } }]: an animation of the base fitted to a strip of pictures of the original doing it`);
  }
  if (spec.pose !== undefined) {
    const keys = spec.pose?.keys;
    if (!spec.base) errors.push("pose: a character's, on a base model's skeleton: give the spec a base");
    if (spec.pose?.fit !== undefined && spec.pose.fit !== true && !Array.isArray(spec.pose.fit))
      errors.push("pose.fit: true (fitted to the outlines of the spec's project pictures) or a list of views as project takes them");
    if (spec.pose?.fit && !Array.isArray(spec.pose.fit) && !spec.project?.length) errors.push("pose.fit: true fits to the project pictures, and the spec has none: give fit a list of views");
    if (keys === undefined && spec.pose?.fit) {
      // fitted alone: no keys of its own
    } else if (!keys || typeof keys !== "object" || Array.isArray(keys) || !Object.keys(keys).length)
      errors.push(`pose: { keys: { "<bone>": { turn: { x, y, z } } } }: degrees about the model's axes, as the bone stands in the first frame (a leg back: "Bip01 L Thigh": { turn: { y: 20 } })`);
    else
      for (const [bone, change] of Object.entries(keys))
        if (!change?.turn || typeof change.turn !== "object" || !Object.values(change.turn).every(isNumber))
          errors.push(`pose.keys.${bone}: { turn: { x, y, z } } in degrees`);
  }
  if (spec.floor !== undefined && !spec.base) errors.push("floor: a character's, on a base model's skeleton: give the spec a base");
  for (const [where, value] of [["smooth", spec.smooth], ...(spec.parts ?? []).map((part, i) => [`parts[${i}] (${part?.id}).smooth`, part?.smooth])])
    if (value !== undefined && !(isNumber(value) && value >= 0 && value <= 180)) errors.push(`${where}: the angle in degrees (0 to 180) under which faces are shaded as one smooth surface`);
  for (const [i, part] of (spec.parts ?? []).entries()) finishErrors(part?.finish, `parts[${i}] (${part?.id}).finish`);
  if (spec.weapon !== undefined) {
    const w = spec.weapon;
    if (typeof w?.like !== "string" || !/^[\w-]+$/.test(w.like))
      errors.push(`weapon.like: the game's weapon it takes the place of, as its files are named ("crowbar" for v_crowbar.mdl, p_crowbar.mdl, w_crowbar.mdl)`);
    if (w?.views !== undefined && (!Array.isArray(w.views) || !w.views.length || w.views.some((v) => !WEAPON_VIEWS[v])))
      errors.push(`weapon.views: some of "v" (first person), "p" (in another player's hands), "w" (lying in the world)`);
    if (w?.size !== undefined && !["old", "own"].includes(w.size)) errors.push(`weapon.size: "old" (stretched to the old one's length) or "own" (the size it was built at, its grip where the old grip was)`);
    if (w?.rig !== undefined && !["carry", "nearest"].includes(w.rig)) errors.push(`weapon.rig: "carry" (on the bone that carried the old one) or "nearest" (each corner on the bone of the old one's nearest corner: a slide, a drum that turns)`);
    const turnOk = (v) => v === undefined || ["as drawn", "x", "y", "z"].includes(v);
    if (!(turnOk(w?.turn) || (w?.turn && typeof w.turn === "object" && Object.values(w.turn).every(turnOk))))
      errors.push(`weapon.turn: "as drawn", "x", "y" or "z" (the fit's turn, where its outline cannot choose), or one a view: { "v": "z", "p": "as drawn" }`);
    if (w?.chrome !== undefined && (!Array.isArray(w.chrome) || w.chrome.some((v) => !WEAPON_VIEWS[v])))
      errors.push(`weapon.chrome: the files whose weapon shines as chrome (the engine's reflection, as Valve's first-person weapons do): ["v"]`);
    if ((spec.kind ?? "held") !== "held") errors.push(`kind: a weapon is "held": built lying along +x, its grip at the low-x end`);
    for (const [n, sound] of (Array.isArray(w?.sounds) ? w.sounds : w?.sounds === undefined ? [] : [null]).entries())
      if (!sound || typeof sound.spec !== "object" || (sound.event && (typeof sound.event.sequence !== "string" || !isNumber(sound.event.frame))))
        errors.push(`weapon.sounds[${n}]: { spec: <a sound spec>, event: { sequence, frame } }: the event plays it at that frame of the first-person animation`);
    for (const [n, anim] of (Array.isArray(w?.animations) ? w.animations : w?.animations === undefined ? [] : [null]).entries())
      if (!anim || typeof anim.replace !== "string" || !Array.isArray(anim.keys) || !anim.keys.some((key) => key?.at === 0) || anim.keys.some((key) => !isNumber(key?.at) || (key.aim !== undefined && !(Array.isArray(key.aim) && key.aim.length === 2 && key.aim.every(isNumber)))))
        errors.push(`weapon.animations[${n}]: { replace: "<the game's animation>", from, frames, fps, keys: [{ at, turn: { bone: { x, y, z } }, move: { bone: [x, y, z] }, aim: [across, up], ease }] }, a key at frame 0`);
  }
  for (const [name, material] of Object.entries(spec.materials ?? {}))
    try {
      materialOf(material, `materials.${name}`);
    } catch (error) {
      errors.push(error.message);
    }
  const known = { ...prefabs, ...(spec.prefabs ?? {}) };
  if (!Array.isArray(spec.parts) || !spec.parts.length) {
    errors.push("parts: a list of one part at least");
    return { errors, warnings };
  }
  for (const [k, view] of (spec.project ?? []).entries()) {
    const where = `project[${k}]`;
    if (typeof view?.picture !== "string") errors.push(`${where}.picture: the picture's file (work:pictures/front.png)`);
    if (view?.view !== undefined && !VIEW_NAMES[view.view]) errors.push(`${where}.view: one of ${Object.keys(VIEW_NAMES).join(", ")}, or yaw and pitch in its place`);
    if (view?.view === undefined && !isNumber(view?.yaw)) errors.push(`${where}: a view (front, left, ...) or a yaw and a pitch in degrees`);
    for (const key of ["area", "rect"])
      if (view?.[key] !== undefined && !(Array.isArray(view[key]) && view[key].length === 4 && view[key].every(isNumber)))
        errors.push(`${where}.${key}: [x0, y0, x1, y1] in the picture's pixels`);
  }
  const seen = new Map();
  spec.parts.forEach((part, i) => {
    const at = `parts[${i}]`;
    if (!part || typeof part !== "object") return void errors.push(`${at}: not an object`);
    const label = part.id ? `${at} (${part.id})` : at;
    if (typeof part.id !== "string" || !/^[A-Za-z][\w]*$/.test(part.id))
      errors.push(`${at}.id: a name of letters, digits and _, starting with a letter`);
    else if (seen.has(part.id)) errors.push(`${at}.id: "${part.id}" is the id of parts[${seen.get(part.id)}] too`);
    else seen.set(part.id, i);
    if (!KINDS[part.kind]) {
      errors.push(`${label}.kind: no kind ${JSON.stringify(part.kind)}. The kinds are: ${Object.keys(KINDS).join(", ")}.${nearest(part.kind, Object.keys(KINDS))}`);
      return;
    }
    for (const key of Object.keys(part))
      if (!COMMON.includes(key) && !KINDS[part.kind].includes(key))
        warnings.push(`${label}.${key}: a ${part.kind} takes no ${key}, left out.${nearest(key, [...COMMON, ...KINDS[part.kind]])}`);
    if (KINDS[part.kind].includes("symmetric") && part.symmetric !== undefined && typeof part.symmetric !== "boolean")
      errors.push(`${label}.symmetric: true (its right half made the mirror of its left, +y) or false`);
    if (part.material !== undefined && !part.kind.startsWith("kit:") && part.kind !== "prefab") {
      if (typeof part.material === "string" && spec.materials?.[part.material] === undefined)
        try {
          materialOf(part.material);
        } catch {
          errors.push(`${label}.material: "${part.material}" is neither in the spec's materials nor a base.${nearest(part.material, Object.keys(spec.materials ?? {}))}`);
        }
      else if (typeof part.material === "object")
        try {
          materialOf(part.material, `${label}.material`);
        } catch (error) {
          errors.push(error.message);
        }
    }
    const before = (id, where) => {
      if (!seen.has(id) || seen.get(id) >= i)
        errors.push(`${label}.${where}: "${id}" is no part given before this one (a part is placed on one listed above it).${nearest(id, [...seen.keys()])}`);
    };
    const positive = (key, value = part[key]) => {
      if (!isNumber(value) || value <= 0) errors.push(`${label}.${key}: a number over 0, not ${JSON.stringify(value)}`);
    };
    // panels: painted on a box's faces
    if (part.panels !== undefined) {
      if (!Array.isArray(part.panels)) errors.push(`${label}.panels: a list of { face, at, size, shape, style, edge, material }`);
      else
        part.panels.forEach((panel, k) => {
          const where = `${label}.panels[${k}]`;
          if (BOX_FACES[panel?.face ?? "front"] === undefined) errors.push(`${where}.face: one of ${Object.keys(BOX_FACES).join(", ")}`);
          if (!Array.isArray(panel?.at) || panel.at.length !== 2 || !panel.at.every(isNumber)) errors.push(`${where}.at: [x, y], its middle in units from the face's bottom left as one facing it sees it`);
          if (!Array.isArray(panel?.size) || panel.size.length !== 2 || !panel.size.every((v) => isNumber(v) && v > 0)) errors.push(`${where}.size: [width, height] in units, over 0`);
          if (panel?.shape !== undefined && !["rect", "round", "ellipse"].includes(panel.shape)) errors.push(`${where}.shape: rect, round or ellipse`);
          if (panel?.style !== undefined && !["inset", "raised", "flat"].includes(panel.style)) errors.push(`${where}.style: inset, raised or flat`);
          if (typeof panel?.material === "string" && spec.materials?.[panel.material] === undefined)
            try {
              materialOf(panel.material);
            } catch {
              errors.push(`${where}.material: "${panel.material}" is neither in the spec's materials nor a base`);
            }
        });
    }
    // marks: painted on a turned part's surface, as a ridge is built on it
    if (part.marks !== undefined) {
      if (!["turn", "cylinder", "sphere", "superquadric", "tube"].includes(part.kind))
        errors.push(`${label}.marks: marks are painted on a turned part (turn, cylinder, sphere or tube); a box's words are its print`);
      else if (!Array.isArray(part.marks)) errors.push(`${label}.marks: a list of { path, width, material, ends }`);
      else
        part.marks.forEach((mark, k) => {
          const where = `${label}.marks[${k}]`;
          if (!Array.isArray(mark?.path) || mark.path.length < 2 || mark.path.some((q) => !Array.isArray(q) || q.length !== 2 || !q.every(isNumber)))
            errors.push(`${where}.path: [[s, angle], ...], two places at least (s 0 to 1 along the part, the angle in degrees round it)`);
          if (mark?.width !== undefined && !(isNumber(mark.width) && mark.width > 0)) errors.push(`${where}.width: a number over 0 (units)`);
          for (const end of [mark?.ends ?? []].flat())
            if (!["round", "point"].includes(end)) errors.push(`${where}.ends: "round" or "point", or one of each`);
          if (typeof mark?.material === "string" && spec.materials?.[mark.material] === undefined)
            try {
              materialOf(mark.material);
            } catch {
              errors.push(`${where}.material: "${mark.material}" is neither in the spec's materials nor a base`);
            }
        });
    }
    if (part.views !== undefined && (!spec.weapon || !Array.isArray(part.views) || !part.views.length || part.views.some((v) => !WEAPON_VIEWS[v])))
      errors.push(`${label}.views: a weapon's part, in some of its files only: "v" (first person), "p" (in another player's hands), "w" (lying in the world); a stock behind the camera is ["p", "w"]`);
    if (part.texels !== undefined && !(isNumber(part.texels) && part.texels >= 0.25 && part.texels <= 8))
      errors.push(`${label}.texels: how finely it is painted against the rest, 0.25 to 8 (2: a face twice as fine as the body)`);
    switch (part.kind) {
      case "carved":
        if (!isPoint(part.size) || part.size.some((v) => v <= 0))
          errors.push(`${label}.size: [x, y, z], the thing's length, width and height in units: its outlines are stretched to it`);
        if (typeof part.sheet !== "string" && !(Array.isArray(part.pictures) && part.pictures.length))
          errors.push(`${label}: sheet (a picture of six sides laid as the kit's sheets are: front, left, back; right, top, below) or pictures ([{ picture, view or yaw and pitch, area, rect }])`);
        if (part.triangles !== undefined && !(Number.isInteger(part.triangles) && part.triangles >= 12)) errors.push(`${label}.triangles: how many it is reduced to, 12 or more`);
        if (part.cells !== undefined && !(Number.isInteger(part.cells) && part.cells >= 16 && part.cells <= 256)) errors.push(`${label}.cells: cells on its longest side, 16 to 256 (64)`);
        break;
      case "blob":
        if (!Array.isArray(part.pieces) || !part.pieces.length)
          errors.push(`${label}.pieces: a list of pieces, each { span: [bone, bone], radius } (along a limb), { at: bone or [x, y, z], radius } (round a joint or a point: a number, or [x, y, z] for an egg), or { from: [x, y, z], to: [x, y, z], radius }`);
        for (const [k, piece] of (part.pieces ?? []).entries()) {
          const where = `${label}.pieces[${k}]`;
          const radius = piece?.radius;
          const okRadius = isNumber(radius) ? radius > 0 : Array.isArray(radius) && (radius.length === 2 || radius.length === 3) && radius.every((v) => isNumber(v) && v > 0);
          if (!okRadius) errors.push(`${where}.radius: units over 0: a number, [start, end] along a span or from-to, or [x, y, z] round a point`);
          const kinds = [piece?.span !== undefined, piece?.at !== undefined, piece?.from !== undefined].filter(Boolean).length;
          if (kinds !== 1) errors.push(`${where}: one of span, at or from (with to)`);
          if (piece?.span !== undefined && !(Array.isArray(piece.span) && piece.span.length === 2 && piece.span.every((b) => typeof b === "string"))) errors.push(`${where}.span: [from bone, to bone] of the spec's base`);
          if ((piece?.span !== undefined || typeof piece?.at === "string") && !spec.base) errors.push(`${where}: bones are a base model's: give the spec a base, or place the piece by [x, y, z]`);
          if (piece?.at !== undefined && typeof piece.at !== "string" && !isPoint(piece.at)) errors.push(`${where}.at: a bone of the base, or [x, y, z]`);
          if (piece?.from !== undefined && !(isPoint(piece.from) && isPoint(piece.to))) errors.push(`${where}: from and to, each [x, y, z]`);
          if (piece?.offset !== undefined && !isPoint(piece.offset)) errors.push(`${where}.offset: [x, y, z] in units, from where it is put`);
          if (piece?.bone !== undefined && typeof piece.bone !== "string") errors.push(`${where}.bone: the bone its corners hang on`);
        }
        if (part.blend !== undefined && !(isNumber(part.blend) && part.blend >= 0 && part.blend <= 32)) errors.push(`${label}.blend: units over which pieces melt into each other, 0 to 32 (3)`);
        if (part.cells !== undefined && !(Number.isInteger(part.cells) && part.cells >= 16 && part.cells <= 160)) errors.push(`${label}.cells: cells along its longest side, 16 to 160 (64)`);
        if (part.triangles !== undefined && !(Number.isInteger(part.triangles) && part.triangles >= 12)) errors.push(`${label}.triangles: how many it is reduced to, 12 or more`);
        for (const key of ["attach", "span", "rotate", "at", "mirror", "repeat"]) if (part[key] !== undefined) errors.push(`${label}.${key}: a blob is placed by its pieces, not moved as a whole`);
        break;
      case "mesh":
        if (!isPoint(part.size) || part.size.some((v) => v <= 0))
          errors.push(`${label}.size: [x, y, z], the thing's length, width and height in units: the shape is fitted to it`);
        if (typeof part.file !== "string" || !/\.obj$/i.test(part.file)) errors.push(`${label}.file: an .obj of the work folder (a shape the tool generate made: "work:gen/chair_s0.obj")`);
        if (part.triangles !== undefined && !(Number.isInteger(part.triangles) && part.triangles >= 12)) errors.push(`${label}.triangles: how many it is reduced to, 12 or more`);
        if (part.up !== undefined && part.up !== "y" && part.up !== "z") errors.push(`${label}.up: "y" (an .obj's own way, and generate's) or "z"`);
        if (part.turn !== undefined && !isNumber(part.turn)) errors.push(`${label}.turn: degrees about the upright, when its front is not towards +x`);
        break;
      case "superquadric":
        if (!isPoint(part.size) || part.size.some((v) => v <= 0))
          errors.push(`${label}.size: [x, y, z], three numbers over 0 (its length, width and height)`);
        if (part.round !== undefined && !(Array.isArray(part.round) && part.round.length === 2 && part.round.every((v) => isNumber(v) && v >= 0.05 && v <= 2)))
          errors.push(`${label}.round: [up, round], each 0.05 to 2: how its outline turns from top to bottom and round its middle (0.1 a box's corners, 0.5 rounded, 1 an egg, 2 a diamond)`);
        break;
      case "box":
        if (!isPoint(part.size) || part.size.some((v) => v <= 0))
          errors.push(`${label}.size: [x, y, z], three numbers over 0 (its length along x, its width along y, its height)`);
        break;
      case "cylinder":
        positive("radius");
        positive("height");
        break;
      case "sphere":
        positive("radius");
        break;
      case "turn":
        if (!Array.isArray(part.rings) || part.rings.length < 2)
          errors.push(`${label}.rings: two rings at least, each [s, radius] (s: where along its axis, radius 0 or more)`);
        else
          part.rings.forEach((ring, k) => {
            const [s, r] = Array.isArray(ring) ? ring : [ring?.s, ring?.r];
            if (!isNumber(s) || !(isNumber(r) || (Array.isArray(r) && r.every(isNumber))) || (isNumber(r) && r < 0))
              errors.push(`${label}.rings[${k}]: [s, radius], or { s, r, crease }; r 0 or more, or [ra, rb] for an oval`);
            if (k && isNumber(s)) {
              const prior = part.rings[k - 1];
              const ps = Array.isArray(prior) ? prior[0] : prior?.s;
              if (isNumber(ps) && s <= ps) errors.push(`${label}.rings[${k}]: s must grow from one ring to the next (${ps}, then ${s})`);
            }
          });
        if (part.axis !== undefined && !["x", "y", "z"].includes(part.axis)) errors.push(`${label}.axis: "x", "y" or "z"`);
        break;
      case "tube":
        if (!Array.isArray(part.path) || part.path.length < 2 || part.path.some((q) => !Array.isArray(q) || q.length !== 4 || !q.every(isNumber)))
          errors.push(`${label}.path: two points at least, each [x, y, z, radius]`);
        break;
      case "cards":
        if (!(Array.isArray(part.size) && part.size.length === 3 && part.size.every((v) => isNumber(v) && v > 0))) errors.push(`${label}.size: [x, y, z], the crown's box in units`);
        if (part.count !== undefined && !(Number.isInteger(part.count) && part.count >= 2 && part.count <= 64)) errors.push(`${label}.count: how many cards, 2 to 64`);
        if (part.card !== undefined && !(Array.isArray(part.card) && part.card.length === 2 && part.card.every((v) => isNumber(v) && v > 0))) errors.push(`${label}.card: [width, height] of each card in units (unless told, the crown's: crossed through its middle)`);
        if (part.tilt !== undefined && !(isNumber(part.tilt) && part.tilt >= 0 && part.tilt <= 90)) errors.push(`${label}.tilt: degrees a scattered card may lean, 0 to 90 (30)`);
        break;
      case "leaf":
        if (part.rows === undefined) {
          positive("width");
          positive("height");
        }
        break;
      case "band":
      case "boss":
      case "ridge":
      case "studs": {
        if (!part.on || typeof part.on.part !== "string") {
          errors.push(`${label}.on: { part, s, angle }: the part it sits on, how far along it (0 to 1) and round it (degrees)`);
          break;
        }
        before(part.on.part, "on.part");
        const host = spec.parts[seen.get(part.on.part)];
        if (host && !["turn", "cylinder", "tube", "sphere", "superquadric"].includes(host.kind))
          errors.push(`${label}.on.part: a ${part.kind} sits on a turned part (turn, cylinder, sphere or tube); ${part.on.part} is a ${host.kind}`);
        if (part.kind === "ridge" || part.kind === "studs") {
          if (!Array.isArray(part.on.path) || part.on.path.length < 2)
            errors.push(`${label}.on.path: [[s, angle], ...], two places at least on the part it sits on`);
        } else if (!isNumber(part.on.s) || part.on.s < 0 || part.on.s > 1)
          errors.push(`${label}.on.s: how far along the part, 0 (its first ring) to 1 (its last)`);
        for (const key of ["attach", "at", "rotate", "mirror", "repeat"])
          if (part[key] !== undefined) errors.push(`${label}.${key}: a ${part.kind} moves with the part it sits on and takes no ${key} of its own`);
        break;
      }
      case "prefab": {
        const named = part.prefab;
        if (named !== undefined && !known[named])
          errors.push(`${label}.prefab: no prefab "${named}". The prefabs are: ${Object.keys(known).join(", ") || "none"}.${nearest(named, Object.keys(known))}`);
        if (named === undefined && part.spec === undefined && part.file === undefined)
          errors.push(`${label}: a prefab is named (prefab), given (spec) or read from a file (file)`);
        break;
      }
      default:
        if (part.kind.startsWith("kit:") && (typeof part.options !== "object" || !part.options))
          errors.push(`${label}.options: the kit's options, as its header in kits/ lists them`);
    }
    if (part.attach !== undefined) {
      if (typeof part.attach?.bone === "string") {
        if (!spec.base) errors.push(`${label}.attach.bone: a bone is a base model's: give the spec a base`);
      } else if (typeof part.attach?.to !== "string") errors.push(`${label}.attach.to: the id of the part it is put on (or bone: a base model's bone)`);
      else before(part.attach.to, "attach.to");
      for (const key of ["at", "toAt"]) {
        const anchor = part.attach?.[key];
        if (anchor !== undefined && typeof anchor === "string" && ![...BOX_ANCHORS, "start", "end"].includes(anchor))
          errors.push(`${label}.attach.${key}: one of ${[...BOX_ANCHORS, "start", "end"].join(", ")}, or { s, angle } on a turned part.${nearest(anchor, [...BOX_ANCHORS, "start", "end"])}`);
      }
      if (part.attach?.offset !== undefined && !isPoint(part.attach.offset)) errors.push(`${label}.attach.offset: [x, y, z]`);
    }
    if (part.span !== undefined && (!spec.base || !Array.isArray(part.span?.bones ?? part.span) || (part.span.bones ?? part.span).length !== 2))
      errors.push(`${label}.span: [from bone, to bone] (or { bones, over, keep }) of the spec's base model: the part laid along that limb`);
    if (part.span !== undefined && !spec.base) errors.push(`${label}: span is along a base model's bones: give the spec a base`);
    if (part.bone !== undefined && !spec.base && !spec.weapon) errors.push(`${label}: bone is a base model's or a weapon's: give the spec a base or a weapon`);
    if (part.at !== undefined && !isPoint(part.at)) errors.push(`${label}.at: [x, y, z], where its own origin goes`);
    if ([part.at, part.attach, part.span].filter((v) => v !== undefined).length > 1) errors.push(`${label}: at, attach or span, one of them`);
    if (part.rotate !== undefined && (!Array.isArray(part.rotate) || part.rotate.length !== 3 || !part.rotate.every(isNumber)))
      errors.push(`${label}.rotate: [yaw, pitch, roll] in degrees (about z, then y, then x)`);
    if (part.mirror !== undefined && !["x", "y"].includes(part.mirror))
      errors.push(`${label}.mirror: "y" (a copy on the other side, left for right) or "x" (front for back)`);
    if (part.repeat !== undefined && (!Number.isInteger(part.repeat?.count) || part.repeat.count < 2))
      errors.push(`${label}.repeat.count: a whole number, 2 or more`);
  });
  return { errors, warnings };
}

// ── the arithmetic of placing ─────────────────────────────────────────────
/** The matrix of a turn: yaw about z, after pitch about y, after roll about x (degrees). */
function rotation([yaw = 0, pitch = 0, roll = 0] = []) {
  const [cz, sz, cy, sy, cx, sx] = [yaw, yaw, pitch, pitch, roll, roll].map((d, i) =>
    i % 2 ? Math.sin(degrees(d)) : Math.cos(degrees(d)),
  );
  return [
    [cz * cy, cz * sy * sx - sz * cx, cz * sy * cx + sz * sx],
    [sz * cy, sz * sy * sx + cz * cx, sz * sy * cx - cz * sx],
    [-sy, cy * sx, cy * cx],
  ];
}
const turnPoint = (m, p) => m.map((row) => row[0] * p[0] + row[1] * p[1] + row[2] * p[2]);
const boxOf = (points) => {
  const mn = [Infinity, Infinity, Infinity];
  const mx = [-Infinity, -Infinity, -Infinity];
  for (const p of points)
    for (let k = 0; k < 3; k++) {
      mn[k] = Math.min(mn[k], p[k]);
      mx[k] = Math.max(mx[k], p[k]);
    }
  return { mn, mx };
};
/** A named anchor of a box: the middle of one of its faces, or its middle. */
function anchorOfBox({ mn, mx }, name) {
  const mid = mn.map((v, k) => (v + mx[k]) / 2);
  const at = {
    top: [mid[0], mid[1], mx[2]],
    bottom: [mid[0], mid[1], mn[2]],
    front: [mx[0], mid[1], mid[2]],
    back: [mn[0], mid[1], mid[2]],
    left: [mid[0], mx[1], mid[2]],
    right: [mid[0], mn[1], mid[2]],
    centre: mid,
  };
  return at[name];
}

// ── the parts, each built in its own space ─────────────────────────────────
/** How a turned part's (s, a, b) is stood in its own space: along its axis. */
const AXES = {
  z: (s, a, b) => [a, b, s],
  x: (s, a, b) => [s, a, b],
  y: (s, a, b) => [b, s, a],
};

/** The rings of a part that is turned, from its spec: [{ s, r, crease }] and its caps. */
function turnedOf(part) {
  const sides = part.sides ?? 16;
  if (part.kind === "cylinder") {
    const top = part.top ?? part.radius;
    return { rings: [[0, part.radius], [part.height, top]], caps: [true, true], sides };
  }
  if (part.kind === "sphere") {
    const count = Math.max(4, Math.round(sides / 2));
    const R = part.radius;
    const rings = Array.from({ length: count + 1 }, (_, i) => {
      const angle = -Math.PI / 2 + (Math.PI * i) / count;
      return [R + R * Math.sin(angle), R * Math.cos(angle) < 1e-9 ? 0 : R * Math.cos(angle)];
    });
    return { rings, caps: [false, false], sides };
  }
  if (part.kind === "superquadric") {
    // Barr's superquadric (1981) as rings up its height: each ring a superellipse of the part's width and length,
    // scaled by how far up it is. `round` [up, round]: 0.1 a box with its corners eased, 1 an ellipsoid
    const [e1, e2] = part.round ?? [0.3, 0.3];
    const [X, Y, Z] = part.size;
    const spow = (v, e) => Math.sign(v) * Math.abs(v) ** e;
    const count = Math.max(4, Math.round(sides / 2));
    const rings = Array.from({ length: count + 1 }, (_, i) => {
      const v = -Math.PI / 2 + (Math.PI * i) / count;
      const k = Math.abs(Math.cos(v)) < 1e-9 ? 0 : spow(Math.cos(v), e1);
      const s = (Z / 2) * (1 + spow(Math.sin(v), e1));
      // the superellipse's radius at an angle round the part's axis: |cos/a|^(2/e) + |sin/b|^(2/e) = r^(-2/e)
      const r = k === 0 ? 0 : (angle) => k * (Math.abs(Math.cos(angle) / (X / 2)) ** (2 / e2) + Math.abs(Math.sin(angle) / (Y / 2)) ** (2 / e2)) ** (-e2 / 2);
      return { s, r };
    });
    return { rings, caps: [false, false], sides };
  }
  return { rings: part.rings, caps: part.caps ?? [true, true], sides };
}
/** The largest radius of a turned part's rings. */
const widestOf = (rings) =>
  Math.max(...rings.map((ring) => [Array.isArray(ring) ? ring[1] : ring.r].flat()).flat().filter(isNumber), 0.1);

/** The closed ends of a turned part that get a disc of the picture: [[end, diameter], ...]. */
function capDiscs(part) {
  if (!["turn", "cylinder"].includes(part.kind)) return [];
  const { rings, caps } = turnedOf(part);
  const radiusAt = (ring) => Math.max(...[Array.isArray(ring) ? ring[1] : ring.r].flat().filter(isNumber));
  return [0, 1]
    .filter((end) => caps[end] && radiusAt(end ? rings.at(-1) : rings[0]) > 0)
    .map((end) => [end, 2 * radiusAt(end ? rings.at(-1) : rings[0])]);
}

/** How large a part's zone of the picture is, in units [long, wide], before it is built. */
function zoneSizeOf(part, hostOf) {
  switch (part.kind) {
    case "box": {
      const [x, y, z] = part.size;
      return [2 * (x + y), Math.max(x, y) + z];
    }
    case "superquadric": {
      const [x, y, z] = part.size;
      return [Math.max(1, z), Math.max(1, 2 * (x + y))];
    }
    case "blob":
    case "mesh":
    case "carved": {
      // six patches, one for each way a face can look, three across and two down
      const [x, y, z] = part.size;
      const most = Math.max(x, y, z);
      return [3 * most, 2 * most];
    }
    case "cylinder":
    case "sphere":
    case "turn": {
      const { rings } = turnedOf(part);
      const first = Array.isArray(rings[0]) ? rings[0][0] : rings[0].s;
      const last = Array.isArray(rings.at(-1)) ? rings.at(-1)[0] : rings.at(-1).s;
      return [Math.max(1, last - first + widestOf(rings)), 2 * Math.PI * widestOf(rings)];
    }
    case "tube": {
      let length = 0;
      for (let i = 1; i < part.path.length; i++)
        length += Math.hypot(...[0, 1, 2].map((k) => part.path[i][k] - part.path[i - 1][k]));
      return [Math.max(1, length), 2 * Math.PI * Math.max(...part.path.map((q) => q[3]), 0.1)];
    }
    case "cards": {
      const [w, h] = part.card ?? [Math.max(part.size[0], part.size[1]), part.size[2]];
      return [w, h];
    }
    case "leaf": {
      if (!part.rows) return [part.width, part.height];
      // a grid's real size, as the workshop's leaf lays it: across its zone from row to row, and down it
      // along a row
      const along = (line) => line.slice(1).reduce((sum, p, i) => sum + Math.hypot(...[0, 1, 2].map((k) => p[k] - line[i][k])), 0);
      const rows = part.rows;
      return [Math.max(...rows[0].map((_, j) => along(rows.map((row) => row[j]))), 1), Math.max(...rows.map(along), 1)];
    }
    case "band":
      return [2 * Math.PI * widestOf(turnedOf(hostOf(part)).rings), (part.width ?? 0.5) * 2];
    case "ridge":
      return [8, (part.width ?? 0.5) * 3];
    default:
      return [(part.radius ?? 0.3) * 3, (part.radius ?? 0.3) * 3];
  }
}

/**
 * Builds one part into a workshop shape `M` in the part's own space and paints its zone on `S`. Returns what a
 * part on its surface needs ({ surface, from, to }: the turned surface and its first and last ring's s) and
 * its axis's two ends.
 */
/**
 * A leaf's grid with the columns of points left out that every row keeps within LEAF_TOLERANCE of the line
 * between the columns kept either side of them (Douglas-Peucker, across the rows at once): the outline as the
 * game shows it, and a triangle of each side for a quad saved. The same rule as a ring's sides, half a unit off its
 * circle on a prop: this is a quarter.
 */
const LEAF_TOLERANCE = 0.25;
function leanerRows(rows) {
  const n = rows[0].length;
  if (n <= 2 || rows.some((row) => row.length !== n)) return rows;
  const off = (p, a, b) => {
    const ab = [0, 1, 2].map((k) => b[k] - a[k]);
    const ap = [0, 1, 2].map((k) => p[k] - a[k]);
    const l2 = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2 || 1;
    const t = Math.max(0, Math.min(1, (ap[0] * ab[0] + ap[1] * ab[1] + ap[2] * ab[2]) / l2));
    return Math.hypot(...[0, 1, 2].map((k) => ap[k] - t * ab[k]));
  };
  const keep = new Set([0, n - 1]);
  const split = (i, j) => {
    let worst = -1;
    let at = -1;
    for (let k = i + 1; k < j; k++) {
      const d = Math.max(...rows.map((row) => off(row[k], row[i], row[j])));
      if (d > worst) [worst, at] = [d, k];
    }
    if (worst > LEAF_TOLERANCE) {
      keep.add(at);
      split(i, at);
      split(at, j);
    }
  };
  split(0, n - 1);
  const kept = [...keep].sort((a, b) => a - b);
  return rows.map((row) => kept.map((k) => row[k]));
}

function buildPart(part, M, S, zone, px, material, hostSurface, capZones = []) {
  for (const capZone of capZones) if (capZone) S.zone(capZone, zonePainter(material, capZone, px), 2);
  const painterRound = ["turn", "cylinder", "sphere", "superquadric", "tube"].includes(part.kind) ? "v" : null;
  // a crown's cards thin out to nothing at an egg inside each card, so that no card's straight edge shows
  const painted = part.kind === "cards" ? { ...material, crown: [zone.w / px, zone.h / px] } : material;
  S.zone(zone, zonePainter(painted, zone, px, { round: painterRound }), 2);
  switch (part.kind) {
    case "box": {
      const [x, y, z] = part.size;
      const corner = (i) => [(i & 1 ? 0.5 : -0.5) * x, (i & 2 ? 0.5 : -0.5) * y, i & 4 ? z : 0];
      const inside = [0, 0, z / 2];
      // the six faces, each in a sixth of the zone (3 across, 2 down)
      const faces = [
        [0, 1, 3, 2],
        [4, 5, 7, 6],
        [0, 1, 5, 4],
        [2, 3, 7, 6],
        [0, 2, 6, 4],
        [1, 3, 7, 5],
      ];
      faces.forEach((face, f) => {
        const cell = { x: zone.x + ((f % 3) * zone.w) / 3, y: zone.y + (Math.floor(f / 3) * zone.h) / 2, w: zone.w / 3, h: zone.h / 2 };
        // words printed on a face: in the labels' letters, as large as the face's cell holds, in `ink`. A
        // side face's picture runs up the face from its top row, so the letters are drawn turned over.
        for (const print of [part.print ?? []].flat())
          if (BOX_FACES[print.face ?? "front"] === f) paintWords(S, cell, print, material, px, f !== 1, f === 4 || f === 3);
        // panels painted on a face: a drawer, a door, a slot, a pull, in relief that is only paint
        const onFace = (part.panels ?? []).filter((panel) => BOX_FACES[panel.face ?? "front"] === f);
        if (onFace.length) paintPanels(S, cell, onFace, material, px, f !== 1, f === 4 || f === 3, faceSize(part.size, f));
        const pixel = [
          [cell.x, cell.y],
          [cell.x + cell.w, cell.y],
          [cell.x + cell.w, cell.y + cell.h],
          [cell.x, cell.y + cell.h],
        ];
        M.quad(...face.map((c, k) => M.V(corner(c), pixel[k])), inside);
      });
      return { ends: [anchorOfBox(boxOf([corner(0), corner(7)]), "bottom"), anchorOfBox(boxOf([corner(0), corner(7)]), "top")] };
    }
    case "blob":
    case "mesh":
    case "carved": {
      // the carved hull's triangles, each laid flat on the patch of the zone for the way it most faces: seen
      // from that side, as a picture of that side would paint it (project paints it from the pictures)
      const most = Math.max(...part.size);
      const cellW = zone.w / 3;
      const cellH = zone.h / 2;
      const [X, Y, Z] = part.size;
      const lo = [-X / 2, -Y / 2, 0];
      const flat = (p, axis) => (axis === 0 ? [p[1] - lo[1], Z - p[2]] : axis === 1 ? [p[0] - lo[0], Z - p[2]] : [p[0] - lo[0], p[1] - lo[1]]);
      for (const t of part.carvedTris) {
        const n = cross(sub(t[1].p, t[0].p), sub(t[2].p, t[0].p));
        const axis = [0, 1, 2].reduce((a, k) => (Math.abs(n[k]) > Math.abs(n[a]) ? k : a), 0);
        const cell = axis * 2 + (n[axis] < 0 ? 1 : 0);
        const [cx, cy] = [zone.x + (cell % 3) * cellW, zone.y + Math.floor(cell / 3) * cellH];
        const corner = (c) => {
          const [u, v] = flat(c.p, axis);
          return M.V(c.p, [cx + 1 + (u / most) * (cellW - 2), cy + 1 + (v / most) * (cellH - 2)]);
        };
        // its own winding, as carved (outwards): `inside` only breaks a tie
        const mid = [0, 1, 2].map((k) => (t[0].p[k] + t[1].p[k] + t[2].p[k]) / 3);
        M.tri(corner(t[0]), corner(t[1]), corner(t[2]), mid.map((v, k) => v - n[k]));
      }
      return { ends: [[0, 0, 0], [0, 0, Z]] };
    }
    case "cylinder":
    case "sphere":
    case "superquadric":
    case "turn": {
      const { rings, caps, sides } = turnedOf(part);
      const at = AXES[part.axis ?? "z"];
      const withZones = caps.map((cap, end) =>
        !cap || !capZones[end] ? cap : cap === true ? { dome: 0, zone: capZones[end] } : isNumber(cap) ? { dome: cap, zone: capZones[end] } : { ...cap, zone: capZones[end] },
      );
      const options = { name: part.id, sides, caps: withZones, at };
      if (part.lining) options.lining = { inset: 0.4, cap: true, ...part.lining, zone };
      const surface = M.turn(rings, zone, options);
      const ss = rings.map((ring) => (Array.isArray(ring) ? ring[0] : ring.s));
      return { surface, from: ss[0], to: ss.at(-1), ends: [at(ss[0], 0, 0), at(ss.at(-1), 0, 0)] };
    }
    case "tube": {
      const caps = part.caps ?? [part.path[0][3] > 0, part.path.at(-1)[3] > 0];
      const surface = M.tube(part.path, zone, { name: part.id, sides: part.sides ?? 8, caps });
      return { surface, from: 0, to: surface.length, ends: [part.path[0].slice(0, 3), part.path.at(-1).slice(0, 3)] };
    }
    case "cards": {
      // thin sheets seen from both sides, all wearing one picture of leaves with holes in it (material leaves):
      // crossed through the crown's middle, each turned by an even share of a half turn and the last laid flat; or,
      // given a `card` smaller than the crown, scattered through it at seeded places, turns and leans
      const [X, Y, Z] = part.size;
      const count = part.count ?? 4;
      const crossed = !part.card;
      const [w, h] = part.card ?? [Math.max(X, Y), Z];
      const tilt = ((part.tilt ?? 30) * Math.PI) / 180;
      let seed = 0;
      for (const ch of part.id) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
      const r = (k) => {
        const v = Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453;
        return v - Math.floor(v);
      };
      for (let i = 0; i < count; i++) {
        let c;
        let along;
        let up;
        if (crossed && i < count - 1) {
          const yaw = (Math.PI * i) / (count - 1);
          [c, along, up] = [[0, 0, Z / 2], [(Math.cos(yaw) * X) / Math.max(X, Y), (Math.sin(yaw) * Y) / Math.max(X, Y), 0], [0, 0, 1]];
        } else if (crossed) {
          [c, along, up] = [[0, 0, Z * 0.55], [X / Math.max(X, Y), 0, 0], [0, Y / Z, 0]];
        } else {
          // a point inside the crown's egg, a turn about the upright and a lean
          let p;
          for (let k = 0; ; k++) {
            p = [r(i * 7 + k * 101) * 2 - 1, r(i * 7 + k * 101 + 1) * 2 - 1, r(i * 7 + k * 101 + 2) * 2 - 1];
            if (Math.hypot(...p) <= 1 || k > 20) break;
          }
          c = [(p[0] * (X - w)) / 2, (p[1] * (Y - w)) / 2, Z / 2 + (p[2] * (Z - h)) / 2];
          const yaw = Math.PI * r(i * 7 + 3);
          const lean = tilt * (r(i * 7 + 4) * 2 - 1);
          along = [Math.cos(yaw), Math.sin(yaw), 0];
          up = [-Math.sin(yaw) * Math.sin(lean), Math.cos(yaw) * Math.sin(lean), Math.cos(lean)];
        }
        const at = (a, b) => [0, 1, 2].map((k) => c[k] + along[k] * a * (w / 2) + up[k] * b * (h / 2));
        M.leaf([[at(-1, -1), at(1, -1)], [at(-1, 1), at(1, 1)]], zone, { name: part.id });
      }
      return {};
    }
    case "leaf": {
      const bend = part.bend ?? 0;
      const given = part.rows ?? [0, 0.5, 1].map((t) =>
        [-0.5, 0, 0.5].map((u) => [u * part.width, bend * (1 - 4 * u * u) * Math.sin(Math.PI * t), t * part.height]),
      );
      const rows = part.rows ? leanerRows(given) : given;
      M.leaf(rows, zone, { name: part.id });
      return { leaner: given[0].length - rows[0].length };
    }
    case "band": {
      const { surface, from, to } = hostSurface;
      M.band(surface, from + part.on.s * (to - from), zone, { name: part.id, width: part.width ?? 0.6, height: part.height ?? 0.2 });
      return {};
    }
    case "boss": {
      const { surface, from, to } = hostSurface;
      M.boss(surface, [from + part.on.s * (to - from), degrees(part.on.angle ?? 0)], zone, {
        name: part.id,
        radius: part.radius ?? 0.4,
        height: part.height ?? 0.2,
        sides: part.sides ?? 8,
        rings: 2,
      });
      return {};
    }
    case "ridge":
    case "studs": {
      const { surface, from, to } = hostSurface;
      const path = part.on.path.map(([s, angle]) => [from + s * (to - from), degrees(angle)]);
      if (part.kind === "ridge")
        M.ridge(surface, path, zone, { name: part.id, width: part.width ?? 0.5, height: part.height ?? 0.2, ends: part.ends ?? ["point", "point"] });
      else M.studs(surface, path, zone, { name: part.id, count: part.count ?? 6, radius: part.radius ?? 0.2, height: part.height ?? 0.1 });
      return {};
    }
    default:
      throw new Error(`${part.id}: a ${part.kind} is not built on the shared picture`);
  }
}

/** A kit's piece from its options; a blade's `half` may be given as { taper: [base, tip] }. */
function kitPiece(part) {
  const options = structuredClone(part.options);
  if (part.kind === "kit:sword" && options.blade?.half?.taper) options.blade.half = taper(...options.blade.half.taper);
  const make = { "kit:sword": sword, "kit:axe": axe, "kit:blunt": blunt, "kit:bow": bow }[part.kind];
  return make({ seed: 1, ...options });
}

/**
 * The triangles of a spec, every part built and placed, before anything is written: { meshes, parts,
 * warnings }. Each mesh is { tris, image, flags, name } with every triangle's part named (`part` on its first
 * corner's triangle record). Used for a model, and for a prefab inside another.
 */
function piecesOf(given, context) {
  const warnings = [];
  const facts = [];
  const spec = context.skeleton ? { ...given, parts: given.parts.map((part) => (part.span ? atSpanLength(part, context.skeleton) : part)) } : given;
  const prefabs = { ...context.prefabs, ...(spec.prefabs ?? {}) };
  const byId = new Map(spec.parts.map((part) => [part.id, part]));
  const materialFor = (part) => {
    const given = part.material ?? (part.kind === "cards" ? "leaves" : "wood");
    return materialOf(typeof given === "string" && spec.materials?.[given] !== undefined ? spec.materials[given] : given);
  };
  // the shared pictures: one a set of flags (a flame is drawn unlit, so it needs a texture of its own)
  const flat = spec.parts.filter((part) => !part.kind.startsWith("kit:") && part.kind !== "prefab");
  const sheets = new Map();
  for (const part of flat) {
    const flags = flagsOf(materialFor(part));
    if (!sheets.has(flags)) sheets.set(flags, []);
    sheets.get(flags).push(part);
  }
  // a model painted from pictures gets the larger picture unless told: shared out by area, 512 x 256 left a
  // battery's small top parts coarser than Valve's own textures for them
  const size = spec.texture ?? (spec.project?.length || spec.fidelity === "high" ? { width: 512, height: 512 } : {});
  const built = new Map();
  /** every placed triangle: { p: [a, b, c] (corners, each with uv), part, mesh } */
  const meshes = [];
  [...sheets.entries()].forEach(([flags, parts], n) => {
    // a part's `texels` weighs its share of the picture: a face at 2 is painted twice as finely as the body
    const sizes = Object.fromEntries(parts.map((part) => [part.id, [...zoneSizeOf(part, (p) => byId.get(p.on.part)).slice(0, 2), (part.texels ?? 1) ** 2]]));
    // the first sheet is the size the spec gives; a sheet of its own (a net, a flame) takes the shape of its
    // largest part: a long net a long picture, or its holes are coarser than its cords
    const [width, height] = n ? sheetShape(Object.values(sizes)) : [size.width ?? SHEET_SIZE, size.height ?? SHEET_SIZE];
    // a turned part's closed ends are painted as discs of their own: a table's top shows its grain across it
    for (const part of parts) for (const [end, size] of capDiscs(part)) sizes[`${part.id}#cap${end}`] = [size, size];
    const zones = allot(width, height, sizes, { gap: 4 });
    const M = shape(width, height);
    const S = sheet(width, height);
    for (const part of parts) {
      const start = M.tris.length;
      const host = ON_SURFACE.has(part.kind) ? built.get(part.on.part) : null;
      const capZones = [0, 1].map((end) => zones[`${part.id}#cap${end}`]);
      // a panel's own material, resolved as a part's is
      const panels = part.panels?.map((panel) => (panel.material ? { ...panel, material: materialFor({ material: panel.material }) } : panel));
      const made = buildPart(panels ? { ...part, panels } : part, M, S, zones[part.id], zones.px, materialFor(part), host?.made, capZones);
      built.set(part.id, { made, mesh: meshes.length, range: [start, M.tris.length], host: host ? part.on.part : null });
      if (made.leaner) facts.push(`${part.id}: ${made.leaner} of its grid's ${part.rows[0].length} columns of points left out, each within ${LEAF_TOLERANCE} of the line through its neighbours`);
    }
    meshes.push({ tris: M.tris, image: S.image(), flags, name: `sheet${n}` });
    // marks painted on the parts that have them, in each part's own space, before it is placed
    for (const part of parts.filter((p) => p.marks?.length)) {
      const { made, range } = built.get(part.id);
      paintMarks(meshes.at(-1).image, M.tris.slice(...range), made.surface, {
        from: made.from,
        to: made.to,
        marks: part.marks,
        colourOf: (mark, x, y) => colourAt(materialFor({ material: mark.material ?? { base: "paint", tone: [0.05, 0.05, 0.05] } }), x, y, 1, zones.px),
        px: zones.px,
      });
    }
    const partOf = new Array(M.tris.length);
    for (const part of parts) {
      const { range } = built.get(part.id);
      for (let i = range[0]; i < range[1]; i++) partOf[i] = part.id;
    }
    meshes.at(-1).partOf = partOf;
  });
  // kits and prefabs: meshes of their own
  for (const part of spec.parts) {
    if (part.kind.startsWith("kit:")) {
      const piece = kitPiece(part);
      meshes.push({ tris: piece.tris, image: shrink(piece.image, KIT_SHRINK), flags: 0, name: part.id, partOf: piece.tris.map(() => part.id) });
      built.set(part.id, { made: { ends: [[0, 0, 0], [Math.max(...piece.tris.flat().map((c) => c.p[0])), 0, 0]] }, mesh: meshes.length - 1, range: [0, piece.tris.length] });
    } else if (part.kind === "prefab") {
      const inner = part.spec ?? prefabs[part.prefab] ?? JSON.parse(readFileSync(resolve(context.folder ?? ".", part.file), "utf8"));
      const problems = validateModelSpec(inner, { prefabs });
      if (problems.errors.length) throw new Error(`${part.id}: its prefab is not sound: ${problems.errors.join("; ")}`);
      const folder = part.file ? dirname(resolve(context.folder ?? ".", part.file)) : context.folder;
      const result = piecesOf(inner, { ...context, prefabs, folder });
      const scale = part.scale ?? 1;
      const first = meshes.length;
      for (const mesh of result.meshes) {
        mesh.tris = mesh.tris.map((t) => t.map((c) => ({ ...c, p: c.p.map((v) => v * scale) })));
        mesh.partOf = mesh.partOf.map((id) => `${part.id}.${id}`);
        mesh.name = `${part.id}_${mesh.name}`;
        meshes.push(mesh);
      }
      built.set(part.id, { made: {}, prefab: [first, meshes.length] });
      warnings.push(...result.warnings.map((w) => `${part.id}: ${w}`));
    }
  }

  // ── placing: each part (with what sits on it) turned, then moved to its place, then copied ──
  /** the triangles of a part and of the parts on its surface: [{ mesh, i }] */
  const trianglesOf = (id) => {
    const entry = built.get(id);
    if (entry.prefab) {
      const list = [];
      for (let m = entry.prefab[0]; m < entry.prefab[1]; m++) meshes[m].tris.forEach((_, i) => list.push({ mesh: m, i }));
      return list;
    }
    const list = [];
    for (let i = entry.range[0]; i < entry.range[1]; i++) list.push({ mesh: entry.mesh, i });
    for (const [other, e] of built) if (e.host === id) list.push(...trianglesOf(other));
    return list;
  };
  const pointsOf = (list) => list.flatMap(({ mesh, i }) => meshes[mesh].tris[i].map((c) => c.p));
  const move = (list, f, flip = false) => {
    for (const { mesh, i } of list) {
      const t = meshes[mesh].tris[i];
      const moved = t.map((c) => ({ ...c, p: f(c.p) }));
      meshes[mesh].tris[i] = flip ? [moved[0], moved[2], moved[1]] : moved;
    }
  };
  const placed = new Map();
  /** where a part's anchor is now: a name, or { s, angle } on a turned part */
  const anchorOf = (id, anchor, list) => {
    const entry = built.get(id);
    if (anchor && typeof anchor === "object") {
      const { surface, from, to } = entry.made;
      if (!surface) throw new Error(`${id}: { s, angle } is a place on a turned part; ${id} is not one`);
      // the point on the surface as placed, then `out` along the placed surface's own normal: a part laid
      // along a limb is stretched along its length, which turns a normal taken before it (a squat torso's,
      // stretched 25 times, looked nearly straight up, and 5 units out went 80 up)
      const { transform } = placed.get(id);
      const s = from + anchor.s * (to - from);
      const a = degrees(anchor.angle ?? 0);
      const on = surface.at(s, a, 0);
      const p0 = transform(on.p);
      const out = anchor.out ?? 0;
      if (!out) return p0;
      const step = Math.max(1e-3, (to - from) * 1e-3);
      const alongS = transform(surface.at(s + (s + step <= to ? step : -step), a, 0).p).map((v, k) => (v - p0[k]) * (s + step <= to ? 1 : -1));
      const round = transform(surface.at(s, a + 1e-3, 0).p).map((v, k) => v - p0[k]);
      let normal = [alongS[1] * round[2] - alongS[2] * round[1], alongS[2] * round[0] - alongS[0] * round[2], alongS[0] * round[1] - alongS[1] * round[0]];
      // turned away from the middle of its ring (the mean of the ring's points round the axis, placed): a
      // step "out" taken before the stretch is mostly a step along the axis, and cannot say which way is out
      const ring = Array.from({ length: 8 }, (_, k) => transform(surface.at(s, (k * Math.PI) / 4, 0).p));
      const middle = [0, 1, 2].map((k) => ring.reduce((sum, q) => sum + q[k], 0) / ring.length);
      const outward = p0.map((v, k) => v - middle[k]);
      if (normal[0] * outward[0] + normal[1] * outward[1] + normal[2] * outward[2] < 0) normal = normal.map((v) => -v);
      const length = Math.hypot(...normal) || 1;
      return p0.map((v, k) => v + (normal[k] / length) * out);
    }
    if (anchor === "start" || anchor === "end") {
      const ends = entry.made.ends;
      if (!ends) throw new Error(`${id}: has no start and end (only turned parts, tubes, boxes and kits do)`);
      return placed.get(id).transform(ends[anchor === "start" ? 0 : 1]);
    }
    return anchorOfBox(boxOf(pointsOf(list)), anchor ?? "centre");
  };
  const skeleton = context.skeleton;
  const jointOf = (name, where) => {
    const joint = skeleton?.joints.get(name);
    if (!joint) throw new Error(`${where}: the base has no bone "${name}". Its bones: ${[...(skeleton?.joints.keys() ?? [])].join(", ")}`);
    return joint;
  };
  for (const part of spec.parts) {
    if (ON_SURFACE.has(part.kind)) continue;
    const list = trianglesOf(part.id);
    const turn = rotation(part.rotate);
    move(list, (p) => turnPoint(turn, p));
    if (part.span) {
      // laid along a limb: the part's own z (its length) from the first joint to the second, stretched to
      // the distance between them (and `over` past each end), its x towards the front as near as it goes
      const [fromBone, toBone] = part.span.bones ?? part.span;
      const a = jointOf(fromBone, `${part.id}.span`);
      const b = jointOf(toBone, `${part.id}.span`);
      const over = part.span.over ?? 0;
      const way = b.map((v, k) => v - a[k]);
      const length = Math.hypot(...way);
      const z = way.map((v) => v / (length || 1));
      const front = Math.abs(z[0]) > 0.9 ? [0, 0, -1] : [1, 0, 0];
      const along = front.map((v, k) => v - z[k] * (front[0] * z[0] + front[1] * z[1] + front[2] * z[2]));
      const xLength = Math.hypot(...along);
      const x = along.map((v) => v / xLength);
      const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
      const zs = pointsOf(list).map((p) => p[2]);
      const [z0, z1] = [Math.min(...zs), Math.max(...zs)];
      const stretch = part.span.keep ? 1 : (length + 2 * over) / (z1 - z0 || 1);
      const laid = (p) => {
        const h = (p[2] - z0) * stretch - (part.span.keep ? 0 : over);
        return [0, 1, 2].map((k) => a[k] + x[k] * p[0] + y[k] * p[1] + z[k] * h);
      };
      move(list, laid);
      // a place on its surface, or its ends, go where the part went
      placed.set(part.id, { transform: (p) => laid(turnPoint(turn, p)) });
      continue;
    }
    let shift = [0, 0, 0];
    if (part.at) shift = part.at;
    else if (part.attach?.bone) {
      // its start or end (a turned part's first or last ring) on the joint, as for a part attached to a part
      const mine = part.attach.at === "start" || part.attach.at === "end"
        ? turnPoint(turn, built.get(part.id).made.ends?.[part.attach.at === "start" ? 0 : 1] ?? [0, 0, 0])
        : anchorOfBox(boxOf(pointsOf(list)), part.attach.at ?? "centre");
      const joint = jointOf(part.attach.bone, `${part.id}.attach.bone`);
      shift = joint.map((v, k) => v - mine[k] + (part.attach.offset?.[k] ?? 0));
    } else if (part.attach) {
      const mine = part.attach.at === "start" || part.attach.at === "end"
        ? turnPoint(turn, built.get(part.id).made.ends?.[part.attach.at === "start" ? 0 : 1] ?? [0, 0, 0])
        : anchorOfBox(boxOf(pointsOf(list)), part.attach.at ?? "bottom");
      const target = anchorOf(part.attach.to, part.attach.toAt ?? "top", trianglesOf(part.attach.to));
      shift = target.map((v, k) => v - mine[k] + (part.attach.offset?.[k] ?? 0));
    }
    move(list, (p) => p.map((v, k) => v + shift[k]));
    placed.set(part.id, { transform: (p) => turnPoint(turn, p).map((v, k) => v + shift[k]) });
  }
  // on a skeleton, every corner hangs on a bone: the part's own (`bone`, its span's first, its attach's), or
  // the bone whose joint is nearest the part's middle; what sits on a part hangs where that part hangs
  if (skeleton) {
    const boneOfPart = (part) => {
      if (ON_SURFACE.has(part.kind)) return boneOfPart(byId.get(part.on.part));
      if (part.bone) return jointOf(part.bone, `${part.id}.bone`) && part.bone;
      if (part.span) return (part.span.bones ?? part.span)[0];
      if (part.attach?.bone) return part.attach.bone;
      if (part.attach?.to) return boneOfPart(byId.get(part.attach.to));
      const middle = anchorOfBox(boxOf(pointsOf(trianglesOf(part.id))), "centre");
      let best = null;
      for (const [name, joint] of skeleton.joints) {
        const d = Math.hypot(...joint.map((v, k) => v - middle[k]));
        if (!best || d < best.d) best = { name, d };
      }
      return best.name;
    };
    for (const part of spec.parts) {
      if (ON_SURFACE.has(part.kind)) continue;
      // a blob's corners each on the bone of the piece nearest them: one surface over several bones
      if (part.kind === "blob") {
        for (const { mesh, i } of trianglesOf(part.id)) meshes[mesh].tris[i] = meshes[mesh].tris[i].map((c) => ({ ...c, bone: nearestPiece(part.blobPieces, c.p).bone }));
        continue;
      }
      // a carved or generated body on a skeleton, unless told its bone: each corner on the limb it is nearest, so
      // that one shape cut from the pictures bends at the base's joints (research/character-texturing.md, CT 2)
      if ((part.kind === "carved" || part.kind === "mesh") && !part.bone && !part.attach && !part.span) {
        const limbs = limbsOf(skeleton);
        for (const { mesh, i } of trianglesOf(part.id)) meshes[mesh].tris[i] = meshes[mesh].tris[i].map((c) => ({ ...c, bone: nearestLimb(limbs, c.p) }));
        continue;
      }
      const bone = boneOfPart(part);
      for (const { mesh, i } of trianglesOf(part.id)) meshes[mesh].tris[i] = meshes[mesh].tris[i].map((c) => ({ ...c, bone }));
    }
  }
  /** a bone's name for the other side: Bip01 L Arm for Bip01 R Arm */
  const otherSide = otherSideOf;
  // copies, after every part is in its place: mirrored, then repeated round an axis
  for (const part of spec.parts) {
    if (ON_SURFACE.has(part.kind) || (!part.mirror && !part.repeat)) continue;
    let list = trianglesOf(part.id);
    const copy = (f, flip) => {
      const added = [];
      for (const { mesh, i } of list) {
        const t = meshes[mesh].tris[i];
        const moved = t.map((c) => ({ ...c, p: f(c.p) }));
        meshes[mesh].tris.push(flip ? [moved[0], moved[2], moved[1]] : moved);
        meshes[mesh].partOf.push(meshes[mesh].partOf[i]);
        added.push({ mesh, i: meshes[mesh].tris.length - 1 });
      }
      return added;
    };
    if (part.mirror) {
      const axis = part.mirror === "x" ? 0 : 1;
      const added = copy((p) => p.map((v, k) => (k === axis ? -v : v)), true);
      // a copy across y on a skeleton hangs on the other side's bone
      if (skeleton && axis === 1)
        for (const { mesh, i } of added) meshes[mesh].tris[i] = meshes[mesh].tris[i].map((c) => ({ ...c, bone: otherSide(c.bone) }));
      list = [...list, ...added];
    }
    if (part.repeat) {
      const { count, start = 0 } = part.repeat;
      const through = typeof part.repeat.around === "string" && byId.has(part.repeat.around)
        ? anchorOfBox(boxOf(pointsOf(trianglesOf(part.repeat.around))), "centre")
        : (part.repeat.through ?? [0, 0, 0]);
      // about the axis named (z unless told) through `through`: the two other axes turn
      const [a, b] = { z: [0, 1], x: [1, 2], y: [2, 0] }[part.repeat.axis ?? "z"];
      const round = (angle) => {
        const [c, s] = [Math.cos(degrees(angle)), Math.sin(degrees(angle))];
        return (p) => {
          const q = [...p];
          q[a] = through[a] + (p[a] - through[a]) * c - (p[b] - through[b]) * s;
          q[b] = through[b] + (p[a] - through[a]) * s + (p[b] - through[b]) * c;
          return q;
        };
      };
      // the part itself turned to the first place, then the copies round from it
      if (start) move(list, round(start));
      const original = list;
      for (let k = 1; k < count; k++) {
        list = original;
        copy(round((360 * k) / count), false);
      }
    }
  }
  return { meshes, warnings, facts };
}

/**
 * Builds a model spec: validated, every part built and placed, written as a studio model, checked by the
 * engine's rules and the shape's, with a list of what each part came to. `folder`: where `file` prefabs are
 * read from; `prefabs`: prefab specs by name, beside the spec's own. Returns { mdl, report } where report is
 * { ok, errors, faults, warnings, notes, facts, parts }; `ok` when nothing is wrong. Throws only for a spec it
 * cannot read at all; every other fault is in the report.
 */
export function buildModelSpec(spec, options = {}) {
  const built = buildPosed(spec, options);
  if (!spec?.motion?.length || !built.mdl) return built;
  // each animation named fitted to its strip of pictures, frame by frame (posefit.mjs), and written in its place
  const read = options.readPicture ?? ((name) => unpicture(readFileSync(resolve(options.folder ?? ".", name.replace(/^(work|models):/, "")))));
  let { mdl } = built;
  for (const [n, m] of spec.motion.entries()) {
    try {
      const list = sequencesOf(mdl);
      const seq = list.findIndex((s) => s.name === m.seq);
      if (seq < 0) throw new Error(`no animation ${m.seq} in the base: it has ${list.map((s) => s.name).join(", ")}`);
      const fit = fitMotion(mdl, { seq, picture: read(m.fit.picture), count: m.fit.count ?? 8, cols: m.fit.cols ?? 4, view: m.fit.view ?? "left" });
      mdl = replaceSequence(mdl, seq, { frames: fit.frames });
      built.report.facts.push(`motion[${n}]: ${m.seq} fitted to ${m.fit.picture} (its cycle matched from the strip's frame ${fit.offset}): the outlines' overlap ${fit.before} as it was, ${fit.after} fitted`);
    } catch (error) {
      built.report.errors.push(`motion[${n}]: ${error.message}`);
      built.report.ok = false;
    }
  }
  return { ...built, mdl };
}

function buildPosed(spec, options = {}) {
  // a stance fitted to the pictures: built once as it stands, its first frame fitted to the outlines of the
  // views (spec.project's, or pose.fit's own), then built again in that stance; the keys given win over it
  if (!spec?.pose?.fit) return buildOnce(spec, options);
  const given = spec.pose.keys ?? null;
  const first = buildOnce({ ...spec, pose: given ? { keys: given } : undefined }, options);
  if (!first.mdl) return first;
  const read = options.readPicture ?? ((name) => unpicture(readFileSync(resolve(options.folder ?? ".", name.replace(/^(work|models):/, "")))));
  const asked = Array.isArray(spec.pose.fit) ? spec.pose.fit : spec.project ?? [];
  let fit;
  try {
    const views = asked.map((view) => {
      const [yaw, pitch] = typeof view.view === "string" ? VIEW_NAMES[view.view] : [view.yaw ?? 0, view.pitch ?? 0];
      return { picture: read(view.picture), yaw, pitch, area: view.area, rect: view.rect };
    });
    fit = fitPose(first.mdl, views);
  } catch (error) {
    first.report.errors.push(`pose.fit: ${error.message}`);
    first.report.ok = false;
    return first;
  }
  const keys = { ...fit.keys, ...(given ?? {}) };
  const second = buildOnce({ ...spec, pose: { keys } }, options);
  second.report.facts.push(`pose fitted to ${asked.length} views (their outlines' overlap ${fit.before} as built, ${fit.after} fitted, ${fit.tried} stances tried): "pose": { "keys": ${JSON.stringify(keys)} }`);
  return second;
}

function buildOnce(spec, { folder, prefabs = {}, games = [], readPicture, readFile, hide = [], refuse = [] } = {}) {
  const { errors, warnings } = validateModelSpec(spec, { prefabs });
  const report = { ok: false, errors, faults: [], warnings, notes: [], facts: [], parts: {} };
  if (errors.length) return { mdl: null, report };
  // a material with a photograph: its detail laid over the part at its real size, made like Valve's (paint.mjs)
  const readMaterial = readPicture ?? ((file) => unpicture(readFileSync(resolve(folder ?? ".", file.replace(/^(work|models):/, "")))));
  try {
    const photographed = new Map();
    const withPhoto = (material) => {
      if (!material || typeof material !== "object" || material.picture === undefined) return material;
      if (!photographed.has(material)) photographed.set(material, photoMaterial(material, readMaterial, report.facts));
      return photographed.get(material);
    };
    spec = {
      ...spec,
      ...(spec.materials ? { materials: Object.fromEntries(Object.entries(spec.materials).map(([k, m]) => [k, withPhoto(m)])) } : {}),
      parts: spec.parts.map((part) => (typeof part.material === "object" ? { ...part, material: withPhoto(part.material) } : part)),
    };
  } catch (error) {
    errors.push(`materials: ${error.message}`);
    return { mdl: null, report };
  }
  const name = spec.name ?? "model.mdl";
  const base = name.replace(/\.mdl$/i, "");
  // a base model: its skeleton, as it stands in `pose`, is what the parts are put on, and its file (with its
  // animations, blends and all) is what the body is put into
  let skeleton = null;
  if (spec.base) {
    try {
      skeleton = skeletonOf(spec.base, folder, games, refuse);
    } catch (error) {
      errors.push(`base: ${error.message}`);
      return { mdl: null, report };
    }
    // the stance it is built in and judged in: the first animation's every frame turned by the pose's keys,
    // about the model's axes as each bone stands there (its number, length and activity kept); the parts are
    // then placed as the base stands in it
    if (spec.pose?.keys) {
      try {
        skeleton = posedSkeleton(skeleton, spec.pose.keys);
        report.facts.push(`pose: the first animation turned at ${Object.keys(spec.pose.keys).join(", ")}`);
      } catch (error) {
        errors.push(`pose: ${error.message}`);
        return { mdl: null, report };
      }
    }
    // a bone named in another language of 3ds Max's Biped than the base's ("Bip01 Head" on a base whose head is
    // "Bip01 Testa") is that bone: the names are put in the base's own words before anything is built
    const names = [...skeleton.joints.keys()];
    const own = (bone) => boneIn(bone, names) ?? bone;
    const renamed = [];
    spec = {
      ...spec,
      parts: spec.parts.map((part) => {
        const out = { ...part };
        if (typeof part.bone === "string") out.bone = own(part.bone);
        if (typeof part.attach?.bone === "string") out.attach = { ...part.attach, bone: own(part.attach.bone) };
        if (part.span) {
          const bones = (part.span.bones ?? part.span).map(own);
          out.span = Array.isArray(part.span) ? bones : { ...part.span, bones };
        }
        for (const [was, now] of [[part.bone, out.bone], [part.attach?.bone, out.attach?.bone], ...(part.span ? (part.span.bones ?? part.span).map((b, i) => [b, (out.span.bones ?? out.span)[i]]) : [])])
          if (was && was !== now && !renamed.includes(`${was} -> ${now}`)) renamed.push(`${was} -> ${now}`);
        return out;
      }),
    };
    if (renamed.length) report.notes.push(`bones named as the base names them: ${renamed.join(", ")}`);
    report.facts.push(`base ${skeleton.file}: ${skeleton.joints.size} bones, ${sequencesOf(skeleton.src).length} animations; its joints as it stands in ${JSON.stringify(skeleton.pose)}: ${[...skeleton.joints].filter(([n]) => !/Finger|Dito|Toe0|Toe1|Toe2|Bip01$/.test(n)).map(([n, p]) => `${n} ${p.map((v) => Math.round(v)).join(" ")}`).join("; ")}`);
  }
  // carved parts: their hull worked out from their pictures before anything is built (carve.mjs)
  if (spec.parts.some((part) => part.kind === "carved")) {
    const readCarved = readPicture ?? ((name) => unpicture(readFileSync(resolve(folder ?? ".", name.replace(/^(work|models):/, "")))));
    try {
      spec = {
        ...spec,
        parts: spec.parts.map((part) => {
          if (part.kind !== "carved") return part;
          const views = [];
          if (part.sheet) views.push(...sheetViews(readCarved(part.sheet)).filter((v) => v.rect));
          for (const view of part.pictures ?? []) {
            const picture = readCarved(view.picture);
            const [yaw, pitch] = typeof view.view === "string" ? VIEW_NAMES[view.view] : [view.yaw ?? 0, view.pitch ?? 0];
            const area = view.area ?? [0, 0, picture.width, picture.height];
            views.push({ ...masksFromPicture(picture, area, view.rect), yaw, pitch, name: view.view ?? `yaw ${yaw}` });
          }
          // unless told, as many triangles as three quarters of Half-Life's props of its size have under them:
          // a copy is judged against twice its original's, and the outline holds at that count
          const band = PROP_TRIANGLES.find((b) => Math.hypot(...part.size) < b.under);
          let hull = carve(views, { size: part.size, cells: part.cells ?? 64, target: part.triangles ?? band.q3 });
          // unless the cells are told: thin parts (a fork's tips, a rail) lost between cells show as a view whose
          // outline falls short of its own picture's, and the hull is carved again, finer
          const worst = Math.min(...Object.values(hull.report.overlapByView ?? {}).filter((v) => typeof v === "number"));
          // a carve shorter than its size on some axis has lost a thin part at its end (a fork's tip)
          const extentOf = (tris) => [0, 1, 2].map((k) => {
            const vs = tris.flatMap((t) => t.map((c) => c.p[k]));
            return Math.max(...vs) - Math.min(...vs);
          });
          const short = extentOf(hull.tris).some((v, k) => v < part.size[k] * 0.95);
          if (part.cells === undefined && (worst < 0.9 || short)) {
            // finer and finer until nothing is lost at its ends (the parts thinner than a cell come back), a
            // thing that intricate given twice the triangles unless they are told
            let best = { hull, worst, cells: 64 };
            for (const cells of [160, 208, 256]) {
              const finer = carve(views, { size: part.size, cells, target: part.triangles ?? 2 * band.q3 });
              const finerWorst = Math.min(...Object.values(finer.report.overlapByView ?? {}).filter((v) => typeof v === "number"));
              const finerShort = extentOf(finer.tris).some((v, k) => v < part.size[k] * 0.95);
              if (finerWorst >= best.worst || !finerShort) best = { hull: finer, worst: finerWorst, cells };
              if (!finerShort && finerWorst >= 0.9) break;
            }
            if (best.cells !== 64) hull = { ...best.hull, finer: [worst, best.worst], cells: best.cells };
          }
          if (hull.finer) report.notes.push(`${part.id}: carved again at ${hull.cells} cells for its thin parts (its worst view's outline ${hull.finer[0]} at 64, ${hull.finer[1]} at ${hull.cells})`);
          report.facts.push(`${part.id}: carved from ${views.length} views at ${hull.cells ?? part.cells ?? 64} cells, ${hull.tris.length} triangles; each view's outline against its own: ${Object.entries(hull.report.overlapByView ?? {}).map(([k, v]) => `${k} ${v}`).join(", ")}`);
          const lost = hull.report.lost ?? [];
          if (lost.length)
            warnings.push(`${part.id}: the carve lost ${lost.length} thin piece${lost.length > 1 ? "s" : ""} the pictures show, thinner than its cells (${(Math.max(...part.size) / (hull.cells ?? part.cells ?? 64)).toFixed(2)} units) can hold: ${lost.slice(0, 6).map((l) => `${l.view} view, ${l.length} long and ${l.across} across, near pixel ${l.at.join(" ")} of that view`).join("; ")}. Make each a part of its own (a tube, a leaf, a box) where the picture has it`);
          return { ...part, carvedTris: part.symmetric ? symmetrized(hull.tris, part, report) : hull.tris };
        }),
      };
    } catch (error) {
      errors.push(`carved: ${error.message}`);
      return { mdl: null, report };
    }
  }
  // mesh parts: a shape made elsewhere (generate's .obj), stood up, reduced to its triangles and fitted to its size
  if (spec.parts.some((part) => part.kind === "mesh")) {
    const readText = readFile ?? ((name) => readFileSync(resolve(folder ?? ".", name.replace(/^(work|models):/, ""))));
    try {
      spec = { ...spec, parts: spec.parts.map((part) => (part.kind === "mesh" ? { ...part, carvedTris: ((t) => (part.symmetric ? symmetrized(t, part, report) : t))(meshPart(part, readText, report, warnings)) } : part)) };
    } catch (error) {
      errors.push(`mesh: ${error.message}`);
      return { mdl: null, report };
    }
  }
  // blob parts: their pieces put on the base's joints (or at points), blended into one surface in model space, then
  // held in the part's own space as a carved part is (centred on x and y, from z 0), its `at` putting it back
  if (spec.parts.some((part) => part.kind === "blob")) {
    try {
      spec = { ...spec, parts: spec.parts.map((part) => (part.kind === "blob" ? blobPart(part, skeleton, report) : part)) };
    } catch (error) {
      errors.push(`blob: ${error.message}`);
      return { mdl: null, report };
    }
  }
  let pieces;
  try {
    pieces = piecesOf(spec, { folder, prefabs, skeleton });
  } catch (error) {
    errors.push(error.message);
    return { mdl: null, report };
  }
  warnings.push(...pieces.warnings);
  report.facts.push(...(pieces.facts ?? []));
  const { meshes } = pieces;
  // parts painted into what they sit on: built, baked into the faces under them, and left out
  const baked = spec.parts.filter((part) => part.paint === true).map((part) => part.id);
  if (baked.length) {
    const { texels, removed } = bakeParts(meshes, baked, { reach: 1.5 });
    report.facts.push(`painted, not built: ${baked.join(", ")} (${removed} triangles left out, ${texels} texels painted)`);
    if (!texels) warnings.push(`paint: ${baked.join(", ")} found nothing within 1.5 units under them to be painted on: they are gone`);
  }
  // a part's own smoothing angle, or the spec's, on every corner that has none of its own: a low-sided round
  // part (a sphere of 6, a finger of 4) shaded round, and its normals shared, which the engine counts
  // a round part (turn, cylinder, sphere, tube) is shaded smooth across its own sides whatever their count:
  // an 8-sided one's faces meet at 45 degrees, over the 40 a flat part creases at, and shaded flat it pushed
  // builders to 16 sides; under 90 degrees, so its caps keep their edge (research/repeated-failures.md, 5)
  const ROUND = { turn: 16, cylinder: 16, sphere: 16, superquadric: 16, tube: 8 };
  const roundAngle = (part) => {
    const sides = part.sides ?? ROUND[part.kind];
    return ROUND[part.kind] && sides >= 5 ? Math.min(85, 360 / sides + 5) : undefined;
  };
  const smoothOf = new Map(
    spec.parts.map((part) => [part.id, part.smooth ?? (roundAngle(part) !== undefined ? Math.max(spec.smooth ?? 40, roundAngle(part)) : spec.smooth)]),
  );
  for (const mesh of meshes)
    mesh.tris.forEach((t, i) => {
      const angle = smoothOf.get(String(mesh.partOf?.[i] ?? "").split(".")[0]);
      if (angle !== undefined) mesh.tris[i] = t.map((c) => (c.smooth === undefined ? { ...c, smooth: angle } : c));
    });
  const all = meshes.flatMap((mesh) => mesh.tris);
  let box = boxOf(all.flatMap((t) => t.map((c) => c.p)));
  // a prop stands on the floor: its lowest point at z = 0
  const kind = spec.kind ?? (spec.base ? "character" : "prop");
  if (kind === "prop" && Math.abs(box.mn[2]) > 1e-6) {
    const lift = -box.mn[2];
    for (const mesh of meshes) mesh.tris = mesh.tris.map((t) => t.map((c) => ({ ...c, p: [c.p[0], c.p[1], c.p[2] + lift] })));
    if (Math.abs(lift) > GROUND_SAID) report.notes.push(`it was ${lift > 0 ? "lifted" : "lowered"} ${Math.abs(lift).toFixed(1)} units to stand on the floor`);
    box = boxOf(meshes.flatMap((mesh) => mesh.tris.flatMap((t) => t.map((c) => c.p))));
  }
  // what each part came to: its triangles and its box
  meshes.forEach((mesh) =>
    mesh.tris.forEach((t, i) => {
      const id = mesh.partOf[i];
      const entry = (report.parts[id] ??= { tris: 0, points: [] });
      entry.tris++;
      entry.points.push(...t.map((c) => c.p));
    }),
  );
  const round1 = (v) => Math.round(v * 10) / 10;
  for (const [id, entry] of Object.entries(report.parts)) {
    const b = boxOf(entry.points);
    report.parts[id] = { tris: entry.tris, from: b.mn.map(round1), to: b.mx.map(round1) };
  }
  const size = box.mx.map((v, k) => round1(v - box.mn[k]));
  report.facts.push(`${all.length} triangles in ${meshes.length} textures; ${size[0]} long (x), ${size[1]} wide (y), ${size[2]} high (z)`);
  const order = Object.entries(report.parts).sort((a, b) => a[1].from[2] - b[1].from[2]);
  report.facts.push(`from the lowest part up: ${order.map(([id, p]) => `${id} (${p.from[2]} to ${p.to[2]})`).join(", ")}`);
  for (const [axis, k] of [["length", 0], ["width", 1], ["height", 2]]) {
    const want = spec.size?.[axis];
    if (!isNumber(want)) continue;
    const off = Math.abs(size[k] - want) / want;
    const said = `${axis} ${size[k]} where the spec asks ${want}`;
    if (off > SIZE_ERROR) report.faults.push(`${said}: off by ${Math.round(off * 100)}%`);
    else if (off > SIZE_WARN) warnings.push(`${said}: off by ${Math.round(off * 100)}%`);
  }

  // the shape's soundness, part by part, before it is written
  // a carved hull may come apart where its outlines do (a creature's claws): its pieces are what was seen
  const allow = spec.parts.filter((part) => part.open || part.loose || part.kind === "carved" || part.kind === "mesh").map((part) => part.id);
  allow.push(...(spec.allow?.open ?? []), ...(spec.allow?.floating ?? []));
  const sound = shapeSoundness(
    meshes.flatMap((mesh) => mesh.tris.map((t, i) => ({ p: t.map((c) => c.p), name: mesh.partOf[i] }))),
    { front: 1, allow: allow.flatMap((id) => [id, ...Object.keys(report.parts).filter((p) => p.startsWith(`${id}.`))]) },
  );
  report.faults.push(...sound.faults);

  // the triangle budget: the spec's own, or (for a prop) three quarters of Half-Life's props are under 576
  const byPart = new Map();
  for (const mesh of meshes) mesh.partOf?.forEach((id) => byPart.set(String(id).split(".")[0], (byPart.get(String(id).split(".")[0]) ?? 0) + 1));
  const triangles = meshes.reduce((sum, mesh) => sum + mesh.tris.length, 0);
  const heaviest = [...byPart].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id, n]) => `${id} ${n}`).join(", ");
  const thin = spec.parts.filter((part) => part.kind === "box" && part.paint !== true && Math.min(...part.size) < 1).map((part) => part.id);
  const high = spec.fidelity === "high";
  const budgetLine = `${triangles} triangles${spec.budget ? ` of a budget of ${spec.budget}` : ""}; the most in ${heaviest}${thin.length ? `; ${thin.length} boxes under a unit thick could be panels or paint: true (${thin.slice(0, 8).join(", ")}${thin.length > 8 ? " ..." : ""})` : ""}`;
  if (spec.budget && triangles > spec.budget) report.faults.push(`over budget: ${budgetLine}`);
  else if (!spec.budget && kind === "prop" && triangles > PROP_BUDGET) (high ? report.facts : warnings).push(`${budgetLine}: three quarters of Half-Life's props have fewer than ${PROP_BUDGET}${high ? " (fidelity high: told, not warned)" : "; give the spec a budget, and paint what lies on a surface"}`);
  else report.facts.push(budgetLine);
  // a character's: the body it takes the place of (its base's own), which a copy is judged against twice of
  if (kind === "character" && skeleton && !spec.budget) {
    const info = readMdl(skeleton.src);
    const own = info.bodyparts[skeleton.bodypart].models[0]?.meshes.reduce((n, m) => n + m.numtris, 0) ?? 0;
    if (own && triangles > 2 * own && high) report.facts.push(`${triangles} triangles (fidelity high), over twice the ${own} of the base's own body`);
    else if (own && triangles > 2 * own)
      warnings.push(`${triangles} triangles, over twice the ${own} of the base's own body: the most in ${heaviest}. Paint what lies on the surface (eyes, buttons, seams, pockets) and give round parts fewer sides`);
    else if (own) report.facts.push(`the base's own body is ${own} triangles`);
  }
  // what Half-Life's own props of this size spend: a judge holds a copy to twice its original's triangles, and an
  // original of this size most often has the median
  if (kind === "prop") {
    const diagonal = Math.hypot(...[0, 1, 2].map((k) => box.mx[k] - box.mn[k]));
    const band = PROP_TRIANGLES.find((b) => diagonal < b.under);
    const line = `Half-Life's props of this size (${Math.round(diagonal)} units corner to corner) have ${band.median} triangles at the median, three quarters under ${band.q3}`;
    if (!spec.budget && triangles > 2 * band.median && !high) warnings.push(`${triangles} triangles: ${line}. Paint what lies on a surface (drawers, labels, seams), and build only what stands out of the outline`);
    else if (high) report.facts.push(`${triangles} triangles (fidelity high): ${line}`);
    else report.facts.push(line);
  }
  report.notes.push(...sound.notes);
  report.edges = sound.edges;

  // the finish read from the shape (light, worn edges, grime, a part's own shade) painted over the materials
  if (spec.finish !== false) {
    const byTop = new Map(spec.parts.map((part) => [part.id, part]));
    const amounts = (id) => {
      const own = byTop.get(String(id).split(".")[0])?.finish;
      if (own === false) return null;
      return { ...FINISH, ...(kind === "character" ? CHARACTER_FINISH : {}), ...(spec.finish ?? {}), ...(own ?? {}) };
    };
    const { texels } = paintFinish(meshes, { amounts, ground: kind === "prop" ? 0 : null, height: box.mx[2] - box.mn[2] });
    report.facts.push(`finish painted over ${texels} texels: ${JSON.stringify({ ...FINISH, ...(kind === "character" ? CHARACTER_FINISH : {}), ...(spec.finish ?? {}) })}`);
  }

  // the person's pictures projected onto the shape: each texel takes the colour of the views that see it
  let projectedViews = null;
  if (spec.project?.length) {
    const read = readPicture ?? ((name) => unpicture(readFileSync(resolve(folder ?? ".", name.replace(/^(work|models):/, "")))));
    try {
      const views = spec.project.map((view) => {
        const [yaw, pitch] = typeof view.view === "string" ? VIEW_NAMES[view.view] : [view.yaw ?? 0, view.pitch ?? 0];
        return { picture: read(view.picture), yaw, pitch, area: view.area, rect: view.rect, parts: view.parts };
      });
      projectedViews = views;
      const { texels, views: seen } = paintProjections(meshes, views);
      report.facts.push(`pictures projected over ${texels} texels: ${seen.map((v, i) => `${spec.project[i].picture} (${spec.project[i].view ?? `yaw ${spec.project[i].yaw ?? 0} pitch ${spec.project[i].pitch ?? 0}`}) ${v ? `outline at ${v.rect.join(" ")} in it, ${v.seen} texels seen` : "NO OUTLINE FOUND in it: give rect"}`).join("; ")}`);
      seen.forEach((v, i) => !v && warnings.push(`project[${i}]: the thing's outline was not found in ${spec.project[i].picture}: give its area or rect`));
      // the shape's own outline against each picture's, as a judge measures it: what to mend before painting more
      const fits = outlineFit(meshes.flatMap((mesh) => mesh.tris.map((t) => t.map((c) => c.p))), views);
      const named = (i) => spec.project[i].view ?? `yaw ${spec.project[i].yaw ?? 0} pitch ${spec.project[i].pitch ?? 0}`;
      report.facts.push(`the shape's outline against each picture's (cells in both of those in either): ${fits.map((f, i) => `${named(i)} ${f ?? "-"}`).join(", ")}`);
      // a character's under OUTLINE_FAULT is a fault: its texture follows its shape, and on a shape that far off
      // the pictures no projection comes near (research/character-texturing.md: the zombie's own shape took the
      // same projector to 5.4 where the maker's took it to 16.6, the judges' line 15)
      const far = kind === "character" ? fits.map((f, i) => [f, i]).filter(([f]) => f !== null && f < OUTLINE_FAULT) : [];
      if (far.length)
        report.faults.push(`the body's outline is far off the pictures' in ${far.map(([f, i]) => `${named(i)} (${f})`).join(", ")}: under ${OUTLINE_FAULT}, its texture cannot follow. Carve the body from the pictures (kind carved: its corners hang on the limbs nearest them), or turn the base's pose to theirs (pose: { fit: true }, the forearms down to where the pictures' hands are)`);
      const short = fits.map((f, i) => [f, i]).filter(([f]) => f !== null && f < OUTLINE_FAIR && !(kind === "character" && f < OUTLINE_FAULT));
      if (short.length)
        warnings.push(`the shape's outline is off the pictures' in ${short.map(([f, i]) => `${named(i)} (${f})`).join(", ")}: under ${OUTLINE_FAIR}, a part is missing, too big or misplaced there. Look at those views beside the pictures (reference), or carve the body from them (kind carved)`);
    } catch (error) {
      errors.push(`project: ${error.message}`);
      return { mdl: null, report };
    }
  }

  // each picture against Valve's models' (look.mjs): clean whites and toy colours read as The Sims, not GoldSrc
  // (a Xash3D developer on the kit's furniture, 2026-10-15). A picture projected from the person's own is theirs
  if (!projectedViews) {
    const off = [];
    for (const mesh of meshes) {
      if (mesh.flags & (4 | 32)) continue;
      const { width, height } = mesh.image;
      // a masked picture's holes (HOLE_RGB, or see-through) are not its colour, and its grain is the leaves' edges
      const masked = Boolean(mesh.flags & 64);
      const hole = (i) => masked && mesh.image.rgb && mesh.image.rgb[i * 3] === 255 && mesh.image.rgb[i * 3 + 1] === 0 && mesh.image.rgb[i * 3 + 2] === 255;
      const rgba = mesh.image.rgba ?? Uint8Array.from({ length: width * height * 4 }, (_, i) => (i % 4 === 3 ? (hole(i >> 2) ? 0 : 255) : mesh.image.rgb[(i >> 2) * 3 + (i % 4)]));
      const look = masked ? { bright: 0, fine: VALVE_MODELS.fine[1] } : lookOf({ width, height, rgba });
      const { whites, vivid } = modelLookOf(rgba);
      const said = [];
      if (whites > VALVE_MODELS.whites[2]) said.push(`${Math.round(whites * 100)}% near white (nine in ten of Valve's under ${Math.round(VALVE_MODELS.whites[2] * 100)}%)`);
      if (vivid > VALVE_MODELS.vivid[2]) said.push(`${Math.round(vivid * 100)}% strongly coloured (Valve's under ${Math.round(VALVE_MODELS.vivid[2] * 100)}%)`);
      if (look.bright > VALVE_MODELS.bright[2]) said.push(`brighter (${look.bright.toFixed(2)}; Valve's ${VALVE_MODELS.bright[1]})`);
      if (look.fine < VALVE_MODELS.fine[0]) said.push(`little grain (${look.fine.toFixed(3)}; Valve's ${VALVE_MODELS.fine[1]})`);
      if (said.length) off.push(`${mesh.name} ${said.join(", ")}`);
    }
    if (off.length)
      warnings.push(`its pictures look unlike nine in ten of Valve's models': ${off.join("; ")}. A white thing in Half-Life is a used grey (0.5 to 0.6: the game's light brightens it), its colours muted, its surfaces worn: give tones nearer Valve's and its materials a photograph (\`picture\`, docs/SPEC.md "A material from a photograph")`);
  }

  // written: one bone, one still animation
  const textures = meshes.map((mesh, n) => {
    const texture = pictureTexture(mesh.image, `${base.slice(0, 40)}_${mesh.name}.bmp`.slice(0, 63), mesh.flags);
    texture.flags = mesh.flags;
    return texture;
  });
  let mdl;
  if (skeleton) {
    try {
      mdl = intoBase(skeleton, meshes, textures);
    } catch (error) {
      errors.push(`putting the body into the base: ${error.message}`);
      return { mdl: null, report };
    }
    // where its feet stand: a player's origin is the middle of its hull (feet at -36), a monster's its feet (0).
    // A monster made on a player's skeleton is lifted, every animation's root moved by the difference
    if (spec.floor !== undefined) {
      const low = Math.min(...[...skeleton.joints.values()].map((p) => p[2]));
      const baseFloor = low < -18 ? -36 : 0;
      const lift = spec.floor - baseFloor;
      if (lift) {
        mdl = liftRoot(mdl, lift);
        report.facts.push(`floor: the base's feet are at ${baseFloor}; every animation lifted ${lift} to stand them at ${spec.floor}`);
      }
    }
    // the shape held in the poses the game shows it in: a limb that comes apart when it runs shows here
    // a written triangle is told back to its part by the pixels its corners sit on: each part has its own zone
    const partAt = new Map();
    meshes.forEach((mesh, n) =>
      mesh.tris.forEach((t, i) =>
        t.forEach((c) => partAt.set(`${textures[n].name}:${Math.round(c.uv[0] * textures[n].width)},${Math.round(c.uv[1] * textures[n].height)}`, mesh.partOf[i])),
      ),
    );
    const names = (t) => {
      const votes = t.c.map((c) => partAt.get(`${t.tex?.name}:${c.u},${c.v}`)).filter(Boolean);
      return votes.find((id, k) => votes.indexOf(id) !== k) ?? votes[0] ?? t.tex?.name ?? "untextured";
    };
    for (const pose of posesOf(mdl)) {
      const moving = soundness(mdl, { ...pose, names }).faults.filter((fault) => /float apart/.test(fault));
      for (const fault of moving) report.faults.push(`in ${pose.label}: ${fault}`);
    }
  } else
  try {
    mdl = buildMdl({
      name,
      bones: [{ name: "root", parent: -1 }],
      bodyparts: [
        {
          name: "body",
          models: [
            {
              name: base,
              meshes: meshes.map((mesh, n) => ({
                tris: mesh.tris.map((t) => t.map((c) => ({ p: c.p, uv: c.uv, bone: "root", group: c.group, smooth: c.smooth }))),
                texture: textures[n],
              })),
            },
          ],
        },
      ],
      sequences: [{ name: "idle", fps: 10, loops: true, frames: [[[0, 0, 0, 0, 0, 0]]] }],
    });
  } catch (error) {
    errors.push(`buildMdl: ${error.message}`);
    return { mdl: null, report };
  }
  const engine = check(mdl, "goldsrc");
  errors.push(...engine.errors);
  warnings.push(...engine.warnings);
  const seen = seeThrough(mdl);
  report.faults.push(...seen.faults);
  report.facts.push(`the pictures see through it at ${(seen.share * 100).toFixed(2)}% of its dots`);
  // the painted model from each picture's camera, set against the picture: where its look parts from them
  if (projectedViews) {
    const fits = viewFit((yaw, pitch) => render(mdl, { seq: 0, yaw, pitch, width: 384, height: 384 }), projectedViews);
    const named = (i) => spec.project[i].view ?? `yaw ${spec.project[i].yaw ?? 0} pitch ${spec.project[i].pitch ?? 0}`;
    report.facts.push(`its look against each picture's, drawn from that picture's camera (mean colour difference, CIE76, of cells both cover; the worst cell and where): ${fits.map((f, i) => (f ? `${named(i)} ${f.meanDeltaE}, worst ${f.worst.deltaE} at its ${f.worst.where}` : `${named(i)} -`)).join("; ")}`);
    const off = fits.map((f, i) => [f, i]).filter(([f]) => f && (f.meanDeltaE > LOOK_MEAN || f.worst.deltaE > LOOK_WORST));
    if (off.length)
      warnings.push(`its look parts from the pictures in ${off.map(([f, i]) => `${named(i)} (mean ${f.meanDeltaE}, ${f.worst.deltaE} at its ${f.worst.where})`).join(", ")}: a part out of place there takes another's colour (a strap reading the case behind it). Look at that view beside the picture (reference) and move the part`);
  }
  const files = spec.weapon ? weaponViews(spec, meshes, { folder, games, report, hide }) : [];
  // the contract a mod's code holds the model to: a reference's bones, animations, attachments, bodyparts
  if (spec.contract) {
    try {
      const reference = readContractFile(spec.contract.file, folder, games, refuse);
      const { faults, notes } = compareContract(contractOf(reference), contractOf(mdl));
      report.faults.push(...faults.map((f) => `contract of ${spec.contract.file}: ${f}`));
      report.notes.push(...notes.map((n) => `contract of ${spec.contract.file}: ${n}`));
      if (!faults.length) report.facts.push(`the contract of ${spec.contract.file} is kept: its bones, animations in their order, attachments and bodyparts`);
    } catch (error) {
      errors.push(`contract: ${error.message}`);
    }
  }
  report.ok = !errors.length && !report.faults.length;
  return { mdl, report, files };
}

/**
 * A part laid along a limb, made at the limb's length (from joint to joint, and `over` past each end) before
 * it is built: a cylinder's height, a box's height, a turned part's rings spread along it. Built short and
 * stretched after, what stands on its surface (a band, a ridge, a point `out` from it) was stretched with it,
 * and its picture was a patch for a part one unit long. A sphere or a tube is left to be stretched.
 */
function atSpanLength(part, skeleton) {
  if (part.span.keep) return part;
  const [a, b] = (part.span.bones ?? part.span).map((name) => skeleton.joints.get(name));
  if (!a || !b) return part;
  const length = Math.hypot(...a.map((v, k) => b[k] - v)) + 2 * (part.span.over ?? 0);
  if (part.kind === "cylinder") return { ...part, height: length };
  if (part.kind === "box") return { ...part, size: [part.size[0], part.size[1], length] };
  if (part.kind === "turn" && (part.axis ?? "z") === "z") {
    const sOf = (ring) => (Array.isArray(ring) ? ring[0] : ring.s);
    const s0 = Math.min(...part.rings.map(sOf));
    const s1 = Math.max(...part.rings.map(sOf));
    const k = length / (s1 - s0 || 1);
    return { ...part, rings: part.rings.map((ring) => (Array.isArray(ring) ? [(ring[0] - s0) * k, ...ring.slice(1)] : { ...ring, s: (ring.s - s0) * k })) };
  }
  return part;
}

/** A box's faces by name, as the six cells of its zone are numbered. */
const BOX_FACES = { bottom: 0, top: 1, right: 2, left: 3, back: 4, front: 5 };

/** The size of a picture of its own for zones of these sizes: 256 square, or 512 by less for a long one. */
function sheetShape(sizes) {
  const [w, h] = sizes.reduce((a, b) => (b[0] * b[1] > a[0] * a[1] ? b : a));
  const long = Math.max(w, h) / Math.max(Math.min(w, h), 1e-6);
  if (long < 2) return [SHEET_SIZE, SHEET_SIZE];
  const short = Math.min(512, Math.max(64, 2 ** Math.ceil(Math.log2((512 / long) * 1.6))));
  return w >= h ? [512, short] : [short, 512];
}

/** How far round each turn is tried, and in what steps (degrees), when a key is aimed. */
const AIM_RANGE = { y: [-60, 120], z: [-90, 90], hand: [-60, 60] };
const AIM_STEPS = [10, 2.5];

/**
 * A first-person model's weapon aimed: what turns of the arm and the hand (about the model's axes as they
 * stand in `base`) put the weapon's far end at a place on the screen, `[across, up]` as shares of the
 * distance ahead (from the eye, +x forward: across 0.4 is to the right, up -0.3 low). `bones`: [arm, hand],
 * the right arm's unless told. The far end is the weapon's corner farthest from the hand. Returns
 * aim([across, up]) -> { pose, say }.
 */
function aimerOf(mdl, rig, base, bones = ["Bip01 R Arm1", "Bip01 R Hand"]) {
  const [arm, hand] = bones;
  const handAt = rig.index(hand);
  const P = posed(mdl, { seq: 0, frame: 0 });
  const into = inverse34(P.pose[handAt]);
  let far = null;
  let farthest = -1;
  for (const t of P.tris)
    if (t.tex && !HANDS.test(t.tex.name))
      for (const c of t.c) {
        const q = apply34(into, c.p);
        const d = Math.hypot(...q);
        if (d > farthest) [farthest, far] = [d, q];
      }
  const screen = (pose) => {
    const { q, p } = A.worldOf(rig, pose)[handAt];
    const [w, x, y, z] = q;
    const [a, b, c] = far;
    // the far end turned by the hand's turn (a quaternion) and carried to its place
    const ix = w * a + y * c - z * b, iy = w * b + z * a - x * c, iz = w * c + x * b - y * a, iw = -x * a - y * b - z * c;
    const at = [ix * w - iw * x - iy * z + iz * y, iy * w - iw * y - iz * x + ix * z, iz * w - iw * z - ix * y + iy * x].map((v, k) => v + p[k]);
    return { at, across: -at[1] / at[0], up: at[2] / at[0] };
  };
  const poseOf = (y, z, h) => A.turnedInPose(rig, base, { [arm]: { turn: { y, z } }, [hand]: { turn: { y: h } } });
  return ([across, up]) => {
    let best = null;
    const tryAt = (y, z, h) => {
      const s = screen(poseOf(y, z, h));
      if (s.at[0] <= 4) return;
      const off = Math.hypot(s.across - across, s.up - up) + 0.002 * (Math.abs(y) + Math.abs(z) + Math.abs(h));
      if (!best || off < best.off) best = { off, y, z, h, s };
    };
    const [coarse, fine] = AIM_STEPS;
    for (let y = AIM_RANGE.y[0]; y <= AIM_RANGE.y[1]; y += coarse)
      for (let z = AIM_RANGE.z[0]; z <= AIM_RANGE.z[1]; z += coarse)
        for (let h = AIM_RANGE.hand[0]; h <= AIM_RANGE.hand[1]; h += coarse * 2) tryAt(y, z, h);
    const { y: y0, z: z0, h: h0 } = best;
    for (let y = y0 - coarse; y <= y0 + coarse; y += fine)
      for (let z = z0 - coarse; z <= z0 + coarse; z += fine)
        for (let h = h0 - coarse * 2; h <= h0 + coarse * 2; h += fine * 2) tryAt(y, z, h);
    return {
      pose: poseOf(best.y, best.z, best.h),
      say: `${arm} turned ${best.y} about y and ${best.z} about z, ${hand} ${best.h} about y; the far end at ${best.s.across.toFixed(2)} ${best.s.up.toFixed(2)}`,
    };
  };
}

/**
 * A picture made a texture: a masked one (a net, a fence) has its holes, painted in HOLE_RGB, made the
 * engine's hole (palette index 255); any other is cut to 256 colours.
 */
function pictureTexture(image, name, flags = 0) {
  if (!(flags & 64)) return indexed(image, name);
  const hole = HOLE_RGB.map((v) => Math.round(v * 255));
  const rgba = new Uint8Array(image.width * image.height * 4);
  for (let i = 0; i < image.width * image.height; i++) {
    const isHole = image.rgb[i * 3] === hole[0] && image.rgb[i * 3 + 1] === hole[1] && image.rgb[i * 3 + 2] === hole[2];
    rgba.set([image.rgb[i * 3], image.rgb[i * 3 + 1], image.rgb[i * 3 + 2], isHole ? 0 : 255], i * 4);
  }
  return masked({ width: image.width, height: image.height, rgba }, name);
}

// ── a weapon in the game's own files ───────────────────────────────────────
/** The views a weapon has: each file's prefix and how much smaller its picture is. */
const WEAPON_VIEWS = { v: { shrink: 1, what: "first person" }, p: { shrink: 2, what: "in a player's hands" }, w: { shrink: 4, what: "lying in the world" } };

/**
 * A held piece put in place of a game's weapon, in each of its files (v_, p_, w_ and the `like` name): in the
 * bodypart that holds most of the old weapon, every submodel of it that shows one, fitted over the old one
 * by `swapMesh`. The hands, the bones, the animations, the events and the attachments are the game's own and
 * untouched; the files keep the game's names, so that the game loads them with no code (AGENTS.md, rule 8).
 * Returns [{ name, mdl, view }]; what each became goes in the report.
 */
/**
 * How long a first-person (v_) weapon is drawn against its world (w_) model: the median of Half-Life's 13
 * weapons that have both (0.29 for the RPG to 0.97 for the MP5; research/held-reproduction-failures.md, Table
 * 3a). Used where the file's own weapon may not be measured (a blind test's hidden original).
 */
const V_TO_W = 0.56;

function weaponViews(spec, meshes, { folder, games, report, hide = [] }) {
  const { like, views = ["v", "p", "w"], size = "old", rig = "carry", turn } = spec.weapon;
  if (meshes.length !== 1) {
    report.errors.push(`weapon: a weapon wears one picture, and this one has ${meshes.length} (${meshes.map((m) => m.name).join(", ")}): a glowing or see-through material gets a picture of its own; leave such parts out of a weapon`);
    return [];
  }
  // a part may name the game's bone it moves with (a revolver's drum on cylinder_spin): the piece's `bones`,
  // by part number, 0 the bone that carried the old weapon. A file without that bone keeps it on that one.
  const boneOfPart = new Map(spec.parts.filter((part) => part.bone).map((part) => [part.id, part.bone]));
  const named = [undefined, ...new Set(boneOfPart.values())];
  const partNumber = (id) => Math.max(0, named.indexOf(boneOfPart.get(String(id).split(".")[0])));
  const piece = {
    tris: meshes[0].tris.map((t, i) => t.map((c) => ({ p: c.p, uv: c.uv, group: c.group, smooth: c.smooth, part: partNumber(meshes[0].partOf[i]) }))),
    // the views each triangle's part is in: a stock left out of first person, a sight only there
    views: meshes[0].tris.map((_, i) => spec.parts.find((part) => part.id === String(meshes[0].partOf[i]).split(".")[0])?.views ?? null),
    rig: rig === "nearest" ? "nearest" : undefined,
    bones: named,
  };
  const files = [];
  const hidden = (fileName) => hide.some((name) => name.replace(/^models\//, "") === fileName);
  // the weapon's sounds, made first: their files go with the models', under sound/
  const soundLengths = new Map();
  for (const [n, { spec: sound }] of (spec.weapon.sounds ?? []).entries()) {
    const built = buildSoundSpec(sound, { games });
    for (const line of [...built.report.errors, ...built.report.faults]) report.errors.push(`weapon.sounds[${n}]: ${line}`);
    report.facts.push(...built.report.facts.filter((line) => /against the game's|Hz \d+-bit|: attack /.test(line)).map((line) => `sound ${line}`));
    for (const file of built.files) {
      files.push({ name: `sound/${file.name}`, bytes: file.bytes, view: "sound" });
      soundLengths.set(file.name, built.report.sounds[file.name].features.length);
    }
  }
  for (const view of views) {
    const fileName = `${view}_${like}.mdl`;
    const place = [resolve(folder ?? ".", fileName), ...games.map((game) => join(game, "models", fileName))].find((p) => existsSync(p));
    if (!place) {
      report.errors.push(`weapon: ${fileName} is neither beside the spec nor in the game folders given (${games.join(", ") || "none"})`);
      continue;
    }
    let mdl = readFileSync(place);
    const textures = place.replace(/\.mdl$/i, "t.mdl");
    if (existsSync(textures) && !readMdl(mdl).textures.length) mdl = withTextures(mdl, readFileSync(textures));
    const original = mdl;
    const info = readMdl(mdl);
    const weaponTris = (model) => model.meshes.filter((m) => m.texture && !HANDS.test(m.texture.name)).reduce((n, m) => n + m.numtris, 0);
    const counts = info.bodyparts.map((part) => part.models.reduce((n, model) => n + weaponTris(model), 0));
    const bodypart = counts.indexOf(Math.max(...counts));
    if (counts[bodypart] === 0) {
      report.errors.push(`weapon: ${fileName} shows no weapon apart from its hands`);
      continue;
    }
    const texture = indexed(shrink(meshes[0].image, WEAPON_VIEWS[view].shrink), `${spec.name.replace(/\.mdl$/i, "").slice(0, 20)}_${view}.bmp`);
    // chrome: the engine's reflection over the picture (flag 2), as Valve's first-person weapons have it
    if (spec.weapon.chrome?.includes(view)) texture.flags = (texture.flags ?? 0) | 2;
    // the parts this file shows: those of no `views`, and those that name it
    const inView = { ...piece, tris: piece.tris.filter((_, i) => !piece.views[i] || piece.views[i].includes(view)) };
    const part = info.bodyparts[bodypart];
    const done = [];
    for (const [j, model] of part.models.entries()) {
      if (!weaponTris(model)) continue;
      try {
        // a hidden file's weapon lends nothing of its own shape: the piece keeps the size it was built at, and in
        // first person the size the game's own weapons are drawn at against their world models (V_TO_W)
        const shown = hidden(fileName) && view === "v" ? { ...inView, tris: inView.tris.map((t) => t.map((c) => ({ ...c, p: c.p.map((v) => v * V_TO_W) }))) } : inView;
        const swapped = swapMesh(mdl, { body: j * part.base, bodypart, piece: shown, texture, size: hidden(fileName) ? "own" : size, turn: typeof turn === "object" && turn ? turn[view] : turn, name: fileName });
        mdl = swapped.mdl;
        const r = swapped.report;
        const others = r.bones.filter((b) => b !== r.bone);
        // a hidden file (a blind test's original) is fitted into, but nothing of its own weapon is told
        done.push(
          hidden(fileName)
            ? `${r.model} on ${r.bone}${others.length ? ` and ${others.join(", ")}` : ""}`
            : `${r.model} on ${r.bone}${others.length ? ` and ${others.join(", ")}` : ""} (${r.was} triangles were there; laid ${r.turn}, ${size === "own" ? "at its own size" : `scaled ${r.scale.toFixed(2)}`}, ${r.left.toFixed(2)} off the old outline)`,
        );
      } catch (error) {
        report.errors.push(`weapon: ${fileName}, ${model.name}: ${error.message}`);
      }
    }
    // the weapon's own animations, in place of the game's in the first-person file (by name: its number stays,
    // and the game's code goes on playing it)
    if (view === "v")
      for (const [n, anim] of (spec.weapon.animations ?? []).entries()) {
        try {
          const list = sequencesOf(mdl);
          const old = list.find((seq) => seq.name === anim.replace);
          if (!old) throw new Error(`no animation ${anim.replace} in ${fileName}: it has ${list.map((seq) => seq.name).join(", ")}`);
          const rig = A.rigOf(mdl);
          const from = typeof anim.from === "object" ? anim.from : { seq: anim.from ?? anim.replace, frame: 0 };
          const base = A.poseOfValues(rig, readSequence(mdl, from.seq).frames[from.frame ?? 0]);
          const aimer = anim.keys.some((key) => key.aim) ? aimerOf(mdl, rig, base, anim.bones) : null;
          const keys = anim.keys.map((key) => {
            if (key.aim) {
              const found = aimer(key.aim);
              report.facts.push(`${fileName}: ${anim.replace} frame ${key.at} aimed at ${key.aim.join(" ")} (across, up): ${found.say}`);
              return { at: key.at, ease: key.ease, pose: found.pose };
            }
            const changes = {};
            for (const [bone, turn] of Object.entries(key.turn ?? {})) changes[bone] = { ...(changes[bone] ?? {}), turn };
            for (const [bone, move] of Object.entries(key.move ?? {})) changes[bone] = { ...(changes[bone] ?? {}), move };
            return { at: key.at, ease: key.ease, pose: A.turnedInPose(rig, base, changes) };
          });
          const count = anim.frames ?? old.frames;
          mdl = replaceSequence(mdl, anim.replace, { frames: A.animate(rig, { frames: count, keys }), fps: anim.fps ?? old.fps });
          report.facts.push(`${fileName}: ${anim.replace} made anew, ${count} frames at ${anim.fps ?? old.fps} a second (it had ${old.frames} at ${old.fps}), from ${from.seq} frame ${from.frame ?? 0}`);
          if (Math.abs(count / (anim.fps ?? old.fps) - old.frames / old.fps) > 0.25 * (old.frames / old.fps))
            report.warnings.push(`weapon.animations[${n}]: ${anim.replace} lasts ${(count / (anim.fps ?? old.fps)).toFixed(2)} s where the game's lasted ${(old.frames / old.fps).toFixed(2)} s: the game times things by it (AGENTS.md, rule 3)`);
        } catch (error) {
          report.errors.push(`weapon.animations[${n}]: ${error.message}`);
        }
      }
    // the weapon's sounds that an animation plays: a 5004 event at its frame, the sound's path its text (the
    // other events kept), and the sound held against the time left in the animation after that frame
    if (view === "v")
      for (const [n, { spec: sound, event }] of (spec.weapon.sounds ?? []).entries()) {
        if (!event) continue;
        const name = sound.name ?? sound.sounds?.[0]?.name;
        const list = sequencesOf(mdl);
        const seq = list.find((s) => s.name === event.sequence);
        if (!seq) {
          report.errors.push(`weapon.sounds[${n}].event: no animation ${event.sequence} in ${fileName}`);
          continue;
        }
        const kept = eventsOf(mdl, event.sequence).filter((e) => !(e.event === 5004 && e.frame === event.frame));
        mdl = setEvents(mdl, event.sequence, [...kept, { frame: event.frame, event: 5004, options: name }].sort((a, b) => a.frame - b.frame));
        const left = (seq.frames - event.frame) / seq.fps;
        report.facts.push(`${fileName}: ${event.sequence} plays ${name} at frame ${event.frame} (event 5004), with ${left.toFixed(2)} s of the animation left`);
        const length = soundLengths.get(name);
        if (length && length > left + 0.05) report.warnings.push(`${name} lasts ${length.toFixed(2)} s; ${event.sequence} has ${left.toFixed(2)} s left after frame ${event.frame}: it is cut off or runs on over what comes next`);
      }
    const engine = check(mdl, "goldsrc");
    report.errors.push(...engine.errors.map((e) => `${fileName}: ${e}`));
    report.facts.push(`${fileName} (${WEAPON_VIEWS[view].what}), from ${place}: ${done.join("; ")}; its ${sequencesOf(mdl).length} animations and ${info.bones.length} bones are the game's`);
    files.push({ name: fileName, mdl, view, original: hidden(fileName) ? null : original });
  }
  return files;
}

// ── a body on a base model's skeleton ──────────────────────────────────────
/**
 * A base model read: its file, as `{ file, bodypart, bodies, pose }`, looked for beside the spec and in the
 * games' folders (`<game>/models/<file>`), its textures from <name>t.mdl when they are there. Returns
 * { src, file, joints: Map(bone name -> [x, y, z] in model space as it stands in `pose`), pose, bodypart, bodies }.
 */
/** A reference model's bytes for a contract: beside the spec or in the game folders, unless refused. */
function readContractFile(file, folder, games, refuse = []) {
  if (refuse.some((name) => name.replace(/^models\//, "") === file.replace(/^models\//, ""))) throw new Error(`${file} may not be used here (a blind test's original)`);
  const places = [resolve(folder ?? ".", file), ...games.flatMap((game) => [join(game, "models", file), join(game, file)])];
  const found = places.find((place) => existsSync(place));
  if (!found) throw new Error(`${file} is neither beside the spec nor in the game folders given`);
  return readFileSync(found);
}

function skeletonOf(given, folder, games, refuse = []) {
  const options = typeof given === "string" ? { file: given } : given;
  // a file this build may not read (the model a blind test reproduces): its skeleton would be the original's
  if (refuse.some((name) => name.replace(/^models\//, "") === options.file.replace(/^models\//, "")))
    throw new Error(`${options.file} may not be used here (a blind test's original): take another model's skeleton`);
  const places = [resolve(folder ?? ".", options.file), ...games.flatMap((game) => [join(game, "models", options.file), join(game, options.file)])];
  const file = places.find((place) => existsSync(place));
  if (!file) throw new Error(`${options.file} is neither beside the spec nor in the game folders given (${games.join(", ") || "none: --wads <game folder>"})`);
  let src = readFileSync(file);
  const textures = file.replace(/\.mdl$/i, "t.mdl");
  if (existsSync(textures) && !readMdl(src).textures.length) src = withTextures(src, readFileSync(textures));
  const pose = options.pose ?? { seq: 0, frame: 0 };
  const matrices = posed(src, pose).pose;
  const joints = new Map(bonesOf(src).map((bone, i) => [bone.name, apply34(matrices[i], [0, 0, 0])]));
  const info = readMdl(src);
  const bodypart = options.bodypart ?? 0;
  const bodies = options.bodies ?? info.bodyparts[bodypart].models.map((_, k) => k * info.bodyparts[bodypart].base);
  return { src, file, joints, pose, bodypart, bodies };
}

/** The meshes (in model space, each corner with its bone's name) put into the base in place of its bodies. */
/**
 * The skeleton with its first animation turned by `keys` ({ bone: { turn } }, bones named in any Biped
 * language), every frame and blend, and its joints worked out again in that stance.
 */
function posedSkeleton(skeleton, keys) {
  const names = bonesOf(skeleton.src).map((bone) => bone.name);
  const own = Object.fromEntries(Object.entries(keys).map(([bone, change]) => {
    const found = boneIn(bone, names);
    if (!found) throw new Error(`no bone ${bone} in the base: its bones are ${names.join(", ")}`);
    return [found, { turn: change.turn }];
  }));
  const rig = A.rigOf(skeleton.src);
  const seq = sequencesOf(skeleton.src)[0];
  const blends = Array.from({ length: Math.max(1, seq.blends ?? 1) }, (_, b) =>
    readSequence(skeleton.src, 0, b).frames.map((frame) => A.valuesOf(rig, A.turnedInPose(rig, A.poseOfValues(rig, frame), own))),
  );
  const src = replaceSequence(skeleton.src, 0, blends.length > 1 ? { blends } : { frames: blends[0] });
  const matrices = posed(src, skeleton.pose).pose;
  const joints = new Map(bonesOf(src).map((bone, i) => [bone.name, apply34(matrices[i], [0, 0, 0])]));
  return { ...skeleton, src, joints };
}

/** Every animation's root bones moved `lift` units up, blend by blend: the whole model stands higher. */
function liftRoot(src, lift) {
  const roots = bonesOf(src).map((bone, i) => (bone.parent < 0 ? i : -1)).filter((i) => i >= 0);
  let mdl = src;
  sequencesOf(src).forEach((seq, i) => {
    if (seq.group) return;
    const blends = Array.from({ length: Math.max(1, seq.blends ?? 1) }, (_, b) =>
      readSequence(mdl, i, b).frames.map((frame) => frame.map((v, bone) => (roots.includes(bone) ? [v[0], v[1], v[2] + lift, v[3], v[4], v[5]] : v))),
    );
    mdl = replaceSequence(mdl, i, blends.length > 1 ? { blends } : { frames: blends[0] });
  });
  return mdl;
}

function intoBase(skeleton, meshes, textures) {
  let mdl = skeleton.src;
  const info = readMdl(mdl);
  const boneNames = bonesOf(mdl).map((bone) => bone.name);
  const intoBone = posed(mdl, skeleton.pose).pose.map(inverse34);
  for (const body of skeleton.bodies) {
    const corners = (mesh) => mesh.tris.map((t) => t.map((c) => ({ p: c.p, uv: c.uv, bone: c.bone, group: c.group, smooth: c.smooth })));
    const first = putBody(mdl, { body, bodypart: skeleton.bodypart, tris: corners(meshes[0]), texture: textures[0], pose: skeleton.pose, bone: meshes[0].tris[0]?.[0].bone ?? 0, quiet: true });
    mdl = first.mdl;
    // the other textures' meshes after the first, in the same submodel
    const model = Math.floor(body / info.bodyparts[skeleton.bodypart].base) % info.bodyparts[skeleton.bodypart].models.length;
    for (let n = 1; n < meshes.length; n++) {
      const where = { bodypart: skeleton.bodypart, model };
      mdl = addMesh(mdl, where);
      const count = readMdl(mdl).bodyparts[skeleton.bodypart].models[model].meshes.length;
      const placedCorners = meshes[n].tris.map((t) =>
        t.map((c) => {
          const bone = boneNames.indexOf(c.bone);
          return { p: c.p, uv: c.uv, bone, to: intoBone[bone], group: c.group, smooth: c.smooth };
        }),
      );
      mdl = replaceMesh(mdl, { ...where, mesh: count - 1 }, meshOf(null, placedCorners, textures[n], placedCorners[0][0].bone), textures[n]);
    }
  }
  return mdl;
}

/** The poses a character is held in: its first animation's first frame, and the middle of a run, a walk, a crouch, a jump. */
function posesOf(mdl) {
  const list = sequencesOf(mdl);
  const poses = [{ seq: 0, frame: 0, label: `${list[0]?.name ?? "rest"} frame 0` }];
  for (const word of ["run", "walk", "crouch", "jump"]) {
    const n = list.findIndex((seq) => seq.name.toLowerCase().includes(word) && !seq.group);
    if (n >= 0) poses.push({ seq: n, frame: Math.floor(list[n].frames / 2), label: `${list[n].name} frame ${Math.floor(list[n].frames / 2)}` });
  }
  return poses;
}
