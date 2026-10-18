// A character from a generated shape on a base (the shape generator's route): a body that fuses limbs the
// skeleton keeps apart is warned of, its back and sides carry the colours its front picture shows, its pictures
// are pulled to the base's own palette, and its base's stance fitted to the shape's own outlines.
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test, sure, tmp } from "./helper.mjs";
import { buildModelSpec, validateModelSpec } from "../src/spec/model.mjs";
import { buildMdl, workshop as W, textureOf, readMdl, readSequence, png, indexed } from "../src/index.mjs";
import { render } from "../src/render.mjs";

const folder = join(tmp, "generated-character");
mkdirSync(folder, { recursive: true });

// a trunk with an arm of four bones out to its left and a leg of four bones down: the trunk carries two limbs
// (a Biped's names, as the fit's swings find them)
const bones = [
  { name: "Bip01 Pelvis", parent: -1 },
  { name: "Bip01 L Clavicle", parent: 0 },
  { name: "Bip01 L UpperArm", parent: 1 },
  { name: "Bip01 L Forearm", parent: 2 },
  { name: "Bip01 L Hand", parent: 3 },
  { name: "Bip01 L Thigh", parent: 0 },
  { name: "Bip01 L Calf", parent: 5 },
  { name: "Bip01 L Foot", parent: 6 },
  { name: "Bip01 L Toe0", parent: 7 },
];
const frame = [
  [0, 0, 40, 0, 0, 0],
  [0, 12, 0, 0, 0, 0], [0, 0, -6, 0, 0, 0], [0, 0, -6, 0, 0, 0], [0, 0, -6, 0, 0, 0],
  [0, 3, -8, 0, 0, 0], [0, 0, -10, 0, 0, 0], [0, 0, -10, 0, 0, 0], [0, 0, -10, 0, 0, 0],
];
// its own body, in a muted brown so that its palette is the game's kind of colour: a trunk, and a tube down the
// arm and down the leg, each corner on the bone of the limb it is in (as a game's body is rigged)
const M = W.shape(64, 64);
M.lathe([[0, 3], [10, 3]], { x: 0, y: 0, w: 64, h: 22 }, { sides: 6, caps: [true, true], at: (s, a, b) => [a, b, 34 + s] });
M.lathe([[0, 1], [18, 1]], { x: 0, y: 22, w: 64, h: 21 }, { sides: 6, caps: [true, true], at: (s, a, b) => [a, 12 + b, 22 + s] });
M.lathe([[0, 1.5], [30, 1.5]], { x: 0, y: 43, w: 64, h: 21 }, { sides: 6, caps: [true, true], at: (s, a, b) => [a, 3 + b, 2 + s] });
const boneAt = ([, y, z]) =>
  y > 8 ? (z > 34 ? "Bip01 L Clavicle" : z > 28 ? "Bip01 L UpperArm" : z > 25 ? "Bip01 L Forearm" : "Bip01 L Hand")
  : z >= 34 ? "Bip01 Pelvis" : z > 22 ? "Bip01 L Thigh" : z > 12 ? "Bip01 L Calf" : "Bip01 L Foot";
const S = W.sheet(64, 64);
S.zone({ x: 0, y: 0, w: 64, h: 64 }, () => [0.45, 0.4, 0.36]);
writeFileSync(
  join(folder, "base.mdl"),
  buildMdl({
    name: "base.mdl",
    bones,
    bodyparts: [{ name: "body", models: [{ name: "t", meshes: [{ tris: M.tris.map((t) => t.map((c) => ({ ...c, bone: boneAt(c.p) }))), texture: indexed(S.image(), "t.bmp") }] }] }],
    sequences: [{ name: "idle", fps: 10, frames: [frame] }],
  }),
);
/** an .obj of quads, each [a, b, c, d] of corners [x, y, z] */
const obj = (quads) => {
  const v = quads.flat().map((p) => `v ${p.join(" ")}`);
  const f = quads.map((_, i) => `f ${4 * i + 1} ${4 * i + 2} ${4 * i + 3}\nf ${4 * i + 1} ${4 * i + 3} ${4 * i + 4}`);
  return `${v.join("\n")}\n${f.join("\n")}\n`;
};
/** a box from `lo` to `hi`, its faces outwards */
const box = (lo, hi) => {
  const [x0, y0, z0] = lo;
  const [x1, y1, z1] = hi;
  return [
    [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]],
    [[x0, y1, z0], [x0, y0, z0], [x0, y0, z1], [x0, y1, z1]],
    [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]],
    [[x1, y1, z0], [x0, y1, z0], [x0, y1, z1], [x1, y1, z1]],
    [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]],
    [[x0, y1, z0], [x1, y1, z0], [x1, y0, z0], [x0, y0, z0]],
  ];
};
/** mean saturation (HSV) of a model's first texture */
const saturationOf = (mdl) => {
  const t = textureOf(mdl, readMdl(mdl).textures.at(-1).name);
  let sum = 0;
  for (let i = 0; i < t.width * t.height; i++) {
    const c = [0, 1, 2].map((k) => t.palette[t.pixels[i] * 3 + k]);
    const mx = Math.max(...c);
    sum += mx ? (mx - Math.min(...c)) / mx : 0;
  }
  return sum / (t.width * t.height);
};

