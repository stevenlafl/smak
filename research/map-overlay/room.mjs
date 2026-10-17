// The overlay, the camera fit and the face offsets on the kit's own room: a carved room drawn by drawSource from a
// known camera stands for the screenshot; the camera is searched from a nudged guess, and a copy of the room with
// its west wall built 32 units off is laid over the same shot. node research/map-overlay/room.mjs <out folder>
import { writeFileSync, mkdirSync } from "node:fs";
import * as smak from "../../src/index.mjs";
import { overlayOf, fitCamera } from "../../src/maps/overlay.mjs";

const { maps, png } = smak;
const out = process.argv[2] ?? "research/out/map-overlay";
mkdirSync(out, { recursive: true });
export const room = (west = 0) => ({
  worldspawn: {},
  brushes: [maps.carve([{ min: [west, 0, 0], max: [512, 384, 192] }, { min: [512, 160, 0], max: [576, 224, 112] }, { min: [576, 96, 0], max: [800, 288, 160] }], 16, { wall: "BRICK", floor: "FLOOR", ceiling: "CEIL" })],
  entities: [maps.playerStart([256, 192, 36], 0)],
});
const truth = room(0);
const moved = room(32);
const cam = { from: [400, 150, 64], yaw: 165, pitch: -5, fov: 90 };
const shot = maps.drawSource(truth, { ...cam, width: 640, height: 480, entities: "none", labels: false });
writeFileSync(`${out}/shot.png`, png(shot.width, shot.height, shot.rgba));
let t = Date.now();
const o = overlayOf(truth, shot, cam, { width: 320, height: 240 });
console.log("true camera on the true room:", o.score, "px", o.toPicture, o.fromPicture, `${Date.now() - t} ms`);
writeFileSync(`${out}/overlay-true.png`, png(o.width, o.height, o.rgba));
const guess = { from: [430, 120, 70], yaw: 177, pitch: 0 };
t = Date.now();
const f = fitCamera(truth, shot, guess);
console.log("fit from a nudged guess:", JSON.stringify(f), `${Date.now() - t} ms`);
const om = overlayOf(moved, shot, cam, { width: 320, height: 240 });
console.log("the room with its west wall 32 off, at the true camera:", om.score, JSON.stringify(om.faces.slice(0, 4)));
writeFileSync(`${out}/overlay-moved.png`, png(om.width, om.height, om.rgba));
