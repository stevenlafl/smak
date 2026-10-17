// A map spec built four ways and its dressing measured beside Valve's (src/maps/dressing.mjs): plain (no frame,
// no lighting), framed (frame: true), banded (frame: { bands: true }), composed (bands and lighting: true). Each is
// compiled with SDHLT, walked, and measured; the table prints each measure's value against Valve's 5th to 95th.
// The spec's own .wad files are looked for beside it and in --wads folders; `library:` pictures in --materials.
//
//   node research/map-dressing-trial.mjs <spec.json> [...] --out <dir> [--wads <dir> ...] [--materials <dir>]
//        [--game <valve folder>] [--sdhlt <folder>] [--only plain,framed,banded,composed]
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, basename, resolve } from "node:path";
import { buildMapSpec } from "../src/spec/map.mjs";
import { findCompilers } from "../src/maps/compile.mjs";
import { readBsp } from "../src/maps/bsp.mjs";
import { readMap } from "../src/maps/source.mjs";
import { dressingOf, VALVE_DRESSING } from "../src/maps/dressing.mjs";
import { unpicture } from "../src/image.mjs";

const args = process.argv.slice(2);
const many = (flag) => args.flatMap((a, i) => (args[i - 1] === flag ? [a] : []));
const one = (flag, otherwise) => many(flag)[0] ?? otherwise;
const specs = args.filter((a, i) => a.endsWith(".json") && !args[i - 1]?.startsWith("--"));
const out = one("--out", "research/out/dressing-trial");
const game = one("--game", join(process.env.HOME, ".steam/steam/steamapps/common/Half-Life/valve"));
const library = one("--materials", "/media/Data3/Packages/material-library");
const compilers = findCompilers({ folder: one("--sdhlt", "/media/Data3/Packages/SDHLT/tools") });
const only = one("--only", "plain,framed,banded,composed").split(",");
const VARIANTS = {
  plain: (s) => ({ ...s, frame: undefined, lighting: undefined }),
  framed: (s) => ({ ...s, frame: true, lighting: undefined }),
  banded: (s) => ({ ...s, frame: { ...(typeof s.frame === "object" ? s.frame : {}), bands: true }, lighting: undefined }),
  composed: (s) => ({ ...s, frame: { ...(typeof s.frame === "object" ? s.frame : {}), bands: true }, lighting: true }),
};
const KEYS = ["bandedWalls", "oneTextureWalls", "joinHeight", "lampFaces", "darkFloor", "contrast", "detail", "nonAxial", "shifted"];
const pct = (k, v) => (v === null || v === undefined ? "-" : ["joinHeight", "lampFaces", "detail", "contrast"].includes(k) ? `${Math.round(v * 100) / 100}` : `${Math.round(v * 100)}%`);
console.log(`measure: ${KEYS.join(" | ")}`);
console.log(`Valve 5th-95th: ${KEYS.map((k) => `${pct(k, VALVE_DRESSING.measures[k].least)}-${pct(k, VALVE_DRESSING.measures[k].most)}`).join(" | ")}`);
for (const file of specs) {
  const base = JSON.parse(readFileSync(file, "utf8"));
  const folder = dirname(resolve(file));
  const readPicture = (name) => (String(name).startsWith("library:") ? unpicture(readFileSync(join(library, `${String(name).slice(8).replace(/\.jpg$/i, "")}.jpg`))) : unpicture(readFileSync(resolve(folder, String(name).replace(/^(work|models):/, "")))));
  for (const variant of only) {
    const spec = VARIANTS[variant](base);
    const dir = join(out, basename(file, ".spec.json"), variant);
    mkdirSync(dir, { recursive: true });
    const began = Date.now();
    let built;
    try {
      built = buildMapSpec(spec, { out: dir, compilers, folder, wads: [...many("--wads"), game].filter(existsSync), readPicture });
    } catch (error) {
      console.log(`${basename(file)} ${variant}: ${error.message}`);
      continue;
    }
    const seconds = Math.round((Date.now() - began) / 100) / 10;
    const { report, files } = built;
    if (!files.bsp || !existsSync(files.bsp)) {
      console.log(`${basename(file)} ${variant}: no .bsp (${[...report.errors, ...report.faults].slice(0, 3).join(" | ")})`);
      continue;
    }
    const bsp = readBsp(readFileSync(files.bsp));
    const source = files.map && existsSync(files.map) ? readMap(readFileSync(files.map, "utf8")) : null;
    const { measures, counts } = dressingOf(bsp, { source });
    const faults = report.faults.filter((f) => !/size:/.test(f));
    console.log(`${basename(file, ".spec.json")} ${variant} (${seconds} s, ${counts.lights} lights, ${faults.length} faults${faults.length ? `: ${faults.slice(0, 2).join(" | ")}` : ""}): ${KEYS.map((k) => pct(k, measures[k])).join(" | ")}`);
  }
}
