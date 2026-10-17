// Pictures of a place against the map that is to be it, shot by shot (Steven, 2026-10-17: "You'd find an angle
// with a camera, build against that camera, then every shot becomes trying to match it"), by photogrammetry's
// standard parts where they hold and the map's own edges where they do not:
//
//   locateShot(map, picture, guess, options)  -> a shot's camera: features of the picture matched to those of a
//                                                render of the map at the guess, each render pixel's point of the
//                                                map known (overlay.mjs's raster), the camera by PnP with RANSAC
//                                                (OpenCV, generators/photogrammetry.py); rendered again from it
//                                                and matched once more; then refined by the edges (fitCamera)
//   shotsAgainst(map, shots, options)          -> each shot's camera and the faces it shows off, and over all the
//                                                shots, each face's median move: what a maker changes next
//   structureOf(pictures, options)             -> the pictures alone: cameras and points by structure from motion
//                                                with bundle adjustment (pycolmap), stood up and scaled by the eye's
//                                                height, and the level and upright planes RANSAC finds in them
//   liftFromShots(bsp, name, shots)            -> a texture of the map read off the shots, their cameras fitted
//
// The photogrammetry runs in a venv of its own (generators/install-photogrammetry.sh): its python is
// `options.python`, or SMAK_PHOTOGRAMMETRY. Without it, locateShot fits by the edges alone and says so.
import { mkdtempSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { png } from "../image.mjs";
import { drawMap, drawSource } from "./draw.mjs";
import { geometryOf, rasterOf, overlayOf, fitCamera, viewCamera } from "./overlay.mjs";
import { liftTexture } from "./lift.mjs";

const RUNNER = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "generators", "photogrammetry.py");
/**
 * The fewest matches that must agree on a camera for PnP's to be taken. In a kit room of one repeating texture,
 * cameras of 12 and 18 inliers came back 63 and 71 units off (a tile's width); those of 47 and 247, exact.
 */
const PNP_LEAST = 30;
/** The size a shot is matched at: features need detail, and PnP is quick. */
const MATCH_WIDTH = 640;

/** The photogrammetry venv's python, or null. */
const pythonOf = (options) => options.python ?? process.env.SMAK_PHOTOGRAMMETRY ?? null;

/** One job of generators/photogrammetry.py: its answer. */
function runPhotogrammetry(python, step, job, folder) {
  const path = join(folder, `${step}.json`);
  writeFileSync(path, JSON.stringify(job));
  const run = spawnSync(python, [RUNNER, step, path], { encoding: "utf8", maxBuffer: 1 << 26 });
  if (run.error) throw new Error(`photogrammetry: ${python} could not be run (${run.error.message}): make the venv with generators/install-photogrammetry.sh`);
  const line = run.stdout.trim().split("\n").at(-1);
  try {
    return JSON.parse(line);
  } catch {
    throw new Error(`photogrammetry ${step}: no answer (${(run.stderr || run.stdout).trim().split("\n").slice(-3).join(" | ")})`);
  }
}

/** The map drawn at a camera as the shot would show it: a compiled map in its textures and light, source flat. */
function renderAt(map, camera, width, height, { folders, textures, light } = {}) {
  const options = { ...camera, width, height, entities: "none", labels: false };
  return map?.faces ? drawMap(map, { ...options, folders, textures, ...(light === undefined ? {} : { light }) }) : drawSource(map, options);
}

/**
 * A shot's camera against the map as built: `{ camera, by, inliers, error, edgeScore, planes, notes }`. `guess`:
 * { from, yaw, pitch, fov } (the maker's; or none, and the edges' own search over the map's floor finds one
 * first). `by`: "pnp" when the features held (their camera is kept as it is: on Valve's c1a0 PnP put five shots
 * of six within 2 units, and refining it by the edges moved three of them off, texture lines pulling), "edges"
 * when they did not (too few matches: a flat-lit room, source drawn in flat colours, no venv), and the edges'
 * own fit is the camera. `planes`: with PnP, how far each plane of the map must move along its normal for the
 * picture's features on it to agree (featureShifts), the largest first.
 */
