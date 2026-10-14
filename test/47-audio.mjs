// Sounds: a GoldSrc file written and read back (8 and 16 bit, a cue point), measured in known signals, made
// from a spec the same way every time, checked as the engine needs it, and built by the tool.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import * as smak from "../src/index.mjs";
import { test, testAsync, sure, tmp } from "./helper.mjs";
import { toolsFor } from "../mcp/tools.mjs";

const { audio: A } = smak;
const RATE = 22050;
const signal = (seconds, f) => Float32Array.from({ length: Math.round(seconds * RATE) }, (_, i) => f(i / RATE, i));

test("a sound file: mono PCM written and read back, 8 and 16 bit, with the one cue point a loop wants", () => {
  const x = signal(0.2, (t) => 0.5 * Math.sin(2 * Math.PI * 440 * t));
  const sixteen = A.readWav(A.writeWav(x, { rate: RATE, bits: 16 }));
  sure(sixteen.format === 1 && sixteen.channels === 1 && sixteen.bits === 16 && sixteen.rate === RATE && sixteen.samples === x.length, JSON.stringify({ ...sixteen, x: undefined }));
  sure(sixteen.x.every((v, i) => Math.abs(v - x[i]) < 1e-4) && sixteen.cue === null, "16 bit: the same samples, no cue");
  const looped = A.readWav(A.writeWav(x, { rate: 11025, bits: 8, loop: 2339 }));
  sure(looped.bits === 8 && looped.rate === 11025 && looped.cue?.[0] === 2339 && looped.x.every((v, i) => Math.abs(v - x[i]) < 0.02), `8 bit with a cue at 2339: ${looped.cue}`);
  const again = A.writeWav(x, { bits: 8, loop: 0, seed: 5 });
  sure(again.equals(A.writeWav(x, { bits: 8, loop: 0, seed: 5 })), "the dither is seeded: the same bytes every time");
  let refused = "";
  try {
    A.writeWav(x, { rate: 32000 });
  } catch (error) {
    refused = error.message;
  }
  sure(/a rate of 11025, 22050, 44100 Hz/.test(refused), refused);
});

test("a sound's features: a tone, white noise and a dying ping measure what they are", () => {
  const tone = A.features({ x: signal(0.5, (t) => 0.5 * Math.sin(2 * Math.PI * 1000 * t)), rate: RATE });
  sure(Math.abs(tone.centroid - 1000) < 40 && tone.flatness < 0.01 && Math.abs(tone.crest - 3) < 0.2 && tone.length === 0.5, `a 1000 Hz tone: ${JSON.stringify(tone)}`);
  sure(tone.bands["600-2k"] > 95, `its power between 600 and 2000 Hz: ${JSON.stringify(tone.bands)}`);
  const random = A.seeded(9);
  const noise = A.features({ x: signal(0.5, () => random() * 2 - 1), rate: RATE });
  sure(noise.flatness > 0.5 && noise.centroid > 4000, `white noise is flat and bright: ${noise.flatness} ${noise.centroid}`);
  // falls 60 dB in 0.3 s: 20 dB in 0.1 s, 40 in 0.2
  const ping = A.features({ x: signal(0.6, (t) => Math.sin(2 * Math.PI * 800 * t) * Math.exp((-6.9078 * t) / 0.3)), rate: RATE });
  sure(Math.abs(ping.t20 - 0.1) < 0.012 && Math.abs(ping.t40 - 0.2) < 0.015 && ping.attack < 0.01, `a ping that dies in 0.3 s: T20 ${ping.t20} T40 ${ping.t40}`);
});

