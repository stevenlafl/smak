// A map's picture made from a photograph: a material's detail taken from a reference picture and made to look as
// Valve's do, or the picture itself made a texture. What the procedural paint cannot give (paint.mjs's grit is a
// stand-in) a photograph has: the material's own fine structure, which is what Valve's textures are cut from.
//
//   referencePicture(material, width, height) -> { image: { width, height, rgb }, facts: [sentences] }
//
// The material carries `picture` (an image already read: { width, height, rgb } or rgba), and may carry `rect`
// ([x0, y0, x1, y1] in the picture's pixels), `size` (units of the game the crop spans across, or [w, h]),
// `filter` and `tile`. The filters (FILTERS):
//   valve    the material's detail (the default): the crop's broad light divided out, the rest made to tile, laid
//            one texel a unit at its real size, its colour moved to the material's tone and its grain, patches
//            and colour into the range of Valve's own of that kind (look.mjs). The base's structure (a door's
//            panels, a tile's grout, bricks' courses) is drawn over it by paint.mjs, with no grain of its own.
//   literal  the picture itself: cropped, laid over the texture's size, made to tile only with `tile: true`,
//            nothing else changed (a sign, a poster, a photograph of one wall).
//   aged     the picture's content as literal, its light flattened and its grain, patches, colour and brightness
//            moved into Valve's range: a person's photo made to sit among Valve's textures.
// research/reference-textures.md has the method and the measurements.
import { lookOf, valveFor } from "./look.mjs";

export const FILTERS = ["valve", "literal", "aged"];
/** Units of the game a reference crop spans across unless `size` says: about a photo of that material's surface. */
export const DEFAULT_UNITS = {
  wood: 48, darkwood: 48, planks: 64, door: 48, tile: 64, brick: 96, metal: 96, iron: 64, steel: 64,
  plaster: 96, stone: 96, asphalt: 128, dirt: 128, grass: 128, snow: 128, siding: 96, shingles: 96,
};
/** The most a photo's grain or patches are raised toward Valve's range. */
const GAIN_MOST = 2;
/** The share of a tile's cell given to the cross-fade that makes it come round: a quarter of it. */
const SEAM = 0.25;
/** The broad light of a photo is a blur this share of the crop's shorter side (at least 8 texels). */
const LIGHT_BLUR = 0.18;

const lumOf = (r, g, b) => 0.3 * r + 0.59 * g + 0.11 * b;

/** An image `{ width, height, rgb | rgba }` as three float planes 0 to 1. */
function planesOf(image) {
  const { width: w, height: h } = image;
  const step = image.rgb ? 3 : 4;
  const data = image.rgb ?? image.rgba;
  const planes = [new Float32Array(w * h), new Float32Array(w * h), new Float32Array(w * h)];
  for (let i = 0; i < w * h; i++) for (let c = 0; c < 3; c++) planes[c][i] = data[i * step + c] / 255;
  return { width: w, height: h, planes };
}

/** A region `[x0, y0, x1, y1]` of planes resampled to `tw` by `th`: the mean of the pixels each covers (or between them when enlarged). */
function resample({ width: w, planes }, [x0, y0, x1, y1], tw, th) {
  const out = planes.map(() => new Float32Array(tw * th));
  const [sx, sy] = [(x1 - x0) / tw, (y1 - y0) / th];
  for (let ty = 0; ty < th; ty++)
    for (let tx = 0; tx < tw; tx++) {
      const [ax, ay] = [x0 + tx * sx, y0 + ty * sy];
      if (sx <= 1 && sy <= 1) {
        // enlarged: between the four nearest
        const [fx, fy] = [Math.max(x0, Math.min(x1 - 1, ax + sx / 2 - 0.5)), Math.max(y0, Math.min(Math.max(y0, y1 - 1), ay + sy / 2 - 0.5))];
        const [ix, iy] = [Math.floor(fx), Math.floor(fy)];
        const [jx, jy] = [Math.min(x1 - 1, ix + 1), Math.min(y1 - 1, iy + 1)];
        const [u, v] = [fx - ix, fy - iy];
        for (let c = 0; c < 3; c++) {
          const p = planes[c];
          out[c][ty * tw + tx] = (p[iy * w + ix] * (1 - u) + p[iy * w + jx] * u) * (1 - v) + (p[jy * w + ix] * (1 - u) + p[jy * w + jx] * u) * v;
        }
        continue;
      }
      // made smaller: the mean over the pixels it covers, each weighed by how much of it is covered
      const [bx, by] = [ax + sx, ay + sy];
      const sums = [0, 0, 0];
      let weight = 0;
      for (let y = Math.floor(ay); y < Math.ceil(by); y++) {
        const wy = Math.min(by, y + 1) - Math.max(ay, y);
        for (let x = Math.floor(ax); x < Math.ceil(bx); x++) {
          const wx = Math.min(bx, x + 1) - Math.max(ax, x);
          const k = wx * wy;
          const i = y * w + x;
          sums[0] += planes[0][i] * k;
          sums[1] += planes[1][i] * k;
          sums[2] += planes[2][i] * k;
          weight += k;
        }
      }
      for (let c = 0; c < 3; c++) out[c][ty * tw + tx] = sums[c] / weight;
    }
  return { width: tw, height: th, planes: out };
}

