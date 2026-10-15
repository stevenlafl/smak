// The blob part: pieces on a base's joints (or at points) blended into one closed surface, each corner on the
// bone of the piece nearest it; the surface mesher it shares with carve.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test, sure, tmp } from "./helper.mjs";
import { buildModelSpec } from "../src/spec/model.mjs";
import { blob } from "../src/spec/blob.mjs";
import { buildMdl, indexed, workshop as W, readMdl, readMesh } from "../src/index.mjs";

const folder = join(tmp, "blob");
mkdirSync(folder, { recursive: true });
// a limb of three bones: root at 0, knee 12 up, ankle 24 up
const M = W.shape(64, 64);
M.lathe([[0, 1], [2, 1]], { x: 0, y: 0, w: 64, h: 64 }, { sides: 6, caps: [true, true], at: (s, a, b) => [a, b, s] });
writeFileSync(
  join(folder, "leg.mdl"),
  buildMdl({
    name: "leg.mdl",
    bones: [{ name: "hip", parent: -1 }, { name: "knee", parent: 0 }, { name: "ankle", parent: 1 }],
    bodyparts: [{ name: "body", models: [{ name: "t", meshes: [{ tris: M.tris.map((t) => t.map((c) => ({ ...c, bone: "hip" }))), texture: indexed(W.sheet(64, 64).image(), "t.bmp") }] }] }],
    sequences: [{ name: "idle", fps: 10, frames: [[[0, 0, 24, 0, 0, 0], [0, 0, -12, 0, 0, 0], [0, 0, -12, 0, 0, 0]]] }],
  }),
);

test("blob: pieces melted into one surface, the blend filling the joint between them", () => {
  const pieces = [{ kind: "capsule", a: [0, 0, 0], b: [0, 0, 10], r: [2, 2], bone: "a" }, { kind: "capsule", a: [0, 0, 10], b: [10, 0, 10], r: [2, 2], bone: "b" }];
  const plain = blob(pieces, { cells: 48, blend: 0 });
  const melted = blob(pieces, { cells: 48, blend: 4 });
  // at the elbow's inside corner the melted surface stands further from the bend's point than the plain one
  const inner = (r) => Math.max(...r.tris.flatMap((t) => t.map((c) => c.p)).filter((p) => p[0] > 1.5 && p[2] < 8.5 && Math.abs(p[1]) < 0.5).map((p) => Math.min(p[0] - 2, 8 - p[2])), 0);
  sure(inner(melted) > inner(plain) + 0.3, `fillet ${inner(melted)} against ${inner(plain)}`);
  sure(melted.pieceOf([0, 0, 2]).bone === "a" && melted.pieceOf([9, 0, 10]).bone === "b", "each point on its nearest piece's bone");
});

test("a blob part on a base: closed, its corners on the bones of its pieces, placed where the joints are", () => {
  const { report, mdl } = buildModelSpec(
    {
      spec: "smak.model/1",
      name: "legblob.mdl",
      kind: "character",
      base: { file: "leg.mdl" },
      parts: [{ id: "leg", kind: "blob", material: "cloth", blend: 3, pieces: [{ at: "hip", radius: [5, 4, 4] }, { span: ["hip", "knee"], radius: [4, 3] }, { span: ["knee", "ankle"], radius: [3, 2.5] }] }],
    },
    { folder },
  );
  sure(report.ok && mdl, [...report.errors, ...report.faults].join("; "));
  sure(report.facts.some((f) => /leg: a blob of 3 pieces blended over 3 units, \d+ triangles surfaced and reduced to \d+; its corners on 2 bones/.test(f)), report.facts.filter((f) => /blob/.test(f)).join(" | "));
  // the corners near the ankle hang on the knee (its span's first bone), those at the hip on the hip
  const info = readMdl(mdl);
  const sub = info.bodyparts[0].models.find((m) => m.meshes.some((x) => x.numtris > 0));
  const corners = sub.meshes.flatMap((mesh) => readMesh(mdl, sub, mesh).flat());
  const bones = new Set(corners.map((c) => c.bone));
  sure(bones.has(0) && bones.has(1) && !bones.has(2), `bones used: ${[...bones]}`);
  const box = report.parts.leg;
  sure(box && Math.abs(box.from[2] - (24 - 12 - 12 - 2.5)) < 1.5 && Math.abs(box.to[2] - (24 + 4)) < 1.5, JSON.stringify(box));
});

