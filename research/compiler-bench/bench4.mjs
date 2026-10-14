// zhlt_usemodel, VIS -maxdistance, hidden terrain sides as SOLIDHINT/BEVELHINT/BEVEL, opaque func_walls, -subdivide.
import { maps } from "/media/Data3/Packages/smak/src/index.mjs";
import { run, table, OUT } from "./harness.mjs";
import { writeFileSync, readFileSync } from "node:fs";

const only = process.argv[2] ? new RegExp(process.argv[2]) : null;
const T = { floor: "FLOOR", wall: "WALL", ceiling: "CEIL" };

function tableBrushes(x, y) {
  const b = [maps.box([x - 32, y - 20, 28], [x + 32, y + 20, 32], "WOOD")];
  for (const [dx, dy] of [[-28, -16], [24, -16], [-28, 12], [24, 12]]) b.push(maps.box([x + dx, y + dy, 0], [x + dx + 4, y + dy + 4, 28], "WOOD"));
  b.push(maps.cylinder("z", [x, y], 6, 32, 44, "WOOD", { sides: 12, snap: 1 }));
  return b;
}
function usemodelMap(use) {
  const brushes = maps.carve([{ min: [0, 0, 0], max: [1536, 1024, 192] }], 16, T);
  const entities = [maps.playerStart([40, 40, 0]), maps.light([400, 500, 170]), maps.light([1100, 500, 170])];
  let n = 0;
  for (let i = 0; i < 6; i++)
    for (let j = 0; j < 4; j++, n++) {
      const x = 160 + i * 220, y = 160 + j * 220;
      if (use && n > 0) entities.push(maps.pointEntity("func_wall", [x, y, 16], { zhlt_usemodel: "table0" }));
      else entities.push(maps.brushEntity("func_wall", [...tableBrushes(x, y), maps.originBrush([x, y, 16])], n === 0 ? { targetname: "table0" } : {}));
    }
  return { brushes, entities };
}
function terrainMap(sides, extra = {}) {
  const yard = { min: [0, 0, 0], max: [1024, 1024, 384] };
  const brushes = maps.carve([yard], 16, { floor: "FLOOR", wall: "WALL", ceiling: "sky" });
  const height = (x, y) => Math.round(40 + 20 * Math.sin(x / 97) * Math.cos(y / 131) + 10 * Math.sin((x + y) / 53));
  brushes.push(...maps.terrain({ min: [0, 0], max: [1024, 1024], step: [64, 64], base: 0, height, texture: { top: "FLOOR", sides, bottom: "NULL" } }));
  return { brushes, entities: [maps.playerStart([100, 100, 60]), maps.sunLight([512, 512, 300], { brightness: 200 })], ...extra };
}
function hallE(keys) {
  const B = maps.readMap(readFileSync(`${OUT}/E/E.map`, "utf8"));
  return { brushes: B.brushes, entities: B.entities.filter((e) => e.classname !== "worldspawn").map((e) => (e.classname === "func_wall" ? { ...e, ...keys } : e)) };
}
function meanLight(id) {
  const bsp = maps.readBsp(readFileSync(`${OUT}/${id}/${id}.bsp`));
  let s = 0, n = 0, dark = 0;
  for (const f of bsp.faces) {
    const p = bsp.planes[f.plane];
    if (!(Math.abs(p.normal[2]) > 0.99 && Math.abs(p.dist) < 1)) continue;
    const lm = maps.faceLightmap(bsp, f);
    if (!lm) continue;
    const rgb = lm.styles[0].rgb;
    for (let k = 0; k < rgb.length; k += 3) { const v = (rgb[k] + rgb[k + 1] + rgb[k + 2]) / 3; s += v; n++; if (v < 60) dark++; }
  }
  return { floorMean: Math.round(s / n), floorDark: dark, floorSamples: n };
}
const cases = [
  ["U1 24 func_wall tables, own models", usemodelMap(false)],
  ["U2 24 func_wall tables, zhlt_usemodel", usemodelMap(true)],
  ["V0 terrain world (as T1)", terrainMap("STONE")],
  ["V1 terrain world, vis -maxdistance 512", terrainMap("STONE"), { vis: ["-maxdistance", "512"] }],
  ["W1 terrain sides SOLIDHINT", terrainMap("SOLIDHINT")],
  ["W2 terrain sides BEVELHINT", terrainMap("BEVELHINT")],
  ["W3 terrain sides BEVEL", terrainMap("BEVEL")],
  ["W4 terrain sides NULL", terrainMap("NULL")],
  ["X0 func_wall furniture (as E)", hallE({})],
  ["X1 func_wall furniture zhlt_lightflags 2", hallE({ zhlt_lightflags: 2 })],
  ["Y1 detail hall, bsp -subdivide 128", null, { bsp: ["-subdivide", "128"] }],
  ["Y2 detail hall, bsp -subdivide 512", null, { bsp: ["-subdivide", "512"] }],
];
const rows = [];
for (const [name, given, args] of cases) {
  if (only && !only.test(name)) continue;
  const id = name.split(" ")[0];
  let map = given;
  if (!map) { const B = maps.readMap(readFileSync(`${OUT}/B/B.map`, "utf8")); map = { brushes: B.brushes, entities: B.entities.filter((e) => e.classname !== "worldspawn") }; }
  const r = run(id, map, args ?? {});
  r.name = name;
  if (!r.failed) try { Object.assign(r, meanLight(id)); } catch (e) { r.errors.push(`kit: ${e.message}`); }
  rows.push(r);
  console.error(name, r.failed ? "FAILED" : `clip ${r.clipnodes} faces ${r.faces}`, r.errors.slice(0, 2));
}
writeFileSync(`${OUT}/bench4${only ? "-" + process.argv[2].replace(/\W/g, "") : ""}.json`, JSON.stringify(rows, null, 1));
console.log(table(rows, ["avgVisible", "allocChart", "models", "leaves", "faces", "clipnodes", "hull1", "planes", "portals", "luxels", "blocks", "floorMean", "floorDark"]));
for (const r of rows) if (r.errors.length || r.warnings.length) console.log(r.name, [...new Set([...r.errors, ...r.warnings])].slice(0, 4));
