// Valve's own map sources, read: the Half-Life SDK ships c1a0.rmf, c1a0d.rmf and env_beam.rmf (Hammer's binary
// RMF 2.2) and Hammer's prefab libraries (`Hammer Editor/prefabs/*.ol`, "Worldcraft Prefab Library"). This reads
// both and prints numbers for research/map-geometry.md: how Valve's mappers drew brushes, grouped them, which
// classes they made of them, and what each prefab of the libraries holds.
//
//   node research/rmf-read.mjs map <file.rmf>          counts for one map source
//   node research/rmf-read.mjs prefabs <folder of .ol> every prefab: name, notes, entities, brushes, size, wiring
//
// The layout is TWHL's "Specification: RMF" (https://twhl.info/wiki/page/Specification:_RMF); the .ol
// directory (an offset, a size, a name of 31 and notes to 544 bytes an entry) was read off the files. Nothing
// is written: the SDK's files are Valve's, and only counts and names are printed.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** One RMF document from a buffer at an offset: { visgroups, world } with every object as plain data. */
export function readRmf(buf, at = 0) {
  let p = at;
  const f32 = () => ((p += 4), buf.readFloatLE(p - 4));
  const i32 = () => ((p += 4), buf.readInt32LE(p - 4));
  const u8 = () => buf[p++];
  const vec = () => [f32(), f32(), f32()];
  const pstr = () => {
    const n = u8();
    const s = buf.toString("latin1", p, p + n).replace(/\0.*$/s, "");
    p += n;
    return s;
  };
  const fixed = (n) => {
    const s = buf.toString("latin1", p, p + n).replace(/\0.*$/s, "");
    p += n;
    return s;
  };
  const version = f32();
  const magic = buf.toString("latin1", p, p + 3);
  p += 3;
  if (magic !== "RMF") throw new Error(`not an RMF at ${at}: ${magic}`);
  const visgroups = [];
  for (let n = i32(); n > 0; n--) {
    const name = fixed(128);
    p += 4;
    const id = i32();
    p += 4;
    visgroups.push({ name, id });
  }
  const entityData = () => {
    const classname = pstr();
    p += 4;
    const spawnflags = i32();
    const keys = {};
    for (let n = i32(); n > 0; n--) keys[pstr()] = pstr();
    p += 12;
    return { classname, spawnflags, keys };
  };
  const object = () => {
    const type = pstr();
    const visgroup = i32();
    p += 3;
    const children = [];
    for (let n = i32(); n > 0; n--) children.push(object());
    const o = { type, visgroup, children };
    if (type === "CMapSolid") {
      o.faces = [];
      for (let n = i32(); n > 0; n--) {
        // 2.2 keeps the texture's axes; 1.8 (Worldcraft 1.6 to 2.1, which c1a0.rmf and c1a0d.rmf are) does not; 1.6
        // (most prefabs of the SDK's libraries) has a name of 40 and 4 bytes after the scale, not 16
        const old = version < 1.7;
        const texture = fixed(old ? 40 : 260);
        const axes = version >= 2;
        const u = axes ? vec() : null, su = f32(), v = axes ? vec() : null, sv = f32(), angle = f32(), scale = [f32(), f32()];
        p += old ? 4 : 16;
        const verts = [];
        for (let k = i32(); k > 0; k--) verts.push(vec());
        const plane = [vec(), vec(), vec()];
        o.faces.push({ texture, u, su, v, sv, angle, scale, verts, plane });
      }
    } else if (type === "CMapEntity") {
      Object.assign(o, entityData());
      p += 2;
      o.origin = vec();
      p += 4;
    } else if (type === "CMapWorld") {
      Object.assign(o, entityData());
      o.paths = [];
      for (let n = i32(); n > 0; n--) {
        const name = fixed(128), classname = fixed(128);
        const kind = i32();
        const nodes = [];
        for (let k = i32(); k > 0; k--) {
          const pos = vec();
          i32();
          fixed(128);
          const keys = {};
          for (let m = i32(); m > 0; m--) keys[pstr()] = pstr();
          nodes.push({ pos, keys });
        }
        o.paths.push({ name, classname, kind, nodes });
      }
    } else if (type !== "CMapGroup") throw new Error(`unknown object ${type} at ${p}`);
    return o;
  };
  const world = object();
  return { version, visgroups, world, end: p };
}

