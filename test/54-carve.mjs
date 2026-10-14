// Fewer triangles, and a shape carved from its outlines.
//   reduce: a sphere of 2000 brought to 200 keeps its volume and stays closed; a box cut fine comes back to its
//   12 triangles and its 8 corners; an open sheet keeps its border; a corner keeps what it carries
//   carve: a cylinder from three drawn outlines (two rectangles and a disc), closed and facing out, at its size
//   and volume; a model drawn by the kit, carved from its sheet and an angle, at its size; a side drawn empty
//   left out; a picture's caption and a grey thing on a grey ground read as the kit draws them
import * as smak from "../src/index.mjs";
import { reduce } from "../src/qem.mjs";
import { carve, masksFromPicture, sheetViews } from "../src/spec/carve.mjs";
import { framing, render, tile } from "../src/render.mjs";
import { test, sure, near, tmp } from "./helper.mjs";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildModelSpec } from "../src/spec/model.mjs";

/** The lowest and highest of some points along an axis. */
const spanOf = (ps, a) => ps.reduce(([lo, hi], p) => [Math.min(lo, p[a]), Math.max(hi, p[a])], [Infinity, -Infinity]);

/** The volume a closed list of triangles holds (over 0 when they face out). */
const volumeOf = (tris) =>
  tris.reduce((s, t) => {
    const [a, b, c] = t.map((x) => x.p);
    return s + (a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6;
  }, 0);

/** Every edge between two faces, once each way: closed, and every face turned the same way as its neighbours. */
const closed = (tris) => {
  const edges = new Map();
  for (const t of tris)
    for (let k = 0; k < 3; k++) {
      const key = `${t[k].p.join()}|${t[(k + 1) % 3].p.join()}`;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  for (const [key, count] of edges) {
    const [a, b] = key.split("|");
    if (count !== 1 || edges.get(`${b}|${a}`) !== 1) return false;
  }
  return true;
};

function sphere(round, high, r) {
  const at = (i, j) => {
    const t = (Math.PI * j) / high;
    const f = (2 * Math.PI * (i % round)) / round;
    const v = [r * Math.sin(t) * Math.cos(f), r * Math.sin(t) * Math.sin(f), r * Math.cos(t)];
    return v.map((x) => (Math.abs(x) < 1e-12 ? 0 : Math.round(x * 1e9) / 1e9));
  };
  const tris = [];
  for (let j = 0; j < high; j++)
    for (let i = 0; i < round; i++) {
      const [a, b, c, d] = [at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)];
      if (j > 0) tris.push([a, c, b].map((p) => ({ p })));
      if (j < high - 1) tris.push([a, d, c].map((p) => ({ p })));
    }
  return tris;
}

/** A box [X, Y, Z] from the origin, each face cut n by n, facing out. */
function box(n, [X, Y, Z]) {
  const tris = [];
  const face = (o, u, v) => {
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const P = (a, b) => ({ p: [0, 1, 2].map((k) => o[k] + (u[k] * a) / n + (v[k] * b) / n), uv: [a / n, b / n] });
        tris.push([P(i, j), P(i + 1, j), P(i + 1, j + 1)], [P(i, j), P(i + 1, j + 1), P(i, j + 1)]);
      }
  };
  face([0, 0, 0], [0, Y, 0], [X, 0, 0]);
  face([0, 0, Z], [X, 0, 0], [0, Y, 0]);
  face([0, 0, 0], [X, 0, 0], [0, 0, Z]);
  face([0, Y, 0], [0, 0, Z], [X, 0, 0]);
  face([0, 0, 0], [0, 0, Z], [0, Y, 0]);
  face([X, 0, 0], [0, Y, 0], [0, 0, Z]);
  return tris;
}

test("reduce: a sphere of 2000 triangles to 200 keeps its volume within 3 in 100, closed and facing out", () => {
  const s = sphere(40, 26, 10);
  sure(s.length === 2000, `${s.length}`);
  const { tris, report } = reduce(s, { target: 200 });
  sure(tris.length <= 200 && tris.length >= 190, `${tris.length} triangles`);
  sure(closed(tris), "the reduced sphere is closed, each edge between two faces turned alike");
  near(volumeOf(tris) / volumeOf(s), 1, 0.03, "volume kept");
  sure(report.from === 2000 && report.to === tris.length && report.stages >= 3, JSON.stringify(report));
});

test("reduce: a box cut fine comes back to 12 triangles on its 8 corners; a box of 12 asked for 12 is as it was", () => {
  const fine = box(4, [3, 5, 7]);
  const { tris } = reduce(fine, { target: 12 });
  sure(tris.length === 12, `${tris.length} triangles`);
  const corners = new Set(tris.flat().map((c) => c.p.join()));
  sure(corners.size === 8, [...corners].join(" "));
  for (const c of corners) sure(c.split(",").every((v, a) => Number(v) === 0 || Number(v) === [3, 5, 7][a]), `${c} is a corner of the box`);
  near(volumeOf(tris), 105, 1e-9, "the box's volume");
  sure(closed(tris), "closed");
  const plain = box(1, [3, 5, 7]);
  const same = reduce(plain, { target: 12 });
  sure(same.tris.length === 12 && same.report.stages === 0, JSON.stringify(same.report));
});

