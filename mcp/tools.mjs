// The tools the server offers, few on purpose. A client is sent every tool's description in every
// conversation, so each is a line or two; what an agent has to know to do the work is in the kit's guide,
// which the tool `guide` hands out a section at a time.
//
//   guide   the kit's guide and reference, by section
//   models  the files there are: models, maps and texture files
//   info    what is in a model, a map or a texture file
//   check   whether an engine will take a model or a map
//   render  a picture of a model or a map
//   build   a model or a map from a spec (docs/SPEC.md): what a person's words are turned into, built,
//           checked and drawn, with no code of the client's run
//   run     a script over the kit (see run.mjs): everything that makes or changes a model in other ways
//
// There is no tool for each thing the kit does (paint, turn, putBody...): those take functions, and a
// function is written in a script.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import * as smak from "../src/index.mjs";
import * as maps from "../src/maps/index.mjs";
import { text, image } from "./protocol.mjs";
import { filesUnder, pathOf } from "./folders.mjs";
import { guide } from "./guide.mjs";
import { buildModelSpec } from "../src/spec/model.mjs";
import { buildSoundSpec } from "../src/spec/sound.mjs";
import { buildMusicSpec } from "../src/spec/music.mjs";
import { buildWadSpec } from "../src/spec/wad.mjs";
import { buildSpriteSpec } from "../src/spec/sprite.mjs";
import { buildVideoSpec } from "../src/spec/video.mjs";
import { buildMapSpec } from "../src/spec/map.mjs";
import { summaryOf, changesOf } from "../src/spec/changes.mjs";
import { run, pictureWithin, TIMEOUT_SECONDS, OUTPUT_MOST, SHOWN_MOST, PICTURE_MOST } from "./run.mjs";
import { command } from "./command.mjs";
import { file } from "./file.mjs";
import { page } from "./page.mjs";
import { generate } from "./generate.mjs";
import { materials } from "./materials.mjs";

/** A picture's longer side in pixels when the call does not say: of one view, and of several in one. */
const SIZE_ONE = 512;
const SIZE_SEVERAL = 768;
/** How many pictures `sheet` puts in a row, and `strip` at most; how many moments `strip` draws unless told. */
const SHEET_COLUMNS = 3;
const STRIP_COLUMNS = 4;
const STRIP_COUNT = 8;
/** A first-person picture is this much as high as it is wide. */
const FIRST_PERSON_HEIGHT = 0.75;
/** `models` lists no more files than this of one folder. */
const LISTED_MOST = 200;
/** The files of the models folder that are listed: models, compiled maps, map source and texture files. */
const LISTED_KINDS = /\.(mdl|bsp|map|wad)$/i;
/** A map view is this much as high as it is wide; `views` puts this many in a row. */
const MAP_VIEW_HEIGHT = 0.75;
const MAP_VIEWS_COLUMNS = 4;
/** A map's picture is this many pixels on its longer side at the least. */
const MAP_SIZE_LEAST = 64;
/** `info` and a plan list no more entities than this unless asked for all (`full`). */
const ENTITIES_MOST = 40;
const isCompiledMap = (file) => /\.bsp$/i.test(file);
const isMapSource = (file) => /\.map$/i.test(file);
const isWad = (file) => /\.wad$/i.test(file);
/** The sides `render` knows by name: where the camera stands, [yaw, pitch] in degrees. */
const SIDES = {
  front: [0, 0],
  left: [90, 0],
  back: [180, 0],
  right: [270, 0],
  top: [0, 90],
  below: [0, -90],
  quarter: [35, 20],
};

/**
 * A model a client named, read; one whose textures are in the file beside it (<name>t.mdl) is read with
 * them. Returns { src, file }.
 */
function readModel(folders, name) {
  const file = pathOf(folders, name);
  return { src: smak.readStudio(file).src, file };
}

/** An animation as a call names it: "rest" is the bones at rest, digits a number, anything else a name. */
const seqOf = (src, seq) => {
  if (seq === undefined || seq === null) return smak.sequences(src).length ? 0 : null;
  if (seq === "rest") return null;
  return /^\d+$/.test(String(seq)) ? Number(seq) : seq;
};

// ── models ─────────────────────────────────────────────────────────────────
/**
 * The files of the two folders: every file of the work folder, and the models folder's models, maps and
 * texture files.
 */
function listModels(folders, { match } = {}) {
  const wanted = match ? String(match).toLowerCase() : "";
  const lines = [];
  const list = (title, folder, onlyModels) => {
    const files = filesUnder(folder).filter(
      (file) => (!onlyModels || LISTED_KINDS.test(file.name)) && file.name.toLowerCase().includes(wanted),
    );
    lines.push(`${title}: ${files.length} file${files.length === 1 ? "" : "s"}`);
    for (const file of files.slice(0, LISTED_MOST)) lines.push(`  ${file.name} ${file.bytes}`);
    if (files.length > LISTED_MOST)
      lines.push(`  and ${files.length - LISTED_MOST} more: narrow the list with \`match\``);
  };
  if (folders.models) list("models (read only; .mdl, .bsp, .map and .wad files)", folders.models, true);
  list("work", folders.work, false);
  return [text(lines.join("\n"))];
}

// ── info ───────────────────────────────────────────────────────────────────
/**
 * What is in a model, in few words: its bones (each with its parent's number), its bodies with their body
 * numbers, its textures and its animations. `full` adds where each bone is, the events and the attachments.
 */
function info(folders, { model, full = false, like, rect }) {
  // a game's .wad by its name (halflife.wad), from the game folders the server was given
  const inGame = /\.wad$/i.test(model) && !/[\\/:]/.test(model) ? (folders.wads ?? []).map((game) => join(game, model)).find((f) => existsSync(f)) : null;
  const named = inGame ?? pathOf(folders, model);
  if (isWad(named) && like) return wadMatch(folders, named, like, rect);
  if (isCompiledMap(named)) return mapInfo(named, full);
  if (isMapSource(named)) return sourceInfo(named);
  if (isWad(named)) return wadInfo(named);
  const { src, file } = readModel(folders, model);
  return [text(smak.modelInfoLines(src, smak.describeModel(src, file), { compact: true, full, name: basename(file) }).join("\n"))];
}

// ── info of a map ──────────────────────────────────────────────────────────
/**
 * What is in a compiled map, in few words: its size, its entities by class and one by one (the first
 * forty; `full`: all, with their keys, and each texture's share of the world), its textures and which are
 * wanted from .wad files, its light.
 */
function mapInfo(file, full) {
  const bytes = readFileSync(file);
  const bsp = maps.readBsp(bytes);
  return [text(maps.mapInfoLines(bsp, maps.describeMap(bsp, bytes, file), { compact: true, full, name: basename(file), most: ENTITIES_MOST }).join("\n"))];
}
/** What is in brush source: its brushes, its entities and the textures its faces name. */
function sourceInfo(file) {
  const map = maps.readMap(readFileSync(file, "utf8"));
  const names = new Set();
  const brushes = [...map.brushes.flat(), ...map.entities.flatMap((entity) => entity.brushes ?? [])];
  for (const brush of brushes) for (const face of brush.faces) names.add(face.texture);
  const placeOf = (entity) =>
    entity.brushes ? `${entity.brushes.length} brushes` : `at ${entity.origin ?? "no place"}`;
  const lines = [
    `${basename(file)}: brush source, ${map.brushes.flat().length} brushes of the world, ${map.entities.length} entities; wad: ${map.worldspawn.wad ?? "none"}`,
    ...map.entities.map((entity, index) => `  ${index + 1} ${entity.classname} ${placeOf(entity)}`),
    `TEXTURES named: ${[...names].sort().join(", ")}`,
  ];
  return [text(lines.join("\n"))];
}
/** The textures of a .wad file, each with its size. */
/**
 * The textures of a .wad most like a patch of a picture (a wall in a view of the original): ranked by their
 * colours with the brightness divided out (src/maps/match.mjs), and drawn beside the patch to be looked at.
 */
