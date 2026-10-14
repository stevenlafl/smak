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
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { shape, sheet, allot } from "../workshop.mjs";
import { buildMdl, swapMesh } from "../build.mjs";
import { HANDS } from "../fit.mjs";
import { indexed, shrink } from "../image.mjs";
import { check } from "../check.mjs";
import { readMdl, bones as bonesOf, sequences as sequencesOf, withTextures, addMesh, replaceMesh, inverse34, apply34 } from "../mdl.mjs";
import { posed } from "../render.mjs";
import { meshOf } from "../mesh.mjs";
import { putBody } from "../bodies.mjs";
import { soundness } from "../sound.mjs";
import { shapeSoundness, seeThrough } from "../sound.mjs";
import { sword, taper } from "../../kits/swordkit.mjs";
import { axe } from "../../kits/axekit.mjs";
import { blunt } from "../../kits/bluntkit.mjs";
import { bow } from "../../kits/bowkit.mjs";
import { materialOf, flagsOf, zonePainter } from "./paint.mjs";

/** The spec's own name and version: written at its top, so that a later version can tell it apart. */
export const MODEL_SPEC = "smak.model/1";
/** Each kind of part with the fields it takes beside the ones every part takes. */
const KINDS = {
  box: ["size"],
  cylinder: ["radius", "height", "sides", "top"],
  sphere: ["radius", "sides"],
  turn: ["rings", "caps", "sides", "lining", "axis"],
  tube: ["path", "sides", "caps"],
  leaf: ["width", "height", "rows", "bend"],
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
const COMMON = ["id", "kind", "material", "at", "attach", "rotate", "mirror", "repeat", "open", "loose", "bone", "span", "note"];
/** The kinds that sit on another part's surface, and move with it. */
const ON_SURFACE = new Set(["band", "boss", "ridge", "studs"]);
/** The anchors every part has: the middles of the faces of its box, and its middle. */
const BOX_ANCHORS = ["top", "bottom", "front", "back", "left", "right", "centre"];
/** The fields a spec takes at its top. */
const TOP = ["spec", "name", "kind", "size", "texture", "seed", "materials", "parts", "prefabs", "allow", "base", "weapon", "note"];
/** A texture's side unless told; a kit's picture is made this much smaller (the kits paint at 1024 wide). */
const SHEET_SIZE = 256;
const KIT_SHRINK = 2;
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
  if (spec.weapon !== undefined) {
    const w = spec.weapon;
    if (typeof w?.like !== "string" || !/^[\w-]+$/.test(w.like))
      errors.push(`weapon.like: the game's weapon it takes the place of, as its files are named ("crowbar" for v_crowbar.mdl, p_crowbar.mdl, w_crowbar.mdl)`);
    if (w?.views !== undefined && (!Array.isArray(w.views) || !w.views.length || w.views.some((v) => !WEAPON_VIEWS[v])))
      errors.push(`weapon.views: some of "v" (first person), "p" (in another player's hands), "w" (lying in the world)`);
    if (w?.size !== undefined && !["old", "own"].includes(w.size)) errors.push(`weapon.size: "old" (stretched to the old one's length) or "own" (the size it was built at, its grip where the old grip was)`);
    if (w?.rig !== undefined && !["carry", "nearest"].includes(w.rig)) errors.push(`weapon.rig: "carry" (on the bone that carried the old one) or "nearest" (each corner on the bone of the old one's nearest corner: a slide, a drum that turns)`);
    if ((spec.kind ?? "held") !== "held") errors.push(`kind: a weapon is "held": built lying along +x, its grip at the low-x end`);
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
    switch (part.kind) {
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
        if (host && !["turn", "cylinder", "tube", "sphere"].includes(host.kind))
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
    if ((part.bone !== undefined || part.span !== undefined) && !spec.base) errors.push(`${label}: bone and span are a base model's bones: give the spec a base`);
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
    case "leaf":
      return part.rows ? [8, 8] : [part.width, part.height];
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
function buildPart(part, M, S, zone, px, material, hostSurface, capZones = []) {
  for (const capZone of capZones) if (capZone) S.zone(capZone, zonePainter(material, capZone, px), 2);
  const painterRound = ["turn", "cylinder", "sphere", "tube"].includes(part.kind) ? "v" : null;
  S.zone(zone, zonePainter(material, zone, px, { round: painterRound }), 2);
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
    case "cylinder":
    case "sphere":
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
    case "leaf": {
      const bend = part.bend ?? 0;
      const rows = part.rows ?? [0, 0.5, 1].map((t) =>
        [-0.5, 0, 0.5].map((u) => [u * part.width, bend * (1 - 4 * u * u) * Math.sin(Math.PI * t), t * part.height]),
      );
      M.leaf(rows, zone, { name: part.id });
      return {};
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
function piecesOf(spec, context) {
  const warnings = [];
  const prefabs = { ...context.prefabs, ...(spec.prefabs ?? {}) };
  const byId = new Map(spec.parts.map((part) => [part.id, part]));
  const materialFor = (part) => {
    const given = part.material ?? "wood";
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
  const size = spec.texture ?? {};
  const built = new Map();
  /** every placed triangle: { p: [a, b, c] (corners, each with uv), part, mesh } */
  const meshes = [];
  [...sheets.entries()].forEach(([flags, parts], n) => {
    const width = n ? SHEET_SIZE : (size.width ?? SHEET_SIZE);
    const height = n ? SHEET_SIZE : (size.height ?? SHEET_SIZE);
    const sizes = Object.fromEntries(parts.map((part) => [part.id, zoneSizeOf(part, (p) => byId.get(p.on.part))]));
    // a turned part's closed ends are painted as discs of their own: a table's top shows its grain across it
    for (const part of parts) for (const [end, size] of capDiscs(part)) sizes[`${part.id}#cap${end}`] = [size, size];
    const zones = allot(width, height, sizes, { gap: 4 });
    const M = shape(width, height);
    const S = sheet(width, height);
    for (const part of parts) {
      const start = M.tris.length;
      const host = ON_SURFACE.has(part.kind) ? built.get(part.on.part) : null;
      const capZones = [0, 1].map((end) => zones[`${part.id}#cap${end}`]);
      const made = buildPart(part, M, S, zones[part.id], zones.px, materialFor(part), host?.made, capZones);
      built.set(part.id, { made, mesh: meshes.length, range: [start, M.tris.length], host: host ? part.on.part : null });
    }
    meshes.push({ tris: M.tris, image: S.image(), flags, name: `sheet${n}` });
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
      const local = surface.at(from + anchor.s * (to - from), degrees(anchor.angle ?? 0), anchor.out ?? 0).p;
      return placed.get(id).transform(local);
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
      const mine = anchorOfBox(boxOf(pointsOf(list)), part.attach.at ?? "centre");
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
      const bone = boneOfPart(part);
      for (const { mesh, i } of trianglesOf(part.id)) meshes[mesh].tris[i] = meshes[mesh].tris[i].map((c) => ({ ...c, bone }));
    }
  }
  /** a bone's name for the other side: Bip01 L Arm for Bip01 R Arm */
  const otherSide = (name) => (name ? name.replace(/(^|\s)L(\s|$)/, "$1\u0000$2").replace(/(^|\s)R(\s|$)/, "$1L$2").replace("\u0000", "R") : name);
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
  return { meshes, warnings };
}

/**
 * Builds a model spec: validated, every part built and placed, written as a studio model, checked by the
 * engine's rules and the shape's, with a list of what each part came to. `folder`: where `file` prefabs are
 * read from; `prefabs`: prefab specs by name, beside the spec's own. Returns { mdl, report } where report is
 * { ok, errors, faults, warnings, notes, facts, parts }; `ok` when nothing is wrong. Throws only for a spec it
 * cannot read at all; every other fault is in the report.
 */
export function buildModelSpec(spec, { folder, prefabs = {}, games = [] } = {}) {
  const { errors, warnings } = validateModelSpec(spec, { prefabs });
  const report = { ok: false, errors, faults: [], warnings, notes: [], facts: [], parts: {} };
  if (errors.length) return { mdl: null, report };
  const name = spec.name ?? "model.mdl";
  const base = name.replace(/\.mdl$/i, "");
  // a base model: its skeleton, as it stands in `pose`, is what the parts are put on, and its file (with its
  // animations, blends and all) is what the body is put into
  let skeleton = null;
  if (spec.base) {
    try {
      skeleton = skeletonOf(spec.base, folder, games);
    } catch (error) {
      errors.push(`base: ${error.message}`);
      return { mdl: null, report };
    }
    report.facts.push(`base ${skeleton.file}: ${skeleton.joints.size} bones, ${sequencesOf(skeleton.src).length} animations; its joints as it stands in ${JSON.stringify(skeleton.pose)}: ${[...skeleton.joints].filter(([n]) => !/Finger|Toe0|Toe1|Toe2|Bip01$/.test(n)).map(([n, p]) => `${n} ${p.map((v) => Math.round(v)).join(" ")}`).join("; ")}`);
  }
  let pieces;
  try {
    pieces = piecesOf(spec, { folder, prefabs, skeleton });
  } catch (error) {
    errors.push(error.message);
    return { mdl: null, report };
  }
  warnings.push(...pieces.warnings);
  const { meshes } = pieces;
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
  const allow = spec.parts.filter((part) => part.open || part.loose).map((part) => part.id);
  allow.push(...(spec.allow?.open ?? []), ...(spec.allow?.floating ?? []));
  const sound = shapeSoundness(
    meshes.flatMap((mesh) => mesh.tris.map((t, i) => ({ p: t.map((c) => c.p), name: mesh.partOf[i] }))),
    { front: 1, allow: allow.flatMap((id) => [id, ...Object.keys(report.parts).filter((p) => p.startsWith(`${id}.`))]) },
  );
  report.faults.push(...sound.faults);
  report.notes.push(...sound.notes);
  report.edges = sound.edges;

  // written: one bone, one still animation
  const textures = meshes.map((mesh, n) => {
    const texture = indexed(mesh.image, `${base.slice(0, 40)}_${mesh.name}.bmp`.slice(0, 63));
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
  const files = spec.weapon ? weaponViews(spec, meshes, { folder, games, report }) : [];
  report.ok = !errors.length && !report.faults.length;
  return { mdl, report, files };
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
function weaponViews(spec, meshes, { folder, games, report }) {
  const { like, views = ["v", "p", "w"], size = "old", rig = "carry" } = spec.weapon;
  if (meshes.length !== 1) {
    report.errors.push(`weapon: a weapon wears one picture, and this one has ${meshes.length} (${meshes.map((m) => m.name).join(", ")}): a glowing or see-through material gets a picture of its own; leave such parts out of a weapon`);
    return [];
  }
  const piece = {
    tris: meshes[0].tris.map((t) => t.map((c) => ({ p: c.p, uv: c.uv, group: c.group, smooth: c.smooth }))),
    rig: rig === "nearest" ? "nearest" : undefined,
  };
  const files = [];
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
    const part = info.bodyparts[bodypart];
    const done = [];
    for (const [j, model] of part.models.entries()) {
      if (!weaponTris(model)) continue;
      try {
        const swapped = swapMesh(mdl, { body: j * part.base, bodypart, piece, texture, size, name: fileName });
        mdl = swapped.mdl;
        const r = swapped.report;
        done.push(`${r.model} on ${r.bone} (${r.was} triangles were there; laid ${r.turn}, ${size === "own" ? "at its own size" : `scaled ${r.scale.toFixed(2)}`}, ${r.left.toFixed(2)} off the old outline)`);
      } catch (error) {
        report.errors.push(`weapon: ${fileName}, ${model.name}: ${error.message}`);
      }
    }
    const engine = check(mdl, "goldsrc");
    report.errors.push(...engine.errors.map((e) => `${fileName}: ${e}`));
    report.facts.push(`${fileName} (${WEAPON_VIEWS[view].what}), from ${place}: ${done.join("; ")}; its ${sequencesOf(mdl).length} animations and ${info.bones.length} bones are the game's`);
    files.push({ name: fileName, mdl, view, original });
  }
  return files;
}

// ── a body on a base model's skeleton ──────────────────────────────────────
/**
 * A base model read: its file, as `{ file, bodypart, bodies, pose }`, looked for beside the spec and in the
 * games' folders (`<game>/models/<file>`), its textures from <name>t.mdl when they are there. Returns
 * { src, file, joints: Map(bone name -> [x, y, z] in model space as it stands in `pose`), pose, bodypart, bodies }.
 */
function skeletonOf(given, folder, games) {
  const options = typeof given === "string" ? { file: given } : given;
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
