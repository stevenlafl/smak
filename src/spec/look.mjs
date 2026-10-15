// How a texture for a map looks beside Valve's: five numbers measured from its picture, held against what 347 of
// halflife.wad's walls, floors, ceilings and roofs measure, and against each kind of them (wood, concrete, metal,
// tile, ground, doors). The kit's own pictures were flatter than nine in ten of Valve's and Steven, walking a map, found
// them cheap; this is the measure that says so before anyone walks it. research/texture-stats.mjs measures
// VALVE and VALVE_KINDS again from a person's own halflife.wad.
//
// A trap, and why `structure` is here (research/reference-textures.md): `fine` alone was met by a random value
// texel by texel, which Steven saw on a walked map as static, not as plaster. Valve's pictures are photographs
// cut down: their fine detail is the material's own (a pore, a grain line, a speck of grit two or three texels
// across), so a texel is like its neighbours. White noise is not, and it measures the same `fine`. A measure
// that white noise can satisfy is not measuring what Valve's textures have; `structure` is the one it fails.

/**
 * Valve's walls and floors, the 10th, 50th and 90th of each measure (research/texture-stats.mjs, 2026-10-14):
 * `fine`, the grain texel by texel, and `coarse`, how much patches 16 texels across differ, each as a share of
 * the picture's brightness; `colour`, how coloured it is (a pixel's highest channel less its lowest, 0 to 1);
 * `bright`, its brightness (0 to 1); `structure`, how much a texel's grain is like its neighbours' (the
 * correlation of the grain one texel apart: about -0.17 for white noise, over 0 where the grain is the
 * material's own detail).
 */
export const VALVE = {
  fine: [0.052, 0.125, 0.26],
  coarse: [0.023, 0.109, 0.339],
  colour: [0.025, 0.076, 0.184],
  bright: [0.18, 0.332, 0.57],
  structure: [0.021, 0.174, 0.328],
};

/** Each kind of Valve's surfaces by the words in their names (`--names` lists what each counts). */
export const KIND_NAMES = {
  wood: /CRATE|WOOD|TABLE|OUT_WD/,
  concrete: /CRETE|PAVE|PAV3|STAIN_|WET_WALL|WET_CEIL|OUT_CON|CON1_/,
  metal: /METAL|MTL|DUCT|STEEL|GALV|GRATE/,
  tile: /TILE|LABFLR|LAB1_FLR|LAB1_FLOOR|LINO/,
  ground: /DIRT|GRVL|GRAVEL|GRND|MUD|OUT_SND|OUT_RK|ROCK(?!ET)/,
  door: /DOOR|_DR\d|DR\d|_DR$|DR\d?[A-Z]$/,
};

/** The same five measures over each kind (research/texture-stats.mjs, 2026-10-14; the count after each). */
export const VALVE_KINDS = {
  wood: { fine: [0.099, 0.224, 0.352], coarse: [0.082, 0.157, 0.486], colour: [0.055, 0.167, 0.303], bright: [0.158, 0.29, 0.542], structure: [0.176, 0.229, 0.301] }, // 56
  concrete: { fine: [0.044, 0.123, 0.267], coarse: [0.029, 0.07, 0.232], colour: [0.022, 0.054, 0.135], bright: [0.178, 0.29, 0.422], structure: [0.017, 0.204, 0.321] }, // 53
  metal: { fine: [0.037, 0.233, 0.402], coarse: [0.032, 0.101, 0.242], colour: [0.024, 0.047, 0.112], bright: [0.114, 0.19, 0.493], structure: [-0.091, 0.253, 0.41] }, // 34
  tile: { fine: [0.044, 0.085, 0.178], coarse: [0.011, 0.041, 0.415], colour: [0.028, 0.109, 0.212], bright: [0.199, 0.296, 0.443], structure: [-0.041, 0.158, 0.229] }, // 28
  ground: { fine: [0.053, 0.129, 0.145], coarse: [0.042, 0.073, 0.115], colour: [0.082, 0.152, 0.172], bright: [0.265, 0.414, 0.57], structure: [-0.002, 0.146, 0.282] }, // 15
  door: { fine: [0.077, 0.157, 0.259], coarse: [0.07, 0.18, 0.499], colour: [0.034, 0.081, 0.278], bright: [0.172, 0.318, 0.545], structure: [0.115, 0.24, 0.303] }, // 90
};

/** The kind of Valve's surfaces a base of the kit's is held against, or null for all of them. */
const BASE_KIND = {
  wood: "wood", darkwood: "wood", planks: "wood", door: "door",
  plaster: "concrete", stone: "concrete", asphalt: "concrete",
  iron: "metal", steel: "metal", metal: "metal", brass: "metal", gold: "metal", copper: "metal",
  tile: "tile",
  dirt: "ground", grass: "ground", snow: "ground",
};
export const kindOf = (base) => BASE_KIND[base] ?? null;
/** Valve's ranges for a base: those of its kind, or of all their surfaces. */
export const valveFor = (base) => VALVE_KINDS[kindOf(base)] ?? VALVE;

/** The five measures of a picture `{ width, height, rgb }` (or `rgba`). */
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
  const grain = new Float64Array(w * h);
  let fine = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let around = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) around += lum[((y + dy + h) % h) * w + ((x + dx + w) % w)];
      grain[y * w + x] = lum[y * w + x] - around / 9;
      fine += grain[y * w + x] ** 2;
    }
  // how much the grain at a texel is like the grain one texel right and one down
  let alike = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) alike += (grain[y * w + x] * (grain[y * w + ((x + 1) % w)] + grain[((y + 1) % h) * w + x])) / 2;
  const structure = fine > 1e-9 ? alike / fine : 0;
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
  return { fine: share(Math.sqrt(fine / (w * h))), coarse: share(coarse), colour: colour / (w * h), bright, structure };
}