function wadMatch(folders, file, like, rect) {
  const picture = smak.unpicture(readFileSync(pathOf(folders, like)));
  const [x, y, w, h] = rect ?? [0, 0, picture.width, picture.height];
  const textures = maps.readWad(readFileSync(file)).textures;
  const found = maps.matchTextures(picture, [x, y, w, h], textures);
  const byName = new Map(textures.map((t) => [t.name, t]));
  const cell = 128;
  const square = (draw) => {
    const rgba = new Uint8Array(cell * cell * 4);
    for (let j = 0; j < cell; j++) for (let i = 0; i < cell; i++) rgba.set([...draw(i / cell, j / cell), 255], (j * cell + i) * 4);
    return { width: cell, height: cell, rgba };
  };
  const patch = square((u, v) => {
    const k = ((y + Math.floor(v * h)) * picture.width + x + Math.floor(u * w)) * 4;
    return [picture.rgba[k], picture.rgba[k + 1], picture.rgba[k + 2]];
  });
  const flat = (t) =>
    square((u, v) => {
      const p = t.pixels[Math.floor(v * t.height) * t.width + Math.floor(u * t.width)] * 3;
      return [t.palette[p], t.palette[p + 1], t.palette[p + 2]];
    });
  const sheet = smak.tile([patch, ...found.map((f) => flat(byName.get(f.name)))], 7, ["the patch", ...found.map((f) => f.name)]);
  return [
    text([`the textures of ${basename(file)} most like ${like} [${x}, ${y}, ${w}, ${h}], nearest first (by colour, its light divided out: look at them, the order is not a verdict):`, ...found.map((f, i) => `  ${i + 1}. ${f.name} ${f.width}x${f.height} (${f.distance})`)].join("\n")),
    image(smak.png(sheet.width, sheet.height, sheet.rgba)),
  ];
}

function wadInfo(file) {
  const read = maps.readWad(readFileSync(file));
  const listed = read.textures.map((texture) => `${texture.name} ${texture.width}x${texture.height}`);
  return [text(`${basename(file)}: ${read.textures.length} map textures: ${listed.join(", ")}`)];
}

// ── check ──────────────────────────────────────────────────────────────────
/** A list of entities as a call names them: "9, keeper" is entity 9 and the one named keeper. */
const namesOf = (value) =>
  value === undefined || value === null || value === ""
    ? undefined
    : String(value)
        .split(",")
        .map((word) => word.trim())
        .filter(Boolean)
        .map((word) => (/^\d+$/.test(word) ? Number(word) : word));

/** The walk test of a map, in lines: its facts, its openings, its warnings. */
function walkLines(map, args) {
  const reach = maps.reachOf(map, {
    to: namesOf(args.goal) ?? [],
    doors: args.doors ?? "open",
  });
  return [
    `the walk test, on a grid of ${reach.cell}:`,
    ...reach.facts,
    ...reach.openings
      .slice(0, ENTITIES_MOST)
      .map(
        (opening) =>
          `  opening ${opening.number} at ${opening.at.join(" ")}: ${opening.width} wide, ${opening.height === null ? "open above" : `${opening.height} high`}${opening.fits.large ? "" : " (closed to a large monster)"}`,
      ),
    ...reach.warnings.map((warning) => `WARN  ${warning}`),
  ];
}

/**
 * What a map's entities are checked against, from a call's `against`: files of the folders, with commas
 * between. An .fgd file and a file of learned definitions (`smak map-learn`) are entity definitions; another
 * .json file is a mod's profile, as data; `goldsrc` is the kit's own profile. A profile that is a module is
 * code, and is for the tool `run`.
 */
