// A map spec's rooms broken out of their boxes and dressed for what they are, as Valve's are (research/
// level-dressing.md, ranked item 4). Two things, each asked for by the spec:
//
//   breaksOf(room, frame, { kept, textureOf, chamfer })  `frame.breaks`: pieces that break a box room's
//       silhouette, as func_detail brushes off the axes: round pillars standing in its corners (where a corner is
//       not cut and no way is near), a sloped cove where each long wall meets the ceiling, and a pipe run along
//       the top of the longest wall with brackets to it. Valve's campaign has 42 in 100 of its corners off the
//       axes; a spec's box room none.
//   dressRooms({ rooms, ways, landmarks, seed })  a room's `use` (lab, storage, control, office, industrial,
//       corridor, plant): brush prefabs placed by its rules (at its walls and in its corners, clear of every way
//       through and of the landmark, facing into the room), varied (several of each kind, turned, no one more than
//       twice in a room), returned as `prefabs` and `furniture` for the build to place as it places a spec's own.
//       What stands against a wall shades the floor under and behind it: the dark Valve's floors have and a
//       room's lamps alone do not make (step 2, research/level-dressing.md).
import { box, cylinder, prism } from "../maps/source.mjs";

/** What `frame.breaks` adds, unless told: pillars, coves and a pipe run. */
export const BREAKS = { pillars: true, coves: true, pipes: true, pillar: 12, cove: 24, pipe: 4 };
/** The words of `frame.breaks` (true, or these over BREAKS). */
export const BREAK_WORDS = ["pillars", "coves", "pipes", "pillar", "cove", "pipe"];

/**
 * The pieces that break a framed room's silhouette. `room`: { min, max }. `kept(piece)`: whether a box keeps clear
 * of the room's ways and their frames. `chamfer`: the room's cut corners (no pillar where a corner is cut).
 * Returns [brush] and a count of each kind.
 */
export function breaksOf(room, breaks, { kept, textureOf, chamfer = 0, beamDeep = 0 }) {
  const b = { ...BREAKS, ...(typeof breaks === "object" ? breaks : {}) };
  const [x0, y0, z0] = room.min;
  const [x1, y1, z1] = room.max;
  const out = [];
  const counts = { pillars: 0, coves: 0, pipes: 0 };
  const frame = textureOf("frame");
  // round pillars in the corners: ten sides, standing a radius off each wall, where the corner is not cut
  if (b.pillars && !(chamfer > 0)) {
    const r = b.pillar;
    for (const [cx, cy] of [[x0 + r, y0 + r], [x1 - r, y0 + r], [x0 + r, y1 - r], [x1 - r, y1 - r]]) {
      const piece = { min: [cx - r, cy - r, z0], max: [cx + r, cy + r, z1] };
      if (!kept(piece)) continue;
      out.push(cylinder("z", [cx, cy], r, z0, z1, frame, { sides: 10, snap: 1 }));
      counts.pillars++;
    }
  }
  // a cove where each long wall meets the ceiling: a slope of `cove` along it, as a ceiling's edge is eased
  if (b.coves && z1 - z0 - b.cove >= 112) {
    const c = b.cove;
    for (const wall of [
      { axis: "x", along: [x0, x1], outline: [[y0, z1], [y0 + c, z1], [y0, z1 - c]] },
      { axis: "x", along: [x0, x1], outline: [[y1, z1], [y1, z1 - c], [y1 - c, z1]] },
      { axis: "y", along: [y0, y1], outline: [[x0, z1], [x0, z1 - c], [x0 + c, z1]] },
      { axis: "y", along: [y0, y1], outline: [[x1, z1], [x1 - c, z1], [x1, z1 - c]] },
    ]) {
      const [a0, a1] = wall.along;
      if (a1 - a0 < 192) continue;
      // its box, to keep clear of the ways under it (a door's frame reaches up to the ceiling in a low room)
      const across = wall.outline.map((p) => p[0]);
      const piece = wall.axis === "x"
        ? { min: [a0, Math.min(...across), z1 - c], max: [a1, Math.max(...across), z1] }
        : { min: [Math.min(...across), a0, z1 - c], max: [Math.max(...across), a1, z1] };
      if (!kept(piece)) continue;
      out.push(prism(wall.axis, wall.outline, a0, a1, frame));
      counts.coves++;
    }
  }
  // a pipe run under the ceiling along the longest wall, below the cove and any beam, with a bracket every 128
  if (b.pipes) {
    const r = b.pipe;
    const alongX = x1 - x0 >= y1 - y0;
    const [a0, a1] = alongX ? [x0, x1] : [y0, y1];
    const z = z1 - (b.coves ? b.cove : 0) - Math.max(beamDeep, 0) - r - 6;
    const off = (alongX ? y0 : x0) + r + 4;
    const run = alongX ? { min: [a0, off - r, z - r], max: [a1, off + r, z + r] } : { min: [off - r, a0, z - r], max: [off + r, a1, z + r] };
    if (a1 - a0 >= 192 && z - r > z0 + 112 && kept(run)) {
      out.push(cylinder(alongX ? "x" : "y", [off, z], r, a0, a1, textureOf("pipe"), { sides: 8, snap: 1 }));
      for (let a = a0 + 64; a < a1 - 32; a += 128)
        out.push(alongX ? box([a - 2, y0, z - r - 2], [a + 2, off + r + 2, z - r], frame) : box([x0, a - 2, z - r - 2], [off + r + 2, a + 2, z - r], frame));
      counts.pipes++;
    }
  }
  return { brushes: out, counts };
}