/** A plane blurred by three box blurs of radius `r` (near a Gaussian; `passes` of them), its edges held (or wrapped, `wrap`). */
function blur(plane, w, h, r, wrap = false, passes = 3) {
  r = Math.max(1, Math.round(r));
  let a = Float32Array.from(plane);
  let b = new Float32Array(w * h);
  const at = (i, n) => (wrap ? ((i % n) + n) % n : Math.max(0, Math.min(n - 1, i)));
  for (let pass = 0; pass < passes; pass++) {
    for (let y = 0; y < h; y++) {
      let sum = 0;
      for (let k = -r; k <= r; k++) sum += a[y * w + at(k, w)];
      for (let x = 0; x < w; x++) {
        b[y * w + x] = sum / (2 * r + 1);
        sum += a[y * w + at(x + r + 1, w)] - a[y * w + at(x - r, w)];
      }
    }
    [a, b] = [b, a];
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let k = -r; k <= r; k++) sum += a[at(k, h) * w + x];
      for (let y = 0; y < h; y++) {
        b[y * w + x] = sum / (2 * r + 1);
        sum += a[at(y + r + 1, h) * w + x] - a[at(y - r, h) * w + x];
      }
    }
    [a, b] = [b, a];
  }
  return a;
}

/**
 * The largest rectangle of a picture that is one material: the picture cut into blocks, each block's
 * brightness, colour and contrast held against the median block's, and the largest rectangle of blocks that are
 * like it. A photo of a wall with a skirting, a sky or a shadowed corner at its edge keeps the wall.
 */
