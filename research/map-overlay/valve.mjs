// The overlay, the camera's recovery and structure from motion measured on Valve's own maps: views drawn by
// drawMap (textured, lit) at known cameras stand for screenshots. Read-only; the pictures go to <out>, out of git.
//   SMAK_PHOTOGRAMMETRY=<venv python> node research/map-overlay/valve.mjs <valve folder> <out> [map ...]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import * as smak from "../../src/index.mjs";
import { geometryOf, overlayOf, fitCamera } from "../../src/maps/overlay.mjs";
import { locateShot, structureOf } from "../../src/maps/photo.mjs";

const { maps, png } = smak;
const [valve, out, ...names] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const round = (v) => Math.round(v * 10) / 10;
const dist = (a, b) => Math.hypot(...a.map((v, k) => v - b[k]));
const yawOff = (a, b) => Math.abs(((((a - b) % 360) + 540) % 360) - 180);

for (const name of names.length ? names : ["c1a0"]) {
  const bsp = maps.readBsp(readFileSync(join(valve, "maps", `${name}.bsp`)));
  const views = maps.viewsOf(bsp, { count: 6, width: 320, height: 240, folders: [valve], aim: true });
  const cams = (views.facts.views ?? views.facts.cameras ?? []).slice(0, 6);
  console.log(`${name}: ${cams.length} cameras from viewsOf`);
  const geometry = geometryOf(bsp);
  const rows = [];
  const shots = [];
  for (const [n, c] of cams.entries()) {
    const cam = { from: c.from, yaw: c.yaw, pitch: c.pitch ?? 0, fov: 90 };
    const shot = maps.drawMap(bsp, { ...cam, width: 640, height: 480, folders: [valve], entities: "none", labels: false });
    shots.push(shot);
    writeFileSync(join(out, `${name}-shot${n}.png`), png(shot.width, shot.height, shot.rgba));
    const truth = overlayOf(geometry, shot, cam, { width: 320, height: 240, offsets: false });
    writeFileSync(join(out, `${name}-overlay${n}.png`), png(truth.width, truth.height, truth.rgba));
    // a guess 48 units off sideways and 12 degrees off
    const guess = { from: [cam.from[0] + 34, cam.from[1] - 34, cam.from[2]], yaw: cam.yaw + 12, pitch: 0, fov: 90 };
    let t = Date.now();
    const byEdges = fitCamera(geometry, shot, guess);
    const edgesMs = Date.now() - t;
    t = Date.now();
    const located = locateShot(bsp, shot, guess, { folders: [valve] });
    const pnpOnly = located.pnpCamera ? { off: round(dist(located.pnpCamera.from, cam.from)), yaw: round(yawOff(located.pnpCamera.yaw, cam.yaw)) } : null;
    const locMs = Date.now() - t;
    rows.push({ shot: n, trueScore: truth.score, edges: { off: round(dist(byEdges.camera.from, cam.from)), yaw: round(yawOff(byEdges.camera.yaw, cam.yaw)), ms: edgesMs }, located: { by: located.by, inliers: located.inliers, off: round(dist(located.camera.from, cam.from)), yaw: round(yawOff(located.camera.yaw, cam.yaw)), ms: locMs, notes: located.notes, pnpOnly } });
    console.log(JSON.stringify(rows.at(-1)));
  }
  // a wall built 32 units off: the largest upright plane the first shot sees, its faces moved along their normal
  const first = { from: cams[0].from, yaw: cams[0].yaw, pitch: cams[0].pitch ?? 0, fov: 90 };
  const seenPlanes = new Map();
  const ov = overlayOf(geometry, shots[0], first, { width: 320, height: 240 });
  const pick = ov.faces.find((f) => Math.abs(f.normal[2]) < 0.1 && f.seen > 40);
  if (pick) {
    const plane = geometry.surfaces[pick.face].plane;
    const moved = { surfaces: geometry.surfaces.map((s) => (s.plane === plane ? { ...s, polygon: s.polygon.map((p) => p.map((v, a) => v + s.normal[a] * 32)), dist: s.dist + 32, plane: `${plane}+32` } : s)) };
    const ovm = overlayOf(moved, shots[0], first, { width: 320, height: 240 });
    writeFileSync(join(out, `${name}-overlay-moved.png`), png(ovm.width, ovm.height, ovm.rgba));
    const told = ovm.faces.find((f) => moved.surfaces[f.face].plane === `${plane}+32`);
    console.log(`  faces told, as built: ${JSON.stringify(ov.faces.slice(0, 5).map((f) => [f.axis, f.move, f.better]))}; moved: ${JSON.stringify(ovm.faces.slice(0, 5).map((f) => [f.axis, f.move, f.better, moved.surfaces[f.face].plane.endsWith("+32")]))}`);
    console.log(`a wall (${pick.axis}, ${pick.texture}) built 32 out: ${told ? `told, rank ${ovm.faces.indexOf(told) + 1} of ${ovm.faces.length}, move ${told.move} (should be -32)` : "not among the faces told"}; first three told: ${JSON.stringify(ovm.faces.slice(0, 3).map((f) => [f.axis, f.texture, f.move]))}`);
    void seenPlanes;
  }
  // structure from motion over six shots of ONE room: the second camera, stepped about and turned a little
  if (process.env.SMAK_PHOTOGRAMMETRY) {
    const base = cams[1];
    const around = [[0, 0, 0], [40, 0, -10], [-40, 0, 10], [0, 40, 15], [0, -40, -15], [30, 30, 5]].map(([dx, dy, dyaw]) => ({ from: [base.from[0] + dx, base.from[1] + dy, base.from[2]], yaw: base.yaw + dyaw, pitch: base.pitch ?? 0 }));
    const roomShots = around.map((c) => maps.drawMap(bsp, { ...c, fov: 90, width: 640, height: 480, folders: [valve], entities: "none", labels: false }));
    roomShots.forEach((p, n) => writeFileSync(join(out, `${name}-room${n}.png`), png(p.width, p.height, p.rgba)));
    cams.length = 0;
    cams.push(...around);
    const t = Date.now();
    const sfm = structureOf(roomShots);
    console.log(`structure from motion over ${shots.length} shots: ${sfm.ok ? `${sfm.registered} of ${sfm.of} registered, ${sfm.points} points, ${sfm.planes.length} planes (${sfm.planes.filter((p) => p.axis !== "z").length} upright)` : sfm.error} in ${Date.now() - t} ms`);
    if (sfm.ok) {
      // the cameras against the truth, after the best turn about z and shift (the scene's own frame is arbitrary
      // in yaw and place; its scale is the eye's): pairwise distances compared
      const found = sfm.cameras.map((c) => ({ ...c, truth: cams[c.picture] }));
      const pairs = [];
      for (let i = 0; i < found.length; i++) for (let j = i + 1; j < found.length; j++) pairs.push([dist(found[i].from, found[j].from), dist(found[i].truth.from, found[j].truth.from)]);
      const rel = pairs.map(([a, b]) => Math.abs(a - b) / Math.max(1, b));
      console.log(`  camera spacing against the truth: median off ${round(100 * [...rel].sort((a, b) => a - b)[Math.floor(rel.length / 2)] || 0)}% over ${pairs.length} pairs; heights ${JSON.stringify(found.map((c) => round(c.from[2])))} (true eye 64 over its floor)`);
    }
  }
}
