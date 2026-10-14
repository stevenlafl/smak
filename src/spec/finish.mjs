// The finish of a spec's model: what a painter adds over a material once the shape is built, read from
// the shape itself. Each texel of each part's picture is found on the shape (its point, the way it faces,
// its part), and from there:
//
//   light  the light of the room painted in, gently: faces that look up lighter, faces that look down darker
//          (the engine's own light is soft and flat; the form has to be in the picture)
//   wear   the sharp edges of a part (where its faces meet at a crease, or it ends) rubbed lighter, broken up
//          by noise in space, so the two sides of a seam agree
//   grime  dirt where a part meets another (in the corner between them) and, for a thing that stands, near
//          the floor
//   vary   each part a little lighter or darker than the next of its material, so that ten boxes of `steel`
//          are not one colour
//
// The spec says how much of each, 0 to 1: `finish: { light, wear, grime, vary }` for the whole, `false` for
// none, and a part's own `finish` (a number each, or `false`) over that. Glowing and see-through parts
// (fullbright, additive or masked) are left as they are.

import { fbm3, step } from "../workshop.mjs";

export const FINISH = { light: 0.3, wear: 0.5, grime: 0.5, vary: 0.08 };
/** Faces meeting at less than this (degrees) share a normal: meshOf's own rule, so the painted light is as
 * smooth as the engine's shading. A corner's `smooth` says otherwise for its part. */
const SMOOTH = 40;
/** Faces meeting at more than this (degrees) make an edge that wears: a box's corner, a rim; not the facets of
 * a turned part, which the shading draws round. */
