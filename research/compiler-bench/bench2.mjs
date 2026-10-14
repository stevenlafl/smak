// Seal tests, terrain, maxnodesize, hint, minlight textures.
import { maps } from "/media/Data3/Packages/smak/src/index.mjs";
import { run, table, OUT } from "./harness.mjs";
import { writeFileSync, readFileSync } from "node:fs";

const T = { floor: "FLOOR", wall: "WALL", ceiling: "CEIL" };
const only = process.argv[2] ? new RegExp(process.argv[2]) : null;

// ── seal: a room whose east wall is a separate brush of the given kind ──
function sealMap(kind) {
  // a sealed room 256 x 256 x 128 with 16 of rock, and a hole through its east wall filled by the brush tested
  const walls = maps.hollow([0, 0, 0], [256, 256, 128], 16, "WALL");
  const east = { min: [256, -16, -16], max: [272, 272, 144] };
  const hole = { min: [256, 64, 16], max: [272, 192, 112] };
  const brushes = [...walls.filter((_, i) => i !== 3), ...maps.subtract(east, hole).map((p) => maps.box(p.min, p.max, "WALL"))];
  const entities = [maps.playerStart([64, 128, 0]), maps.light([128, 128, 100])];
  if (kind === "open") return { brushes, entities };
  const test = maps.box(hole.min, hole.max, kind === "func_detail" || kind === "func_wall" ? "WALL" : kind);
  if (kind === "func_detail" || kind === "func_wall") entities.push(maps.brushEntity(kind, [test], kind === "func_detail" ? { zhlt_detaillevel: 1 } : {}));
  else brushes.push(test);
  return { brushes, entities };
}

// ── terrain courtyard ──
function terrainMap(mode, keys = {}) {
  const yard = { min: [0, 0, 0], max: [1024, 1024, 384] };
  const brushes = maps.carve([yard], 16, { floor: "FLOOR", wall: "WALL", ceiling: "sky" });
  const height = (x, y) => Math.round(40 + 20 * Math.sin(x / 97) * Math.cos(y / 131) + 10 * Math.sin((x + y) / 53));
  const ground = maps.terrain({ min: [0, 0], max: [1024, 1024], step: [64, 64], base: 0, height, texture: { top: "FLOOR", sides: "STONE", bottom: "NULL" } });
  const entities = [maps.playerStart([100, 100, 60]), maps.sunLight([512, 512, 300], { brightness: 200 })];
  if (mode === "world") brushes.push(...ground);
  else entities.push(maps.brushEntity("func_detail", ground, { zhlt_detaillevel: 1, ...keys }));
  return { brushes, entities };
}

// ── L hall with and without a hint at the corner ──
function lMap(hint) {
  const A = { min: [0, 0, 0], max: [512, 512, 192] };
  const B = { min: [0, 1536, 0], max: [512, 2048, 192] };
  const leg1 = { min: [512, 192, 0], max: [1280, 320, 128] };
  const leg2 = { min: [1152, 320, 0], max: [1280, 1856, 128] };
  const leg3 = { min: [512, 1728, 0], max: [1152, 1856, 128] };
  const brushes = maps.carve([A, B, leg1, leg2, leg3], 16, T);
  // crates in the rooms so they are cut into leaves
  for (const R of [A, B]) for (let i = 0; i < 4; i++) brushes.push(maps.box([R.min[0] + 64 + i * 100, R.min[1] + 200, 0], [R.min[0] + 112 + i * 100, R.min[1] + 248, 48], "WOOD"));
  if (hint) {
    // a hint across each corner of the hall, diagonal, HINT on the diagonal face and SKIP on the rest
    const tex = (n) => (Math.abs(n[0]) > 0.3 && Math.abs(n[1]) > 0.3 ? "HINT" : "SKIP");
    brushes.push(maps.prism("z", [[1152, 192], [1280, 192], [1152, 320]], 0, 128, tex));
    brushes.push(maps.prism("z", [[1152, 1856], [1280, 1728], [1280, 1856]], 0, 128, tex));
  }
  const entities = [maps.playerStart([64, 64, 0]), maps.light([256, 256, 160]), maps.light([256, 1792, 160]), maps.light([900, 256, 100]), maps.light([1216, 1000, 100]), maps.light([900, 1792, 100])];
  return { brushes, entities };
}

// ── a dim room with minlight floors ──
function minlightMap(floor, extra = []) {
  const brushes = maps.carve([{ min: [0, 0, 0], max: [512, 512, 128] }], 16, { floor, wall: "WALL", ceiling: "CEIL" });
  return { brushes, entities: [maps.playerStart([64, 64, 0]), maps.light([480, 480, 100], { brightness: 20 }), ...extra] };
}

