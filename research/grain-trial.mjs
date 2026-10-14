// A TRIAL, not part of the kit (2026-10-14): tried on four of frenzy's textures from the pictures leg's views,
// it gave a blotchy grain with the right colours and none of the cracks, seams or panel lines that make
// Valve's read as concrete, with a pixel-fine noise the judges had already marked down (T5). Kept here with its
// result (research/backlog.md, asset-reproduction-failures item 11) so that a better method (Portilla and
// Simoncelli's joint statistics) can be measured against it.
//
// A texture's grain grown from noise to the statistics of a picture of a surface: Heeger and Bergen's
// pyramid-based texture synthesis ("Pyramid-based texture analysis/synthesis", SIGGRAPH 1995). The picture
// (a patch of a wall in a view of a map, its light divided out) is measured, band by band of a Laplacian
// pyramid, as a histogram of values; noise is then pushed, band by band and again as a whole, to the same
// histograms, a few times over. What comes out has the picture's colours in the same shares and its grain at
// each scale, and none of its pixels: every value is the noise's, moved by a histogram (research/asset-
// reproduction-failures.md, section 7: statistics are measures, texels are a copy). It suits what is
// stochastic (concrete, plaster, rust, dirt, gravel) and cannot make what has a layout (panels, machinery,
// lettering): that is panels' and relief's.
//
// Colours are taken apart along their principal axes in the patch (so the three channels are uncorrelated and
// each can be matched alone), matched, and put back together. Everything wraps round the texture's edges, so
// it tiles with no seam.
//
//   grainOf(patch, { width, height, scale, seed, rounds }) -> { width, height, rgb }
//   patch: { width, height, rgb (0 to 1, the light already divided out) }

/** A random number generator from a seed: the same grain for the same seed. */
function randomOf(seed) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

/** A field blurred by the binomial 1 4 6 4 1, each way, wrapping round its edges. */
function blur(field, w, h) {
  const k = [1, 4, 6, 4, 1].map((v) => v / 16);
  const across = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let i = -2; i <= 2; i++) s += k[i + 2] * field[y * w + ((x + i + w) % w)];
      across[y * w + x] = s;
    }
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let i = -2; i <= 2; i++) s += k[i + 2] * across[((y + i + h) % h) * w + x];
      out[y * w + x] = s;
    }
  return out;
}

/** A field halved each way (blurred first), and doubled back (each value to its four). */
function down(field, w, h) {
  const b = blur(field, w, h);
  const [w2, h2] = [Math.max(1, w >> 1), Math.max(1, h >> 1)];
  const out = new Float32Array(w2 * h2);
  for (let y = 0; y < h2; y++) for (let x = 0; x < w2; x++) out[y * w2 + x] = b[(y * 2) * w + x * 2];
  return { field: out, w: w2, h: h2 };
}
function up(field, w, h, W, H) {
  const out = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) out[y * W + x] = field[Math.min(h - 1, y >> 1) * w + Math.min(w - 1, x >> 1)];
  return blur(out, W, H);
}

/** A Laplacian pyramid: the detail at each scale, finest first, then what is left. */
function pyramidOf(field, w, h, levels) {
  const bands = [];
  let cur = { field, w, h };
  for (let l = 0; l < levels && cur.w >= 4 && cur.h >= 4; l++) {
    const small = down(cur.field, cur.w, cur.h);
    const back = up(small.field, small.w, small.h, cur.w, cur.h);
    bands.push({ field: cur.field.map((v, i) => v - back[i]), w: cur.w, h: cur.h });
    cur = small;
  }
  bands.push(cur);
  return bands;
}
function collapse(bands) {
  let cur = bands[bands.length - 1];
  for (let l = bands.length - 2; l >= 0; l--) {
    const { w, h } = bands[l];
    const back = up(cur.field, cur.w, cur.h, w, h);
    cur = { field: bands[l].field.map((v, i) => v + back[i]), w, h };
  }
  return cur.field;
}

/** `field`'s values moved so that their histogram is `target`'s (both sorted, matched by rank). */
function matchHistogram(field, target) {
  const order = Array.from(field.keys()).sort((a, b) => field[a] - field[b]);
  const sorted = Float32Array.from(target).sort();
  const out = new Float32Array(field.length);
  order.forEach((index, rank) => {
    out[index] = sorted[Math.min(sorted.length - 1, Math.floor((rank / field.length) * sorted.length))];
  });
  return out;
}

