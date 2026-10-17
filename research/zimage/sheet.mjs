// Pictures and .obj meshes side by side in one PNG, each named: node research/zimage/sheet.mjs out.png a.png b.obj ...
import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import * as smak from "../../src/index.mjs";

const [out, ...files] = process.argv.slice(2);
const SIDE = 320;
const tiles = [];
const names = [];
for (const file of files) {
  if (file.endsWith(".obj")) {
    const { mdl } = smak.objModel(smak.readObj(readFileSync(file, "utf8")), { up: "y", ground: true, centre: true, scale: 36, quiet: true });
    for (const view of ["front", "side"]) {
      tiles.push(smak.render(mdl, { view, width: SIDE, height: SIDE }));
      names.push(`${basename(file)} ${view}`);
    }
  } else {
    const picture = smak.unpicture(readFileSync(file));
    const s = Math.min(SIDE / picture.width, SIDE / picture.height);
    const rgba = new Uint8Array(SIDE * SIDE * 4).fill(255);
    for (let y = 0; y < SIDE; y++)
      for (let x = 0; x < SIDE; x++) {
        const sx = Math.floor(x / s), sy = Math.floor(y / s);
        if (sx >= picture.width || sy >= picture.height) continue;
        for (let k = 0; k < 4; k++) rgba[(y * SIDE + x) * 4 + k] = picture.rgba[(sy * picture.width + sx) * 4 + k];
      }
    tiles.push({ width: SIDE, height: SIDE, rgba });
    names.push(basename(file));
  }
}
const cols = Math.min(4, tiles.length);
const rows = Math.ceil(tiles.length / cols);
const W = cols * SIDE, H = rows * (SIDE + 16);
const rgba = new Uint8Array(W * H * 4).fill(40);
tiles.forEach((t, i) => {
  const ox = (i % cols) * SIDE, oy = Math.floor(i / cols) * (SIDE + 16) + 16;
  for (let y = 0; y < t.height; y++) rgba.set(t.rgba.subarray(y * t.width * 4, (y + 1) * t.width * 4), ((oy + y) * W + ox) * 4);
});
writeFileSync(out, smak.png(W, H, rgba));
console.log(`${out}: ${names.join(" | ")}`);
