// A map from a spec: rooms and how they join, what stands in them, what lights them, in plain JSON that a
// person's words (and, when they give one, a drawing of the layout) are turned into by the agent that reads
// them. Built here with no code of the agent's own: the rooms laid out by the words that place them, carved
// out of one block of rock (so it cannot leak), its pictures made into a .wad of its own, checked, walked,
// compiled when the compilers are there, and drawn.
//
//   buildMapSpec(spec, { out, compilers, prefabs })  -> { map, report, files }
//   validateMapSpec(spec)                            -> { errors, warnings }
//   layoutOf(spec)                                   -> the rooms as boxes, before anything else is built
//
// docs/SPEC.md is the guide. Axes as every map's: +x east, +y north, +z up, a unit about an inch.
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { carve, box, cylinder, wedge, stairs as stairBrushes, light, sunLight, playerStart, pointEntity, brushEntity, writeMap, readMap, subtract, moved } from "../maps/source.mjs";
import { checkPlan } from "../maps/plan.mjs";
import { reachOf } from "../maps/reach.mjs";
import { writeWad } from "../maps/wad.mjs";
import { compileMap, findCompilers } from "../maps/compile.mjs";
import { readBsp } from "../maps/bsp.mjs";
import { lightReport } from "../maps/light.mjs";
import { planOfSource, planOf, drawMap, sectionOf } from "../maps/draw.mjs";
import { tile, label } from "../render.mjs";
import { png } from "../image.mjs";
import { materialOf, surfacePicture, MATERIALS } from "./paint.mjs";
import { buildModelSpec, validateModelSpec } from "./model.mjs";

export const MAP_SPEC = "smak.map/1";
const TOP = ["spec", "name", "wall", "grid", "theme", "textures", "rooms", "links", "entities", "props", "furniture", "prefabs", "models", "layout", "sky", "sun", "note"];
const ROOM = ["id", "size", "at", "place", "floor", "sky", "surfaces", "light", "note"];
const LINK = ["between", "kind", "width", "height", "along", "sill", "stairs", "door", "note"];
const PLACES = ["east_of", "west_of", "north_of", "south_of", "above", "below"];
const LINK_KINDS = ["door", "opening", "window", "stairs"];
/** Sizes by the words of MAPS-MAKING.md, "Units and sizes". */
const PLAYER = { wide: 32, high: 72 };
const STEP = 18;
const DOOR = { width: 64, height: 96 };
const WINDOW = { width: 48, height: 48, sill: 40 };
/** How thick a lining of another texture is (a yard's grass, a sky over a court). */
const LINING = 8;
/** One lamp a floor area this large (square units) unless told; a lamp hangs this far under the ceiling. */
const LAMP_AREA = 256 * 256;
const LAMP_UNDER = 24;
const LAMP_BRIGHTNESS = 250;
/** How far from a wall an entity is put by "against" and "corner". */
const INSET = 48;
/** The rise and the depth of a stair's step that a link of stairs is built with. */
const RISE = 16;
const TREAD = 24;
const FACINGS = { east: 0, north: 90, west: 180, south: 270 };

const isNumber = (v) => typeof v === "number" && Number.isFinite(v);
const snap = (v, grid) => Math.round(v / grid) * grid;
const mid = (room) => room.min.map((v, k) => (v + room.max[k]) / 2);

/** Pictures one under another, each named in its top left corner, on a dark ground. */
function stacked(pictures, names) {
  const width = Math.max(...pictures.map((p) => p.width));
  const height = pictures.reduce((h, p) => h + p.height, 0);
  const rgba = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) rgba.set([24, 26, 30, 255], i * 4);
  const out = { width, height, rgba };
  let top = 0;
  pictures.forEach((p, n) => {
    for (let y = 0; y < p.height; y++) rgba.set(p.rgba.subarray(y * p.width * 4, (y + 1) * p.width * 4), ((top + y) * width) * 4);
    label(out, names[n], 6, top + 6);
    top += p.height;
  });
  return out;
}

/** The texture names a spec's materials take: SM_ and the word, 15 letters at most, as a .wad holds them. */
const textureName = (key) => (key === "sky" ? "sky" : `SM_${key}`.toUpperCase().replace(/[^A-Z0-9_]/g, "").slice(0, 15));

/**
 * The rooms of a layout drawing: rows of text, a character a cell of `cell` units, each letter the key gives
 * a room id to standing for that room's floor. A room's cells must make a rectangle. Returns
 * { rooms: { id: { x0, y0, x1, y1 } } (units, +y north: the first row is the northmost), marks: [{ char, x, y }] }
 * for the characters the key gives anything else (a prefab, an entity).
 */
export function readLayout(layout) {
  const { rows, cell = 64, key = {} } = layout;
  const rooms = {};
  const marks = [];
  const height = rows.length;
  rows.forEach((row, r) =>
    [...row].forEach((char, c) => {
      const meaning = key[char];
      const x = c * cell;
      const y = (height - 1 - r) * cell;
      if (typeof meaning === "string") {
        const box = (rooms[meaning] ??= { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity, cells: 0 });
        box.x0 = Math.min(box.x0, x);
        box.y0 = Math.min(box.y0, y);
        box.x1 = Math.max(box.x1, x + cell);
        box.y1 = Math.max(box.y1, y + cell);
        box.cells++;
      } else if (meaning) marks.push({ char, meaning, x: x + cell / 2, y: y + cell / 2 });
    }),
  );
  return { rooms, marks, cell };
}

