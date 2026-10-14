// A spec of a sprite (.spr): layers of effects made by rule, quantised to one palette as its format reads it,
// written, read back, measured against Half-Life's own of its kind, and drawn (research/sprite-generation.md).
//
//   validateSpriteSpec(spec) -> { errors, warnings }
//   buildSpriteSpec(spec, { readPicture }) -> { report, files: [{ name, bytes, sheet, animation }] }
//
// One sprite, or a set: `sprites: [...]` with the spec's own fields as their defaults. A sprite that names a
// `reference` (a contact sheet of the one it reproduces) is measured against it as the judge measures: mean
// colour, dark share, border, frame count. Measures only: no pixel of the reference goes into a frame.
import { readFileSync } from "node:fs";
import { framesOf, LAYER_KINDS, RAMP_NAMES } from "../sprite/effects.mjs";
import { quantiseFrames } from "../sprite/palette.mjs";
import { writeSpr } from "../sprite/spr.mjs";
import { readSpr, SPRITE_TYPES, SPRITE_FORMATS } from "../maps/sprites.mjs";
import { measureSprite, measureSheet, againstClass, SPRITE_CLASSES } from "../sprite/measure.mjs";
import { sheetOf, animationOf } from "../sprite/draw.mjs";
import { png, unpng } from "../image.mjs";

export const SPRITE_SPEC = "smak.sprite/1";
const FIELDS = ["spec", "name", "use", "class", "size", "frames", "loop", "fps", "type", "format", "origin", "seed", "layers", "finish", "colour", "reference", "sprites", "note"];
const USES = ["env_sprite", "env_glow", "tempent", "beam", "hud"];
/** The widest a frame is drawn as painted, and the widest at all (GoldSrc shrinks past `gl_max_size`). */
const SIDE_WARN = 256;
const SIDE_MOST = 512;
/** A loop that jumps by more than this at its wrap, against its mean step, shows the seam every time round. */
const WRAP_MOST = 2.5;
/** The classes that play once and must end dark. */
const ONE_SHOTS = new Set(["explosion", "smoke puff", "sparks", "ring"]);
const isNumber = (v) => typeof v === "number" && Number.isFinite(v);
/** Where a reproduction is told it is off its reference: the judge's bars (research/asset-reproduction-failures.md, 3). */
const REFERENCE_BARS = { colour: 15, dark: 0.05 };

/** The sprites of a spec, each with the spec's own fields as its defaults. */
const spritesOf = (spec) => (spec.sprites?.length ? spec.sprites.map((s) => ({ ...spec, sprites: undefined, ...s })) : [spec]);

export function validateSpriteSpec(spec) {
  const errors = [];
  const warnings = [];
  if (spec?.spec !== SPRITE_SPEC) errors.push(`spec: "${SPRITE_SPEC}"`);
  for (const key of Object.keys(spec ?? {})) if (!FIELDS.includes(key)) warnings.push(`${key}: a sprite spec takes no ${key}, left out`);
  spritesOf(spec ?? {}).forEach((s, n) => {
    const at = spec.sprites?.length ? `sprites[${n}]` : "the sprite";
    if (typeof s.name !== "string" || !/^[\w/.-]+\.spr$/.test(s.name)) errors.push(`${at}.name: its path under the mod, lower case, ending .spr (sprites/flame.spr)`);
    if (s.use !== undefined && !USES.includes(s.use)) errors.push(`${at}.use: one of ${USES.join(", ")}`);
    if (s.class !== undefined && !SPRITE_CLASSES[s.class]) errors.push(`${at}.class: one of ${Object.keys(SPRITE_CLASSES).join(", ")}`);
    if (!Array.isArray(s.size) || s.size.length !== 2 || !s.size.every((v) => Number.isInteger(v) && v >= 8 && v % 8 === 0 && v <= SIDE_MOST))
      errors.push(`${at}.size: [width, height], multiples of 8 up to ${SIDE_MOST}`);
    else if (Math.max(...s.size) > SIDE_WARN) warnings.push(`${at}.size: over ${SIDE_WARN} a side is drawn shrunk where the game's gl_max_size is 256`);
    if (s.frames !== undefined && !(Number.isInteger(s.frames) && s.frames >= 1 && s.frames <= 64)) errors.push(`${at}.frames: 1 to 64`);
    if (s.type !== undefined && !SPRITE_TYPES.includes(s.type)) errors.push(`${at}.type: one of ${SPRITE_TYPES.join(", ")}`);
    if (s.format !== undefined && !SPRITE_FORMATS.includes(s.format)) errors.push(`${at}.format: one of ${SPRITE_FORMATS.join(", ")}`);
    if (s.fps !== undefined && !(isNumber(s.fps) && s.fps > 0)) errors.push(`${at}.fps: frames a second, over 0`);
    if ((s.use ?? "env_sprite") === "env_sprite" && s.fps > 10) warnings.push(`${at}.fps: an env_sprite changes frame at most 10 times a second; ${s.fps} skips frames`);
    if (!Array.isArray(s.layers) || !s.layers.length) errors.push(`${at}.layers: a list of one layer at least, each { kind: ${LAYER_KINDS.join(" | ")}, ... }`);
    else
      s.layers.forEach((layer, k) => {
        if (!LAYER_KINDS.includes(layer?.kind)) errors.push(`${at}.layers[${k}].kind: one of ${LAYER_KINDS.join(", ")}`);
        if (layer?.ramp !== undefined && typeof layer.ramp === "string" && !RAMP_NAMES.includes(layer.ramp)) errors.push(`${at}.layers[${k}].ramp: one of ${RAMP_NAMES.join(", ")}, or a list of [heat, [r, g, b]] stops`);
      });
    const ref = s.reference;
    if (ref !== undefined && typeof ref !== "string" && typeof ref?.picture !== "string") errors.push(`${at}.reference: a contact sheet's path, or { picture, cell, cols } (as it was drawn: 128 and 8)`);
    else if (ref?.cell !== undefined && !(Number.isInteger(ref.cell) && ref.cell >= 8)) errors.push(`${at}.reference.cell: the sheet's cell in pixels (128)`);
    else if (ref?.cols !== undefined && !(Number.isInteger(ref.cols) && ref.cols >= 1)) errors.push(`${at}.reference.cols: frames a row of the sheet (8)`);
  });
  return { errors, warnings };
}

