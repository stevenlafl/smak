// The pictures of a sprite, made by rule: layers, each a function of a pixel and the moment (the phase, 0 to 1
// over the sprite's frames), summed (additive) or laid over each other (coverage). The noise is periodic in
// time and along the way a flame rises, so a loop of P frames closes on itself exactly
// (research/sprite-generation.md, 5.1 to 5.3).
//
//   framesOf({ size, frames, loop, layers, seed, edge, use }) -> [{ width, height, rgb, a }]
//
// Coordinates: u across (-1 left to 1 right), v up (-1 bottom to 1 top), in the frame's longer side's half
// (a 32x64 frame runs u -0.5 to 0.5 and v -1 to 1).

const smooth = (t) => t * t * (3 - 2 * t);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const mod = (a, n) => ((a % n) + n) % n;

/** A number from 0 to 1 that a lattice point and a seed always give. */
function hash(x, y, z, seed) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647 + seed * 144665) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * Value noise in x, y and t, smooth, periodic: in t with period `pt` and in y with period `py` (lattice cells;
 * 0: not periodic in y).
 */
export function noise3(x, y, t, { pt, py = 0, seed = 1 }) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const it = Math.floor(t);
  const fx = smooth(x - ix);
  const fy = smooth(y - iy);
  const ft = smooth(t - it);
  const at = (dx, dy, dz) => hash(ix + dx, py ? mod(iy + dy, py) : iy + dy, mod(it + dz, pt), seed);
  const lerp = (a, b, k) => a + (b - a) * k;
  const plane = (dz) => lerp(lerp(at(0, 0, dz), at(1, 0, dz), fx), lerp(at(0, 1, dz), at(1, 1, dz), fx), fy);
  return lerp(plane(0), plane(1), ft);
}

/** Octaves of noise3, each twice as fine and half as strong, each still periodic. 0 to 1. */
export function fbm3(x, y, t, { pt, py = 0, seed = 1, octaves = 4 }) {
  let sum = 0;
  let weight = 0;
  for (let k = 0; k < octaves; k++) {
    const f = 2 ** k;
    sum += noise3(x * f, y * f, t * f, { pt: pt * f, py: py * f, seed: seed + k * 17 }) / f;
    weight += 1 / f;
  }
  return sum / weight;
}

/** Fire's colours by heat (0 to 1): black, deep red, orange, pale yellow, near white. */
const RAMPS = {
  fire: [[0, [0, 0, 0]], [0.25, [0.45, 0.04, 0]], [0.5, [0.95, 0.35, 0.02]], [0.75, [1, 0.75, 0.25]], [1, [1, 0.97, 0.85]]],
  blue: [[0, [0, 0, 0]], [0.3, [0.02, 0.08, 0.45]], [0.6, [0.15, 0.45, 1]], [1, [0.85, 0.95, 1]]],
  green: [[0, [0, 0, 0]], [0.3, [0.02, 0.3, 0.05]], [0.6, [0.3, 0.95, 0.2]], [1, [0.9, 1, 0.8]]],
};
export const RAMP_NAMES = Object.keys(RAMPS);
function ramp(name, heat) {
  const stops = Array.isArray(name) ? name : RAMPS[name] ?? RAMPS.fire;
  const h = clamp01(heat);
  for (let i = 1; i < stops.length; i++)
    if (h <= stops[i][0]) {
      const k = (h - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0] || 1);
      return stops[i - 1][1].map((c, j) => c + (stops[i][1][j] - c) * k);
    }
  return stops.at(-1)[1];
}

/** An envelope over the phase: { attack, decay } as shares of the length (0 none): 0 to 1 to 0. */
function envelopeOf(env) {
  if (!env) return () => 1;
  const { attack = 0, decay = 0 } = env;
  return (p) => Math.min(attack ? clamp01(p / attack) : 1, decay ? clamp01((1 - p) / decay) : 1);
}

/** Particles that a seed always places the same: [{ angle, speed, delay }]. */
function particles(count, seed) {
  return Array.from({ length: count }, (_, i) => ({ angle: hash(i, 1, 0, seed) * 2 * Math.PI, speed: 0.4 + 0.6 * hash(i, 2, 0, seed), delay: 0.25 * hash(i, 3, 0, seed) }));
}

/** Distance from a point to a segment. */
function toSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = clamp01(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1));
  return Math.hypot(px - ax - dx * t, py - ay - dy * t);
}

