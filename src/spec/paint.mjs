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
//   picture  a map's picture from a photograph (reference.mjs): its path (read by the build) or an image, with
//          `filter` ("valve", "literal", "aged"), `rect` [x0, y0, x1, y1], `size` (units across, or [w, h]),
//          `tile`
// Colours are [r, g, b] from 0 to 1, as the workshop's.
import { wood, iron, steel, fbm, noise, rand, smooth, mix, times, bell, step } from "../workshop.mjs";
import { colourFromWords } from "./colours.mjs";
import { referencePicture, FILTERS, DEFAULT_UNITS } from "./reference.mjs";

/**
 * Each base with the colour it has unless told, in words for the guide. A map's plain surfaces (plaster, siding,
 * brick, grass) are no brighter or more coloured than nine in ten of Valve's walls and floors (src/spec/look.mjs);
 * wood, iron and steel keep theirs, since a given tone is painted as its share of them.
 */
export const MATERIALS = {
  flat: { tone: [0.5, 0.5, 0.5], what: "one plain colour and nothing on it, as the game's own BLACK and YELLOW are: give its tone" },
  wood: { tone: [0.46, 0.32, 0.19], what: "planks, a barrel, a handle" },
  leaves: { tone: [0.2, 0.27, 0.12], what: "a tree's crown or a bush on cards: leaves with holes between, seen through" },
  darkwood: { tone: [0.25, 0.16, 0.1], what: "old oak, a dark stained post" },
  iron: { tone: [0.27, 0.26, 0.26], what: "forged and dark: hoops, nails, a stove" },
  steel: { tone: [0.56, 0.56, 0.54], what: "bright and scratched: a blade, a pipe" },
  brass: { tone: [0.72, 0.55, 0.25], what: "yellow metal: a lamp, a fitting" },
  gold: { tone: [0.85, 0.66, 0.2], what: "a crown, a coin" },
  copper: { tone: [0.72, 0.42, 0.25], what: "a kettle, a still" },
  leather: { tone: [0.33, 0.2, 0.11], what: "a strap, a saddle, a bag" },
  cloth: { tone: [0.6, 0.55, 0.45], what: "sacking, a banner, a cushion" },
  stone: { tone: [0.5, 0.49, 0.46], what: "carved or rough stone" },
  brick: { tone: [0.51, 0.285, 0.22], what: "a wall of bricks (maps: laid in courses)" },
  plaster: { tone: [0.56, 0.54, 0.49], what: "a plain wall" },
  tile: { tone: [0.62, 0.6, 0.56], what: "a floor of square tiles" },
  planks: { tone: [0.45, 0.31, 0.18], what: "a floor or a wall of boards (maps)" },
  door: { tone: [0.42, 0.28, 0.16], what: "a panelled wooden door with its handle, one picture 64 by 128 fitted to the leaf (maps)" },
  metal: { tone: [0.4, 0.39, 0.37], what: "plates of metal with seams (maps: a lab, a ship)" },
  grass: { tone: [0.29, 0.41, 0.21], what: "a lawn, a field (maps)" },
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
  siding: { tone: [0.62, 0.64, 0.61], what: "a house's outside: painted clapboards, laid level (maps: the walls of a building)" },
  shingles: { tone: [0.3, 0.27, 0.25], what: "a roof: rows of shingles, staggered (maps: a building's roof)" },
  mesh: { tone: [0.12, 0.12, 0.12], what: "a net, a wire fence, a grille: a grid of cords in its tone with holes between (masked: seen through). `cell`: the holes' size in units (2); `weave: \"diamond\"` a chain-link's diagonal cords" },
};
/** The colour that stands for a hole in a masked picture until it is made a texture (`HOLE_RGB`). */
export const HOLE_RGB = [1, 0, 1];
/** The flags a base has unless told. */
const BASE_FLAGS = { flame: ["fullbright"], neon: ["fullbright"], mesh: ["masked"], leaves: ["masked"] };
/** The texture flags by name, as `render`'s TEXTURE has them. */
export const FLAG_BITS = { flat: 1, chrome: 2, fullbright: 4, additive: 32, masked: 64 };

