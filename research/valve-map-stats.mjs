// How Valve builds Half-Life's campaign maps, in numbers: space, brush entities, and where point entities stand
// against floors, ceilings and walls. For research/map-geometry.md.
//
//   node research/valve-map-stats.mjs <valve/maps folder> <out folder> [map ...]    one JSON a map
//   node research/valve-map-stats.mjs --sum <out folder>                            the tables over all of them
//
// Without names it takes every campaign map (c0a0 to c5a1, "cXaY"). It only reads the game's maps and writes
// numbers (counts, sizes, distances, class and texture names) into the out folder, which belongs outside the
// repository: nothing of the maps' geometry or textures is kept.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import * as maps from "../src/maps/index.mjs";
import { floorOf } from "../examples/reproduce/judge.mjs";

const SOLID = maps.CONTENTS.SOLID, SKY = maps.CONTENTS.SKY;
const median = (v) => (v.length ? [...v].sort((a, b) => a - b)[Math.floor(v.length / 2)] : null);
const q = (v, p) => (v.length ? [...v].sort((a, b) => a - b)[Math.min(v.length - 1, Math.floor(v.length * p))] : null);
const r1 = (v) => (v === null || v === undefined ? null : Math.round(v * 10) / 10);

function statsOf(file) {
  const bytes = readFileSync(file);
  const bsp = maps.readBsp(bytes);
  const ents = bsp.entities.map((pairs) => Object.fromEntries(pairs));
  const solidAt = (p) => {
    const c = maps.contentsAt(bsp, p);
    return c === SOLID || c === SKY;
  };
  // the brush entities with their boxes in world space
  const brushes = [];
  ents.forEach((e, i) => {
    const n = e.model?.startsWith("*") ? Number(e.model.slice(1)) : null;
    if (!n) return;
    const m = bsp.models[n];
    const o = e.origin ? e.origin.split(/\s+/).map(Number) : [0, 0, 0];
    brushes.push({ i, n, e, mins: m.mins.map((v, k) => v + o[k]), maxs: m.maxs.map((v, k) => v + o[k]), o });
  });
  // a point's floor: the world's, or a brush entity's top under it (a table that is a func_wall)
  const floorAt = (p) => {
    let best = maps.floorUnder(bsp, p);
    let on = best === null ? null : "world";
    for (const b of brushes) {
      if (p[0] < b.mins[0] || p[0] > b.maxs[0] || p[1] < b.mins[1] || p[1] > b.maxs[1] || b.mins[2] > p[2]) continue;
      if (/^trigger_|^func_ladder$|^func_illusionary$/.test(b.e.classname)) continue;
      const f = maps.floorUnder(bsp, p.map((v, k) => v - b.o[k]), { model: b.n });
      if (f !== null && (best === null || f + b.o[2] > best)) {
        best = f + b.o[2];
        on = b.e.classname;
      }
    }
    return { floor: best, on };
  };
  const upTo = (p, most = 2048) => {
    if (solidAt(p)) return 0;
    let d = 4;
    while (d <= most && !solidAt([p[0], p[1], p[2] + d])) d += 4;
    if (d > most) return null;
    let lo = d - 4, hi = d;
    while (hi - lo > 0.5) {
      const mid = (lo + hi) / 2;
      if (solidAt([p[0], p[1], p[2] + mid])) hi = mid;
      else lo = mid;
    }
    return hi;
  };
  const wallAt = (p, most = 1024) => {
    if (solidAt(p)) return 0;
    let best = null;
    for (let k = 0; k < 16; k++) {
      const a = (k * Math.PI) / 8, dir = [Math.cos(a), Math.sin(a)];
      let d = 2;
      while (d <= most && !solidAt([p[0] + dir[0] * d, p[1] + dir[1] * d, p[2]])) d += 2;
      if (d <= most && (best === null || d < best)) best = d;
    }
    return best;
  };

  const out = { map: basename(file, ".bsp") };
  // ── space
  const m = maps.measure(bsp, { every: true });
  out.space = { area: m.area, footprint: m.footprint?.size, share: m.footprint?.share, floors: m.floors, width: m.width, headroom: m.headroom, sight: m.sight, openings: m.openings };
  // steps: the rises between neighbouring cells of the walked floor (one floor a cell)
  const fl = floorOf(bytes);
  const rises = {};
  for (const [key, hs] of fl.cells) {
    if (hs.length !== 1) continue;
    const [x, y] = key.split(",").map(Number);
    for (const [dx, dy] of [[16, 0], [0, 16]]) {
      const o = fl.cells.get(`${x + dx},${y + dy}`);
      if (!o || o.length !== 1) continue;
      const d = Math.round(Math.abs(o[0] - hs[0]));
      if (d >= 2 && d <= 18) rises[d] = (rises[d] ?? 0) + 1;
    }
  }
  out.space.rises = rises;
  out.space.walkedCells = fl.cells.size;

  // ── classes
  const classes = {};
  for (const e of ents) classes[e.classname] = (classes[e.classname] ?? 0) + 1;
  out.classes = classes;

  // ── brush entities: size, faces, textures, keys
  const worldFaces = bsp.models[0].faceCount;
  out.worldFaces = worldFaces;
  // texture lights: faces wearing a texture of the calibrated list (goldsrc.net's, in src/maps/texlights.mjs)
  const emitters = new Set(maps.TEXLIGHTS.map((t) => t.name.toLowerCase()));
  let lit = 0;
  for (const f of maps.modelFaces(bsp, 0)) if (emitters.has(maps.faceTexture(bsp, f).name.toLowerCase())) lit++;
  out.texlightFaces = lit;
  out.brush = {};
  for (const b of brushes) {
    const c = b.e.classname;
    const s = (out.brush[c] ??= { count: 0, faces: 0, sizes: [], textures: {}, rendermodes: {}, keys: {} });
    s.count++;
    const faces = maps.modelFaces(bsp, b.n);
    s.faces += faces.length;
    const size = b.maxs.map((v, k) => Math.round(v - b.mins[k]));
    s.sizes.push(size);
    for (const f of faces) {
      const t = maps.faceTexture(bsp, f).name.toLowerCase();
      s.textures[t] = (s.textures[t] ?? 0) + 1;
    }
    const rm = b.e.rendermode ?? "0";
    s.rendermodes[rm] = (s.rendermodes[rm] ?? 0) + 1;
    for (const k of ["speed", "wait", "lip", "angle", "spawnflags", "sounds", "health", "material", "dmg", "targetname", "target", "renderamt", "_minlight", "delay", "spawnobject"])
      if (b.e[k] !== undefined) (s.keys[k] ??= []).push(k === "targetname" || k === "target" ? 1 : b.e[k]);
  }

  // ── point entities: where they stand
  out.points = {};
  for (const e of ents) {
    if (!e.origin || e.model?.startsWith("*")) continue;
    const c = e.classname;
    if (/^(info_node|info_node_air|path_corner|path_track|multi_manager|multisource|env_message|game_text|trigger_auto|trigger_relay|info_target|ambient_generic|env_shake|env_fade|env_render|player_weaponstrip|player_loadsaved|scripted_sentence|aiscripted_sequence|env_sound|info_landmark|light_environment|infodecal|env_global|game_player_equip|env_explosion|env_spark|monstermaker|env_funnel|env_beam|env_laser|speaker|target_cdaudio|momentary_door|env_shooter|env_blood|env_bubbles|gibshooter|env_smoker|info_bigmomma|xen_.*|cycler.*)$/.test(c) && !/^(info_node|ambient_generic|path_corner|info_landmark|env_sound)$/.test(c)) continue;
    const p = e.origin.split(/\s+/).map(Number);
    const s = (out.points[c] ??= []);
    if (s.length >= 400) continue;
    const { floor, on } = floorAt(p);
    const row = { gap: floor === null ? null : r1(p[2] - floor), on, ceil: r1(upTo(p)), wall: r1(wallAt(p)), inSolid: solidAt(p) };
    if (c === "light" || c === "light_spot") {
      const l = (e._light ?? "").split(/\s+/).map(Number);
      row.bright = l.length >= 4 ? l[3] : l.length === 1 && l[0] ? l[0] : null;
      row.styled = !!e.style || !!e.targetname;
    }
    if (/^monster_|^item_|^weapon_|^ammo_/.test(c)) {
      row.floorWall = r1(floor === null ? null : wallAt([p[0], p[1], floor + 16]));
    }
    s.push(row);
  }

  // ── wiring: who names whom, as motifs "the classes that target X -> X's class"
  const byName = new Map();
  for (const e of ents) if (e.targetname) (byName.get(e.targetname) ?? byName.set(e.targetname, []).get(e.targetname)).push(e);
  const motifs = {};
  for (const [name, targets] of byName) {
    const callers = ents.filter((e) => e.target === name || e.killtarget === name || e.master === name || (e.classname === "multi_manager" && e[name] !== undefined));
    if (!callers.length) continue;
    const callerSig = Object.entries(callers.reduce((a, e) => ((a[e.classname] = (a[e.classname] ?? 0) + 1), a), {}))
      .sort()
      .map(([k, v]) => (v > 1 ? `${k}*${v}` : k))
      .join("+");
    const targetSig = [...new Set(targets.map((e) => e.classname))].sort().join("+");
    const sig = `${callerSig} -> ${targetSig}`;
    motifs[sig] = (motifs[sig] ?? 0) + 1;
  }
  out.motifs = motifs;
  out.named = byName.size;
  return out;
}

