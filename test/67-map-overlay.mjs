// A map against pictures of it: its edges drawn over a picture from a camera and scored, a camera fitted by them,
// a wall built off told by them, and the photogrammetry bridge (photo.mjs) spoken to through a stand-in for its
// venv's python. Ground truth is the kit's own: a carved room drawn by drawSource, and tworooms.bsp in its own .wad.
import { readFileSync, writeFileSync, chmodSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import * as smak from "../src/index.mjs";
import { geometryOf, rasterOf, overlayOf, fitCamera } from "../src/maps/overlay.mjs";
import { locateShot, shotsAgainst, structureOf, guessesFrom } from "../src/maps/photo.mjs";
import { test, sure, tmp, HERE, runSmak } from "./helper.mjs";

const { maps, png } = smak;
const FIXTURES = join(HERE, "fixtures");
const room = (west = 0) => ({
  worldspawn: {},
  brushes: [maps.carve([{ min: [west, 0, 0], max: [512, 384, 192] }, { min: [512, 160, 0], max: [576, 224, 112] }, { min: [576, 96, 0], max: [800, 288, 160] }], 16, { wall: "BRICK", floor: "FLOOR", ceiling: "CEIL" })],
  entities: [maps.playerStart([256, 192, 36], 0)],
});
const camera = { from: [400, 150, 64], yaw: 165, pitch: -5, fov: 90 };
const shot = maps.drawSource(room(0), { ...camera, width: 640, height: 480, entities: "none", labels: false });
const dist = (a, b) => Math.hypot(...a.map((v, k) => v - b[k]));

test("map overlay: a room's edges laid over a picture of it from its camera, and the camera found from a guess by them", () => {
  const geometry = geometryOf(room(0));
  sure(geometry.surfaces.length > 20 && geometry.surfaces.every((s) => s.plane && s.polygon.length >= 3), `${geometry.surfaces.length} faces`);
  const raster = rasterOf(geometry, camera, 160, 120);
  const seen = raster.face.reduce((n, f) => n + (f >= 0 ? 1 : 0), 0);
  sure(seen === 160 * 120, `inside a closed room every pixel shows a face: ${seen}`);
  // a pixel's point lies on its face's plane
  const k = 60 * 160 + 80;
  const s = geometry.surfaces[raster.face[k]];
  const p = raster.point(k);
  sure(Math.abs(s.normal[0] * p[0] + s.normal[1] * p[1] + s.normal[2] * p[2] - s.dist) < 0.5, `the middle pixel's point on its plane: ${p}`);
  const o = overlayOf(room(0), shot, camera, { width: 320, height: 240, offsets: false });
  sure(o.score < 1.5 && o.width === 320, `at the true camera the edges lie on the picture's: ${o.score}`);
  const off = overlayOf(room(0), shot, { ...camera, from: [430, 120, 70], yaw: 177 }, { width: 320, height: 240, offsets: false });
  sure(off.score > o.score + 1, `a camera 40 off scores worse: ${off.score} against ${o.score}`);
  const fitted = fitCamera(room(0), shot, { from: [430, 120, 70], yaw: 177 });
  sure(dist(fitted.camera.from, camera.from) < 40 && Math.abs(fitted.camera.yaw - camera.yaw) < 8, `found within 40 units and 8 degrees: ${JSON.stringify(fitted.camera)}`);
  sure(fitted.score < off.score, `and scores better than the guess: ${fitted.score}`);
});

test("map overlay: green on the picture's lines, red off a line that is there, amber where no line is near", () => {
  const count = (o) => {
    const n = { green: 0, red: 0, amber: 0 };
    for (let k = 0; k < o.rgba.length; k += 4) {
      const [r, g, b] = [o.rgba[k], o.rgba[k + 1], o.rgba[k + 2]];
      if (r === 60 && g === 255 && b === 60) n.green++;
      else if (r === 255 && g === 50 && b === 40) n.red++;
      else if (r === 235 && g === 180 && b === 40) n.amber++;
    }
    return n;
  };
  const right = count(overlayOf(room(0), shot, camera, { width: 320, height: 240, offsets: false }));
  sure(right.green > 4 * right.red && right.green > right.amber, `at the true camera mostly green: ${JSON.stringify(right)}`);
  const far = count(overlayOf(room(0), shot, { ...camera, from: [250, 300, 64], yaw: 120 }, { width: 320, height: 240, offsets: false }));
  sure(far.red + far.amber > far.green && far.amber > 0, `far off, red and amber: ${JSON.stringify(far)}`);
});

test("map overlay: a wall built 32 units off is told by the edges, the most off of the faces, and by about how much", () => {
  const o = overlayOf(room(32), shot, camera, { width: 320, height: 240 });
  const first = o.faces[0];
  sure(first && first.axis === "+x" && first.move <= -24 && first.move >= -44, `the west wall (+x), about -32: ${JSON.stringify(o.faces.slice(0, 3))}`);
  // the room as it is says no face is that far off
  const right = overlayOf(room(0), shot, camera, { width: 320, height: 240 });
  sure(!right.faces.some((f) => f.axis === "+x" && Math.abs(f.move) >= 24), JSON.stringify(right.faces.slice(0, 3)));
});

test("map overlay: a compiled map's faces, and its edges over a view of it in its own textures", () => {
  const bsp = maps.readBsp(readFileSync(join(FIXTURES, "tworooms.bsp")));
  const textures = maps.readWad(readFileSync(join(FIXTURES, "tworooms.wad"))).textures;
  const geometry = geometryOf(bsp);
  sure(geometry.surfaces.length > 10, `${geometry.surfaces.length} faces`);
  const at = maps.viewFrom(bsp, "info_player_start");
  const cam = { from: at.from, yaw: at.yaw, pitch: 0, fov: 90 };
  const view = maps.drawMap(bsp, { ...cam, width: 320, height: 240, textures, entities: "none", labels: false });
  // a textured view has lines of its own beside the room's, so the edges tell the true camera from others only
  // narrowly here (a step of 45 units costs a third of a pixel): photo.mjs leads with features on such a view
  const o = overlayOf(bsp, view, cam, { offsets: false });
  const turned = overlayOf(bsp, view, { ...cam, yaw: cam.yaw + 10 }, { offsets: false });
  const stepped = overlayOf(bsp, view, { ...cam, from: [cam.from[0] + 32, cam.from[1] - 32, cam.from[2]] }, { offsets: false });
  sure(o.score < turned.score && o.score < stepped.score, `the edges of tworooms on its own view: ${o.score}, against ${turned.score} turned 10 degrees and ${stepped.score} stepped 45 units`);
});

// a stand-in for the photogrammetry venv's python: it answers each job as generators/photogrammetry.py would
const standIn = join(tmp, "photo-standin", "python");
mkdirSync(join(tmp, "photo-standin"), { recursive: true });
writeFileSync(
  standIn,
  `#!${process.execPath}
// called as <python> photogrammetry.py <step> <job.json>: the runner's path, then the step and the job
const job = JSON.parse(require("node:fs").readFileSync(process.argv[4], "utf8"));
const step = process.argv[3];
if (step === "locate") console.log(JSON.stringify({ ok: true, from: [400, 150, 64], yaw: 165, pitch: -5, roll: 0, matches: 400, inliers: 380, error: 0.4, pairs: [], without: {}, sawPlanes: Boolean(job.planes) }));
else console.log(JSON.stringify({ ok: true, registered: job.pictures.length, of: job.pictures.length, points: 500, cameras: job.pictures.map((p, n) => ({ picture: p, from: [n * 40, 0, 64], yaw: 0, pitch: 0 })), planes: [{ axis: "x", at: 0, inliers: 200, extent: [[0, 384], [0, 192]] }] }));
`,
);
chmodSync(standIn, 0o755);

test("photogrammetry bridge: a shot located by the venv's PnP is kept as it is; shot by shot; structure from motion", () => {
  const located = locateShot(room(0), shot, { from: [430, 120, 70], yaw: 177 }, { python: standIn });
  sure(located.by === "pnp" && located.inliers === 380 && dist(located.camera.from, [400, 150, 64]) < 1e-6, JSON.stringify(located));
  const edgesOnly = locateShot(room(0), shot, { from: [430, 120, 70], yaw: 177 }, { python: null });
  sure(edgesOnly.by === "edges" && edgesOnly.notes.some((n) => /SMAK_PHOTOGRAMMETRY/.test(n)), JSON.stringify(edgesOnly.notes));
  const r = shotsAgainst(room(0), [{ picture: shot, guess: { from: [430, 120, 70], yaw: 177 } }], { python: standIn });
  sure(r.shots.length === 1 && r.shots[0].by === "pnp" && r.shots[0].overlay.rgba.length > 0 && Array.isArray(r.planes), JSON.stringify(r.shots[0].camera));
  const sfm = structureOf([shot, shot], { python: standIn });
  sure(sfm.ok && sfm.registered === 2 && sfm.cameras[1].picture === 1 && sfm.planes[0].axis === "x", JSON.stringify(sfm).slice(0, 200));
  let said = "";
  try {
    structureOf([shot], { python: null });
  } catch (error) {
    said = error.message;
  }
  sure(/needs the photogrammetry venv/.test(said), said);
});

// a stand-in for the learned-match venv's python: it writes down each step and matcher it was asked, and answers
const learned = join(tmp, "photo-standin", "learned");
const asked = join(tmp, "photo-standin", "asked.txt");
writeFileSync(
  learned,
  `#!${process.execPath}
const fs = require("node:fs");
const job = JSON.parse(fs.readFileSync(process.argv[4], "utf8"));
const step = process.argv[3];
fs.appendFileSync(${JSON.stringify(asked)}, step + " " + (job.matcher ?? "-") + "\\n");
if (step === "locate") console.log(JSON.stringify({ ok: true, from: [400, 150, 64], yaw: 165, pitch: -5, roll: 0, matches: 600, inliers: 520, error: 0.3, pairs: [], without: {} }));
else console.log(JSON.stringify({ ok: true, registered: job.pictures.length, of: job.pictures.length, points: 90000, seconds: 0.4, peak: 3.1, cameras: job.pictures.map((p, n) => ({ picture: p, from: [n * 40, n * 10, 64], yaw: 30 + n * 5, pitch: 0 })), planes: [] }));
`,
);
chmodSync(learned, 0o755);

test("learned matching: LightGlue and VGGT run in the learned venv; VGGT's cameras turned into the map's by one anchor", () => {
  writeFileSync(asked, "");
  const located = locateShot(room(0), shot, { from: [430, 120, 70], yaw: 177 }, { python: standIn, learnedPython: learned, matcher: "lightglue" });
  sure(located.by === "pnp" && located.inliers === 520, JSON.stringify(located));
  const vggt = structureOf([shot, shot, shot], { python: standIn, learnedPython: learned, method: "vggt" });
  sure(vggt.ok && vggt.method === "vggt" && vggt.peak === 3.1 && vggt.cameras[2].picture === 2, JSON.stringify(vggt).slice(0, 200));
  const lines = readFileSync(asked, "utf8").trim().split("\n");
  sure(lines.includes("locate lightglue") && lines.includes("vggt -") && !lines.some((l) => /sfm/.test(l)), `the learned venv was asked: ${lines.join(" | ")}`);
  // the structure's frame is the map's turned and shifted: shot 0 is at [0,0,64] yaw 30 in it, and at [500,200,64]
  // yaw 120 in the map: shot 1, 40 along x and 10 along y of the structure, is turned 90 degrees with it
  const guesses = guessesFrom(vggt, 0, { from: [500, 200, 64], yaw: 120 });
  sure(dist(guesses[0].from, [500, 200, 64]) < 1e-9 && Math.abs(guesses[0].yaw - 120) < 1e-9, JSON.stringify(guesses[0]));
  sure(dist(guesses[1].from, [490, 240, 64]) < 1e-9 && Math.abs(guesses[1].yaw - 125) < 1e-9, `turned and shifted: ${JSON.stringify(guesses[1])}`);
  const refused = (run) => {
    try {
      run();
    } catch (error) {
      return error.message;
    }
    return "";
  };
  sure(/matcher: sift or lightglue/.test(refused(() => locateShot(room(0), shot, { from: [430, 120, 70], yaw: 177 }, { matcher: "orb" }))), "an unknown matcher refused");
  sure(/learned-match venv/.test(refused(() => locateShot(room(0), shot, { from: [430, 120, 70], yaw: 177 }, { python: standIn, learnedPython: null, matcher: "lightglue" }))), "lightglue without its venv refused");
  sure(/method: sfm or vggt/.test(refused(() => structureOf([shot], { method: "nerf" }))), "an unknown method refused");
});

test("map-overlay: the command draws the edges over the picture and says how far apart", () => {
  const folder = join(tmp, "map-overlay");
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, "room.map"), maps.writeMap(room(0)));
  writeFileSync(join(folder, "shot.png"), png(shot.width, shot.height, shot.rgba));
  const said = runSmak("map-overlay", join(folder, "room.map"), join(folder, "shot.png"), "--from", "400,150,64", "--yaw", "165", "--pitch", "-5", "-o", join(folder, "over.png"));
  sure(/^edges: [\d.]+ pixels apart/m.test(said) && /over\.png {2}640x480 {2}the map's edges over the picture/.test(said), said);
});
