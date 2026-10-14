// RAD options on the detail hall, and studio model shadows.
import { maps } from "/media/Data3/Packages/smak/src/index.mjs";
import { buildModelSpec } from "/media/Data3/Packages/smak/src/spec/model.mjs";
import { run, table, OUT } from "./harness.mjs";
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const only = process.argv[2] ? new RegExp(process.argv[2]) : null;
const B = maps.readMap(readFileSync(`${OUT}/B/B.map`, "utf8"));
const hallB = () => ({ brushes: B.brushes, entities: B.entities.filter((e) => e.classname !== "worldspawn") });

/** A room with a light over a crate model, its shadow asked or not. */
function shadowMap(keys) {
  const brushes = maps.carve([{ min: [0, 0, 0], max: [512, 512, 256] }], 16, { floor: "FLOOR", wall: "WALL", ceiling: "CEIL" });
  const entities = [maps.playerStart([32, 32, 0]), maps.light([256, 256, 240], { brightness: 300 }),
    maps.pointEntity("cycler_sprite", [256, 256, 0], { model: "models/crate.mdl", angles: [0, 0, 0], ...keys })];
  return { brushes, entities };
}
/** The light on the floor straight under the model, and away from it. */
function floorLight(file) {
  const bsp = maps.readBsp(readFileSync(file));
  const floors = bsp.faces.filter((f) => { const p = bsp.planes[f.plane]; return Math.abs(p.normal[2]) > 0.99 && Math.abs(p.dist) < 1; });
  const at = (x, y) => {
    for (const face of floors) {
      const lm = maps.faceLightmap(bsp, face);
      if (!lm) continue;
      const ti = bsp.texinfo[face.texinfo];
      const s = x * ti.s[0] + y * ti.s[1] + ti.s[3], t = x * ti.t[0] + y * ti.t[1] + ti.t[3];
      const i = Math.round((s - lm.originS) / 16), j = Math.round((t - lm.originT) / 16);
      if (i < 0 || j < 0 || i >= lm.width || j >= lm.height) continue;
      const rgb = lm.styles[0].rgb, k = (j * lm.width + i) * 3;
      return Math.round((rgb[k] + rgb[k + 1] + rgb[k + 2]) / 3);
    }
    return null;
  };
  return { under: at(256, 256), edge: at(256 + 40, 256), beside: at(256 + 64, 256), away: at(256 + 160, 256) };
}

const rows = [];
const cases = [
  ["R0 rad default", hallB(), {}],
  ["R1 rad -extra", hallB(), { rad: ["-extra"] }],
  ["R2 rad -chop 32 -texchop 16", hallB(), { rad: ["-chop", "32", "-texchop", "16"] }],
  ["R3 rad -chop 128", hallB(), { rad: ["-chop", "128"] }],
  ["R4 rad -bounce 0", hallB(), { rad: ["-bounce", "0"] }],
  ["R5 rad -ao", hallB(), { rad: ["-ao"] }],
  ["R6 rad -pcf 3", hallB(), { rad: ["-pcf", "3"] }],
  ["R7 rad -fast", hallB(), { rad: ["-fast"] }],
  ["R8 vis -fast", hallB(), { vis: ["-fast"] }],
  ["R9 vis -full", hallB(), { vis: ["-full"] }],
];
for (const [name, map, args] of cases) {
  if (only && !only.test(name)) continue;
  const id = name.split(" ")[0];
  const r = run(id, map, args);
  r.name = name;
  rows.push(r);
  console.error(name, r.seconds);
}
// studio shadows: the model is looked for under the map's folder's parent (g_Wadpath)
if (!only || only.test("Z")) {
  const crate = buildModelSpec({ spec: "smak.model/1", name: "crate.mdl", kind: "prop", parts: [{ id: "box", kind: "box", size: [64, 64, 64], material: "wood" }] });
  for (const [id, keys] of [["Z0", {}], ["Z1", { zhlt_studioshadow: 1 }], ["Z2", { zhlt_studioshadow: 1, zhlt_shadowmode: 2 }], ["Z3", { zhlt_studioshadow: 1, zhlt_shadowmode: 0 }]]) {
    const root = join(OUT, id);
    mkdirSync(join(root, "models"), { recursive: true });
    mkdirSync(join(root, "maps"), { recursive: true });
    writeFileSync(join(root, "models", "crate.mdl"), crate.mdl);
    const r = run(id, shadowMap(keys), {}, { folder: join(root, "maps") });
    r.name = `${id} studio shadow ${JSON.stringify(keys)}`;
    r.floor = floorLight(join(root, "maps", `${id}.bsp`));
    const rad = readFileSync(join(root, "maps", `${id}.rad.txt`), "latin1");
    r.studioLines = rad.split(/\r?\n/).filter((l) => /studio|opaque|LoadStudioModel/i.test(l)).slice(0, 5);
    rows.push(r);
    console.error(r.name, r.floor, r.studioLines);
  }
}
writeFileSync(`${OUT}/bench3${only ? "-" + process.argv[2].replace(/\W/g, "") : ""}.json`, JSON.stringify(rows, null, 1));
console.log(table(rows, ["avgVisible", "lightBytes", "visBytes"]));
for (const r of rows) if (r.floor) console.log(r.name, JSON.stringify(r.floor), r.studioLines);
