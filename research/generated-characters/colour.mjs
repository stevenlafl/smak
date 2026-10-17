// A model's colour as research/valve-character-colour.mjs measures Valve's: over the texels its first body's
// triangles wear, the mean saturation (HSV), the mean luma and its spread.
//
//   node research/generated-characters/colour.mjs <mdl> [...]
import { readFileSync, existsSync } from "node:fs";
import * as smak from "../../src/index.mjs";
import { posed } from "../../src/render.mjs";

for (const file of process.argv.slice(2)) {
  let src = readFileSync(file);
  const side = file.replace(/\.mdl$/i, "t.mdl");
  if (!smak.readMdl(src).textures.length && existsSync(side)) src = smak.withTextures(src, readFileSync(side));
  const used = new Map();
  for (const t of posed(src, { seq: 0, frame: 0 }).tris) if (t.tex?.name && !used.has(t.tex.name)) used.set(t.tex.name, smak.textureOf(src, t.tex.name));
  let n = 0, sat = 0, sum = 0, sq = 0;
  for (const { width, height, pixels, palette } of used.values())
    for (let i = 0; i < width * height; i++) {
      const [r, g, b] = [palette[pixels[i] * 3], palette[pixels[i] * 3 + 1], palette[pixels[i] * 3 + 2]];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      sat += mx ? (mx - mn) / mx : 0;
      const l = 0.3 * r + 0.59 * g + 0.11 * b;
      sum += l;
      sq += l * l;
      n++;
    }
  const mean = sum / n;
  console.log(JSON.stringify({ file, saturation: Math.round((sat / n) * 1000) / 1000, luma: Math.round(mean), spread: Math.round(Math.sqrt(sq / n - mean * mean) * 10) / 10 }));
}
