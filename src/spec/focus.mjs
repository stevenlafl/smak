// A map's main room and its landmark (`focus`): one main area a map, with a large hero piece in it, lit hardest,
// on a plinth of its own, a clear floor round it, and seen from every way into its room (research/level-dressing.md,
// ranked item 3: Valve's and id's designers give a map one main area and a landmark the eye finds from each
// entrance). The spec says which room and what the landmark is; this module puts it in (a piece the spec names, or
// a centrepiece the kit makes), and after the map is laid out tests each way's sightline to it.
//
//   focusSpec(spec)                                   -> { spec, focus, errors, facts }   before anything is built
//   focusSeen(focus, { sees, placed, rooms, ways })   -> { seen, from: [...], facts, warnings }   on the laid-out map
//
// `focus`: { room, landmark, at, z, size, plinth, clear, from, texture }
//   room       the main room's id
//   landmark   a furniture's or a prop's `id` in that room; or the name of a prefab or model used there (every
//              piece of it in the room is the landmark: the pump hall's three pumps); or { prefab }, { model } or
//              { kit: "pump" | "machine" | "reactor" | "statue" | "door", size: [x, y, z] }: a piece put in for it
//   at, z      where a piece put in for it stands (the room's middle unless told), as any furniture's
//   plinth     the frame it stands on: 8 high, 16 past its foot (`false`: none; [x, y]: its own footprint)
//   clear      the floor kept clear round it (32): furniture nearer is warned of
//   from       more places it must be seen from: "start" (the map's first place to start)
//   texture    the plinth's (the framing's unless told)

/** A centrepiece the kit makes for a common kind of landmark: prefab pieces in units over the floor. */
const CENTREPIECES = {
  pump: [
    { box: [[-40, -40, 0], [40, 40, 16]], texture: "framing" },
    { cylinder: { centre: [0, 0], radius: 32, from: 16, to: 144, sides: 12 }, texture: "furniture" },
    { box: [[-24, -20, 144], [24, 20, 184]], texture: "framing" },
    { cylinder: { centre: [0, 46], radius: 8, from: 24, to: 120, sides: 8 }, texture: "framing" },
  ],
  machine: [
    { box: [[-64, -40, 0], [64, 40, 96]], texture: "furniture" },
    { box: [[-40, -28, 96], [40, 28, 128]], texture: "framing" },
    { cylinder: { centre: [-52, 46], radius: 6, from: 0, to: 112, sides: 8 }, texture: "framing" },
    { cylinder: { centre: [52, 46], radius: 6, from: 0, to: 112, sides: 8 }, texture: "framing" },
  ],
  reactor: [
    { cylinder: { centre: [0, 0], radius: 72, from: 0, to: 24, sides: 16 }, texture: "framing" },
    { cylinder: { centre: [0, 0], radius: 48, from: 24, to: 176, sides: 16 }, texture: "furniture" },
    { cylinder: { centre: [0, 0], radius: 56, from: 96, to: 112, sides: 16 }, texture: "framing" },
    { cylinder: { centre: [0, 0], radius: 40, from: 176, to: 192, sides: 16 }, texture: "framing" },
  ],
  statue: [
    { box: [[-32, -32, 0], [32, 32, 48]], texture: "framing" },
    { cylinder: { centre: [0, 0], radius: 14, from: 48, to: 120, sides: 8 }, texture: "furniture" },
    { box: [[-8, -8, 120], [8, 8, 136]], texture: "furniture" },
  ],
  door: [
    { box: [[-8, -104, 0], [8, -96, 208]], texture: "framing" },
    { box: [[-8, 96, 0], [8, 104, 208]], texture: "framing" },
    { box: [[-8, -104, 192], [8, 104, 208]], texture: "framing" },
    { box: [[-4, -96, 0], [4, 96, 192]], texture: "furniture" },
  ],
};
export const CENTREPIECE_KINDS = Object.keys(CENTREPIECES);
const PLINTH = { high: 8, past: 16 };
const CLEAR = 32;
const EYE = 64;
/** A model's footprint when nothing says it: half a side */
const MODEL_HALF = 32;
const MODEL_HIGH = 96;

