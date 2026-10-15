// The photographs the kit's furniture (kits/furniture/) paints its materials from, copied out of the material
// library (generators/fetch-materials.mjs) at 512 a side, so that the kit's furniture builds with no library at
// hand. All are Poly Haven's, CC0; kits/furniture/photos/SOURCES.md lists each with its page and real size.
// Idempotent: a photo already there is left alone. Needs ffmpeg.
//   node scripts/furniture-photos.mjs <the material library's folder>
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PHOTOS = ["wood_cabinet_worn_long", "fabric_leather_02", "cotton_jersey", "denim_fabric", "beige_wall_001", "metal_plate", "metal_plate_02", "bark_brown_01"];

const library = process.argv[2];
if (!library) throw new Error("node scripts/furniture-photos.mjs <the material library's folder>");
const out = fileURLToPath(new URL("../kits/furniture/photos/", import.meta.url));
const listed = JSON.parse(readFileSync(join(library, "materials.json"), "utf8"));
const lines = ["# The furniture's photographs", "", "Copied from Poly Haven's CC0 textures by scripts/furniture-photos.mjs, at 512 pixels a side.", "", "| Photo | Real size (units across, down) | Source | Licence |", "| --- | --- | --- | --- |"];
for (const name of PHOTOS) {
  const entry = listed.find((m) => m.name === name);
  if (!entry || entry.licence !== "CC0") throw new Error(`${name}: not in the library as CC0`);
  const target = join(out, `${name}.jpg`);
  if (!existsSync(target)) {
    const run = spawnSync("ffmpeg", ["-loglevel", "error", "-y", "-i", join(library, entry.file), "-vf", "scale=512:512", "-q:v", "3", target]);
    if (run.status !== 0) throw new Error(`${name}: ffmpeg: ${run.stderr}`);
    console.log(`${name}.jpg written`);
  }
  lines.push(`| ${name}.jpg | ${entry.size.join(", ")} | ${entry.source} | CC0 |`);
}
writeFileSync(join(out, "SOURCES.md"), `${lines.join("\n")}\n`);
