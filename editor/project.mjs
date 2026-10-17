// The project file and the model it is about, in Node: read, patched under a lock, and baked onto the
// ORIGINAL model with smak. The server (serve.mjs) and the command line (cli.mjs) both do everything through
// here, so a person in the page and an agent in a terminal change one file by the same steps.
import {
  readFileSync,
  writeFileSync,
  renameSync,
  existsSync,
  mkdirSync,
  statSync,
  openSync,
  closeSync,
  unlinkSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve, relative, basename, isAbsolute } from "node:path";
import * as smak from "../src/index.mjs";
import { FORMAT, applyPatch, animOf, animList, bakeAnim, adjustPalette, selectedBy } from "./core.mjs";

// a texture's flag for "masked": the last colour of its palette is a hole
const MASKED = 64;
// the lock on a project file: one left behind by a writer that died is taken over after this long; another
// writer is waited for this many times, this long each
const LOCK_STALE_MS = 5000;
const LOCK_TRIES = 200;
const LOCK_WAIT_MS = 25;
// how many of its last changes a project keeps in its log, and how long a line of it may be
const LOG_KEPT = 60;
const LOG_LINE_MOST = 300;
// a selection shown over its texture: the colours left alone keep this share of themselves and go this far
// towards a dark blue
const DIM_COLOUR = [20, 24, 44];
const DIM_KEEPS = 0.22;
const DIM_TAKES = 0.78;

const withSlashes = (path) => path.replace(/\\/g, "/");
export const sha1 = (buf) => createHash("sha1").update(buf).digest("hex");
const isMasked = (texture) => Boolean(texture.flags & MASKED);
/** Whether a bone's keys ({ frame: values }), or any other record, has anything in it. */
const hasAny = (record) => Object.keys(record).length > 0;

// ── the source model ───────────────────────────────────────────────────────
// the models read, by their path
const sources = new Map();
/**
 * A model file read (its textures put inside when they are kept in <name>t.mdl), with what the editor needs
 * to know of it. Kept until the file changes.
 */
export function sourceAt(path) {
  const file = resolve(path);
  const stamp = statSync(file).mtimeMs;
  const kept = sources.get(file);
  if (kept && kept.stamp === stamp) return kept;
  const raw = readFileSync(file);
  const { src: buf, textures } = smak.readStudio(file, { read: (f) => (f === file ? raw : readFileSync(f)) });
  const notes = textures ? [`its textures are kept in ${basename(textures)}: the saved model has them inside`] : [];
  // the animations' frames, read when first asked for
  const frames = new Map();
  const seqs = smak.sequences(buf).map((seq, number) => ({ ...seq, events: smak.events(buf, number) }));
  const ctx = {
    bones: smak.bones(buf),
    seqs,
    base: (number) => {
      if (!frames.has(number)) frames.set(number, smak.readSequence(buf, number).frames);
      return frames.get(number);
    },
  };
  const src = {
    path: file,
    stamp,
    buf,
    sha1: sha1(raw),
    bytes: raw.length,
    ctx,
    notes,
    info: smak.readMdl(buf),
    // a view model (the weapon in the player's hands) is looked at from the eye, anything else from outside.
    // GoldSrc names them v_<name>.mdl
    viewModel: /^v_/i.test(basename(file)) || /viewmodel/i.test(withSlashes(file)),
  };
  sources.set(file, src);
  return src;
}

// ── the project file ───────────────────────────────────────────────────────
/**
 * A project for a model, not yet written: `projPath` is where it will be kept (the source's path is written
 * relative to it).
 */
export function newProject(modelPath, projPath, engine = "xash") {
  const src = sourceAt(modelPath);
  const fromProject = withSlashes(relative(dirname(resolve(projPath)), src.path));
  return {
    format: FORMAT,
    rev: 0,
    source: { path: fromProject, sha1: src.sha1, bytes: src.bytes },
    output: basename(src.path).replace(/\.mdl$/i, "") + ".out.mdl",
    engine,
    anims: {},
    textures: {},
    log: [],
  };
}
/** The project in a file, or null when the file is not there. One of another format is refused. */
export function readProject(projPath) {
  if (!existsSync(projPath)) return null;
  const project = JSON.parse(readFileSync(projPath, "utf8"));
  if (project.format !== FORMAT)
    throw new Error(`${projPath}: its format is "${project.format}", and this editor reads "${FORMAT}"`);
  project.anims ??= {};
  project.textures ??= {};
  project.log ??= [];
  return project;
}
export const sourcePathOf = (project, projPath) =>
  isAbsolute(project.source.path)
    ? project.source.path
    : resolve(dirname(resolve(projPath)), project.source.path);
