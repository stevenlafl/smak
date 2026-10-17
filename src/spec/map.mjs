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
import { writeFileSync, mkdirSync, readFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, resolve, dirname, basename } from "node:path";
import { openBoxesOf } from "../maps/heightplan.mjs";
import { carve, box, cylinder, wedge, prism, stairs as stairBrushes, light, sunLight, textureLights, playerStart, pointEntity, brushEntity, writeMap, readMap, subtract, moved, shapeOf, onFloor } from "../maps/source.mjs";
import { checkPlan } from "../maps/plan.mjs";
import { definitionsOf } from "../maps/fgd.mjs";
import { reachOf } from "../maps/reach.mjs";
import { writeWad, readWad } from "../maps/wad.mjs";
import { compileMap, findCompilers } from "../maps/compile.mjs";
import { readBsp } from "../maps/bsp.mjs";
import { lightReport } from "../maps/light.mjs";
import { makeSky, skyFiles, SKY_KEYS } from "../maps/sky.mjs";
import { PRECACHES_MODEL } from "../maps/entities.mjs";
import { sweepOf, SAFE_DROP, LIGHT_REACH } from "../maps/sweep.mjs";
import { planOfSource, planOf, drawMap, sectionOf, viewsOf, aimedStands } from "../maps/draw.mjs";
import { dressingOf } from "../maps/dressing.mjs";
import { familyOf } from "../maps/families.mjs";
import { spaceOf } from "../maps/space.mjs";
import { focusSpec, focusSeen } from "./focus.mjs";
import { breaksOf, dressRooms, BREAK_WORDS, USE_WORDS, DRESS_MATERIALS } from "./dress.mjs";
import { tile, label, render } from "../render.mjs";
import { png, unpicture } from "../image.mjs";
import { materialOf, surfacePicture, MATERIALS, UNWORN } from "./paint.mjs";
import { lookSentence, ALLOWED } from "./look.mjs";
import { wadCatalog, pickTexture } from "./wads.mjs";
import { buildModelSpec, validateModelSpec } from "./model.mjs";
import { buildSoundSpec } from "./sound.mjs";
import { TRACKS } from "./music.mjs";

export const MAP_SPEC = "smak.map/1";
/** A map's plan off the size the spec asks by more than these shares is warned of, and a fault (as a model's is). */
const MAP_SIZE_WARN = 0.1;
const MAP_SIZE_ERROR = 0.25;

const TOP = ["spec", "name", "size", "wall", "grid", "theme", "textures", "rooms", "links", "entities", "props", "furniture", "prefabs", "models", "layout", "sky", "sun", "night", "include", "replace", "sounds", "fgd", "wads", "compile", "detail", "note", "ladders", "fidelity", "music", "floorplan", "frame", "lighting", "focus"];
/** A ladder's depth off its wall, and its width unless told: Valve's frenzy's are 32 wide. */
const LADDER = { depth: 6, width: 32 };
const ROOM = ["id", "size", "at", "place", "floor", "sky", "surfaces", "light", "water", "test", "building", "dark", "note", "frame", "use"];
const LINK = ["between", "kind", "width", "height", "along", "sill", "stairs", "door", "glass", "side", "material", "note"];
const PLACES = ["east_of", "west_of", "north_of", "south_of", "above", "below", "in"];
const LINK_KINDS = ["door", "opening", "window", "stairs"];
/** Sizes by the words of MAPS-MAKING.md, "Units and sizes". */
const PLAYER = { wide: 32, high: 72 };
const STEP = 18;
const DOOR = { width: 64, height: 96 };
/**
 * The narrowest way a player passes at ease: a way as wide as the player (32) scrapes both sides, and a door on
 * hinges stands open in its own doorway, its leaf and its stop taking a third of it. Narrower ways asked for
 * (a real house's 2'-6" doors at a foot to 12 units) are widened to these, and the report says so.
 */
const PASSABLE = { opening: 48, door: 48, swing: 56 };
/** A room a player walks into is this wide both ways at least: two of his widths, room to turn and shut a door. */
const ROOM_LEAST = 64;
const ROOM_LONG = 96;
/** And as high as Valve's own doors, where the rooms have the height. */
const PASSABLE_HIGH = 96;
/** How deep the floor in front of a way through stays clear of furniture, on both sides: a step and a turn. */
const CLEAR = 40;
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
/** Pieces this near each other, or a room's face, touch. */
const TOUCH = 1;
/** A stair's railing: its handrail this high over a tread, its posts and rail this thick. */
const RAIL_HIGH = 36;
const RAIL_POST = 2;
/** The kit's furniture, model specs a map's props name as "kit:<name>", and the key each is built under. */
const KIT_FURNITURE = fileURLToPath(new URL("../../kits/furniture/", import.meta.url));
/** The kit's furniture a prefab's name stands for (its name, or its last word, or a common other name), or null. */
function kitOf(name) {
  const kitNames = readdirSync(KIT_FURNITURE).map((f) => f.replace(/\.json$/, ""));
  const words = String(name).toLowerCase().split(/[^a-z]+/).filter(Boolean);
  // a word that makes it another thing: a porta toilet is a booth, not the kit's toilet
  if (words.some((w) => OTHER_THING.has(w))) return null;
  const last = words.at(-1);
  return [words.join("_"), last].map((w) => (kitNames.includes(w) ? w : KIT_WORDS[w])).find(Boolean) ?? null;
}
/**
 * A map made to look its best (`fidelity: "high"`): wall trim and door casings, more lamps, and furniture of boxes
 * named for a piece the kit has a model of put in as that model. The sizes of the trim, in units.
 */
const TRIM = { base: 6, baseDeep: 1.5, casing: 3, proud: 1, sill: 3 };
/**
 * A room framed as Valve frames its own (`frame: true`, or these numbers over the defaults; a room's own `frame`
 * over the map's, `false` none): a band at the foot of each wall (`dado` high) and one under the ceiling
 * (`cornice`), each its own brush `proud` off the wall in the trim texture, so a tall wall is not one texture
 * tiled up it; ribs (pilasters, `rib` [wide, deep]) every `ribs` along a long wall; beams (`beam` [wide, deep])
 * every `beams` across a wide ceiling; the corners cut at 45 degrees (`chamfer` along each wall); a frame
 * (`jamb` wide) round each way through; and with `fixtures` each lamp in a fixture that glows (a texture light)
 * on the ceiling, or a glowing shade, and `fill` (a light's brightness, 0 none) a weak light over each floor.
 * Valve's campaign maps: about 517 world brushes and 42 in 100 of their corners off the axes against our box
 * rooms' 6 and none (research/map-geometry.md); the judges docked bare boxes, lights in the air and walls of one
 * texture tiled three times up (the original mod's maps, 2026-10-17). All of it func_detail: it cuts no portal.
 */
const FRAME = { dado: 48, cornice: 24, proud: 2, ribs: 224, rib: [16, 8], beams: 192, beam: [16, 16], chamfer: 24, jamb: 8, fixtures: true, fill: 0, bands: false };
/**
 * A framed room's walls banded on their own faces (`frame.bands: true`), as Valve bands its own: the wall split up
 * its height into a base band to `dado`, the field, and an upper band from the head of the room's highest way (a
 * door's: Valve's joins sit a median 124 over a wall's foot, quartiles 48 to 176, research/level-dressing.md 2.3)
 * to the ceiling, in a room this tall or taller. The bands are the rock's own faces, cut where they join, each
 * texture standing on its band's foot: a join on the wall's plane, which a strip stood off it is not.
 */
const BAND_ROOM_LEAST = 128;
/**
 * Light composed, not spread (`lighting: true`, or these over them): a lamp in each `rhythm` along a room's run
 * dimmed to `dim` of its brightness, the `goal` room's lamps `goal` times brighter (`goalRoom` names it), a weak
 * light of `spill` in each way through so light spills from a doorway, and each lamp's light falling off `fade`
 * times sooner (hlrad's `_fade`), so it pools under its lamp and leaves dark between. Valve's maps: a floor's dark
 * share 5 to 60 in 100 (median 18) and its light's contrast 2.8 to 94 (median 8.2), where the kit's lamps, spread
 * even, left 0 to 4 and 2.2 to 2.5 (src/maps/dressing.mjs; research/level-dressing.md 2.2: darkness on purpose,
 * not every lamp on, the goal brightest, spill from doorways).
 */
