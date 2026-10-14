// The experiment of research/sound-shape-results.md: round 1's ten pictures-leg sound specs rebuilt with a noise
// layer shaped from their pictures (audio.fromPicture), a crack after the finish and a limiter at a crest,
// and held to the reproduction test's caps against Valve's originals, before and after. Valve's files are
// read in place and never written anywhere: what is printed is numbers.
//   node research/sound-shape.mjs <the game's valve folder> [--json out.json]
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as smak from "../src/index.mjs";

const A = smak.audio;
const HERE = dirname(fileURLToPath(import.meta.url));
const ROUND1 = join(HERE, "..", "examples", "reproduce", "assets", "sounds");
const game = process.argv[2];
if (!game) throw new Error("node research/sound-shape.mjs <the game's valve folder, the one with sound/ in it>");
const json = process.argv.includes("--json") ? process.argv[process.argv.indexOf("--json") + 1] : null;
const CLASS = { "weapons/cbar_hit1": "metal hit", "weapons/357_shot1": "gunshot", "weapons/sbarrel1": "gunshot", "player/pl_step1": "step concrete", "player/pl_metal1": "step metal", "weapons/explode3": "explosion", "ambience/drips": "loop drips" };
const NAMES = ["weapons/cbar_hit1", "weapons/357_shot1", "weapons/sbarrel1", "player/pl_step1", "player/pl_metal1", "doors/doormove1", "items/smallmedkit1", "debris/bustmetal1", "weapons/explode3", "ambience/drips"];
const round = (v, k = 1) => Math.round(v * 10 ** k) / 10 ** k;

/** The harness's caps (examples/reproduce/assets.mjs, measureSoundCopy), and crest within 2 dB. */
function caps(fo, fc, cls, loop) {
  const length = Math.abs(fc.length - fo.length) / fo.length;
  const centroid = Math.abs(fc.centroid - fo.centroid) / fo.centroid;
  const bands = Math.max(...Object.keys(fo.bands).map((k) => Math.abs(fc.bands[k] - fo.bands[k])));
  const range = loop ? null : cls ? A.rangesOf(cls).t20 : [fo.t20 - Math.max(0.05, fo.t20 * 0.25), fo.t20 + Math.max(0.05, fo.t20 * 0.25)];
  const t20 = !range || (fc.t20 >= range[0] && fc.t20 <= range[1]);
  const crest = fc.crest - fo.crest;
  const ok = { length: length <= 0.25, centroid: centroid <= 0.2, bands: bands <= 10, t20, crest: Math.abs(crest) <= 2 };
  return { length: round(length * 100), centroid: round(centroid * 100), bands: round(bands), t20: fc.t20, t20Range: range && range.map((v) => round(v, 2)), crest: round(crest), onsets: fc.onsets, ok, s2: ok.length && ok.t20, s3: ok.centroid && ok.bands };
}

const built = (spec) => {
  const { report, files } = A.buildSoundSpec(spec);
  if (!files.length) throw new Error(`${spec.name}: ${report.errors.join("; ")}`);
  return { f: A.features(A.readWav(files[0].bytes)), faults: report.faults };
};

/** 1 to 3 ms of white noise high-passed at 2 kHz, after the limiter: a crack that keeps its onset. */
const crack = (at) => ({ id: "crack", kind: "noise", color: "white", filter: [{ type: "highpass", f: 2000 }], env: { attack: 0.0001, hold: 0.001, decay: 0.003 }, at, gain: -12, post: true });

const rows = [];
for (const name of NAMES) {
  const id = name.replace("/", "-");
  const wav = A.readWav(readFileSync(join(game, "sound", `${name}.wav`)));
  const loop = Boolean(wav.cue?.length);
  const fo = A.features(wav);
  // the picture the pictures leg is given (the harness's `inputs`), made in memory
  const picture = A.soundPicture([{ name: `${name}.wav`, x: wav.x, rate: wav.rate, loop: loop ? wav.cue[0] : undefined }], { width: 960 });
  const png = smak.png(picture.width, picture.height, picture.rgba);
  const draft = A.fromPicture(png, { name: `${name}.wav` });
  const seen = draft.measures;
  const round1 = JSON.parse(readFileSync(join(ROUND1, id, "pictures", "spec.json"), "utf8"));
  const cls = CLASS[name];
  const before = built(round1);
  const body = { ...draft.spec.layers[0] };
  const cracks = loop ? [] : [crack(0)];
  const limit = (crest) => ({ crest });
  // A, the research's recipe: the spec's noise layers given way to one shaped layer, its other layers kept
  const kept = round1.layers.filter((l) => l.kind !== "noise");
  const recipe = { ...round1, layers: [body, ...kept, ...cracks], finish: { ...(round1.finish ?? {}), limit: limit(fo.crest) } };
  // B, the draft alone (its shaped noise and its modes), the crack, the limiter at Valve's crest
  const alone = { ...draft.spec, bits: round1.bits, seed: round1.seed ?? 1, layers: [...draft.spec.layers, ...cracks], finish: { limit: limit(fo.crest), peak: -0.5 } };
  // C, as B with the crest read off the picture: what an agent with the picture alone knows
  const blind = { ...alone, finish: { limit: limit(seen.crest), peak: -0.5 } };
  // D, the draft with nothing added: the shape and the envelope alone
  const bare = { ...draft.spec, bits: round1.bits, seed: round1.seed ?? 1 };
  const out = { name, rate: wav.rate, loop, original: { crest: fo.crest, t20: fo.t20, centroid: fo.centroid, onsets: fo.onsets, bands: fo.bands }, picture: { crest: seen.crest, t20: seen.t20, centroid: seen.centroid, onsets: seen.onsets, bands: seen.bands }, lines: draft.lines, keys: body.shape.keys?.length ?? 1, envPoints: body.env.points.length };
  for (const [leg, spec] of Object.entries({ before: round1, recipe, alone, blind, bare })) {
    const made = leg === "before" ? before : built(spec);
    out[leg] = { ...caps(fo, made.f, cls, loop), faults: made.faults.length };
  }
  rows.push(out);
  const line = (leg) => {
    const c = out[leg];
    return `${leg.padEnd(6)} len ${String(c.length).padStart(5)}% cent ${String(c.centroid).padStart(5)}% bands ${String(c.bands).padStart(5)} t20 ${String(c.t20).padStart(5)}${c.ok.t20 ? " " : "!"} crest ${String(c.crest).padStart(5)} on ${c.onsets} | S2 ${c.s2 ? "y" : "n"} S3 ${c.s3 ? "y" : "n"} crest ${c.ok.crest ? "y" : "n"}`;
  };
  console.log(`${name} (crest ${fo.crest}, picture ${seen.crest}; onsets ${fo.onsets}; lines ${draft.lines.map((l) => l.f).join(", ") || "none"})`);
  for (const leg of ["before", "recipe", "alone", "blind", "bare"]) console.log(`  ${line(leg)}`);
}
for (const leg of ["before", "recipe", "alone", "blind", "bare"]) {
  const count = (k) => rows.filter((r) => (k === "both" ? r[leg].s2 && r[leg].s3 : k in r[leg].ok ? r[leg].ok[k] : r[leg][k])).length;
  console.log(`${leg}: length ${count("length")}, centroid ${count("centroid")}, bands ${count("bands")}, t20 ${count("t20")}, crest ${count("crest")}; S2 ${count("s2")}, S3 ${count("s3")}, both ${count("both")} of ${rows.length}`);
}
if (json) writeFileSync(json, `${JSON.stringify(rows, null, 1)}\n`);