export const sourceOf = (project, projPath) => sourceAt(sourcePathOf(project, projPath));
export const outputPathOf = (project, projPath, out) =>
  resolve(dirname(resolve(projPath)), out ?? project.output);

/**
 * An animation the game plays as several mixed (a player's aim up and down): written from one set of frames
 * it would be left with one, so its motion is not changed here. Its speed, looping and events are; a copy of
 * it is free to change.
 */
export const mixedOf = (ctx, number) =>
  number < ctx.seqs.length && ctx.seqs[number].blends > 1 ? ctx.seqs[number].blends : 0;
/**
 * Whether a project's entry for an animation changes its motion: it has keys, or another length than the
 * source's.
 */
const movesIt = (entry, seq) =>
  Boolean(entry) &&
  (Object.values(entry.keys ?? {}).some(hasAny) ||
    (entry.frames !== undefined && entry.frames !== seq.frames));
/** A patch that would leave a mixed animation with motion of the project's own is refused. */
function refuseMixed(project, projPath, set) {
  const onAnims = set.filter((entry) => entry.path[0] === "anims");
  if (!onAnims.length) return;
  const ctx = sourceOf(project, projPath).ctx;
  // a patch on `anims` as a whole may have changed any of them
  const touched = onAnims.some((entry) => entry.path.length < 2)
    ? Object.keys(project.anims ?? {})
    : onAnims.map((entry) => entry.path[1]);
  for (const number of new Set(touched.map(Number)))
    if (mixedOf(ctx, number) && movesIt(project.anims?.[number], ctx.seqs[number]))
      throw new Error(
        `${ctx.seqs[number].name} is ${ctx.seqs[number].blends} animations that the game mixes (a player's aim up and down, say): its motion is not changed here, since it would be left with one. Its speed, looping and events can be changed; or duplicate it and work on the copy`,
      );
}

/** This thread put to sleep: there is nothing else for it to do while another writer has the lock. */
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
/** `work` done while this process alone holds the project's lock: a file beside it, made and removed. */
function locked(projPath, work) {
  const lock = projPath + ".lock";
  mkdirSync(dirname(projPath), { recursive: true });
  for (let tries = 0; ; tries++) {
    try {
      // "wx": made only if it is not there
      closeSync(openSync(lock, "wx"));
      break;
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      try {
        if (Date.now() - statSync(lock).mtimeMs > LOCK_STALE_MS) unlinkSync(lock);
      } catch {
        /* gone already */
      }
      if (tries > LOCK_TRIES) throw new Error(`${projPath} is locked by another writer`);
      sleep(LOCK_WAIT_MS);
    }
  }
  try {
    return work();
  } finally {
    try {
      unlinkSync(lock);
    } catch {
      /* nothing to remove */
    }
  }
}
/**
 * One change to the project file: read as it is on the disk now, patched, numbered, noted in its log, and
 * written whole (to a temporary file, then renamed over it). `by`: "person" or "agent". `fresh`: the project
 * to start from when the file is not there yet. Returns { project, inverse }: the `set` that undoes exactly
 * what this one changed.
 */
export function patchProject(projPath, { set, what, by = "agent" }, fresh = null) {
  return locked(projPath, () => {
    const now = readProject(projPath) ?? fresh;
    if (!now) throw new Error(`no project at ${projPath}`);
    const { project, inverse } = applyPatch(now, set);
    refuseMixed(project, projPath, set);
    project.rev = (now.rev ?? 0) + 1;
    const line = {
      rev: project.rev,
      by,
      at: new Date().toISOString(),
      what: String(what ?? "edit").slice(0, LOG_LINE_MOST),
    };
    project.log = [...(now.log ?? []), line].slice(-LOG_KEPT);
    const temporary = `${projPath}.${process.pid}.tmp`;
    writeFileSync(temporary, JSON.stringify(project, null, 1));
    renameSync(temporary, projPath);
    return { project, inverse };
  });
}

