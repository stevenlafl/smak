// Valve's own dressing in numbers, for src/maps/dressing.mjs (VALVE_DRESSING): the face measures over every
// campaign map (cXaY, compiled, valve/maps), the brush roles over the SDK's two c1a0 sources, and with --views the
// complexity of each map's aimed views. Each measure's 5th, 25th, 50th, 75th and 95th in 100 are printed as the
// table to paste. Reads only; nothing of the game's is written.
//
//   node research/valve-dressing.mjs <the game's valve folder> [<the SDK's Map Files folder>] [--views]
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import * as maps from "../src/maps/index.mjs";
import { measureDressing, brushRole, pictureComplexity } from "../src/maps/dressing.mjs";
import { readRmf } from "./rmf-read.mjs";

const [game, sdk] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const views = process.argv.includes("--views");
const files = readdirSync(join(game, "maps")).filter((f) => /^c\da\d[a-z0-9]*\.bsp$/.test(f)).sort();
const all = {};
const add = (key, v) => v !== null && v !== undefined && Number.isFinite(v) && (all[key] ??= []).push(v);
for (const f of files) {
  const bsp = maps.readBsp(readFileSync(join(game, "maps", f)));
  let pictures = null;
  if (views) {
    try {
      const sheet = maps.viewsOf(bsp, { count: 6, aim: true, folders: [game], entities: "none", labels: false, width: 320, height: 240 });
      pictures = sheet.facts.cells ?? null;
      const c = pictureComplexity(sheet);
      add("edges", c.edges);
      add("compression", c.compression);
    } catch (error) {
      console.error(`${f}: views: ${error.message}`);
    }
  }
  const { measures } = measureDressing(bsp);
  for (const [k, v] of Object.entries(measures)) add(k, v);
  void pictures;
}
// the brush roles, from Valve's own sources
if (sdk)
  for (const name of ["c1a0.rmf", "c1a0d.rmf"]) {
    const file = join(sdk, name);
    if (!existsSync(file)) continue;
    const rmf = readRmf(readFileSync(file));
    const solids = [];
    const walk = (o, inEntity) => {
      if (o.type === "CMapSolid" && !inEntity) solids.push(o);
      for (const c of o.children ?? []) walk(c, inEntity || o.type === "CMapEntity");
    };
    walk(rmf.world, false);
    const counts = { lit: 0, strip: 0, panel: 0, block: 0, angled: 0, all: 0 };
    for (const s of solids) {
      const verts = s.faces.flatMap((f) => f.verts);
      if (!verts.length || s.faces.every((f) => /^(sky|clip|null|aaatrigger|origin|hint|skip)$/i.test(f.texture))) continue;
      const min = [0, 1, 2].map((k) => Math.min(...verts.map((v) => v[k])));
      const max = [0, 1, 2].map((k) => Math.max(...verts.map((v) => v[k])));
      const { role, angled } = brushRole({ min, max, faces: s.faces });
      counts[role]++;
      if (angled) counts.angled++;
      counts.all++;
    }
    add("panels", counts.panel / counts.all);
    add("strips", counts.strip / counts.all);
    add("litBrushes", counts.lit / counts.all);
    add("angled", counts.angled / counts.all);
  }
const at = (v, q) => [...v].sort((a, b) => a - b)[Math.min(v.length - 1, Math.max(0, Math.round(q * (v.length - 1))))];
const r = (v) => Math.round(v * 1000) / 1000;
console.log(`// ${files.length} campaign maps${sdk ? ", and c1a0.rmf and c1a0d.rmf for the roles" : ""}${views ? ", views aimed (6 a map, 320 x 240)" : ""}`);
for (const [k, v] of Object.entries(all))
  console.log(`    ${k}: { least: ${r(at(v, 0.05))}, q1: ${r(at(v, 0.25))}, median: ${r(at(v, 0.5))}, q3: ${r(at(v, 0.75))}, most: ${r(at(v, 0.95))}, n: ${v.length} },`);
