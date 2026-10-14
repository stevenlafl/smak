// Models and maps from specs, and the shape's soundness they are held to: what the tool `build` of the MCP
// server stands on (src/spec, src/sound.mjs). The faults each case builds on purpose are the ones the
// soundness check must name, and the crashes found while the prompts of examples/prompts were built are
// built again here, so that none comes back.
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import * as smak from "../src/index.mjs";
import { buildModelSpec, validateModelSpec } from "../src/spec/model.mjs";
import { buildMapSpec, layoutOf, withIncludes } from "../src/spec/map.mjs";
import { materialOf, surfacePicture } from "../src/spec/paint.mjs";
import { sword, taper } from "../kits/swordkit.mjs";
import { definitionsOf } from "../src/maps/fgd.mjs";
import { findCompilers, COMPILERS_VARIABLE } from "../src/maps/compile.mjs";
import { toolsFor } from "../mcp/tools.mjs";
import { test, testAsync, sure, near, tmp } from "./helper.mjs";

const { workshop: W, buildMdl, indexed, soundness, shapeSoundness, seeThrough } = smak;
const folder = join(tmp, "specs");
mkdirSync(folder, { recursive: true });
const Z = { x: 0, y: 0, w: 64, h: 64 };
const upright = (s, a, b) => [a, b, s];

/** A model of one bone and one mesh from what `build` makes in a workshop shape. */
function modelOf(build) {
  const M = W.shape(64, 64);
  build(M);
  return buildMdl({
    name: "t.mdl",
    bones: [{ name: "root", parent: -1 }],
    bodyparts: [{ name: "body", models: [{ name: "t", meshes: [{ tris: M.tris.map((t) => t.map((c) => ({ ...c, bone: "root" }))), texture: indexed(W.sheet(64, 64).image(), "t.bmp") }] }] }],
    sequences: [{ name: "idle", fps: 10, frames: [[[0, 0, 0, 0, 0, 0]]] }],
  });
}
const faultsOf = (mdl) => soundness(mdl).faults.join(" | ");

test("soundness: a whole shape passes; a hole, a face turned, an inside-out part and a floating one are named", () => {
  const barrel = modelOf((M) => M.turn([[0, 10], [12, 11], [24, 10]], Z, { sides: 16, caps: [true, true], at: upright }));
  sure(soundness(barrel).faults.length === 0 && seeThrough(barrel).faults.length === 0, `a closed barrel: ${faultsOf(barrel)}`);

  const cup = modelOf((M) => M.turn([[0, 6], [10, 7]], Z, { sides: 16, caps: [true, false], at: upright }));
  sure(/16 open edges/.test(faultsOf(cup)), `an open cup: ${faultsOf(cup)}`);
  sure(seeThrough(cup).share > 0.05, "an open cup is seen through from above");
  const lined = modelOf((M) => M.turn([[10, 7], [0, 6]], Z, { sides: 16, caps: [false, true], lining: { inset: 0.5, zone: Z, cap: true }, at: upright }));
  sure(soundness(lined).faults.length === 0, `a cup with its inside: ${faultsOf(lined)}`);

  const insideOut = modelOf((M) => M.turn([[0, 10], [24, 10]], Z, { sides: 12, caps: [true, true], face: "in", at: upright }));
  sure(/inside out/.test(faultsOf(insideOut)), `inside out: ${faultsOf(insideOut)}`);

  const knob = modelOf((M) => {
    M.turn([[0, 10], [24, 10]], Z, { sides: 12, caps: [true, true], at: upright });
    M.turn([[30, 2], [34, 2]], Z, { sides: 8, caps: [true, true], at: upright });
  });
  sure(/1 pieces float apart from the rest: t.bmp 6 units away/.test(faultsOf(knob)), `floating: ${faultsOf(knob)}`);

  const M = W.shape(64, 64);
  M.turn([[0, 10], [24, 10]], Z, { sides: 12, caps: [true, true], at: upright });
  const t = M.tris[5];
  M.tris[5] = [t[0], t[2], t[1]];
  const flipped = shapeSoundness(M.tris.map((tri) => ({ p: tri.map((c) => c.p), name: "barrel" })), { front: 1 });
  sure(flipped.edges.flipped === 3 && /turned the wrong way/.test(flipped.faults.join()), `one face flipped: ${flipped.faults}`);
});