const COMPOSED = { rhythm: 3, dim: 0.2, goal: 1.6, goalRoom: null, spill: 50, fade: 2.5, bounce: 2 };
const COMPOSED_NUMBERS = ["rhythm", "dim", "goal", "spill", "fade", "bounce"];
const BAND_HEAD = 112;
const BAND_UPPER_LEAST = 32;
const FRAME_NUMBERS = ["dado", "cornice", "proud", "ribs", "beams", "chamfer", "jamb", "fill"];
/** A room under this across has no ribs, beams or cut corners: a corridor keeps its width */
const FRAME_ROOM_LEAST = 128;
const LAMP_AREA_HIGH = 192 * 192;
/** Words in a prefab's name that make it something other than the kit's piece of that name. */
const OTHER_THING = new Set(["porta", "portable", "toy", "mini", "model", "sign"]);
/** Other names for the kit's furniture, as a maker names a prefab: a `tub` is the kit's `bathtub`. */
const KIT_WORDS = { tub: "bathtub", bath: "bathtub", sink: "sink_cabinet", basin: "sink_cabinet", couch: "sofa", settee: "sofa", refrigerator: "fridge", oven: "stove", range: "stove", cooker: "stove", car: "sedan", tree: "tree_summer", plant: "potted_plant", tv: "tv_stand", television: "tv_stand", hoop: "basketball_hoop", swings: "swing_set", net: "tennis_net", wardrobe: "dresser", drawers: "dresser" };
const kitKey = (model) => (typeof model === "string" && model.startsWith("kit:") ? `kit_${model.slice(4)}` : model);
/** The sprites a player sees, and how near a surface they must be (sweep.mjs's LIGHT_REACH). */
const GLOWS = ["env_glow", "env_sprite"];
const GLOW_REACH = 32;
/** A piece set on others with less than this share of its footprint under it overhangs. */
const OVERHANG = 0.5;
/** The rise and the depth of a stair's step that a link of stairs is built with. */
const RISE = 16;
const TREAD = 24;
const FACINGS = { east: 0, north: 90, west: 180, south: 270 };
/** The theme's words: what a module keeps of its own under its prefix. */
const THEME_FACES = ["floor", "ceiling", "wall", "door", "furniture", "outside", "roof"];
/** A side of a room: the axis its wall is across and which way out it faces. */
const SIDE_AXES = { east: { axis: 0, sign: 1 }, west: { axis: 0, sign: -1 }, north: { axis: 1, sign: 1 }, south: { axis: 1, sign: -1 } };

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
const textureName = (key, liquid = false, holed = false) =>
  key === "sky" ? "sky" : `${liquid ? "!" : holed ? "{" : ""}SM_${key}`.toUpperCase().replace(/[^!{A-Z0-9_]/g, "").slice(0, 15);
/**
 * A light's brightness is a light entity's (a lamp LAMP_BRIGHTNESS): one far under it is all but dark, and read as a
 * multiple it was (frenzy's height-plan copy lit its areas at 2, and every view from its starts was black).
 */
const DIM_LIGHT = 40;
/** A floor plan's floor (or an area's) more than this share dark is held dark, whatever its mean (Valve's frenzy 13%,
 * c1a0 10%, c2a3 31%, c1a2 37%). */
const DARK_SHARE = 0.5;
function lightWarning(light, at, warnings) {
  const b = light && typeof light === "object" ? light.brightness : undefined;
  if (typeof b === "number" && b < DIM_LIGHT) warnings.push(`${at}.brightness: ${b} is a light entity's brightness, all but dark (a lamp is ${LAMP_BRIGHTNESS}): not a multiple`);
}

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
  for (const key of ["furniture", "props", "sounds"]) out[key] = [...(spec[key] ?? [])];
  for (const key of ["prefabs", "models", "textures"]) out[key] = { ...(spec[key] ?? {}) };
  const hostTheme = { floor: "stone", wall: "plaster", ceiling: "planks", door: "door", furniture: "darkwood", outside: "siding", roof: "shingles", ...(spec.theme ?? {}) };
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
    // a theme word naming one of the module's own textures names it under its prefix
    for (const face of THEME_FACES)
      out.textures[id(face)] = typeof innerTheme[face] === "string" && inner.textures?.[innerTheme[face]] !== undefined ? id(innerTheme[face]) : innerTheme[face];
    const word = (w) => (inner.textures?.[w] !== undefined || THEME_FACES.includes(w) ? id(w) : w);
    // the rooms a module has only to be tried alone (a stretch of street before a shop) stay out
    const tried = new Set(inner.rooms.filter((room) => room.test).map((room) => room.id));
    inner.rooms = inner.rooms.filter((room) => !room.test);
    inner.links = (inner.links ?? []).filter((link) => !link.between.some((r) => tried.has(r)));
    for (const key of ["entities", "furniture", "props"]) inner[key] = (inner[key] ?? []).filter((thing) => !tried.has(thing.room));
    // the rooms of a building the module stands: lined in the module's own floor, walls and ceiling
    const standing = new Set();
    for (const room of inner.rooms) {
      const way = room.place && PLACES.find((w) => room.place[w] !== undefined);
      if ((way === "in" && room.place.stand) || (way && way !== "in" && room.place.stand !== false && standing.has(room.place[way]))) standing.add(room.id);
    }
    inner.rooms.forEach((room, k) => {
      const surfaces = { ...(standing.has(room.id) ? { floor: "floor", walls: "wall", ceiling: "ceiling" } : {}), ...(room.surfaces ?? {}) };
      for (const face of ["floor", "ceiling"]) {
        if (surfaces[face]) surfaces[face] = word(surfaces[face]);
        else if (JSON.stringify(innerTheme[face]) !== JSON.stringify(hostTheme[face])) surfaces[face] = id(face);
      }
      if (surfaces.walls) surfaces.walls = word(surfaces.walls);
      else if (JSON.stringify(innerTheme.wall) !== JSON.stringify(hostTheme.wall)) surfaces.walls = id("wall");
      const placed = { ...room, id: id(room.id), surfaces };
      if (room.building || (room.place?.in && room.place?.stand)) {
        const asked = room.building ?? {};
        const roof = asked.roof === false ? false : { ...(asked.roof ?? {}), material: word(asked.roof?.material ?? "roof") };
        placed.building = { ...asked, walls: word(asked.walls ?? "outside"), roof };
      }
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
    // a module's doors are of its own door material
    for (const link of inner.links ?? []) out.links.push({ ...link, between: link.between.map(id), ...(link.kind === "door" ? { material: word(link.material ?? "door") } : {}) });
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
    // a model the map or a module before has from the same file is that model, built once: the three houses'
    // sofas are one sofa (one file the engine loads, not three)
    const modelName = {};
    for (const [name, model] of Object.entries(inner.models ?? {})) {
      const file = model.file ? resolve(here, model.file) : null;
      const same = file && Object.entries(out.models).find(([, known]) => known.file && resolve(folder, known.file) === file);
      if (same) modelName[name] = same[0];
      else {
        modelName[name] = id(name);
        out.models[id(name)] = file ? { ...model, file } : model;
      }
    }
    for (const thing of inner.furniture ?? [])
      out.furniture.push({ ...named(thing), ...(thing.prefab ? { prefab: id(thing.prefab) } : { texture: word(thing.texture ?? "furniture") }) });
    // its sounds, in its rooms, their spec files found from its folder
    for (const sound of inner.sounds ?? [])
      if (!tried.has(sound.room)) out.sounds.push({ ...named(sound), spec: sound.spec?.file ? { file: resolve(here, sound.spec.file) } : sound.spec });
    for (const thing of inner.props ?? [])
      out.props.push({ ...named(thing), model: inner.models?.[thing.model] ? modelName[thing.model] : thing.model });
  }
  delete out.include;
  return out;
}

/** What is wrong with a map spec before anything is built: { errors, warnings }, each with its path. */
export function validateMapSpec(spec) {
  const errors = [];
  const warnings = [];
  if (!spec || typeof spec !== "object") return { errors: ["the spec is not an object"], warnings };
  // a floor plan of height plans (src/maps/heightplan.mjs) is the map's space: rooms may then be left out, and
  // what stands on the plan is in the room "plan", at [x, y] of the world and z over its floor there
  if (spec.floorplan !== undefined) {
    const f = spec.floorplan;
    if (!f || typeof f !== "object" || typeof f.dir !== "string")
      errors.push(`floorplan: { dir: "work:plans/" }: the folder of a height plan (legend.json, floor-0.png, room-0.png, floor-1.png...), as \`smak map-heights\` draws one`);
    if (f?.grow !== undefined && !(Number.isInteger(f.grow) && f.grow >= 0 && f.grow <= 4)) errors.push("floorplan.grow: cells the walked floor is grown by to its walls, 0 to 4 (1)");
    for (const [i, area] of (Array.isArray(f?.areas) ? f.areas : f?.areas === undefined ? [] : [null]).entries())
      if (!area || !Array.isArray(area.min) || !Array.isArray(area.max) || area.min.length < 2 || area.max.length < 2 || ![...area.min, ...area.max].every((v) => typeof v === "number") || !["floor", "wall", "ceiling", "light"].some((k) => area[k] !== undefined))
        errors.push(`floorplan.areas[${i}]: { min: [x, y] or [x, y, z], max: the same, floor, wall, ceiling, light }: a box of the plan wearing its own (words of the theme, textures or a base) and lit as a room is ("auto", "none", { brightness, color })`);
    for (const [i, area] of (Array.isArray(f?.areas) ? f.areas : []).entries()) lightWarning(area?.light, `floorplan.areas[${i}].light`, warnings);
    if (!spec.rooms) spec = { ...spec, rooms: [] };
    for (const [i, e] of (spec.entities ?? []).entries())
      if (e?.layer !== undefined && !(Number.isInteger(e.layer) && e.layer >= 0)) errors.push(`entities[${i}].layer: the layer of floor it stands on, as the height plan numbers them (0 the lowest)`);
    for (const [i, e] of (spec.entities ?? []).entries())
      if (e?.height !== undefined && typeof e.height !== "number") errors.push(`entities[${i}].height: a height the plan gives it: it stands on the highest floor at or under it`);
  }
  if (spec.spec !== MAP_SPEC) errors.push(`spec: "${MAP_SPEC}" says what this is; it has ${JSON.stringify(spec.spec)}`);
  if (spec.size !== undefined) {
    const z = spec.size, ok = (v) => typeof v === "number" && v > 0;
    if (!(ok(z) || (Array.isArray(z) && z.length === 2 && z.every(ok)) || (z && typeof z === "object" && !Array.isArray(z) && ok(z.length) && (z.width === undefined || ok(z.width)))))
      errors.push("size: what the person asked the map to measure across its plan: its longest side (2500), both sides ([1500, 1500]) or { length, width }");
  }
  for (const key of Object.keys(spec)) if (!TOP.includes(key)) warnings.push(`${key}: not a field of a map spec, left out`);
  if (spec.sky !== undefined && typeof spec.sky !== "string") {
    if (!spec.sky || typeof spec.sky !== "object" || Array.isArray(spec.sky)) errors.push("sky: the name of a sky of the game's (desert), or the words of one to make ({ zenith, horizon, clouds, sun, hills ... })");
    else for (const key of Object.keys(spec.sky)) if (!SKY_KEYS.includes(key)) errors.push(`sky: ${key} is none of ${SKY_KEYS.join(", ")}`);
  }
  if (spec.name !== undefined && !/^[a-z0-9_]{1,31}$/i.test(spec.name))
    errors.push(`name: the map's name, letters, digits and _ (it is typed in the console: map <name>)`);
  if (!Array.isArray(spec.rooms) || (!spec.rooms.length && spec.floorplan === undefined)) {
    errors.push("rooms: a list of one room at least (or a floorplan)");
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
    lightWarning(room?.light, `${at}.light`, warnings);
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
  const known = new Set([...ids.keys(), ...(spec.floorplan ? ["plan"] : [])]);
  for (const [list, what] of [[spec.entities, "entities"], [spec.props, "props"], [spec.furniture, "furniture"]])
    (list ?? []).forEach((thing, i) => {
      if (!known.has(thing?.room)) errors.push(`${what}[${i}].room: the id of the room it is in (${[...known].join(", ")})`);
      if (what === "entities" && typeof thing?.class !== "string") errors.push(`${what}[${i}].class: its classname`);
      if (what === "entities" && PRECACHES_MODEL.includes(thing?.class) && !thing?.keys?.model)
        errors.push(`${what}[${i}].keys.model: ${thing.class} loads the model it names when the map starts, and with none the map stops on load ("PF_precache_model_I: Bad string ''"): name one (a sprite for env_sprite and env_glow, "sprites/glow01.spr")`);
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
  if (spec.focus !== undefined) errors.push(...focusSpec(spec).errors);
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
    // a building standing in an open room: its first room stands `in` it (`stand: true`), and the rooms
    // placed against that one by a compass word, above or below, are of it too (unless `stand: false`)
    let building = null;
    let host = null;
    const way = room.place && PLACES.find((w) => room.place[w] !== undefined);
    if (way === "in" && room.place.stand) [building, host] = [room.id, room.place.in];
    else if (way && way !== "in" && room.place.stand !== false && rooms.get(room.place[way])?.building)
      [building, host] = [rooms.get(room.place[way]).building, rooms.get(room.place[way]).host];
    rooms.set(room.id, { id: room.id, min, max: min.map((v, k) => v + size[k]), spec: room, building, host });
  }
  return { rooms, errors, marks: drawn?.marks ?? [], wall };
}

/**
 * A spec with its `replace` done: `{ textures: { lawn: <a material> }, models: { tree_summer: "tree_winter" } }`
 * swaps every texture (and theme word) and every prop's model of that name, or of that name under a module's
 * prefix (`ranch_lawn`, `park_tree_summer`): the same town in winter, every tree bare. A model put in place
 * of another is one of the spec's own `models`. Models no prop uses any more are left out. Returns { spec,
 * facts, errors }.
 */
function replacedIn(spec) {
  const asked = spec.replace;
  if (!asked) return { spec, facts: [], errors: [] };
  const facts = [];
  const errors = [];
  const matches = (name, word) => name === word || String(name).endsWith(`_${word}`);
  const out = { ...spec, textures: { ...(spec.textures ?? {}) }, theme: { ...(spec.theme ?? {}) }, models: { ...(spec.models ?? {}) } };
  for (const [word, material] of Object.entries(asked.textures ?? {})) {
    const names = [...Object.keys(out.textures), ...Object.keys(out.theme)].filter((name) => matches(name, word));
    for (const name of names) (name in out.textures ? out.textures : out.theme)[name] = material;
    if (!names.length) errors.push(`replace.textures.${word}: no texture or theme word of that name, nor of a module's`);
    else facts.push(`replaced ${word}: ${names.join(", ")}`);
  }
  out.props = (spec.props ?? []).map((thing) => {
    const word = Object.keys(asked.models ?? {}).find((w) => matches(thing.model, w));
    return word ? { ...thing, model: asked.models[word] } : thing;
  });
  for (const [word, model] of Object.entries(asked.models ?? {})) {
    const count = (spec.props ?? []).filter((thing) => matches(thing.model, word)).length;
    if (!out.models[model]) errors.push(`replace.models.${word}: "${model}" is none of the spec's models`);
    else if (!count) errors.push(`replace.models.${word}: no prop is that model, nor a module's of that name`);
    else facts.push(`replaced the model ${word} by ${model}: ${count} props`);
  }
  const used = new Set(out.props.map((thing) => thing.model));
  for (const name of Object.keys(out.models)) if (!used.has(name)) delete out.models[name];
  delete out.replace;
  return { spec: out, facts, errors };
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
function prefabFromMap(file, at, quarters, tag = null) {
  const map = readMap(readFileSync(file, "utf8"));
  // the names the prefab gives its own entities, made its own at each insertion (`tag`): two soda machines each
  // keep a button that fires their own can (c1a0d: five func_buttons target=soda_machine_2, one env_beverage of
  // that name). A name it uses and does not give (a map's own door) is left as it is
  const own = new Set(map.entities.map((e) => e.targetname).filter((n) => typeof n === "string" && n));
  const renamed = (n) => (tag !== null && own.has(n) ? `${n}_${tag}` : n);
  // keys that name an entity (the FGD's target_destination and target_source keys of Half-Life's classes, and the
  // string keys its code reads as a name: research/map-geometry.md)
  const NAME_KEYS = ["targetname", "target", "killtarget", "master", "netname", "parent", "message", "LightningStart", "LightningEnd", "LaserTarget", "altpath", "toptrack", "bottomtrack", "TriggerTarget", "m_iszEntity", "m_iszNewTarget", "m_iszIdle", "m_iszPlay", "combatsound", "train", "fireonbreak"];
  const place = (brushes) => brushes.map((brush) => moved(turnedBrush(brush, quarters), at));
  const textures = new Set(map.brushes.flatMap((b) => b.faces.map((f) => f.texture)));
  const entities = map.entities.map((entity) => {
    const out = { ...entity };
    for (const key of NAME_KEYS) if (typeof out[key] === "string" && (key !== "message" || own.has(out[key]))) out[key] = renamed(out[key]);
    // a multi_manager names what it fires by its keys
    if (entity.classname === "multi_manager")
      for (const key of Object.keys(entity)) if (own.has(key) && key !== "targetname") (out[renamed(key)] = entity[key]), delete out[key];
    if (entity.brushes) {
      out.brushes = place(entity.brushes);
      for (const b of entity.brushes) for (const f of b.faces) textures.add(f.texture);
    }
    if (typeof entity.origin === "string") {
      const p = quarterTurn(entity.origin.split(/\s+/).map(Number), quarters);
      out.origin = p.map((v, k) => v + at[k]);
    }
    // `angle` (one yaw: a button's or a door's way of moving) turns with it too, -1 and -2 (up and down) as they are:
    // the soda machine's buttons say angle 90, and turned they would press sideways
    if (entity.angle !== undefined && Number(entity.angle) >= 0) out.angle = String((Number(entity.angle) + 90 * quarters) % 360);
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
    if (piece.prism) {
      // a convex outline (x, y from the prefab's point) stood up from `from` to `to`: a 45-degree wall, a
      // corner cut off, an octagon's side, a slanted pillar's foot
      const { outline, from, to } = piece.prism;
      return prism("z", outline.map(([x, y]) => turn([x, y, 0]).slice(0, 2)), at[2] + from, at[2] + to, texture);
    }
    throw new Error(`a prefab's piece is a box [min, max], a wedge [min, max] with high, a cylinder { centre, radius, from, to } or a prism { outline: [[x, y], ...], from, to }`);
  });
}

/**
 * Builds a map spec into `out` (a folder): <name>.map, <name>.wad (its own pictures), models/<model>.mdl for
 * every model it puts in, and <name>.bsp when the compilers are found (`compilers`: what findCompilers gave,
 * or a folder). Returns { report, files, map }: report is { ok, errors, faults, warnings, facts, rooms }.
 */
/** A floor plan with more floor than this (square units) and no areas is told it wears one look throughout. */
const ONE_LOOK_AREA = 1_000_000;

export function buildMapSpec(given, { out, compilers, folder, fgd = [], wads = [], readPicture, readFile } = {}) {
  let spec;
  try {
    spec = withIncludes(given, folder ?? ".");
  } catch (error) {
    return { report: { ok: false, errors: [error.message], faults: [], warnings: [], facts: [], rooms: {} }, files: {}, map: null };
  }
  const replaced = replacedIn(spec);
  spec = replaced.spec;
  const { errors, warnings } = validateMapSpec(spec);
  errors.push(...replaced.errors);
  // the main room and its landmark put in (src/spec/focus.mjs): a centrepiece, its plinth, its lamp, the light's goal
  const focused = errors.length ? { spec, focus: null, facts: [] } : focusSpec(spec);
  spec = focused.spec;
  const report = { ok: false, errors, faults: [], warnings, facts: [...replaced.facts, ...focused.facts], rooms: {} };
  const files = {};
  if (spec.fidelity !== undefined && !["game", "high"].includes(spec.fidelity)) errors.push('fidelity: "game" or "high"');
  const frameFaults = (given, at) => {
    if (given === undefined || typeof given === "boolean") return [];
    if (!given || typeof given !== "object") return [`${at}: true, false, or { ${[...FRAME_NUMBERS, "rib", "beam", "fixtures", "bands"].join(", ")} }`];
    return Object.entries(given).flatMap(([key, value]) =>
      FRAME_NUMBERS.includes(key) ? (typeof value === "number" && value >= 0 ? [] : [`${at}.${key}: a number of units, 0 or more (0: none)`])
        : ["rib", "beam"].includes(key) ? (Array.isArray(value) && value.length === 2 && value.every((v) => typeof v === "number" && v > 0) ? [] : [`${at}.${key}: [wide, deep] in units`])
          : ["fixtures", "bands"].includes(key) ? (typeof value === "boolean" ? [] : [`${at}.${key}: true or false`])
            : key === "breaks" ? breakFaults(value, `${at}.breaks`)
              : [`${at}.${key}: not a word of a frame (${[...FRAME_NUMBERS, "rib", "beam", "fixtures", "bands", "breaks"].join(", ")})`],
    );
  };
  // the silhouette's breaks (src/spec/dress.mjs): true, or its words over BREAKS
  const breakFaults = (value, at) => {
    if (typeof value === "boolean") return [];
    if (!value || typeof value !== "object") return [`${at}: true, false, or { ${BREAK_WORDS.join(", ")} }`];
    return Object.entries(value).flatMap(([key, v]) => (!BREAK_WORDS.includes(key) ? [`${at}.${key}: not a word of breaks (${BREAK_WORDS.join(", ")})`] : ["pillar", "cove", "pipe"].includes(key) ? (typeof v === "number" && v > 0 ? [] : [`${at}.${key}: a size in units, over 0`]) : typeof v === "boolean" ? [] : [`${at}.${key}: true or false`]));
  };
  for (const [k, room] of (spec.rooms ?? []).entries())
    if (room?.use !== undefined && !USE_WORDS.includes(room.use)) errors.push(`rooms[${k}].use: what the room is for, dressed by it: ${USE_WORDS.join(", ")}`);
  errors.push(...frameFaults(spec.frame, "frame"), ...(spec.rooms ?? []).flatMap((room, k) => frameFaults(room?.frame, `rooms[${k}].frame`)));
  if (spec.lighting !== undefined && typeof spec.lighting !== "boolean") {
    if (!spec.lighting || typeof spec.lighting !== "object") errors.push(`lighting: true, false, or { ${[...COMPOSED_NUMBERS, "goalRoom"].join(", ")} }`);
    else
      for (const [key, value] of Object.entries(spec.lighting)) {
        if (COMPOSED_NUMBERS.includes(key)) {
          if (!(typeof value === "number" && value >= 0)) errors.push(`lighting.${key}: a number, 0 or more`);
        } else if (key === "goalRoom") {
          if (!(spec.rooms ?? []).some((room) => room?.id === value)) errors.push(`lighting.goalRoom: a room's id, not ${JSON.stringify(value)}`);
        } else errors.push(`lighting.${key}: not a word of lighting (${[...COMPOSED_NUMBERS, "goalRoom"].join(", ")})`);
      }
  }
  /** the map's light composed (COMPOSED, the spec's over it), or null */
  const composed = spec.lighting ? { ...COMPOSED, ...(typeof spec.lighting === "object" ? spec.lighting : {}) } : null;
  /** a room's framing, or null: its own `frame` over the map's, over FRAME */
  const frameOf = (room) => {
    const own = room.spec.frame;
    if (own === false || (!spec.frame && !own)) return null;
    return { ...FRAME, ...(typeof spec.frame === "object" ? spec.frame : {}), ...(typeof own === "object" ? own : {}) };
  };
  if (errors.length) return { report, files, map: null };
  const high = spec.fidelity === "high";
  // furniture of boxes named for a piece the kit has a model of is put in as that model, where it stood
  if (high) {
    const swapped = [];
    const kept = [];
    for (const thing of spec.furniture ?? []) {
      const kit = thing.prefab && !spec.prefabs?.[thing.prefab]?.file ? kitOf(thing.prefab) : null;
      if (kit) swapped.push({ thing, kit });
      else kept.push(thing);
    }
    if (swapped.length) {
      spec = { ...spec, furniture: kept, props: [...(spec.props ?? []), ...swapped.map(({ thing, kit }) => ({ model: `kit:${kit}`, room: thing.room, at: thing.at, facing: thing.rotate ?? 0, fit: true, ...(thing.id ? { id: thing.id } : {}) }))] };
      report.facts.push(`fidelity high: ${swapped.length} pieces of furniture of boxes put in as the kit's models: ${swapped.map(({ thing, kit }) => `${thing.prefab} as kit:${kit}`).join(", ")}`);
    }
  }
  const name = spec.name ?? "specmap";
  if (spec.floorplan && !spec.rooms) spec = { ...spec, rooms: [] };
  // the floor plan's open space, read from its height plan: boxes of air carved with the rooms, in one
  let floorPlan = null;
  if (spec.floorplan) {
    try {
      const dir = spec.floorplan.dir.replace(/\/?$/, "/");
      const text = (file) => (readFile ? readFile(dir + file) : readFileSync(resolve(folder ?? ".", (dir + file).replace(/^(work|models):/, "")))).toString("utf8");
      const picture = (file) => (readPicture ? readPicture(dir + file) : unpicture(readFileSync(resolve(folder ?? ".", (dir + file).replace(/^(work|models):/, "")))));
      const legend = JSON.parse(text("legend.json"));
      const layers = Array.from({ length: legend.layers }, (_, L) => ({ floor: picture(`floor-${L}.png`), room: picture(`room-${L}.png`) }));
      floorPlan = openBoxesOf(layers, legend, { grow: spec.floorplan.grow ?? 1 });
      report.facts.push(`floorplan ${spec.floorplan.dir}: ${floorPlan.layers} layers, ${floorPlan.cells} cells of ${legend.cell} with a floor, ${floorPlan.boxes.length} boxes of open space`);
      // one set of textures over a whole level reads as no place in particular: frenzy's height-plan copy wore one
      // wall texture everywhere, and the judges gave its textures and its views 0 ("flat grey", "blank walls")
      const floorArea = floorPlan.cells * legend.cell * legend.cell;
      if (floorArea > ONE_LOOK_AREA && (spec.floorplan.areas?.length ?? 0) < 2)
        report.warnings.push(`floorplan: ${Math.round(floorArea / 1e4) / 100} million square units of floor, ${floorPlan.layers} layers, all wearing one floor, wall and ceiling: a level's parts look apart (a hall, a corridor, a store). Give floorplan.areas, each part its own textures and light, read off pictures of the place where there are some`);
    } catch (error) {
      errors.push(`floorplan: ${error.message.split("\n")[0]}`);
      return { report, files, map: null };
    }
  }
  const { rooms, errors: placing, marks, wall } = layoutOf(spec);
  // a room's own floor, ceiling or walls are a slab laid into the rock round it: never more than half the rock
  // between two rooms, or one room's slab stands inside the next and its doorway stays shut (a house of walls 6
  // thick: every door led into a wall, and the report said OK)
  const lining = Math.min(LINING, Math.max(1, Math.floor(wall / 2)));
  errors.push(...placing);

  // ── textures: the theme's and every other the spec names, each made a picture of its own ──
  const theme = { floor: "stone", wall: "plaster", ceiling: "planks", door: "door", furniture: "darkwood", outside: "siding", roof: "shingles", trim: "darkwood", ...(spec.theme ?? {}) };
  const materials = { ...theme, ...(spec.textures ?? {}) };
  // the words a silhouette's breaks and a room's dressing wear (src/spec/dress.mjs), where a spec asks for either:
  // its own when it gives them, else these bases, each a texture of its own
  const breaking = [spec.frame, ...(spec.rooms ?? []).map((room) => room?.frame)].some((f) => f && typeof f === "object" && f.breaks);
  if (breaking || (spec.rooms ?? []).some((room) => room?.use)) for (const [word, base] of Object.entries(DRESS_MATERIALS)) materials[word] ??= base;
  // a framed room's lamp fixture: warm glass that glows and lights as a texture light, unless the spec names one
  materials.fixture ??= { base: "glass", tone: [1, 0.93, 0.78], flags: ["fullbright"] };
  const used = new Map();
  /** a texture name for a word of the spec (a key of theme/textures, or a base material) */
  const liquids = new Set();
  /** materials with holes: their textures begin with {, and what wears them is drawn in render mode 4 */
  const meshed = new Set();
  // a game's own textures: named (`{ texture: "C1A0_LABW4" }`) or picked by words and a colour
  // (`{ pick: { words: ["brick"], tone: [r, g, b], else: <a material> } }`) from the .wad files given; a pick
  // that finds nothing is a gap, made from its `else` into the map's own .wad and told
  // a .wad the spec names is looked for as a path from the spec's folder, then by its name in the folders the
  // build was given (a game's valve or mod folder): a spec names "halflife.wad", never a machine's path
  // the .wad files beside the spec are the maker's own work, held to Valve's look as the map's own pictures are
  const ownWads = new Set();
  const wadFiles = [...[spec.wads ?? []].flat()].map((given) => {
    const near = resolve(folder ?? ".", given);
    if (existsSync(near)) return (ownWads.add(near), near);
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
  const nameOfKey = (key) => textureName(key, liquids.has(key), meshed.has(key));
  const textureOf = (word, { liquid = false } = {}) => {
    if (word === "sky") return used.set("sky", { base: "glass", tone: spec.night ? [0.05, 0.06, 0.1] : [0.45, 0.6, 0.85] }) && "sky";
    let material = materials[word] ?? word;
    // a theme's word may name one of the spec's own textures (`outside: "siding_blue"`): that is the texture
    if (typeof material === "string" && material !== word && spec.textures?.[material] !== undefined) return textureOf(material, { liquid });
    if (material && typeof material === "object" && (material.texture || material.pick)) {
      const name = fromWads(word, material);
      if (name) return name;
      material = material.pick.else ?? { base: "plaster", tone: material.pick.tone };
    }
    materialOf(material, `texture ${word}`);
    const key = materials[word] !== undefined ? word : `${typeof material === "string" ? material : material.base}`;
    used.set(key, material);
    if (liquid) liquids.add(key);
    // a mesh (a fence, a grille) is a texture with holes: its name begins with {, and what wears it is a
    // brush entity drawn in render mode 4, or the holes show as a colour
    const holed = (typeof material === "string" ? material : material.base) === "mesh";
    if (holed) meshed.add(key);
    return textureName(key, liquid, holed);
  };
  // a texture's size: the game's from its .wad, the map's own as it is drawn (a door 64 by 128, the rest 128);
  // a photograph laid as it is (literal, aged) the units its `size` gives, in multiples of 16
  const pictureSize = (key, material) => {
    if (key === "sky") return [64, 64];
    const kept = material?.picture && material.filter && material.filter !== "valve" && material.size;
    if (kept) return [material.size].flat().concat([material.size].flat()).slice(0, 2).map((v) => Math.max(16, Math.min(512, 16 * Math.round(v / 16))));
    return (typeof material === "string" ? material : material?.base) === "door" ? [64, 128] : [128, 128];
  };
  const sizeOfTexture = (name) => {
    const game = catalog.find((t) => t.name.toUpperCase() === String(name).toUpperCase());
    if (game) return [game.width, game.height];
    for (const [key, material] of used) if (nameOfKey(key) === name) return pictureSize(key, material);
    return [128, 128];
  };
  /**
   * A texture fitted to the four upright faces of a box: one whole picture across each (a door, a sign) or
   * across and tiling up from the floor (a ladder), its left edge at the face's start. Laid on the world's
   * grid, a door showed a piece of one and a ladder's rails stood in its middle, -|- for |--| (Steven).
   */
  const fitted = (name, min, max, { whole = true } = {}) => {
    const [tw, th] = sizeOfTexture(name);
    const face = (along) => {
      const su = (max[along] - min[along]) / tw;
      const sv = whole ? (max[2] - min[2]) / th : 1;
      return { name, scale: [su, sv], offset: [-min[along] / su, (whole ? max[2] : min[2]) / sv] };
    };
    return { top: name, bottom: name, east: face(1), west: face(1), north: face(0), south: face(0) };
  };
  // a door is painted as a door, panels and a handle, in the colour of the material it is given: a maker names a
  // colour for a door ("door_white"), not a door's picture. A game's texture is worn as it is
  const doorTextureOf = (word) => {
    // the word a theme's word comes to (door -> "oak" -> { base: wood }): the picture is named after it, so two
    // words for one material share it
    let named = word;
    let material = materials[word] ?? word;
    while (typeof material === "string" && materials[material] !== undefined && materials[material] !== material) [named, material] = [material, materials[material]];
    if (material && typeof material === "object" && (material.texture || material.pick)) return textureOf(word);
    if ((typeof material === "string" ? material : material?.base) === "door") return textureOf(word);
    const key = `${named}_leaf`;
    // a photograph given for the material comes with it: its detail under the door's panels, or the door itself
    const photo = material && typeof material === "object" && material.picture !== undefined ? Object.fromEntries(["picture", "filter", "rect", "size", "tile"].filter((k) => material[k] !== undefined).map((k) => [k, material[k]])) : {};
    materials[key] ??= { ...photo, base: "door", tone: materialOf(material, `door ${word}`).tone };
    return textureOf(key);
  };
  let themeNames;
  try {
    themeNames = { floor: textureOf("floor"), wall: textureOf("wall"), ceiling: textureOf("ceiling") };
  } catch (error) {
    errors.push(error.message);
    return { report, files, map: null };
  }

  // a railing on each open long side of a flight (Steven's walk of kaupo_v2: "the stairs don't have railing"):
  // a post at the front of each step and a handrail over it, RAIL_HIGH above its tread; a side against a wall
  // of its room has none
  const railings = (min, max, axis, toward, count, room) => {
    const side = axis === 0 ? 1 : 0;
    const rise = (max[2] - min[2]) / count;
    const tread = (max[axis] - min[axis]) / count;
    const pieces = [];
    for (const edge of [min[side], max[side] - RAIL_POST]) {
      if (edge - room.min[side] < 4 || room.max[side] - (edge + RAIL_POST) < 4) continue;
      for (let k = 0; k < count; k++) {
        const top = min[2] + (k + 1) * rise;
        const from = toward > 0 ? min[axis] + k * tread : max[axis] - (k + 1) * tread;
        const at = (a0, a1, z0, z1) => {
          const lo = [0, 0, z0];
          const hi = [0, 0, z1];
          [lo[axis], hi[axis]] = [a0, a1];
          [lo[side], hi[side]] = [edge, edge + RAIL_POST];
          return box(lo, hi, textureOf("furniture"));
        };
        const front = toward > 0 ? from : from + tread - RAIL_POST;
        pieces.push(at(front, front + RAIL_POST, top, top + RAIL_HIGH - RAIL_POST), at(from, from + tread, top + RAIL_HIGH - RAIL_POST, top + RAIL_HIGH));
      }
    }
    if (pieces.length) entities.push(brushEntity("func_detail", pieces, {}));
  };

  // ── the ways through: doorways, windows, stairs, shafts between storeys ──
  const holes = [];
  /** each way through, with what a frame round it needs: its hole, the axis it goes through, the wall's extent */
  const frameWays = [];
  const thresholds = [];
  /** fidelity high: casings round doors and openings, sills and frames under and round windows, baseboards */
  const trims = [];
  const trimOfWay = (hole, axis, along, kind, lo, hi, ceiling) => {
    const [w0, w1, z0, z1] = [hole.min[along], hole.max[along], hole.min[2], hole.max[2]];
    for (const [face, out] of [[hole.min[axis], -1], [hole.max[axis], 1]]) {
      const slab = (a0, a1, zlo, zhi, depth) => {
        const [b0, b1, top] = [Math.max(lo, a0), Math.min(hi, a1), Math.min(ceiling, zhi)];
        if (b1 - b0 < 0.5 || top - zlo < 0.5) return;
        const min = [0, 0, zlo];
        const max = [0, 0, top];
        min[along] = b0;
        max[along] = b1;
        [min[axis], max[axis]] = out < 0 ? [face - depth, face] : [face, face + depth];
        trims.push(box(min, max, textureOf("trim")));
      };
      const c = TRIM.casing;
      if (kind === "window") {
        slab(w0 - 2, w1 + 2, z0 - 2, z0, TRIM.sill);
        slab(w0 - 2, w0, z0, z1, TRIM.proud);
        slab(w1, w1 + 2, z0, z1, TRIM.proud);
        slab(w0 - 2, w1 + 2, z1, z1 + 2, TRIM.proud);
      } else {
        slab(w0 - c, w0, z0, z1 + c, TRIM.proud);
        slab(w1, w1 + c, z0, z1 + c, TRIM.proud);
        slab(w0 - c, w1 + c, z1, z1 + c, TRIM.proud);
      }
    }
  };
  const ways = [];
  /** each flight of stairs in plan, with the floor at its top: a lamp hung over it clears a head on its treads */
  const flights = [];
  const brushes = [];
  /** where to cut the map upright to see each staircase: { name, from, to } in plan */
  const cuts = [];
  const entities = [];
  /** each building's front: the side its first way out goes through */
  const fronts = new Map();
  (spec.links ?? []).forEach((link, i) => {
    let [a, b] = link.between.map((id) => rooms.get(id));
    const kind = link.kind ?? "opening";
    // a room of a building and the open room it stands in: the way goes through the building's outer wall on
    // `side`, to a sliver of the open room just past it (its floor the open room's)
    const outside = a.building && a.host === b.id ? [a, b] : b.building && b.host === a.id ? [b, a] : null;
    if (outside) {
      const [inner, open] = outside;
      const side = SIDE_AXES[link.side];
      if (!side) {
        errors.push(`links[${i}]: between ${inner.id}, a room of a building, and ${open.id}, round it: side "north", "south", "east" or "west" (the wall it goes through)`);
        return;
      }
      if (kind !== "window" && !fronts.has(inner.building)) fronts.set(inner.building, link.side);
      const sliver = { id: open.id, min: [...inner.min], max: [...inner.max], spec: open.spec, sliver: true };
      sliver.min[2] = open.min[2];
      sliver.max[2] = open.max[2];
      if (side.sign > 0) [sliver.min[side.axis], sliver.max[side.axis]] = [inner.max[side.axis] + wall, inner.max[side.axis] + wall + 1];
      else [sliver.min[side.axis], sliver.max[side.axis]] = [inner.min[side.axis] - wall - 1, inner.min[side.axis] - wall];
      [a, b] = a === inner ? [inner, sliver] : [sliver, inner];
    }
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
        // along the lower room's south side unless told: `along` 0 to 1 moves it across to the north side
        const sx = x0 + 16;
        const sy = snap(y0 + 16 + (link.along ?? 0) * (y1 - y0 - 32 - width), 8);
        holes.push({ min: [sx, sy, lower.max[2]], max: [sx + run, sy + width, upper.min[2]] });
        brushes.push(...stairBrushes([sx, sy, lower.min[2]], [sx + run, sy + width, upper.min[2]], "+x", textureOf("floor"), { steps: count, top: false, tread: TREAD }));
        railings([sx, sy, lower.min[2]], [sx + run, sy + width, upper.min[2]], 0, 1, count, lower);
        flights.push({ min: [sx, sy], max: [sx + run, sy + width], top: upper.min[2] });
        report.facts.push(`links[${i}]: stairs of ${count} steps from ${lower.id} up to ${upper.id}, along x from ${sx} to ${sx + run}`);
        cuts.push({ name: `${lower.id} up to ${upper.id}`, from: [lower.min[0] - 8, sy + width / 2], to: [lower.max[0] + 8, sy + width / 2] });
      } else errors.push(`links[${i}]: stairs from ${lower.id} to ${upper.id} need ${run + 32} x ${width} of floor both rooms share; they share ${x1 - x0} x ${y1 - y0}`);
      return;
    }
    const along = others[0];
    const [lo, hi] = overlap[0];
    const asked = link.width ?? (kind === "window" ? WINDOW.width : DOOR.width);
    const least = kind === "window" ? 0 : kind === "door" && link.door?.swing ? PASSABLE.swing : kind === "door" ? PASSABLE.door : PASSABLE.opening;
    const width = Math.min(Math.max(asked, least), hi - lo);
    if (width > asked) report.facts.push(`links[${i}]: ${a.id} to ${b.id} widened from ${asked} to ${width}: a player passes ${kind === "opening" ? "an" : "a"} ${kind}${link.door?.swing ? " on hinges" : ""} at ease at ${least}`);
    // a room a player walks into turns him round and lets a door shut behind him: 64 across both ways at least
    // (Kaupo's closets, 40 square: "just large enough to fit the player ... the door won't shut with them inside")
    if (kind !== "window")
      for (const room of [a, b].filter((r) => r.spec && !r.spec.sky && rooms.get(r.id) === r)) {
        const small = [0, 1].map((k) => room.max[k] - room.min[k]);
        // small both ways: a corridor, long and narrow, is walked along and is no fault
        if (Math.min(...small) < ROOM_LEAST && Math.max(...small) < ROOM_LONG) report.faults.push(`links[${i}]: ${room.id} is ${small.join(" x ")}, too small for a player to walk into and turn round (and shut a door behind): ${ROOM_LEAST} by ${ROOM_LONG} at least, or leave the way into it out (a cupboard)`);
      }
    if (width < least) report.faults.push(`links[${i}]: the wall ${a.id} and ${b.id} share is ${hi - lo} long, and a player passes ${kind === "opening" ? "an" : "a"} ${kind}${link.door?.swing ? " on hinges" : ""} at ease at ${least}: make the rooms share more wall, or leave the way out`);
    const share = link.along ?? 0.5;
    const centre = snap(lo + (hi - lo) * share, 8);
    const w0 = Math.max(lo, Math.min(hi - width, centre - width / 2));
    const floorHigh = Math.max(a.min[2], b.min[2]);
    const floorLow = Math.min(a.min[2], b.min[2]);
    const ceiling = Math.min(a.max[2], b.max[2]);
    const z0 = kind === "window" ? floorHigh + (link.sill ?? WINDOW.sill) : floorHigh;
    // a way a player walks through is as high as Valve's doors at least (96), and over a step it clears the body
    // the engine lifts by up to a step (18) before it moves on: 72 + 18 over the lower floor. Kaupo's shed door,
    // 76 high over a step of 8, was ducked through (Steven's play-test)
    const askedHigh = link.height ?? (kind === "window" ? WINDOW.height : DOOR.height);
    const leastHigh = kind === "window" ? 0 : Math.max(PASSABLE_HIGH, floorLow + STEP + PLAYER.high - z0);
    const height = Math.min(Math.max(askedHigh, leastHigh), ceiling - z0);
    if (kind !== "window" && height > askedHigh) report.facts.push(`links[${i}]: ${a.id} to ${b.id} raised from ${askedHigh} to ${height} high: a player walks through at ease at ${leastHigh}`);
    if (kind !== "window" && height < leastHigh)
      (height < PLAYER.high ? errors : report.faults).push(`links[${i}]: the way from ${a.id} to ${b.id} is ${height} high, under the ceiling of the lower room; a player walks through at ease at ${leastHigh}${floorHigh > floorLow ? ` (over the step of ${floorHigh - floorLow} the engine lifts the body by up to ${STEP} before it moves on)` : ""}: raise the rooms' ceilings`);
    const hole = { min: [0, 0, z0], max: [0, 0, z0 + height] };
    hole.min[axis] = from.max[axis];
    hole.max[axis] = to.min[axis];
    hole.min[along] = w0;
    hole.max[along] = w0 + width;
    holes.push(hole);
    frameWays.push({ hole, axis, along, kind, lo, hi, ceiling, link: i });
    if (high) trimOfWay(hole, axis, along, kind, lo, hi, ceiling);
    // the threshold: rooms with a floor of their own are carved a lining deeper under it, and the way between
    // them was carved down with them, a slot across the doorway a foot catches in. A slab fills it to the floor
    if (kind !== "window") {
      thresholds.push({ min: [hole.min[0], hole.min[1], z0 - lining * 2], max: [hole.max[0], hole.max[1], z0] });
      // the floor in front of it on both sides, which furniture keeps clear of
      const clear = { link: i, kind, z0, along, least, min: [hole.min[0], hole.min[1]], max: [hole.max[0], hole.max[1]], in: [] };
      clear.min[axis] -= CLEAR;
      clear.max[axis] += CLEAR;
      ways.push(clear);
    }
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
      // a building's way out comes down into the open room round it: its steps stand out from the outer wall
      // into that room (a house raised on piers, its front steps), measured against the whole of it
      const ground = lower.sliver ? rooms.get(lower.id) : lower;
      const room = toward > 0 ? lower.max[axis] - ground.min[axis] : ground.max[axis] - lower.min[axis];
      if (run > room - PLAYER.wide) errors.push(`links[${i}]: stairs up ${floorHigh - floorLow} need ${run} of ${ground.id}'s floor; it is ${room} long that way`);
      else {
        brushes.push(...stairBrushes(min, max, high, textureOf("floor"), { steps: count, top: false, tread: TREAD }));
        railings(min, max, axis, toward, count, ground);
        flights.push({ min: [min[0], min[1]], max: [max[0], max[1]], top: floorHigh });
        // the stairs and the floor at their foot are kept clear as a doorway's floor is, from the lower floor up
        // to a player's head at the top (Kaupo's blocks by its stairs, Steven's play-test)
        const foot = { link: i, kind: "stairs", z0: floorLow, high: floorHigh - floorLow + PLAYER.high, along, least, min: [min[0], min[1]], max: [max[0], max[1]], in: [] };
        if (toward > 0) foot.min[axis] -= CLEAR;
        else foot.max[axis] += CLEAR;
        ways.push(foot);
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
      const middle = (from.max[axis] + to.min[axis]) / 2;
      const swing = link.door?.swing;
      const { swing: _swing, hinge = "start", ...keys } = link.door ?? {};
      if (swing) {
        // a door on hinges, as a house's: a leaf 4 thick in the wall's middle, turning a quarter about an
        // upright through its hinge (an ORIGIN brush there), away from whoever opens it
        const leaf = { min: [...hole.min], max: [...hole.max] };
        leaf.min[axis] = middle - 2;
        leaf.max[axis] = middle + 2;
        const at = hinge === "end" ? hole.max[along] - 2 : hole.min[along] + 2;
        const pin = { min: [...leaf.min], max: [...leaf.max] };
        pin.min[along] = at - 2;
        pin.max[along] = at + 2;
        entities.push(
          brushEntity("func_door_rotating", [box(leaf.min, leaf.max, fitted(doorTextureOf(link.material ?? "door"), leaf.min, leaf.max)), box(pin.min, pin.max, "ORIGIN")], {
            speed: 100,
            // as Valve's doors are: it opens as a player walks into it, away from them, and shuts by itself `wait`
            // seconds later (Steven, 2026-10-15: "going up to a door, it automatically opens and then automatically
            // closes a second or two later"; a door to be used is the mod's to make, by a trigger). One that swings
            // shut on a player in the doorway turns back (a door with a wait reverses when blocked)
            spawnflags: 0,
            wait: 2,
            distance: 90,
            angles: "0 0 0",
            ...keys,
          }),
        );
      } else {
        // a door that slides up into the wall over it, all the way: a lip left showing under the lintel
        // makes a player of 72 duck through a doorway of 80
        const leaf = { min: [...hole.min], max: [...hole.max] };
        leaf.min[axis] = middle - 4;
        leaf.max[axis] = middle + 4;
        // opened by walking into it and shut by itself two seconds later, as the hinged ones are
        entities.push(brushEntity("func_door", [box(leaf.min, leaf.max, fitted(doorTextureOf(link.material ?? "door"), leaf.min, leaf.max))], { angle: -1, speed: 120, wait: 2, spawnflags: 0, lip: 0, ...keys }));
      }
    }
  });

  // ── a framed room's walls banded on their own faces (frame.bands): base, field and upper, each its texture ──
  // the spec's own `dado` and `upper` first; else a game's wall texture takes its family's (WALL_FAMILIES: what
  // Valve stacks under and over it, at the heights it does) where the .wad files given have it; else a wall of a
  // .wad's texture its `trim` at its foot; else the wall's own material darker at its foot, lighter over a door's
  // head
  // a game's texture a band wears is one the map uses: it goes in the map's .wad list as a named one does
  const gameName = (name) => {
    const found = catalog.find((t) => t.name.toUpperCase() === String(name).toUpperCase());
    if (found) gameTextures.set(found.name, found.file);
    return found?.name ?? null;
  };
  const ownTrimBand = spec.theme?.trim !== undefined || spec.textures?.trim !== undefined;
  const shade = (word, k, as) => {
    if (materials[as] !== undefined) return textureOf(as);
    let material = materials[word] ?? word;
    while (typeof material === "string" && materials[material] !== undefined && materials[material] !== material) material = materials[material];
    if (material && typeof material === "object" && (material.texture || material.pick)) return as === "dado" && ownTrimBand ? textureOf("trim") : null;
    const own = materialOf(material, `band ${as}`);
    materials[`${word}_${as}`] ??= { ...(typeof material === "object" ? material : {}), base: typeof material === "string" ? material : material.base, tone: own.tone.map((v) => Math.min(1, v * k)) };
    return textureOf(`${word}_${as}`);
  };
  const bandsDone = new Map();
  /** a room's bands, [{ z0, z1, wall }] foot to head, or null: its framing asks for them and it is tall enough */
  const bandsOf = (room) => {
    if (bandsDone.has(room.id)) return bandsDone.get(room.id);
    const f = frameOf(room);
    let bands = null;
    const [z0, z1] = [room.min[2], room.max[2]];
    if (f?.bands && !room.spec.sky && z1 - z0 >= BAND_ROOM_LEAST) {
      const word = room.spec.surfaces?.walls ?? "wall";
      const field = textureOf(word);
      const family = gameName(field) ? familyOf(field) : null;
      const given = (as) => (materials[as] !== undefined ? textureOf(as) : null);
      const under = given("dado") ?? (family?.under && gameName(family.under) ? gameName(family.under) : shade(word, 0.62, "dado"));
      const over = given("upper") ?? (family?.over && gameName(family.over) ? gameName(family.over) : family ? null : shade(word, 1.15, "upper"));
      // the upper band from the head of the room's highest way through its walls (a door's), else a door's height
      const ways = holes.filter((hole) => [0, 1].some((k) => Math.abs(hole.max[k] - room.min[k]) < 1 || Math.abs(hole.min[k] - room.max[k]) < 1) && hole.min[2] < z1 && hole.max[2] > z0);
      const head = family?.overAt ? z0 + family.overAt : Math.max(z0 + BAND_HEAD, ...ways.map((hole) => Math.min(hole.max[2], z1)));
      const foot = z0 + (family?.underAt && family.underAt < head - z0 ? family.underAt : f.dado);
      bands = [];
      if (under && foot - z0 >= 8) bands.push({ z0, z1: foot, wall: under });
      const top = over && z1 - head >= BAND_UPPER_LEAST ? head : z1;
      bands.push({ z0: bands.length ? foot : z0, z1: top, wall: field });
      if (top < z1) bands.push({ z0: top, z1, wall: over });
      if (bands.length === 1) bands = null;
    }
    bandsDone.set(room.id, bands);
    return bands;
  };
  const bandedCount = { rooms: 0, joins: 0 };

  // ── rooms: carved in one block, lined where they wear another texture ──
  // A floor, a ceiling or walls of its own are a lining: the room is carved `lining` further that way, and a
  // slab of the other texture fills what was carved, so its face is where the room's was. A way through it
  // (a stair's shaft, a doorway) is cut out of the slab.
  const boxes = [];
  const linings = [];
  for (const room of rooms.values()) {
    const carved = { min: [...room.min], max: [...room.max] };
    const surfaces = { ...(room.building ? { floor: "floor", walls: "wall", ceiling: "ceiling" } : {}), ...(room.spec.surfaces ?? {}) };
    if (room.spec.sky) surfaces.ceiling = "sky";
    for (const [face, word] of Object.entries(surfaces)) {
      if (!["floor", "ceiling", "walls"].includes(face)) {
        warnings.push(`rooms ${room.id}.surfaces.${face}: a room's surfaces are floor, ceiling and walls`);
        continue;
      }
      let pieces;
      if (face === "walls") {
        // four slabs round the room, each `lining` thick, the room carved out to their backs: its walls wear the
        // texture whatever the rock round it wears (a module's own walls, kept in a larger map)
        for (const k of [0, 1]) {
          carved.min[k] -= lining;
          carved.max[k] += lining;
        }
        const [x0, y0, z0] = room.min;
        const [x1, y1, z1] = room.max;
        pieces = [
          { min: [x0 - lining, y0 - lining, z0], max: [x0, y1 + lining, z1] },
          { min: [x1, y0 - lining, z0], max: [x1 + lining, y1 + lining, z1] },
          { min: [x0, y0 - lining, z0], max: [x1, y0, z1] },
          { min: [x0, y1, z0], max: [x1, y1 + lining, z1] },
        ];
      } else {
        const z = face === "floor" ? [room.min[2] - lining, room.min[2]] : [room.max[2], room.max[2] + lining];
        if (face === "floor") carved.min[2] -= lining;
        else carved.max[2] += lining;
        pieces = [{ min: [room.min[0], room.min[1], z[0]], max: [room.max[0], room.max[1], z[1]] }];
      }
      for (const hole of holes) pieces = pieces.flatMap((piece) => subtract(piece, hole));
      // a banded room's lined walls: each slab cut at its bands' edges, each slice wearing its band
      const banded = face === "walls" ? bandsOf(room) : null;
      if (banded) pieces = pieces.flatMap((piece) => banded.map((b) => ({ min: [piece.min[0], piece.min[1], Math.max(piece.min[2], b.z0)], max: [piece.max[0], piece.max[1], Math.min(piece.max[2], b.z1)], band: b })).filter((p) => p.max[2] - p.min[2] > 0.5));
      // a lined wall's picture stands on its room's floor (or its band's foot), as the rock's does (source.mjs onFloor)
      const textureFor = (piece) => {
        const name = piece.band?.wall ?? textureOf(word);
        const z = piece.band?.z0 ?? room.min[2];
        const walls = face === "walls" ? { east: onFloor(name, z, room.min[1]), west: onFloor(name, z, room.min[1]), north: onFloor(name, z, room.min[0]), south: onFloor(name, z, room.min[0]) } : null;
        return walls ? { top: name, bottom: name, sides: name, ...walls } : name;
      };
      linings.push(...pieces.map((piece) => box(piece.min, piece.max, textureFor(piece))));
    }
    const bands = bandsOf(room);
    if (bands) {
      bandedCount.rooms++;
      bandedCount.joins += bands.length - 1;
      if (!surfaces.walls) carved.bands = bands;
    }
    boxes.push(carved);
    // water: a liquid brush over the room's floor, `depth` deep (it seals nothing, and is swum in)
    if (room.spec.water) {
      const water = typeof room.spec.water === "number" ? { depth: room.spec.water } : room.spec.water;
      const texture = textureOf(water.material ?? "water", { liquid: true });
      brushes.push(box(room.min, [room.max[0], room.max[1], room.min[2] + water.depth], texture));
    }
  }
  if (floorPlan) {
    // its areas, each wearing its own floor, walls and ceiling: the plan's boxes cut at their edges, each piece in the
    // first area that holds its middle (the carve's faces then take that area's: research/map-geometry.md, P5)
    const areas = (spec.floorplan.areas ?? []).map((a) => ({
      min: [a.min[0], a.min[1], a.min[2] ?? -Infinity],
      max: [a.max[0], a.max[1], a.max[2] ?? Infinity],
      wears: Object.fromEntries(["floor", "wall", "ceiling"].filter((k) => a[k]).map((k) => [k, textureOf(a[k])])),
      light: a.light,
    }));
    const cuts = [0, 1, 2].map((k) => [...new Set(areas.flatMap((a) => [a.min[k], a.max[k]]).filter(Number.isFinite))]);
    for (const b of floorPlan.boxes) {
      let pieces = [{ min: [...b.min], max: [...b.max] }];
      for (const k of [0, 1, 2])
        for (const at of cuts[k])
          pieces = pieces.flatMap((p) => (at > p.min[k] && at < p.max[k] ? [{ min: p.min, max: p.max.map((v, j) => (j === k ? at : v)) }, { min: p.min.map((v, j) => (j === k ? at : v)), max: p.max }] : [p]));
      for (const p of pieces) {
        const mid = p.min.map((v, k) => (v + p.max[k]) / 2);
        const area = areas.find((a) => [0, 1, 2].every((k) => mid[k] >= a.min[k] && mid[k] <= a.max[k]));
        boxes.push(area ? { ...p, wears: area.wears } : p);
        if (area) (area.pieces ??= []).push(p);
      }
    }
    // its light, unless the spec gives its own: a lamp under the ceiling of each of the largest open spaces, about
    // Valve's density (13 light entities a campaign map at the median; the rest is its lamps' textures)
    // an area's light, as a room's: "auto" a lamp for each 256 x 256 of its floor, on each storey, hung no higher
    // than 192 over it; { brightness, color } at that spacing; "none" none. By the area, not by its pieces: by piece,
    // frenzy's copy hung 147 lamps where the original has 8
    for (const area of areas) {
      if (!area.light || area.light === "none" || !area.pieces?.length) continue;
      const per = area.light === "auto" ? {} : area.light;
      const lo = [0, 1].map((k) => Math.min(...area.pieces.map((p) => p.min[k])));
      const hi = [0, 1].map((k) => Math.max(...area.pieces.map((p) => p.max[k])));
      const n = [0, 1].map((k) => Math.max(1, Math.round((hi[k] - lo[k]) / 256)));
      for (let i = 0; i < n[0]; i++)
        for (let j = 0; j < n[1]; j++) {
          const [x, y] = [lo[0] + ((i + 0.5) * (hi[0] - lo[0])) / n[0], lo[1] + ((j + 0.5) * (hi[1] - lo[1])) / n[1]];
          const here = area.pieces.filter((p) => x >= p.min[0] && x <= p.max[0] && y >= p.min[1] && y <= p.max[1]);
          const storeys = [...new Map(here.map((p) => [p.min[2], p])).values()];
          // against the ceiling, as Valve's lamps are: hung 192 over the floor of a hall 512 high, the judges counted
          // them as lights in open air (frenzy's copy: 26 against the original's 2)
          for (const p of storeys) entities.push(light([Math.round(x), Math.round(y), Math.round(p.max[2] - PLAN_LAMP_DROP)], { brightness: per.brightness ?? LAMP_BRIGHTNESS, color: per.color ?? [255, 240, 220] }));
        }
    }
    if (!(spec.entities ?? []).some((e) => /^light/.test(e.class ?? "")) && !areas.some((a) => a.light)) {
      const large = floorPlan.boxes
        .map((b) => ({ b, area: (b.max[0] - b.min[0]) * (b.max[1] - b.min[1]) }))
        .filter(({ b, area }) => area >= PLAN_LAMP_AREA && b.max[2] - b.min[2] >= 96)
        .sort((p, q) => q.area - p.area)
        .slice(0, PLAN_LAMPS_MOST);
      for (const { b } of large) entities.push(light([Math.round((b.min[0] + b.max[0]) / 2), Math.round((b.min[1] + b.max[1]) / 2), b.max[2] - PLAN_LAMP_DROP], { brightness: LAMP_BRIGHTNESS, color: [255, 240, 220] }));
      report.facts.push(`floorplan: ${large.length} lamps under the ceilings of its largest open spaces (give lights of your own to place them)`);
    }
  }
  const rock = carve([...boxes, ...holes], wall, themeNames);
  brushes.unshift(...rock);
  brushes.push(...linings);
  brushes.push(...thresholds.map((t) => box(t.min, t.max, themeNames.floor)));
  if (high) {
    // a baseboard along every wall of a room under a roof, broken by its ways through and their casings
    for (const room of rooms.values()) {
      if (room.spec.sky || room.spec.place?.in && !room.spec.place?.stand) continue;
      const [x0, y0, z0] = room.min;
      const [x1, y1] = room.max;
      const d = TRIM.baseDeep;
      let strips = [
        { min: [x0, y0, z0], max: [x0 + d, y1, z0 + TRIM.base] },
        { min: [x1 - d, y0, z0], max: [x1, y1, z0 + TRIM.base] },
        { min: [x0, y0, z0], max: [x1, y0 + d, z0 + TRIM.base] },
        { min: [x0, y1 - d, z0], max: [x1, y1, z0 + TRIM.base] },
      ];
      for (const hole of holes) {
        const cut = { min: hole.min.map((v) => v - TRIM.casing - d), max: hole.max.map((v) => v + TRIM.casing + d) };
        strips = strips.flatMap((strip) => subtract(strip, cut));
      }
      trims.push(...strips.filter((b) => b.max.every((v, k) => v - b.min[k] > 0.4)).map((b) => box(b.min, b.max, textureOf("trim"))));
    }
    if (trims.length) {
      // drawn and not solid, as a thin trim is in Valve's maps: a baseboard takes no room from a narrow one
      entities.push(brushEntity("func_illusionary", trims, {}));
      report.facts.push(`fidelity high: ${trims.length} pieces of trim (baseboards, casings round ${holes.length} ways, sills)`);
    }
  }
  // ── a room framed as Valve frames its own (FRAME): bands, ribs, beams, cut corners, frames round its ways ──
  const framing = [];
  const framedCount = { bands: 0, ribs: 0, beams: 0, corners: 0, frames: 0 };
  // the framing's texture: the spec's own word for it (dado, cornice, frame), else its trim when it names one, else
  // dark steel plate: the theme's dark wood trim, a house's, framed the original mod's pumping station in timber
  materials.framing ??= { base: "metal", tone: [0.33, 0.32, 0.3] };
  const ownTrim = spec.theme?.trim !== undefined || spec.textures?.trim !== undefined;
  const trimOf = (word) => textureOf(materials[word] !== undefined && word !== "trim" ? word : ownTrim ? "trim" : "framing");
  /** a hole grown by its frame: what a band stops short of, and what a rib or a cut corner keeps clear of */
  const keepClear = (hole, f) => ({ min: hole.min.map((v, k) => v - (k === 2 ? 0 : f.jamb + f.proud)), max: hole.max.map((v, k) => v + (k === 2 ? f.jamb : f.jamb + f.proud)) });
  const touches = (a, b) => [0, 1, 2].every((k) => a.min[k] < b.max[k] && b.min[k] < a.max[k]);
  for (const room of rooms.values()) {
    const f = frameOf(room);
    if (!f || room.spec.sky || (room.spec.place?.in && !room.spec.place?.stand)) continue;
    const [x0, y0, z0] = room.min;
    const [x1, y1, z1] = room.max;
    const wide = Math.min(x1 - x0, y1 - y0) >= FRAME_ROOM_LEAST;
    const clear = holes.map((hole) => keepClear(hole, f)).filter((c) => touches(c, { min: [x0 - 1, y0 - 1, z0 - 1], max: [x1 + 1, y1 + 1, z1 + 1] }));
    const kept = (piece) => !clear.some((c) => touches(c, piece));
    // each wall: the axis it faces along, the face's place, which way into the room, its extent along
    const walls = [
      { axis: 0, at: x0, into: 1, along: 1, a0: y0, a1: y1 },
      { axis: 0, at: x1, into: -1, along: 1, a0: y0, a1: y1 },
      { axis: 1, at: y0, into: 1, along: 0, a0: x0, a1: x1 },
      { axis: 1, at: y1, into: -1, along: 0, a0: x0, a1: x1 },
    ];
    const slab = (wall, a0, a1, zlo, zhi, deep) => {
      const min = [0, 0, zlo];
      const max = [0, 0, zhi];
      [min[wall.along], max[wall.along]] = [a0, a1];
      [min[wall.axis], max[wall.axis]] = wall.into > 0 ? [wall.at, wall.at + deep] : [wall.at - deep, wall.at];
      return { min, max };
    };
    const c = wide && f.chamfer > 0 && Math.min(x1 - x0, y1 - y0) >= 4 * f.chamfer ? f.chamfer : 0;
    for (const wall of walls) {
      // the bands, broken where a way and its frame go through
      for (const [zlo, zhi, word] of bandsOf(room) ? [] : [[z0, z0 + f.dado, "dado"], [z1 - f.cornice, z1, "cornice"]]) {
        if (!(zhi - zlo > 0.5) || zhi - zlo >= (z1 - z0) / 2) continue;
        let strips = [slab(wall, wall.a0 + c, wall.a1 - c, zlo, zhi, f.proud)];
        for (const cut of clear) strips = strips.flatMap((strip) => subtract(strip, cut));
        for (const strip of strips.filter((b) => b.max.every((v, k) => v - b.min[k] > 0.4))) {
          framing.push(box(strip.min, strip.max, trimOf(word)));
          framedCount.bands++;
        }
      }
      // ribs along a long wall, clear of its ways
      const length = wall.a1 - wall.a0;
      if (wide && f.ribs > 0 && length >= 2 * f.ribs) {
        const n = Math.floor(length / f.ribs);
        for (let k = 1; k < n; k++) {
          const mid = wall.a0 + (length * k) / n;
          const rib = slab(wall, mid - f.rib[0] / 2, mid + f.rib[0] / 2, z0, z1, f.rib[1]);
          if (!kept(rib)) continue;
          // in a banded room the rib stands on the wall's base band, as Valve's pilasters stand on their skirting
          const foot = bandsOf(room)?.[0];
          if (foot && foot.wall !== bandsOf(room)[1].wall && foot.z1 - rib.min[2] > 0.5) {
            framing.push(box(rib.min, [rib.max[0], rib.max[1], foot.z1], foot.wall));
            framing.push(box([rib.min[0], rib.min[1], foot.z1], rib.max, trimOf("frame")));
          } else framing.push(box(rib.min, rib.max, trimOf("frame")));
          framedCount.ribs++;
        }
      }
    }
    // beams across the shorter way of a wide room, over every way's head and a player's
    const tallest = Math.max(z0, ...clear.map((cl) => cl.max[2]));
    if (wide && f.beams > 0 && z1 - f.beam[1] >= Math.max(z0 + PASSABLE_HIGH + 16, tallest)) {
      const along = x1 - x0 >= y1 - y0 ? 0 : 1;
      const [a0, a1] = along === 0 ? [x0, x1] : [y0, y1];
      const n = Math.floor((a1 - a0) / f.beams);
      for (let k = 1; k < n; k++) {
        const mid = a0 + ((a1 - a0) * k) / n;
        const min = [x0, y0, z1 - f.beam[1]];
        const max = [x1, y1, z1];
        [min[along], max[along]] = [mid - f.beam[0] / 2, mid + f.beam[0] / 2];
        framing.push(box(min, max, trimOf("frame")));
        framedCount.beams++;
      }
    }
    // the corners cut at 45 degrees, floor to ceiling, unless a way is at the corner
    if (c > 0)
      for (const [cx, cy, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) {
        const corner = { min: [Math.min(cx, cx + sx * c), Math.min(cy, cy + sy * c), z0], max: [Math.max(cx, cx + sx * c), Math.max(cy, cy + sy * c), z1] };
        if (!kept(corner)) continue;
        // its outline anticlockwise seen from above, as a prism's faces are made
        const outline = [[cx, cy], [cx + sx * c, cy], [cx, cy + sy * c]];
        if (sx * sy < 0) outline.reverse();
        framing.push(prism("z", outline, z0, z1, trimOf("frame")));
        framedCount.corners++;
      }
    // the silhouette broken (frame.breaks): round pillars in its corners, coves under its ceiling, a pipe run
    if (f.breaks && wide) {
      const broken = breaksOf(room, f.breaks, { kept, chamfer: c, beamDeep: f.beams > 0 ? f.beam[1] : 0, textureOf: (word) => (word === "pipe" ? textureOf("pipe") : trimOf("frame")) });
      framing.push(...broken.brushes);
      for (const [k, n] of Object.entries(broken.counts)) framedCount[k] = (framedCount[k] ?? 0) + n;
    }
  }
  // a frame round each way through a framed room: jambs either side and a lintel over, `proud` off each face
  for (const way of frameWays) {
    const f = [...rooms.values()].filter((room) => touches(keepClear(way.hole, frameOf(room) ?? FRAME), { min: room.min, max: room.max })).map(frameOf).find(Boolean);
    if (!f) continue;
    const { hole, axis, along, kind, lo, hi, ceiling } = way;
    const [w0, w1, zb, zt] = [hole.min[along], hole.max[along], hole.min[2], hole.max[2]];
    for (const [face, out] of [[hole.min[axis], -1], [hole.max[axis], 1]]) {
      const piece = (a0, a1, zlo, zhi) => {
        const [b0, b1, top] = [Math.max(lo, a0), Math.min(hi, a1), Math.min(ceiling, zhi)];
        if (b1 - b0 < 0.5 || top - zlo < 0.5) return;
        const min = [0, 0, zlo];
        const max = [0, 0, top];
        [min[along], max[along]] = [b0, b1];
        [min[axis], max[axis]] = out < 0 ? [face - f.proud * 2, face] : [face, face + f.proud * 2];
        framing.push(box(min, max, trimOf("frame")));
        framedCount.frames++;
      };
      piece(w0 - f.jamb, w0, zb, zt + f.jamb);
      piece(w1, w1 + f.jamb, zb, zt + f.jamb);
      piece(w0 - f.jamb, w1 + f.jamb, zt, zt + f.jamb);
      if (kind === "window") piece(w0 - f.jamb, w1 + f.jamb, zb - f.jamb, zb);
    }
  }
  if (bandedCount.rooms) report.facts.push(`frame: the walls of ${bandedCount.rooms} rooms banded on their own faces, ${bandedCount.joins} joins in all (${[...bandsDone].filter(([, b]) => b).slice(0, 4).map(([id, b]) => `${id}: ${b.map((band) => `${band.wall} to ${Math.round(band.z1 - b[0].z0)}`).join(", ")}`).join("; ")})`);
  if (framing.length) {
    entities.push(brushEntity("func_detail", framing, {}));
    report.facts.push(`frame: ${framing.length} brushes (${Object.entries(framedCount).filter(([, n]) => n).map(([k, n]) => `${n} ${k}`).join(", ")}) in ${[...rooms.values()].filter(frameOf).length} rooms`);
  }
  // ── buildings standing in the open: a shell round their rooms, `wall` thick out from each room's face,
  // from the open room's floor to over the top room, its outside of the building's own material, and a roof
  const carvedOf = new Map([...rooms.values()].map((room, k) => [room.id, boxes[k]]));
  /** each building's block, by the open room it stands in: what is put in that room must stand clear of it */
  const standing = [];
  for (const id of new Set([...rooms.values()].filter((room) => room.building).map((room) => room.building))) {
    const own = [...rooms.values()].filter((room) => room.building === id);
    const root = rooms.get(id);
    const host = rooms.get(root.host);
    const asked = root.spec.building ?? {};
    const lo = [0, 1, 2].map((k) => Math.min(...own.map((room) => room.min[k])));
    const hi = [0, 1, 2].map((k) => Math.max(...own.map((room) => room.max[k])));
    const block = { min: [lo[0] - wall, lo[1] - wall, host.min[2]], max: [hi[0] + wall, hi[1] + wall, hi[2] + wall] };
    if (block.min[0] < host.min[0] || block.min[1] < host.min[1] || block.max[0] > host.max[0] || block.max[1] > host.max[1])
      errors.push(`rooms ${id}: the building's walls (${block.min.slice(0, 2).join(" ")} to ${block.max.slice(0, 2).join(" ")}) reach out of ${host.id}`);
    standing.push({ id, host: host.id, min: block.min, max: block.max });
    let pieces = [block];
    for (const cut of [...own.map((room) => carvedOf.get(room.id)), ...holes]) pieces = pieces.flatMap((piece) => subtract(piece, cut));
    const outer = textureOf(asked.walls ?? "outside");
    // a word of the theme told as the material it is: "roof" is shingles unless the theme says otherwise
    const wordOf = (word) => (typeof materials[word] === "string" ? materials[word] : materials[word]?.base ?? word);
    brushes.push(...pieces.map((piece) => box(piece.min, piece.max, outer)));
    // a gable over the longer side, overhanging; or flat (`roof: false`)
    const roof = asked.roof === false ? null : { pitch: 30, overhang: 12, material: "roof", ...(asked.roof ?? {}) };
    if (roof) {
      const over = roof.overhang;
      const ridgeAlongX = block.max[0] - block.min[0] >= block.max[1] - block.min[1];
      const span = ridgeAlongX ? block.max[1] - block.min[1] : block.max[0] - block.min[0];
      const rise = snap(Math.tan((roof.pitch * Math.PI) / 180) * (span / 2 + over), 4);
      const top = block.max[2];
      const material = textureOf(roof.material);
      const min = [block.min[0] - over, block.min[1] - over, top];
      const max = [block.max[0] + over, block.max[1] + over, top + rise];
      const k = ridgeAlongX ? 1 : 0;
      const middle = (min[k] + max[k]) / 2;
      const lowHalf = { min: [...min], max: [...max] };
      const highHalf = { min: [...min], max: [...max] };
      lowHalf.max[k] = middle;
      highHalf.min[k] = middle;
      brushes.push(wedge(lowHalf.min, lowHalf.max, ridgeAlongX ? "+y" : "+x", material), wedge(highHalf.min, highHalf.max, ridgeAlongX ? "-y" : "-x", material));
      if (top + rise > host.max[2]) errors.push(`rooms ${id}: the roof's ridge at ${top + rise} is over ${host.id}'s sky at ${host.max[2]}`);
    }
    report.facts.push(`building ${id}: ${own.map((room) => room.id).join(", ")}, standing in ${host.id}, its outside ${wordOf(asked.walls ?? "outside")}${roof ? `, a gable roof of ${wordOf(roof.material)}` : ""}`);
  }

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
        const room = rooms.get(thing.room) ?? (thing.room === "plan" && floorPlan ? planRoom(floorPlan, thing.at, thing.layer ?? 0, thing.height) : undefined);
        const own = printOf(thing);
        const xy = thing.at && typeof thing.at === "object" && !Array.isArray(thing.at) ? besideOf(thing.at, own) : pointIn(room, thing.at);
        // a kit model put in for boxes (fidelity high) is moved back into the room by what it reaches past a wall:
        // the boxes were sized by the maker, the model by the kit
        if (thing.fit)
          for (const k of [0, 1]) xy[k] += Math.max(0, room.min[k] - (xy[k] + own.min[k])) - Math.max(0, xy[k] + own.max[k] - room.max[k]);
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
          // nor into a building that stands in its room (a bush put inside the house it was to stand by)
          for (const block of standing.filter((b) => b.host === room.id)) {
            const over = [0, 1].map((k) => Math.min(xy[k] + own.max[k], block.max[k]) - Math.max(xy[k] + own.min[k], block.min[k]));
            if (over.every((v) => v > INTO_WALL))
              report.faults.push(`${what}[${i}] (${thing.prefab ?? thing.model ?? "box"}) stands ${Math.round(Math.min(...over))} into the building ${block.id} in ${room.id} (its walls from ${block.min.slice(0, 2).join(" ")} to ${block.max.slice(0, 2).join(" ")}): move it out`);
          }
        }
        // what was put where, under a name that stays the same from build to build: its kind and what it is,
        // with its count among those (the second table of the room)
        const name = thing.prefab ?? thing.model ?? thing.class ?? (thing.box ? `box ${thing.box.join("x")}` : what);
        // (not its id: giving a thing an id, to put another beside it, is no change to the thing)
        const key = `${what} ${name} #${(counted[`${what} ${name}`] = (counted[`${what} ${name}`] ?? 0) + 1)}`;
        report.placed.push({ key, id: thing.id, what, index: i, name, room: room.id, at: [Math.round(xy[0]), Math.round(xy[1]), Math.round(room.min[2] + (thing.z ?? 0))], turn: thing.rotate ?? thing.facing ?? 0 });
        each(thing, room, [xy[0], xy[1], room.min[2] + (thing.z ?? 0)], i);
      } catch (error) {
        errors.push(`${what}[${i}]: ${error.message}`);
      }
    });

  // furniture: brush prefabs, or plain boxes
  const prefabs = { ...(spec.prefabs ?? {}) };
  // a texture a prefab's .map names, as the word of the spec it was made from: SM_FURNITURE is "furniture"
  const wordOfTexture = new Map([...Object.keys(materials), ...Object.keys(MATERIALS)].flatMap((word) => [[textureName(word), word], [textureName(word, false, true), word]]));
  // a prefab's brushes go into the world, or into a brush entity when it says so (a crate that breaks, a
  // pane of glass, detail that should not cut the world: func_breakable, func_wall, func_illusionary...)
  // furniture is func_detail unless told (`as: "world"`, or an entity of its own): it then cuts no portal, and
  // a map of furnished rooms is seen through in hundredths of a second where it took minutes (measured:
  // research/compiler-features.md). It seals nothing, which furniture inside a carved room never has to
  const detailed = (thing, prefab) => {
    const asked = thing?.as ?? prefab.as ?? (spec.detail === false ? "world" : "detail");
    return asked === "detail" ? { class: "func_detail" } : null;
  };
  let prefabsPut = 0;
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
    prefabsPut += 1;
    const placed = prefabFromMap(resolve(folder ?? ".", prefab.file), at, quarters, prefabsPut);
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
          piece.box ?? piece.wedge ?? piece.prism?.outline ?? (piece.cylinder ? [[piece.cylinder.centre[0] - piece.cylinder.radius, piece.cylinder.centre[1] - piece.cylinder.radius], [piece.cylinder.centre[0] + piece.cylinder.radius, piece.cylinder.centre[1] + piece.cylinder.radius]] : []),
        );
    return { min: [0, 1].map((k) => Math.min(...points.map((p) => p[k]))), max: [0, 1].map((k) => Math.max(...points.map((p) => p[k]))) };
  };
  /** each piece's bottom and top, in the prefab's own space */
  const prefabHeights = (prefab) =>
    prefab.file
      ? [readMap(readFileSync(resolve(folder ?? ".", prefab.file), "utf8")).brushes.flatMap((b) => shapeOf(b).corners.map((c) => c[2]))].map((z) => [Math.min(...z), Math.max(...z)])
      : prefab.pieces.map((piece) => {
          const box = piece.box ?? piece.wedge;
          if (box) return [Math.min(box[0][2], box[1][2]), Math.max(box[0][2], box[1][2])];
          const solid = piece.cylinder ?? piece.prism;
          return [solid?.from ?? 0, solid?.to ?? PLAYER.high];
        });
  /**
   * The ways through (doors, openings) a piece of furniture at `at` stands in front of: where it overlaps the floor
   * kept clear each side of one, between a step over its floor and a player's head. A flight whose every rise is
   * a step (steps up to a door) is walked over, and is in no way.
   */
  const inTheWay = (prefab, own, at) =>
    ways.filter((way) => {
      const over = [0, 1].map((k) => Math.min(at[k] + own.max[k], way.max[k]) - Math.max(at[k] + own.min[k], way.min[k]));
      if (!over.every((v) => v > INTO_WALL)) return false;
      const pieces = prefabHeights(prefab).map(([lo, hi]) => [at[2] + lo - way.z0, at[2] + hi - way.z0]);
      const standing = pieces.filter(([lo, hi]) => hi > STEP && lo < (way.high ?? PLAYER.high));
      if (!standing.length) return false;
      const tops = [...new Set(pieces.map(([, hi]) => hi).filter((hi) => hi > 0))].sort((a, b) => a - b);
      return !tops.every((top, k) => top - (tops[k - 1] ?? 0) <= STEP);
    });
  /** the widest stretch across a way that nothing in front of it stands in */
  const freeAcross = (way) => {
    const [lo, hi] = [way.min[way.along], way.max[way.along]];
    const taken = way.in.map((t) => [Math.max(lo, t.min[way.along]), Math.min(hi, t.max[way.along])]).sort((a, b) => a[0] - b[0]);
    let widest = 0;
    let from = lo;
    for (const [a, b] of taken) {
      widest = Math.max(widest, a - from);
      from = Math.max(from, b);
    }
    return Math.max(widest, hi - from);
  };
  /** every piece of furniture's box in the map, and its room: none may float */
  const furniturePieces = [];
  /** what stands in each room (props, prefabs): where to look at it from */
  const propsAt = [];
  const putFurniture = (thing, room, at, i) => {
      const prefab = prefabOf(thing);
      // a texture with holes ({: a mesh, a fence, or a game's grate) has them only on a brush entity in render mode 4
      const holed = (prefab.pieces ?? []).some((piece) => textureOf(piece.texture ?? "furniture").startsWith("{"));
      const seeThrough = holed ? { class: "func_wall", rendermode: 4, renderamt: 255 } : null;
      putPrefab(prefab, at, Math.round((thing.rotate ?? 0) / 90), `furniture[${i}]`, thing.entity ?? prefab.entity ?? seeThrough ?? detailed(thing, prefab));
      // nor in front of a door or an opening, where a player steps through
      const own = turnedPrint(prefabPrint(prefab), 90 * Math.round((thing.rotate ?? 0) / 90));
      for (const way of inTheWay(prefab, own, at))
        way.in.push({ name: `furniture[${i}] (${thing.prefab ?? "box"})`, min: [at[0] + own.min[0], at[1] + own.min[1]], max: [at[0] + own.max[0], at[1] + own.max[1]] });
      // a prefab is looked at as a prop is (a slab or a line on the floor is not: it is the floor)
      if (thing.prefab) propsAt.push({ room: room.id, at, half: 32 });
      const heights = prefabHeights(prefab);
      furniturePieces.push({ name: `furniture[${i}] (${thing.prefab ?? "box"})`, room, min: [at[0] + own.min[0], at[1] + own.min[1], at[2] + Math.min(...heights.map((h) => h[0]))], max: [at[0] + own.max[0], at[1] + own.max[1], at[2] + Math.max(...heights.map((h) => h[1]))] });
    };
  const furniturePrint = (thing) => turnedPrint(prefabPrint(prefabOf(thing)), 90 * Math.round((thing.rotate ?? 0) / 90));
  place(spec.furniture, "furniture", putFurniture, furniturePrint);
  // a room dressed for its use (src/spec/dress.mjs): its pieces placed clear of every way, of the landmark and of
  // what the spec put there, as the spec's own furniture is
  if ((spec.rooms ?? []).some((room) => room?.use)) {
    const dressed = dressRooms({
      rooms: [...rooms.values()].filter((room) => !room.sliver).map((room) => ({ id: room.id, min: room.min, max: room.max, spec: room.spec })),
      ways,
      taken: furniturePieces.map((p) => ({ min: [p.min[0], p.min[1]], max: [p.max[0], p.max[1]] })),
      seed: [...String(spec.name ?? "map")].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7),
    });
    Object.assign(prefabs, dressed.prefabs);
    const before = (spec.furniture ?? []).length;
    place(dressed.furniture, "dressing", (thing, room, at, i) => putFurniture(thing, room, at, before + i), furniturePrint);
    report.facts.push(`dressed by use: ${dressed.facts.join("; ")}`);
  }
  // ladders, as Valve's maps make them: a func_ladder to climb (the game draws it not) and over it the rungs a
  // player sees, a func_wall in render mode 4 wearing a texture with holes ({LADDER1 when the game's .wad is
  // there): a ladder in a texture without holes reads as a vent (Steven's play-test of frenzy_pictures)
  (spec.ladders ?? []).forEach((given, i) => {
    const room = rooms.get(given?.room);
    const side = SIDE_AXES[given?.side];
    if (!room || !side) {
      errors.push(`ladders[${i}]: { room, side: north | south | east | west, along (0 to 1), width, height }`);
      return;
    }
    let rungs;
    try {
      rungs = catalog.some((t) => t.name.toUpperCase() === "{LADDER1") ? fromWads("ladder", { texture: "{LADDER1" }) : textureOf("mesh");
    } catch (error) {
      errors.push(`ladders[${i}]: ${error.message}`);
      return;
    }
    const across = side.axis === 0 ? 1 : 0;
    const width = given.width ?? LADDER.width;
    const middle = room.min[across] + (room.max[across] - room.min[across]) * (given.along ?? 0.5);
    const min = [0, 0, room.min[2]];
    const max = [0, 0, Math.min(room.max[2], room.min[2] + (given.height ?? room.max[2] - room.min[2]))];
    min[across] = Math.round(middle - width / 2);
    max[across] = min[across] + width;
    if (side.sign > 0) [min[side.axis], max[side.axis]] = [room.max[side.axis] - LADDER.depth, room.max[side.axis]];
    else [min[side.axis], max[side.axis]] = [room.min[side.axis], room.min[side.axis] + LADDER.depth];
    entities.push(brushEntity("func_ladder", [box(min, max, fitted(rungs, min, max, { whole: false }))], {}));
    entities.push(brushEntity("func_wall", [box(min, max, fitted(rungs, min, max, { whole: false }))], { rendermode: 4, renderamt: 255 }));
    furniturePieces.push({ name: `ladders[${i}]`, room, min, max });
    report.facts.push(`ladders[${i}]: against ${room.id}'s ${given.side} wall, ${width} wide, ${max[2] - min[2]} high, its rungs ${rungs}`);
  });
  // nothing floats: a piece rests on its room's floor, stands against a wall, hangs from the ceiling, or touches a
  // piece that does (Steven's play-test of frenzy_words: "everything is floating everywhere")
  {
    const touches = (a, b) => [0, 1, 2].every((k) => a.min[k] <= b.max[k] + TOUCH && b.min[k] <= a.max[k] + TOUCH);
    // a building standing in the room is wall too: a sign on a shop's front is held by it
    const onBuilding = ({ room, min, max }) => standing.some((b) => b.host === room.id && [0, 1].every((k) => min[k] <= b.max[k] + TOUCH && b.min[k] <= max[k] + TOUCH));
    const onRoom = (piece) => {
      const { room, min, max } = piece;
      return min[2] <= room.min[2] + TOUCH || max[2] >= room.max[2] - TOUCH || [0, 1].some((k) => min[k] <= room.min[k] + TOUCH || max[k] >= room.max[k] - TOUCH) || onBuilding(piece);
    };
    const held = new Set(furniturePieces.filter(onRoom));
    for (let grew = true; grew; ) {
      grew = false;
      for (const piece of furniturePieces) if (!held.has(piece) && [...held].some((other) => touches(piece, other))) (held.add(piece), (grew = true));
    }
    const floating = furniturePieces.filter((piece) => !held.has(piece));
    // a piece set on others, not on the floor or a wall, stands on how much of its footprint: one on an edge or
    // a corner of what is under it, or hanging half off it, reads as a mistake (Steven's play-test of
    // frenzy_pictures: walls "not connected to the floor at all, or if they are it's by vertex and not by face")
    const area = (p) => (p.max[0] - p.min[0]) * (p.max[1] - p.min[1]);
    const overhung = [];
    for (const piece of furniturePieces) {
      if (!held.has(piece) || piece.min[2] <= piece.room.min[2] + TOUCH) continue;
      if ([0, 1].some((k) => piece.min[k] <= piece.room.min[k] + TOUCH || piece.max[k] >= piece.room.max[k] - TOUCH) || onBuilding(piece)) continue;
      const under = furniturePieces.filter((o) => o !== piece && Math.abs(o.max[2] - piece.min[2]) <= TOUCH);
      if (!under.length) continue;
      const shared = under.reduce((sum, o) => sum + Math.max(0, Math.min(piece.max[0], o.max[0]) - Math.max(piece.min[0], o.min[0])) * Math.max(0, Math.min(piece.max[1], o.max[1]) - Math.max(piece.min[1], o.min[1])), 0);
      const share = Math.min(1, shared / Math.max(1, area(piece)));
      if (share < OVERHANG) overhung.push({ piece, share });
    }
    if (overhung.length)
      warnings.push(`${overhung.length} pieces of furniture stand on ${overhung.some((o) => o.share < 0.05) ? "an edge or a corner of what is under them, or " : ""}under half their footprint: ${overhung.slice(0, 8).map(({ piece, share }) => `${piece.name} on ${Math.round(share * 100)}%`).join("; ")}: line each up with what holds it, unless it is meant to overhang (a shelf, a balcony)`);
    if (floating.length)
      report.faults.push(`${floating.length} pieces of furniture float, touching no floor, wall, ceiling or other piece: ${floating.slice(0, 8).map((p) => `${p.name} in ${p.room.id}, ${Math.round(p.min[2] - p.room.min[2])} over its floor`).join("; ")}: rest each on the floor, against a wall, under the ceiling, or on another piece`);
  }
  // a way through keeps a stretch a player passes at ease clear in front of it (a wide one may have a hedge by it)
  for (const way of ways) {
    if (!way.in.length) continue;
    const free = freeAcross(way);
    const wanted = Math.min(way.least, way.max[way.along] - way.min[way.along]);
    if (free < wanted)
      report.faults.push(`${way.in.map((t) => t.name).join(", ")} ${way.in.length > 1 ? "stand" : "stands"} ${way.kind === "stairs" ? "on or at the foot of the stairs of" : "in front of"} links[${way.link}]${way.kind === "stairs" ? "" : `, ${way.kind === "opening" ? "an" : "a"} ${way.kind}`}, leaving ${Math.round(free)} of ${way.kind === "stairs" ? "them" : "it"} free (a player passes at ease at ${wanted}; ${way.kind === "stairs" ? `the stairs and the floor ${CLEAR} deep at their foot` : `the floor ${CLEAR} deep each side`}, from ${way.min.join(" ")} to ${way.max.join(" ")}, ${way.kind === "stairs" ? "are" : "is"} kept clear): move ${way.in.length > 1 ? "them" : "it"} out of the way`);
  }
  // a building's rooms with nothing in them: a house is lived in (Haiku's Kaupo had no furniture at all, and the
  // report never said so). Corridors and open rooms may be bare, as Valve's are
  const holds = new Set([...(spec.furniture ?? []), ...(spec.props ?? []), ...(spec.entities ?? [])].filter((t) => !/^light/.test(t.class ?? "")).map((t) => t.room));
  const across = (room) => [room.max[0] - room.min[0], room.max[1] - room.min[1]].sort((p, q) => p - q);
  // a corridor (three times as long as it is wide or more) and a cupboard may be bare
  const bare = [...rooms.values()].filter((room) => room.building && !holds.has(room.id) && across(room)[0] >= ROOM_LEAST && across(room)[1] < 3 * across(room)[0]);
  if (bare.length) warnings.push(`${bare.length} rooms of a building have nothing in them: ${bare.map((room) => room.id).join(", ")}: furnish each as the person's words or pictures say (props of the kit's furniture, "kit:bed"), or leave it bare on purpose`);
  // furniture of boxes named for a thing the kit furnishes as a model: Kaupo's bathroom was a toilet, a tub and a
  // sink of boxes, read as blocks (Steven's walk). Its name, or its last word, is the kit's or a common other name
  const kitFor = kitOf;
  const boxed = new Map();
  for (const thing of spec.furniture ?? []) {
    const kit = thing.prefab && !prefabOf(thing).file ? kitFor(thing.prefab) : null;
    if (kit) boxed.set(thing.prefab, { kit, count: (boxed.get(thing.prefab)?.count ?? 0) + 1 });
  }
  if (boxed.size)
    warnings.push(`${[...boxed.values()].reduce((a, b) => a + b.count, 0)} pieces of furniture are boxes where the kit has a model: ${[...boxed.entries()].map(([name, { kit, count }]) => `${name}${count > 1 ? ` (${count})` : ""} as kit:${kit}`).join(", ")}: boxes read as blocks; put the kit's in as props (\`"model": "kit:${[...boxed.values()][0].kit}"\`), unless the boxes are meant`);
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

  // models built from their specs, and put in as props: in models/<map>/, so that the map's own go into a mod's
  // folder beside the .bsp without crowding the game's models/
  mkdirSync(join(out, "models", spec.name), { recursive: true });
  const modelFiles = {};
  const modelHeights = {};
  /** each model's footprint in its own space, for `beside` */
  const modelPrints = {};
  const gallery = [];
  // the kit's own furniture (kits/furniture/<name>.json), named by a prop as "kit:<name>", is built as the map's
  const kitModels = {};
  for (const [i, thing] of (spec.props ?? []).entries()) {
    if (typeof thing?.model !== "string" || !thing.model.startsWith("kit:")) continue;
    const name = thing.model.slice(4);
    const file = join(KIT_FURNITURE, `${name}.json`);
    if (!/^[a-z0-9_]+$/.test(name) || !existsSync(file)) {
      errors.push(`props[${i}].model: "${thing.model}" is none of the kit's furniture (${readdirSync(KIT_FURNITURE).map((f) => `kit:${f.replace(/\.json$/, "")}`).join(", ")})`);
      continue;
    }
    kitModels[kitKey(thing.model)] = { file };
  }
  for (const [modelName, given] of Object.entries({ ...(spec.models ?? {}), ...kitModels })) {
    const modelSpec = given.file ? JSON.parse(readFileSync(resolve(folder ?? ".", given.file), "utf8")) : given;
    // a model spec's pictures (its materials' photographs) are beside its own file: the kit's furniture's in
    // kits/furniture/photos; one written in the map spec reads them as the map's do
    const own = given.file ? dirname(resolve(folder ?? ".", given.file)) : folder;
    const built = buildModelSpec({ ...modelSpec, name: `${modelName}.mdl` }, { folder: own, ...(given.file ? {} : { readPicture }) });
    if (!built.mdl || !built.report.ok) {
      errors.push(`models.${modelName}: ${[...built.report.errors, ...built.report.faults].join("; ")}`);
      continue;
    }
    const file = join(out, "models", spec.name, `${modelName}.mdl`);
    writeFileSync(file, built.mdl);
    files[`model ${modelName}`] = file;
    modelFiles[modelName] = `models/${spec.name}/${modelName}.mdl`;
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
  place(
    spec.props,
    "props",
    (thing, room, at) => {
      const key = kitKey(thing.model);
      propsAt.push({ room: room.id, at, half: modelHeights[key] ? modelHeights[key] / 2 : 16 });
      const model = modelFiles[key] ?? thing.model;
      entities.push(pointEntity(thing.class ?? "cycler_sprite", at, { model, angles: [0, yawOf(room, thing.facing, at), 0], ...(thing.keys ?? {}) }));
      // a model is walked through in the game: furniture of the kit's, or a prop that says `solid: true`, is
      // given a CLIP box of its footprint and height, which stops a body and draws nothing
      if (thing.solid ?? String(thing.model).startsWith("kit:")) {
        const own = turnedPrint(modelPrints[key] ?? { min: [-16, -16], max: [16, 16] }, isNumber(thing.facing) ? thing.facing : FACINGS[thing.facing] ?? 0);
        const min = [at[0] + own.min[0], at[1] + own.min[1], at[2]];
        const max = [at[0] + own.max[0], at[1] + own.max[1], at[2] + (modelHeights[key] ?? 32)];
        brushes.push(box(min, max, "CLIP"));
        furniturePieces.push({ name: `props (${thing.model})`, room, min, max });
      }
    },
    // a prop's footprint: its model's, turned as it faces (a facing that names a room counts as unturned)
    (thing) => turnedPrint(modelPrints[kitKey(thing.model)] ?? { min: [-16, -16], max: [16, 16] }, isNumber(thing.facing) ? thing.facing : FACINGS[thing.facing] ?? 0),
  );
  // a lamp is never in mid-air: one that hangs below the ceiling gets a shade over it and a rod up to the ceiling
  // (Steven's play-test: "random lights in the middle of the air"; src/maps/sweep.mjs finds them in any map)
  // in a framed room with fixtures, a light under the ceiling is in a panel of glass that glows (a texture light, as
  // Valve lights its rooms), and a hung lamp's shade glows: a light with nothing about it read as "lights in the air"
  let fixtures = 0;
  // composed light: a dimmed lamp's fixture glows dim too (its own glass, a fifth of the glow): a texture light
  // at full glow over every lamp lit the floor even whatever the lamps' own light did
  const fixtureOf = (dim) => {
    if (!dim) return textureOf("fixture");
    const glass = materialOf(materials.fixture, "fixture");
    materials.fixture_dim ??= { ...(typeof materials.fixture === "object" ? materials.fixture : {}), base: glass.base ?? "glass", tone: glass.tone.map((v) => v * 0.6), flags: ["fullbright"], glow: Math.round((materials.fixture?.glow ?? GLOW) / 5) };
    return textureOf("fixture_dim");
  };
  const hang = (room, [x, y, z], { dim = false } = {}) => {
    const lit = frameOf(room)?.fixtures && !room.spec.sky;
    if (lit && room.max[2] - z <= LAMP_UNDER + 8) {
      fixtures++;
      entities.push(brushEntity("func_detail", [box([x - 16, y - 8, room.max[2] - 2], [x + 16, y + 8, room.max[2]], fixtureOf(dim))], {}));
      return;
    }
    if (room.max[2] - z <= LAMP_UNDER + 8 || room.spec.sky) return;
    if (lit) fixtures++;
    const shade = box([x - 6, y - 6, z + 4], [x + 6, y + 6, z + 8], lit ? fixtureOf(dim) : textureOf("furniture"));
    const rod = box([x - 1, y - 1, z + 8], [x + 1, y + 1, room.max[2]], textureOf("furniture"));
    entities.push(brushEntity("func_detail", [shade, rod], {}));
  };
  // the entities
  const entityLamps = new Map();
  const entityDimmed = { count: 0 };
  place(spec.entities, "entities", (thing, room, at) => {
    const yaw = yawOf(room, thing.facing, at);
    const keys = { ...(thing.keys ?? {}) };
    if (thing.id) keys.targetname = thing.id;
    if (/^info_player_/.test(thing.class)) {
      const start = playerStart(at, yaw, thing.class);
      Object.assign(start, keys);
      entities.push(start);
    } else if (GLOWS.includes(thing.class)) {
      // a glow a player sees is on what it shines from: within GLOW_REACH of a surface of its room or of furniture
      const p = [at[0], at[1], at[2]];
      const toRoom = Math.min(...[0, 1, 2].flatMap((k) => [p[k] - room.min[k], room.max[k] - p[k]]));
      const toPiece = Math.min(Infinity, ...furniturePieces.map((b) => Math.hypot(...[0, 1, 2].map((k) => Math.max(b.min[k] - p[k], 0, p[k] - b.max[k])))));
      if (Math.min(toRoom, toPiece) > GLOW_REACH)
        report.faults.push(`entities: ${thing.class} at ${p.map(Math.round).join(" ")} in ${room.id} hangs in the air, ${Math.round(Math.min(toRoom, toPiece))} from anything: put it on the lamp or the wall it shines from`);
      entities.push(pointEntity(thing.class, p, { angles: [0, yaw, 0], ...keys }));
    } else if (thing.class === "light") {
      // composed: the spec's own lamps as the rooms' (a lamp in each `rhythm` of a room dimmed, the goal's brighter)
      let dimmedLamp = false;
      if (composed) {
        const n = (entityLamps.get(room.id) ?? 0) + 1;
        entityLamps.set(room.id, n);
        const given = keys._light === undefined ? null : (Array.isArray(keys._light) ? keys._light : String(keys._light).trim().split(/\s+/)).map(Number);
        const lit = Number(keys.brightness ?? given?.[3] ?? LAMP_BRIGHTNESS);
        let brightness = lit;
        if (composed.rhythm >= 2 && n % composed.rhythm === 0) (brightness *= composed.dim), entityDimmed.count++, (dimmedLamp = true);
        if (composed.goalRoom === room.id) brightness *= composed.goal;
        if (brightness !== lit) {
          // a lamp given as `_light` "r g b brightness" keeps its colour: the brightness is changed in it
          if (keys._light !== undefined) {
            const parts = (Array.isArray(keys._light) ? keys._light : String(keys._light).trim().split(/\s+/)).map(Number);
            keys._light = [...parts.slice(0, 3), Math.round(brightness)];
          } else keys.brightness = Math.round(brightness);
        }
        if (composed.fade > 0 && keys._fade === undefined) keys._fade = composed.fade;
      }
      entities.push(light([at[0], at[1], at[2] + (thing.height ?? 96)], keys));
      hang(room, [at[0], at[1], at[2] + (thing.height ?? 96)], { dim: dimmedLamp });
    }
    else entities.push(pointEntity(thing.class, at, { angles: [0, yaw, 0], ...keys }));
  });
  // sounds: each made into sound/<map>/ beside the map and played where it is put by an ambient_generic: its
  // volume, how far it is heard, and looped or not as the file is (a loop is a file with a cue point)
  const AMBIENT_RADIUS = { everywhere: 1, small: 2, medium: 4, large: 8 };
  for (const [n, given] of (spec.sounds ?? []).entries()) {
    const sound = given.spec?.file ? JSON.parse(readFileSync(resolve(folder ?? ".", given.spec.file), "utf8")) : given.spec;
    if (!sound) {
      errors.push(`sounds[${n}]: { spec: <a sound spec, or { file }>, room, at, z, volume (1 to 10), radius: everywhere | small | medium | large }`);
      continue;
    }
    const built = buildSoundSpec(sound, { games: [wads].flat() });
    for (const line of [...built.report.errors, ...built.report.faults]) errors.push(`sounds[${n}]: ${line}`);
    report.facts.push(...built.report.facts.filter((line) => /against the game's|Hz \d+-bit|: attack /.test(line)).map((line) => `sound ${line}`));
    for (const file of built.files) {
      const path = join(out ?? ".", "sound", spec.name, file.name);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, file.bytes);
      files[`sound ${file.name}`] = path;
    }
    const radius = AMBIENT_RADIUS[given.radius ?? "medium"];
    if (!radius) errors.push(`sounds[${n}].radius: ${Object.keys(AMBIENT_RADIUS).join(", ")}`);
    place([{ ...given, class: "ambient_generic" }], "sounds", (thing, room, at) => {
      const name = `${spec.name}/${sound.name ?? sound.sounds?.[0]?.name}`;
      entities.push(pointEntity("ambient_generic", [at[0], at[1], at[2] + (given.z ?? 48)], { message: name, health: given.volume ?? 10, pitch: 100, pitchstart: 100, spawnflags: (radius ?? 4) | (sound.loop ? 0 : 32) }));
      report.facts.push(`sounds[${n}]: ${name} plays in ${room.id}${sound.loop ? ", looped" : " once (not looped)"}, heard ${given.radius ?? "medium"}`);
    });
  }
  // music: the game's CD tracks (media/<name>.mp3, a music spec with `track` makes one), started as the map
  // begins (a trigger_auto firing a target_cdaudio) or as a player walks into a room (a trigger_cdaudio over its
  // floor), or stopped (track -1). The SDK's entities play for the first player only, and once
  for (const [n, given] of (spec.music ?? []).entries()) {
    const track = given.stop ? -1 : given.track;
    if (!given.stop && !(Number.isInteger(track) && track >= 2 && track <= 27)) {
      errors.push(`music[${n}].track: the CD track to play, 2 to 27 (or stop: true)`);
      continue;
    }
    const said = given.stop ? "stops the music" : `plays track ${track} (media/${TRACKS[track - 2]}.mp3)`;
    if (given.when === "start" || given.when === undefined) {
      const name = `music${n}`;
      const first = [...rooms.values()][0];
      const at = [(first.min[0] + first.max[0]) / 2, (first.min[1] + first.max[1]) / 2, first.min[2] + 16];
      entities.push(pointEntity("trigger_auto", at, { target: name, delay: given.delay ?? 1, spawnflags: 1 }));
      entities.push(pointEntity("target_cdaudio", [at[0] + 16, at[1], at[2]], { targetname: name, health: track, radius: 0 }));
      report.facts.push(`music[${n}]: ${said} as the map begins`);
    } else if (typeof given.when?.enter === "string") {
      const room = rooms.get(given.when.enter);
      if (!room) {
        errors.push(`music[${n}].when.enter: a room's id, not ${given.when.enter}`);
        continue;
      }
      entities.push(brushEntity("trigger_cdaudio", [box([room.min[0] + 1, room.min[1] + 1, room.min[2]], [room.max[0] - 1, room.max[1] - 1, room.min[2] + PLAYER.high], "AAATRIGGER")], { health: track }));
      report.facts.push(`music[${n}]: ${said} when a player first walks into ${room.id}`);
    } else errors.push(`music[${n}].when: "start", or { enter: <a room's id> }`);
  }
  if (spec.music?.length) report.facts.push("music: trigger_cdaudio and target_cdaudio play for the first player only (the SDK sends cd play to client 1), and each fires once: a multiplayer mod needs its own way to play music");

  // light: each room that asks lamps by its floor's area, a sun for rooms under the sky
  let sunny = false;
  const composedCount = { dimmed: 0, spills: 0 };
  for (const room of rooms.values()) {
    const asked = room.spec.light ?? (room.spec.sky ? "none" : "auto");
    if (room.spec.sky) sunny = true;
    if (asked === "none") continue;
    const options = typeof asked === "object" ? asked : {};
    const size = [room.max[0] - room.min[0], room.max[1] - room.min[1]];
    const count = options.count ?? Math.max(1, Math.round((size[0] * size[1]) / (high ? LAMP_AREA_HIGH : LAMP_AREA)));
    const across = Math.max(1, Math.round(Math.sqrt((count * size[0]) / size[1])));
    const down = Math.ceil(count / across);
    for (let i = 0; i < count; i++) {
      const cx = room.min[0] + (size[0] * ((i % across) + 0.5)) / across;
      const cy = room.min[1] + (size[1] * (Math.floor(i / across) + 0.5)) / down;
      // hung under the ceiling, but no higher than LAMP_HIGHEST over the floor: in a tall room it lights the floor.
      // Over a flight of stairs its shade clears a head on the top tread, or it is at the ceiling with none: hung by
      // the room's floor, a lamp halfway up a stair of 256 shut the way (the original mod's maker, 2026-10-17)
      const over = flights.filter((f) => cx + 6 > f.min[0] && cx - 6 < f.max[0] && cy + 6 > f.min[1] && cy - 6 < f.max[1] && f.top > room.min[2]);
      const clear = Math.max(room.min[2] + LAMP_HIGHEST, ...over.map((f) => f.top + PLAYER.high - 4));
      const lampZ = Math.min(room.max[2] - LAMP_UNDER, clear);
      // composed: a lamp in each `rhythm` dimmed, the goal room's brighter, each pooling under itself
      let brightness = options.brightness ?? LAMP_BRIGHTNESS;
      const keys = {};
      let dim = false;
      if (composed) {
        if (composed.rhythm >= 2 && count >= 2 && i % composed.rhythm === composed.rhythm - 1) (brightness *= composed.dim), composedCount.dimmed++, (dim = true);
        if (composed.goalRoom === room.id) brightness *= composed.goal;
        if (composed.fade > 0) keys._fade = composed.fade;
      }
      entities.push(light([Math.round(cx), Math.round(cy), lampZ], { brightness: Math.round(brightness), color: options.color ?? [255, 240, 220], ...keys }));
      hang(room, [Math.round(cx), Math.round(cy), lampZ], { dim });
    }
    // a framed room's fill: a weak light low over its floor, so that a lower floor is not left black
    const fill = frameOf(room)?.fill;
    if (fill > 0) entities.push(light([Math.round((room.min[0] + room.max[0]) / 2), Math.round((room.min[1] + room.max[1]) / 2), room.min[2] + 48], { brightness: fill, color: [200, 205, 215] }));
  }
  if (fixtures) report.facts.push(`frame: ${fixtures} lamps in fixtures that glow (a texture light each)`);
  // composed: a weak light in each way through, under its head, so a doorway spills light into the room beyond
  if (composed?.spill > 0)
    for (const way of frameWays) {
      const { hole } = way;
      if (hole.max[2] - hole.min[2] < PASSABLE_HIGH) continue;
      entities.push(light([Math.round((hole.min[0] + hole.max[0]) / 2), Math.round((hole.min[1] + hole.max[1]) / 2), Math.round(hole.max[2] - 12)], { brightness: composed.spill, color: [255, 236, 210], ...(composed.fade > 0 ? { _fade: composed.fade } : {}) }));
      composedCount.spills++;
    }
  composedCount.dimmed += entityDimmed.count;
  if (composed) report.facts.push(`lighting: composed: ${composedCount.dimmed} lamps dimmed to ${composed.dim} (one in ${composed.rhythm}), ${composedCount.spills} doorways spilling light, each lamp's light falling off ${composed.fade} times sooner${composed.goalRoom ? `, ${composed.goalRoom} lit ${composed.goal} times brighter` : ""}`);
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
  // a material's photograph is read once, from the spec's folder unless the build says how (the MCP's folders)
  const read = new Map();
  const readOnce = (name) => {
    if (!read.has(name)) read.set(name, (readPicture ?? ((file) => unpicture(readFileSync(resolve(folder ?? ".", file.replace(/^(work|models):/, ""))))))(name));
    return read.get(name);
  };
  let pictures;
  try {
    pictures = [...used.entries()].map(([key, material]) => ({ name: nameOfKey(key), image: surfacePicture(material, ...pictureSize(key, material), { readPicture: readOnce }), base: materialOf(material).base, filter: materialOf(material).filter }));
  } catch (error) {
    report.errors.push(`textures: ${error.message}`);
    return { report, files, map: null };
  }
  for (const p of pictures) for (const fact of p.image.facts ?? []) report.facts.push(`texture ${p.name}: ${fact}`);
  writeFileSync(wadFile, writeWad(pictures));
  // a picture flatter, brighter or more coloured than nine in ten of Valve's walls looks cheap in the game
  // a photograph laid as it is (literal) is the person's picture, not a surface to hold to Valve's
  const looks = lookSentence(pictures.filter((p) => !p.image.rgba && !UNWORN.has(p.base) && p.filter !== "literal").map((p) => ({ ...p, allow: ALLOWED[p.base] })), "of the map's own textures");
  if (looks) report.warnings.push(looks);
  const theirs = [...gameTextures.entries()].filter(([, file]) => ownWads.has(file));
  if (theirs.length) {
    const read = new Map();
    const named = theirs.map(([texture, file]) => {
      if (!read.has(file)) read.set(file, readWad(readFileSync(file)).textures);
      const t = read.get(file).find((x) => x.name.toLowerCase() === texture.toLowerCase());
      const rgb = new Uint8Array(t.width * t.height * 3);
      for (let i = 0; i < t.width * t.height; i++) rgb.set(t.palette.subarray(t.pixels[i] * 3, t.pixels[i] * 3 + 3), i * 3);
      return { name: `${texture} (${basename(file)})`, image: { width: t.width, height: t.height, rgb } };
    });
    const said = lookSentence(named.filter((n) => !/^[{!+~-]|^sky$/i.test(n.name)), "textures of the spec's own .wad files");
    if (said) report.warnings.push(said);
  }
  files.wad = wadFile;
  const gameWads = [...new Set(gameTextures.values())];
  // a sky of the map's own, made from its words, in gfx/env/<map>/ as its models are in models/<map>/; its sun where
  // the map's light comes from, and dark when the map is
  let skyname = spec.sky ?? "desert";
  if (spec.sky && typeof spec.sky === "object") {
    try {
      const sun = spec.sky.sun === false ? false : { ...Object.fromEntries(["yaw", "pitch"].filter((key) => spec.sun?.[key] !== undefined).map((key) => [key, spec.sun[key]])), ...(spec.sky.sun ?? {}) };
      const made = makeSky({ night: Boolean(spec.night), ...spec.sky, sun });
      skyname = `${name}/sky`;
      for (const file of skyFiles(skyname, made.sides)) {
        const path = join(out, file.name);
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, file.bytes);
        files[`sky ${basename(file.name)}`] = path;
      }
      report.facts.push(`sky: made, gfx/env/${skyname}*.tga (six sides of ${made.sides[0].width}), its mean colour ${made.mean.join(" ")}: copy gfx/env/${name}/ into the mod's gfx/env/`);
    } catch (error) {
      errors.push(error.message);
    }
  }
  // the landmark seen from each way into its room, on the map as laid out; an info_target named "landmark" at it,
  // which the views aim a camera at (src/maps/draw.mjs featureTargets), the judges' among them
  let landmarkSeen = null;
  if (focused.focus) {
    const laid = { worldspawn: {}, brushes, entities };
    const space = spaceOf(laid);
    const startAt = report.placed.find((p) => p.what === "entities" && /^info_player_(start|deathmatch)$/.test(p.name))?.at;
    const ways = frameWays.filter((w) => w.kind !== "window").map((w) => ({ name: `links[${w.link}]`, hole: w.hole, axis: w.axis }));
    landmarkSeen = focusSeen(focused.focus, { sees: (a, b) => space.sees(a, b), placed: report.placed, rooms, ways, start: startAt ? [startAt[0], startAt[1], startAt[2] + 64] : null });
    report.facts.push(...landmarkSeen.facts);
    warnings.push(...landmarkSeen.warnings);
    if (landmarkSeen.aim) entities.push(pointEntity("info_target", landmarkSeen.aim.map(Math.round), { targetname: "landmark" }));
  }
  const map = { worldspawn: { wad: [wadFile, ...gameWads], message: spec.note ?? name, skyname }, brushes, entities };
  const mapFile = join(out, `${name}.map`);
  writeFileSync(mapFile, writeMap(map));
  files.map = mapFile;
  report.facts.push(`${rooms.size} rooms, ${holes.length} ways through, ${brushes.length} brushes, ${entities.length} entities`);
  for (const room of rooms.values()) report.rooms[room.id] = { min: room.min, max: room.max };
  // the size the person asked for (its plan's longest side, and its shortest), held as a model's is: the rooms and
  // the rock round them, as the compiled map's world measures
  if (spec.size !== undefined && rooms.size) {
    const all = [...rooms.values()];
    const extent = [0, 1].map((k) => Math.max(...all.map((r) => r.max[k])) - Math.min(...all.map((r) => r.min[k])) + 2 * (spec.wall ?? 16)).sort((a, b) => b - a);
    const asked = typeof spec.size === "number" ? [spec.size] : Array.isArray(spec.size) ? [...spec.size].sort((a, b) => b - a) : [spec.size.length, spec.size.width].filter((v) => v !== undefined);
    const said = asked.map((v, i) => ({ v, m: extent[i], off: Math.abs(extent[i] / v - 1) }));
    const worst = said.reduce((a, b) => (b.off > a.off ? b : a));
    const line = `its plan is ${extent.map(Math.round).join(" by ")}, where the spec asks ${asked.join(" by ")}`;
    if (worst.off > MAP_SIZE_ERROR) report.faults.push(`size: ${line}: off by ${Math.round(worst.off * 100)}%. Make the rooms smaller or fewer, or larger`);
    else if (worst.off > MAP_SIZE_WARN) warnings.push(`size: ${line}: off by ${Math.round(worst.off * 100)}%`);
    else report.facts.push(`size: ${line}`);
  }

  // ── checked before any compile: the plan, and the walk ──
  const textures = [...[...used.keys()].map(nameOfKey), ...gameTextures.keys()];
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
  // every way a player walks through at ease: 32 is the player's own width, and the game may not let one by
  const tight = (walk.openings ?? []).filter((opening) => opening.width < PASSABLE.opening);
  if (tight.length)
    report.faults.push(`${tight.length} ways a player walks through are under ${PASSABLE.opening} wide (furniture, or walls, too close together): ${tight.slice(0, 6).map((o) => `${o.width} wide at ${o.at.map(Math.round).join(" ")}`).join("; ")}: move what narrows each`);
  // a room a way leads into whose floor is not walked anywhere is shut off: a fault (a house's doors that led
  // into walls passed as OK while only the middle was asked). Its middle alone not walked is furniture there
  const ledInto = new Set((spec.links ?? []).filter((link) => (link.kind ?? "opening") !== "window").flatMap((link) => link.between ?? []));
  for (const room of rooms.values()) {
    if (room.spec.walk === false) continue;
    const c = mid(room);
    if (walk.on(c[0], c[1], room.max[2]).walked) continue;
    let any = false;
    for (let x = room.min[0] + 16; x < room.max[0] - 15 && !any; x += 16)
      for (let y = room.min[1] + 16; y < room.max[1] - 15 && !any; y += 16) any = walk.on(x, y, room.max[2]).walked;
    if (!any && ledInto.has(room.id)) report.faults.push(`no floor of ${room.id} is walked to, though a way leads into it: the way is shut (a wall, a lining or furniture across it, or a step too high on the way); draw the plan with the walk on it (\`smak map-reach\`)`);
    else warnings.push(`the middle of ${room.id} is not walked to (furniture there, or the room is shut off)`);
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
    const result = compileMap(mapFile, { wads: [wadFile, ...gameWads], compilers: found, out: join(out, `${name}.bsp`), ...compileOptions(composed && spec.compile?.light?.bounce === undefined ? { ...(spec.compile ?? {}), light: { ...(spec.compile?.light ?? {}), bounce: composed.bounce } } : spec.compile) });
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
        // a room `in` another is part of it (a channel under water) and not held to the dark line; a room of a
        // building standing in another is a room of its own, and is
        const part = rooms.get(room.name)?.building ? null : rooms.get(room.name)?.spec.place?.in;
        if (room.dark && part) report.facts.push(`${room.name} (part of ${part}) has its floor lit ${Math.round(room.mean)}: not held to the dark line, being the floor of another room's part (under water, as a rule)`);
        // a room meant to be dark (`dark: true`: a cellar, a dim corridor the original has) is told, not faulted
        else if (room.dark && rooms.get(room.name)?.spec.dark === true) report.facts.push(`${room.name} is dark, as meant: its floor's light is ${Math.round(room.mean)} of 255`);
        else if (room.dark) report.faults.push(`${room.name} is dark: its floor's light is ${Math.round(room.mean)} of 255 (under ${24}); \`dark: true\` on a room meant to be so`);
      }
      // a map of a floor plan has no rooms to hold to the dark line: its areas and the plan as a whole are
      // held by the share of it that is dark, not its mean alone: frenzy's height-plan copy averaged 50 of 255 over the
      // floor outside its areas with 78% of that floor dark, and every view from its starts was black
      if (spec.floorplan) {
        const whole = bsp.models[0];
        const areas = spec.floorplan.areas ?? [];
        const boxes = areas.length ? {} : { plan: { min: whole.mins, max: whole.maxs } };
        areas.forEach((a, i) => (boxes[`floorplan.areas[${i}]`] = { min: [a.min[0], a.min[1], a.min[2] ?? whole.mins[2]], max: [a.max[0], a.max[1], a.max[2] ?? whole.maxs[2]] }));
        for (const room of lightReport(bsp, { rooms: boxes }).rooms) {
          const said = room.name === "plan" ? "the plan's floor" : room.name === "elsewhere" ? "the plan's floor outside its areas" : room.name;
          if (!room.area) {
            if (boxes[room.name]) report.warnings.push(`${said} covers none of the plan's floor: its box is not where the plan has floor (the legend's x0 and y1 place the pictures in the world)`);
            continue;
          }
          if (room.mean < 24 || room.darkShare > DARK_SHARE) report.faults.push(`${said} is dark: its floor's light is ${Math.round(room.mean)} of 255, ${Math.round(room.darkShare * 100)}% of it under 24. Light it (an area's light, lamps of its own: a lamp's brightness is ${LAMP_BRIGHTNESS})`);
          else report.facts.push(`${said}: its floor's light is ${Math.round(room.mean)} of 255, ${Math.round(room.darkShare * 100)}% of it dark`);
        }
      }
      const walked = reachOf(bsp);
      if (walked.unreached.length + walked.stuck.length) report.faults.push(...walked.warnings.map((line) => `walk of the compiled map: ${line}`));
      // what a player would find walking it: drops that hurt, lights in mid-air
      const swept = sweepOf(bsp, { reach: walked });
      report.facts.push(...swept.facts.map((line) => `sweep: ${line}`));
      if (swept.islands.length) report.faults.push(`sweep: ${swept.islands.length} pieces of solid touch nothing, floating in the air: ${swept.islands.slice(0, 4).map((i) => `${i.from.join(" ")} to ${i.to.join(" ")}`).join("; ")}: rest each on something, or take it out`);
      // its dressing beside Valve's own, measured: what a maker revising it is told (research/level-dressing.md)
      const dressed = dressingOf(bsp, { source: map, landmark: landmarkSeen && { name: focused.focus.name, room: focused.focus.room, seen: landmarkSeen.seen, of: landmarkSeen.of } });
      report.facts.push(...dressed.facts);
      warnings.push(...dressed.warnings);
      const seenFloating = swept.floating.filter((f) => f.seen);
      if (seenFloating.length) report.faults.push(`sweep: ${seenFloating.length} glows or sprites hang in the air with nothing within ${LIGHT_REACH} of them: put each on the lamp or the wall it shines from`);
      if (swept.drops.length) warnings.push(`sweep: ${swept.drops.length} places a player can step off and fall far enough to be hurt (more than ${SAFE_DROP}), the farthest ${swept.drops[0].fall} at ${swept.drops[0].at.join(" ")}: mean each, or rail it`);
      // a night map's sky drawn dark: without the game's own sky pictures the views fill it with a day's blue
      const drawing = { folders: [out, dirname(out), ...gameWads.map((file) => dirname(file))], models: true, ...(spec.night && typeof spec.sky !== "object" ? { sky: [10, 12, 22] } : {}) };
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
      // a map of a floor plan has no rooms to look across: its views are from its starts and its largest spaces
      save("views", views.length ? tile(views, Math.min(4, views.length), [...rooms.keys()]) : viewsOf(bsp, drawing));
      // views aimed at what the map has: its water, its largest standing piece, its lamps, its crowd, each storey
      const aimed = aimedStands(bsp, landmarkSeen ? { landmark: "landmark" } : {});
      if (aimed.length) save("features", viewsOf(bsp, { ...drawing, at: aimed, width: 320, height: 240 }));
      // each building from the open room it stands in, at a man's height, before its front: what no view of a
      // room shows (its walls, its roof, its door and windows)
      if (standing.length) {
        const fronted = standing.map((block) => {
          // from the corner of its open room on its front's side, a little over a man's height, looking at
          // its middle: two of its walls and its roof, as one sees a house from the street's corner
          const host = rooms.get(block.host);
          const side = SIDE_AXES[fronts.get(block.id) ?? "south"];
          const k = side.axis;
          const centre = [0, 1, 2].map((a) => (block.min[a] + block.max[a]) / 2);
          const from = [host.min[0] + 24, host.min[1] + 24, host.min[2] + 112];
          from[k] = side.sign > 0 ? host.max[k] - 24 : host.min[k] + 24;
          const yaw = Math.round((Math.atan2(centre[1] - from[1], centre[0] - from[0]) * 180) / Math.PI);
          const flat = Math.hypot(centre[0] - from[0], centre[1] - from[1]);
          const pitch = Math.round((Math.atan2(centre[2] - from[2], flat) * 180) / Math.PI);
          return drawMap(bsp, { ...drawing, from, yaw, pitch, width: 480, height: 300 });
        });
        save("buildings", tile(fronted, Math.min(2, fronted.length), standing.map((block) => `building ${block.id}`)));
      }
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
        save("props", stacked(looks, propRooms.map((room) => `${room.id}: what stands in it`)));
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

/**
 * The room a thing on a floor plan is in: centred on the world's origin, so that its `at` is the world's [x, y],
 * its floor the lowest floor of the plan's open space under that point (`z` is over it).
 */
/** A floor plan's open space this large (square units) or more gets a lamp, up to PLAN_LAMPS_MOST of the largest. */
const PLAN_LAMP_AREA = 128 * 128;
const PLAN_LAMPS_MOST = 24;
/** A floor plan's lamp hangs this far under the ceiling over it: against it, never in open air. */
const PLAN_LAMP_DROP = 8;

function planRoom(plan, at, layer = 0, height = undefined) {
  const [x, y] = Array.isArray(at) ? at : [0, 0];
  // the floors under the point, lowest first: `layer` picks one as the height plan numbers them (0 the lowest; past
  // the highest, the highest). Without it an entity on a gallery stood on the hall's floor under it (frenzy: 46
  // of 58 off, most of them upstairs)
  const floors = [...new Set(plan.boxes.filter((b) => x >= b.min[0] && x <= b.max[0] && y >= b.min[1] && y <= b.max[1]).map((b) => b.min[2]))].sort((p, q) => p - q);
  // or `height`, a height the plan gives it (its origin's): the highest floor at or under it, so that a weapon marked
  // at 176 stands on the ledge at 160 over the hall at 0
  const under = height === undefined ? [] : floors.filter((f) => f <= height + 1);
  const floor = under.length ? under[under.length - 1] : floors.length ? floors[Math.min(layer, floors.length - 1)] : 0;
  // and its ceiling: the top of the open space over that floor there (a lamp hangs its rod to it; at 4096 over the
  // floor, a maker's lamps ran rods to z 4100 and were taken out)
  const over = plan.boxes.filter((b) => x >= b.min[0] && x <= b.max[0] && y >= b.min[1] && y <= b.max[1] && b.min[2] <= floor + 1 && b.max[2] > floor);
  const ceiling = over.length ? Math.max(...over.map((b) => b.max[2])) : floor + 4096;
  const BIG = 1 << 16;
  return { id: "plan", min: [-BIG, -BIG, floor], max: [BIG, BIG, ceiling], spec: { id: "plan" } };
}
