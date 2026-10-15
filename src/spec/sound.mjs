// A sound spec: a sound, or a set of them, described as layers and built into GoldSrc's files, checked and
// held against the game's own of its kind. The agent writes the spec; this builds it. docs/SPEC.md, "A
// sound", says how to write one; research/sound-generation.md why it is so.
//
//   validateSoundSpec(spec)                      -> { errors, warnings }
//   buildSoundSpec(spec, { games, folder, readPicture }) -> { report, files: [{ name, bytes }], picture }

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { render, MODE_SETS } from "../audio/synth.mjs";
import { writeWav, readWav, resample, RATES } from "../audio/wav.mjs";
import { checks } from "../audio/measure.mjs";
import { CLASSES, scoreAgainst, rangesOf } from "../audio/classes.mjs";
import { soundPicture } from "../audio/draw.mjs";
import { pictureMeasures } from "../audio/picture.mjs";
import { unpicture } from "../image.mjs";

export const SOUND_SPEC = "smak.sound/1";
const TOP = ["spec", "name", "class", "rate", "bits", "seed", "length", "pitch", "layers", "finish", "loop", "variants", "reference", "picture", "sounds", "note"];
const LAYER = ["id", "kind", "file", "from", "at", "length", "gain", "env", "filter", "color", "shape", "iterations", "wave", "f", "sweep", "ratio", "index", "indexDecay", "ratios", "modes", "gains", "decay", "damping", "detune", "count", "rate", "every", "jitter", "band", "grain", "drive", "post", "note"];
const KINDS = ["noise", "tone", "fm", "modes", "particles", "sample"];
/** Licences a take's sidecar may name that do not allow selling what is made with it. */
const NON_COMMERCIAL = /\bNC\b|non-?commercial|research only/i;
const FILTERS = ["lowpass", "highpass", "bandpass", "peak", "notch"];
/** The longest a sound's path may be from the mod's folder: the engine's 64 with its zero, `sound/` added. */
const LONGEST_NAME = 63 - "sound/".length;

const isNumber = (v) => typeof v === "number" && Number.isFinite(v);

/** What is wrong with a noise layer's `shape`: a curve [[Hz, dB], ...] rising in Hz, or { keys: [{ at, curve }] } rising in time. */
function shapeFaults(shape) {
  const curveFault = (curve) =>
    !Array.isArray(curve) || !curve.length || curve.some((p, i) => !Array.isArray(p) || !isNumber(p[0]) || !isNumber(p[1]) || p[0] <= 0 || (i && p[0] <= curve[i - 1][0]));
  if (Array.isArray(shape)) return curveFault(shape) ? ["a curve of [Hz, dB] points, Hz over 0 and rising"] : [];
  if (!Array.isArray(shape?.keys) || !shape.keys.length) return ["a curve [[Hz, dB], ...], or { keys: [{ at, curve }] }"];
  return shape.keys.flatMap((key, i) =>
    !isNumber(key?.at) || (i && key.at < shape.keys[i - 1].at) ? [`keys[${i}].at: seconds from the layer's start, rising`] : curveFault(key.curve) ? [`keys[${i}].curve: [Hz, dB] points, Hz over 0 and rising`] : [],
  );
}

/** The sounds a spec makes: itself, or each of its `sounds` with the spec's fields as defaults. */
function soundsOf(spec) {
  const { sounds, spec: _, ...shared } = spec;
  return sounds ? sounds.map((sound) => ({ ...shared, ...sound })) : [spec];
}