/** The box of prefab pieces, in their own units: { min: [x, y, z], max } */
function piecesBox(pieces) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  const grow = (p) => p.forEach((v, k) => ((min[k] = Math.min(min[k], v)), (max[k] = Math.max(max[k], v))));
  for (const piece of pieces) {
    const shape = piece.box ?? piece.wedge;
    if (shape) (grow(shape[0]), grow(shape[1]));
    else if (piece.cylinder) {
      const { centre, radius, from, to } = piece.cylinder;
      grow([centre[0] - radius, centre[1] - radius, from]);
      grow([centre[0] + radius, centre[1] + radius, to]);
    } else if (piece.prism) {
      for (const [x, y] of piece.prism.outline) (grow([x, y, piece.prism.from]), grow([x, y, piece.prism.to]));
    }
  }
  return Number.isFinite(min[0]) ? { min, max } : { min: [-MODEL_HALF, -MODEL_HALF, 0], max: [MODEL_HALF, MODEL_HALF, MODEL_HIGH] };
}

/** Pieces stretched to a size, about their foot's middle: [x, y, z] over their own box */
function scaled(pieces, size) {
  const { min, max } = piecesBox(pieces);
  const k = [0, 1, 2].map((a) => size[a] / Math.max(1, max[a] - min[a]));
  const at = (p) => [p[0] * k[0], p[1] * k[1], p[2] * k[2]];
  return pieces.map((piece) => {
    if (piece.box) return { ...piece, box: piece.box.map(at) };
    if (piece.cylinder) {
      const c = piece.cylinder;
      return { ...piece, cylinder: { ...c, centre: [c.centre[0] * k[0], c.centre[1] * k[1]], radius: c.radius * Math.min(k[0], k[1]), from: c.from * k[2], to: c.to * k[2] } };
    }
    return piece;
  });
}

/** A footprint turned a quarter as many times as `rotate` says: { min: [x, y, z], max } */
const turned = (box, rotate = 0) => {
  const q = (((Math.round((rotate ?? 0) / 90) % 4) + 4) % 4);
  if (q % 2 === 0) return box;
  return { min: [box.min[1], box.min[0], box.min[2]], max: [box.max[1], box.max[0], box.max[2]] };
};

/**
 * The spec with its focus put in: a centrepiece added as furniture where none is named, the landmark raised onto a
 * plinth, the main room made the composed light's goal. Returns { spec, focus, errors, facts }; `focus` is null
 * when the spec asks for none.
 */
