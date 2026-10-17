// The MCP tool `generate`: a sound or a piece of music made by a model run on this machine (Woosh, ACE-Step),
// several seeds at once, each take written to the work folder with a sidecar saying what made it, measured and
// drawn. The agent then picks a take and shapes it in a sound spec (a `sample` layer). Offered only when the
// server is given a generators folder (`--generators <dir>` or SMAK_GENERATORS): the folder
// generators/install.sh fills, with a `generators.json` that names its models.
//
//   openGenerators(folder)                 -> { folder, models: [{ name, kind, python, root, licence, default }] }
//   generate(folders, args)                -> the tool's answer: text and one picture of the takes
//   stopWorkers()                          -> the loaded model's process stopped
//
// generators.json: { "models": [{ "name": "woosh-dflow", "kind": "sound", "python": "venvs/audio-rocm/bin/python",
//   "licence": "CC-BY-NC 4.0", "default": true, "longest": 5 }, ...] }. Paths are from the folder, or from a
//   model's own `root` (another folder: the 3D models live apart from the audio ones). The worker
// (generators/worker.py) keeps one model in memory; asking for another stops it first, since the card holds one.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readWav, resample } from "../src/audio/wav.mjs";
import { features } from "../src/audio/measure.mjs";
import { CLASSES, scoreAgainst } from "../src/audio/classes.mjs";
import { soundPicture } from "../src/audio/draw.mjs";
import { png, unpicture } from "../src/image.mjs";
import { readObj, objModel } from "../src/obj.mjs";
import { render, tile } from "../src/render.mjs";
import { aimedBase, GENERATED_STANCE } from "../src/spec/model.mjs";
import { readMdl, textureOf, replaceTexture } from "../src/mdl.mjs";
import { text, image } from "./protocol.mjs";
import { pathOf } from "./folders.mjs";

