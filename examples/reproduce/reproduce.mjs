// The legs: a fresh agent reproduces each original from one kind of input, with nothing but the SMAK MCP
// server (no game folder for a model; the game's .wad folder for a map's textures, and in the bsp leg the
// compiled map in its models folder) and, in the pictures leg, the right to read that one folder of pictures.
//
//   node examples/reproduce/reproduce.mjs [subject[:leg] ...] [--at-once 5] [--again]
//
// A run again (--again) first moves the last one's records into <id>/<leg>/round-<n>/, so every round is kept.
// Each run leaves <id>/<leg>/: spec.json (its last spec), answer.md (what it said at the end), run.json
// (time, turns, cost), and built/ (what it built: the .mdl, or the .bsp, .map and .wad), which is kept out of
// git with the rest of what is made from the game.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, copyFileSync, existsSync, rmSync, renameSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, basename } from "node:path";
import { tmpdir } from "node:os";
import { mkdtempSync } from "node:fs";
import { HERE, SUBJECTS, GAME, ANGLES } from "./lib.mjs";
import { runAgent, MAKER_MODEL } from "./agents.mjs";

const words = process.argv.slice(2);
const option = (name, fallback) => {
  const at = words.indexOf(name);
  return at < 0 ? fallback : words.splice(at, 2)[1];
};
const atOnce = Number(option("--at-once", 5));
const again = words.includes("--again") && words.splice(words.indexOf("--again"), 1);
const chosen = (id, leg) => !words.length || words.some((w) => w === id || w === `${id}:${leg}`);

const JUDGED = `It will be judged side by side with the original, from the same cameras and at the same scale, to
high standards, by someone who sees only the two sets of pictures.`;

function modelPrompt(model, leg) {
  const input = join(HERE, model.id, "input");
  const ask = `Make this object as a model for the GoldSrc engine, as close to the original as you can: its
outline from every side, its size, every part, the colours and materials, and the markings on its surfaces.
${JUDGED} Name the file ${model.id}.mdl. Use whatever of the kit helps (the spec's materials, finish, print,
marks, prefabs), keep within the engine's limits, and build until the build says OK and it matches.`;
  if (leg === "pictures")
    return {
      prompt: `${ask}

The original, in pictures: ${input}/sides.png (front, left, back, right, top and below, all to one scale,
each a 512-dot square of the sheet in that order, three across), and four close angles with no perspective,
${ANGLES.map(([name, yaw, pitch]) => `${input}/${name}.png (yaw ${yaw}, pitch ${pitch})`).join(", ")}, the yaw and pitch
as \`render\` and \`project\` take them. The same pictures are in the
server's work folder under pictures/, so the build tool's \`reference\` can put one beside your result
(reference: "work:pictures/sides.png"). Its size: ${readFileSync(join(input, "size.txt"), "utf8").trim()}`,
      read: input,
      files: Object.fromEntries(readdirSync(input).filter((f) => f.endsWith(".png")).map((f) => [`pictures/${f}`, join(input, f)])),
    };
  return { prompt: `${ask}\n\nThe original, as someone who has seen it describes it:\n\n${readFileSync(join(HERE, model.id, "words.md"), "utf8")}` };
}

