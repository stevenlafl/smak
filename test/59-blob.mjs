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
