// A map spec built with steps 1 to 3 of research/level-dressing.md (frame with bands, composed light, a focus when
// given) against the same with step 4: the silhouette broken (frame.breaks) and its rooms dressed for their use.
// Compiled with SDHLT; the dressing report's lines, the brushes, the faults and the compile's time printed; the aimed
// views written (features.png).
//
//   node research/map-breaks-trial.mjs <spec.json> --uses '{"room": "use", ...}' [--focus '<json>'] --out <dir>
//        [--wads <dir> ...] [--materials <dir>] [--game <valve folder>] [--sdhlt <folder>]
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, basename, resolve } from "node:path";
import { buildMapSpec } from "../src/spec/map.mjs";
import { findCompilers } from "../src/maps/compile.mjs";
import { readBsp } from "../src/maps/bsp.mjs";
import { checkBsp } from "../src/maps/check.mjs";
import { unpicture } from "../src/image.mjs";

const args = process.argv.slice(2);
const many = (flag) => args.flatMap((a, i) => (args[i - 1] === flag ? [a] : []));
const one = (flag, otherwise) => many(flag)[0] ?? otherwise;
const file = args.find((a, i) => a.endsWith(".json") && !args[i - 1]?.startsWith("--"));
const uses = JSON.parse(one("--uses", "{}"));
const focus = JSON.parse(one("--focus", "null"));
const out = one("--out", "research/out/breaks-trial");
const game = one("--game", join(process.env.HOME, ".steam/steam/steamapps/common/Half-Life/valve"));
const library = one("--materials", "/media/Data3/Packages/material-library");
const compilers = findCompilers({ folder: one("--sdhlt", "/media/Data3/Packages/SDHLT/tools") });
const base = JSON.parse(readFileSync(file, "utf8"));
const folder = dirname(resolve(file));
const readPicture = (name) => (String(name).startsWith("library:") ? unpicture(readFileSync(join(library, `${String(name).slice(8).replace(/\.jpg$/i, "")}.jpg`))) : unpicture(readFileSync(resolve(folder, String(name).replace(/^(work|models):/, "")))));
const frame = { ...(typeof base.frame === "object" ? base.frame : {}), bands: true };
const before = { ...base, frame, lighting: true, ...(focus ? { focus } : {}) };
const after = { ...before, frame: { ...frame, breaks: true }, rooms: base.rooms.map((room) => (uses[room.id] ? { ...room, use: uses[room.id] } : room)) };
for (const [variant, spec] of [["dressed", before], ["broken", after]]) {
  const dir = join(out, basename(file, ".spec.json"), variant);
  mkdirSync(dir, { recursive: true });
  const began = Date.now();
  const { report, files } = buildMapSpec(spec, { out: dir, compilers, folder, wads: [...many("--wads"), game].filter(existsSync), readPicture });
  const seconds = Math.round((Date.now() - began) / 100) / 10;
  const compiled = files.bsp && existsSync(files.bsp);
  const counts = compiled ? checkBsp(readFileSync(files.bsp)).counts : null;
  console.log(`== ${basename(file)} ${variant}: ${seconds} s, ${compiled ? "compiled" : "NOT compiled"}; errors ${report.errors.length}${report.errors.length ? ` (${report.errors.slice(0, 2).join(" | ")})` : ""}, faults ${report.faults.length}${report.faults.length ? ` (${report.faults.slice(0, 3).join(" | ")})` : ""}`);
  if (counts) console.log(`  counts: ${["brushes", "planes", "faces", "leaves", "clipnodes", "models"].filter((k) => counts[k] !== undefined).map((k) => `${k} ${counts[k]}`).join(", ")}`);
  if (compiled) console.log(`  world models ${readBsp(readFileSync(files.bsp)).models.length}`);
  for (const line of [...report.facts, ...report.warnings].filter((l) => /^dressing|^frame|dressed by use|walk|one-way|not reached/i.test(l))) console.log(`  ${line.slice(0, 400)}`);
  if (files.features) console.log(`  views: ${files.features}`);
}