/** Where a frame stands from the point the sprite is put at: `centre`, `bottom` (a flame on its base) or [x, y]. */
function originOf(origin, w, h) {
  if (origin === "bottom") return { left: -(w >> 1), up: h };
  if (Array.isArray(origin)) return { left: -origin[0], up: origin[1] };
  return { left: -(w >> 1), up: h >> 1 };
}

/**
 * A sprite measured against its reference, each the same way off a sheet of the same drawing: { facts, notes,
 * measured } or { error }. `readPicture(path)` gives the picture ({ width, height, rgba }).
 */
function againstReference(name, ref, back, s, readPicture) {
  const { picture: path, cell = 128, cols = 8 } = typeof ref === "string" ? { picture: ref } : ref;
  let picture;
  try {
    picture = readPicture(path);
  } catch (error) {
    return { error: `${name}: its reference ${path} could not be read (${error.message.split("\n")[0]})` };
  }
  const how = { size: s.size, format: s.format ?? "additive", cols, cell, tint: s.colour ?? [1, 1, 1] };
  const theirs = measureSheet(picture, how);
  if (theirs.error) return { error: `${name}: its reference ${path}: ${theirs.error}` };
  const ours = measureSheet(sheetOf(back, { cols, cell }), how);
  const colour = theirs.lab && ours.lab ? Math.round(Math.hypot(...theirs.lab.map((v, j) => v - ours.lab[j])) * 10) / 10 : null;
  const measured = { reference: path, colourDeltaE: colour, dark: [theirs.dark, ours.dark], border: { max: [theirs.border.max, ours.border.max], mean: [theirs.border.mean, ours.border.mean] }, frames: [theirs.frames, ours.frames] };
  const facts = [`${name} against its reference (${path}, measured, nothing copied; the reference's, then this one's): mean colour delta E ${colour ?? "none"}, dark ${theirs.dark} and ${ours.dark}, border brightest ${theirs.border.max} and ${ours.border.max} (mean ${theirs.border.mean} and ${ours.border.mean}), frames ${theirs.frames} and ${ours.frames}`];
  const notes = [];
  if (colour !== null && colour > REFERENCE_BARS.colour) notes.push(`${name}: its colour is ${colour} from its reference's (delta E; the bar is ${REFERENCE_BARS.colour}): a ramp or a colour nearer the reference's`);
  const darker = ours.dark - theirs.dark;
  if (Math.abs(darker) > REFERENCE_BARS.dark) notes.push(`${name}: ${darker > 0 ? "more" : "less"} of it is dark than of its reference (${ours.dark} against ${theirs.dark}): the effect ${darker > 0 ? "covers too little of its frame" : "covers too much of its frame"}`);
  if (ours.frames !== theirs.frames) notes.push(`${name}: ${ours.frames} frames against its reference's ${theirs.frames}`);
  return { facts, notes, measured };
}

