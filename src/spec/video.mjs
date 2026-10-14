// A spec of a video: shots of the kit's models and maps, one after another, directed by kind (turntable, a
// six-panel sheet, animations, a walk through a map along the walk test's route, a fly-over, a path of keys),
// previewed as a contact sheet and encoded (research/directed-video.md, docs/SPEC.md "A video").
//
//   validateVideoSpec(spec) -> { errors, warnings }
//   buildVideoSpec(spec, { model, map, folders, preview }) -> Promise of { report, files: { video, sheet } }
// `model(name)` and `map(name)` give a file's bytes as the caller finds it (the MCP server: its folders).
import { framesOfShot, frameStep, encoder, hasFfmpeg, contactSheet } from "../video.mjs";
import { png } from "../image.mjs";

export const VIDEO_SPEC = "smak.video/1";
const KINDS = ["title", "turntable", "sheet", "animations", "walk", "flyover", "path"];
const TOP = ["spec", "name", "size", "fps", "format", "shots", "note"];
/** A frame that changes more than this many times the shot's median change, and more than a floor, jumps. */
const JUMP = 3;
const JUMP_LEAST = 12;

export function validateVideoSpec(spec) {
  const errors = [];
  const warnings = [];
  if (spec?.spec !== VIDEO_SPEC) errors.push(`spec: "${VIDEO_SPEC}"`);
  for (const key of Object.keys(spec ?? {})) if (!TOP.includes(key)) warnings.push(`${key}: a video spec takes no ${key}, left out`);
  if (typeof spec?.name !== "string" || !/^[\w.-]+(\/[\w.-]+)*$/.test(spec.name) || spec.name.split("/").includes(".."))
    errors.push("name: the video's file name, without its ending, in a folder if you like (videos/tour)");
  const size = spec?.size ?? [960, 540];
  if (!Array.isArray(size) || size.length !== 2 || !size.every((v) => Number.isInteger(v) && v >= 64 && v <= 1920 && v % 2 === 0)) errors.push("size: [width, height], even numbers from 64 to 1920");
  if (spec?.fps !== undefined && !(spec.fps >= 5 && spec.fps <= 60)) errors.push("fps: 5 to 60");
  if (spec?.format !== undefined && !["mp4", "gif"].includes(spec.format)) errors.push('format: "mp4" (with ffmpeg) or "gif"');
  if (!Array.isArray(spec?.shots) || !spec.shots.length) errors.push("shots: a list of one shot at least");
  else
    spec.shots.forEach((shot, i) => {
      if (!KINDS.includes(shot?.kind)) errors.push(`shots[${i}].kind: one of ${KINDS.join(", ")}`);
      if (["turntable", "sheet", "animations"].includes(shot?.kind) && typeof shot.model !== "string") errors.push(`shots[${i}].model: the model's file`);
      if (["walk", "flyover", "path"].includes(shot?.kind) && typeof shot.map !== "string") errors.push(`shots[${i}].map: the compiled map's file`);
      if (shot?.kind === "walk" && shot.to === undefined) errors.push(`shots[${i}].to: the entity the walk goes to (a class, a name or a number)`);
    });
  return { errors, warnings };
}

export async function buildVideoSpec(spec, { model, map, folders = [], preview = true } = {}) {
  const { errors, warnings } = validateVideoSpec(spec);
  const report = { ok: false, errors, warnings, faults: [], notes: [], facts: [] };
  if (errors.length) return { report, files: {} };
  const [width, height] = spec.size ?? [960, 540];
  const fps = spec.fps ?? 30;
  let format = spec.format ?? "mp4";
  if (format === "mp4" && !preview && !hasFfmpeg()) {
    format = "gif";
    report.warnings.push("no ffmpeg on this machine: a GIF instead of an MP4 (large for anything that moves the camera)");
  }
  const rows = [];
  const out = preview ? null : encoder({ width, height, fps, format });
  let total = 0;
  const began = Date.now();
  for (const [i, shot] of spec.shots.entries()) {
    const name = `${i + 1} ${shot.kind}`;
    let plan;
    try {
      plan = framesOfShot(shot, { fps, width, height, model, map, folders });
    } catch (error) {
      report.errors.push(`shots[${i}]: ${error.message}`);
      continue;
    }
    // the frames the contact sheet shows: four, evenly spread
    const shown = new Set([0, Math.round((plan.count - 1) / 3), Math.round((2 * (plan.count - 1)) / 3), plan.count - 1]);
    const kept = [];
    const steps = [];
    let before = null;
    let n = 0;
    for (const draw of plan.frames()) {
      if (preview && !shown.has(n)) {
        n++;
        continue;
      }
      const frame = draw();
      if (!preview) {
        steps.push(frameStep(before, frame));
        before = frame;
        await out.push(frame);
      }
      if (shown.has(n)) kept.push({ picture: frame, t: n / fps });
      n++;
    }
    total += plan.count;
    rows.push({ shot: name, frames: kept });
    let said = `${name}: ${plan.count} frames (${(plan.count / fps).toFixed(1)} s)`;
    if (steps.length > 2) {
      const sorted = steps.slice(1).sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      const jumps = steps.map((s, k) => [s, k]).filter(([s, k]) => k > 0 && s > JUMP * median && s > JUMP_LEAST);
      said += `; change between frames median ${median.toFixed(1)}, largest ${sorted.at(-1).toFixed(1)}`;
      if (jumps.length) report.faults.push(`${name}: ${jumps.length} frame${jumps.length === 1 ? "" : "s"} jump (${jumps.slice(0, 5).map(([s, k]) => `frame ${k}: ${s.toFixed(1)}`).join(", ")}): smooth the path there`);
    }
    report.facts.push(said);
    const eyeFaults = [...new Set(plan.notes)];
    if (eyeFaults.length) report.faults.push(`${name}: ${eyeFaults.length} frames have the eye in a wall (${eyeFaults.slice(0, 3).join("; ")}): move the path off the walls`);
  }
  if (out && report.errors.length) out.abort();
  const sheet = contactSheet(rows);
  const files = { sheet: png(sheet.width, sheet.height, sheet.rgba) };
  if (!preview && !report.errors.length) {
    files.video = await out.finish();
    files.format = format;
    report.facts.push(`${total} frames, ${(total / fps).toFixed(1)} s at ${fps} fps, ${width}x${height}, ${format}, ${(files.video.length / 1e6).toFixed(2)} MB, drawn and encoded in ${((Date.now() - began) / 1000).toFixed(1)} s`);
  } else if (preview) report.facts.push(`a preview: four frames a shot, ${total} frames in all when made (preview: false makes the video)`);
  report.ok = !report.errors.length && !report.faults.length;
  return { report, files };
}