/** What is wrong with a map spec before anything is built: { errors, warnings }, each with its path. */
export function validateMapSpec(spec) {
  const errors = [];
  const warnings = [];
  if (!spec || typeof spec !== "object") return { errors: ["the spec is not an object"], warnings };
  if (spec.spec !== MAP_SPEC) errors.push(`spec: "${MAP_SPEC}" says what this is; it has ${JSON.stringify(spec.spec)}`);
  for (const key of Object.keys(spec)) if (!TOP.includes(key)) warnings.push(`${key}: not a field of a map spec, left out`);
  if (spec.name !== undefined && !/^[a-z0-9_]{1,31}$/i.test(spec.name))
    errors.push(`name: the map's name, letters, digits and _ (it is typed in the console: map <name>)`);
  if (!Array.isArray(spec.rooms) || !spec.rooms.length) {
    errors.push("rooms: a list of one room at least");
    return { errors, warnings };
  }
  const layout = spec.layout ? readLayout(spec.layout) : null;
  if (layout)
    for (const [id, box] of Object.entries(layout.rooms)) {
      const area = ((box.x1 - box.x0) * (box.y1 - box.y0)) / layout.cell ** 2;
      if (area !== box.cells) errors.push(`layout: the cells of ${id} make no rectangle (${box.cells} cells in a box of ${area})`);
    }
  const ids = new Map();
  spec.rooms.forEach((room, i) => {
    const at = `rooms[${i}]${room?.id ? ` (${room.id})` : ""}`;
    if (typeof room?.id !== "string" || !/^[A-Za-z]\w*$/.test(room.id)) errors.push(`${at}.id: a name of letters, digits and _`);
    else if (ids.has(room.id)) errors.push(`${at}.id: "${room.id}" is given twice`);
    else ids.set(room.id, i);
    for (const key of Object.keys(room ?? {})) if (!ROOM.includes(key)) warnings.push(`${at}.${key}: not a field of a room, left out`);
    const fromLayout = layout?.rooms[room?.id];
    const size = room?.size;
    if (fromLayout) {
      if (!(isNumber(size) || (Array.isArray(size) && isNumber(size.at(-1)))))
        errors.push(`${at}.size: a room drawn in the layout takes its height here (a number), its floor plan from the drawing`);
    } else if (!Array.isArray(size) || size.length !== 3 || !size.every((v) => isNumber(v) && v > 0))
      errors.push(`${at}.size: [x, y, z] in units, each over 0 (a room ${DOOR.width * 4} x ${DOOR.width * 4} x 160 is middling)`);
    else if (size[0] < PLAYER.wide || size[1] < PLAYER.wide || size[2] < PLAYER.high)
      errors.push(`${at}.size: a player is 32 wide and 72 tall; ${size.join(" x ")} does not hold one`);
    if (room?.place) {
      const ways = PLACES.filter((w) => room.place[w] !== undefined);
      if (ways.length !== 1) errors.push(`${at}.place: one of ${PLACES.join(", ")}, naming a room given before`);
      else if (!ids.has(room.place[ways[0]]) || ids.get(room.place[ways[0]]) >= i)
        errors.push(`${at}.place.${ways[0]}: "${room.place[ways[0]]}" is no room given before this one`);
    }
    if (room?.at !== undefined && !(Array.isArray(room.at) && room.at.length === 3 && room.at.every(isNumber)))
      errors.push(`${at}.at: [x, y, z], its least corner (the south-west corner of its floor)`);
    if (!room?.place && room?.at === undefined && !fromLayout && i > 0)
      errors.push(`${at}: a room after the first says where it is: place (east_of, north_of, above...), at, or the layout`);
  });
  (spec.links ?? []).forEach((link, i) => {
    const at = `links[${i}]`;
    for (const key of Object.keys(link ?? {})) if (!LINK.includes(key)) warnings.push(`${at}.${key}: not a field of a link, left out`);
    if (!Array.isArray(link?.between) || link.between.length !== 2 || !link.between.every((id) => ids.has(id)))
      errors.push(`${at}.between: two rooms' ids, of rooms the spec has (${[...ids.keys()].join(", ")})`);
    if (!LINK_KINDS.includes(link?.kind ?? "opening")) errors.push(`${at}.kind: one of ${LINK_KINDS.join(", ")}`);
    if (link?.width !== undefined && !(link.width >= PLAYER.wide && link.kind !== "window") && link.kind !== "window")
      errors.push(`${at}.width: a player is 32 wide; a way through needs that and more (64 is a door)`);
  });
  const known = new Set([...ids.keys()]);
  for (const [list, what] of [[spec.entities, "entities"], [spec.props, "props"], [spec.furniture, "furniture"]])
    (list ?? []).forEach((thing, i) => {
      if (!known.has(thing?.room)) errors.push(`${what}[${i}].room: the id of the room it is in (${[...known].join(", ")})`);
      if (what === "entities" && typeof thing?.class !== "string") errors.push(`${what}[${i}].class: its classname`);
      if (what === "props" && !spec.models?.[thing?.model] && typeof thing?.model !== "string")
        errors.push(`${what}[${i}].model: a model of the spec's models, or a .mdl path the game has`);
      if (what === "furniture" && !spec.prefabs?.[thing?.prefab] && !Array.isArray(thing?.box))
        errors.push(`${what}[${i}]: a prefab of the spec's prefabs (prefab), or a box [x, y, z] of its own`);
    });
  for (const [name, model] of Object.entries(spec.models ?? {}))
    if (typeof model === "object" && !model.file) {
      const inner = validateModelSpec(model);
      errors.push(...inner.errors.map((e) => `models.${name}.${e}`));
    }
  if (!(spec.entities ?? []).some((e) => /^info_player_(start|deathmatch)$/.test(e.class)))
    errors.push("entities: a place to start (info_player_start) in one room at least");
  return { errors, warnings };
}