export function locateShot(map, picture, guess = {}, options = {}) {
  const geometry = geometryOf(map);
  const notes = [];
  const fov = guess.fov ?? 90;
  let camera = guess.from ? { yaw: 0, pitch: 0, ...guess, fov } : fitCamera(geometry, picture, { fov }).camera;
  const python = pythonOf(options);
  let by = "edges";
  let inliers = 0;
  let error = null;
  let planes = [];
  if (python) {
    const folder = mkdtempSync(join(tmpdir(), "smak-photo-"));
    try {
      const width = Math.min(MATCH_WIDTH, picture.width);
      const height = Math.round((width * picture.height) / picture.width);
      writeFileSync(join(folder, "picture.png"), png(picture.width, picture.height, picture.rgba));
      const planeKeys = [...new Set(geometry.surfaces.map((s) => s.plane))];
      const planeIndex = new Map(planeKeys.map((key, n) => [key, n]));
      /** The map rendered at a camera and the picture matched to it: PnP's answer and the render's raster. */
      const matchAt = (at) => {
        const render = renderAt(map, at, width, height, options);
        writeFileSync(join(folder, "render.png"), png(render.width, render.height, render.rgba));
        const raster = rasterOf(geometry, at, width, height);
        const points = new Float32Array(width * height * 3).fill(NaN);
        const labels = new Int32Array(width * height).fill(-1);
        for (let k = 0; k < width * height; k++) {
          if (raster.face[k] < 0) continue;
          points.set(raster.point(k), k * 3);
          // each pixel's plane, so that the camera may be found again without each plane in turn
          labels[k] = planeIndex.get(geometry.surfaces[raster.face[k]].plane);
        }
        writeFileSync(join(folder, "points.bin"), Buffer.from(points.buffer));
        writeFileSync(join(folder, "planes.bin"), Buffer.from(labels.buffer));
        const answer = runPhotogrammetry(python, "locate", { picture: join(folder, "picture.png"), render: join(folder, "render.png"), points: join(folder, "points.bin"), planes: join(folder, "planes.bin"), width, height, fov }, folder);
        return { answer, raster };
      };
      // render and match, then render again from what PnP found and match once more: the nearer the render's
      // camera, the more features agree
      let best = null;
      for (let round = 0; round < 2; round++) {
        const { answer, raster } = matchAt(camera);
        if (!answer.ok) {
          notes.push(`features: ${answer.error}${answer.matches ? ` (${answer.matches} matched)` : ""}`);
          break;
        }
        // few inliers in a room of one repeating texture is a camera one tile's width off: not trusted. From a guess
        // far off, the edges' own fit is a nearer camera to match from, once (c1a0's sixth shot: 22 inliers from
        // the guess, 44 from nearer)
        if (answer.inliers < PNP_LEAST) {
          if (round === 0 && !best) {
            camera = fitCamera(geometry, picture, { from: camera.from, yaw: camera.yaw, pitch: camera.pitch, fov, rounds: options.rounds ?? 40 }).camera;
            continue;
          }
          notes.push(`features: ${answer.inliers} matches agree on a camera, under ${PNP_LEAST}: a repeating texture puts a camera a tile off, so the edges decide`);
          break;
        }
        camera = { from: answer.from, yaw: answer.yaw, pitch: answer.pitch, fov };
        best = { answer, raster, camera };
      }
      if (best) {
        // a plane built off draws the camera with it when most features lie on it, and a render from that camera
        // then matches the rest worse, which keeps it there (a camera 32 units off for a wall 32 off, 2026-10-17).
        // Each camera found without one of the planes most matched, where it differs, is rendered and matched on
        // its own: the camera that the most matches agree with, every plane where it is built, is kept
        const differs = (c) => Math.hypot(...c.from.map((v, k) => v - best.camera.from[k])) > 4 || Math.abs(((c.yaw - best.camera.yaw + 540) % 360) - 180) > 2;
        for (const [n, without] of Object.entries(best.answer.without ?? {})) {
          if (without.inliers < PNP_LEAST) continue;
          const alone = { from: without.from, yaw: without.yaw, pitch: without.pitch, fov };
          if (!differs(alone)) continue;
          const tried = matchAt(alone);
          if (!tried.answer.ok || tried.answer.inliers < PNP_LEAST) continue;
          if (tried.answer.inliers > best.answer.inliers * 1.05) {
            notes.push(`the ${planeKeys[Number(n)]} plane drew the camera with it: matched again from the camera found without it, ${tried.answer.inliers} matches agree against ${best.answer.inliers}`);
            best = { answer: tried.answer, raster: tried.raster, camera: { from: tried.answer.from, yaw: tried.answer.yaw, pitch: tried.answer.pitch, fov } };
          }
        }
        camera = best.camera;
        by = "pnp";
        inliers = best.answer.inliers;
        error = best.answer.error;
        if (Math.abs(best.answer.roll) > 3) notes.push(`the camera found leans ${best.answer.roll} degrees: a game's camera does not, so the matches are doubtful`);
        planes = featureShifts(geometry, best.raster, best.answer.pairs ?? [], camera, width, height);
      }
    } finally {
      rmSync(folder, { recursive: true, force: true });
    }
  } else notes.push("no photogrammetry venv (SMAK_PHOTOGRAMMETRY): the camera is fitted by the edges alone");
  if (by === "edges") {
    const fitted = fitCamera(geometry, picture, { from: camera.from, yaw: camera.yaw, pitch: camera.pitch, fov, rounds: options.rounds ?? 40 });
    camera = fitted.camera;
  }
  const edgeScore = overlayOf(geometry, picture, camera, { width: 320, height: Math.round((320 * picture.height) / picture.width), offsets: false }).score;
  return { camera, by, inliers, error, edgeScore, planes, notes };
}