/** A material as an object, from a word or an object; refuses a base it does not know, in words. */
/** What the kit's pictures light a colour by, on the mean (the stand-in lamp over the judge's views): a colour
 * read off a picture is its paint times this (research/repeated-failures.md, Table 6). */
export const SEEN_LIGHT = 0.8;

/** A colour as given: [r, g, b] (0 to 1), or words ("warm dark grey"): the XKCD names and the modifiers. */
/**
 * What is wrong with a colour given as numbers: three, each 0 to 1. Null when nothing is. A colour of 0 to 255
 * (the way a picture program writes one) is told so: taken as it is, it paints 255 times too bright.
 */
export function rgbFault(given) {
  if (!Array.isArray(given) || given.length !== 3 || !given.every((v) => typeof v === "number" && Number.isFinite(v))) return "[r, g, b], three numbers from 0 to 1";
  if (given.some((v) => v < 0)) return `[r, g, b] from 0 to 1, not ${JSON.stringify(given)}`;
  if (given.some((v) => v > 1))
    return `[r, g, b] from 0 to 1, not ${JSON.stringify(given)}: ${given.every((v) => v <= 255) ? `as 0 to 255 it is ${JSON.stringify(given.map((v) => Math.round((v / 255) * 1000) / 1000))}` : "each 1 at most"}`;
  return null;
}

export function colourOfGiven(given, where) {
  if (Array.isArray(given)) {
    const fault = rgbFault(given);
    if (fault) throw new Error(`${where}: ${fault}`);
    return given;
  }
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
    ...(material.picture !== undefined ? pictureOf(material, where) : {}),
    // a model's photographed material, made once by photoMaterial
    ...(material.tiled ? { tiled: material.tiled } : {}),
  };
}

/** A material's picture and how it is used, checked: { picture, filter, rect, size, tile }. */
function pictureOf(material, where) {
  const { picture, filter = "valve", rect, size, tile } = material;
  const isImage = picture && typeof picture === "object" && picture.width > 0 && (picture.rgb || picture.rgba);
  if (!(typeof picture === "string" && picture) && !isImage)
    throw new Error(`${where}.picture: a picture file of the work folder or beside the spec ("work:refs/plaster.jpg"; PNG, BMP or JPEG)`);
  if (material.base === "mesh") throw new Error(`${where}.picture: a mesh is its cords and holes; give a picture to another base`);
  if (material.base === "flat") throw new Error(`${where}.picture: a flat colour is its tone alone; give a picture to another base`);
  if (!FILTERS.includes(filter)) throw new Error(`${where}.filter: one of ${FILTERS.join(", ")} ("${filter}" is not)`);
  const number = (v) => typeof v === "number" && Number.isFinite(v);
  if (rect !== undefined && !(Array.isArray(rect) && rect.length === 4 && rect.every(number) && rect[2] > rect[0] && rect[3] > rect[1]))
    throw new Error(`${where}.rect: [x0, y0, x1, y1], the part of the picture to take, in its pixels`);
  if (size !== undefined && !(number(size) ? size > 0 : Array.isArray(size) && size.length === 2 && size.every((v) => number(v) && v > 0)))
    throw new Error(`${where}.size: the units of the game the picture's part spans across (a door 36, a wall 96), or [width, height]`);
  if (tile !== undefined && typeof tile !== "boolean") throw new Error(`${where}.tile: true or false`);
  return { picture, filter, ...(rect ? { rect } : {}), ...(size !== undefined ? { size } : {}), ...(tile !== undefined ? { tile } : {}) };
}

/** The flags of a material as the number a texture holds. */
export const flagsOf = (material) =>
  material.flags.reduce((bits, name) => bits | (FLAG_BITS[name] ?? 0), 0);

/** A door this light is taken as painted (a white or cream door), unless the material says `painted`. */
const PAINTED_LIGHT = 0.45;
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
/** Texels a unit a model's photographed material is made at. */
const PHOTO_TEXELS = 4;

