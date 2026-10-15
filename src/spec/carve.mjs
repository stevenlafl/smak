// A shape carved from its outlines: the visual hull (Laurentini 1994). Each picture of the thing, seen
// straight on with no perspective, says that the thing lies inside its outline swept along the way the picture
// looks; what every picture allows is the largest solid they all agree on. A grid of cells is cut to that
// solid, its surface found (marching tetrahedra: closed, and with no edge of more than two faces) with each
// point put where the outlines cross between two cells, smoothed a little, and brought down to a count of
// triangles by qem.mjs. A view and the one opposite it count as one outline (see carveBy).
//
//   carve(views, { size, cells, target, smooth })   ->  { tris, report }
//   masksFromPicture(picture, area, rect)            ->  a view's mask from one picture of a sheet
//   sheetViews(picture, { cols, names })             ->  the views of a sheet of sides, as smak's sheets lay them
//
// A view: { mask: { width, height, data (1 for the thing) }, yaw, pitch (degrees, as `render` and project.mjs's
// viewAxes take them: yaw 0 looks at the front, 90 at the left side, pitch 90 down from above), rect: [x0, y0,
// x1, y1] (the outline's box in the mask: found unless told), scale (dots a unit), centre: [x, y] (the dot the
// middle of the thing's box falls on), name }.
//
// How a mask's dots are put on the thing, as project.mjs puts a picture on a model: a view straight along an
// axis has its outline's box stretched onto the thing's box seen that way (`size`, each view on its own axes).
// A view at an angle cannot be, since a box seen slantwise is larger than the thing in it: it takes its scale
// from the views along the axes (all of one sheet are to one scale) unless told, and its middle from `centre`,
// else from the hull the other views carved, seen from it.
//
// What it cannot do: see a hollow that no outline shows (a cup's inside, a dent, the space between a monster's
// legs when no picture looks between them), or a hole through a handle that the pictures see only edge on. The
// hull is always the thing or more: what is extra has to be cut by hand, or carved with more pictures. A part
// thinner than a cell (a fork's tip, a rail) is lost: give it more `cells`.