function againstMod(folders, file, args) {
  const against = {};
  const definitions = [];
  const names = String(args.against ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  for (const name of names) {
    if (name === "goldsrc") against.mod = { ...maps.GOLDSRC, folders: mapFolders(folders, file) };
    else if (/\.fgd$/i.test(name)) definitions.push(pathOf(folders, name));
    else if (/\.json$/i.test(name)) {
      const data = JSON.parse(readFileSync(pathOf(folders, name), "utf8"));
      // what was learned from a mod's maps has its classes; anything else is a profile
      if (data.classes && data.maps) definitions.push(data);
      else against.mod = data.folders?.length ? data : { ...data, folders: mapFolders(folders, file) };
    } else
      throw new Error(
        `against: ${name} is neither an .fgd file, a .json file (learned definitions, or a profile that is data) nor goldsrc. A profile that is a module (.mjs) is code: load it in a script, with the tool run (maps.loadMod)`,
      );
  }
  if (definitions.length) against.definitions = definitions;
  return against;
}

/**
 * What is wrong with brush source before any compile, as `checkPlan` finds it; with `walk`, the walk test
 * too.
 */
function checkSource(folders, file, args) {
  const map = maps.readMap(readFileSync(file, "utf8"));
  const report = maps.checkPlan(map, againstMod(folders, file, args));
  const lines = [
    ...report.facts,
    ...report.warnings.map((warning) => `WARN  ${warning}`),
    ...report.errors.map((error) => `ERROR ${error}`),
    report.errors.length
      ? `${report.errors.length} errors: fix them before compiling`
      : "no error in the plan",
    ...(args.walk ? walkLines(map, args) : []),
  ];
  return [text(lines.join("\n"))];
}

/** What an engine would refuse or draw wrong, as `smak check` and `smak map-check` print it. */
function check(folders, args) {
  const { model, engine = "goldsrc" } = args;
  const named = pathOf(folders, model);
  if (isMapSource(named)) return checkSource(folders, named, args);
  const report = isCompiledMap(named)
    ? maps.checkBsp(readFileSync(named), {
        engine,
        folders: mapFolders(folders, named),
        ...againstMod(folders, named, args),
      })
    : smak.check(readModel(folders, model).src, engine);
  const warned = report.warnings.length ? `, with ${report.warnings.length} warnings` : "";
  const verdict = report.errors.length
    ? `${report.errors.length} errors: not fit for ${engine}`
    : `fit for ${engine}${warned}`;
  const lines = [
    ...report.facts,
    ...report.warnings.map((warning) => `WARN  ${warning}`),
    ...report.errors.map((error) => `ERROR ${error}`),
    verdict,
    ...(args.walk && isCompiledMap(named) ? walkLines(maps.readBsp(readFileSync(named)), args) : []),
  ];
  return [text(lines.join("\n"))];
}

// ── render ─────────────────────────────────────────────────────────────────
/** The body numbers of a model, a line a bodypart: what is said when a body shows nothing. */
const bodyNumbers = (src) =>
  smak
    .readMdl(src)
    .bodyparts.map(
      (bodypart) =>
        `  ${bodypart.name}: ${bodypart.models.map((model, k) => `${k * bodypart.base}=${model.name}`).join(" ")}`,
    )
    .join("\n");

/** The four kinds of picture: each takes the model, the call's arguments and the size, and draws. */
const KINDS = {
  view: (src, args, size) => {
    const [yaw, pitch] = SIDES[args.side ?? "quarter"] ?? [];
    if (yaw === undefined) throw new Error(`side: one of ${Object.keys(SIDES).join(", ")}`);
    const first = args.first === true;
    return smak.render(src, {
      ...args.pose,
      view: first ? "first" : "orbit",
      yaw: args.yaw ?? yaw,
      pitch: args.pitch ?? pitch,
      dist: args.dist,
      zoom: args.zoom,
      width: size,
      height: first ? Math.round(size * FIRST_PERSON_HEIGHT) : size,
    });
  },
  sheet: (src, args, size) => smak.sheet(src, { ...args.pose, size: Math.floor(size / SHEET_COLUMNS) }),
  strip: (src, args, size) => {
    const count = args.count ?? STRIP_COUNT;
    const columns = Math.min(STRIP_COLUMNS, count);
    const side = Math.floor(size / columns);
    const first = args.first === true;
    return smak.strip(src, {
      ...args.pose,
      seq: args.pose.seq ?? 0,
      view: first ? "first" : "orbit",
      yaw: args.yaw,
      pitch: args.pitch,
      count,
      cols: columns,
      width: side,
      height: first ? Math.round(side * FIRST_PERSON_HEIGHT) : side,
    });
  },
  uv: (src, args, size) => {
    const which = /^\d+$/.test(String(args.texture ?? 0)) ? Number(args.texture ?? 0) : args.texture;
    const texture = smak.textureOf(src, which);
    const scale = Math.max(1, Math.floor(size / Math.max(texture.width, texture.height)));
    return smak.uvMap(src, which, { scale });
  },
};

// ── render, of a map ───────────────────────────────────────────────────────
/** Where a map's .wad files are looked for: beside it, then in the models folder. */
// the map's own folder, the models folder, and the game's folders the server was given (its .wad files)
const mapFolders = (folders, file) => [...smak.maps.mapOwnFolders(file), folders.models, ...(folders.wads ?? [])].filter(Boolean);

/** Where a map view is taken from, as a call says it: "x y z", or an entity's number or class. */
function standOf(map, at) {
  if (at === undefined || at === null || at === "") return {};
  const numbers = String(at)
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  if (numbers.length === 3 && numbers.every(Number.isFinite)) return { from: numbers };
  return maps.viewFrom(map, at);
}

/** A point of the plan as a call says it: "x y" (a third number is passed over). */
function planPoint(value, what) {
  const numbers = String(value ?? "")
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  if (numbers.length < 2 || !numbers.every(Number.isFinite))
    throw new Error(`${what}: a point of the plan, "x y", not ${value}`);
  return numbers.slice(0, 2);
}

/**
 * The kinds of picture of a map: each takes the map, whether it is source, the arguments and the size.
 */
const MAP_KINDS = {
  plan: (map, source, args, size) => {
    const options = {
      ...args.options,
      width: size,
      height: size,
      z: args.z ?? undefined,
      heights: args.heights === true,
      grid: args.grid,
      legend: args.legend === true,
      reach: args.reach === true ? true : undefined,
    };
    return source ? maps.planOfSource(map, options) : maps.planOf(map, options);
  },
  view: (map, source, args, size) => {
    const options = {
      ...args.options,
      ...standOf(map, args.at),
      width: size,
      height: Math.round(size * MAP_VIEW_HEIGHT),
    };
    if (args.yaw !== undefined) options.yaw = args.yaw;
    if (args.pitch !== undefined) options.pitch = args.pitch;
    return source ? maps.drawSource(map, options) : maps.drawMap(map, options);
  },
  views: (map, source, args, size) => {
    if (source) throw new Error("views: of a compiled map (.bsp); of source, kind view and plan");
    const side = Math.floor(size / MAP_VIEWS_COLUMNS);
    return maps.viewsOf(map, {
      ...args.options,
      count: args.count,
      width: side,
      height: Math.round(side * MAP_VIEW_HEIGHT),
      cols: MAP_VIEWS_COLUMNS,
    });
  },
  section: (map, source, args, size) =>
    maps.sectionOf(map, { from: planPoint(args.from, "from"), to: planPoint(args.to, "to"), width: size }),
  storeys: (map, source, args, size) => {
    const side = Math.max(MAP_SIZE_LEAST, Math.floor(size / 2));
    const reach = args.reach === true ? true : undefined;
    return maps.storeysOf(map, { ...args.options, width: side, height: side, cols: 2, reach });
  },
  openings: (map, source, args, size) => {
    const side = Math.floor(size / MAP_VIEWS_COLUMNS);
    return maps.openingViews(map, {
      ...args.options,
      count: args.count,
      width: side,
      height: Math.round(side * MAP_VIEW_HEIGHT),
      cols: MAP_VIEWS_COLUMNS,
    });
  },
};

/** What a map's picture shows, in lines: where it was taken from or how it lies, its marks, its notes. */
function mapShown(kind, facts, shrink) {
  const lines = [];
  if (kind === "plan") {
    const scale = (facts.scale * shrink).toFixed(3);
    const cut = facts.z === null ? "seen from above" : `cut at z ${facts.z}`;
    lines.push(
      `${cut}; +y up, +x right; a point (x, y) is at pixel ((x - ${Math.round(facts.x0)}) * ${scale}, (${Math.round(facts.y0)} - y) * ${scale})`,
    );
    for (const mark of facts.marks.slice(0, ENTITIES_MOST)) {
      const at = mark.at.map((value) => Math.round(value * shrink));
      lines.push(`  ${mark.number} ${mark.classname} ${mark.origin.join(" ")} at pixel ${at.join(",")}`);
    }
    if (facts.marks.length > ENTITIES_MOST)
      lines.push(`  and ${facts.marks.length - ENTITIES_MOST} more marks`);
  } else if (kind === "view") {
    lines.push(
      `from ${facts.from.join(" ")}, yaw ${facts.yaw}, pitch ${facts.pitch}; ${facts.faces} faces; light: ${facts.light}`,
    );
    for (const mark of facts.marked)
      lines.push(
        `  marked: ${mark.number} ${mark.classname}${mark.drawn === "mark" ? "" : `, its ${mark.drawn} ${mark.size}`}`,
      );
  } else if (kind === "section") {
    lines.push(
      `a section ${facts.length} units long from ${facts.from.join(" ")} (left) to ${facts.to.join(" ")} (right), heights ${facts.z.map(Math.round).join(" to ")}, seen looking yaw ${facts.looking}`,
    );
    for (const floor of facts.floors.filter((each) => each.to - each.from >= 16).slice(0, ENTITIES_MOST))
      lines.push(`  floor at z ${floor.z} from ${floor.from} to ${floor.to} along the line`);
    for (const mark of facts.marks.slice(0, ENTITIES_MOST))
      lines.push(`  ${mark.number} ${mark.classname} ${mark.along} along the line, z ${mark.z}`);
  } else if (kind === "storeys") {
    for (const storey of facts.storeys)
      lines.push(
        `  cut at z ${storey.z}${storey.floors ? `: floors from ${storey.floors[0]} to ${storey.floors[1]}` : ""}; ${storey.marks.length} entities`,
      );
  } else if (kind === "openings") {
    for (const view of facts.views)
      lines.push(
        `  opening ${view.opening}: ${view.wide} wide, ${view.high === null ? "open above" : `${view.high} high`}; from ${view.from.join(" ")} looking yaw ${view.yaw}`,
      );
  } else {
    lines.push(...facts.views.map((view) => `  ${view.name}, from ${view.from.join(" ")}`));
  }
  return [...lines, ...(facts.notes ?? [])];
}

/**
 * A picture of a map (.bsp) or of brush source (.map). `kind`: "plan" (unless told), "view", "views",
 * "section", "storeys" or "openings".
 */
function renderMap(folders, file, args) {
  const source = isMapSource(file);
  const map = source ? maps.readMap(readFileSync(file, "utf8")) : maps.readBsp(readFileSync(file));
  const kind = args.kind ?? "plan";
  if (!Object.hasOwn(MAP_KINDS, kind))
    throw new Error(`kind: for a map, one of ${Object.keys(MAP_KINDS).join(", ")}`);
  const asked = Math.round(args.size ?? (kind === "view" ? SIZE_ONE : SIZE_SEVERAL));
  const size = Math.min(PICTURE_MOST, Math.max(MAP_SIZE_LEAST, asked));
  const options = { folders: mapFolders(folders, file) };
  // a .wad of one's own: its textures stand in for those of the same names, wherever the map finds them
  if (args.wad) options.textures = smak.maps.readWad(readFileSync(pathOf(folders, args.wad))).textures;
  const picture = MAP_KINDS[kind](map, source, { ...args, options }, size);
  const bytes = pictureWithin(smak.png(picture.width, picture.height, picture.rgba));
  const drawn = smak.unpng(bytes);
  // a picture sent smaller than it was drawn has its marks at other pixels: they are said as sent
  const shown = mapShown(kind, picture.facts, drawn.width / picture.width);
  return [
    text(`${basename(file)} ${kind}: ${drawn.width}x${drawn.height}\n${shown.join("\n")}`),
    image(bytes),
  ];
}

/**
 * A picture of a model, with a line that says what it shows. `kind`: "view" (one side), "sheet" (six sides),
 * "strip" (an animation's frames) or "uv" (a texture with the triangles that wear it). `size` is the
 * picture's longer side in pixels.
 */
/** A picture written into the work folder under the name asked (`save`), its folders made: the bytes back. */
function saved(folders, args, bytes) {
  if (!args.save) return null;
  if (!/\.png$/i.test(args.save)) throw new Error("save: a .png file's name in the work folder (pictures/props.png)");
  const file = pathOf(folders, args.save, { write: true });
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, bytes);
  return `saved: work:${file.slice(folders.work.length + 1)}`;
}

function render(folders, args) {
  // several models side by side, each from the same quarter, named under it: a sheet to show a set
  if (Array.isArray(args.models) && args.models.length) {
    const size = Math.min(PICTURE_MOST, Math.max(64, Math.round(args.size ?? 320)));
    const shots = args.models.map((name) => {
      const { src } = readModel(folders, name);
      return smak.render(src, { seq: seqOf(src, args.seq), frame: 0, yaw: args.yaw ?? 35, pitch: args.pitch ?? 20, width: size, height: size });
    });
    const sheet = smak.tile(shots, Math.min(args.models.length, 4), args.models.map((name) => basename(name).replace(/\.mdl$/i, "")));
    const full = smak.png(sheet.width, sheet.height, sheet.rgba);
    const said = saved(folders, args, full);
    return [text(`${args.models.length} models side by side; ${sheet.width}x${sheet.height}${said ? `; ${said}` : ""}`), image(pictureWithin(full))];
  }
  const named = pathOf(folders, args.model);
  if (isCompiledMap(named) || isMapSource(named)) return renderMap(folders, named, args);
  const { src, file } = readModel(folders, args.model);
  const kind = args.kind ?? "view";
  if (kind === "gif") return renderGif(folders, src, file, args);
  if (!Object.hasOwn(KINDS, kind)) throw new Error(`kind: one of ${Object.keys(KINDS).join(", ")}, gif`);
  const size = Math.min(
    PICTURE_MOST,
    Math.max(1, Math.round(args.size ?? (kind === "view" || kind === "uv" ? SIZE_ONE : SIZE_SEVERAL))),
  );
  const pose = { seq: seqOf(src, args.seq), frame: args.frame ?? 0, body: args.body ?? 0 };
  if (kind !== "uv" && !smak.posed(src, pose).tris.length)
    throw new Error(`body ${pose.body} shows no triangles. Its body numbers:\n${bodyNumbers(src)}`);
  const picture = KINDS[kind](src, { ...args, pose }, size);
  const shown =
    kind === "uv"
      ? `${picture.texture.name} ${picture.texture.width}x${picture.texture.height} x${picture.scale}, ${picture.triangles} triangles of ${picture.meshes} meshes`
      : `body ${pose.body}, ${pose.seq === null ? "at rest" : `animation ${pose.seq}${kind === "strip" ? "" : ` frame ${pose.frame}`}`}`;
  const full = smak.png(picture.width, picture.height, picture.rgba);
  const said = saved(folders, args, full);
  const bytes = pictureWithin(full);
  const drawn = smak.unpng(bytes);
  return [text(`${basename(file)} ${kind}: ${shown}; ${drawn.width}x${drawn.height}${said ? `; ${said}` : ""}`), image(bytes)];
}