/** The principal axes of the patch's colours: { mean, axes (rows) }, by power iteration on the covariance. */
function colourAxes(rgb, n) {
  const mean = [0, 1, 2].map((c) => {
    let s = 0;
    for (let i = 0; i < n; i++) s += rgb[i * 3 + c];
    return s / n;
  });
  const cov = [0, 1, 2].map((a) =>
    [0, 1, 2].map((b) => {
      let s = 0;
      for (let i = 0; i < n; i++) s += (rgb[i * 3 + a] - mean[a]) * (rgb[i * 3 + b] - mean[b]);
      return s / n;
    }),
  );
  const axes = [];
  let m = cov.map((row) => [...row]);
  for (let k = 0; k < 3; k++) {
    let v = [1, 0.7, 0.3].map((x, i) => x + i * 0.01 * (k + 1));
    for (let it = 0; it < 60; it++) {
      const nv = [0, 1, 2].map((i) => m[i][0] * v[0] + m[i][1] * v[1] + m[i][2] * v[2]);
      const len = Math.hypot(...nv) || 1;
      v = nv.map((x) => x / len);
    }
    // what is left once this axis is taken out of the others found
    for (const a of axes) {
      const d = a[0] * v[0] + a[1] * v[1] + a[2] * v[2];
      v = v.map((x, i) => x - d * a[i]);
    }
    const len = Math.hypot(...v) || 1;
    v = v.map((x) => x / len);
    if (len < 1e-6) v = [0, 1, 2].map((i) => (i === k ? 1 : 0));
    axes.push(v);
    const lambda = [0, 1, 2].reduce((s, i) => s + v[i] * [0, 1, 2].reduce((t, j) => t + m[i][j] * v[j], 0), 0);
    m = m.map((row, i) => row.map((x, j) => x - lambda * v[i] * v[j]));
  }
  return { mean, axes };
}

/**
 * A texture `width` x `height` grown from noise to the statistics of `patch`. `scale`: how many of the
 * texture's texels one of the patch's pixels stands for (a wall seen at 2 pixels a texel: 0.5), so that the
 * grain comes out at its size on the wall. `rounds` of matching (5).
 */
export function grainOf(patch, { width, height, scale = 1, seed = 1, rounds = 5 } = {}) {
  // the patch brought to the texture's scale (nearest), so its bands are the texture's bands
  const pw = Math.max(8, Math.round(patch.width * scale));
  const ph = Math.max(8, Math.round(patch.height * scale));
  const n = pw * ph;
  const rgb = new Float32Array(n * 3);
  for (let y = 0; y < ph; y++)
    for (let x = 0; x < pw; x++) {
      const sx = Math.min(patch.width - 1, Math.floor(x / scale));
      const sy = Math.min(patch.height - 1, Math.floor(y / scale));
      for (let c = 0; c < 3; c++) rgb[(y * pw + x) * 3 + c] = patch.rgb[(sy * patch.width + sx) * 3 + c];
    }
  const { mean, axes } = colourAxes(rgb, n);
  const levels = Math.max(1, Math.floor(Math.log2(Math.min(pw, ph, width, height))) - 2);
  const random = randomOf(seed);
  const out = new Float32Array(width * height * 3);
  axes.forEach((axis, k) => {
    // the patch along this axis, and its pyramid's histograms
    const channel = new Float32Array(n);
    for (let i = 0; i < n; i++) channel[i] = (rgb[i * 3] - mean[0]) * axis[0] + (rgb[i * 3 + 1] - mean[1]) * axis[1] + (rgb[i * 3 + 2] - mean[2]) * axis[2];
    const theirs = pyramidOf(channel, pw, ph, levels);
    let field = matchHistogram(Float32Array.from({ length: width * height }, () => random()), channel);
    for (let r = 0; r < rounds; r++) {
      const mine = pyramidOf(field, width, height, levels);
      const matched = mine.map((band, l) => ({ ...band, field: matchHistogram(band.field, theirs[Math.min(l, theirs.length - 1)].field) }));
      field = matchHistogram(collapse(matched), channel);
    }
    for (let i = 0; i < width * height; i++) for (let c = 0; c < 3; c++) out[i * 3 + c] += field[i] * axis[c];
  });
  const image = new Uint8Array(width * height * 3);
  for (let i = 0; i < width * height; i++) for (let c = 0; c < 3; c++) image[i * 3 + c] = Math.max(0, Math.min(255, Math.round((out[i * 3 + c] + mean[c]) * 255)));
  return { width, height, rgb: image };
}
