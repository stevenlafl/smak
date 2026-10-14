// The furniture hall: one map, its furniture as world, func_detail, func_wall, func_illusionary, with CLIP hulls,
// and the hull / cliptype options. Prints a table and writes results.json.
import { maps } from "/media/Data3/Packages/smak/src/index.mjs";
import { run, table, OUT } from "./harness.mjs";
import { writeFileSync } from "node:fs";

const T = { floor: "FLOOR", wall: "WALL", ceiling: "CEIL" };
const HALL = { min: [0, 0, 0], max: [1536, 1024, 256] };
const SIDE = { min: [1552, 256, 0], max: [2064, 768, 192] };
const DOOR = { min: [1536, 480, 0], max: [1552, 544, 96] };

/** The furniture: each item a list of brushes with its footprint box for a CLIP hull. */
function furniture({ nullUnder = false, scale = 1 } = {}) {
  const wood = scale === 1 ? "WOOD" : { name: "WOOD", scale };
  const items = [];
  for (let i = 0; i < 6; i++)
    for (let j = 0; j < 4; j++) {
      const x = 160 + i * 220, y = 160 + j * 220;
      const top = nullUnder ? { top: wood, bottom: "NULL", sides: wood } : wood;
      const brushes = [maps.box([x - 32, y - 20, 28], [x + 32, y + 20, 32], top)];
      for (const [dx, dy] of [[-28, -16], [24, -16], [-28, 12], [24, 12]])
        brushes.push(maps.box([x + dx, y + dy, 0], [x + dx + 4, y + dy + 4, 28], wood));
      // a bench beside it, and a crate
      brushes.push(maps.box([x - 28, y + 28, 14], [x + 28, y + 40, 18], top));
      brushes.push(maps.box([x - 26, y + 30, 0], [x - 22, y + 38, 14], wood), maps.box([x + 22, y + 30, 0], [x + 26, y + 38, 14], wood));
      brushes.push(maps.cylinder("z", [x + 50, y - 40], 10, 0, 40, wood, { sides: 12, snap: 1 }));
      items.push({ brushes, clip: [[x - 34, y - 52, 0], [x + 62, y + 42, 40]] });
    }
  const pillars = [];
  for (let i = 0; i < 4; i++)
    for (const y of [380, 640]) pillars.push(maps.cylinder("z", [270 + i * 330, y], 20, 0, 256, scale === 1 ? "STONE" : { name: "STONE", scale }, { sides: 16, snap: 1 }));
  return { items, pillars };
}

function hallMap({ mode = "world", pillars = "world", clip = false, noclip = false, cnl, nullUnder = false, scale = 1, roomScale = 1, extraKeys = {} } = {}) {
  const roomTex = roomScale === 1 ? T : Object.fromEntries(Object.entries(T).map(([k, v]) => [k, { name: v, scale: roomScale }]));
  const brushes = maps.carve([HALL, SIDE, DOOR], 16, roomTex);
  const entities = [maps.playerStart([100, 100, 0], 0)];
  for (const [x, y] of [[300, 300], [800, 300], [1300, 300], [300, 800], [800, 800], [1300, 800], [1800, 512]])
    entities.push(maps.light([x, y, 220], { brightness: 260 }));
  const f = furniture({ nullUnder, scale });
  const furn = f.items.flatMap((it) => it.brushes);
  const keys = { ...(noclip ? { zhlt_noclip: 1 } : {}), ...(cnl !== undefined ? { zhlt_clipnodedetaillevel: cnl } : {}), ...extraKeys };
  if (mode === "world") brushes.push(...furn);
  else if (mode === "func_detail") entities.push(maps.brushEntity("func_detail", furn, { zhlt_detaillevel: 1, ...keys }));
  else entities.push(maps.brushEntity(mode, furn, keys));
  if (pillars === "world") brushes.push(...f.pillars);
  else entities.push(maps.brushEntity("func_detail", f.pillars, { zhlt_detaillevel: 1 }));
  if (clip) brushes.push(...f.items.map((it) => maps.box(it.clip[0], it.clip[1], "CLIP")));
  return { brushes, entities };
}

const cases = [
  ["A world", hallMap()],
  ["B detail (furniture+pillars)", hallMap({ mode: "func_detail", pillars: "detail" })],
  ["B1 detail, default threads (1)", hallMap({ mode: "func_detail", pillars: "detail" }), { threads: 0 }],
  ["C detail cnl0", hallMap({ mode: "func_detail", pillars: "detail", cnl: 0 })],
  ["D detail noclip + CLIP boxes", hallMap({ mode: "func_detail", pillars: "detail", noclip: true, clip: true })],
  ["E func_wall furniture, detail pillars", hallMap({ mode: "func_wall", pillars: "detail" })],
  ["F func_wall noclip + CLIP", hallMap({ mode: "func_wall", pillars: "detail", noclip: true, clip: true })],
  ["G func_illusionary furniture", hallMap({ mode: "func_illusionary", pillars: "detail" })],
  ["G2 func_illusionary -clipeconomy", hallMap({ mode: "func_illusionary", pillars: "detail" }), { csg: ["-clipeconomy"] }],
  ["H world, -nohull2", hallMap(), { bsp: ["-nohull2"] }],
  ["I world, -nohull3", hallMap(), { bsp: ["-nohull3"] }],
  ["J world, cliptype smallest", hallMap(), { csg: ["-cliptype", "smallest"] }],
  ["K world, cliptype normalized", hallMap(), { csg: ["-cliptype", "normalized"] }],
  ["L world, cliptype precise", hallMap(), { csg: ["-cliptype", "precise"] }],
  ["M world, cliptype legacy", hallMap(), { csg: ["-cliptype", "legacy"] }],
  ["N detail, NULL under tops", hallMap({ mode: "func_detail", pillars: "detail", nullUnder: true })],
  ["O detail, furniture tex scale 2", hallMap({ mode: "func_detail", pillars: "detail", scale: 2 })],
  ["P detail, room tex scale 2", hallMap({ mode: "func_detail", pillars: "detail", roomScale: 2 })],
  ["Q detail, room tex scale 4", hallMap({ mode: "func_detail", pillars: "detail", roomScale: 4 })],
  ["R func_wall zhlt_striprad", hallMap({ mode: "func_wall", pillars: "detail", extraKeys: { zhlt_striprad: 1 } })],
];
const rows = [];
for (const [name, map, args] of cases) {
  const r = run(name.split(" ")[0], map, args ?? {});
  r.name = name;
  rows.push(r);
  console.error(name, r.failed ? "FAILED" : `clip ${r.clipnodes} leaves ${r.leaves} faces ${r.faces}`);
}
writeFileSync(`${OUT}/bench1.json`, JSON.stringify(rows, null, 1));
console.log(table(rows));
for (const r of rows) if (r.warnings.length || r.errors.length) console.log(r.name, [...new Set([...r.errors, ...r.warnings])].slice(0, 6));
