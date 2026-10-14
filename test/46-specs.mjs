// Models and maps from specs, and the shape's soundness they are held to: what the tool `build` of the MCP
// server stands on (src/spec, src/sound.mjs). The faults each case builds on purpose are the ones the
// soundness check must name, and the crashes found while the prompts of examples/prompts were built are
// built again here, so that none comes back.
import { mkdirSync, mkdtempSync, writeFileSync, readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import * as smak from "../src/index.mjs";
import { buildModelSpec, validateModelSpec } from "../src/spec/model.mjs";
import { buildMapSpec, layoutOf, withIncludes } from "../src/spec/map.mjs";
import { materialOf, surfacePicture } from "../src/spec/paint.mjs";
import { changesOf } from "../src/spec/changes.mjs";
import { validateWadSpec } from "../src/spec/wad.mjs";
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

  // a stock that stops 0.4 short of its receiver, both on a grip that touches each: no part floats, and the
  // open joint is named to be looked at (the pipe shotgun of case 27)
  const boxAt = (name, [x0, y0, z0], [x1, y1, z1]) => {
    const s = W.shape(64, 64);
    const c = (i) => [i & 1 ? x1 : x0, i & 2 ? y1 : y0, i & 4 ? z1 : z0];
    for (const face of [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]])
      s.quad(...face.map((k) => s.V(c(k), [0, 0])), [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2]);
    return s.tris.map((tri) => ({ p: tri.map((c) => c.p), name }));
  };
  const joint = shapeSoundness([...boxAt("stock", [0, -1, 0], [8, 1, 2]), ...boxAt("receiver", [8.4, -1, 0], [14, 1, 2]), ...boxAt("grip", [6, -0.5, -4], [10, 0.5, 0.2])]);
  sure(joint.faults.length === 0, `nothing floats: ${joint.faults}`);
  sure(/1 pairs of parts nearly touch and do not: receiver and stock 0\.4 apart/.test(joint.notes.join()), `the open joint is named: ${joint.notes}`);
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

test("a character spec: a place on a part laid along a limb is where the part went (the cowboy's shirt)", () => {
  // a base of two bones, the second 10 up the first: a limb along z from 0 to 10
  const M = W.shape(64, 64);
  M.lathe([[0, 1], [2, 1]], Z, { sides: 6, caps: [true, true], at: upright });
  const base = buildMdl({
    name: "limb.mdl",
    bones: [{ name: "root", parent: -1 }, { name: "tip", parent: 0 }],
    bodyparts: [{ name: "body", models: [{ name: "t", meshes: [{ tris: M.tris.map((t) => t.map((c) => ({ ...c, bone: "root" }))), texture: indexed(W.sheet(64, 64).image(), "t.bmp") }] }] }],
    sequences: [{ name: "idle", fps: 10, frames: [[[0, 0, 0, 0, 0, 0], [0, 0, 10, 0, 0, 0]]] }],
  });
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, "limb.mdl"), base);
  const { report } = buildModelSpec(
    {
      spec: "smak.model/1",
      name: "sleeve.mdl",
      kind: "character",
      base: { file: "limb.mdl" },
      parts: [
        { id: "sleeve", kind: "turn", rings: [[0, 1], [1, 1]], sides: 8, span: { bones: ["root", "tip"] } },
        { id: "patch", kind: "box", size: [0.5, 0.5, 0.5], attach: { to: "sleeve", toAt: { s: 0.5, angle: 0 }, at: "back" } },
      ],
    },
    { folder },
  );
  const patch = report.parts.patch;
  sure(patch && Math.abs(patch.from[2] - 4.75) <= 0.1 && Math.abs(patch.from[0] - 1) <= 0.1, `the patch halfway up the sleeve, on its front: ${JSON.stringify(patch)}`);
  // a part laid along a limb is made at the limb's length, not stretched to it: a band on it keeps its own
  // width and stays closed, and a point `out` from it goes out along its true normal (the cat's belly and
  // stripes). The sleeve's rings are given from 0 to 1 and the cuff's from 0 to 1, as a spec may.
  const banded = buildModelSpec(
    {
      spec: "smak.model/1",
      name: "banded.mdl",
      kind: "character",
      base: { file: "limb.mjs".replace("mjs", "mdl") },
      parts: [
        { id: "sleeve", kind: "turn", rings: [[0, 2], [0.5, 2.5], [1, 2]], sides: 10, span: { bones: ["root", "tip"], over: 1 } },
        { id: "cuff", kind: "band", on: { part: "sleeve", s: 0.5 }, width: 1, height: 0.2 },
        { id: "pin", kind: "box", size: [0.5, 0.5, 0.5], attach: { to: "sleeve", toAt: { s: 0.5, angle: 0, out: -1 }, at: "centre" } },
      ],
    },
    { folder },
  ).report;
  sure(banded.ok, `a band on a spanned part: ${[...banded.errors, ...banded.faults]}`);
  const cuff = banded.parts.cuff;
  sure(cuff.to[2] - cuff.from[2] < 1.5, `the band 1 wide, not stretched with the sleeve: ${JSON.stringify(cuff)}`);
  const pin = banded.parts.pin;
  sure(pin.from[0] > 1 && pin.to[0] < 2, `the pin 1 in from the sleeve's front (2.5), not off along its length: ${JSON.stringify(pin)}`);
});

