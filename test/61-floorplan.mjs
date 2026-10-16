// A floor plan of height plans: pictures of each layer of floor (its height and the headroom over it as colours,
// with a legend) read back into open space, carved in one, storeys over storeys; what stands on it placed at the
// world's [x, y] on the floor there. research/map-geometry.md, experiment A.
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test, testAsync, sure, tmp } from "./helper.mjs";
import { openBoxesOf, colourOf, EMPTY } from "../src/maps/heightplan.mjs";
import { buildMapSpec, validateMapSpec } from "../src/spec/map.mjs";
import { png } from "../src/image.mjs";

// a hall 8 by 6 cells of 32 at floor 0 with 192 of headroom, and over its east half (under a slab 16 thick, its
// headroom 112) a gallery at 128 with 96
const C = 32;
const PX = 2;
const [W, H] = [8, 6];
const legend = { cell: C, pixels: PX, x0: 0, y1: 80, width: W, height: H, layers: 2, heights: [0, 128].map((h, k) => ({ h, rgb: colourOf(k) })), rooms: [64, 96, 112, 192].map((v, k) => ({ v, rgb: colourOf(k + 3) })) };
const picture = (fill) => {
  const rgba = new Uint8Array(W * PX * H * PX * 4);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) for (let v = 0; v < PX; v++) for (let u = 0; u < PX; u++) rgba.set([...(fill(i, j) ?? EMPTY), 255], ((j * PX + v) * W * PX + i * PX + u) * 4);
  return { width: W * PX, height: H * PX, rgba };
};
const hues = (list, value) => list.find((e) => (e.h ?? e.v) === value).rgb;
const layers = [
  { floor: picture(() => hues(legend.heights, 0)), room: picture((i) => hues(legend.rooms, i >= 4 ? 112 : 192)) },
  { floor: picture((i) => (i >= 4 ? hues(legend.heights, 128) : null)), room: picture((i) => (i >= 4 ? hues(legend.rooms, 96) : null)) },
];

test("a height plan read back: each layer's floor and headroom, cells of one kind merged into boxes, storeys kept apart", () => {
  const { boxes, cells } = openBoxesOf(layers, legend, { grow: 0 });
  sure(cells === W * H, `${cells} cells with a floor`);
  const under = boxes.filter((b) => b.min[2] === 0);
  const over = boxes.filter((b) => b.min[2] === 128);
  sure(over.length >= 1 && over.every((b) => b.max[2] === 224 && b.min[0] >= 128), JSON.stringify(over));
  sure(under.some((b) => b.max[2] === 192) && under.some((b) => b.max[2] === 112), JSON.stringify(under));
  const area = boxes.reduce((n, b) => n + ((b.max[0] - b.min[0]) * (b.max[1] - b.min[1])) / (C * C), 0);
  sure(area === W * H + (W / 2) * H, `cells of the boxes ${area}`);
});