export function materialRect(image) {
  const { width: w, height: h } = image;
  const across = Math.min(24, Math.max(4, Math.floor(w / 8)));
  const down = Math.min(24, Math.max(4, Math.round((across * h) / w)));
  const small = resample(planesOf(image), [0, 0, w, h], across * 4, down * 4);
  const blocks = [];
  for (let by = 0; by < down; by++)
    for (let bx = 0; bx < across; bx++) {
      const values = [];
      const colour = [0, 0, 0];
      for (let y = 0; y < 4; y++)
        for (let x = 0; x < 4; x++) {
          const i = (by * 4 + y) * across * 4 + bx * 4 + x;
          values.push(lumOf(small.planes[0][i], small.planes[1][i], small.planes[2][i]));
          for (let c = 0; c < 3; c++) colour[c] += small.planes[c][i] / 16;
        }
      const mean = values.reduce((a, b) => a + b, 0) / 16;
      const spread = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / 16);
      blocks.push({ mean, spread, chroma: colour.map((v) => v / Math.max(0.02, mean)) });
    }
  const median = (list) => [...list].sort((a, b) => a - b)[Math.floor(list.length / 2)];
  const m = { mean: median(blocks.map((b) => b.mean)), spread: median(blocks.map((b) => b.spread)), chroma: [0, 1, 2].map((c) => median(blocks.map((b) => b.chroma[c]))) };
  // like the median block: of its colour, its contrast for its brightness, and a brightness that a photo's light
  // falling off across it can make (a skirting, a sky or a doorway is darker, brighter or another colour)
  const relative = (b) => b.spread / Math.max(0.02, b.mean);
  const mRelative = median(blocks.map(relative));
  const alone = blocks.map(
    (b) =>
      Math.abs(b.mean - m.mean) < 0.5 * m.mean + 0.03 &&
      relative(b) < 2.5 * mRelative + 0.03 &&
      b.chroma.every((v, c) => Math.abs(v - m.chroma[c]) < 0.3),
  );
  // a block unlike the rest among blocks that are like it is the material's own mark (a tie hole in concrete, a
  // knot in a board): it counts as like when five of its eight neighbours are
  const like = alone.map((ok, i) => {
    if (ok) return true;
    const [bx, by] = [i % across, Math.floor(i / across)];
    let near = 0;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const [x, y] = [bx + dx, by + dy];
        if ((dx || dy) && x >= 0 && y >= 0 && x < across && y < down && alone[y * across + x]) near++;
      }
    return near >= 5;
  });
  // the largest rectangle of blocks that are like it: a histogram of heights row by row
  const heights = new Array(across).fill(0);
  let best = { area: 0, x0: 0, y0: 0, x1: across, y1: down };
  for (let y = 0; y < down; y++) {
    for (let x = 0; x < across; x++) heights[x] = like[y * across + x] ? heights[x] + 1 : 0;
    for (let x = 0; x < across; x++) {
      let tallest = Infinity;
      for (let x2 = x; x2 < across && heights[x2]; x2++) {
        tallest = Math.min(tallest, heights[x2]);
        // the largest, a long strip counted for less: it is laid as more copies of a smaller cell
        const [across, down] = [x2 - x + 1, tallest];
        const area = across * down * Math.sqrt(Math.min(across, down) / Math.max(across, down));
        if (area > best.area) best = { area, cells: across * down, x0: x, y0: y - tallest + 1, x1: x2 + 1, y1: y + 1 };
      }
    }
  }
  // too little of it is like the rest (a picture of many things): the whole picture
  if ((best.cells ?? 0) < 0.2 * across * down) return [0, 0, w, h];
  return [Math.round((best.x0 * w) / across), Math.round((best.y0 * h) / down), Math.round((best.x1 * w) / across), Math.round((best.y1 * h) / down)];
}

/**
 * Planes made to come round along x every `cell` texels: the first `margin` texels faded into the texels that
 * follow the cell, so that the cell's last texel goes on into its first. The fade keeps the grain's strength
 * (two pictures half and half are flatter than either: their difference from the mean is put back by the root
 * of the weights' squares). Takes `cell + margin` texels a row and gives `cell`.
 */
function comeRound({ width: w, height: h, planes }, cell, margin, axis) {
  const [ow, oh] = axis === "x" ? [cell, h] : [w, cell];
  const out = planes.map((p) => {
    const mean = p.reduce((a, b) => a + b, 0) / p.length;
    const o = new Float32Array(ow * oh);
    for (let y = 0; y < oh; y++)
      for (let x = 0; x < ow; x++) {
        const along = axis === "x" ? x : y;
        const here = p[y * w + x];
        if (along >= margin) {
          o[y * ow + x] = here;
          continue;
        }
        const after = axis === "x" ? p[y * w + x + cell] : p[(y + cell) * w + x];
        const t = (along + 0.5) / margin;
        const [a, b] = [1 - t, t];
        o[y * ow + x] = mean + (a * (after - mean) + b * (here - mean)) / Math.sqrt(a * a + b * b);
      }
    return o;
  });
  return { width: ow, height: oh, planes: out };
}

/** How many copies of a crop of `units` fit `texels`, as a whole number that divides it, and each copy's size. */
function copiesOf(units, texels) {
  if (units >= texels) return { copies: 1, cell: texels };
  let best = 1;
  for (let n = 1; n <= texels; n++) if (texels % n === 0 && Math.abs(texels / n - units) < Math.abs(texels / best - units)) best = n;
  return { copies: best, cell: texels / best };
}

/** The look of planes, as look.mjs measures a picture. */
const lookOfPlanes = ({ width, height, planes }) => {
  const rgb = new Uint8Array(width * height * 3);
  for (let i = 0; i < width * height; i++) for (let c = 0; c < 3; c++) rgb[i * 3 + c] = Math.max(0, Math.min(255, Math.round(planes[c][i] * 255)));
  return lookOf({ width, height, rgb });
};