test("a weapon spec: the piece in place of a game's weapon in its v_ and p_ files, the gloved hands kept", () => {
  // a stand-in for a game's files: a first-person model of a glove and a stick, and a world one of the stick
  const meshOn = (build, name) => {
    const M = W.shape(64, 64);
    build(M);
    return { tris: M.tris.map((t) => t.map((c) => ({ ...c, bone: "hand" }))), texture: indexed(W.sheet(64, 64).image(), name) };
  };
  const stick = () => meshOn((M) => M.lathe([[0, 0.5], [12, 0.5]], Z, { sides: 6, caps: [true, true] }), "stick.bmp");
  const glove = meshOn((M) => M.lathe([[-3, 1.5], [0, 1.5]], Z, { sides: 6, caps: [true, true] }), "rubbergloveCHROME.bmp");
  const fileOf = (meshes) =>
    buildMdl({
      name: "x.mdl",
      bones: [{ name: "hand", parent: -1 }, { name: "slide", parent: 0 }],
      bodyparts: [{ name: "studio", models: [{ name: "stick_reference", meshes }] }],
      sequences: [
        { name: "idle", fps: 10, frames: [[[0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]]] },
        { name: "attack", fps: 10, frames: [[[0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]], [[0, 0, 0, 0, 0.5, 0], [-2, 0, 0, 0, 0, 0]]] },
      ],
    });
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, "v_stick.mdl"), fileOf([glove, stick()]));
  writeFileSync(join(folder, "p_stick.mdl"), fileOf([stick()]));
  const spec = {
    spec: "smak.model/1",
    name: "rod.mdl",
    kind: "held",
    weapon: { like: "stick", views: ["v", "p"] },
    parts: [
      { id: "rod", kind: "box", material: "steel", size: [10, 1, 1] },
      { id: "knob", kind: "box", material: "steel", size: [1, 1.4, 1.4], at: [5, 0, 0.5], bone: "slide" },
    ],
  };
  const { report, files } = buildModelSpec(spec, { folder });
  sure(report.ok && files.length === 2, `two files: ${[...report.errors, ...report.faults]}`);
  const v = files.find((f) => f.name === "v_stick.mdl");
  const meshes = smak.readMdl(v.mdl).bodyparts[0].models[0].meshes;
  const gloveMesh = meshes.find((m) => /glove/i.test(m.texture.name));
  const rodMesh = meshes.find((m) => m.numtris && !/glove/i.test(m.texture.name));
  sure(gloveMesh?.numtris === glove.tris.length, `the glove is kept as it was: ${gloveMesh?.numtris} of ${glove.tris.length}`);
  sure(rodMesh?.numtris === 24 && rodMesh.texture.name === "rod_v.bmp", `the rod in the stick's place: ${rodMesh?.numtris} triangles on ${rodMesh?.texture.name}`);
  // the knob names the game's bone it moves with: its corners are on it, the rod's on the hand
  const onBone = new Set(smak.posed(v.mdl, {}).tris.filter((t) => t.tex?.name === "rod_v.bmp").flatMap((t) => t.c.map((c) => c.bone)));
  sure(onBone.has(0) && onBone.has(1), `the rod on the hand and the knob on the slide: bones ${[...onBone]}`);
  sure(smak.sequences(v.mdl).length === 2, "the game's animations kept");
  sure(/v_stick\.mdl \(first person\)/.test(report.facts.join("\n")), "the report says what each file became");
  // the turn told, where the outline cannot choose
  const turned = buildModelSpec({ ...spec, weapon: { ...spec.weapon, turn: { v: "z" } } }, { folder }).report;
  sure(/v_stick\.mdl[^\n]*laid turned about z/.test(turned.facts.join("\n")), `the turn told is the turn taken: ${turned.facts.join(" | ")}`);
  // an animation of its own in place of the game's, by name: the same place in the list, made from keys
  const animated = buildModelSpec(
    { ...spec, weapon: { ...spec.weapon, animations: [{ replace: "attack", from: "idle", frames: 5, fps: 10, keys: [{ at: 0 }, { at: 2, turn: { hand: { z: 40 } } }, { at: 4 }] }] } },
    { folder },
  );
  sure(animated.report.ok, [...animated.report.errors, ...animated.report.faults].join("; "));
  const swung = animated.files.find((f) => f.name === "v_stick.mdl").mdl;
  const list = smak.sequences(swung);
  sure(list.map((s) => s.name).join() === "idle,attack" && list[1].frames === 5 && list[1].fps === 10, `attack replaced where it was: ${JSON.stringify(list)}`);
  const middle = smak.readSequence(swung, "attack").frames[2][0];
  sure(Math.abs(Math.abs(middle[5]) - (40 * Math.PI) / 180) < 0.02, `the hand turned 40 degrees in the middle: ${middle}`);
  // a key aimed: where on the first-person screen the weapon's far end is to be, the turns found for it
  const aimed = buildModelSpec(
    { ...spec, weapon: { ...spec.weapon, animations: [{ replace: "attack", from: "idle", frames: 3, keys: [{ at: 0 }, { at: 1, aim: [0, 0.3] }, { at: 2 }], bones: ["hand", "slide"] }] } },
    { folder },
  ).report;
  const said = aimed.facts.find((f) => /attack frame 1 aimed at 0 0.3/.test(f)) ?? "";
  const end = /the far end at (-?[\d.]+) (-?[\d.]+)/.exec(said);
  sure(aimed.ok && end && Math.abs(Number(end[1])) < 0.05 && Math.abs(Number(end[2]) - 0.3) < 0.05, `the rod's end raised to 0.3 of the screen: ${said} ${aimed.errors}`);
  const rig = smak.animate.rigOf(swung);
  const values = smak.readSequence(swung, "attack").frames[2];
  const back = smak.animate.valuesOf(rig, smak.animate.poseOfValues(rig, values));
  sure(back.every((bone, i) => bone.every((v, k) => Math.abs(v - values[i][k]) < 1e-3)), "a frame's numbers made a pose and back are the same");
  const missing = buildModelSpec({ ...spec, weapon: { like: "spear" } }, { folder }).report;
  sure(!missing.ok && /v_spear\.mdl is neither beside the spec nor in the game folders/.test(missing.errors.join()), missing.errors.join());
});

test("a model spec's smooth: a thin tube of four sides shaded round shares its normals (the skeleton's ribs)", () => {
  const tube = (smooth) => ({ spec: "smak.model/1", name: "rib.mdl", kind: "prop", ...(smooth ? { smooth } : {}), parts: [{ id: "rib", kind: "tube", sides: 4, path: [[0, 0, 1, 0.5], [5, 0, 3, 0.5], [10, 0, 1, 0.5]] }] });
  const normals = (spec) => smak.readMdl(buildModelSpec(spec).mdl).bodyparts[0].models[0].numnorms;
  const flat = normals(tube());
  const round = normals(tube(100));
  sure(round < flat * 0.7, `fewer normals shaded round: ${round} against ${flat}`);
  sure(/smooth: the angle in degrees/.test(validateModelSpec({ ...tube(), smooth: 400 }).errors.join()), "an angle over 180 is refused");
});

