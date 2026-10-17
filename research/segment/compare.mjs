// A named subject cut from a cluttered picture, four ways: the open-vocabulary detectors with SAM 2
// (generators/segment.py: OWLv2, Grounding DINO, YOLO-World), BiRefNet's salient object (rembg, as worker.py cuts
// a shape's picture), and the kit's colour logic (project.mjs foregroundOf, its largest patch). On composites of
// the game's own models over a cluttered photo, where the true mask is known, scored by IoU; on real cluttered
// photos, drawn side by side to be looked at. Pictures and masks are written under the local-3d folder, never the
// repository (a game's model drawn is the game's).
//
//   node research/segment/compare.mjs <local-3d folder> <the game's valve folder>
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawn, execFileSync } from "node:child_process";
import * as smak from "../../src/index.mjs";
import { foregroundOf } from "../../src/spec/project.mjs";

const [root, game] = process.argv.slice(2);
const dir = join(root, "tests", "segment");
mkdirSync(dir, { recursive: true });
const MAGENTA = [255, 0, 255];

// ── composites: the game's models drawn on magenta, laid over a cluttered photo; the true mask each model's dots ──
const photo = (name) => smak.unpicture(readFileSync(join(dir, name)));
function crop(img, x0, y0, w, h) {
  const rgb = new Uint8Array(w * h * 3);
  const src = img.rgb ?? (() => { const o = new Uint8Array(img.width * img.height * 3); for (let i = 0; i < img.width * img.height; i++) o.set(img.rgba.subarray(i * 4, i * 4 + 3), i * 3); return o; })();
  for (let y = 0; y < h; y++) rgb.set(src.subarray(((y0 + y) * img.width + x0) * 3, ((y0 + y) * img.width + x0 + w) * 3), y * w * 3);
  return { width: w, height: h, rgb };
}
const SCENES = [
  { name: "scene-a", photo: "artist_workshop.jpg", at: [180, 380], models: [["barney", "a security guard", 0.9, 90], ["scientist", "a scientist in a white coat", 0.9, 300], ["headcrab", "a headcrab", 0.6, 480]] },
  { name: "scene-b", photo: "machine_shop_02.jpg", at: [560, 380], models: [["hgrunt", "a soldier", 0.9, 120], ["gman", "a man in a suit", 0.9, 330], ["houndeye", "a three-legged creature", 0.7, 470]] },
];
function composite(scene) {
  const W = 640, H = 400;
  const base = crop(photo(scene.photo), scene.at[0], scene.at[1] - H / 2 < 0 ? 0 : scene.at[1] - H / 2, W, H);
  const truths = {};
  for (const [model, words, scale, cx] of scene.models) {
    const src = smak.readStudio(join(game, "models", `${model}.mdl`)).src;
    const r = smak.render(src, { seq: 0, frame: 0, yaw: 20, pitch: 5, width: Math.round(220 * scale), height: Math.round(300 * scale), background: MAGENTA, light: true });
    const truth = new Uint8Array(W * H);
    const ox = cx - r.width / 2, oy = H - r.height - 10;
    for (let y = 0; y < r.height; y++)
      for (let x = 0; x < r.width; x++) {
        const i = (y * r.width + x) * 4;
        const [R, G, B] = [r.rgba[i], r.rgba[i + 1], r.rgba[i + 2]];
        if (R > 240 && G < 20 && B > 240) continue;
        const X = Math.round(ox + x), Y = Math.round(oy + y);
        if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
        base.rgb.set([R, G, B], (Y * W + X) * 3);
        truth[Y * W + X] = 1;
      }
    truths[words] = truth;
  }
  // a dot a later model covers is not the earlier one's
  const order = scene.models.map((m) => m[1]);
  for (let a = 0; a < order.length; a++) for (let b = a + 1; b < order.length; b++) for (let i = 0; i < W * H; i++) if (truths[order[b]][i]) truths[order[a]][i] = 0;
  const file = join(dir, `${scene.name}.png`);
  const rgba = Buffer.alloc(W * H * 4, 255);
  for (let i = 0; i < W * H; i++) rgba.set(base.rgb.subarray(i * 3, i * 3 + 3), i * 4);
  writeFileSync(file, smak.png(W, H, rgba));
  return { file, W, H, truths };
}