/**
 * An animation as a looping GIF in the work folder (`save`: a .gif name; unless told, <model>-<animation>.gif), or
 * with seq "all" every animation, each <model>-<nn>-<name>.gif in a folder (`save` a folder; unless told
 * <model>-gifs/). Each frame is labelled with its animation and frame. The picture sent back is a strip of the
 * first one's frames, since a GIF is not shown inline.
 */
function renderGif(folders, src, file, args) {
  const stem = basename(file).replace(/\.mdl$/i, "");
  const size = Math.min(PICTURE_MOST, Math.max(64, Math.round(args.size ?? 320)));
  const options = { width: size, height: size, body: args.body ?? 0, yaw: args.yaw ?? SIDES[args.side ?? "quarter"]?.[0], pitch: args.pitch ?? SIDES[args.side ?? "quarter"]?.[1], view: args.first ? "first" : args.view, ground: args.ground };
  const write = (name, bytes) => {
    const to = pathOf(folders, name, { write: true });
    mkdirSync(dirname(to), { recursive: true });
    writeFileSync(to, bytes);
    return `work:${to.slice(folders.work.length + 1)}`;
  };
  const all = String(args.seq ?? "") === "all";
  if (!all && args.save && !/\.gif$/i.test(args.save)) throw new Error("save: a .gif file's name in the work folder (pictures/run.gif)");
  const made = all
    ? smak.animationGifs(src, options).map((g) => ({ ...g, at: write(`${args.save ?? `${stem}-gifs`}/${stem}-${String(g.number).padStart(2, "0")}-${g.name}.gif`, g.bytes) }))
    : [smak.animationGif(src, { ...options, seq: seqOf(src, args.seq) ?? 0 })].map((g) => ({ ...g, at: write(args.save ?? `${stem}-${g.name}.gif`, g.bytes) }));
  const first = made[0];
  const preview = smak.strip(src, { ...options, seq: first.number, count: Math.min(STRIP_COUNT, first.frames), width: 240, height: 240 });
  return [
    text(`${basename(file)} gif: ${made.length} animation${made.length > 1 ? "s" : ""}, ${made.map((g) => `${g.name} (${g.frames} frames at ${g.fps.toFixed(1)} a second) ${g.at}`).join("; ")}. The picture is ${first.name}'s frames.`),
    image(pictureWithin(smak.png(preview.width, preview.height, preview.rgba))),
  ];
}

// ── build ──────────────────────────────────────────────────────────────────
/** A picture given as the person's drawing or reference, `height` pixels high: { width, height, rgba }. */
function scaledTo(picture, height) {
  const k = height / picture.height;
  const width = Math.max(1, Math.round(picture.width * k));
  const rgba = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const from = (Math.min(picture.height - 1, Math.floor(y / k)) * picture.width + Math.min(picture.width - 1, Math.floor(x / k))) * 4;
      rgba.set(picture.rgba.subarray(from, from + 4), (y * width + x) * 4);
    }
  return { width, height, rgba };
}
/** Two pictures side by side, the first scaled to the second's height: a drawing beside what was built. */
function besideOf(first, second) {
  const left = scaledTo(first, second.height);
  const width = left.width + 8 + second.width;
  const rgba = new Uint8Array(width * second.height * 4).fill(255);
  for (let y = 0; y < second.height; y++) {
    rgba.set(left.rgba.subarray(y * left.width * 4, (y + 1) * left.width * 4), y * width * 4);
    rgba.set(second.rgba.subarray(y * second.width * 4, (y + 1) * second.width * 4), (y * width + left.width + 8) * 4);
  }
  return { width, height: second.height, rgba };
}

/**
 * Against the last build of the same name in `folder`: what changed, as lines ("CHANGED ..."), and the new
 * summary kept for the next. A first build says nothing.
 */
function changedSince(folder, base, kind, spec, report) {
  const file = join(folder, `${base}.built.json`);
  const now = summaryOf(kind, spec, report);
  const before = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
  writeFileSync(file, `${JSON.stringify(now, null, 1)}\n`);
  if (!before || before.kind !== kind) return [];
  return changesOf(before, now).lines.map((line) => `CHANGED since the last build of ${base}: ${line}`);
}

/** A report as lines: its verdict first, then what is wrong, then what was found. */
function reportLines(report) {
  const lines = [report.ok ? "OK: built, and every check passed" : "NOT OK: fix what is below and build again"];
  for (const [label, list] of [["ERROR", report.errors], ["FAULT", report.faults], ["WARN", report.warnings], ["note", report.notes ?? []], ["fact", report.facts]])
    for (const line of list) lines.push(`${label}  ${line}`);
  if (report.parts && Object.keys(report.parts).length) {
    lines.push("PARTS: id, triangles, from x y z to x y z");
    for (const [id, part] of Object.entries(report.parts)) lines.push(`  ${id} ${part.tris} ${part.from.join(" ")} to ${part.to.join(" ")}`);
  }
  if (report.rooms && Object.keys(report.rooms).length) {
    lines.push("ROOMS: id, from x y z to x y z, floor light");
    for (const [id, room] of Object.entries(report.rooms)) lines.push(`  ${id} ${room.min.join(" ")} to ${room.max.join(" ")}${room.light === undefined ? "" : `, light ${room.light}`}`);
  }
  return lines;
}

/**
 * How a spec's picture is read by the MCP server: a path of the work or models folder ("work:refs/oak.jpg"), or one
 * beside the spec's own file; never a path outside them. PNG, BMP or JPEG.
 */
function pictureReader(folders, folder) {
  return (name) => {
    let path;
    try {
      path = pathOf(folders, name);
    } catch (error) {
      // beside the spec, as a path of the work folder
      const beside = folder && folders.work ? relative(folders.work, resolve(folder, name.replace(/^(work|models):/, ""))) : null;
      if (!beside || beside.startsWith("..")) throw error;
      path = pathOf(folders, `work:${beside}`);
    }
    return smak.unpicture(readFileSync(path));
  };
}

/**
 * A model or a map from a spec, written to the work folder with the spec beside it, and a report: whether
 * every check passed, what is wrong, what each part or room came to; with pictures. `reference`: a PNG of the
 * work or models folder (the person's drawing or picture) drawn beside the result.
 */