/** The prefabs of a Worldcraft prefab library: [{ name, notes, rmf }]. */
export function readLibrary(buf) {
  const head = "Worldcraft Prefab Library\r\n\x1a";
  if (buf.toString("latin1", 0, head.length) !== head) throw new Error("not a prefab library");
  const dir = buf.readInt32LE(32), count = buf.readInt32LE(36);
  const out = [];
  for (let k = 0; k < count; k++) {
    const e = dir + k * 544;
    const offset = buf.readInt32LE(e), name = buf.toString("latin1", e + 8, e + 39).replace(/\0.*$/s, ""), notes = buf.toString("latin1", e + 39, e + 544).replace(/\0.*$/s, "");
    try {
      out.push({ name, notes, rmf: readRmf(buf, offset) });
    } catch (err) {
      out.push({ name, notes, error: err.message });
    }
  }
  return out;
}

/** Every solid with the entity it belongs to (null for the world) and the groups it is in. */
function solidsOf(world) {
  const out = [], ents = [];
  const walk = (o, entity, depth) => {
    if (o.type === "CMapSolid") out.push({ solid: o, entity, depth });
    if (o.type === "CMapEntity") ents.push(o);
    for (const c of o.children) walk(c, o.type === "CMapEntity" ? o : entity, depth + (o.type === "CMapGroup" ? 1 : 0));
  };
  walk(world, null, 0);
  return { solids: out, entities: ents };
}

const boxOf = (solid) => {
  const pts = solid.faces.flatMap((f) => f.verts);
  const mn = [0, 1, 2].map((a) => Math.min(...pts.map((v) => v[a]))), mx = [0, 1, 2].map((a) => Math.max(...pts.map((v) => v[a])));
  return { mn, mx, size: mx.map((v, a) => Math.round(v - mn[a])) };
};
/** A brush that is an axis-aligned box: six faces, each plane along an axis. */
const isBox = (solid) =>
  solid.faces.length === 6 &&
  solid.faces.every((f) => {
    const [a, b, c] = f.plane;
    const n = [(b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]), (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]), (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])];
    const l = Math.hypot(...n);
    return n.filter((v) => Math.abs(v / l) > 0.999).length === 1;
  });
const median = (v) => (v.length ? [...v].sort((a, b) => a - b)[Math.floor(v.length / 2)] : null);
const q = (v, x) => (v.length ? [...v].sort((a, b) => a - b)[Math.min(v.length - 1, Math.floor(v.length * x))] : null);

