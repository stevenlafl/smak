// A music spec: a generated take (the tool generate's, or any recording) made into a track the game plays: cut,
// faded or looped, filtered, levelled by loudness as music is, and written as the game's own music is, a 44.1 kHz
// stereo MP3 under media/ (through ffmpeg), or as a looped WAV a map's ambient_generic plays. Measured against the
// game's own tracks of its kind. research/local-music-generators.md, section 8, has why each field is so.
//
//   validateMusicSpec(spec)                         -> { errors, warnings }
//   buildMusicSpec(spec, { readFile, ffmpeg })      -> { report, files: [{ name, bytes }], picture }

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readWav, writeWav, resample } from "../audio/wav.mjs";
import { biquad } from "../audio/synth.mjs";
import { loudness } from "../audio/loudness.mjs";
import { features } from "../audio/measure.mjs";
import { soundPicture } from "../audio/draw.mjs";

export const MUSIC_SPEC = "smak.music/1";
const TOP = ["spec", "name", "track", "from", "fade", "loudness", "eq", "loop", "as", "group", "note"];
const FILTERS = ["lowpass", "highpass", "bandpass", "peak", "notch", "lowshelf", "highshelf"];
/** The rate and the loudness the game's own music has: 44.1 kHz MP3s, -14.3 LUFS their median (-10.4 to -21.3). */
const RATE = 44100;
const LOUDNESS = -14;
/** The highest a sample may reach after levelling, in dBFS: under the MP3's own overshoot. */
const CEILING = -1;
/**
 * The engine's CD track table (hw.so's strings): a map's trigger_cdaudio or target_cdaudio plays track n from
 * media/<this>.mp3, the mod's folder before valve's. Track 2 is the first.
 */
export const TRACKS = ["Half-Life01", "Prospero01", "Half-Life12", "Half-Life07", "Half-Life10", "Suspense01", "Suspense03", "Half-Life09", "Half-Life02", "Half-Life13", "Half-Life04", "Half-Life15", "Half-Life14", "Half-Life16", "Suspense02", "Half-Life03", "Half-Life08", "Prospero02", "Half-Life05", "Prospero04", "Half-Life11", "Half-Life06", "Prospero03", "Half-Life17", "Prospero05", "Suspense05", "Suspense07"]; // prettier-ignore
/**
 * The game's 27 tracks in four groups, as measured in place (research/local-music-generators.md, section 2; numbers,
 * not files): medians of loudness, loudness range and the share of power under 150, 150 to 600, 600 to 2000, 2000
 * to 5000 and over 5000 Hz. Told beside a track, not held against it: to Steven's ear the share of bass did not
 * say which take was better (section 6a).
 */
export const GROUPS = {
  action: { tracks: 9, lufs: -12.2, range: 7.7, bands: [52, 28, 10, 2, 0.3] },
  ambient: { tracks: 9, lufs: -15.5, range: 9.2, bands: [45, 35, 12, 0.3, 0] },
  between: { tracks: 4, lufs: -13.7, range: 7.1, bands: [56, 29, 14, 2, 0] },
  stinger: { tracks: 5, lufs: -13.6, range: 14.6, bands: [40, 55, 6, 0.1, 0] },
};

const isNumber = (v) => typeof v === "number" && Number.isFinite(v);
const round = (v, k = 10) => Math.round(v * k) / k;

/** The file a spec writes: its `name`, or the track's name, under media/ for an MP3 and sound/ for a WAV. */
function fileOf(spec) {
  if (spec.track !== undefined) return `media/${TRACKS[spec.track - 2]}.mp3`;
  return spec.name;
}

