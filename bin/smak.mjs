#!/usr/bin/env node
// SMAK from the command line: look at a model, check it, draw it, and take its textures out and put them
// back; and the same for a map: what is in it, its plan and views, its entities changed, its textures, a
// compile. Anything finer (a new mesh, a new animation, a map's brushes) is a short script over
// src/index.mjs: see AGENTS.md and examples/.
//
// How this file is laid out: the arguments are read in one place (parseArgs), each command is a function that
// is handed { command, file, rest, flags, src }, and COMMANDS, after them, maps a command's name to its
// function and to its lines of the help.
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, basename, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import * as smak from "../src/index.mjs";

// the ports the two pages listen on unless told with --port
const VIEWER_PORT = 8098;
const EDITOR_PORT = 8097;
// a studio model's header: its length in bytes, and where in it the number of textures is written. A model
// with none there keeps them in <name>t.mdl beside it
const HEADER_BYTES = 184;
const TEXTURE_COUNT_AT = 180;
// the name the model gives itself: 64 bytes of the header, from byte 8
const NAME_AT = 8;
const NAME_END = 72;
// where the model sees from (eyeposition), three floats; its four boxes follow
const HDR_EYES_AT = 76;
// pieces, islands and regions smaller than this are counted and not listed, unless told with --min
const PIECES_MIN_TRIANGLES = 6;
const ISLANDS_MIN_TRIANGLES = 1;
const LAYERS_MIN_PIXELS = 30;
// how many bodies and bones a line of `islands` names before "and n more"
const BODIES_LISTED = 6;
const BONES_LISTED = 4;
// the flags that are followed by a value: one given with nothing after it is said, not guessed at
const VALUE_FLAGS = [
  "seq",
  "frame",
  "body",
  "skin",
  "view",
  "yaw",
  "pitch",
  "zoom",
  "fov",
  "width",
  "height",
  "size",
  "count",
  "cols",
  "from",
  "to",
  "texture",
  "min",
  "engine",
  "flags",
  "scale",
  "up",
  "turn",
  "name",
  "max-texture",
  "port",
  "work",
  "class",
  "game",
  "wad",
  "z",
  "area",
  "at",
  "brightness",
  "entity",
  "add",
  "remove",
  "move",
  "unset",
  "vhlt",
  "body",
  "model",
  "start",
  "goal",
  "open",
  "shut",
  "doors",
  "cell",
  "near",
  "mod",
  "fgd",
  "learned",
  "cache",
  "scripts",
  "exit",
  "speed",
  "gravity",
  "sky",
  "map",
  "steps",
  "playwright",
  "loads",
  "expect",
  "expect-not",
  "put",
  "over",
  "family",
  "base",
  "shipped",
  "timeout",
  "dark",
  "rooms",
  "grid",
  "bands",
  "sight",
  "eye",
  "precision",
  "names",
  "fit",
  "origin",
  "axis",
  "grip",
  "as",
  "only",
  "save-pictures",
  "fps",
  "frames",
  "source",
];
// the flags of the map commands that may be given more than once: each time adds to a list
const LISTED_FLAGS = [
  "game",
  "wad",
  "body",
  "model",
  "start",
  "goal",
  "open",
  "shut",
  "fgd",
  "learned",
  "scripts",
  "exit",
  "map",
  "steps",
  "expect",
  "expect-not",
  "put",
  "over",
];
// `map-entities` and `map-plan` print no more lines than this of one list unless told all of it is wanted
const MARKS_PRINTED = 40;
const LIGHTS = ["steady", "all"];
const MARKED = ["all", "models", "game", "none"];
const DOORS = ["open", "closed"];
const VIEWS = ["orbit", "first", ...Object.keys(smak.NAMED_VIEWS)];
const ENGINES = ["goldsrc", "xash"];

// ── the arguments ──────────────────────────────────────────────────────────
/**
 * The command line read: { flags, args }. `-o x` is flags.o; `--name value` is flags.name; `--name` with
 * nothing after it (or with another flag after it) is true; `--no-name` is flags.name = false; the rest are
 * `args`, in order. A flag of LISTED_FLAGS given several times keeps every value, in `listed`.
 */
function parseArgs(argv) {
  const flags = {};
  const listed = {};
  const args = [];
  for (let i = 0; i < argv.length; i++) {
    const word = argv[i];
    const next = argv[i + 1];
    if (word === "-o") flags.o = argv[++i];
    else if (word.startsWith("--no-")) flags[word.slice(5)] = false;
    else if (word.startsWith("--")) {
      const bare = next === undefined || next.startsWith("--") || next === "-o";
      flags[word.slice(2)] = bare ? true : argv[++i];
      if (!bare && LISTED_FLAGS.includes(word.slice(2))) (listed[word.slice(2)] ??= []).push(argv[i]);
    } else args.push(word);
  }
  return { flags, args, listed };
}
const fail = (message) => {
  console.error(message);
  process.exit(1);
};
/**
 * The flags looked over before anything is done: one that needs a value and has none, and a view or an
 * engine that is not one, are said and the command stopped.
 */
function checkFlags(flags) {
  if ("o" in flags && (flags.o === undefined || flags.o.startsWith("--")))
    fail("-o needs a file or a folder after it");
  for (const name of VALUE_FLAGS) if (flags[name] === true) fail(`--${name} needs a value after it`);
  if (flags.view !== undefined && !VIEWS.includes(flags.view))
    fail(`--view: ${VIEWS.join(" or ")}, not ${flags.view}`);
  if (flags.engine !== undefined && !ENGINES.includes(flags.engine))
    fail(`--engine: ${ENGINES.join(" or ")}, not ${flags.engine}`);
}
/** A flag's value as a number; undefined for a flag not given. One that is no number stops the command. */
function numberOf(flags, name) {
  const value = flags[name];
  if (value === undefined) return undefined;
  if (value === "" || Number.isNaN(Number(value))) fail(`--${name}: a number, not ${value}`);
  return Number(value);
}
/** A texture or an animation named on the command line: its number when it is all digits, else its name. */
const nameOrNumber = (value) => (/^\d+$/.test(String(value)) ? Number(value) : value);
/** An object without the entries that are undefined. */
const defined = (object) =>
  Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));
/** A texture's name as a file's: no extension, nothing a file system minds. */
const fileNameOf = (name) => name.replace(/\.(bmp|png|tga)$/i, "").replace(/[^A-Za-z0-9_.-]/g, "_");
function save(to, data) {
  mkdirSync(dirname(to) || ".", { recursive: true });
  writeFileSync(to, data);
}
/** `value`, or the command stopped with what it lacks. */
const need = (command, value, what) => value ?? fail(`${command}: ${what}`);
/** A file a command reads, or the command stopped: one that is not there, or that is a folder. */
function existing(file) {
  if (!existsSync(file)) fail(`no such file: ${file}`);
  if (statSync(file).isDirectory()) fail(`${file} is a folder, not a file`);
  return file;
}
/** What went wrong, as a sentence: a file that could not be read or written, or a port that is taken, named. */
function sayOf(error) {
  if (error.code === "ENOENT") return `no such file: ${error.path}`;
  if (error.code === "EEXIST" || error.code === "ENOTDIR")
    return `${error.path} cannot be made: a file of that name is in the way`;
  if (error.code === "EISDIR") return `${error.path ?? "that"} is a folder, where a file is wanted`;
  if (error.code === "EADDRINUSE")
    return `port ${error.port} is taken (a page left running?): stop that, or give another with --port`;
  return error.message;
}
/** The animation a model is posed in when none is asked for: its first, or its rest pose when it has none. */
const firstSeq = (src) => (smak.sequences(src).length ? 0 : null);
/**
 * The animation --seq asks for, the same for every command that takes it: a name, a number, or `rest` for
 * the rest pose (null); undefined when the flag is not given.
 */
function seqAsked(flags) {
  if (flags.seq === undefined) return undefined;
  return flags.seq === "rest" ? null : nameOrNumber(flags.seq);
}
/** The same, with the model's first animation when the flag is not given. */
const seqOf = (src, flags) => (flags.seq === undefined ? firstSeq(src) : seqAsked(flags));
/** The file that holds a model's textures when they are not inside it. */
const textureFileOf = (file) => file.replace(/\.mdl$/i, "t.mdl");
/** A box in pixels as the lists print it. */
const boxText = (box) => `${box[0]},${box[1]} to ${box[2]},${box[3]}`;

/**
 * The model read; one whose textures are in the file beside it is read with them (but for `inline`, which
 * does that).
 */
function readModel(file, command) {
  let src = readFileSync(file);
  const textureFile = textureFileOf(file);
  const hasNone = src.length > HEADER_BYTES && !src.readInt32LE(TEXTURE_COUNT_AT);
  if (command !== "inline" && hasNone && existsSync(textureFile)) {
    src = smak.withTextures(src, readFileSync(textureFile));
    console.error(`(textures read from ${basename(textureFile)})`);
  }
  return src;
}
/** What render, sheet and strip are asked for, from the flags. */
function viewOptions(src, flags) {
  return {
    view: flags.view,
    seq: seqOf(src, flags),
    frame: numberOf(flags, "frame") ?? 0,
    body: numberOf(flags, "body") ?? 0,
    skin: numberOf(flags, "skin") ?? 0,
    yaw: numberOf(flags, "yaw"),
    pitch: numberOf(flags, "pitch"),
    zoom: numberOf(flags, "zoom"),
    fov: numberOf(flags, "fov"),
    width: numberOf(flags, "width"),
    height: numberOf(flags, "height"),
    size: numberOf(flags, "size"),
    count: numberOf(flags, "count"),
    cols: numberOf(flags, "cols"),
    from: numberOf(flags, "from"),
    to: numberOf(flags, "to"),
    light: flags.light !== false,
    cull: flags.cull !== false,
    ground: flags.ground ? true : undefined,
  };
}

// ── info ───────────────────────────────────────────────────────────────────
/** Everything `info` tells of a model, as `--json` prints it. */
function describe(src, file) {
  const mdl = smak.readMdl(src);
  const bones = smak.bones(src);
  const boneName = (number) => bones[number]?.name ?? number;
  const boxes = smak.hitboxes(src);
  // studiohdr_t's eyeposition and its four boxes (min and max: the box it moves with; bbmin and bbmax: the
  // box it is clipped by), which follow its name and length: floats from byte 76 (studio.h)
  const floats = (at) => [0, 1, 2].map((axis) => round2(src.readFloatLE(at + axis * 4)));
  const header = {
    eyes: floats(HDR_EYES_AT),
    box: {
      min: floats(HDR_EYES_AT + 12),
      max: floats(HDR_EYES_AT + 24),
      bbmin: floats(HDR_EYES_AT + 36),
      bbmax: floats(HDR_EYES_AT + 48),
    },
  };
  return {
    file,
    bytes: src.length,
    name: src.toString("latin1", NAME_AT, NAME_END).replace(/\0.*$/s, ""),
    bones: bones.map((bone, i) => ({
      i,
      name: bone.name,
      parent: bone.parent,
      pos: bone.pos.map((v) => +v.toFixed(3)),
      rot: bone.rot.map((v) => +v.toFixed(4)),
    })),
    bodyparts: mdl.bodyparts.map((bodypart) => ({
      name: bodypart.name,
      base: bodypart.base,
      models: bodypart.models.map((model, k) => ({
        body: k * bodypart.base,
        name: model.name,
        verts: model.numverts,
        meshes: model.meshes.map((mesh) => ({ tris: mesh.numtris, texture: mesh.texture?.name ?? null })),
      })),
    })),
    textures: mdl.textures.map((texture, i) => ({
      i,
      name: texture.name,
      width: texture.width,
      height: texture.height,
      flags: texture.flags,
    })),
    skinFamilies: smak.skinFamilies(src).length,
    eyes: header.eyes,
    box: header.box,
    sequences: smak.sequences(src).map((seq, i) => ({
      i,
      name: seq.name,
      frames: seq.frames,
      fps: seq.fps,
      loops: seq.loops,
      blends: seq.blends,
      external: Boolean(seq.group),
      activity: seq.activity,
      activityName: smak.ACTIVITY[seq.activity] ?? null,
      actweight: seq.actweight,
      movement: seq.movement.map(round2),
      speed: round2(seq.speed),
      motiontype: seq.motiontype,
      bbmin: seq.bbmin.map(round2),
      bbmax: seq.bbmax.map(round2),
      events: smak.events(src, i),
    })),
    attachments: smak.attachments(src).map((a) => ({ ...a, bone: boneName(a.bone) })),
    hitboxes: boxes.length,
    hitboxList: boxes.map((box, i) => ({
      i,
      bone: boneName(box.bone),
      group: box.group,
      groupName: HITGROUP_NAMES[box.group] ?? null,
      min: box.min.map(round2),
      max: box.max.map(round2),
      size: box.max.map((v, axis) => round2(v - box.min[axis])),
    })),
    boneControllers: smak.boneControllers(src).map((c) => ({ ...c, bone: boneName(c.bone) })),
  };
}
/** A length as `info` prints it: to a hundredth of a unit. */
const round2 = (v) => +v.toFixed(2);
/** The names of the hit groups, by their numbers. */
const HITGROUP_NAMES = Object.fromEntries(
  Object.entries(smak.HITGROUP).map(([name, group]) => [group, name]),
);
/** The names of the bits of a motion type, joined with +. */
const motionNames = (motiontype) =>
  Object.entries(smak.MOTION)
    .filter(([, bit]) => motiontype & bit)
    .map(([name]) => name)
    .join("+");
/** The names of a texture's flags, joined with +. */
const flagNames = (flags) =>
  Object.entries(smak.TEXTURE)
    .filter(([, bit]) => flags & bit)
    .map(([name]) => name)
    .join("+");
function info({ file, src, flags }) {
  const data = describe(src, file);
  if (flags.json) {
    console.log(JSON.stringify(data, null, 1));
    return;
  }
  const pad = (value, width) => String(value).padStart(width);
  console.log(`${file}: "${data.name}", ${src.length} bytes`);

  console.log(`\nBONES (${data.bones.length})`);
  // the places as the file has them, not as --json rounds them
  smak
    .bones(src)
    .forEach((bone, i) =>
      console.log(
        `  ${pad(i, 3)} ${bone.name.padEnd(28)} parent ${pad(bone.parent, 3)}  at ${bone.pos.map((v) => v.toFixed(2)).join(" ")}`,
      ),
    );

  console.log(
    `\nBODYPARTS (${data.bodyparts.length})   a body number is the sum of one "body" from each part`,
  );
  for (const bodypart of data.bodyparts) {
    console.log(`  ${bodypart.name}`);
    for (const model of bodypart.models) {
      const meshes = model.meshes.map((mesh) => `${mesh.tris} on ${mesh.texture}`).join(", ") || "(empty)";
      console.log(
        `    body ${pad(model.body, 4)}  ${model.name.padEnd(28)} ${pad(model.verts, 5)} points  ${meshes}`,
      );
    }
  }

  const families = data.skinFamilies > 1 ? `, ${data.skinFamilies} skin families` : "";
  console.log(`\nTEXTURES (${data.textures.length}${families})`);
  for (const texture of data.textures) {
    const flagText = texture.flags ? `  ${flagNames(texture.flags) || ""} (flags ${texture.flags})` : "";
    console.log(
      `  ${pad(texture.i, 3)} ${texture.name.padEnd(32)} ${texture.width}x${texture.height}${flagText}`,
    );
  }

  console.log(`\nANIMATIONS (${data.sequences.length})   the game asks for them by number: keep their order`);
  for (const seq of data.sequences) {
    const activity = seq.activity
      ? `, activity ${seq.activity}${seq.activityName ? ` ${seq.activityName}` : ""}${seq.actweight !== 1 ? ` (weight ${seq.actweight})` : ""}`
      : "";
    const travel = seq.movement.some((v) => v)
      ? `, moves ${seq.movement.join(" ")} (${motionNames(seq.motiontype) || "no motion type"}): ${seq.speed} units a second`
      : "";
    const notes = `${seq.loops ? ", loops" : ""}${seq.blends > 1 ? `, ${seq.blends} blends` : ""}${activity}${travel}${seq.external ? ", KEPT IN ANOTHER FILE" : ""}`;
    console.log(
      `  ${pad(seq.i, 3)} ${seq.name.padEnd(28)} ${pad(seq.frames, 4)} frames at ${seq.fps} fps${notes}`,
    );
    if (flags.boxes) console.log(`        box ${seq.bbmin.join(" ")} to ${seq.bbmax.join(" ")}`);
    for (const event of seq.events)
      console.log(
        `        frame ${event.frame}: event ${event.event}${event.options ? ` "${event.options}"` : ""}`,
      );
  }

  if (data.attachments.length) {
    console.log(`\nATTACHMENTS (${data.attachments.length})`);
    data.attachments.forEach((a, i) =>
      console.log(
        `  ${i}${a.name ? ` "${a.name}"` : ""} on ${a.bone} at ${a.pos.map((v) => v.toFixed(2)).join(" ")}`,
      ),
    );
  }
  if (data.boneControllers.length) {
    console.log(`\nBONE CONTROLLERS (${data.boneControllers.length})`);
    data.boneControllers.forEach((c, i) =>
      console.log(
        `  ${i} turns ${c.bone} on ${motionNames(c.type) || c.type} from ${c.start} to ${c.end}, the entity's controller ${c.index}`,
      ),
    );
  }
  if (data.eyes.some((v) => v)) console.log(`\nEYES at ${data.eyes.join(" ")}`);

  // the hit boxes: how many, on how many bones and in which groups; each one with --hitboxes
  const groups = [...new Set(data.hitboxList.map((box) => box.group))].sort((a, b) => a - b);
  const inGroups = groups
    .map((group) => `${group}${HITGROUP_NAMES[group] ? ` ${HITGROUP_NAMES[group]}` : ""}`)
    .join(", ");
  const summary = data.hitboxes
    ? ` on ${new Set(data.hitboxList.map((box) => box.bone)).size} bones, in the groups ${inGroups}${flags.hitboxes ? "" : "   (--hitboxes lists them)"}`
    : "";
  console.log(`\n${data.hitboxes} hit boxes${summary}`);
  if (flags.hitboxes)
    for (const box of data.hitboxList)
      console.log(
        `  ${pad(box.i, 3)} ${String(box.bone).padEnd(28)} group ${box.group}${box.groupName ? ` ${box.groupName}` : ""}  ${box.size.join(" x ")}  from ${box.min.join(" ")} to ${box.max.join(" ")}`,
      );
}

