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
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, copyFileSync, rmSync } from "node:fs";
import { join, basename } from "node:path";
import { HERE, GAME, SDHLT, savePng, kitCommit, keepRound, filesOf } from "./lib.mjs";
import { runAgent, runJudge, failedByMeasure } from "./agents.mjs";
import { floorOf, alignMaps, entitiesOf } from "./judge.mjs";
import * as smak from "../../src/index.mjs";
import { tile } from "../../src/render.mjs";
import { buildMapSpec } from "../../src/spec/map.mjs";
import { findCompilers } from "../../src/maps/compile.mjs";
import { itemsOf, parseAnswer, settle, askScores, dryAnswer } from "./scoring.mjs";

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
    keepRound(dir, { move: ["spec.json", "answer.md", "run.json", "judge.json", "built"] });
  }
  const given = givenOf(house);
  if (!given.length) return `${house}: no inputs (node examples/reproduce/blueprints/fetch.mjs first)`;
  const kit = kitCommit();
  const r = await runAgent({
    prompt: makePrompt(house, given),
    read: join(dir, "input"),
    server: { wads: true },
    files: Object.fromEntries(given.map((f) => [`pictures/${f}`, join(dir, "input", f)])),
    hours: 4,
  });
  writeFileSync(join(dir, "answer.md"), `${r.answer.trim()}\n`);
  const { all, newest: newestOf } = filesOf(r.work);
  const newest = (test) => newestOf((f) => test(f.name));
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
  writeFileSync(join(dir, "run.json"), `${JSON.stringify({ kit, model: r.model, seconds: r.seconds, turns: r.turns, cost: r.cost, tokens: r.tokens, error: r.error, ended: r.ended, built: kept, folder: r.folder }, null, 1)}\n`);
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

