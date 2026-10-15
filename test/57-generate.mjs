// The MCP tool `generate`, with a stand-in for the model: a worker that writes a tone for each take, spoken to as
// the real one is (generators/worker.py). The real models need a GPU and their folder; this tests the tool's own
// part: the manifest, the worker kept loaded, the takes and their sidecars, the answer, a take used in a spec.
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { testAsync, sure, tmp } from "./helper.mjs";
import { toolsFor } from "../mcp/tools.mjs";
import { openFolders } from "../mcp/folders.mjs";
import { openGenerators, stopWorkers } from "../mcp/generate.mjs";

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
  JSON.stringify({ models: [{ name: "clang", kind: "sound", python: "venv/python", licence: "CC-BY-NC 4.0", default: true, longest: 5 }, { name: "tune", kind: "music", python: "venv/python", licence: "MIT", default: true }] }),
);

await testAsync("generate: takes of a prompt by the kind's default model, each with its sidecar, measured, drawn, and kept loaded", "generate", async () => {
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
  // a take used in a sound spec through build
  const built = (await tools.build.call({ spec: { spec: "smak.sound/1", name: "weapons/hit.wav", layers: [{ kind: "sample", file: "work:gen/hit_s0.wav", from: "onset" }] } }))[0].text;
  sure(/^OK/.test(built) && /made by clang seed 0 from "a wrench on a pipe", licence CC-BY-NC 4\.0/.test(built) && /may not be sold/.test(built), built);
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
  stopWorkers();
  const none = toolsFor(openFolders({ work: join(tmp, "gen-work") }));
  sure(!none.some((t) => t.name === "generate"), "no generators, no tool");
});