/**
 * How far each plane of the map must move along its normal for the picture's features on it to agree, the camera
 * held: `[{ plane, axis, texture, matches, move (units: over 0 out along its normal), before, after (median
 * pixels of its matches) }]`. A match is a feature of the picture and the render pixel it matched, whose point
 * lies on a face of the map; each plane's points moved by -range to +range, projected, and the move whose median
 * distance to the picture's features is least kept, when it is a clear gain. The features read texture, so a
 * wall built off is found where its edges alone are lost among the texture's lines.
 */
export function featureShifts(geometry, raster, pairs, camera, width, height, { range = 64, step = 2, least = 8, gain = 1.5, only = null } = {}) {
  const view = viewCamera(camera, width, height);
  const byPlane = new Map();
  for (const [u, v, rx, ry] of pairs) {
    const k = ry * width + rx;
    const f = raster.face[k];
    if (f < 0) continue;
    const s = geometry.surfaces[f];
    if (only && s.plane !== only) continue;
    const entry = byPlane.get(s.plane) ?? byPlane.set(s.plane, { s, list: [] }).get(s.plane);
    entry.list.push({ u, v, p: raster.point(k) });
  }
  const project = (p) => {
    const o = [p[0] - view.eye[0], p[1] - view.eye[1], p[2] - view.eye[2]];
    const z = o[0] * view.forward[0] + o[1] * view.forward[1] + o[2] * view.forward[2];
    if (z < 2) return null;
    return [view.centreX + ((o[0] * view.right[0] + o[1] * view.right[1] + o[2] * view.right[2]) * view.focal) / z, view.centreY - ((o[0] * view.up[0] + o[1] * view.up[1] + o[2] * view.up[2]) * view.focal) / z];
  };
  const median = (a) => {
    const s = [...a].sort((x, y) => x - y);
    return s.length ? s[Math.floor((s.length - 1) / 2)] : Infinity;
  };
  const out = [];
  for (const [plane, { s, list }] of byPlane) {
    if (list.length < least) continue;
    const errAt = (move) =>
      median(
        list.map(({ u, v, p }) => {
          const q = project([p[0] + s.normal[0] * move, p[1] + s.normal[1] * move, p[2] + s.normal[2] * move]);
          return q ? Math.min(40, Math.hypot(q[0] - u, q[1] - v)) : 40;
        }),
      );
    const before = errAt(0);
    let best = { move: 0, err: before };
    for (let move = -range; move <= range; move += step) {
      const err = errAt(move);
      if (err < best.err) best = { move, err };
    }
    if (before - best.err < gain) best = { move: 0, err: before };
    const big = s.normal.map(Math.abs).indexOf(Math.max(...s.normal.map(Math.abs)));
    out.push({ plane, axis: `${s.normal[big] > 0 ? "+" : "-"}${"xyz"[big]}`, texture: s.texture, matches: list.length, move: best.move, before: Math.round(before * 10) / 10, after: Math.round(best.err * 10) / 10 });
  }
  return out.sort((a, b) => Math.abs(b.move) * (b.before - b.after) - Math.abs(a.move) * (a.before - a.after));
}

