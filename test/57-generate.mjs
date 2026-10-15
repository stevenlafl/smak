// The MCP tool `generate`, with a stand-in for the model: a worker that writes a tone for each take, spoken to as
// the real one is (generators/worker.py). The real models need a GPU and their folder; this tests the tool's own
// part: the manifest, the worker kept loaded, the takes and their sidecars, the answer, a take used in a spec,
// and a shape made into a model's mesh part.
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { testAsync, sure, tmp } from "./helper.mjs";
import { toolsFor } from "../mcp/tools.mjs";
import { openFolders } from "../mcp/folders.mjs";
import { openGenerators, stopWorkers } from "../mcp/generate.mjs";
import { png } from "../src/image.mjs";

const folder = join(tmp, "generators");
mkdirSync(join(folder, "venv"), { recursive: true });
// a "python" that answers as the worker does: ready, then a take a line (a decaying tone at 48 kHz, float, stereo
// for music), counting how many times it was started
const fake = join(folder, "venv", "python");
writeFileSync(
  fake,
  `#!/usr/bin/env node
const fs = require("node:fs");
const model = process.argv[process.argv.indexOf("--model") + 1];
fs.appendFileSync(${JSON.stringify(join(folder, "starts.txt"))}, model + "\\n");
const say = (o) => process.stdout.write(JSON.stringify(o) + "\\n");
say({ ready: true, model, load: 0.1 });
let buffer = "";
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  let at;
  while ((at = buffer.indexOf("\\n")) >= 0) {
    const r = JSON.parse(buffer.slice(0, at));
    buffer = buffer.slice(at + 1);
    if (r.prompt.includes("fail")) { say({ id: r.id, ok: false, error: "RuntimeError: asked to" }); continue; }
    if (r.out.endsWith(".obj")) {
      // a shape: a box twice as tall as it is wide, Y up, and the picture it was "made from"
      const v = [[-1,0,-1],[1,0,-1],[1,0,1],[-1,0,1],[-1,4,-1],[1,4,-1],[1,4,1],[-1,4,1]];
      const f = [[1,3,2],[1,4,3],[5,6,7],[5,7,8],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,4,8],[3,8,7],[4,1,5],[4,5,8]];
      fs.mkdirSync(require("node:path").dirname(r.out), { recursive: true });
      fs.writeFileSync(r.out, v.map((p) => "v " + p.join(" ")).join("\\n") + "\\n" + f.map((t) => "f " + t.join(" ")).join("\\n") + "\\n");
      const picture = r.picture ? null : r.out.replace(/\\.obj$/, ".png");
      if (picture) fs.copyFileSync(${JSON.stringify(join(folder, "seen.png"))}, picture);
      say({ id: r.id, ok: true, file: r.out, faces: 12, box: [[-1, 0, -1], [1, 4, 1]], picture, took: 0.02 });
      continue;
    }
    const rate = 48000, channels = model === "tune" ? 2 : 1, n = Math.round(Math.min(r.length, 5) * rate);
    const data = Buffer.alloc(n * channels * 4);
    for (let i = 0; i < n; i++) for (let c = 0; c < channels; c++) data.writeFloatLE(0.5 * Math.exp(-i / 4000) * Math.sin((2 * Math.PI * (600 + 100 * r.seed) * i) / rate), (i * channels + c) * 4);
    const fmt = Buffer.alloc(16);
    fmt.writeUInt16LE(3, 0); fmt.writeUInt16LE(channels, 2); fmt.writeUInt32LE(rate, 4); fmt.writeUInt32LE(rate * 4 * channels, 8); fmt.writeUInt16LE(4 * channels, 12); fmt.writeUInt16LE(32, 14);
    const chunkOf = (id, body) => Buffer.concat([Buffer.from(id), Buffer.from(Uint32Array.of(body.length).buffer), body]);
    fs.mkdirSync(require("node:path").dirname(r.out), { recursive: true });
    fs.writeFileSync(r.out, chunkOf("RIFF", Buffer.concat([Buffer.from("WAVE"), chunkOf("fmt ", fmt), chunkOf("data", data)])));
    say({ id: r.id, ok: true, file: r.out, rate, channels, seconds: n / rate, took: 0.01 });
  }
});
`,
);
chmodSync(fake, 0o755);
writeFileSync(
  join(folder, "generators.json"),
  JSON.stringify({ models: [{ name: "clang", kind: "sound", python: "venv/python", licence: "CC-BY-NC 4.0", default: true, longest: 5 }, { name: "tune", kind: "music", python: "venv/python", licence: "MIT", default: true }, { name: "former", kind: "shape", root: ".", python: "venv/python", licence: "non-commercial" }] }),
);
writeFileSync(join(folder, "seen.png"), png(8, 8, Buffer.alloc(8 * 8 * 4, 200)));

await testAsync("generate: takes of a prompt by the kind's default model, each with its sidecar, measured, drawn, and kept loaded", "generate", async () => {
  try {
    await generateCase();
  } finally {
    stopWorkers();
  }
});