// ── the methods ──
const SEG = join(root, "venvs", "segment-rocm", "bin", "python");
const segment = spawn(SEG, ["-I", join(import.meta.dirname, "..", "..", "generators", "segment.py"), "--root", root], { stdio: ["pipe", "pipe", "inherit"] });
let buffer = "";
const waiting = new Map();
let id = 0;
segment.stdout.on("data", (d) => {
  buffer += d;
  let at;
  while ((at = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, at);
    buffer = buffer.slice(at + 1);
    try {
      const r = JSON.parse(line);
      waiting.get(r.id)?.(r);
    } catch {}
  }
});
const ask = (req) => new Promise((done) => { const n = ++id; waiting.set(n, done); segment.stdin.write(`${JSON.stringify({ id: n, ...req })}\n`); });
const readMask = (file) => { const m = smak.unpicture(readFileSync(file)); const o = new Uint8Array(m.width * m.height); for (let i = 0; i < o.length; i++) o[i] = (m.rgb ? m.rgb[i * 3] : m.rgba[i * 4]) > 127 ? 1 : 0; return o; };

function birefnet(file, out) {
  const py = join(root, "venvs", "torch-rocm", "bin", "python");
  execFileSync(py, ["-I", "-c", `
import os, sys
os.environ.setdefault("U2NET_HOME", "${join(root, "weights", "u2net")}")
from rembg import remove, new_session
from PIL import Image
im = Image.open("${file}").convert("RGB")
cut = remove(im, session=new_session("birefnet-general"))
cut.split()[-1].point(lambda a: 255 if a > 127 else 0).save("${out}")
`], { stdio: ["ignore", "ignore", "ignore"] });
  return readMask(out);
}

function colourLogic(file) {
  const p = smak.unpicture(readFileSync(file));
  const m = foregroundOf(p, [0, 0, p.width, p.height]);
  // its largest patch, as the kit keeps it
  const seen = new Int32Array(m.length).fill(-1);
  let best = [], n = 0;
  for (let s = 0; s < m.length; s++) {
    if (!m[s] || seen[s] >= 0) continue;
    const stack = [s], patch = [];
    seen[s] = n;
    while (stack.length) {
      const i = stack.pop();
      patch.push(i);
      const x = i % p.width, y = (i / p.width) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= p.width || Y >= p.height) continue;
        const j = Y * p.width + X;
        if (m[j] && seen[j] < 0) { seen[j] = n; stack.push(j); }
      }
    }
    if (patch.length > best.length) best = patch;
    n++;
  }
  const out = new Uint8Array(m.length);
  for (const i of best) out[i] = 1;
  return out;
}

const iou = (a, b) => { let i = 0, u = 0; for (let k = 0; k < a.length; k++) { if (a[k] && b[k]) i++; if (a[k] || b[k]) u++; } return u ? i / u : 0; };

// ── run ──
const rows = [];
for (const scene of SCENES) {
  const c = composite(scene);
  const bi = birefnet(c.file, join(dir, `${scene.name}_birefnet.png`));
  const co = colourLogic(c.file);
  for (const [, words] of scene.models) {
    const truth = c.truths[words];
    const row = { scene: scene.name, subject: words, birefnet: iou(bi, truth), colour: iou(co, truth) };
    for (const det of ["owlv2", "gdino", "yoloworld", "vote"]) {
      const out = join(dir, `${scene.name}_${det}_${words.replace(/\W+/g, "_")}`);
      const r = await ask({ picture: c.file, subject: words, detector: det, out });
      row[det] = r.ok ? iou(readMask(r.mask), truth) : 0;
      row[`${det}_s`] = r.took;
    }
    rows.push(row);
    console.log(JSON.stringify(row));
  }
}
// real cluttered photos: each named subject cut by each detector, for the eye
const REAL = [["artist_workshop.jpg", ["a painting easel", "an office chair"]], ["machine_shop_02.jpg", ["a metal cage", "a forklift"]], ["industrial_workshop_foundry.jpg", ["a yellow panel"]], ["abandoned_workshop_02.jpg", ["graffiti on a wall"]]];
for (const [name, subjects] of REAL) {
  for (const words of subjects)
    for (const det of ["owlv2", "gdino", "yoloworld", "vote"]) {
      const r = await ask({ picture: join(dir, name), subject: words, detector: det, out: join(dir, `real_${name.replace(/\W+/g, "_")}_${det}_${words.replace(/\W+/g, "_")}`) });
      console.log(JSON.stringify({ photo: name, subject: words, detector: det, ok: r.ok, box: r.box, score: r.score, covered: r.covered, took: r.took, error: r.error }));
    }
}
segment.stdin.end();
const mean = (k) => rows.reduce((s, r) => s + r[k], 0) / rows.length;
console.log("mean IoU on composites:", ["owlv2", "gdino", "yoloworld", "vote", "birefnet", "colour"].map((k) => `${k} ${mean(k).toFixed(3)}`).join(", "));
