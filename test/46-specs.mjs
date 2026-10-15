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
import { materialOf, surfacePicture, MATERIALS, UNWORN } from "../src/spec/paint.mjs";
import { lookOf, lookFaults, ALLOWED } from "../src/spec/look.mjs";
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
  // a turned part's start on a bone's joint, and the whole stood higher by `floor`
  const capped = buildModelSpec(
    {
      spec: "smak.model/1",
      name: "capped.mdl",
      kind: "character",
      base: { file: "limb.mdl" },
      floor: 10,
      parts: [{ id: "cap", kind: "turn", rings: [[0, 1], [2, 1]], sides: 8, attach: { bone: "tip", at: "start" } }],
    },
    { folder },
  );
  sure(capped.report.ok, `a part's start on a bone: ${[...capped.report.errors, ...capped.report.faults]}`);
  sure(capped.report.facts.some((f) => /floor: the base's feet are at 0; every animation lifted 10/.test(f)), capped.report.facts.join("; "));
  const low = Math.min(...smak.posed(capped.mdl, { seq: 0, frame: 0 }).pose.map((m) => m[2][3]));
  sure(Math.abs(low - 10) < 0.01, `the root at 10 after the lift: ${low}`);
  // a pose: the limb turned a quarter about y in the first animation, and a part on its tip placed where the tip
  // then is (along +x, not up z)
  const turned = buildModelSpec(
    {
      spec: "smak.model/1",
      name: "turned.mdl",
      kind: "character",
      base: { file: "limb.mdl" },
      pose: { keys: { root: { turn: { y: 90 } } } },
      parts: [{ id: "knob", kind: "box", size: [1, 1, 1], attach: { bone: "tip", at: "centre" } }],
    },
    { folder },
  );
  sure(turned.report.ok, [...turned.report.errors, ...turned.report.faults].join("; "));
  const knob = turned.report.parts.knob;
  const mid = knob.from.map((v, k) => (v + knob.to[k]) / 2);
  sure(Math.abs(Math.abs(mid[0]) - 10) < 0.6 && Math.abs(mid[2]) < 0.6, `the tip's knob along x after the turn: ${mid.map((v) => v.toFixed(1))}`);
  // a pose fitted to a picture: a Biped's thigh and calf, built upright, fitted to a side view of it with the
  // thigh swung forward: the fit finds a swing and the outlines come closer
  const leg = buildMdl({
    name: "leg.mdl",
    bones: [{ name: "Bip01", parent: -1 }, { name: "Bip01 L Thigh", parent: 0, pos: [0, 0, 40] }, { name: "Bip01 L Calf", parent: 1, pos: [0, 0, -20] }],
    bodyparts: [{ name: "body", models: [{ name: "b", meshes: [{ tris: [], texture: indexed(W.sheet(16, 16).image(), "b.bmp") }] }] }],
    sequences: [{ name: "idle", fps: 10, frames: [[[0, 0, 0, 0, 0, 0], [0, 0, 40, 0, 0, 0], [0, 0, -20, 0, 0, 0]]] }],
  });
  writeFileSync(join(folder, "leg.mdl"), leg);
  const legSpec = (pose) => ({
    spec: "smak.model/1",
    name: "fitted.mdl",
    kind: "character",
    base: { file: "leg.mdl" },
    pose,
    parts: [
      { id: "thigh", kind: "box", size: [4, 4, 20], material: "cloth", span: ["Bip01 L Thigh", "Bip01 L Calf"] },
      { id: "calf", kind: "box", size: [3, 3, 18], material: "cloth", attach: { bone: "Bip01 L Calf", at: "top" } },
      { id: "hips", kind: "box", size: [8, 10, 6], material: "cloth", at: [0, 0, 40] },
    ],
  });
  const swung = buildModelSpec(legSpec({ keys: { "Bip01 L Thigh": { turn: { y: -40 } } } }), { folder });
  sure(swung.report.ok, [...swung.report.errors, ...swung.report.faults].join("; "));
  const side = smak.render(swung.mdl, { seq: 0, frame: 0, view: "side", width: 256, height: 256 });
  writeFileSync(join(folder, "side.png"), smak.png(side.width, side.height, side.rgba));
  const fitted = buildModelSpec({ ...legSpec({ fit: [{ picture: "side.png", view: "left" }] }) }, { folder });
  const said = fitted.report.facts.find((f) => /pose fitted/.test(f)) ?? "";
  const [before, after] = (said.match(/overlap ([\d.]+) as built, ([\d.]+) fitted/) ?? []).slice(1).map(Number);
  sure(fitted.report.ok && after > before + 0.05, `the fitted outline closer: ${said.slice(0, 200)}`);
  // motion: a three-frame run of the same leg, fitted to a strip of the swung leg's run
  const runLeg = buildMdl({
    name: "runleg.mdl",
    bones: [{ name: "Bip01", parent: -1 }, { name: "Bip01 L Thigh", parent: 0, pos: [0, 0, 40] }, { name: "Bip01 L Calf", parent: 1, pos: [0, 0, -20] }],
    bodyparts: [{ name: "body", models: [{ name: "b", meshes: [{ tris: [], texture: indexed(W.sheet(16, 16).image(), "b.bmp") }] }] }],
    sequences: [{ name: "run", fps: 10, frames: [0, 1, 2].map(() => [[0, 0, 0, 0, 0, 0], [0, 0, 40, 0, 0, 0], [0, 0, -20, 0, 0, 0]]) }],
  });
  writeFileSync(join(folder, "runleg.mdl"), runLeg);
  const runSpec = (extra) => ({ ...legSpec(undefined), base: { file: "runleg.mdl" }, ...extra });
  const swungRun = buildModelSpec(runSpec({ pose: { keys: { "Bip01 L Thigh": { turn: { y: -40 } } } } }), { folder });
  const strip = smak.strip(swungRun.mdl, { seq: 0, count: 3, cols: 3, view: "side", ground: true, width: 192, height: 192 });
  writeFileSync(join(folder, "motion.png"), smak.png(strip.width, strip.height, strip.rgba));
  const moved = buildModelSpec(runSpec({ motion: [{ seq: "run", fit: { picture: "motion.png", count: 3, cols: 3 } }] }), { folder });
  const line = moved.report.facts.find((f) => /^motion\[0\]/.test(f)) ?? "";
  const [was, now] = (line.match(/overlap ([\d.]+) as it was, ([\d.]+) fitted/) ?? []).slice(1).map(Number);
  sure(moved.report.ok && now > was + 0.05 && smak.sequences(moved.mdl)[0].frames === 3, `the run fitted to its strip: ${line.slice(0, 200)} ${moved.report.errors}`);
});

