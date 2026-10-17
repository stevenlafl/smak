// One shot of the compiled-room test, the photogrammetry runner's leave-one-plane-out answer printed whole.
//   SMAK_PHOTOGRAMMETRY=<venv python> node research/map-overlay/debug-leaveout.mjs <valve> <room folder of compiled-room.mjs>
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import * as smak from "../../src/index.mjs";
import { geometryOf, rasterOf } from "../../src/maps/overlay.mjs";

const { maps, png } = smak;
const [valve, room] = process.argv.slice(2);
const textures = maps.readWad(readFileSync(join(valve, "halflife.wad"))).textures;
const truth = maps.readBsp(readFileSync(join(room, "truth.bsp")));
const wrong = maps.readBsp(readFileSync(join(room, "wrong.bsp")));
const cam = { from: [400, 150, 64], yaw: 170, pitch: -3, fov: 90 };
const picture = maps.drawMap(truth, { ...cam, width: 640, height: 480, textures, light: false, entities: "none", labels: false });
const geometry = geometryOf(wrong);
const folder = mkdtempSync(join(tmpdir(), "smak-dbg-"));
const [width, height] = [640, 480];
const render = maps.drawMap(wrong, { ...cam, width, height, textures, light: false, entities: "none", labels: false });
writeFileSync(join(folder, "picture.png"), png(width, height, picture.rgba));
writeFileSync(join(folder, "render.png"), png(width, height, render.rgba));
const raster = rasterOf(geometry, cam, width, height);
const points = new Float32Array(width * height * 3).fill(NaN);
for (let k = 0; k < width * height; k++) if (raster.face[k] >= 0) points.set(raster.point(k), k * 3);
writeFileSync(join(folder, "points.bin"), Buffer.from(points.buffer));
const keys = [...new Set(geometry.surfaces.map((s) => s.plane))];
const labels = new Int32Array(width * height).fill(-1);
for (let k = 0; k < width * height; k++) if (raster.face[k] >= 0) labels[k] = keys.indexOf(geometry.surfaces[raster.face[k]].plane);
writeFileSync(join(folder, "planes.bin"), Buffer.from(labels.buffer));
writeFileSync(join(folder, "job.json"), JSON.stringify({ picture: join(folder, "picture.png"), render: join(folder, "render.png"), points: join(folder, "points.bin"), planes: join(folder, "planes.bin"), width, height, fov: 90 }));
const run = spawnSync(process.env.SMAK_PHOTOGRAMMETRY, ["generators/photogrammetry.py", "locate", join(folder, "job.json")], { encoding: "utf8", maxBuffer: 1 << 26 });
const answer = JSON.parse(run.stdout.trim().split("\n").at(-1));
console.log("all:", answer.from, answer.yaw, answer.inliers, "of", answer.matches);
for (const [n, w] of Object.entries(answer.without ?? {})) console.log(`without ${keys[Number(n)]}: from ${w.from} yaw ${w.yaw} inliers ${w.inliers} of ${w.of}, left ${w.left}, error ${w.error}`);
if (run.stderr) console.log(run.stderr.slice(-400));
