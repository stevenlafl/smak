// A file's skeleton and animations made a studio model's (the common shape of import-shape.mjs, as `readFbx`
// and `readGlb` give it): the second stage of an import, after the prop of import-model.mjs.
//
//   importRigged(imported, options)   a .mdl with the file's bones, its meshes bound to them, its animations
//
// What a modelling tool allows and a studio model does not, and what is done about each:
//   - a point held by several bones, each with a weight: GoldSrc holds a point on ONE bone, so each goes on
//     the bone that weighs most on it. Where two bones share a joint evenly (an elbow, a knee) the skin
//     creases instead of bending
//   - a bone that is stretched: a studio model's bone is turned and moved, never stretched. A stretch that
//     stays the same through an animation (an armature a hundred times too small, with its bones as much too
//     large) costs nothing; one that changes while it plays is lost
//   - curves: an animation is read at so many moments a second (`fps`), each a whole pose
// Nothing here reads the disk.
import { buildMdl } from "./build.mjs";
import { meshOf } from "./mesh.mjs";
import { check, LIMITS } from "./check.mjs";
import { indexed, shrink, unpng, unbmp, rgbOf, rgbaOf } from "./image.mjs";
import { IDENTITY, mul, apply, applyDir, inverse, rigid, sixOf, moved, stretched, turned } from "./import-math.mjs";
import { importScale, importPictures, COMFORTABLE_TRIANGLES } from "./import-model.mjs";
import { unjpeg } from "./import-jpeg.mjs";

/** A bone's name is kept in 32 bytes, the last a zero; so is an animation's. */
const NAME_MOST = 31;
/** A model's own name and a texture's are kept in 64. */
const FILE_NAME_MOST = 63;
/** A submodel's triangles are kept under what Xash draws of one: three corners each. */
const TRIANGLES_MOST = Math.floor(LIMITS.xash.verts / 3);
/** The side of the flat picture a material without one wears, and its grey. */
const FLAT_SIDE = 16;
const NO_COLOUR = [0.6, 0.6, 0.6];
/** How many moments of an animation are read a second unless told. */
const FPS = 30;
/** An animation ends as it began (it loops) when no bone is further than this from where it was: units, radians. */
const SAME_PLACE = 0.05;
const SAME_TURN = 0.02;
/** Where a origin may be put. */
const ORIGINS = ["keep", "base", "centre"];
const TURN = Math.PI * 2;
/** A triangle whose doubled area is under this (in the file's units) is a line or a point. */
const NO_AREA = 1e-12;

/** A name cut to what the format holds and made unlike the ones before it. */
function nameWithin(name, most, taken) {
  const plain = String(name || "bone").replace(/[^\x20-\x7e]/g, "_");
  let made = plain.slice(0, most);
  for (let nth = 2; taken.has(made.toLowerCase()); nth++) {
    const ending = `_${nth}`;
    made = plain.slice(0, most - ending.length) + ending;
  }
  taken.add(made.toLowerCase());
  return made;
}

/** A material's picture as a texture no larger than `most` a side. */
function textureOf(given, material, name, most) {
  let made;
  if (given === undefined || given === null) {
    const rgb = new Uint8Array(FLAT_SIDE * FLAT_SIDE * 3);
    const flat = material?.colour ?? NO_COLOUR;
    for (let i = 0; i < rgb.length; i++) rgb[i] = Math.round(flat[i % 3] * 255);
    return { texture: indexed({ width: FLAT_SIDE, height: FLAT_SIDE, rgb }, name), from: material?.colour ? "its flat colour" : "a grey" };
  }
  if (given.pixels && given.palette) made = given;
  else if (Buffer.isBuffer(given) || given instanceof Uint8Array) {
    const file = Buffer.from(given);
    const jpeg = file[0] === 0xff && file[1] === 0xd8;
    made = file.toString("latin1", 0, 2) === "BM" ? unbmp(file) : jpeg ? unjpeg(file) : rgbOf(unpng(file));
  } else made = given.rgb ? given : rgbOf(given);
  // a texture with holes keeps its palette: one pixel in so many; anything else is the mean of a block
  const factor = Math.ceil(Math.max(made.width, made.height) / most);
  if (made.pixels) {
    if (factor > 1) {
      const width = Math.floor(made.width / factor);
      const height = Math.floor(made.height / factor);
      const pixels = new Uint8Array(width * height);
      for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) pixels[y * width + x] = made.pixels[y * factor * made.width + x * factor];
      made = { ...made, width, height, pixels };
    }
    return { texture: { ...made, name }, from: "the picture given" };
  }
  const image = made.rgb ? made : rgbOf({ ...made, rgba: rgbaOf(made) });
  return { texture: indexed(factor > 1 ? shrink(image, factor) : image, name), from: "the picture given" };
}