test("a superquadric: a rounded block and an egg at their sizes, a wrong round refused", () => {
  const { mdl, report } = buildModelSpec({ spec: "smak.model/1", name: "sq.mdl", kind: "prop", allow: { floating: ["egg"] }, parts: [
    { id: "boot", kind: "superquadric", size: [12, 5, 4], round: [0.3, 0.5], at: [0, 0, 0] },
    { id: "egg", kind: "superquadric", size: [6, 6, 8], round: [1, 1], at: [0, 12, 0] },
  ] });
  sure(report.ok, [...report.errors, ...report.faults].join("; "));
  const boot = report.parts.boot;
  const extent = boot.to.map((v, k) => v - boot.from[k]);
  sure(Math.abs(extent[0] - 12) < 0.3 && Math.abs(extent[1] - 5) < 0.3 && Math.abs(extent[2] - 4) < 0.05, `the boot ${JSON.stringify(boot)}`);
  sure(smak.check(mdl).errors.length === 0);
  const bad = validateModelSpec({ spec: "smak.model/1", name: "x.mdl", kind: "prop", parts: [{ id: "a", kind: "superquadric", size: [1, 1, 1], round: [0, 3] }] });
  sure(bad.errors.some((e) => /round/.test(e)), bad.errors.join("; "));
});

test("a part's texels: twice as finely painted as its twin, and the zones laid tallest first", () => {
  const { mdl, report } = buildModelSpec({ spec: "smak.model/1", name: "tx.mdl", kind: "prop", parts: [
    { id: "body", kind: "box", size: [4, 4, 4], at: [0, 0, 0] },
    { id: "face", kind: "box", size: [4, 4, 4], at: [0, 0, 4], texels: 2 },
  ] });
  sure(report.ok, [...report.errors, ...report.faults].join("; "));
  // the span of texture each part's triangles cover, in pixels across
  const spans = { low: [], high: [] };
  for (const t of smak.posed(mdl, {}).tris) {
    const z = t.c.reduce((sum, c) => sum + c.p[2], 0) / 3;
    // the faces at z 4 (the body's top, the face's foot) could be either's: left out
    if (Math.abs(z - 4) > 0.01) spans[z < 4 ? "low" : "high"].push(...t.c.map((c) => c.u));
  }
  const width = (us) => Math.max(...us) - Math.min(...us);
  const ratio = width(spans.high) / width(spans.low);
  sure(ratio > 1.7 && ratio < 2.3, `the face's zone ${ratio.toFixed(2)} times as wide`);
});

test("a map spec's doors: one on hinges, one that slides all the way up, and the threshold under each filled", () => {
  const spec = (door) => ({ spec: "smak.map/1", name: "doors", rooms: [{ id: "a", size: [256, 256, 128], surfaces: { floor: "planks" } }, { id: "b", size: [256, 256, 128], place: { east_of: "a" } }], links: [{ between: ["a", "b"], kind: "door", door, width: 32 }], entities: [{ class: "info_player_start", room: "a", at: "centre" }] });
  const swung = buildMapSpec(spec({ swing: true }), { out: join(folder, "doors-swing") });
  // asked 32 wide, as a house's drawing gives a door: a player passes one on hinges at ease at 56
  sure(swung.report.facts.some((f) => /widened from 32 to 56/.test(f)), swung.report.facts.filter((f) => /links/.test(f)).join("; "));
  const slid = buildMapSpec(spec(undefined), { out: join(folder, "doors-slide") });
  const text = (r) => readFileSync(r.files.map, "utf8");
  sure(/"classname" "func_door_rotating"/.test(text(swung)) && /ORIGIN/.test(text(swung)) && /"spawnflags" "288"/.test(text(swung)), "a door on hinges, with its hinge, opened and closed by use");
  sure(/"classname" "func_door"/.test(text(slid)) && /"lip" "0"/.test(text(slid)), "a sliding door that opens all the way");
  // the threshold: the map's brushes have a floor under the doorway, level with the rooms'
  const map = smak.maps.readMap(text(slid));
  const door = map.entities.find((e) => e.classname === "func_door");
  const [x, y] = [0, 1].map((k) => (Math.min(...door.brushes[0].faces.flatMap((f) => f.points.map((p) => p[k]))) + Math.max(...door.brushes[0].faces.flatMap((f) => f.points.map((p) => p[k])))) / 2);
  const under = map.brushes.some((b) => smak.maps.holds(b, [x, y, -4]));
  sure(under, `solid under the doorway at ${x}, ${y}`);
});

