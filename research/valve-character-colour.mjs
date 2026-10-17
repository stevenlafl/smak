// Half-Life's creatures and people by colour: over the texels their first body's triangles wear, the mean
// saturation (HSV, 0 to 1), and the spread of lightness (the standard deviation of luma, 0 to 255). A generated
// character's projected photograph is far more saturated and contrasted than Valve's (research/generated-
// characters.md, "the line-up, honestly"): these are the numbers a palette pull aims at. The pool is the line-up's
// (examples/reproduce/brief.mjs, ownOfKind("character")); nothing of the game's is written.
//
//   node research/valve-character-colour.mjs
import * as smak from "../src/index.mjs";
import { posed } from "../src/render.mjs";
import { ownOfKind } from "../examples/reproduce/brief.mjs";

const rows = [];
for (const { file, src } of ownOfKind("character")) {
  const tris = posed(src, { seq: 0, frame: 0 }).tris;
  const used = new Map();
  for (const t of tris) if (t.tex?.name && !used.has(t.tex.name)) used.set(t.tex.name, smak.textureOf(src, t.tex.name));
  let n = 0, sat = 0, sum = 0, sq = 0;
  for (const tex of used.values()) {
    const { width, height, pixels, palette } = tex;
    for (let i = 0; i < width * height; i++) {
      const [r, g, b] = [palette[pixels[i] * 3], palette[pixels[i] * 3 + 1], palette[pixels[i] * 3 + 2]];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      sat += mx ? (mx - mn) / mx : 0;
      const l = 0.3 * r + 0.59 * g + 0.11 * b;
      sum += l;
      sq += l * l;
      n++;
    }
  }
  const mean = sum / n;
  rows.push({ file, saturation: Math.round((sat / n) * 1000) / 1000, luma: Math.round(mean), spread: Math.round(Math.sqrt(sq / n - mean * mean) * 10) / 10 });
}
for (const r of rows) console.log(JSON.stringify(r));
const at = (list, share) => [...list].sort((a, b) => a - b)[Math.floor(share * (list.length - 1))];
for (const key of ["saturation", "luma", "spread"]) {
  const v = rows.map((r) => r[key]);
  console.log(`${key}: median ${at(v, 0.5)}, q1 ${at(v, 0.25)}, q3 ${at(v, 0.75)}, most ${at(v, 1)}`);
}
