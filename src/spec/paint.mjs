// What a spec's materials look like: the paint of a model's parts by the word for what they are made of, and
// the pictures a map's faces wear, made here so that a map built from a spec needs no game's .wad.
//
// A material is a word or an object: "oak" is not one, "wood" is. { base, tone, rust, seed, flags }:
//   base   one of MATERIALS below
//   tone   [r, g, b] from 0 to 1: the colour it is in (each base has its own unless told)
//   rust   0 to 1: how much of a metal is rusted (iron 0.3, steel 0 unless told)
//   seed   which of its patterns (the same seed, the same grain)
//   flags  the texture's flags in words: "fullbright" (not dimmed by the room: a flame, a lamp's glass),
//          "additive" (a glow), "chrome", "masked"
// Colours are [r, g, b] from 0 to 1, as the workshop's.
import { wood, iron, steel, fbm, noise, mix, times, bell, step } from "../workshop.mjs";
import { colourFromWords } from "./colours.mjs";

/** Each base with the colour it has unless told, in words for the guide. */
export const MATERIALS = {
  wood: { tone: [0.46, 0.32, 0.19], what: "planks, a barrel, a handle" },
  darkwood: { tone: [0.25, 0.16, 0.1], what: "old oak, a dark stained post" },
  iron: { tone: [0.27, 0.26, 0.26], what: "forged and dark: hoops, nails, a stove" },
  steel: { tone: [0.56, 0.56, 0.54], what: "bright and scratched: a blade, a pipe" },
  brass: { tone: [0.72, 0.55, 0.25], what: "yellow metal: a lamp, a fitting" },
  gold: { tone: [0.85, 0.66, 0.2], what: "a crown, a coin" },
  copper: { tone: [0.72, 0.42, 0.25], what: "a kettle, a still" },
  leather: { tone: [0.33, 0.2, 0.11], what: "a strap, a saddle, a bag" },
  cloth: { tone: [0.6, 0.55, 0.45], what: "sacking, a banner, a cushion" },
  stone: { tone: [0.5, 0.49, 0.46], what: "carved or rough stone" },
  brick: { tone: [0.55, 0.27, 0.19], what: "a wall of bricks (maps: laid in courses)" },
  plaster: { tone: [0.78, 0.75, 0.68], what: "a plain wall" },
  tile: { tone: [0.62, 0.6, 0.56], what: "a floor of square tiles" },
  planks: { tone: [0.45, 0.31, 0.18], what: "a floor or a wall of boards (maps)" },
  door: { tone: [0.42, 0.28, 0.16], what: "a panelled wooden door with its handle, one picture 64 by 128 fitted to the leaf (maps)" },
  metal: { tone: [0.4, 0.39, 0.37], what: "plates of metal with seams (maps: a lab, a ship)" },
  grass: { tone: [0.28, 0.42, 0.18], what: "a lawn, a field (maps)" },
  dirt: { tone: [0.4, 0.3, 0.2], what: "bare earth, a path (maps)" },
  glass: { tone: [0.55, 0.7, 0.75], what: "a pane; with fullbright, a lit window" },
  flame: { tone: [1, 0.7, 0.25], what: "a flame or a glowing coal: fullbright on its own" },
  neon: { tone: [1, 0.2, 0.75], what: "a lit tube or sign in its tone: fullbright; in a map it shines (a texture light)" },
  water: { tone: [0.12, 0.2, 0.22], what: "maps: a room's water (`water`), swum in" },
  asphalt: { tone: [0.16, 0.16, 0.18], what: "maps: a wet road, dark and speckled" },
  hazard: { tone: [0.9, 0.72, 0.1], what: "stripes of its tone and black, on a slant: a warning band" },
  paint: { tone: [0.6, 0.15, 0.12], what: "a painted surface in its tone: a sign, a cart" },
  bone: { tone: [0.86, 0.82, 0.7], what: "bone, ivory, a skull" },
  rope: { tone: [0.62, 0.52, 0.34], what: "rope, twine, straw" },
  snow: { tone: [0.92, 0.94, 0.97], what: "snow lying on the ground or a roof" },
  siding: { tone: [0.82, 0.84, 0.8], what: "a house's outside: painted clapboards, laid level (maps: the walls of a building)" },
  shingles: { tone: [0.3, 0.27, 0.25], what: "a roof: rows of shingles, staggered (maps: a building's roof)" },
  mesh: { tone: [0.12, 0.12, 0.12], what: "a net, a wire fence, a grille: a grid of cords in its tone with holes between (masked: seen through). `cell`: the holes' size in units (2); `weave: \"diamond\"` a chain-link's diagonal cords" },
};
/** The colour that stands for a hole in a masked picture until it is made a texture (`HOLE_RGB`). */
export const HOLE_RGB = [1, 0, 1];
/** The flags a base has unless told. */
const BASE_FLAGS = { flame: ["fullbright"], neon: ["fullbright"], mesh: ["masked"] };
/** The texture flags by name, as `render`'s TEXTURE has them. */
export const FLAG_BITS = { flat: 1, chrome: 2, fullbright: 4, additive: 32, masked: 64 };

