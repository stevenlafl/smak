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
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { join, resolve, dirname, basename } from "node:path";
import { carve, box, cylinder, wedge, stairs as stairBrushes, light, sunLight, textureLights, playerStart, pointEntity, brushEntity, writeMap, readMap, subtract, moved, shapeOf } from "../maps/source.mjs";
import { checkPlan } from "../maps/plan.mjs";
import { definitionsOf } from "../maps/fgd.mjs";
import { reachOf } from "../maps/reach.mjs";
import { writeWad } from "../maps/wad.mjs";
import { compileMap, findCompilers } from "../maps/compile.mjs";
import { readBsp } from "../maps/bsp.mjs";
import { lightReport } from "../maps/light.mjs";
import { planOfSource, planOf, drawMap, sectionOf } from "../maps/draw.mjs";
import { tile, label, render } from "../render.mjs";
import { png } from "../image.mjs";
import { materialOf, surfacePicture, MATERIALS } from "./paint.mjs";
import { wadCatalog, pickTexture } from "./wads.mjs";
import { buildModelSpec, validateModelSpec } from "./model.mjs";

export const MAP_SPEC = "smak.map/1";
const TOP = ["spec", "name", "wall", "grid", "theme", "textures", "rooms", "links", "entities", "props", "furniture", "prefabs", "models", "layout", "sky", "sun", "night", "include", "fgd", "wads", "compile", "detail", "note"];
const ROOM = ["id", "size", "at", "place", "floor", "sky", "surfaces", "light", "water", "test", "note"];
const LINK = ["between", "kind", "width", "height", "along", "sill", "stairs", "door", "glass", "note"];
const PLACES = ["east_of", "west_of", "north_of", "south_of", "above", "below", "in"];
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
const LAMP_HIGHEST = 192;
/** How far from a wall an entity is put by "against" and "corner". */
const INSET = 48;
/** Furniture or a prop that reaches further than this past its room's walls is said to stand in them. */
const INTO_WALL = 1;
/** The rise and the depth of a stair's step that a link of stairs is built with. */
const RISE = 16;
const TREAD = 24;
const FACINGS = { east: 0, north: 90, west: 180, south: 270 };

const isNumber = (v) => typeof v === "number" && Number.isFinite(v);
const snap = (v, grid) => Math.round(v / grid) * grid;
const mid = (room) => room.min.map((v, k) => (v + room.max[k]) / 2);

/**
 * What a spec's `compile` asks of the compilers: { quality: "draft" | "normal" | "final", threads, light: {
 * bounce, ao, extra, softShadows }, hulls: { large: false, crouch: false }, clipEconomy: true }.
 */
function compileOptions(asked = {}) {
  const rad = [];
  const light = asked.light ?? {};
  if (asked.quality === "final" || light.extra) rad.push("-extra");
  if (light.bounce !== undefined) rad.push("-bounce", light.bounce);
  if (light.ao) rad.push("-ao");
  if (light.softShadows) rad.push("-pcf", light.softShadows);
  const bsp = [];
  if (asked.hulls?.large === false) bsp.push("-nohull2");
  if (asked.hulls?.crouch === false) bsp.push("-nohull3");
  return {
    fast: asked.quality === "draft",
    ...(asked.threads !== undefined ? { threads: asked.threads } : {}),
    args: { hlrad: rad, hlbsp: bsp, hlcsg: asked.clipEconomy ? ["-clipeconomy"] : [] },
  };
}

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

/**
 * The texture names a spec's materials take: SM_ and the word, 15 letters at most, as a .wad holds them; a
 * liquid's begins with ! (the compilers make what wears it water), the sky's is `sky`.
 */
const textureName = (key, liquid = false) =>
  key === "sky" ? "sky" : `${liquid ? "!" : ""}SM_${key}`.toUpperCase().replace(/[^!A-Z0-9_]/g, "").slice(0, 15);
/** A texture light's brightness for a material that glows, unless it says (`glow`). */
const GLOW = 600;
/** A map whose darkest room's floor is lit under this gets its views drawn again three times as bright. */
const BRIGHT_UNDER = 80;

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
  // a mark drawn inside a room's area (a table, the bar) is a cell of that room with something on it
  for (const mark of marks) {
    const room = Object.values(rooms).find((box) => mark.x > box.x0 && mark.x < box.x1 && mark.y > box.y0 && mark.y < box.y1);
    if (room) room.cells++;
  }
  return { rooms, marks, cell };
}