/**
 * A layer's energy and colour at (u, v) and phase p: { e (0 to 1 or so), rgb }. `loop`: the phase is a loop's
 * (p 1 is p 0 again); `cells`: the lattice cells the frame's longer side spans, for the noise.
 */
const KINDS = {
  glow({ radius = 0.8, core = 0.18, colour = [1, 0.85, 0.6], at = [0, 0] }, u, v) {
    const r = Math.hypot(u - at[0], v - at[1]);
    const e = ((core * core) / (r * r + core * core)) * (1 - smooth(clamp01((r / radius - 0.55) / 0.45)));
    return { e, rgb: colour };
  },
  flare({ core = 0.12, colour = [1, 0.9, 0.7], streaks = [{ angle: 0, length: 0.95, width: 0.03 }, { angle: 90, length: 0.6, width: 0.025 }], at = [0, 0] }, u, v) {
    const x = u - at[0];
    const y = v - at[1];
    const r = Math.hypot(x, y);
    let e = (core * core) / (r * r + core * core) * (1 - smooth(clamp01((r - 0.5) / 0.45)));
    for (const s of streaks) {
      const a = (s.angle * Math.PI) / 180;
      const along = x * Math.cos(a) + y * Math.sin(a);
      const across = -x * Math.sin(a) + y * Math.cos(a);
      e += Math.exp(-((across / s.width) ** 2)) * clamp01(1 - Math.abs(along) / s.length) ** 1.5;
    }
    return { e: Math.min(1.5, e), rgb: colour };
  },
  fire({ ramp: name = "fire", width = 0.6, rise = 1, turbulence = 0.8, height = 1.7 }, u, v, p, { cells, seed, aspect }) {
    // the base a little up from the frame's foot, so the border stays dark
    const base = -aspect[1] * 0.88;
    const h = v < base ? 1 : clamp01((v - base) / height);
    const half = width * aspect[0] * (1 - 0.65 * h);
    const across = Math.exp(-((u / Math.max(half, 0.02)) ** 2) * 2);
    // rising noise: the lattice periodic up the frame, scrolled one whole period a loop (`rise` of them)
    const py = cells;
    const n = fbm3((u + 2) * cells * 0.5, (v + 1) * cells * 0.5 - p * py * Math.max(1, Math.round(rise)), p * 4, { pt: 4, py, seed });
    const heat = across * (1 - h) ** 1.2 * (1 - turbulence * 0.6 + turbulence * 1.2 * n) - 0.25 * h;
    return { e: 1, rgb: ramp(name, heat * 1.15) };
  },
  smoke({ density = 0.8, spread = 0.6, colour = [0.55, 0.55, 0.55], rise = 1 }, u, v, p, { cells, seed, aspect }) {
    const h = clamp01((v + aspect[1]) / (2 * aspect[1]));
    const half = spread * aspect[0] * (0.35 + 0.65 * h);
    const across = Math.exp(-((u / Math.max(half, 0.02)) ** 2) * 1.6);
    const n = fbm3((u + 2) * cells * 0.4, (v + 1) * cells * 0.4 - p * cells * Math.max(1, Math.round(rise)), p * 3, { pt: 3, py: cells, seed, octaves: 5 });
    const a = clamp01(across * density * (n * 1.6 - 0.35) * (1 - h * 0.7));
    return { e: a, rgb: colour, a };
  },
  explosion({ ramp: name = "fire", growth = 0.9, cool = 1.6, turbulence = 0.9 }, u, v, p, { cells, seed }) {
    // one-shot: a ball that grows fast and slows, burns from its middle out, and cools
    const R = 0.15 + growth * (1 - (1 - p) ** 2.5);
    // its edge broken up by noise, so it is a billow and not a disc
    const lobes = fbm3((u + 3) * cells * 0.25, (v + 3) * cells * 0.25, p * 3, { pt: 3, seed: seed + 7, octaves: 2 });
    const r = (Math.hypot(u, v) / R) * (0.75 + 0.5 * lobes);
    if (r > 1.25) return { e: 0, rgb: [0, 0, 0] };
    const n = fbm3((u + 2) * cells * 0.7, (v + 2) * cells * 0.7, p * 10, { pt: 10, seed, octaves: 4 });
    const heat = (1 - r ** 2) * (1 - turbulence * 0.5 + turbulence * n) * (1 - p) ** cool * 1.6;
    return { e: 1, rgb: ramp(name, heat) };
  },
  sparks({ count = 24, speed = 1, gravity = 1.2, trail = 0.12, colour = [1, 0.8, 0.4] }, u, v, p, { seed }) {
    let e = 0;
    for (const s of particles(count, seed)) {
      const t = p - s.delay;
      if (t <= 0) continue;
      const at = (tt) => [Math.cos(s.angle) * s.speed * speed * tt * 1.6, Math.sin(s.angle) * s.speed * speed * tt * 1.6 - gravity * tt * tt];
      const [ax, ay] = at(t);
      const [bx, by] = at(Math.max(0, t - trail));
      const d = toSegment(u, v, ax, ay, bx, by);
      e += Math.exp(-((d / 0.025) ** 2)) * (1 - t / (1 - s.delay)) ** 1.5;
    }
    return { e: Math.min(1.4, e), rgb: colour };
  },
  ring({ from = 0.1, to = 0.9, width = 0.08, colour = [0.6, 0.85, 1] }, u, v, p) {
    const r = Math.hypot(u, v);
    const at = from + (to - from) * (1 - (1 - p) ** 2);
    return { e: Math.exp(-(((r - at) / width) ** 2)) * (1 - p), rgb: colour };
  },
  beam({ core = 0.35, noise = 0.5, colour = [0.5, 0.75, 1] }, u, v, p, { cells, seed, aspect }) {
    // a cross-section across u, noise that tiles along v (the beam's length) and scrolls a whole period a loop
    const py = cells;
    const n = fbm3((u + 2) * cells * 0.5, (v + aspect[1]) * cells * 0.5 / aspect[1] * 0.5 + p * py, p * 2, { pt: 2, py, seed });
    const e = Math.exp(-((u / (core * aspect[0])) ** 2)) * (1 - noise + noise * 1.4 * n);
    return { e, rgb: colour };
  },
};
export const LAYER_KINDS = Object.keys(KINDS);