import { viewAxes, foregroundOf, outlineBox, VIEW_NAMES } from "./project.mjs";
import { reduce } from "../qem.mjs";
import { surfaceOf } from "./surface.mjs";

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** How many rounds of smoothing (Taubin's, which does not shrink) the surface gets before it is reduced. */
const SMOOTHING = 8;

/** A view looks straight along an axis of the model. */
const alongAxis = (back) => back.filter((v) => Math.abs(v) > 1 - 1e-6).length === 1;

/**
 * The thing carved from its views. `size`: [x, y, z] in units; `cells`: the cells along its longest side (64);
 * `target`: the triangles wanted (none: as the surface comes); `smooth`: rounds of smoothing (8).
 * Returns { tris: [[{ p }, x3]] in units, centred on x and y, from z 0 up, report: { cells: [nx, ny, nz], kept,
 * triangles, surfaced (before reducing), reduced (qem's report), empty (the views left out, showing nothing),
 * overlapByView: { name: outline overlap of the result with its mask (its own: a side drawn with faces missing
 * reads low there, and is carved by the side opposite it) } } }.
 */
export function carve(views, { size, cells = 64, target, smooth = SMOOTHING } = {}) {
  if (!size || size.length !== 3 || size.some((v) => !(v > 0))) throw new Error("carve: size [x, y, z] in units, each over 0");
  if (!views?.length) throw new Error("carve: no views");
  const h = Math.max(...size) / cells;
  // cells to each side, so that their faces fall on the box's; one more empty layer round them all
  const n = size.map((s) => Math.max(1, Math.round(s / h)));
  const step = size.map((s, a) => s / n[a]);
  const lo = [-size[0] / 2, -size[1] / 2, 0];
  const mid = [0, 0, size[2] / 2];
  const [X, Y, Z] = n.map((v) => v + 2);
  const at = (i, j, k) => i + X * (j + Y * k);
  const centreOf = (i, j, k) => [lo[0] + (i - 0.5) * step[0], lo[1] + (j - 0.5) * step[1], lo[2] + (k - 0.5) * step[2]];
  const inside = new Uint8Array(X * Y * Z);
  for (let k = 1; k <= n[2]; k++) for (let j = 1; j <= n[1]; j++) for (let i = 1; i <= n[0]; i++) inside[at(i, j, k)] = 1;

  // the box's corners, to measure a view's outline box by
  const corners = [];
  for (const x of [lo[0], -lo[0]]) for (const y of [lo[1], -lo[1]]) for (const z of [0, size[2]]) corners.push([x, y, z]);
  const spanOf = (points, axes) => {
    const span = [Infinity, -Infinity, Infinity, -Infinity];
    for (const p of points) {
      const a = dot(p, axes.right);
      const u = dot(p, axes.up);
      span[0] = Math.min(span[0], a);
      span[1] = Math.max(span[1], a);
      span[2] = Math.min(span[2], u);
      span[3] = Math.max(span[3], u);
    }
    return span;
  };

  const prepared = views.map((view, index) => {
    const axes = viewAxes(view.yaw ?? 0, view.pitch ?? 0);
    const { mask } = view;
    if (!mask?.data || mask.data.length !== mask.width * mask.height) throw new Error(`carve: view ${index} has no mask of its width and height`);
    const rect = view.rect ?? (mask.data.some((v) => v) ? outlineBox(mask.data, mask.width, [0, 0, mask.width, mask.height]) : null);
    return { view, axes, mask, rect, name: view.name ?? String(index), straight: alongAxis(axes.back) };
  });
  // a view that shows nothing carves nothing: a side no face is turned to is drawn empty, as is a wrong area
  const empty = prepared.filter((v) => !v.rect).map((v) => v.name);
  prepared.splice(0, prepared.length, ...prepared.filter((v) => v.rect));
  if (!prepared.length) throw new Error("carve: no view shows anything");
  // a view along an axis: its outline's box onto the thing's box seen from there
  const scales = [];
  for (const v of prepared) {
    if (v.view.scale && v.view.centre) {
      v.map = (p) => [v.view.centre[0] + dot(sub(p, mid), v.axes.right) * v.view.scale, v.view.centre[1] - dot(sub(p, mid), v.axes.up) * v.view.scale];
    } else if (v.straight) {
      const [a0, a1, h0, h1] = spanOf(corners, v.axes);
      const [x0, y0, x1, y1] = v.rect;
      v.map = (p) => [x0 + ((dot(p, v.axes.right) - a0) / (a1 - a0)) * (x1 - x0), y0 + ((h1 - dot(p, v.axes.up)) / (h1 - h0)) * (y1 - y0)];
      scales.push((x1 - x0) / (a1 - a0), (y1 - y0) / (h1 - h0));
    }
  }
  scales.sort((a, b) => a - b);
  const sheetScale = scales.length ? scales[scales.length >> 1] : null;

  // a view and the one opposite it see one outline, mirrored; but a picture drawn with faces seen from one side
  // only (as the game draws them, and the kit's pictures) shows less from a side no face is turned to: the
  // battery's open bottom is a ring from below. So a cell is cut only where both of the two leave it out.
  const dotSeen = (v, p) => {
    const { width, height, data } = v.mask;
    const [px, py] = v.map(p);
    const x = Math.floor(px);
    const y = Math.floor(py);
    return x >= 0 && y >= 0 && x < width && y < height && data[y * width + x] === 1;
  };
  const oppositeOf = (v) => prepared.find((w) => w !== v && dot(w.axes.back, v.axes.back) < -1 + 1e-6);
  const carveBy = (v) => {
    const other = oppositeOf(v);
    for (let k = 1; k <= n[2]; k++)
      for (let j = 1; j <= n[1]; j++)
        for (let i = 1; i <= n[0]; i++) {
          const c = at(i, j, k);
          if (!inside[c]) continue;
          const p = centreOf(i, j, k);
          if (!dotSeen(v, p) && !(other?.map && dotSeen(other, p))) inside[c] = 0;
        }
  };
  for (const v of prepared) if (v.map) carveBy(v);
  // a view at an angle: the scale of the others, and its middle where told, else the hull's
  for (const v of prepared) {
    if (v.map) continue;
    // the hull carved so far, seen from this view: its cells' centres, and half a cell's reach about each
    const kept = [];
    for (let k = 1; k <= n[2]; k++) for (let j = 1; j <= n[1]; j++) for (let i = 1; i <= n[0]; i++) if (inside[at(i, j, k)]) kept.push(centreOf(i, j, k));
    const reach = (axis) => step.reduce((s, d, a) => s + (Math.abs(v.axes[axis][a]) * d) / 2, 0);
    let [a0, a1, h0, h1] = spanOf(kept.length ? kept : corners, v.axes);
    if (kept.length) [a0, a1, h0, h1] = [a0 - reach("right"), a1 + reach("right"), h0 - reach("up"), h1 + reach("up")];
    const [x0, y0, x1, y1] = v.rect;
    if (v.view.centre || sheetScale) {
      const scale = v.view.scale ?? sheetScale;
      const centre = v.view.centre ?? [(x0 + x1) / 2 - ((a0 + a1) / 2 - dot(mid, v.axes.right)) * scale, (y0 + y1) / 2 + ((h0 + h1) / 2 - dot(mid, v.axes.up)) * scale];
      if (scale) v.map = (p) => [centre[0] + dot(sub(p, mid), v.axes.right) * scale, centre[1] - dot(sub(p, mid), v.axes.up) * scale];
    }
    v.map ??= (p) => [x0 + ((dot(p, v.axes.right) - a0) / (a1 - a0)) * (x1 - x0), y0 + ((h1 - dot(p, v.axes.up)) / (h1 - h0)) * (y1 - y0)];
    carveBy(v);
  }
  let kept = 0;
  for (const c of inside) kept += c;
  if (!kept) throw new Error("carve: no cell is inside every outline (do the views agree on which way is which?)");

  // a point inside every outline (a view's, or the one opposite it)
  const within = (p) => prepared.every((v) => dotSeen(v, p) || (v.other && dotSeen(v.other, p)));
  for (const v of prepared) v.other = oppositeOf(v);

  // the surface of the cells inside, each point where the outlines cross between two cells (surface.mjs)
  const cellPoint = (c) => {
    const i = c % X;
    const j = ((c - i) / X) % Y;
    const k = (c - i - X * j) / (X * Y);
    return centreOf(i, j, k);
  };
  let tris = surfaceOf({ inside, dims: [X, Y, Z], cellPoint, within, step, smooth });
  const surfaced = tris.length;
  let reduced = null;
  if (target && target < tris.length) {
    const r = reduce(tris, { target });
    tris = r.tris;
    reduced = r.report;
  }

  // how well the result's outline meets each mask
  const overlapByView = {};
  const lost = [];
  for (const v of prepared) {
    const { width, height, data } = v.mask;
    const drawn = new Uint8Array(width * height);
    for (const t of tris) {
      const q = t.map((c) => v.map(c.p));
      const [A, B, C] = q;
      const area2 = (B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1]);
      if (Math.abs(area2) < 1e-12) continue;
      const x0 = Math.max(0, Math.floor(Math.min(A[0], B[0], C[0])));
      const x1 = Math.min(width - 1, Math.ceil(Math.max(A[0], B[0], C[0])));
      const y0 = Math.max(0, Math.floor(Math.min(A[1], B[1], C[1])));
      const y1 = Math.min(height - 1, Math.ceil(Math.max(A[1], B[1], C[1])));
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          const w1 = ((x + 0.5 - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (y + 0.5 - A[1])) / area2;
          const w2 = ((B[0] - A[0]) * (y + 0.5 - A[1]) - (x + 0.5 - A[0]) * (B[1] - A[1])) / area2;
          if (w1 >= 0 && w2 >= 0 && w1 + w2 <= 1) drawn[y * width + x] = 1;
        }
    }
    let both = 0;
    let either = 0;
    for (let i = 0; i < drawn.length; i++) {
      both += drawn[i] & data[i];
      either += drawn[i] | data[i];
    }
    overlapByView[v.name] = Math.round((1000 * both) / (either || 1)) / 1000;
    // what the picture shows and the carve lost, piece by piece: the thin ones (under two cells across) are what
    // a hull of cells cannot hold, a claw, an antenna, a strap; each is to be made a part of its own
    const perUnit = Math.max(...[[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((d) => Math.hypot(...v.map(d).map((c, k) => c - v.map([0, 0, 0])[k]))));
    const seen = new Uint8Array(width * height);
    for (let i = 0; i < data.length; i++) {
      if (!data[i] || drawn[i] || seen[i]) continue;
      const piece = [i];
      seen[i] = 1;
      for (let k = 0; k < piece.length; k++) {
        const j = piece[k];
        const [x, y] = [j % width, Math.floor(j / width)];
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const [nx, ny] = [x + dx, y + dy];
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const o = ny * width + nx;
          if (data[o] && !drawn[o] && !seen[o]) (seen[o] = 1), piece.push(o);
        }
      }
      const xs = piece.map((j) => j % width);
      const ys = piece.map((j) => Math.floor(j / width));
      const length = Math.hypot(Math.max(...xs) - Math.min(...xs) + 1, Math.max(...ys) - Math.min(...ys) + 1) / perUnit;
      const across = piece.length / perUnit ** 2 / Math.max(length, 1e-6);
      if (length < 1.5 * h || across > 2 * h) continue;
      // a rim the reduced hull sits a pixel inside hugs the outline all along; a lost part sticks out of it
      const reach = Math.max(1, Math.ceil(2 * h * perUnit));
      const far = piece.some((j) => {
        const [x, y] = [j % width, Math.floor(j / width)];
        for (let dy = -reach; dy <= reach; dy++)
          for (let dx = -reach; dx <= reach; dx++) {
            const [nx, ny] = [x + dx, y + dy];
            if (nx >= 0 && ny >= 0 && nx < width && ny < height && drawn[ny * width + nx]) return false;
          }
        return true;
      });
      if (!far) continue;
      lost.push({ view: v.name, length: Math.round(length * 10) / 10, across: Math.round(across * 100) / 100, at: [Math.round(xs.reduce((a, b) => a + b, 0) / xs.length), Math.round(ys.reduce((a, b) => a + b, 0) / ys.length)] });
    }
  }
  lost.sort((a, b) => b.length - a.length);
  return { tris, report: { cells: n, kept, triangles: tris.length, surfaced, reduced, empty, overlapByView, lost } };
}

/** A background whose border dots are this share or more of one colour is a drawn one, not a photograph's. */
const CLEAN_SHARE = 0.95;
/** In a drawn picture a dot is the thing when it is farther than this from the background, in any channel. */
const CLEAN_NEAR = 2;

/** The patches of empty dots in a mask that do not reach its border: [[dot, ...], ...]. */
function enclosed(data, width, height) {
  const seen = new Uint8Array(data.length);
  const patches = [];
  const flood = (start) => {
    const patch = [start];
    seen[start] = 1;
    let open = false;
    for (let s = 0; s < patch.length; s++) {
      const i = patch[s];
      const x = i % width;
      const y = (i - x) / width;
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) open = true;
      for (const k of [x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1, y > 0 ? i - width : -1, y < height - 1 ? i + width : -1])
        if (k >= 0 && !data[k] && !seen[k]) {
          seen[k] = 1;
          patch.push(k);
        }
    }
    return { patch, open };
  };
  for (let i = 0; i < data.length; i++) {
    if (data[i] || seen[i]) continue;
    const { patch, open } = flood(i);
    if (!open) patches.push(patch);
  }
  return patches;
}

