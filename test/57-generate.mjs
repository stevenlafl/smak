// The MCP tool `generate`, with a stand-in for the model: a worker that writes a tone for each take, spoken to as
// the real one is (generators/worker.py). The real models need a GPU and their folder; this tests the tool's own
// part: the manifest, the worker kept loaded, the takes and their sidecars, the answer, a take used in a spec,
// and a shape made into a model's mesh part.
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { testAsync, sure, tmp } from "./helper.mjs";
import { toolsFor } from "../mcp/tools.mjs";
import { openFolders } from "../mcp/folders.mjs";
import { openGenerators, stopWorkers } from "../mcp/generate.mjs";
import { png, unpicture } from "../src/image.mjs";
import { buildMdl, indexed, workshop as W } from "../src/index.mjs";
import { openPosePicture } from "../src/openpose.mjs";

/** a box of 12 triangles about the pelvis, on it */
const boxTris = () => {
  const M = W.shape(16, 16);
  M.lathe([[0, 4], [20, 4]], { x: 0, y: 0, w: 16, h: 16 }, { sides: 4, caps: [true, true], at: (s, a, b) => [a, b, 30 + s] });
  return M.tris.map((t) => t.map((c) => ({ ...c, bone: "Bip01 Pelvis" })));
};

const folder = join(tmp, "generators");
mkdirSync(join(folder, "venv"), { recursive: true });
// a "python" that answers as the worker does: ready, then a take a line (a decaying tone at 48 kHz, float, stereo
// for music), counting how many times it was started
const fake = join(folder, "venv", "python");
writeFileSync(
  fake,
  `#!/usr/bin/env node
const fs = require("node:fs");
const model = process.argv[process.argv.indexOf("--model") + 1];
fs.appendFileSync(${JSON.stringify(join(folder, "starts.txt"))}, model + "\\n");
const say = (o) => process.stdout.write(JSON.stringify(o) + "\\n");
say({ ready: true, model, load: 0.1 });
let buffer = "";
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  let at;
  while ((at = buffer.indexOf("\\n")) >= 0) {
    const r = JSON.parse(buffer.slice(0, at));
    buffer = buffer.slice(at + 1);
    if (model === "cutter") {
      // a segment model: the subject asked for, its mask, cut-out and white picture (the seen picture each)
      fs.appendFileSync(${JSON.stringify(join(folder, "cuts.txt"))}, (r.subject ?? "point " + r.point) + " " + r.detector + "\\n");
      if ((r.subject ?? "").includes("unicorn")) { say({ id: r.id, ok: false, error: "no a unicorn found by owlv2, gdino, yoloworld" }); continue; }
      fs.mkdirSync(require("node:path").dirname(r.out), { recursive: true });
      for (const end of ["_mask.png", "_cut.png", "_white.png"]) fs.copyFileSync(${JSON.stringify(join(folder, "seen.png"))}, r.out + end);
      say({ id: r.id, ok: true, box: [1, 2, 10, 12], score: 0.5, detector: "vote (gdino, CLIP 0.3)", boxes: [{ detector: "gdino", box: [1, 2, 10, 12], score: 0.5, clip: 0.3 }, { detector: "owlv2", box: [20, 2, 30, 12], score: 0.2, clip: 0.1 }], mask: r.out + "_mask.png", cut: r.out + "_cut.png", white: r.out + "_white.png", covered: 0.12, took: 0.01 });
      continue;
    }
    if (r.picture && r.out.endsWith(".obj")) fs.appendFileSync(${JSON.stringify(join(folder, "shaped.txt"))}, r.picture + "\\n");
    if ((r.prompt ?? "").includes("fail")) { say({ id: r.id, ok: false, error: "RuntimeError: asked to" }); continue; }
    if (model === "sider") {
      // a paint model: six views of the mesh "painted" from its front picture, into its folder
      fs.appendFileSync(${JSON.stringify(join(folder, "sides.txt"))}, r.mesh + " " + r.reference + "\\n");
      fs.mkdirSync(r.out, { recursive: true });
      const views = [[0, 0], [90, 0], [180, 0], [270, 0], [0, 90], [180, -90]].map(([azim, elev], i) => {
        const file = require("node:path").join(r.out, "view_" + i + ".png");
        fs.copyFileSync(${JSON.stringify(join(folder, "seen.png"))}, file);
        return { file, azim, elev };
      });
      say({ id: r.id, ok: true, file: r.out, views, took: 0.03 });
      continue;
    }
    if (model === "painter") {
      // a picture model: the picture it "drew", and the pose it was held to
      fs.appendFileSync(${JSON.stringify(join(folder, "controls.txt"))}, (r.control ?? "none") + " " + (r.width ?? "-") + "x" + (r.height ?? "-") + "\\n");
      fs.mkdirSync(require("node:path").dirname(r.out), { recursive: true });
      fs.copyFileSync(${JSON.stringify(join(folder, "seen.png"))}, r.out);
      say({ id: r.id, ok: true, picture: r.out, took: 0.01 });
      continue;
    }
    if (r.out.endsWith(".obj") && r.only === "picture") {
      fs.mkdirSync(require("node:path").dirname(r.out), { recursive: true });
      fs.copyFileSync(${JSON.stringify(join(folder, "seen.png"))}, r.out.replace(/\\.obj$/, ".png"));
      say({ id: r.id, ok: true, picture: r.out.replace(/\\.obj$/, ".png"), took: 0.01 });
      continue;
    }
    if (r.out.endsWith(".obj")) {
      if (r.guide) fs.appendFileSync(${JSON.stringify(join(folder, "guides.txt"))}, r.guide + "\\n");
      // more pictures to cut out beside it (a turnaround's back)
      for (const more of r.cuts ?? []) fs.copyFileSync(more, more.replace(/\\.png$/, "_cut.png"));
      // a shape: a box twice as tall as it is wide, Y up, and the picture it was "made from"
      const v = [[-1,0,-1],[1,0,-1],[1,0,1],[-1,0,1],[-1,4,-1],[1,4,-1],[1,4,1],[-1,4,1]];
      const f = [[1,3,2],[1,4,3],[5,6,7],[5,7,8],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,4,8],[3,8,7],[4,1,5],[4,5,8]];
      fs.mkdirSync(require("node:path").dirname(r.out), { recursive: true });
      fs.writeFileSync(r.out, v.map((p) => "v " + p.join(" ")).join("\\n") + "\\n" + f.map((t) => "f " + t.join(" ")).join("\\n") + "\\n");
      const picture = r.picture ? null : r.out.replace(/\\.obj$/, ".png");
      if (picture) fs.copyFileSync(${JSON.stringify(join(folder, "seen.png"))}, picture);
      // its subject cut out beside it, as the shape model does
      fs.copyFileSync(r.picture ?? picture, r.out.replace(/\\.obj$/, "_cut.png"));
      say({ id: r.id, ok: true, file: r.out, faces: 12, box: [[-1, 0, -1], [1, 4, 1]], picture, took: 0.02 });
      continue;
    }
    const rate = 48000, channels = model === "tune" ? 2 : 1, n = Math.round(Math.min(r.length, 5) * rate);
    const data = Buffer.alloc(n * channels * 4);
    for (let i = 0; i < n; i++) for (let c = 0; c < channels; c++) data.writeFloatLE(0.5 * Math.exp(-i / 4000) * Math.sin((2 * Math.PI * (600 + 100 * r.seed) * i) / rate), (i * channels + c) * 4);
    const fmt = Buffer.alloc(16);
    fmt.writeUInt16LE(3, 0); fmt.writeUInt16LE(channels, 2); fmt.writeUInt32LE(rate, 4); fmt.writeUInt32LE(rate * 4 * channels, 8); fmt.writeUInt16LE(4 * channels, 12); fmt.writeUInt16LE(32, 14);
    const chunkOf = (id, body) => Buffer.concat([Buffer.from(id), Buffer.from(Uint32Array.of(body.length).buffer), body]);
    fs.mkdirSync(require("node:path").dirname(r.out), { recursive: true });
    fs.writeFileSync(r.out, chunkOf("RIFF", Buffer.concat([Buffer.from("WAVE"), chunkOf("fmt ", fmt), chunkOf("data", data)])));
    say({ id: r.id, ok: true, file: r.out, rate, channels, seconds: n / rate, took: 0.01 });
  }
});
`,
);
chmodSync(fake, 0o755);
writeFileSync(
  join(folder, "generators.json"),
  JSON.stringify({ models: [{ name: "clang", kind: "sound", python: "venv/python", licence: "CC-BY-NC 4.0", default: true, longest: 5 }, { name: "tune", kind: "music", python: "venv/python", licence: "MIT", default: true }, { name: "former", kind: "shape", root: ".", python: "venv/python", licence: "non-commercial" }] }),
);
writeFileSync(join(folder, "seen.png"), png(8, 8, Buffer.alloc(8 * 8 * 4, 200)));

