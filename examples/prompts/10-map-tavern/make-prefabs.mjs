// The prefabs of case 10, as a mapper keeps them: each a .map file of its own (open it in J.A.C.K.,
// TrenchBroom or Hammer), its origin the point on the floor where it is put, its textures named as the
// spec's materials name theirs (SM_ and the word). The spec puts them with `furniture` and the layout's
// marks; the map's build moves and turns each as one group, its entities with it. Also draws the person's
// layout drawing (the rows in prompt.md) as drawing.png, to be laid beside the plan of the result.
//
//   node examples/prompts/10-map-tavern/make-prefabs.mjs
import { writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { box, light, writeMap } from "../../../src/maps/source.mjs";
import { png, label } from "../../../src/index.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const WOOD = "SM_FURNITURE";
const DARK = "SM_COUNTER";
const LINEN = "SM_LINEN";
const save = (name, brushes, entities = []) =>
  writeFileSync(join(HERE, name), writeMap({ worldspawn: { message: `prefab ${name}` }, brushes, entities }));

// a table for four: a top on two trestles, a bench each side, and a candle's light over it
save(
  "table.map",
  [
    box([-36, -22, 28], [36, 22, 32], WOOD),
    box([-28, -4, 0], [-22, 4, 28], WOOD),
    box([22, -4, 0], [28, 4, 28], WOOD),
    box([-32, -42, 14], [32, -30, 18], WOOD),
    box([-28, -38, 0], [-24, -34, 14], WOOD),
    box([24, -38, 0], [28, -34, 14], WOOD),
    box([-32, 30, 14], [32, 42, 18], WOOD),
    box([-28, 34, 0], [-24, 38, 14], WOOD),
    box([24, 34, 0], [28, 38, 14], WOOD),
  ],
  [light([0, 0, 44], { color: [255, 170, 80], brightness: 60 })],
);
// the bar: a counter 32 deep and 192 long along y, its customers' side towards -x, a foot rail before it
save("bar.map", [
  box([-16, -96, 0], [16, 96, 40], DARK),
  box([-20, -100, 40], [20, 100, 44], DARK),
  box([-24, -96, 4], [-20, 96, 8], WOOD),
]);
// a bed against a wall at +x: frame, mattress and headboard
save("bed.map", [
  box([-84, -34, 0], [0, 34, 16], WOOD),
  box([-82, -31, 16], [-6, 31, 24], LINEN),
  box([-6, -34, 0], [0, 34, 44], WOOD),
]);

// the person's drawing, as they typed it in prompt.md, drawn a cell to a square with its letters
const prompt = readFileSync(join(HERE, "prompt.md"), "utf8");
const rows = [...prompt.matchAll(/^>\s{4,}([.A-Z0-9]+)\s*$/gm)].map((m) => m[1]);
const CELL = 40;
const colours = { K: [196, 150, 90], H: [150, 110, 70], E: [120, 120, 130], 1: [90, 60, 30], B: [60, 35, 20], ".": [30, 30, 34] };
const width = rows[0].length * CELL;
const height = rows.length * CELL;
const rgba = new Uint8Array(width * height * 4);
rows.forEach((row, r) =>
  [...row].forEach((char, c) => {
    const colour = colours[char] ?? [200, 0, 200];
    for (let y = 0; y < CELL; y++)
      for (let x = 0; x < CELL; x++) {
        const edge = x === 0 || y === 0;
        rgba.set([...colour.map((v) => (edge ? v * 0.7 : v)), 255], ((r * CELL + y) * width + c * CELL + x) * 4);
      }
  }),
);
const picture = { width, height, rgba };
rows.forEach((row, r) => [...row].forEach((char, c) => char !== "." && label(picture, char, c * CELL + 14, r * CELL + 12)));
writeFileSync(join(HERE, "drawing.png"), png(width, height, rgba));
console.log(`wrote table.map, bar.map, bed.map and drawing.png (${rows.length} rows of ${rows[0].length})`);