test("soundness: what touches is no fault: stacked boxes, a band sunk in its barrel, a sheet, a part sunk or cutting through", () => {
  // the crate of example 1: a lid that sits on its body, face on face
  const shape = W.shape(64, 64);
  for (const [z0, z1] of [[0, 10], [10, 13]]) {
    const c = (i) => [(i & 1 ? 6 : -6), (i & 2 ? 6 : -6), i & 4 ? z1 : z0];
    for (const face of [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]])
      shape.quad(...face.map((k) => shape.V(c(k), [0, 0])), [0, 0, (z0 + z1) / 2]);
  }
  const stacked = shapeSoundness(shape.tris.map((tri) => ({ p: tri.map((c) => c.p), name: "crate" })));
  sure(stacked.faults.length === 0 && stacked.edges.touching > 0, `stacked boxes: ${stacked.faults}`);

  const banded = modelOf((M) => M.band(M.turn([[0, 10], [24, 10]], Z, { sides: 16, caps: [true, true], at: upright }), 6, Z, { width: 1, height: 0.3 }));
  const band = soundness(banded);
  sure(band.faults.length === 0 && band.edges.buried === 32, `a band once round, its seam closed and its feet buried: ${band.faults} ${JSON.stringify(band.edges)}`);

  const leaf = soundness(modelOf((M) => M.leaf([[[0, 0, 0], [0, 4, 0], [0, 8, 0]], [[0, 0, 6], [0, 4, 6], [0, 8, 6]]], Z)));
  sure(leaf.faults.length === 0 && /thin sheets/.test(leaf.notes.join()), `a leaf: ${leaf.faults}`);
});

test("the sword kit's pieces are closed: its blade, its bar guard and its turned parts have no open end", () => {
  const piece = sword({
    seed: 3,
    pommel: { profile: [[0, 0.45], [0.8, 0.8], [1.6, 0.5]] },
    grip: { profile: [[1.4, 0.55], [6.5, 0.6]] },
    guard: { x: 6.8, sections: [[-2.6, 0.3, 0.25], [0, 0.45, 0.4], [2.6, 0.3, 0.25]] },
    blade: { x0: 7.2, x1: 34, half: taper(1.1, 0.95), section: "diamond" },
  });
  const sound = shapeSoundness(piece.tris.map((t) => ({ p: t.map((c) => c.p), name: "sword" })));
  sure(sound.edges.open === 0 && sound.faults.length === 0, `the sword: ${sound.faults} ${JSON.stringify(sound.edges)}`);
});

test("a ridge along an oval body, crossing a ring where its end narrows, stays whole (the hover car's stripe)", () => {
  const M = W.shape(256, 256);
  const body = M.turn([[-52, [12, 4.5]], [-50, [17, 6.5]], [-30, [19, 7.5]], [10, [19, 7.5]], [35, [16.5, 6]], [48, [11, 4]], [55, [4, 2]]], Z, { sides: 20, caps: [true, true] });
  const before = M.tris.length;
  M.ridge(body, [[-52 + 0.12 * 107, (9 * Math.PI) / 180], [-52 + 0.82 * 107, (9 * Math.PI) / 180]], Z, { width: 0.8, height: 0.2 });
  const stripe = shapeSoundness(M.tris.slice(before).map((t) => ({ p: t.map((c) => c.p), name: "stripe" })));
  sure(stripe.edges.flipped === 0 && stripe.edges.crowded === 0, `the stripe: ${JSON.stringify(stripe.edges)}`);
});

test("a model spec: its faults in words with their places, and a barrel built, stood on the floor and checked", () => {
  const wrong = validateModelSpec({
    spec: "smak.model/1",
    parts: [
      { id: "lid", kind: "cylindr", radius: 2, height: 1 },
      { id: "pot", kind: "cylinder", radius: 5, height: 8, attach: { to: "base" } },
    ],
  });
  sure(/parts\[0\] \(lid\)\.kind: no kind "cylindr".*Did you mean "cylinder"/.test(wrong.errors.join("\n")), wrong.errors.join("\n"));
  sure(/parts\[1\] \(pot\)\.attach\.to: "base" is no part given before this one/.test(wrong.errors.join("\n")), "a part attached to one not before it");

  const spec = JSON.parse(readFileSync(new URL("../examples/prompts/01-model-barrel/spec.json", import.meta.url), "utf8"));
  const { mdl, report } = buildModelSpec(spec);
  sure(report.ok && mdl, `the barrel: ${[...report.errors, ...report.faults]}`);
  sure(report.parts.body.from[2] === 0 && report.parts.body.to[2] === 40, `stands on the floor, 40 high: ${JSON.stringify(report.parts.body)}`);
  sure(report.edges.buried === 64 && report.edges.open === 0, `its hoops' feet buried: ${JSON.stringify(report.edges)}`);
  // a height off by more than a quarter is a fault
  const short = buildModelSpec({ ...spec, size: { height: 60 } }).report;
  sure(!short.ok && /height 40 where the spec asks 60/.test(short.faults.join()), short.faults.join());
});