test("a model spec's leaf drops the points that lie on the line between their neighbours, and keeps a bend", () => {
  const row = (z) => [[0, 0, z], [2, 0.05, z], [4, 0.1, z], [6, 0, z], [8, 3, z], [10, 0, z]];
  const spec = { spec: "smak.model/1", name: "l.mdl", kind: "piece", parts: [{ id: "sheet", kind: "leaf", material: "cloth", rows: [row(0), row(4)] }] };
  const { report } = buildModelSpec(spec);
  // the three nearly straight ones from 0 to 6 go, the peak at 8 stays: 6 columns become 4, 3 quads a side
  sure(report.facts.some((f) => /sheet: 2 of its grid's 6 columns of points left out/.test(f)), report.facts.filter((f) => /sheet/.test(f)).join("; "));
  sure(report.facts.some((f) => /^12 triangles/.test(f)), report.facts.filter((f) => /triangles/.test(f)).join("; "));
});

test("a map spec's furniture never floats: on the floor, against a wall, under the ceiling or on another piece", () => {
  // Steven's play-test of frenzy_words: "everything is floating everywhere"
  const faults = (furniture) =>
    buildMapSpec({ spec: "smak.map/1", name: "float", rooms: [{ id: "a", size: [512, 512, 256] }], entities: [{ class: "info_player_start", room: "a", at: [-200, -200] }], furniture }, { out: join(folder, "float"), compilers: { found: false, message: "" } }).report.faults.filter((f) => /float/.test(f));
  const held = faults([
    { box: [32, 32, 32], room: "a", at: [0, 0] },
    { box: [32, 32, 32], room: "a", at: [0, 0], z: 32 },
    { box: [16, 64, 16], room: "a", at: [248, 100], z: 120 },
    { box: [64, 64, 8], room: "a", at: [100, 100], z: 248 },
  ]);
  sure(!held.length, held.join("; "));
  // one set on another's corner is warned of; one set square on it is not
  const warned = (furniture) =>
    buildMapSpec({ spec: "smak.map/1", name: "float", rooms: [{ id: "a", size: [512, 512, 256] }], entities: [{ class: "info_player_start", room: "a", at: [-200, -200] }], furniture }, { out: join(folder, "float"), compilers: { found: false, message: "" } }).report.warnings.filter((w) => /footprint/.test(w));
  sure(!warned([{ box: [64, 64, 32], room: "a", at: [0, 0] }, { box: [32, 32, 32], room: "a", at: [0, 0], z: 32 }]).length, "square on");
  sure(warned([{ box: [64, 64, 32], room: "a", at: [0, 0] }, { box: [32, 32, 32], room: "a", at: [30, 30], z: 32 }]).some((w) => /furniture\[1\] \(box\) on \d+%/.test(w)), "on a corner");
  const afloat = faults([{ box: [32, 32, 32], room: "a", at: [100, 0], z: 100 }]);
  sure(afloat.some((f) => /furniture\[0\] \(box\) in a, 100 over its floor/.test(f)), afloat.join("; ") || "no fault");
});

test("a map spec's ladder is built as Valve's are: a func_ladder to climb, and see-through rungs in render mode 4", () => {
  // Steven's play-test of frenzy_pictures: a ladder made as furniture in a grate texture read as a vent
  const spec = { spec: "smak.map/1", name: "ladders", rooms: [{ id: "pit", size: [256, 256, 256] }], ladders: [{ room: "pit", side: "north", along: 0.25, height: 200 }], entities: [{ class: "info_player_start", room: "pit", at: "centre" }] };
  const { files, report } = buildMapSpec(spec, { out: join(folder, "ladders"), compilers: { found: false, message: "" } });
  const map = smak.maps.readMap(readFileSync(files.map, "utf8"));
  const climb = map.entities.find((e) => e.classname === "func_ladder");
  const seen = map.entities.find((e) => e.classname === "func_wall" && e.rendermode === "4");
  const textureOf = (e) => e.brushes[0].faces[0].texture;
  sure(climb && seen && textureOf(seen).startsWith("{") && textureOf(climb) === textureOf(seen), JSON.stringify(report.facts.filter((f) => /ladders/.test(f))));
  const ys = smak.maps.shapeOf(seen.brushes[0]).corners.map((p) => p[1]);
  sure(Math.max(...ys) === 128 && Math.min(...ys) === 122, `the rungs from ${Math.min(...ys)} to ${Math.max(...ys)}, the wall at 128`);
});

test("a material's tone of null is its base's own colour, as left out (the winter tree of case 28)", () => {
  sure(JSON.stringify(materialOf({ base: "grass", tone: null }).tone) === JSON.stringify(materialOf({ base: "grass" }).tone), "null as left out");
});

test("a map spec's glow is on what it shines from: one in the air is a fault, one on the ceiling is not", () => {
  // frenzy_pictures: seven env_glow floating, what Steven saw as "random lights in the middle of the air"
  const faults = (z) =>
    buildMapSpec({ spec: "smak.map/1", name: "glow2", rooms: [{ id: "a", size: [512, 512, 256] }], entities: [{ class: "info_player_start", room: "a", at: [-200, -200] }, { class: "env_glow", room: "a", at: "centre", z, keys: { model: "sprites/glow01.spr" } }] }, { out: join(folder, "glow2"), compilers: { found: false, message: "" } }).report.faults.filter((f) => /hangs in the air/.test(f));
  sure(faults(128).length === 1, "at 128 of 256, in the air");
  sure(faults(240).length === 0, "16 under the ceiling");
});

test("a wall's texture stands on the floor of the room it faces, whatever that floor's height", () => {
  // Steven's play-test of the frenzy reproductions: "texture alignment is off"; a mapper lines a wall up with its floor
  const brushes = smak.maps.carve([{ min: [0, 0, 0], max: [256, 256, 128] }, { min: [272, 24, 40], max: [528, 280, 168] }], 16, { floor: "F", ceiling: "C", wall: "W" });
  // the wall faces that look into a room: a face of a piece of rock whose box ends at the room's side, beside it
  const facing = (room, x, sign) =>
    brushes.flatMap((b) => {
      const c = smak.maps.shapeOf(b).corners;
      const lo = [0, 1, 2].map((k) => Math.min(...c.map((p) => p[k])));
      const hi = [0, 1, 2].map((k) => Math.max(...c.map((p) => p[k])));
      if ((sign > 0 ? hi[0] : lo[0]) !== x || hi[2] <= room.min[2] || lo[2] >= room.max[2]) return [];
      return b.faces.filter((f) => f.texture === "W" && Math.abs(f.v[2] + 1) < 1e-9 && f.points.every((p) => Math.abs(p[0] - x) < 1e-6)).map((f) => f.v[3]);
    });
  // the first room's east wall faces it (floor 0); the second room's west wall faces it (floor 40)
  const first = facing({ min: [0, 0, 0], max: [256, 256, 128] }, 256, -1);
  const second = facing({ min: [272, 24, 40], max: [528, 280, 168] }, 272, 1);
  sure(first.length && first.every((o) => o === 0), `the first room's wall: ${first}`);
  sure(second.length && second.every((o) => o === 40), `the second room's wall: ${second}`);
  // and across, from the room's corner: the second room starts at y 24, the walls facing x run along y
  const across = brushes.flatMap((b) => b.faces.filter((f) => f.texture === "W" && Math.abs(f.u[1] - 1) < 1e-9 && f.points.every((p) => Math.abs(p[0] - 272) < 1e-6)).map((f) => f.u[3]));
  sure(across.includes(-24), `across: ${across}`);
});

test("a map's props may be the kit's own furniture, built as the map's models and solid to a body", () => {
  // Kaupo's bathroom was boxes: "sink, toilet, and ... something else in the middle?" (Steven's walk)
  const spec = (model) => ({ spec: "smak.map/1", name: "bath", rooms: [{ id: "bath", size: [256, 192, 128] }], props: [{ model, room: "bath", at: "corner ne" }], entities: [{ class: "info_player_start", room: "bath", at: [-80, -40] }] });
  const { files, report } = buildMapSpec(spec("kit:toilet"), { out: join(folder, "kitprops"), compilers: { found: false, message: "" } });
  sure(report.errors.length === 0 && report.facts.some((f) => /models\.kit_toilet: built and sound/.test(f)), report.errors.join("; "));
  const text = readFileSync(files.map, "utf8");
  sure(/models\/bath\/kit_toilet\.mdl/.test(text) && /\bCLIP\b/.test(text), "the toilet named, and a CLIP box about it");
  const wrong = buildMapSpec(spec("kit:jacuzzi"), { out: join(folder, "kitprops"), compilers: { found: false, message: "" } }).report;
  sure(wrong.errors.some((e) => /"kit:jacuzzi" is none of the kit's furniture \(.*kit:toilet/.test(e)), wrong.errors.join("; "));
});

test("a lamp is never in mid-air: one hung below a tall room's ceiling has a shade and a rod up to it", () => {
  // Steven's play-test of frenzy_pictures: "random lights in the middle of the air"
  const spec = { spec: "smak.map/1", name: "tall", rooms: [{ id: "hall", size: [256, 256, 480] }], entities: [{ class: "info_player_start", room: "hall", at: "centre" }, { class: "light", room: "hall", at: "corner ne" }] };
  const { files } = buildMapSpec(spec, { out: join(folder, "tall"), compilers: { found: false, message: "" } });
  const map = smak.maps.readMap(readFileSync(files.map, "utf8"));
  const lights = map.entities.filter((e) => e.classname === "light");
  const rods = map.entities.filter((e) => e.classname === "func_detail").flatMap((e) => e.brushes);
  const top = Math.max(...map.brushes.flatMap((b) => b.faces.flatMap((f) => f.points.map((p) => p[2]))));
  for (const l of lights) {
    const [x, y, z] = l.origin.split(" ").map(Number);
    const hung = rods.some((b) => {
      const ps = b.faces.flatMap((f) => f.points);
      const lo = [0, 1, 2].map((k) => Math.min(...ps.map((p) => p[k])));
      const hi = [0, 1, 2].map((k) => Math.max(...ps.map((p) => p[k])));
      return lo[0] <= x && x <= hi[0] && lo[1] <= y && y <= hi[1] && lo[2] >= z && lo[2] - z < 12;
    });
    sure(hung, `the light at ${l.origin} has no shade just over it`);
  }
  sure(lights.length >= 2 && rods.length >= 2 * lights.length && top > 400, `${lights.length} lights, ${rods.length} brushes hung`);
});

test("an entity that loads a model it does not name: refused by the spec, by both writers, and found in a map", () => {
  // frenzy_plans: eight env_glow with no sprite stopped the game on load (PF_precache_model_I: Bad string '')
  const spec = { spec: "smak.map/1", name: "glow", rooms: [{ id: "a", size: [256, 256, 128] }], entities: [{ class: "info_player_start", room: "a", at: "centre" }, { class: "env_glow", room: "a", at: "corner ne" }] };
  const built = buildMapSpec(spec, { out: join(folder, "glow"), compilers: { found: false, message: "" } });
  sure(built.report.errors.some((e) => /entities\[1\]\.keys\.model: env_glow/.test(e)), built.report.errors.join("; "));
  let refused = "";
  try {
    smak.maps.writeMap({ worldspawn: {}, brushes: [], entities: [{ classname: "env_sprite", origin: "0 0 0" }] });
  } catch (error) {
    refused = error.message;
  }
  sure(/writeMap: entity 1 \(env_sprite\) precache a model/.test(refused), refused || "writeMap wrote it");
  refused = "";
  try {
    smak.maps.writeEntities([[["classname", "worldspawn"]], [["classname", "env_glow"], ["origin", "0 0 0"]]]);
  } catch (error) {
    refused = error.message;
  }
  sure(/writeEntities: env_glow precache a model/.test(refused), refused || "writeEntities wrote it");
  // a source made elsewhere: the plan check names it
  const plan = smak.maps.checkPlan({ worldspawn: {}, brushes: [], entities: [{ classname: "env_glow", origin: "0 0 0" }] }, { leak: false });
  sure(plan.errors.some((e) => /precache a model they do not name/.test(e)), plan.errors.join("; "));
});

test("a map spec keeps its ways through at ease: no furniture in front of a door, no wall too short for one", () => {
  const spec = (furniture, size = [256, 256, 128]) => ({
    spec: "smak.map/1", name: "ways",
    rooms: [{ id: "a", size: [256, 256, 128] }, { id: "b", size, place: { east_of: "a" } }],
    prefabs: { chest: { pieces: [{ box: [[-16, -16, 0], [16, 16, 40]] }] }, slab: { pieces: [{ box: [[-20, -20, 0], [20, 20, 4]] }] }, steps: { pieces: [9, 18, 27].map((h, k) => ({ box: [[-24 + 8 * k, -20, 0], [-16 + 8 * k, 20, h]] })) } },
    links: [{ between: ["a", "b"], kind: "door" }],
    furniture,
    entities: [{ class: "info_player_start", room: "a", at: "centre" }],
  });
  const faults = (s) => buildMapSpec(s, { out: join(folder, "ways") }).report.faults.filter((f) => !/not compiled/.test(f));
  // the door is in a's east wall, at its middle: 20 in front of it stands in the way, a slab and steps do not
  const blocked = faults(spec([{ prefab: "chest", room: "a", at: [108, 0] }]));
  sure(blocked.some((f) => /furniture\[0\] \(chest\) stands in front of links\[0\]/.test(f)), blocked.join("; "));
  const over = faults(spec([{ prefab: "slab", room: "a", at: [104, 0] }, { prefab: "steps", room: "b", at: [-100, 0] }]));
  sure(!over.some((f) => /in front of/.test(f)), over.join("; "));
  const aside = faults(spec([{ prefab: "chest", room: "a", at: [108, 100] }]));
  sure(!aside.some((f) => /in front of/.test(f)), aside.join("; "));
  // a room that shares 40 of wall: a door there is too narrow, and the build says so
  const short = faults({ ...spec([], [40, 40, 128]), rooms: [{ id: "a", size: [256, 256, 128] }, { id: "b", size: [40, 40, 128], place: { east_of: "a" } }] });
  sure(short.some((f) => /links\[0\]: the wall a and b share is 40 long/.test(f)), short.join("; "));
});

test("a map's pictures look as Valve's walls do: grain, patches, colour and brightness within nine in ten of theirs", () => {
  // every base the kit paints, at its own tone, passes; it did not while the pictures were even
  for (const base of Object.keys(MATERIALS).filter((b) => b !== "mesh" && !UNWORN.has(b))) {
    const said = lookFaults(lookOf(surfacePicture(materialOf({ base }), 128, 128)), ALLOWED[base]);
    sure(said.length === 0, `${base}: ${said.join(", ")}`);
  }
  // a flat white wall, and a picture of one colour, are named
  const flat = { width: 64, height: 64, rgb: new Uint8Array(64 * 64 * 3).fill(230) };
  sure(lookFaults(lookOf(flat)).join() === "too even (no grain, no patches),brighter (0.90; Valve's 0.332)", lookFaults(lookOf(flat)).join());
  const spec = { spec: "smak.map/1", name: "looks", textures: { wall: { base: "plaster", tone: [0.95, 0.95, 0.95] } }, theme: { wall: "wall" }, rooms: [{ id: "a", size: [256, 256, 128] }], entities: [{ class: "info_player_start", room: "a", at: "centre" }] };
  const report = buildMapSpec(spec, { out: join(folder, "looks"), compilers: { found: false, message: "" } }).report;
  sure(report.warnings.some((w) => /look unlike nine in ten of Valve's.*brighter/.test(w)), report.warnings.join("; "));
  // a .wad beside the spec is the maker's own, measured too (Kaupo's white wallboard); one in the game's folder is not
  const own = join(folder, "looks-own");
  mkdirSync(own, { recursive: true });
  writeFileSync(join(own, "mine.wad"), smak.maps.writeWad([{ name: "my_white", image: { width: 64, height: 64, rgb: new Uint8Array(64 * 64 * 3).fill(235) } }]));
  const named = buildMapSpec({ ...spec, wads: ["mine.wad"], textures: { wall: { texture: "my_white" } } }, { out: join(own, "out"), folder: own, compilers: { found: false, message: "" } }).report;
  sure(named.warnings.some((w) => /textures of the spec's own .wad files.*my_white \(mine\.wad\) too even.*brighter/.test(w)), named.warnings.join("; "));
  const game = buildMapSpec({ ...spec, wads: ["mine.wad"], textures: { wall: { texture: "my_white" } } }, { out: join(own, "out2"), folder: join(own, "elsewhere"), wads: [own], compilers: { found: false, message: "" } }).report;
  sure(!game.warnings.some((w) => /spec's own .wad/.test(w)), game.warnings.join("; "));
});

test("a building raised over its yard gets steps out from its door, and is walked into", () => {
  const spec = { spec: "smak.map/1", name: "raised", rooms: [{ id: "yard", size: [1024, 1024, 320], sky: true }, { id: "a", size: [256, 256, 112], floor: 48, place: { in: "yard", offset: [384, 384], stand: true }, building: { roof: false } }], links: [{ between: ["a", "yard"], kind: "door", side: "south", door: { swing: true } }], entities: [{ class: "info_player_start", room: "yard", at: [-300, -300] }, { class: "item_battery", room: "a", at: "centre" }] };
  const report = buildMapSpec(spec, { out: join(folder, "raised"), compilers: { found: false, message: "" } }).report;
  sure(!report.errors.length && !report.faults.some((f) => !/not compiled/.test(f)), [...report.errors, ...report.faults].join("; "));
  sure(report.facts.some((f) => /stairs of 3 steps in yard up to the way at 48/.test(f)), report.facts.filter((f) => /links/.test(f)).join("; "));
});

test("a building's doors open through walls of any thickness, and a room no floor of which is walked is a fault", () => {
  // walls under 16 once left each room's own lining standing in the next, across its doorway (a maker's house of 6)
  const house = (wall, furniture = []) => ({
    spec: "smak.map/1", name: "thin", wall,
    rooms: [{ id: "yard", size: [1024, 1024, 256], sky: true }, { id: "a", size: [256, 256, 112], floor: 8, place: { in: "yard", offset: [256, 256], stand: true }, building: { roof: false } }, { id: "b", size: [256, 256, 112], place: { east_of: "a" } }],
    links: [{ between: ["a", "b"], kind: "door", door: { swing: true } }, { between: ["a", "yard"], kind: "door", side: "south" }],
    prefabs: { fill: { pieces: [{ box: [[-128, -128, 0], [128, 128, 112]] }] } }, furniture,
    entities: [{ class: "info_player_start", room: "yard", at: [-300, -300] }],
  });
  const faults = (s) => buildMapSpec(s, { out: join(folder, "thin"), compilers: { found: false, message: "" } }).report.faults.filter((f) => !/not compiled/.test(f));
  for (const wall of [16, 6, 4]) sure(faults(house(wall)).length === 0, `${wall}: ${faults(house(wall)).join("; ")}`);
  // b filled from wall to wall: its door leads nowhere
  const shut = faults(house(16, [{ prefab: "fill", room: "b", at: [0, 0] }]));
  sure(shut.some((f) => /no floor of b is walked to, though a way leads into it/.test(f)), shut.join("; "));
});

test("furniture of boxes named for a thing the kit has a model of is warned of (Kaupo's bathroom of blocks)", () => {
  const spec = (prefabs) => ({
    spec: "smak.map/1", name: "boxed", rooms: [{ id: "a", size: [256, 256, 128] }],
    prefabs: Object.fromEntries(prefabs.map((n) => [n, { pieces: [{ box: [[-8, -8, 0], [8, 8, 16]] }] }])),
    furniture: prefabs.map((prefab, k) => ({ prefab, room: "a", at: [-80 + 40 * k, 60] })),
    entities: [{ class: "info_player_start", room: "a", at: [0, -60] }],
  });
  const said = (prefabs) => buildMapSpec(spec(prefabs), { out: join(folder, "boxed"), compilers: { found: false, message: "" } }).report.warnings.find((w) => /kit has a model/.test(w)) ?? "";
  sure(/toilet as kit:toilet, tub as kit:bathtub, wall_sink as kit:sink_cabinet/.test(said(["toilet", "tub", "wall_sink"])), said(["toilet", "tub", "wall_sink"]));
  // a shelf by the bath, a crate and steps are no kit's furniture
  sure(said(["bath_shelf", "crate", "front_steps", "porta_toilet"]) === "", said(["bath_shelf", "crate", "front_steps", "porta_toilet"]));
});

test("stairs are kept clear as a doorway is: on them and at their foot (Kaupo's blocks by its stairs)", () => {
  const spec = (furniture) => ({
    spec: "smak.map/1", name: "stairs",
    rooms: [{ id: "a", size: [320, 256, 200] }, { id: "b", size: [256, 256, 200], place: { east_of: "a" }, floor: 64 }],
    prefabs: { chest: { pieces: [{ box: [[-16, -16, 0], [16, 16, 40]] }] } },
    links: [{ between: ["a", "b"], kind: "opening" }],
    furniture,
    entities: [{ class: "info_player_start", room: "a", at: [-100, 0] }],
  });
  const build = (s) => buildMapSpec(s, { out: join(folder, "stairs"), compilers: { found: false, message: "" } }).report;
  const plain = build(spec([]));
  const steps = Number(plain.facts.map((f) => /stairs of (\d+) steps in a/.exec(f)).find(Boolean)?.[1]);
  sure(steps > 0, plain.facts.join("; "));
  // the stairs run west from a's east wall (x 160): a chest 20 past their foot, and one on them, stand in the way
  const run = 24 * steps; // a tread is 24
  for (const x of [160 - run - 20, 160 - run / 2]) {
    const faults = build(spec([{ prefab: "chest", room: "a", at: [x, 0] }])).faults;
    sure(faults.some((f) => /furniture\[0\] \(chest\) stands on or at the foot of the stairs of links\[0\]/.test(f)), `${x}: ${faults.join("; ")}`);
  }
  // one beside them, and one well clear of their foot, do not
  for (const at of [[160 - run / 2, 100], [160 - run - 80, 0]]) {
    const faults = build(spec([{ prefab: "chest", room: "a", at }])).faults;
    sure(!faults.some((f) => /stairs of links/.test(f)), `${at}: ${faults.join("; ")}`);
  }
});

test("a way through clears a step: raised to Valve's 96, and 90 over the lower floor (Kaupo's shed, ducked through)", () => {
  const spec = (high) => ({ spec: "smak.map/1", name: "step", rooms: [{ id: "yard", size: [256, 256, high] }, { id: "shed", size: [256, 256, high], place: { east_of: "yard" }, floor: 8 }], links: [{ between: ["yard", "shed"], kind: "opening", height: 76 }], entities: [{ class: "info_player_start", room: "yard", at: "centre" }] });
  const tall = buildMapSpec(spec(160), { out: join(folder, "step"), compilers: { found: false, message: "" } }).report;
  sure(tall.facts.some((f) => /raised from 76 to 96 high/.test(f)), tall.facts.filter((f) => /links/.test(f)).join("; "));
  const low = buildMapSpec(spec(86), { out: join(folder, "step"), compilers: { found: false, message: "" } }).report;
  sure(low.faults.some((f) => /is 78 high.*over the step of 8/.test(f)), [...low.faults, ...low.errors].join("; "));
});

test("a weapon laid \"as drawn\" is fitted without a crash (case 26, the lunchbox mine, never built)", () => {
  // the as-drawn turn handed the box of its points bare points where corners were expected
  const M = W.shape(64, 64);
  M.lathe([[0, 1], [6, 1.5], [8, 1]], Z, { sides: 6, caps: [true, true] });
  const fit = smak.bestTurn(M.tris, M.tris, false, "as drawn");
  sure(fit && fit.name === "as drawn" && Number.isFinite(fit.k), JSON.stringify(fit && { name: fit.name, k: fit.k }));
});

test("a door's picture is fitted to its leaf, a ladder's across its width; every door opens and shuts by use", () => {
  // Steven's walk of kaupo_v2: doors "solid wood, no handles", a ladder "-|- rather than |--|"
  const spec = (door) => ({ spec: "smak.map/1", name: "fit", rooms: [{ id: "a", size: [256, 256, 128] }, { id: "b", size: [256, 256, 128], place: { east_of: "a" } }], links: [{ between: ["a", "b"], kind: "door", door }], ladders: [{ room: "a", side: "north", height: 120 }], entities: [{ class: "info_player_start", room: "a", at: "centre" }] });
  for (const door of [{ swing: true }, undefined]) {
    const { files } = buildMapSpec(spec(door), { out: join(folder, "fit"), compilers: { found: false, message: "" } });
    const map = smak.maps.readMap(readFileSync(files.map, "utf8"));
    const leaf = map.entities.find((e) => /^func_door/.test(e.classname));
    sure(leaf.spawnflags === "288", `${leaf.classname} spawnflags ${leaf.spawnflags}`);
    // the leaf, 96 high and as wide as the doorway (64 unless told, less 4 at a hinge): its broad faces
    // (looking along x) span exactly one 64 x 128 picture
    const corners = smak.maps.shapeOf(leaf.brushes[0]).corners;
    const wide = Math.max(...corners.map((p) => p[1])) - Math.min(...corners.map((p) => p[1]));
    const broad = leaf.brushes[0].faces.filter((f) => Math.abs(f.v[2] + 1) < 1e-9 && Math.abs(f.u[1]) === 1);
    sure(broad.length === 2 && broad.every((f) => Math.abs(f.scale[0] * 64 - wide) < 1e-6 && Math.abs(f.scale[1] * 128 - 96) < 1e-6), JSON.stringify({ wide, scales: broad.map((f) => f.scale) }));
    const rungs = map.entities.find((e) => e.classname === "func_wall").brushes[0].faces.filter((f) => Math.abs(f.u[0]) === 1 && Math.abs(f.v[2] + 1) < 1e-9);
    // 32 wide, its rungs one picture across (the map's own mesh, 128 wide, without the game's .wad) and tiling up
    sure(rungs.length && rungs.every((f) => f.scale[1] === 1 && Math.abs(f.scale[0] * 128 - 32) < 1e-6), JSON.stringify(rungs.map((f) => [f.scale, f.u[3]])));
  }
});

test("a flight of stairs has a railing on each open side: a post and a handrail over every step", () => {
  // Steven's walk of kaupo_v2: "the stairs don't have railing"
  const spec = { spec: "smak.map/1", name: "rail", rooms: [{ id: "low", size: [384, 384, 256] }, { id: "high", size: [256, 256, 128], place: { east_of: "low" }, floor: 64 }], links: [{ between: ["low", "high"], kind: "opening", width: 64 }], entities: [{ class: "info_player_start", room: "low", at: "centre" }] };
  const { files, report } = buildMapSpec(spec, { out: join(folder, "rail"), compilers: { found: false, message: "" } });
  const steps = Number(/stairs of (\d+) steps/.exec(report.facts.join(" "))?.[1]);
  const map = smak.maps.readMap(readFileSync(files.map, "utf8"));
  // one func_detail holds the railing (the lamps' rods and shades are others): two sides, a post and a rail a step
  const rails = map.entities.filter((e) => e.classname === "func_detail").map((e) => e.brushes.length);
  sure(steps > 0 && rails.includes(2 * 2 * steps), `${steps} steps, func_detail of ${rails.join(", ")} pieces`);
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
  // a part in some files only, and chrome in first person: the knob left out of p_, the v_ picture flagged
  const split = buildModelSpec({ ...spec, weapon: { ...spec.weapon, chrome: ["v"] }, parts: [spec.parts[0], { ...spec.parts[1], views: ["v"] }] }, { folder });
  sure(split.report.ok, [...split.report.errors, ...split.report.faults].join("; "));
  const trisIn = (name) => smak.readMdl(split.files.find((f) => f.name === name).mdl).bodyparts[0].models[0].meshes.filter((m) => /^rod_/.test(m.texture?.name ?? "")).reduce((n, m) => n + m.numtris, 0);
  sure(trisIn("v_stick.mdl") === 24 && trisIn("p_stick.mdl") === 12, `the knob in v_ only: ${trisIn("v_stick.mdl")} and ${trisIn("p_stick.mdl")}`);
  const flagOf = (name) => smak.readMdl(split.files.find((f) => f.name === name).mdl).textures.find((t) => /^rod_/.test(t.name)).flags;
  sure((flagOf("v_stick.mdl") & 2) === 2 && (flagOf("p_stick.mdl") & 2) === 0, `chrome in v_ only: ${flagOf("v_stick.mdl")}, ${flagOf("p_stick.mdl")}`);
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
  // the box's own outline against the picture's: the same shape, so they share nearly every cell
  const fit = report.facts.find((f) => /outline against each picture's/.test(f));
  sure(fit && Number(/front ([\d.]+)/.exec(fit)[1]) > 0.95 && !report.warnings.some((w) => /outline is off/.test(w)), fit);
  // and its painted look against the picture, drawn from the picture's camera: the same colours where they were
  const look = report.facts.find((f) => /its look against each picture's/.test(f));
  sure(look && Number(/front ([\d.]+)/.exec(look)[1]) < 10 && !report.warnings.some((w) => /look parts/.test(w)), look);
  // from the front: red on the viewer's left, blue on the right; from the back: the box's own green
  const shot = (yaw) => smak.render(mdl, { seq: 0, yaw, pitch: 0, width: 100, height: 100, light: false });
  const at = (pic, x, y) => [...pic.rgba.subarray((y * 100 + x) * 4, (y * 100 + x) * 4 + 3)];
  const front = shot(0);
  const back = shot(180);
  const [l, r, b] = [at(front, 40, 50), at(front, 60, 50), at(back, 50, 50)];
  sure(l[0] > 150 && l[2] < 80 && r[2] > 150 && r[0] < 80 && b[1] > 150 && b[0] < 80, `front left ${l}, front right ${r}, back ${b}`);
});

test("a model spec's project: a patch of the ground's colour inside the outline, and a speck of it on its edge, are the thing's", () => {
  // the box's front grey, a dark patch near the ground's colour in its middle and a speck of it at its foot: the
  // filing cabinet's blotches, which were masked out as ground and left to the material's paint
  const W = 200;
  const H = 300;
  const rgba = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const inside = x >= 50 && x < 150 && y >= 50 && y < 250;
      const patch = (x >= 60 && x < 140 && y >= 90 && y < 210) || (x >= 90 && x < 110 && y >= 240 && y < 250);
      rgba.set([...(!inside ? [58, 62, 70] : patch ? [66, 68, 72] : [120, 120, 120]), 255], (y * W + x) * 4);
    }
  const folder = mkdtempSync(join(tmpdir(), "smak-project-"));
  writeFileSync(join(folder, "front.png"), smak.png(W, H, rgba));
  const spec = { spec: "smak.model/1", name: "p.mdl", kind: "prop", finish: false, parts: [{ id: "b", kind: "box", size: [10, 10, 20], material: { base: "paint", tone: [0.1, 0.8, 0.1] } }], project: [{ picture: "front.png", view: "front" }] };
  const { mdl } = buildModelSpec(spec, { folder });
  const front = smak.render(mdl, { seq: 0, yaw: 0, pitch: 0, width: 100, height: 100, light: false });
  const green = [];
  for (let y = 0; y < 100; y++)
    for (let x = 0; x < 100; x++) {
      const [r, g, b] = front.rgba.subarray((y * 100 + x) * 4, (y * 100 + x) * 4 + 3);
      if (g > 150 && r < 80 && b < 80) green.push(`${x},${y}`);
    }
  sure(!green.length, `${green.length} dots of the material's green on the front: ${green.slice(0, 6).join(" ")}`);
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

test("a map spec's prism pieces cut a room's corner at 45 degrees, turned with their prefab; a plan's grid", () => {
  const out = mkdtempSync(join(tmpdir(), "smak-prism-"));
  const { report, files } = buildMapSpec(
    {
      spec: "smak.map/1",
      name: "oct",
      rooms: [{ id: "hall", size: [512, 512, 192], dark: true }],
      prefabs: { corner: { pieces: [{ prism: { outline: [[0, 0], [128, 0], [0, 128]], from: 0, to: 192 } }] } },
      furniture: [{ prefab: "corner", room: "hall", at: [-256, -256], as: "world" }, { prefab: "corner", room: "hall", at: [256, -256], rotate: 90, as: "world" }],
      entities: [{ class: "info_player_start", room: "hall", at: "centre" }],
    },
    { out, compilers: { found: false, message: "no compilers in this test" } },
  );
  sure(report.errors.length === 0, report.errors.join("; "));
  // the source plan: rock in the two front corners, floor in the back ones
  const map = smak.maps.readMap(readFileSync(files.map, "utf8"));
  const plan = smak.maps.planOfSource(map, { scale: 1, grid: 128 });
  const at = (x, y) => {
    const [px, py] = [Math.round((x - plan.facts.x0) * plan.facts.scale), Math.round((plan.facts.y0 - y) * plan.facts.scale)];
    return [...plan.rgba.subarray((py * plan.width + px) * 4, (py * plan.width + px) * 4 + 3)];
  };
  const same = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 8);
  sure(same(at(-240, -240), at(240, -240)) && !same(at(-240, -240), at(-200, 200)) && same(at(-200, 200), at(100, 100)), `rock cut in at both front corners: ${at(-240, -240)} ${at(240, -240)} against floor ${at(-200, 200)} ${at(100, 100)}`);
});

test("a blind test's original may be refused: a character may not take its skeleton", () => {
  const folder = mkdtempSync(join(tmpdir(), "smak-refuse-"));
  const { mdl } = buildModelSpec({ spec: "smak.model/1", name: "target.mdl", kind: "prop", parts: [{ id: "a", kind: "box", size: [4, 4, 4] }] });
  writeFileSync(join(folder, "target.mdl"), mdl);
  const spec = { spec: "smak.model/1", name: "copy.mdl", kind: "character", base: { file: "target.mdl" }, parts: [{ id: "b", kind: "box", size: [2, 2, 2], at: [0, 0, 0] }] };
  const refused = buildModelSpec(spec, { folder, refuse: ["models/target.mdl"] });
  sure(refused.report.errors.some((e) => /may not be used here \(a blind test's original\)/.test(e)), refused.report.errors.join("; "));
});

test("a model's contract: a reference's bones, animations and bodyparts kept, or each lack a fault", async () => {
  const { contractOf, compareContract } = await import("../src/contract.mjs");
  const folder = mkdtempSync(join(tmpdir(), "smak-contract-"));
  const part = { id: "a", kind: "box", size: [4, 4, 4] };
  const { mdl } = buildModelSpec({ spec: "smak.model/1", name: "ref.mdl", kind: "prop", parts: [part] });
  writeFileSync(join(folder, "ref.mdl"), mdl);
  const kept = buildModelSpec({ spec: "smak.model/1", name: "copy.mdl", kind: "prop", parts: [part], contract: { file: "ref.mdl" } }, { folder });
  sure(kept.report.ok && kept.report.facts.some((f) => /contract of ref\.mdl is kept/.test(f)), [...kept.report.errors, ...kept.report.faults].join("; "));
  // a reference with an animation and a bone the model lacks
  const ref = contractOf(mdl);
  const broken = compareContract({ ...ref, bones: [...ref.bones, "Bip01 Dorso"], sequences: [{ name: "dive_f_akimbo", activity: 0 }, ...ref.sequences] }, contractOf(mdl));
  sure(broken.faults.some((f) => /bones of the reference are missing: Bip01 Dorso/.test(f)) && broken.faults.some((f) => /animations are missing: dive_f_akimbo/.test(f)) && broken.faults.some((f) => /another number/.test(f)), broken.faults.join("; "));
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
        { box: [64, 4, 16], room: "yard", at: [0, -126], z: 96, texture: "pink" },
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
    // and swept: no light in mid-air, no solid in mid-air
    const swept = report.facts.filter((f) => /^sweep:/.test(f)).join(" | ");
    sure(/0 glows and sprites with nothing solid/.test(swept) && /0 pieces of solid that touch nothing/.test(swept), swept);
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
