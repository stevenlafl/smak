// Marks painted on a turned part: stripes, a band of colour, a painted line, a spot. A mark is a path on the
// part's own surface, as a ridge's is ([[s, angle], ...]: s 0 at its first ring and 1 at its last, the angle
// in degrees), drawn into the part's picture at a width in units, and not built: it costs no triangles,
// cannot come apart or float, and its edge is as sharp as the picture. A ridge is for what stands off the
// surface far enough to change its outline.
//
//   paintMarks(image, tris, surface, { from, to, marks, colourOf, px })
//
// The path is followed on the built surface (surface.at), so it bends round the part as a ridge's would.
// Each texel the part's triangles cover is found on the shape and painted where it lies within half the
// width of the path, on the side of the part the path is on, with an edge a texel soft.

/** How far apart (units) the points that stand for a path are. */
const STEP = 0.25;
/** The share of a pointed mark's length over which it narrows to its point. */
const POINT = 0.35;

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a) => {
  const l = Math.hypot(...a) || 1;
  return a.map((v) => v / l);
};
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const radians = (d) => (d * Math.PI) / 180;

/** A mark's path as points on the surface, each with its normal and how far along the path it is (0 to 1). */
function pointsOf(surface, path, from, to) {
  const places = path.map(([s, angle]) => [from + s * (to - from), radians(angle)]);
  const points = [];
  for (let i = 0; i + 1 < places.length; i++) {
    const [s0, a0] = places[i];
    const [s1, a1] = places[i + 1];
    // its length measured along the surface (a ring round the part ends where it began)
    let length = 0;
    for (let j = 1, last = surface.at(s0, a0).p; j <= 32; j++) {
      const here = surface.at(s0 + ((s1 - s0) * j) / 32, a0 + ((a1 - a0) * j) / 32).p;
      length += Math.hypot(...sub(here, last));
      last = here;
    }
    const steps = Math.max(2, Math.ceil(length / STEP));
    for (let j = i ? 1 : 0; j <= steps; j++) {
      const t = j / steps;
      const at = surface.at(s0 + (s1 - s0) * t, a0 + (a1 - a0) * t);
      points.push({ p: at.p, n: at.n });
    }
  }
  let length = 0;
  points.forEach((q, i) => {
    if (i) length += Math.hypot(...sub(q.p, points[i - 1].p));
    q.along = length;
  });
  for (const q of points) q.along = length ? q.along / length : 0;
  return { points, length };
}

/**
 * Paints `marks` into `image` ({ width, height, rgb }) in place, over the texels the part's triangles `tris`
 * cover (corners { p, uv }, uv 0 to 1, p in the part's own space, where `surface` is). `from`, `to`: the s
 * of the part's first and last ring. `colourOf(mark, x, y)` gives a mark's colour at a point in units on the
 * picture. `px`: texels a unit. Returns the texels painted.
 */
export function paintMarks(image, tris, surface, { from, to, marks, colourOf, px }) {
  const { width, height, rgb } = image;
  let texels = 0;
  for (const mark of marks) {
    const { points } = pointsOf(surface, mark.path, from, to);
    const half = (mark.width ?? 1) / 2;
    const ends = [mark.ends ?? "round"].flat();
    const [startEnd, endEnd] = [ends[0], ends[1] ?? ends[0]];
    // the half-width at a share of the way along: a pointed end narrows to nothing
    const halfAt = (along) => {
      let k = 1;
      if (startEnd === "point" && along < POINT) k = Math.min(k, along / POINT);
      if (endEnd === "point" && along > 1 - POINT) k = Math.min(k, (1 - along) / POINT);
      return half * k;
    };
    // the box round the path, widened: a triangle wholly outside it is passed over
    const mn = [0, 1, 2].map((k) => Math.min(...points.map((q) => q.p[k])) - half - 1);
    const mx = [0, 1, 2].map((k) => Math.max(...points.map((q) => q.p[k])) + half + 1);
    for (const tri of tris) {
      const p = tri.map((c) => c.p);
      if ([0, 1, 2].some((k) => Math.max(...p.map((q) => q[k])) < mn[k] || Math.min(...p.map((q) => q[k])) > mx[k])) continue;
      const n = unit(cross(sub(p[1], p[0]), sub(p[2], p[0])));
      const uv = tri.map((c) => [c.uv[0] * width, c.uv[1] * height]);
      const [A, B, C] = uv;
      const area = (B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1]);
      if (Math.abs(area) < 1e-9) continue;
      // units a texel covers on this triangle: the edge is a texel soft
      const per = Math.sqrt(Math.hypot(...cross(sub(p[1], p[0]), sub(p[2], p[0]))) / Math.abs(area));
      const x0 = Math.max(0, Math.floor(Math.min(...uv.map((q) => q[0]))));
      const x1 = Math.min(width - 1, Math.ceil(Math.max(...uv.map((q) => q[0]))));
      const y0 = Math.max(0, Math.floor(Math.min(...uv.map((q) => q[1]))));
      const y1 = Math.min(height - 1, Math.ceil(Math.max(...uv.map((q) => q[1]))));
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          const w1 = ((x + 0.5 - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (y + 0.5 - A[1])) / area;
          const w2 = ((B[0] - A[0]) * (y + 0.5 - A[1]) - (x + 0.5 - A[0]) * (B[1] - A[1])) / area;
          const w0 = 1 - w1 - w2;
          // a little over the triangle's border, so that no seam of the old colour shows between two
          if (w0 < -0.05 || w1 < -0.05 || w2 < -0.05) continue;
          const q = [0, 1, 2].map((k) => p[0][k] * w0 + p[1][k] * w1 + p[2][k] * w2);
          // the nearest point of the path on this side of the part
          let best = Infinity;
          let bestAlong = 0;
          for (const point of points) {
            if (dot(point.n, n) < 0.2) continue;
            const d = Math.hypot(...sub(q, point.p));
            if (d < best) [best, bestAlong] = [d, point.along];
          }
          const cover = clamp01((halfAt(bestAlong) - best) / per + 0.5);
          if (cover <= 0) continue;
          const at = y * width + x;
          const colour = colourOf(mark, x / px, y / px);
          for (let k = 0; k < 3; k++) rgb[at * 3 + k] = Math.round(rgb[at * 3 + k] * (1 - cover) + 255 * clamp01(colour[k]) * cover);
          texels++;
        }
    }
  }
  return { texels };
}