export function focusSpec(spec) {
  const errors = [];
  const facts = [];
  const asked = spec.focus;
  if (asked === undefined) return { spec, focus: null, errors, facts };
  if (!asked || typeof asked !== "object") return { spec, focus: null, errors: ["focus: { room, landmark, at, z, plinth, clear, from }"], facts };
  const room = (spec.rooms ?? []).find((r) => r?.id === asked.room);
  if (!room) errors.push(`focus.room: the main room's id, not ${JSON.stringify(asked.room)}`);
  const lm = asked.landmark;
  if (lm === undefined) errors.push("focus.landmark: an id or a prefab or model used in the room, or { prefab } / { model } / { kit, size }");
  if (lm && typeof lm === "object" && lm.kit !== undefined && !CENTREPIECES[lm.kit]) errors.push(`focus.landmark.kit: ${CENTREPIECE_KINDS.join(", ")}, not ${JSON.stringify(lm.kit)}`);
  if (lm && typeof lm === "object" && lm.size !== undefined && !(Array.isArray(lm.size) && lm.size.length === 3 && lm.size.every((v) => typeof v === "number" && v > 0))) errors.push("focus.landmark.size: [x, y, z] in units");
  if (asked.plinth !== undefined && asked.plinth !== false && !(Array.isArray(asked.plinth) && asked.plinth.length === 2 && asked.plinth.every((v) => typeof v === "number" && v > 0))) errors.push("focus.plinth: false, or [x, y] its footprint");
  if (asked.clear !== undefined && !(typeof asked.clear === "number" && asked.clear >= 0)) errors.push("focus.clear: units of floor kept clear round the landmark, 0 or more");
  if (asked.from !== undefined && !(Array.isArray(asked.from) && asked.from.every((f) => f === "start"))) errors.push('focus.from: ["start"]');
  for (const key of Object.keys(asked)) if (!["room", "landmark", "at", "z", "plinth", "clear", "from", "texture"].includes(key)) errors.push(`focus.${key}: not a word of focus (room, landmark, at, z, plinth, clear, from, texture)`);
  if (errors.length) return { spec, focus: null, errors, facts };

  let furniture = [...(spec.furniture ?? [])];
  let props = [...(spec.props ?? [])];
  let prefabs = { ...(spec.prefabs ?? {}) };
  // the pieces that are the landmark: [{ list: "furniture" | "props", index, box (its own, turned) }]
  const pieces = [];
  const boxOfThing = (thing, what) => {
    if (what === "props") return { min: [-MODEL_HALF, -MODEL_HALF, 0], max: [MODEL_HALF, MODEL_HALF, MODEL_HIGH] };
    if (thing.box) return { min: [-thing.box[0] / 2, -thing.box[1] / 2, 0], max: [thing.box[0] / 2, thing.box[1] / 2, thing.box[2]] };
    const prefab = prefabs[thing.prefab];
    return turned(prefab?.pieces ? piecesBox(prefab.pieces) : { min: [-MODEL_HALF, -MODEL_HALF, 0], max: [MODEL_HALF, MODEL_HALF, MODEL_HIGH] }, thing.rotate);
  };
  const inRoom = (thing) => thing.room === asked.room;
  if (typeof lm === "string") {
    furniture.forEach((thing, index) => inRoom(thing) && (thing.id === lm || thing.prefab === lm) && pieces.push({ list: "furniture", index, box: boxOfThing(thing, "furniture") }));
    props.forEach((thing, index) => inRoom(thing) && (thing.id === lm || thing.model === lm) && pieces.push({ list: "props", index, box: boxOfThing(thing, "props") }));
    if (!pieces.length) errors.push(`focus.landmark: no furniture or prop in ${asked.room} is ${JSON.stringify(lm)} (by its id, or the prefab or model it is)`);
  } else if (lm.prefab) {
    if (!prefabs[lm.prefab]) errors.push(`focus.landmark.prefab: no prefab ${JSON.stringify(lm.prefab)}`);
    else {
      furniture.push({ prefab: lm.prefab, room: asked.room, at: asked.at ?? "centre", id: "landmark", ...(asked.z !== undefined ? { z: asked.z } : {}) });
      pieces.push({ list: "furniture", index: furniture.length - 1, box: boxOfThing(furniture.at(-1), "furniture") });
    }
  } else if (lm.model) {
    props.push({ model: lm.model, room: asked.room, at: asked.at ?? "centre", id: "landmark", solid: true, ...(asked.z !== undefined ? { z: asked.z } : {}) });
    pieces.push({ list: "props", index: props.length - 1, box: boxOfThing(props.at(-1), "props") });
  } else if (lm.kit) {
    const made = lm.size ? scaled(CENTREPIECES[lm.kit], lm.size) : CENTREPIECES[lm.kit];
    prefabs = { ...prefabs, [`landmark_${lm.kit}`]: { pieces: made } };
    furniture.push({ prefab: `landmark_${lm.kit}`, room: asked.room, at: asked.at ?? "centre", id: "landmark", ...(asked.z !== undefined ? { z: asked.z } : {}) });
    pieces.push({ list: "furniture", index: furniture.length - 1, box: piecesBox(made) });
    facts.push(`focus: a ${lm.kit} the kit made, ${piecesBox(made).max.map((v, k) => Math.round(v - piecesBox(made).min[k])).join(" x ")}, put in ${asked.room} as its landmark`);
  }
  if (errors.length) return { spec, focus: null, errors, facts };

  // each piece raised onto a plinth of its own, 16 past its foot (a piece put `beside` another keeps its floor:
  // a plinth would stand where it was measured from)
  const high = asked.plinth === false ? 0 : PLINTH.high;
  const texture = asked.texture ?? "framing";
  const plinths = [];
  for (const piece of pieces) {
    const list = piece.list === "furniture" ? furniture : props;
    const thing = list[piece.index];
    if (high === 0 || (thing.at && typeof thing.at === "object" && !Array.isArray(thing.at))) continue;
    const half = Array.isArray(asked.plinth) ? asked.plinth.map((v) => v / 2) : [0, 1].map((k) => (piece.box.max[k] - piece.box.min[k]) / 2 + PLINTH.past);
    const middle = [0, 1].map((k) => (piece.box.max[k] + piece.box.min[k]) / 2);
    const lo = [0, 1].map((k) => middle[k] - half[k]);
    const hi = [0, 1].map((k) => middle[k] + half[k]);
    // a piece put at [dx, dy] from the room's middle near a wall: its plinth stops at the wall, not in it (the pump
    // hall's pumps stand against the pool's side)
    if (Array.isArray(thing.at) && Array.isArray(room.size))
      for (const k of [0, 1]) {
        lo[k] = Math.max(lo[k], -room.size[k] / 2 - thing.at[k]);
        hi[k] = Math.min(hi[k], room.size[k] / 2 - thing.at[k]);
      }
    const name = `focus_plinth_${plinths.length + 1}`;
    prefabs = { ...prefabs, [name]: { pieces: [{ box: [[lo[0], lo[1], 0], [hi[0], hi[1], high]], texture }] } };
    plinths.push({ prefab: name, room: asked.room, at: thing.at, ...(thing.z !== undefined ? { z: thing.z } : {}), plinthOf: piece });
    list[piece.index] = { ...thing, z: (thing.z ?? 0) + high };
  }
  furniture = [...plinths.map(({ plinthOf: _p, ...plinth }) => plinth), ...furniture];
  // the furniture's indices moved by the plinths put first
  for (const piece of pieces) if (piece.list === "furniture") piece.index += plinths.length;
  if (plinths.length) facts.push(`focus: ${plinths.length} plinth${plinths.length > 1 ? "s" : ""} ${high} high under the landmark, ${PLINTH.past} past its foot`);

  // lit hardest: the composed light's goal, and a lamp of its own over it
  let lighting = spec.lighting;
  if (lighting) lighting = { ...(typeof lighting === "object" ? lighting : {}), goalRoom: (typeof lighting === "object" && lighting.goalRoom) || asked.room };
  const top = Math.max(...pieces.map((p) => p.box.max[2])) + high;
  const ceiling = room.size?.[2] ?? 160;
  const over = Math.max(top + 24, Math.min(ceiling - 24, top + 96));
  const first = pieces[0].list === "furniture" ? furniture[pieces[0].index] : props[pieces[0].index];
  const entities = [...(spec.entities ?? [])];
  if (first.at === undefined || typeof first.at === "string" || Array.isArray(first.at)) entities.push({ class: "light", room: asked.room, at: first.at ?? "centre", height: Math.min(over, ceiling - 8), keys: { brightness: 300 } });
  const focus = { room: asked.room, name: typeof lm === "string" ? lm : lm.prefab ?? lm.model ?? lm.kit, pieces, plinth: high, clear: asked.clear ?? CLEAR, from: asked.from ?? [] };
  return { spec: { ...spec, furniture, props, prefabs, entities, ...(lighting ? { lighting } : {}) }, focus, errors, facts };
}

