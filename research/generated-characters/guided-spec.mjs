// A model spec for a guided take (generate's base): on that base, in GENERATED_STANCE, the take as a mesh part at
// its own proportions and `height` tall, painted by projecting its cut-out from the front. Written beside the
// take, in its work folder, as a maker would write it.
//
//   node research/generated-characters/guided-spec.mjs <work> <take name, e.g. guardg_s1> [height] [base]
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { GENERATED_STANCE } from "../../src/spec/model.mjs";

const [work, take, heightArg, baseArg] = process.argv.slice(2);
const height = Number(heightArg ?? 75);
const base = baseArg ?? "player/gordon/gordon.mdl";
// the .obj's own box: Y up, its front towards +z, as generate writes them
const v = readFileSync(join(work, "gen", `${take}.obj`), "utf8").split("\n").filter((l) => l.startsWith("v ")).map((l) => l.split(/\s+/).slice(1, 4).map(Number));
const span = [0, 1, 2].map((k) => Math.max(...v.map((p) => p[k])) - Math.min(...v.map((p) => p[k])));
// stood up (generate's "y" up): the model's x is the file's z (front), its y the file's x, its z the file's y
const own = [span[2], span[0], span[1]];
const size = own.map((s) => Math.round((s / own[2]) * height * 10) / 10);
const spec = {
  spec: "smak.model/1",
  name: `${take}.mdl`,
  kind: "character",
  base: { file: base },
  floor: 0,
  size: { height },
  smooth: 80,
  pose: { aim: GENERATED_STANCE, bind: true },
  materials: { uniform: { base: "cloth", tone: [0.25, 0.3, 0.4] } },
  parts: [{ id: "body", kind: "mesh", file: `work:gen/${take}.obj`, size, triangles: 700, material: "uniform" }],
  project: [{ picture: `work:gen/${take}_cut.png`, view: "front" }],
};
writeFileSync(join(work, `${take}.json`), `${JSON.stringify(spec, null, 1)}\n`);
console.log(join(work, `${take}.json`), JSON.stringify(size));