const cases = [
  ["S0 seal open hole", sealMap("open"), {}, { rad: false, vis: false }],
  ["S9 seal WALL", sealMap("WALL"), {}, { rad: false, vis: false }],
  ["Sa seal NOCLIP", sealMap("NOCLIP"), {}, { rad: false, vis: false }],
  ["Sb seal CONTENTEMPTY", sealMap("CONTENTEMPTY"), {}, { rad: false, vis: false }],
  ["Sc seal HINT", sealMap("HINT"), {}, { rad: false, vis: false }],
  ["Sd seal SPLITFACE", sealMap("SPLITFACE"), {}, { rad: false, vis: false }],
  ["Se seal BEVELHINT", sealMap("BEVELHINT"), {}, { rad: false, vis: false }],
  ["Sf seal BOUNDINGBOX", sealMap("BOUNDINGBOX"), {}, { rad: false, vis: false }],
  ["Sg seal CONTENTWATER", sealMap("CONTENTWATER"), {}, { rad: false, vis: false }],
  ["S1 seal NULL", sealMap("NULL"), {}, { rad: false, vis: false }],
  ["S2 seal func_detail", sealMap("func_detail"), {}, { rad: false, vis: false }],
  ["S3 seal SKIP", sealMap("SKIP"), {}, { rad: false, vis: false }],
  ["S4 seal CLIP", sealMap("CLIP"), {}, { rad: false, vis: false }],
  ["S5 seal SOLIDHINT", sealMap("SOLIDHINT"), {}, { rad: false, vis: false }],
  ["S6 seal BEVEL", sealMap("BEVEL"), {}, { rad: false, vis: false }],
  ["S7 seal func_wall", sealMap("func_wall"), {}, { rad: false, vis: false }],
  ["S8 seal water", sealMap("!WATER"), {}, { rad: false, vis: false }],
  ["T1 terrain world", terrainMap("world")],
  ["T2 terrain detail", terrainMap("detail")],
  ["T3 terrain detail chopdown 1", terrainMap("detail", { zhlt_chopdown: 1 })],
  ["T4 terrain detail cnl0", terrainMap("detail", { zhlt_clipnodedetaillevel: 0 })],
  ["T5 terrain world, cliptype precise", terrainMap("world"), { csg: ["-cliptype", "precise"] }],
  ["T6 terrain world, cliptype smallest", terrainMap("world"), { csg: ["-cliptype", "smallest"] }],
  ["T7 terrain world maxnodesize 256", terrainMap("world"), { bsp: ["-maxnodesize", "256"] }],
  ["T8 terrain world maxnodesize 4096", terrainMap("world"), { bsp: ["-maxnodesize", "4096"] }],
  ["L1 L-hall no hint", lMap(false)],
  ["L2 L-hall hint", lMap(true)],
  ["N1 dim floor plain", minlightMap("WOOD"), {}, {}],
  ["N2 dim floor %WOOD", minlightMap("%WOOD")],
  ["N3 dim floor %20WOOD", minlightMap("%20WOOD")],
  ["N4 dim, info_minlights WOOD 0.3", minlightMap("WOOD", [maps.pointEntity("info_minlights", [32, 32, 32], { WOOD: 0.3 })])],
  ["N5 dim, worldspawn _minlight 0.3", { ...minlightMap("WOOD"), worldspawn: { _minlight: 0.3 } }],
  ["N6 dim, -minlight 40", minlightMap("WOOD"), { rad: ["-minlight", "40"] }],
];
const rows = [];
for (const [name, map, args, opts] of cases) {
  if (only && !only.test(name)) continue;
  const r = run(name.split(" ")[0], map, args ?? {}, opts ?? {});
  r.name = name;
  // the floor's light: min and mean of the lighting lump
  try {
    const bsp = maps.readBsp(readFileSync(`${OUT}/${name.split(" ")[0]}/${name.split(" ")[0]}.bsp`));
    const L = bsp.lumps.lighting;
    if (L.length) { let mn = 255, s = 0; for (const v of L) { mn = Math.min(mn, v); s += v; } r.lightMin = mn; r.lightMean = Math.round(s / L.length); }
  } catch {}
  rows.push(r);
  console.error(name, r.failed ? "FAILED" : `clip ${r.clipnodes} leaves ${r.leaves}`, r.errors.slice(0, 2));
}
writeFileSync(`${OUT}/bench2${only ? "-" + process.argv[2].replace(/\W/g, "") : ""}.json`, JSON.stringify(rows, null, 1));
console.log(table(rows, ["avgVisible", "allocChart", "leaves", "faces", "clipnodes", "hull1", "hull2", "hull3", "portals", "lightMin", "lightMean"]));
for (const r of rows) if (r.errors.length || r.warnings.length) console.log(r.name, [...new Set([...r.errors, ...r.warnings])].slice(0, 5));