/**
 * Every shot against the map as built: `{ shots: [{ shot, camera, by, inliers, edgeScore, planes, faces, notes,
 * overlay }], planes: [{ plane, axis, texture, move, shots }] }`. `shots`: [{ picture, guess }]. Each shot's
 * camera is found against the geometry as it stands (locateShot); `planes` is, over all the shots, each plane's
 * median move among the shots whose features on it say it is off (featureShifts), which a maker makes and then
 * calls again; a shot's `faces` are the edges' own reading (overlayOf), a weaker one on textured walls, and its
 * `overlay` the picture a maker looks at.
 */
export function shotsAgainst(map, shots, options = {}) {
  const geometry = geometryOf(map);
  const out = [];
  const moves = new Map();
  for (const [n, shot] of shots.entries()) {
    const located = locateShot(map, shot.picture, shot.guess ?? {}, options);
    const overlay = overlayOf(geometry, shot.picture, located.camera, { width: options.width ?? 320, height: Math.round(((options.width ?? 320) * shot.picture.height) / shot.picture.width) });
    for (const p of located.planes) {
      const entry = moves.get(p.plane) ?? moves.set(p.plane, { plane: p.plane, axis: p.axis, texture: p.texture, list: [], seen: 0 }).get(p.plane);
      entry.seen++;
      if (p.move !== 0) entry.list.push(p.move);
    }
    out.push({ shot: n, camera: located.camera, by: located.by, inliers: located.inliers, edgeScore: overlay.score, planes: located.planes, faces: overlay.faces.slice(0, 6), notes: located.notes, overlay });
  }
  const median = (a) => {
    const s = [...a].sort((x, y) => x - y);
    return s[Math.floor((s.length - 1) / 2)];
  };
  // a plane is said to be off when most of the shots that see it say so
  const planes = [...moves.values()].filter((m) => m.list.length > m.seen / 2).map((m) => ({ plane: m.plane, axis: m.axis, texture: m.texture, move: median(m.list), shots: m.list.length, seen: m.seen })).sort((a, b) => b.shots - a.shots || Math.abs(b.move) - Math.abs(a.move));
  return { shots: out, planes };
}

/**
 * The pictures alone, by structure from motion: `{ ok, registered, cameras, planes, points, error }` (photogrammetry.py
 * sfm). Up is the cameras' up (a game's camera has no roll), the scale the eye's height over the lowest large
 * level plane; the scene's own origin and turn, which the map's are not.
 */
export function structureOf(pictures, options = {}) {
  const python = pythonOf(options);
  if (!python) throw new Error("structure from motion needs the photogrammetry venv: SMAK_PHOTOGRAMMETRY, or python");
  const folder = mkdtempSync(join(tmpdir(), "smak-sfm-"));
  try {
    const files = pictures.map((p, n) => {
      if (typeof p === "string" && existsSync(p)) return p;
      const file = join(folder, `in-${n}.png`);
      writeFileSync(file, png(p.width, p.height, p.rgba));
      return file;
    });
    const answer = runPhotogrammetry(python, "sfm", { pictures: files, fov: options.fov ?? 90, work: join(folder, "work"), eye: options.eye ?? 64 }, folder);
    if (answer.cameras) for (const c of answer.cameras) c.picture = files.indexOf(c.picture);
    return answer;
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
}

/**
 * A texture of a compiled map read off shots whose cameras are fitted (locateShot), as liftTexture reads one off
 * views of known cameras: `{ image, seen, ... }`. `shots`: [{ picture, camera }], each picture at the size given.
 */
export function liftFromShots(bsp, name, shots, { width = 320, height = 240, brightness = 1.55 } = {}) {
  const cols = Math.min(4, shots.length);
  const rows = Math.ceil(shots.length / cols);
  const sheet = { width: cols * width, height: rows * height, rgba: new Uint8Array(cols * width * rows * height * 4) };
  shots.forEach((shot, n) => {
    const p = shot.picture;
    const [left, top] = [(n % cols) * width, Math.floor(n / cols) * height];
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const j = (Math.floor((y * p.height) / height) * p.width + Math.floor((x * p.width) / width)) * 4;
        sheet.rgba.set(p.rgba.subarray(j, j + 4), ((top + y) * sheet.width + left + x) * 4);
      }
  });
  return liftTexture(bsp, name, null, { brightness, views: { picture: sheet, cameras: shots.map((s) => s.camera), width, height, cols, brightness, label: false } });
}