function mapReport(file) {
  const rmf = readRmf(readFileSync(file));
  const { solids, entities } = solidsOf(rmf.world);
  const L = [`${file}: RMF ${rmf.version.toFixed(1)}, ${rmf.visgroups.length} visgroups (${rmf.visgroups.map((v) => v.name).join(", ")}), ${rmf.world.paths.length} paths`];
  const world = solids.filter((s) => !s.entity), owned = solids.filter((s) => s.entity);
  L.push(`brushes ${solids.length}: world ${world.length}, in brush entities ${owned.length}; point entities ${entities.filter((e) => !e.children.length).length}, brush entities ${entities.filter((e) => e.children.length).length}`);
  const boxes = world.filter((s) => isBox(s.solid)).length;
  L.push(`world brushes that are axis-aligned boxes: ${boxes} (${Math.round((100 * boxes) / world.length)}%); in groups: ${world.filter((s) => s.depth > 0).length}`);
  const sizes = world.map((s) => boxOf(s.solid).size);
  const thin = sizes.map((s) => Math.min(...s));
  L.push(`world brush thinnest side: median ${median(thin)}, q1 ${q(thin, 0.25)}, q3 ${q(thin, 0.75)}; share 16 or less ${Math.round((100 * thin.filter((t) => t <= 16).length) / thin.length)}%, 8 or less ${Math.round((100 * thin.filter((t) => t <= 8).length) / thin.length)}%`);
  const thick = sizes.map((s) => Math.max(...s));
  L.push(`world brush longest side: median ${median(thick)}, q3 ${q(thick, 0.75)}, p90 ${q(thick, 0.9)}`);
  const faces = world.map((s) => s.solid.faces.length);
  L.push(`faces a world brush: median ${median(faces)}, p90 ${q(faces, 0.9)}, most ${Math.max(...faces)}`);
  const grid = world.flatMap((s) => s.solid.faces.flatMap((f) => f.verts.flat())).map((v) => Math.round(v * 1000) / 1000);
  for (const g of [1, 8, 16]) L.push(`world vertex coordinates on the ${g} grid: ${Math.round((100 * grid.filter((v) => Math.abs(v / g - Math.round(v / g)) < 0.01).length) / grid.length)}%`);
  // brush entities
  const be = {};
  for (const e of entities.filter((e) => e.children.length)) {
    const sol = solidsOf({ type: "CMapGroup", children: e.children }).solids;
    const t = (be[e.classname] ??= { n: 0, brushes: [], tex: {}, keys: {}, sizes: [] });
    t.n++;
    t.brushes.push(sol.length);
    const pts = sol.flatMap((s) => s.solid.faces.flatMap((f) => f.verts));
    const mn = [0, 1, 2].map((a) => Math.min(...pts.map((v) => v[a]))), mx = [0, 1, 2].map((a) => Math.max(...pts.map((v) => v[a])));
    t.sizes.push(mx.map((v, a) => Math.round(v - mn[a])));
    for (const s of sol) for (const f of s.solid.faces) t.tex[f.texture.toLowerCase()] = (t.tex[f.texture.toLowerCase()] ?? 0) + 1;
  }
  L.push("brush entity classes: count, brushes each (median, most), box (median of sorted sides), top textures");
  for (const [c, t] of Object.entries(be).sort((a, b) => b[1].n - a[1].n)) {
    const sorted = t.sizes.map((s) => [...s].sort((a, b) => a - b));
    L.push(`  ${c.padEnd(22)} ${String(t.n).padStart(4)}  brushes ${median(t.brushes)} / ${Math.max(...t.brushes)}  box ${[0, 1, 2].map((k) => median(sorted.map((s) => s[k]))).join(" x ")}  ${Object.entries(t.tex).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k}:${v}`).join(" ")}`);
  }
  const pe = {};
  for (const e of entities.filter((e) => !e.children.length)) pe[e.classname] = (pe[e.classname] ?? 0) + 1;
  L.push(`point entity classes: ${Object.entries(pe).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ")}`);
  // groups: what Valve grouped (a set piece is often a group)
  const groups = [];
  const walk = (o) => {
    if (o.type === "CMapGroup") {
      const { solids: s, entities: e } = solidsOf({ type: "CMapGroup", children: o.children });
      groups.push({ brushes: s.length, ents: e.map((x) => x.classname) });
    }
    for (const c of o.children) walk(c);
  };
  walk(rmf.world);
  L.push(`groups: ${groups.length}; brushes a group median ${median(groups.map((g) => g.brushes))}; groups holding entities ${groups.filter((g) => g.ents.length).length}`);
  const sig = {};
  for (const g of groups.filter((g) => g.ents.length)) {
    const k = Object.entries(g.ents.reduce((a, c) => ((a[c] = (a[c] ?? 0) + 1), a), {})).sort().map(([c, n]) => (n > 1 ? `${c}*${n}` : c)).join("+");
    sig[k] = (sig[k] ?? 0) + 1;
  }
  L.push(`  their contents (top 25): ${Object.entries(sig).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => `${v}x ${k}`).join("; ")}`);
  return L.join("\n");
}

function prefabReport(folder) {
  const L = [];
  for (const f of readdirSync(folder).filter((f) => f.endsWith(".ol"))) {
    const lib = readLibrary(readFileSync(join(folder, f)));
    L.push(`\n== ${f}: ${lib.length} prefabs`);
    for (const pf of lib) {
      if (pf.error) {
        L.push(`  ${pf.name}: unreadable (${pf.error})`);
        continue;
      }
      const { solids, entities } = solidsOf(pf.rmf.world);
      const pts = solids.flatMap((s) => s.solid.faces.flatMap((x) => x.verts));
      const size = pts.length ? [0, 1, 2].map((a) => Math.round(Math.max(...pts.map((v) => v[a])) - Math.min(...pts.map((v) => v[a])))) : [0, 0, 0];
      const cls = Object.entries(entities.reduce((a, e) => ((a[e.classname] = (a[e.classname] ?? 0) + 1), a), {})).map(([k, v]) => (v > 1 ? `${k}*${v}` : k)).join(" ");
      const named = entities.filter((e) => e.keys.targetname).map((e) => e.keys.targetname);
      const targets = entities.filter((e) => e.keys.target).map((e) => `${e.classname}->${e.keys.target}`);
      const worldB = solids.filter((s) => !s.entity).length;
      L.push(`  ${pf.name.padEnd(31)} ${size.join("x").padEnd(12)} brushes ${solids.length} (world ${worldB})  ${cls}${named.length ? `  names ${named.join(",")}` : ""}${targets.length ? `  wiring ${targets.join(",")}` : ""}${pf.notes ? `  | ${pf.notes.slice(0, 80)}` : ""}`);
    }
  }
  return L.join("\n");
}

const [mode, arg] = process.argv.slice(2);
if (mode === "map") console.log(mapReport(arg));
else if (mode === "prefabs") console.log(prefabReport(arg));
else if (mode) console.log("node research/rmf-read.mjs map <file.rmf> | prefabs <folder>");