/**
 * Planes moved into Valve's range for `base`: the grain (finer than two texels) and the patches (coarser) each
 * scaled until they measure inside the 10th to 90th of Valve's of that kind, a little in from the edge they were
 * past; the colour's spread about its mean scaled likewise, and (with `tone`) the mean colour made the tone's.
 * Without a tone the brightness is moved into Valve's range too. Returns the planes and what was done.
 */
function toValve(picture, base, { tone = null } = {}) {
  const range = valveFor(base);
  const { width: w, height: h, planes } = picture;
  const n = w * h;
  const lum = new Float32Array(n);
  for (let i = 0; i < n; i++) lum[i] = lumOf(planes[0][i], planes[1][i], planes[2][i]);
  const meanLum = Math.max(0.02, lum.reduce((a, b) => a + b, 0) / n);
  // each texel's colour as its share of its own brightness, about the picture's mean share
  const share = planes.map((p) => {
    const s = new Float32Array(n);
    for (let i = 0; i < n; i++) s[i] = p[i] / Math.max(0.02, lum[i]);
    return s;
  });
  const meanShare = share.map((s) => s.reduce((a, b) => a + b, 0) / n);
  const soft = blur(lum, w, h, 1, true);
  // the grain (finer than the soft brightness), and the same grain blurred by a texel: a photo cut down a long
  // way can come out with grain that is noise texel by texel, which a share of the blurred one makes alike again
  const grain = new Float32Array(n);
  for (let i = 0; i < n; i++) grain[i] = lum[i] - soft[i];
  const grainSoft = blur(grain, w, h, 1, true, 1);
  const targetLum = tone ? lumOf(...tone) : meanLum;
  // with no tone (aged), the picture's own mean colour, drawn toward grey where it is more coloured than Valve's
  let toward = 1;
  // the brightness: the tone's, or (with none) the picture's own kept to Valve's range
  const bright = tone ? targetLum : Math.max(range.bright[0], Math.min(range.bright[2], meanLum));
  let alike = 0;
  const colourOf = (fine, coarse, chroma) => {
    const out = planes.map(() => new Float32Array(n));
    for (let i = 0; i < n; i++) {
      const g = (1 - alike) * grain[i] + alike * grainSoft[i];
      const l = bright * (1 + coarse * (soft[i] / meanLum - 1) + fine * (g / meanLum));
      for (let c = 0; c < 3; c++) {
        const hue = tone ? tone[c] / Math.max(0.02, targetLum) : 1 + toward * (meanShare[c] - 1);
        // with a tone, the photo's colour as a difference from its own mean, weighed down in its dark texels: a
        // ratio to a brown photo's small blue share made its grey gaps and dark streaks bright blue on a sofa's
        // wood (2026-10-15), where a dark gap's colour is barely there to see
        const own = tone
          ? hue + chroma * Math.min(1, lum[i] / meanLum) * (share[c][i] - meanShare[c])
          : hue * (1 + chroma * (share[c][i] / Math.max(0.02, meanShare[c]) - 1));
        out[c][i] = Math.max(0, Math.min(1, l * own));
      }
    }
    return { width: w, height: h, planes: out };
  };
  // patches 16 texels across are measured over a cell of 48 or more; a smaller cell repeats too soon to have any
  const patches = Math.min(w, h) >= 48;
  const inside = (v, [lo, , hi]) => (v < lo ? lo * 1.15 : v > hi ? hi * 0.9 : v);
  // raised no more than twice: a smooth photo (painted planks) raised fourfold made its few flakes of rust black
  // streaks across a door (Steven, 2026-10-15); left smoother than Valve's, it reads as clean paint
  const held = (k) => Math.max(0.25, Math.min(GAIN_MOST, k));
  let [fine, coarse, chroma] = [1, 1, 1];
  let result;
  for (alike = 0; alike <= 1; alike += 0.25) {
    [fine, coarse, chroma, toward] = [1, 1, 1, 1];
    result = colourOf(fine, coarse, chroma);
    for (let round = 0; round < 5; round++) {
      const look = lookOfPlanes(result);
      const want = { fine: inside(look.fine, range.fine), coarse: patches ? inside(look.coarse, range.coarse) : look.coarse, colour: Math.min(look.colour, range.colour[2] * 0.9) };
      if (Math.abs(want.fine - look.fine) < 0.004 && Math.abs(want.coarse - look.coarse) < 0.004 && look.colour <= want.colour + 0.004) break;
      fine = held(fine * (want.fine / Math.max(1e-4, look.fine)));
      coarse = held(coarse * (want.coarse / Math.max(1e-4, look.coarse)));
      if (look.colour > want.colour + 0.004) {
        if (!tone) {
          // an aged picture: all of its colour drawn toward grey alike, so a red frame stays redder than its beige
          // panels (its content), only less coloured
          toward *= want.colour / look.colour;
          chroma *= want.colour / look.colour;
        } else {
          // the spread over the tone's own colour scaled down by the share of it that is too much; the tone is kept
          const plain = lookOfPlanes(colourOf(fine, coarse, 0)).colour;
          chroma *= Math.max(0, (want.colour - plain) / Math.max(1e-4, look.colour - plain));
        }
      }
      result = colourOf(fine, coarse, chroma);
    }
    // grain as alike from texel to texel as a tenth of Valve's of that kind at least (and over noise's): done
    if (lookOfPlanes(result).structure >= Math.max(0.05, range.structure[0])) break;
  }
  return { picture: result, gains: { fine, coarse, chroma, alike: Math.min(1, alike) } };
}