/** What is wrong with a sound spec, in sentences that say what to write. */
export function validateSoundSpec(spec) {
  const errors = [];
  const warnings = [];
  if (spec?.spec !== SOUND_SPEC) errors.push(`spec: "${SOUND_SPEC}"`);
  for (const key of Object.keys(spec ?? {})) if (!TOP.includes(key)) warnings.push(`${key}: not a field of a sound spec, left out`);
  if (spec?.sounds !== undefined && (!Array.isArray(spec.sounds) || !spec.sounds.length)) errors.push("sounds: a list of sounds, each with its own name and layers (the spec's other fields are their defaults)");
  for (const [n, sound] of soundsOf(spec ?? {}).entries()) {
    const at = spec?.sounds ? `sounds[${n}]` : "";
    const where = (field) => `${at}${at ? "." : ""}${field}`;
    if (typeof sound.name !== "string" || !/^[a-z0-9_\-/]+\.wav$/.test(sound.name))
      errors.push(`${where("name")}: the file's path under sound/, lower case, ending .wav ("weapons/cbar_hit1.wav"), not ${JSON.stringify(sound.name)}`);
    else if (sound.name.length > LONGEST_NAME) errors.push(`${where("name")}: ${sound.name.length} letters; the engine holds ${LONGEST_NAME} after sound/`);
    if (sound.rate !== undefined && !RATES.includes(sound.rate)) errors.push(`${where("rate")}: ${RATES.join(", ")} Hz`);
    if (sound.bits !== undefined && sound.bits !== 8 && sound.bits !== 16) errors.push(`${where("bits")}: 8 or 16`);
    if (sound.class !== undefined && !CLASSES[sound.class]) errors.push(`${where("class")}: one of ${Object.keys(CLASSES).join(", ")}`);
    if (!Array.isArray(sound.layers) || !sound.layers.length) errors.push(`${where("layers")}: a list of one layer at least`);
    for (const [k, layer] of (sound.layers ?? []).entries()) {
      const label = `${where(`layers[${k}]`)}${layer?.id ? ` (${layer.id})` : ""}`;
      for (const key of Object.keys(layer ?? {})) if (!LAYER.includes(key)) warnings.push(`${label}.${key}: not a field of a layer, left out`);
      if (!KINDS.includes(layer?.kind)) errors.push(`${label}.kind: ${KINDS.join(", ")}`);
      if (["tone", "fm"].includes(layer?.kind) && !isNumber(layer.f)) errors.push(`${label}.f: its frequency in Hz`);
      if (layer?.kind === "sample") {
        if (typeof layer.file !== "string" || !/\.wav$/i.test(layer.file)) errors.push(`${label}.file: a .wav in the work folder (a generator's take: "work:gen/hit_s2.wav")`);
        if (layer.from !== undefined && layer.from !== "onset" && !(isNumber(layer.from) && layer.from >= 0)) errors.push(`${label}.from: seconds into the file to start at, or "onset" (its first hit)`);
      } else if (layer?.file !== undefined || layer?.from !== undefined) warnings.push(`${label}: file and from are a sample layer's, left out`);
      if (layer?.kind === "modes" && !isNumber(layer.f) && !Array.isArray(layer.modes))
        errors.push(`${label}: f (the lowest mode's Hz) with ratios (${Object.keys(MODE_SETS).join(", ")} or a list), or modes: [{ f, gain, decay }]`);
      if (layer?.kind === "modes" && typeof layer.ratios === "string" && !MODE_SETS[layer.ratios]) errors.push(`${label}.ratios: ${Object.keys(MODE_SETS).join(", ")}, or a list of numbers`);
      if (layer?.shape !== undefined) {
        if (layer.kind !== "noise") errors.push(`${label}.shape: only a noise layer takes a shape`);
        for (const fault of shapeFaults(layer.shape)) errors.push(`${label}.shape: ${fault}`);
      }
      if (layer?.iterations !== undefined && !(Number.isInteger(layer.iterations) && layer.iterations >= 0 && layer.iterations <= 200)) errors.push(`${label}.iterations: a whole number, 0 to 200 (32 is plenty)`);
      if (layer?.every !== undefined && !(isNumber(layer.every) && layer.every > 0)) errors.push(`${label}.every: seconds from one grain to the next, over 0`);
      if (layer?.jitter !== undefined && !(isNumber(layer.jitter) && layer.jitter >= 0 && layer.jitter <= 1)) errors.push(`${label}.jitter: 0 to 1, the share of \`every\` a grain may move`);
      if (layer?.drive !== undefined && !(isNumber(layer.drive) && layer.drive >= 1 && layer.drive <= 20)) errors.push(`${label}.drive: 1 to 20`);
      for (const [j, filter] of (layer?.filter ?? []).entries())
        if (!FILTERS.includes(filter?.type) || !isNumber(filter?.f)) errors.push(`${label}.filter[${j}]: { type: ${FILTERS.join("|")}, f, q, gain, sweep: { to, time } }`);
    }
    const limit = sound.finish?.limit;
    if (limit !== undefined && !(isNumber(limit?.crest) && limit.crest >= 1 && limit.crest <= 40 && (limit.release === undefined || (isNumber(limit.release) && limit.release > 0))))
      errors.push(`${where("finish.limit")}: { crest: the peak over the RMS it is squashed to, in dB (Valve's weapons 6 to 10), release: seconds (0.05) }`);
    if (sound.picture !== undefined && typeof sound.picture !== "string" && typeof sound.picture?.file !== "string")
      errors.push(`${where("picture")}: the sound's picture (as soundPicture draws it) to measure against: a file, or { file, length, rate, row }`);
    for (const [k, variant] of (sound.variants ?? []).entries())
      if (typeof variant?.name !== "string" || !/^[a-z0-9_\-/]+\.wav$/.test(variant.name)) errors.push(`${where(`variants[${k}]`)}.name: the variant's own file under sound/`);
  }
  return { errors, warnings };
}