/**
 * A model's material with a photograph (`picture`): its detail made as a map's is (reference.mjs: `valve` matched to
 * Valve's range in the material's tone, or `literal`, `aged`), at PHOTO_TEXELS a unit and made to tile, kept as
 * `tiled` for colourAt. The picture is read by `read` when it is a name.
 */
export function photoMaterial(given, read, facts = []) {
  const material = materialOf(given);
  const picture = typeof material.picture === "string" ? read(material.picture) : material.picture;
  const units = material.size ?? DEFAULT_UNITS[material.base] ?? 96;
  const scaled = Array.isArray(units) ? units.map((u) => u * PHOTO_TEXELS) : units * PHOTO_TEXELS;
  const side = 256;
  const made = referencePicture({ ...material, picture, size: scaled, tile: true }, side, side);
  facts.push(`material ${material.base}${typeof given.picture === "string" ? ` (${given.picture})` : ""}: ${made.facts.join("; ")}, at ${PHOTO_TEXELS} texels a unit`);
  const { picture: _, ...rest } = material;
  return { ...rest, tiled: made.image };
}

/** A tiled picture { width, height, rgb } read at (x, y) texels, between its texels, wrapping. */
function tiledAt(image, x, y) {
  const { width: w, height: h, rgb } = image;
  const [x0, y0] = [Math.floor(x), Math.floor(y)];
  const [fx, fy] = [x - x0, y - y0];
  const at = (xx, yy, c) => rgb[((((yy % h) + h) % h) * w + (((xx % w) + w) % w)) * 3 + c] / 255;
  return [0, 1, 2].map((c) => (at(x0, y0, c) * (1 - fx) + at(x0 + 1, y0, c) * fx) * (1 - fy) + (at(x0, y0 + 1, c) * (1 - fx) + at(x0 + 1, y0 + 1, c) * fx) * fy);
}