function build(folders, args) {
  const given = args.spec;
  const fromFile = typeof given === "string" && !given.trim().startsWith("{");
  const spec = typeof given === "string" ? JSON.parse(fromFile ? readFileSync(pathOf(folders, given), "utf8") : given) : given;
  const folder = fromFile ? dirname(pathOf(folders, given)) : folders.work;
  const reference = args.reference ? smak.unpicture(readFileSync(pathOf(folders, args.reference))) : null;
  const pictures = [];
  const show = (picture) => pictures.push(image(pictureWithin(smak.png(picture.width, picture.height, picture.rgba))));
  if (spec?.spec === "smak.map/1") {
    const name = spec.name ?? "specmap";
    const out = join(folders.work, name);
    mkdirSync(out, { recursive: true });
    writeFileSync(join(out, `${name}.spec.json`), `${JSON.stringify(spec, null, 2)}\n`);
    const { report, files } = buildMapSpec(spec, { out, compilers: folders.compilers, folder, fgd: folders.fgd ?? [], wads: folders.wads ?? [], readPicture: pictureReader(folders, folder), readFile: (name) => readFileSync(pathOf(folders, name)) });
    const paintedMap = paintedOnly(folders, spec);
    const lines = reportLines(report);
    if (report.rooms && Object.keys(report.rooms).length) lines.splice(1, 0, ...changedSince(out, name, "map", spec, report));
    if (paintedMap) lines.splice(1, 0, paintedMap);
    lines.push(`written: ${Object.values(files).map((file) => `work:${file.slice(folders.work.length + 1)}`).join(", ")}`);
    const plan = files.plan ?? files["plan-source"];
    if (plan) {
      const drawn = smak.unpng(readFileSync(plan));
      show(reference ? besideOf(reference, drawn) : drawn);
    }
    if (files.views) show(smak.unpng(readFileSync(files.views)));
    if (files.buildings) show(smak.unpng(readFileSync(files.buildings)));
    if (files["views-bright"]) show(smak.unpng(readFileSync(files["views-bright"])));
    if (files.sections) show(smak.unpng(readFileSync(files.sections)));
    if (files.props) show(smak.unpng(readFileSync(files.props)));
    if (files.models) show(smak.unpng(readFileSync(files.models)));
    return [text(lines.join("\n")), ...pictures];
  }
  if (spec?.spec === "smak.video/1") {
    // a video of the folders' models and maps: a contact sheet first (preview, unless told), the video when asked
    return buildVideoSpec(spec, {
      model: (name) => readModel(folders, name).src,
      map: (name) => readFileSync(pathOf(folders, name)),
      // the work folder too: a map built there wears its own .wad, which lies beside it
      folders: [folders.work, folders.models, ...(folders.wads ?? [])].filter(Boolean),
      preview: args.preview !== false,
    }).then(({ report, files }) => {
      const lines = reportLines(report);
      if (!report.ok && !files.sheet) return [text(lines.join("\n"))];
      mkdirSync(dirname(join(folders.work, `${spec.name}.spec.json`)), { recursive: true });
      writeFileSync(join(folders.work, `${spec.name}.spec.json`), `${JSON.stringify(spec, null, 2)}\n`);
      if (files.video) {
        const file = join(folders.work, `${spec.name}.${files.format}`);
        writeFileSync(file, files.video);
        lines.push(`written: work:${spec.name}.${files.format} (${(files.video.length / 1e6).toFixed(2)} MB)`);
      } else lines.push("a preview: look at the frames, then build again with preview: false to make the video");
      return [text(lines.join("\n")), image(pictureWithin(files.sheet))];
    });
  }
  if (spec?.spec === "smak.sprite/1") {
    // sprites: each under work:<its name> (sprites/...spr), with its contact sheet and an animated picture
    // a reference picture (the agent's input sheet) is read for its measures only, from the work or models folder
    const { report, files } = buildSpriteSpec(spec, { readPicture: (name) => smak.unpicture(readFileSync(pathOf(folders, name))) });
    const lines = reportLines(report);
    const first = spec.name ?? spec.sprites?.[0]?.name ?? "sprite";
    const base = first.replace(/\.spr$/i, "").replace(/[^\w-]+/g, "_");
    mkdirSync(folders.work, { recursive: true });
    writeFileSync(join(folders.work, `${base}.spec.json`), `${JSON.stringify(spec, null, 2)}\n`);
    for (const file of files) {
      const path = join(folders.work, file.name);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, file.bytes);
      writeFileSync(path.replace(/\.spr$/i, "-sheet.png"), file.sheet);
      writeFileSync(path.replace(/\.spr$/i, "-animated.png"), file.animation);
      show(file.sheetPicture);
    }
    if (files.length) lines.push(`written: ${files.map((f) => `work:${f.name} (with -sheet.png and -animated.png beside it)`).join(", ")}`);
    return [text(lines.join("\n")), ...pictures];
  }
  if (spec?.spec === "smak.wad/1") {
    // textures: the .wad and a sheet of them; with a map named, it drawn wearing them
    const out = join(folders.work, spec.name?.replace(/\.wad$/i, "") ?? "textures");
    const { report, files } = buildWadSpec(spec, { out, readPicture: pictureReader(folders, folder), readFile: (name) => readFileSync(pathOf(folders, name)) });
    const lines = reportLines(report);
    const painted = paintedOnly(folders, spec);
    if (painted) lines.splice(1, 0, painted);
    if (report.ok) {
      writeFileSync(join(out, `${basename(out)}.spec.json`), `${JSON.stringify(spec, null, 2)}\n`);
      lines.push(`written: ${Object.values(files).map((file) => `work:${file.slice(folders.work.length + 1)}`).join(", ")}`);
      show(smak.unpng(readFileSync(files.sheet)));
      if (spec.preview?.map) {
        const map = pathOf(folders, spec.preview.map);
        const bsp = smak.maps.readBsp(readFileSync(map));
        const views = smak.maps.viewsOf(bsp, { count: spec.preview.views ?? 6, folders: mapFolders(folders, map), textures: smak.maps.readWad(readFileSync(files.wad)).textures });
        show(views);
        const missing = views.facts?.missing ?? [];
        if (missing.length) lines.push(`the map wears textures this .wad does not have (drawn flat): ${missing.join(", ")}`);
        if (spec.preview.each) {
          // each texture of the spec on its own place in the map, from the camera and at the brightness the
          // reproduction test's judge uses: scale, turn and colour checked against a picture of the original's
          const wadTextures = smak.maps.readWad(readFileSync(files.wad)).textures;
          const mine = new Set(spec.textures.map((t) => t.name.toLowerCase()));
          const places = smak.maps.texturePlaces(bsp).filter((p) => mine.has(p.name.toLowerCase()));
          const shots = places.map((p) => smak.maps.placeView(bsp, p, { textures: wadTextures }));
          for (let i = 0; i < shots.length; i += 8)
            show(smak.tile(shots.slice(i, i + 8), 4, places.slice(i, i + 8).map((p) => p.name)));
          lines.push(`each texture where the map shows it best, at brightness ${smak.maps.PLACE_BRIGHTNESS} (a colour read off such a view is the paint times the face's light: material seen: { colour, light }):`);
          // what yours reads as there, the middle half of its view: set beside a colour read off a picture of the
          // original's place (a describer's "around RGB 25,27,30" is the wall as lit, not its paint)
          const middleOf = (shot) => {
            const sum = [0, 0, 0];
            let n = 0;
            for (let y = Math.floor(shot.height / 4); y < (3 * shot.height) / 4; y++)
              for (let x = Math.floor(shot.width / 4); x < (3 * shot.width) / 4; x++, n++) for (let c = 0; c < 3; c++) sum[c] += shot.rgba[(y * shot.width + x) * 4 + c];
            return sum.map((v) => Math.round(v / (n || 1)));
          };
          places.forEach((p, i) =>
            lines.push(`  ${p.name}: on a ${p.wall ? "wall" : "floor or ceiling"}, the view spans ${p.across} texels across, the picture's top turned ${p.turned} degrees from ${p.wall ? "up" : "north"}, light [${p.light.join(", ")}]${p.lit ? "" : " (unlit: black in any view)"}; yours reads as RGB ${middleOf(shots[i]).join(", ")} in the middle of that view`),
          );
          // a texture the map keeps inside itself is the one the game wears: a .wad does not replace it
          const kept = places.filter((p) => bsp.textures.some((t) => t.name.toLowerCase() === p.name.toLowerCase() && t.embedded && !t.absent)).map((p) => p.name);
          for (const name of kept) lines.push(`  the map keeps its own ${name} inside it: the game (and this view) wears that, not the .wad's. Only a recompile without it, or a map that names the .wad, wears yours`);
          const absent = spec.textures.filter((t) => !places.some((p) => p.name.toLowerCase() === t.name.toLowerCase())).map((t) => t.name);
          if (absent.length) lines.push(`  not on the map's world faces: ${absent.join(", ")}`);
        }
      }
    }
    return [text(lines.join("\n")), ...pictures];
  }
  if (spec?.spec === "smak.sound/1") {
    // sounds: each file under work:sound/, as the game's own folder has them; the picture of them all
    const { report, files, picture } = buildSoundSpec(spec, { games: folders.wads ?? [], readPicture: (name) => smak.unpicture(readFileSync(pathOf(folders, name))), readFile: (name) => readFileSync(pathOf(folders, name)) });
    const lines = reportLines(report);
    // made of layers alone where a generator could have given a recording: said where the agent reads, the report
    const layersOf = (s) => [...(s.layers ?? []), ...(s.sounds ?? []).flatMap((x) => x.layers ?? [])];
    const sound = folders.generators?.models.find((m) => m.kind === "sound" && m.default) ?? folders.generators?.models.find((m) => m.kind === "sound");
    if (sound && !layersOf(spec).some((l) => l.kind === "sample"))
      lines.splice(1, 0, `note  made of layers alone: this server makes recordings (the tool generate, ${sound.name}). A sound of a real thing (a hit, a shot, a step, a door, debris) begins best from one: generate { prompt, length, class, seeds: 6 }, then the nearest take as a layer { kind: "sample", file, from: "onset" }, shaped by the spec's filters, layers and finish (guide { doc: "spec", find: "From a recording" })`);
    // the spec kept beside what it made, as a model's and a map's are (named after its first sound)
    const first = spec.name ?? spec.sounds?.[0]?.name ?? "sound";
    const base = first.replace(/\.wav$/i, "").replace(/[^\w-]+/g, "_");
    mkdirSync(folders.work, { recursive: true });
    writeFileSync(join(folders.work, `${base}.spec.json`), `${JSON.stringify(spec, null, 2)}\n`);
    for (const file of files) {
      const path = join(folders.work, "sound", file.name);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, file.bytes);
    }
    if (files.length) lines.push(`written: ${files.map((file) => `work:sound/${file.name}`).join(", ")} (they take the place of the game's own of those names when put in <mod>/sound)`);
    if (picture) show(picture);
    return [text(lines.join("\n")), ...pictures];
  }
  if (spec?.spec === "smak.music/1") {
    // music: the file under work:media/ (or work:sound/ for a WAV bed), as the mod's own folder has it
    const { report, files, picture } = buildMusicSpec(spec, { readFile: (name) => readFileSync(pathOf(folders, name)) });
    const lines = reportLines(report);
    const base = (spec.name ?? `track${spec.track}`).replace(/\.(mp3|wav)$/i, "").replace(/[^\w-]+/g, "_");
    mkdirSync(folders.work, { recursive: true });
    writeFileSync(join(folders.work, `${base}.spec.json`), `${JSON.stringify(spec, null, 2)}\n`);
    for (const file of files) {
      const under = (spec.as ?? "mp3") === "wav" ? join("sound", file.name) : file.name;
      const path = join(folders.work, under);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, file.bytes);
      lines.push(`written: work:${under} (put in <mod>/${under})`);
    }
    if (picture) show(picture);
    return [text(lines.join("\n")), ...pictures];
  }
  if (spec?.spec !== "smak.model/1")
    throw new Error('spec: a model spec ("spec": "smak.model/1"), a map spec ("smak.map/1"), a sound spec ("smak.sound/1"), a music spec ("smak.music/1"), a textures spec ("smak.wad/1"), a sprite spec ("smak.sprite/1") or a video spec ("smak.video/1"); guide { doc: "spec" } says how to write one');
  const { mdl, report, files = [] } = buildModelSpec(spec, { folder, out: join(folders.work, spec.name ?? "model.mdl"), games: folders.wads ?? [], readPicture: pictureReader(folders, folder), readFile: (name) => readFileSync(pathOf(folders, name)), hide: folders.hide ?? [], refuse: folders.refuse ?? [] });
  const lines = reportLines(report);
  const paintedModel = paintedOnly(folders, spec);
  if (paintedModel) lines.splice(1, 0, paintedModel);
  if (mdl) {
    const name = spec.name ?? "model.mdl";
    const base = name.replace(/\.mdl$/i, "");
    writeFileSync(join(folders.work, name), mdl);
    mkdirSync(folders.work, { recursive: true });
    writeFileSync(join(folders.work, `${base}.spec.json`), `${JSON.stringify(spec, null, 2)}\n`);
    lines.splice(1, 0, ...changedSince(folders.work, base, "model", spec, report));
    const six = smak.sheet(mdl, { seq: 0, size: 256 });
    writeFileSync(join(folders.work, `${base}-sheet.png`), smak.png(six.width, six.height, six.rgba));
    lines.push(`written: work:${name} (${mdl.length} bytes), work:${base}.spec.json, work:${base}-sheet.png`);
    show(six);
    // a body on a base's skeleton: seen moving, a run (or a walk) from the side (a player model's z 0 is its middle: no floor line)
    if (spec.base) {
      const list = smak.sequences(mdl);
      const moving = list.findIndex((seq) => /run|walk/i.test(seq.name) && !seq.group);
      if (moving >= 0) show(smak.strip(mdl, { seq: moving, count: 8, cols: 4, view: "side", width: 192, height: 192 }));
    }
    if (reference) show(besideOf(reference, smak.render(mdl, { seq: 0, yaw: 35, pitch: 20, width: 512, height: 512 })));
    // a weapon: its files in the game's names, in a folder of their own; the game's first-person view beside
    // the new one, the other views, and its attack as the player sees it
    if (files.length) {
      const out = join(folders.work, `${base}_weapon`);
      mkdirSync(out, { recursive: true });
      for (const file of files) {
        mkdirSync(dirname(join(out, file.name)), { recursive: true });
        writeFileSync(join(out, file.name), file.mdl ?? file.bytes);
      }
      lines.push(`written: ${files.map((file) => `work:${base}_weapon/${file.name}`).join(", ")} (the game's names: they take the place of its own when installed in <mod>/models)`);
      const views = [];
      const labels = [];
      for (const file of files.filter((f) => f.view !== "sound")) {
        const first = file.view === "v";
        const draw = (src) => smak.render(src, { seq: 0, frame: 0, width: 320, height: 320, ...(first ? { view: "first" } : { yaw: 35, pitch: 20 }) });
        if (first && file.original) {
          views.push(draw(file.original));
          labels.push(`the game's ${file.name}`);
        }
        views.push(draw(file.mdl));
        labels.push(file.name);
      }
      show(smak.tile(views, views.length, labels));
      const v = files.find((file) => file.view === "v");
      if (v) {
        const list = smak.sequences(v.mdl);
        const attack = list.findIndex((seq) => /attack|fire|shoot|swing|hit|throw|stab|slash/i.test(seq.name));
        show(smak.strip(v.mdl, { seq: attack >= 0 ? attack : Math.min(1, list.length - 1), count: 8, cols: 4, view: "first", width: 192, height: 192 }));
      }
    }
    // a close look at the parts asked for, from two sides: what a sheet of the whole is too small to show
    const focus = [args.focus ?? []].flat().filter(Boolean);
    if (focus.length) {
      const boxes = focus.map((id) => {
        const part = report.parts[id] ?? Object.entries(report.parts).find(([key]) => key.startsWith(`${id}.`))?.[1];
        if (!part) throw new Error(`focus: no part ${id}; the parts are ${Object.keys(report.parts).join(", ")}`);
        return part;
      });
      const mn = [0, 1, 2].map((k) => Math.min(...boxes.map((b) => b.from[k])));
      const mx = [0, 1, 2].map((k) => Math.max(...boxes.map((b) => b.to[k])));
      const within = { mid: mn.map((v, k) => (v + mx[k]) / 2), far: Math.max(0.5, Math.hypot(...mx.map((v, k) => v - mn[k])) / 2) };
      const views = [[35, 20], [215, 20], [35, -35]].map(([yaw, pitch]) => smak.render(mdl, { seq: 0, yaw, pitch, within, width: 320, height: 320 }));
      show(smak.tile(views, 3, ["front", "back", "from below"]));
    }
  }
  return [text(lines.join("\n")), ...pictures];
}