/** Triangles cut into runs that each fit one submodel (as `objModel` does): [{ tris, points, normals }]. */
function runsThatFit(tris, texture, smooth) {
  const mesh = meshOf(null, tris, texture, 0, smooth);
  const most = LIMITS.goldsrc.verts;
  if ((mesh.verts.length <= most && mesh.norms.length <= most && tris.length <= TRIANGLES_MOST) || tris.length === 1)
    return [{ tris, points: mesh.verts.length, normals: mesh.norms.length }];
  const half = Math.ceil(tris.length / 2);
  return [...runsThatFit(tris.slice(0, half), texture, smooth), ...runsThatFit(tris.slice(half), texture, smooth)];
}

/**
 * Three angles that say the same turn as `six`'s and lie nearest the ones of the frame before: a turn has
 * two sets of three angles, and each angle may be a whole turn more or less, so angles worked out frame by
 * frame jump about though the bone does not. Kept near each other they cost the file's 16 bits less.
 */
function nearestAngles(six, before) {
  if (!before) return six;
  const near = (angle, to) => angle - Math.round((angle - to) / TURN) * TURN;
  const same = [3, 4, 5].map((k) => near(six[k], before[k]));
  const other = [near(six[3] + Math.PI, before[3]), near(Math.PI - six[4], before[4]), near(six[5] + Math.PI, before[5])];
  const off = (angles) => angles.reduce((sum, angle, k) => sum + Math.abs(angle - before[3 + k]), 0);
  return [six[0], six[1], six[2], ...(off(other) < off(same) ? other : same)];
}

/**
 * A studio model with a file's skeleton and animations: { mdl, warnings, report }.
 *   name         what the file calls itself
 *   animations   the names of the animations to take, in that order (unless told: all of them). A name may be
 *                the whole of one or its end ("Walk" finds "Armature|Walk"). An empty list: none, and the model
 *                has one still animation, "rest"
 *   fps          how many poses a second are read of each (30)
 *   names        { the file's name of an animation: the name it gets }: an animation is otherwise called by
 *                what follows the last "|" of its name, in small letters
 *   scale, fit, origin ("keep", "base", "centre"), turn, pictures, maxTextureSize, smooth
 *                as `importModel`; the size and the origin are those of the model as it rests
 *   hitboxes     "auto" (unless told: a box about what each bone carries, as studiomdl makes them), a list as
 *                `buildMdl` takes it, or [] for none
 * The bones are the file's nodes that carry a point, with every node above them: a bone that holds nothing
 * and has nothing below it that does (the handles a rig is posed by) is left out. A mesh that has no skin
 * hangs whole from the node that holds it. The rest pose is the scene as the file has it at rest, which is
 * also the pose the points are bound in.
 * It throws when there are more bones than the engine holds (128), and when the model would not load.
 * `report` is { name, triangles, points, bodyparts, box, textures, scale, format, heavy, bones (their names),
 * sequences: [{ name, from, frames, fps, loops, seconds }], shared (how many points were held by several bones
 * and went to the heaviest), lostStretch (the animations in which a bone's stretch changes) }.
 * A monster needs more than this gives: its animations' activities and events, where it sees from, and a walk
 * that travels (`movement`): see "A monster's parts" in AGENTS.md, and `addSequence`, `setEvents`.
 */
