// The guard built three ways from one spec (the held brief's maker's): with its front and back drawn apart, with the
// turnaround's, and with the turnaround's cut-outs and Hunyuan3D-Paint's two sides; each drawn from six sides, one
// picture of the rows to research/out/turnaround/compare.png (out of git).
//   node research/zimage/turnaround-compare.mjs <old work folder>
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import * as smak from "../../src/index.mjs";
import { buildModelSpec } from "../../src/spec/model.mjs";

const here = resolve(new URL("../..", import.meta.url).pathname);
const out = join(here, "research/out/turnaround");
const oldWork = process.argv[2];
const games = [`${process.env.HOME}/.steam/steam/steamapps/common/Half-Life/valve`];
// the held round's maker's own spec, from its work folder: a generated guard, its front and back pictures projected
const spec = JSON.parse(readFileSync(join(oldWork, "barney.spec.json"), "utf8"));
const { layout, ...plain } = spec;
const rows = [
  ["apart", oldWork, plain],
  ["turnaround", out, { ...plain, parts: plain.parts.map((p) => (p.kind === "mesh" ? { ...p, file: "work:guard/turnshape_s0.obj" } : p)), project: [{ picture: "work:guard/turnshape_s0_cut.png", view: "front" }, { picture: "work:guard/turn_s0_back.png", view: "back" }] }],
  // and its sides, Hunyuan3D-Paint's views from its left (azimuth 90) and its right (270), research/zimage/paint_views.py
  ["sides", out, { ...plain, parts: plain.parts.map((p) => (p.kind === "mesh" ? { ...p, file: "work:guard/turnshape_s0.obj" } : p)), project: [{ picture: "work:guard/turnshape_s0_cut.png", view: "front" }, { picture: "work:guard/turn_s0_back_cut.png", view: "back" }, { picture: "work:paint/view_1.png", yaw: 90 }, { picture: "work:paint/view_3.png", yaw: 270 }] }],
];
const YAWS = [0, 45, 135, 180, 225, 315];
const shots = [];
for (const [name, folder, s] of rows) {
  const { mdl, report } = buildModelSpec(s, { folder, games });
  if (!mdl) throw new Error(`${name}: ${report.errors.join("; ")}`);
  writeFileSync(join(out, `guard-${name}.mdl`), mdl);
  console.log(name, report.facts.filter((f) => /projected|unseen|filled/.test(f)).map((f) => f.slice(0, 200)));
  for (const yaw of YAWS) shots.push(smak.render(mdl, { seq: 0, frame: 0, yaw, pitch: 5, width: 240, height: 360 }));
}
const picture = smak.tile(shots, YAWS.length, rows.flatMap(([name]) => YAWS.map((yaw) => `${name} ${yaw}`)));
writeFileSync(join(out, "compare.png"), smak.png(picture.width, picture.height, picture.rgba));
