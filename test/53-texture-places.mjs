// Where a map's textures are best seen, and a wad spec's preview from there.
//   texturePlaces: each texture of the fixture's two rooms at a lit face, with its light, the texels a view
//   spans and the turn of its picture; placeView draws it
//   a material seen under a known light: the paint is the colour divided by it, channel by channel
//   the build tool's wad preview `each`: every texture of the spec from the judge's camera, and what it reports
//   the renderer's scene is kept by the textures given, not their names: two sets of one name draw apart
import { readFileSync, mkdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import * as smak from "../src/index.mjs";
import { materialOf } from "../src/spec/paint.mjs";
import { toolsFor } from "../mcp/tools.mjs";
import { test, testAsync, sure, HERE, tmp } from "./helper.mjs";

const FIXTURES = join(HERE, "fixtures");
// the two rooms whose textures are in a .wad: a map that keeps its own inside wears those, whatever is given
const bsp = smak.maps.readBsp(readFileSync(join(FIXTURES, "tworooms-wants-wad.bsp")));
const places = smak.maps.texturePlaces(bsp);

test("texturePlaces: each texture at a lit face, with its light, its texels across and its turn", () => {
  sure(places.map((p) => p.name).sort().join() === "smakfloor,smakwall", places.map((p) => p.name).join());
  for (const p of places) {
    sure(p.lit && p.light.length === 3 && p.light.every((v) => v > 0), JSON.stringify(p));
    sure(p.across > 0 && Number.isFinite(p.turned) && p.from.length === 3, JSON.stringify(p));
  }
  const view = smak.maps.placeView(bsp, places[0], { folders: [FIXTURES] });
  sure(view.width === 320 && view.height === 240);
});

test("material seen under a known light: the paint is the colour over it, channel by channel", () => {
  const m = materialOf({ base: "plaster", seen: { colour: [0.5, 0.4, 0.2], light: [2, 1, 0.5] } });
  sure(m.tone.map((v) => v.toFixed(2)).join() === "0.25,0.40,0.40", m.tone.join());
  const plain = materialOf({ base: "plaster", seen: { colour: [0.5, 0.5, 0.5], light: 2 } });
  sure(plain.tone.every((v) => Math.abs(v - 0.25) < 1e-9));
  let refused = false;
  try {
    materialOf({ base: "plaster", seen: { colour: [0.5, 0.5, 0.5], light: 0 } });
  } catch {
    refused = true;
  }
  sure(refused, "a light of 0 is refused");
});

test("the renderer keeps a scene by the textures given: two sets under one name draw apart", () => {
  const flat = (v) => ({ name: "smakwall", width: 64, height: 64, rgb: new Uint8Array(64 * 64 * 3).fill(v) });
  const wad = (v) => smak.maps.readWad(smak.maps.writeWad([{ name: "smakwall", image: flat(v) }, { name: "smakfloor", image: { ...flat(v), name: "smakfloor", width: 32, height: 32, rgb: new Uint8Array(32 * 32 * 3).fill(v) } }])).textures;
  const place = places.find((p) => p.name === "smakwall");
  const mean = (picture) => picture.rgba.reduce((s, v, i) => (i % 4 === 3 ? s : s + v), 0) / (picture.width * picture.height * 3);
  const dark = mean(smak.maps.placeView(bsp, place, { textures: wad(30) }));
  const light = mean(smak.maps.placeView(bsp, place, { textures: wad(220) }));
  sure(light > dark + 20, `${dark} against ${light}`);
});

await testAsync("the build tool's wad preview `each`: the spec's textures from the judge's camera, and their light", "wad preview each", async () => {
  const work = join(tmp, "places");
  mkdirSync(work, { recursive: true });
  copyFileSync(join(FIXTURES, "tworooms-wants-wad.bsp"), join(work, "tworooms.bsp"));
  const spec = {
    spec: "smak.wad/1",
    name: "rooms.wad",
    textures: [
      { name: "smakwall", size: [64, 64], material: { base: "plaster", seen: { colour: [0.6, 0.55, 0.5], light: places.find((p) => p.name === "smakwall").light } } },
      { name: "smakfloor", size: [32, 32], material: "stone" },
    ],
    preview: { map: "tworooms.bsp", each: true },
  };
  const build = toolsFor({ work }).find((tool) => tool.name === "build");
  const answer = await build.call({ spec: JSON.stringify(spec) });
  const words = answer.find((piece) => piece.type === "text").text;
  sure(/^OK/.test(words), words.slice(0, 400));
  sure(/smakwall: on a .*the view spans \d+ texels across, the picture's top turned -?\d+ degrees .* light \[/.test(words), words);
  sure(answer.filter((piece) => piece.type === "image").length >= 3, "the sheet, the views and the places");
});

await testAsync("the wad preview says when the map keeps its own copy of a texture, which the game wears instead", "wad preview embedded", async () => {
  const work = join(tmp, "places-embedded");
  mkdirSync(work, { recursive: true });
  copyFileSync(join(FIXTURES, "tworooms.bsp"), join(work, "tworooms.bsp"));
  const spec = { spec: "smak.wad/1", name: "rooms.wad", textures: [{ name: "smakwall", size: [64, 64], material: "stone" }], preview: { map: "tworooms.bsp", each: true } };
  const words = (await toolsFor({ work }).find((tool) => tool.name === "build").call({ spec: JSON.stringify(spec) })).find((piece) => piece.type === "text").text;
  sure(/the map keeps its own smakwall inside it/.test(words), words);
});