/** What is wrong with a music spec, in sentences that say what to write. */
export function validateMusicSpec(spec) {
  const errors = [];
  const warnings = [];
  if (spec?.spec !== MUSIC_SPEC) errors.push(`spec: "${MUSIC_SPEC}"`);
  for (const key of Object.keys(spec ?? {})) if (!TOP.includes(key)) warnings.push(`${key}: not a field of a music spec, left out`);
  const as = spec?.as ?? "mp3";
  if (as !== "mp3" && as !== "wav") errors.push('as: "mp3" (the game\'s music, under media/) or "wav" (a looped bed a map\'s ambient_generic plays, under sound/)');
  if (spec?.track !== undefined) {
    if (!(Number.isInteger(spec.track) && spec.track >= 2 && spec.track <= 28)) errors.push("track: the CD track a map plays, 2 to 28 (the engine's table names its file)");
    else if (spec.track === 28) errors.push("track: 28 is the menu's (gamestartup.mp3), which no map plays: 2 to 27");
    if (spec.name !== undefined) errors.push("track or name, not both: a track's file is named by the engine's table");
    if (as === "wav") errors.push('track: an MP3 under media/; a WAV bed takes a name under sound/ ("ambience/lab_bed.wav")');
  } else if (typeof spec?.name !== "string") errors.push(as === "wav" ? 'name: its path under sound/ ("ambience/lab_bed.wav")' : 'name: its path in the mod ("media/Half-Life04.mp3", the name a map plays by its CD track; or "music/lab.mp3" for a mod that plays music by its own code), or track: 2 to 27');
  else if (as === "mp3" && !/^[a-z0-9_\-/]+\.mp3$/i.test(spec.name)) errors.push(`name: a path ending .mp3, not ${JSON.stringify(spec.name)}`);
  else if (as === "wav" && !/^[a-z0-9_\-/]+\.wav$/.test(spec.name)) errors.push(`name: a lower-case path under sound/ ending .wav, not ${JSON.stringify(spec.name)}`);
  const from = spec?.from;
  if (typeof from?.file !== "string" || !/\.wav$/i.test(from.file)) errors.push('from: { file: the take, a .wav of the work folder ("work:gen/lab_s2.wav"), start, length }');
  else {
    if (from.start !== undefined && !(isNumber(from.start) && from.start >= 0)) errors.push("from.start: seconds into the take");
    if (from.length !== undefined && !(isNumber(from.length) && from.length > 0)) errors.push("from.length: seconds of it");
  }
  if (spec?.fade !== undefined && !(typeof spec.fade === "object" && [spec.fade.in, spec.fade.out].every((v) => v === undefined || (isNumber(v) && v >= 0)))) errors.push("fade: { in, out } in seconds");
  if (spec?.loudness !== undefined && !(isNumber(spec.loudness) && spec.loudness <= -6 && spec.loudness >= -30)) errors.push("loudness: LUFS, -30 to -6 (the game's tracks -10 to -21, -14 their middle)");
  for (const [j, f] of (spec?.eq ?? []).entries()) if (!FILTERS.includes(f?.type) || !isNumber(f?.f)) errors.push(`eq[${j}]: { type: ${FILTERS.join("|")}, f, q, gain }`);
  if (spec?.loop !== undefined && spec.loop !== true && spec.loop !== false && !(isNumber(spec.loop?.crossfade) && spec.loop.crossfade > 0)) errors.push("loop: true (the take is a loop already: generate's loop), or { crossfade: seconds } (its end laid over its start)");
  if (spec?.group !== undefined && !GROUPS[spec.group]) errors.push(`group: ${Object.keys(GROUPS).join(", ")}: the game's tracks of that kind, told beside it`);
  return { errors, warnings };
}

/** A stereo (or mono) 16-bit WAV of channels at a rate: what ffmpeg is handed to encode. */
function pcmWav(channels, rate) {
  const n = channels[0].length;
  const k = channels.length;
  const data = Buffer.alloc(n * k * 2);
  for (let i = 0; i < n; i++) for (let c = 0; c < k; c++) data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, channels[c][i])) * 32767), (i * k + c) * 2);
  const fmt = Buffer.alloc(16);
  fmt.writeUInt16LE(1, 0);
  fmt.writeUInt16LE(k, 2);
  fmt.writeUInt32LE(rate, 4);
  fmt.writeUInt32LE(rate * k * 2, 8);
  fmt.writeUInt16LE(k * 2, 12);
  fmt.writeUInt16LE(16, 14);
  const chunk = (id, body) => Buffer.concat([Buffer.from(id, "ascii"), Buffer.from(Uint32Array.of(body.length).buffer), body]);
  return chunk("RIFF", Buffer.concat([Buffer.from("WAVE", "ascii"), chunk("fmt ", fmt), chunk("data", data)]));
}