const WORKER = join(dirname(fileURLToPath(import.meta.url)), "..", "generators", "worker.py");
const KINDS = ["sound", "music", "shape"];
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
    if (typeof m.name !== "string" || !KINDS.includes(m.kind) || typeof m.python !== "string") throw new Error(`${file}: each model { name, kind: sound | music | shape, python }, not ${JSON.stringify(m)}`);
    m.root = resolve(folder, m.root ?? ".");
    if (!existsSync(resolve(m.root, m.python))) throw new Error(`${file}: ${m.name}'s python ${m.python} is not there in ${m.root} (generators/install.sh)`);
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
  const child = spawn(resolve(model.root, model.python), ["-I", WORKER, "--model", model.name, "--root", model.root], {
    cwd: model.root,
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
  // an idle worker does not keep the process alive (a test that fails, a script that is done): only a take asked for does
  const hold = (on) => [child, child.stdin, child.stdout, child.stderr].forEach((x) => (on ? x.ref?.() : x.unref?.()));
  worker.hold = hold;
  worker.ready.then(() => worker.waiting.size || hold(false), () => {});
  live = worker;
  return worker.ready;
}

/** One take asked of the worker: its answer line. */
function ask(worker, request) {
  const id = worker.next++;
  worker.hold(true);
  return new Promise((resolveTake) => {
    const timer = setTimeout(() => {
      worker.waiting.delete(id);
      resolveTake({ ok: false, error: `no take in ${TAKE_MS / 60000} minutes` });
    }, TAKE_MS);
    timer.unref();
    worker.waiting.set(id, (said) => {
      clearTimeout(timer);
      worker.waiting.delete(id);
      if (!worker.waiting.size) worker.hold(false);
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

/**
 * The models asked for: one by name, a list of names, or the kind's defaults (every one marked `default`, else the
 * first of the kind). Several are drawn from in turn: no sound model was better than another across sounds by
 * Steven's ear (Stable Audio 3 and Woosh-DFlow, five each over two blind listenings, 2026-10-16), each better at some.
 */
function modelsOf(generators, { model, kind = "sound" }) {
  if (model) {
    return (Array.isArray(model) ? model : [model]).map((name) => {
      const found = generators.models.find((m) => m.name === name);
      if (!found) throw new Error(`model: one of ${generators.models.map((m) => `${m.name} (${m.kind})`).join(", ")}`);
      return found;
    });
  }
  const own = generators.models.filter((m) => m.kind === kind);
  if (!own.length) throw new Error(`no ${kind} model in generators.json`);
  const defaults = own.filter((m) => m.default);
  return defaults.length ? (kind === "shape" ? defaults.slice(0, 1) : defaults) : [own[0]];
}

/**
 * Takes of one prompt, a seed each: written as work:gen/<name>_s<seed>.wav (the model's own rate and channels,
 * float) beside a sidecar <name>_s<seed>.json, then measured at the game's rate and drawn one under another.
 */
export async function generate(folders, args) {
  const generators = folders.generators;
  if (!generators) throw new Error("no generators: start the server with --generators <folder>");
  if (args.kind !== undefined && !KINDS.includes(args.kind)) throw new Error(`kind: ${KINDS.join(", ")}`);
  const models = modelsOf(generators, args);
  const { prompt, length } = args;
  if (models.length > 1) {
    // each model's takes named after it, one after another (the card holds one model at a time)
    if (typeof prompt !== "string" || !prompt.trim()) throw new Error("prompt: what to make, in words (\"a wrench hitting a steel pipe, one sharp clang\")");
    const name = args.name ?? prompt.split(/\s+/).slice(0, 3).join("_");
    const answers = [];
    for (const m of models) answers.push(...(await generate(folders, { ...args, model: m.name, name: `${name}_${m.name}` })));
    return [text(`Takes from ${models.length} models, each better at some sounds than the other: ${models.map((m) => m.name).join(", ")}. Compare them all before choosing.`), ...answers];
  }
  const model = models[0];
  if (model.kind === "shape") return generateShapes(folders, generators, model, args);
  if (typeof prompt !== "string" || !prompt.trim()) throw new Error("prompt: what to make, in words (\"a wrench hitting a steel pipe, one sharp clang\")");
  if (!(typeof length === "number" && length > 0 && length <= 600)) throw new Error("length: seconds, over 0 and at most 600");
  const seeds = seedsOf(args);
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
      : `Each take has a sidecar .json (model, prompt, seed, licence). Listen to them, or read the picture; put the one you choose in a sound spec as a layer { "kind": "sample", "file": "work:${stem}_s<seed>.wav", "from": "onset" } and shape it there (guide { doc: "spec" }, "A sound"); "finish": { "fit": "bands" } brings its bands to its class's or the game's own.${/\bNC\b|non-?commercial/i.test(model.licence ?? "") ? ` ${model.name}'s licence is non-commercial: whether that suits their mod is the person's choice, not yours. Tell them, and use a take unless they have said not to.` : ""}`,
  ];
  const answer = [text(lines.join("\n"))];
  if (made.length) {
    const picture = soundPicture(made.map((t) => ({ name: `${t.file} (seed ${t.seed})`, x: t.x, rate: 22050 })));
    answer.push(image(png(picture.width, picture.height, picture.rgba)));
  }
  return answer;
}

/** The seeds asked for: a count from `from`, or a list. */
function seedsOf(args, unless = 4) {
  const seeds = Array.isArray(args.seeds) ? args.seeds : Array.from({ length: args.seeds ?? unless }, (_, i) => i + (args.from ?? 0));
  if (!seeds.length || seeds.length > MOST_SEEDS || seeds.some((s) => !Number.isInteger(s) || s < 0)) throw new Error(`seeds: how many (1 to ${MOST_SEEDS}), or a list of whole numbers`);
  return seeds;
}

/**
 * Shapes: a picture of the thing (the person's, of the folders, or drawn from the prompt), its subject cut out,
 * made into a mesh, a take a seed: work:gen/<name>_s<seed>.obj (Y up, its front towards +z as an .obj's is), with
 * the picture it was made from and a sidecar. Drawn from the three-quarter side, each beside its picture.
 */
async function generateShapes(folders, generators, model, args) {
  const { prompt, picture, base, only } = args;
  if (!(typeof prompt === "string" && prompt.trim()) && typeof picture !== "string") throw new Error("prompt: the thing in words (\"a wooden kitchen chair\"), or picture: a picture of it in the folders");
  if (base !== undefined && typeof base !== "string") throw new Error("base: a character's base model (player/gordon/gordon.mdl), whose stance the picture is drawn in from the prompt (or was, a picture drawn by only: \"picture\")");
  // the pictures alone: drawn, looked at against the brief, drawn again, before any shape is made of one (the
  // picture is all the paint a character gets: a maker that saw it only after the shape painted its guard flat)
  if (only !== undefined && (only !== "picture" || picture)) throw new Error('only: "picture": the pictures drawn from the prompt and no shape; then a shape of the one chosen, picture: "work:<it>"');
  const seeds = seedsOf(args, picture ? 1 : 2);
  const given = picture ? pathOf(folders, picture) : null;
  const words = prompt?.trim() || picture;
  const name = (args.name ?? words.replace(/\.[a-z]+$/i, "").split(/[\s/]+/).slice(-3).join("_")).toLowerCase().replace(/^work:/, "").replace(/\.obj$/, "").replace(/[^a-z0-9_/-]+/g, "_");
  const stem = name.includes("/") ? name : `gen/${name}`;
  const started = Date.now();
  const { worker, load } = await workerFor(generators, model);
  const loaded = worker.told ? null : load;
  worker.told = true;
  // a character: its base drawn in GENERATED_STANCE as a plain grey figure on white, the picture drawn over it
  const guide = base && !given ? guideOf(folders, base, pathOf(folders, `${stem}_guide.png`, { write: true })) : null;
  const takes = [];
  for (const seed of seeds) {
    const out = pathOf(folders, `${stem}_s${seed}.obj`, { write: true });
    const said = await ask(worker, { prompt: prompt ?? "", picture: given, guide: given ? null : guide, seed, out, steps: args.steps, ...(only ? { only } : {}) });
    if (!said.ok) {
      takes.push({ seed, error: said.error });
      continue;
    }
    if (only) {
      takes.push({ seed, picture: relative(folders.work, said.picture) });
      continue;
    }
    const from = given ? relative(folders.work, given) : said.picture ? relative(folders.work, said.picture) : null;
    writeFileSync(out.replace(/\.obj$/, ".json"), `${JSON.stringify({ model: model.name, kind: "shape", prompt, picture: from, ...(base ? { base, stance: GENERATED_STANCE } : {}), seed, faces: said.faces, licence: model.licence ?? "not given", took: said.took, made: new Date().toISOString() }, null, 1)}\n`);
    // drawn as it would stand: Y up, at a player's scale for the picture only
    const { mdl } = objModel(readObj(readFileSync(out, "utf8")), { up: "y", ground: true, centre: true, scale: 24, quiet: true });
    const view = render(mdl, { yaw: 30, pitch: 15, width: 320, height: 320 });
    const front = render(mdl, { view: "front", width: 320, height: 320 });
    takes.push({ seed, file: relative(folders.work, out), from, said, view, front });
  }
  idleLater(worker);
  if (only) {
    const drawn = takes.filter((t) => t.picture);
    const said = [
      `${drawn.length} of ${seeds.length} pictures of "${prompt}" by ${model.name}${loaded !== null ? `; the model loaded in ${loaded} s` : ""}; ${round((Date.now() - started) / 1000, 10)} s in all`,
      ...takes.map((t) => (t.error ? `seed ${t.seed}: failed: ${t.error}` : `work:${t.picture}`)),
      `Look at each against what was asked, part by part (a vest's lettering, a belt, boots, the face): what a picture lacks the model lacks, for the picture is its paint. Draw again with other words or seeds until one has it all, then make its shape: generate { kind: "shape", picture: "work:<it>"${base ? `, base: "${base}"` : ""} }.`,
    ];
    const shown = drawn.map((t) => fitted(unpicture(readFileSync(join(folders.work, t.picture))), 320));
    return [text(said.join("\n")), ...(shown.length ? [(({ width, height, rgba }) => image(png(width, height, rgba)))(tile(shown, Math.min(4, shown.length), drawn.map((t) => `seed ${t.seed}`)))] : [])];
  }
  const made = takes.filter((t) => t.view);
  const size = (b) => b[1].map((v, k) => round(v - b[0][k], 100));
  const lines = [
    `${made.length} of ${seeds.length} shapes of ${given ? `the picture ${picture}` : `"${prompt}"`} by ${model.name} (licence ${model.licence ?? "not given"})${loaded !== null ? `; the model loaded in ${loaded} s` : ""}; ${round((Date.now() - started) / 1000, 10)} s in all`,
    ...takes.map((t) =>
      t.error
        ? `seed ${t.seed}: failed: ${t.error}`
        : `work:${t.file}: ${t.said.faces} triangles, ${size(t.said.box).join(" x ")} in the file's units (x, y up, z), from ${t.from ? `work:${t.from}` : "the picture"}, made in ${t.said.took} s`,
    ),
    `Each .obj has a sidecar .json and the picture it was made from (its subject cut out beside it as _cut.png). Pick the one whose shape is right and put it in a model spec as a part { "kind": "mesh", "file": "work:<the .obj>", "size": [x, y, z], "triangles": n } (guide { doc: "spec" }), painted by its material, or by project from its cut-out ("picture": "work:<name>_s<seed>_cut.png", the side the picture shows as its view; the raw picture's background hides its outline). The shape is the generator's guess where the picture does not show it (the back, below): look at every side.`,
    ...(base ? [`Drawn in ${base}'s stance (work:${stem}_guide.png): build it on that base in the same one, "base": { "file": "${base}" }, "pose": { "aim": ${JSON.stringify(GENERATED_STANCE)}, "bind": true }, so its limbs lie on its bones and it stands as the base stands. Reject a take whose arms touch its body or that holds anything: fused there, it tears in every motion.`] : []),
  ];
  const answer = [text(lines.join("\n"))];
  if (made.length) {
    const pictures = made.flatMap((t) => {
      const shown = t.from ? unpicture(readFileSync(join(folders.work, t.from))) : null;
      const square = shown ? fitted(shown, 320) : null;
      return [square, t.front, t.view].filter(Boolean);
    });
    const names = made.flatMap((t) => [t.from ? `seed ${t.seed}: picture` : null, `seed ${t.seed}: front`, `seed ${t.seed}: three quarter`].filter(Boolean));
    const sheet = tile(pictures, made[0].from ? 3 : 2, names);
    answer.push(image(png(sheet.width, sheet.height, sheet.rgba)));
  }
  return answer;
}

/**
 * A character's guide: its base (found as a model spec's base is: beside the work folder, then in the game
 * folders) in GENERATED_STANCE from the front, every texture one plain grey so that only its shape and light
 * lead the drawing, on white, written to `file`. Returns the file.
 */
function guideOf(folders, base, file) {
  let src = aimedBase(base, { folder: folders.work, games: folders.wads ?? [], refuse: [...(folders.refuse ?? []), ...(folders.hide ?? [])] });
  readMdl(src).textures.forEach((t, i) => {
    const own = textureOf(src, i);
    src = replaceTexture(src, i, { ...own, palette: new Uint8Array(768).fill(170) }, { quiet: true });
  });
  const drawn = render(src, { seq: 0, frame: 0, view: "front", width: 512, height: 512, background: [255, 255, 255] });
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, png(drawn.width, drawn.height, drawn.rgba));
  return file;
}

/** A picture brought to `side` x `side`, whole, on grey: for a sheet of equal cells. */
function fitted(picture, side) {
  const k = Math.min(side / picture.width, side / picture.height);
  const rgba = Buffer.alloc(side * side * 4);
  for (let i = 0; i < side * side; i++) rgba.set([58, 62, 70, 255], i * 4);
  const w = Math.round(picture.width * k);
  const h = Math.round(picture.height * k);
  const x0 = Math.floor((side - w) / 2);
  const y0 = Math.floor((side - h) / 2);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const s = (Math.min(picture.height - 1, Math.floor(y / k)) * picture.width + Math.min(picture.width - 1, Math.floor(x / k))) * 4;
      rgba.set([picture.rgba[s], picture.rgba[s + 1], picture.rgba[s + 2], 255], ((y0 + y) * side + x0 + x) * 4);
    }
  return { width: side, height: side, rgba };
}