// ── check ──────────────────────────────────────────────────────────────────
function check({ src, flags }) {
  const engine = flags.engine ?? "goldsrc";
  // --source: the file it was made from; what that has too is said as inherited
  const source = flags.source === undefined ? undefined : readModel(existing(flags.source), "check");
  const report = smak.check(src, engine, { source });
  for (const fact of report.facts) console.log(`      ${fact}`);
  for (const warning of report.warnings) console.log(`WARN  ${warning}`);
  for (const error of report.errors) console.log(`ERROR ${error}`);
  const inherited = report.inherited ? ` (${report.inherited} inherited from ${flags.source})` : "";
  const warned = report.warnings.length ? `, with ${report.warnings.length} warnings${inherited}` : "";
  console.log(
    report.errors.length
      ? `${report.errors.length} errors: not fit for ${engine}`
      : `fit for ${engine}${warned}`,
  );
  process.exit(report.errors.length ? 1 : 0);
}

// ── pictures of the model ──────────────────────────────────────────────────
/** render, sheet and strip: one function, the picture drawn by the kit's function of the command's name. */
function draw({ command, src, flags }) {
  // the arguments first: a picture is not drawn to find that it has nowhere to go
  const to = need(command, flags.o, "-o out.png");
  const options = defined(viewOptions(src, flags));
  // the ground is a line only in a level view: said before anything is drawn
  const level = smak.NAMED_VIEWS[options.view]
    ? smak.NAMED_VIEWS[options.view].pitch + (options.pitch ?? 0) === 0
    : options.view !== "first" && options.pitch === 0;
  if (options.ground && (command === "sheet" || !level))
    fail(
      "--ground draws the line of z = 0 across a level view of render or strip: give --view side or --view front (or --pitch 0)",
    );
  for (const name of ["count", "cols"])
    if (name in options && !(Number.isInteger(options[name]) && options[name] >= 1))
      fail(`--${name}: a whole number from 1, not ${options[name]}`);
  if (!smak.posed(src, options).tris.length) {
    const bodies = smak
      .readMdl(src)
      .bodyparts.map(
        (bodypart) =>
          `  ${bodypart.name}: ${bodypart.models.map((model, k) => `${k * bodypart.base}=${model.name}`).join(" ")}`,
      )
      .join("\n");
    fail(`body ${options.body} shows no triangles. Its body numbers:\n${bodies}`);
  }
  const picture = smak[command](src, options);
  save(to, smak.png(picture.width, picture.height, picture.rgba));
  console.log(`${to}  ${picture.width}x${picture.height}`);
}

// ── textures ───────────────────────────────────────────────────────────────
function textures({ command, src, flags }) {
  const dir = need(command, flags.o, "-o <folder>");
  smak.readMdl(src).textures.forEach((_, i) => {
    const texture = smak.textureOf(src, i);
    const name = `${String(i).padStart(2, "0")}_${fileNameOf(texture.name)}.${flags.bmp ? "bmp" : "png"}`;
    const to = join(dir, name);
    const holes = Boolean(texture.flags & smak.TEXTURE.masked);
    save(
      to,
      flags.bmp ? smak.bmp(texture) : smak.png(texture.width, texture.height, smak.rgbaOf(texture, holes)),
    );
    console.log(`${to}  ${texture.width}x${texture.height}${texture.flags ? ` flags ${texture.flags}` : ""}`);
  });
}
function uv({ command, src, flags }) {
  const dir = need(command, flags.o, "-o <folder>");
  const all = smak.readMdl(src).textures.map((_, i) => i);
  const wanted = flags.texture === undefined ? all : [nameOrNumber(flags.texture)];
  for (const which of wanted) {
    const map = smak.uvMap(src, which);
    const to = join(dir, `uv_${fileNameOf(map.texture.name)}.png`);
    save(to, smak.png(map.width, map.height, map.rgba));
    console.log(
      `${to}  ${map.texture.width}x${map.texture.height} x${map.scale}, ${map.triangles} triangles of ${map.meshes} meshes`,
    );
  }
}
function retexture({ command, src, rest, flags }) {
  const [which, pictureFile] = rest;
  need(command, pictureFile, "<texture name|n> <picture.png|.bmp>");
  const to = need(command, flags.o, "-o out.mdl");
  const old = smak.textureOf(src, nameOrNumber(which));
  const texture = smak.textureFrom(readFileSync(existing(pictureFile)), old.name, {
    holes: Boolean(flags.holes) || Boolean(old.flags & smak.TEXTURE.masked),
  });
  const out = smak.replaceTexture(src, nameOrNumber(which), {
    ...texture,
    flags: numberOf(flags, "flags") ?? old.flags,
  });
  save(to, out);
  console.log(`${to}: ${old.name} ${old.width}x${old.height} -> ${texture.width}x${texture.height}`);
}
function inline({ command, file, src, flags }) {
  const to = need(command, flags.o, "-o out.mdl");
  const textureFile = textureFileOf(file);
  if (!existsSync(textureFile)) fail(`no ${textureFile} beside it`);
  const out = smak.withTextures(src, readFileSync(textureFile));
  save(to, out);
  console.log(`${to}: ${smak.readMdl(out).textures.length} textures inside`);
}

// ── animations ─────────────────────────────────────────────────────────────
function sequence({ command, src, rest, flags }) {
  const which = nameOrNumber(need(command, rest[0], "<animation name|n>"));
  const to = need(command, flags.o, "-o seq.json");
  const seq = smak.readSequence(src, which);
  save(
    to,
    JSON.stringify({
      name: seq.name,
      index: seq.index,
      fps: seq.fps,
      loops: seq.loops,
      bones: smak.bones(src).map((bone) => bone.name),
      frames: seq.frames.map((frame) => frame.map((values) => values.map((v) => +v.toFixed(5)))),
    }),
  );
  console.log(
    `${to}: ${seq.name}, ${seq.frames.length} frames of ${seq.frames[0]?.length ?? 0} bones at ${seq.fps} fps`,
  );
}
/**
 * The animation a file of numbers holds, as `sequence` writes it; the command stopped when the file is not
 * JSON, has no frames, or (to be added as a new animation) no name.
 */
function animationIn(command, jsonFile, named) {
  const text = readFileSync(existing(jsonFile), "utf8");
  const shape = "it is { name, fps, loops, frames }, as `smak sequence` writes it";
  let json;
  try {
    json = JSON.parse(text);
  } catch (error) {
    fail(`${command}: ${jsonFile} is not JSON (${error.message}): ${shape}`);
  }
  if (!Array.isArray(json?.frames) || !json.frames.length)
    fail(`${command}: ${jsonFile} has no frames: ${shape}`);
  if (named && typeof json.name !== "string") fail(`${command}: ${jsonFile} has no name: ${shape}`);
  return json;
}
/**
 * sequence-set and sequence-add: an animation from a file of numbers, in the place of one or after the last.
 */
function sequenceFromFile({ command, src, rest, flags }) {
  const adding = command === "sequence-add";
  if (adding && flags.from !== undefined) return sequenceFromFrames({ command, src, flags });
  const jsonFile = need(command, adding ? rest[0] : rest[1], "seq.json");
  const to = need(command, flags.o, "-o out.mdl");
  const json = animationIn(command, jsonFile, adding);
  const out = adding
    ? smak.addSequence(src, json)
    : smak.replaceSequence(src, nameOrNumber(rest[0]), {
        frames: json.frames,
        fps: json.fps,
        loops: json.loops,
      });
  save(to, out);
  const said = adding
    ? `${json.name} added as animation ${smak.sequences(out).length - 1}`
    : `animation ${rest[0]} now ${json.frames.length} frames`;
  console.log(`${to}: ${said}`);
}

/**
 * sequence-add --from: a new animation made of frames of one the model has, in the order --frames gives
 * ("80-57": backwards).
 */
function sequenceFromFrames({ command, src, flags }) {
  const to = need(command, flags.o, "-o out.mdl");
  const name = need(command, flags.name, "--name <the new animation's name>");
  const frames = need(command, flags.frames, '--frames <"80-57", "57,58,57">');
  const from = nameOrNumber(flags.from);
  const out = smak.addSequenceFrom(src, {
    from,
    frames,
    name: String(name),
    fps: numberOf(flags, "fps"),
    loops: Boolean(flags.loop),
    events: Boolean(flags.events),
  });
  save(to, out);
  const made = smak.sequences(out).at(-1);
  console.log(
    `${to}: ${made.name} added as animation ${smak.sequences(out).length - 1}: ${made.frames} frames of ${smak.readSequence(src, from).name} (${frames}) at ${made.fps} fps${made.loops ? ", looping" : ""}`,
  );
}

// ── re-skin by rules ───────────────────────────────────────────────────────
/** reskin: a file of rules (.json, or .mjs exporting `rules`) applied to the model, its textures before and after. */
async function reskin({ command, src, rest, flags }) {
  const rulesFile = existing(need(command, rest[0], "<rules.json|rules.mjs>"));
  const to = need(command, flags.o, "-o out.mdl");
  if (flags.pictures === true) fail(`${command}: --pictures needs a folder after it`);
  const read = /\.m?js$/i.test(rulesFile)
    ? await import(pathToFileURL(resolve(rulesFile)).href)
    : JSON.parse(readFileSync(rulesFile, "utf8"));
  const given = smak.rulesOf(read.default ?? read, rulesFile);
  const body = numberOf(flags, "body") ?? given.body ?? 0;
  const made = smak.reskin(src, given.rules, { body, pose: given.pose, own: given.own });
  save(to, made.mdl);
  for (const own of made.owned)
    console.log(`  own pixels: ${own.moved} triangles now wear ${own.texture} (${own.width}x${own.height}), islands ${own.islands.join(", ")}`);
  console.log(`${to}: body ${body}; ${made.changed.length} textures changed: ${made.changed.join(", ") || "none"}`);
  const shared = Object.entries(made.shared).filter(([, share]) => share > 0);
  if (shared.length)
    console.log(`  worn by two places of the body (a mark on one shows on the other): ${shared.map(([n, v]) => `${n} ${v}`).join(", ")}`);
  if (typeof flags.pictures === "string")
    for (const { name, image } of made.pictures) {
      const file = join(flags.pictures, `${fileNameOf(name)}_before_after.png`);
      save(file, smak.png(image.width, image.height, image.rgba));
      console.log(`  ${file}`);
    }
  const report = smak.check(made.mdl, "goldsrc", { source: src });
  for (const error of report.errors) console.log(`ERROR ${error}`);
  for (const warning of report.warnings) console.log(`WARN  ${warning}`);
}

// ── pieces, islands, layers ────────────────────────────────────────────────
function pieces({ src, flags }) {
  const min = numberOf(flags, "min") ?? PIECES_MIN_TRIANGLES;
  const body = numberOf(flags, "body");
  // with --body: the submodel of each bodypart that body number shows
  const shown = body === undefined ? null : smak.bodyOf(src, body);
  const seq = seqOf(src, flags);
  const list = smak
    .pieces(src, { seq })
    .list.filter((piece) => !shown || shown[piece.where.bodypart] === piece.where.model);
  console.log("  id  texture                 tris   middle (x y z)        size (x y z)");
  for (const piece of list.filter((p) => p.tris >= min)) {
    const size = piece.mx.map((v, axis) => (v - piece.mn[axis]).toFixed(1)).join(" ");
    console.log(
      `${String(piece.id).padStart(4)}  ${String(piece.tex).padEnd(22)} ${String(piece.tris).padStart(5)}   ${piece.mid.join(" ").padEnd(20)}  ${size}`,
    );
  }
  const small = list.filter((p) => p.tris < min).length;
  console.log(
    `${list.length} pieces${shown ? ` of body ${body}` : ""}, ${small} of them under ${min} triangles and not listed`,
  );
}
function islands({ src, flags }) {
  const min = numberOf(flags, "min") ?? ISLANDS_MIN_TRIANGLES;
  const body = numberOf(flags, "body");
  const shown = body === undefined ? null : smak.bodyOf(src, body);
  const mdl = smak.readMdl(src);
  const onlyTexture =
    flags.texture === undefined ? null : smak.textureOf(src, nameOrNumber(flags.texture)).name;
  const seq = seqOf(src, flags);
  const usedByBody = (island) => island.uses.some((use) => shown[use.bodypart] === use.model);
  const list = smak
    .uvIslands(src, { seq })
    .list.filter((island) => (!onlyTexture || island.tex === onlyTexture) && (!shown || usedByBody(island)));
  // an island's triangles: with --body, that body's own only
  const trisOf = (island) =>
    shown
      ? island.uses.reduce((sum, use) => sum + (shown[use.bodypart] === use.model ? use.tris : 0), 0)
      : island.tris;
  const wide = Math.max(7, ...list.map((island) => island.tex.length));
  const few = (items, most) =>
    `${items.slice(0, most).join(", ")}${items.length > most ? ` and ${items.length - most} more` : ""}`;
  console.log(
    `  id  ${"texture".padEnd(wide)}  tris  box in pixels        border (open)  middle (x y z)        faces (x y z)      bodies; bones`,
  );
  for (const island of list.filter((x) => trisOf(x) >= min)) {
    const bodies = [...new Set(island.uses.map((use) => use.body))];
    console.log(
      `${String(island.id).padStart(4)}  ${island.tex.padEnd(wide)} ${String(trisOf(island)).padStart(5)}  ${boxText(island.box).padEnd(20)} ${`${island.border} (${island.open})`.padEnd(14)} ${island.mid.join(" ").padEnd(20)}  ${island.n.join(" ").padEnd(18)} ${few(bodies, BODIES_LISTED)}; ${few(island.bones, BONES_LISTED)}`,
    );
  }
  const small = list.filter((x) => trisOf(x) < min).length;
  const total = list.reduce((sum, island) => sum + trisOf(island), 0);
  const counted = shown
    ? " of that body"
    : list.some((island) => island.bodies.length > 1)
      ? " over every body that uses them (an island two bodies share counts for both: --body n counts one)"
      : "";
  console.log(
    `${list.length} islands${shown ? ` of body ${body}` : ""}, ${small} of them under ${min} triangles and not listed; ${total} triangles${counted}`,
  );
  if (!flags.o) return;
  const textureNumbers = new Set(
    list.map((island) => mdl.textures.findIndex((texture) => texture.name === island.tex)),
  );
  for (const number of textureNumbers) {
    const map = smak.islandMap(src, number, { body });
    const to = join(flags.o, `islands_${fileNameOf(map.texture.name)}.png`);
    save(to, smak.png(map.width, map.height, map.rgba));
    console.log(
      `${to}  ${map.texture.width}x${map.texture.height} x${map.scale}, islands ${map.islands.join(" ")}; an open border is white, a seam in the island's colour`,
    );
  }
}
const luminance = (rgb) => 0.3 * rgb[0] + 0.59 * rgb[1] + 0.11 * rgb[2];
const saturation = (rgb) => Math.max(...rgb) - Math.min(...rgb);
/** A layer's line of JavaScript as a function; one that cannot be read stops the command, with why. */
function ruleOf(word, expression) {
  try {
    return new Function("place", "W", "lum", "sat", `with (place) return (${expression});`);
  } catch (error) {
    return fail(`layers: ${word} cannot be read as JavaScript: ${error.message}`);
  }
}
/** A module of layers loaded; one that cannot be stops the command, with why. */
async function layersModule(moduleFile) {
  try {
    return await import(pathToFileURL(resolve(existing(moduleFile))).href);
  } catch (error) {
    return fail(`layers: ${moduleFile} cannot be loaded: ${error.message}`);
  }
}
/**
 * The layers `layers` is asked for: those a module exports, and each `name=expression` as a layer whose
 * function is that line of JavaScript over what paint hands its function, with `lum`, `sat` and `W` beside.
 */
