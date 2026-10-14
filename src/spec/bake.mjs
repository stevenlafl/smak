// Parts painted into what they sit on (`paint: true`): a strap, a vent, a pull, a seam's cover, a label plate,
// anything that stands off a surface by less than it shows. Each is built as any part is, then the texels of
// the other parts take its colour where a short ray out along their surface meets it, lit by the way its face
// turns (so a raised edge still reads), and its triangles are left out. Valve's own props are made so: a filing
// cabinet's drawers and pulls are its picture, its shape a box (research/repeated-failures.md, 5).
//
//   bakeParts(meshes, ids, { reach }) -> { texels, removed }   meshes changed in place

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a) => {
  const l = Math.hypot(...a) || 1;
  return a.map((v) => v / l);
};

/** Where a ray from `o` along `d` meets a triangle: { t, u, v } (Moller and Trumbore 1997), or null. */
function hit(o, d, [a, b, c]) {
  const e1 = sub(b, a);
  const e2 = sub(c, a);
  const p = cross(d, e2);
  const det = dot(e1, p);
  if (Math.abs(det) < 1e-12) return null;
  const s = sub(o, a);
  const u = dot(s, p) / det;
  if (u < 0 || u > 1) return null;
  const q = cross(s, e1);
  const v = dot(d, q) / det;
  if (v < 0 || u + v > 1) return null;
  return { t: dot(e2, q) / det, u, v };
}

/**
 * Paints the parts `ids` into the meshes' other parts and takes their triangles out. `reach`: how far out
 * from a surface (units) a painted part is looked for (it must sit within this of what it is painted on).
 */
export function bakeParts(meshes, ids, { reach = 1.5 } = {}) {
  const painted = new Set(ids);
  const isPainted = (mesh, i) => painted.has(String(mesh.partOf?.[i] ?? "").split(".")[0]);
  // the painted triangles, with their picture as it was (read from a copy, so painting does not feed back)
  const sources = [];
  for (const mesh of meshes) {
    const copy = Uint8Array.from(mesh.image.rgb);
    mesh.tris.forEach((t, i) => {
      if (!isPainted(mesh, i)) return;
      const p = t.map((c) => c.p);
      sources.push({ p, uv: t.map((c) => c.uv), n: unit(cross(sub(p[1], p[0]), sub(p[2], p[0]))), image: { ...mesh.image, rgb: copy } });
    });
  }
  if (!sources.length) return { texels: 0, removed: 0 };
  const box = [0, 1, 2].map((k) => [Math.min(...sources.flatMap((s) => s.p.map((q) => q[k]))) - reach, Math.max(...sources.flatMap((s) => s.p.map((q) => q[k]))) + reach]);
  const near = (q) => q.every((v, k) => v >= box[k][0] && v <= box[k][1]);
  let texels = 0;
  for (const mesh of meshes) {
    const { width, height, rgb } = mesh.image;
    mesh.tris.forEach((tri, ti) => {
      if (isPainted(mesh, ti)) return;
      const p = tri.map((c) => c.p);
      if (!p.some(near) && !near(p.reduce((s, q) => s.map((v, k) => v + q[k] / 3), [0, 0, 0]))) return;
      const n = unit(cross(sub(p[1], p[0]), sub(p[2], p[0])));
      const uv = tri.map((c) => [c.uv[0] * width, c.uv[1] * height]);
      const [A, B, C] = uv;
      const area2 = (B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1]);
      if (Math.abs(area2) < 1e-9) return;
      const x0 = Math.max(0, Math.floor(Math.min(A[0], B[0], C[0])));
      const x1 = Math.min(width - 1, Math.ceil(Math.max(A[0], B[0], C[0])));
      const y0 = Math.max(0, Math.floor(Math.min(A[1], B[1], C[1])));
      const y1 = Math.min(height - 1, Math.ceil(Math.max(A[1], B[1], C[1])));
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          const w1 = ((x + 0.5 - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (y + 0.5 - A[1])) / area2;
          const w2 = ((B[0] - A[0]) * (y + 0.5 - A[1]) - (x + 0.5 - A[0]) * (B[1] - A[1])) / area2;
          const w0 = 1 - w1 - w2;
          if (w0 < -0.02 || w1 < -0.02 || w2 < -0.02) continue;
          const q = [0, 1, 2].map((k) => p[0][k] * w0 + p[1][k] * w1 + p[2][k] * w2);
          if (!near(q)) continue;
          // from a little inside the surface, out along it: the outermost painted face, the one seen from outside
          const from = q.map((v, k) => v - n[k] * 0.3);
          let best = null;
          for (const s of sources) {
            if (dot(s.n, n) < 0.2) continue;
            const h = hit(from, n, s.p);
            if (h && h.t >= 0 && h.t <= reach + 0.3 && (!best || h.t > best.h.t)) best = { s, h };
          }
          if (!best) continue;
          const { s, h } = best;
          const w = [1 - h.u - h.v, h.u, h.v];
          const su = s.uv.reduce((acc, c, k) => acc + c[0] * w[k], 0) * s.image.width;
          const sv = s.uv.reduce((acc, c, k) => acc + c[1] * w[k], 0) * s.image.height;
          const si = (Math.min(s.image.height - 1, Math.max(0, Math.floor(sv))) * s.image.width + Math.min(s.image.width - 1, Math.max(0, Math.floor(su)))) * 3;
          // a face of the painted part that turns from the surface (a bevel, an edge) is shaded by how it turns
          const shade = 0.75 + 0.25 * dot(s.n, n) + 0.12 * s.n[2];
          const i = (y * width + x) * 3;
          for (let k = 0; k < 3; k++) rgb[i + k] = Math.max(0, Math.min(255, Math.round(s.image.rgb[si + k] * shade)));
          texels++;
        }
    });
  }
  // the painted parts' triangles out
  let removed = 0;
  for (const mesh of meshes) {
    const keep = mesh.tris.map((_, i) => !isPainted(mesh, i));
    removed += keep.filter((k) => !k).length;
    mesh.tris = mesh.tris.filter((_, i) => keep[i]);
    if (mesh.partOf) mesh.partOf = mesh.partOf.filter((_, i) => keep[i]);
  }
  return { texels, removed };
}