/**
 * The rooms as boxes: { rooms: Map(id -> { id, min, max, spec }), errors }. The first room stands at the
 * origin (its floor at z 0) unless placed; each after it is placed against one before it, `wall` units of
 * rock between them, lined up as `align` says ("centre", the default; "north", "south", "east", "west": the
 * named sides even; a number: so many units from the other's least side), its floor `floor` units over the
 * other's. "above" and "below" stack them with `wall` of rock between.
 */
export function layoutOf(spec) {
  const wall = spec.wall ?? 16;
  const grid = spec.grid ?? 16;
  const drawn = spec.layout ? readLayout(spec.layout) : null;
  const rooms = new Map();
  const errors = [];
  for (const room of spec.rooms) {
    const fromLayout = drawn?.rooms[room.id];
    const size = fromLayout
      ? [fromLayout.x1 - fromLayout.x0, fromLayout.y1 - fromLayout.y0, isNumber(room.size) ? room.size : room.size.at(-1)]
      : room.size;
    let min;
    if (fromLayout) min = [fromLayout.x0, fromLayout.y0, room.floor ?? 0];
    else if (room.at) min = [...room.at];
    else if (!room.place) min = [-size[0] / 2, -size[1] / 2, 0].map((v) => snap(v, grid));
    else {
      const way = PLACES.find((w) => room.place[w] !== undefined);
      const other = rooms.get(room.place[way]);
      const gap = room.place.gap ?? wall;
      const align = room.place.align ?? "centre";
      const across = (axis) => {
        const lo = other.min[axis];
        const hi = other.max[axis];
        if (isNumber(align)) return lo + align;
        if (align === "centre") return snap((lo + hi) / 2 - size[axis] / 2, grid);
        const low = axis === 0 ? "west" : "south";
        const high = axis === 0 ? "east" : "north";
        if (align === low) return lo;
        if (align === high) return hi - size[axis];
        errors.push(`rooms ${room.id}: align "${align}" is not a side along ${axis === 0 ? "x" : "y"} (${low}, ${high}, centre or a number)`);
        return lo;
      };
      const floor = other.min[2] + (room.floor ?? 0);
      if (way === "east_of") min = [other.max[0] + gap, across(1), floor];
      if (way === "west_of") min = [other.min[0] - gap - size[0], across(1), floor];
      if (way === "north_of") min = [across(0), other.max[1] + gap, floor];
      if (way === "south_of") min = [across(0), other.min[1] - gap - size[1], floor];
      if (way === "above") min = [across(0), across(1), other.max[2] + gap];
      if (way === "below") min = [across(0), across(1), other.min[2] - gap - size[2]];
    }
    rooms.set(room.id, { id: room.id, min, max: min.map((v, k) => v + size[k]), spec: room });
  }
  return { rooms, errors, marks: drawn?.marks ?? [], wall };
}

/** How two boxes lie: the axis of the rock between them and its two faces, or null when they are not side by side. */
function sharedWall(a, b, wall) {
  for (let axis = 0; axis < 3; axis++) {
    const gapAB = b.min[axis] - a.max[axis];
    const gapBA = a.min[axis] - b.max[axis];
    const gap = gapAB >= 0 ? gapAB : gapBA >= 0 ? gapBA : null;
    if (gap === null || gap > wall + 1e-6) continue;
    const others = [0, 1, 2].filter((k) => k !== axis);
    const overlap = others.map((k) => [Math.max(a.min[k], b.min[k]), Math.min(a.max[k], b.max[k])]);
    if (axis < 2 && overlap[0][1] - overlap[0][0] > 0) return { axis, gap, from: gapAB >= 0 ? a : b, to: gapAB >= 0 ? b : a, overlap, others };
    if (axis === 2 && overlap.every(([lo, hi]) => hi - lo > 0)) return { axis, gap, from: gapAB >= 0 ? a : b, to: gapAB >= 0 ? b : a, overlap, others };
  }
  return null;
}

