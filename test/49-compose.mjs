// Composing on an imported rig (importRigged's `parts`): a bone and a piece added to what a bought model was
// built from, and built again, with nothing read back from the file; and the workshop's `skinned` body, the
// lofts, tubes and cards of a monster made from nothing, each corner on its own bone.
//
// The rig is test 37's: an FBX written here, two boxes on a bone `root` and a bone `tip`.
import * as smak from "../src/index.mjs";
import { test, sure, near } from "./helper.mjs";
import {
  L,
  S,
  record,
  properties,
  P,
  doubles,
  ints,
  longs,
  floats,
  fbxBinary,
  globalSettings,
  model,
  geometry,
  connections,
  objects,
  objectName,
  CUBE_FACES,
} from "./fixture-import.mjs";

/** Two boxes standing on each other along the file's +y: the lower from y 0 to 8, the upper from 10 to 12. */
const boxPoints = (a, b) => [
  [a[0], a[1], a[2]], [b[0], a[1], a[2]], [b[0], b[1], a[2]], [a[0], b[1], a[2]],
  [a[0], a[1], b[2]], [b[0], a[1], b[2]], [b[0], b[1], b[2]], [a[0], b[1], b[2]],
]; // prettier-ignore
const POINTS = [...boxPoints([-1, 0, -1], [1, 8, 1]), ...boxPoints([-1, 10, -1], [1, 12, 1])];
const POLYGONS = [...CUBE_FACES, ...CUBE_FACES.map((face) => face.map((i) => i + 8))];
const TICKS = 46186158000;
/** A matrix of sixteen numbers as FBX writes it, the move last: a move alone. */
const movedBy = ([x, y, z]) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];

/**
 * The FBX: an armature node, a bone `root` and a bone `tip` 10 above it; the lower box on root alone, the
 * upper on tip (0.7) and root (0.3); an animation "Armature|Bend" that turns tip a quarter about the file's z
 * over a second.
 */
const rigFbx = () =>
  fbxBinary([
    globalSettings({ unit: 1 }),
    objects(
      model(1, "Armature", "Null"),
      model(2, "root", "LimbNode"),
      model(3, "tip", "LimbNode", [["Lcl Translation", 0, 10, 0]]),
      model(4, "body", "Mesh"),
      geometry(5, "body", { points: POINTS, polygons: POLYGONS }),
      record("Deformer", [L(6), S(objectName("skin", "Deformer")), S("Skin")]),
      record("Deformer", [L(7), S(objectName("root", "SubDeformer")), S("Cluster")], [
        record("Indexes", [ints([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])]),
        record("Weights", [doubles([1, 1, 1, 1, 1, 1, 1, 1, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3])]),
        record("Transform", [doubles(movedBy([0, 0, 0]))]),
        record("TransformLink", [doubles(movedBy([0, 0, 0]))]),
      ]),
      record("Deformer", [L(8), S(objectName("tip", "SubDeformer")), S("Cluster")], [
        record("Indexes", [ints([8, 9, 10, 11, 12, 13, 14, 15])]),
        record("Weights", [doubles([0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7])]),
        record("Transform", [doubles(movedBy([0, -10, 0]))]),
        record("TransformLink", [doubles(movedBy([0, 10, 0]))]),
      ]),
      record("AnimationStack", [L(20), S(objectName("Armature|Bend", "AnimStack")), S("")]),
      record("AnimationLayer", [L(21), S(objectName("BaseLayer", "AnimLayer")), S("")]),
      record("AnimationCurveNode", [L(22), S(objectName("R", "AnimCurveNode")), S("")], [properties(P("d|X", "Number", 0), P("d|Y", "Number", 0), P("d|Z", "Number", 0))]),
      record("AnimationCurve", [L(23), S(objectName("", "AnimCurve")), S("")], [
        record("KeyTime", [longs([0, TICKS])]),
        record("KeyValueFloat", [floats([0, 90])]),
      ]),
    ),
    connections(
      [1, 0], [2, 1], [3, 2], [4, 0], [5, 4], [6, 5], [7, 6], [8, 6], [2, 7], [3, 8],
      [21, 20], [22, 21], [22, 3, "Lcl Rotation"], [23, 22, "d|Z"],
    ), // prettier-ignore
  ]);

const corners = (mdl, opts) => smak.posed(mdl, opts).tris.flatMap((tri) => tri.c.map((c) => c.p));

test("importRigged gives what it built from: parts, rebuilt, are the same model; textures listed", () => {
  const made = smak.importRigged(smak.readFbx(rigFbx()), { name: "rig.mdl", fps: 10, scale: 1 / 0.3937 });
  sure(made.parts && made.parts.bones.map((b) => b.name).join() === "Armature,root,tip", "the bones");
  sure(made.parts.sequences[0].name === "bend" && made.parts.sequences[0].frames.length === 11, "the animation");
  sure(made.textures.length === 1 && made.textures[0].pixels, "the textures");
  sure(smak.buildMdl(made.parts).equals(made.mdl), "built again from parts: the same bytes");
});