/**
 * One picture of a sheet made a view's mask: `area` [x0, y0, x1, y1] (the whole picture unless told), `rect`
 * the outline's box in the picture (found unless told: the largest patch and the patches a hundredth its size,
 * leaving out a caption in the area's top left corner). Returns { mask: { width, height, data }, rect (in the
 * mask), centre (the middle of the area, where the kit's sheets put the middle of the thing) }.
 *
 * Which dots are the thing: foregroundOf's, for a photograph. A picture drawn on one flat colour (the kit's
 * own, whose border is all but one colour) is read more finely, every dot not that colour being the thing: a
 * grey cabinet on a grey ground is otherwise eaten into. Holes inside the outline are filled where the picture
 * cannot tell them from the thing (a photograph, or a speck); in a drawn picture a patch of the ground's own
 * colour inside the outline is a hole through the thing, and stays.
 */
export function masksFromPicture(picture, area = [0, 0, picture.width, picture.height], rect) {
  const [x0, y0, x1, y1] = area;
  const W = picture.width;
  const colourAt = (x, y) => {
    const i = y * W + x;
    return picture.rgba ? picture.rgba.subarray(i * 4, i * 4 + 3) : picture.rgb.subarray(i * 3, i * 3 + 3);
  };
  // the ground: the commonest colour along the area's border, and how much of the border it is
  const counts = new Map();
  let border = 0;
  const tally = (x, y) => {
    const key = colourAt(x, y).join();
    counts.set(key, (counts.get(key) ?? 0) + 1);
    border++;
  };
  for (let x = x0; x < x1; x++) (tally(x, y0), tally(x, y1 - 1));
  for (let y = y0; y < y1; y++) (tally(x0, y), tally(x1 - 1, y));
  const [groundKey] = [...counts].sort((a, b) => b[1] - a[1])[0];
  const ground = groundKey.split(",").map(Number);
  const near = (c) => Math.abs(c[0] - ground[0]) <= CLEAN_NEAR && Math.abs(c[1] - ground[1]) <= CLEAN_NEAR && Math.abs(c[2] - ground[2]) <= CLEAN_NEAR;
  let clean = 0;
  for (const [key, n] of counts) if (near(key.split(",").map(Number))) clean += n;
  const drawn = clean >= CLEAN_SHARE * border;
  let found = foregroundOf(picture, area);
  if (drawn) {
    found = new Uint8Array(W * picture.height);
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (!near(colourAt(x, y))) found[y * W + x] = 1;
  }
  const box = rect ?? outlineBox(found, W, area);
  const width = x1 - x0;
  const height = y1 - y0;
  const data = new Uint8Array(width * height);
  if (!box) return { mask: { width, height, data }, rect: null, centre: [width / 2, height / 2] };
  for (let y = box[1]; y < box[3]; y++) for (let x = box[0]; x < box[2]; x++) if (found[y * W + x]) data[(y - y0) * width + (x - x0)] = 1;
  // a caption the outline's box takes in (a thing that reaches the corner): its patches are dropped
  const label = new Uint8Array(width * height);
  for (let y = 0; y < Math.min(24, height); y++)
    for (let x = 0; x < Math.min(8, width); x++) {
      if (!data[y * width + x] || label[y * width + x]) continue;
      const patch = [y * width + x];
      label[patch[0]] = 1;
      let low = 0;
      for (let s = 0; s < patch.length; s++) {
        const i = patch[s];
        const px = i % width;
        const py = (i - px) / width;
        low = Math.max(low, py);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = px + dx;
          const ny = py + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const k = ny * width + nx;
          if (data[k] && !label[k]) {
            label[k] = 1;
            patch.push(k);
          }
        }
      }
      if (low <= 24) for (const i of patch) data[i] = 0;
    }
  // holes: filled, but for a drawn picture's that are larger than a speck (a hundredth of a percent of the area)
  const speck = Math.max(4, (width * height) / 10000);
  for (const patch of enclosed(data, width, height)) if (!drawn || patch.length <= speck) for (const i of patch) data[i] = 1;
  // nothing left but a caption: the picture shows nothing (a side with no faces turned to it)
  if (!data.some((v) => v)) return { mask: { width, height, data }, rect: null, centre: [width / 2, height / 2] };
  return { mask: { width, height, data }, rect: [box[0] - x0, box[1] - y0, box[2] - x0, box[3] - y0], centre: [width / 2, height / 2] };
}

/**
 * The views of a sheet of pictures laid out as the kit lays them (`tile`: `cols` across, each square of the
 * sheet's width over `cols`), named in order (front, left, back, right, top, below unless told): [{ mask, rect,
 * centre, yaw, pitch, name }] for carve.
 */
export function sheetViews(picture, { cols = 3, names = Object.keys(VIEW_NAMES) } = {}) {
  const side = Math.floor(picture.width / cols);
  return names.map((name, i) => {
    const [yaw, pitch] = VIEW_NAMES[name] ?? name;
    const x = (i % cols) * side;
    const y = Math.floor(i / cols) * side;
    return { ...masksFromPicture(picture, [x, y, x + side, y + side]), yaw, pitch, name: typeof name === "string" ? name : String(i) };
  });
}