/** The seconds from a recording's start to its first hit: 5 ms before the first sample over a thirtieth of its peak. */
function onsetOf(x, rate) {
  let peak = 0;
  for (const v of x) peak = Math.max(peak, Math.abs(v));
  const over = peak / 31.6;
  const i = x.findIndex((v) => Math.abs(v) >= over);
  return Math.max(0, i / rate - 0.005);
}

/**
 * A sample layer with its recording: the file read (any PCM or float WAV, its channels mixed), brought to the
 * sound's rate, cut from `from` (seconds, or "onset": its first hit) for `length`, and what made it told from the
 * sidecar a generator writes beside it (`<file>.json`: model, prompt, seed, licence), a licence that does not
 * allow selling warned of.
 */
function sampleOf(layer, rate, readFile, fact, warn) {
  let wav;
  try {
    wav = readWav(readFile(layer.file));
  } catch (error) {
    throw new Error(`the sample ${layer.file}: ${error.message}`);
  }
  let pcm = resample(wav.x, wav.rate, rate);
  const from = layer.from === "onset" ? onsetOf(pcm, rate) : (layer.from ?? 0);
  pcm = pcm.subarray(Math.min(pcm.length, Math.round(from * rate)), layer.length ? Math.round((from + layer.length) * rate) : undefined);
  let made = null;
  try {
    made = JSON.parse(readFile(layer.file.replace(/\.wav$/i, ".json")).toString("utf8"));
  } catch {
    made = null;
  }
  fact(`sample ${layer.file}: ${wav.rate} Hz ${wav.channels > 1 ? `${wav.channels} channels mixed, ` : ""}from ${Math.round(from * 1000) / 1000} s, ${Math.round((pcm.length / rate) * 1000) / 1000} s at ${rate}${made ? `; made by ${made.model ?? "?"}${made.seed !== undefined ? ` seed ${made.seed}` : ""}${made.prompt ? ` from "${made.prompt}"` : ""}, licence ${made.licence ?? "not given"}` : "; no sidecar says what made it"}`);
  if (made?.licence && NON_COMMERCIAL.test(made.licence)) warn(`the sample ${layer.file} was made by ${made.model} under ${made.licence}: what is made with it may not be sold`);
  if (!pcm.length) throw new Error(`the sample ${layer.file} has nothing after ${from} s`);
  return { ...layer, pcm, pcmRate: rate };
}