test("reduce: an open sheet keeps its border; a corner that stays keeps what it carries", () => {
  // a 10 by 10 sheet with a bump in the middle: the border's square stays, its area with it
  const tris = [];
  const P = (i, j) => ({ p: [i, j, i > 3 && i < 7 && j > 3 && j < 7 ? 0.5 : 0], uv: [i / 10, j / 10], bone: "root" });
  for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) tris.push([P(i, j), P(i + 1, j), P(i + 1, j + 1)], [P(i, j), P(i + 1, j + 1), P(i, j + 1)]);
  const { tris: out, report } = reduce(tris, { target: 40 });
  sure(out.length <= 40 && report.border === 40, JSON.stringify(report));
  const flatArea = out.reduce((s, t) => {
    const [a, b, c] = t.map((x) => x.p);
    return s + ((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2;
  }, 0);
  near(flatArea, 100, 1e-6, "the sheet's area seen from above");
  for (const corner of out.flat()) {
    sure(corner.bone === "root" && corner.uv.length === 2, JSON.stringify(corner));
    sure(corner.p[0] >= 0 && corner.p[0] <= 10 && corner.p[1] >= 0 && corner.p[1] <= 10, `${corner.p} inside the sheet`);
  }
  // the four corners of the sheet are there, each with its own place on the picture
  for (const [x, y] of [[0, 0], [10, 0], [10, 10], [0, 10]]) {
    const at = out.flat().find((c) => c.p[0] === x && c.p[1] === y);
    sure(at && at.uv[0] === x / 10 && at.uv[1] === y / 10, `corner ${x},${y}: ${JSON.stringify(at)}`);
  }
});

/** A drawn mask: `fill(x, y)` for each dot of a width x height picture, the thing's box at rect. */
const drawnMask = (width, height, fill) => {
  const data = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) data[y * width + x] = fill(x + 0.5, y + 0.5) ? 1 : 0;
  return { width, height, data };
};

test("carve: a cylinder from two rectangles and a disc, closed and facing out, at its size and its volume", () => {
  // radius 8 and 20 high, standing on z: from the front and the side a rectangle 16 by 20, from above a disc
  const side = drawnMask(100, 120, (x, y) => x >= 10 && x <= 90 && y >= 10 && y <= 110);
  const above = drawnMask(100, 100, (x, y) => Math.hypot(x - 50, y - 50) <= 40);
  const views = [
    { mask: side, yaw: 0, pitch: 0, name: "front" },
    { mask: side, yaw: 90, pitch: 0, name: "left" },
    { mask: above, yaw: 0, pitch: 90, name: "top" },
  ];
  const { tris, report } = carve(views, { size: [16, 16, 20], cells: 40 });
  sure(closed(tris), "closed");
  near(volumeOf(tris), Math.PI * 64 * 20, 0.04 * Math.PI * 64 * 20, "the cylinder's volume");
  const ps = tris.flat().map((c) => c.p);
  for (let a = 0; a < 3; a++) {
    const [lo, hi] = spanOf(ps, a);
    near(lo, [-8, -8, 0][a], 0.3, `its lowest along ${"xyz"[a]}`);
    near(hi, [8, 8, 20][a], 0.3, `its highest along ${"xyz"[a]}`);
  }
  for (const v of Object.values(report.overlapByView)) sure(v > 0.97, JSON.stringify(report.overlapByView));
  // reduced, it is still closed, and as many triangles as asked
  const small = carve(views, { size: [16, 16, 20], cells: 40, target: 120 });
  sure(small.tris.length <= 120 && closed(small.tris), `${small.tris.length}`);
  near(volumeOf(small.tris), Math.PI * 64 * 20, 0.06 * Math.PI * 64 * 20, "the reduced cylinder's volume");
});