export function importRigged(imported, options = {}) {
  const { origin = "keep", fps = FPS, smooth = 40, maxTextureSize = LIMITS.goldsrc.texture } = options;
  if (!ORIGINS.includes(origin)) throw new Error(`importRigged: origin is ${ORIGINS.join(", ")}, not ${origin}`);
  if (!(fps > 0)) throw new Error(`importRigged: fps is a number over 0, not ${fps}`);
  if (!imported.groups.length) throw new Error("importRigged: the file has no mesh: nothing to make a model of");
  const fileName = /\.mdl$/i.test(options.name ?? "") ? options.name : `${options.name ?? "model"}.mdl`;
  if (fileName.length > FILE_NAME_MOST)
    throw new Error(`importRigged: the name ${fileName} is longer than the ${FILE_NAME_MOST} letters a model's holds`);
  const warnings = [];
  const size = importScale(imported, options);

  // ── where the model stands: the scene's own axes are GoldSrc's already; turned, sized, then moved
  const { mn, mx } = imported.box;
  const sized = mul(turned([0, 0, options.turn ?? 0]), stretched([size.factor, size.factor, size.factor]));
  const corners = [0, 1, 2, 3, 4, 5, 6, 7].map((i) =>
    apply(sized, [i & 1 ? mx[0] : mn[0], i & 2 ? mx[1] : mn[1], i & 4 ? mx[2] : mn[2]]),
  );
  const low = [0, 1, 2].map((a) => Math.min(...corners.map((p) => p[a])));
  const high = [0, 1, 2].map((a) => Math.max(...corners.map((p) => p[a])));
  const middle = low.map((value, a) => (value + high[a]) / 2);
  const shift =
    origin === "keep" ? [0, 0, 0] : [-middle[0], -middle[1], origin === "base" ? -low[2] : -middle[2]];
  const place = mul(moved(shift), sized);
  const turnOnly = turned([0, 0, options.turn ?? 0]);

  // ── the bones: the nodes that carry a point, and every node above them
  const nodes = imported.nodes;
  const carries = new Set();
  let shared = 0;
  for (const group of imported.groups)
    for (const tri of group.tris)
      for (const corner of tri) {
        carries.add(corner.node ?? 0);
        if (corner.weights?.length > 1) shared++;
      }
  const kept = new Set();
  for (const node of carries) for (let at = node; at >= 0 && !kept.has(at); at = nodes[at].parent) kept.add(at);
  const boneNodes = nodes.map((_, i) => i).filter((i) => kept.has(i));
  if (boneNodes.length > LIMITS.goldsrc.bones)
    throw new Error(
      `importRigged: ${boneNodes.length} bones carry the model, and a studio model holds ${LIMITS.goldsrc.bones}: take bones out in the tool that made it (fingers, a face)`,
    );
  const boneOf = new Map(boneNodes.map((node, bone) => [node, bone]));
  const taken = new Set();
  const names = boneNodes.map((node) => nameWithin(nodes[node].name, NAME_MOST, taken));
  const parents = boneNodes.map((node) => (nodes[node].parent < 0 ? -1 : boneOf.get(nodes[node].parent)));
  const toModel = mul(place, imported.stand ?? IDENTITY);

  /**
   * Every bone's six values for a pose (each node's own matrix; the scene's rest where `locals` has none),
   * and whether a bone's stretch is another than at rest.
   */
  const restWorlds = [];
  const lengthsOf = (matrix) => [0, 1, 2].map((c) => Math.hypot(matrix[0][c], matrix[1][c], matrix[2][c]));
  const poseOf = (locals) => {
    const world = [];
    nodes.forEach((node, i) => {
      const own = locals?.get(i) ?? node.rest;
      world.push(node.parent < 0 ? own : mul(world[node.parent], own));
    });
    if (!locals) restWorlds.push(...world);
    const stiff = boneNodes.map((node) => rigid(mul(toModel, world[node])));
    let stretches = false;
    if (locals)
      for (const node of boneNodes) {
        const now = lengthsOf(world[node]);
        const then = lengthsOf(restWorlds[node]);
        if (now.some((length, a) => Math.abs(length - then[a]) > 1e-3 * Math.max(1e-9, then[a]))) stretches = true;
      }
    const six = stiff.map((matrix, bone) =>
      sixOf(parents[bone] < 0 ? matrix : mul(inverse(stiff[parents[bone]]), matrix)),
    );
    return { six, stretches };
  };
  const rest = poseOf(null).six;
  const bones = boneNodes.map((_, bone) => ({
    name: names[bone],
    parent: parents[bone],
    pos: rest[bone].slice(0, 3),
    rot: rest[bone].slice(3),
  }));

  // ── the meshes, each corner on its bone
  const { textures: given, notes } = importPictures(imported, options);
  warnings.push(...notes);
  const textureNames = new Set();
  const byMaterial = new Map();
  let noArea = 0;
  for (const group of imported.groups) {
    // a triangle that is a line or a point is left out
    const solid = group.tris.filter((tri) => {
      const [a, b, c] = tri.map((corner) => corner.p);
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const area = Math.hypot(u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]);
      if (!(area > NO_AREA)) noArea++;
      return area > NO_AREA;
    });
    (byMaterial.get(group.material) ?? byMaterial.set(group.material, []).get(group.material)).push(...solid);
  }
  if (noArea) warnings.push(`${noArea} triangles of no area (a line or a point) were left out`);
  for (const [material, tris] of byMaterial) if (!tris.length) byMaterial.delete(material);
  const dressed = [];
  const worn = [];
  for (const [material, tris] of byMaterial) {
    const said = imported.materials.find((entry) => entry.name === material);
    const stem = (material || "default").replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 40);
    const name = nameWithin(`${stem}.bmp`.replace(/\.bmp$/, ""), FILE_NAME_MOST - 4, textureNames) + ".bmp";
    const made = textureOf(given[material], said, name, maxTextureSize);
    worn.push({ name, material, width: made.texture.width, height: made.texture.height, from: made.from });
    dressed.push({
      texture: made.texture,
      tris: tris.map((tri) =>
        tri.map((corner) => {
          // a triangle that lies whole in another copy of the picture is moved back; what runs over is held
          const lowest = [0, 1].map((a) => Math.floor(Math.min(...tri.map((each) => each.uv[a])) + 1e-4));
          return {
            p: apply(place, corner.p),
            uv: [0, 1].map((a) => Math.min(1, Math.max(0, corner.uv[a] - lowest[a]))),
            n: corner.n ? applyDir(turnOnly, corner.n) : undefined,
            group: corner.group,
            smooth: corner.smooth,
            bone: boneOf.get(corner.node ?? 0),
          };
        }),
      ),
    });
  }
  const submodels = [];
  let last = null;
  for (const mesh of dressed)
    for (const run of runsThatFit(mesh.tris, mesh.texture, smooth)) {
      const most = LIMITS.goldsrc.verts;
      const fits =
        last &&
        last.points + run.points <= most &&
        last.normals + run.normals <= most &&
        last.triangles + run.tris.length <= TRIANGLES_MOST;
      if (!fits) submodels.push((last = { meshes: [], points: 0, normals: 0, triangles: 0 }));
      last.meshes.push({ tris: run.tris, texture: mesh.texture });
      last.points += run.points;
      last.normals += run.normals;
      last.triangles += run.tris.length;
    }
  if (submodels.length > LIMITS.goldsrc.bodyparts)
    throw new Error(`importRigged: the model needs ${submodels.length} bodyparts, and a studio model holds ${LIMITS.goldsrc.bodyparts}`);
  const triangles = submodels.reduce((sum, submodel) => sum + submodel.triangles, 0);
  const points = submodels.reduce((sum, submodel) => sum + submodel.points, 0);

  // ── the animations, pose by pose
  const all = imported.animations ?? [];
  const wanted =
    options.animations === undefined
      ? all
      : options.animations.map((name) => {
          const found =
            all.find((each) => each.name === name) ??
            all.find((each) => each.name.toLowerCase().split("|").pop() === String(name).toLowerCase());
          if (!found)
            throw new Error(
              `importRigged: the file has no animation ${name}: it has ${all.map((each) => each.name).join(", ") || "none"}`,
            );
          return found;
        });
  const sequenceNames = new Set();
  const lostStretch = [];
  const sequences = wanted.map((animation) => {
    const count = Math.max(1, Math.round(animation.duration * fps)) + 1;
    const frames = [];
    let stretches = false;
    for (let frame = 0; frame < count; frame++) {
      const pose = poseOf(animation.at(Math.min(animation.duration, frame / fps)));
      stretches ||= pose.stretches;
      frames.push(pose.six.map((six, bone) => nearestAngles(six, frames[frame - 1]?.[bone] ?? rest[bone])));
    }
    if (stretches) lostStretch.push(animation.name);
    const first = frames[0];
    const end = frames[count - 1];
    const loops =
      count > 2 &&
      first.every((six, bone) =>
        six.every((value, k) => {
          const off = Math.abs(value - end[bone][k]);
          return k < 3 ? off < SAME_PLACE : Math.abs(off - Math.round(off / TURN) * TURN) < SAME_TURN;
        }),
      );
    const called = options.names?.[animation.name] ?? animation.name.split("|").pop().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    return {
      name: nameWithin(called || "animation", NAME_MOST, sequenceNames),
      from: animation.name,
      fps,
      loops,
      frames,
      seconds: animation.duration,
    };
  });
  if (!sequences.length)
    sequences.push({ name: "rest", from: null, fps: 10, loops: true, frames: [rest], seconds: 0 });
  if (lostStretch.length)
    warnings.push(
      `in ${lostStretch.join(", ")} a bone's stretch changes as it plays: a studio model's bone is turned and moved, never stretched, and that is lost`,
    );
  if (shared)
    warnings.push(
      `${shared} corners are held by several bones in the file: GoldSrc holds a point on one, so each is on the bone that weighs most on it, and the skin creases where it bent`,
    );

  const modelName = fileName.replace(/\.mdl$/i, "");
  const mdl = buildMdl({
    name: fileName,
    bones,
    smooth,
    ownNormals: true,
    hitboxes: options.hitboxes ?? "auto",
    bodyparts: submodels.map((submodel, nth) => ({
      name: nth ? `body${nth + 1}` : "body",
      models: [{ name: nth ? `${modelName}${nth + 1}`.slice(0, FILE_NAME_MOST) : modelName, meshes: submodel.meshes }],
    })),
    sequences: sequences.map(({ name, fps: rate, loops, frames }) => ({ name, fps: rate, loops, frames })),
  });
  for (const engine of ["goldsrc", "xash"]) {
    const errors = check(mdl, engine).errors;
    if (errors.length) throw new Error(`importRigged: the model would not load in ${engine}: ${errors.join("; ")}`);
  }
  const placedBox = { mn: low.map((value, a) => value + shift[a]), mx: high.map((value, a) => value + shift[a]) };
  return {
    mdl,
    warnings,
    report: {
      name: fileName,
      triangles,
      points,
      bodyparts: submodels.length,
      box: placedBox,
      textures: worn,
      scale: size,
      format: imported.format,
      heavy:
        submodels.length > 1
          ? `${triangles} triangles on ${points} points: more than one submodel of GoldSrc holds (${LIMITS.goldsrc.verts} points), so it is in ${submodels.length} bodyparts`
          : triangles > COMFORTABLE_TRIANGLES
            ? `${triangles} triangles: more than the ${COMFORTABLE_TRIANGLES} GoldSrc draws at its ease`
            : null,
      bones: names,
      sequences: sequences.map(({ name, from, fps: rate, loops, frames, seconds }) => ({
        name,
        from,
        frames: frames.length,
        fps: rate,
        loops,
        seconds,
      })),
      shared,
      lostStretch,
    },
  };
}