test("a model spec: repeat turns the part itself to `start` and copies it round any axis; mirror; a prefab", () => {
  const spec = {
    spec: "smak.model/1",
    kind: "piece",
    parts: [
      { id: "hub", kind: "turn", axis: "y", rings: [[-2, 2], [2, 2]], at: [0, 0, 0] },
      { id: "spoke", kind: "cylinder", radius: 0.4, height: 10, at: [0, 0, 1], repeat: { count: 4, axis: "y", through: [0, 0, 0], start: 45 } },
      { id: "cap", kind: "prefab", spec: { spec: "smak.model/1", parts: [{ id: "knob", kind: "sphere", radius: 1 }] }, at: [0, 2.5, -1], mirror: "y" },
    ],
  };
  const { report } = buildModelSpec(spec);
  sure(report.ok, [...report.errors, ...report.faults].join("; "));
  const { from, to } = report.parts.spoke;
  // four spokes at 45, 135, 225 and 315 about y: as far out each way in x and in z, none along the axes
  near(to[0], -from[0], 0.05, "the spokes' reach either way in x");
  near(to[2], -from[2], 0.05, "the spokes' reach either way in z");
  near(to[0], to[2], 0.05, "turned to 45 degrees");
  sure(report.parts["cap.knob"] && report.parts["cap.knob"].from[1] < -2 && report.parts["cap.knob"].to[1] > 2, "the prefab mirrored to both sides");
});

test("a map spec is laid out by words, its rooms in rooms, its modules taken in with their ids and their walls", () => {
  const spec = {
    spec: "smak.map/1",
    rooms: [
      { id: "hall", size: [256, 256, 160] },
      { id: "study", size: [256, 256, 128], place: { east_of: "hall" }, floor: 16 },
      { id: "pit", size: [128, 64, 48], place: { in: "hall", offset: [64, 32] }, floor: -48 },
    ],
  };
  const { rooms } = layoutOf(spec);
  sure(rooms.get("study").min.join() === "144,-128,16", `east of the hall, 16 of rock between, its floor 16 up: ${rooms.get("study").min}`);
  sure(rooms.get("pit").min.join() === "-64,-96,-48", `in the hall: ${rooms.get("pit").min}`);

  const moduleFile = join(folder, "shop.json");
  writeFileSync(moduleFile, JSON.stringify({
    spec: "smak.map/1",
    theme: { wall: "tile" },
    rooms: [{ id: "shop", size: [256, 192, 128] }, { id: "front", size: [256, 192, 256], place: { south_of: "shop" }, test: true }],
    links: [{ between: ["shop", "front"], kind: "opening" }],
    entities: [{ class: "info_player_start", room: "front", at: "centre" }, { class: "item_battery", room: "shop", at: "centre", facing: "shop" }],
  }));
  const taken = withIncludes({ spec: "smak.map/1", rooms: [{ id: "street", size: [512, 256, 256] }], include: [{ spec: "shop.json", as: "corner", place: { north_of: "street" } }] }, folder);
  const shop = taken.rooms.find((room) => room.id === "corner_shop");
  sure(shop && shop.place.north_of === "street" && shop.surfaces.walls === "corner_wall", `the module's first room placed, its walls kept: ${JSON.stringify(shop)}`);
  sure(!taken.rooms.some((room) => room.id === "corner_front") && !taken.links.length, "a test room and its link stay out");
  sure(taken.entities.length === 1 && taken.entities[0].facing === "corner_shop", "its start stays out; a room it names is prefixed");
});