/** A material as an object, from a word or an object; refuses a base it does not know, in words. */
/** What the kit's pictures light a colour by, on the mean (the stand-in lamp over the judge's views): a colour
 * read off a picture is its paint times this (research/repeated-failures.md, Table 6). */
export const SEEN_LIGHT = 0.8;

/** A colour as given: [r, g, b] (0 to 1), or words ("warm dark grey"): the XKCD names and the modifiers. */
export function colourOfGiven(given, where) {
  if (Array.isArray(given)) return given;
  if (typeof given === "string") {
    const found = colourFromWords(given);
    if (!found) throw new Error(`${where}: no colour named in "${given}" (the XKCD survey's names: grey, teal, brick red...; with dark, light, pale, muted, warm, cool, grimy)`);
    return found.rgb;
  }
  throw new Error(`${where}: [r, g, b] from 0 to 1, or words ("dark warm grey")`);
}

/**
 * The paint of a colour read off a picture: under the kit's stand-in lamp (a colour alone), or under a light
 * that is known (`{ colour, light }`, light a number or [r, g, b]: what a map's preview reports for a face, so
 * that a colour read off a view of the map is divided by the light the map lays there).
 */
function seenPaint(seen, where) {
  if (seen && typeof seen === "object" && !Array.isArray(seen)) {
    const colour = colourOfGiven(seen.colour, `${where}.colour`);
    const light = Array.isArray(seen.light) ? seen.light : [seen.light, seen.light, seen.light];
    if (!light.every((v) => typeof v === "number" && v > 0))
      throw new Error(`${where}.light: the light the colour was seen under, a number or [r, g, b] over 0 (the preview's report gives it)`);
    return colour.map((v, k) => Math.min(1, v / light[k]));
  }
  return colourOfGiven(seen, where).map((v) => Math.min(1, v / SEEN_LIGHT));
}

export function materialOf(given, where = "material") {
  // `glow` (a map's texture light: how bright a lit face shines a unit of its area) is passed on as it is
  const material = typeof given === "string" ? { base: given } : { ...given };
  if (!material.base || !MATERIALS[material.base])
    throw new Error(
      `${where}: no material "${material.base}". The bases are: ${Object.keys(MATERIALS).join(", ")}`,
    );
  return {
    base: material.base,
    // the paint: given as it is (tone), or as it shows in a picture (seen), lit by the kit's stand-in lamp
    tone:
      material.seen !== undefined
        ? seenPaint(material.seen, `${where}.seen`)
        : material.tone !== undefined && material.tone !== null
          ? colourOfGiven(material.tone, `${where}.tone`)
          : MATERIALS[material.base].tone,
    rust: material.rust ?? (material.base === "iron" ? 0.3 : 0),
    seed: material.seed ?? 1,
    flags: material.flags ?? BASE_FLAGS[material.base] ?? [],
    glow: material.glow,
    ...(material.cell !== undefined ? { cell: material.cell } : {}),
    ...(material.weave !== undefined ? { weave: material.weave } : {}),
    // the sizes of a pattern, in texels of the picture: a tile's or a panel's cell ([w, h] or one number), a
    // brick's course and length, a board's width, a hazard stripe's width and slant
    ...Object.fromEntries(["course", "length", "board", "stripe", "angle"].filter((k) => material[k] !== undefined).map((k) => [k, material[k]])),
  };
}

/** The flags of a material as the number a texture holds. */
export const flagsOf = (material) =>
  material.flags.reduce((bits, name) => bits | (FLAG_BITS[name] ?? 0), 0);

/** A colour `k` times as bright, kept to 0..1. */
const shade = (c, k) => c.map((v) => Math.max(0, Math.min(1, v * k)));
/**
 * How much a material's tone differs from its base's own, to carry the workshop's paints over to it. A pattern
 * is about half again as bright as its mean at its brightest, so a tone near white keeps only as much of it as
 * fits under white: scaled up as it is, wood's grain on a white door clips into marble.
 */
