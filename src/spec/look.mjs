// How a texture for a map looks beside Valve's: four numbers measured from its picture, held against what 347 of
// halflife.wad's walls, floors, ceilings and roofs measure. The kit's own pictures were flatter than nine in ten of
// Valve's and Steven, walking a map, found them cheap; this is the measure that says so before anyone walks it.
// research/texture-stats.mjs measures VALVE again from a person's own halflife.wad.

/**
 * Valve's walls and floors, the 10th, 50th and 90th of each measure (research/texture-stats.mjs, 2026-10-14):
 * `fine`, the grain texel by texel, and `coarse`, how much patches 16 texels across differ, each as a share of
 * the picture's brightness; `colour`, how coloured it is (a pixel's highest channel less its lowest, 0 to 1);
 * `bright`, its brightness (0 to 1).
 */
export const VALVE = {
  fine: [0.052, 0.125, 0.26],
  coarse: [0.023, 0.109, 0.339],
  colour: [0.025, 0.076, 0.184],
  bright: [0.18, 0.332, 0.57],
};

/** The four measures of a picture `{ width, height, rgb }` (or `rgba`). */
export function lookOf({ width: w, height: h, rgb, rgba }) {
  const step = rgb ? 3 : 4;
  const data = rgb ?? rgba;
  const lum = new Float64Array(w * h);
  let colour = 0;
  for (let i = 0; i < w * h; i++) {
    const [r, g, b] = [data[i * step], data[i * step + 1], data[i * step + 2]];
    lum[i] = (0.3 * r + 0.59 * g + 0.11 * b) / 255;
    colour += (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
  }
  const bright = lum.reduce((a, b) => a + b, 0) / (w * h);
  // the grain: each texel against the mean of the nine about it, the picture taken as repeating
  let fine = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let around = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) around += lum[((y + dy + h) % h) * w + ((x + dx + w) % w)];
      fine += (lum[y * w + x] - around / 9) ** 2;
    }
  // the patches: the means of blocks 16 across, and how far they spread
  const B = 16;
  const blocks = [];
  for (let by = 0; by + B <= h; by += B)
    for (let bx = 0; bx + B <= w; bx += B) {
      let sum = 0;
      for (let y = by; y < by + B; y++) for (let x = bx; x < bx + B; x++) sum += lum[y * w + x];
      blocks.push(sum / (B * B));
    }
  const mean = blocks.reduce((a, b) => a + b, 0) / Math.max(1, blocks.length);
  const coarse = blocks.length > 1 ? Math.sqrt(blocks.reduce((a, b) => a + (b - mean) ** 2, 0) / blocks.length) : 0;
  const share = (v) => v / Math.max(0.02, bright);
  return { fine: share(Math.sqrt(fine / (w * h))), coarse: share(coarse), colour: colour / (w * h), bright };
}

/**
 * What of a picture's look is past nine in ten of Valve's: a list of short phrases, empty when nothing is.
 * Too even (both the grain and the patches under Valve's 10th) reads as cheap; more coloured or brighter than
 * Valve's 90th washes out or glares under a map's light.
 */
export function lookFaults(look, allow = []) {
  const said = [];
  if (look.fine < VALVE.fine[0] && look.coarse < VALVE.coarse[0]) said.push("too even (no grain, no patches)");
  else if (look.fine < VALVE.fine[0]) said.push("no grain");
  else if (look.coarse < VALVE.coarse[0]) said.push("no patches");
  if (look.colour > VALVE.colour[2] && !allow.includes("colour")) said.push(`more coloured (${look.colour.toFixed(2)}; Valve's ${VALVE.colour[1]})`);
  if (look.bright > VALVE.bright[2] && !allow.includes("bright")) said.push(`brighter (${look.bright.toFixed(2)}; Valve's ${VALVE.bright[1]})`);
  return said;
}

/**
 * What a base may be past Valve's in: snow is bright and Valve has none to measure against; leather, rope and metals that are
 * coloured by what they are, and signs, paint and warning stripes, are coloured on purpose.
 */
export const ALLOWED = { snow: ["bright"], bone: ["bright"], leather: ["colour"], rope: ["colour"], brass: ["colour"], gold: ["colour", "bright"], copper: ["colour"], paint: ["colour"], hazard: ["colour"] };

/**
 * One sentence for a report on a set of pictures `[{ name, image, allow }]` (`allow`: what it may be past
 * Valve's in, as ALLOWED), or null when each looks as Valve's do.
 */
export function lookSentence(pictures, what = "textures") {
  const off = pictures.map(({ name, image, allow }) => ({ name, said: lookFaults(lookOf(image), allow) })).filter((p) => p.said.length);
  if (!off.length) return null;
  return `${off.length} ${what} look unlike nine in ten of Valve's walls and floors: ${off.map((p) => `${p.name} ${p.said.join(", ")}`).join("; ")}: give a plain one a pattern, wear or grime, and a colour or a brightness nearer Valve's (docs/SPEC.md, "Materials")`;
}