test("a map spec's floorplan: its space carved from the plan, a start on the gallery at its floor, no rooms needed", () => {
  const folder = join(tmp, "floorplan");
  mkdirSync(join(folder, "plans"), { recursive: true });
  layers.forEach(({ floor, room }, L) => {
    writeFileSync(join(folder, "plans", `floor-${L}.png`), png(floor.width, floor.height, floor.rgba));
    writeFileSync(join(folder, "plans", `room-${L}.png`), png(room.width, room.height, room.rgba));
  });
  writeFileSync(join(folder, "plans", "legend.json"), JSON.stringify(legend));
  const spec = { spec: "smak.map/1", name: "gallery", floorplan: { dir: "plans/", grow: 0 }, entities: [{ class: "info_player_start", room: "plan", at: [24, 40] }, { class: "item_battery", room: "plan", at: [208, 40], z: 2 }] };
  sure(!validateMapSpec(spec).errors.length, validateMapSpec(spec).errors.join("; "));
  sure(!validateMapSpec(spec).warnings.some((w) => /floorplan/.test(w)), `a known field: ${validateMapSpec(spec).warnings.join("; ")}`);
  const { report, files } = buildMapSpec(spec, { out: join(folder, "out"), folder, compilers: { found: false, message: "" } });
  sure(!report.errors.length, report.errors.join("; "));
  sure(report.facts.some((f) => /floorplan plans\/: 2 layers, 48 cells of 32 with a floor/.test(f)), report.facts.filter((f) => /floorplan/.test(f)).join(" | "));
  const text = readFileSync(files.map, "utf8");
  sure(/"classname" "item_battery"\n"origin" "208 40 2"/.test(text) || /"origin" "208 40 2"/.test(text), "the battery on the hall's floor under the gallery's east half, 2 over it");
  sure(/"classname" "light"/.test(text), "lamps in its largest spaces");
  // the same point on the gallery over it: layer 1, its floor at 128
  const up = buildMapSpec({ ...spec, name: "gallery2", entities: [...spec.entities, { class: "item_healthkit", room: "plan", at: [208, 40], layer: 1, z: 2 }] }, { out: join(folder, "out2"), folder, compilers: { found: false, message: "" } });
  sure(/"origin" "208 40 130"/.test(readFileSync(up.files.map, "utf8")), "the kit on the gallery, 2 over its floor at 128");
  // the gallery's area wears its own floor: the faces under it take that texture, the hall's keep the theme's
  const worn = buildMapSpec({ ...spec, name: "gallery4", textures: { gallery: { base: "planks" } }, floorplan: { ...spec.floorplan, areas: [{ min: [128, -100, 100], max: [300, 200], floor: "gallery" }] } }, { out: join(folder, "out4"), folder, compilers: { found: false, message: "" } });
  sure(!worn.report.errors.length, worn.report.errors.join("; "));
  sure(/SM_GALLERY/.test(readFileSync(worn.files.map, "utf8")), "the gallery's floor in its own texture");
  const lit = buildMapSpec({ ...spec, name: "gallery5", floorplan: { ...spec.floorplan, areas: [{ min: [-100, -100], max: [127, 200], light: { brightness: 180 } }] } }, { out: join(folder, "out5"), folder, compilers: { found: false, message: "" } });
  const lights = readFileSync(lit.files.map, "utf8").match(/"classname" "light"/g) ?? [];
  sure(lights.length >= 1 && /"_light" "[\d ]+ 180"/.test(readFileSync(lit.files.map, "utf8")), `the hall's west half lit as asked: ${lights.length} lamps`);
  // a lamp placed on the plan hangs from the ceiling over it, not from a sky 4096 up
  const hung = buildMapSpec({ ...spec, name: "gallery6", entities: [...spec.entities, { class: "light", room: "plan", at: [40, 40] }] }, { out: join(folder, "out6"), folder, compilers: { found: false, message: "" } });
  const zs = [...readFileSync(hung.files.map, "utf8").matchAll(/\( -?[\d.]+ -?[\d.]+ (-?[\d.]+) \)/g)].map((m) => Number(m[1]));
  sure(Math.max(...zs) < 1000, `nothing reaches past the plan's top: ${Math.max(...zs)}`);
  const marked = buildMapSpec({ ...spec, name: "gallery3", entities: [...spec.entities, { class: "item_healthkit", room: "plan", at: [208, 40], height: 140, z: 2 }] }, { out: join(folder, "out3"), folder, compilers: { found: false, message: "" } });
  sure(/"origin" "208 40 130"/.test(readFileSync(marked.files.map, "utf8")), "marked at 140: on the gallery's floor at 128");
  const missing = validateMapSpec({ spec: "smak.map/1", name: "x", entities: [{ class: "info_player_start", room: "plan" }] });
  sure(missing.errors.some((e) => /rooms: a list of one room at least \(or a floorplan\)/.test(e)), missing.errors.join("; "));
});