const lum = (c) => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
const toned = (colour, base, tone) => {
  const own = MATERIALS[base].tone;
  const keep = Math.min(1, (1 - lum(tone)) / (0.5 * Math.max(0.05, lum(tone))));
  return colour.map((v, i) => Math.max(0, Math.min(1, tone[i] * (1 + keep * (v / (own[i] || 1) - 1)))));
};

/**
 * The colour of a material at a point given in units on its surface: `x` along, `y` across, `light` the
 * painted light (1 plain). The same point always has the same colour.
 */
export function colourAt(material, x, y, light = 1, px = 8) {
  const { base, tone, rust, seed: s } = material;
  const grain = (a, b, n = 3) => fbm(a, b, s, n);
  switch (base) {
    case "mesh": {
      // cords at least a texel and a half wide, holes at least three texels, however coarse the picture
      const cell = Math.max(material.cell ?? 2, 4.5 / px);
      const cord = Math.max(cell * 0.2, 1.5 / px);
      const on = (a) => ((a % cell) + cell) % cell < cord;
      // a diamond weave (chain-link) runs its cords along the diagonals
      const [a, b] = material.weave === "diamond" ? [x + y, x - y] : [x, y];
      return on(a) || on(b) ? shade(tone, light) : HOLE_RGB;
    }
    case "door": {
      // one door on a picture 64 wide and 128 high, y down: a frame, two panels sunk in with their bevels lit
      // from the top left, and a brass handle at hand height on the right (seen from the other side, the left)
      const [u, v] = [((x % 64) + 64) % 64, ((y % 128) + 128) % 128];
      const woodAt = (k) => shade(toned(wood(x * 0.5, y * 0.08, 1, s), "wood", tone), light * k);
      if (Math.hypot(u - 53, v - 68) < 3.2) return shade([0.78, 0.62, 0.3], light * (1.15 - 0.12 * Math.hypot(u - 52, v - 67)));
      for (const [y0, y1] of [[12, 58], [70, 116]]) {
        const [x0, x1] = [11, 53];
        if (u >= x0 && u < x1 && v >= y0 && v < y1) {
          const edge = Math.min(u - x0, x1 - 1 - u, v - y0, y1 - 1 - v);
          if (edge < 2.5) return woodAt(u - x0 < 2.5 || v - y0 < 2.5 ? 0.62 : 1.18);
          return woodAt(0.88);
        }
      }
      // the frame round it, its rim a little darker
      const rim = Math.min(u, 63 - u, v, 127 - v);
      return woodAt(rim < 1.5 ? 0.7 : 1);
    }
    case "wood":
    case "darkwood":
    case "planks":
      return shade(toned(wood(x * 0.5, y * 0.5, 1, s), "wood", tone), light);
    case "iron":
      return shade(toned(iron(x * 0.33, y * 0.33, 1, s, rust - 0.3), "iron", tone), light);
    case "steel":
      return shade(toned(steel(x * 0.4, y * 0.4, 1, s, rust * 2 - 1), "steel", tone), light);
    case "brass":
    case "gold":
    case "copper": {
      // a soft sheen in patches, darker where it is old
      const sheen = 0.85 + 0.3 * (grain(x * 0.3, y * 0.3) - 0.5) + 0.12 * (grain(x * 3, y * 3, 2) - 0.5);
      return shade(tone, sheen * light * (1 - 0.25 * step(0.6, 0.75, grain(x * 0.8, y * 0.8))));
    }
    case "leather": {
      const pores = 0.92 + 0.12 * (noise(x * 9, y * 9, s) - 0.5) + 0.2 * (grain(x * 0.6, y * 0.6) - 0.5);
      return shade(tone, pores * light);
    }
    case "cloth":
    case "rope": {
      // a weave: threads across each way
      // threads too fine to draw at a model's few pixels a unit: a soft mottle, and folds across it
      const weave = 0.92 + 0.03 * Math.sin(x * 9) * Math.sin(y * 9) + 0.16 * (grain(x * 0.5, y * 0.5) - 0.5) + 0.06 * Math.sin(y * 1.3 + 3 * grain(x * 0.2, y * 0.2));
      return shade(tone, weave * light);
    }
    case "stone":
    case "plaster": {
      const rough = base === "stone" ? 0.35 : 0.12;
      const k = 1 + rough * (grain(x * 0.25, y * 0.25, 4) - 0.5) + 0.1 * (noise(x * 4, y * 4, s) - 0.5);
      return shade(tone, k * light);
    }
    case "grass": {
      const blades = 0.85 + 0.3 * (noise(x * 2.5, y * 7, s) - 0.5) + 0.25 * (grain(x * 0.2, y * 0.2) - 0.5);
      return shade(mix(tone, [0.36, 0.33, 0.16], step(0.55, 0.7, grain(x * 0.1, y * 0.1))), blades * light);
    }
    case "dirt": {
      const k = 0.9 + 0.3 * (grain(x * 0.3, y * 0.3, 4) - 0.5) + 0.15 * (noise(x * 5, y * 5, s) - 0.5);
      return shade(tone, k * light);
    }
    case "bone": {
      const k = 0.95 + 0.1 * (grain(x * 0.5, y * 0.5) - 0.5);
      return shade(mix(tone, [0.6, 0.52, 0.38], 0.3 * step(0.55, 0.8, grain(x * 1.5, y * 1.5))), k * light);
    }
    case "neon": {
      // a tube's bright core fading to its tone at the edges of each stroke
      const core = 0.5 + 0.5 * Math.cos(y * 2.4);
      return mix(tone, [1, 1, 1], 0.45 * core * core);
    }
    case "water": {
      const ripple = 0.85 + 0.25 * (grain(x * 0.15, y * 0.4) - 0.5) + 0.1 * Math.sin(x * 0.6 + 4 * grain(x * 0.05, y * 0.05));
      return shade(tone, ripple * light);
    }
    case "hazard": {
      // stripes a unit and a half wide on a slant (or `stripe` wide at `angle` degrees from upright), worn at
      // their edges
      const turn = ((material.angle ?? 45) * Math.PI) / 180;
      const width = material.stripe ?? 1.5 / Math.SQRT2;
      const band = ((((x * Math.cos(turn) + y * Math.sin(turn)) / width) % 2) + 2) % 2;
      const black = band >= 0 && band < 1;
      const k = 0.9 + 0.2 * (grain(x * 0.6, y * 0.6) - 0.5);
      return shade(black ? [0.06, 0.06, 0.06] : tone, k * light);
    }
    case "asphalt": {
      const k = 0.85 + 0.25 * (noise(x * 3, y * 3, s) - 0.5) + 0.3 * step(0.62, 0.72, grain(x * 0.08, y * 0.08));
      return shade(tone, k * light);
    }
    case "glass": {
      const k = 0.9 + 0.2 * bell(((x + y) % 6) - 3, 0.8);
      return shade(tone, k * light);
    }
    case "flame": {
      const k = 0.85 + 0.3 * (grain(x * 1.5, y * 3) - 0.5);
      return shade(mix(tone, [1, 0.95, 0.6], step(0.5, 0.8, grain(x * 0.8, y * 0.8))), k);
    }
    case "siding": {
      // boards 6 high, each lit at its top and shadowed under its lap
      const inBoard = ((y % 6) + 6) % 6 / 6;
      const k = (0.86 + 0.18 * inBoard + 0.06 * (grain(x * 0.3, y * 0.3) - 0.5)) * (inBoard < 0.12 ? 0.62 : 1);
      return shade(tone, k * light);
    }
    case "shingles": {
      // rows 8 high, tabs 12 wide, every other row moved half a tab
      const row = Math.floor(y / 8);
      const along = (((x + (row % 2) * 6) % 12) + 12) % 12;
      const gap = along < 0.8 || ((y % 8) + 8) % 8 > 7.2;
      const k = (0.85 + 0.25 * (noise(Math.floor((x + (row % 2) * 6) / 12), row, s) - 0.5)) * (gap ? 0.5 : 1);
      return shade(tone, k * light);
    }
    default: {
      // paint, metal, tile, brick: their base colour, a little uneven
      const k = 0.94 + 0.12 * (grain(x * 0.4, y * 0.4) - 0.5);
      return shade(tone, k * light);
    }
  }
}