async function generateCase() {
  const folders = openFolders({ work: join(tmp, "gen-work") });
  folders.generators = openGenerators(folder);
  const tools = Object.fromEntries(toolsFor(folders).map((t) => [t.name, t]));
  sure(tools.generate && /clang \(sound, the default, CC-BY-NC 4.0\)/.test(tools.generate.description), "the tool, naming its models");
  const answer = await tools.generate.call({ prompt: "a wrench on a pipe", length: 0.5, seeds: 3, name: "hit", class: "metal hit" });
  const said = answer[0].text;
  sure(/3 of 3 takes of "a wrench on a pipe" by clang \(sound; licence CC-BY-NC 4\.0\); the model loaded in 0\.1 s/.test(said), said);
  sure(/work:gen\/hit_s2\.wav: 0\.5 s at 48000 Hz, made in 0\.01 s; peak .* against metal hit: \d+ of \d+/.test(said), said);
  sure(answer[1]?.type === "image", "one picture of the takes");
  const sidecar = JSON.parse(readFileSync(join(folders.work, "gen", "hit_s1.json"), "utf8"));
  sure(sidecar.model === "clang" && sidecar.seed === 1 && sidecar.licence === "CC-BY-NC 4.0" && sidecar.prompt === "a wrench on a pipe", JSON.stringify(sidecar));
  // more seeds of the same prompt: the model is not loaded again, the load not told again
  const more = (await tools.generate.call({ prompt: "a wrench on a pipe", length: 0.5, seeds: 2, from: 3, name: "hit" }))[0].text;
  sure(/2 of 2 takes/.test(more) && !/loaded/.test(more) && existsSync(join(folders.work, "gen", "hit_s4.wav")), more);
  // a take that fails is told, the others made
  const failed = (await tools.generate.call({ prompt: "fail please", length: 0.5, seeds: 1 }))[0].text;
  sure(/0 of 1 takes/.test(failed) && /seed 0: failed: RuntimeError: asked to/.test(failed), failed);
  // music: another model, so the first is stopped and this one started; its hint says no spec writes music yet
  const tune = (await tools.generate.call({ kind: "music", prompt: "a tune", length: 2, seeds: 1, bpm: 120 }))[0].text;
  sure(/by tune \(music; licence MIT\)/.test(tune) && /\(2 channels\)/.test(tune) && /No spec writes music/.test(tune), tune);
  sure(readFileSync(join(folder, "starts.txt"), "utf8").trim().split("\n").join(",") === "clang,tune", "each model started once");
  // a spec of layers alone, on a server that has generators, is told of them
  const layered = (await tools.build.call({ spec: { spec: "smak.sound/1", name: "weapons/beep.wav", layers: [{ kind: "tone", f: 880, env: { decay: 0.2 } }] } }))[0].text;
  sure(/note  made of layers alone: this server makes recordings \(the tool generate, clang\)/.test(layered), layered);
  // a take used in a sound spec through build
  const built = (await tools.build.call({ spec: { spec: "smak.sound/1", name: "weapons/hit.wav", layers: [{ kind: "sample", file: "work:gen/hit_s0.wav", from: "onset" }] } }))[0].text;
  sure(!/made of layers alone/.test(built), "no note once a take is used");
  sure(/^OK/.test(built) && /made by clang seed 0 from "a wrench on a pipe", licence CC-BY-NC 4\.0 \(non-commercial\)/.test(built) && !/may not be sold/.test(built), built);
  // refused in words
  for (const [args, said] of [[{ prompt: "", length: 1 }, /prompt:/], [{ prompt: "x", length: 0 }, /length:/], [{ prompt: "x", length: 1, model: "none" }, /model: one of clang \(sound\), tune \(music\)/], [{ prompt: "x", length: 1, seeds: 99 }, /seeds:/]]) {
    let message = "";
    try {
      await tools.generate.call(args);
    } catch (error) {
      message = error.message;
    }
    sure(said.test(message), `${JSON.stringify(args)}: ${message}`);
  }
  // a shape from words: the .obj, the picture it came from and its sidecar; then a model spec's mesh part made of it
  const shaped = await tools.generate.call({ kind: "shape", prompt: "a tall crate", seeds: 1, name: "crate" });
  sure(/1 of 1 shapes of "a tall crate" by former/.test(shaped[0].text) && /work:gen\/crate_s0\.obj: 12 triangles, 2 x 4 x 2/.test(shaped[0].text) && shaped[1]?.type === "image", shaped[0].text);
  sure(JSON.parse(readFileSync(join(folders.work, "gen", "crate_s0.json"), "utf8")).picture === "gen/crate_s0.png", "its sidecar names its picture");
  const model = (await tools.build.call({ spec: { spec: "smak.model/1", name: "crate.mdl", kind: "prop", parts: [{ id: "body", kind: "mesh", file: "work:gen/crate_s0.obj", size: [16, 16, 32], material: "wood" }] } }))[0].text;
  sure(/^OK/.test(model) && /body: the shape of work:gen\/crate_s0\.obj, 12 triangles reduced to 12, fitted to 16 x 16 x 32 \(its own proportions 0\.5 : 0\.5 : 1\)/.test(model) && /body 12 -8 -8 0 to 8 8 32/.test(model), model);
  const squashed = (await tools.build.call({ spec: { spec: "smak.model/1", name: "crate2.mdl", kind: "prop", parts: [{ id: "body", kind: "mesh", file: "work:gen/crate_s0.obj", size: [32, 32, 32] }] } }))[0].text;
  sure(/stretched 100% more one way than another: give size its own proportions \(16 x 16 x 32/.test(squashed), squashed);
  stopWorkers();
  const none = toolsFor(openFolders({ work: join(tmp, "gen-work") }));
  sure(!none.some((t) => t.name === "generate"), "no generators, no tool");
}