/**
 * A map spec with the modules it includes taken in: each module is a map spec of its own (a shop, a
 * sewer), built and checked alone, and put in the larger map as Hammer's prefabs are, a group: its rooms,
 * links, furniture, props and entities come in with their ids (and its prefabs' and models' names)
 * prefixed by the include's `as` and an underscore, its first room placed by the include's `place` or
 * `at`, the rest where the module places them against it. Its places to start are left out: the larger
 * map has its own. Its theme's floor and ceiling are given to its rooms as their own surfaces where the
 * larger map's differ; its walls wear the larger map's. A module may include modules of its own.
 * `include: [{ spec: "noodle_bar.json", as: "noodle", place: { north_of: "street", align: 64 } }]`. The
 * larger map's links name a module's rooms by their prefixed ids (`noodle_shop`).
 */
export function withIncludes(spec, folder = ".") {
  if (!spec?.include?.length) return spec;
  const out = { ...spec, rooms: [...(spec.rooms ?? [])], links: [...(spec.links ?? [])], entities: [...(spec.entities ?? [])] };
  for (const key of ["furniture", "props"]) out[key] = [...(spec[key] ?? [])];
  for (const key of ["prefabs", "models", "textures"]) out[key] = { ...(spec[key] ?? {}) };
  const hostTheme = { floor: "stone", wall: "plaster", ceiling: "planks", door: "metal", furniture: "darkwood", ...(spec.theme ?? {}) };
  for (const [n, given] of spec.include.entries()) {
    const file = resolve(folder, given.spec);
    const inner = withIncludes(JSON.parse(readFileSync(file, "utf8")), dirname(file));
    const as = given.as ?? `m${n}`;
    const id = (name) => `${as}_${name}`;
    const here = dirname(file);
    if (inner.layout) throw new Error(`include[${n}]: ${given.spec} is drawn with a layout; a module is placed by words (place, at)`);
    const innerTheme = { ...hostTheme, ...(inner.theme ?? {}) };
    // the module's own words for materials, kept under its own names
    for (const [word, material] of Object.entries(inner.textures ?? {})) out.textures[id(word)] = material;
    for (const face of ["floor", "ceiling", "wall", "door", "furniture"]) out.textures[id(face)] = innerTheme[face];
    const word = (w) => (inner.textures?.[w] !== undefined || ["floor", "ceiling", "wall", "door", "furniture"].includes(w) ? id(w) : w);
    // the rooms a module has only to be tried alone (a stretch of street before a shop) stay out
    const tried = new Set(inner.rooms.filter((room) => room.test).map((room) => room.id));
    inner.rooms = inner.rooms.filter((room) => !room.test);
    inner.links = (inner.links ?? []).filter((link) => !link.between.some((r) => tried.has(r)));
    for (const key of ["entities", "furniture", "props"]) inner[key] = (inner[key] ?? []).filter((thing) => !tried.has(thing.room));
    inner.rooms.forEach((room, k) => {
      const surfaces = { ...(room.surfaces ?? {}) };
      for (const face of ["floor", "ceiling"]) {
        if (surfaces[face]) surfaces[face] = word(surfaces[face]);
        else if (JSON.stringify(innerTheme[face]) !== JSON.stringify(hostTheme[face])) surfaces[face] = id(face);
      }
      if (surfaces.walls) surfaces.walls = word(surfaces.walls);
      else if (JSON.stringify(innerTheme.wall) !== JSON.stringify(hostTheme.wall)) surfaces.walls = id("wall");
      const placed = { ...room, id: id(room.id), surfaces };
      if (room.water?.material) placed.water = { ...room.water, material: word(room.water.material) };
      if (k === 0) {
        delete placed.place;
        delete placed.at;
        if (given.place) placed.place = given.place;
        if (given.at) placed.at = given.at;
      } else if (room.place) {
        const way = PLACES.find((w) => room.place[w] !== undefined);
        placed.place = { ...room.place, [way]: id(room.place[way]) };
      }
      out.rooms.push(placed);
    });
    for (const link of inner.links ?? []) out.links.push({ ...link, between: link.between.map(id) });
    // a thing's `facing` and `at: "near <room>"` may name a room of the module
    const ids = new Set(inner.rooms.map((room) => room.id));
    const named = (thing) => ({
      ...thing,
      room: id(thing.room),
      ...(thing.id && !thing.class ? { id: id(thing.id) } : {}),
      ...(thing.at && typeof thing.at === "object" && thing.at.beside ? { at: { ...thing.at, beside: id(thing.at.beside) } } : {}),
      ...(typeof thing.facing === "string" && ids.has(thing.facing) ? { facing: id(thing.facing) } : {}),
      ...(typeof thing.at === "string" && /^near /.test(thing.at) && ids.has(thing.at.slice(5)) ? { at: `near ${id(thing.at.slice(5))}` } : {}),
    });
    for (const thing of inner.entities ?? [])
      if (!/^info_player_/.test(thing.class)) out.entities.push({ ...named(thing), ...(thing.id ? { id: id(thing.id) } : {}) });
    for (const [name, prefab] of Object.entries(inner.prefabs ?? {}))
      out.prefabs[id(name)] = prefab.file
        ? { ...prefab, file: resolve(here, prefab.file) }
        : { ...prefab, pieces: prefab.pieces.map((piece) => ({ ...piece, texture: word(piece.texture ?? "furniture") })) };
    for (const [name, model] of Object.entries(inner.models ?? {}))
      out.models[id(name)] = model.file ? { ...model, file: resolve(here, model.file) } : model;
    for (const thing of inner.furniture ?? [])
      out.furniture.push({ ...named(thing), ...(thing.prefab ? { prefab: id(thing.prefab) } : { texture: word(thing.texture ?? "furniture") }) });
    for (const thing of inner.props ?? [])
      out.props.push({ ...named(thing), model: inner.models?.[thing.model] ? id(thing.model) : thing.model });
  }
  delete out.include;
  return out;
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
    // a room inside another is part of its space (a channel sunk in a floor): it need not hold a player itself
    else if (!room.place?.in && (size[0] < PLAYER.wide || size[1] < PLAYER.wide || size[2] < PLAYER.high))
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
      // inside another room, `offset` [x, y] from its least corner: the two are one space (a channel sunk in
      // a tunnel's floor, a raised dais)
      if (way === "in") min = [other.min[0] + (room.place.offset?.[0] ?? 0), other.min[1] + (room.place.offset?.[1] ?? 0), floor];
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
export function buildMapSpec(given, { out, compilers, folder, fgd = [], wads = [] } = {}) {
  let spec;
  try {
    spec = withIncludes(given, folder ?? ".");
  } catch (error) {
    return { report: { ok: false, errors: [error.message], faults: [], warnings: [], facts: [], rooms: {} }, files: {}, map: null };
  }
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
  const liquids = new Set();
  // a game's own textures: named (`{ texture: "C1A0_LABW4" }`) or picked by words and a colour
  // (`{ pick: { words: ["brick"], tone: [r, g, b], else: <a material> } }`) from the .wad files given; a pick
  // that finds nothing is a gap, made from its `else` into the map's own .wad and told
  // a .wad the spec names is looked for as a path from the spec's folder, then by its name in the folders the
  // build was given (a game's valve or mod folder): a spec names "halflife.wad", never a machine's path
  const wadFiles = [...[spec.wads ?? []].flat()].map((given) => {
    const near = resolve(folder ?? ".", given);
    if (existsSync(near)) return near;
    for (const place of [wads].flat()) if (existsSync(join(place, basename(given)))) return join(place, basename(given));
    throw new Error(`wads: ${given} is neither beside the spec nor in the game folders given (${[wads].flat().join(", ") || "none: --wads <folder>"})`);
  });
  const catalog = wadFiles.length ? wadCatalog(wadFiles) : [];
  const gameTextures = new Map();
  const picked = new Map();
  const fromWads = (word, material) => {
    if (picked.has(word)) return picked.get(word);
    let name = null;
    if (material.texture) {
      const found = catalog.find((texture) => texture.name.toLowerCase() === String(material.texture).toLowerCase());
      if (!found) throw new Error(`texture ${word}: ${material.texture} is in none of the .wad files given (${wadFiles.map((file) => basename(file)).join(", ") || "none"})`);
      gameTextures.set(found.name, found.file);
      name = found.name;
      report.facts.push(`${word}: ${found.name} of ${found.wad}, as named`);
    } else {
      const choice = pickTexture(catalog, material.pick);
      if (choice.pick) {
        gameTextures.set(choice.pick.name, choice.pick.file);
        name = choice.pick.name;
        report.facts.push(`${word}: picked ${choice.pick.name} of ${choice.pick.wad} (colour off ${choice.off.toFixed(2)}${choice.others.length ? `; next: ${choice.others.join(", ")}` : ""})`);
      } else {
        const instead = material.pick.else ?? { base: "plaster", tone: material.pick.tone };
        report.facts.push(`${word}: a GAP in the .wad files given (${choice.gap}${choice.others.length ? `; nearest: ${choice.others.join(", ")}` : ""}): made into the map's own .wad`);
        picked.set(word, null);
        return null;
      }
    }
    picked.set(word, name);
    return name;
  };
  const textureOf = (word, { liquid = false } = {}) => {
    if (word === "sky") return used.set("sky", { base: "glass", tone: spec.night ? [0.05, 0.06, 0.1] : [0.45, 0.6, 0.85] }) && "sky";
    let material = materials[word] ?? word;
    if (material && typeof material === "object" && (material.texture || material.pick)) {
      const name = fromWads(word, material);
      if (name) return name;
      material = material.pick.else ?? { base: "plaster", tone: material.pick.tone };
    }
    materialOf(material, `texture ${word}`);
    const key = materials[word] !== undefined ? word : `${typeof material === "string" ? material : material.base}`;
    used.set(key, material);
    if (liquid) liquids.add(key);
    return textureName(key, liquid);
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
    if (kind === "window" && link.glass) {
      // a pane: a breakable brush 2 thick in the middle of the wall, half see-through, that shatters as glass
      const glass = typeof link.glass === "object" ? link.glass : {};
      const pane = { min: [...hole.min], max: [...hole.max] };
      const middle = (from.max[axis] + to.min[axis]) / 2;
      pane.min[axis] = middle - 1;
      pane.max[axis] = middle + 1;
      entities.push(
        brushEntity("func_breakable", [box(pane.min, pane.max, textureOf(glass.material ?? "glass"))], {
          rendermode: 2,
          renderamt: glass.alpha ?? 90,
          material: 0,
          health: glass.health ?? 20,
          ...(glass.keys ?? {}),
        }),
      );
    }
    if (kind === "door") {
      const leaf = { min: [...hole.min], max: [...hole.max] };
      const middle = (from.max[axis] + to.min[axis]) / 2;
      leaf.min[axis] = middle - 4;
      leaf.max[axis] = middle + 4;
      entities.push(brushEntity("func_door", [box(leaf.min, leaf.max, textureOf("door"))], { angle: -1, speed: 120, wait: 4, lip: 8, ...(link.door ?? {}) }));
    }
  });

  // ── rooms: carved in one block, lined where they wear another texture ──
  // A floor, a ceiling or walls of its own are a lining: the room is carved LINING further that way, and a
  // slab of the other texture fills what was carved, so its face is where the room's was. A way through it
  // (a stair's shaft, a doorway) is cut out of the slab.
  const boxes = [];
  const linings = [];
  for (const room of rooms.values()) {
    const carved = { min: [...room.min], max: [...room.max] };
    const surfaces = { ...(room.spec.surfaces ?? {}) };
    if (room.spec.sky) surfaces.ceiling = "sky";
    for (const [face, word] of Object.entries(surfaces)) {
      if (!["floor", "ceiling", "walls"].includes(face)) {
        warnings.push(`rooms ${room.id}.surfaces.${face}: a room's surfaces are floor, ceiling and walls`);
        continue;
      }
      let pieces;
      if (face === "walls") {
        // four slabs round the room, each LINING thick, the room carved out to their backs: its walls wear the
        // texture whatever the rock round it wears (a module's own walls, kept in a larger map)
        for (const k of [0, 1]) {
          carved.min[k] -= LINING;
          carved.max[k] += LINING;
        }
        const [x0, y0, z0] = room.min;
        const [x1, y1, z1] = room.max;
        pieces = [
          { min: [x0 - LINING, y0 - LINING, z0], max: [x0, y1 + LINING, z1] },
          { min: [x1, y0 - LINING, z0], max: [x1 + LINING, y1 + LINING, z1] },
          { min: [x0, y0 - LINING, z0], max: [x1, y0, z1] },
          { min: [x0, y1, z0], max: [x1, y1 + LINING, z1] },
        ];
      } else {
        const z = face === "floor" ? [room.min[2] - LINING, room.min[2]] : [room.max[2], room.max[2] + LINING];
        if (face === "floor") carved.min[2] -= LINING;
        else carved.max[2] += LINING;
        pieces = [{ min: [room.min[0], room.min[1], z[0]], max: [room.max[0], room.max[1], z[1]] }];
      }
      for (const hole of holes) pieces = pieces.flatMap((piece) => subtract(piece, hole));
      const texture = textureOf(word);
      linings.push(...pieces.map((piece) => box(piece.min, piece.max, texture)));
    }
    boxes.push(carved);
    // water: a liquid brush over the room's floor, `depth` deep (it seals nothing, and is swum in)
    if (room.spec.water) {
      const water = typeof room.spec.water === "number" ? { depth: room.spec.water } : room.spec.water;
      const texture = textureOf(water.material ?? "water", { liquid: true });
      brushes.push(box(room.min, [room.max[0], room.max[1], room.min[2] + water.depth], texture));
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
  // where each thing with an `id` stands, in plan: { min: [x, y], max: [x, y] }; what `beside` goes by
  const footprints = new Map();
  const counted = {};
  report.placed = [];
  /** a thing put `beside` another: against the named side of its footprint, `gap` from it, lined up with its middle */
  const besideOf = (at, own) => {
    const other = footprints.get(at.beside);
    if (!other) throw new Error(`beside "${at.beside}": no furniture, prop or entity of that id put before this one (${[...footprints.keys()].join(", ") || "none has an id"})`);
    const side = at.side ?? "east";
    const gap = at.gap ?? 4;
    const middle = [(other.min[0] + other.max[0]) / 2, (other.min[1] + other.max[1]) / 2];
    const ownMiddle = [(own.min[0] + own.max[0]) / 2, (own.min[1] + own.max[1]) / 2];
    if (side === "east") return [other.max[0] + gap - own.min[0], middle[1] - ownMiddle[1]];
    if (side === "west") return [other.min[0] - gap - own.max[0], middle[1] - ownMiddle[1]];
    if (side === "north") return [middle[0] - ownMiddle[0], other.max[1] + gap - own.min[1]];
    if (side === "south") return [middle[0] - ownMiddle[0], other.min[1] - gap - own.max[1]];
    throw new Error(`beside: side is east, west, north or south, not ${side}`);
  };
  /** the corners of a footprint turned by `degrees` about its origin, and the box round them */
  const turnedPrint = ({ min, max }, degrees) => {
    const [c, s] = [Math.cos((degrees * Math.PI) / 180), Math.sin((degrees * Math.PI) / 180)];
    const corners = [[min[0], min[1]], [max[0], min[1]], [min[0], max[1]], [max[0], max[1]]].map(([x, y]) => [x * c - y * s, x * s + y * c]);
    return { min: [0, 1].map((k) => Math.min(...corners.map((p) => p[k]))), max: [0, 1].map((k) => Math.max(...corners.map((p) => p[k]))) };
  };
  const place = (list, what, each, printOf = () => ({ min: [-16, -16], max: [16, 16] })) =>
    (list ?? []).forEach((thing, i) => {
      try {
        const room = rooms.get(thing.room);
        const own = printOf(thing);
        const xy = thing.at && typeof thing.at === "object" && !Array.isArray(thing.at) ? besideOf(thing.at, own) : pointIn(room, thing.at);
        if (thing.id) footprints.set(thing.id, { min: [xy[0] + own.min[0], xy[1] + own.min[1]], max: [xy[0] + own.max[0], xy[1] + own.max[1]] });
        // furniture and props must stay in their room: one that reaches into a wall stands half in the rock
        if (what !== "entities") {
          const reach = [
            ["west", room.min[0] - (xy[0] + own.min[0])],
            ["east", xy[0] + own.max[0] - room.max[0]],
            ["south", room.min[1] - (xy[1] + own.min[1])],
            ["north", xy[1] + own.max[1] - room.max[1]],
          ].filter(([, by]) => by > INTO_WALL);
          for (const [side, by] of reach) report.faults.push(`${what}[${i}] (${thing.prefab ?? thing.model ?? "box"}) reaches ${Math.round(by)} into ${room.id}'s ${side} wall: move or turn it`);
        }
        // what was put where, under a name that stays the same from build to build: its kind and what it is,
        // with its count among those (the second table of the room)
        const name = thing.prefab ?? thing.model ?? thing.class ?? (thing.box ? `box ${thing.box.join("x")}` : what);
        // (not its id: giving a thing an id, to put another beside it, is no change to the thing)
        const key = `${what} ${name} #${(counted[`${what} ${name}`] = (counted[`${what} ${name}`] ?? 0) + 1)}`;
        report.placed.push({ key, id: thing.id, what, name, room: room.id, at: [Math.round(xy[0]), Math.round(xy[1]), Math.round(room.min[2] + (thing.z ?? 0))], turn: thing.rotate ?? thing.facing ?? 0 });
        each(thing, room, [xy[0], xy[1], room.min[2] + (thing.z ?? 0)], i);
      } catch (error) {
        errors.push(`${what}[${i}]: ${error.message}`);
      }
    });

  // furniture: brush prefabs, or plain boxes
  const prefabs = spec.prefabs ?? {};
  // a texture a prefab's .map names, as the word of the spec it was made from: SM_FURNITURE is "furniture"
  const wordOfTexture = new Map([...Object.keys(materials), ...Object.keys(MATERIALS)].map((word) => [textureName(word), word]));
  // a prefab's brushes go into the world, or into a brush entity when it says so (a crate that breaks, a
  // pane of glass, detail that should not cut the world: func_breakable, func_wall, func_illusionary...)
  // furniture is func_detail unless told (`as: "world"`, or an entity of its own): it then cuts no portal, and
  // a map of furnished rooms is seen through in hundredths of a second where it took minutes (measured:
  // research/compiler-features.md). It seals nothing, which furniture inside a carved room never has to
  const detailed = (thing, prefab) => {
    const asked = thing?.as ?? prefab.as ?? (spec.detail === false ? "world" : "detail");
    return asked === "detail" ? { class: "func_detail" } : null;
  };
  const putPrefab = (prefab, at, quarters, where, entity = prefab.entity ?? detailed(null, prefab)) => {
    const target = entity ? [] : brushes;
    const done = () => {
      if (!entity) return;
      const { class: classname, ...keys } = typeof entity === "string" ? { class: entity } : entity;
      entities.push(brushEntity(classname, target, keys));
    };
    if (!prefab.file) {
      target.push(...placedPrefab(prefab, at, quarters, textureOf));
      return done();
    }
    const placed = prefabFromMap(resolve(folder ?? ".", prefab.file), at, quarters);
    for (const name of placed.textures) {
      const word = wordOfTexture.get(name.toUpperCase());
      if (!word) throw new Error(`${where}: its .map wears ${name}, which is no material of the spec (its textures are SM_ and a word of theme, textures or a base)`);
      textureOf(word);
    }
    target.push(...placed.brushes);
    entities.push(...placed.entities);
    done();
  };
  const prefabOf = (thing) =>
    thing.prefab ? prefabs[thing.prefab] : { pieces: [{ box: [[-thing.box[0] / 2, -thing.box[1] / 2, 0], [thing.box[0] / 2, thing.box[1] / 2, thing.box[2]]], texture: thing.texture ?? "furniture" }] };
  /** a prefab's footprint in its own space: the box round its pieces, or round its .map's brushes */
  const prefabPrint = (prefab) => {
    const points = prefab.file
      ? // a brush's corners, worked out from its planes (the three points a plane is written by lie anywhere on it)
        readMap(readFileSync(resolve(folder ?? ".", prefab.file), "utf8")).brushes.flatMap((b) => shapeOf(b).corners)
      : prefab.pieces.flatMap((piece) =>
          piece.box ?? piece.wedge ?? (piece.cylinder ? [[piece.cylinder.centre[0] - piece.cylinder.radius, piece.cylinder.centre[1] - piece.cylinder.radius], [piece.cylinder.centre[0] + piece.cylinder.radius, piece.cylinder.centre[1] + piece.cylinder.radius]] : []),
        );
    return { min: [0, 1].map((k) => Math.min(...points.map((p) => p[k]))), max: [0, 1].map((k) => Math.max(...points.map((p) => p[k]))) };
  };
  place(
    spec.furniture,
    "furniture",
    (thing, room, at, i) => {
      const prefab = prefabOf(thing);
      putPrefab(prefab, at, Math.round((thing.rotate ?? 0) / 90), `furniture[${i}]`, thing.entity ?? prefab.entity ?? detailed(thing, prefab));
    },
    (thing) => turnedPrint(prefabPrint(prefabOf(thing)), 90 * Math.round((thing.rotate ?? 0) / 90)),
  );
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
  const modelHeights = {};
  /** each model's footprint in its own space, for `beside` */
  const modelPrints = {};
  const gallery = [];
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
    modelHeights[modelName] = Number(/([\d.]+) high \(z\)/.exec(built.report.facts[0])?.[1] ?? 32);
    const parts = Object.values(built.report.parts);
    modelPrints[modelName] = { min: [0, 1].map((k) => Math.min(...parts.map((part) => part.from[k]))), max: [0, 1].map((k) => Math.max(...parts.map((part) => part.to[k]))) };
    report.facts.push(`models.${modelName}: built and sound (${built.report.facts[0]})`);
    gallery.push({ name: modelName, mdl: built.mdl });
  }
  // every model the map builds, each from its front three-quarter, named: a map's views show them too small
  // to judge
  if (gallery.length) {
    const views = gallery.map(({ mdl }) => render(mdl, { seq: 0, yaw: 35, pitch: 20, width: 192, height: 192 }));
    const sheet = tile(views, Math.min(6, views.length), gallery.map(({ name }) => name));
    files.models = join(out, `${spec.name}-models.png`);
    writeFileSync(files.models, png(sheet.width, sheet.height, sheet.rgba));
  }
  const propsAt = [];
  place(
    spec.props,
    "props",
    (thing, room, at) => {
      propsAt.push({ room: room.id, at, half: modelHeights[thing.model] ? modelHeights[thing.model] / 2 : 16 });
      const model = modelFiles[thing.model] ?? thing.model;
      entities.push(pointEntity(thing.class ?? "cycler_sprite", at, { model, angles: [0, yawOf(room, thing.facing, at), 0], ...(thing.keys ?? {}) }));
    },
    // a prop's footprint: its model's, turned as it faces (a facing that names a room counts as unturned)
    (thing) => turnedPrint(modelPrints[thing.model] ?? { min: [-16, -16], max: [16, 16] }, isNumber(thing.facing) ? thing.facing : FACINGS[thing.facing] ?? 0),
  );
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
      // hung under the ceiling, but no higher than LAMP_HIGHEST over the floor: in a tall room it lights the floor
      const lampZ = Math.min(room.max[2] - LAMP_UNDER, room.min[2] + LAMP_HIGHEST);
      entities.push(light([Math.round(cx), Math.round(cy), lampZ], { brightness: options.brightness ?? LAMP_BRIGHTNESS, color: options.color ?? [255, 240, 220] }));
    }
  }
  if (sunny) {
    const sky = [...rooms.values()].find((room) => room.spec.sky);
    // at night the moon, and the sky's own light (`_diffuse_light`, which the compiler takes from the sun's
    // unless told) far dimmer than it: an open street under a night sky otherwise glows
    const sun = spec.night
      ? { pitch: -70, yaw: 30, brightness: 60, color: [140, 160, 255], _diffuse_light: [60, 70, 120, 6] }
      : { pitch: -60, yaw: 30, brightness: 280, color: [255, 245, 225] };
    entities.push(sunLight([...mid(sky).slice(0, 2), sky.max[2] - 32], { ...sun, ...(spec.sun ?? {}) }));
  }

  // materials that glow: a texture light each, so that the faces wearing them shine (neon, a lit window)
  const glowing = Object.fromEntries(
    [...used.entries()]
      .map(([key, given]) => [key, materialOf(given)])
      .filter(([, material]) => material.flags.includes("fullbright"))
      .map(([key, material]) => [textureName(key), [...material.tone.map((v) => Math.round(v * 255)), material.glow ?? GLOW]]),
  );
  if (Object.keys(glowing).length) {
    const first = [...rooms.values()][0];
    entities.push(textureLights([...mid(first).slice(0, 2), first.min[2] + 32], glowing));
    report.facts.push(`texture lights: ${Object.keys(glowing).join(", ")}`);
  }
  if (errors.length) return { report, files, map: null };
  // ── the files: the .wad of its pictures, and the .map ──
  mkdirSync(out, { recursive: true });
  const wadFile = join(out, `${name}.wad`);
  writeFileSync(wadFile, writeWad([...used.entries()].map(([key, material]) => ({ name: textureName(key, liquids.has(key)), image: surfacePicture(material, key === "sky" ? 64 : 128) }))));
  files.wad = wadFile;
  const gameWads = [...new Set(gameTextures.values())];
  const map = { worldspawn: { wad: [wadFile, ...gameWads], message: spec.note ?? name, skyname: spec.sky ?? "desert" }, brushes, entities };
  const mapFile = join(out, `${name}.map`);
  writeFileSync(mapFile, writeMap(map));
  files.map = mapFile;
  report.facts.push(`${rooms.size} rooms, ${holes.length} ways through, ${brushes.length} brushes, ${entities.length} entities`);
  for (const room of rooms.values()) report.rooms[room.id] = { min: room.min, max: room.max };

  // ── checked before any compile: the plan, and the walk ──
  const textures = [...[...used.keys()].map((key) => textureName(key, liquids.has(key))), ...gameTextures.keys()];
  // the entities held against the game's entity definitions (its FGD, and the compilers' own), when given
  const fgds = [...[fgd].flat(), ...[spec.fgd ?? []].flat().map((file) => resolve(folder ?? ".", file))];
  const definitions = fgds.length ? definitionsOf(...fgds) : undefined;
  const plan = checkPlan(map, { textures, definitions });
  if (definitions) report.facts.push(`entities checked against ${definitions.from.join(", ")} (${Object.keys(definitions.classes).length} classes)`);
  else warnings.push("no FGD given: the entities' classes and keys were not checked against the game's definitions");
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
    const result = compileMap(mapFile, { wads: [wadFile, ...gameWads], compilers: found, out: join(out, `${name}.bsp`), ...compileOptions(spec.compile) });
    const limits = Object.entries(result.limits ?? {}).filter(([n]) => ["allocblock", "worldleaves", "worldfaces", "clipnodes", "models", "planes"].includes(n));
    if (limits.length) report.facts.push(`the engine's limits: ${limits.map(([n, l]) => `${n} ${l.used} of ${l.most}`).join(", ")}`);
    warnings.push(...result.warnings.filter((w) => /near the engine's limit/.test(w)));
    if (!result.bsp) report.faults.push(...result.errors);
    else {
      files.bsp = result.bsp;
      const bsp = readBsp(readFileSync(result.bsp));
      const roomsBoxes = Object.fromEntries([...rooms.values()].map((room) => [room.id, { min: room.min, max: room.max }]));
      const lit = lightReport(bsp, { rooms: roomsBoxes });
      for (const room of lit.rooms) {
        // lightReport also tells of the floor in no room given ("elsewhere"): a stair's top, a ledge
        if (!report.rooms[room.name]) continue;
        report.rooms[room.name].light = Math.round(room.mean);
        const part = rooms.get(room.name)?.spec.place?.in;
        if (room.dark && part) report.facts.push(`${room.name} (part of ${part}) has its floor lit ${Math.round(room.mean)}: not held to the dark line, being the floor of another room's part (under water, as a rule)`);
        else if (room.dark) report.faults.push(`${room.name} is dark: its floor's light is ${Math.round(room.mean)} of 255 (under ${24})`);
      }
      const walked = reachOf(bsp);
      if (walked.unreached.length + walked.stuck.length) report.faults.push(...walked.warnings.map((line) => `walk of the compiled map: ${line}`));
      // a night map's sky drawn dark: without the game's own sky pictures the views fill it with a day's blue
      const drawing = { folders: [out, dirname(out), ...gameWads.map((file) => dirname(file))], models: true, ...(spec.night ? { sky: [10, 12, 22] } : {}) };
      save("plan", planOf(bsp, drawing));
      // a view of every room, from a corner by its walls looking across it to the far corner
      const viewSpots = [];
      const views = [...rooms.values()].map((room) => {
        // high in the corner, under the ceiling, looking down across the room: over what stands on its floor
        const high = room.max[2] - room.min[2];
        const from = [room.min[0] + 16, room.min[1] + 16, room.min[2] + Math.max(64, Math.min(high - 16, 160))];
        const across = Math.hypot(room.max[0] - from[0], room.max[1] - from[1]);
        const yaw = Math.round((Math.atan2(room.max[1] - from[1], room.max[0] - from[0]) * 180) / Math.PI);
        const pitch = -Math.round((Math.atan2(from[2] - room.min[2], across * 0.55) * 180) / Math.PI);
        viewSpots.push({ from, yaw, pitch });
        return drawMap(bsp, { ...drawing, from, yaw, pitch, width: 320, height: 240 });
      });
      save("views", tile(views, Math.min(4, views.length), [...rooms.keys()]));
      // a dark map's views again, three times as bright: to see what is in a room meant to be dark
      const darkest = Math.min(...lit.rooms.filter((room) => report.rooms[room.name]).map((room) => room.mean));
      if (darkest < BRIGHT_UNDER) {
        const bright = [...rooms.values()].map((room, n) => drawMap(bsp, { ...drawing, ...viewSpots[n], brightness: 3, width: 320, height: 240 }));
        save("views-bright", tile(bright, Math.min(4, bright.length), [...rooms.keys()].map((id) => `${id} x3`)));
      }
      // a room with props: a larger view at a man's height, from across the room towards them
      const propRooms = [...rooms.values()].filter((room) => propsAt.some((prop) => prop.room === room.id));
      if (propRooms.length) {
        const looks = propRooms.map((room) => {
          const mine = propsAt.filter((prop) => prop.room === room.id);
          const centre = [0, 1].map((k) => mine.reduce((sum, prop) => sum + prop.at[k], 0) / mine.length);
          const c = mid(room);
          // stand on the far side of the room's middle from them, a little way in from the wall
          const away = [c[0] - centre[0], c[1] - centre[1]];
          const length = Math.hypot(...away) || 1;
          const reach = Math.min(room.max[0] - room.min[0], room.max[1] - room.min[1]) * 0.42;
          const from = [c[0] + (away[0] / length) * reach, c[1] + (away[1] / length) * reach, room.min[2] + 72];
          const yaw = Math.round((Math.atan2(centre[1] - from[1], centre[0] - from[0]) * 180) / Math.PI);
          // tilted towards their middle's height: lanterns under a ceiling as well as barrels on a floor
          const high = mine.reduce((sum, prop) => sum + prop.at[2] + prop.half, 0) / mine.length;
          const pitch = Math.round((Math.atan2(high - from[2], Math.hypot(centre[0] - from[0], centre[1] - from[1])) * 180) / Math.PI);
          return drawMap(bsp, { ...drawing, from, yaw, pitch: Math.max(-30, Math.min(30, pitch)), width: 640, height: 360 });
        });
        save("props", stacked(looks, propRooms.map((room) => `${room.id}: its props`)));
      }
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
