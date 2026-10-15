// The MCP tool `generate`: a sound or a piece of music made by a model run on this machine (Woosh, ACE-Step),
// several seeds at once, each take written to the work folder with a sidecar saying what made it, measured and
// drawn. The agent then picks a take and shapes it in a sound spec (a `sample` layer). Offered only when the
// server is given a generators folder (`--generators <dir>` or SMAK_GENERATORS): the folder
// generators/install.sh fills, with a `generators.json` that names its models.
//
//   openGenerators(folder)                 -> { folder, models: [{ name, kind, python, licence, default }] }
//   generate(folders, args)                -> the tool's answer: text and one picture of the takes
//   stopWorkers()                          -> the loaded model's process stopped
//
// generators.json: { "models": [{ "name": "woosh-dflow", "kind": "sound", "python": "venvs/audio-rocm/bin/python",
//   "licence": "CC-BY-NC 4.0", "default": true, "longest": 5 }, ...] }. Paths are from the folder. The worker
// (generators/worker.py) keeps one model in memory; asking for another stops it first, since the card holds one.
import { spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readWav, resample } from "../src/audio/wav.mjs";
import { features } from "../src/audio/measure.mjs";
import { CLASSES, scoreAgainst } from "../src/audio/classes.mjs";
import { soundPicture } from "../src/audio/draw.mjs";
import { png } from "../src/image.mjs";
import { text, image } from "./protocol.mjs";
import { pathOf } from "./folders.mjs";

const WORKER = join(dirname(fileURLToPath(import.meta.url)), "..", "generators", "worker.py");
const KINDS = ["sound", "music"];
/** How long a model may take to load (XL: about 3 minutes here), and a take to be made. */
const LOAD_MS = 15 * 60 * 1000;
const TAKE_MS = 10 * 60 * 1000;
/** A loaded model is let go after this long unused, so that a game can have the card back. */
const IDLE_MS = 10 * 60 * 1000;
const MOST_SEEDS = 16;

/** The generators of a folder, from its generators.json; throws a sentence when it is not one. */
export function openGenerators(folder) {
  const file = join(folder, "generators.json");
  if (!existsSync(file)) throw new Error(`no generators.json in ${folder}: it names the models (generators/README.md)`);
  const { models } = JSON.parse(readFileSync(file, "utf8"));
  if (!Array.isArray(models) || !models.length) throw new Error(`${file}: "models": [{ name, kind, python, licence }]`);
  for (const m of models) {
    if (typeof m.name !== "string" || !KINDS.includes(m.kind) || typeof m.python !== "string") throw new Error(`${file}: each model { name, kind: sound | music, python }, not ${JSON.stringify(m)}`);
    if (!existsSync(resolve(folder, m.python))) throw new Error(`${file}: ${m.name}'s python ${m.python} is not there (generators/install.sh)`);
  }
  return { folder: resolve(folder), models };
}

// ── the worker: one model loaded at a time ─────────────────────────────────
let live = null;

/** The loaded model's process stopped. */
export function stopWorkers() {
  if (live) {
    live.child.kill();
    live = null;
  }
}
process.once("exit", stopWorkers);

