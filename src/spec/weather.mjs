// Weathering for a map's textures: what makes a wall a used wall and not a fill of one colour. Each layer
// tiles with the texture (its noise repeats exactly once across the picture), so the wall it is laid on
// shows no seam. A texture's `wear` names the layers and how much of each, 0 to 1:
//
//   stains     blotches a few across the picture, darker and lighter (a multiply of 0.75 to 1.25)
//   streaks    dirt run down the wall in thin lines, strongest under the top
//   cracks     a few cracks on the borders of random cells (Worley's), a dark line with a light one above
//   scratches  short light marks at random angles
//   speckle    grit: specks two and three and a half texels across, what Valve's concrete has and a smooth fill
//              has not (a random value a texel, as it was, measured as grain and read as static:
//              research/reference-textures.md)
//   seed       another pattern of the same
//
// Made from the failure research (research/asset-reproduction-failures.md, section 5): Valve's concrete has a
// fine detail (mean of the texel-to-texel difference) of 25 to 38, the first replacements 2 to 10. Worley, "A
// cellular texture basis function", SIGGRAPH 1996; Perlin, "An image synthesizer", SIGGRAPH 1985.
//
//   weather(image, wear) -> the image, weathered in place ({ width, height, rgb })
//   WEAR_LAYERS: the layers' names

export const WEAR_LAYERS = ["stains", "streaks", "cracks", "scratches", "speckle"];

/** A number from 0 to 1, the same for the same whole numbers. */
function hash(x, y, s) {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const ease = (t) => t * t * (3 - 2 * t);
const wrap = (v, n) => ((v % n) + n) % n;

/** Smooth noise that repeats every `px` lumps across and `py` down: 0 to 1. */
function tiled(x, y, px, py, s) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = ease(x - xi);
  const fy = ease(y - yi);
  const at = (i, j) => hash(wrap(i, px), wrap(j, py), s);
  const a = at(xi, yi);
  const b = at(xi + 1, yi);
  const c = at(xi, yi + 1);
  const d = at(xi + 1, yi + 1);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

/** Layers of tiled noise, each twice as fine: 0 to 1. `u`, `v` 0 to 1 across the picture. */
function tiledFbm(u, v, across, down, s, octaves = 4) {
  let sum = 0;
  let strength = 0.5;
  let total = 0;
  for (let i = 0; i < octaves; i++) {
    const kx = across * 2 ** i;
    const ky = down * 2 ** i;
    sum += strength * tiled(u * kx, v * ky, kx, ky, s + i * 13);
    total += strength;
    strength *= 0.5;
  }
  return sum / total;
}

/** The two nearest of a jittered point per cell, cells repeating: [F1, F2] in cells. */
function worley(u, v, cells, s) {
  const x = u * cells;
  const y = v * cells;
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  let f1 = Infinity;
  let f2 = Infinity;
  for (let j = -1; j <= 1; j++)
    for (let i = -1; i <= 1; i++) {
      const cx = xi + i;
      const cy = yi + j;
      const px = cx + hash(wrap(cx, cells), wrap(cy, cells), s);
      const py = cy + hash(wrap(cx, cells), wrap(cy, cells), s + 7);
      const d = Math.hypot(x - px, y - py);
      if (d < f1) [f1, f2] = [d, f1];
      else if (d < f2) f2 = d;
    }
  return [f1, f2];
}

/** Each layer's amount from what was given, 0 to 1. */
export function wearOf(wear) {
  const out = {};
  for (const name of WEAR_LAYERS) out[name] = Math.max(0, Math.min(1, Number(wear?.[name] ?? 0)));
  return out;
}

/** The picture weathered, in place: `image` is `{ width, height, rgb }`. */
export function weather(image, wear) {
  const { width, height, rgb } = image;
  const w = wearOf(wear);
  const s = (wear?.seed ?? 1) * 101;
  // the cracks' line: where a texel is within a texel of a cell border (F2 - F1, in texels)
  const cells = Math.max(2, Math.round(Math.min(width, height) / 48));
  const cellTexels = Math.min(width, height) / cells;
  const crackAt = (x, y) => {
    const [f1, f2] = worley(x / width, y / height, cells, s + 3);
    // broken up along its length: a crack does not run round every cell
    const keep = tiledFbm(x / width, y / height, cells * 2, cells * 2, s + 4, 2) > 0.5;
    return keep ? (f2 - f1) * cellTexels : Infinity;
  };
  // scratches: short segments, a few a hundred texels square
  const scratches = [];
  const count = Math.round(w.scratches * (width * height) / 900);
  for (let i = 0; i < count; i++) {
    const a = hash(i, 1, s + 9) * Math.PI;
    scratches.push({ x: hash(i, 2, s + 9) * width, y: hash(i, 3, s + 9) * height, dx: Math.cos(a), dy: Math.sin(a), length: 3 + hash(i, 4, s + 9) * 9 });
  }
  const scratched = (x, y) =>
    scratches.some((c) => {
      // the nearest of the segment's copies across the picture's edges
      const ox = wrap(x - c.x + width / 2, width) - width / 2;
      const oy = wrap(y - c.y + height / 2, height) - height / 2;
      const t = ox * c.dx + oy * c.dy;
      return t >= 0 && t <= c.length && Math.abs(ox * c.dy - oy * c.dx) < 0.6;
    });
  const out = new Float32Array(width * height * 3);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const v = y / height;
      let k = 1;
      if (w.stains) k *= 1 + w.stains * 0.7 * (tiledFbm(u, v, 3, 3, s + 1, 4) - 0.5);
      if (w.streaks) {
        const line = tiledFbm(u, v, 24, 1, s + 2, 3);
        const fromTop = 1 - v * 0.6;
        k *= 1 - w.streaks * 0.35 * Math.max(0, line - 0.45) * 2.2 * fromTop;
      }
      if (w.speckle) {
        const fine = tiledFbm(u, v, Math.round(width / 2), Math.round(height / 2), s + 5, 1) - 0.5;
        const coarse = tiledFbm(u, v, Math.round(width / 3.5), Math.round(height / 3.5), s + 6, 1) - 0.5;
        k *= 1 + w.speckle * (0.62 * fine + 0.46 * coarse + 0.08 * (hash(x, y, s + 7) - 0.5));
      }
      let add = 0;
      if (w.cracks) {
        const here = crackAt(x, y);
        if (here < 0.9) k *= 1 - 0.55 * w.cracks;
        else if (crackAt(x, y + 1) < 0.9) add += 0.12 * w.cracks;
      }
      if (w.scratches && scratched(x, y)) add += 0.1 + 0.08 * w.scratches;
      const i = (y * width + x) * 3;
      for (let c = 0; c < 3; c++) out[i + c] = (rgb[i + c] / 255) * k + add;
    }
  for (let i = 0; i < out.length; i++) rgb[i] = Math.max(0, Math.min(255, Math.round(out[i] * 255)));
  return image;
}
