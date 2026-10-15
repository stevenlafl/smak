// Measures again, from the game's own halflife.wad in a person's install, the numbers of VALVE in
// src/spec/look.mjs: the 10th, 50th and 90th of each measure over Valve's walls, floors, ceilings and roofs.
// Reads only; prints the rows to paste. With --kit, also where each of the kit's map materials falls among them.
//   node research/texture-stats.mjs <the game's valve folder> [--kit]
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { readWad } from "../src/maps/wad.mjs";
import { lookOf, VALVE } from "../src/spec/look.mjs";
import { materialOf, surfacePicture, MATERIALS } from "../src/spec/paint.mjs";

const game = process.argv[2];
if (!game) throw new Error("node research/texture-stats.mjs <the game's valve folder, the one with halflife.wad in it> [--kit]");
// a plain name (no animation, random-tile, liquid or see-through mark), 64 a side or more, and a word for a
// building's surface in it
const SURFACE = /(FLR|WALL|FLOOR|CRETE|ROOF|DIRT|ROCK|WOOD|BRICK|TILE|CEIL|METAL|OUT_)/i;
const valve = readWad(readFileSync(join(game, "halflife.wad")))
  .textures.filter((t) => /^[A-Z0-9_]+$/i.test(t.name) && t.width >= 64 && t.height >= 64 && SURFACE.test(t.name))
  .map((t) => {
    const rgb = new Uint8Array(t.width * t.height * 3);
    for (let i = 0; i < t.width * t.height; i++) rgb.set(t.palette.subarray(t.pixels[i] * 3, t.pixels[i] * 3 + 3), i * 3);
    return lookOf({ width: t.width, height: t.height, rgb });
  });
const at = (list, k) => [...list].sort((a, b) => a - b)[Math.floor(k * (list.length - 1))];
const round = (v) => Math.round(v * 1000) / 1000;
console.log(`// ${valve.length} of halflife.wad's textures`);
for (const key of Object.keys(VALVE)) console.log(`  ${key}: [${[0.1, 0.5, 0.9].map((k) => round(at(valve.map((v) => v[key]), k))).join(", ")}],`);
if (process.argv.includes("--kit")) {
  const share = (key, v) => Math.round((100 * valve.filter((x) => x[key] < v).length) / valve.length);
  for (const base of Object.keys(MATERIALS)) {
    if (["mesh", "glass", "flame", "neon", "water"].includes(base)) continue;
    const [w, h] = base === "door" ? [64, 128] : [128, 128];
    const look = lookOf(surfacePicture(materialOf({ base }, base), w, h));
    console.log(`${base.padEnd(9)} ${Object.keys(VALVE).map((key) => `${key} ${look[key].toFixed(3)} (${share(key, look[key])}th)`).join("  ")}`);
  }
}
