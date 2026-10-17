// A map spec built with its dressing (frame with bands, composed light) and a focus, against the same without the
// focus: compiled with SDHLT, its landmark's sightlines and its dressing measured, its aimed views written
// (features.png). Step 3 of research/level-dressing.md.
//
//   node research/map-focus-trial.mjs <spec.json> --focus '<json of focus>' --out <dir> [--wads <dir> ...]
//        [--materials <dir>] [--game <valve folder>] [--sdhlt <folder>]
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, basename, resolve } from "node:path";
import { buildMapSpec } from "../src/spec/map.mjs";
import { findCompilers } from "../src/maps/compile.mjs";
import { unpicture } from "../src/image.mjs";

const args = process.argv.slice(2);
const many = (flag) => args.flatMap((a, i) => (args[i - 1] === flag ? [a] : []));
const one = (flag, otherwise) => many(flag)[0] ?? otherwise;
const file = args.find((a, i) => a.endsWith(".json") && !args[i - 1]?.startsWith("--"));
const focus = JSON.parse(one("--focus", "null"));
const out = one("--out", "research/out/focus-trial");
const game = one("--game", join(process.env.HOME, ".steam/steam/steamapps/common/Half-Life/valve"));
const library = one("--materials", "/media/Data3/Packages/material-library");
const compilers = findCompilers({ folder: one("--sdhlt", "/media/Data3/Packages/SDHLT/tools") });
const base = JSON.parse(readFileSync(file, "utf8"));
const folder = dirname(resolve(file));
const readPicture = (name) => (String(name).startsWith("library:") ? unpicture(readFileSync(join(library, `${String(name).slice(8).replace(/\.jpg$/i, "")}.jpg`))) : unpicture(readFileSync(resolve(folder, String(name).replace(/^(work|models):/, "")))));
const dressed = { ...base, frame: { ...(typeof base.frame === "object" ? base.frame : {}), bands: true }, lighting: true };
for (const [variant, spec] of [["dressed", dressed], ["focused", { ...dressed, focus }]]) {
  const dir = join(out, basename(file, ".spec.json"), variant);
  mkdirSync(dir, { recursive: true });
  const began = Date.now();
  const { report, files } = buildMapSpec(spec, { out: dir, compilers, folder, wads: [...many("--wads"), game].filter(existsSync), readPicture });
  const seconds = Math.round((Date.now() - began) / 100) / 10;
  const lines = [...report.facts, ...report.warnings].filter((l) => /focus|landmark|darkFloor|dark |contrast|floor light/i.test(l));
  console.log(`== ${basename(file)} ${variant}: ${seconds} s, ${files.bsp && existsSync(files.bsp) ? "compiled" : "NOT compiled"}; errors ${report.errors.length}, faults ${report.faults.length}${report.faults.length ? ` (${report.faults.slice(0, 2).join(" | ")})` : ""}`);
  for (const line of lines) console.log(`  ${line}`);
  if (files.features) console.log(`  views: ${files.features}`);
}
