// Props that look as GoldSrc's do: a crown of crossed cards wearing leaves with holes between them (a masked
// texture), and a model's pictures held to Valve's models' (look.mjs, VALVE_MODELS): a clean white fridge and toy
// colours are told, as a Xash3D developer told them of the kit's furniture (2026-10-15: "like The Sims").
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test, sure, tmp } from "./helper.mjs";
import { buildMapSpec } from "../src/spec/map.mjs";
import { buildModelSpec } from "../src/spec/model.mjs";
import { readMdl, textureOf } from "../src/index.mjs";

test("cards: crossed sheets through a crown, both sides, a masked picture of leaves with holes that fade to its edge", () => {
  const { report, mdl } = buildModelSpec({ spec: "smak.model/1", name: "tree.mdl", kind: "prop", parts: [
    { id: "trunk", kind: "cylinder", radius: 2, height: 60, material: "darkwood" },
    { id: "crown", kind: "cards", size: [48, 40, 36], count: 4, attach: { to: "trunk", toAt: "top", at: "centre" } },
  ] });
  sure(report.ok, [...report.errors, ...report.faults].join("; "));
  const info = readMdl(mdl);
  const leaves = info.textures.find((t) => t.flags & 64);
  sure(leaves, `a masked texture: ${info.textures.map((t) => `${t.name} ${t.flags}`).join(", ")}`);
  const t = textureOf(mdl, leaves.name);
  const holes = t.pixels.filter((p) => p === 255).length / t.pixels.length;
  sure(holes > 0.3 && holes < 0.95, `${Math.round(holes * 100)}% of the leaves' picture is holes`);
  // the crown's box: as wide as its size, its top near the trunk's top plus half the crown
  const crown = report.parts.crown;
  sure(crown && Math.abs(crown.to[0] - crown.from[0] - 48) < 1 && Math.abs(crown.to[2] - crown.from[2] - 36) < 1, JSON.stringify(crown));
  // scattered: smaller cards inside the crown
  const scattered = buildModelSpec({ spec: "smak.model/1", name: "bush.mdl", kind: "prop", parts: [{ id: "bush", kind: "cards", size: [40, 40, 24], count: 10, card: [16, 12], tilt: 40 }] });
  sure(scattered.report.ok, [...scattered.report.errors, ...scattered.report.faults].join("; "));
  const bad = buildModelSpec({ spec: "smak.model/1", name: "b.mdl", kind: "prop", parts: [{ id: "b", kind: "cards", size: [4, 4], count: 1 }] });
  sure(bad.report.errors.some((e) => /size: \[x, y, z\]/.test(e)) && bad.report.errors.some((e) => /count: how many cards/.test(e)), bad.report.errors.join(" | "));
});

test("a model's pictures against Valve's models: near white and toy colours warned of, a used grey not", () => {
  const box = (tone) => buildModelSpec({ spec: "smak.model/1", name: "fridge.mdl", kind: "prop", finish: false, parts: [{ id: "body", kind: "box", size: [30, 28, 66], material: { base: "paint", tone } }] });
  const white = box([0.92, 0.92, 0.9]);
  sure(white.report.warnings.some((w) => /look unlike nine in ten of Valve's models': \S+ \d+% near white/.test(w)), white.report.warnings.join(" | "));
  const toy = box([0.9, 0.1, 0.1]);
  sure(toy.report.warnings.some((w) => /\d+% strongly coloured/.test(w)), toy.report.warnings.join(" | "));
  // a used grey is not near white; flat paint with no finish is still told it has little grain (a toy's surface)
  const used = box([0.55, 0.55, 0.52]);
  sure(!used.report.warnings.some((w) => /near white|strongly coloured/.test(w)) && used.report.warnings.some((w) => /little grain/.test(w)), used.report.warnings.join(" | "));
});

test("a .map prefab put twice: the names it gives its own entities are made its own each time, a name it only uses kept", () => {
  const folder = join(tmp, "prefab-names");
  mkdirSync(folder, { recursive: true });
  const brush = (x0, x1, t) => `{\n( ${x0} -8 0 ) ( ${x0} 8 0 ) ( ${x0} -8 8 ) ${t} [ 0 1 0 0 ] [ 0 0 -1 0 ] 0 1 1\n( ${x1} -8 0 ) ( ${x1} -8 8 ) ( ${x1} 8 0 ) ${t} [ 0 1 0 0 ] [ 0 0 -1 0 ] 0 1 1\n( ${x0} -8 0 ) ( ${x0} -8 8 ) ( ${x1} -8 0 ) ${t} [ 1 0 0 0 ] [ 0 0 -1 0 ] 0 1 1\n( ${x0} 8 0 ) ( ${x1} 8 0 ) ( ${x0} 8 8 ) ${t} [ 1 0 0 0 ] [ 0 0 -1 0 ] 0 1 1\n( ${x0} -8 0 ) ( ${x1} -8 0 ) ( ${x0} 8 0 ) ${t} [ 1 0 0 0 ] [ 0 -1 0 0 ] 0 1 1\n( ${x0} -8 8 ) ( ${x0} 8 8 ) ( ${x1} -8 8 ) ${t} [ 1 0 0 0 ] [ 0 -1 0 0 ] 0 1 1\n}\n`;
  writeFileSync(join(folder, "soda.map"), [
    `{\n"classname" "worldspawn"\n"mapversion" "220"\n${brush(-8, 8, "SM_FURNITURE")}}\n`,
    `{\n"classname" "func_button"\n"target" "soda"\n${brush(8, 10, "SM_FURNITURE")}}\n`,
    `{\n"classname" "env_beverage"\n"targetname" "soda"\n"origin" "0 0 4"\n}\n`,
    `{\n"classname" "trigger_relay"\n"targetname" "relay"\n"target" "lights_main"\n"origin" "0 0 2"\n}\n`,
  ].join(""));
  const spec = { spec: "smak.map/1", name: "sodas", textures: { furniture: { base: "metal" } }, prefabs: { soda: { file: "soda.map" } }, rooms: [{ id: "hall", size: [256, 256, 128] }], furniture: [{ prefab: "soda", room: "hall", at: [-60, 0] }, { prefab: "soda", room: "hall", at: [60, 0] }], entities: [{ class: "info_player_start", room: "hall", at: [0, -80] }] };
  const { report, files } = buildMapSpec(spec, { out: join(folder, "out"), folder, compilers: { found: false, message: "" } });
  sure(!report.errors.length, report.errors.join("; "));
  const text = readFileSync(files.map, "utf8");
  for (const n of [1, 2]) sure(text.includes(`"targetname" "soda_${n}"`) && text.includes(`"target" "soda_${n}"`), `soda_${n} given and fired`);
  sure(!/"targetname" "soda"\n/.test(text), "no machine keeps the shared name");
  sure((text.match(/"target" "lights_main"/g) ?? []).length === 2, "a name only used is kept");
});