// ── dressing by a room's use ──────────────────────────────────────────────────────────────────────────────

/**
 * The pieces a room is dressed with: brush prefabs, each built facing +x (its back at x 0, against a wall, its
 * front out into the room), its foot on the floor. Several of each kind, so that no two rooms read the same.
 */
const PIECES = {
  crate_small: { pieces: [{ box: [[0, -12, 0], [24, 12, 24]], texture: "crate" }] },
  crate_large: { pieces: [{ box: [[0, -16, 0], [32, 16, 32]], texture: "crate" }] },
  crate_stack: { pieces: [{ box: [[0, -32, 0], [32, 0, 32]], texture: "crate" }, { box: [[0, 0, 0], [28, 28, 28]], texture: "crate" }, { box: [[2, -28, 32], [26, -4, 56]], texture: "crate" }] },
  barrel: { pieces: [{ cylinder: { centre: [12, 0], radius: 12, from: 0, to: 40, sides: 8 }, texture: "barrel" }] },
  barrels: { pieces: [{ cylinder: { centre: [12, -13], radius: 12, from: 0, to: 40, sides: 8 }, texture: "barrel" }, { cylinder: { centre: [12, 13], radius: 12, from: 0, to: 40, sides: 8 }, texture: "barrel" }, { cylinder: { centre: [30, 0], radius: 11, from: 0, to: 36, sides: 8 }, texture: "barrel" }] },
  locker: { pieces: [{ box: [[0, -12, 0], [20, 12, 72]], texture: "locker" }] },
  lockers: { pieces: [{ box: [[0, -36, 0], [20, -12, 72]], texture: "locker" }, { box: [[0, -12, 0], [20, 12, 72]], texture: "locker" }, { box: [[0, 12, 0], [20, 36, 72]], texture: "locker" }] },
  shelf: { pieces: [{ box: [[0, -32, 0], [16, -30, 80]], texture: "strut" }, { box: [[0, 30, 0], [16, 32, 80]], texture: "strut" }, ...[4, 28, 52, 76].map((z) => ({ box: [[0, -30, z], [16, 30, z + 2]], texture: "strut" })), { box: [[1, -26, 6], [13, -6, 22]], texture: "crate" }, { box: [[1, 6, 54], [13, 22, 70]], texture: "crate" }] },
  console: { pieces: [{ box: [[0, -24, 0], [24, 24, 32]], texture: "console" }, { prism: { outline: [[0, -24], [24, -24], [24, 24], [0, 24]], from: 32, to: 36 }, texture: "console" }, { box: [[0, -24, 36], [8, 24, 52]], texture: "screen" }] },
  console_wide: { pieces: [{ box: [[0, -40, 0], [24, 40, 32]], texture: "console" }, { box: [[0, -40, 32], [8, 40, 56]], texture: "screen" }] },
  desk: { pieces: [{ box: [[0, -28, 28], [28, 28, 32]], texture: "desk" }, { box: [[2, -26, 0], [6, -22, 28]], texture: "strut" }, { box: [[2, 22, 0], [6, 26, 28]], texture: "strut" }, { box: [[22, -26, 0], [26, -22, 28]], texture: "strut" }, { box: [[22, 22, 0], [26, 26, 28]], texture: "strut" }] },
  cabinet: { pieces: [{ box: [[0, -16, 0], [20, 16, 52]], texture: "locker" }] },
  machine: { pieces: [{ box: [[0, -32, 0], [40, 32, 48]], texture: "machine" }, { cylinder: { centre: [20, 0], radius: 14, from: 48, to: 72, sides: 8 }, texture: "machine" }] },
  tank: { pieces: [{ cylinder: { centre: [24, 0], radius: 24, from: 0, to: 88, sides: 10 }, texture: "machine" }, { box: [[22, -2, 88], [26, 2, 100]], texture: "strut" }] },
  pipes_up: { pieces: [{ cylinder: { centre: [6, -14], radius: 5, from: 0, to: 200, sides: 6 }, texture: "pipe" }, { cylinder: { centre: [6, 2], radius: 5, from: 0, to: 200, sides: 6 }, texture: "pipe" }, { cylinder: { centre: [8, 18], radius: 7, from: 0, to: 200, sides: 6 }, texture: "pipe" }] },
  bench: { pieces: [{ box: [[0, -40, 32], [32, 40, 36]], texture: "desk" }, { box: [[0, -40, 0], [32, -36, 32]], texture: "strut" }, { box: [[0, 36, 0], [32, 40, 32]], texture: "strut" }] },
};
/** The materials the pieces wear, as the spec's own words when it gives them, else these bases. */
export const DRESS_MATERIALS = { crate: "wood", barrel: "metal", locker: "steel", console: "metal", screen: "neon", desk: "darkwood", machine: "iron", pipe: "metal", strut: "metal" };