test("the checks a played file must pass: clipping, an offset, a late start, an end that clicks, a loop's cue and seam", () => {
  const wav = (x, options) => A.readWav(A.writeWav(x, options));
  const clean = A.checks(wav(signal(0.3, (t) => 0.8 * Math.sin(2 * Math.PI * 300 * t) * Math.exp(-20 * t) * (t < 0.29 ? 1 : 0))));
  sure(clean.faults.length === 0, `a clean one-shot: ${clean.faults}`);
  const faults = A.checks(wav(signal(0.3, (t) => (t < 0.05 ? 0 : t < 0.1 ? 1 : 0.3 + 0.2 * Math.sin(2 * Math.PI * 200 * t))))).faults.join(" | ");
  sure(/clipped/.test(faults) && /DC offset/.test(faults) && /silence before it starts/.test(faults) && /ends in a click/.test(faults), faults);
  const hum = signal(1, (t) => 0.5 * Math.sin(2 * Math.PI * 50.25 * t));
  sure(/no cue point/.test(A.checks(wav(hum), { loop: true }).faults.join()), "a loop without a cue is played once");
  sure(/jumps by .* at the seam/.test(A.checks(wav(hum, { loop: 0 }), { loop: true }).faults.join()), "a quarter of a cycle short, its end at a peak: a click every time round");
});

const HIT = {
  spec: "smak.sound/1",
  name: "weapons/cbar_hit1.wav",
  class: "metal hit",
  seed: 3,
  layers: [
    { id: "click", kind: "noise", filter: [{ type: "highpass", f: 1500 }], env: { decay: 0.012 }, gain: -2 },
    { id: "ring", kind: "modes", f: 760, ratios: "bar", decay: 0.7, damping: 1.2 },
  ],
  finish: { saturate: 1.5, room: { decay: 0.35, wet: 0.15 } },
  variants: [{ name: "weapons/cbar_hit2.wav", seed: 4, pitch: 3 }],
};

test("a sound spec: built the same every time, its variants, held against its class, its mistakes said", () => {
  const first = A.buildSoundSpec(HIT);
  sure(first.report.ok && first.files.length === 2, [...first.report.errors, ...first.report.faults].join("; "));
  sure(first.files[0].bytes.equals(A.buildSoundSpec(HIT).files[0].bytes), "the same spec, the same bytes");
  sure(!first.files[0].bytes.equals(first.files[1].bytes), "a variant is another sound");
  sure(first.report.facts.some((f) => /cbar_hit1.wav: against the game's metal hit sounds, \d+ of 22/.test(f)), first.report.facts.join(" | "));
  sure(first.picture && first.picture.width === 640 && first.picture.height > 400, "a picture of the two");
  const loop = A.buildSoundSpec({ spec: "smak.sound/1", name: "ambience/hum.wav", class: "loop machine", length: 2.5, loop: { crossfade: 0.3 }, layers: [{ kind: "tone", f: 60, env: { attack: 0.01, hold: 3 } }, { kind: "noise", color: "pink", filter: [{ type: "bandpass", f: 300 }], gain: -14, env: { attack: 0.01, hold: 3 } }] });
  sure(loop.report.ok && A.readWav(loop.files[0].bytes).cue?.[0] === 0, `a loop with its cue and a smooth seam: ${[...loop.report.errors, ...loop.report.faults]}`);
  const wrong = A.validateSoundSpec({ spec: "smak.sound/1", name: "Weapons/Hit 1.wav", class: "clang", layers: [{ kind: "chime" }, { kind: "modes", ratios: "drum" }] });
  const said = wrong.errors.join(" | ");
  sure(/name: the file's path under sound\/, lower case/.test(said) && /class: one of metal hit/.test(said) && /kind: noise, tone, fm, modes, particles/.test(said) && /ratios: bar, clamped/.test(said), said);
});

await testAsync("the tool build makes sounds: the files under work:sound/, their report and their picture", "sound build", async () => {
  const work = join(tmp, "sound-work");
  const tools = toolsFor({ work, models: tmp, wads: [] });
  const build = tools.find((tool) => tool.name === "build");
  const out = await build.call({ spec: HIT });
  const text = out.find((part) => part.type === "text").text;
  sure(/^OK/.test(text) && /written: work:sound\/weapons\/cbar_hit1.wav, work:sound\/weapons\/cbar_hit2.wav/.test(text), text);
  sure(existsSync(join(work, "sound", "weapons", "cbar_hit2.wav")) && A.readWav(readFileSync(join(work, "sound", "weapons", "cbar_hit1.wav"))).rate === 22050, "the files are there");
  sure(out.some((part) => part.type === "image"), "and the picture");
});