function layerDeclarations(rest, moduleFile, module) {
  const declarations = { ...(module.layers ?? module.default ?? {}) };
  for (const word of rest) {
    if (word === moduleFile) continue;
    const equals = word.indexOf("=");
    if (equals < 1) fail(`layers: ${word} is neither a module nor name=expression`);
    const rule = ruleOf(word, word.slice(equals + 1));
    declarations[word.slice(0, equals)] = (place) =>
      rule(place, smak.workshop, luminance(place.rgb), saturation(place.rgb));
  }
  if (!Object.keys(declarations).length)
    fail("layers: give a module that exports `layers`, or name=expression");
  return declarations;
}
/** One layer's pixels counted and its regions listed, but for those under `min` pixels. */
function printLayer(layer, min) {
  const point = (p) => p.map((v) => v.toFixed(1)).join(" ");
  let on = 0;
  for (const value of layer.value) if (value >= 0.5) on++;
  const small = layer.regions.filter((region) => region.size < min).length;
  console.log(
    `\n${layer.name}: ${on} pixels in ${layer.regions.length} regions${small ? `, ${small} of them under ${min} pixels and not listed` : ""}`,
  );
  if (small < layer.regions.length)
    console.log(
      "    id   size  box in pixels        centre        from (x y z)        to (x y z)          islands",
    );
  for (const region of layer.regions.filter((r) => r.size >= min)) {
    const centre = region.centre.map((v) => v.toFixed(1)).join(",");
    const from = region.mn ? point(region.mn) : "-";
    const to = region.mx ? point(region.mx) : "-";
    console.log(
      `  ${String(region.id).padStart(4)} ${String(region.size).padStart(6)}  ${boxText(region.box).padEnd(20)} ${centre.padEnd(13)} ${from.padEnd(19)} ${to.padEnd(19)} ${region.islands.join(" ")}`,
    );
  }
}
async function layers({ src, rest, flags }) {
  const moduleFile = rest.find((word) => /\.m?js$/i.test(word));
  const module = moduleFile ? await layersModule(moduleFile) : {};
  const declarations = layerDeclarations(rest, moduleFile, module);
  const min = numberOf(flags, "min") ?? LAYERS_MIN_PIXELS;
  // the pose: the model's first animation, then what the module says, then what the flags say
  const pose = {
    seq: firstSeq(src),
    ...(module.pose ?? {}),
    ...defined({ seq: seqAsked(flags), body: numberOf(flags, "body") }),
  };
  const tex =
    flags.texture === undefined ? module.tex : smak.textureOf(src, nameOrNumber(flags.texture)).name;
  const made = smak.layersOf(src, declarations, { pose, tex });
  const all = Object.values(made);
  if (!all.length) fail("layers: none of them is for this texture");
  const first = all[0];
  console.log(
    `${first.tex} ${first.width}x${first.height}, as body ${pose.body ?? 0} stands ${pose.seq === null ? "at rest" : `in animation ${pose.seq}`}`,
  );
  for (const layer of all) printLayer(layer, min);
  if (!flags.o) return;
  const map = smak.layerMap(src, first.tex, made, { min });
  const to = /\.png$/i.test(flags.o) ? flags.o : join(flags.o, `layers_${fileNameOf(first.tex)}.png`);
  save(to, smak.png(map.width, map.height, map.rgba));
  console.log(
    `\n${to}  ${first.width}x${first.height} x${map.scale}: ${all.map((layer) => layer.name).join(", ")}, each in the colour its name is written in; regions of ${min} pixels and more numbered`,
  );
}

// ── a model from an .obj file ──────────────────────────────────────────────
/** The file a material's picture is in: as the .mtl names it from the .obj's folder, or by its name alone. */
function pictureFileOf(folder, named) {
  // a file written on Windows may name it with backslashes
  const withSlashes = named.replaceAll("\\", "/");
  const asWritten = resolve(folder, withSlashes);
  const beside = join(folder, basename(withSlashes));
  return [asWritten, beside].find((candidate) => existsSync(candidate));
}
/**
 * obj: an .obj file made into a model. The .mtl files it names and the pictures those name are looked for
 * beside it; what is not found, or is not a PNG or a BMP, is said and the material wears its flat colour.
 */
function obj({ command, file, flags }) {
  const to = need(command, flags.o, "-o out.mdl");
  const folder = dirname(file);
  const notes = [];
  const text = readFileSync(file, "utf8");
  // the materials: of every .mtl the file names that is there
  const materials = [];
  for (const library of smak.readObj(text).libraries) {
    const libraryFile = pictureFileOf(folder, library);
    if (libraryFile) materials.push(...smak.readMtl(readFileSync(libraryFile, "utf8")));
    else notes.push(`${library}, which the file names for its materials, is not beside it`);
  }
  // their pictures
  const textures = {};
  for (const material of materials) {
    if (!material.picture) continue;
    const pictureFile = pictureFileOf(folder, material.picture);
    if (!pictureFile) notes.push(`${material.picture} is not beside the .obj`);
    else if (!/\.(png|bmp)$/i.test(pictureFile))
      notes.push(
        `${material.picture} is not a PNG or a BMP, the pictures that are read: save it as one and name that in the .mtl`,
      );
    else textures[material.name] = readFileSync(pictureFile);
  }
  const made = smak.objModel(smak.readObj(text, { mtl: materials }), {
    name: flags.name === undefined ? basename(to) : String(flags.name),
    textures,
    ...defined({
      scale: numberOf(flags, "scale"),
      up: flags.up,
      turn: numberOf(flags, "turn"),
      maxTextureSize: numberOf(flags, "max-texture"),
    }),
    ground: Boolean(flags.ground),
    centre: Boolean(flags.centre),
  });
  save(to, made.mdl);

  const { report } = made;
  const size = report.box.mx.map((v, axis) => (v - report.box.mn[axis]).toFixed(1)).join(" x ");
  const parts = report.bodyparts > 1 ? ` in ${report.bodyparts} bodyparts` : "";
  console.log(
    `${to}: "${report.name}", ${made.mdl.length} bytes, ${report.triangles} triangles on ${report.points} points${parts}`,
  );
  console.log(
    `  ${size} units (x y z), from ${report.box.mn.map((v) => v.toFixed(1)).join(" ")} to ${report.box.mx.map((v) => v.toFixed(1)).join(" ")}; one bone (root), one animation (idle)`,
  );
  for (const texture of report.textures)
    console.log(
      `  ${texture.name.padEnd(24)} ${texture.width}x${texture.height}  ${texture.material ? `material ${texture.material}` : "the faces without a material"}: ${texture.from}`,
    );
  for (const note of [...notes, ...made.warnings]) console.log(`WARN  ${note}`);
  // what each engine makes of it: the same sentence is printed once
  const told = new Set();
  let errors = 0;
  for (const engine of ["goldsrc", "xash"]) {
    const checked = smak.check(made.mdl, engine);
    errors += checked.errors.length;
    for (const line of [
      ...checked.warnings.map((warning) => `WARN  ${warning}`),
      ...checked.errors.map((error) => `ERROR ${error}`),
    ]) {
      if (!told.has(line)) console.log(line);
      told.add(line);
    }
  }
  console.log(errors ? `${errors} errors: not fit for the game` : "fit for goldsrc and xash");
  process.exit(errors ? 1 : 0);
}

// ── a model from another tool's file ───────────────────────────────────────
/** What `import` and `item` hand the readers and the makers, from the flags. */
const importAsked = (flags) =>
  defined({
    up: flags.up,
    scale: numberOf(flags, "scale"),
    fit: numberOf(flags, "fit"),
    origin: flags.origin,
    turn: numberOf(flags, "turn"),
    maxTextureSize: numberOf(flags, "max-texture"),
  });
/** The pictures a file carries inside it, written out as the files they are: for one that is not read (a JPEG). */
function savePictures(read, folder) {
  read.images.forEach((image, i) => {
    const ending = /png/i.test(image.mime) ? "png" : /jpe?g/i.test(image.mime) ? "jpg" : "bin";
    const to = join(folder, `${String(i).padStart(2, "0")}_${fileNameOf(basename(image.name || "picture"))}.${ending}`);
    save(to, image.bytes);
    console.log(`  ${to}  ${image.bytes.length} bytes`);
  });
  if (!read.images.length) console.log("  the file carries no pictures inside it");
}
/** One line of the table `import` prints of a folder. */
const importRow = (row) =>
  row.error
    ? `FAIL  ${row.file}: ${row.error}`
    : `${String(row.triangles).padStart(9)} ${String(row.points).padStart(6)} ${String(row.meshes).padStart(6)} ${`${row.pictures}/${row.materials}`.padStart(8)}  ${row.size.join(" x ").padEnd(24)} ${row.file}${row.bones ? `  [${row.bones} bones, ${row.animations} animations: not in a prop]` : ""}${row.heavy ? "  HEAVY" : ""}`;
/** The lines `import` and `obj` end with: what each engine makes of a model. Returns how many errors. */
function sayChecks(mdl) {
  const told = new Set();
  let errors = 0;
  for (const engine of ENGINES) {
    const checked = smak.check(mdl, engine);
    errors += checked.errors.length;
    for (const line of [
      ...checked.warnings.map((warning) => `WARN  ${warning}`),
      ...checked.errors.map((error) => `ERROR ${error}`),
    ]) {
      if (!told.has(line)) console.log(line);
      told.add(line);
    }
  }
  return errors;
}
/**
 * import: a model file of another tool (.fbx, .glb, .gltf, .obj) looked into and, with -o, made into a prop;
 * a folder of them, with -o a folder, made into props with a contact sheet and a table.
 */
function imported({ command, file, flags }) {
  const asked = importAsked(flags);
  if (statSync(file).isDirectory()) {
    const to = need(command, flags.o, "-o <folder>: where the models of a folder go");
    console.log("triangles points meshes pictures  size (units, x y z)      file");
    const done = smak.importFolder(file, to, {
      ...asked,
      texture: flags.texture,
      size: numberOf(flags, "size"),
      only: flags.only ? String(flags.only).toLowerCase().split(",") : null,
      said: (row) => console.log(importRow(row)),
    });
    const made = done.rows.filter((row) => !row.error);
    // a picture made smaller is what nearly every bought picture needs: counted, not said file by file
    const routine = /larger than \d+: made \d+x\d+$/;
    for (const row of made)
      for (const warning of row.warnings) if (!routine.test(warning)) console.log(`WARN  ${row.file}: ${warning}`);
    const smaller = made.filter((row) => row.warnings.some((warning) => routine.test(warning))).length;
    if (smaller) console.log(`${smaller} models have a picture larger than the engine draws, made smaller (import.json says which)`);
    for (const row of made) if (row.heavy) console.log(`HEAVY ${row.file}: ${row.heavy}`);
    save(join(to, "import.json"), JSON.stringify(done.rows, null, 1));
    console.log(
      `${made.length} models in ${to}, ${made.reduce((sum, row) => sum + row.triangles, 0)} triangles; ${made.filter((row) => row.missing).length} with a material that found no picture; ${made.filter((row) => row.heavy).length} heavy; ${done.failed} failed`,
    );
    for (const sheet of done.sheets) console.log(`${sheet}: the models drawn from three quarters, with their textures`);
    console.log(`${join(to, "import.json")}: the table`);
    process.exit(done.failed ? 1 : 0);
  }
  const read = smak.readModelFile(file, asked);
  const summary = smak.importSummary(read);
  if (flags.json && !flags.o) {
    console.log(JSON.stringify({ file, format: read.format, version: read.version, axes: read.axes, unit: read.unit, ...summary.totals, meshes: read.meshes, materials: read.materials.map(({ name, colour, picture, image }) => ({ name, colour, picture, inside: image !== undefined })), nodes: read.nodes.map(({ name, parent, kind }) => ({ name, parent, kind })), joints: read.joints, animations: read.animations.map(({ name, duration, nodes }) => ({ name, duration, nodes: nodes.length })), warnings: read.warnings }, null, 1)); // prettier-ignore
    return;
  }
  console.log(`${file}:`);
  for (const line of summary.lines) console.log(/^WARN/.test(line) ? line : `  ${line}`);
  const found = smak.picturesOf(file, read, { texture: flags.texture });
  console.log("pictures:");
  for (const line of found.lines) console.log(`  ${line}`);
  if (flags["save-pictures"]) savePictures(read, flags["save-pictures"]);
  if (!flags.o) {
    if (summary.totals.triangles) console.log(`as a prop (-o out.mdl): ${smak.importScale(read, asked).said}`);
    return;
  }
  const to = flags.o;
  const name = flags.name === undefined ? basename(to) : String(flags.name);
  const made = flags.anim
    ? smak.importRigged(read, {
        ...asked,
        name,
        pictures: found.pictures,
        animations: flags.anim === true ? undefined : String(flags.anim).split(","),
        fps: numberOf(flags, "fps"),
      })
    : smak.importModel(read, { ...asked, name, pictures: found.pictures });
  save(to, made.mdl);
  const { report } = made;
  const size = report.box.mx.map((v, axis) => (v - report.box.mn[axis]).toFixed(1)).join(" x ");
  console.log(
    `${to}: "${report.name}", ${made.mdl.length} bytes, ${report.triangles} triangles on ${report.points} points${report.bodyparts > 1 ? ` in ${report.bodyparts} bodyparts` : ""}`,
  );
  console.log(`  size: ${report.scale.said}`);
  console.log(
    `  ${size} units (x y z), from ${report.box.mn.map((v) => v.toFixed(1)).join(" ")} to ${report.box.mx.map((v) => v.toFixed(1)).join(" ")}; ${report.bones ? `${report.bones.length} bones` : "one bone (root), one animation (idle)"}`,
  );
  for (const texture of report.textures)
    console.log(
      `  ${texture.name.padEnd(24)} ${texture.width}x${texture.height}  ${texture.material ? `material ${texture.material}` : "the faces without a material"}: ${texture.from}`,
    );
  for (const sequence of report.sequences ?? [])
    console.log(`  animation ${sequence.name}: ${sequence.frames} frames at ${sequence.fps} a second`);
  for (const warning of made.warnings) console.log(`WARN  ${warning}`);
  if (report.heavy) console.log(`WARN  ${report.heavy}`);
  const errors = sayChecks(made.mdl);
  if (flags.pictures) {
    const picture = smak.sheet(made.mdl, defined({ size: numberOf(flags, "size") }));
    const sheetFile = `${to.replace(/\.mdl$/i, "")}.png`;
    save(sheetFile, smak.png(picture.width, picture.height, picture.rgba));
    console.log(`  ${sheetFile}: six views of it`);
  }
  console.log(errors ? `${errors} errors: not fit for the game` : "fit for goldsrc and xash");
  process.exit(errors ? 1 : 0);
}
/**
 * A bought model as the piece `item` adds: read, its pictures found, laid along the axes a piece is drawn
 * in (`importPiece`), with what was taken for granted printed. Returns { piece, texture }.
 */
function boughtPiece({ command, file, flags, family, name }) {
  const read = smak.readModelFile(file, importAsked(flags));
  // for a bought model --texture is the file of its picture, not the name it has in the game's files
  const given = flags.texture === undefined ? undefined : existing(String(flags.texture));
  const found = smak.picturesOf(file, read, { texture: given });
  const piece = smak.importPiece(read, {
    pictures: found.pictures,
    as: flags.as ?? (family.how === "shield" ? "shield" : "auto"),
    ...defined({ axis: flags.axis, grip: flags.grip }),
    flip: Boolean(flags.flip),
  });
  console.log(
    `${command}: ${basename(file)}: ${piece.tris.length} triangles, a picture of ${piece.image.width}x${piece.image.height}, held as ${piece.as}`,
  );
  for (const line of found.lines) console.log(`      ${line}`);
  for (const line of piece.assumed) console.log(`      assumed: ${line}`);
  return { piece, texture: smak.pieceTexture(piece, `${name}.bmp`) };
}