/** Where a segment from `a` towards `b` first meets a box, pulled back `by`; `b` when it meets none */
function shortOf(a, b, box, by = 2) {
  const d = b.map((v, k) => v - a[k]);
  let t0 = 0;
  let t1 = 1;
  for (let k = 0; k < 3; k++) {
    if (Math.abs(d[k]) < 1e-9) {
      if (a[k] < box.min[k] || a[k] > box.max[k]) return b;
      continue;
    }
    let lo = (box.min[k] - a[k]) / d[k];
    let hi = (box.max[k] - a[k]) / d[k];
    if (lo > hi) [lo, hi] = [hi, lo];
    t0 = Math.max(t0, lo);
    t1 = Math.min(t1, hi);
    if (t0 > t1) return b;
  }
  const length = Math.hypot(...d) || 1;
  const t = Math.max(0, t0 - by / length);
  return a.map((v, k) => v + d[k] * t);
}

/**
 * The landmark tested from each way into its room, after the map is laid out. `sees(from, to)`: the laid-out
 * map's sightline (spaceOf(map).sees); `placed`: report.placed; `rooms`: the rooms' boxes; `ways`: [{ name, hole,
 * axis }] each way through a wall. Returns { seen, of, at, facts, warnings }.
 */
export function focusSeen(focus, { sees, placed, rooms, ways, start = null }) {
  const room = rooms.get(focus.room);
  const facts = [];
  const warnings = [];
  // the landmark's pieces where they stand: their boxes in the world
  const things = placed.filter((p) => p.room === focus.room && (p.what === "furniture" || p.what === "props"));
  const boxes = focus.pieces.map((piece) => {
    const at = placed.find((p) => p.what === piece.list && p.index === piece.index)?.at;
    if (!at) return null;
    return { min: [at[0] + piece.box.min[0], at[1] + piece.box.min[1], at[2] + piece.box.min[2]], max: [at[0] + piece.box.max[0], at[1] + piece.box.max[1], at[2] + piece.box.max[2]] };
  }).filter(Boolean);
  if (!boxes.length) return { seen: 0, of: 0, at: null, facts, warnings: ["focus: the landmark was not placed: nothing to see"] };
  const centre = [0, 1, 2].map((k) => boxes.reduce((s, b) => s + (b.min[k] + b.max[k]) / 2, 0) / boxes.length);
  // each way into the main room: a point 24 inside it at a player's eyes. A room placed in another (a pool sunk in a
  // hall's floor, a pit) has no way of its own: the ways into the rooms that hold it in plan are its ways
  const near = (v, w) => Math.abs(v - w) < 64;
  const intoRoom = (box) =>
    ways
      .filter(({ hole, axis }) => {
        const other = axis === 0 ? 1 : 0;
        const overlaps = hole.max[other] > box.min[other] && hole.min[other] < box.max[other];
        return overlaps && (near(hole.max[axis], box.min[axis]) || near(hole.min[axis], box.max[axis]));
      })
      .map(({ name, hole, axis }) => {
        const p = [0, 1].map((k) => (hole.min[k] + hole.max[k]) / 2);
        p[axis] = near(hole.max[axis], box.min[axis]) ? box.min[axis] + 24 : box.max[axis] - 24;
        return { name, eye: [p[0], p[1], Math.min(Math.max(box.min[2], hole.min[2]) + EYE, hole.max[2] - 4)] };
      });
  const holds = (outer) => outer !== room && [0, 1].every((k) => outer.min[k] <= room.min[k] + 1 && outer.max[k] >= room.max[k] - 1);
  let into = intoRoom(room);
  if (!into.length) into = [...rooms.values()].filter(holds).flatMap((outer) => intoRoom(outer).map((w) => ({ ...w, name: `${w.name} (into ${outer.id})` })));
  if (start && focus.from.includes("start")) into.push({ name: "the start", eye: start });
  const seenFrom = into.map(({ name, eye }) => {
    const seen = boxes.some((b) => {
      const mid = [(b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, b.min[2] + (b.max[2] - b.min[2]) * 0.6];
      return sees(eye, shortOf(eye, mid, b));
    });
    return { name, eye: eye.map(Math.round), seen };
  });
  const seen = seenFrom.filter((s) => s.seen).length;
  facts.push(`focus: the landmark (${focus.name}, ${boxes.length} piece${boxes.length > 1 ? "s" : ""}) in ${focus.room} at ${centre.map(Math.round).join(" ")}, seen from ${seen} of ${seenFrom.length} ways in: ${seenFrom.map((s) => `${s.name} ${s.seen ? "sees it" : "does not"}`).join(", ")}`);
  const hidden = seenFrom.filter((s) => !s.seen);
  if (hidden.length) warnings.push(`focus: the landmark is not seen from ${hidden.map((s) => `${s.name} (eye at ${s.eye.join(" ")})`).join(", ")}: something stands between, or the way looks past it. Move the landmark, or what is in the way, so each way in finds it`);
  // the floor kept clear round it: other furniture and props nearer than `clear`
  const grown = boxes.map((b) => ({ min: b.min.map((v, k) => (k < 2 ? v - focus.clear : v)), max: b.max.map((v, k) => (k < 2 ? v + focus.clear : v)) }));
  const own = new Set(focus.pieces.map((piece) => `${piece.list} ${piece.index}`));
  const crowding = things.filter((p) => !/^focus_plinth_/.test(p.name) && !own.has(`${p.what} ${p.index}`) && !boxes.some((b) => p.at[0] >= b.min[0] && p.at[0] <= b.max[0] && p.at[1] >= b.min[1] && p.at[1] <= b.max[1]) && grown.some((g) => p.at[0] > g.min[0] && p.at[0] < g.max[0] && p.at[1] > g.min[1] && p.at[1] < g.max[1]));
  if (crowding.length) warnings.push(`focus: ${crowding.length} things stand within ${focus.clear} of the landmark (${crowding.slice(0, 4).map((p) => p.name).join(", ")}): keep the floor round it clear, so it reads as the room's one centre`);
  // where a camera aims: over the landmark's top, in open air (its middle is inside it, and a view needs a clear
  // line to what it aims at)
  const aim = [centre[0], centre[1], Math.max(...boxes.map((b) => b.max[2])) + 8];
  return { seen, of: seenFrom.length, at: centre, aim, facts, warnings };
}
