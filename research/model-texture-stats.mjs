// Measures Valve's model textures as look.mjs measures their map textures: the 10th, 50th and 90th of each of
// lookOf's measures, and modelLookOf's `whites` and `vivid` (the shares of a texture's texels near white and
// strongly coloured), over every texture of the
// game's own models. These are VALVE_MODELS in src/spec/look.mjs. A Xash3D developer, looking at the kit's
// furniture (2026-10-15), said it looked like The Sims, not GoldSrc: about half of the fridge's and the toilet's
// texels were near white, where Valve's props have almost none. Reads only; prints the row to paste.
//   node research/model-texture-stats.mjs <the game's valve folder> [--list]
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { readMdl, textureOf, rgbaOf } from "../src/index.mjs";
import { lookOf, modelLookOf, VALVE } from "../src/spec/look.mjs";

const game = process.argv[2];
if (!game) throw new Error("node research/model-texture-stats.mjs <the game's valve folder> [--list]");
const folder = join(game, "models");
// first-person files are mostly hands and sleeves, and side files hold only animations or textures read with
// their main file: the models themselves, their textures inside them
const files = readdirSync(folder).filter((f) => /\.mdl$/i.test(f) && !/^v_/i.test(f) && !/(t|\d\d)\.mdl$/i.test(f));
const looks = [];
for (const file of files) {
  let bytes;
  try {
    bytes = readFileSync(join(folder, file));
    const list = readMdl(bytes).textures ?? [];
    for (const t of list) {
      const texture = textureOf(bytes, t.name);
      // chrome is drawn as a reflection, and a picture under 32 a side is a flat colour or a trim
      if (!texture || texture.width < 32 || texture.height < 32 || texture.flags & 2) continue;
      const rgba = rgbaOf(texture);
      looks.push({ file, name: t.name, ...lookOf({ width: texture.width, height: texture.height, rgba }), ...modelLookOf(rgba) });
    }
  } catch {
    // a file this kit does not read (a sequence group, a broken one) is left out
  }
}
const at = (list, k) => [...list].sort((a, b) => a - b)[Math.floor(k * (list.length - 1))];
const round = (v) => Math.round(v * 1000) / 1000;
console.log(`// ${looks.length} textures of ${new Set(looks.map((l) => l.file)).size} of the game's models`);
console.log(`export const VALVE_MODELS = {`);
for (const key of [...Object.keys(VALVE), "whites", "vivid"]) console.log(`  ${key}: [${[0.1, 0.5, 0.9].map((k) => round(at(looks.map((v) => v[key]), k))).join(", ")}],`);
console.log(`};`);
if (process.argv.includes("--list")) for (const l of looks) console.log(l.file, l.name, ...[...Object.keys(VALVE), "whites", "vivid"].map((k) => `${k} ${round(l[k])}`));