/** The worker for `model`, loaded: started (and any other stopped) when it is not the live one. */
function workerFor(generators, model) {
  if (live?.name === model.name && !live.dead) return live.ready;
  stopWorkers();
  const child = spawn(resolve(generators.folder, model.python), ["-I", WORKER, "--model", model.name, "--root", generators.folder], {
    cwd: generators.folder,
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, ...(model.env ?? {}) },
  });
  const worker = { name: model.name, child, waiting: new Map(), next: 1, dead: false, err: "" };
  let buffer = "";
  let onReady;
  worker.ready = new Promise((resolveReady, reject) => {
    onReady = { resolve: resolveReady, reject };
    setTimeout(() => reject(new Error(`${model.name} did not load in ${LOAD_MS / 60000} minutes`)), LOAD_MS).unref();
  });
  child.stdout.on("data", (chunk) => {
    buffer += chunk;
    let at;
    while ((at = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, at);
      buffer = buffer.slice(at + 1);
      let said;
      try {
        said = JSON.parse(line);
      } catch {
        continue;
      }
      if ("ready" in said) {
        if (said.ready) onReady.resolve({ worker, load: said.load });
        else onReady.reject(new Error(`${model.name} failed to load: ${said.error}`));
      } else worker.waiting.get(said.id)?.(said);
    }
  });
  // the last of what it says on stderr, to tell why it stopped
  child.stderr.on("data", (chunk) => (worker.err = (worker.err + chunk).slice(-2000)));
  child.on("exit", (code) => {
    worker.dead = true;
    const why = `${model.name}'s worker stopped (${code}): ${worker.err.trim().split("\n").slice(-3).join(" | ")}`;
    onReady.reject(new Error(why));
    for (const answer of worker.waiting.values()) answer({ ok: false, error: why });
    if (live === worker) live = null;
  });
  live = worker;
  return worker.ready;
}

/** One take asked of the worker: its answer line. */
function ask(worker, request) {
  const id = worker.next++;
  return new Promise((resolveTake) => {
    const timer = setTimeout(() => {
      worker.waiting.delete(id);
      resolveTake({ ok: false, error: `no take in ${TAKE_MS / 60000} minutes` });
    }, TAKE_MS);
    timer.unref();
    worker.waiting.set(id, (said) => {
      clearTimeout(timer);
      worker.waiting.delete(id);
      resolveTake(said);
    });
    worker.child.stdin.write(`${JSON.stringify({ ...request, id })}\n`);
  });
}

/** Lets the live model go after IDLE_MS unused. */
function idleLater(worker) {
  clearTimeout(worker.idle);
  worker.idle = setTimeout(() => live === worker && stopWorkers(), IDLE_MS);
  worker.idle.unref();
}

// ── the tool ───────────────────────────────────────────────────────────────
const round = (v, k = 100) => Math.round(v * k) / k;

/** The model asked for, or the kind's default (the first marked `default`, else the first of the kind). */
function modelOf(generators, { model, kind = "sound" }) {
  if (model) {
    const found = generators.models.find((m) => m.name === model);
    if (!found) throw new Error(`model: one of ${generators.models.map((m) => `${m.name} (${m.kind})`).join(", ")}`);
    return found;
  }
  const own = generators.models.filter((m) => m.kind === kind);
  if (!own.length) throw new Error(`no ${kind} model in generators.json`);
  return own.find((m) => m.default) ?? own[0];
}

/**
 * Takes of one prompt, a seed each: written as work:gen/<name>_s<seed>.wav (the model's own rate and channels,
 * float) beside a sidecar <name>_s<seed>.json, then measured at the game's rate and drawn one under another.
 */