testAsync("a texture lifted off a view of it on its wall: the texels it shows come back, its light divided out", "lift", async () => {
  const maps = await import("../src/maps/index.mjs");
  const { liftTexture } = await import("../src/maps/lift.mjs");
  const { texturePlaces, placeView } = await import("../src/maps/places.mjs");
  const fixtures = new URL("./fixtures/", import.meta.url).pathname;
  const bsp = maps.readBsp(readFileSync(join(fixtures, "tworooms.bsp")));
  const wad = maps.readWad(readFileSync(join(fixtures, "tworooms.wad")));
  // the place a texture is best seen at, drawn wearing the wad's own pictures (what a textures leg is given)
  const place = texturePlaces(bsp).find((p) => wad.textures.some((t) => t.name.toLowerCase() === p.name.toLowerCase()) && p.lit);
  sure(place, "a lit place of a texture the fixture's wad has");
  // at brightness 1: the fixture's light at the places' usual brightness washes the wall to white
  const view = placeView(bsp, place, { textures: wad.textures, wearing: "given", brightness: 1 });
  const lifted = liftTexture(bsp, place.name, view, { brightness: 1 });
  const truth = wad.textures.find((t) => t.name.toLowerCase() === place.name.toLowerCase());
  let d = 0;
  let n = 0;
  for (let i = 0; i < truth.width * truth.height; i++) for (let c = 0; c < 3; c++) (d += Math.abs(truth.palette[truth.pixels[i] * 3 + c] - lifted.image.rgb[i * 3 + c])), n++;
  sure(lifted.seen > 0.3 && d / n < 12, `${place.name}: ${Math.round(lifted.seen * 100)}% seen, ${(d / n).toFixed(1)} off a channel`);
});

testAsync("a lift may take the map's views too, by the cameras kept beside them: it sees no less of the texture", "lift views", async () => {
  const maps = await import("../src/maps/index.mjs");
  const { liftTexture } = await import("../src/maps/lift.mjs");
  const { texturePlaces, placeView } = await import("../src/maps/places.mjs");
  const fixtures = new URL("./fixtures/", import.meta.url).pathname;
  const bsp = maps.readBsp(readFileSync(join(fixtures, "tworooms.bsp")));
  const wad = maps.readWad(readFileSync(join(fixtures, "tworooms.wad")));
  const place = texturePlaces(bsp).find((p) => wad.textures.some((t) => t.name.toLowerCase() === p.name.toLowerCase()) && p.lit);
  const view = placeView(bsp, place, { textures: wad.textures, wearing: "given", brightness: 1 });
  const sheet = maps.viewsOf(bsp, { count: 4, textures: wad.textures, wearing: "given", entities: "none", labels: false, width: 320, height: 240, brightness: 1 });
  const views = { width: 320, height: 240, cols: Math.min(4, sheet.facts.views.length), brightness: 1, cameras: sheet.facts.views, picture: sheet };
  const alone = liftTexture(bsp, place.name, view, { brightness: 1 });
  const more = liftTexture(bsp, place.name, view, { brightness: 1, views });
  sure(more.seen >= alone.seen, `${alone.seen} alone, ${more.seen} with the views`);
});

test("a large floor plan wearing one look throughout is told to give its parts their own", () => {
  // the same plan at cells of 256: 48 of them, three million square units of floor
  const folder = join(tmp, "floorplan-large");
  mkdirSync(join(folder, "plans"), { recursive: true });
  layers.forEach(({ floor, room }, L) => {
    writeFileSync(join(folder, "plans", `floor-${L}.png`), png(floor.width, floor.height, floor.rgba));
    writeFileSync(join(folder, "plans", `room-${L}.png`), png(room.width, room.height, room.rgba));
  });
  writeFileSync(join(folder, "plans", "legend.json"), JSON.stringify({ ...legend, cell: 256 }));
  const spec = { spec: "smak.map/1", name: "large", floorplan: { dir: "plans/", grow: 0 }, entities: [{ class: "info_player_start", room: "plan", at: [100, 40] }] };
  const one = buildMapSpec(spec, { out: join(folder, "out"), folder, compilers: { found: false, message: "" } });
  sure(one.report.warnings.some((w) => /floorplan: [\d.]+ million square units of floor, 2 layers, all wearing one floor, wall and ceiling/.test(w)), one.report.warnings.join(" | "));
  const parted = buildMapSpec({ ...spec, name: "large2", floorplan: { ...spec.floorplan, areas: [{ min: [-100, -2000], max: [1000, 2000], wall: "plaster" }, { min: [1000, -2000], max: [3000, 2000], wall: "brick" }] } }, { out: join(folder, "out2"), folder, compilers: { found: false, message: "" } });
  sure(!parted.report.warnings.some((w) => /wearing one floor, wall and ceiling/.test(w)), parted.report.warnings.join(" | "));
});
