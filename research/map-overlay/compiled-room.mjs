// A wall built off, found by photogrammetry: a room of the kit's, textured from halflife.wad and lit, compiled
// twice with SDHLT (as it is, and with one wall 32 units off); shots of the true one stand for screenshots, and
// the wrong build is located against them shot by shot (photo.mjs, shotsAgainst). The compiled maps and pictures
// go to <out>, out of git (they wear the game's textures).
//   SMAK_PHOTOGRAMMETRY=<venv python> node research/map-overlay/compiled-room.mjs <valve folder> <SDHLT tools> <out>
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as smak from "../../src/index.mjs";
import { shotsAgainst, structureOf } from "../../src/maps/photo.mjs";

const { maps, png } = smak;
const [valve, compilers, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const wad = join(valve, "halflife.wad");
const textures = maps.readWad(readFileSync(wad)).textures;
// `west`: the west wall's x; `north`: the north wall's y. Moving the west wall slides the textures of the
// ceiling and the side walls with it (they are laid from the brushes' edges), so from shots facing west a west wall
// 32 off is the true room seen from 32 further east: no picture tells them apart. The north wall, moved in y, keeps
// its own texture's place (its axes are x and z): that is the fair test.
const room = (west, north = 384) => ({
  worldspawn: { wad: "halflife.wad" },
  brushes: [maps.carve([{ min: [west, 0, 0], max: [512, north, 192] }, { min: [512, 160, 0], max: [576, 224, 112] }, { min: [576, 96, 0], max: [800, 288, 160] }], 16, { wall: process.env.WALLS ?? "C1A0_LABW1", floor: "C1A0_LABFLR", ceiling: "C1A0_C1" })],
  entities: [maps.playerStart([256, 192, 36], 0), maps.pointEntity("light", [256, 192, 170], { light: "255 240 220 300" }), maps.pointEntity("light", [100, 100, 150], { light: "255 255 255 200" }), maps.pointEntity("light", [680, 190, 140], { light: "200 220 255 200" })],
});
const built = {};
for (const [name, west, north] of [["truth", 0, 384], ["wrong", 0, 352]]) {
  const file = join(out, `${name}.map`);
  writeFileSync(file, maps.writeMap(room(west, north)));
  const r = maps.compileMap(file, { wads: [wad], compilers: maps.findCompilers({ folder: compilers }), fast: true, out: join(out, `${name}.bsp`) });
  if (!r.ok && !r.bsp) throw new Error(`${name}: ${JSON.stringify(r.errors ?? r).slice(0, 400)}`);
  built[name] = maps.readBsp(readFileSync(join(out, `${name}.bsp`)));
}
// shots of the truth looking at the west wall from about the room, each with a guess a little off
const cams = [[400, 150, 64, 170], [380, 260, 64, 195], [300, 100, 64, 160], [420, 200, 64, 180]].map(([x, y, z, yaw]) => ({ from: [x, y, z], yaw, pitch: -3, fov: 90 }));
const shots = cams.map((c, n) => {
  const picture = maps.drawMap(built.truth, { ...c, width: 640, height: 480, textures, light: false, entities: "none", labels: false });
  writeFileSync(join(out, `shot${n}.png`), png(picture.width, picture.height, picture.rgba));
  return { picture, guess: { from: [c.from[0] + 24, c.from[1] - 24, 64], yaw: c.yaw + 8, pitch: 0, fov: 90 } };
});
for (const [name, bsp] of Object.entries(built)) {
  const t = Date.now();
  const r = shotsAgainst(bsp, shots, { textures, light: false });
  console.log(`${name} build against the shots (${Date.now() - t} ms):`);
  r.shots.forEach((s, n) => {
    const c = cams[n];
    console.log(`  shot ${n}: by ${s.by}, ${s.inliers} inliers, edges say ${JSON.stringify(s.faces.slice(0, 3).map((f) => [f.axis, f.texture, f.move, f.better]))}, camera ${Math.round(Math.hypot(...s.camera.from.map((v, k) => v - c.from[k])))} units and ${Math.round(Math.abs(s.camera.yaw - c.yaw) * 10) / 10} deg off; planes ${JSON.stringify(s.planes.slice(0, 3).map((p) => [p.axis, p.texture, p.move, p.matches, p.before, p.after]))}`);
    writeFileSync(join(out, `${name}-overlay${n}.png`), png(s.overlay.width, s.overlay.height, s.overlay.rgba));
  });
  console.log(`  over the shots: ${JSON.stringify(r.planes.slice(0, 4))}`);
}
const sfm = structureOf(shots.map((s) => s.picture));
console.log(`structure from motion over the ${shots.length} shots: ${sfm.ok ? `${sfm.registered} of ${sfm.of}, ${sfm.points} points; upright planes ${JSON.stringify(sfm.planes.filter((p) => p.axis !== "z").map((p) => [p.axis, p.at, p.inliers]))}` : sfm.error}`);