test("a map spec is built without compilers: lined rooms (the crash of case 9), water, glass, breakables, neon", () => {
  const out = join(folder, "lined");
  const { report, files } = buildMapSpec(
    {
      spec: "smak.map/1",
      name: "lined",
      night: true,
      textures: { pink: { base: "neon", tone: [1, 0.2, 0.7] } },
      rooms: [
        { id: "yard", size: [384, 256, 256], sky: true, surfaces: { floor: "grass", walls: "brick" } },
        { id: "pool", size: [256, 256, 128], place: { north_of: "yard" }, water: 32 },
      ],
      links: [{ between: ["yard", "pool"], kind: "opening" }, { between: ["yard", "pool"], kind: "window", along: 0.8, glass: true }],
      furniture: [
        { box: [32, 32, 32], room: "yard", at: [100, 0], entity: { class: "func_breakable", material: 1 } },
        { box: [64, 4, 16], room: "yard", at: [0, -124], z: 96, texture: "pink" },
      ],
      entities: [{ class: "info_player_start", room: "yard", at: "centre" }],
    },
    { out, compilers: { found: false, message: "no compilers in this test" } },
  );
  sure(report.errors.length === 0, report.errors.join("; "));
  sure(report.faults.length === 1 && /not compiled/.test(report.faults[0]), `only the compile is wanting: ${report.faults}`);
  const text = readFileSync(files.map, "utf8");
  sure(/"classname" "func_breakable"[\s\S]*"rendermode" "2"/.test(text), "a glass pane, a func_breakable half see-through");
  sure(/"material" "1"/.test(text), "the crate a breakable of wood");
  sure(/!SM_WATER/.test(text) && /"classname" "info_texlights"[\s\S]*"SM_PINK"/.test(text), "water, and the neon a texture light");
  sure(/"_diffuse_light"/.test(text), "a night sky's own light under the moon's");
  const wad = smak.maps.readWad(readFileSync(files.wad));
  sure(["SM_GRASS", "SM_BRICK", "!SM_WATER", "SM_PINK", "SKY"].every((name) => wad.textures.some((t) => t.name.toUpperCase() === name)), `the wad: ${wad.textures.map((t) => t.name)}`);
  // a map's picture tiles: its left column follows on from its right
  const picture = surfacePicture(materialOf("brick"), 64);
  const step = (x0, x1) => Math.abs(picture.rgb[(10 * 64 + x0) * 3] - picture.rgb[(10 * 64 + x1) * 3]);
  sure(step(63, 0) < 80, "a picture laid side by side shows no seam");
});

test("a map spec's walk faults come back in the walk test's own words (the crash of case 8)", () => {
  const { report } = buildMapSpec(
    {
      spec: "smak.map/1",
      name: "stuck",
      rooms: [{ id: "room", size: [256, 256, 128] }],
      furniture: [{ box: [96, 96, 96], room: "room", at: "centre" }],
      entities: [{ class: "info_player_start", room: "room", at: "centre" }],
    },
    { out: join(folder, "stuck"), compilers: { found: false, message: "no compilers in this test" } },
  );
  sure(report.faults.some((fault) => /walk: .*stand in something solid/.test(fault)), report.faults.join(" | "));
});

test("an FGD's choices and flags keep what they are called", () => {
  const file = join(folder, "small.fgd");
  writeFileSync(file, '@SolidClass = func_breakable : "Breakable" [ material(choices) : "Material" : 0 = [ 0 : "Glass" 1 : "Wood" ] spawnflags(flags) = [ 1 : "Only Trigger" : 0 ] ]\n');
  const keys = definitionsOf(file).classes.func_breakable.keys;
  sure(keys.material.labels["1"] === "Wood" && keys.spawnflags.labels["1"] === "Only Trigger", JSON.stringify(keys.material));
});

await testAsync("the MCP tool build makes a model from a spec, writes it and its spec, and says OK", "build: model", async () => {
  const work = join(folder, "work");
  mkdirSync(work, { recursive: true });
  const build = toolsFor({ work }).find((tool) => tool.name === "build");
  const answer = await build.call({ spec: readFileSync(new URL("../examples/prompts/02-model-street-lamp/spec.json", import.meta.url), "utf8"), focus: ["glass"] });
  const words = answer.find((piece) => piece.type === "text").text;
  sure(/^OK/.test(words) && existsSync(join(work, "street_lamp.mdl")) && existsSync(join(work, "street_lamp.spec.json")), words.slice(0, 300));
  sure(answer.filter((piece) => piece.type === "image").length === 2, "the sheet and the close look");
});

const compilers = process.env[COMPILERS_VARIABLE] ? findCompilers() : { found: false };
if (compilers.found)
  test("a map spec compiled: stairs between storeys, their top's floor in no room (the crash of case 10), lit", () => {
    const { report } = buildMapSpec(
      {
        spec: "smak.map/1",
        name: "storeys",
        rooms: [{ id: "low", size: [384, 192, 160] }, { id: "high", size: [384, 192, 128], place: { above: "low", gap: 16 } }],
        links: [{ between: ["low", "high"], kind: "stairs", width: 96 }],
        entities: [{ class: "info_player_start", room: "low", at: "corner ne" }, { class: "item_battery", room: "high", at: "corner ne" }],
      },
      { out: join(folder, "storeys"), compilers },
    );
    sure(report.ok, [...report.errors, ...report.faults].join(" | "));
    sure(report.rooms.low.light > 24 && report.rooms.high.light > 24, JSON.stringify(report.rooms));
  });
else console.log(`skip  a map spec compiled\n      skipped: no compilers (name the folder of VHLT or SDHLT in ${COMPILERS_VARIABLE} to run it)`);