// ── entities ───────────────────────────────────────────────────────────────
/**
 * The entity classes the server's FGDs define, a line each (point or brush, and what it is); with `class`,
 * that class's keys with their types, defaults and choices: what a map spec's entities and their `keys` are
 * written from, never from memory.
 */
/**
 * decompile: a compiled map made back into brush source (bsp2map's way: src/maps/decompile.mjs), written to
 * the work folder with a .wad of the textures it keeps inside it, and compiled again where the compilers are.
 * The way to a map one can only read compiled: change the source, then compile it.
 */
function decompileTool(folders, { map, name, compile = true } = {}) {
  const file = pathOf(folders, map);
  if (!isCompiledMap(file)) throw new Error("decompile: map is a compiled map (.bsp) of the models or work folder");
  const called = (name ?? basename(file).replace(/\.bsp$/i, "")).replace(/[^\w-]/g, "_");
  const out = join(folders.work, called);
  mkdirSync(out, { recursive: true });
  const result = maps.decompile(readFileSync(file), { name: called, folders: folders.wads ?? [] });
  const mapFile = join(out, `${called}.map`);
  writeFileSync(mapFile, result.map);
  const lines = [maps.decompileSummary(result), ...result.warnings.map((w) => `WARN  ${w}`)];
  const wads = [];
  if (result.wad) {
    const wadFile = join(out, result.wad.name);
    writeFileSync(wadFile, result.wad.bytes);
    wads.push(wadFile);
  }
  for (const place of folders.wads ?? []) wads.push(...["halflife.wad", "decals.wad", "liquids.wad", "xeno.wad"].map((w) => join(place, w)).filter((w) => existsSync(w)));
  lines.push(`written: work:${called}/${called}.map${result.wad ? `, work:${called}/${result.wad.name}` : ""}`);
  const pictures = [];
  if (compile) {
    // the server's compilers as the build tool finds them: a folder's name, or found where they lie
    const compilers = typeof folders.compilers === "string" ? maps.findCompilers({ folder: folders.compilers }) : (folders.compilers ?? maps.findCompilers());
    const compiled = maps.compileMap(mapFile, { wads, compilers, out: join(out, `${called}.bsp`) });
    if (compiled.bsp) {
      lines.push(`compiled: work:${called}/${called}.bsp`);
      const again = readFileSync(compiled.bsp);
      const f = maps.textureFidelity(readFileSync(file), again);
      lines.push(`against the original: ${maps.fidelityLine(f)}`);
      const plan = maps.planOf(maps.readBsp(again), { heights: true });
      pictures.push(image(smak.png(plan.width, plan.height, plan.rgba)));
    } else lines.push(...compiled.errors.map((e) => `ERROR ${e}`));
  }
  return [text(lines.join("\n")), ...pictures];
}

