// Video: a camera path walked at an even speed, a shot list previewed and made into frames checked for
// smoothness, a GIF of our own that a reader takes back, and the tool that builds it all from a spec.
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test, testAsync, sure, tmp } from "./helper.mjs";
import { walkPath, simplify, curveOf } from "../src/camera.mjs";
import { gif, gifFrame, framesOfShot } from "../src/video.mjs";
import { buildModelSpec } from "../src/spec/model.mjs";
import { toolsFor } from "../mcp/tools.mjs";

test("a camera path through corners is walked at an even speed, and a zigzag route is kept where it turns", () => {
  const eyes = walkPath([[0, 0, 0], [100, 0, 0], [100, 100, 0], [0, 100, 0]], { speed: 100, fps: 30, easing: "none" });
  const steps = eyes.slice(1).map((e, i) => Math.hypot(...e.map((v, j) => v - eyes[i][j])));
  sure(Math.max(...steps) / Math.min(...steps) < 1.01, `steps ${Math.min(...steps)} to ${Math.max(...steps)}`);
  sure(curveOf([[0, 0, 0], [10, 0, 0]]).length > 9.9, "a straight curve is its own length");
  sure(simplify([[0, 0, 0], [1, 0.1, 0], [2, 0, 0], [3, 5, 0], [4, 10, 0]], 0.5).length === 3, "the wobble taken out, the turn kept");
});

/** A small model of a spec's, written where a shot can find it. */
function aModel(folder) {
  const { mdl } = buildModelSpec({ spec: "smak.model/1", name: "post.mdl", kind: "prop", parts: [{ id: "post", kind: "cylinder", radius: 3, height: 20, sides: 8, material: "steel" }, { id: "cap", kind: "box", size: [8, 8, 2], material: { base: "paint", tone: [0.9, 0.2, 0.1] }, attach: { to: "post" } }] });
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, "post.mdl"), mdl);
  return mdl;
}

test("a turntable's frames turn the model smoothly, and a GIF of them has a frame each", () => {
  const mdl = aModel(join(tmp, "video-model"));
  const plan = framesOfShot({ kind: "turntable", model: "post.mdl", seconds: 1 }, { fps: 12, width: 64, height: 48, model: () => mdl });
  const frames = [...plan.frames()].map((draw) => draw());
  sure(plan.count === 12 && frames.length === 12 && frames[0].width === 64, `${plan.count} frames`);
  const bytes = gif(frames.map(gifFrame), { width: 64, height: 48, fps: 12 });
  sure(bytes.subarray(0, 6).toString("latin1") === "GIF89a" && bytes.at(-1) === 0x3b, "a GIF from first byte to last");
  // one image block a frame
  let blocks = 0;
  for (let i = 0; i < bytes.length - 9; i++) if (bytes[i] === 0x21 && bytes[i + 1] === 0xf9 && bytes[i + 2] === 0x04) blocks++;
  sure(blocks === 12, `${blocks} frames in the GIF`);
});
await testAsync("the tool builds a video spec: a preview by default, a GIF when asked, with its smoothness told", "build: video", async () => {
  const folder = join(tmp, "video-work");
  aModel(join(tmp, "video-models"));
  const build = toolsFor({ work: folder, models: join(tmp, "video-models") }).find((tool) => tool.name === "build");
  const spec = { spec: "smak.video/1", name: "post", size: [96, 64], fps: 12, format: "gif", shots: [{ kind: "title", seconds: 0.5, text: "POST" }, { kind: "turntable", model: "post.mdl", seconds: 1 }] };
  const preview = await build.call({ spec });
  const said = preview.find((p) => p.type === "text").text;
  sure(/^OK/.test(said) && /a preview/.test(said) && preview.some((p) => p.type === "image"), said);
  const made = await build.call({ spec, preview: false });
  const words = made.find((p) => p.type === "text").text;
  sure(/^OK/.test(words) && /turntable: 12 frames .*change between frames median/.test(words) && /written: work:post\.gif/.test(words), words);
  sure(readFileSync(join(folder, "post.gif")).subarray(0, 6).toString("latin1") === "GIF89a", "the GIF written");
});