/**
 * A room's use: the pieces it wants, each [kind, its variants, where (wall or corner), how many a 256 x 256 of
 * floor (the first kind at least one)]. Rules read off what such rooms in Valve's maps hold (research/level-dressing.md, 2.1:
 * crates at wall feet in twos to fours, consoles under windows and lamps, lockers in rows, pipes up the walls of a
 * plant), kept sparse (tip 18: prefabs sparingly, no row of identical ones).
 */
const USES = {
  storage: [["crate", ["crate_small", "crate_large", "crate_stack"], "corner", 1.2], ["shelf", ["shelf"], "wall", 0.5], ["barrel", ["barrel", "barrels"], "corner", 0.4]],
  lab: [["console", ["console", "console_wide"], "wall", 0.5], ["bench", ["bench", "desk"], "wall", 0.5], ["cabinet", ["cabinet", "locker"], "corner", 0.4]],
  control: [["console", ["console_wide", "console"], "wall", 0.9], ["cabinet", ["cabinet"], "corner", 0.3]],
  office: [["desk", ["desk"], "wall", 0.7], ["cabinet", ["cabinet", "shelf"], "corner", 0.5]],
  industrial: [["machine", ["machine", "tank"], "wall", 0.4], ["barrel", ["barrels", "barrel"], "corner", 0.6], ["pipes", ["pipes_up"], "wall", 0.3], ["crate", ["crate_stack", "crate_large"], "corner", 0.4]],
  plant: [["pipes", ["pipes_up"], "wall", 0.5], ["tank", ["tank"], "corner", 0.4], ["machine", ["machine"], "wall", 0.3], ["barrel", ["barrels"], "corner", 0.3]],
  corridor: [["pipes", ["pipes_up"], "wall", 0.25], ["crate", ["crate_small"], "wall", 0.15]],
};
export const USE_WORDS = Object.keys(USES);

/** The footprint of a piece in its own space: [min, max] in x and y over its pieces. */
function printOf(prefab) {
  const pts = prefab.pieces.flatMap((p) => p.box ?? p.prism?.outline ?? (p.cylinder ? [[p.cylinder.centre[0] - p.cylinder.radius, p.cylinder.centre[1] - p.cylinder.radius], [p.cylinder.centre[0] + p.cylinder.radius, p.cylinder.centre[1] + p.cylinder.radius]] : []));
  return { min: [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1]))], max: [Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))] };
}

/** A footprint turned by quarter turns `q` (as the build turns a prefab: (x, y) to (-y, x) each). */
function turned({ min, max }, q) {
  let corners = [[min[0], min[1]], [max[0], max[1]]];
  for (let i = 0; i < ((q % 4) + 4) % 4; i++) corners = corners.map(([x, y]) => [-y, x]);
  return { min: [Math.min(corners[0][0], corners[1][0]), Math.min(corners[0][1], corners[1][1])], max: [Math.max(corners[0][0], corners[1][0]), Math.max(corners[0][1], corners[1][1])] };
}

const overlaps = (a, b, gap = 0) => a.min[0] < b.max[0] + gap && b.min[0] < a.max[0] + gap && a.min[1] < b.max[1] + gap && b.min[1] < a.max[1] + gap;

/**
 * Dressing for every room with a `use`. `rooms`: [{ id, min, max, spec }]; `ways`: the floor kept clear in front
 * of each way through ({ min: [x, y], max: [x, y] }); `landmarks`: footprints to keep clear of; `taken`:
 * footprints already standing. Returns { prefabs: { name: prefab }, furniture: [{ prefab, room, at, rotate }],
 * facts }.
 */