test("a generated body fusing an arm to a leg is warned of: triangles across limbs that meet far apart on the trunk", () => {
  // a ribbon from the arm's end (y 12) to the leg (y 3) at the arm's height: every triangle across the two
  const ribbon = Array.from({ length: 6 }, (_, i) => [[0, 3, 16 + i], [0, 12, 16 + i], [0, 12, 17 + i], [0, 3, 17 + i]]);
  writeFileSync(join(folder, "ribbon.obj"), obj([...ribbon, ...ribbon.map((q) => [...q].reverse())]));
  const spec = { spec: "smak.model/1", name: "ribbon.mdl", kind: "character", base: { file: "base.mdl" }, floor: 0, parts: [{ id: "web", kind: "mesh", file: "ribbon.obj", up: "z", size: [0.01, 9, 6], at: [0, 7.5, 16] }] };
  const { report } = buildModelSpec(spec, { folder });
  sure(report.warnings.some((w) => /^\d+ triangles join limbs that meet 4 or more joints apart on the trunk, which tear in any motion: most between L (Calf|Forearm) \+ L (Calf|Forearm)/.test(w)), [...report.errors, ...report.warnings].join(" | "));
});

test("a character's pictures are pulled to its base's palette, and its back carries its front's colours", () => {
  // a box in front of the trunk, painted from a picture of its front in a strong red on white
  writeFileSync(join(folder, "block.obj"), obj(box([-2, -4, 0], [2, 4, 20])));
  const red = Buffer.alloc(64 * 64 * 4);
  for (let i = 0; i < 64 * 64; i++) {
    const [x, y] = [i % 64, Math.floor(i / 64)];
    red.set(x >= 16 && x < 48 && y >= 4 && y < 60 ? [220, 30, 25, 255] : [255, 255, 255, 255], i * 4);
  }
  writeFileSync(join(folder, "red.png"), png(64, 64, red));
  const spec = (more) => ({ spec: "smak.model/1", name: "block.mdl", kind: "character", base: { file: "base.mdl" }, floor: 0, parts: [{ id: "body", kind: "mesh", file: "block.obj", up: "z", size: [4, 8, 20] }], project: [{ picture: "red.png", view: "front" }], ...more });
  const pulled = buildModelSpec(spec(), { folder });
  sure(pulled.mdl, [...pulled.report.errors, ...pulled.report.faults].join(" | "));
  sure(pulled.report.facts.some((f) => /its pictures pulled to its base's palette: saturation [\d.]+ as projected, 0\.2\d? as the base's own body has it/.test(f)), pulled.report.facts.join(" | "));
  const own = buildModelSpec(spec({ palette: "own" }), { folder });
  sure(saturationOf(pulled.mdl) < saturationOf(own.mdl) - 0.2 && Math.abs(saturationOf(pulled.mdl) - 0.2) < 0.08, `pulled ${saturationOf(pulled.mdl)}, own ${saturationOf(own.mdl)}`);
  sure(pulled.report.facts.some((f) => /^\d+ texels no picture sees \(its back, its sides\) carried the colour the front shows/.test(f)), pulled.report.facts.join(" | "));
  // the box's back, which the picture does not see, is red as its front is, not the material: drawn from behind
  const back = render(own.mdl, { seq: 0, view: "orbit", yaw: 180, pitch: 0, width: 128, height: 128, light: false, background: [0, 0, 255] });
  let [model, redder] = [0, 0];
  for (let i = 0; i < back.rgba.length; i += 4) {
    if (back.rgba[i + 2] === 255 && back.rgba[i] === 0) continue;
    model++;
    if (back.rgba[i] > back.rgba[i + 1] + 80) redder++;
  }
  sure(model > 100 && redder > 0.6 * model, `red on ${redder} of the ${model} dots seen from behind: the back carried`);
  sure(validateModelSpec(spec({ palette: "vivid" })).errors.some((e) => /palette: "own"/.test(e)), "another palette refused");
});