await testAsync("generate: takes of a prompt by the kind's default model, each with its sidecar, measured, drawn, and kept loaded", "generate", async () => {
  try {
    await generateCase();
  } finally {
    stopWorkers();
  }
});

async function generateCase() {
  const folders = openFolders({ work: join(tmp, "gen-work") });
  folders.generators = openGenerators(folder);
  const tools = Object.fromEntries(toolsFor(folders).map((t) => [t.name, t]));
  sure(tools.generate && /clang \(sound, the default, CC-BY-NC 4.0\)/.test(tools.generate.description), "the tool, naming its models");
  const answer = await tools.generate.call({ prompt: "a wrench on a pipe", length: 0.5, seeds: 3, name: "hit", class: "metal hit" });
  const said = answer[0].text;
  sure(/3 of 3 takes of "a wrench on a pipe" by clang \(sound; licence CC-BY-NC 4\.0\); the model loaded in 0\.1 s/.test(said), said);
  sure(/work:gen\/hit_s2\.wav: 0\.5 s at 48000 Hz, made in 0\.01 s; peak .* against metal hit: \d+ of \d+/.test(said), said);
  sure(answer[1]?.type === "image", "one picture of the takes");
  const sidecar = JSON.parse(readFileSync(join(folders.work, "gen", "hit_s1.json"), "utf8"));
  sure(sidecar.model === "clang" && sidecar.seed === 1 && sidecar.licence === "CC-BY-NC 4.0" && sidecar.prompt === "a wrench on a pipe", JSON.stringify(sidecar));
  // more seeds of the same prompt: the model is not loaded again, the load not told again
  const more = (await tools.generate.call({ prompt: "a wrench on a pipe", length: 0.5, seeds: 2, from: 3, name: "hit" }))[0].text;
  sure(/2 of 2 takes/.test(more) && !/loaded/.test(more) && existsSync(join(folders.work, "gen", "hit_s4.wav")), more);
  // a take that fails is told, the others made
  const failed = (await tools.generate.call({ prompt: "fail please", length: 0.5, seeds: 1 }))[0].text;
  sure(/0 of 1 takes/.test(failed) && /seed 0: failed: RuntimeError: asked to/.test(failed), failed);
  // music: another model, so the first is stopped and this one started; its hint says no spec writes music yet
  const tune = (await tools.generate.call({ kind: "music", prompt: "a tune", length: 2, seeds: 1, bpm: 120 }))[0].text;
  sure(/by tune \(music; licence MIT\)/.test(tune) && /\(2 channels\)/.test(tune) && /No spec writes music/.test(tune), tune);
  sure(readFileSync(join(folder, "starts.txt"), "utf8").trim().split("\n").join(",") === "clang,tune", "each model started once");
  // a spec of layers alone, on a server that has generators, is told of them
  const layered = (await tools.build.call({ spec: { spec: "smak.sound/1", name: "weapons/beep.wav", layers: [{ kind: "tone", f: 880, env: { decay: 0.2 } }] } }))[0].text;
  sure(/note  made of layers alone: this server makes recordings \(the tool generate, clang\)/.test(layered), layered);
  // a take used in a sound spec through build
  const built = (await tools.build.call({ spec: { spec: "smak.sound/1", name: "weapons/hit.wav", layers: [{ kind: "sample", file: "work:gen/hit_s0.wav", from: "onset" }] } }))[0].text;
  sure(!/made of layers alone/.test(built), "no note once a take is used");
  sure(/^OK/.test(built) && /made by clang seed 0 from "a wrench on a pipe", licence CC-BY-NC 4\.0 \(non-commercial\)/.test(built) && !/may not be sold/.test(built), built);
  // refused in words
  for (const [args, said] of [[{ prompt: "", length: 1 }, /prompt:/], [{ prompt: "x", length: 0 }, /length:/], [{ prompt: "x", length: 1, model: "none" }, /model: one of clang \(sound\), tune \(music\)/], [{ prompt: "x", length: 1, seeds: 99 }, /seeds:/]]) {
    let message = "";
    try {
      await tools.generate.call(args);
    } catch (error) {
      message = error.message;
    }
    sure(said.test(message), `${JSON.stringify(args)}: ${message}`);
  }
  // a shape from words: the .obj, the picture it came from and its sidecar; then a model spec's mesh part made of it
  const shaped = await tools.generate.call({ kind: "shape", prompt: "a tall crate", seeds: 1, name: "crate" });
  sure(/1 of 1 shapes of "a tall crate" by former/.test(shaped[0].text) && /work:gen\/crate_s0\.obj: 12 triangles, 2 x 4 x 2/.test(shaped[0].text) && shaped[1]?.type === "image", shaped[0].text);
  sure(JSON.parse(readFileSync(join(folders.work, "gen", "crate_s0.json"), "utf8")).picture === "gen/crate_s0.png", "its sidecar names its picture");
  const model = (await tools.build.call({ spec: { spec: "smak.model/1", name: "crate.mdl", kind: "prop", parts: [{ id: "body", kind: "mesh", file: "work:gen/crate_s0.obj", size: [16, 16, 32], material: "wood" }] } }))[0].text;
  sure(/^OK/.test(model) && /body: the shape of work:gen\/crate_s0\.obj, 12 triangles reduced to 12, fitted to 16 x 16 x 32 \(its own proportions 0\.5 : 0\.5 : 1\)/.test(model) && /body 12 -8 -8 0 to 8 8 32/.test(model), model);
  // painted by its material alone, the picture it was made from left unused: told, with the cut-out to project
  sure(/body: painted by its material alone, where the picture its shape was made from \(work:gen\/crate_s0\.png\) is the paint it has.*work:gen\/crate_s0_cut\.png/.test(model), model);
  const squashed = (await tools.build.call({ spec: { spec: "smak.model/1", name: "crate2.mdl", kind: "prop", parts: [{ id: "body", kind: "mesh", file: "work:gen/crate_s0.obj", size: [32, 32, 32] }] } }))[0].text;
  sure(/stretched 100% more one way than another: give size its own proportions \(16 x 16 x 32/.test(squashed), squashed);
  // a character: drawn over its base in the stance it is built in, the guide handed to the worker, the stance kept
  const biped = buildMdl({
    name: "biped.mdl",
    bones: [
      { name: "Bip01 Pelvis", parent: -1 },
      ...["L", "R"].flatMap((s, k) => [
        { name: `Bip01 ${s} UpperArm`, parent: 0 }, { name: `Bip01 ${s} Forearm`, parent: 1 + k * 6 }, { name: `Bip01 ${s} Hand`, parent: 2 + k * 6 },
        { name: `Bip01 ${s} Thigh`, parent: 0 }, { name: `Bip01 ${s} Calf`, parent: 4 + k * 6 }, { name: `Bip01 ${s} Foot`, parent: 5 + k * 6 },
      ]),
    ],
    bodyparts: [{ name: "body", models: [{ name: "b", meshes: [{ tris: boxTris(), texture: indexed(W.sheet(16, 16).image(), "b.bmp") }] }] }],
    sequences: [{ name: "idle", fps: 10, frames: [[[0, 0, 40, 0, 0, 0], ...["L", "R"].flatMap((s, k) => { const y = k ? -1 : 1; return [[0, 8 * y, 14, 0, 0, 0], [0, 0, -11, 0, 0, 0], [0, 0, -10, 0, 0, 0], [0, 4 * y, -2, 0, 0, 0], [0, 0, -18, 0, 0, 0], [0, 0, -18, 0, 0, 0]]; })]] }],
  });
  writeFileSync(join(folders.work, "biped.mdl"), biped);
  const guided = await tools.generate.call({ kind: "shape", prompt: "a security guard", base: "biped.mdl", seeds: 1, name: "people/guard" });
  sure(/Drawn in biped\.mdl's stance \(work:people\/guard_guide\.png\): build it on that base in the same one, "base": \{ "file": "biped\.mdl" \}, "pose": \{ "aim": \{"L arm":\{"out":30/.test(guided[0].text), guided[0].text);
  sure(existsSync(join(folders.work, "people", "guard_guide.png")) && readFileSync(join(folder, "guides.txt"), "utf8").includes("guard_guide.png"), "the guide drawn and handed to the worker");
  sure(JSON.parse(readFileSync(join(folders.work, "people", "guard_s0.json"), "utf8")).stance?.["L arm"]?.out === 30, "its sidecar keeps the stance");
  // the pictures alone first, looked at against the brief; then the shape of the one chosen, in the base's stance
  const drawn = await tools.generate.call({ kind: "shape", prompt: "a security guard", base: "biped.mdl", only: "picture", seeds: 2, name: "people/look" });
  sure(/2 of 2 pictures of "a security guard"/.test(drawn[0].text) && /work:people\/look_s0\.png/.test(drawn[0].text) && drawn[1]?.type === "image" && !existsSync(join(folders.work, "people", "look_s0.obj")), drawn[0].text);
  sure(/then make its shape: generate \{ kind: "shape", picture: "work:<it>", base: "biped\.mdl" \}/.test(drawn[0].text), drawn[0].text);
  const guidesBefore = readFileSync(join(folder, "guides.txt"), "utf8");
  const chosen = await tools.generate.call({ kind: "shape", picture: "work:people/look_s1.png", base: "biped.mdl", seeds: 1, name: "people/chosen" });
  sure(/1 of 1 shapes of the picture work:people\/look_s1\.png/.test(chosen[0].text) && /Drawn in biped\.mdl's stance/.test(chosen[0].text), chosen[0].text);
  sure(readFileSync(join(folder, "guides.txt"), "utf8") === guidesBefore, "a picture already drawn is not drawn over the guide again");
  let wrong = "";
  try {
    await tools.generate.call({ kind: "shape", picture: "work:people/look_s1.png", only: "picture" });
  } catch (error) {
    wrong = error.message;
  }
  sure(/only: "picture": the pictures drawn from the prompt and no shape/.test(wrong), wrong);
  stopWorkers();
  const none = toolsFor(openFolders({ work: join(tmp, "gen-work") }));
  sure(!none.some((t) => t.name === "generate"), "no generators, no tool");
}

await testAsync("generate: a character from words with a picture model is drawn held to its base's pose, then shaped from that picture", "generate", async () => {
  const painted = join(tmp, "generators-painted");
  mkdirSync(painted, { recursive: true });
  writeFileSync(join(painted, "generators.json"), JSON.stringify({ models: [{ name: "former", kind: "shape", root: folder, python: "venv/python", licence: "non-commercial", default: true }, { name: "painter", kind: "picture", root: folder, python: "venv/python", licence: "Apache-2.0" }] }));
  try {
    const folders = openFolders({ work: join(tmp, "gen-painted") });
    folders.generators = openGenerators(painted);
    const generate = toolsFor(folders).find((t) => t.name === "generate");
    // a biped with a neck and a head: its skeleton is what OpenPose draws
    const side = (s, k, from) => [{ name: `Bip01 ${s} UpperArm`, parent: 1 }, { name: `Bip01 ${s} Forearm`, parent: from }, { name: `Bip01 ${s} Hand`, parent: from + 1 }, { name: `Bip01 ${s} Thigh`, parent: 0 }, { name: `Bip01 ${s} Calf`, parent: from + 3 }, { name: `Bip01 ${s} Foot`, parent: from + 4 }];
    const values = (y) => [[0, 8 * y, -4, 0, 0, 0], [0, 0, -11, 0, 0, 0], [0, 0, -10, 0, 0, 0], [0, 4 * y, -2, 0, 0, 0], [0, 0, -18, 0, 0, 0], [0, 0, -18, 0, 0, 0]];
    writeFileSync(join(folders.work, "man.mdl"), buildMdl({
      name: "man.mdl",
      bones: [{ name: "Bip01 Pelvis", parent: -1 }, { name: "Bip01 Neck", parent: 0 }, { name: "Bip01 Head", parent: 1 }, ...side("L", 0, 3), ...side("R", 1, 9)],
      bodyparts: [{ name: "body", models: [{ name: "b", meshes: [{ tris: boxTris(), texture: indexed(W.sheet(16, 16).image(), "b.bmp") }] }] }],
      sequences: [{ name: "idle", fps: 10, frames: [[[0, 0, 40, 0, 0, 0], [0, 0, 20, 0, 0, 0], [0, 0, 6, 0, 0, 0], ...values(1), ...values(-1)]] }],
    }));
    // seen from the front, the subject's right shoulder (OpenPose's point 2) is to the picture's left of its left (5):
    // what tells a drawing which way the figure faces
    const pose = openPosePicture(readFileSync(join(folders.work, "man.mdl")), { width: 256, height: 256 });
    sure(pose && pose.points.length === 18 && pose.points[2][0] < pose.points[5][0] && pose.points[0][1] < pose.points[1][1], JSON.stringify(pose?.points));
    const looked = await generate.call({ kind: "shape", prompt: "a security guard", base: "man.mdl", only: "picture", seeds: 2, name: "people/man" });
    sure(/2 of 2 pictures of "a security guard" by painter, held to man\.mdl's pose \(work:people\/man_pose\.png\)/.test(looked[0].text) && !existsSync(join(folders.work, "people", "man_s0.obj")), looked[0].text);
    sure(existsSync(join(folders.work, "people", "man_pose.png")) && readFileSync(join(folder, "controls.txt"), "utf8").includes("man_pose.png"), "the pose drawn and handed to the picture model");
    const shaped = await generate.call({ kind: "shape", prompt: "a security guard", base: "man.mdl", seeds: 1, name: "people/whole" });
    sure(/1 of 1 shapes of "a security guard" by former/.test(shaped[0].text) && /from work:people\/whole_s0\.png/.test(shaped[0].text) && /Drawn in man\.mdl's stance \(work:people\/whole_pose\.png, by painter\)/.test(shaped[0].text), shaped[0].text);
    const sidecar = JSON.parse(readFileSync(join(folders.work, "people", "whole_s0.json"), "utf8"));
    sure(sidecar.drawnBy === "painter" && sidecar.picture === "people/whole_s0.png" && sidecar.pose === "people/whole_pose.png", JSON.stringify(sidecar));
    // no paint model among the generators: its sides are said to be left unpainted
    sure(/Its sides are not painted: no paint model in generators\.json/.test(shaped[0].text), shaped[0].text);
    // a turnaround: front and back drawn as one picture over the skeleton from both sides, then cut in two; from
    // behind the subject's right shoulder is to the picture's right, and no nose or eyes are drawn
    const behind = openPosePicture(readFileSync(join(folders.work, "man.mdl")), { back: true, width: 256, height: 256 });
    sure(behind.points[2][0] > behind.points[5][0], `from behind the right shoulder is right of the left: ${JSON.stringify(behind.points.slice(1, 6))}`);
    const turned = await generate.call({ kind: "shape", prompt: "a security guard", base: "man.mdl", turnaround: true, only: "picture", seeds: 1, name: "people/turn" });
    sure(/work:people\/turn_s0\.png \(front\), work:people\/turn_s0_back\.png \(its back, drawn with it\)/.test(turned[0].text), turned[0].text);
    sure(readFileSync(join(folder, "controls.txt"), "utf8").includes("turn_pose.png 2048x1024"), "the sheet twice as wide, held to the pose from both sides");
    const sheetPose = unpicture(readFileSync(join(folders.work, "people", "turn_pose.png")));
    sure(sheetPose.width === 2048 && sheetPose.height === 1024, `the pose sheet ${sheetPose.width} x ${sheetPose.height}`);
    sure(existsSync(join(folders.work, "people", "turn_s0_back.png")) && existsSync(join(folders.work, "people", "turn_s0_sheet.png")), "the back cut from the sheet, and the sheet kept");
    const turnedShape = await generate.call({ kind: "shape", prompt: "a security guard", base: "man.mdl", turnaround: true, seeds: 1, name: "people/turnshape" });
    sure(/Its back was drawn with its front, in one picture \(a turnaround\).*"view": "back".*seed 0: work:people\/turnshape_s0_back_cut\.png/.test(turnedShape[0].text), turnedShape[0].text);
    sure(JSON.parse(readFileSync(join(folders.work, "people", "turnshape_s0.json"), "utf8")).back === "people/turnshape_s0_back.png", "its sidecar names its back");
    sure(existsSync(join(folders.work, "people", "turnshape_s0_back_cut.png")), "its back cut out with its front");
    // the front chosen from an earlier look: its back found beside it and cut out too
    await generate.call({ kind: "shape", picture: "work:people/turn_s0.png", base: "man.mdl", seeds: 1, name: "people/chosen" });
    sure(existsSync(join(folders.work, "people", "turn_s0_back_cut.png")), "the chosen front's back cut out");
    let refusedTurn = "";
    try {
      await generate.call({ kind: "shape", prompt: "a crate", turnaround: true });
    } catch (error) {
      refusedTurn = error.message;
    }
    sure(/turnaround: true draws a character's front and back together/.test(refusedTurn), refusedTurn);
    // a base with no neck and head to draw a pose of: the shape model's own drawing over its grey figure
    writeFileSync(join(folders.work, "stub.mdl"), readFileSync(join(tmp, "gen-work", "biped.mdl")));
    const stub = await generate.call({ kind: "shape", prompt: "a security guard", base: "stub.mdl", seeds: 1, name: "people/stub" });
    sure(/Drawn in stub\.mdl's stance \(work:people\/stub_guide\.png\)/.test(stub[0].text), stub[0].text);
    // with a paint model: once the shape is made its sides are painted from its front picture, the shape model let
    // go first, and the answer gives the spec's whole project: front and back cut-outs, the sides at yaw 90 and 270
    const sided = join(tmp, "generators-sided");
    mkdirSync(sided, { recursive: true });
    writeFileSync(join(sided, "generators.json"), JSON.stringify({ models: [...JSON.parse(readFileSync(join(painted, "generators.json"), "utf8")).models, { name: "sider", kind: "paint", root: folder, python: "venv/python", licence: "Tencent Hunyuan Community" }] }));
    folders.generators = openGenerators(sided);
    const withSides = await generate.call({ kind: "shape", prompt: "a security guard", base: "man.mdl", turnaround: true, seeds: 1, name: "people/sided" });
    const said = withSides[0].text;
    sure(readFileSync(join(folder, "sides.txt"), "utf8").includes("people/sided_s0.obj") && readFileSync(join(folder, "sides.txt"), "utf8").includes("people/sided_s0_cut.png"), "its mesh and its front cut-out handed to the paint model");
    sure(/Its sides were painted by sider from its front picture/.test(said) && said.includes('seed 0: "project": [{"picture":"work:people/sided_s0_cut.png","view":"front"},{"picture":"work:people/sided_s0_back_cut.png","view":"back"},{"picture":"work:people/sided_s0_sides/view_1.png","yaw":90},{"picture":"work:people/sided_s0_sides/view_3.png","yaw":270}]') && !/Its back was drawn with its front/.test(said), said);
    sure(JSON.parse(readFileSync(join(folders.work, "people", "sided_s0.json"), "utf8")).sides?.length === 2, "its sidecar names its sides");
    // sides: false paints none; a word that is not a boolean is refused
    const painted0 = readFileSync(join(folder, "sides.txt"), "utf8").split("\n").length;
    const plain = await generate.call({ kind: "shape", prompt: "a security guard", base: "man.mdl", sides: false, seeds: 1, name: "people/plain" });
    sure(readFileSync(join(folder, "sides.txt"), "utf8").split("\n").length === painted0 && !/Its sides/.test(plain[0].text), plain[0].text);
    let wrongSides = "";
    try {
      await generate.call({ kind: "shape", prompt: "a security guard", base: "man.mdl", sides: "yes" });
    } catch (error) {
      wrongSides = error.message;
    }
    sure(/sides: false leaves a character's sides unpainted/.test(wrongSides), wrongSides);
  } finally {
    stopWorkers();
  }
});

await testAsync("generate: a subject cut out of a picture by words, alone and before a shape is made of it", "generate", async () => {
  const cutting = join(tmp, "generators-cutting");
  mkdirSync(cutting, { recursive: true });
  writeFileSync(join(cutting, "generators.json"), JSON.stringify({ models: [{ name: "former", kind: "shape", root: folder, python: "venv/python", licence: "non-commercial", default: true }, { name: "cutter", kind: "segment", root: folder, python: "venv/python", licence: "Apache-2.0 and AGPL-3.0" }] }));
  try {
    const folders = openFolders({ work: join(tmp, "gen-cutting") });
    folders.generators = openGenerators(cutting);
    const generate = toolsFor(folders).find((t) => t.name === "generate");
    mkdirSync(join(folders.work, "refs"), { recursive: true });
    writeFileSync(join(folders.work, "refs", "shop.png"), readFileSync(join(folder, "seen.png")));
    // the cut alone: its files, the box and score, each detector's own, and a picture of it beside the picture
    const cut = await generate.call({ kind: "segment", picture: "work:refs/shop.png", subject: "the metal cage" });
    sure(/"the metal cage" cut from work:refs\/shop\.png by vote \(gdino, CLIP 0\.3\): box 1, 2, 10, 12, score 0\.5, 12% of the picture/.test(cut[0].text) && /each detector's own: gdino 1,2,10,12 \(0\.5, CLIP 0\.3\); owlv2/.test(cut[0].text) && cut[1]?.type === "image", cut[0].text);
    sure(["_mask.png", "_cut.png", "_white.png"].every((end) => existsSync(join(folders.work, "gen", `shop_the_metal_cage${end}`))) && /work:gen\/shop_the_metal_cage_white\.png \(the subject alone on white, cropped\)/.test(cut[0].text), cut[0].text);
    sure(readFileSync(join(folder, "cuts.txt"), "utf8").includes("the metal cage vote"), "the vote by default");
    // a shape of a subject in a cluttered picture: cut first, the shape made of the white picture
    const shaped = await generate.call({ kind: "shape", picture: "work:refs/shop.png", subject: "a chair", seeds: 1, name: "chair" });
    sure(/1 of 1 shapes of the picture work:refs\/shop\.png/.test(shaped[0].text) && readFileSync(join(folder, "shaped.txt"), "utf8").trim().split("\n").at(-1).endsWith("shop_a_chair_white.png"), shaped[0].text);
    // one not found is said, and a subject with no picture refused
    let lost = "";
    try {
      await generate.call({ kind: "segment", picture: "work:refs/shop.png", subject: "a unicorn" });
    } catch (error) {
      lost = error.message;
    }
    sure(/subject: no a unicorn found by owlv2, gdino, yoloworld/.test(lost), lost);
    let bare = "";
    try {
      await generate.call({ kind: "shape", prompt: "a chair", subject: "a chair" });
    } catch (error) {
      bare = error.message;
    }
    sure(/subject: the thing to cut out of the picture in words \("the chair"\), with picture/.test(bare), bare);
  } finally {
    stopWorkers();
  }
});

await testAsync("generate: several default models of a kind each make the takes, their files named after them", "generate", async () => {
  const two = join(tmp, "generators-two");
  mkdirSync(two, { recursive: true });
  writeFileSync(join(two, "generators.json"), JSON.stringify({ models: [{ name: "clang", kind: "sound", root: folder, python: "venv/python", licence: "MIT", default: true }, { name: "bong", kind: "sound", root: folder, python: "venv/python", licence: "MIT", default: true }] }));
  try {
    const folders = openFolders({ work: join(tmp, "gen-two") });
    folders.generators = openGenerators(two);
    const generate = toolsFor(folders).find((t) => t.name === "generate");
    const answer = await generate.call({ prompt: "a wrench on a pipe", length: 0.5, seeds: 2, name: "hit" });
    const said = answer.filter((p) => p.type === "text").map((p) => p.text).join("\n");
    sure(/^Takes from 2 models, each better at some sounds than the other: clang, bong/.test(said), said);
    for (const f of ["hit_clang_s0", "hit_clang_s1", "hit_bong_s0", "hit_bong_s1"]) sure(existsSync(join(folders.work, "gen", `${f}.wav`)), f);
    sure(JSON.parse(readFileSync(join(folders.work, "gen", "hit_bong_s1.json"), "utf8")).model === "bong", "each sidecar names its model");
    sure(answer.filter((p) => p.type === "image").length === 2, "a picture a model");
    const one = (await generate.call({ prompt: "a wrench on a pipe", length: 0.5, seeds: 1, name: "solo", model: "bong" }))[0].text;
    sure(/1 of 1 takes .* by bong/.test(one) && existsSync(join(folders.work, "gen", "solo_s0.wav")), one);
  } finally {
    stopWorkers();
  }
});