test("composing on parts: a bone after the others carries a piece, in every animation, and turns with its parent", () => {
  const made = smak.importRigged(smak.readFbx(rigFbx()), { name: "rig.mdl", fps: 10, scale: 1 / 0.3937 });
  const parts = made.parts;
  const tip = parts.bones.findIndex((b) => b.name === "tip");
  parts.bones.push({ name: "lantern", parent: tip, pos: [0, 0, 3], rot: [0, 0, 0] });
  const lantern = parts.bones.length - 1;
  for (const sequence of parts.sequences) for (const frame of sequence.frames) frame.push([0, 0, 3, 0, 0, 0]);
  // where the new bone is at rest, from the bones alone: a small square under it, in the model
  const rest = smak.animate.worldOf(smak.animate.rigOf(parts.bones), smak.animate.rigOf(parts.bones).rest)[lantern].p;
  const sq = [[0, -1, 0], [0, 1, 0], [0, 1, -2], [0, -1, -2]].map(([x, y, z]) => ({ p: [rest[0] + x, rest[1] + y, rest[2] + z], uv: [0, 0], bone: lantern }));
  const texture = smak.indexed({ width: 8, height: 8, rgb: new Uint8Array(192).fill(200) }, "lamp.bmp");
  parts.bodyparts[0].models[0].meshes.push({ tris: [[sq[0], sq[1], sq[2]], [sq[0], sq[2], sq[3]]], texture: { ...texture, flags: smak.TEXTURE.fullbright } });
  const mdl = smak.buildMdl(parts);
  sure(!smak.check(mdl).errors.length, smak.check(mdl).errors.join("; "));
  sure(smak.readMdl(mdl).textures.some((t) => t.name === "lamp.bmp" && t.flags === 4), "the lamp's texture, full bright");
  // the piece is where it was put at rest, and moves with the tip in the animation
  const lampAt = (opts) => smak.posed(mdl, opts).tris.filter((t) => t.tex.name === "lamp.bmp").flatMap((t) => t.c.map((c) => c.p));
  const atRest = lampAt({ seq: null });
  near(Math.min(...atRest.map((p) => Math.hypot(p[0] - sq[0].p[0], p[1] - sq[0].p[1], p[2] - sq[0].p[2]))), 0, 1e-3, "at rest, where put");
  const before = lampAt({ seq: 0, frame: 0 });
  const after = lampAt({ seq: 0, frame: 10 });
  sure(Math.max(...after.map((p, i) => Math.hypot(...p.map((v, k) => v - before[i][k])))) > 1, "it swings with the tip");
});

test("workshop.skinned: a tube on two bones, a loft closed at a point, a card from both sides; built, it bends", () => {
  const W = smak.workshop;
  const zone = W.zoneOn("body", 64, 64, 0, 0, 64, 32);
  const card = W.zoneOn("body", 64, 64, 0, 32, 32, 32);
  const span = W.span(0, 20);
  near(span.v(10), 0.5, 1e-12, "span there");
  near(span.s(0.25), 5, 1e-12, "and back");
  const B = W.skinned();
  B.tube(zone, [
    { c: [0, 0, 0], rx: 0, ry: 0, v: 1, bone: "low" },
    { c: [0, 0, 2], rx: 2, ry: 2, v: span.v(18), bone: "low" },
    { c: [0, 0, 10], rx: 2, ry: 2, v: span.v(10), bone: "high" },
    { c: [0, 0, 20], rx: 0, ry: 0, v: 0, bone: "high" },
  ], { sides: 6 });
  const tubeTris = B.meshes.body.length;
  sure(tubeTris === 24, `a fan at each closed end and two triangles a side between: 24, not ${tubeTris}`);
  B.card(card, [3, 0, 10], [0, 0, 1], [0, 1, 0], 4, 2, { bone: "high", n: [1, 0, 0] });
  sure(B.meshes.body.length === tubeTris + 4, "a card is four triangles: two a side");
  // every face of the tube looks out of it
  for (const t of B.meshes.body.slice(0, tubeTris)) {
    const [a, b, c] = t.map((corner) => corner.p);
    const n = [(b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]), (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2])];
    const mid = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3];
    sure(n[0] * mid[0] + n[1] * mid[1] >= -1e-9, "a face looking in");
  }
  const bones = [{ name: "low", parent: -1, pos: [0, 0, 0] }, { name: "high", parent: 0, pos: [0, 0, 8] }];
  const texture = smak.indexed({ width: 64, height: 64, rgb: new Uint8Array(64 * 64 * 3).fill(120) }, "body.bmp");
  const bent = [[0, 0, 0, 0, 0, 0], [0, 0, 8, 0.8, 0, 0]];
  const mdl = smak.buildMdl({
    name: "limb.mdl", bones, ownNormals: true,
    bodyparts: [{ name: "body", models: [{ name: "limb", meshes: [{ tris: B.meshes.body, texture }] }] }],
    sequences: [{ name: "idle", fps: 10, frames: [bones.map((b) => [...b.pos, 0, 0, 0])] }, { name: "bend", fps: 10, frames: [bent] }],
  });
  sure(!smak.check(mdl).errors.length, smak.check(mdl).errors.join("; "));
  const top = (seq) => Math.max(...corners(mdl, { seq }).map((p) => p[2]));
  sure(top("bend") < top("idle") - 1, `the upper part bends with its bone: ${top("idle")} then ${top("bend")}`);
});