// ── textures ───────────────────────────────────────────────────────────────
// In these, `number` is the texture's number in the model and `entry` what the project says of it: { name,
// file (the picture that replaces it, a path from the project's folder), adjust }, or nothing.
/**
 * A texture's picture as the project has it before any adjustment: the source's, or the picture that replaces
 * it. What a selection by colour is made on.
 */
export function pictureFor(src, number, entry, projPath) {
  const old = smak.textureOf(src.buf, number);
  if (!entry?.file) return old;
  const buf = readFileSync(resolve(dirname(resolve(projPath)), entry.file));
  const isBmp = buf.toString("latin1", 0, 2) === "BM";
  // a PNG for a masked texture: the last colour stays the hole's, used or not
  const replaced =
    isMasked(old) && !isBmp ? smak.masked(smak.unpng(buf), old.name) : smak.textureFrom(buf, old.name);
  return { ...replaced, name: old.name, flags: old.flags };
}
/**
 * A texture as the project has it: the source's, or the picture that replaces it, with the adjustments made
 * to its palette.
 */
export function textureFor(src, number, entry, projPath) {
  const picture = pictureFor(src, number, entry, projPath);
  return entry?.adjust && hasAny(entry.adjust)
    ? { ...picture, palette: adjustPalette(picture.palette, entry.adjust, isMasked(picture)) }
    : picture;
}
/**
 * What a selection by colour takes of a texture: { on (a 1 or a 0 for each of the 256 colours), colours, used
 * (colours the picture uses, and how many of them are taken), pixels, of }.
 */
export function selectionOf(src, number, entry, projPath) {
  const picture = pictureFor(src, number, entry, projPath);
  const on = selectedBy(picture.palette, entry?.adjust?.select, isMasked(picture));
  // which of the 256 colours the picture uses at all
  const used = new Uint8Array(256);
  let pixels = 0;
  for (const index of picture.pixels) {
    used[index] = 1;
    pixels += on[index];
  }
  const count = (flags) => flags.reduce((sum, flag) => sum + flag, 0);
  return {
    on,
    colours: count(on),
    used: count(used),
    taken: used.reduce((sum, isUsed, index) => sum + (isUsed & on[index]), 0),
    pixels,
    of: picture.pixels.length,
  };
}
/**
 * A texture with the colours a selection leaves alone dimmed towards a dark blue: the selection shown over
 * the picture.
 */
export function maskShown(texture, on) {
  const palette = Uint8Array.from(texture.palette);
  for (let index = 0; index < 256; index++) {
    const isHole = texture.flags & MASKED && index === 255;
    if (on[index] || isHole) continue;
    for (let channel = 0; channel < 3; channel++) {
      const at = index * 3 + channel;
      palette[at] = Math.round(palette[at] * DIM_KEEPS + DIM_COLOUR[channel] * DIM_TAKES);
    }
  }
  return { ...texture, palette };
}

// ── baking ─────────────────────────────────────────────────────────────────
/** The model with the project's textures: each one it replaces or adjusts. */
function withProjectTextures(mdl, project, src, projPath) {
  for (const [key, entry] of Object.entries(project.textures ?? {})) {
    const number = Number(key);
    // a selection with nothing to do to it changes nothing
    const adjusts = Object.keys(entry.adjust ?? {}).some((name) => name !== "select");
    if (!src.info.textures[number] || (!entry.file && !adjusts)) continue;
    mdl = smak.replaceTexture(mdl, number, textureFor(src, number, entry, projPath));
  }
  return mdl;
}
/**
 * The model with one animation of the project's: a source's replaced where it stands, an added one put after
 * the last (`next` is the number that one has to have). Null, with a note of why, when it is skipped.
 */