test("a model spec's print: words on a box's face, in their ink, over its material, the right way round", () => {
  const spec = { spec: "smak.model/1", name: "sign.mdl", kind: "prop", finish: false, materials: { board: { base: "paint", tone: [0.9, 0.85, 0.6] } }, parts: [{ id: "sign", kind: "box", material: "board", size: [2, 40, 14], print: { text: "OPEN", face: "front", ink: [0.8, 0.05, 0.05] } }] };
  const { mdl, report } = buildModelSpec(spec);
  sure(report.ok, [...report.errors, ...report.faults].join("; "));
  // the front face drawn: red letters on the cream board, and no other colour (a channel written off its
  // pixel turned the board cyan before the sheet kept to whole pixels)
  const front = smak.render(mdl, { seq: 0, yaw: 0, pitch: 0, width: 200, height: 80, light: false });
  let red = 0;
  let cream = 0;
  let other = 0;
  for (let i = 0; i < front.rgba.length; i += 4) {
    const [r, g, b] = front.rgba.subarray(i, i + 3);
    if (r > 150 && g < 60 && b < 60) red++;
    else if (r > 180 && g > 170 && b > 100 && b < 190) cream++;
    else if (!(Math.abs(r - 58) < 6 && Math.abs(g - 62) < 6 && Math.abs(b - 70) < 6)) other++;
  }
  sure(red > 40 && cream > 1000 && other < cream * 0.15, `red letters on cream: ${red} red, ${cream} cream, ${other} other`);
});

test("a model spec's panels: drawers and pulls painted on a box's face, in relief that costs no triangle", () => {
  const box = (panels) => ({ spec: "smak.model/1", name: "cab.mdl", kind: "prop", finish: false, materials: { paint: { base: "paint", tone: [0.6, 0.6, 0.6] } }, parts: [{ id: "body", kind: "box", size: [20, 20, 40], material: "paint", panels }] });
  const plain = buildModelSpec(box([]));
  const drawer = buildModelSpec(box([{ face: "front", at: [10, 30], size: [16, 12], edge: 1 }, { face: "front", at: [10, 32], size: [4, 2], style: "raised", material: { base: "paint", tone: [0.95, 0.1, 0.1] } }]));
  sure(drawer.report.ok && Object.values(drawer.report.parts)[0].tris === 12, `still a box of 12 triangles: ${JSON.stringify(drawer.report.parts)}`);
  // the front: the red pull high up (the panel's y counts up from the face's bottom), nothing red on the back
  const red = (mdl, yaw) => {
    const front = smak.render(mdl, { seq: 0, yaw, pitch: 0, width: 100, height: 200, light: false });
    let top = 0;
    let bottom = 0;
    for (let i = 0; i < front.rgba.length; i += 4)
      if (front.rgba[i] > 180 && front.rgba[i + 1] < 80) (i / 4 / 100 < 100 ? top++ : bottom++);
    return { top, bottom };
  };
  const f = red(drawer.mdl, 0);
  const b = red(drawer.mdl, 180);
  sure(f.top > 20 && f.bottom === 0 && b.top + b.bottom === 0, `the pull on the front's upper half: front ${JSON.stringify(f)}, back ${JSON.stringify(b)}`);
  // the drawer's bevel darkens part of the face against the plain box
  const grey = (mdl) => smak.render(mdl, { seq: 0, yaw: 0, pitch: 0, width: 100, height: 200, light: false }).rgba.reduce((s, v, i) => (i % 4 === 0 && v > 20 && v < 120 ? s + 1 : s), 0);
  sure(grey(drawer.mdl) > grey(plain.mdl) + 50, `a bevel's shadow: ${grey(drawer.mdl)} dark dots against ${grey(plain.mdl)}`);
  const bad = validateModelSpec(box([{ face: "side", at: [1], size: [0, 2] }]));
  sure(bad.errors.length >= 3, bad.errors.join("; "));
});

test("a model spec's project: a person's picture of the front laid onto the faces that look that way, the rest left", () => {
  // a picture of a box's front: grey background, the box's outline red on its left half and blue on its right
  const W = 200;
  const H = 300;
  const rgb = new Uint8Array(W * H * 3);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const inside = x >= 50 && x < 150 && y >= 50 && y < 250;
      rgb.set(!inside ? [58, 62, 70] : x < 100 ? [220, 30, 30] : [30, 30, 220], (y * W + x) * 3);
    }
  const folder = mkdtempSync(join(tmpdir(), "smak-project-"));
  writeFileSync(join(folder, "front.png"), smak.png(W, H, (() => { const rgba = new Uint8Array(W * H * 4); for (let i = 0; i < W * H; i++) rgba.set([...rgb.subarray(i * 3, i * 3 + 3), 255], i * 4); return rgba; })()));
  const spec = { spec: "smak.model/1", name: "p.mdl", kind: "prop", finish: false, parts: [{ id: "b", kind: "box", size: [10, 10, 20], material: { base: "paint", tone: [0.1, 0.8, 0.1] } }], project: [{ picture: "front.png", view: "front" }] };
  const { mdl, report } = buildModelSpec(spec, { folder });
  sure(report.ok && report.facts.some((f) => /projected over \d+ texels.*outline at 50 50 150 250/.test(f)), [...report.errors, ...report.facts.filter((f) => /projected/.test(f))].join("; "));
  // from the front: red on the viewer's left, blue on the right; from the back: the box's own green
  const shot = (yaw) => smak.render(mdl, { seq: 0, yaw, pitch: 0, width: 100, height: 100, light: false });
  const at = (pic, x, y) => [...pic.rgba.subarray((y * 100 + x) * 4, (y * 100 + x) * 4 + 3)];
  const front = shot(0);
  const back = shot(180);
  const [l, r, b] = [at(front, 40, 50), at(front, 60, 50), at(back, 50, 50)];
  sure(l[0] > 150 && l[2] < 80 && r[2] > 150 && r[0] < 80 && b[1] > 150 && b[0] < 80, `front left ${l}, front right ${r}, back ${b}`);
});