export function colourAt(material, x, y, light = 1, px = 8) {
  if (material.tiled) return tiledAt(material.tiled, x * PHOTO_TEXELS, y * PHOTO_TEXELS).map((v) => v * light);
  const { base, tone, rust, seed: s } = material;
  const grain = (a, b, n = 3) => fbm(a, b, s, n);
  // noise finer than a pixel is static, not grain: at a map's texel a unit (px 1) it is kept to a quarter, and
  // the map's picture has a grit of its own two to four texels across (surfacePicture)
  const sub = Math.min(1, px / 4);
  // wood's grain at `k` units a step (or [along, across]); at a map's texel a unit its light and dark lines
  // twice as far apart in brightness, about their mean, as Valve's boards have them (their wood is the grainiest
  // of their surfaces: research/texture-stats.mjs), where the workshop's grain was made for a model's finer pixels
  const boards = (x, y, k, px) => {
    const [ka, kb] = Array.isArray(k) ? k : [k, k];
    const c = wood(x * ka, y * kb, 1, s);
    if (px >= 4) return c;
    // about the grain's own mean, so the tone stays the tone
    const mean = woodMean(s);
    return c.map((v, i) => Math.max(0, mean[i] + WOOD_LINES * (v - mean[i])));
  };
  switch (base) {
    case "leaves": {
      // leaves on two jittered grids, one over the other, each a pointed blade turned its own way, the holes
      // between them see-through (a masked texture): how Valve's and every GoldSrc tree is made, on crossed cards.
      // A leaf at least six texels long, however coarse the picture; `cell` its size in units (2.5), `fill` the
      // share of places that hold one (0.75)
      const cell = Math.max(material.cell ?? 2.5, 6 / px);
      const fill = material.fill ?? 0.75;
      let hit = null;
      for (let layer = 0; layer < 2; layer++) {
        const off = layer * 0.5 * cell;
        const [gx, gy] = [Math.floor((x + off) / cell), Math.floor((y + off) / cell)];
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const [cx, cy] = [gx + dx, gy + dy];
            const mx = (cx + 0.2 + 0.6 * rand(cx, cy, s + 63 + layer)) * cell - off;
            const my = (cy + 0.2 + 0.6 * rand(cx, cy, s + 65 + layer)) * cell - off;
            // on a crown's card (`crown`: its size in units), fewer leaves toward an egg inside its edge, none past
            // it, the egg's outline broken by noise so that the crown is round and ragged, not a rectangle
            let here = fill;
            if (material.crown) {
              const [cw, ch] = material.crown;
              const d = Math.hypot((mx - cw / 2) / (cw / 2 - cell), (my - ch / 2) / (ch / 2 - cell)) + 0.35 * (fbm(mx * 0.08, my * 0.08, s + 71, 2) - 0.5);
              here *= Math.max(0, Math.min(1, (1 - d) / 0.35));
            }
            if (rand(cx, cy, s + 61 + layer) > here) continue;
            const turn = Math.PI * rand(cx, cy, s + 67 + layer);
            const [ax, ay] = [Math.cos(turn), Math.sin(turn)];
            const along = ((x - mx) * ax + (y - my) * ay) / (0.62 * cell);
            const across = (-(x - mx) * ay + (y - my) * ax) / (0.26 * cell);
            if (Math.abs(along) >= 1 || Math.abs(across) >= 1 - along * along) continue;
            hit = { own: 0.72 + 0.5 * rand(cx, cy, s + 69 + layer), side: across, rib: Math.abs(across) < 0.12, top: layer };
          }
      }
      if (!hit) return HOLE_RGB;
      // each leaf its own shade, the upper layer a little lighter, one side of the midrib lit, the rib darker
      const shadeOf = hit.own * (hit.top ? 1.08 : 0.86) * (1 + 0.12 * hit.side) * (hit.rib ? 0.8 : 1);
      return shade(tone, light * shadeOf);
    }
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
      // one door on a picture 64 wide and 128 high, y down: a frame of stiles and rails round two panels sunk in
      // with their bevels lit from the top left, and a brass handle at hand height on the right (seen from the
      // other side, the left). Wood is fine grain along each piece, up the stiles and panels and across the
      // rails, each piece a little its own tone, as boards are; a painted door (a pale tone, or `painted`) is flat
      // paint with only a brush's faint streaks. Not mottled: Steven saw the old blotches as noise, not grain
      const [u, v] = [((x % 64) + 64) % 64, ((y % 128) + 128) % 128];
      if (Math.hypot(u - 53, v - 68) < 3.2) return shade([0.78, 0.62, 0.3], light * (1.15 - 0.12 * Math.hypot(u - 52, v - 67)));
      const panel = [[12, 58], [70, 116]].findIndex(([y0, y1]) => u >= 11 && u < 53 && v >= y0 && v < y1);
      const stile = panel < 0 && (u < 11 || u >= 53);
      // which piece, and which way its grain runs: along v (up) for stiles and panels, along u for the rails
      const piece = panel >= 0 ? 10 + panel : stile ? (u < 11 ? 1 : 2) : v < 12 ? 3 : v < 70 ? 4 : 5;
      const [along, across] = panel >= 0 || stile ? [y, x] : [x, y];
      const painted = material.painted ?? lum(tone) > PAINTED_LIGHT;
      const own = 1 + (painted ? 0.02 : 0.13) * (rand(piece, 0, s + 31) - 0.5) * 2;
      // where a door is worn, as Valve's photographed doors are: hands round the handle, feet along the bottom
      const handled = Math.max(0, 1 - Math.hypot(u - 52, v - 68) / 14);
      const kicked = Math.max(0, 1 - (127 - v) / 22);
      const worn = 1 - (painted ? 0.16 : 0.12) * handled - (painted ? 0.14 : 0.1) * kicked * (0.6 + 0.4 * fbm(x * 0.2, y * 0.3, s + 13, 2));
      let surface;
      if (material.surface) surface = material.surface(x, y);
      else if (painted) surface = shade(tone, own * worn * (1 + 0.04 * (noise(along * 0.05, across * 0.9, s + 7) - 0.5) * 2));
      else {
        // the grain: lines about three texels apart, gently wavy along the piece, with finer fibres between
        const lines = 0.5 + 0.5 * Math.sin(across * 1.9 + 2.2 * fbm(along * 0.03, across * 0.25, s + 3, 2) * Math.PI);
        const fibres = noise(along * 0.12, across * 1.7, s + 5);
        surface = shade(tone, own * worn * (1 + 0.32 * (lines - 0.5) + 0.2 * (fibres - 0.5)));
      }
      const woodAt = (k) => shade(surface, light * k);
      if (panel >= 0) {
        const [y0, y1] = [[12, 58], [70, 116]][panel];
        const edge = Math.min(u - 11, 52 - u, v - y0, y1 - 1 - v);
        if (edge < 2.5) return woodAt(u - 11 < 2.5 || v - y0 < 2.5 ? 0.62 : 1.18);
        return woodAt(0.88);
      }
      // the frame round it, its rim a little darker
      const rim = Math.min(u, 63 - u, v, 127 - v);
      return woodAt(rim < 1.5 ? 0.7 : 1);
    }
    case "wood":
    case "darkwood":
    case "planks": {
      // at a map's texel a unit the grain's lines are drawn wider apart, about five texels, as a photographed
      // board cut down to that size shows them; at half a unit they came a texel and a half apart, which the
      // texels cannot hold and drew as static
      return shade(toned(boards(x, y, px < 4 ? 0.2 : 0.5, px), "wood", tone), light);
    }
    case "iron": {
      // its pits are a third of a unit apart: at a map's texel a unit, drawn larger, or they are static
      const k = px < 4 ? 0.12 : 0.33;
      return shade(toned(iron(x * k, y * k, 1, s, rust - 0.3), "iron", tone), light);
    }
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
      const pores = 0.92 + 0.12 * sub * (noise(x * 9, y * 9, s) - 0.5) + 0.2 * (grain(x * 0.6, y * 0.6) - 0.5);
      return shade(tone, pores * light);
    }
    case "cloth":
    case "rope": {
      // a weave: threads across each way
      // threads too fine to draw at a model's few pixels a unit: a soft mottle, and folds across it
      const weave = 0.92 + 0.03 * sub * Math.sin(x * 9) * Math.sin(y * 9) + 0.16 * (grain(x * 0.5, y * 0.5) - 0.5) + 0.06 * Math.sin(y * 1.3 + 3 * grain(x * 0.2, y * 0.2));
      return shade(tone, weave * light);
    }
    case "stone":
    case "plaster": {
      const rough = base === "stone" ? 0.35 : 0.12;
      const k = 1 + rough * (grain(x * 0.25, y * 0.25, 4) - 0.5) + 0.1 * sub * (noise(x * 4, y * 4, s) - 0.5);
      return shade(tone, k * light);
    }
    case "grass": {
      const blades = 0.85 + 0.3 * sub * (noise(x * 2.5, y * 7, s) - 0.5) + 0.25 * (grain(x * 0.2, y * 0.2) - 0.5);
      return shade(mix(tone, [0.36, 0.33, 0.16], step(0.55, 0.7, grain(x * 0.1, y * 0.1))), blades * light);
    }
    case "dirt": {
      const k = 0.9 + 0.3 * (grain(x * 0.3, y * 0.3, 4) - 0.5) + 0.15 * sub * (noise(x * 5, y * 5, s) - 0.5);
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
      const k = 0.85 + 0.25 * sub * (noise(x * 3, y * 3, s) - 0.5) + 0.3 * step(0.62, 0.72, grain(x * 0.08, y * 0.08));
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
      const k = (0.86 + 0.18 * inBoard + 0.06 * (grain(x * 0.3, y * 0.3) - 0.5)) * (inBoard < Math.max(0.12, 1.2 / 6 / Math.max(1, px)) ? 0.62 : 1);
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
/**
 * Smooth noise that comes round exactly every `w` by `h` texels: lumps `cell` texels across, then three finer
 * layers, each half as strong. 0 to 1, about 0.5 on the whole.
 */
function roundNoise(x, y, w, h, cell, s) {
  let sum = 0;
  let total = 0;
  for (let k = 0, strength = 1; k < 3; k++, strength *= 0.5) {
    const size = cell / 2 ** k;
    const [px, py] = [Math.max(1, Math.round(w / size)), Math.max(1, Math.round(h / size))];
    const [u, v] = [(x / w) * px, (y / h) * py];
    const [xi, yi] = [Math.floor(u), Math.floor(v)];
    const [fx, fy] = [smooth(u - xi), smooth(v - yi)];
    const at = (i, j) => rand(((i % px) + px) % px, ((j % py) + py) % py, s + 31 * k);
    const [a, b, c, d] = [at(xi, yi), at(xi + 1, yi), at(xi, yi + 1), at(xi + 1, yi + 1)];
    sum += strength * (a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy);
    total += strength;
  }
  return sum / total;
}

/**
 * Bases a map's picture is left even on: light passes through or comes out of them, or they move.
 */
export const UNWORN = new Set(["glass", "flame", "neon", "water", "flat"]);
/**
 * How much a used surface varies, as Valve's walls and floors do (research/texture-stats.mjs: 347 of
 * halflife.wad's): patches 16 to 64 texels across a little lighter and darker (`MOTTLE`), each tile or panel a
 * tone of its own (`CELL_TONE`), and grain texel by texel (`GRAIN`). Even, the kit's pictures were flatter than
 * nine in ten of Valve's, which Steven saw as cheap.
 */
const MOTTLE = 0.3;
/** How much more a map's wood shows its grain than a model's (above). */
const WOOD_LINES = 2.2;
/** The mean colour of the workshop's wood of a seed, over a board's worth of it: what its grain is spread about. */
const woodMeans = new Map();
function woodMean(s) {
  if (!woodMeans.has(s)) {
    const sum = [0, 0, 0];
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) wood(x * 0.5, y * 0.5, 1, s).forEach((v, i) => (sum[i] += v / 4096));
    woodMeans.set(s, sum);
  }
  return woodMeans.get(s);
}
const CELL_TONE = 0.1;
const GRAIN = 0.3;
/** Where in a texel a map's picture is sampled, four times, and averaged. */
const SUBTEXEL = [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]];
/** Of the grain, the share that is grit two to four texels across; the rest is a texel's own. */
const GRIT = 0.8;