/** A game's own file of the sound folders given, read: { name, x, rate } or null. */
function referenceOf(name, games) {
  for (const game of games) {
    const file = join(game, "sound", name);
    if (existsSync(file)) {
      const wav = readWav(readFileSync(file));
      return { name: `the game's ${name}`, x: wav.x, rate: wav.rate };
    }
  }
  return null;
}

/**
 * A made sound's features against those read off a picture of the sound it is to be (`picture`, as
 * `soundPicture` draws it): the numbers the reproduction test's judge takes, each with how far off it is.
 * Measures only: nothing of the picture goes into the sound.
 */
function againstPicture(f, seen, sound) {
  const share = (a, b) => Math.abs(a - b) / (Math.abs(b) || 1e-9);
  const most = Object.keys(seen.bands).reduce((a, k) => (Math.abs(f.bands[k] - seen.bands[k]) > Math.abs(f.bands[a] - seen.bands[a]) ? k : a));
  const t20Range = seen.loop ? null : sound.class ? rangesOf(sound.class).t20 : [seen.t20 - Math.max(0.05, seen.t20 * 0.25), seen.t20 + Math.max(0.05, seen.t20 * 0.25)];
  return {
    length: seen.length,
    lengthOff: Math.round(share(f.length, seen.length) * 1000) / 1000,
    centroid: seen.centroid,
    centroidOff: Math.round(share(f.centroid, seen.centroid) * 1000) / 1000,
    bands: seen.bands,
    bandsOffMost: Math.round(Math.abs(f.bands[most] - seen.bands[most]) * 10) / 10,
    bandMostOff: most,
    t20: seen.t20,
    t20Range: t20Range && t20Range.map((v) => Math.round(v * 1000) / 1000),
    t20In: !t20Range || (f.t20 >= t20Range[0] && f.t20 <= t20Range[1]),
    crest: seen.crest,
    crestOff: Math.round((f.crest - seen.crest) * 10) / 10,
    onsets: seen.onsets,
  };
}

/**
 * Builds a sound spec: each sound and each of its variants made, written as a file, checked, and measured
 * against its class and, with `picture`, against the numbers read off that picture. `games`: folders whose
 * sound/ the references are read from (never copied); `readPicture(name)` reads a picture the spec names
 * (unless given, from `folder`). Returns { report: { ok, errors, faults, warnings, facts, sounds }, files:
 * [{ name, bytes }], picture }.
 */