await testAsync("a sprite spec: a looping flame and a one-shot fireball, written, read back, measured against the game's kinds", "build: sprite", async () => {
  const work = mkdtempSync(join(tmpdir(), "smak-sprite-"));
  const spec = {
    spec: "smak.sprite/1",
    sprites: [
      { name: "sprites/torch.spr", class: "fire loop", size: [32, 64], frames: 12, loop: true, fps: 10, origin: "bottom", layers: [{ kind: "fire" }] },
      { name: "sprites/boom.spr", class: "explosion", use: "tempent", size: [64, 64], frames: 12, layers: [{ kind: "explosion", env: { attack: 0.05 } }] },
    ],
  };
  const build = toolsFor({ work }).find((tool) => tool.name === "build");
  const answer = await build.call({ spec: JSON.stringify(spec) });
  const words = answer.find((piece) => piece.type === "text").text;
  sure(/^OK/.test(words) && /fire loop: \d+ of \d+ in range/.test(words), words.slice(0, 600));
  const torch = smak.maps.readSpr(readFileSync(join(work, "sprites", "torch.spr")));
  // a loop of 12 written as 13, its first frame again at the end; additive with pure black at index 0
  sure(torch.frames.length === 13 && torch.format === "additive" && torch.palette[0] + torch.palette[1] + torch.palette[2] === 0, `${torch.frames.length} frames, ${torch.format}`);
  sure(Buffer.compare(Buffer.from(torch.frames[0].pixels), Buffer.from(torch.frames[12].pixels)) === 0, "the loop's last frame is its first");
  // a flame stands on its base: its frame's top is its height over the point it is put at
  sure(torch.frames[0].up === 64 && torch.frames[0].left === -16, `origin ${torch.frames[0].left} ${torch.frames[0].up}`);
  // the fireball starts and ends dark
  const boom = smak.maps.readSpr(readFileSync(join(work, "sprites", "boom.spr")));
  const bright = (f) => f.pixels.reduce((s, p) => s + boom.palette[p * 3], 0);
  sure(bright(boom.frames[0]) < bright(boom.frames[4]) / 20 && bright(boom.frames.at(-1)) < bright(boom.frames[4]) / 20, "dark, bright, dark");
  sure(existsSync(join(work, "sprites", "torch-animated.png")), "an animated picture beside it");
});

await testAsync("a sprite file written is the file read: Half-Life's own, where the game is there, byte for byte", "spr: round trip", async () => {
  const { writeSpr } = await import("../src/sprite/spr.mjs");
  // a group and a single frame, written and read back
  const frame = (v) => ({ left: -4, up: 4, width: 8, height: 8, pixels: new Uint8Array(64).fill(v) });
  const bytes = writeSpr({ type: "oriented", format: "alpha test", palette: new Uint8Array(768).fill(7), frames: [frame(1), frame(2), frame(3)], groups: [{ first: 1, count: 2, ends: [0.1, 0.25] }] });
  const back = smak.maps.readSpr(bytes);
  sure(back.type === "oriented" && back.frames.length === 3 && back.groups[0].count === 2 && Math.abs(back.groups[0].ends[1] - 0.25) < 1e-6 && Buffer.compare(writeSpr(back), bytes) === 0, JSON.stringify(back.groups));
  const game = join(process.env.HOME ?? "", ".steam/steam/steamapps/common/Half-Life/valve/sprites");
  if (!existsSync(game)) return;
  const files = readdirSync(game).filter((f) => f.endsWith(".spr"));
  const differ = files.filter((f) => Buffer.compare(writeSpr(smak.maps.readSpr(readFileSync(join(game, f)))), readFileSync(join(game, f))) !== 0);
  sure(!differ.length, `${differ.length} of ${files.length} differ: ${differ.slice(0, 5)}`);
});

await testAsync("a textures spec: a .wad of named textures, seamless, with panels and words; built through the server", "build: wad", async () => {
  const work = mkdtempSync(join(tmpdir(), "smak-wad-"));
  const spec = {
    spec: "smak.wad/1",
    name: "mine.wad",
    materials: { conc: { base: "plaster", tone: [0.55, 0.55, 0.52] } },
    textures: [
      { name: "wall_a", size: [128, 64], material: "conc", grime: 0.5, panels: [{ at: [64, 32], size: [100, 40], style: "inset", edge: 2 }] },
      { name: "{grate", size: [64, 64], material: { base: "mesh", cell: 6 } },
    ],
  };
  const build = toolsFor({ work }).find((tool) => tool.name === "build");
  const answer = await build.call({ spec: JSON.stringify(spec) });
  const words = answer.find((piece) => piece.type === "text").text;
  sure(/^OK/.test(words) && existsSync(join(work, "mine", "mine.wad")), words.slice(0, 300));
  const wad = smak.maps.readWad(readFileSync(join(work, "mine", "mine.wad")));
  sure(wad.textures.map((t) => `${t.name} ${t.width}x${t.height}`).join(", ") === "wall_a 128x64, {grate 64x64", wad.textures.map((t) => t.name).join());
  // seamless across its sides: the left column follows on from the right where no panel is (the top row)
  const wall = wad.textures[0];
  const rgb = (x, y) => wall.palette.subarray(wall.pixels[y * 128 + x] * 3, wall.pixels[y * 128 + x] * 3 + 3);
  const jump = Math.abs(rgb(0, 2)[0] - rgb(127, 2)[0]);
  sure(jump < 40, `the left edge meets the right: a step of ${jump}`);
  // the grate has holes: the last colour of its palette, much of it
  const holes = wad.textures[1].pixels.filter((i) => i === 255).length / wad.textures[1].pixels.length;
  sure(holes > 0.3, `a grate of holes: ${holes}`);
  const bad = validateWadSpec({ spec: "smak.wad/1", name: "x.wad", textures: [{ name: "a name far too long", size: [100, 64] }] });
  sure(bad.errors.length >= 2, bad.errors.join("; "));
});