test("a blob's pieces are checked: a radius, one of span, at or from, bones only on a base", () => {
  const { report } = buildModelSpec({ spec: "smak.model/1", name: "b.mdl", kind: "prop", parts: [{ id: "b", kind: "blob", rotate: [0, 0, 90], pieces: [{ span: ["a", "b"] }, { at: [0, 0, 5], from: [0, 0, 0], to: [1, 1, 1], radius: 2 }] }] }, { folder });
  const said = report.errors.join(" | ");
  sure(/pieces\[0\]\.radius/.test(said) && /pieces\[0\]: bones are a base model's/.test(said) && /pieces\[1\]: one of span, at or from/.test(said) && /\(b\)\.rotate: a blob is placed by its pieces/.test(said), said);
  const prop = buildModelSpec({ spec: "smak.model/1", name: "snow.mdl", kind: "prop", parts: [{ id: "snowman", kind: "blob", material: "plaster", blend: 2, pieces: [{ at: [0, 0, 6], radius: 6 }, { at: [0, 0, 15], radius: 4 }, { from: [0, 0, 19], to: [0, 0, 22], radius: [2.5, 2] }] }] }, { folder });
  sure(prop.report.ok, [...prop.report.errors, ...prop.report.faults].join("; "));
});

// a shape mirrored: every corner has its twin through y 0 (a chair's seat, a body)
const mirroredIn = (mdl) => {
  const info = readMdl(mdl);
  const ps = info.bodyparts.flatMap((bp) => bp.models.flatMap((m) => m.meshes.flatMap((mesh) => readMesh(mdl, m, mesh).flat().map((c) => c.p ?? c.pos))));
  const near = (p) => ps.some((q) => Math.abs(q[0] - p[0]) < 0.05 && Math.abs(q[1] + p[1]) < 0.05 && Math.abs(q[2] - p[2]) < 0.05);
  return { all: ps.length, unmatched: ps.filter((p) => !near(p)).length, spread: Math.max(...ps.map((p) => p[1])) + Math.min(...ps.map((p) => p[1])) };
};

test("symmetric: a lopsided mesh made the mirror of its +y half, and a blob given each piece's twin", () => {
  // a wedge whose -y side leans out further than its +y side
  writeFileSync(join(folder, "lop.obj"), ["v 0 0 0", "v 4 0 0", "v 4 3 0", "v 0 3 0", "v 0 -1 4", "v 4 -1 4", "v 4 1 4", "v 0 1 4"].join("\n") + "\n" +
    ["f 1 3 2", "f 1 4 3", "f 5 6 7", "f 5 7 8", "f 1 2 6", "f 1 6 5", "f 2 3 7", "f 2 7 6", "f 3 4 8", "f 3 8 7", "f 4 1 5", "f 4 5 8"].join("\n") + "\n");
  const spec = (symmetric) => ({ spec: "smak.model/1", name: "lop.mdl", kind: "prop", parts: [{ id: "body", kind: "mesh", file: "lop.obj", up: "z", size: [8, 8, 8], symmetric }] });
  const lop = buildModelSpec(spec(false), { folder });
  const even = buildModelSpec(spec(true), { folder });
  sure(lop.report.ok && even.report.ok, [...lop.report.errors, ...even.report.errors].join("; "));
  sure(mirroredIn(lop.mdl).unmatched > 0, "the lopsided one is lopsided");
  const m = mirroredIn(even.mdl);
  sure(m.unmatched === 0, `${m.unmatched} of ${m.all} corners have no twin`);
  sure(even.report.facts.some((f) => /body: symmetric: its \+y half kept/.test(f)), even.report.facts.join(" | "));
  sure(even.report.faults.length === 0, even.report.faults.join("; "));
  // a blob: one arm given at +y, its twin made at -y
  const b = buildModelSpec({ spec: "smak.model/1", name: "arms.mdl", kind: "prop", parts: [{ id: "b", kind: "blob", symmetric: true, pieces: [{ at: [0, 0, 10], radius: [3, 3, 6] }, { from: [0, 2, 12], to: [0, 10, 8], radius: 1.5 }] }] }, { folder });
  sure(b.report.ok, b.report.errors.join("; "));
  sure(b.report.facts.some((f) => /b: symmetric: 1 pieces mirrored/.test(f)), b.report.facts.join(" | "));
  sure(Math.abs(mirroredIn(b.mdl).spread) < 0.6, `its sides reach ${mirroredIn(b.mdl).spread} apart`);
  const bad = buildModelSpec({ spec: "smak.model/1", name: "x.mdl", kind: "prop", parts: [{ id: "body", kind: "mesh", file: "lop.obj", size: [8, 8, 8], symmetric: "yes" }] }, { folder });
  sure(bad.report.errors.some((e) => /\(body\)\.symmetric: true/.test(e)), bad.report.errors.join(" | "));
});

test("a generated or carved body on a base: each corner on the limb nearest it, so one shape bends at the joints", () => {
  // a long box down the leg, as a generator's .obj would come: its top on the hip's limb, its foot on the knee's
  writeFileSync(join(folder, "post.obj"), ["v -1 -1 0", "v 1 -1 0", "v 1 1 0", "v -1 1 0", "v -1 -1 24", "v 1 -1 24", "v 1 1 24", "v -1 1 24", "v -1 -1 12", "v 1 -1 12", "v 1 1 12", "v -1 1 12"].join("\n") + "\n" +
    ["f 1 3 2", "f 1 4 3", "f 5 6 7", "f 5 7 8", "f 1 2 10", "f 1 10 9", "f 9 10 6", "f 9 6 5", "f 2 3 11", "f 2 11 10", "f 10 11 7", "f 10 7 6", "f 3 4 12", "f 3 12 11", "f 11 12 8", "f 11 8 7", "f 4 1 9", "f 4 9 12", "f 12 9 5", "f 12 5 8"].join("\n") + "\n");
  const { report, mdl } = buildModelSpec({ spec: "smak.model/1", name: "legmesh.mdl", kind: "character", base: { file: "leg.mdl" }, parts: [{ id: "leg", kind: "mesh", file: "post.obj", up: "z", size: [4, 4, 26], at: [0, 0, -1], material: "cloth" }] }, { folder });
  sure(report.ok && mdl, [...report.errors, ...report.faults].join("; "));
  const info = readMdl(mdl);
  const sub = info.bodyparts[0].models.find((m) => m.meshes.some((x) => x.numtris > 0));
  const corners = sub.meshes.flatMap((mesh) => readMesh(mdl, sub, mesh).flat());
  const bones = new Set(corners.map((c) => c.bone));
  sure(bones.has(0) && bones.has(1), `bones used: ${[...bones]}`);
});

test("symmetric keeps the count: the half cut at the middle is reduced again before it is mirrored, and stays closed", () => {
  // a lopsided ball of 1,200 or so triangles, its rings not lined up with the middle
  const v = [];
  const f = [];
  const rings = 20;
  const sides = 31;
  for (let i = 0; i <= rings; i++)
    for (let j = 0; j < sides; j++) {
      const t = (Math.PI * i) / rings;
      const a = (2 * Math.PI * j) / sides + 0.13;
      const r = 5 * (1 + 0.2 * Math.max(0, -Math.sin(t) * Math.sin(a)));
      v.push(`v ${(r * Math.sin(t) * Math.cos(a)).toFixed(4)} ${(r * Math.sin(t) * Math.sin(a)).toFixed(4)} ${(5 - 5 * Math.cos(t)).toFixed(4)}`);
    }
  const at = (i, j) => i * sides + (j % sides) + 1;
  for (let i = 0; i < rings; i++)
    for (let j = 0; j < sides; j++) {
      if (i > 0) f.push(`f ${at(i, j)} ${at(i + 1, j)} ${at(i, j + 1)}`);
      if (i < rings - 1) f.push(`f ${at(i, j + 1)} ${at(i + 1, j)} ${at(i + 1, j + 1)}`);
    }
  writeFileSync(join(folder, "ball.obj"), `${v.join("\n")}\n${f.join("\n")}\n`);
  const spec = (symmetric) => ({ spec: "smak.model/1", name: "ball.mdl", kind: "prop", parts: [{ id: "ball", kind: "mesh", file: "ball.obj", up: "z", size: [10, 10, 10], triangles: 400, symmetric }] });
  const plain = buildModelSpec(spec(false), { folder });
  const even = buildModelSpec(spec(true), { folder });
  const count = (r) => Number(/(\d+) triangles/.exec(r.report.facts.find((x) => /PARTS|ball \d+/.test(x)) ?? "")?.[1] ?? NaN);
  sure(even.report.ok && even.report.faults.length === 0, [...even.report.errors, ...even.report.faults].join("; "));
  const half = Number(/half kept \((\d+) triangles\)/.exec(even.report.facts.find((x) => /half kept/.test(x)))[1]);
  sure(half * 2 <= 420, `mirrored ${half * 2} against 400 asked (plain ${count(plain)})`);
  sure(mirroredIn(even.mdl).unmatched === 0, "still the mirror of itself");
});

test("fingers: tubes out of a hand along its forearm's line, curled forward, to points, on the hand", () => {
  // the leg's three bones stand in for an arm: the ankle is the hand, the knee its forearm
  const { report, mdl } = buildModelSpec({ spec: "smak.model/1", name: "claws.mdl", kind: "character", base: { file: "leg.mdl" }, parts: [
    { id: "arm", kind: "blob", pieces: [{ span: ["knee", "ankle"], radius: 1.5 }] },
    { id: "claw", kind: "fingers", hand: "ankle", count: 3, length: 8, radius: [0.4, 0.15], curl: 40 },
  ] }, { folder });
  sure(report.ok, [...report.errors, ...report.faults].join("; "));
  sure(report.facts.some((f) => /claw: 3 fingers out of ankle, 8 long, curled 40 degrees forward/.test(f)), report.facts.filter((f) => /claw/.test(f)).join(" | "));
  const info = readMdl(mdl);
  const sub = info.bodyparts[0].models.find((m) => m.meshes.some((x) => x.numtris > 0));
  const bones = new Set(sub.meshes.flatMap((mesh) => readMesh(mdl, sub, mesh).flat()).map((c) => c.bone));
  sure(bones.has(2), `the fingers on the hand: bones ${[...bones]}`);
  // they reach below the ankle (the arm points down) and forward of it (curled)
  const box = ["claw_1", "claw_2", "claw_3"].map((id) => report.parts[id]);
  sure(box.every((b) => b && b.from[2] < -4 && b.to[0] > 0.5), JSON.stringify(box));
  const bad = buildModelSpec({ spec: "smak.model/1", name: "b.mdl", kind: "prop", parts: [{ id: "c", kind: "fingers", count: 20 }] }, { folder });
  sure(bad.report.errors.some((e) => /\.hand: the base's hand bone/.test(e)) && bad.report.errors.some((e) => /count: 1 to 8/.test(e)), bad.report.errors.join(" | "));
});