test("carve: a model the kit draws, carved from its sheet of sides and an angle, comes back at its size", () => {
  // an L: a block 24 long, 8 wide, 6 high, with a post 6 by 8 by 16 standing on its back end
  const tris = [...box(1, [24, 8, 6]), ...box(1, [6, 8, 10]).map((t) => t.map((c) => ({ ...c, p: [c.p[0], c.p[1], c.p[2] + 6] })))].map((t) =>
    t.map((c) => ({ p: [c.p[0] - 12, c.p[1] - 4, c.p[2]], uv: [0.5, 0.5] })),
  );
  const texture = { name: "grey.bmp", width: 8, height: 8, pixels: new Uint8Array(64), palette: new Uint8Array(768).fill(70), flags: 0 };
  // a grey near the ground's own: read finely, as the kit's pictures are drawn on one flat colour
  const src = smak.buildMdl({ name: "l.mdl", bodyparts: [{ name: "body", models: [{ name: "l", meshes: [{ tris, texture }] }] }], sequences: [{ name: "idle", fps: 10, frames: [[[0, 0, 0, 0, 0, 0]]] }] });
  const pose = { seq: 0, frame: 0 };
  const within = framing(src, [pose]);
  const sides = [["front", 0, 0], ["left", 90, 0], ["back", 180, 0], ["right", 270, 0], ["top", 0, 90], ["below", 0, -90]];
  const sheet = tile(sides.map(([, yaw, pitch]) => render(src, { ...pose, view: "orbit", within, yaw, pitch, width: 256, height: 256 })), 3, sides.map(([n]) => n));
  const views = sheetViews(sheet);
  sure(views.length === 6 && views.every((v) => v.rect && v.mask.width === 256), JSON.stringify(views.map((v) => v.rect)));
  // the caption is not the thing
  sure(views.every((v) => !v.mask.data.slice(0, 24 * 256).some((d, i) => d && i % 256 < 40)), "no caption in a mask");
  const angle = { ...masksFromPicture(render(src, { ...pose, view: "orbit", within, yaw: 35, pitch: 20, width: 256, height: 256 })), yaw: 35, pitch: 20, name: "front-left" };
  const { tris: out, report } = carve([...views, angle], { size: [24, 8, 16], cells: 48 });
  sure(closed(out), "closed");
  // the space over the block's front, which the side views see empty, is carved away: an L, not a box
  near(volumeOf(out), 24 * 8 * 6 + 6 * 8 * 10, 0.06 * (24 * 8 * 6 + 6 * 8 * 10), "the L's volume");
  for (const [name, v] of Object.entries(report.overlapByView)) sure(v > 0.93, `${name}: ${JSON.stringify(report.overlapByView)}`);
  const ps = out.flat().map((c) => c.p);
  near(spanOf(ps, 2)[1], 16, 0.4, "its height");
  near(spanOf(ps, 0)[1] - spanOf(ps, 0)[0], 24, 0.6, "its length");
});

test("carve: a side drawn empty is left out, and the side opposite carves for it; an empty picture refused", () => {
  const side = drawnMask(64, 64, (x, y) => x >= 8 && x <= 56 && y >= 8 && y <= 56);
  const nothing = drawnMask(64, 64, () => false);
  // a ring from below (an open bottom drawn with its faces seen from one side only), a full square from above
  const ring = drawnMask(64, 64, (x, y) => x >= 8 && x <= 56 && y >= 8 && y <= 56 && !(x > 16 && x < 48 && y > 16 && y < 48));
  const views = [
    { mask: side, yaw: 0, pitch: 0, name: "front" },
    { mask: side, yaw: 90, pitch: 0, name: "left" },
    { mask: side, yaw: 0, pitch: 90, name: "top" },
    { mask: ring, yaw: 0, pitch: -90, name: "below" },
    { mask: nothing, yaw: 180, pitch: 0, name: "back" },
  ];
  const { tris, report } = carve(views, { size: [10, 10, 10], cells: 20 });
  sure(report.empty.join() === "back", JSON.stringify(report.empty));
  near(volumeOf(tris), 1000, 60, "a whole cube, with no hole through it");
  let refused = "";
  try {
    carve([{ mask: nothing, yaw: 0, pitch: 0 }], { size: [1, 1, 1] });
  } catch (e) {
    refused = e.message;
  }
  sure(/no view shows anything/.test(refused), refused);
});

test("a carved part in a model spec: a box's sheet carved back to a box's size, sound", () => {
  const work = join(tmp, "carved-part");
  mkdirSync(work, { recursive: true });
  const boxSpec = { spec: "smak.model/1", name: "b.mdl", kind: "prop", finish: false, parts: [{ id: "b", kind: "box", size: [20, 10, 14], material: { base: "paint", tone: [0.7, 0.2, 0.2] } }] };
  const drawn = smak.sheet(buildModelSpec(boxSpec).mdl, {});
  writeFileSync(join(work, "sides.png"), smak.png(drawn.width, drawn.height, drawn.rgba));
  const { mdl, report } = buildModelSpec({ spec: "smak.model/1", name: "c.mdl", kind: "prop", smooth: 80, parts: [{ id: "hull", kind: "carved", size: [20, 10, 14], sheet: "sides.png", triangles: 60 }] }, { folder: work });
  sure(report.ok, [...report.errors, ...report.faults].join("; "));
  const size = smak.posed(mdl, {}).tris.flatMap((t) => t.c.map((c) => c.p)).reduce((b, p) => b.map((v, k) => (k < 3 ? Math.min(v, p[k]) : Math.max(v, p[k - 3]))), [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity]);
  const extent = [size[3] - size[0], size[4] - size[1], size[5] - size[2]];
  sure(extent.every((v, k) => Math.abs(v - [20, 10, 14][k]) < 1.5), `its size ${extent.map((v) => v.toFixed(1))}`);
  sure(smak.check(mdl).errors.length === 0, "it passes check");
});