/**
 * A painter for a zone of a model's picture: `fn(u, v)` with `u`, `v` pixels in the zone, as a workshop
 * sheet's `zone` calls it. `px`: pixels a unit there. `round`: the zone wraps round a turned part, the turn
 * running along `round` ("v" when laid along, "u" across), and is lit as a cylinder is.
 */
export function zonePainter(material, zone, px, { round = null } = {}) {
  return (u, v) => {
    const turnShare = round === "v" ? v / zone.h : round === "u" ? u / zone.w : null;
    const light = turnShare === null ? 1 : 0.84 + 0.22 * Math.cos(2 * Math.PI * (turnShare - 0.22));
    return colourAt(material, u / px, v / px, light, px);
  };
}

/**
 * A picture for a map's faces: `size` pixels wide and `height` high (`size` unless told; multiples of 16), seamless
 * when laid side by side, one texel a unit as the map draws it. Bricks, tiles, planks and metal are laid in their
 * courses; the rest are the material's own grain, made to tile. Returns { width, height, rgb }.
 */
export function surfacePicture(given, size = 64, height = size) {
  // a mesh (a fence, a grille): cords and holes laid exactly on the tile, one texel a unit, the holes as
  // see-through pixels (rgba): no seamless blending, which would mix the holes into the cords
  if ((typeof given === "string" ? given : given.base) === "mesh") {
    const material = materialOf(given);
    // the cell made to divide the picture, so that it tiles (a diagonal weave too: x + y comes round with x)
    const cells = Math.max(1, Math.round(Math.min(size, height) / Math.max(material.cell ?? 2, 4.5)));
    const fitted = { ...material, cell: Math.min(size, height) / cells };
    const rgba = new Uint8Array(size * height * 4);
    for (let y = 0; y < height; y++)
      for (let x = 0; x < size; x++) {
        const c = colourAt(fitted, x, y, 0.9 + 0.2 * (fbm(x * 0.3, y * 0.3, material.seed, 2) - 0.5), 1);
        const hole = c.every((v, i) => v === HOLE_RGB[i]);
        rgba.set(hole ? [0, 0, 0, 0] : [...c.map((v) => Math.round(Math.min(1, v) * 255)), 255], (y * size + x) * 4);
      }
    return { width: size, height, rgba };
  }
  const material = materialOf(given);
  const { base, tone, seed: s } = material;
  const rgb = new Uint8Array(size * height * 3);
  // the grain made seamless: four copies of it, each shifted by a whole picture, faded into one another
  const seamless = (x, y) => {
    const a = x / size;
    const b = y / height;
    const at = (dx, dy) => colourAt(material, x - dx, y - dy);
    const c = [at(0, 0), at(size, 0), at(0, height), at(size, height)];
    return c[0].map(
      (_, i) =>
        c[0][i] * (1 - a) * (1 - b) + c[1][i] * a * (1 - b) + c[2][i] * (1 - a) * b + c[3][i] * a * b,
    );
  };
  const mortar = [0.6, 0.58, 0.54];
  // a pattern's size made to divide the picture, so that it tiles: the nearest whole number of them across
  const divide = (wanted, across) => across / Math.max(1, Math.round(across / wanted));
  const cellOf = (given, fallback) => (Array.isArray(given) ? given : [given ?? fallback, given ?? fallback]);
  const [cellW, cellH] = cellOf(material.cell, 32);
  const [cw, ch] = [divide(cellW, size), divide(cellH, height)];
  const courseH = divide(material.course ?? 16, height);
  const brickL = divide(material.length ?? 32, size);
  const boardW = divide(material.board ?? 16, height);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < size; x++) {
      let c = seamless(x, y);
      if (base === "brick") {
        // courses 16 high, bricks 32 long (`course`, `length`), every other course moved half a brick
        const course = Math.floor(y / courseH);
        const shifted = x + (course % 2) * (brickL / 2);
        const along = shifted % brickL;
        const up = y - course * courseH;
        const edge = Math.min(up, courseH - 1 - up, along, brickL - 1 - along);
        const brick = times(c, 0.85 + 0.3 * (noise(Math.floor(shifted / brickL), course, s) - 0.5));
        c = edge < 1.5 ? times(mortar, 0.9 * (0.9 + 0.2 * (noise(x, y, s + 3) - 0.5))) : brick;
      } else if (base === "tile") {
        const [u, v] = [x % cw, y % ch];
        const edge = Math.min(u, cw - 1 - u, v, ch - 1 - v);
        c = edge < 1 ? times(tone, 0.55) : times(c, edge < 3 ? 1.08 : 1);
      } else if (base === "planks") {
        // boards 16 wide along x (`board`), their ends staggered
        const board = Math.floor(y / boardW);
        const end = (x + board * 23) % size;
        const across = y - board * boardW;
        const seam = Math.min(across, boardW - 1 - across) < 1 || end < 1;
        c = times(c, seam ? 0.45 : 0.92 + 0.16 * (noise(board, 0, s) - 0.5));
      } else if (base === "metal") {
        const [u, v] = [x % cw, y % ch];
        const edge = Math.min(u, cw - 1 - u, v, ch - 1 - v);
        const rivet = Math.hypot(u - 4, v - 4) < 1.5;
        c = times(c, edge < 1 ? 0.55 : rivet ? 1.35 : edge < 2 ? 1.15 : 1);
      }
      rgb.set(c.map((v) => Math.max(0, Math.min(255, Math.round(v * 255)))), (y * size + x) * 3);
    }
  return { width: size, height, rgb };
}