/**
 * What of a picture's look is past nine in ten of Valve's: a list of short phrases, empty when nothing is.
 * Too even (both the grain and the patches under Valve's 10th) reads as cheap; grain that is noise (no more like
 * its neighbours than Valve's 10th) reads as static; more coloured or brighter than Valve's 90th washes out or
 * glares under a map's light.
 */
export function lookFaults(look, allow = [], base = null) {
  const said = [];
  // grain and patches against the base's own kind where it has one (Valve's wood is far grainier than their
  // concrete); colour and brightness against all of them, since a tone is the person's (a kind more coloured
  // than the rest, as their wood is, allows that much)
  const kind = valveFor(base);
  if (look.fine < kind.fine[0] && look.coarse < kind.coarse[0]) said.push("too even (no grain, no patches)");
  else if (look.fine < kind.fine[0]) said.push(`little grain (${look.fine.toFixed(3)}; Valve's ${kind === VALVE ? "" : `${kindOf(base)} `}${kind.fine[1]})`);
  else if (look.coarse < kind.coarse[0]) said.push("no patches");
  if (look.fine >= VALVE.fine[0] && look.structure < VALVE.structure[0] && !allow.includes("structure"))
    said.push(`grain that is noise, not the material's (${look.structure.toFixed(2)} alike; Valve's ${VALVE.structure[1]})`);
  // colour past the 90th of all of Valve's surfaces and of its own kind's both (their wood is more coloured)
  const colourful = kind.colour[2] > VALVE.colour[2] ? kind : VALVE;
  if (look.colour > colourful.colour[2] && !allow.includes("colour")) said.push(`more coloured (${look.colour.toFixed(2)}; Valve's ${colourful === VALVE ? "" : `${kindOf(base)} `}${colourful.colour[1]})`);
  if (look.bright > VALVE.bright[2] && !allow.includes("bright")) said.push(`brighter (${look.bright.toFixed(2)}; Valve's ${VALVE.bright[1]})`);
  return said;
}

/**
 * What a base may be past Valve's in: snow is bright and Valve has none to measure against; leather, rope and metals that are
 * coloured by what they are, and signs, paint and warning stripes, are coloured on purpose; a warning stripe a
 * texel or two wide is sharp edges, not grain.
 */
export const ALLOWED = { snow: ["bright"], bone: ["bright"], leather: ["colour"], rope: ["colour"], brass: ["colour"], gold: ["colour", "bright"], copper: ["colour"], paint: ["colour"], hazard: ["colour", "structure"] };

/**
 * One sentence for a report on a set of pictures `[{ name, image, allow }]` (`allow`: what it may be past
 * Valve's in, as ALLOWED), or null when each looks as Valve's do.
 */
export function lookSentence(pictures, what = "textures") {
  const off = pictures.map(({ name, image, allow, base }) => ({ name, said: lookFaults(lookOf(image), allow, base) })).filter((p) => p.said.length);
  if (!off.length) return null;
  return `${off.length} ${what} look unlike nine in ten of Valve's walls and floors: ${off.map((p) => `${p.name} ${p.said.join(", ")}`).join("; ")}: give a plain one a pattern, wear or grime, or its detail from a photograph (\`picture\`), and a colour or a brightness nearer Valve's (docs/SPEC.md, "Materials")`;
}

/** Above this brightness (0 to 1) a texel is near white; over this colour (highest channel less lowest) vivid. */
const WHITE_OVER = 0.75;
const VIVID_OVER = 0.5;

/**
 * The two measures a model's picture is held to beside lookOf's: `whites`, the share of its texels near white,
 * and `vivid`, the share strongly coloured. A model's picture is many small things on one sheet, so its mean
 * brightness and colour can sit in Valve's range while half of it is a clean white fridge or a row of toy-red
 * boxes: the shares see that.
 */
export function modelLookOf(rgba, step = 4) {
  let whites = 0;
  let vivid = 0;
  let n = 0;
  for (let i = 0; i < rgba.length; i += step) {
    if (step === 4 && rgba[i + 3] < 128) continue;
    n++;
    const [r, g, b] = [rgba[i] / 255, rgba[i + 1] / 255, rgba[i + 2] / 255];
    if (0.3 * r + 0.59 * g + 0.11 * b > WHITE_OVER) whites++;
    if (Math.max(r, g, b) - Math.min(r, g, b) > VIVID_OVER) vivid++;
  }
  return { whites: whites / (n || 1), vivid: vivid / (n || 1) };
}

/**
 * Valve's model textures, the 10th, 50th and 90th of each measure over 287 textures of 93 of Half-Life's models
 * (research/model-texture-stats.mjs, 2026-10-15; first-person files and chrome left out).
 */
export const VALVE_MODELS = {
  fine: [0.048, 0.147, 0.358],
  coarse: [0.053, 0.18, 0.463],
  colour: [0.014, 0.133, 0.351],
  bright: [0.146, 0.317, 0.607],
  structure: [0.069, 0.198, 0.304],
  whites: [0, 0.005, 0.227],
  vivid: [0, 0, 0.3],
};
