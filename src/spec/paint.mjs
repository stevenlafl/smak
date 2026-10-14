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

/** Each base with the colour it has unless told, in words for the guide. */
export const MATERIALS = {
  wood: { tone: [0.46, 0.32, 0.19], what: "planks, a barrel, a handle" },
  darkwood: { tone: [0.25, 0.16, 0.1], what: "old oak, a dark stained post" },
  iron: { tone: [0.27, 0.26, 0.26], what: "forged and dark: hoops, nails, a stove" },
  steel: { tone: [0.6, 0.61, 0.63], what: "bright and scratched: a blade, a pipe" },
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
  metal: { tone: [0.42, 0.44, 0.47], what: "plates of metal with seams (maps: a lab, a ship)" },
  grass: { tone: [0.28, 0.42, 0.18], what: "a lawn, a field (maps)" },
  dirt: { tone: [0.4, 0.3, 0.2], what: "bare earth, a path (maps)" },
  glass: { tone: [0.55, 0.7, 0.75], what: "a pane; with fullbright, a lit window" },
  flame: { tone: [1, 0.7, 0.25], what: "a flame or a glowing coal: fullbright on its own" },
  paint: { tone: [0.6, 0.15, 0.12], what: "a painted surface in its tone: a sign, a cart" },
  bone: { tone: [0.86, 0.82, 0.7], what: "bone, ivory, a skull" },
  rope: { tone: [0.62, 0.52, 0.34], what: "rope, twine, straw" },
};
/** The flags a base has unless told. */
const BASE_FLAGS = { flame: ["fullbright"] };
/** The texture flags by name, as `render`'s TEXTURE has them. */
export const FLAG_BITS = { flat: 1, chrome: 2, fullbright: 4, additive: 32, masked: 64 };

/** A material as an object, from a word or an object; refuses a base it does not know, in words. */
export function materialOf(given, where = "material") {
  const material = typeof given === "string" ? { base: given } : { ...given };
  if (!material.base || !MATERIALS[material.base])
    throw new Error(
      `${where}: no material "${material.base}". The bases are: ${Object.keys(MATERIALS).join(", ")}`,
    );
  return {
    base: material.base,
    tone: material.tone ?? MATERIALS[material.base].tone,
    rust: material.rust ?? (material.base === "iron" ? 0.3 : 0),
    seed: material.seed ?? 1,
    flags: material.flags ?? BASE_FLAGS[material.base] ?? [],
  };
}

/** The flags of a material as the number a texture holds. */
export const flagsOf = (material) =>
  material.flags.reduce((bits, name) => bits | (FLAG_BITS[name] ?? 0), 0);

/** A colour `k` times as bright, kept to 0..1. */
const shade = (c, k) => c.map((v) => Math.max(0, Math.min(1, v * k)));
/** How much a material's tone differs from its base's own, to carry the workshop's paints over to it. */
const toned = (colour, base, tone) => colour.map((v, i) => v * (tone[i] / (MATERIALS[base].tone[i] || 1)));

/**
 * The colour of a material at a point given in units on its surface: `x` along, `y` across, `light` the
 * painted light (1 plain). The same point always has the same colour.
 */
export function colourAt(material, x, y, light = 1) {
  const { base, tone, rust, seed: s } = material;
  const grain = (a, b, n = 3) => fbm(a, b, s, n);
  switch (base) {
    case "wood":
    case "darkwood":
    case "planks":
      return toned(wood(x * 0.5, y * 0.5, light, s), "wood", tone);
    case "iron":
      return toned(iron(x * 0.33, y * 0.33, light, s, rust - 0.3), "iron", tone);
    case "steel":
      return toned(steel(x * 0.4, y * 0.4, light, s, rust * 2 - 1), "steel", tone);
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
      const weave = 0.9 + 0.08 * Math.sin(x * 9) * Math.sin(y * 9) + 0.18 * (grain(x * 0.5, y * 0.5) - 0.5);
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
    case "glass": {
      const k = 0.9 + 0.2 * bell(((x + y) % 6) - 3, 0.8);
      return shade(tone, k * light);
    }
    case "flame": {
      const k = 0.85 + 0.3 * (grain(x * 1.5, y * 3) - 0.5);
      return shade(mix(tone, [1, 0.95, 0.6], step(0.5, 0.8, grain(x * 0.8, y * 0.8))), k);
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
    return colourAt(material, u / px, v / px, light);
  };
}

/**
 * A picture for a map's faces: `size` pixels a side (a multiple of 16), seamless when laid side by side, one
 * texel a unit as the map draws it. Bricks, tiles, planks and metal are laid in their courses; the rest are
 * the material's own grain, made to tile. Returns { width, height, rgb }.
 */
export function surfacePicture(given, size = 64) {
  const material = materialOf(given);
  const { base, tone, seed: s } = material;
  const rgb = new Uint8Array(size * size * 3);
  // the grain made seamless: four copies of it, each shifted by a whole picture, faded into one another
  const seamless = (x, y) => {
    const a = x / size;
    const b = y / size;
    const at = (dx, dy) => colourAt(material, x - dx, y - dy);
    const c = [at(0, 0), at(size, 0), at(0, size), at(size, size)];
    return c[0].map(
      (_, i) =>
        c[0][i] * (1 - a) * (1 - b) + c[1][i] * a * (1 - b) + c[2][i] * (1 - a) * b + c[3][i] * a * b,
    );
  };
  const mortar = [0.6, 0.58, 0.54];
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let c = seamless(x, y);
      if (base === "brick") {
        // courses 16 high, bricks 32 long, every other course moved half a brick
        const course = Math.floor(y / 16);
        const along = (x + (course % 2) * 16) % 32;
        const edge = Math.min(y % 16, 15 - (y % 16), along, 31 - along);
        const brick = times(c, 0.85 + 0.3 * (noise(Math.floor((x + (course % 2) * 16) / 32), course, s) - 0.5));
        c = edge < 1.5 ? times(mortar, 0.9 * (0.9 + 0.2 * (noise(x, y, s + 3) - 0.5))) : brick;
      } else if (base === "tile") {
        const edge = Math.min(x % 32, 31 - (x % 32), y % 32, 31 - (y % 32));
        c = edge < 1 ? times(tone, 0.55) : times(c, edge < 3 ? 1.08 : 1);
      } else if (base === "planks") {
        // boards 16 wide along x, their ends staggered
        const board = Math.floor(y / 16);
        const end = (x + board * 23) % size;
        const seam = Math.min(y % 16, 15 - (y % 16)) < 1 || end < 1;
        c = times(c, seam ? 0.45 : 0.92 + 0.16 * (noise(board, 0, s) - 0.5));
      } else if (base === "metal") {
        const edge = Math.min(x % 32, 31 - (x % 32), y % 32, 31 - (y % 32));
        const rivet = Math.hypot((x % 32) - 4, (y % 32) - 4) < 1.5;
        c = times(c, edge < 1 ? 0.55 : rivet ? 1.35 : edge < 2 ? 1.15 : 1);
      }
      rgb.set(c.map((v) => Math.max(0, Math.min(255, Math.round(v * 255)))), (y * size + x) * 3);
    }
  return { width: size, height: size, rgb };
}