// ── an item added to a family of a mod's models ────────────────────────────
/**
 * item: a piece, made by a module, added as new submodels to every file a family of the mod's profile shows
 * its kind of item from (`addItem`): the files are looked for in --base and then in the game's folders, the
 * thing each placement is laid on is measured in the game's own, and what comes of it is checked and written
 * under -o by the same paths. A file that holds the item already is left as it is.
 */
async function item({ command, file, flags, listed }) {
  const mod = (await profileOf(flags, listed)) ?? fail(`${command}: --mod <profile>: the families are a profile's \`items\``); // prettier-ignore
  const families = mod.items ?? {};
  const known = Object.keys(families).join(", ") || "the profile has none";
  const family = families[need(command, flags.family, `--family <name>: ${known}`)];
  if (!family) fail(`${command}: the profile has no family ${flags.family}: ${known}`);
  const to = need(command, flags.o, "-o <folder>");
  const name = need(command, flags.name, "--name <the word its submodels are named with>");
  // a bought model (.fbx, .glb, .gltf, .obj) is its own piece; anything else is a module that makes one
  const bought = smak.MODEL_FILE.test(file) ? boughtPiece({ command, file, flags, family, name }) : null;
  const module = bought ? { piece: bought.piece } : await import(pathToFileURL(resolve(existing(file))).href);
  const maker = module.default ?? module.piece;
  const piece = typeof maker === "function" ? await maker() : maker;
  if (!piece?.tris && typeof piece?.shield !== "function")
    fail(
      `${command}: ${basename(file)} is to export a piece ({ tris, image }, as the kits make one), or a function that makes it, as its default`,
    );
  /** a file of the game as installed: the first of its folders that has it */
  const own = (path) => {
    const folder = mod.folders.find((each) => existsSync(join(each, path)));
    return folder ? readFileSync(join(folder, path)) : fail(`${command}: ${path} is in none of the game's folders (--game <the mod's folder>)`); // prettier-ignore
  };
  const read = (path) =>
    flags.base && existsSync(join(flags.base, path)) ? readFileSync(join(flags.base, path)) : own(path);
  const began = new Map();
  const result = smak.addItem(
    (path) => began.get(path) ?? began.set(path, read(path)).get(path),
    { name, piece, texture: bought?.texture ?? flags.texture ?? `${name}.bmp` },
    family,
    { reference: own, existing: "same" },
  );
  let wrong = 0;
  for (const place of result.placed)
    console.log(
      `${place.kept ? "kept " : "added"} ${place.file} ${place.name}: submodel ${place.model}, on ${place.report.bones.join(" + ")} as ${place.report.like}, ${place.report.tris} triangles, ${place.report.turn}, box off by ${round2(place.report.boxOff)}`,
    );
  for (const [path, mdl] of result.files) {
    for (const line of smak.keptWhole(began.get(path), mdl).lines) {
      if (!line.ok) wrong++;
      console.log(`${line.ok ? "ok   " : "FAIL "} ${path}: ${line.text}`);
    }
    for (const engine of ENGINES) {
      const report = smak.check(mdl, engine);
      wrong += report.errors.length;
      for (const error of report.errors) console.log(`ERROR ${path} (${engine}): ${error}`);
      for (const warning of report.warnings) console.log(`WARN  ${path} (${engine}): ${warning}`);
    }
    save(join(to, path), mdl);
    console.log(`      ${join(to, path)}: ${mdl.length} bytes`);
    if (flags.pictures) {
      const sheet = smak.itemSheet(mdl, result.placed.filter((place) => place.file === path)); // prettier-ignore
      const picture = join(to, "pictures", `${name}_${basename(path).replace(/\.mdl$/i, "")}.png`);
      save(picture, smak.png(sheet.width, sheet.height, sheet.rgba));
      console.log(`      ${picture}: each new submodel beside the one it was laid on`);
    }
  }
  console.log(`its script${family.script ? ` (after ${family.script})` : ""}:`);
  for (const line of smak.itemConstants(result)) console.log(`  ${line}`);
  process.exit(wrong ? 1 : 0);
}

// ── scripts of one's own against the game's ────────────────────────────────
/** A map's name and its entities, each a plain object of its keys: of a .bsp or of brush source. */
function mapForScripts(file) {
  const name = basename(file).replace(/\.(bsp|map)$/i, "");
  if (isSource(file))
    return { name, entities: maps.readMap(readFileSync(file, "utf8")).entities.map((entity) => ({ ...entity })) }; // prettier-ignore
  return { name, entities: readCompiled(file).bsp.entities.map((entity) => Object.fromEntries(entity)) };
}
/**
 * What `scriptsPlaced` found, printed: every script with its place, or only what is wrong. Returns how many
 * warnings there were.
 */
function sayScripts(placed, { all = true } = {}) {
  if (all) {
    for (const fact of placed.facts) console.log(`      ${fact}`);
    for (const script of placed.scripts)
      console.log(
        script.state === "replaces"
          ? `replaces  ${script.name}`
          : script.state === "named"
            ? `new       ${script.name}: named by ${script.by[0]}${script.by.length > 1 ? ` and ${script.by.length - 1} more` : ""}`
            : `UNNAMED   ${script.name}`,
      );
  }
  for (const warning of placed.warnings) console.log(`WARN  ${warning}`);
  return placed.warnings.length;
}
/**
 * The scripts of some folders placed against a profile's pack, with the maps that may name them; `only`:
 * the maps looked at, when a script named by nothing is to be warned of only when it is theirs.
 */
function placeScripts(mod, folders, mapFiles, shippedFolder, only) {
  const pack = mod.scriptPack;
  const ours = new Map();
  for (const folder of folders) for (const [name, script] of pack.loose(folder)) ours.set(name, script);
  const given = mapFiles.map(mapForScripts);
  return maps.scriptsPlaced({
    ours,
    shipped: pack.shipped(shippedFolder),
    maps: given,
    rules: pack,
    mapNames: [...(pack.maps?.() ?? []), ...given.map((map) => map.name)],
    ...(only ? { only } : {}),
  });
}
/**
 * scripts: folders of scripts of one's own against the scripts the game ships: which take a game script's
 * place, which are new and named by a map or a script, which are named by nothing. The rest of the words
 * are more folders, and maps (.bsp or .map) whose entities may name a script.
 */
async function scripts({ command, file, rest, flags, listed }) {
  const mod = (await profileOf(flags, listed)) ?? fail(`${command}: --mod <profile>: how a game names its scripts is its profile's`); // prettier-ignore
  if (!mod.scriptPack) fail(`${command}: the profile ${mod.name} has no \`scriptPack\`: it says nothing of scripts`);
  const words = [file, ...rest];
  const mapFiles = words.filter((word) => /\.(bsp|map)$/i.test(word)).map(existing);
  const folders = words.filter((word) => !/\.(bsp|map)$/i.test(word));
  for (const folder of folders)
    if (!existsSync(folder) || !statSync(folder).isDirectory()) fail(`${command}: no such folder: ${folder}`);
  const shipped = flags.shipped === undefined ? undefined : existingFolder(flags.shipped);
  const placed = placeScripts(mod, folders, mapFiles, shipped);
  if (flags.json) console.log(JSON.stringify(placed, null, 2));
  else {
    const warned = sayScripts(placed);
    console.log(warned ? `${warned} warnings` : "every script of ours replaces one of the game's or is named");
  }
  process.exit(0);
}

// ── the two pages ──────────────────────────────────────────────────────────
// Both keep running until the process is stopped.
const forever = () => new Promise(() => {});
async function view({ file, rest, flags }) {
  const { view: startViewer } = await import("../viewer/serve.mjs");
  for (const root of rest) if (!existsSync(root)) fail(`no such file: ${root}`);
  await startViewer([file, ...rest], numberOf(flags, "port") || VIEWER_PORT);
  await forever();
}
async function edit({ file, flags }) {
  const { serve } = await import("../editor/serve.mjs");
  await serve(file, {
    port: numberOf(flags, "port") || EDITOR_PORT,
    work: flags.work,
    engine: flags.engine,
  });
  await forever();
}

// ── the MCP server ─────────────────────────────────────────────────────────
/** mcp: the kit as an MCP server on stdin and stdout, until the client closes stdin (see mcp/README.md). */
async function mcp({ flags }) {
  const { start } = await import("../mcp/server.mjs");
  try {
    await start({ models: flags.models, work: flags.work, run: flags.run !== false });
  } catch (error) {
    fail(`mcp: ${error.message}`);
  }
  process.exit(0);
}

// ── maps ───────────────────────────────────────────────────────────────────
// A map command reads its own file: a compiled map (.bsp), brush source (.map) or a texture file (.wad).
const { maps } = smak;

/** A flag's value as `count` numbers with commas between (`--from 96,96,40`); undefined when not given. */
function numbersOf(flags, name, count, what) {
  const value = flags[name];
  if (value === undefined) return undefined;
  const numbers = String(value)
    .split(/[,\s]+/)
    .filter(Boolean)
    .map(Number);
  if (numbers.length !== count || !numbers.every(Number.isFinite)) fail(`--${name}: ${what}, not ${value}`);
  return numbers;
}
/** Whether a file is brush source (a .map) and not a compiled map. */
const isSource = (file) => /\.map$/i.test(file);
/** A compiled map read: `{ bytes, bsp }`. */
function readCompiled(file) {
  const bytes = readFileSync(file);
  return { bytes, bsp: maps.readBsp(bytes) };
}
/** A folder a flag names, or the command stopped. */
function existingFolder(folder) {
  if (!existsSync(folder) || !statSync(folder).isDirectory()) fail(`--game: no such folder: ${folder}`);
  return folder;
}
/**
 * Where a map's .wad files are looked for: the folders given with --game (the mod's own, then valve), then
 * the map's own folder.
 */
const gameFolders = (file, listed) => [...(listed.game ?? []).map(existingFolder), dirname(file)];
/** The textures of the .wad files given with --wad. */
const wadTextures = (listed) =>
  (listed.wad ?? []).flatMap((wad) => maps.readWad(readFileSync(existing(wad))).textures);