function mapPrompt(map, leg) {
  const input = join(HERE, map.id, "input");
  const name = `${map.id}_copy`;
  const ask = `Make this map for the GoldSrc engine, as close to the original as you can: its layout, the size and
place of every area, the floor heights, stairs, ledges and drops, the places to start, the weapons, ammunition and
items, the doors and lifts, the textures and the light. ${JUDGED} Call it ${name}. The game's halflife.wad is
there for textures (a map spec's wads: ["halflife.wad"]); the entities tool lists the game's classes and keys.
Build until the build says OK (compiled, no leak, every place reached) and it matches.`;
  if (leg === "pictures")
    return {
      prompt: `${ask}

The original, in pictures: ${input}/plan.png (from above, floor heights written on the floors, every entity marked
with its number and class and listed beside it; the scale bar is 256 units), ${input}/storeys.png (a plan of each
storey), section-x.png and section-y.png (cut upright through the middle, west to east and south to north) and
views.png (from inside at a player's eye). The same pictures are in the server's work folder under pictures/,
so the build tool's \`reference\` can put the plan beside yours (reference: "work:pictures/plan.png").`,
      read: input,
      files: Object.fromEntries(readdirSync(input).filter((f) => f.endsWith(".png")).map((f) => [`pictures/${f}`, join(input, f)])),
    };
  if (leg === "words") return { prompt: `${ask}\n\nThe original, as someone who has seen it describes it:\n\n${readFileSync(join(HERE, map.id, "words.md"), "utf8")}` };
  // plans: the floor plans and sections alone, as an architect's drawings give a building: no view from inside
  if (leg === "plans") {
    const drawings = ["plan.png", "storeys.png", "section-x.png", "section-y.png"];
    return {
      prompt: `${ask}

The original, in floor plans: ${input}/plan.png (from above, floor heights written on the floors, every entity marked
with its number and class and listed beside it; the scale bar is 256 units, with a grid every 256), ${input}/storeys.png
(a plan of each storey), section-x.png and section-y.png (cut upright through the middle, west to east and south to
north). There is no picture from inside: the textures and the light are yours to choose from what the plan's
colours and the sections show. The same drawings are in the server's work folder under pictures/ (reference:
"work:pictures/plan.png").`,
      read: input,
      files: Object.fromEntries(drawings.map((f) => [`pictures/${f}`, join(input, f)])),
    };
  }
  // heightplan: the plan with each layer of floor's height and headroom as colours (smak map-heights), read by
  // the spec's floorplan into the map's space: near the geometry itself, as bsp is, and reported apart
  if (leg === "heightplan") {
    const plans = readdirSync(join(input, "heightplan"));
    return {
      prompt: `${ask}

The original, in height plans: the folder ${input}/heightplan (also in the server's work folder as heightplan/):
floor-0.png, floor-1.png... one picture for each layer of floor (layer 0 the lowest floor at each place, 1 the next
above it), each cell's floor height as a colour, room-N.png the headroom over it, and legend.json: the colour of each
height and headroom, the cell's size, and the world's x at the pictures' left edge (x0) and y at their top (y1). Give
your map spec floorplan: { dir: "work:heightplan/" } and its space is carved from them (docs/SPEC.md, "A floor plan").
${input}/plan.png marks every entity with its class and storeys.png shows each storey's own (the same in the work
folder under pictures/): put them on
the plan with room: "plan", at: [x, y] of the world, and height: the height its mark gives (it stands on the highest
floor at or under it) or layer: the layer of floor it stands on (0 the lowest, as the floor-N.png pictures number
them), z over that floor. heightplan/entities.txt lists every mark: its number, class and place (x y z), lights too.
${input}/views.png shows it from inside at a player's eye (also in the work folder under pictures/): take the textures
from the game's halflife.wad as those views show them, area by area (floorplan's areas: each part of the plan with its
own floor, wall and ceiling, and its light), and its light from its own light entities and what the views show lit.
Find each texture by its picture, not by its name: the info tool on halflife.wad with like: "work:pictures/views.png"
and rect: [x0, y0, x1, y1] round a patch of wall, floor or ceiling in a view gives the textures most like it.
Its brush entities (doors, ladders, chargers, walls that are entities: entities.txt lists them with their places)
go on the plan as furniture of a box of their own with entity: { class, keys } (docs/SPEC.md, "Prefabs of
brushes"), room "plan" and at as the entities are.`,
      read: input,
      files: { "pictures/plan.png": join(input, "plan.png"), "pictures/storeys.png": join(input, "storeys.png"), "pictures/views.png": join(input, "views.png"), ...Object.fromEntries(plans.map((f) => [`heightplan/${f}`, join(input, "heightplan", f)])) },
    };
  }
  // decompile: the compiled map, with the server's decompile tool to make it source again (reported apart:
  // it starts from the original's own brushes)
  if (leg === "decompile")
    return {
      prompt: `${ask}

The original is the compiled map models:${basename(map.file)}. The server's decompile tool makes it brush source
again (a .map in the work folder, compiled again where the compilers are). Use it, check what came back against
the original (info, render, check), and mend what the decompile lost until the result matches it.`,
      models: join(GAME, map.file, ".."),
      only: basename(map.file),
    };
  // bsp: the compiled map, alone in the server's models folder
  return {
    prompt: `${ask}

The original is the compiled map models:${basename(map.file)}. Read it with the server's tools (info, with full,
for its entities; render for a plan, views from inside, sections and the walk test; check). Its source (.map,
.rmf) does not exist here: make the map again from what you can read and see of the compiled one.`,
    models: join(GAME, map.file, ".."),
    only: basename(map.file),
  };
}