export function buildSoundSpec(spec, { games = [], folder = ".", readPicture = (name) => unpicture(readFileSync(resolve(folder, name))), readFile = (name) => readFileSync(resolve(folder, name)) } = {}) {
  const { errors, warnings } = validateSoundSpec(spec);
  const report = { ok: false, errors, faults: [], warnings, facts: [], sounds: {} };
  const files = [];
  const rows = [];
  if (errors.length) return { report, files, picture: null };
  for (const given of soundsOf(spec)) {
    // a copy: its sample layers are given their recordings below, and the caller's spec is left as it was
    const sound = { ...given };
    const rate = sound.rate ?? 22050;
    const bits = sound.bits ?? 16;
    const takes = [{ name: sound.name }, ...(sound.variants ?? [])];
    // its recordings read once, at the sound's rate
    try {
      sound.layers = sound.layers.map((layer, k) => (layer.kind === "sample" ? sampleOf(layer, rate, readFile, (line) => report.facts.push(`${sound.name}: layers[${k}]${layer.id ? ` (${layer.id})` : ""}: ${line}`), (line) => warnings.push(`${sound.name}: layers[${k}]${layer.id ? ` (${layer.id})` : ""}: ${line}`)) : layer));
    } catch (error) {
      errors.push(`${sound.name}: ${error.message}`);
      continue;
    }
    // the picture it is to be, read once: its numbers, never its samples
    let seen = null;
    if (sound.picture) {
      const given = typeof sound.picture === "string" ? { file: sound.picture } : sound.picture;
      try {
        seen = pictureMeasures(readPicture(given.file), { length: given.length, rate: given.rate, row: given.row });
      } catch (error) {
        warnings.push(`picture ${given.file}: ${error.message}`);
      }
    }
    for (const take of takes) {
      const made = { ...sound, seed: take.seed ?? sound.seed ?? 1, pitch: (sound.pitch ?? 0) + (take.pitch ?? 0) };
      let x;
      try {
        x = render(made, { rate });
      } catch (error) {
        errors.push(`${take.name}: ${error.message}`);
        continue;
      }
      if (take.gain) for (let i = 0; i < x.length; i++) x[i] *= 10 ** (take.gain / 20);
      const loop = sound.loop ? 0 : null;
      const bytes = writeWav(x, { rate, bits, loop, seed: made.seed });
      const wav = readWav(bytes);
      const checked = checks(wav, { loop: !!sound.loop });
      const f = checked.features;
      report.faults.push(...checked.faults.map((line) => `${take.name}: ${line}`));
      warnings.push(...checked.warnings.map((line) => `${take.name}: ${line}`));
      const entry = { rate, bits, bytes: bytes.length, features: f };
      report.facts.push(
        `${take.name}: ${rate} Hz ${bits}-bit mono${sound.loop ? ", looped from its start" : ""}, ${f.length} s, ${Math.round(bytes.length / 1024)} KB, peak ${f.peak} dBFS, RMS ${f.rms}, crest ${f.crest} dB`,
        `${take.name}: attack ${Math.round(f.attack * 1000)} ms, T20 ${f.t20} s, T40 ${f.t40} s, centroid ${f.centroid} Hz, flatness ${f.flatness}, onsets ${f.onsets}; power ${Object.entries(f.bands).map(([b, v]) => `${b} ${v}%`).join(", ")}`,
      );
      if (sound.class) {
        const scored = scoreAgainst(f, sound.class);
        entry.score = `${scored.score} of ${scored.of}`;
        report.facts.push(`${take.name}: against the game's ${sound.class} sounds, ${scored.score} of ${scored.of}${scored.lines.length ? `; off: ${scored.lines.join("; ")}` : ": every feature in range"}`);
      }
      if (seen && take.name === sound.name) {
        const p = (entry.picture = againstPicture(f, seen, sound));
        report.facts.push(
          `${take.name}: against its picture (${p.length} s): length ${f.length} s (${Math.round(p.lengthOff * 100)}% off), centroid ${f.centroid} Hz to ${p.centroid} (${Math.round(p.centroidOff * 100)}% off), bands ${p.bandsOffMost} points off at most (${p.bandMostOff}), T20 ${f.t20} s${p.t20Range ? ` (${p.t20Range[0]} to ${p.t20Range[1]}${p.t20In ? "" : ": out"})` : ""}, crest ${f.crest} dB to about ${p.crest} (${p.crestOff > 0 ? "+" : ""}${p.crestOff}; read off the outline, within 3 dB), onsets ${f.onsets} to ${p.onsets}`,
        );
      }
      report.sounds[take.name] = entry;
      files.push({ name: take.name, bytes });
      rows.push({ name: take.name, x, rate, loop });
    }
    // the game's own files of its kind, drawn under it to be compared (read from the person's install)
    const asked = [sound.reference ?? []].flat();
    const references = asked.length ? asked : sound.class ? CLASSES[sound.class].slice(0, 1).map((r) => r.file) : [];
    for (const name of references) {
      const reference = referenceOf(name, games);
      if (reference) rows.push(reference);
      else if (asked.length) warnings.push(`reference ${name}: in none of the game folders given (${games.join(", ") || "none"})`);
    }
  }
  report.facts.push("what cannot be checked here: how it sounds to a person, and in the game: its volume and pitch as the code plays it, the map's room (env_sound), the mix. Listen in the game.");
  report.ok = !errors.length && !report.faults.length;
  return { report, files, picture: rows.length ? soundPicture(rows) : null };
}
