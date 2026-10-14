// What changed between two builds of one spec: the answer to "now add a fridge next to the cabinet" is the
// fridge added and nothing else moved, and this says whether it was so. The tool `build` keeps a summary of
// each build beside what it wrote (<name>.built.json) and, building the same name again, tells what changed.
//
//   summaryOf(kind, spec, report)   -> what a later build is held against: parts or rooms and things, materials
//   changesOf(before, after)        -> sentences: what was added, taken away, moved, made another size or colour

/** How far a place or a box may move before it is said to have moved (units). */
const MOVED = 0.5;

/** A build's summary: a model's parts (their boxes), a map's rooms and the things put in it, both's materials. */
export function summaryOf(kind, spec, report) {
  const materials = { ...(spec.theme ?? {}), ...(spec.materials ?? {}), ...(spec.textures ?? {}) };
  if (kind === "model")
    return { kind, materials, parts: Object.fromEntries(Object.entries(report.parts ?? {}).map(([id, part]) => [id, { from: part.from, to: part.to }])) };
  return {
    kind,
    materials,
    rooms: Object.fromEntries(Object.entries(report.rooms ?? {}).map(([id, room]) => [id, { min: room.min, max: room.max }])),
    things: Object.fromEntries((report.placed ?? []).map((thing) => [thing.key, thing])),
  };
}

const apart = (a, b) => Math.max(...a.map((v, k) => Math.abs(v - b[k])));
const said = (list, what) => (list.length ? [`${what}: ${list.join("; ")}`] : []);

/**
 * What changed from `before` to `after` (two summaries), in sentences; and `still`, how much did not.
 * Returns { lines, changed, still }.
 */
export function changesOf(before, after) {
  const lines = [];
  let changed = 0;
  let still = 0;
  const compare = (was, now, describe, moved) => {
    const added = Object.keys(now).filter((key) => !(key in was));
    const gone = Object.keys(was).filter((key) => !(key in now));
    const shifted = Object.keys(now).filter((key) => key in was && moved(was[key], now[key]));
    changed += added.length + gone.length + shifted.length;
    still += Object.keys(now).filter((key) => key in was).length - shifted.length;
    return { added: added.map((key) => describe(key, now[key])), gone, shifted: shifted.map((key) => `${key} ${describe.move(was[key], now[key])}`) };
  };
  if (after.kind === "model") {
    const describe = (id, part) => `${id} (${part.from.join(" ")} to ${part.to.join(" ")})`;
    describe.move = (was, now) => `from ${was.from.join(" ")}..${was.to.join(" ")} to ${now.from.join(" ")}..${now.to.join(" ")}`;
    const parts = compare(before.parts ?? {}, after.parts ?? {}, describe, (a, b) => apart(a.from, b.from) > MOVED || apart(a.to, b.to) > MOVED);
    lines.push(...said(parts.added, "parts added"), ...said(parts.gone, "parts taken away"), ...said(parts.shifted, "parts moved or resized"));
  } else {
    const describeRoom = (id, room) => `${id} (${room.min.join(" ")} to ${room.max.join(" ")})`;
    describeRoom.move = (was, now) => `from ${was.min.join(" ")}..${was.max.join(" ")} to ${now.min.join(" ")}..${now.max.join(" ")}`;
    const rooms = compare(before.rooms ?? {}, after.rooms ?? {}, describeRoom, (a, b) => apart(a.min, b.min) > MOVED || apart(a.max, b.max) > MOVED);
    const describeThing = (key, thing) => `${key} in ${thing.room} at ${thing.at.join(" ")}`;
    describeThing.move = (was, now) => `from ${was.at.join(" ")} to ${now.at.join(" ")}${was.turn !== now.turn ? `, turned ${was.turn} to ${now.turn}` : ""}`;
    const was = before.things ?? {};
    const now = after.things ?? {};
    const things = compare(was, now, describeThing, (a, b) => apart(a.at, b.at) > MOVED || a.turn !== b.turn || a.room !== b.room);
    // a thing taken away and another put where it stood, in the same room: one swapped for the other (every
    // summer tree for a winter one), said so, and not as so many added and taken away
    const swapped = [];
    const addedKeys = Object.keys(now).filter((key) => !(key in was));
    for (const goneKey of [...things.gone]) {
      const old = was[goneKey];
      const match = addedKeys.find((key) => now[key].room === old.room && now[key].what === old.what && apart(now[key].at, old.at) <= MOVED);
      if (!match) continue;
      addedKeys.splice(addedKeys.indexOf(match), 1);
      things.gone.splice(things.gone.indexOf(goneKey), 1);
      things.added.splice(things.added.indexOf(describeThing(match, now[match])), 1);
      swapped.push(`${goneKey} for ${match} in ${old.room} at ${old.at.join(" ")}`);
      changed -= 1;
    }
    lines.push(
      ...said(swapped, "things swapped where they stood"),
      ...said(rooms.added, "rooms added"),
      ...said(rooms.gone, "rooms taken away"),
      ...said(rooms.shifted, "rooms moved or resized"),
      ...said(things.added, "things added"),
      ...said(things.gone, "things taken away"),
      ...said(things.shifted, "things moved or turned"),
    );
  }
  const recoloured = Object.keys(after.materials ?? {}).filter((key) => key in (before.materials ?? {}) && JSON.stringify(before.materials[key]) !== JSON.stringify(after.materials[key]));
  const newMaterials = Object.keys(after.materials ?? {}).filter((key) => !(key in (before.materials ?? {})));
  changed += recoloured.length + newMaterials.length;
  lines.push(...said(recoloured.map((key) => `${key} ${JSON.stringify(before.materials[key])} to ${JSON.stringify(after.materials[key])}`), "materials changed"), ...said(newMaterials, "materials added"));
  if (!lines.length) lines.push("nothing changed");
  lines.push(`${still} ${after.kind === "model" ? "parts" : "rooms and things"} are where they were`);
  return { lines, changed, still };
}
