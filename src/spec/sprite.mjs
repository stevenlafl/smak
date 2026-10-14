// A spec of a sprite (.spr): layers of effects made by rule, quantised to one palette as its format reads it,
// written, read back, measured against Half-Life's own of its kind, and drawn (research/sprite-generation.md).
//
//   validateSpriteSpec(spec) -> { errors, warnings }
//   buildSpriteSpec(spec) -> { report, files: [{ name, bytes, sheet, animation }] }
//
// One sprite, or a set: `sprites: [...]` with the spec's own fields as their defaults.
import { framesOf, LAYER_KINDS, RAMP_NAMES } from "../sprite/effects.mjs";
import { quantiseFrames } from "../sprite/palette.mjs";
import { writeSpr } from "../sprite/spr.mjs";
import { readSpr, SPRITE_TYPES, SPRITE_FORMATS } from "../maps/sprites.mjs";
import { measureSprite, againstClass, SPRITE_CLASSES } from "../sprite/measure.mjs";
import { sheetOf, animationOf } from "../sprite/draw.mjs";
import { png } from "../image.mjs";

export const SPRITE_SPEC = "smak.sprite/1";
const FIELDS = ["spec", "name", "use", "class", "size", "frames", "loop", "fps", "type", "format", "origin", "seed", "layers", "finish", "colour", "sprites", "note"];
const USES = ["env_sprite", "env_glow", "tempent", "beam", "hud"];
/** The widest a frame is drawn as painted, and the widest at all (GoldSrc shrinks past `gl_max_size`). */
const SIDE_WARN = 256;
const SIDE_MOST = 512;
/** A loop that jumps by more than this at its wrap, against its mean step, shows the seam every time round. */
const WRAP_MOST = 2.5;
/** The classes that play once and must end dark. */
const ONE_SHOTS = new Set(["explosion", "smoke puff", "sparks", "ring"]);
const isNumber = (v) => typeof v === "number" && Number.isFinite(v);

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
  });
  return { errors, warnings };
}

/** Where a frame stands from the point the sprite is put at: `centre`, `bottom` (a flame on its base) or [x, y]. */
function originOf(origin, w, h) {
  if (origin === "bottom") return { left: -(w >> 1), up: h };
  if (Array.isArray(origin)) return { left: -origin[0], up: origin[1] };
  return { left: -(w >> 1), up: h >> 1 };
}

export function buildSpriteSpec(spec) {
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
    const sheet = sheetOf(back);
    files.push({ name: s.name, bytes, sheet: png(sheet.width, sheet.height, sheet.rgba), sheetPicture: sheet, animation: animationOf(back, { fps: s.fps ?? 10, loop }) });
  }
  report.ok = !report.errors.length && !report.faults.length;
  return { report, files };
}