/** A point turned by `quarters` quarter turns about z (anticlockwise seen from above). */
function quarterTurn([x, y, z], quarters) {
  for (let q = 0; q < ((quarters % 4) + 4) % 4; q++) [x, y] = [-y, x];
  return [x, y, z];
}
/** A brush turned by quarter turns about z: its planes' points and its pictures' axes with it. */
function turnedBrush(brush, quarters) {
  const axis = (a) => [...quarterTurn(a.slice(0, 3), quarters), a[3]];
  return { faces: brush.faces.map((face) => ({ ...face, points: face.points.map((p) => quarterTurn(p, quarters)), u: axis(face.u), v: axis(face.v) })) };
}
/**
 * A prefab read from a .map file, as Hammer's are: its world brushes and its entities, a group that is put
 * down as one. Its own origin is the point on the floor where it is put. Returns { brushes, entities, textures }.
 */
function prefabFromMap(file, at, quarters) {
  const map = readMap(readFileSync(file, "utf8"));
  const place = (brushes) => brushes.map((brush) => moved(turnedBrush(brush, quarters), at));
  const textures = new Set(map.brushes.flatMap((b) => b.faces.map((f) => f.texture)));
  const entities = map.entities.map((entity) => {
    const out = { ...entity };
    if (entity.brushes) {
      out.brushes = place(entity.brushes);
      for (const b of entity.brushes) for (const f of b.faces) textures.add(f.texture);
    }
    if (typeof entity.origin === "string") {
      const p = quarterTurn(entity.origin.split(/\s+/).map(Number), quarters);
      out.origin = p.map((v, k) => v + at[k]);
    }
    if (typeof entity.angles === "string") {
      const [pitch, yaw, roll] = entity.angles.split(/\s+/).map(Number);
      out.angles = [pitch, (yaw + 90 * quarters) % 360, roll];
    }
    return out;
  });
  return { brushes: place(map.brushes), entities, textures: [...textures] };
}

/** A brush prefab's pieces turned by a quarter turn `quarters` about z and moved to `at` ([x, y, floor]). */
function placedPrefab(prefab, at, quarters, textureOf) {
  const turn = (p) => {
    let [x, y] = p;
    for (let q = 0; q < ((quarters % 4) + 4) % 4; q++) [x, y] = [-y, x];
    return [x + at[0], y + at[1], p[2] + at[2]];
  };
  const turnBox = (min, max) => {
    const a = turn(min);
    const b = turn(max);
    return [a.map((v, k) => Math.min(v, b[k])), a.map((v, k) => Math.max(v, b[k]))];
  };
  const SIDES_TURNED = ["+x", "+y", "-x", "-y"];
  return prefab.pieces.map((piece) => {
    const texture = textureOf(piece.texture ?? "wood");
    if (piece.box) return box(...turnBox(...piece.box), texture);
    if (piece.wedge) {
      const [min, max] = turnBox(piece.wedge[0], piece.wedge[1]);
      const high = SIDES_TURNED[(SIDES_TURNED.indexOf(piece.high ?? "+x") + quarters) % 4];
      return wedge(min, max, high, texture);
    }
    if (piece.cylinder) {
      const { centre, radius, from, to, sides = 12 } = piece.cylinder;
      const c = turn([centre[0], centre[1], 0]);
      return cylinder("z", [c[0], c[1]], radius, at[2] + from, at[2] + to, texture, { sides });
    }
    throw new Error(`a prefab's piece is a box [min, max], a wedge [min, max] with high, or a cylinder { centre, radius, from, to }`);
  });
}

/**
 * Builds a map spec into `out` (a folder): <name>.map, <name>.wad (its own pictures), models/<model>.mdl for
 * every model it puts in, and <name>.bsp when the compilers are found (`compilers`: what findCompilers gave,
 * or a folder). Returns { report, files, map }: report is { ok, errors, faults, warnings, facts, rooms }.
 */