/**
 * The frames of a sprite, in full colour and coverage, before any palette. `size` [w, h]; `frames` (distinct
 * frames; a loop gets one more, the first again); `loop`; `layers` [{ kind, gain, env, ...its own }]; `edge`
 * (pixels faded at the border; a beam's only at its sides).
 */
export function framesOf({ size: [width, height], frames: count, loop = false, layers, seed = 1, edge = 2, use }) {
  const longer = Math.max(width, height);
  const aspect = [width / longer, height / longer];
  const cells = 8;
  const distinct = Math.max(1, count);
  const out = [];
  for (let n = 0; n < distinct; n++) {
    const p = loop ? n / distinct : distinct > 1 ? n / (distinct - 1) : 0;
    const rgb = new Float32Array(width * height * 3);
    const a = new Float32Array(width * height);
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const u = (((x + 0.5) / width) * 2 - 1) * aspect[0];
        const v = (1 - ((y + 0.5) / height) * 2) * aspect[1];
        // the border faded, so the frame's square never shows (a beam tiles along its length: its ends stay lit)
        const fromSide = Math.min(x + 0.5, width - x - 0.5);
        const fromEnd = Math.min(y + 0.5, height - y - 0.5);
        const fade = edge ? clamp01(fromSide / edge) * (use === "beam" ? 1 : clamp01(fromEnd / edge)) : 1;
        let sum = [0, 0, 0];
        let cover = 0;
        for (const [k, layer] of layers.entries()) {
          const make = KINDS[layer.kind];
          if (!make) continue;
          const { e, rgb: c, a: layerA } = make(layer, u, v, p, { cells, seed: seed + k * 101, aspect });
          const g = (layer.gain ?? 1) * envelopeOf(layer.env)(p) * fade;
          sum = sum.map((s, j) => s + c[j] * e * g);
          const la = clamp01((layerA ?? e) * g);
          cover = cover + la * (1 - cover);
        }
        const i = y * width + x;
        rgb.set(sum.map((s) => Math.min(1, s)), i * 3);
        a[i] = cover;
      }
    out.push({ width, height, rgb, a });
  }
  // a loop's last frame is its first again: the engine shows frames 0 to frames - 2 and wraps (3.4)
  if (loop && distinct > 1) out.push(out[0]);
  return out;
}
