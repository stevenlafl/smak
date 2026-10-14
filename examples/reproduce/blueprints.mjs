// The test of houses from their drawings (rubric.md, "Houses from their drawings"): an agent with only the MCP
// server builds a real house (HABS) as a map from its measured drawings and photographs; a judge scores it on
// the Maps table read against the house, with the walked floor measured against the key's rooms and the doors
// and windows against its list. The decoy, the house's outer walls as one room, must fail.
//
//   node examples/reproduce/blueprints/fetch.mjs                 the inputs first (git-ignored)
//   node examples/reproduce/blueprints.mjs make [house ...] [--again]
//   node examples/reproduce/blueprints.mjs judge [house ...] [decoy]
//
// Each house's folder: input/ (the drawings and photos, out of git), key.json (the answer, never shown to the
// maker), and spec.json, answer.md, run.json, judge.json, built/ (the map, out of git) from a run.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, copyFileSync, rmSync, renameSync } from "node:fs";
import { join, basename } from "node:path";
import { execFileSync } from "node:child_process";
import { HERE, GAME, SDHLT, savePng } from "./lib.mjs";
import { runAgent, runJudge, failedByMeasure } from "./agents.mjs";
import { floorOf, alignMaps, entitiesOf } from "./judge.mjs";
import * as smak from "../../src/index.mjs";
import { tile } from "../../src/render.mjs";
import { buildMapSpec } from "../../src/spec/map.mjs";
import { findCompilers } from "../../src/maps/compile.mjs";

const { maps } = smak;
const ROOT = join(HERE, "blueprints");
const RUBRIC = readFileSync(join(HERE, "rubric.md"), "utf8");
const HOUSES = ["moulton", "kaupo", "grindle"];
const words = process.argv.slice(2);
const step = words.shift();
const again = words.includes("--again");
const chosen = HOUSES.filter((h) => !words.some((w) => HOUSES.includes(w)) || words.includes(h));
const round = (v, k = 3) => Math.round(v * 10 ** k) / 10 ** k;
const keyOf = (house) => JSON.parse(readFileSync(join(ROOT, house, "key.json"), "utf8"));
/** The inputs the maker is given: the drawings and photos, never the key or its drawing. */
const givenOf = (house) => readdirSync(join(ROOT, house, "input")).filter((f) => /^(plan-|sheet-|photo-).*\.png$/.test(f));

// ── the maker ──────────────────────────────────────────────────────────────

function makePrompt(house, given) {
  const key = keyOf(house);
  return `Build this house as a GoldSrc map with the SMAK MCP server's map spec (guide { doc: "spec" }, "A map"), named ${house}_house: every room of every storey where the measured drawings put it, at their sizes (a foot is 12 units), with their floor and ceiling heights, the stairs where they are, every door of the plans a door entity that opens, swinging on its hinges as the house's do, every window a window, and its surfaces and light as the photographs show. A player starts inside, at the front door, and must reach every room on foot. It will be judged against the drawings and photos, to high standards, by someone who sees only pictures and measurements of it.

The house: ${key.house}.
Its drawings and photographs are in the server's work folder under pictures/ (and readable here): ${given.join(", ")}. plan-<storey>.png is each floor's plan cut from its sheet; sheet-<n>.png the whole sheets (elevations, sections, notes, the scale bar); photo-<id>.png the photographs. Read the written dimensions; where none is written, measure by the scale bar. The game's halflife.wad is there for textures (a map spec's wads: ["halflife.wad"]). Build until the build says OK (compiled, no leak, every room reached) and the plan matches the drawings. Then say what you built.`;
}