/**
 * Builds a music spec: the take read, cut, looped or faded, filtered, levelled to `loudness` LUFS (its peak held
 * under -1 dBFS), and written: an MP3 at 44.1 kHz stereo, VBR quality 2 and no tags, through `ffmpeg` (a path or
 * the name on the PATH), or a mono 22050 Hz WAV with a cue at its start. Returns { report, files, picture }.
 */
export function buildMusicSpec(spec, { readFile, ffmpeg = "ffmpeg" } = {}) {
  const { errors, warnings } = validateMusicSpec(spec);
  const report = { ok: false, errors, faults: [], warnings, facts: [] };
  if (errors.length) return { report, files: [], picture: null };
  const as = spec.as ?? "mp3";
  let wav;
  try {
    wav = readWav(readFile(spec.from.file), { split: true });
  } catch (error) {
    errors.push(`from.file ${spec.from.file}: ${error.message}`);
    return { report, files: [], picture: null };
  }
  let made = null;
  try {
    made = JSON.parse(readFile(spec.from.file.replace(/\.wav$/i, ".json")).toString("utf8"));
  } catch {
    made = null;
  }
  const rate = as === "mp3" ? RATE : 22050;
  // stereo kept for an MP3 (a mono take doubled), one channel for a WAV bed (GoldSrc plays mono only)
  const source = as === "mp3" ? (wav.xs.length === 1 ? [wav.xs[0], wav.xs[0]] : wav.xs.slice(0, 2)) : [wav.x];
  let channels = source.map((x) => resample(x, wav.rate, rate));
  const start = Math.round((spec.from.start ?? 0) * rate);
  const end = spec.from.length ? Math.min(channels[0].length, start + Math.round(spec.from.length * rate)) : channels[0].length;
  if (start >= end) {
    errors.push(`from: nothing of the take after ${spec.from.start} s (it is ${round(wav.samples / wav.rate, 100)} s)`);
    return { report, files: [], picture: null };
  }
  channels = channels.map((x) => x.slice(start, end));
  for (const f of spec.eq ?? []) channels = channels.map((x) => {
    const filter = biquad(f.type, f.f, rate, f.q, f.gain);
    return Float32Array.from(x, (v) => filter(v));
  });
  const n = channels[0].length;
  if (spec.loop?.crossfade) {
    // its last `crossfade` seconds laid over its first, at equal power: the turn is continuous
    const fade = Math.min(Math.floor(n / 2), Math.round(spec.loop.crossfade * rate));
    channels = channels.map((x) => {
      const out = x.slice(0, n - fade);
      for (let i = 0; i < fade; i++) {
        const t = i / fade;
        out[i] = out[i] * Math.sin((t * Math.PI) / 2) + x[n - fade + i] * Math.cos((t * Math.PI) / 2);
      }
      return out;
    });
  } else if (!spec.loop) {
    const ramp = (seconds, fromEnd) => {
      const m = Math.min(n, Math.round(seconds * rate));
      for (const x of channels) for (let i = 0; i < m; i++) x[fromEnd ? n - 1 - i : i] *= i / m;
    };
    if (spec.fade?.in) ramp(spec.fade.in, false);
    if (spec.fade?.out) ramp(spec.fade.out, true);
  }
  // levelled by loudness as the game's tracks are, then held under the ceiling
  const target = spec.loudness ?? LOUDNESS;
  const before = loudness(channels, rate);
  let gain = 10 ** ((target - before.lufs) / 20);
  const peak = 10 ** (before.peak / 20) * gain;
  if (peak > 10 ** (CEILING / 20)) {
    const cut = 10 ** (CEILING / 20) / peak;
    gain *= cut;
    warnings.push(`its peak would reach ${round(20 * Math.log10(peak), 10)} dBFS at ${target} LUFS: held to ${CEILING} dBFS, so it is ${round(target + 20 * Math.log10(cut), 10)} LUFS; a lower loudness, or an eq that tames its loudest band, keeps it whole`);
  }
  channels = channels.map((x) => Float32Array.from(x, (v) => v * gain));
  const after = loudness(channels, rate);
  const name = fileOf(spec);
  let bytes;
  if (as === "wav") bytes = writeWav(channels[0], { rate, bits: 16, loop: spec.loop ? 0 : null });
  else {
    // into a file, not a pipe: the encoder goes back to its start to write the VBR header that says its length
    const dir = mkdtempSync(join(tmpdir(), "smak-music-"));
    const file = join(dir, "track.mp3");
    const encoded = spawnSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-f", "wav", "-i", "pipe:0", "-c:a", "libmp3lame", "-q:a", "2", "-ar", String(RATE), "-map_metadata", "-1", "-id3v2_version", "0", "-write_xing", "1", "-y", file], { input: pcmWav(channels, rate), maxBuffer: 1 << 30 });
    if (encoded.error || encoded.status !== 0 || !existsSync(file)) {
      rmSync(dir, { recursive: true, force: true });
      errors.push(`the MP3 could not be made: ${encoded.error?.code === "ENOENT" ? `${ffmpeg} is not there (ffmpeg with libmp3lame, on the PATH or given); as: "wav" needs no outside program` : String(encoded.stderr).trim().split("\n").slice(-2).join(" ")}`);
      return { report, files: [], picture: null };
    }
    bytes = readFileSync(file);
    rmSync(dir, { recursive: true, force: true });
  }
  // measured as the research measured the game's: the mix at 22050 for its bands
  const mono = Float32Array.from(channels[0], (v, i) => (channels.length > 1 ? (v + channels[1][i]) / 2 : v));
  const f = features({ x: resample(mono, rate, 22050), rate: 22050 });
  const bands = Object.values(f.bands).map((b) => Math.round(b));
  report.facts.push(`${name}: ${as === "mp3" ? "MP3, 44.1 kHz stereo, VBR quality 2" : "WAV, 22050 Hz mono 16-bit"}${spec.loop && as === "wav" ? ", a cue at its start: it loops" : ""}, ${round(channels[0].length / rate, 100)} s, ${Math.round(bytes.length / 1024)} KB; from ${spec.from.file} at ${spec.from.start ?? 0} s${made ? ` (made by ${made.model}${made.seed !== undefined ? ` seed ${made.seed}` : ""}${made.prompt ? ` from "${made.prompt}"` : ""}, licence ${made.licence ?? "not given"}${made.licence && /\bNC\b|non-?commercial/i.test(made.licence) ? ", non-commercial" : ""})` : ""}`);
  report.facts.push(`${name}: ${after.lufs} LUFS (it was ${before.lufs}), loudness range ${after.range} LU, peak ${after.peak} dBFS; power under 150, 600, 2000, 5000 Hz and over: ${bands.join("/")}%`);
  if (spec.group) {
    const g = GROUPS[spec.group];
    report.facts.push(`the game's ${spec.group} tracks (${g.tracks}, medians): ${g.lufs} LUFS, range ${g.range} LU, power ${g.bands.join("/")}%. Told, not held to: listen`);
  }
  if (spec.track !== undefined) report.facts.push(`track ${spec.track}: a map plays it with trigger_cdaudio or target_cdaudio, health ${spec.track} (one player only: the game sends it to the first client); it stands in for the game's own ${TRACKS[spec.track - 2]}.mp3 when put in <mod>/media/`);
  else if (as === "mp3" && /^media\//i.test(name) && !TRACKS.some((t) => name.toLowerCase() === `media/${t.toLowerCase()}.mp3`)) warnings.push(`${name}: the engine plays from media/ only the names of its CD track table (track 2 to 27): a map cannot play this one; a mod's own code may (mp3 play)`);

  if (spec.loop && as === "mp3") warnings.push("an MP3 has no loop point: the game plays it once (cd play), or loops it with a small gap at each turn (the encoder's padding), untested; a bed that must loop without a gap is better a WAV (as: \"wav\") under an ambient_generic");
  report.ok = !errors.length && !report.faults.length;
  const picture = soundPicture([{ name, x: resample(mono, rate, 22050), rate: 22050 }], { width: 960 });
  return { report, files: [{ name, bytes }], picture };
}
