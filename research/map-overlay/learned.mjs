// Learned matching against SIFT, and VGGT against structure from motion, on the same ground truth as valve.mjs and
// compiled-room.mjs: views drawn by drawMap at known cameras stand for screenshots (Valve's maps read-only, the
// kit's room compiled with SDHLT in halflife.wad's textures; pictures out of git).
//   SMAK_PHOTOGRAMMETRY=<cpu venv python> SMAK_LEARNED_MATCH=<learned venv python> \
//     node research/map-overlay/learned.mjs <valve folder> <SDHLT tools> <out> [map ...]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import * as smak from "../../src/index.mjs";
import { locateShot, structureOf, guessesFrom, shotsAgainst } from "../../src/maps/photo.mjs";
import { overlayOf } from "../../src/maps/overlay.mjs";
import { label } from "../../src/render.mjs";

const { maps, png } = smak;
const [valve, compilers, out, ...names] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const round = (v) => Math.round(v * 10) / 10;
const dist = (a, b) => Math.hypot(...a.map((v, k) => v - b[k]));
const yawOff = (a, b) => Math.abs(((((a - b) % 360) + 540) % 360) - 180);
const near = { dx: 34, dy: -34, dyaw: 12 };
const far = { dx: 106, dy: -106, dyaw: 40 };
const guessOf = (c, g) => ({ from: [c.from[0] + g.dx, c.from[1] + g.dy, c.from[2]], yaw: c.yaw + g.dyaw, pitch: 0, fov: 90 });
const within2 = (rows) => `${rows.filter((r) => r.off <= 2).length} of ${rows.length}`;

/** Each shot located by each matcher from a guess: { matcher: [{ off, yaw, by, inliers }] }. */
function locateAll(map, shots, cams, guess, options) {
  const out = {};
  for (const matcher of ["sift", "lightglue"]) {
    out[matcher] = shots.map((shot, n) => {
      const t = Date.now();
      const r = locateShot(map, shot, guessOf(cams[n], guess), { ...options, matcher });
      return { off: round(dist(r.camera.from, cams[n].from)), yaw: round(yawOff(r.camera.yaw, cams[n].yaw)), by: r.by, inliers: r.inliers, ms: Date.now() - t, camera: r.camera };
    });
  }
  return out;
}

/** VGGT's cameras as the start: shot 0 located by LightGlue from the near guess, the rest from VGGT's guesses. */
function vggtStart(map, shots, cams, options) {
  const structure = structureOf(shots, { method: "vggt" });
  if (!structure.ok) return { error: structure.error, structure };
  const anchor = locateShot(map, shots[0], guessOf(cams[0], near), { ...options, matcher: "lightglue" });
  const guesses = guessesFrom(structure, 0, anchor.camera);
  const rows = guesses.map((g) => {
    const n = g.picture;
    const r = n === 0 ? anchor : locateShot(map, shots[n], { ...g, fov: 90 }, { ...options, matcher: "lightglue" });
    return { shot: n, guessOff: round(dist(g.from, cams[n].from)), off: round(dist(r.camera.from, cams[n].from)), yaw: round(yawOff(r.camera.yaw, cams[n].yaw)), by: r.by, inliers: r.inliers, guess: { ...g, fov: 90 }, camera: r.camera };
  });
  return { rows, seconds: structure.seconds, peak: structure.peak };
}

/** Structure from motion and VGGT over the same overlapping shots: placed, eye heights, spacing error, planes. */
function structures(shots, cams) {
  const out = {};
  for (const method of ["sfm", "vggt"]) {
    const t = Date.now();
    let s;
    try {
      s = structureOf(shots, { method });
    } catch (error) {
      s = { ok: false, error: error.message.slice(0, 200) };
    }
    if (!s.ok) {
      out[method] = { error: s.error, ms: Date.now() - t };
      continue;
    }
    const found = s.cameras.map((c) => ({ ...c, truth: cams[c.picture] }));
    const pairs = [];
    for (let i = 0; i < found.length; i++) for (let j = i + 1; j < found.length; j++) pairs.push([dist(found[i].from, found[j].from), dist(found[i].truth.from, found[j].truth.from)]);
    const rel = pairs.map(([a, b]) => Math.abs(a - b) / Math.max(1, b)).sort((a, b) => a - b);
    const heights = found.map((c) => round(c.from[2]));
    out[method] = { placed: `${s.registered ?? found.length} of ${shots.length}`, points: s.points, heights: `${Math.min(...heights)} to ${Math.max(...heights)}`, spacing: `${round(100 * (rel[Math.floor(rel.length / 2)] ?? 0))}%`, planes: s.planes.length, upright: s.planes.filter((p) => p.axis !== "z").length, ms: Date.now() - t, seconds: s.seconds, peak: s.peak };
  }
  return out;
}

