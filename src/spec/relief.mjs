// Relief for a map's textures: the machinery of a wall painted with its light, as the game's own are. A
// texture's `relief` is a list of parts, each raised (or sunk) over the picture and lit from the top left, with
// the dark of a recess gathered round what stands out: a pipe is a round bar with its highlight and its shadow,
// a grille bars over a dark hole, a louvre slats that catch the light. Coordinates are texels from the
// picture's bottom left, as a texture's panels are.
//
//   pipe     { path: [[x, y], ...], radius, material }           a round pipe along a line, its bends round
//   bars     { at, size, count, width, axis: "x"|"y", material }  bars across a dark recess (a grille, a vent)
//   louvre   { at, size, count, material }                       slats, each sloping, in a frame's recess
//   rivets   { from, to, count, radius, material }               a row of domed heads
//   seam     { from, to, width, notched }                        a groove; notched: with a notch every 16
//   lamp     { at, size, colour, glow }                          a lamp's face: bright in its middle
//
// Bump shading of a height field: Blinn, "Simulation of wrinkled surfaces", SIGGRAPH 1978; the dark of a
// recess as the height under a blurred height (a cheap ambient occlusion). research/asset-reproduction-
// failures.md, section 5.
//
//   relief(image, parts, materialPicture) -> the image, changed in place ({ width, height, rgb })
//   RELIEF_KINDS

export const RELIEF_KINDS = ["pipe", "bars", "louvre", "rivets", "seam", "lamp"];
/** The light: from the top left of the picture, and above it. */
const LIGHT = (() => {
  const l = [-0.55, 0.55, 0.65];
  const n = Math.hypot(...l);
  return l.map((v) => v / n);
})();
/** How dark a recess gets, and how far round a raised part its shadow spreads, in texels. */
const RECESS_DARK = 0.12;
const SHADOW_REACH = 3;

/** The distance from a point to a segment. */
function toSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}

/** A box blur of a field, `r` texels each way, wrapping round the picture's edges. */
function blurred(field, width, height, r) {
  const across = new Float32Array(field.length);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let k = -r; k <= r; k++) sum += field[y * width + ((x + k + width) % width)];
      across[y * width + x] = sum / (2 * r + 1);
    }
  const out = new Float32Array(field.length);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let k = -r; k <= r; k++) sum += across[((y + k + height) % height) * width + x];
      out[y * width + x] = sum / (2 * r + 1);
    }
  return out;
}

/**
 * The parts raised over the picture and lit. `materialPicture(material)` gives a picture of a material at the
 * texture's size ({ rgb }), for a part's own colour; a part with none keeps the colour under it.
 */
