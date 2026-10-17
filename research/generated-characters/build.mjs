// A character spec built from a generated take, drawn, and set in a line-up beside Valve's own people.
//
//   node research/generated-characters/build.mjs <spec.json> <out folder>
//
// The spec's `work:` names are read from the spec's own folder (the work folder). Writes <out>/<name>.mdl,
// <out>/report.txt (every fault, warning and fact), <out>/sheet.png (six views, first frame), <out>/run.png (its
// run from the side), <out>/lineup.png (it beside gman, scientist and hassassin at one scale, as
// examples/reproduce/brief.mjs lineupOf draws the brief leg's: yaw 35, pitch 20, first frame, one camera), and
// <out>/lineup-primitive.png (the same with the harness's primitive barney build, when it is there).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { buildModelSpec } from "../../src/spec/model.mjs";
import { check, sheet, strip, png, sequences, withTextures } from "../../src/index.mjs";
import { render, tile, framing } from "../../src/render.mjs";

const GAME = "/media/Data1/SteamLibrary/steamapps/common/Half-Life/valve";
const HERE = dirname(new URL(import.meta.url).pathname);
const [specFile, out] = process.argv.slice(2);
if (!specFile || !out) throw new Error("build.mjs <spec.json> <out folder>");
mkdirSync(out, { recursive: true });
const spec = JSON.parse(readFileSync(specFile, "utf8"));
const save = (file, p) => writeFileSync(join(out, file), png(p.width, p.height, p.rgba));

const t0 = Date.now();
const { mdl, report } = buildModelSpec(spec, { folder: dirname(resolve(specFile)), games: [GAME] });
const took = ((Date.now() - t0) / 1000).toFixed(1);
const lines = [`built in ${took} s: ${report.ok ? "OK" : "NOT OK"}`];
for (const [k, list] of Object.entries({ ERROR: report.errors, FAULT: report.faults, WARN: report.warnings, NOTE: report.notes, FACT: report.facts })) for (const l of list) lines.push(`${k}  ${l}`);
for (const [id, p] of Object.entries(report.parts ?? {})) lines.push(`PART  ${id}: ${JSON.stringify(p)}`);
if (mdl) {
  const c = check(mdl, "goldsrc");
  lines.push(`check goldsrc: ${c.errors.length} errors, ${c.warnings.length} warnings`, ...c.errors.map((e) => `CHECK ERROR  ${e}`), ...c.warnings.map((w) => `CHECK WARN  ${w}`));
}
writeFileSync(join(out, "report.txt"), `${lines.join("\n")}\n`);
console.log(lines.join("\n"));
if (!mdl) process.exit(1);
writeFileSync(join(out, spec.name), mdl);

const POSE = { seq: 0, frame: 0 };
save("sheet.png", sheet(mdl, { seq: 0 }));
const run = sequences(mdl).findIndex((s) => /^run/.test(s.name));
if (run >= 0) save("run.png", strip(mdl, { seq: run, count: 8, cols: 4, view: "side", ground: true, width: 192, height: 192 }));

const readModel = (file) => {
  let src = readFileSync(file);
  const side = file.replace(/\.mdl$/i, "t.mdl");
  if (src.length > 184 && !src.readInt32LE(180) && existsSync(side)) src = withTextures(src, readFileSync(side));
  return src;
};
const others = ["models/gman.mdl", "models/scientist.mdl", "models/hassassin.mdl"].map((f) => readModel(join(GAME, f)));
/** brief.mjs lineupOf: one camera about the largest, reaching round all four; ours in the last place, as there */
function lineup(ours, file) {
  const all = [...others, ours];
  const frames = all.map((src) => framing(src, [POSE]));
  const mid = frames.reduce((a, b) => (b.far > a.far ? b : a)).mid;
  const within = { mid, far: Math.max(...frames.map((f) => Math.hypot(...f.mid.map((v, k) => v - mid[k])) + f.far)) };
  const shots = all.map((src) => render(src, { ...POSE, view: "orbit", yaw: 35, pitch: 20, width: 320, height: 320, within }));
  save(file, tile(shots, 4, ["A", "B", "C", "D"]));
}
lineup(mdl, "lineup.png");
const primitive = join(HERE, "../../examples/reproduce/held/characters/barney/brief/built/barney.mdl");
if (existsSync(primitive)) {
  const both = [...others, readFileSync(primitive), mdl];
  const frames = both.map((src) => framing(src, [POSE]));
  const mid = frames.reduce((a, b) => (b.far > a.far ? b : a)).mid;
  const within = { mid, far: Math.max(...frames.map((f) => Math.hypot(...f.mid.map((v, k) => v - mid[k])) + f.far)) };
  save("lineup-with-primitive.png", tile(both.map((src) => render(src, { ...POSE, view: "orbit", yaw: 35, pitch: 20, width: 320, height: 320, within })), 5, ["gman", "scientist", "hassassin", "primitive brief build", "generated mesh"]));
}