/**
 * Each shot's overlays side by side, from cameras the run already has (nothing located again): the true camera,
 * the start, and each method's found camera, how far off in each panel's corner. `panels`: [[title, camera]].
 */
function strip(file, map, shot, truth, panels) {
  const [w, h] = [320, 240];
  const out = { width: w * panels.length, height: h, rgba: new Uint8Array(w * panels.length * h * 4) };
  panels.forEach(([title, camera], k) => {
    const o = overlayOf(map, shot, camera, { width: w, height: h, offsets: false });
    for (let y = 0; y < h; y++) out.rgba.set(o.rgba.subarray(y * w * 4, (y + 1) * w * 4), (y * out.width + k * w) * 4);
    const off = dist(camera.from, truth.from);
    const words = `${title} ${off < 0.05 ? "" : `${round(off)} OFF`}`.trim();
    label(out, words, k * w + 4, 4, 2);
  });
  writeFileSync(file, png(out.width, out.height, out.rgba));
}

const summary = {};
for (const name of names.length ? names : ["c1a0", "c2a5"]) {
  const bsp = maps.readBsp(readFileSync(join(valve, "maps", `${name}.bsp`)));
  const views = maps.viewsOf(bsp, { count: 6, width: 320, height: 240, folders: [valve], aim: true });
  const cams = (views.facts.views ?? views.facts.cameras ?? []).slice(0, 6).map((c) => ({ from: c.from, yaw: c.yaw, pitch: c.pitch ?? 0, fov: 90 }));
  const options = { folders: [valve] };
  const shots = cams.map((c, n) => {
    const shot = maps.drawMap(bsp, { ...c, width: 640, height: 480, folders: [valve], entities: "none", labels: false });
    writeFileSync(join(out, `${name}-shot${n}.png`), png(shot.width, shot.height, shot.rgba));
    return shot;
  });
  // PARTS (comma list): locate, vggtstart, structure, room; all unless told
  const parts = (process.env.PARTS ?? "locate,vggtstart,structure,room").split(",");
  const result = {};
  if (parts.includes("locate")) Object.assign(result, { near: locateAll(bsp, shots, cams, near, options), far: locateAll(bsp, shots, cams, far, options) });
  // six overlapping shots of one room, about the second camera: VGGT's start wants shots that overlap (from the
  // six spread views of viewsOf, its frame meant nothing: guesses 1000 units off)
  const base = cams[1];
  const around = [[0, 0, 0], [40, 0, -10], [-40, 0, 10], [0, 40, 15], [0, -40, -15], [30, 30, 5]].map(([dx, dy, dyaw]) => ({ from: [base.from[0] + dx, base.from[1] + dy, base.from[2]], yaw: base.yaw + dyaw, pitch: base.pitch ?? 0, fov: 90 }));
  const roomShots = around.map((c) => maps.drawMap(bsp, { ...c, width: 640, height: 480, folders: [valve], entities: "none", labels: false }));
  if (parts.includes("vggtstart")) result.vggtStart = vggtStart(bsp, roomShots, around, options);
  if (parts.includes("structure")) result.structure = structures(roomShots, around);
  // what each method found, drawn: true camera, the near start, SIFT's and LightGlue's fits; VGGT's start and fit
  if (result.near)
    shots.forEach((shot, n) => strip(join(out, `${name}-found${n}.png`), bsp, shot, cams[n], [["TRUE", cams[n]], ["START", guessOf(cams[n], near)], ["SIFT", result.near.sift[n].camera], ["LIGHTGLUE", result.near.lightglue[n].camera]]));
  if (result.vggtStart?.rows)
    for (const row of result.vggtStart.rows) strip(join(out, `${name}-vggt${row.shot}.png`), bsp, roomShots[row.shot], around[row.shot], [["TRUE", around[row.shot]], ["VGGT START", row.guess], ["VGGT+PNP", row.camera]]);
  summary[name] = result;
  console.log(`${name}: ${JSON.stringify(result)}`);
}