function withProjectAnim(mdl, project, ctx, number, next, notes) {
  const entry = project.anims[number];
  const anim = animOf(project, ctx, number);
  const keyed = Object.values(anim.keys).some(hasAny);
  // frames are written only when the project's differ from the source's
  const frames = keyed || anim.count !== anim.base.length || anim.added ? bakeAnim(anim, ctx) : undefined;
  if (anim.added) {
    if (number !== next) {
      notes.push(
        `animation ${number} (${anim.name}) is skipped: added animations have to follow on from ${next}`,
      );
      return null;
    }
    return smak.addSequence(mdl, {
      name: anim.name,
      fps: anim.fps,
      loops: anim.loops,
      frames,
      events: anim.events,
      like: anim.baseN,
    });
  }
  if (ctx.seqs[number].group) {
    notes.push(`${anim.name} is kept in another file and cannot be changed`);
    return null;
  }
  const mixed = frames && mixedOf(ctx, number);
  if (mixed)
    notes.push(`${anim.name} is ${mixed} animations that the game mixes: its motion is left as it was`);
  mdl = smak.replaceSequence(mdl, number, {
    frames: mixed ? undefined : frames,
    fps: entry.fps,
    loops: entry.loops,
  });
  if (entry.events) mdl = smak.setEvents(mdl, number, anim.events);
  if (anim.count !== anim.base.length)
    notes.push(
      `${anim.name} is ${anim.count} frames long where it was ${anim.base.length}: whatever the game times by it changes with it`,
    );
  return mdl;
}
/**
 * The project baked onto its source model, from the start every time: { mdl (a Buffer), notes, anims: [{ n,
 * name, frames }] }. Textures first, then each animation the project says anything of, in order of number:
 * the source's replaced where they stand, the added ones after the last.
 */
export function bakeProject(project, projPath) {
  const src = sourceOf(project, projPath);
  const ctx = src.ctx;
  const notes = [...src.notes];
  const written = [];
  if (project.source.sha1 && project.source.sha1 !== src.sha1)
    notes.push(
      `the source model is not the file the project was begun on (its hash differs): the keys are laid on it by bone name all the same`,
    );
  let mdl = withProjectTextures(src.buf, project, src, projPath);
  const known = animList(project, ctx);
  // the number the next added animation has to have
  let next = ctx.seqs.length;
  const numbers = Object.keys(project.anims ?? {})
    .map(Number)
    .sort((a, b) => a - b);
  for (const number of numbers) {
    const listed = known.find((anim) => anim.n === number);
    if (!listed) {
      notes.push(
        `animation ${number} of the project is skipped: it copies an animation the model has not got`,
      );
      continue;
    }
    for (const name of Object.keys(project.anims[number].keys ?? {}))
      if (!ctx.bones.some((bone) => bone.name === name))
        notes.push(`${listed.name}: keys for a bone the model has not got, ${name}`);
    const withIt = withProjectAnim(mdl, project, ctx, number, next, notes);
    if (!withIt) continue;
    mdl = withIt;
    const anim = animOf(project, ctx, number);
    if (anim.added) next++;
    written.push({ n: number, name: anim.name, frames: anim.count, fps: anim.fps });
  }
  return { mdl, notes, anims: written };
}
// the last bake of each project, by its file
const baked = new Map();
/** The baked model for a project as it stands (kept until its rev or its source changes). */
export function bakedOf(project, projPath) {
  const key = resolve(projPath);
  const src = sourceOf(project, projPath);
  const stamp = `${project.rev}:${src.stamp}`;
  const kept = baked.get(key);
  if (kept?.stamp === stamp) return kept.result;
  const result = bakeProject(project, projPath);
  baked.set(key, { stamp, result });
  return result;
}
/**
 * Bakes and writes the model, and checks it: { out, bytes, engine, errors, warnings, facts, notes, anims }.
 * Never onto the source.
 */
export function saveBake(project, projPath, { out, engine } = {}) {
  const to = outputPathOf(project, projPath, out);
  const src = sourceOf(project, projPath);
  engine ??= project.engine ?? "xash";
  if (to.toLowerCase() === src.path.toLowerCase())
    throw new Error("that is the source model: the editor never writes over it");
  if (!/\.mdl$/i.test(to)) throw new Error("the output's name has to end in .mdl");
  const { mdl, notes, anims } = bakeProject(project, projPath);
  const report = smak.check(mdl, engine);
  mkdirSync(dirname(to), { recursive: true });
  writeFileSync(to, mdl);
  return { out: to, bytes: mdl.length, engine, ...report, notes, anims };
}
export { smak };
