// Textures from a game's own .wad files, for a map built from a spec: named exactly, or picked by words and
// a colour from all the .wad files given; and where nothing there will do (a game of labs has no neon), the
// gap told and the texture made instead, into the map's own .wad.
//
//   wadCatalog(files)              -> every texture of the files: name, file, size, average colour, words
//   pickTexture(catalog, wanted)   -> the best fit for { words, tone }, with the next best, or a gap
//
// The .wad files are only ever read. A game's textures are its authors': a map built with them names them
// and lists the game's .wad, and nothing of them is copied (AGENTS.md, rule 7).
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { readWad } from "../maps/wad.mjs";

/** The compilers' and the engine's own textures, and the kinds a pick never takes unless asked by name. */
const SPECIAL = /^(clip|origin|null|skip|hint|solidhint|bevel|bevelhint|aaatrigger|boundingbox|splitface|content\w*|sky|black_hidden|translucent)$/i;
const MARKED = /^[!{+\-~%]/;
/** A pick's colour may be this far off (0 to 1, the distance of the two colours over that of black and white). */
const TONE_OFF = 0.22;
/** How many of a texture's pixels are read for its average colour, at most. */
const SAMPLES = 4096;

const catalogs = new Map();

/** Every texture of some .wad files: [{ name, file, width, height, mean: [r, g, b] (0 to 1), words }]. */
export function wadCatalog(files) {
  const all = [];
  for (const file of files) {
    if (!catalogs.has(file)) {
      const { textures } = readWad(readFileSync(file));
      catalogs.set(
        file,
        textures.map((texture) => {
          const count = texture.width * texture.height;
          const step = Math.max(1, Math.floor(count / SAMPLES));
          const sum = [0, 0, 0];
          let n = 0;
          for (let i = 0; i < count; i += step) {
            const index = texture.pixels[i];
            for (let k = 0; k < 3; k++) sum[k] += texture.palette[index * 3 + k];
            n++;
          }
          return {
            name: texture.name,
            file,
            wad: basename(file),
            width: texture.width,
            height: texture.height,
            mean: sum.map((v) => v / n / 255),
            words: texture.name.toLowerCase(),
          };
        }),
      );
    }
    all.push(...catalogs.get(file));
  }
  return all;
}

/**
 * The texture that best fits `wanted` ({ words: ["brick", "wall"], tone: [r, g, b] }): one whose name holds
 * one of the words at least, the more the better, of the nearest average colour to `tone` when given (and
 * no further off than TONE_OFF). Tool textures and marked ones (liquids, see-through, animated) only by
 * their own words (`!`, `{`, `+`...). Returns { pick, others: the next three, off } or { gap: why, others }.
 */
export function pickTexture(catalog, { words = [], tone } = {}) {
  const asked = words.map((word) => String(word).toLowerCase());
  const marked = asked.some((word) => MARKED.test(word));
  const scored = [];
  for (const texture of catalog) {
    if (SPECIAL.test(texture.name) || (!marked && MARKED.test(texture.name))) continue;
    const hits = asked.filter((word) => texture.words.includes(word.replace(MARKED, ""))).length;
    if (asked.length && !hits) continue;
    const off = tone ? Math.hypot(...texture.mean.map((v, k) => v - tone[k])) / Math.sqrt(3) : 0;
    scored.push({ texture, hits, off, score: hits - 2 * off });
  }
  scored.sort((a, b) => b.score - a.score || a.texture.name.localeCompare(b.texture.name));
  const others = scored.slice(1, 4).map(({ texture, off }) => `${texture.name} (${texture.wad}, off ${off.toFixed(2)})`);
  const best = scored[0];
  if (!best) return { gap: `no texture's name holds ${asked.join(" or ") || "anything asked"}`, others: [] };
  if (tone && best.off > TONE_OFF)
    return { gap: `the nearest by its words, ${best.texture.name} (${best.texture.wad}), is ${best.off.toFixed(2)} off the colour asked`, others: [`${best.texture.name} (${best.texture.wad}, off ${best.off.toFixed(2)})`, ...others] };
  return { pick: best.texture, off: best.off, others };
}
