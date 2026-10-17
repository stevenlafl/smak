// Which of the game's textures Valve stacks on which up a wall: over every campaign map (cXaY, compiled), each
// tall wall plane's texture joins (a face whose top meets the bottom of a face of another texture, overlapping
// along the wall), counted by pair, with how high over the plane's foot the join sits. For src/maps/families.mjs
// (WALL_FAMILIES): for each wall texture that has joins, the texture most often under it, the one most often
// over it, and the join heights. Names and numbers only; nothing of the game's is written.
//
//   node research/valve-wall-families.mjs <the game's valve folder> [--least n]   (pairs seen n times or more, 3)
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import * as maps from "../src/maps/index.mjs";

const game = process.argv[2];
const least = process.argv.includes("--least") ? Number(process.argv[process.argv.indexOf("--least") + 1]) : 3;
if (!game) throw new Error("node research/valve-wall-families.mjs <the game's valve folder>");
const TOOLS = /^(sky|clip|null|aaatrigger|origin|hint|skip|bevel)$/i;
const files = readdirSync(join(game, "maps")).filter((f) => /^c\da\d[a-z0-9]*\.bsp$/.test(f)).sort();
// pair "under|over" -> { count, heights: [] }; texture -> walls it is on
const pairs = new Map();
const walls = new Map();
for (const f of files) {
  const bsp = maps.readBsp(readFileSync(join(game, "maps", f)));
  const planes = new Map();
  for (const face of maps.modelFaces(bsp, 0)) {
    const t = maps.faceTexture(bsp, face);
    if (!t?.name || TOOLS.test(t.name) || t.name.startsWith("!") || /^sky/i.test(t.name)) continue;
    const n = maps.faceNormal(bsp, face);
    if (Math.abs(n[2]) > 0.05) continue;
    const poly = maps.facePolygon(bsp, face);
    const d = n[0] * poly[0][0] + n[1] * poly[0][1] + n[2] * poly[0][2];
    const key = `${n.map((v) => Math.round(v * 20)).join(",")}|${Math.round(d / 2)}`;
    const zs = poly.map((p) => p[2]);
    const along = poly.map((p) => n[1] * p[0] - n[0] * p[1]);
    (planes.get(key) ?? planes.set(key, []).get(key)).push({ texture: t.name.toUpperCase(), z0: Math.min(...zs), z1: Math.max(...zs), s0: Math.min(...along), s1: Math.max(...along) });
  }
  for (const plane of planes.values()) {
    const foot = Math.min(...plane.map((p) => p.z0));
    if (Math.max(...plane.map((p) => p.z1)) - foot < 128) continue;
    for (const p of plane) walls.set(p.texture, (walls.get(p.texture) ?? 0) + 1);
    const seen = new Set();
    for (const a of plane)
      for (const b of plane) {
        if (a.texture === b.texture || Math.abs(a.z1 - b.z0) > 1 || Math.min(a.s1, b.s1) - Math.max(a.s0, b.s0) < 1) continue;
        const k = `${a.texture}|${b.texture}`;
        if (seen.has(`${k}|${a.z1}`)) continue;
        seen.add(`${k}|${a.z1}`);
        const e = pairs.get(k) ?? pairs.set(k, { count: 0, heights: [] }).get(k);
        e.count++;
        e.heights.push(Math.round(a.z1 - foot));
      }
  }
}
const median = (v) => [...v].sort((x, y) => x - y)[Math.floor((v.length - 1) / 2)];
const kept = [...pairs].filter(([, e]) => e.count >= least).sort((x, y) => y[1].count - x[1].count);
console.log(`${files.length} maps; ${pairs.size} pairs, ${kept.length} seen ${least} times or more; the commonest:`);
for (const [k, e] of kept.slice(0, 30)) console.log(`  ${k.replace("|", " under ")}: ${e.count} (join at ${median(e.heights)} over the foot)`);
// for each texture: the one most often under it and over it
const family = {};
for (const [k, e] of kept) {
  const [under, over] = k.split("|");
  const up = (family[under] ??= {});
  if (!up.over || e.count > up.overCount) Object.assign(up, { over, overCount: e.count, overAt: median(e.heights) });
  const down = (family[over] ??= {});
  if (!down.under || e.count > down.underCount) Object.assign(down, { under, underCount: e.count, underAt: median(e.heights) });
}
console.log(`\nWALL_FAMILIES (${Object.keys(family).length} textures):`);
for (const [t, f] of Object.entries(family).sort()) console.log(`  ${t}: { ${f.under ? `under: "${f.under}", underAt: ${f.underAt}` : ""}${f.under && f.over ? ", " : ""}${f.over ? `over: "${f.over}", overAt: ${f.overAt}` : ""} },`);