// the kit's room in one repeating texture, compiled, a wall 32 off: repeated texture and four shots of one wall
if (compilers && (process.env.PARTS ?? "room").split(",").includes("room")) {
  const wad = join(valve, "halflife.wad");
  const textures = maps.readWad(readFileSync(wad)).textures;
  const room = (north) => ({
    worldspawn: { wad: "halflife.wad" },
    brushes: [maps.carve([{ min: [0, 0, 0], max: [512, north, 192] }, { min: [512, 160, 0], max: [576, 224, 112] }, { min: [576, 96, 0], max: [800, 288, 160] }], 16, { wall: process.env.WALLS ?? "C1A0_LABW1", floor: "C1A0_LABFLR", ceiling: "C1A0_C1" })],
    entities: [maps.playerStart([256, 192, 36], 0), maps.pointEntity("light", [256, 192, 170], { light: "255 240 220 300" }), maps.pointEntity("light", [100, 100, 150], { light: "255 255 255 200" }), maps.pointEntity("light", [680, 190, 140], { light: "200 220 255 200" })],
  });
  const built = {};
  for (const [name, north] of [["truth", 384], ["wrong", 352]]) {
    const file = join(out, `room-${name}.map`);
    writeFileSync(file, maps.writeMap(room(north)));
    maps.compileMap(file, { wads: [wad], compilers: maps.findCompilers({ folder: compilers }), fast: true, out: join(out, `room-${name}.bsp`) });
    built[name] = maps.readBsp(readFileSync(join(out, `room-${name}.bsp`)));
  }
  const cams = [[400, 150, 64, 170], [380, 260, 64, 195], [300, 100, 64, 160], [420, 200, 64, 180]].map(([x, y, z, yaw]) => ({ from: [x, y, z], yaw, pitch: -3, fov: 90 }));
  const shots = cams.map((c) => maps.drawMap(built.truth, { ...c, width: 640, height: 480, textures, light: false, entities: "none", labels: false }));
  const options = { textures, light: false };
  const room1 = { near: locateAll(built.truth, shots, cams, near, options), far: locateAll(built.truth, shots, cams, far, options) };
  for (const matcher of ["sift", "lightglue"]) {
    const r = shotsAgainst(built.wrong, shots.map((picture, n) => ({ picture, guess: guessOf(cams[n], near) })), { ...options, matcher });
    room1[`wall-${matcher}`] = r.planes.slice(0, 3).map((p) => [p.axis, p.move, `${p.shots} of ${p.seen}`]);
  }
  room1.structure = structures(shots, cams);
  summary.room = room1;
  console.log(`room (one repeating texture, ${process.env.WALLS ?? "C1A0_LABW1"}): ${JSON.stringify(room1)}`);
}

// the table for research/map-overlay.md
for (const [name, r] of Object.entries(summary)) {
  console.log(`\n${name}`);
  for (const g of ["near", "far"]) for (const m of ["sift", "lightglue"]) if (r[g]) console.log(`  ${g.padEnd(4)} ${m.padEnd(9)} within 2 units ${within2(r[g][m])}; offs ${r[g][m].map((x) => x.off).join(", ")}; inliers ${r[g][m].map((x) => x.inliers).join(", ")}`);
  if (r.vggtStart?.rows) console.log(`  vggt start + lightglue PnP: within 2 units ${within2(r.vggtStart.rows)}; guesses off ${r.vggtStart.rows.map((x) => x.guessOff).join(", ")}; found off ${r.vggtStart.rows.map((x) => x.off).join(", ")}; VGGT ${r.vggtStart.seconds} s, peak ${r.vggtStart.peak} GB`);
  else if (r.vggtStart) console.log(`  vggt start: ${r.vggtStart.error}`);
  for (const [m, s] of Object.entries(r.structure ?? {})) console.log(`  ${m}: ${JSON.stringify(s)}`);
  for (const m of ["sift", "lightglue"]) if (r[`wall-${m}`]) console.log(`  wall 32 off, by ${m}: ${JSON.stringify(r[`wall-${m}`])}`);
}