function entities(folders, { match, class: one } = {}) {
  if (!folders.fgd?.length) return [text("no FGD was given to the server (--fgd): ask the person for the game's .fgd")];
  const definitions = maps.definitionsOf(...folders.fgd);
  const classes = definitions.classes;
  if (one) {
    const found = classes[one];
    if (!found) throw new Error(`no class ${one} in ${definitions.from.join(", ")}`);
    const named = (about, values) => values.map((v) => (about.labels?.[v] ? `${v} ${about.labels[v]}` : `${v}`)).join(", ");
    const keys = Object.entries(found.keys ?? {}).map(([key, about]) => {
      const choices = about.choices ? `; choices ${named(about, about.choices)}` : about.flags?.length ? `; bits ${named(about, about.flags)}` : "";
      return `  ${key} (${about.type ?? "string"})${about.default !== undefined ? ` default ${about.default}` : ""}${about.description ? `: ${about.description}` : ""}${choices}`;
    });
    return [text([`${one}: ${found.kind === "solid" ? "brush" : found.kind} entity${found.description ? `, ${found.description}` : ""}${found.size ? `; size ${JSON.stringify(found.size)}` : ""}`, ...keys].join("\n"))];
  }
  const wanted = String(match ?? "").toLowerCase();
  const lines = Object.entries(classes)
    .filter(([name, c]) => !wanted || name.includes(wanted) || String(c.description ?? "").toLowerCase().includes(wanted))
    .map(([name, c]) => `  ${name} (${c.kind === "solid" ? "brush" : c.kind})${c.description ? `: ${c.description}` : ""}`);
  return [text([`${lines.length} classes of ${definitions.from.join(", ")}${wanted ? ` holding "${wanted}"` : ""}; class: <name> for its keys`, ...lines].join("\n"))];
}

/**
 * A note for a .wad, map or model spec whose materials are all painted, on a server with a material library:
 * textures painted from nothing were judged "grainy noise" on 24 of 25, and a maker that never looked at the library
 * did not know it was there; the original mod's props, all painted, were told apart from Valve's in the line-up
 * (clean pale paint where Valve's are photographed). Null when the server has none, a material already takes a
 * photograph, or the person's pictures are projected onto it.
 */
function paintedOnly(folders, spec) {
  if (!folders.materials || spec.project) return null;
  const all = [...Object.values(spec.materials ?? {}), ...(Array.isArray(spec.parts) ? spec.parts.map((part) => part?.material) : []), ...Object.values(spec.textures && !Array.isArray(spec.textures) ? spec.textures : {}), ...(Array.isArray(spec.textures) ? spec.textures.map((t) => t.material) : [])];
  if (all.some((m) => m && typeof m === "object" && typeof m.picture === "string")) return null;
  return `note  every material is painted: this server has a library of ${folders.materials.list.length} photographed materials (the tool materials). A wall, a floor, a prop's metal, rust, wood or plastic made from a real surface reads as Valve's do, where painted grain reads as noise and plain paint as a toy: materials { match: "rusty metal", show: [...] }, then { "base": ..., "picture": "library:<name>", "size": <its width in units> }. These are photographs of real surfaces, free to use (CC0): not a game's textures, which stay out`;
}

// ── the tools as a client is told of them ──────────────────────────────────
const MODEL = { type: "string", description: "path under the work or models folder" };
const object = (properties, required = []) => ({ type: "object", properties, required });

/**
 * The tools, for the folders the server was started with: [{ name, description, inputSchema, call }].
 * `allowRun: false` leaves out `run`, the one that runs code.
 */