async function make(house) {
  const dir = join(ROOT, house);
  if (existsSync(join(dir, "run.json")) && !again) return `${house}: made before (--again)`;
  if (existsSync(join(dir, "run.json"))) {
    const n = readdirSync(dir).filter((f) => /^round-\d+$/.test(f)).length + 1;
    mkdirSync(join(dir, `round-${n}`));
    for (const f of ["spec.json", "answer.md", "run.json", "judge.json", "built"]) if (existsSync(join(dir, f))) renameSync(join(dir, f), join(dir, `round-${n}`, f));
  }
  const given = givenOf(house);
  if (!given.length) return `${house}: no inputs (node examples/reproduce/blueprints/fetch.mjs first)`;
  const kit = execFileSync("git", ["-C", HERE, "rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
  const r = await runAgent({
    prompt: makePrompt(house, given),
    read: join(dir, "input"),
    server: { wads: true },
    files: Object.fromEntries(given.map((f) => [`pictures/${f}`, join(dir, "input", f)])),
    hours: 4,
  });
  writeFileSync(join(dir, "answer.md"), `${r.answer.trim()}\n`);
  const all = [];
  const look = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) look(p);
      else all.push({ p, name: e.name, at: statSync(p).mtimeMs });
    }
  };
  look(r.work);
  const newest = (test) => all.filter((f) => test(f.name)).sort((a, b) => b.at - a.at)[0];
  const spec = newest((n) => n.endsWith(".spec.json"));
  if (spec) writeFileSync(join(dir, "spec.json"), readFileSync(spec.p));
  const built = join(dir, "built");
  rmSync(built, { recursive: true, force: true });
  mkdirSync(built, { recursive: true });
  const kept = [];
  for (const ext of [".bsp", ".map", ".wad"]) {
    const f = newest((n) => n.endsWith(ext) && n !== "halflife.wad");
    if (f) {
      copyFileSync(f.p, join(built, `${house}_house${ext}`));
      kept.push(f.name);
    }
  }
  // the map's own .wad files beside it, by their own names, so its textures are found
  for (const f of all.filter((x) => x.name.endsWith(".wad"))) copyFileSync(f.p, join(built, f.name));
  writeFileSync(join(dir, "run.json"), `${JSON.stringify({ kit, seconds: r.seconds, turns: r.turns, cost: r.cost, error: r.error, ended: r.ended, built: kept, folder: r.folder }, null, 1)}\n`);
  return `${house}: ${r.seconds} s, ${r.turns} turns, built ${kept.join(", ") || "nothing"}${r.error ? ` (${r.error})` : ""}`;
}

// ── the key as a floor ─────────────────────────────────────────────────────

/** Is a point inside an outline [[x, y], ...]? */
function inside(x, y, poly) {
  let inn = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < xi + ((y - yi) / (yj - yi)) * (xj - xi)) inn = !inn;
  }
  return inn;
}

/** The key's rooms as walked floor in cells of 16 units, as floorOf gives a map's: { cells: Map "x,y" -> [heights] }. */
function keyFloor(key, storeys = null) {
  const foot = key.foot ?? 12;
  const height = Object.fromEntries(key.storeys.map((s) => [s.name, s.floor * foot]));
  const cells = new Map();
  for (const room of key.rooms) {
    if (storeys && !storeys.includes(room.storey)) continue;
    const poly = room.outline.map(([x, y]) => [x * foot, y * foot]);
    const xs = poly.map((p) => p[0]);
    const ys = poly.map((p) => p[1]);
    for (let x = Math.floor(Math.min(...xs) / 16) * 16; x <= Math.max(...xs); x += 16)
      for (let y = Math.floor(Math.min(...ys) / 16) * 16; y <= Math.max(...ys); y += 16) {
        if (!inside(x + 8, y + 8, poly)) continue;
        const k = `${x},${y}`;
        const list = cells.get(k) ?? [];
        if (!list.includes(height[room.storey])) list.push(height[room.storey]);
        cells.set(k, list);
      }
  }
  return { cells };
}

/** The share of `a`'s floor cells that `b` has at the same place and height (within 24), moved by `move`. */
function shareOf(a, b, [dx, dy, dz]) {
  let n = 0;
  let found = 0;
  for (const [k, hs] of a.cells) {
    const [x, y] = k.split(",").map(Number);
    const other = b.cells.get(`${x + dx},${y + dy}`);
    for (const h of hs) {
      n++;
      if (other?.some((g) => Math.abs(g - dz - h) <= 24)) found++;
    }
  }
  return n ? round(found / n) : null;
}

// ── judging ────────────────────────────────────────────────────────────────

const ITEMS = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9"];
const MUST = ["P1", "P2", "P3", "P4", "P8", "P9"];