/** A key turned about its origin by quarter turns: its rooms' outlines and its doors' and windows' places. */
function turnedKey(key, degrees) {
  const [c, s] = [Math.round(Math.cos((degrees * Math.PI) / 180)), Math.round(Math.sin((degrees * Math.PI) / 180))];
  const turn = ([x, y]) => [x * c - y * s, x * s + y * c];
  const at = (list) => (list ?? []).map((d) => ({ ...d, at: turn(d.at) }));
  return { ...key, rooms: key.rooms.map((r) => ({ ...r, outline: r.outline.map(turn) })), doors: at(key.doors), windows: at(key.windows) };
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

/**
 * The walked floor that is indoors: a cell whose nearest ceiling (the lowest face over it that looks down) is not
 * the sky. The key holds the house's rooms; a yard the maker stood the house in is no room, and counted as floor
 * it swamps the overlap (rubric.md, amendment of 2026-10-14). A cell with nothing over it is outdoors too.
 */
function indoorsOf(floor, bsp) {
  const ceilings = maps
    .modelFaces(bsp, 0)
    .filter((face) => maps.faceNormal(bsp, face)[2] < -0.7)
    .map((face) => {
      const corners = maps.facePolygon(bsp, face);
      return { xy: corners.map((c) => [c[0], c[1]]), z: Math.min(...corners.map((c) => c[2])), sky: /^sky$/i.test(maps.faceTexture(bsp, face).name) };
    });
  // inside a convex polygon in plan, whichever way round its corners go
  const inside = (xy, x, y) => {
    let sign = 0;
    for (let i = 0; i < xy.length; i++) {
      const [a, b] = [xy[i], xy[(i + 1) % xy.length]];
      const cross = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
      if (Math.abs(cross) < 1e-6) continue;
      if (sign && Math.sign(cross) !== sign) return false;
      sign = Math.sign(cross);
    }
    return true;
  };
  const cells = new Map();
  for (const [k, hs] of floor.cells) {
    const [x, y] = k.split(",").map(Number);
    const kept = hs.filter((h) => {
      let nearest = null;
      for (const c of ceilings) if (c.z > h + 8 && (!nearest || c.z < nearest.z) && inside(c.xy, x + 8, y + 8)) nearest = c;
      return nearest && !nearest.sky && nearest.z - h <= STOREY;
    });
    if (kept.length) cells.set(k, kept);
  }
  return { ...floor, cells };
}

/** A ceiling higher than this over a floor is no room's (a yard's rim under the top of its walls). */
const STOREY = 160;

/**
 * The walked floor widened by a cell (16) each way at its own heights: the walk test keeps a player's middle 16
 * from every wall, and the key's rooms run to their walls. Without it a 7-foot bathroom is found at three fifths.
 */
function widenedOf(floor) {
  const cells = new Map();
  for (const [k, hs] of floor.cells) {
    const [x, y] = k.split(",").map(Number);
    for (const dx of [-16, 0, 16])
      for (const dy of [-16, 0, 16]) {
        const at = `${x + dx},${y + dy}`;
        const list = cells.get(at) ?? [];
        for (const h of hs) if (!list.some((g) => Math.abs(g - h) <= 8)) list.push(h);
        cells.set(at, list);
      }
  }
  return { ...floor, cells };
}

/**
 * The key's floor moved onto the map's as judged, from above: white where both have floor, red where only the key
 * has, green where only the map has (+y up). Every storey at once, 4 dots a cell.
 */
function fitPicture(theirs, mine, [dx, dy]) {
  const cells = new Map();
  for (const k of theirs.cells.keys()) {
    const [x, y] = k.split(",").map(Number);
    cells.set(`${x + dx},${y + dy}`, 1);
  }
  for (const k of mine.cells.keys()) cells.set(k, (cells.get(k) ?? 0) | 2);
  const at = [...cells.keys()].map((k) => k.split(",").map(Number));
  const [x0, y0] = [Math.min(...at.map((p) => p[0])), Math.min(...at.map((p) => p[1]))];
  const [x1, y1] = [Math.max(...at.map((p) => p[0])), Math.max(...at.map((p) => p[1]))];
  const [w, h] = [(x1 - x0) / 16 + 1, (y1 - y0) / 16 + 1];
  const rgba = new Uint8Array(w * 4 * h * 4 * 4);
  const colour = { 1: [220, 60, 60], 2: [60, 200, 90], 3: [240, 240, 240] };
  for (const [k, v] of cells) {
    const [x, y] = k.split(",").map(Number);
    const [cx, cy] = [(x - x0) / 16, h - 1 - (y - y0) / 16];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) rgba.set([...colour[v], 255], ((cy * 4 + j) * w * 4 + cx * 4 + i) * 4);
  }
  return { width: w * 4, height: h * 4, rgba };
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

const { items: ITEMS, must: MUST } = itemsOf("map");

async function judgeHouse(house, file, { decoy = false } = {}) {
  const asKeyed = keyOf(house);
  const foot = asKeyed.foot ?? 12;
  const dir = join(ROOT, house, "judge", decoy ? "decoy" : "made");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const bytes = readFileSync(file);
  const bsp = maps.readBsp(bytes);
  const folders = [join(file, ".."), GAME];
  // the floor against the key's, aligned as the maps' are, whole and storey by storey
  const mine = widenedOf(indoorsOf(floorOf(bytes), bsp));
  // the key at each quarter turn, the best kept: the drawings fix the house's plan, not which way the map's axes
  // run (Kaupo's sheets put north at a slant). A mirror is a plan read wrongly, and is not tried
  const tries = [0, 90, 180, 270].map((turn) => {
    const key = turnedKey(asKeyed, turn);
    return { turn, key, ...alignMaps(keyFloor(key), mine) };
  });
  const first = tries.reduce((a, b) => (b.overlap > a.overlap ? b : a));
  // floor at a height no storey of the key has is the ground outside (under the eaves of a house that stands raised),
  // not a room: left out, and aligned again. A storey built at the wrong height still loses the key's floor it misses
  const levels = first.key.storeys.map((s) => s.floor * foot + first.move[2]);
  const roomsOnly = { ...mine, cells: new Map([...mine.cells].map(([k, hs]) => [k, hs.filter((h) => levels.some((l) => Math.abs(h - l) <= 24))]).filter(([, hs]) => hs.length)) };
  const { overlap, move } = alignMaps(keyFloor(first.key), roomsOnly);
  const { key, turn } = first;
  const byStorey = Object.fromEntries(key.storeys.map((s) => [s.name, shareOf(keyFloor(key, [s.name]), mine, move)]));
  savePng(join(dir, "floor-fit.png"), fitPicture(keyFloor(key), roomsOnly, move));
  // doors: each of the key's (but those it marks uncertain) matched by a door entity within 24 units of it
  const doorModels = entitiesOf(bytes)
    .filter((e) => /^func_door/.test(e.classname ?? "") && /^\*\d+$/.test(e.model ?? ""))
    .map((e) => {
      const m = bsp.models[Number(e.model.slice(1))];
      // a door on hinges is kept about its hinge, its `origin`: its box is from there, not from the map's origin
      const origin = e.origin ?? [0, 0, 0];
      return [0, 1, 2].map((k) => (m.mins[k] + m.maxs[k]) / 2 + (origin[k] || 0));
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
    keyTurned: turn,
    floorCells: { key: [...keyFloor(key).cells.values()].flat().length, map: [...roomsOnly.cells.values()].flat().length },
    floorFoundByStorey: byStorey,
    doors: { key: sure.length, matched: doorsMatched, entities: doorModels.length },
    windows: { key: (key.windows ?? []).length, matched: windowsMatched },
    checkErrors: check.errors,
    notReached: reach.entities.filter((e) => reach.unreached.includes(e.number)).map((e) => `${e.classname} ${e.number}`),
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
  const r = process.env.DRY ? { answer: dryAnswer(ITEMS) } : await runJudge({
    read: join(ROOT, house),
    hours: 0.75,
    prompt: `You are an independent judge. A real house was built as a GoldSrc map from its measured drawings and photographs, by someone who never saw the key. Judge it strictly by the rubric below: the "Houses from their drawings" section, the Maps table read against the house, "Passing" and "Keeping the judge honest". A measured item may score lower than its measurement allows, never higher.

The house's drawings and photos: ${given.join(", ")}. The key, drawn over its sheets: ${keyPicture} (rooms tinted and named, doors red, windows blue, stairs as arrows). The map: ${dir}/plan.png (from above, floor heights, every entity marked and listed, a grid every 120 units: 10 feet), ${dir}/storeys.png (a plan of each storey) and ${dir}/views.png (from inside, at a player's eye). Look at every picture closely.

The measurements (floorOverlap: the map's walked floor against the key's rooms, aligned; floorFoundByStorey: the share of each storey's rooms the map has floor in; doors and windows: the key's matched in the map):
${JSON.stringify(measured, null, 1)}

${askScores(ITEMS)}

THE RUBRIC
${RUBRIC}`,
  });
  const judged = parseAnswer(r.answer);
  if (!judged) return { house, decoy, error: "the judge's answer was not JSON", measured };
  return { house, decoy, measured, caps, ...settle("map", judged, caps) };
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