export function toolsFor(folders, { allowRun = true } = {}) {
  const tools = [
    {
      name: "guide",
      description:
        "SMAK's guide for GoldSrc models (.mdl) and maps (.bsp, .map, .wad). No arguments: the list of sections and what the kit can and cannot do; read it first. `topic`: those sections' text.",
      inputSchema: object({
        topic: { type: "string", description: 'section numbers ("12,20") or words of one title' },
        doc: {
          type: "string",
          description:
            'another document: "api" (every function), "spec", "engines", "maps", "maps-making", "maps-checks", "import" (bought models), "items" (a weapon in a mod), "play" (the game in a browser), "editor" (the person\'s editor), or a path the list names',
        },
        find: { type: "string", description: "instead of topic: the lines holding these words" },
      }),
      call: (args) => [text(guide(args))],
    },
    {
      name: "models",
      description:
        "Lists the files: the models folder's .mdl, .bsp, .map and .wad (read only) and all of the work folder, with bytes.",
      inputSchema: object({ match: { type: "string", description: "only names holding this" } }),
      call: (args) => listModels(folders, args),
    },
    {
      name: "info",
      description:
        "What a model holds (bones, bodies with their body numbers, textures, animations), or a map (.bsp: entities, textures, light), a .map or a .wad. A .wad with like (a picture) and rect: its textures most like that patch.",
      inputSchema: object(
        {
          model: MODEL,
          full: {
            type: "boolean",
            description: "also bone places, events, attachments; a map: every entity, with its keys",
          },
          like: { type: "string", description: "a .wad: a picture (work:pictures/views.png) to find its textures in" },
          rect: { type: "array", items: { type: "number" }, description: "with like: the patch, [x, y, w, h] in dots" },
        },
        ["model"],
      ),
      call: (args) => info(folders, args),
    },
    {
      name: "check",
      description:
        "Errors and warnings a game engine would have with a model or a .bsp map; of a .map, its plan's faults.",
      inputSchema: object(
        {
          model: MODEL,
          engine: { type: "string", enum: ["goldsrc", "xash"] },
          walk: {
            type: "boolean",
            description: "a map: what a player cannot reach on foot or stands in solid; the openings",
          },
          goal: { type: "string", description: 'walk: how far to these entities, "9, keeper"' },
          doors: { type: "string", enum: ["open", "closed"] },
          against: {
            type: "string",
            description:
              "a map's entities checked by these: .fgd, map-learn files, a profile (.json, goldsrc)",
          },
        },
        ["model"],
      ),
      call: (args) => check(folders, args),
    },
    {
      name: "render",
      description: `A picture. Of a model: kind "view" (default; one side), "sheet" (six sides), "strip" (an animation's frames), "uv" (a texture with its triangles), "gif" (an animation as a looping GIF written to the work folder, each frame labelled; seq "all" for every animation). Of a map (.bsp, .map): "plan" (default; from above, entities marked), "view" (from inside), "views" (several), "section" (a side cut), "storeys" (a plan each), "openings" (through each doorway).`,
      inputSchema: object(
        {
          model: MODEL,
          models: { type: "array", items: { type: "string" }, description: "several models side by side, in place of model" },
          save: { type: "string", description: "also write the picture to the work folder under this .png name (gif: a .gif name, or a folder with seq \"all\")" },
          kind: {
            type: "string",
            enum: [...Object.keys(KINDS), "gif", "plan", "views", "section", "storeys", "openings"],
          },
          body: { type: "number", description: "body number (0)" },
          seq: { type: "string", description: 'animation name or number, or "rest" (default: the first); gif: "all" for every one' },
          frame: { type: "number" },
          side: { type: "string", enum: Object.keys(SIDES), description: "view: default quarter" },
          yaw: { type: "number", description: "degrees; 0 front, 90 left side; map view: 0 looks +x, 90 +y" },
          pitch: { type: "number", description: "degrees; 90 from above; map view: over 0 looks up" },
          at: {
            type: "string",
            description: 'map view: the eye, "x y z" or an entity (default: the first start)',
          },
          z: { type: "number", description: "map plan: cut at this height" },
          from: { type: "string", description: 'section: one end of its line, "x y"' },
          to: { type: "string", description: "section: the other" },
          heights: { type: "boolean", description: "plan: floor heights written" },
          grid: { type: "number", description: "plan: a line every so many units, with its coordinate" },
          legend: { type: "boolean", description: "plan: entities listed" },
          reach: { type: "boolean", description: "plan, storeys: the walk test tinted" },
          zoom: { type: "number" },
          dist: { type: "number", description: "view: units from the eye, with perspective" },
          first: { type: "boolean", description: "as the player sees a v_ weapon" },
          count: { type: "number", description: `strip: frames drawn (${STRIP_COUNT}); map views: cells` },
          texture: { type: "string", description: "uv: name or number (0)" },
          wad: { type: "string", description: "map: a .wad worn in the game's place" },
          size: {
            type: "number",
            description: `longer side in px: ${SIZE_ONE}, sheet and strip ${SIZE_SEVERAL}; ${PICTURE_MOST} at most`,
          },
        },
        [],
      ),
      call: (args) => render(folders, args),
    },
    {
      name: "build",
      description:
        'A model, map, textures, sound, sprite or video from a JSON spec (guide { doc: "spec" }): built, checked (holes, leaks, reach, light; a sound or sprite against the game\'s; a video\'s smoothness), compiled, drawn. A map\'s or a .wad\'s material may take a photograph of the work folder (`picture`; `filter` valve, literal or aged). Says OK or what to fix, and what changed since the last build.',
      inputSchema: object(
        {
          spec: { description: "the spec, or a .json file of the folders" },
          reference: { type: "string", description: "a picture (PNG, BMP or JPEG) drawn beside the result" },
          focus: { type: "array", items: { type: "string" }, description: "model parts to see close" },
          preview: { type: "boolean", description: "a video: false renders and encodes it (default: a contact sheet)" },
        },
        ["spec"],
      ),
      call: (args) => build(folders, args),
    },
    {
      name: "decompile",
      description: "A compiled map (.bsp) made back into brush source in the work folder, with a .wad of the textures it carries, and compiled again (compile: false skips it). Read the .map, change it, and compile it with a map spec's source or by hand.",
      inputSchema: object({ map: { type: "string" }, name: { type: "string" }, compile: { type: "boolean" } }, ["map"]),
      call: (args) => decompileTool(folders, args),
    },
    {
      name: "entities",
      description: "The FGD's entity classes; with class, its keys, choices and flags. Write entities from these.",
      inputSchema: object({ match: { type: "string" }, class: { type: "string" } }),
      call: (args) => entities(folders, args),
    },
    {
      name: "run",
      description: `Runs an ES module with Node in the work folder: how models are built, painted and changed. RUNS ARBITRARY CODE on the server's machine. Import "smak" (also "smak/workshop", "smak/kits/swordkit"; where the guide writes "./smak/src/index.mjs"); read models from process.env.SMAK_MODELS, write to the work folder (the cwd) only. Returns stdout and stderr (${OUTPUT_MOST} characters each at most) and the files written.`,
      inputSchema: object(
        {
          script: { type: "string" },
          show: {
            type: "array",
            items: { type: "string" },
            description: `up to ${SHOWN_MOST} PNG files it wrote, returned as images`,
          },
          timeout: { type: "number", description: `seconds (${TIMEOUT_SECONDS})` },
          name: {
            type: "string",
            description:
              "keep the script as <name>.mjs, to import, edit or run again (alone: runs it as kept)",
          },
          edits: {
            type: "array",
            items: object({ old: { type: "string" }, new: { type: "string" } }, ["old", "new"]),
            description: "with name, no script: each old (once in the kept script) becomes new, then it runs",
          },
        },
        [],
      ),
      call: (args, extra) => run(folders, args, extra),
    },
    {
      name: "command",
      description: `Any command of the command line (bin/smak.mjs), run as it runs there, with every flag it has: what the other tools do not offer (retexture, sequence-add, reskin, islands, layers, pieces, contract, map-set, map-reach --jump, map-heights, map-light, map-measure, map-compare, map-compile, wad-make, import, item ...). \`guide { topic: "The command line" }\` lists them. Name files as work:<name> (a bare name is the work folder's), models:<name>, library:<name>, and game:<folder> (or game:<folder>/<path>, a file in it) for a game folder of the server's; what it writes goes to the work folder. Returns what it printed, the files it wrote, and up to ${SHOWN_MOST} of the pictures it wrote.`,
      inputSchema: object(
        {
          name: { type: "string", description: "the command: info, check, map-plan, retexture ..." },
          args: { type: "array", items: { type: "string" }, description: 'its words and flags, as the command line takes them: ["models:knife.mdl", "--seq", "attack", "-o", "attack.png"]' },
          show: { type: "array", items: { type: "string" }, description: `up to ${SHOWN_MOST} PNG files of the work folder to return as pictures (unless told: the ones it wrote)` },
          timeout: { type: "number", description: `seconds (${TIMEOUT_SECONDS})` },
        },
        ["name"],
      ),
      call: (args, extra) => command(folders, args, { ...extra, allowCode: allowRun }),
    },
    {
      name: "file",
      description: "A file of the folders read back as what it is: words (a .map, .json, .txt, .fgd, .qc ...), a picture (.png, .bmp, .jpg), or a sound to listen to (.wav, .mp3). With text: a text file written into the work folder (a .map, rules). With to: copied there.",
      inputSchema: object(
        {
          name: { type: "string", description: "work:<name> (or a bare name), models:<name>, library:<name>" },
          text: { type: "string", description: "write this as the file's whole text (work folder only)" },
          to: { type: "string" },
          from: { type: "number", description: "a long text file read from this character on" },
        },
        ["name"],
      ),
      call: (args) => file(folders, args),
    },
    {
      name: "page",
      description: "The person's own pages, which stay up after the call, on this machine: the viewer (kind view: models side by side, turning and animated) or the editor (kind edit: animations, events and textures touched up by hand; its projects in the work folder; `guide { doc: \"editor\" }` says how you share them). Returns the address to give the person; stop: true closes it.",
      inputSchema: object(
        {
          kind: { type: "string", enum: ["view", "edit"] },
          files: { type: "array", items: { type: "string" }, description: "view: models or folders (the work and models folders unless told); edit: a model or a folder of them" },
          port: { type: "number", description: "in place of the page's own (8098 the viewer, 8097 the editor)" },
          stop: { type: "boolean", description: "close the page of that kind" },
        },
        ["kind"],
      ),
      call: (args) => page(folders, args),
    },
  ];
  if (folders.materials)
    tools.push({
      name: "materials",
      description: `A library of ${folders.materials.list.length} photographed materials (CC0 scans: concrete, brick, metal, rust, wood, tile, plaster, ground...), each with its real size: search it by words, see them (show), and give a map's, a .wad's or a model's material one as its picture ("library:<name>") so its texture is made from a real surface rather than painted noise.`,
      inputSchema: object({
        match: { type: "string", description: 'words all found in a material\'s name, title, categories or tags ("rusty metal", "cracked concrete")' },
        category: { type: "string", description: "one of the library's categories" },
        show: { type: "array", items: { type: "string" }, description: "up to 12 names: their pictures, side by side" },
      }),
      call: (args) => materials(folders, args),
    });
  if (folders.generators) {
    const names = folders.generators.models.map((m) => `${m.name} (${m.kind}${m.default ? ", the default" : ""}${m.licence ? `, ${m.licence}` : ""})`).join("; ");
    tools.push({
      name: "generate",
      description: `A sound, music or a shape (a mesh, from a picture or from words) made by a model run on this machine, several seeds at once: each take written to work:gen/<name>_s<seed> (.wav, or .obj with its picture) with a sidecar .json (model, prompt, seed, licence), measured and drawn. Then use the take you choose in a sound spec as a layer { kind: "sample", file, from: "onset" }, or the shape in a model spec as a part { kind: "mesh", file, size }, and shape it there. Models: ${names}. The first call to a model loads it (a minute or three); later calls take seconds.`,
      inputSchema: object(
        {
          prompt: { type: "string", description: "what to make, in the words the model learned from: a sound as a caption, 5 to 15 plain words about the sound alone (the source, the action, the material, the space: \"a heavy wrench hitting a steel pipe, one sharp metallic clang\"), events in order when several, no numbers or frequencies; music as its style, instruments and mood; a shape as the thing alone. The person's own words are sent as they are when they ask for that. When you write them your way instead, tell them the exact prompt you sent and what you changed, so they can ask for theirs" },
          length: { type: "number", description: "seconds (a sound model makes 5 at most; music 10 to 600); not for a shape" },
          kind: { type: "string", enum: ["sound", "music", "shape"], description: "which kind's default model (sound unless told)" },
          picture: { type: "string", description: "a shape: a picture of the thing in the folders (one object, whole, plain background), in place of one drawn from the prompt" },
          model: { description: "a model by name, or a list of names, in place of the kind's defaults (when several are marked default, a call draws its seeds from each, its files named after the model)" },
          seeds: { description: "how many takes (4), or a list of seeds: other seeds of a prompt are other takes" },
          from: { type: "number", description: "with seeds as a count: the first seed (0); a second call with from 4 gives four more" },
          name: { type: "string", description: "the takes' file name under work:gen/ (the prompt's first words unless told)" },
          class: { type: "string", description: "each take held against the game's sounds of this kind (as a sound spec's class)" },
          bpm: { type: "number", description: "music: beats a minute (leave out for music with no beat)" },
          key: { type: "string", description: "music: \"D minor\"" },
          loop: { type: "boolean", description: "music: made to loop (its join regenerated, in whole bars with a bpm)" },
        },
        [],
      ),
      call: (args) => generate(folders, args),
    });
  }
  return allowRun ? tools : tools.filter((tool) => tool.name !== "run");
}