const jobs = [];
// the maps first: they take longest
for (const map of SUBJECTS.maps) for (const leg of SUBJECTS.legs.maps) if (chosen(map.id, leg)) jobs.push({ kind: "map", subject: map, leg });
for (const model of SUBJECTS.models) for (const leg of SUBJECTS.legs.models) if (chosen(model.id, leg)) jobs.push({ kind: "model", subject: model, leg });

async function runJob({ kind, subject, leg }) {
  const out = join(HERE, subject.id, leg);
  if (existsSync(join(out, "run.json")) && !again) return `${subject.id}:${leg}: done before (--again to run it again)`;
  // the last round kept: its records and what it built, under round-<n>
  if (existsSync(join(out, "run.json"))) {
    const n = readdirSync(out).filter((f) => /^round-\d+$/.test(f)).length + 1;
    const keep = join(out, `round-${n}`);
    mkdirSync(keep);
    for (const f of ["spec.json", "answer.md", "run.json", "judge.json", "built"]) if (existsSync(join(out, f))) renameSync(join(out, f), join(keep, f));
  }
  const kit = execFileSync("git", ["-C", HERE, "rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
  const job = kind === "model" ? modelPrompt(subject, leg) : mapPrompt(subject, leg);
  // the bsp leg's models folder holds the compiled map alone: a folder of its own, with that one file
  let models = null;
  if (job.models) {
    models = mkdtempSync(join(tmpdir(), "smak-repro-original-"));
    copyFileSync(join(job.models, job.only), join(models, job.only));
  }
  const r = await runAgent({
    prompt: job.prompt,
    read: job.read ?? null,
    server: { wads: kind === "map", models },
    files: job.files,
    hours: kind === "map" ? 4 : 1.5,
    model: MAKER_MODEL ?? undefined,
  });
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "answer.md"), `${r.answer.trim()}\n`);
  // what it built: the newest spec, and the newest model or map with its files
  const all = [];
  const look = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) look(path);
      else all.push({ path, name: entry.name, at: statSync(path).mtimeMs });
    }
  };
  look(r.work);
  const newest = (test) => all.filter((f) => test(f.name)).sort((a, b) => b.at - a.at)[0];
  const spec = newest((n) => n.endsWith(".spec.json"));
  if (spec) writeFileSync(join(out, "spec.json"), readFileSync(spec.path));
  const built = join(out, "built");
  rmSync(built, { recursive: true, force: true });
  mkdirSync(built, { recursive: true });
  const kept = [];
  if (kind === "model") {
    const mdl = newest((n) => n.endsWith(".mdl"));
    if (mdl) {
      copyFileSync(mdl.path, join(built, `${subject.id}.mdl`));
      kept.push(mdl.name);
    }
  } else
    for (const ext of [".bsp", ".map", ".wad"]) {
      // the map under the name asked for first: an agent's probes and test rooms are newer, and are not it
      const file = newest((n) => n === `${subject.id}_copy${ext}`) ?? newest((n) => n.endsWith(ext));
      if (file) {
        copyFileSync(file.path, join(built, `${subject.id}_copy${ext}`));
        kept.push(file.name);
      }
    }
  writeFileSync(join(out, "run.json"), `${JSON.stringify({ kit, model: r.model, seconds: r.seconds, turns: r.turns, cost: r.cost, tokens: r.tokens, error: r.error, built: kept, folder: r.folder }, null, 1)}\n`);
  return `${subject.id}:${leg}: ${r.seconds} s, ${r.turns} turns, built ${kept.join(", ") || "nothing"}${r.error ? ` (${r.error})` : ""}`;
}

// a few at once: each is a process of its own, and a map's compile takes the machine's threads
const queue = [...jobs];
await Promise.all(
  Array.from({ length: Math.min(atOnce, queue.length) }, async () => {
    while (queue.length) console.log(await runJob(queue.shift()));
  }),
);
