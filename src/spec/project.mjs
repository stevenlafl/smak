// Reference pictures projected onto a model as its texture: the person's own views of the thing (a front, a
// side, a top, a three-quarter view, drawn or photographed straight on), each laid onto the surfaces that face
// it. Each texel of the model is found on the shape (its point and the way it faces), and takes the colour of
// the pictures that see it, weighted by how squarely each does, where nothing of the model hides it from that
// view. A texel no picture sees keeps its material's paint.
//
//   paintProjections(meshes, views, { carry })    meshes as model.mjs builds them (corners { p, uv } in model
//                                               space, partOf, image { width, height, rgb }, flags)
//
// A view: { picture: { width, height, rgb | rgba }, yaw, pitch (degrees, as `render` takes them: yaw 0 looks
// at the front, 90 at the left side, pitch 90 down from above), area: [x0, y0, x1, y1] (the part of the picture
// to look in; the whole unless told), rect: [x0, y0, x1, y1] (where the model's outline lies in the picture;
// found unless told: the largest patch that is not background and every patch a hundredth its size or more,
// leaving out a caption in the area's top left corner), parts: [ids] (only these parts take it) }. The background is the picture's transparent pixels, or
// those of the commonest colour along the area's border; for colour, only those of it joined to the border.

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a) => {
  const l = Math.hypot(...a) || 1;
  return a.map((v) => v / l);
};
/** How squarely a surface must face a view to take its colour (the cosine), and the weight's power. */
const LEAST_FACING = 0.2;
const SHARPNESS = 4;
/** A view takes part in a texel's colour only if it faces the surface this share as squarely as the best view does. */
const SQUARE_SHARE = Number(process.env.SMAK_SQUARE_SHARE ?? 0.95);
/** A picture's dot is background within this of the background's colour, each channel (0 to 255). */
const BACKGROUND_NEAR = 14;

/** The camera of an orbit view with no perspective: { back (toward the camera), right, up }, as render has it. */
export function viewAxes(yaw, pitch) {
  const d = Math.PI / 180;
  const back = [Math.cos(pitch * d) * Math.cos(yaw * d), Math.cos(pitch * d) * Math.sin(yaw * d), Math.sin(pitch * d)];
  const forward = back.map((v) => -v);
  const right = unit(Math.abs(back[2]) > 0.999 ? [-Math.sin(yaw * d), Math.cos(yaw * d), 0] : cross(forward, [0, 0, 1]));
  return { back, right, up: cross(right, forward) };
}

/** The views by name. */
export const VIEW_NAMES = { front: [0, 0], left: [90, 0], back: [180, 0], right: [270, 0], top: [0, 90], below: [0, -90] };