export function buildSpriteSpec(spec, { readPicture = (path) => unpng(readFileSync(path)) } = {}) {
  const { errors, warnings } = validateSpriteSpec(spec);
  const report = { ok: false, errors, warnings, faults: [], notes: [], facts: [] };
  if (errors.length) return { report, files: [] };
  const files = [];
  for (const s of spritesOf(spec)) {
    const use = s.use ?? "env_sprite";
    const format = s.format ?? "additive";
    const loop = s.loop ?? false;
    const made = framesOf({ size: s.size, frames: s.frames ?? 1, loop, layers: s.layers, seed: s.seed ?? 1, edge: s.finish?.edge ?? 2, use });
    const { palette, pixels, error, colours } = quantiseFrames(made, format, { colour: s.colour ?? [1, 1, 1] });
    const [w, h] = s.size;
    const frames = pixels.map((p) => ({ ...originOf(s.origin, w, h), width: w, height: h, pixels: p }));
    const bytes = writeSpr({ type: s.type ?? (use === "beam" ? "parallel oriented" : "parallel"), format, palette, frames });
    // read back as the engine's own reader would: the same frames, the same palette
    const back = readSpr(bytes);
    if (back.frames.length !== frames.length || back.frames.some((f, i) => Buffer.compare(Buffer.from(f.pixels), Buffer.from(frames[i].pixels)) !== 0))
      report.faults.push(`${s.name}: it does not read back as written: a fault in the kit`);
    const m = measureSprite(back, { loop });
    const said = `${s.name}: ${w}x${h}, ${frames.length} frames${loop ? ` (a loop of ${frames.length - 1}, its first again at the end)` : ""}, ${format}, ${colours} colours, quantising lost ${error}; border ${m.border.mean} (brightest ${m.border.max}), dark ${m.dark}${m.wrap !== null ? `, wrap ${m.wrap}` : ""}${m.jitter !== null ? `, jitter ${m.jitter}` : ""}, envelope peaks at ${m.envelope.peakAt} (first ${m.envelope.first}, last ${m.envelope.last})`;
    report.facts.push(said);
    if (loop && m.wrap > WRAP_MOST) report.faults.push(`${s.name}: its loop jumps at the wrap (${m.wrap} times its mean step, over ${WRAP_MOST}): make the motion periodic`);
    if (ONE_SHOTS.has(s.class) && m.envelope.last > 0.15) report.faults.push(`${s.name}: a ${s.class} plays once and must end dark; its last frame is ${m.envelope.last} of its peak: give a layer an env with a decay`);
    if (use !== "beam" && m.border.mean > 0.03) report.faults.push(`${s.name}: light at its border (mean ${m.border.mean}): the frame's square shows; fade more (finish.edge) or shrink the effect`);
    const held = s.class ? againstClass(m, s.class) : null;
    if (held) {
      const off = held.filter((r) => !r.ok);
      report.facts.push(`${s.name} against Half-Life's ${s.class}: ${held.length - off.length} of ${held.length} in range${off.length ? `; ${off.map((r) => `${r.measure} ${r.value} (${r.range.join(" to ")}): ${r.words}`).join("; ")}` : ""}`);
    }
    const mode = format === "index alpha" ? "4 (Solid)" : format === "alpha test" ? "0 (Normal)" : use === "env_glow" ? "3 (Glow)" : "5 (Additive)";
    report.notes.push(`${s.name}: placed as ${use === "env_glow" ? "an env_glow" : use === "env_sprite" ? "an env_sprite" : `a ${use}`}, render mode ${mode}${s.fps ? `, framerate ${s.fps}` : ""}`);
    if (s.reference !== undefined) {
      const against = againstReference(s.name, s.reference, back, s, readPicture);
      if (against.error) report.warnings.push(against.error);
      else {
        report.facts.push(...against.facts);
        report.notes.push(...against.notes);
        (report.reference ??= {})[s.name] = against.measured;
      }
    }
    const sheet = sheetOf(back);
    files.push({ name: s.name, bytes, sheet: png(sheet.width, sheet.height, sheet.rgba), sheetPicture: sheet, animation: animationOf(back, { fps: s.fps ?? 10, loop }) });
  }
  report.ok = !report.errors.length && !report.faults.length;
  return { report, files };
}