/** Planes as an image { width, height, rgb } of bytes. */
const imageOf = ({ width, height, planes }) => {
  const rgb = new Uint8Array(width * height * 3);
  for (let i = 0; i < width * height; i++) for (let c = 0; c < 3; c++) rgb[i * 3 + c] = Math.max(0, Math.min(255, Math.round(planes[c][i] * 255)));
  return { width, height, rgb };
};

/** The photo's broad light divided out: each texel over a large blur of the brightness, at `strength` (1 all). */
function flattened({ width: w, height: h, planes }, radius, strength = 1) {
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) lum[i] = lumOf(planes[0][i], planes[1][i], planes[2][i]);
  const broad = blur(lum, w, h, radius);
  const mean = lum.reduce((a, b) => a + b, 0) / (w * h);
  const out = planes.map((p) => {
    const o = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) o[i] = p[i] * (1 + strength * (mean / Math.max(0.02, broad[i]) - 1));
    return o;
  });
  return { width: w, height: h, planes: out };
}

/** The crop, in the picture's pixels: `rect` as given (held to the picture), or the largest region of the material. */
function cropOf(material, image) {
  if (material.rect) {
    const [x0, y0, x1, y1] = material.rect;
    const held = [Math.max(0, Math.min(image.width - 1, Math.round(x0))), Math.max(0, Math.min(image.height - 1, Math.round(y0)))];
    return [held[0], held[1], Math.max(held[0] + 1, Math.min(image.width, Math.round(x1))), Math.max(held[1] + 1, Math.min(image.height, Math.round(y1)))];
  }
  return material.filter === "valve" || !material.filter ? materialRect(image) : [0, 0, image.width, image.height];
}

/**
 * A crop laid over `width` by `height` texels as a cell to repeat, coming round when `tile`: { cell, copies }.
 * `prepare` is done to the crop once it is at its size in texels, before the cell is cut from it.
 */
function laid(source, crop, width, height, unitsAcross, tile, prepare = (planes) => planes) {
  const [cw, ch] = [crop[2] - crop[0], crop[3] - crop[1]];
  const units = Array.isArray(unitsAcross) ? unitsAcross : [unitsAcross, (unitsAcross * ch) / cw];
  const [ax, ay] = [copiesOf(units[0], width), copiesOf(units[1], height)];
  if (!tile) {
    // as it is, the crop stretched over the cell, the cell repeated
    const cell = prepare(resample(source, crop, ax.cell, ay.cell));
    return { cell, copies: [ax.copies, ay.copies] };
  }
  // a margin past the cell on each axis for the fade; the crop is laid at its real size where it is larger than
  // the cell and the margin, and stretched to them where it is smaller
  const [mx, my] = [Math.max(2, Math.round(ax.cell * SEAM)), Math.max(2, Math.round(ay.cell * SEAM))];
  const [needW, needH] = [ax.cell + mx, ay.cell + my];
  const [sw, sh] = [Math.max(needW, Math.round(ax.copies === 1 ? units[0] : needW)), Math.max(needH, Math.round(ay.copies === 1 ? units[1] : needH))];
  const scaled = prepare(resample(source, crop, sw, sh));
  // the middle of the scaled crop: its edges are where a photo's lens and light are worst
  const [ox, oy] = [Math.floor((sw - needW) / 2), Math.floor((sh - needH) / 2)];
  const windowed = { width: needW, height: needH, planes: scaled.planes.map((p) => {
    const o = new Float32Array(needW * needH);
    for (let y = 0; y < needH; y++) o.set(p.subarray((oy + y) * sw + ox, (oy + y) * sw + ox + needW), y * needW);
    return o;
  }) };
  const cell = comeRound(comeRound(windowed, ax.cell, mx, "x"), ay.cell, my, "y");
  return { cell, copies: [ax.copies, ay.copies] };
}