/**
 * Value noise that comes round exactly every `w` by `h` texels, in cells about `cell` texels across, joined
 * smoothly: -1 to 1, about 0 on the whole.
 */
function cellNoise(x, y, w, h, cell, s) {
  const [px, py] = [Math.max(1, Math.round(w / cell)), Math.max(1, Math.round(h / cell))];
  const [u, v] = [(x / w) * px, (y / h) * py];
  const [xi, yi] = [Math.floor(u), Math.floor(v)];
  const [fx, fy] = [smooth(u - xi), smooth(v - yi)];
  const at = (i, j) => rand(((i % px) + px) % px, ((j % py) + py) % py, s);
  const [a, b, c, d] = [at(xi, yi), at(xi + 1, yi), at(xi, yi + 1), at(xi + 1, yi + 1)];
  return 2 * (a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy) - 1;
}

/**
 * The grain of a used surface at a texel, -1 to 1: grit in specks two and three and a half texels across (what
 * a photographed wall cut down to a texel a unit shows: a texel is like its neighbours), and a little of each
 * texel's own. Pure noise texel by texel, as it was, measured as Valve's grain and looked like static
 * (research/reference-textures.md).
 */
function grit(x, y, w, h, s) {
  // value noise between its cells is softer than at them: the two sizes together reach about 0.3 apart
  const specks = 0.65 * cellNoise(x, y, w, h, 2, s) + 0.55 * cellNoise(x, y, w, h, 3.5, s + 7);
  return GRIT * specks + (1 - GRIT) * (rand(x, y, s + 13) * 2 - 1);
}