function sum(dir) {
  const all = readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")));
  const L = [];
  const p = (s) => L.push(s);
  p(`maps: ${all.length}`);
  // space
  const sp = (f) => all.map(f).filter((v) => v !== null && v !== undefined);
  const row = (name, v) => p(`${name.padEnd(34)} median ${median(v)}  q1 ${q(v, 0.25)}  q3 ${q(v, 0.75)}  p10 ${q(v, 0.1)}  p90 ${q(v, 0.9)}  (n ${v.length})`);
  p("\n== space, a value a map");
  row("walked area (sq units)", sp((m) => m.space.area));
  row("footprint x", sp((m) => m.space.footprint?.[0]));
  row("footprint y", sp((m) => m.space.footprint?.[1]));
  row("footprint share with floor", sp((m) => m.space.share));
  row("width median", sp((m) => m.space.width?.median));
  row("width q1", sp((m) => m.space.width?.quartiles?.[0]));
  row("share of floor under 176 wide", sp((m) => m.space.width?.bands?.[0]?.share));
  row("headroom median", sp((m) => m.space.headroom?.median));
  row("headroom in corridors", sp((m) => m.space.headroom?.corridors?.median));
  row("headroom in rooms", sp((m) => m.space.headroom?.rooms?.median));
  row("sight median", sp((m) => m.space.sight?.median));
  row("floor range (highest - lowest)", sp((m) => (m.space.floors ? m.space.floors.highest - m.space.floors.lowest : null)));
  row("floors stacked at most", sp((m) => m.space.floors?.stacked?.most));
  row("openings found", sp((m) => m.space.openings?.count));
  const ow = all.flatMap((m) => m.space.openings?.widths ?? []);
  row("opening width (all maps)", ow);
  const rises = {};
  for (const m of all) for (const [k, v] of Object.entries(m.space.rises ?? {})) rises[k] = (rises[k] ?? 0) + v;
  p(`rises between cells of 16 (all maps): ${Object.entries(rises).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `${k}:${v}`).join(" ")}`);

  // brush entity classes
  p("\n== brush entities: maps using, count, share of all faces, smallest side / middle / longest (medians), top textures, render modes");
  const totalFaces = all.reduce((t, m) => t + m.worldFaces + Object.values(m.brush).reduce((u, s) => u + s.faces, 0), 0);
  const bc = {};
  for (const m of all)
    for (const [c, s] of Object.entries(m.brush)) {
      const t = (bc[c] ??= { maps: 0, count: 0, faces: 0, sizes: [], textures: {}, rendermodes: {}, keys: {} });
      t.maps++;
      t.count += s.count;
      t.faces += s.faces;
      t.sizes.push(...s.sizes);
      for (const [k, v] of Object.entries(s.textures)) t.textures[k] = (t.textures[k] ?? 0) + v;
      for (const [k, v] of Object.entries(s.rendermodes)) t.rendermodes[k] = (t.rendermodes[k] ?? 0) + v;
      for (const [k, v] of Object.entries(s.keys)) (t.keys[k] ??= []).push(...v);
    }
  for (const [c, t] of Object.entries(bc).sort((a, b) => b[1].count - a[1].count)) {
    const sorted = t.sizes.map((s) => [...s.slice(0, 2)].sort((a, b) => a - b).concat(s[2]));
    const thin = sorted.map((s) => Math.min(s[0], s[2])), hor = sorted.map((s) => s[1]), up = sorted.map((s) => s[2]);
    const tex = Object.entries(t.textures).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k}:${v}`).join(" ");
    p(`${c.padEnd(24)} maps ${String(t.maps).padStart(3)} n ${String(t.count).padStart(4)} faces ${(100 * t.faces / totalFaces).toFixed(1).padStart(4)}%  plan short ${median(sorted.map((s) => s[0]))} long ${median(hor)} high ${median(up)}  render ${JSON.stringify(t.rendermodes)}  ${tex}`);
    const keys = Object.entries(t.keys).filter(([k]) => !["targetname", "target"].includes(k)).map(([k, v]) => {
      const counts = v.reduce((a, x) => ((a[x] = (a[x] ?? 0) + 1), a), {});
      return `${k}=${Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([x, n]) => `${x}(${n})`).join(",")}`;
    });
    const named = (t.keys.targetname ?? []).length, targets = (t.keys.target ?? []).length;
    p(`${"".padEnd(24)} named ${named}/${t.count}  targets ${targets}/${t.count}  ${keys.join("  ")}`);
  }
  p(`world faces share: ${(100 * all.reduce((t, m) => t + m.worldFaces, 0) / totalFaces).toFixed(1)}%`);

  // point entities
  p("\n== point entities: n, gap over floor, standing on, ceiling over, nearest wall (medians, q1-q3)");
  const pc = {};
  for (const m of all) for (const [c, rows] of Object.entries(m.points)) (pc[c] ??= []).push(...rows);
  const fam = (c) => (/^monster_/.test(c) ? c : /^weapon_/.test(c) ? "weapon_*" : /^ammo_/.test(c) ? "ammo_*" : /^item_/.test(c) ? "item_*" : c);
  const fams = {};
  for (const [c, rows] of Object.entries(pc)) (fams[fam(c)] ??= []).push(...rows);
  for (const [c, rows] of Object.entries(fams).sort((a, b) => b[1].length - a[1].length)) {
    if (rows.length < 8) continue;
    const g = rows.map((r) => r.gap).filter((v) => v !== null), ce = rows.map((r) => r.ceil).filter((v) => v !== null), w = rows.map((r) => r.wall).filter((v) => v !== null);
    const on = rows.reduce((a, r) => ((a[r.on ?? "none"] = (a[r.on ?? "none"] ?? 0) + 1), a), {});
    const onTxt = Object.entries(on).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} ${Math.round((100 * v) / rows.length)}%`).join(", ");
    const solid = rows.filter((r) => r.inSolid).length;
    p(`${c.padEnd(26)} n ${String(rows.length).padStart(5)}  gap ${median(g)} (${q(g, 0.25)}-${q(g, 0.75)})  ceil ${median(ce)} (${q(ce, 0.25)}-${q(ce, 0.75)})  wall ${median(w)} (${q(w, 0.25)}-${q(w, 0.75)})  on ${onTxt}${solid ? `  in solid ${solid}` : ""}`);
    if (c === "light" || c === "light_spot") {
      const b = rows.map((r) => r.bright).filter((v) => v);
      p(`${"".padEnd(26)} brightness ${median(b)} (${q(b, 0.25)}-${q(b, 0.75)})  styled or switched ${rows.filter((r) => r.styled).length}  ceiling within 16: ${Math.round((100 * ce.filter((v) => v <= 16).length) / ce.length)}%  within 48: ${Math.round((100 * ce.filter((v) => v <= 48).length) / ce.length)}%`);
    }
    if (/item_|weapon_|ammo_|monster_/.test(c)) {
      const fw = rows.map((r) => r.floorWall).filter((v) => v !== null);
      p(`${"".padEnd(26)} gap under 2: ${Math.round((100 * g.filter((v) => v < 2).length) / g.length)}%  2-24: ${Math.round((100 * g.filter((v) => v >= 2 && v <= 24).length) / g.length)}%  over 24: ${Math.round((100 * g.filter((v) => v > 24).length) / g.length)}%  wall at foot ${median(fw)} (${q(fw, 0.25)}-${q(fw, 0.75)}), within 32: ${Math.round((100 * fw.filter((v) => v <= 32).length) / fw.length)}%`);
    }
  }
  const tl = all.map((m) => m.texlightFaces ?? 0), le = all.map((m) => m.classes.light ?? 0);
  p(`texture-light faces a map: median ${median(tl)} (q1 ${q(tl, 0.25)}, q3 ${q(tl, 0.75)}); light entities a map: median ${median(le)} (q1 ${q(le, 0.25)}, q3 ${q(le, 0.75)}); maps with no light entity ${le.filter((v) => !v).length}`);
  // per map counts per area
  p("\n== a map's entities per 10,000 square units of walked floor (median over maps)");
  for (const [name, test] of [["light", (c) => c === "light"], ["light_spot", (c) => c === "light_spot"], ["monster_*", (c) => /^monster_/.test(c)], ["item/ammo/weapon", (c) => /^(item_|ammo_|weapon_)/.test(c)], ["info_node", (c) => c === "info_node"], ["func_door*", (c) => /^func_door/.test(c)], ["trigger_*", (c) => /^trigger_/.test(c)], ["func_breakable", (c) => c === "func_breakable"], ["func_wall", (c) => c === "func_wall"], ["scripted_sequence", (c) => c === "scripted_sequence"]]) {
    const v = all.map((m) => (10000 * Object.entries(m.classes).filter(([c]) => test(c)).reduce((t, [, n]) => t + n, 0)) / (m.space.area || 1));
    p(`${name.padEnd(20)} ${median(v)?.toFixed(2)} (q1 ${q(v, 0.25)?.toFixed(2)}, q3 ${q(v, 0.75)?.toFixed(2)})`);
  }
  // motifs
  p("\n== wiring motifs (callers -> named), maps using and total, the commonest");
  const mo = {};
  for (const m of all) for (const [k, v] of Object.entries(m.motifs)) ((mo[k] ??= { maps: 0, n: 0 }).maps++, (mo[k].n += v));
  for (const [k, v] of Object.entries(mo).sort((a, b) => b[1].maps - a[1].maps || b[1].n - a[1].n).slice(0, 60)) p(`${String(v.maps).padStart(3)} maps ${String(v.n).padStart(4)}  ${k}`);
  return L.join("\n");
}

const args = process.argv.slice(2);
if (args[0] === "--sum") console.log(sum(args[1]));
else {
  const [folder, out, ...names] = args;
  mkdirSync(out, { recursive: true });
  const list = names.length ? names : readdirSync(folder).filter((f) => /^c\da\d.*\.bsp$/.test(f)).map((f) => f.slice(0, -4));
  for (const name of list) {
    const target = join(out, `${name}.json`);
    if (existsSync(target)) continue; // resumable
    const t = Date.now();
    try {
      writeFileSync(target, JSON.stringify(statsOf(join(folder, `${name}.bsp`))));
      console.log(`${name}: ${((Date.now() - t) / 1000).toFixed(1)} s`);
    } catch (err) {
      console.log(`${name}: FAILED ${err.message}`);
    }
  }
}
