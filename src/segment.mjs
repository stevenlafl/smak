// A subject cut out of a picture by words, outside the MCP server: generators/segment.py run once (open-vocabulary
// detectors held to the words by CLIP, then SAM 2), for a script or the photogrammetry (src/maps/photo.mjs) that
// masks a screenshot's people, monsters or HUD before matching its walls. Needs the segment venv
// (generators/install-segment.sh) in the folder SMAK_SEGMENT names, or `root`.
//
//   segmentOf(picture, subject, { root, every, threshold, point, detector, out })
//     -> { box, score, detector, boxes, mask: { width, height, data } (1 a dot of the subject), files }
// `picture`: a file. `every`: every box over `threshold` (0.1) in one mask, for "a person" across a crowd.
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { unpicture } from "./image.mjs";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "..", "generators", "segment.py");

export function segmentOf(picture, subject, { root = process.env.SMAK_SEGMENT, every = false, threshold, point, detector = "vote", out } = {}) {
  if (!root) throw new Error("segmentOf: the local-3d folder with venvs/segment-rocm is needed (SMAK_SEGMENT, or root)");
  const python = join(root, "venvs", "segment-rocm", "bin", "python");
  if (!existsSync(python)) throw new Error(`segmentOf: no ${python} (generators/install-segment.sh)`);
  const stem = out ?? join(mkdtempSync(join(tmpdir(), "smak-segment-")), "cut");
  const request = { id: 1, picture: resolve(picture), subject, point, every, threshold, detector, out: resolve(stem) };
  const run = spawnSync(python, ["-I", SCRIPT, "--root", root], { input: `${JSON.stringify(request)}\n`, encoding: "utf8", maxBuffer: 1 << 24 });
  const line = (run.stdout ?? "").split("\n").find((l) => l.startsWith("{"));
  if (!line) throw new Error(`segmentOf: no answer (${(run.stderr ?? "").trim().split("\n").slice(-2).join(" | ")})`);
  const said = JSON.parse(line);
  if (!said.ok) throw new Error(`segmentOf: ${said.error}`);
  const m = unpicture(readFileSync(said.mask));
  const data = new Uint8Array(m.width * m.height);
  for (let i = 0; i < data.length; i++) data[i] = (m.rgb ? m.rgb[i * 3] : m.rgba[i * 4]) > 127 ? 1 : 0;
  return { box: said.box, score: said.score, detector: said.detector, boxes: said.boxes, mask: { width: m.width, height: m.height, data }, files: { mask: said.mask, cut: said.cut, white: said.white } };
}