/** A texture's name as a file's: itself, but for what a file system refuses. */
const pictureNameOf = (name) => name.replace(/[\\/:*?"<>|]/g, "_");
/** A point as the lists print it. */
const placeText = (point) => point.map((value) => Math.round(value * 100) / 100).join(" ");

/** What the map pictures are asked for, from the flags; a wrong one stops the command. */
function pictureOptions(file, flags, listed) {
  if (flags.light !== undefined && flags.light !== false && !LIGHTS.includes(flags.light))
    fail(`--light: ${LIGHTS.join(" or ")} (or --no-light), not ${flags.light}`);
  if (flags.entities !== undefined && flags.entities !== false && !MARKED.includes(flags.entities))
    fail(`--entities: ${MARKED.join(", ")} (or --no-entities), not ${flags.entities}`);
  const options = defined({
    folders: gameFolders(file, listed),
    textures: wadTextures(listed),
    width: numberOf(flags, "width"),
    height: numberOf(flags, "height"),
    brightness: numberOf(flags, "brightness"),
    light: flags.light,
    entities: flags.entities === "none" ? false : flags.entities,
    labels: flags.labels,
    // the sky's picture and the sprites are drawn where the --game folders have them, unless told not to
    sky: flags.sky === false ? false : numbersOf(flags, "sky", 3, "three numbers r,g,b"),
    sprites: flags.sprites === false ? false : undefined,
    modelScale: flags["model-scale"] === false ? false : undefined,
  });
  for (const name of ["width", "height"])
    if (name in options && !(Number.isInteger(options[name]) && options[name] >= 16 && options[name] <= 4096))
      fail(`--${name}: a whole number from 16 to 4096, not ${options[name]}`);
  if ("brightness" in options && !(options.brightness > 0))
    fail(`--brightness: a number over 0, not ${options.brightness}`);
  return options;
}
/** An entity as a flag names it: its number, or a classname or a targetname. */
const entityName = (word) => (/^\d+$/.test(word) ? Number(word) : word);
/** `name=value` flags given several times, as one object; one that is not `name=value` stops the command. */
function namedValues(listed, flag, what) {
  const values = {};
  for (const word of listed[flag] ?? []) {
    const equals = word.indexOf("=");
    if (equals < 1 || equals === word.length - 1) fail(`--${flag}: ${what}, not ${word}`);
    values[word.slice(0, equals)] = word.slice(equals + 1);
  }
  return values;
}
/**
 * How point entities are drawn at their true size, from the flags: `--body name=large` (the box a class or
 * a targetname moves with), `--models` (the models that are named are drawn, from the --game folders) and
 * `--model name=models/x.mdl` (the model of a class, a targetname or a scriptfile).
 */
function figureOptions(flags, listed) {
  const bodies = namedValues(listed, "body", "name=standing|large|crouching");
  for (const [name, body] of Object.entries(bodies))
    if (!Object.hasOwn(maps.BODIES, body) || body === "point")
      fail(`--body ${name}=${body}: standing, large or crouching`);
  const named = namedValues(listed, "model", "name=models/file.mdl");
  const models = Object.keys(named).length ? named : flags.models === true ? true : undefined;
  return defined({ bodies: Object.keys(bodies).length ? bodies : undefined, models });
}
/** What the walk test is asked for, from the flags; a wrong one stops the command. */
function reachOptions(flags, listed) {
  if (flags.doors !== undefined && !DOORS.includes(flags.doors))
    fail(`--doors: ${DOORS.join(" or ")}, not ${flags.doors}`);
  const jump = flags.jump === undefined || flags.jump === true ? flags.jump : numberOf(flags, "jump");
  const cell = numberOf(flags, "cell");
  if (cell !== undefined && !(cell >= 1)) fail(`--cell: the grid in units, 1 at the least, not ${cell}`);
  const { bodies } = figureOptions(flags, listed);
  const speed = numberOf(flags, "speed");
  const gravity = numberOf(flags, "gravity");
  for (const [name, value] of Object.entries({ speed, gravity }))
    if (value !== undefined && !(value > 0)) fail(`--${name}: a number over 0, not ${value}`);
  if (flags.walls !== undefined && flags.walls !== "standing" && flags.walls !== "gone")
    fail(`--walls: standing or gone, not ${flags.walls}`);
  return defined({
    bodies,
    from: listed.start?.map(entityName),
    to: listed.goal?.map(entityName),
    open: listed.open?.map(entityName),
    shut: listed.shut?.map(entityName),
    exits: listed.exit?.map(entityName),
    doors: flags.doors,
    walls: flags.walls,
    parts: flags.parts === false ? false : undefined,
    jump,
    speed,
    gravity,
    slopes: flags.slopes === false ? false : undefined,
    cell,
  });
}
/** A map read for a picture or a test: brush source from a .map, a compiled map from anything else. */
const readEither = (file) =>
  isSource(file) ? maps.readMap(readFileSync(file, "utf8")) : readCompiled(file).bsp;
/** A picture saved, and its line printed with what it shows; then its notes, a line each. */
function savePicture(to, picture, shows) {
  save(to, smak.png(picture.width, picture.height, picture.rgba));
  console.log(`${to}  ${picture.width}x${picture.height}  ${shows}`);
  for (const note of picture.facts.notes ?? []) console.log(`      ${note}`);
}

// ── map-info, map-check ────────────────────────────────────────────────────
/** Everything `map-info` tells of a map, as `--json` prints it. */
function describeMap(file, bytes, bsp) {
  const world = maps.worldBounds(bsp);
  const wanted = maps.wantedTextures(bsp);
  const classes = {};
  for (const entity of bsp.entities) {
    const classname = maps.valueOf(entity, "classname") ?? "(no classname)";
    classes[classname] = (classes[classname] ?? 0) + 1;
  }
  const styles = new Set();
  for (const face of bsp.faces)
    if (maps.hasLightmap(bsp, face)) for (const style of face.styles) if (style !== 255) styles.add(style);
  const world0 = bsp.entities[0] ?? [];
  return {
    file,
    bytes: bytes.length,
    version: bsp.version,
    title: maps.valueOf(world0, "maptitle") ?? maps.valueOf(world0, "message") ?? "",
    bounds: world,
    lumps: Object.fromEntries(
      maps.LUMP_NAMES.map((name) => {
        const size = maps.ENTRY_SIZES[name];
        const entries = size ? bsp.lumps[name].length / size : undefined;
        return [name, defined({ bytes: bsp.lumps[name].length, entries })];
      }),
    ),
    entities: bsp.entities.length,
    brushEntities: bsp.models.length - 1,
    classes,
    textures: bsp.textures.map((texture) => ({
      name: texture.name,
      width: texture.width,
      height: texture.height,
      inside: Boolean(texture.embedded),
    })),
    wads: wanted.wads,
    light: { bytes: bsp.lumps.lighting.length, styles: [...styles].sort((a, b) => a - b) },
    visibility: bsp.lumps.visibility.length,
  };
}
function mapInfo({ file, flags }) {
  const { bytes, bsp } = readCompiled(file);
  const data = describeMap(file, bytes, bsp);
  if (flags.json) {
    console.log(JSON.stringify(data, null, 1));
    return;
  }
  const pad = (value, width) => String(value).padStart(width);
  const { mins, maxs } = data.bounds;
  const size = maxs.map((value, axis) => Math.round(value - mins[axis])).join(" x ");
  console.log(
    `${file}: a GoldSrc map (version ${data.version}), ${data.bytes} bytes${data.title ? `, "${data.title}"` : ""}`,
  );
  console.log(`the world: from ${placeText(mins)} to ${placeText(maxs)} (${size} units; +z is up)`);

  console.log("\nLUMPS");
  for (const [name, lump] of Object.entries(data.lumps))
    console.log(
      `  ${name.padEnd(14)} ${pad(lump.bytes, 9)} bytes${lump.entries === undefined ? "" : ` ${pad(lump.entries, 7)}`}`,
    );

  console.log(
    `\nENTITIES (${data.entities}): ${data.brushEntities} of them made of brushes   map-entities lists them, each with its number`,
  );
  const commonest = Object.entries(data.classes).sort((a, b) => b[1] - a[1]);
  for (const [classname, count] of commonest) console.log(`  ${pad(count, 5)} ${classname}`);

  const inside = data.textures.filter((texture) => texture.inside).length;
  console.log(
    `\nTEXTURES (${data.textures.length}): ${inside} with their pixels inside the map, ${data.textures.length - inside} wanted from .wad files`,
  );
  for (const texture of data.textures)
    console.log(
      `  ${texture.name.padEnd(16)} ${`${texture.width}x${texture.height}`.padEnd(9)} ${texture.inside ? "inside" : "WANTED from a .wad"}`,
    );
  if (data.wads.length) console.log(`  the worldspawn lists: ${data.wads.join(", ")}`);

  console.log(
    data.light.bytes
      ? `\nLIGHT  ${data.light.bytes} bytes, baked; styles ${data.light.styles.join(" ")}   (0 always on, 1 to 31 flicker, 32 and up are switched)`
      : "\nLIGHT  none: the map was not passed through hlrad, and is drawn fully bright",
  );
  console.log(
    data.visibility
      ? `VISIBILITY  ${data.visibility} bytes`
      : "VISIBILITY  none: the whole map is drawn from everywhere (a leak, or no hlvis)",
  );
}
/**
 * The mod's profile a command is given with --mod: `goldsrc` for the kit's own, or a profile's file (.mjs or
 * .json), which is handed the --game folders, the --cache file and the --scripts folders. Undefined without
 * the flag.
 */
async function profileOf(flags, listed) {
  if (flags.mod === undefined) return undefined;
  const folders = (listed.game ?? []).map(existingFolder);
  if (flags.mod === "goldsrc") return { ...maps.GOLDSRC, folders };
  const mod = await maps.loadMod(
    existing(flags.mod),
    defined({ folders: folders.length ? folders : undefined, cache: flags.cache, scripts: listed.scripts }),
  );
  return !mod.folders.length && folders.length ? { ...mod, folders } : mod;
}
/** The entity definitions given by name: .fgd files (--fgd) and what map-learn wrote (--learned). */
function definitionsGiven(listed) {
  const given = [
    ...(listed.fgd ?? []).map(existing),
    ...(listed.learned ?? []).map((file) => JSON.parse(readFileSync(existing(file), "utf8"))),
  ];
  return given.length ? given : undefined;
}
/**
 * map-check: a compiled map against an engine, or brush source before a compile; with a mod's profile or
 * entity definitions, its entities against the mod too.
 */
async function mapCheck({ file, flags, listed }) {
  const engine = flags.engine ?? "goldsrc";
  const folders = listed.game ? gameFolders(file, listed) : undefined;
  const against = defined({ mod: await profileOf(flags, listed), definitions: definitionsGiven(listed) });
  const source = isSource(file);
  const textures = listed.wad?.flatMap((wad) => maps.wadTextureNames(readFileSync(existing(wad))));
  const report = source
    ? maps.checkPlan(maps.readMap(readFileSync(file, "utf8")), defined({ ...against, folders, textures }))
    : maps.checkBsp(readFileSync(file), { engine, folders, ...against });
  for (const fact of report.facts) console.log(`      ${fact}`);
  for (const warning of report.warnings) console.log(`WARN  ${warning}`);
  for (const error of report.errors) console.log(`ERROR ${error}`);
  // the script folders given, against the game's pack: one of ours that replaces nothing and is named by
  // nothing is laid over the pack for no one (`smak scripts` lists them all). Of this map's own only, unless
  // --all: a script of another map is named by that map, which is not looked at here
  let unnamed = 0;
  if (listed.scripts?.length && against.mod?.scriptPack) {
    const only = flags.all === true ? undefined : [mapForScripts(file).name];
    const placed = placeScripts(against.mod, listed.scripts, [file], flags.shipped && existingFolder(flags.shipped), only); // prettier-ignore
    for (const fact of placed.facts.slice(1)) console.log(`      ${fact}`);
    unnamed = sayScripts(placed, { all: false });
  }
  const warned = report.warnings.length + unnamed ? `, with ${report.warnings.length + unnamed} warnings` : "";
  const fitFor = source ? "to compile" : `for ${engine}`;
  console.log(
    report.errors.length ? `${report.errors.length} errors: not fit ${fitFor}` : `fit ${fitFor}${warned}`,
  );
  process.exit(report.errors.length ? 1 : 0);
}
/**
 * map-learn: what a mod's own maps say of its entities, written to a file that --learned and a profile's
 * `definitions` take. --class prints one class's keys.
 */
function mapLearn({ command, file, flags }) {
  if (!statSync(file).isDirectory())
    fail(`${command}: the folder of a mod's .bsp files (<mod>/maps), not a file`);
  const to = need(command, flags.o, "-o learned.json");
  const started = Date.now();
  const learned = maps.learnEntities(file);
  if (!learned.maps) fail(`${command}: no GoldSrc map (.bsp) in ${file}`);
  save(to, JSON.stringify(learned));
  const classes = Object.entries(learned.classes).sort((a, b) => b[1].seen - a[1].seen);
  console.log(
    `${to}  ${learned.maps} maps, ${classes.length} classes, read in ${((Date.now() - started) / 1000).toFixed(1)} s`,
  );
  for (const name of learned.skipped) console.log(`      ${name} is not a GoldSrc map: passed over`);
  const one = typeof flags.class === "string" ? learned.classes[flags.class] : null;
  if (typeof flags.class === "string" && !one)
    fail(`${command}: no ${flags.class} in any of the ${learned.maps} maps`);
  if (one) {
    console.log(
      `${flags.class}: ${one.seen} in ${one.maps} maps (${one.in.join(", ")}...), ${one.point} as a point and ${one.solid} of brushes`,
    );
    if (one.always.length) console.log(`      every one gives: ${one.always.join(", ")}`);
    for (const group of one.together) console.log(`      always together: ${group.join(", ")}`);
    for (const [key, has] of Object.entries(one.keys).sort((a, b) => b[1].seen - a[1].seen))
      console.log(
        `${String(has.seen).padStart(6)}  ${key.padEnd(18)} ${has.values.map(([value, times]) => `"${value}" x${times}`).join("  ")}${has.more ? "  ..." : ""}`,
      );
    return;
  }
  const kindOf = (has) =>
    has.kind === "either"
      ? `${has.point} points, ${has.solid} of brushes`
      : has.kind === "solid"
        ? "of brushes"
        : "a point";
  for (const [name, has] of classes.slice(0, flags.all ? classes.length : MARKS_PRINTED))
    console.log(
      `${String(has.seen).padStart(6)}  ${name.padEnd(28)} in ${String(has.maps).padStart(3)} maps  ${kindOf(has)}`,
    );
  if (!flags.all && classes.length > MARKS_PRINTED)
    console.log(
      `      and ${classes.length - MARKS_PRINTED} more (--all); --class <name> lists one class's keys`,
    );
}

// ── map-entities, map-set ──────────────────────────────────────────────────
function mapEntities({ file, flags }) {
  const { bsp } = readCompiled(file);
  const numbered = bsp.entities.map((entity, number) => ({ number, entity }));
  const wanted = numbered.filter(
    ({ entity }) => flags.class === undefined || maps.valueOf(entity, "classname") === flags.class,
  );
  if (flags.json) {
    const list = wanted.map(({ number, entity }) => ({
      number,
      classname: maps.valueOf(entity, "classname") ?? null,
      origin: maps.originOf(entity),
      model: maps.brushModelOf(entity),
      pairs: entity,
    }));
    console.log(JSON.stringify(list, null, 1));
    return;
  }
  const wide = Math.max(9, ...wanted.map(({ entity }) => (maps.valueOf(entity, "classname") ?? "").length));
  for (const { number, entity } of wanted) {
    const classname = maps.valueOf(entity, "classname") ?? "(no classname)";
    const origin = maps.originOf(entity);
    const model = maps.brushModelOf(entity);
    const place = model !== null && number ? `brushes *${model}` : origin ? `at ${placeText(origin)}` : "";
    const others = entity
      .filter(
        ([key]) => !["classname", "origin", "model"].includes(key) || (key === "model" && model === null),
      )
      .map(([key, value]) => `${key}=${/\s/.test(value) ? `"${value}"` : value}`)
      .join(" ");
    console.log(`${String(number).padStart(4)}  ${classname.padEnd(wide)}  ${place.padEnd(22)} ${others}`);
  }
  const ofClass = flags.class === undefined ? "" : ` of the class ${flags.class}`;
  console.log(`${wanted.length} entities${ofClass}, of ${bsp.entities.length} in the map`);
}
/** The number of the entity a flag names: a number, or a class that one entity alone has. */
function entityNumber(flag, value, entities) {
  if (/^\d+$/.test(String(value))) {
    if (Number(value) >= entities.length)
      fail(`--${flag}: no entity ${value}: the map has ${entities.length}, numbered from 0`);
    return Number(value);
  }
  const ofClass = entities
    .map((entity, number) => ({ number, classname: maps.valueOf(entity, "classname") }))
    .filter((each) => each.classname === value);
  if (ofClass.length !== 1)
    fail(
      ofClass.length
        ? `--${flag} ${value}: the map has ${ofClass.length} of that class (${ofClass.map((each) => each.number).join(", ")}): give the number`
        : `--${flag} ${value}: the map has no entity of that class (map-entities lists them)`,
    );
  return ofClass[0].number;
}
/** The `key=value` words of a command line as pairs; a word that is not one stops the command. */
function pairsOf(command, words) {
  return words.map((word) => {
    const equals = word.indexOf("=");
    if (equals < 1) fail(`${command}: ${word} is not key=value`);
    return [word.slice(0, equals), word.slice(equals + 1)];
  });
}
/**
 * map-set: one change to a compiled map's entities, written to a new file: keys of one entity set (and its
 * place moved), an entity added, or one taken out.
 */
function mapSet({ command, file, rest, flags }) {
  const to = need(command, flags.o, "-o out.bsp");
  if (resolve(to) === resolve(file))
    fail(`${command}: -o is the map itself: write to a new file, never over the original`);
  const asked = ["entity", "add", "remove"].filter((name) => flags[name] !== undefined);
  if (asked.length !== 1)
    fail(
      `${command}: one of --entity <n|class> key=value ..., --add <class> [--at x,y,z] key=value ..., --remove <n|class>`,
    );
  const pairs = pairsOf(command, rest);
  const move = numbersOf(flags, "move", 3, "three numbers x,y,z");
  const at = numbersOf(flags, "at", 3, "three numbers x,y,z");
  const { bytes, bsp } = readCompiled(file);
  let entities = bsp.entities;
  let said;
  if (flags.entity !== undefined) {
    const number = entityNumber("entity", flags.entity, entities);
    if (!pairs.length && !move && flags.unset === undefined)
      fail(`${command}: nothing to change: give key=value, --move x,y,z or --unset key`);
    const changes = [];
    for (const [key, value] of pairs) {
      changes.push(`${key} ${maps.valueOf(entities[number], key) ?? "(not set)"} -> ${value}`);
      entities = maps.setKey(entities, number, key, value);
    }
    if (flags.unset !== undefined) {
      entities = maps.removeKey(entities, number, flags.unset);
      changes.push(`${flags.unset} taken out`);
    }
    if (move) {
      changes.push(
        `moved from ${maps.valueOf(entities[number], "origin") ?? "(no origin)"} to ${placeText(move)}`,
      );
      entities = maps.moveEntity(entities, number, move);
    }
    said = `entity ${number} (${maps.valueOf(entities[number], "classname")}): ${changes.join("; ")}`;
  } else if (flags.add !== undefined) {
    entities = maps.addEntity(entities, flags.add, at ?? null, pairs);
    said = `entity ${entities.length - 1} added: ${flags.add}${at ? ` at ${placeText(at)}` : ""}`;
  } else {
    const number = entityNumber("remove", flags.remove, entities);
    const classname = maps.valueOf(entities[number], "classname");
    entities = maps.removeEntity(entities, number);
    said = `entity ${number} (${classname}) taken out: those after it are numbered one less`;
  }
  save(to, maps.withEntities(bytes, entities));
  console.log(`${to}: ${said}`);
  console.log(
    "      the light, the visibility and the brushes are as compiled: only what the game reads when it runs has changed",
  );
}

// ── pictures of a map ──────────────────────────────────────────────────────
async function mapPlan({ command, file, flags, listed }) {
  const to = need(command, flags.o, "-o out.png");
  const area = numbersOf(flags, "area", 4, "four numbers x0,y0,x1,y1");
  const options = {
    ...pictureOptions(file, flags, listed),
    ...figureOptions(flags, listed),
    ...defined({ mod: await profileOf(flags, listed) }),
    ...defined({
      z: numberOf(flags, "z"),
      scale: numberOf(flags, "scale"),
      slice: flags.slice,
      area: area && { min: [area[0], area[1]], max: [area[2], area[3]] },
      heights: flags.heights === true ? true : undefined,
      legend: flags.legend === true ? true : undefined,
    }),
  };
  const map = readEither(file);
  if (flags.reach === true) options.reach = maps.reachOf(map, { ...reachOptions(flags, listed), ...defined({ mod: options.mod }) }); // prettier-ignore
  const picture = isSource(file) ? maps.planOfSource(map, options) : maps.planOf(map, options);
  const { facts } = picture;
  const scale = Math.round(facts.scale * 1000) / 1000;
  const cut = facts.z === null ? "seen from above" : `cut at z ${facts.z}`;
  savePicture(
    to,
    picture,
    `${scale} pixels a unit, ${cut}; +y is up the picture and +x to its right; the bar is ${facts.bar} units`,
  );
  const shown = facts.marks.length > MARKS_PRINTED && !flags.list ? [] : facts.marks;
  for (const mark of shown)
    console.log(
      `${String(mark.number).padStart(4)}  ${mark.classname.padEnd(22)} ${placeText(mark.origin).padEnd(18)} at pixel ${mark.at.join(",")}`,
    );
  if (!shown.length && facts.marks.length)
    console.log(`      ${facts.marks.length} entities marked: --list prints each with its pixel`);
}
/** Where a view is taken from, from the flags: a point, or an entity. */
function standOf(flags, map) {
  const from = numbersOf(flags, "from", 3, "three numbers x,y,z");
  const to = numbersOf(flags, "to", 3, "three numbers x,y,z");
  if (from && flags.at !== undefined) fail("--from and --at both say where the eye is: give one");
  const stand = flags.at === undefined ? {} : maps.viewFrom(map, flags.at);
  return {
    ...stand,
    ...defined({
      from,
      to,
      yaw: numberOf(flags, "yaw"),
      pitch: numberOf(flags, "pitch"),
      fov: numberOf(flags, "fov"),
    }),
  };
}
async function mapView({ command, file, flags, listed }) {
  const to = need(command, flags.o, "-o out.png");
  const options = {
    ...pictureOptions(file, flags, listed),
    ...figureOptions(flags, listed),
    ...defined({ mod: await profileOf(flags, listed) }),
  };
  const source = isSource(file);
  const map = readEither(file);
  const stand = standOf(flags, map);
  const picture = source
    ? maps.drawSource(map, { ...options, ...stand })
    : maps.drawMap(map, { ...options, ...stand });
  const { facts } = picture;
  savePicture(
    to,
    picture,
    `from ${placeText(facts.from)}, yaw ${facts.yaw}, pitch ${facts.pitch}, ${facts.fov} degrees across; ${facts.faces} faces; light: ${facts.light}`,
  );
  for (const mark of facts.marked.slice(0, MARKS_PRINTED))
    console.log(
      `      marked: ${mark.number} ${mark.classname} at pixel ${mark.at.join(",")}${mark.drawn === "mark" ? "" : `, its ${mark.drawn} ${mark.size}`}`,
    );
}
async function mapViews({ command, file, flags, listed }) {
  const to = need(command, flags.o, "-o out.png");
  if (isSource(file)) fail(`${command}: a compiled map (.bsp): of source, map-view and map-plan draw`);
  const options = {
    ...pictureOptions(file, flags, listed),
    ...figureOptions(flags, listed),
    ...defined({ mod: await profileOf(flags, listed) }),
    ...defined({ count: numberOf(flags, "count"), cols: numberOf(flags, "cols") }),
  };
  for (const name of ["count", "cols"])
    if (name in options && !(Number.isInteger(options[name]) && options[name] >= 1))
      fail(`--${name}: a whole number from 1, not ${options[name]}`);
  const picture = maps.viewsOf(readCompiled(file).bsp, options);
  savePicture(to, picture, `${picture.facts.views.length} views; light: ${picture.facts.light}`);
  for (const view of picture.facts.views)
    console.log(`      ${view.name}, from ${placeText(view.from)}: ${view.faces} faces`);
}

// ── the walk test, the section, the storeys, the openings ──────────────────
/** An opening's size as a line prints it. */
const openingSize = (wide, high) => `${wide} wide, ${high === null ? "open above" : `${high} high`}`;
/** What the walk test found, printed: its facts, its openings and its warnings. */
function sayReach(reach) {
  for (const fact of reach.facts) console.log(`      ${fact}`);
  for (const opening of reach.openings.slice(0, MARKS_PRINTED))
    console.log(
      `      opening ${opening.number}  at ${placeText(opening.at)}  ${openingSize(opening.width, opening.height)}, across ${opening.across}${opening.fits.large ? "" : "  (closed to a large monster)"}`,
    );
  for (const warning of reach.warnings) console.log(`WARN  ${warning}`);
}
/**
 * map-reach: the walk test of a map. With -o, its plan with the walked floor tinted. Exit code 1 when an
 * entity a player goes to is not reached, or one stands in something solid.
 */
async function mapReach({ file, flags, listed }) {
  const map = readEither(file);
  const mod = await profileOf(flags, listed);
  const reach = maps.reachOf(map, { ...reachOptions(flags, listed), ...defined({ mod }) });
  const { walked: _walked, stands: _stands, ...plain } = reach;
  if (flags.json) console.log(JSON.stringify(plain, null, 1));
  else {
    console.log(`${file}: the walk test, on a grid of ${reach.cell}`);
    sayReach(reach);
  }
  if (flags.o) {
    const options = {
      ...pictureOptions(file, flags, listed),
      ...figureOptions(flags, listed),
      ...defined({ z: numberOf(flags, "z"), mod }),
      reach,
      heights: true,
      legend: true,
    };
    const picture = isSource(file) ? maps.planOfSource(map, options) : maps.planOf(map, options);
    if (flags.json) save(flags.o, smak.png(picture.width, picture.height, picture.rgba));
    else savePicture(flags.o, picture, "the plan, with the walk test tinted on it");
  }
  process.exit(reach.unreached.length || reach.stuck.length ? 1 : 0);
}
async function mapSection({ command, file, flags, listed }) {
  const to = need(command, flags.o, "-o out.png");
  const ends = `${command}: --from x,y and --to x,y, the two ends of the line`;
  const from = numbersOf(flags, "from", 2, "two numbers x,y") ?? fail(ends);
  const end = numbersOf(flags, "to", 2, "two numbers x,y") ?? fail(ends);
  if (flags.doors !== undefined && !DOORS.includes(flags.doors))
    fail(`--doors: ${DOORS.join(" or ")}, not ${flags.doors}`);
  const picture = maps.sectionOf(readEither(file), {
    from,
    to: end,
    ...figureOptions(flags, listed),
    ...defined({ mod: await profileOf(flags, listed) }),
    ...defined({
      scale: numberOf(flags, "scale"),
      width: numberOf(flags, "width"),
      z: numbersOf(flags, "z", 2, "two numbers low,high"),
      near: flags.entities === false ? false : numberOf(flags, "near"),
      labels: flags.labels,
      heights: flags.heights,
      doors: flags.doors,
    }),
  });
  const { facts } = picture;
  savePicture(
    to,
    picture,
    `a section ${facts.length} units long, heights ${facts.z.map(Math.round).join(" to ")}, ${Math.round(facts.scale * 1000) / 1000} pixels a unit, seen looking yaw ${facts.looking}`,
  );
  const floors = facts.floors.filter((floor) => floor.to - floor.from >= 16);
  for (const floor of floors.slice(0, MARKS_PRINTED))
    console.log(`      floor at z ${floor.z}  from ${floor.from} to ${floor.to} along the line`);
  for (const mark of facts.marks.slice(0, MARKS_PRINTED))
    console.log(
      `${String(mark.number).padStart(4)}  ${mark.classname.padEnd(22)} ${mark.along} along the line, z ${mark.z}`,
    );
}
async function mapStoreys({ command, file, flags, listed }) {
  const to = need(command, flags.o, "-o out.png");
  const map = readEither(file);
  const cuts = flags.z === undefined ? undefined : String(flags.z).split(",").map(Number);
  if (cuts && !cuts.every(Number.isFinite)) fail(`--z: heights to cut at, a,b,c, not ${flags.z}`);
  const options = {
    ...pictureOptions(file, flags, listed),
    ...figureOptions(flags, listed),
    ...defined({ mod: await profileOf(flags, listed) }),
    ...defined({ z: cuts, cols: numberOf(flags, "cols"), doors: flags.doors }),
  };
  if (flags.reach === true) options.reach = maps.reachOf(map, { ...reachOptions(flags, listed), ...defined({ mod: options.mod }) }); // prettier-ignore
  const picture = maps.storeysOf(map, options);
  savePicture(to, picture, `${picture.facts.storeys.length} storeys side by side, the highest first`);
  for (const storey of picture.facts.storeys)
    console.log(
      `      cut at z ${storey.z}${storey.floors ? `: floors from ${storey.floors[0]} to ${storey.floors[1]}, about ${storey.area} square units` : ""}; ${storey.marks.length} entities`,
    );
}
async function mapOpenings({ command, file, flags, listed }) {
  const to = need(command, flags.o, "-o out.png");
  const map = readEither(file);
  const mod = await profileOf(flags, listed);
  const reach = maps.reachOf(map, { ...reachOptions(flags, listed), ...defined({ mod }) });
  const picture = maps.openingViews(map, {
    ...pictureOptions(file, flags, listed),
    ...figureOptions(flags, listed),
    ...defined({ mod }),
    ...defined({
      count: numberOf(flags, "count"),
      cols: numberOf(flags, "cols"),
      both: flags.both === true ? true : undefined,
    }),
    reach,
  });
  savePicture(to, picture, `${picture.facts.views.length} views, each through an opening`);
  for (const view of picture.facts.views)
    console.log(
      `      opening ${view.opening}: ${openingSize(view.wide, view.high)}; from ${placeText(view.from)} looking yaw ${view.yaw}`,
    );
}

// ── textures of a map, and texture files ───────────────────────────────────
/** A map texture written as a PNG, its holes see-through; its line printed. */
function saveTexture(dir, texture, from) {
  const to = join(dir, `${pictureNameOf(texture.name)}.png`);
  const picture = maps.textureRgba(texture);
  save(to, smak.png(picture.width, picture.height, picture.rgba));
  console.log(
    `${to}  ${texture.width}x${texture.height}${texture.holes ? " with holes" : ""}${from ? `  ${from}` : ""}`,
  );
}
function mapTextures({ command, file, flags, listed }) {
  const dir = need(command, flags.o, "-o <folder>");
  const { bsp } = readCompiled(file);
  const found = maps.texturesFor(bsp, gameFolders(file, listed), { pixels: true });
  const fromWads = new Map(found.textures.map((each) => [each.name, each]));
  let missing = 0;
  for (const entry of bsp.textures) {
    if (entry.absent) continue;
    const inside = maps.embeddedTexture(bsp, entry.index);
    const outside = fromWads.get(entry.name);
    if (inside) saveTexture(dir, inside, "inside the map");
    else if (outside) saveTexture(dir, { ...outside.texture, name: entry.name }, `from ${outside.wad}`);
    else {
      missing++;
      console.log(
        `WARN  ${entry.name} ${entry.width}x${entry.height}: wanted from a .wad, and in none that was found`,
      );
    }
  }
  if (missing)
    console.log(
      `      ${missing} not found: the worldspawn lists ${maps.wantedTextures(bsp).wads.join(", ") || "no .wad file"}; --game <folder> says where to look`,
    );
}
function wad({ file, flags }) {
  const read = maps.readWad(readFileSync(file));
  for (const texture of read.textures) {
    if (flags.o) saveTexture(flags.o, texture, "");
    else
      console.log(
        `  ${texture.name.padEnd(16)} ${texture.width}x${texture.height}${texture.holes ? "  with holes" : ""}`,
      );
  }
  const others = read.others.length
    ? `, and ${read.others.length} things that are not map textures (not read)`
    : "";
  console.log(`${file}: ${read.textures.length} textures${others}`);
}
/** wad-make: a .wad from pictures, each texture named after its file. */
function wadMake({ command, file, rest, flags }) {
  const to = need(command, flags.o, "-o out.wad");
  const textures = [file, ...rest].map((pictureFile) => {
    const name = basename(pictureFile).replace(/\.(png|bmp)$/i, "");
    const bytes = readFileSync(existing(pictureFile));
    const isBmp = bytes.toString("latin1", 0, 2) === "BM";
    const read = isBmp ? smak.unbmp(bytes) : smak.unpng(bytes);
    return read.pixels ? { name, ...read } : { name, image: read };
  });
  save(to, maps.writeWad(textures));
  for (const texture of textures) {
    const size = texture.image ?? texture;
    console.log(
      `  ${texture.name.padEnd(16)} ${size.width}x${size.height}${maps.hasHoles(texture.name) ? "  with holes" : ""}`,
    );
  }
  console.log(`${to}: ${textures.length} textures`);
}

// ── map-light ──────────────────────────────────────────────────────────────
/**
 * map-light: the light on a compiled map's floors, from its lightmaps: all of it, and room by room (--rooms:
 * a JSON file of { name: { min, max } }) or as the dark stretches of it.
 */
function mapLight({ command, file, flags }) {
  const { bsp } = readCompiled(file);
  const rooms = flags.rooms === undefined ? null : JSON.parse(readFileSync(existing(flags.rooms), "utf8"));
  const dark = flags.dark === undefined ? undefined : numberOf(flags, "dark");
  const cell = flags.cell === undefined ? undefined : numberOf(flags, "cell");
  if (dark !== undefined && !(dark > 0)) fail(`${command}: --dark is a brightness, 1 to 255, not ${flags.dark}`);
  const reach = flags.walked ? maps.reachOf(bsp) : null;
  const report = maps.lightReport(bsp, defined({ rooms, dark, cell, reach }));
  if (flags.json) {
    const { warnings, facts, ...rest } = report;
    console.log(JSON.stringify({ ...rest, warnings, facts }, null, 2));
    return;
  }
  for (const fact of report.facts) console.log(`      ${fact}`);
  for (const warning of report.warnings) console.log(`WARN  ${warning}`);
}

// ── map-measure, map-compare ───────────────────────────────────────────────
/**
 * A name for each of several maps: those of --names (a,b,c), or each file's own name without its ending,
 * with its folder before it where two files are named alike.
 */
function namesOf(command, files, flags) {
  if (flags.names !== undefined) {
    const names = String(flags.names).split(",").map((name) => name.trim()); // prettier-ignore
    if (names.length !== files.length || names.some((name) => !name))
      fail(`${command}: --names is a name for each map with commas between (${files.length} of them), not ${flags.names}`); // prettier-ignore
    return names;
  }
  const own = files.map((each) => basename(each).replace(/\.(bsp|map)$/i, ""));
  return own.map((name, nth) =>
    own.filter((other) => other === name).length > 1 ? `${basename(dirname(files[nth]))}/${name}` : name,
  );
}
/**
 * map-measure: a map in numbers (how wide its floor is, how high, how far one sees, how much of its
 * footprint is floor), or several maps' numbers side by side.
 */
async function mapMeasure({ command, file, rest, flags, listed }) {
  const files = [file, ...rest.map(existing)];
  const names = namesOf(command, files, flags);
  const bands = flags.bands === undefined ? undefined : String(flags.bands).split(",").map(Number);
  if (bands && !bands.every((each, nth) => each > (bands[nth - 1] ?? 0)))
    fail(`--bands: the widths that part the floor, rising, with commas between (176,352), not ${flags.bands}`); // prettier-ignore
  const lengths = Object.fromEntries(
    ["grid", "sight", "eye", "precision"].map((name) => [name, numberOf(flags, name)]),
  );
  for (const [name, value] of Object.entries(lengths))
    if (value !== undefined && !(value > 0)) fail(`--${name}: a length in units, over 0, not ${value}`);
  const options = {
    ...reachOptions(flags, listed),
    ...defined({ mod: await profileOf(flags, listed), bands, ...lengths }),
    every: flags.every === true,
  };
  const measured = files.map((each, nth) => {
    try {
      return { file: each, ...maps.measure(readEither(each), { ...options, name: names[nth] }) };
    } catch (error) {
      return fail(`${command}: ${each}: ${sayOf(error)}`);
    }
  });
  if (flags.json) {
    console.log(JSON.stringify(measured.length === 1 ? measured[0] : measured, null, 2));
    return;
  }
  if (measured.length === 1) {
    for (const fact of measured[0].facts) console.log(`      ${fact}`);
    for (const warning of measured[0].warnings) console.log(`WARN  ${warning}`);
    return;
  }
  for (const line of maps.measureTable(measured)) console.log(line);
  for (const each of measured)
    for (const warning of each.warnings) console.log(`WARN  ${each.name}: ${warning}`);
}
/**
 * map-compare: several maps from above at one scale in one picture. --z is one height for them all, or one
 * for each map in the order given, with `-` for a map that is seen from above.
 */
async function mapCompare({ command, file, rest, flags, listed }) {
  const to = need(command, flags.o, "-o out.png");
  const files = [file, ...rest.map(existing)];
  const names = namesOf(command, files, flags);
  const cuts = flags.z === undefined ? [] : String(flags.z).split(",").map((word) => word.trim()); // prettier-ignore
  const badCut = cuts.find((word) => word !== "-" && (word === "" || Number.isNaN(Number(word))));
  if (badCut !== undefined || (cuts.length > 1 && cuts.length !== files.length))
    fail(`--z: one height for every map, or one for each of the ${files.length} with commas between and - for a map seen from above (100,100,-), not ${flags.z}`); // prettier-ignore
  const cutOf = (nth) => {
    const word = cuts.length === 1 ? cuts[0] : cuts[nth];
    return word === undefined || word === "-" ? undefined : Number(word);
  };
  const options = {
    ...pictureOptions(file, flags, listed),
    ...figureOptions(flags, listed),
    ...defined({ mod: await profileOf(flags, listed) }),
    ...defined({ scale: numberOf(flags, "scale"), cols: numberOf(flags, "cols"), slice: flags.slice }),
  };
  if ("cols" in options && !(Number.isInteger(options.cols) && options.cols >= 1))
    fail(`--cols: a whole number from 1, not ${options.cols}`);
  // each map's own folder is looked in for its .wad files, after the game's
  options.folders = [...new Set([...options.folders, ...files.map((each) => dirname(each))])];
  const picture = maps.compareOf(
    files.map((each, nth) => ({ map: readEither(each), name: names[nth], ...defined({ z: cutOf(nth) }) })),
    options,
  );
  const { facts } = picture;
  savePicture(
    to,
    picture,
    `${facts.maps.length} maps at one scale, ${Math.round(facts.scale * 1000) / 1000} pixels a unit; +y is up the picture and +x to its right; the bar is ${facts.bar} units`,
  );
  for (const each of facts.maps)
    console.log(
      `      ${each.name}: ${each.size.join(" x ")} units, ${each.z === null ? "seen from above" : `cut at z ${each.z}`}; its plan ${each.width}x${each.height} at pixel ${each.left},${each.top}`,
    );
}

// ── map-compile ────────────────────────────────────────────────────────────
/**
 * --timeout as `compileMap` takes it: seconds for every program ("600"), or for some by name
 * ("hlvis=600,hlrad=1200"). Undefined without the flag.
 */
function timeoutOf(command, said) {
  if (said === undefined) return undefined;
  if (/^\d+(\.\d+)?$/.test(said)) return Number(said) * 1000;
  const each = {};
  for (const word of String(said).split(",")) {
    const [tool, seconds] = word.split("=");
    if (!maps.COMPILERS.includes(tool) || !(Number(seconds) > 0))
      fail(`${command}: --timeout is seconds ("600"), or seconds by program ("hlvis=600,hlrad=1200"), not ${said}`); // prettier-ignore
    each[tool] = Number(seconds) * 1000;
  }
  return each;
}
function mapCompile({ command, file, flags, listed }) {
  const to = need(command, flags.o, "-o out.bsp");
  if (!isSource(file))
    fail(`${command}: brush source (a .map file) is what is compiled, not ${basename(file)}`);
  const wads = (listed.wad ?? []).map(existing);
  const result = maps.compileMap(file, {
    out: to,
    wads,
    wadinclude: Boolean(flags.wadinclude),
    fast: Boolean(flags.fast),
    vis: flags.vis !== false,
    light: flags.light !== false,
    compilers: flags.vhlt === undefined ? undefined : { folder: flags.vhlt },
    timeout: timeoutOf(command, flags.timeout),
    // what the compilers print is handed on as they work, on standard error: asked for, or to a terminal
    progress: flags.progress === undefined ? Boolean(process.stderr.isTTY) : Boolean(flags.progress),
  });
  for (const log of result.logs)
    console.log(
      `      ${log.tool}  ${log.seconds.toFixed(1)} s  ${log.code === 0 ? "ended" : log.code === null ? "stopped" : `code ${log.code}`}`,
    );
  if (result.portals) console.log(`      portals  ${maps.portalsLine(result)}`);
  for (const fact of result.facts) console.log(`      ${fact}`);
  for (const warning of result.warnings) console.log(`WARN  ${warning}`);
  for (const error of result.errors) console.log(`ERROR ${error}`);
  console.log(result.bsp ? `${result.bsp}: compiled` : "not compiled");
  process.exit(result.bsp ? 0 : 1);
}

// ── play ───────────────────────────────────────────────────────────────────
/**
 * play: a map seen in the game itself, in a browser build of the engine at an address. The steps are checked
 * and Playwright looked for before any browser is opened; each thing done is printed as it is done, and the
 * pictures' paths at the end.
 */
async function playMap({ command, file: url, flags, listed }) {
  const { playOf, playPartOf, messagesOf, playwrightFrom, browserDriver, playSession, patternOf } = smak.play;
  const { serveSession, attachSession, closeSession, sessionState, expectationLine, fightLine, SESSION_PORT } =
    smak.play;
  /** The steps of a file, or the command stopped: a file that is not there, or is no JSON. */
  const stepsOf = (file) => {
    if (file === undefined) return [];
    try {
      return JSON.parse(readFileSync(existing(file), "utf8"));
    } catch (error) {
      return fail(`${command}: --steps is a JSON file that holds a list of steps, and ${file} does not read as JSON (${error.message})`); // prettier-ignore
    }
  };
  /** One run printed: its pictures, its log, and whether what it expected held. False when it did not. */
  const report = (run) => {
    console.log(`${run.pictures.length} pictures in ${run.out}${run.sheet ? `, all of them in ${run.sheet}` : ""}`); // prettier-ignore
    for (const picture of run.pictures) console.log(`  ${picture}`);
    console.log(`what the game said: ${run.logFile}${run.linesFile ? ` (and ${run.linesFile})` : ""}`);
    for (const fight of run.fights ?? []) console.log(fightLine(fight));
    const failed = run.expectations.filter((each) => !each.passed);
    if (run.expectations.length) {
      for (const each of run.expectations) console.log(expectationLine(each));
      console.log(`${run.passed ? "PASSED" : "FAILED"}: ${run.expectations.length - failed.length} of ${run.expectations.length} expectations held   (${(run.took / 1000).toFixed(1)} s)`); // prettier-ignore
    } else console.log(`done in ${(run.took / 1000).toFixed(1)} s (nothing was expected of it: no pass and no fail)`); // prettier-ignore
    return failed.length === 0;
  };
  /** A run that stopped, printed; false. */
  const stopped = (error) => {
    for (const fight of error.fights ?? []) console.error(fightLine(fight));
    for (const each of error.expectations ?? []) console.error(expectationLine(each));
    if (error.sheet) console.error(`the pictures up to there: ${error.sheet}`);
    if (error.logFile) console.error(`what the game said up to there: ${error.logFile}`);
    console.error(`FAILED: ${/^play: /.test(error.message) ? error.message : `${command}: ${sayOf(error)}`}`);
    return false;
  };
  try {
    if (!/^https?:\/\//i.test(url))
      fail(
        `${command}: the address of the page that runs the game comes first (http://...), not ${url}${flags.attach ? `: with --attach it is the session's (http://127.0.0.1:${SESSION_PORT})` : ""}`,
      );
    if (flags.attach && flags.close) {
      await closeSession(url);
      return console.log(`${url}: the session is closed`);
    }
    // each --map is a run, with the --steps given in the same place; -o is its folder, or theirs
    const mapsGiven = listed.map ?? [];
    const stay = flags.stay === true;
    if (!flags.serve && !stay && !mapsGiven.length)
      fail(`${command}: --map <name>: the map to load, as the console's \`map\` takes it`);
    if (stay && (!flags.attach || mapsGiven.length))
      fail(`${command}: --stay goes on in the map a session is in: with --attach, and without --map`);
    const stepFiles = listed.steps ?? [];
    if (stepFiles.length > Math.max(1, mapsGiven.length))
      fail(`${command}: ${stepFiles.length} --steps and ${mapsGiven.length} --map: a list of steps goes with a map`); // prettier-ignore
    const patterns = (name) => (listed[name] ?? []).filter((each) => patternOf(each, `--${name}`));
    const expect = patterns("expect");
    const expectNot = patterns("expect-not");
    const put = (listed.put ?? []).map((each) => {
      const [path, ...rest] = each.split("=");
      if (!path || !rest.length) fail(`${command}: --put <place in the game's files>=<file>, not ${each}`);
      return { path, file: existing(rest.join("=")) };
    });
    // a folder laid over the game's: what changed in it since the session had it is put
    const over = (listed.over ?? []).map((each) => {
      const [path, ...rest] = each.split("=");
      if (!path || !rest.length) fail(`${command}: --over <place in the game's files>=<folder>, not ${each}`);
      return { path, folder: rest.join("=") };
    });
    const out = flags.o ?? "play";
    const runs = (stay ? [null] : mapsGiven).map((map, index, all) => ({
      ...(stay ? { stay: true } : { map }),
      steps: stepsOf(stepFiles[index]),
      out: all.length > 1 ? join(out, `${index + 1}-${String(map).replace(/[^A-Za-z0-9_-]/g, "_")}`) : out,
      ...defined({ loads: numberOf(flags, "loads") }),
      ...{ expect, expectNot, sheet: flags.sheet !== false },
      // the files are put once, before the first map
      put: index ? [] : put,
      ...(over.length ? { over } : {}),
    }));

    // a session served elsewhere: the steps are checked there, against its profile
    if (flags.attach) {
      await sessionState(url);
      let held = true;
      for (const run of runs) {
        console.log(`${url}: ${run.stay ? "staying" : `map ${run.map}`}, ${run.steps.length} steps      (from the start, it took, what)`); // prettier-ignore
        held = (await attachSession(url, run, { tell: (line) => console.log(line) }).then(report, stopped)) && held; // prettier-ignore
      }
      if (!held) process.exit(1);
      return;
    }

    const mod = await profileOf(flags, listed);
    for (const run of runs) playOf(run.steps, { mod });
    const [wide, high] = playPartOf(mod).screen ?? [];
    const width = numberOf(flags, "width") ?? wide;
    const height = numberOf(flags, "height") ?? high;
    const playwright = playwrightFrom(flags.playwright ?? process.env.PLAYWRIGHT_DIR);
    const driver = browserDriver(
      defined({ url, playwright, width, height, messages: messagesOf(mod), headless: flags.show !== true }),
    );
    if (wide && (width !== wide || height !== high))
      console.log(`WARN  the profile's clicks were measured on a page of ${wide} by ${high}, and this one is ${width} by ${height}`); // prettier-ignore
    const session = playSession({ driver, mod, over, tell: (line) => console.log(line) });

    if (flags.serve) {
      const began = Date.now();
      const served = await serveSession({
        ...{ session, tell: (line) => console.log(line) },
        ...defined({ port: numberOf(flags, "port") }),
      });
      console.log(`the engine is up (${((Date.now() - began) / 1000).toFixed(1)} s). The session is served at ${served.address}:`); // prettier-ignore
      console.log(`  smak play ${served.address} --attach --map <name> --steps steps.json -o <folder>     a run in it`); // prettier-ignore
      console.log(`  smak play ${served.address} --attach --close                                        its end`); // prettier-ignore
      let held = true;
      for (const run of runs) held = (await session.run(run).then(report, stopped)) && held;
      await served.closed;
      console.log("the session is closed");
      if (!held) process.exit(1);
      return;
    }

    let held = true;
    try {
      for (const run of runs) {
        console.log(`${url}: map ${run.map}, ${run.steps.length} steps      (from the start, it took, what)`);
        held = (await session.run(run).then(report, stopped)) && held;
      }
    } finally {
      await session.close().catch(() => {});
    }
    if (!held) process.exit(1);
  } catch (error) {
    if (error.logFile) console.error(`the game's console up to there: ${error.logFile}`);
    fail(/^play: /.test(error.message) ? error.message : `${command}: ${sayOf(error)}`);
  }
}

// ── the commands ───────────────────────────────────────────────────────────
// A command's name, its function, and its lines of the help. `page: true`: it is handed the path as it is (a
// folder will do) and does not read a model. `own: true`: its file is not a model, and it reads it itself.
const COMMANDS = {
  info: {
    run: info,
    help: `  info <mdl> [--json] [--hitboxes] [--boxes]  what is in it: bones, bodyparts and their body numbers, textures, animations (with their
                                            activity, and how far and how fast each travels), events, attachments, hit boxes
                                            (--hitboxes: each with its bone, group and size; --boxes: each animation's box)`,
  },
  check: {
    run: check,
    help: `  check <mdl> [--engine goldsrc|xash] [--source original.mdl]   what would break or draw wrong in the game (exit code 1 on
                                            an error); --source: warnings the original has too are marked "inherited"`,
  },
  render: {
    run: draw,
    help: `  render <mdl> -o out.png                   one picture       [--view orbit|first|side|front|top] [--yaw 30] [--pitch 15] [--zoom 1]
                                            [--ground]: with --view side or front, a line where z = 0 is (the floor)`,
  },
  sheet: {
    run: draw,
    help: `  sheet <mdl> -o out.png                    six views in one  [--size 384]`,
  },
  strip: {
    run: draw,
    help: `  strip <mdl> -o out.png --seq <name|n>     an animation, frame by frame   [--count 12] [--cols 4] [--from f] [--to f] [--view first]
                                            a walk judged by its feet: --view side --ground (one camera for every frame, the floor a line)
        (render, sheet and strip all take --seq --frame --body --skin --width --height --no-light --no-cull)`,
  },
  textures: {
    run: textures,
    help: `  textures <mdl> -o <folder> [--bmp]        every texture as a file (PNG; --bmp: 8-bit BMP with its palette as it is)`,
  },
  uv: {
    run: uv,
    help: `  uv <mdl> -o <folder> [--texture name|n]   every texture (or one) enlarged, with the triangles that wear it drawn over it`,
  },
  islands: {
    run: islands,
    help: `  islands <mdl> [-o <folder>] [--texture name|n] [--body n] [--min 1] [--seq name|n|rest]
                                            the islands each picture is cut into: their ids, boxes, bones, places and open borders;
                                            with -o, every texture (or one) with its islands tinted and numbered
                                            (--body: only the islands that body's submodels use, with that body's own triangles)`,
  },
  layers: {
    run: layers,
    help: `  layers <mdl> [layers.mjs] [name=expression ...] [--texture name|n] [--body n] [--seq name|n|rest] [--min 30] [-o out.png]
                                            layers of a texture, to check a mask before painting with it: each one's pixels and its
                                            regions (box, centre, size, place on the body); with -o, the texture with the layers tinted
                                            over it. layers.mjs: a module that exports \`layers\` (what paint takes; \`pose\` and \`tex\` too
                                            if it likes). name=expression: a layer in one line of JavaScript over what paint hands its
                                            function, with lum and sat (of rgb) and W (the workshop):  "mail=busy(3)>0.25"  "dark=lum<0.1&&!layer.mail"`,
  },
  retexture: {
    run: retexture,
    help: `  retexture <mdl> <texture name|n> <picture.png|.bmp> -o out.mdl [--holes] [--flags n]
                                            another picture on that texture (any size; cut to 256 colours unless an 8-bit BMP)`,
  },
  sequence: {
    run: sequence,
    help: `  sequence <mdl> <name|n> -o seq.json       an animation as numbers: for each frame, for each bone, [x, y, z, about x, about y, about z]`,
  },
  "sequence-set": {
    run: sequenceFromFile,
    help: `  sequence-set <mdl> <name|n> seq.json -o out.mdl      the same file put back (frames, fps, loops), in the place it had`,
  },
  "sequence-add": {
    run: sequenceFromFile,
    help: `  sequence-add <mdl> seq.json -o out.mdl    as a new animation after the others (seq.json: { name, fps, loops, frames })
  sequence-add <mdl> --from <name|n> --frames 80-57 --name kneel_down -o out.mdl [--loop] [--fps 25] [--events]
                                            a new animation of frames of one it has, in that order ("80-57": backwards; "57,58,57")`,
  },
  reskin: {
    run: reskin,
    help: `  reskin <mdl> <rules.json|rules.mjs> -o out.mdl [--body n] [--pictures <folder>]
                                            its textures recoloured, weathered and painted over by rules (AGENTS.md, "A re-skin
                                            by rules"); --pictures: each changed texture before and after; checked against the original`,
  },
  inline: {
    run: inline,
    help: `  inline <mdl> -o out.mdl                   a model whose textures are in <name>t.mdl, with them put inside it`,
  },
  pieces: {
    run: pieces,
    help: `  pieces <mdl> [--min 6] [--seq name|n|rest] [--body n]   its loose pieces (a pouch, a plate, a pack), each with its number, place and size
                                            (every submodel's; with --body, those of the submodels that body number shows)`,
  },
  obj: {
    run: obj,
    own: true,
    help: `  obj <file.obj> -o out.mdl [--scale 1] [--up y|z] [--turn 0] [--ground] [--centre] [--name x.mdl] [--max-texture 512]
                                            a model from a Wavefront .obj: its .mtl and their pictures (PNG, BMP) are found beside it
                                            by the names in the file. --up: which axis of the file is up (y: what Blender writes);
                                            --turn: degrees about the upright axis; --ground: its lowest point at z = 0;
                                            --centre: its middle at the origin. One bone, one still animation: a prop the game can load`,
  },
  import: {
    run: imported,
    own: true,
    folder: true,
    help: `  import <file.fbx|.glb|.gltf|.obj> [-o out.mdl] [--scale 1] [--fit <units>] [--origin base|centre] [--turn 0] [--texture pic.png]
                                            a model of another tool: what is in it (meshes, triangles, materials and their
                                            pictures, bones, animations, axes, units, box); with -o, a prop: one bone, one still
                                            animation, its pictures found beside it, cut to 256 colours and within the engine's
                                            size. --scale: times its true size (39.37 units a metre); --fit: its longest side
                                            that many units; --origin base: standing on z = 0, centre: about its middle;
                                            --pictures: six views beside the .mdl; --save-pictures <folder>: the pictures inside
                                            the file, as they are; --json. With --anim [name,...]  [--fps 30]: a model with the
                                            file's skeleton and animations, each point on the bone that weighs most on it
  import <folder> -o <folder> [--only fbx,glb] [--fit n] ...
                                            every model under a folder as a prop, by the same paths, with sheet.png (each one
                                            drawn with its textures), a table (import.json) and HEAVY against what GoldSrc
                                            would not draw at its ease (docs/IMPORT.md)`,
  },
  item: {
    run: item,
    own: true,
    help: `  item <piece.mjs> --mod <profile> --game <folder> --family <name> --name <word> -o <folder> [--texture name.bmp] [--base <folder>] [--pictures]
                                            a new item in the models a game shows its kind from: the module's default export is the
                                            piece ({ tris, image }) or a function that makes it; the family (which files, bodyparts,
                                            bones, the game's own thing each is laid on) is one of the profile's \`items\`. Each file is
                                            read from --base when it is there, else from the game; written under -o with what the
                                            item's script is to say (docs/ITEMS.md). Exit code 1 when a check fails.
                                            <piece.mjs> may be a bought model instead (.fbx, .glb, .gltf, .obj): --texture is then
                                            its picture's file (found beside it unless told), and how it lies is found or told:
                                            [--as haft|plain|shield] [--axis x|y|z|-x..] [--grip low|high] [--flip] (docs/IMPORT.md)`,
  },
  scripts: {
    run: scripts,
    own: true,
    folder: true,
    help: `  scripts <folder> [more folders, maps ...] --mod <profile> --game <folder> [--shipped <the pack unpacked>] [--json]
                                            scripts of your own against the scripts the game ships, for a mod whose profile says how
                                            scripts are named: each one "replaces" a game script, is "new" and named (by a map given
                                            here, by a script, by the game itself), or is new and named by nothing: a warning, since
                                            laid over the game's pack it replaces nothing and is never read. map-check says the same
                                            of the folders it is given with --scripts`,
  },
  view: {
    run: view,
    page: true,
    help: `  view <folder|mdl> [more ...] [--port 8098]   a page in the browser: any two models side by side, turned and animated together`,
  },
  edit: {
    run: edit,
    page: true,
    help: `  edit <folder|mdl> [--port 8097] [--work smak-projects] [--engine goldsrc|xash]
                                            the editor, a page in the browser: animations re-timed and re-posed, events, textures
                                            (the models are only read; projects and saved models go to the --work folder)`,
  },
  "map-info": {
    run: mapInfo,
    own: true,
    help: `
  maps (docs/MAPS.md, docs/MAPS-MAKING.md): a compiled map is a .bsp, its source a .map, its textures a .wad
  map-info <bsp> [--json]                   what is in a map: its size, lumps, entities by class, textures and which are wanted from .wad files, light`,
  },
  "map-check": {
    run: mapCheck,
    own: true,
    help: `  map-check <bsp|map> [--engine goldsrc|xash] [--game <folder> ...] [--mod <profile.mjs|.json|goldsrc>] [--fgd <file.fgd> ...]
                            [--learned <file> ...] [--wad <file.wad> ...] [--cache <file>] [--scripts <folder> ...] [--all]
                                            what an engine would refuse (exit code 1 on an error); with --game (the mod's folder,
                                            then valve), its .wad files and textures are looked for there. A .map: its plan, before
                                            any compile. With --mod (a mod's profile), --fgd or --learned (what map-learn wrote): its
                                            entities against the mod: a class or a key that does not exist, a value of the wrong
                                            kind, a name nothing answers to, the mod's rules, the files it names (--scripts: folders of
                                            scripts of your own, for a profile whose mod names scripts: of those named by nothing,
                                            this map's own are warned of, and every one with --all)`,
  },
  "map-learn": {
    run: mapLearn,
    own: true,
    folder: true,
    help: `  map-learn <folder of .bsp> -o learned.json [--class name] [--all]
                                            what a mod's own maps say of its entities, for a mod with no FGD or a wrong one: each
                                            class with how often, each key with its commonest values, the keys that go together`,
  },
  "map-entities": {
    run: mapEntities,
    own: true,
    help: `  map-entities <bsp> [--class name] [--json]   every entity with its number, class, place and keys`,
  },
  "map-set": {
    run: mapSet,
    own: true,
    help: `  map-set <bsp> -o out.bsp --entity <n|class> [key=value ...] [--move x,y,z] [--unset key]
  map-set <bsp> -o out.bsp --add <class> [--at x,y,z] [key=value ...]
  map-set <bsp> -o out.bsp --remove <n|class>
                                            one change to a compiled map's entities, written to a new file. The light, the
                                            visibility and the brushes stay as compiled: a moved light lights nothing new`,
  },
  "map-plan": {
    run: mapPlan,
    own: true,
    help: `  map-plan <bsp|map> -o out.png [--z height] [--no-slice] [--scale px] [--area x0,y0,x1,y1] [--no-entities] [--labels|--no-labels] [--list]
                             [--heights] [--legend] [--reach]
                                            the map from above, +y up the picture: floors, walls, every entity marked with its
                                            number, a scale. --z: a cut at that height, solid filled (a .map is always a cut).
                                            --heights: each floor's height written on it; --legend: the entities listed beside it;
                                            --reach: the walk test tinted on it (with what map-reach takes)`,
  },
  "map-view": {
    run: mapView,
    own: true,
    help: `  map-view <bsp|map> -o out.png [--from x,y,z | --at <entity n|class>] [--yaw 0] [--pitch 0] [--to x,y,z] [--fov 90]
                                            a view from inside the map, textured and lit by its lightmaps (a .map: flat colours).
                                            Without a place: from the first place to start. --yaw 90 looks along +y; --pitch over 0, up`,
  },
  "map-views": {
    run: mapViews,
    own: true,
    help: `  map-views <bsp> -o out.png [--count 8] [--cols 4]   several views in one picture: from the places to start and the largest rooms
                                            (places to start that stand together get one view between them; a view that is nearly
                                            one colour is left out for the next largest room, and that is said)
        (the three take --width --height --game <folder> --wad <file.wad> --no-light --light steady|all --brightness 1.55 --entities all|models|game|none (game: only what is drawn by its model or sprite, no boxes);
         an entity that stands is drawn as the box it moves with: --body <class|targetname>=large|standing|crouching says which;
         --models draws the models that are named, from the --game folders, textured, in the body, skin, sequence, scale and
         angles their entities give (--no-model-scale: at their own size); --model <class|targetname|scriptfile>=models/x.mdl names one;
         with --game the sky is its own picture (skyname) and a sprite its first frame: --no-sky or --sky r,g,b, and --no-sprites, say otherwise;
         --mod <profile.mjs|.json|goldsrc> (with --game, --scripts <folder>): the mod's folders, the box each of its classes moves with and,
         with --models, the model the mod gives an entity that names none, a monster's from its script; map-section, map-storeys
         and map-openings take it too)`,
  },
  "map-reach": {
    run: mapReach,
    own: true,
    help: `  map-reach <bsp|map> [-o plan.png] [--mod <profile>] [--start <n|class> ...] [--goal <n|class> ...] [--jump [45|63]] [--doors open|closed]
                              [--open <n|class|name> ...] [--shut <n|class|name> ...] [--walls standing|gone] [--body name=large ...]
                              [--cell 8] [--no-parts] [--json]
                                            the walk test: where a standing player gets on foot from the places to start (steps of 18,
                                            any drop; ladders, liquids and teleports carry it on). Says which entities are not reached
                                            and what it would take, which stand in something solid or hang, the openings with their
                                            width and height, the walk to each --goal, and the one-way places: floor a player gets into
                                            and not out of (--exit <n|class|name>: a way out of the map). How much of the floor a
                                            player fits on is walked to, and each part that is not with what it takes: a jump,
                                            crouching, the brush entities in the way by name, open air (--no-parts: not looked at).
                                            Doors are open (--doors closed: not); what breaks or is switched off is a wall (--walls
                                            gone: not). A slope too steep to stand on is slid down, never walked up
                                            (--no-slopes: walked like any floor). --jump: jumps are part of the walk, up 45 and across
                                            a gap as far as a run carries (--speed 320 --gravity 800), and what only a jump reaches is
                                            told apart. With -o: the plan with the walked floor green, the rest red, floor only a jump
                                            reaches blue and one-way places amber. With --mod, the profile's exits, markers, wiring and
                                            off are used, and --exit adds to them. Exit code 1 on a fault`,
  },
  "map-section": {
    run: mapSection,
    own: true,
    help: `  map-section <bsp|map> -o out.png --from x,y --to x,y [--z low,high] [--scale px] [--near 64] [--no-heights] [--no-entities]
                                            a side section: an upright cut along that line, floors with their heights, the entities near it`,
  },
  "map-storeys": {
    run: mapStoreys,
    own: true,
    help: `  map-storeys <bsp|map> -o out.png [--z a,b,c] [--cols 3] [--reach]
                                            the storeys side by side: one plan for each, cut at its own height (found, or --z), with
                                            every floor's height written on it and the entities of that storey`,
  },
  "map-openings": {
    run: mapOpenings,
    own: true,
    help: `  map-openings <bsp|map> -o out.png [--count 12] [--both] [--cols 4]
                                            a view through each gate and doorway the walk test finds, from a player's eyes before it`,
  },
  "map-textures": {
    run: mapTextures,
    own: true,
    help: `  map-textures <bsp> -o <folder> [--game <folder> ...]   every texture of a map as a PNG: those inside it, and those found in its .wad files`,
  },
  wad: {
    run: wad,
    own: true,
    help: `  wad <file.wad> [-o <folder>]              the textures of a .wad listed; with -o, each written as a PNG named after it`,
  },
  "wad-make": {
    run: wadMake,
    own: true,
    help: `  wad-make <picture.png|.bmp> [more ...] -o out.wad   a .wad of pictures, each texture named after its file (15 letters at most,
                                            sides multiples of 16; a name that begins with { has holes where its PNG is see-through)`,
  },
  "map-light": {
    run: mapLight,
    own: true,
    help: `  map-light <bsp> [--rooms rooms.json] [--dark 24] [--cell 128] [--walked] [--json]
                                            the light on the map's floors, from its lightmaps, with no picture and no game: the mean
                                            of the samples the compiler stored (0 to 255), and what is dark of it: room by room
                                            (--rooms: { "name": { "min": [x, y, z], "max": [x, y, z] } }) or as the dark stretches
                                            of floor. The game lights what stands in a room by the floor under it. --walked: only
                                            floor the walk test gets to. A draft's light (--fast) has no bounces: it is darker`,
  },
  "map-measure": {
    run: mapMeasure,
    own: true,
    help: `  map-measure <bsp|map> [more maps ...] [--every] [--grid 32] [--bands 176,352] [--sight 700] [--names a,b,...] [--json]
                              [--mod <profile>] [--exit <n|class|name> ...] [--open ...] [--shut ...] [--doors open|closed] [--start ...]
                                            a map in numbers, to lay beside another's: at every place of its floor (a grid of 32) the
                                            width (the narrowest of eight lines through the place), the headroom and how far one sees;
                                            then the share of the floor by width (under 176, 176 to 352, 352 and over: --bands),
                                            medians and quartiles, the headroom of corridors and of rooms, the share of places that
                                            see beyond --sight, the openings, the floors' heights and how many lie one over another,
                                            the footprint and the share of it that is floor. Several maps: a table, a map a column.
                                            The floor is what the walk test gets to (with what map-reach takes); --every: every place
                                            a player fits, walked to or not, for a map the walk gets to only part of`,
  },
  "map-compare": {
    run: mapCompare,
    own: true,
    help: `  map-compare <bsp|map> <bsp|map> [more ...] -o out.png [--scale px] [--z 100,100,-] [--names a,b,...] [--cols n] [--no-slice]
                                            the maps from above at ONE scale in one picture, each under its name and the size of its
                                            world, with one scale bar: is the new map the size of the game's? --z: the height a plan
                                            is cut at, one for all or one for each map in order, - for a map seen from above. Without
                                            --scale: the largest at which all fit 1920 x 1080 (--width --height). No entity is marked
                                            unless --entities says (with what map-plan takes: --game, --mod, --no-light ...)`,
  },
  "map-compile": {
    run: mapCompile,
    own: true,
    help: `  map-compile <file.map> -o out.bsp [--wad <file.wad> ...] [--wadinclude] [--fast] [--no-vis] [--no-light] [--vhlt <folder>]
                              [--timeout <seconds | hlvis=600,hlrad=1200>] [--progress | --no-progress]
                                            compiles brush source with VHLT (an outside program: VHLT_DIR, the PATH or --vhlt);
                                            a leak and every error in a sentence, exit code 1 unless it compiled. Each program's
                                            seconds are printed, and the portals hlbsp left hlvis (its work: many are foretold).
                                            --timeout: a program that runs longer is stopped, and that is said (unless told: 120 s
                                            for hlcsg and hlbsp, 900 for hlvis and hlrad). --progress: what the compilers print is
                                            handed on as they work, on standard error (so by itself, to a terminal)`,
  },
  play: {
    run: playMap,
    own: true,
    address: true,
    help: `  play <url> --map <name> [--steps steps.json] [-o <folder>] [--mod <profile>] [--game <folder> ...] [--playwright <folder>]
                              [--width 1024] [--height 768] [--loads ms] [--expect <pattern> ...] [--expect-not <pattern> ...]
                              [--put <place>=<file> ...] [--no-sheet] [--show]
                                            the map seen in the game itself: a browser build of Xash3D at that address is opened,
                                            the map loaded, the game entered as the mod's profile says, and the steps done
                                            (steps.json: a list such as [{ "walk": 3000, "shot": "gate" }, { "face": 90, "look": -20 },
                                            { "say": "hail", "until": "welcome", "shot": "spoken" }, { "expect": "You receive" }];
                                            docs/PLAY.md has every step). The pictures go to the folder as PNG files with sheet.png,
                                            all of them in one; what the game said is in log.txt and log.jsonl, each line with its
                                            time. --expect, --expect-not: lines the whole run is held to. It ends with 1 when an
                                            expectation did not hold or the run stopped. --map and --steps given several times: one
                                            run each, in one start of the engine. --put: a file written into the engine first.
                                            It needs Playwright, an outside program: --playwright names the folder that holds its
                                            node_modules (or PLAYWRIGHT_DIR)
  play <url> --serve [--port 8098] [--over <place>=<folder> ...] [--mod ...] [--playwright ...]
                                            the game started and KEPT: a session served on this machine, for runs that pay for
                                            their map and not for the engine. --over: a folder laid over the game's (msc=mine/msc),
                                            marked now; a run with the same --over puts what changed in it since
  play <session> --attach --map <name> [--steps steps.json] [-o <folder>] [--expect ...] [--put ...] [--over ...]   a run in that session
  play <session> --attach --stay [--steps steps.json] [-o <folder>]      more steps where the last run left the player
  play <session> --attach --close                                        the session ended
`,
  },
  mcp: {
    run: mcp,
    help: `  mcp --work <folder> [--models <folder>] [--no-run]
                                            an MCP server on stdin and stdout, for a client with no shell (mcp/README.md);
                                            --no-run: without the tool that runs scripts`,
  },
};
const HELP = `smak <command> <model.mdl | map.bsp | file> [...]        (node bin/smak.mjs ...)

${Object.values(COMMANDS)
  .map((entry) => entry.help)
  .join("\n")}
`;

// ── the start ──────────────────────────────────────────────────────────────
const { flags, args, listed } = parseArgs(process.argv.slice(2));
const [command, file, ...rest] = args;
if (!command || command === "help" || flags.help) {
  console.log(HELP);
  process.exit(0);
}
// the MCP server is given folders by flags, not a file
if (command === "mcp") await mcp({ flags });
if (!file) fail(HELP);
const entry = Object.hasOwn(COMMANDS, command) ? COMMANDS[command] : null;
// `address: true`: what follows the command is a page's address, not a file
if (!entry?.address && !existsSync(file)) fail(`no such file: ${file}`);
// a page is handed a folder as readily as a model; every other command reads a file
if (!entry?.page && !entry?.folder && !entry?.address) existing(file);
checkFlags(flags);
// whatever a command throws is said in a sentence, with the command's name before it
try {
  // a page never comes back from `run`, and a command that reads its own file ends the run with it
  if (entry?.page || entry?.own) {
    await entry.run({ command, file, rest, flags, listed });
    process.exit(0);
  }
  // the file is read before the command is looked up: what cannot be read is said first
  const src = readModel(file, command);
  if (!entry) fail(`no command ${command}\n\n${HELP}`);
  await entry.run({ command, file, rest, flags, src });
} catch (error) {
  fail(`${command}: ${sayOf(error)}`);
}