/** The cell repeated over the whole texture. */
function repeated({ width: cw, height: ch, planes }, width, height) {
  return { width, height, planes: planes.map((p) => {
    const o = new Float32Array(width * height);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) o[y * width + x] = p[(y % ch) * cw + (x % cw)];
    return o;
  }) };
}

/**
 * The picture of a material with a `picture`, `width` by `height` texels: { image, facts }. `image.rgb` is the
 * detail for the valve filter (the base's structure goes over it in paint.mjs), the whole texture for the others.
 */
export function referencePicture(material, width, height) {
  const image = material.picture;
  if (!image || typeof image !== "object" || !image.width || !(image.rgb || image.rgba))
    throw new Error(`picture: ${typeof image === "string" ? `${image} was not read (a spec's pictures are read by the build)` : "not a picture"}`);
  const filter = material.filter ?? "valve";
  const crop = cropOf({ ...material, filter }, image);
  const source = planesOf(image);
  const facts = [];
  const [cw, ch] = [crop[2] - crop[0], crop[3] - crop[1]];
  const said = `${cw}x${ch} of the picture${material.rect ? "" : crop[2] - crop[0] === image.width && crop[3] - crop[1] === image.height ? "" : ` at ${crop[0]},${crop[1]} (the largest part of it that is one material)`}`;
  if (filter === "literal" || filter === "aged") {
    // the crop over the whole texture, unless `size` makes it smaller and repeated
    const units = material.size ?? [width, height];
    let { cell, copies } = laid(source, crop, width, height, units, Boolean(material.tile));
    if (filter === "aged") {
      cell = flattened(cell, Math.max(8, Math.min(cell.width, cell.height) * LIGHT_BLUR * 2), 0.6);
      const matched = toValve(cell, material.base);
      cell = matched.picture;
      facts.push(`aged: grain x${matched.gains.fine.toFixed(2)}, patches x${matched.gains.coarse.toFixed(2)}, colour x${matched.gains.chroma.toFixed(2)} to sit in Valve's range`);
    }
    facts.unshift(`${filter}: ${said}${copies[0] * copies[1] > 1 ? `, ${copies[0]} by ${copies[1]} times` : ""}${material.tile ? ", made to tile" : ""}`);
    return { image: imageOf(repeated(cell, width, height)), facts };
  }
  // valve: the detail at its real size, come round, matched
  const units = material.size ?? DEFAULT_UNITS[material.base] ?? 96;
  // the photo's broad light divided out over the whole crop at its size in texels, before the cell is cut
  const { cell, copies } = laid(source, crop, width, height, units, true, (scaled) => flattened(scaled, Math.max(8, Math.min(scaled.width, scaled.height) * LIGHT_BLUR)));
  const matched = toValve(cell, material.base, { tone: material.tone });
  const unitsSaid = Array.isArray(units) ? `${units[0]} by ${units[1]}` : `${units} across`;
  facts.push(
    `valve: ${said}, as ${unitsSaid} units${copies[0] * copies[1] > 1 ? `, ${copies[0]} by ${copies[1]} times` : ""}; its light divided out, made to tile; grain x${matched.gains.fine.toFixed(2)}${matched.gains.alike ? ` (softened ${matched.gains.alike})` : ""}, patches x${matched.gains.coarse.toFixed(2)}, colour x${matched.gains.chroma.toFixed(2)} into Valve's range`,
  );
  // a cell repeated: paint.mjs lays the base's patches over the whole texture, so the repeat is not a grid
  return { image: imageOf(repeated(matched.picture, width, height)), facts, repeats: copies[0] * copies[1] > 1 };
}