export function dressRooms({ rooms, ways = [], landmarks = [], taken = [], seed = 1 }) {
  const prefabs = {};
  const furniture = [];
  const facts = [];
  let s = seed >>> 0 || 1;
  const random = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
  for (const room of rooms) {
    const use = room.spec?.use;
    if (!use) continue;
    const rules = USES[use];
    if (!rules) continue;
    const [x0, y0] = room.min;
    const [x1, y1] = room.max;
    const mid = [(x0 + x1) / 2, (y0 + y1) / 2];
    const area = (x1 - x0) * (y1 - y0);
    // the floor kept clear: every way's, the landmark's, what stands already, and a walk down the middle of a
    // corridor or round the middle of a room (a quarter of its shorter side either side)
    const blocked = [...ways.map((w) => ({ min: w.min, max: w.max })), ...landmarks, ...taken];
    const placed = [];
    const used = new Map();
    // where a piece may stand: each corner and along each wall every 64, its back to the wall, facing in
    const spots = [];
    const inset = 2;
    for (const [cx, cy] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) spots.push({ corner: true, wall: Math.abs(cx - x0) < 1 ? "west" : "east", at: [cx, cy] });
    for (let x = x0 + 64; x <= x1 - 64; x += 64) spots.push({ wall: "south", at: [x, y0] }, { wall: "north", at: [x, y1] });
    for (let y = y0 + 64; y <= y1 - 64; y += 64) spots.push({ wall: "west", at: [x0, y] }, { wall: "east", at: [x1, y] });
    // shuffled, so that two rooms of one use do not dress alike
    for (let i = spots.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [spots[i], spots[j]] = [spots[j], spots[i]];
    }
    const QUARTERS = { west: 0, south: 1, east: 2, north: 3 };
    for (const [k, [kind, variants, where, per]] of rules.entries()) {
      // the use's first kind at least once; the rest by the floor (a pit of 320 x 256 took one of each, four
      // pieces, and its map went over Valve's planes a floor)
      const want = Math.max(k === 0 ? 1 : 0, Math.round((area / (256 * 256)) * per));
      let got = 0;
      for (const spot of spots) {
        if (got >= want) break;
        if ((where === "corner") !== Boolean(spot.corner) && !(where === "wall" && !spot.corner)) continue;
        // a variant not yet used twice here
        const free = variants.filter((v) => (used.get(v) ?? 0) < 2);
        if (!free.length) break;
        const name = free[Math.floor(random() * free.length)];
        const prefab = PIECES[name];
        const q = QUARTERS[spot.wall];
        const own = turned(printOf(prefab), q);
        // its back against the wall at the spot, its side clear of the corner's other wall
        const at = [...spot.at];
        if (spot.wall === "west") at[0] = x0 + inset - own.min[0];
        if (spot.wall === "east") at[0] = x1 - inset - own.max[0];
        if (spot.wall === "south") at[1] = y0 + inset - own.min[1];
        if (spot.wall === "north") at[1] = y1 - inset - own.max[1];
        if (spot.corner) at[1] = Math.abs(spot.at[1] - y0) < 1 ? y0 + inset - own.min[1] : y1 - inset - own.max[1];
        const print = { min: [at[0] + own.min[0], at[1] + own.min[1]], max: [at[0] + own.max[0], at[1] + own.max[1]] };
        if (print.min[0] < x0 || print.max[0] > x1 || print.min[1] < y0 || print.max[1] > y1) continue;
        if (blocked.some((b) => overlaps(print, b, 8)) || placed.some((p) => overlaps(print, p, 6))) continue;
        // a room keeps its middle free to walk through: what reaches past a third of the room's depth from its
        // wall is left out
        const depth = spot.wall === "west" || spot.wall === "east" ? x1 - x0 : y1 - y0;
        if ((spot.wall === "west" || spot.wall === "east" ? own.max[0] - own.min[0] : own.max[1] - own.min[1]) > depth / 3) continue;
        placed.push(print);
        used.set(name, (used.get(name) ?? 0) + 1);
        prefabs[`dress_${name}`] = PIECES[name];
        furniture.push({ prefab: `dress_${name}`, room: room.id, at: [at[0] - mid[0], at[1] - mid[1]], rotate: 90 * q, dressed: true });
        got++;
      }
    }
    facts.push(`${room.id} (${use}): ${placed.length} pieces (${[...used].map(([n, k]) => `${k} ${n}`).join(", ")})`);
  }
  return { prefabs, furniture, facts };
}
