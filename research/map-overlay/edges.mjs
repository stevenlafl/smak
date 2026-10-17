// The edges pictureEdges keeps of a picture, drawn white on black: node research/map-overlay/edges.mjs <in.png> <out.png> [width]
import { readFileSync, writeFileSync } from "node:fs";
import * as smak from "../../src/index.mjs";
import { pictureEdges } from "../../src/maps/overlay.mjs";

const [input, output, size = "320"] = process.argv.slice(2);
const picture = smak.unpng(readFileSync(input));
const width = Number(size);
const height = Math.round((width * picture.height) / picture.width);
const e = pictureEdges(picture, width, height);
const rgba = new Uint8Array(width * height * 4);
for (let i = 0; i < width * height; i++) rgba.set(e[i] ? [255, 255, 255, 255] : [0, 0, 0, 255], i * 4);
writeFileSync(output, smak.png(width, height, rgba));
console.log(`${e.reduce((a, b) => a + b, 0)} edge pixels of ${width * height}`);
