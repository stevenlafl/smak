// Reference pictures projected onto a model as its texture: the person's own views of the thing (a front, a
// side, a top, a three-quarter view, drawn or photographed straight on), each laid onto the surfaces that face
// it. Each texel of the model is found on the shape (its point and the way it faces), and takes the colour of
// the pictures that see it, weighted by how squarely each does, where nothing of the model hides it from that
// view. A texel no picture sees keeps its material's paint.
//
//   paintProjections(meshes, views, { only })    meshes as model.mjs builds them (corners { p, uv } in model
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

/**
 * Paints the views into the meshes' pictures, in place. Returns { texels (painted), views: [{ rect, seen }] }:
 * each view's outline box in its picture and how many texels it gave colour to.
 */
export function paintProjections(meshes, views) {
  const all = meshes.flatMap((mesh) => mesh.tris.map((t) => t.map((c) => c.p)));
  const prepared = views.map((view) => {
    const { picture } = view;
    const { back, right, up } = viewAxes(view.yaw, view.pitch);
    const area = view.area ?? [0, 0, picture.width, picture.height];
    const mask = enclosedForegroundOf(picture, area);
    const rect = view.rect ?? outlineBox(foregroundOf(picture, area), picture.width, area);
    if (!rect) return null;
    // the model's outline box in this view, in units across (right) and up
    const across = all.flat().map((p) => dot(p, right));
    const high = all.flat().map((p) => dot(p, up));
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
    return { view, picture, back, toPicture, depth, mask, rect, slack: extent * 0.01 + 0.05, parts: view.parts ? new Set(view.parts) : null, seen: 0 };
  });
  const colourAt = (v, x, y) => {
    const { picture } = v;
    const i = Math.min(picture.width - 1, Math.max(0, Math.floor(x))) + Math.min(picture.height - 1, Math.max(0, Math.floor(y))) * picture.width;
    return picture.rgba ? [picture.rgba[i * 4], picture.rgba[i * 4 + 1], picture.rgba[i * 4 + 2]] : [picture.rgb[i * 3], picture.rgb[i * 3 + 1], picture.rgb[i * 3 + 2]];
  };

  let texels = 0;
  for (const mesh of meshes) {
    const { width, height, rgb } = mesh.image;
    mesh.tris.forEach((tri, ti) => {
      const part = String(mesh.partOf?.[ti] ?? "").split(".")[0];
      const p = tri.map((c) => c.p);
      const n = unit(cross(sub(p[1], p[0]), sub(p[2], p[0])));
      const uv = tri.map((c) => [c.uv[0] * width, c.uv[1] * height]);
      const [A, B, C] = uv;
      const area2 = (B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1]);
      if (Math.abs(area2) < 1e-9) return;
      const takers = prepared.filter((v) => v && (!v.parts || v.parts.has(part)) && dot(n, v.back) > LEAST_FACING);
      if (!takers.length) return;
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
          // the pictures' dots of the thing first; where none sees this texel, any dot the model covers (a speck
          // of the ground's colour on the outline's edge is still the thing's)
          let sum;
          let weight = 0;
          for (const masked of [true, false]) {
            sum = [0, 0, 0];
            for (const v of takers) {
              const [px, py] = v.toPicture(q);
              const ix = Math.floor(px);
              const iy = Math.floor(py);
              if (ix < 0 || iy < 0 || ix >= v.picture.width || iy >= v.picture.height) continue;
              const at = iy * v.picture.width + ix;
              if ((masked && !v.mask[at]) || dot(q, v.back) < v.depth[at] - v.slack) continue;
              const w = dot(n, v.back) ** SHARPNESS;
              const c = colourAt(v, px, py);
              sum = sum.map((s, k) => s + c[k] * w);
              weight += w;
              v.seen++;
            }
            if (weight) break;
          }
          if (!weight) continue;
          const i = (y * width + x) * 3;
          for (let k = 0; k < 3; k++) rgb[i + k] = Math.round(sum[k] / weight);
          texels++;
        }
    });
  }
  return { texels, views: prepared.map((v) => (v ? { rect: v.rect, seen: v.seen } : null)) };
}