async function judgeHouse(house, file, { decoy = false } = {}) {
  const key = keyOf(house);
  const foot = key.foot ?? 12;
  const dir = join(ROOT, house, "judge", decoy ? "decoy" : "made");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const bytes = readFileSync(file);
  const bsp = maps.readBsp(bytes);
  const folders = [join(file, ".."), GAME];
  // the floor against the key's, aligned as the maps' are, whole and storey by storey
  const theirs = keyFloor(key);
  const mine = floorOf(bytes);
  const { overlap, move } = alignMaps(theirs, mine);
  const byStorey = Object.fromEntries(key.storeys.map((s) => [s.name, shareOf(keyFloor(key, [s.name]), mine, move)]));
  // doors: each of the key's (but those it marks uncertain) matched by a door entity within 24 units of it
  const doorModels = entitiesOf(bytes)
    .filter((e) => /^func_door/.test(e.classname ?? "") && /^\*\d+$/.test(e.model ?? ""))
    .map((e) => {
      const m = bsp.models[Number(e.model.slice(1))];
      return [0, 1, 2].map((k) => (m.mins[k] + m.maxs[k]) / 2);
    });
  const height = Object.fromEntries(key.storeys.map((s) => [s.name, s.floor * foot]));
  const storeyOfRoom = Object.fromEntries(key.rooms.map((r) => [r.name, r.storey]));
  const sure = (key.doors ?? []).filter((d) => !d.uncertain);
  const doorsMatched = sure.filter((d) => {
    const z = height[storeyOfRoom[d.between?.find((r) => storeyOfRoom[r])] ?? key.storeys[0].name] ?? 0;
    const at = [d.at[0] * foot + move[0], d.at[1] * foot + move[1]];
    return doorModels.some((c) => Math.hypot(c[0] - at[0], c[1] - at[1]) <= 24 + (d.width ?? 3) * foot * 0.5 && c[2] > z + move[2] - 8 && c[2] < z + move[2] + 120);
  }).length;
  // windows: a wall with a hole in it at the window's place: solid under the sill, open at a window's height
  // (30 to 70 over its floor). Open air alone, where no wall is, is no window
  const solid = (p) => maps.contentsAt(bsp, p) === maps.CONTENTS.SOLID;
  const windowsMatched = (key.windows ?? []).filter((w) => {
    const z = height[storeyOfRoom[w.room]] ?? 0;
    for (const [ox, oy] of [[0, 0], [8, 0], [-8, 0], [0, 8], [0, -8], [16, 0], [-16, 0], [0, 16], [0, -16]]) {
      const [x, y] = [w.at[0] * foot + move[0] + ox, w.at[1] * foot + move[1] + oy];
      if (!solid([x, y, z + move[2] + 10])) continue;
      if ([36, 48, 60].some((dz) => !solid([x, y, z + move[2] + dz]))) return true;
    }
    return false;
  }).length;
  const check = maps.checkBsp(bytes, { folders });
  const reach = mine.reach;
  savePng(join(dir, "plan.png"), maps.planOf(bsp, { heights: true, legend: true, folders, grid: 120 }));
  savePng(join(dir, "storeys.png"), maps.storeysOf(bsp, { folders }));
  savePng(join(dir, "views.png"), maps.viewsOf(bsp, { count: 8, folders }));
  const keyPicture = join(ROOT, house, "input", "key.png");
  const measured = {
    floorOverlap: round(overlap),
    floorFoundByStorey: byStorey,
    doors: { key: sure.length, matched: doorsMatched, entities: doorModels.length },
    windows: { key: (key.windows ?? []).length, matched: windowsMatched },
    checkErrors: check.errors,
    notReached: reach.unreached.map((e) => `${e.classname} ${e.number}`),
    keyNotes: key.notes ?? [],
  };
  const doorShare = sure.length ? doorsMatched / sure.length : 1;
  const windowShare = key.windows?.length ? windowsMatched / key.windows.length : 1;
  const caps = {
    P2: overlap >= 0.7 && Object.values(byStorey).every((v) => v === null || v >= 0.6) ? 2 : overlap >= 0.45 ? 1 : 0,
    P4: doorShare >= 0.8 && windowShare >= 0.8 ? 2 : doorShare >= 0.5 ? 1 : 0,
    P8: check.errors.length ? 0 : reach.unreached.length ? 1 : 2,
  };
  const failed = failedByMeasure(caps, MUST);
  if (failed.length) return { house, decoy, measured, caps, passes: false, failedByMeasure: failed, total: 0, of: 2 * ITEMS.length };
  const given = givenOf(house).map((f) => join(ROOT, house, "input", f));
  // DRY=1: the measures and pictures alone, every judge's score a 1, with no agent run
  const r = process.env.DRY ? { answer: JSON.stringify(Object.fromEntries(ITEMS.map((i) => [i, { score: 1, reason: "dry run" }]))) } : await runJudge({
    read: join(ROOT, house),
    hours: 0.75,
    prompt: `You are an independent judge. A real house was built as a GoldSrc map from its measured drawings and photographs, by someone who never saw the key. Judge it strictly by the rubric below: the "Houses from their drawings" section, the Maps table read against the house, "Passing" and "Keeping the judge honest". A measured item may score lower than its measurement allows, never higher.

The house's drawings and photos: ${given.join(", ")}. The key, drawn over its sheets: ${keyPicture} (rooms tinted and named, doors red, windows blue, stairs as arrows). The map: ${dir}/plan.png (from above, floor heights, every entity marked and listed, a grid every 120 units: 10 feet), ${dir}/storeys.png (a plan of each storey) and ${dir}/views.png (from inside, at a player's eye). Look at every picture closely.

The measurements (floorOverlap: the map's walked floor against the key's rooms, aligned; floorFoundByStorey: the share of each storey's rooms the map has floor in; doors and windows: the key's matched in the map):
${JSON.stringify(measured, null, 1)}

Score every item, ${ITEMS.join(", ")}, 0, 1 or 2, each with a reason. Reply with JSON alone: {${ITEMS.map((i) => `"${i}": { "score": 0, "reason": "..." }`).join(", ")}}

THE RUBRIC
${RUBRIC}`,
  });
  let judged = null;
  try {
    judged = JSON.parse(r.answer.slice(r.answer.indexOf("{"), r.answer.lastIndexOf("}") + 1));
  } catch {}
  if (!judged) return { house, decoy, error: "the judge's answer was not JSON", measured };
  const scores = {};
  for (const i of ITEMS) {
    const given = Math.max(0, Math.min(2, Number(judged[i]?.score ?? 0)));
    scores[i] = { judge: given, cap: caps[i] ?? null, score: Math.min(given, caps[i] ?? 2), reason: judged[i]?.reason ?? "" };
  }
  const total = ITEMS.reduce((t, i) => t + scores[i].score, 0);
  return { house, decoy, measured, caps, scores, total, of: 2 * ITEMS.length, passes: MUST.every((i) => scores[i].score === 2) && total >= 0.85 * 2 * ITEMS.length };
}