export function surfacePicture(given, size = 64, height = size, { readPicture } = {}) {
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
  let material = materialOf(given);
  const { base, tone, seed: s } = material;
  // a picture from a photograph: the whole texture (literal, aged), or the material's detail under its structure
  let detail = null;
  let repeats = false;
  const facts = [];
  if (material.picture) {
    if (typeof material.picture === "string") {
      if (!readPicture) throw new Error(`picture ${material.picture}: not read (a spec's pictures are read by its build: buildMapSpec, buildWadSpec)`);
      material = { ...material, picture: readPicture(material.picture) };
    }
    const made = referencePicture(material, size, height);
    if (material.filter !== "valve") return { ...made.image, facts: made.facts };
    facts.push(...made.facts);
    // the texel a point is nearest (the supersampled points of a texel round to it, so the detail stays sharp)
    const at = (x, y) => {
      const i = ((((Math.round(y) % height) + height) % height) * size + (((Math.round(x) % size) + size) % size)) * 3;
      return [made.image.rgb[i] / 255, made.image.rgb[i + 1] / 255, made.image.rgb[i + 2] / 255];
    };
    detail = at;
    repeats = made.repeats;
    material = { ...material, surface: at };
  }
  const rgb = new Uint8Array(size * height * 3);
  // the grain made seamless: four copies of it, each shifted by a whole picture, faded into one another
  const seamless = (x, y) => {
    const a = x / size;
    const b = y / height;
    // each texel the mean of four points inside it: a pattern finer than a texel is its average, not a
    // value picked at random from it
    const at = (dx, dy) => {
      const sum = [0, 0, 0];
      for (const [ox, oy] of SUBTEXEL) colourAt(material, x - dx + ox, y - dy + oy, 1, 1).forEach((v, i) => (sum[i] += v / SUBTEXEL.length));
      return sum;
    };
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
      // the picture's detail where one is given (a door's is under its panels, drawn by colourAt)
      // a flat colour is its tone and nothing else, as the game's own BLACK and YELLOW are
      let c = base === "flat" ? tone : detail && base !== "door" ? detail(x, y) : seamless(x, y);
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
        // grout, then each tile's bevel lit from the top left and in shadow at the bottom right
        const [u, v] = [x % cw, y % ch];
        const edge = Math.min(u, cw - 1 - u, v, ch - 1 - v);
        const own = 1 + CELL_TONE * (rand(Math.floor(x / cw), Math.floor(y / ch), s + 5) - 0.5) * 2;
        const bevel = u < 2 || v < 2 ? 1.12 : cw - 1 - u < 2 || ch - 1 - v < 2 ? 0.86 : 1;
        c = edge < 1 ? times(tone, 0.5) : times(c, own * bevel);
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
        const own = 1 + CELL_TONE * (rand(Math.floor(x / cw), Math.floor(y / ch), s + 5) - 0.5) * 2;
        const bevel = u < 2 || v < 2 ? 1.15 : cw - 1 - u < 2 || ch - 1 - v < 2 ? 0.82 : 1;
        c = times(c, edge < 1 ? 0.55 : rivet ? 1.35 : own * bevel);
      }
      // a used surface's patches and grain, unless a photograph gives them (its patches, where it repeats)
      if (!UNWORN.has(base) && !detail && base !== "door") {
        const patch = roundNoise(x, y, size, height, 32, s + 17);
        c = times(c, (1 + MOTTLE * (patch - 0.5) * 2) * (1 + GRAIN * grit(x, y, size, height, s + 23)));
      } else if (!UNWORN.has(base) && repeats) {
        // a photograph smaller than the texture repeats: the patches go over the whole of it, so the copies differ
        c = times(c, 1 + MOTTLE * (roundNoise(x, y, size, height, 32, s + 17) - 0.5) * 2);
      }
      rgb.set(c.map((v) => Math.max(0, Math.min(255, Math.round(v * 255)))), (y * size + x) * 3);
    }
  return { width: size, height, rgb, ...(facts.length ? { facts } : {}) };
}