export function buildMapSpec(spec, { out, compilers, folder } = {}) {
  const { errors, warnings } = validateMapSpec(spec);
  const report = { ok: false, errors, faults: [], warnings, facts: [], rooms: {} };
  const files = {};
  if (errors.length) return { report, files, map: null };
  const name = spec.name ?? "specmap";
  const { rooms, errors: placing, marks, wall } = layoutOf(spec);
  errors.push(...placing);

  // ── textures: the theme's and every other the spec names, each made a picture of its own ──
  const theme = { floor: "stone", wall: "plaster", ceiling: "planks", door: "metal", furniture: "darkwood", ...(spec.theme ?? {}) };
  const materials = { ...theme, ...(spec.textures ?? {}) };
  const used = new Map();
  /** a texture name for a word of the spec (a key of theme/textures, or a base material) */
  const textureOf = (word) => {
    if (word === "sky") return used.set("sky", { base: "glass", tone: [0.45, 0.6, 0.85] }) && "sky";
    const material = materials[word] ?? word;
    materialOf(material, `texture ${word}`);
    const key = materials[word] !== undefined ? word : `${typeof material === "string" ? material : material.base}`;
    used.set(key, material);
    return textureName(key);
  };
  let themeNames;
  try {
    themeNames = { floor: textureOf("floor"), wall: textureOf("wall"), ceiling: textureOf("ceiling") };
  } catch (error) {
    errors.push(error.message);
    return { report, files, map: null };
  }

  // ── the ways through: doorways, windows, stairs, shafts between storeys ──
  const holes = [];
  const brushes = [];
  /** where to cut the map upright to see each staircase: { name, from, to } in plan */
  const cuts = [];
  const entities = [];
  (spec.links ?? []).forEach((link, i) => {
    const [a, b] = link.between.map((id) => rooms.get(id));
    const kind = link.kind ?? "opening";
    const shared = sharedWall(a, b, wall + LINING * 2);
    if (!shared) {
      errors.push(`links[${i}]: ${a.id} and ${b.id} are not side by side with ${wall} of rock between them (place one against the other)`);
      return;
    }
    const { axis, from, to, overlap, others } = shared;
    if (axis === 2) {
      // one room over the other: a shaft through the slab where the stairs come up, the stairs in the lower
      const lower = from;
      const upper = to;
      const width = link.width ?? 96;
      const rise = upper.min[2] - lower.min[2];
      const count = Math.ceil(rise / RISE);
      const run = count * TREAD;
      const [x0, x1] = overlap[0];
      const [y0, y1] = overlap[1];
      if (x1 - x0 >= run + 32 && y1 - y0 >= width) {
        const sx = x0 + 16;
        const sy = y0 + 16;
        holes.push({ min: [sx, sy, lower.max[2]], max: [sx + run, sy + width, upper.min[2]] });
        brushes.push(...stairBrushes([sx, sy, lower.min[2]], [sx + run, sy + width, upper.min[2]], "+x", textureOf("floor"), { steps: count, top: false, tread: TREAD }));
        report.facts.push(`links[${i}]: stairs of ${count} steps from ${lower.id} up to ${upper.id}, along x from ${sx} to ${sx + run}`);
        cuts.push({ name: `${lower.id} up to ${upper.id}`, from: [lower.min[0] - 8, sy + width / 2], to: [lower.max[0] + 8, sy + width / 2] });
      } else errors.push(`links[${i}]: stairs from ${lower.id} to ${upper.id} need ${run + 32} x ${width} of floor both rooms share; they share ${x1 - x0} x ${y1 - y0}`);
      return;
    }
    const along = others[0];
    const [lo, hi] = overlap[0];
    const width = Math.min(link.width ?? (kind === "window" ? WINDOW.width : DOOR.width), hi - lo);
    const share = link.along ?? 0.5;
    const centre = snap(lo + (hi - lo) * share, 8);
    const w0 = Math.max(lo, Math.min(hi - width, centre - width / 2));
    const floorHigh = Math.max(a.min[2], b.min[2]);
    const floorLow = Math.min(a.min[2], b.min[2]);
    const ceiling = Math.min(a.max[2], b.max[2]);
    const z0 = kind === "window" ? floorHigh + (link.sill ?? WINDOW.sill) : floorHigh;
    const height = Math.min(link.height ?? (kind === "window" ? WINDOW.height : DOOR.height), ceiling - z0);
    if (kind !== "window" && height < PLAYER.high) errors.push(`links[${i}]: the way from ${a.id} to ${b.id} is ${height} high; a player needs 72`);
    const hole = { min: [0, 0, z0], max: [0, 0, z0 + height] };
    hole.min[axis] = from.max[axis];
    hole.max[axis] = to.min[axis];
    hole.min[along] = w0;
    hole.max[along] = w0 + width;
    holes.push(hole);
    report.facts.push(`links[${i}]: ${kind === "opening" ? "an" : "a"} ${kind} ${width} wide and ${height} high from ${a.id} to ${b.id} at ${along === 0 ? "x" : "y"} ${w0} to ${w0 + width}`);
    if (kind !== "window" && floorHigh - floorLow > STEP) {
      // stairs in the lower room, up to the doorway's floor, against the wall it is in
      const lower = a.min[2] < b.min[2] ? a : b;
      const count = Math.ceil((floorHigh - floorLow) / RISE);
      const run = count * TREAD;
      const toward = lower === from ? 1 : -1;
      const min = [0, 0, floorLow];
      const max = [0, 0, floorHigh];
      min[along] = w0;
      max[along] = w0 + width;
      if (toward > 0) {
        min[axis] = lower.max[axis] - run;
        max[axis] = lower.max[axis];
      } else {
        min[axis] = lower.min[axis];
        max[axis] = lower.min[axis] + run;
      }
      const high = `${toward > 0 ? "+" : "-"}${"xyz"[axis]}`;
      if (run > lower.max[axis] - lower.min[axis] - PLAYER.wide) errors.push(`links[${i}]: stairs up ${floorHigh - floorLow} need ${run} of ${lower.id}'s floor; it is ${lower.max[axis] - lower.min[axis]} long that way`);
      else {
        brushes.push(...stairBrushes(min, max, high, textureOf("floor"), { steps: count, top: false, tread: TREAD }));
        report.facts.push(`links[${i}]: stairs of ${count} steps in ${lower.id} up to the way at ${floorHigh}`);
        const middle = w0 + width / 2;
        const ends = [Math.min(a.min[axis], b.min[axis]) - 8, Math.max(a.max[axis], b.max[axis]) + 8];
        cuts.push({ name: `${a.id} to ${b.id}`, from: axis === 0 ? [ends[0], middle] : [middle, ends[0]], to: axis === 0 ? [ends[1], middle] : [middle, ends[1]] });
      }
    } else if (kind !== "window" && floorHigh !== floorLow) report.facts.push(`links[${i}]: a step of ${floorHigh - floorLow} from ${a.id} to ${b.id}`);
    if (kind === "door") {
      const leaf = { min: [...hole.min], max: [...hole.max] };
      const middle = (from.max[axis] + to.min[axis]) / 2;
      leaf.min[axis] = middle - 4;
      leaf.max[axis] = middle + 4;
      entities.push(brushEntity("func_door", [box(leaf.min, leaf.max, textureOf("door"))], { angle: -1, speed: 120, wait: 4, lip: 8, ...(link.door ?? {}) }));
    }
  });

  // ── rooms: carved in one block, lined where they wear another texture ──
  const boxes = [...rooms.values()].map(({ min, max }) => ({ min, max }));
  const linings = [];
  for (const room of rooms.values()) {
    const surfaces = { ...(room.spec.surfaces ?? {}) };
    if (room.spec.sky) surfaces.ceiling = "sky";
    for (const [face, word] of Object.entries(surfaces)) {
      if (!["floor", "ceiling"].includes(face)) {
        warnings.push(`rooms ${room.id}.surfaces.${face}: only floor and ceiling take a texture of their own; walls wear the theme's`);
        continue;
      }
      const z = face === "floor" ? [room.min[2] - LINING, room.min[2]] : [room.max[2], room.max[2] + LINING];
      const lining = { min: [room.min[0], room.min[1], z[0]], max: [room.max[0], room.max[1], z[1]] };
      // the room is carved past it, so the lining is the face; what goes through it (a stair's shaft) is cut out
      const carved = face === "floor" ? { min: [...room.min], max: [...room.max] } : null;
      const index = boxes.findIndex((b) => b.min === room.min);
      const grown = { min: [...boxes[index].min], max: [...boxes[index].max] };
      if (face === "floor") grown.min[2] -= LINING;
      else grown.max[2] += LINING;
      boxes[index] = grown;
      void carved;
      let pieces = [lining];
      for (const hole of holes) pieces = pieces.flatMap((piece) => subtract(piece, hole));
      const texture = textureOf(word);
      linings.push(...pieces.map((piece) => box(piece.min, piece.max, texture)));
    }
  }
  const rock = carve([...boxes, ...holes], wall, themeNames);
  brushes.unshift(...rock);
  brushes.push(...linings);

  // ── where things go in a room ──
  const pointIn = (room, at, inset = INSET) => {
    const c = mid(room);
    if (Array.isArray(at)) return [c[0] + at[0], c[1] + at[1]];
    const word = String(at ?? "centre");
    const near = /^near (\w+)$/.exec(word);
    if (near) {
      const other = rooms.get(near[1]);
      if (!other) throw new Error(`"${word}": no room ${near[1]}`);
      const o = mid(other);
      const towards = [o[0] - c[0], o[1] - c[1]];
      const k = Math.abs(towards[0]) > Math.abs(towards[1]) ? 0 : 1;
      const p = [c[0], c[1]];
      p[k] = towards[k] > 0 ? room.max[k] - inset * 1.5 : room.min[k] + inset * 1.5;
      return p;
    }
    const corner = /^corner (n|s)(e|w)$/.exec(word);
    if (corner)
      return [corner[2] === "e" ? room.max[0] - inset : room.min[0] + inset, corner[1] === "n" ? room.max[1] - inset : room.min[1] + inset];
    const against = /^against (north|south|east|west)$/.exec(word);
    if (against) {
      const side = against[1];
      return [
        side === "east" ? room.max[0] - inset : side === "west" ? room.min[0] + inset : c[0],
        side === "north" ? room.max[1] - inset : side === "south" ? room.min[1] + inset : c[1],
      ];
    }
    if (word === "centre" || word === "center") return [c[0], c[1]];
    throw new Error(`"${word}": a place in a room is centre, corner ne (nw, se, sw), against north (south, east, west), near <room>, or [dx, dy] from its middle`);
  };
  const yawOf = (room, facing, point) => {
    if (facing === undefined) return 0;
    if (isNumber(facing)) return facing;
    if (FACINGS[facing] !== undefined) return FACINGS[facing];
    const other = rooms.get(facing);
    if (!other) throw new Error(`facing "${facing}": north, east, south, west, degrees, or a room's id`);
    const o = mid(other);
    return Math.round((Math.atan2(o[1] - point[1], o[0] - point[0]) * 180) / Math.PI);
  };
  const place = (list, what, each) =>
    (list ?? []).forEach((thing, i) => {
      try {
        const room = rooms.get(thing.room);
        const xy = pointIn(room, thing.at);
        each(thing, room, [xy[0], xy[1], room.min[2] + (thing.z ?? 0)], i);
      } catch (error) {
        errors.push(`${what}[${i}]: ${error.message}`);
      }
    });

  // furniture: brush prefabs, or plain boxes
  const prefabs = spec.prefabs ?? {};
  // a texture a prefab's .map names, as the word of the spec it was made from: SM_FURNITURE is "furniture"
  const wordOfTexture = new Map([...Object.keys(materials), ...Object.keys(MATERIALS)].map((word) => [textureName(word), word]));
  const putPrefab = (prefab, at, quarters, where) => {
    if (!prefab.file) return void brushes.push(...placedPrefab(prefab, at, quarters, textureOf));
    const placed = prefabFromMap(resolve(folder ?? ".", prefab.file), at, quarters);
    for (const name of placed.textures) {
      const word = wordOfTexture.get(name.toUpperCase());
      if (!word) throw new Error(`${where}: its .map wears ${name}, which is no material of the spec (its textures are SM_ and a word of theme, textures or a base)`);
      textureOf(word);
    }
    brushes.push(...placed.brushes);
    entities.push(...placed.entities);
  };
  place(spec.furniture, "furniture", (thing, room, at, i) => {
    const prefab = thing.prefab ? prefabs[thing.prefab] : { pieces: [{ box: [[-thing.box[0] / 2, -thing.box[1] / 2, 0], [thing.box[0] / 2, thing.box[1] / 2, thing.box[2]]], texture: thing.texture ?? "furniture" }] };
    putPrefab(prefab, at, Math.round((thing.rotate ?? 0) / 90), `furniture[${i}]`);
  });
  for (const mark of marks) {
    if (!mark.meaning.prefab) continue;
    const room = [...rooms.values()].find((r) => mark.x > r.min[0] && mark.x < r.max[0] && mark.y > r.min[1] && mark.y < r.max[1]);
    if (!room) {
      errors.push(`layout: the mark ${mark.char} at ${mark.x} ${mark.y} is in no room`);
      continue;
    }
    if (!prefabs[mark.meaning.prefab]) errors.push(`layout: the mark ${mark.char} names no prefab ${mark.meaning.prefab}`);
    else
      try {
        putPrefab(prefabs[mark.meaning.prefab], [mark.x, mark.y, room.min[2]], Math.round((mark.meaning.rotate ?? 0) / 90), `layout ${mark.char}`);
      } catch (error) {
        errors.push(error.message);
      }
  }

  // models built from their specs, and put in as props
  mkdirSync(join(out, "models"), { recursive: true });
  const modelFiles = {};
  for (const [modelName, given] of Object.entries(spec.models ?? {})) {
    const modelSpec = given.file ? JSON.parse(readFileSync(resolve(folder ?? ".", given.file), "utf8")) : given;
    const built = buildModelSpec({ ...modelSpec, name: `${modelName}.mdl` }, { folder });
    if (!built.mdl || !built.report.ok) {
      errors.push(`models.${modelName}: ${[...built.report.errors, ...built.report.faults].join("; ")}`);
      continue;
    }
    const file = join(out, "models", `${modelName}.mdl`);
    writeFileSync(file, built.mdl);
    files[`model ${modelName}`] = file;
    modelFiles[modelName] = `models/${modelName}.mdl`;
    report.facts.push(`models.${modelName}: built and sound (${built.report.facts[0]})`);
  }
  place(spec.props, "props", (thing, room, at) => {
    const model = modelFiles[thing.model] ?? thing.model;
    entities.push(pointEntity(thing.class ?? "cycler_sprite", at, { model, angles: [0, yawOf(room, thing.facing, at), 0], ...(thing.keys ?? {}) }));
  });
  // the entities
  place(spec.entities, "entities", (thing, room, at) => {
    const yaw = yawOf(room, thing.facing, at);
    const keys = { ...(thing.keys ?? {}) };
    if (thing.id) keys.targetname = thing.id;
    if (/^info_player_/.test(thing.class)) {
      const start = playerStart(at, yaw, thing.class);
      Object.assign(start, keys);
      entities.push(start);
    } else if (thing.class === "light") entities.push(light([at[0], at[1], at[2] + (thing.height ?? 96)], keys));
    else entities.push(pointEntity(thing.class, at, { angles: [0, yaw, 0], ...keys }));
  });
  // light: each room that asks lamps by its floor's area, a sun for rooms under the sky
  let sunny = false;
  for (const room of rooms.values()) {
    const asked = room.spec.light ?? (room.spec.sky ? "none" : "auto");
    if (room.spec.sky) sunny = true;
    if (asked === "none") continue;
    const options = typeof asked === "object" ? asked : {};
    const size = [room.max[0] - room.min[0], room.max[1] - room.min[1]];
    const count = options.count ?? Math.max(1, Math.round((size[0] * size[1]) / LAMP_AREA));
    const across = Math.max(1, Math.round(Math.sqrt((count * size[0]) / size[1])));
    const down = Math.ceil(count / across);
    for (let i = 0; i < count; i++) {
      const cx = room.min[0] + (size[0] * ((i % across) + 0.5)) / across;
      const cy = room.min[1] + (size[1] * (Math.floor(i / across) + 0.5)) / down;
      entities.push(light([Math.round(cx), Math.round(cy), room.max[2] - LAMP_UNDER], { brightness: options.brightness ?? LAMP_BRIGHTNESS, color: options.color ?? [255, 240, 220] }));
    }
  }
  if (sunny) {
    const sky = [...rooms.values()].find((room) => room.spec.sky);
    entities.push(sunLight([...mid(sky).slice(0, 2), sky.max[2] - 32], { pitch: -60, yaw: 30, brightness: 280, color: [255, 245, 225], ...(spec.sun ?? {}) }));
  }

  if (errors.length) return { report, files, map: null };
  // ── the files: the .wad of its pictures, and the .map ──
  mkdirSync(out, { recursive: true });
  const wadFile = join(out, `${name}.wad`);
  writeFileSync(wadFile, writeWad([...used.entries()].map(([key, material]) => ({ name: textureName(key), image: surfacePicture(material, key === "sky" ? 64 : 128) }))));
  files.wad = wadFile;
  const map = { worldspawn: { wad: [wadFile], message: spec.note ?? name, skyname: spec.sky ?? "desert" }, brushes, entities };
  const mapFile = join(out, `${name}.map`);
  writeFileSync(mapFile, writeMap(map));
  files.map = mapFile;
  report.facts.push(`${rooms.size} rooms, ${holes.length} ways through, ${brushes.length} brushes, ${entities.length} entities`);
  for (const room of rooms.values()) report.rooms[room.id] = { min: room.min, max: room.max };

  // ── checked before any compile: the plan, and the walk ──
  const textures = [...used.keys()].map(textureName);
  const plan = checkPlan(map, { textures });
  report.faults.push(...plan.errors);
  warnings.push(...plan.warnings);
  if (plan.leak) report.faults.push("the plan's flood finds a way out to the void: the map leaks");
  const walk = reachOf(map);
  // the walk test's own sentences: faults when it found an entity not reached, one in solid or a one-way
  // place; otherwise what it says (an opening a player only just fits) is a warning
  const walkFaults = walk.unreached.length + walk.stuck.length + walk.oneWay.length;
  (walkFaults ? report.faults : warnings).push(...walk.warnings.map((line) => `walk: ${line}`));
  for (const room of rooms.values()) {
    const c = mid(room);
    if (!walk.on(c[0], c[1], room.max[2]).walked && !(room.spec.walk === false))
      warnings.push(`the middle of ${room.id} is not walked to (furniture there, or the room is shut off)`);
  }
  report.facts.push(...walk.facts.slice(0, 4));
  const save = (key, picture) => {
    const file = join(out, `${name}-${key}.png`);
    writeFileSync(file, png(picture.width, picture.height, picture.rgba));
    files[key] = file;
  };
  save("plan-source", planOfSource(map, { reach: walk, heights: true, legend: true }));

  // ── compiled, when the compilers are there; then walked again, lit and drawn ──
  const found = typeof compilers === "string" ? findCompilers({ folder: compilers }) : (compilers ?? findCompilers());
  if (!found.found) {
    report.facts.push(`not compiled: ${found.message}`);
    report.faults.push("not compiled: the compilers were not found, so the leak test of the compiler and the light could not run");
  } else {
    const result = compileMap(mapFile, { wads: [wadFile], compilers: found, out: join(out, `${name}.bsp`) });
    if (!result.bsp) report.faults.push(...result.errors);
    else {
      files.bsp = result.bsp;
      const bsp = readBsp(readFileSync(result.bsp));
      const roomsBoxes = Object.fromEntries([...rooms.values()].map((room) => [room.id, { min: room.min, max: room.max }]));
      const lit = lightReport(bsp, { rooms: roomsBoxes });
      for (const room of lit.rooms) {
        report.rooms[room.name].light = Math.round(room.mean);
        if (room.dark) report.faults.push(`${room.name} is dark: its floor's light is ${Math.round(room.mean)} of 255 (under ${24})`);
      }
      const walked = reachOf(bsp);
      if (walked.unreached.length + walked.stuck.length) report.faults.push(...walked.warnings.map((line) => `walk of the compiled map: ${line}`));
      const drawing = { folders: [out, dirname(out)], models: true };
      save("plan", planOf(bsp, drawing));
      // a view of every room, from a corner by its walls looking across it to the far corner
      const views = [...rooms.values()].map((room) => {
        // high in the corner, under the ceiling, looking down across the room: over what stands on its floor
        const high = room.max[2] - room.min[2];
        const from = [room.min[0] + 16, room.min[1] + 16, room.min[2] + Math.max(64, Math.min(high - 16, 160))];
        const across = Math.hypot(room.max[0] - from[0], room.max[1] - from[1]);
        const yaw = Math.round((Math.atan2(room.max[1] - from[1], room.max[0] - from[0]) * 180) / Math.PI);
        const pitch = -Math.round((Math.atan2(from[2] - room.min[2], across * 0.55) * 180) / Math.PI);
        return drawMap(bsp, { ...drawing, from, yaw, pitch, width: 320, height: 240 });
      });
      save("views", tile(views, Math.min(4, views.length), [...rooms.keys()]));
      // a side section through each staircase: the steps, the floors and the headroom, which no plan shows
      if (cuts.length)
        save("sections", stacked(cuts.map((cut) => sectionOf(bsp, { from: cut.from, to: cut.to, width: 640 })), cuts.map((cut) => cut.name)));
      report.facts.push(`compiled: ${result.bsp}; the floors' light by room: ${lit.rooms.map((r) => `${r.name} ${Math.round(r.mean)}`).join(", ")}`);
    }
  }
  report.ok = !errors.length && !report.faults.length;
  return { report, files, map };
}

export { sectionOf };