test("a model spec's paint: drawers and pulls built, then baked into the box under them: their colours, no triangles", () => {
  const spec = (paint) => ({ spec: "smak.model/1", name: "cab.mdl", kind: "prop", budget: 30, finish: false, parts: [
    { id: "body", kind: "box", size: [20, 20, 40], material: { base: "paint", tone: [0.5, 0.5, 0.5] } },
    { id: "pull", kind: "box", size: [0.8, 6, 2], material: { base: "paint", tone: [0.95, 0.1, 0.1] }, paint, attach: { to: "body", toAt: "front", at: "back", offset: [0, 0, 8] } },
  ] });
  const built = buildModelSpec(spec(false));
  const painted = buildModelSpec(spec(true));
  sure(painted.report.ok && painted.report.facts.some((f) => /painted, not built: pull \(12 triangles left out/.test(f)), [...painted.report.errors, ...painted.report.faults, ...painted.report.facts].join("; "));
  sure(built.report.faults.length === 0 && /24 triangles of a budget of 30/.test(built.report.facts.join(" ")), built.report.facts.join("; "));
  // the red pull on the front of the 12-triangle box
  const front = smak.render(painted.mdl, { seq: 0, yaw: 0, pitch: 0, width: 100, height: 200, light: false });
  let red = 0;
  for (let i = 0; i < front.rgba.length; i += 4) if (front.rgba[i] > 180 && front.rgba[i + 1] < 60) red++;
  sure(red > 15, `the pull painted on the front: ${red} red dots`);
  // over a budget is a fault
  const over = buildModelSpec({ ...spec(false), budget: 20 });
  sure(over.report.faults.some((f) => /^over budget: 24 triangles of a budget of 20/.test(f)), over.report.faults.join("; "));
});

test("a model spec's round parts are shaded round whatever their sides: an 8-sided post has a normal a corner", () => {
  const post = (smooth) => buildModelSpec({ spec: "smak.model/1", name: "post.mdl", kind: "prop", finish: false, parts: [{ id: "post", kind: "cylinder", radius: 4, height: 30, sides: 8, material: "paint", ...(smooth === undefined ? {} : { smooth }) }] });
  const normals = (mdl) => smak.readMdl(mdl).bodyparts[0].models[0].numnorms;
  const round = normals(post().mdl);
  const flat = normals(post(10).mdl);
  // round: one normal at each of its 16 corners and one a cap; flat: one a face (8 round it and the 2 caps)
  sure(round === 18 && flat === 10, `round ${round} normals (18 wanted), flat ${flat} (10)`);
});

test("colours in words: the XKCD names with their modifiers, and a colour as it shows in a picture", async () => {
  const { colourFromWords } = await import("../src/spec/colours.mjs");
  const { toLab } = await import("../src/spec/colours.mjs");
  const grey = toLab(colourFromWords("grey").rgb);
  const dark = toLab(colourFromWords("dark grey").rgb);
  const warm = toLab(colourFromWords("warm grey").rgb);
  sure(dark[0] < grey[0] - 10 && warm[2] > grey[2] + 3, `dark grey L ${dark[0].toFixed(1)} under grey's ${grey[0].toFixed(1)}; warm grey b ${warm[2].toFixed(1)} over ${grey[2].toFixed(1)}`);
  sure(colourFromWords("nothing at all") === null, "no colour named: none made up");
  // a material's colour in words; and one given as seen in a picture, divided by the pictures' light
  sure(materialOf({ base: "paint", tone: "teal" }).tone[2] > 0.4 && materialOf({ base: "paint", seen: [0.4, 0.4, 0.4] }).tone[0] === 0.5, "words, and seen");
});

test("a model spec's marks: stripes painted on a turned part, on its side only, round it as a ring; none on a box", () => {
  const post = (marks) => ({ spec: "smak.model/1", name: "post.mdl", kind: "prop", finish: false, materials: { fur: { base: "paint", tone: [0.95, 0.55, 0.12] } }, parts: [{ id: "post", kind: "cylinder", radius: 6, height: 30, sides: 16, material: "fur", marks }] });
  const dark = (spec) => {
    const { mdl, report } = buildModelSpec(spec);
    sure(report.ok, [...report.errors, ...report.faults].join("; "));
    const front = smak.render(mdl, { seq: 0, yaw: 0, pitch: 0, width: 120, height: 160, light: false });
    let count = 0;
    for (let i = 0; i < front.rgba.length; i += 4) if (front.rgba[i] < 40 && front.rgba[i + 1] < 40 && front.rgba[i + 2] < 40) count++;
    return count;
  };
  const ring = dark(post([{ path: [[0.5, 0], [0.5, 360]], width: 4 }]));
  const behind = dark(post([{ path: [[0.2, 180], [0.8, 180]], width: 4 }]));
  const none = dark(post([]));
  sure(ring > 300 && behind === none, `a ring shows from the front (${ring} dark dots), a stripe behind does not (${behind} against ${none})`);
  const box = validateModelSpec({ spec: "smak.model/1", name: "b.mdl", parts: [{ id: "b", kind: "box", size: [4, 4, 4], marks: [{ path: [[0, 0], [1, 0]] }] }] });
  sure(box.errors.some((e) => /marks are painted on a turned part/.test(e)), box.errors.join("; "));
});

test("a model spec's finish: a box's edges worn lighter than its middle, its foot dirtier; none when told", () => {
  const spec = (finish, partFinish) => ({
    spec: "smak.model/1",
    name: "crate.mdl",
    kind: "prop",
    ...(finish === undefined ? {} : { finish }),
    materials: { flat: { base: "paint", tone: [0.5, 0.5, 0.5] } },
    parts: [{ id: "crate", kind: "box", material: "flat", size: [16, 16, 16], ...(partFinish === undefined ? {} : { finish: partFinish }) }],
  });
  // the picture of the box's front face (+x), sampled at its middle, near its top edge and near its foot
  const lightAt = (mdl) => {
    const P = smak.posed(mdl, {});
    const tex = smak.textureOf(mdl, smak.readMdl(mdl).textures[0].name);
    const front = P.tris.filter((t) => t.c.every((c) => c.p[0] > 7.99));
    const sample = (z) => {
      // the texel of the front face nearest (8, 0, z), by its corners' places and texture places
      const t = front.find((t) => { const zs = t.c.map((c) => c.p[2]); return z >= Math.min(...zs) && z <= Math.max(...zs); });
      const [a, b, c] = t.c;
      const solve = (q) => { const d = (b.p[1] - a.p[1]) * (c.p[2] - a.p[2]) - (c.p[1] - a.p[1]) * (b.p[2] - a.p[2]); const w1 = ((q[1] - a.p[1]) * (c.p[2] - a.p[2]) - (c.p[1] - a.p[1]) * (q[2] - a.p[2])) / d; const w2 = ((b.p[1] - a.p[1]) * (q[2] - a.p[2]) - (q[1] - a.p[1]) * (b.p[2] - a.p[2])) / d; return [1 - w1 - w2, w1, w2]; };
      const w = solve([8, 0, z]);
      const u = Math.round(a.u * w[0] + b.u * w[1] + c.u * w[2]);
      const v = Math.round(a.v * w[0] + b.v * w[1] + c.v * w[2]);
      const k = tex.pixels[v * tex.width + u] * 3;
      return (tex.palette[k] + tex.palette[k + 1] + tex.palette[k + 2]) / 3;
    };
    return { middle: sample(8), edge: sample(15.9), foot: sample(1.5) };
  };
  const finished = lightAt(buildModelSpec(spec()).mdl);
  sure(finished.edge > finished.middle + 8, `the top edge worn lighter than the middle: ${JSON.stringify(finished)}`);
  sure(finished.foot < finished.middle, `the foot dirtier than the middle: ${JSON.stringify(finished)}`);
  const plain = lightAt(buildModelSpec(spec(false)).mdl);
  const partPlain = lightAt(buildModelSpec(spec(undefined, false)).mdl);
  sure(Math.abs(plain.edge - plain.middle) < 6 && JSON.stringify(plain) === JSON.stringify(partPlain), `no finish, by the spec or by the part: ${JSON.stringify(plain)} ${JSON.stringify(partPlain)}`);
  const wrong = validateModelSpec({ ...spec({ wear: 2 }) });
  sure(/finish: false \(none\), or \{ light, wear, grime, vary \}/.test(wrong.errors.join()), wrong.errors.join());
});

test("a mesh material: a net is a masked texture with holes, seen through by design and not as a fault", () => {
  const { mdl, report } = buildModelSpec({
    spec: "smak.model/1",
    name: "net.mdl",
    kind: "prop",
    materials: { cord: { base: "mesh", tone: [0.1, 0.1, 0.1], cell: 2 } },
    parts: [
      { id: "post", kind: "cylinder", material: "steel", radius: 1, height: 40 },
      { id: "net", kind: "leaf", material: "cord", rows: [[[0, 0, 0], [0, 40, 0]], [[0, 0, 30], [0, 40, 30]]] },
      { id: "basket", kind: "turn", material: "cord", sides: 12, rings: [[0, 4], [8, 6]], caps: [false, false], open: true, at: [10, 20, 20] },
    ],
  });
  sure(report.ok, `a net and a basket of mesh: ${[...report.errors, ...report.faults]}`);
  const net = smak.readMdl(mdl).textures.find((tex) => tex.flags & 64);
  const pixels = smak.textureOf(mdl, net.name).pixels;
  const holes = pixels.filter((i) => i === 255).length / pixels.length;
  sure(holes > 0.3 && holes < 0.95, `the net's picture is masked, with holes: ${(holes * 100).toFixed(0)}% of it`);
});

test("a change request's report: added, taken away, moved, swapped where it stood, recoloured, and the rest left", () => {
  const thing = (key, room, at, what = "props") => [key, { key, what, room, at, turn: 0 }];
  const before = {
    kind: "map",
    materials: { lawn: { base: "grass" } },
    rooms: { yard: { min: [0, 0, 0], max: [512, 512, 256] } },
    things: Object.fromEntries([thing("props tree_summer #1", "yard", [100, 100, 0]), thing("props bench #1", "yard", [200, 50, 0]), thing("props bush #1", "yard", [300, 300, 0]), thing("props lamp #1", "yard", [400, 400, 0])]),
  };
  const after = {
    kind: "map",
    materials: { lawn: { base: "snow" } },
    rooms: before.rooms,
    things: Object.fromEntries([thing("props tree_winter #1", "yard", [100, 100, 0]), thing("props bench #1", "yard", [260, 50, 0]), thing("props lamp #1", "yard", [400, 400, 0]), thing("props swing #1", "yard", [50, 450, 0])]),
  };
  const { lines, changed, still } = changesOf(before, after);
  const text = lines.join("\n");
  sure(/things swapped where they stood: props tree_summer #1 for props tree_winter #1 in yard at 100 100 0/.test(text), text);
  sure(/things added: props swing #1/.test(text) && !/things added:[^\n]*tree_winter/.test(text), text);
  sure(/things taken away: props bush #1$/m.test(text), text);
  sure(/things moved or turned: props bench #1 from 200 50 0 to 260 50 0/.test(text), text);
  sure(/materials changed: lawn/.test(text), text);
  sure(changed === 5 && still === 2, `5 changes (swap, add, take away, move, recolour), the room and the lamp left: ${changed} ${still}`);
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
      textures: { pink: { base: "neon", tone: [1, 0.2, 0.7] }, fence: { base: "mesh", tone: [0.5, 0.5, 0.5], cell: 6 } },
      rooms: [
        { id: "yard", size: [384, 256, 256], sky: true, surfaces: { floor: "grass", walls: "brick" } },
        { id: "pool", size: [256, 256, 128], place: { north_of: "yard" }, water: 32 },
      ],
      links: [{ between: ["yard", "pool"], kind: "opening" }, { between: ["yard", "pool"], kind: "window", along: 0.8, glass: true }],
      furniture: [
        { box: [32, 32, 32], room: "yard", at: [100, 0], entity: { class: "func_breakable", material: 1 } },
        { box: [64, 4, 16], room: "yard", at: [0, -124], z: 96, texture: "pink" },
        { box: [96, 2, 48], room: "yard", at: [-120, -60], texture: "fence" },
      ],
      entities: [{ class: "info_player_start", room: "yard", at: "centre" }],
      models: { post: { spec: "smak.model/1", parts: [{ id: "post", kind: "cylinder", radius: 2, height: 40 }] } },
      props: [{ model: "post", room: "yard", at: [-100, 60] }],
    },
    { out, compilers: { found: false, message: "no compilers in this test" } },
  );
  // the models it builds, drawn one by one and named
  const gallery = smak.unpng(readFileSync(files.models));
  sure(gallery.width === 192 && gallery.height === 192, `a gallery of its models: ${gallery.width}x${gallery.height}`);
  sure(report.errors.length === 0, report.errors.join("; "));
  sure(report.faults.length === 1 && /not compiled/.test(report.faults[0]), `only the compile is wanting: ${report.faults}`);
  const text = readFileSync(files.map, "utf8");
  sure(/"classname" "func_breakable"[\s\S]*"rendermode" "2"/.test(text), "a glass pane, a func_breakable half see-through");
  sure(/"material" "1"/.test(text), "the crate a breakable of wood");
  sure(/"classname" "func_wall"\n"rendermode" "4"\n"renderamt" "255"[^}]*\{\n[^}]*\{SM_FENCE/.test(text), "a fence of mesh, a func_wall in render mode 4");
  sure(/!SM_WATER/.test(text) && /"classname" "info_texlights"[\s\S]*"SM_PINK"/.test(text), "water, and the neon a texture light");
  sure(/"_diffuse_light"/.test(text), "a night sky's own light under the moon's");
  const wad = smak.maps.readWad(readFileSync(files.wad));
  sure(["SM_GRASS", "SM_BRICK", "!SM_WATER", "SM_PINK", "SKY", "{SM_FENCE"].every((name) => wad.textures.some((t) => t.name.toUpperCase() === name)), `the wad: ${wad.textures.map((t) => t.name)}`);
  // the fence's holes are the last colour of its palette, and they are most of it
  const fence = wad.textures.find((t) => t.name.toUpperCase() === "{SM_FENCE");
  const holes = fence.pixels.filter((i) => i === 255).length / fence.pixels.length;
  sure(holes > 0.4 && holes < 0.9, `a fence is mostly holes: ${holes}`);
  // chain-link's cords run on the diagonals: the diagonal through a crossing is all cord, as a square grid's is not
  const solid = (picture) => Array.from({ length: 32 }, (_, i) => picture.rgba[(i * picture.width + i) * 4 + 3]).every((a) => a === 255);
  sure(solid(surfacePicture({ base: "mesh", cell: 6, weave: "diamond" }, 128)) && !solid(surfacePicture({ base: "mesh", cell: 6 }, 128)), "a diamond weave");
  // a map's picture tiles: its left column follows on from its right
  const picture = surfacePicture(materialOf("brick"), 64);
  const step = (x0, x1) => Math.abs(picture.rgb[(10 * 64 + x0) * 3] - picture.rgb[(10 * 64 + x1) * 3]);
  sure(step(63, 0) < 80, "a picture laid side by side shows no seam");
});

test("a map spec's building stands in the open: a shell of its own material, a gable roof, ways out through its walls", () => {
  const spec = {
    spec: "smak.map/1",
    name: "house",
    rooms: [
      { id: "yard", size: [1024, 896, 384], sky: true, surfaces: { floor: "grass" } },
      { id: "living", size: [320, 256, 112], floor: 8, place: { in: "yard", offset: [256, 256], stand: true } },
      { id: "kitchen", size: [192, 256, 112], place: { east_of: "living" } },
    ],
    links: [
      { between: ["living", "yard"], kind: "door", side: "south" },
      { between: ["living", "kitchen"], kind: "opening" },
      { between: ["kitchen", "yard"], kind: "window", side: "east", glass: true },
    ],
    entities: [
      { class: "info_player_start", room: "yard", at: [0, -300], facing: "north" },
      { class: "item_healthkit", room: "kitchen", at: "centre" },
    ],
  };
  const { report, files } = buildMapSpec(spec, { out: join(folder, "house"), compilers: { found: false, message: "no compilers in this test" } });
  sure(report.errors.length === 0, report.errors.join("; "));
  sure(/building living: living, kitchen, standing in yard, its outside siding, a gable roof of shingles/.test(report.facts.join("\n")), report.facts.join(" | "));
  sure(/all \d+ entities a player goes to are reached on foot/.test(report.facts.join("\n")), "the kitchen is walked into from the yard, through the front door");
  const text = readFileSync(files.map, "utf8");
  sure(/SM_OUTSIDE/.test(text) && /SM_ROOF/.test(text), "its outside and its roof wear their own textures");
  // taken into a larger map as a module: its theme's words, a theme word naming its own texture, and its
  // doors' material come with it under its prefix
  writeFileSync(join(folder, "house-module.json"), JSON.stringify({ ...spec, theme: { door: "oak", outside: "blue" }, textures: { oak: { base: "wood" }, blue: { base: "siding", tone: [0.5, 0.6, 0.9] } } }));
  const town = buildMapSpec(
    {
      spec: "smak.map/1",
      name: "town",
      rooms: [{ id: "road", size: [1024, 256, 320], sky: true }],
      include: [{ spec: "house-module.json", as: "h", place: { north_of: "road" } }],
      links: [{ between: ["h_yard", "road"], kind: "opening" }],
      entities: [{ class: "info_player_start", room: "road", at: "centre" }],
    },
    { out: join(folder, "town"), folder, compilers: { found: false, message: "" } },
  );
  sure(town.report.errors.length === 0, town.report.errors.join("; "));
  const townText = readFileSync(town.files.map, "utf8");
  sure(/"classname" "func_door"\n(?:"[^\n]*\n)*\{\n[^\n]*SM_H_OAK/.test(townText) && /SM_H_BLUE/.test(townText), "the module's door and outside are its own");
  // the same town in winter: a word replaced in every module, a model for every prop of another
  const cone = { spec: "smak.model/1", parts: [{ id: "cone", kind: "cylinder", radius: 8, top: 0.5, height: 30 }] };
  const ball = { spec: "smak.model/1", parts: [{ id: "ball", kind: "sphere", radius: 10 }] };
  writeFileSync(join(folder, "house-trees.json"), JSON.stringify({ ...JSON.parse(readFileSync(join(folder, "house-module.json"))), models: { tree: ball }, props: [{ model: "tree", room: "yard", at: [-400, -350] }] }));
  const winter = buildMapSpec(
    {
      spec: "smak.map/1",
      name: "winter",
      rooms: [{ id: "road", size: [1024, 256, 320], sky: true }],
      include: [{ spec: "house-trees.json", as: "h", place: { north_of: "road" } }],
      links: [{ between: ["h_yard", "road"], kind: "opening" }],
      entities: [{ class: "info_player_start", room: "road", at: "centre" }],
      models: { bare: cone },
      replace: { textures: { outside: { base: "snow" } }, models: { tree: "bare" } },
    },
    { out: join(folder, "winter"), folder, compilers: { found: false, message: "" } },
  ).report;
  sure(winter.errors.length === 0, winter.errors.join("; "));
  sure(winter.facts.includes("replaced outside: h_outside") && winter.facts.includes("replaced the model tree by bare: 1 props"), winter.facts.join(" | "));
  sure(winter.placed.some((thing) => thing.name === "bare") && !winter.placed.some((thing) => /tree/.test(thing.name)), "the tree is the bare one");
  const wrong = buildMapSpec({ spec: "smak.map/1", name: "w2", rooms: [{ id: "road", size: [512, 256, 320], sky: true }], entities: [{ class: "info_player_start", room: "road", at: "centre" }], replace: { textures: { lawn: { base: "snow" } }, models: { tree: "bare" } } }, { out: join(folder, "w2"), compilers: { found: false, message: "" } }).report;
  sure(wrong.errors.some((e) => /replace.textures.lawn: no texture/.test(e)) && wrong.errors.some((e) => /replace.models.tree: "bare" is none of the spec's models/.test(e)), wrong.errors.join("; "));
  // a model the map and its module both have from one file is one model, built once
  writeFileSync(join(folder, "post.json"), JSON.stringify({ spec: "smak.model/1", parts: [{ id: "post", kind: "cylinder", radius: 2, height: 40 }] }));
  writeFileSync(join(folder, "posts-module.json"), JSON.stringify({ spec: "smak.map/1", rooms: [{ id: "plot", size: [256, 256, 128], sky: true }], models: { post: { file: "post.json" } }, props: [{ model: "post", room: "plot", at: "centre" }], entities: [] }));
  const merged = withIncludes({ spec: "smak.map/1", rooms: [{ id: "road", size: [512, 256, 128], sky: true }], models: { lamp: { file: "post.json" } }, props: [{ model: "lamp", room: "road", at: "centre" }], include: [{ spec: "posts-module.json", as: "p", place: { north_of: "road" } }] }, folder);
  sure(Object.keys(merged.models).join() === "lamp" && merged.props.every((thing) => thing.model === "lamp"), `one model for one file: ${JSON.stringify(merged.models)} ${JSON.stringify(merged.props)}`);
  const wad = smak.maps.readWad(readFileSync(town.files.wad));
  sure(wad.textures.some((tx) => tx.name.toUpperCase() === "SM_H_BLUE"), `the module's own texture is made: ${wad.textures.map((tx) => tx.name)}`);
  const out = buildMapSpec({ ...spec, rooms: [spec.rooms[0], { ...spec.rooms[1], place: { in: "yard", offset: [900, 256], stand: true } }, spec.rooms[2]] }, { out: join(folder, "house2"), compilers: { found: false, message: "" } }).report;
  sure(out.errors.some((e) => /the building's walls .* reach out of yard/.test(e)), out.errors.join("; "));
  const inside = buildMapSpec({ ...spec, props: [{ model: "bush", room: "yard", at: [-200, -200] }], models: { bush: { spec: "smak.model/1", parts: [{ id: "bush", kind: "sphere", radius: 10 }] } } }, { out: join(folder, "house4"), compilers: { found: false, message: "" } }).report;
  sure(inside.faults.some((f) => /props\[0\] \(bush\) stands \d+ into the building living in yard/.test(f)), `a bush put inside the house: ${inside.faults.join("; ")}`);
  const sideless = buildMapSpec({ ...spec, links: [{ between: ["living", "yard"], kind: "door" }, ...spec.links.slice(1)] }, { out: join(folder, "house3"), compilers: { found: false, message: "" } }).report;
  sure(sideless.errors.some((e) => /side "north", "south", "east" or "west"/.test(e)), sideless.errors.join("; "));
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

test("the compilers' tool textures as SDHLT has them: SKIP leaks, NOCLIP seals, SOLIDHINT is solid to a body", () => {
  const { box, carve, playerStart, pointEntity } = smak.maps;
  // a sealed room, then the same room with its east wall a brush of one tool texture
  const roomWith = (east) => {
    const walls = smak.maps.hollow([0, 0, 0], [256, 256, 128], 16, "WALL");
    walls[3] = box([256, -16, -16], [272, 272, 144], east);
    return { brushes: walls, entities: [playerStart([64, 128, 0], 0)] };
  };
  sure(smak.maps.checkPlan(roomWith("SKIP")).leak, "a wall of SKIP seals nothing");
  sure(!smak.maps.checkPlan(roomWith("NOCLIP")).leak, "a wall of NOCLIP seals (hull 0 keeps it)");
  sure(!smak.maps.checkPlan(roomWith("SOLIDHINT")).leak, "a wall of SOLIDHINT seals");
  // a SOLIDHINT brush across the room stops a body: what is behind it is not reached on foot
  const map = {
    brushes: [...carve([{ min: [0, 0, 0], max: [512, 256, 128] }], 16, "WALL"), box([248, 0, 0], [264, 256, 128], "SOLIDHINT")],
    entities: [playerStart([64, 128, 0], 0), pointEntity("item_battery", [448, 128, 0])],
  };
  sure(smak.maps.reachOf(map).unreached.length === 1, "behind a SOLIDHINT wall is not walked to");
});

test("the compilers' chart of the engine's limits is read; a map spec's furniture is func_detail unless told", async () => {
  const { limitsOf } = await import("../src/maps/compile.mjs");
  const limits = limitsOf("* AllocBlock 5/64\n * worldleaves 771/8192\nclipnodes      2113/32767  16904/262136 (6.4%)");
  sure(limits.allocblock.used === 5 && limits.worldleaves.most === 8192 && limits.clipnodes.used === 2113, JSON.stringify(limits));
  const spec = (as) => ({
    spec: "smak.map/1",
    name: `detail_${as}`,
    rooms: [{ id: "room", size: [256, 256, 128] }],
    furniture: [{ box: [32, 32, 32], room: "room", at: [64, 64], ...(as ? { as } : {}) }],
    entities: [{ class: "info_player_start", room: "room", at: "centre" }],
  });
  const text = (as) => readFileSync(buildMapSpec(spec(as), { out: join(folder, `detail_${as}`), compilers: { found: false, message: "none" } }).files.map, "utf8");
  sure(/"classname" "func_detail"/.test(text()), "unless told, furniture is func_detail");
  sure(!/func_detail/.test(text("world")), "as: world keeps it in the world");
});