/** Which dots of a picture are the thing: a mask, 1 for the thing. */
export function foregroundOf(picture, [x0, y0, x1, y1]) {
  const { width, rgb, rgba } = picture;
  const at = (x, y) => (rgba ? rgba.subarray((y * width + x) * 4, (y * width + x) * 4 + 4) : rgb.subarray((y * width + x) * 3, (y * width + x) * 3 + 3));
  // the background: the commonest colour along the area's border (a caption in a corner is not it)
  const counts = new Map();
  const tally = (x, y) => {
    const c = at(x, y);
    const key = `${c[0] >> 2},${c[1] >> 2},${c[2] >> 2}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  };
  for (let x = x0; x < x1; x++) (tally(x, y0), tally(x, y1 - 1));
  for (let y = y0; y < y1; y++) (tally(x0, y), tally(x1 - 1, y));
  const bg = [...counts].sort((a, b) => b[1] - a[1])[0][0].split(",").map((v) => Number(v) * 4 + 2);
  // a picture with see-through dots (a cut-out) has its background in them; an opaque one, in its border's colour
  let clear = false;
  if (rgba) for (let i = 3; i < rgba.length && !clear; i += 4) clear = rgba[i] < 128;
  const mask = new Uint8Array(picture.width * picture.height);
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++) {
      const c = at(x, y);
      const background = clear ? c[3] < 128 : Math.abs(c[0] - bg[0]) <= BACKGROUND_NEAR && Math.abs(c[1] - bg[1]) <= BACKGROUND_NEAR && Math.abs(c[2] - bg[2]) <= BACKGROUND_NEAR;
      if (!background) mask[y * width + x] = 1;
    }
  return mask;
}

/**
 * foregroundOf's mask with the background reached from the area's border only: a dot of the background's colour
 * that no run of background dots joins to the border is the thing (a dark patch of grey paint on a grey ground).
 * For colours laid on the shape; an outline that has to keep its holes goes by foregroundOf.
 */
export function enclosedForegroundOf(picture, [x0, y0, x1, y1]) {
  const width = picture.width;
  const mask = foregroundOf(picture, [x0, y0, x1, y1]);
  const outside = new Uint8Array(mask.length);
  const stack = [];
  const seed = (x, y) => {
    const i = y * width + x;
    if (!mask[i] && !outside[i]) (outside[i] = 1), stack.push(i);
  };
  for (let x = x0; x < x1; x++) (seed(x, y0), seed(x, y1 - 1));
  for (let y = y0; y < y1; y++) (seed(x0, y), seed(x1 - 1, y));
  while (stack.length) {
    const j = stack.pop();
    const jx = j % width;
    const jy = (j - jx) / width;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = jx + dx;
      const ny = jy + dy;
      if (nx >= x0 && ny >= y0 && nx < x1 && ny < y1) seed(nx, ny);
    }
  }
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) mask[y * width + x] = outside[y * width + x] ? 0 : 1;
  return mask;
}

/** Whether a picture is a cut-out: some of its dots see-through. */
function cutOut(picture) {
  if (!picture.rgba) return false;
  for (let i = 3; i < picture.rgba.length; i += 4) if (picture.rgba[i] < 128) return true;
  return false;
}

/** A cut-out's dots whose colour is the thing's alone: wholly opaque, in the mask, and not on its edge. */
function solidOf(picture, mask, [x0, y0, x1, y1]) {
  const { width, rgba } = picture;
  const opaque = new Uint8Array(mask.length);
  for (let i = 0; i < mask.length; i++) opaque[i] = mask[i] && rgba[i * 4 + 3] >= 250 ? 1 : 0;
  const solid = new Uint8Array(mask.length);
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++) {
      const i = y * width + x;
      solid[i] = opaque[i] && x > x0 && y > y0 && x < x1 - 1 && y < y1 - 1 && opaque[i - 1] && opaque[i + 1] && opaque[i - width] && opaque[i + width] ? 1 : 0;
    }
  return solid;
}

/** The nearest solid dot to dot i, within a few dots (a texel just past the cut takes the thing's colour). */
function nearestSolid(solid, width, height, i, reach = 4) {
  const x = i % width;
  const y = (i - x) / width;
  let best = null;
  let bestD = Infinity;
  for (let dy = -reach; dy <= reach; dy++)
    for (let dx = -reach; dx <= reach; dx++) {
      const [nx, ny] = [x + dx, y + dy];
      if (nx < 0 || ny < 0 || nx >= width || ny >= height || !solid[ny * width + nx]) continue;
      const d = dx * dx + dy * dy;
      if (d < bestD) [best, bestD] = [ny * width + nx, d];
    }
  return best;
}

/** The outline's box in a mask: the largest patch, with every patch at least a tenth its size. */
export function outlineBox(mask, width, [x0, y0, x1, y1]) {
  const label = new Int32Array(mask.length);
  const patches = [];
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++) {
      const i = y * width + x;
      if (!mask[i] || label[i]) continue;
      const box = { n: 0, x0: x, y0: y, x1: x, y1: y };
      const stack = [i];
      label[i] = patches.length + 1;
      while (stack.length) {
        const j = stack.pop();
        const jx = j % width;
        const jy = (j - jx) / width;
        box.n++;
        box.x0 = Math.min(box.x0, jx);
        box.x1 = Math.max(box.x1, jx);
        box.y0 = Math.min(box.y0, jy);
        box.y1 = Math.max(box.y1, jy);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = jx + dx;
          const ny = jy + dy;
          if (nx < x0 || ny < y0 || nx >= x1 || ny >= y1) continue;
          const k = ny * width + nx;
          if (mask[k] && !label[k]) {
            label[k] = patches.length + 1;
            stack.push(k);
          }
        }
      }
      patches.push(box);
    }
  if (!patches.length) return null;
  // a caption sits in the area's top left corner; any other patch a hundredth the size of the largest or more
  // is part of the thing (a thin fitting apart from the body in the picture)
  // (the kit's sheets draw their caption's band from 4 dots in, 14 high: a patch that starts within 8 dots of
  // the corner and ends within 24 of its top is one)
  const caption = (p) => p.x0 <= x0 + 8 && p.y0 <= y0 + 8 && p.y1 <= y0 + 24;
  const largest = Math.max(...patches.map((p) => p.n));
  const kept = patches.filter((p) => p.n >= largest / 100 && (p.n === largest || !caption(p)));
  return [Math.min(...kept.map((p) => p.x0)), Math.min(...kept.map((p) => p.y0)), Math.max(...kept.map((p) => p.x1)) + 1, Math.max(...kept.map((p) => p.y1)) + 1];
}

/** A picture's colour at a point, nearest pixel. */
function colourAtPicture(picture, x, y) {
  const i = Math.min(picture.width - 1, Math.max(0, Math.floor(x))) + Math.min(picture.height - 1, Math.max(0, Math.floor(y))) * picture.width;
  return picture.rgba ? [picture.rgba[i * 4], picture.rgba[i * 4 + 1], picture.rgba[i * 4 + 2]] : [picture.rgb[i * 3], picture.rgb[i * 3 + 1], picture.rgb[i * 3 + 2]];
}

/** Least squares: rows of [x1 ... xk, y], the k coefficients (normal equations, Gaussian elimination). */
function leastSquares(rows) {
  const k = rows[0].length - 1;
  const a = Array.from({ length: k }, () => new Array(k + 1).fill(0));
  for (const r of rows) for (let i = 0; i < k; i++) { for (let j = 0; j < k; j++) a[i][j] += r[i] * r[j]; a[i][k] += r[i] * r[k]; }
  for (let i = 0; i < k; i++) {
    let p = i;
    for (let j = i + 1; j < k; j++) if (Math.abs(a[j][i]) > Math.abs(a[p][i])) p = j;
    [a[i], a[p]] = [a[p], a[i]];
    if (Math.abs(a[i][i]) < 1e-9) return null;
    for (let j = 0; j < k; j++) if (j !== i) { const f = a[j][i] / a[i][i]; for (let m = i; m <= k; m++) a[j][m] -= f * a[i][m]; }
  }
  return a.map((row, i) => row[k] / row[i]);
}

/** Faces about a point that bend less than this from a triangle's own share its smooth normal there (degrees). */
const CORNER_BEND = 60;

/** The faces a view must see squarely for its light to be fitted and divided out. */
const LIGHT_FIT_LEAST = 60;

/** How many texels a picture's colour is spread past the edge of what the triangles cover. */
const BLEED = 3;

/**
 * The colour painted from the pictures spread outwards, a ring at a time, into the texels no triangle covers: the
 * engine's texture filter reads a texel or two past a cut, and the material's flat paint there shows as a seam.
 */
function bleed({ width, height, rgb }, covered, painted) {
  let ring = painted;
  for (let step = 0; step < BLEED; step++) {
    const next = new Uint8Array(ring);
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const at = y * width + x;
        if (ring[at] || covered[at]) continue;
        const sum = [0, 0, 0];
        let n = 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
          const [nx, ny] = [x + dx, y + dy];
          if (nx < 0 || ny < 0 || nx >= width || ny >= height || !ring[ny * width + nx]) continue;
          for (let k = 0; k < 3; k++) sum[k] += rgb[(ny * width + nx) * 3 + k];
          n++;
        }
        if (!n) continue;
        for (let k = 0; k < 3; k++) rgb[at * 3 + k] = Math.round(sum[k] / n);
        next[at] = 1;
      }
    ring = next;
  }
}

/** How far (units, across and up in the first view) a texel no view sees reaches for the colour it is carried. */
const CARRY_REACH = 2.5;

/**
 * Paints the views into the meshes' pictures, in place. Returns { texels (painted), views: [{ rect, seen }], carried }:
 * each view's outline box in its picture and how many texels it gave colour to. With `carry`, a texel no view
 * sees (a character's back, from one picture of its front) takes the colour of what the first view shows at the
 * same place across and up, softened over CARRY_REACH units: the shirt's back is the shirt, not the material
 * (the generated guard's back was its plain material, research/generated-characters.md); `carried` counts them.
 */
export function paintProjections(meshes, views, { carry = false } = {}) {
  const all = meshes.flatMap((mesh) => mesh.tris.map((t) => t.map((c) => c.p)));
  const prepared = views.map((view) => {
    const { picture } = view;
    const { back, right, up } = viewAxes(view.yaw, view.pitch);
    const area = view.area ?? [0, 0, picture.width, picture.height];
    const mask = enclosedForegroundOf(picture, area);
    const rect = view.rect ?? outlineBox(foregroundOf(picture, area), picture.width, area);
    if (!rect) return null;
    // the model's outline box in this view, in units across (right) and up: of the parts the view is for, when it
    // names them (a picture of the body alone is not stretched over the gear hung on it)
    const own = view.parts ? meshes.flatMap((mesh) => mesh.tris.filter((_, i) => view.parts.includes(String(mesh.partOf?.[i] ?? "").split(".")[0])).map((t) => t.map((c) => c.p))) : all;
    const outline = own.length ? own : all;
    const across = outline.flat().map((p) => dot(p, right));
    const high = outline.flat().map((p) => dot(p, up));
    const [a0, a1, h0, h1] = [Math.min(...across), Math.max(...across), Math.min(...high), Math.max(...high)];
    const toPicture = (p) => [rect[0] + ((dot(p, right) - a0) / (a1 - a0 || 1)) * (rect[2] - rect[0]), rect[1] + ((h1 - dot(p, up)) / (h1 - h0 || 1)) * (rect[3] - rect[1])];
    // a depth buffer of the whole model from this view, at the picture's dots: what each dot sees nearest
    const width = picture.width;
    const depth = new Float32Array(width * picture.height).fill(-Infinity);
    for (const tri of all) {
      const q = tri.map(toPicture);
      const z = tri.map((p) => dot(p, back));
      const [A, B, C] = q;
      const area2 = (B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1]);
      if (Math.abs(area2) < 1e-9) continue;
      const x0 = Math.max(0, Math.floor(Math.min(A[0], B[0], C[0])));
      const x1 = Math.min(width - 1, Math.ceil(Math.max(A[0], B[0], C[0])));
      const y0 = Math.max(0, Math.floor(Math.min(A[1], B[1], C[1])));
      const y1 = Math.min(picture.height - 1, Math.ceil(Math.max(A[1], B[1], C[1])));
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          const w1 = ((x + 0.5 - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (y + 0.5 - A[1])) / area2;
          const w2 = ((B[0] - A[0]) * (y + 0.5 - A[1]) - (x + 0.5 - A[0]) * (B[1] - A[1])) / area2;
          const w0 = 1 - w1 - w2;
          if (w0 < 0 || w1 < 0 || w2 < 0) continue;
          const d = w0 * z[0] + w1 * z[1] + w2 * z[2];
          if (d > depth[y * width + x]) depth[y * width + x] = d;
        }
    }
    const extent = Math.max(a1 - a0, h1 - h0);
    // a cut-out's dots on its edge are half the ground it was cut from (a white fringe round a chair's legs), and
    // its see-through dots keep that ground's colour: colour is taken only from its solid dots a dot in from the edge
    const solid = cutOut(picture) ? solidOf(picture, mask, area) : null;
    return { view, picture, back, toPicture, depth, mask: solid ?? mask, solid, rect, slack: extent * 0.01 + 0.05, parts: view.parts ? new Set(view.parts) : null, seen: 0 };
  });
  // the light each picture carries, as a function of the way a surface faces in that view: brightness fitted
  // to the face's direction (right, up, toward the camera) over the triangles it sees squarely; a texel's colour
  // is divided by it, relative to a face seen head-on, so the game's own light is not laid over a second shading
  if (process.env.SMAK_DELIGHT !== "0")
    for (const v of prepared) {
      if (!v) continue;
      const { right, up } = viewAxes(v.view.yaw, v.view.pitch);
      const rows = [];
      for (const tri of all) {
        const n = unit(cross(sub(tri[1], tri[0]), sub(tri[2], tri[0])));
        if (dot(n, v.back) < 0.3) continue;
        const mid = [0, 1, 2].map((k) => (tri[0][k] + tri[1][k] + tri[2][k]) / 3);
        const [px, py] = v.toPicture(mid);
        const ix = Math.floor(px);
        const iy = Math.floor(py);
        if (ix < 0 || iy < 0 || ix >= v.picture.width || iy >= v.picture.height) continue;
        const at = iy * v.picture.width + ix;
        if (!v.mask[at] || dot(mid, v.back) < v.depth[at] - v.slack) continue;
        const c = colourAtPicture(v.picture, px, py);
        rows.push([1, dot(n, right), dot(n, up), dot(n, v.back), 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]]);
      }
      // a few large faces differ by their paint (a battery's teal glass beside its grey metal), and four numbers
      // fitted to them take that paint for light; only many small faces show the light itself. Steven's blind A/B
      // (2026-10-14): de-lit was closer on the headcrab (106 to 212 faces a view), not on the battery (14 to 41)
      v.light = rows.length >= LIGHT_FIT_LEAST ? leastSquares(rows) : null;
    }
  const lightOf = (v, n) => {
    if (!v.light) return 1;
    const { right, up } = viewAxes(v.view.yaw, v.view.pitch);
    const [c0, cr, cu, cb] = v.light;
    const head = c0 + cb;
    const here = c0 + cr * dot(n, right) + cu * dot(n, up) + cb * dot(n, v.back);
    return head > 1 && here > 1 ? Math.max(0.6, Math.min(1.6, here / head)) : 1;
  };
  const colourAt = (v, x, y) => {
    const { picture } = v;
    let i = Math.min(picture.width - 1, Math.max(0, Math.floor(x))) + Math.min(picture.height - 1, Math.max(0, Math.floor(y))) * picture.width;
    if (v.solid && !v.solid[i]) i = nearestSolid(v.solid, picture.width, picture.height, i) ?? i;
    return picture.rgba ? [picture.rgba[i * 4], picture.rgba[i * 4 + 1], picture.rgba[i * 4 + 2]] : [picture.rgb[i * 3], picture.rgb[i * 3 + 1], picture.rgb[i * 3 + 2]];
  };

  // a smooth normal at each triangle's corners, the faces about a point within CORNER_BEND of this one averaged:
  // a texel weighs the views by it, so that two triangles meeting at a gentle bend agree at their edge and the
  // views give way to one another gradually (by the face alone a dome's triangles each took a different picture,
  // and the edges between showed as seams of light and dark)
  const faceNormal = (t) => unit(cross(sub(t[1].p, t[0].p), sub(t[2].p, t[0].p)));
  const keyOf = (p) => p.map((v) => Math.round(v * 1000)).join(",");
  const around = new Map();
  for (const mesh of meshes)
    for (const t of mesh.tris) {
      const n = faceNormal(t);
      const area = Math.hypot(...cross(sub(t[1].p, t[0].p), sub(t[2].p, t[0].p)));
      for (const c of t) {
        const k = keyOf(c.p);
        if (!around.has(k)) around.set(k, []);
        around.get(k).push([n, area]);
      }
    }
  const cosBend = Math.cos((CORNER_BEND * Math.PI) / 180);
  const cornersOf = (t) => {
    const own = faceNormal(t);
    return t.map((c) => {
      const sum = [0, 0, 0];
      for (const [n, area] of around.get(keyOf(c.p)) ?? []) if (dot(n, own) >= cosBend) for (let k = 0; k < 3; k++) sum[k] += n[k] * area;
      return Math.hypot(...sum) > 0 ? unit(sum) : own;
    });
  };
  let texels = 0;
  // with carry: the painted texels' places and colours, and the unseen ones' places, to be filled after
  const paintedAt = [];
  const unseen = [];
  for (const mesh of meshes) {
    const { width, height, rgb } = mesh.image;
    // which texels a triangle covers, and which took a picture's colour: the colour is spread past the cuts after
    const covered = new Uint8Array(width * height);
    const painted = new Uint8Array(width * height);
    mesh.tris.forEach((tri, ti) => {
      const part = String(mesh.partOf?.[ti] ?? "").split(".")[0];
      const p = tri.map((c) => c.p);
      const n = unit(cross(sub(p[1], p[0]), sub(p[2], p[0])));
      const corner = cornersOf(tri);
      const uv = tri.map((c) => [c.uv[0] * width, c.uv[1] * height]);
      const [A, B, C] = uv;
      const area2 = (B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1]);
      if (Math.abs(area2) < 1e-9) return;
      const takers = prepared.filter((v) => v && (!v.parts || v.parts.has(part)) && dot(n, v.back) > LEAST_FACING);
      // a face no view looks at is passed over, unless its texels are to be carried a colour (its back)
      if (!takers.length && !carry) return;
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
          covered[y * width + x] = 1;
          const q = [0, 1, 2].map((k) => p[0][k] * w0 + p[1][k] * w1 + p[2][k] * w2);
          const ns = unit([0, 1, 2].map((k) => corner[0][k] * w0 + corner[1][k] * w1 + corner[2][k] * w2));
          // the pictures' dots of the thing first; where none sees this texel, any dot the model covers (a speck
          // of the ground's colour on the outline's edge is still the thing's)
          let sum;
          let weight = 0;
          for (const masked of [true, false]) {
            sum = [0, 0, 0];
            // only the views that see this point nearly as squarely as the best one that sees it: a view that
            // grazes a face smears what it shows of the next one over it (a tab's stripes down its sides)
            const seeing = takers.filter((v) => {
              const [px, py] = v.toPicture(q);
              const ix = Math.floor(px);
              const iy = Math.floor(py);
              if (ix < 0 || iy < 0 || ix >= v.picture.width || iy >= v.picture.height) return false;
              const at = iy * v.picture.width + ix;
              if (masked ? !v.mask[at] : v.solid && !v.solid[at] && nearestSolid(v.solid, v.picture.width, v.picture.height, at) === null) return false;
              return dot(q, v.back) >= v.depth[at] - v.slack;
            });
            const best = Math.max(0, ...seeing.map((v) => dot(ns, v.back)));
            for (const v of seeing.filter((v) => dot(ns, v.back) >= best * SQUARE_SHARE)) {
              const [px, py] = v.toPicture(q);
              const w = Math.max(0, dot(ns, v.back)) ** SHARPNESS;
              const shade = lightOf(v, ns);
              const c = colourAt(v, px, py).map((value) => Math.min(255, value / shade));
              sum = sum.map((s, k) => s + c[k] * w);
              weight += w;
              v.seen++;
            }
            if (weight) break;
          }
          if (!weight) {
            if (carry && !painted[y * width + x]) unseen.push({ mesh, at: y * width + x, q });
            continue;
          }
          const i = (y * width + x) * 3;
          for (let k = 0; k < 3; k++) rgb[i + k] = Math.round(sum[k] / weight);
          painted[y * width + x] = 1;
          if (carry) paintedAt.push({ q, c: [rgb[i], rgb[i + 1], rgb[i + 2]] });
          texels++;
        }
    });
    mesh.covered = covered;
    mesh.painted = painted;
  }
  let carried = 0;
  const first = prepared.find(Boolean);
  if (carry && first && unseen.length && paintedAt.length) {
    // a grid over the first view's plane (across and up), each cell the painted texels in it
    const { right, up } = viewAxes(first.view.yaw, first.view.pitch);
    const cell = CARRY_REACH;
    const grid = new Map();
    const keyOf = (a, h) => `${Math.floor(a / cell)},${Math.floor(h / cell)}`;
    for (const s of paintedAt) {
      const k = keyOf(dot(s.q, right), dot(s.q, up));
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push(s);
    }
    for (const { mesh, at, q } of unseen) {
      const [a, h] = [dot(q, right), dot(q, up)];
      const [ca, ch] = [Math.floor(a / cell), Math.floor(h / cell)];
      const sum = [0, 0, 0];
      let weight = 0;
      // the nearest ring of cells that has any, so a gap in the front (an arm's shadow) reaches further
      for (let r = 1; r <= 4 && !weight; r++)
        for (let i = ca - r; i <= ca + r; i++)
          for (let j = ch - r; j <= ch + r; j++)
            for (const s of grid.get(`${i},${j}`) ?? []) {
              const d = Math.hypot(dot(s.q, right) - a, dot(s.q, up) - h);
              if (d > r * cell) continue;
              const w = 1 / (0.25 + d);
              for (let k = 0; k < 3; k++) sum[k] += s.c[k] * w;
              weight += w;
            }
      if (!weight) continue;
      for (let k = 0; k < 3; k++) mesh.image.rgb[at * 3 + k] = Math.round(sum[k] / weight);
      mesh.painted[at] = 1;
      carried++;
    }
  }
  for (const mesh of meshes) {
    bleed(mesh.image, mesh.covered, mesh.painted);
    delete mesh.covered;
    delete mesh.painted;
  }
  return { texels, carried, views: prepared.map((v) => (v ? { rect: v.rect, seen: v.seen } : null)) };
}

/** sRGB (0 to 255) to CIE Lab, for colour differences a person would call so. */
function labOf([r, g, b]) {
  const lin = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const X = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047;
  const Y = 0.2126 * R + 0.7152 * G + 0.0722 * B;
  const Z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}

/** Rows of cells a view's comparison is made in; the columns follow its proportions. */
const FIT_ROWS = 16;

/**
 * The built model drawn from each picture's camera, set against the picture in cells: where its painted look
 * parts from the picture's (a strap's texels reading the case behind it, a part a little out of place). For each
 * view (as `paintProjections` takes them): { meanDeltaE, worst: { deltaE, where } } over the cells both cover, or
 * null when the thing is not found in the picture. `draw(yaw, pitch)` draws the model, `{ width, height, rgba }`.
 */
export function viewFit(draw, views) {
  const ground = (img, i) => Math.abs(img.rgba[i * 4] - img.rgba[0]) + Math.abs(img.rgba[i * 4 + 1] - img.rgba[1]) + Math.abs(img.rgba[i * 4 + 2] - img.rgba[2]) < 8;
  const boxIn = (img) => {
    let [x0, y0, x1, y1] = [Infinity, Infinity, -1, -1];
    for (let y = 0; y < img.height; y++)
      for (let x = 0; x < img.width; x++)
        if (!ground(img, y * img.width + x)) [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x + 1), Math.max(y1, y + 1)];
    return x1 < 0 ? null : [x0, y0, x1, y1];
  };
  const cellsOf = (img, [x0, y0, x1, y1], cols, keep) => {
    const sum = Array.from({ length: cols * FIT_ROWS }, () => [0, 0, 0, 0, 0]);
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        const c = Math.min(cols - 1, Math.floor(((x - x0) / (x1 - x0)) * cols)) + Math.min(FIT_ROWS - 1, Math.floor(((y - y0) / (y1 - y0)) * FIT_ROWS)) * cols;
        const i = y * img.width + x;
        sum[c][4]++;
        if (!keep(i)) continue;
        for (let k = 0; k < 3; k++) sum[c][k] += (img.rgba ?? img.rgb)[i * (img.rgba ? 4 : 3) + k];
        sum[c][3]++;
      }
    return sum.map((s) => (s[3] > s[4] / 2 ? [s[0] / s[3], s[1] / s[3], s[2] / s[3]] : null));
  };
  return views.map((view) => {
    const { picture } = view;
    const area = view.area ?? [0, 0, picture.width, picture.height];
    const mask = foregroundOf(picture, area);
    const rect = view.rect ?? outlineBox(mask, picture.width, area);
    const drawn = draw(view.yaw, view.pitch);
    const box = boxIn(drawn);
    if (!rect || !box) return null;
    const cols = Math.max(1, Math.round((FIT_ROWS * (rect[2] - rect[0])) / Math.max(1, rect[3] - rect[1])));
    const a = cellsOf(picture, rect, cols, (i) => mask[i]);
    const b = cellsOf(drawn, box, cols, (i) => !ground(drawn, i));
    let sum = 0;
    let n = 0;
    let worst = { deltaE: 0, at: 0 };
    a.forEach((ca, i) => {
      const cb = b[i];
      if (!ca || !cb) return;
      const [p, q] = [labOf(ca), labOf(cb)];
      const d = Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
      sum += d;
      n++;
      if (d > worst.deltaE) worst = { deltaE: d, at: i };
    });
    if (!n) return null;
    const [col, row] = [worst.at % cols, Math.floor(worst.at / cols)];
    const where = `${["top", "upper middle", "lower middle", "bottom"][Math.min(3, Math.floor((row / FIT_ROWS) * 4))]} ${["left", "middle", "right"][Math.min(2, Math.floor((col / cols) * 3))]}`;
    return { meanDeltaE: Math.round(sum / n * 10) / 10, worst: { deltaE: Math.round(worst.deltaE), where } };
  });
}