export function relief(image, parts, materialPicture) {
  const { width, height, rgb } = image;
  const H = new Float32Array(width * height);
  // the colour each texel takes, where a part has its own: [r, g, b] 0 to 1, or null
  const colour = new Array(width * height).fill(null);
  const glow = new Float32Array(width * height);
  const own = new Map();
  const colourOf = (material, i) => {
    if (!material) return null;
    const key = JSON.stringify(material);
    if (!own.has(key)) own.set(key, materialPicture(material).rgb);
    const m = own.get(key);
    return [m[i * 3] / 255, m[i * 3 + 1] / 255, m[i * 3 + 2] / 255];
  };
  // a texel from the bottom left (x, y) to its place in the picture, which counts from the top
  const index = (x, y) => (height - 1 - y) * width + x;
  const each = (box, f) => {
    const [x0, y0] = box.at;
    const [w, h] = box.size;
    for (let y = Math.max(0, Math.floor(y0 - h / 2)); y < Math.min(height, Math.ceil(y0 + h / 2)); y++)
      for (let x = Math.max(0, Math.floor(x0 - w / 2)); x < Math.min(width, Math.ceil(x0 + w / 2)); x++)
        f(x, y, (x + 0.5 - (x0 - w / 2)) / w, (y + 0.5 - (y0 - h / 2)) / h);
  };
  for (const part of parts) {
    if (part.kind === "pipe") {
      const r = part.radius ?? 3;
      const path = part.path;
      for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
          let d = Infinity;
          for (let k = 0; k + 1 < path.length; k++) d = Math.min(d, toSegment(x + 0.5, y + 0.5, ...path[k], ...path[k + 1]));
          if (d >= r) continue;
          const i = index(x, y);
          const h = Math.sqrt(r * r - d * d);
          if (h > H[i]) {
            H[i] = h;
            colour[i] = colourOf(part.material, i);
          }
        }
    } else if (part.kind === "bars" || part.kind === "louvre") {
      const count = Math.max(1, part.count ?? 6);
      const axis = part.axis ?? (part.kind === "louvre" ? "y" : "x");
      each(part, (x, y, u, v) => {
        const i = index(x, y);
        const along = axis === "x" ? u : v;
        const cell = (along * count) % 1;
        const width01 = part.kind === "louvre" ? 0.85 : Math.min(0.9, (part.width ?? 2) * count / (axis === "x" ? part.size[0] : part.size[1]));
        if (cell < width01) {
          // a bar is round across; a slat slopes, high at its top edge
          const t = cell / width01;
          H[i] = part.kind === "louvre" ? 1 + 2.2 * t : 1.6 * Math.sin(Math.PI * t);
          colour[i] = colourOf(part.material, i) ?? colour[i];
        } else {
          H[i] = -3;
          colour[i] = [0.03, 0.03, 0.03];
        }
      });
    } else if (part.kind === "rivets") {
      const count = Math.max(1, part.count ?? 4);
      const r = part.radius ?? 1.5;
      for (let k = 0; k < count; k++) {
        const t = count === 1 ? 0.5 : k / (count - 1);
        const cx = part.from[0] + (part.to[0] - part.from[0]) * t;
        const cy = part.from[1] + (part.to[1] - part.from[1]) * t;
        for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(height - 1, Math.ceil(cy + r)); y++)
          for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(width - 1, Math.ceil(cx + r)); x++) {
            const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
            if (d >= r) continue;
            const i = index(x, y);
            H[i] = Math.max(H[i], Math.sqrt(r * r - d * d) * 0.8);
            colour[i] = colourOf(part.material, i) ?? colour[i];
          }
      }
    } else if (part.kind === "seam") {
      const w = (part.width ?? 1) / 2 + 0.5;
      const length = Math.hypot(part.to[0] - part.from[0], part.to[1] - part.from[1]) || 1;
      for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
          const d = toSegment(x + 0.5, y + 0.5, ...part.from, ...part.to);
          // a notch: a short cut across the groove every 16 texels along it
          const along = ((x + 0.5 - part.from[0]) * (part.to[0] - part.from[0]) + (y + 0.5 - part.from[1]) * (part.to[1] - part.from[1])) / length;
          const notch = part.notched && d < w + 2.5 && ((along % 16) + 16) % 16 < 2;
          if (d < w || notch) H[index(x, y)] = Math.min(H[index(x, y)], -1.5);
        }
    } else if (part.kind === "lamp") {
      const tone = part.colour ?? [1, 0.95, 0.8];
      each(part, (x, y, u, v) => {
        const i = index(x, y);
        const edge = Math.min(u, 1 - u, v, 1 - v);
        H[i] = Math.max(H[i], 0.6);
        const k = Math.min(1, 0.55 + (part.glow ?? 1) * 1.6 * edge);
        colour[i] = tone.map((c) => Math.min(1, c * k + 0.25 * k * k));
        glow[i] = 1;
      });
    }
  }
  // lit: the height field's slope against the light, its recesses darkened
  const around = blurred(H, width, height, SHADOW_REACH);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const at = (dx, dy) => H[((y + dy + height) % height) * width + ((x + dx + width) % width)];
      const gx = (at(1, 0) - at(-1, 0)) / 2;
      // the picture's rows run down: a rise toward the top is a rise in -row
      const gy = (at(0, -1) - at(0, 1)) / 2;
      const n = [-gx, -gy, 1];
      const length = Math.hypot(...n);
      const lambert = (n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]) / length;
      const flat = LIGHT[2];
      // 1 on the flat, brighter facing the light, darker away; the dark gathered in a recess beside a rise
      let k = 1 + 1.3 * (lambert - flat) + 0.5 * Math.max(0, lambert - 0.93) / 0.07;
      k -= RECESS_DARK * Math.max(0, around[i] - H[i]);
      if (glow[i]) k = 1;
      const c = colour[i] ?? [rgb[i * 3] / 255, rgb[i * 3 + 1] / 255, rgb[i * 3 + 2] / 255];
      for (let ch = 0; ch < 3; ch++) rgb[i * 3 + ch] = Math.max(0, Math.min(255, Math.round(c[ch] * Math.max(0, k) * 255)));
    }
  return image;
}