test("pose.bind: the body bound in the stance, the base's own first animation kept", () => {
  const aim = { "L arm": { out: 40 }, "L leg": { out: 10 } };
  const spec = (bind) => ({ spec: "smak.model/1", name: "bound.mdl", kind: "character", base: { file: "base.mdl" }, floor: 0, pose: { aim, ...(bind ? { bind: true } : {}) }, parts: [{ id: "body", kind: "mesh", file: "block.obj", up: "z", size: [4, 8, 20] }] });
  const own = readSequence(readFileSync(join(folder, "base.mdl")), 0).frames;
  const same = (mdl) => JSON.stringify(readSequence(mdl, 0).frames.map((f) => f.map((b) => b.map((v) => Math.round(v * 100))))) === JSON.stringify(own.map((f) => f.map((b) => b.map((v) => Math.round(v * 100)))));
  const bound = buildModelSpec(spec(true), { folder });
  sure(bound.mdl && same(bound.mdl) && bound.report.facts.some((f) => /^pose\.bind: the body bound in the stance, and the base's own first animation \(idle\) kept/.test(f)), [...bound.report.errors, ...bound.report.facts].join(" | "));
  sure(!same(buildModelSpec(spec(false), { folder }).mdl), "without bind the first animation stands in the stance");
  sure(validateModelSpec({ ...spec(true), pose: { bind: true } }).errors.some((e) => /pose\.bind: of a stance/.test(e)), "bind alone refused");
});

test('pose: { fit: "shape" } fits the base\'s stance to its own body\'s outlines, and wants a mesh or carved one', () => {
  const spec = { spec: "smak.model/1", name: "fitted.mdl", kind: "character", base: { file: "base.mdl" }, floor: 0, pose: { fit: "shape" }, parts: [{ id: "body", kind: "mesh", file: "block.obj", up: "z", size: [4, 8, 20] }] };
  const { report } = buildModelSpec(spec, { folder });
  sure(report.facts.some((f) => /^pose fitted to its own body from the front and the side \(the base's outlines' overlap [\d.]+ as it stood, [\d.]+ fitted/.test(f)), [...report.errors, ...report.facts].join(" | "));
  const none = validateModelSpec({ ...spec, parts: [{ id: "body", kind: "box", size: [4, 8, 20] }] });
  sure(none.errors.some((e) => /pose\.fit: "shape" fits the base to a mesh or carved body/.test(e)), none.errors.join(" | "));
});

test("a character carved from a few pictures, or painted from its front and back alone, is warned of", () => {
  const sides = /no projected picture sees its sides/;
  const block = (project) => ({ spec: "smak.model/1", name: "block.mdl", kind: "character", base: { file: "base.mdl" }, floor: 0, parts: [{ id: "body", kind: "mesh", file: "block.obj", up: "z", size: [4, 8, 20] }], project });
  const front = buildModelSpec(block([{ picture: "red.png", view: "front" }]), { folder });
  sure(front.report.warnings.some((w) => sides.test(w)), front.report.warnings.join(" | "));
  const all = buildModelSpec(block([{ picture: "red.png", view: "front" }, { picture: "red.png", yaw: 90 }, { picture: "red.png", view: "right" }]), { folder });
  sure(!all.report.warnings.some((w) => sides.test(w)), all.report.warnings.join(" | "));
  // a person's soldier carved from four photographs came out a cut-out and the build said every check passed
  const carved = buildModelSpec({ spec: "smak.model/1", name: "cut.mdl", kind: "character", base: { file: "base.mdl" }, floor: 0,
    parts: [{ id: "body", kind: "carved", size: [8, 30, 40], pictures: [{ picture: "red.png", view: "front" }, { picture: "red.png", yaw: 90 }] }] }, { folder });
  sure(carved.report.warnings.some((w) => /body: a character carved from 2 pictures is their outlines crossed.*generate \{ kind: "shape"/.test(w)), carved.report.warnings.join(" | "));
});
