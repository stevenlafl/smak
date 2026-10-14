// What a sprite is, in numbers, as the engine reads it (research/sprite-generation.md, 6.1): each frame
// turned to "energy" (what lands on the screen: brightness for additive and normal, coverage for index alpha,
// brightness where solid for alpha test), then
//
//   wrap     a loop's step at the wrap (frame n-2 to frame 0, as the engine shows it) over its mean step:
//            about 1 closes as smoothly as it moves; over 2.5 a jump the eye sees each time round
//   jitter   flicker: the mean second difference over the mean first; about 1.7 for unrelated frames
//   border   the brightest and the mean of the outer two pixels: a lit border shows the frame's square
//   envelope each frame's mean; where it peaks (0 to 1), its first and last over the peak
//   dark     the share of pixels under 0.03
//
//   measureSprite(spr) -> { frames, size, wrap, jitter, border: { max, mean }, envelope: { peakAt, first, last }, dark }
// `spr` as readSpr gives it.

const lum = (r, g, b) => (0.299 * r + 0.587 * g + 0.114 * b) / 255;

/** A frame's energy, a Float32Array of 0 to 1 a pixel. */
export function energyOf(spr, frame) {
  const { palette, format } = spr;
  const e = new Float32Array(frame.width * frame.height);
  for (let i = 0; i < e.length; i++) {
    const p = frame.pixels[i];
    e[i] =
      format === "index alpha" ? p / 255 : format === "alpha test" && p === 255 ? 0 : lum(palette[p * 3], palette[p * 3 + 1], palette[p * 3 + 2]);
  }
  return e;
}

const meanAbs = (a, b) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  return s / (a.length || 1);
};
const round = (v, k = 3) => (Number.isFinite(v) ? Math.round(v * 10 ** k) / 10 ** k : null);

export function measureSprite(spr, { loop = false } = {}) {
  const same = spr.frames.every((f) => f.width === spr.frames[0].width && f.height === spr.frames[0].height);
  const energies = spr.frames.map((f) => energyOf(spr, f));
  const { width, height } = spr.frames[0];
  // the border: the outer two pixels of every frame
  let borderMax = 0;
  let borderSum = 0;
  let borderN = 0;
  let dark = 0;
  let all = 0;
  energies.forEach((e, n) => {
    const f = spr.frames[n];
    for (let y = 0; y < f.height; y++)
      for (let x = 0; x < f.width; x++) {
        const v = e[y * f.width + x];
        all++;
        if (v < 0.03) dark++;
        if (x < 2 || y < 2 || x >= f.width - 2 || y >= f.height - 2) {
          borderMax = Math.max(borderMax, v);
          borderSum += v;
          borderN++;
        }
      }
  });
  const means = energies.map((e) => e.reduce((s, v) => s + v, 0) / (e.length || 1));
  const peak = Math.max(...means, 1e-9);
  const peakAt = means.indexOf(peak);
  const out = {
    frames: spr.frames.length,
    size: [width, height],
    border: { max: round(borderMax), mean: round(borderSum / (borderN || 1)) },
    envelope: { peakAt: round(spr.frames.length > 1 ? peakAt / (spr.frames.length - 1) : 0, 2), first: round(means[0] / peak, 2), last: round(means.at(-1) / peak, 2) },
    dark: round(dark / (all || 1), 2),
    wrap: null,
    jitter: null,
  };
  if (same && energies.length >= 3) {
    // the frames the engine shows: a loop's last frame is its first again and is never shown
    const shown = loop ? energies.slice(0, -1) : energies;
    const steps = shown.slice(1).map((e, i) => meanAbs(e, shown[i]));
    const meanStep = steps.reduce((s, v) => s + v, 0) / (steps.length || 1);
    if (loop && shown.length >= 2) out.wrap = round(meanAbs(shown.at(-1), shown[0]) / (meanStep || 1e-9), 2);
    if (shown.length >= 3) {
      let second = 0;
      for (let t = 1; t < shown.length - 1; t++) {
        let s = 0;
        for (let i = 0; i < shown[t].length; i++) s += Math.abs(shown[t + 1][i] - 2 * shown[t][i] + shown[t - 1][i]);
        second += s / shown[t].length;
      }
      out.jitter = round(second / (shown.length - 2) / (meanStep || 1e-9), 2);
    }
  }
  return out;
}

/**
 * What Half-Life's own sprites of each kind measure (research/sprite-generation.md, 6.2; numbers only).
 * Explosions, loops and sparks are the ranges of ten, ten and four files; a smoke puff's rests on one
 * (steam1: jitter 1.11, peak at 0.40, first and last 0.04 and 0.03), widened; glows, flares and rings are held
 * only to a dark border, which all but two of the game's 74 animated sprites keep.
 */
export const SPRITE_CLASSES = {
  explosion: { jitter: [1.04, 1.48], border: [0, 0.005], peakAt: [0.22, 0.71], first: [0, 0.22], last: [0, 0.03] },
  "fire loop": { jitter: [1.33, 1.79], wrap: [0, 2.48], border: [0, 0.028], first: [0.57, 1], last: [0.57, 1] },
  "smoke loop": { jitter: [1.33, 1.79], wrap: [0, 2.48], border: [0, 0.028], first: [0.57, 1], last: [0.57, 1] },
  sparks: { jitter: [1.72, 2.0], border: [0, 0.005] },
  "smoke puff": { jitter: [0.9, 1.5], border: [0, 0.005], peakAt: [0.2, 0.6], first: [0, 0.35], last: [0, 0.1] },
  glow: { border: [0, 0.005] },
  flare: { border: [0, 0.005] },
  ring: { border: [0, 0.005], last: [0, 0.1] },
  beam: {},
};

/** The measures held against a kind: [{ measure, value, range, ok }] and words for each one out. */
export function againstClass(measured, name) {
  const ranges = SPRITE_CLASSES[name];
  if (!ranges) return null;
  const value = { jitter: measured.jitter, wrap: measured.wrap, border: measured.border.mean, peakAt: measured.envelope.peakAt, first: measured.envelope.first, last: measured.envelope.last };
  const hints = { jitter: ["too smooth: little inner motion", "flickers: more coherence from frame to frame"], wrap: ["", "jumps at the wrap: make the motion periodic"], border: ["", "light at the edge: fade more (finish.edge) or shrink the effect"], peakAt: ["peaks too soon", "peaks too late"], first: ["starts too dark for a loop", "starts too bright: an attack in its envelope"], last: ["ends too dark for a loop", "does not end dark: a decay in its envelope"] };
  return Object.entries(ranges)
    .filter(([k]) => value[k] !== null && value[k] !== undefined)
    .map(([k, [lo, hi]]) => {
      const v = value[k];
      const ok = v >= lo && v <= hi;
      return { measure: k, value: v, range: [lo, hi], ok, words: ok ? "" : hints[k][v < lo ? 0 : 1] };
    });
}