/** The decoy: the house's outer box as one room a storey, a start, no inner walls, doors or windows. */
function decoyOf(house) {
  const key = keyOf(house);
  const foot = key.foot ?? 12;
  const xs = key.rooms.flatMap((r) => r.outline.map((p) => p[0]));
  const ys = key.rooms.flatMap((r) => r.outline.map((p) => p[1]));
  const size = [Math.round((Math.max(...xs) - Math.min(...xs)) * foot), Math.round((Math.max(...ys) - Math.min(...ys)) * foot), 112];
  const out = join(ROOT, house, "judge", "decoy-built");
  const { files } = buildMapSpec(
    { spec: "smak.map/1", name: `${house}_decoy`, wads: ["halflife.wad"], rooms: [{ id: "hall", size, at: [Math.min(...xs) * foot, Math.min(...ys) * foot, 0] }], entities: [{ class: "info_player_start", room: "hall", at: "centre" }] },
    { out, compilers: findCompilers({ folder: SDHLT }), wads: [GAME] },
  );
  if (!files.bsp) throw new Error(`${house}: the decoy did not compile`);
  return files.bsp;
}

async function pool(jobs, atOnce) {
  const queue = [...jobs];
  await Promise.all(
    Array.from({ length: Math.min(atOnce, queue.length) }, async () => {
      while (queue.length) {
        try {
          console.log(await queue.shift()());
        } catch (error) {
          console.log(`failed: ${error.message.split("\n")[0]}`);
        }
      }
    }),
  );
}

if (step === "make") await pool(chosen.map((h) => () => make(h)), 3);
else if (step === "judge") {
  const jobs = [];
  for (const h of chosen) {
    const built = join(ROOT, h, "built", `${h}_house.bsp`);
    if (existsSync(built))
      jobs.push(() =>
        judgeHouse(h, built).then((r) => {
          writeFileSync(join(ROOT, h, "judge.json"), `${JSON.stringify(r, null, 1)}\n`);
          return `${h}: ${r.error ?? `${r.total} of ${r.of}, ${r.passes ? "PASSES" : "fails"}`} (floor ${r.measured.floorOverlap}, doors ${r.measured.doors.matched}/${r.measured.doors.key}, windows ${r.measured.windows.matched}/${r.measured.windows.key})`;
        }),
      );
    if (words.includes("decoy") || !existsSync(built))
      jobs.push(() =>
        judgeHouse(h, decoyOf(h), { decoy: true }).then((r) => {
          writeFileSync(join(ROOT, h, "judge", "decoy.json"), `${JSON.stringify(r, null, 1)}\n`);
          return `${h} decoy: ${r.error ?? `${r.total} of ${r.of}, ${r.passes ? "PASSES (the judge is lenient)" : "fails, as it must"}`}`;
        }),
      );
  }
  await pool(jobs, 3);
} else console.log("node examples/reproduce/blueprints.mjs make|judge [house ...] [decoy] [--again]");