const WORN = 65;
/** How far (units) a part's corner reaches into dirt from another part it meets. */
const CONTACT = 2;
/** How far apart (units) the points that stand for a part's surface are, for that. */
const SAMPLE = 0.5;
/** How far up (units, and a share of the height) a standing thing is dirtied from the floor. */
const GROUND = 2;
const GROUND_SHARE = 0.08;
/** The flags of a texture painted as it is: fullbright, additive, and masked (its holes are a colour to keep). */
const AS_IS = 4 | 32 | 64;

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit = (a) => {
  const l = Math.hypot(...a) || 1;
  return a.map((v) => v / l);
};
const clamp01 = (v) => Math.min(1, Math.max(0, v));
/** Distance from a point to a segment. */
function toSegment(p, a, b) {
  const ab = sub(b, a);
  const t = clamp01(dot(sub(p, a), ab) / (dot(ab, ab) || 1));
  return Math.hypot(...sub(p, [a[0] + ab[0] * t, a[1] + ab[1] * t, a[2] + ab[2] * t]));
}
/** A number from 0 to 1 that a word always gives. */
function hashOf(word) {
  let h = 2166136261;
  for (const c of String(word)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return ((h >>> 0) % 10007) / 10007;
}

/**
 * Paints the finish into the meshes' pictures, in place. `meshes`: [{ tris (corners { p, uv } in model
 * space), partOf, image { width, height, rgb }, flags }]; `amounts(partId)` the finish of a part ({ light,
 * wear, grime, vary } or null for none); `ground`: the floor's height for a thing that stands on it (null
 * for none), `height` the thing's height. Returns { texels } painted.
 */
export function paintFinish(meshes, { amounts, ground = null, height = 0 }) {
  // every triangle once, with its normal and part: creases are found across all of them, whatever picture
  // each wears
  const all = meshes.flatMap((mesh, m) =>
    mesh.tris.map((t, i) => {
      const p = t.map((c) => c.p);
      return { m, i, p, n: unit(cross(sub(p[1], p[0]), sub(p[2], p[0]))), part: mesh.partOf?.[i] ?? mesh.name, corners: t };
    }),
  );
  const keyOf = (p) => p.map((v) => Math.round(v * 500)).join();
  const edges = new Map();
  all.forEach((tri, k) =>
    [0, 1, 2].forEach((e) => {
      const a = keyOf(tri.p[e]);
      const b = keyOf(tri.p[(e + 1) % 3]);
      const key = a < b ? `${a}|${b}` : `${b}|${a}`;
      if (!edges.has(key)) edges.set(key, []);
      edges.get(key).push(k);
    }),
  );
  // each triangle's worn edges: where it meets another at a sharp edge (WORN degrees: a box's, not the facets
  // of a round thing), or meets none at all (an end, a rim). The back of a sheet (a face turned the other way
  // on the same edge) is the same sheet, not an edge.
  const smoothCos = (corner) => Math.cos(((corner.smooth ?? SMOOTH) * Math.PI) / 180);
  const wearCos = Math.cos((WORN * Math.PI) / 180);
  for (const tri of all) {
    tri.worn = [0, 1, 2]
      .filter((e) => {
        const a = keyOf(tri.p[e]);
        const b = keyOf(tri.p[(e + 1) % 3]);
        const others = edges.get(a < b ? `${a}|${b}` : `${b}|${a}`).filter((k) => all[k] !== tri && dot(all[k].n, tri.n) > -0.95);
        return !others.length || others.every((k) => dot(all[k].n, tri.n) < wearCos);
      })
      .map((e) => [tri.p[e], tri.p[(e + 1) % 3]]);
  }
  // each corner's normal as the engine shades it: the faces at its point of its group within its smoothing
  // angle, summed (so the painted light is as smooth as the shading, and not one flat shade a facet)
  const atPoint = new Map();
  all.forEach((tri, k) =>
    tri.p.forEach((p) => {
      const key = keyOf(p);
      if (!atPoint.has(key)) atPoint.set(key, []);
      atPoint.get(key).push(k);
    }),
  );
  for (const tri of all)
    tri.normals = tri.p.map((p, c) => {
      const corner = tri.corners[c];
      const cos = smoothCos(corner);
      const sum = [0, 0, 0];
      for (const k of atPoint.get(keyOf(p)))
        if (all[k].corners[0].group === corner.group && dot(all[k].n, tri.n) >= cos) for (let i = 0; i < 3; i++) sum[i] += all[k].n[i];
      return unit(sum);
    });
  // each part's size (its box's diagonal): grime comes only from a part at least half as large as the one
  // it falls on (a hat's brim over a head; not an eye on it)
  const sizes = new Map();
  for (const tri of all) {
    const box = sizes.get(tri.part) ?? { mn: [Infinity, Infinity, Infinity], mx: [-Infinity, -Infinity, -Infinity] };
    for (const p of tri.p) for (let i = 0; i < 3; i++) [box.mn[i], box.mx[i]] = [Math.min(box.mn[i], p[i]), Math.max(box.mx[i], p[i])];
    sizes.set(tri.part, box);
  }
  for (const [part, box] of sizes) sizes.set(part, Math.hypot(...sub(box.mx, box.mn)));

  // points over each part's surface, in a grid of cells: how near a texel is to another part in front of it
  // (over it, along the way it faces: the corner between a counter and a barrel; not a shell behind it)
  // each cell keeps its points by part, as flat numbers: a part asks only the parts that may dirty it
  const cell = CONTACT;
  const grid = new Map();
  const cellOf = (p) => p.map((v) => Math.floor(v / cell));
  const put = (p, part) => {
    const key = cellOf(p).join();
    if (!grid.has(key)) grid.set(key, new Map());
    const byPart = grid.get(key);
    if (!byPart.has(part)) byPart.set(part, []);
    byPart.get(part).push(p[0], p[1], p[2]);
  };
  for (const tri of all) {
    const [a, b, c] = tri.p;
    const longest = Math.max(Math.hypot(...sub(a, b)), Math.hypot(...sub(b, c)), Math.hypot(...sub(c, a)));
    const steps = Math.min(24, Math.max(1, Math.ceil(longest / SAMPLE)));
    for (let i = 0; i <= steps; i++)
      for (let j = 0; j <= steps - i; j++) {
        const u = i / steps;
        const v = j / steps;
        put([0, 1, 2].map((k) => a[k] + (b[k] - a[k]) * u + (c[k] - a[k]) * v), tri.part);
      }
  }
  // the parts large enough to dirty each part
  const dirtiedBy = new Map();
  const dirtiers = (part) => {
    if (!dirtiedBy.has(part)) dirtiedBy.set(part, new Set([...sizes].filter(([other, size]) => other !== part && size >= 0.5 * sizes.get(part)).map(([other]) => other)));
    return dirtiedBy.get(part);
  };
  // texels a quarter unit apart, of one part, facing one way, are near the same things: asked once
  const asked = new Map();
  const contactAt = (p, part, n) => {
    const key = `${part}|${p.map((v) => Math.round(v * 4)).join()}|${n.map((v) => Math.round(v * 2)).join()}`;
    if (!asked.has(key)) asked.set(key, contactOf(p, part, n));
    return asked.get(key);
  };
  const contactOf = (p, part, n) => {
    const [x, y, z] = cellOf(p);
    const from = dirtiers(part);
    let least2 = CONTACT * CONTACT;
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        for (let dz = -1; dz <= 1; dz++) {
          const byPart = grid.get(`${x + dx},${y + dy},${z + dz}`);
          if (!byPart) continue;
          for (const [other, q] of byPart) {
            if (!from.has(other)) continue;
            for (let i = 0; i < q.length; i += 3) {
              const ax = q[i] - p[0];
              const ay = q[i + 1] - p[1];
              const az = q[i + 2] - p[2];
              if (ax * n[0] + ay * n[1] + az * n[2] <= 0.05) continue;
              const d2 = ax * ax + ay * ay + az * az;
              if (d2 < least2) least2 = d2;
            }
          }
        }
    return 1 - Math.sqrt(least2) / CONTACT;
  };

  let texels = 0;
  meshes.forEach((mesh, m) => {
    if ((mesh.flags ?? 0) & AS_IS) return;
    const { width, height: tall, rgb } = mesh.image;
    const done = new Uint8Array(width * tall);
    for (const tri of all.filter((t) => t.m === m)) {
      // a part with no finish is still marked as done, so that the border grown below does not paint over it
      const finish = amounts(tri.part);
      const shade = finish ? 1 + (hashOf(tri.part) * 2 - 1) * finish.vary : 1;
      const uv = mesh.tris[tri.i].map((c) => [c.uv[0] * width, c.uv[1] * tall]);
      const x0 = Math.max(0, Math.floor(Math.min(...uv.map((q) => q[0]))));
      const x1 = Math.min(width - 1, Math.ceil(Math.max(...uv.map((q) => q[0]))));
      const y0 = Math.max(0, Math.floor(Math.min(...uv.map((q) => q[1]))));
      const y1 = Math.min(tall - 1, Math.ceil(Math.max(...uv.map((q) => q[1]))));
      const [A, B, C] = uv;
      const area = (B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1]);
      if (Math.abs(area) < 1e-9) continue;
      // units a texel covers here: a worn edge is never narrower than two texels, or it would not show
      const per = Math.sqrt(Math.hypot(...cross(sub(tri.p[1], tri.p[0]), sub(tri.p[2], tri.p[0]))) / Math.abs(area));
      const wornWidth = finish ? Math.max(0.12 + 0.4 * finish.wear, 2.2 * per) : 0;
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          const px = x + 0.5;
          const py = y + 0.5;
          // where the texel's middle is in the triangle (with a little over, so its border texels are taken)
          const w1 = ((px - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (py - A[1])) / area;
          const w2 = ((B[0] - A[0]) * (py - A[1]) - (px - A[0]) * (B[1] - A[1])) / area;
          const w0 = 1 - w1 - w2;
          if (w0 < -0.02 || w1 < -0.02 || w2 < -0.02) continue;
          const at = y * width + x;
          if (done[at]) continue;
          done[at] = 1;
          if (!finish) continue;
          const p = [0, 1, 2].map((k) => tri.p[0][k] * w0 + tri.p[1][k] * w1 + tri.p[2][k] * w2);
          const n = unit([0, 1, 2].map((k) => tri.normals[0][k] * w0 + tri.normals[1][k] * w1 + tri.normals[2][k] * w2));
          let f = shade * (1 + finish.light * 0.6 * n[2]);
          let colour = [0, 1, 2].map((k) => (rgb[at * 3 + k] / 255) * f);
          // a worn edge: lighter, broken up
          if (finish.wear > 0 && tri.worn.length) {
            const d = Math.min(...tri.worn.map(([a, b]) => toSegment(p, a, b)));
            const broken = step(0.36, 0.5, fbm3(p, 1.6 / Math.max(1, wornWidth * 2), 11, 3));
            const a = Math.min(1, finish.wear * 1.6) * clamp01(1 - d / wornWidth) ** 0.7 * broken;
            colour = colour.map((v) => v + (Math.min(1, v * 1.55 + 0.14) - v) * a);
          }
          // grime: in the corners against other parts, and at the foot
          if (finish.grime > 0) {
            let g = contactAt(p, tri.part, n) ** 1.5;
            if (ground !== null) g = Math.max(g, clamp01(1 - (p[2] - ground) / (GROUND + GROUND_SHARE * height)));
            g *= finish.grime * (0.1 + 0.9 * fbm3(p, 0.9, 23, 3));
            g = clamp01(g);
            const dirt = [0.2, 0.16, 0.12];
            colour = colour.map((v, k) => v * (1 - 0.7 * g) + dirt[k] * 0.3 * g);
          }
          for (let k = 0; k < 3; k++) rgb[at * 3 + k] = Math.round(255 * clamp01(colour[k]));
          texels++;
        }
    }
    // the border of each painted patch carried a texel out, so a filtered edge does not show the old colour
    for (let pass = 0; pass < 2; pass++) {
      const grown = [];
      for (let y = 0; y < tall; y++)
        for (let x = 0; x < width; x++) {
          const at = y * width + x;
          if (done[at]) continue;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= tall || done[ny * width + nx] !== 1) continue;
            grown.push([at, ny * width + nx]);
            break;
          }
        }
      for (const [at, from] of grown) {
        for (let k = 0; k < 3; k++) rgb[at * 3 + k] = rgb[from * 3 + k];
        done[at] = 2;
      }
      for (let i = 0; i < done.length; i++) if (done[i] === 2) done[i] = 1;
    }
  });
  return { texels };
}