export async function generate(folders, args) {
  const generators = folders.generators;
  if (!generators) throw new Error("no generators: start the server with --generators <folder>");
  const { prompt, length } = args;
  if (typeof prompt !== "string" || !prompt.trim()) throw new Error("prompt: what to make, in words (\"a wrench hitting a steel pipe, one sharp clang\")");
  if (!(typeof length === "number" && length > 0 && length <= 600)) throw new Error("length: seconds, over 0 and at most 600");
  if (args.kind !== undefined && !KINDS.includes(args.kind)) throw new Error(`kind: ${KINDS.join(" or ")}`);
  const model = modelOf(generators, args);
  const seeds = Array.isArray(args.seeds) ? args.seeds : Array.from({ length: args.seeds ?? 4 }, (_, i) => i + (args.from ?? 0));
  if (!seeds.length || seeds.length > MOST_SEEDS || seeds.some((s) => !Number.isInteger(s) || s < 0)) throw new Error(`seeds: how many (1 to ${MOST_SEEDS}), or a list of whole numbers`);
  if (args.class !== undefined && !CLASSES[args.class]) throw new Error(`class: one of ${Object.keys(CLASSES).join(", ")}`);
  const name = (args.name ?? prompt.split(/\s+/).slice(0, 3).join("_")).toLowerCase().replace(/^work:/, "").replace(/\.wav$/, "").replace(/[^a-z0-9_/-]+/g, "_");
  const stem = name.includes("/") ? name : `gen/${name}`;
  const notes = [];
  if (model.longest && length > model.longest) notes.push(`${model.name} makes ${model.longest} s at most: each take is ${model.longest} s`);
  if (model.kind === "sound" && (args.bpm || args.key || args.loop)) notes.push(`${model.name} takes no bpm, key or loop: left out`);
  const started = Date.now();
  const { worker, load } = await workerFor(generators, model);
  // the load told once, with the first takes of a model newly started
  const loaded = worker.told ? null : load;
  worker.told = true;
  const takes = [];
  for (const seed of seeds) {
    const out = pathOf(folders, `${stem}_s${seed}.wav`, { write: true });
    const said = await ask(worker, { prompt, length, seed, out, bpm: args.bpm, key: args.key, loop: !!args.loop });
    if (!said.ok) {
      takes.push({ seed, error: said.error });
      continue;
    }
    const sidecar = { model: model.name, kind: model.kind, prompt, seed, length, bpm: args.bpm, key: args.key, loop: !!args.loop, licence: model.licence ?? "not given", rate: said.rate, channels: said.channels, took: said.took, made: new Date().toISOString() };
    writeFileSync(out.replace(/\.wav$/, ".json"), `${JSON.stringify(sidecar, null, 1)}\n`);
    const wav = readWav(readFileSync(out));
    const x = resample(wav.x, wav.rate, 22050);
    takes.push({ seed, file: relative(folders.work, out), said, x, f: features({ x, rate: 22050 }) });
  }
  idleLater(worker);
  const made = takes.filter((t) => t.x);
  const lines = [
    `${made.length} of ${seeds.length} takes of "${prompt}" by ${model.name} (${model.kind}; licence ${model.licence ?? "not given"})${loaded !== null ? `; the model loaded in ${loaded} s` : ""}; ${round((Date.now() - started) / 1000, 10)} s in all`,
    ...notes,
    ...takes.map((t) => {
      if (t.error) return `seed ${t.seed}: failed: ${t.error}`;
      const { f } = t;
      const score = args.class ? scoreAgainst(f, args.class) : null;
      return `work:${t.file}: ${t.said.seconds} s at ${t.said.rate} Hz${t.said.channels > 1 ? ` (${t.said.channels} channels)` : ""}, made in ${t.said.took} s; peak ${round(f.peak, 10)} dBFS, crest ${round(f.crest, 10)} dB, first hit at ${round(f.lead, 1000)} s, centroid ${Math.round(f.centroid)} Hz, bands ${Object.values(f.bands).map((b) => Math.round(b)).join("/")}% (under 150, 600, 2000, 5000 Hz, over)${score ? `; against ${args.class}: ${score.score} of ${score.of}${score.lines.length ? ` (${score.lines.slice(0, 3).join("; ")})` : ""}` : ""}`;
    }),
    model.kind === "music"
      ? "Each take has a sidecar .json (model, prompt, seed, licence). No spec writes music for the game yet: a take is a 48 kHz stereo WAV, and the game plays its music as 44.1 kHz stereo MP3 under media/ (research/local-music-generators.md). Tell the person which take, and that it is to be converted and named for the game."
      : `Each take has a sidecar .json (model, prompt, seed, licence). Listen to them, or read the picture; put the one you choose in a sound spec as a layer { "kind": "sample", "file": "work:${stem}_s<seed>.wav", "from": "onset" } and shape it there (guide { doc: "spec" }, "A sound").`,
  ];
  const answer = [text(lines.join("\n"))];
  if (made.length) {
    const picture = soundPicture(made.map((t) => ({ name: `${t.file} (seed ${t.seed})`, x: t.x, rate: 22050 })));
    answer.push(image(png(picture.width, picture.height, picture.rgba)));
  }
  return answer;
}
