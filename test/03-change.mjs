// Changing a model that exists: its mesh swapped for another piece, bodies, meshes and bones added,
// animations replaced and added, and textures kept in another file put inside.
import * as smak from "../src/index.mjs";
import { blunt } from "../kits/bluntkit.mjs";
import { test, sure, near, poseGap, knife } from "./helper.mjs";

const WAVE = 1; // the wave animation's number in the knife
const IDLE = 0;

/** the errors check finds in a model, as one line: empty when it is fit */
const errorsOf = (mdl) => smak.check(mdl).errors;

// ── meshes ──

test("swapMesh lays a new piece over the old one", () => {
  // a club 19 long, from the blunt kit: a haft and a steel head
  const club = blunt({
    seed: 5,
    haft: {
      profile: [
        [0, 0.6],
        [14, 0.7],
      ],
    },
    parts: [
      {
        profile: [
          [13, 0.7],
          [14, 1.6],
          [18, 1.6],
          [19, 0.6],
        ],
        metal: "steel",
      },
    ],
  });

  // in the knife's place it is stretched to the knife's length (16) and hangs on the knife's bone
  const { mdl: swapped, report } = smak.swapMesh(knife.mdl, {
    body: 0,
    piece: club,
    texture: smak.indexed(smak.shrink(club.image, 4), "club.bmp"),
  });
  sure(report.now === club.tris.length && report.bone === "hand", JSON.stringify(report));
  near(report.scale, 16 / 19, 0.02, "stretched to the old length");
  sure(!errorsOf(swapped).length, errorsOf(swapped).join("; "));
  sure(smak.readMdl(swapped).textures.length === 2, "its texture was added");

  // told to keep its own size, it is not stretched
  const ownSize = smak.swapMesh(knife.mdl, {
    body: 0,
    piece: club,
    texture: smak.indexed(smak.shrink(club.image, 4), "club.bmp"),
    size: "own",
  }).report;
  near(ownSize.scale, 1, 1e-9, "kept its own size");
});

test("addModel, addMesh, emptyMesh, filterMesh, retexture, addBones", () => {
  const firstMesh = { bodypart: 0, model: 0, mesh: 0 };

  // each step adds to the result of the one before
  let mdl = smak.addModel(knife.mdl, 0, "second");
  sure(smak.readMdl(mdl).bodyparts[0].models.length === 2, "addModel");

  mdl = smak.addMesh(mdl, { bodypart: 0, model: 0 });
  sure(smak.readMdl(mdl).bodyparts[0].models[0].meshes.length === 2, "addMesh");

  mdl = smak.retexture(mdl, firstMesh, { ...knife.texture, name: "other.bmp" });
  sure(smak.readMdl(mdl).textures.length === 2, "retexture");

  // keep the triangles whose first corner is on bone 1, the hand: all of them
  mdl = smak.filterMesh(mdl, firstMesh, (triangleBones) => triangleBones[0] === 1);

  // a third bone at the knife's tip: the two old bones keep their numbers and their motion
  mdl = smak.addBones(mdl, [{ name: "tip", parent: 1, pos: [16, 0, 0] }]);
  sure(smak.bones(mdl).length === 3 && smak.bones(mdl)[2].name === "tip", "addBones");
  near(
    poseGap(smak.poseAt(mdl, WAVE, 5).slice(0, 2), smak.poseAt(knife.mdl, WAVE, 5)),
    0,
    1e-6,
    "the old bones moved",
  );
  sure(!errorsOf(mdl).length, errorsOf(mdl).join("; "));

  const emptied = smak.emptyMesh(mdl, firstMesh);
  sure(smak.readMdl(emptied).bodyparts[0].models[0].meshes[0].numtris === 0, "emptyMesh");
});

// ── animations ──

test("replaceSequence keeps the others, and widens a bone's scale when it must", () => {
  // the wave replaced by its own frames: every pose is exactly what it was
  const sameFrames = smak.replaceSequence(knife.mdl, "wave", {
    frames: smak.readSequence(knife.mdl, "wave").frames,
  });
  near(poseGap(smak.poseAt(sameFrames, WAVE, 9), smak.poseAt(knife.mdl, WAVE, 9)), 0, 0, "the same frames");

  // frames that take the hand thousands of units away: farther than the bone's scale could pack, so the scale
  // is widened, which repacks the other animations of that bone too
  const farFrames = knife.wave.map((frame, t) => [frame[0], [8 + 400 * t, 0, 0, 0, frame[1][4] + 2, 0.3]]);
  const replaced = smak.replaceSequence(knife.mdl, WAVE, { frames: farFrames, fps: 15, loops: true });
  const wave = smak.sequences(replaced)[WAVE];
  sure(wave.fps === 15 && wave.loops && wave.frames === 12, "fps, loops, frames");
  near(
    poseGap(smak.poseAt(replaced, WAVE, 11), smak.boneMatrices(knife.bones, farFrames[11])),
    0,
    0.2,
    "a long way off",
  );
  near(
    poseGap(smak.poseAt(replaced, IDLE, 0), smak.poseAt(knife.mdl, IDLE, 0)),
    0,
    0.2,
    "idle after the scale widened",
  );
  sure(!errorsOf(replaced).length, errorsOf(replaced).join("; "));
});

test("addSequence goes after the others, with its events", () => {
  const STAB = 2; // the number the new animation gets

  // the wave played backwards, with a sound on frame 3
  const added = smak.addSequence(knife.mdl, {
    name: "stab",
    fps: 30,
    frames: knife.wave.slice().reverse(),
    events: [{ frame: 3, event: 5004, options: "weapons/knife.wav" }],
  });
  const animations = smak.sequences(added);
  sure(animations.map((animation) => animation.name).join() === "idle,wave,stab", "order");
  near(poseGap(smak.poseAt(added, STAB, 0), smak.poseAt(knife.mdl, WAVE, 11)), 0, 1e-6, "its frames");
  near(poseGap(smak.poseAt(added, WAVE, 4), smak.poseAt(knife.mdl, WAVE, 4)), 0, 0, "the others");

  // its event is there, and can be taken off again
  const events = smak.events(added, "stab");
  sure(events.length === 1 && events[0].frame === 3 && events[0].options === "weapons/knife.wav", "events");
  sure(!errorsOf(added).length, errorsOf(added).join("; "));
  sure(smak.events(smak.setEvents(added, "stab", []), "stab").length === 0, "setEvents to none");
});

test("a long animation of many frames packs and reads back", () => {
  // 700 frames: the hand jumps one unit at frame 300 and turns slowly all the way. The format packs a bone's
  // values in runs of at most 255, so frames either side of 255 and of the jump are the ones to read back
  const longFrames = Array.from({ length: 700 }, (_, frame) => [
    knife.still[0],
    [8, 0, frame < 300 ? 0 : 1, 0, Math.sin(frame / 20), 0.3],
  ]);
  const added = smak.addSequence(knife.mdl, { name: "long", frames: longFrames });
  const LONG = 2;
  for (const frame of [0, 254, 255, 299, 300, 511, 699])
    near(
      poseGap(smak.poseAt(added, LONG, frame), smak.boneMatrices(knife.bones, longFrames[frame])),
      0,
      2e-3,
      `frame ${frame}`,
    );
});

// ── textures ──

test("textures kept in another file are put inside", () => {
  // the knife as a game keeps some models: the header says it has no textures (the count is at byte 180),
  // and they are in a second file, here the whole knife
  const NUMTEXTURES_AT = 180;
  const withoutTextures = Buffer.from(knife.mdl);
  withoutTextures.writeInt32LE(0, NUMTEXTURES_AT);

  const inlined = smak.withTextures(withoutTextures, knife.mdl);
  const pictureNow = smak.textureOf(inlined, 0);
  const pictureBefore = smak.textureOf(knife.mdl, 0);
  sure(
    Buffer.from(pictureNow.pixels).equals(Buffer.from(pictureBefore.pixels)) &&
      pictureNow.name === pictureBefore.name,
    "the picture",
  );
  sure(!errorsOf(inlined).length, errorsOf(inlined).join("; "));
});

test("an angle at exactly half a turn survives a rewrite of the animations (a bicycle's crank)", () => {
  // the crank rests at 0 with a rotation scale of a half turn over 32768 steps, kept in float32 a hair over it:
  // read back after another bone widens its scale, half a turn came out a step past the range and was refused
  const bones = [{ name: "root", parent: -1, pos: [0, 0, 0] }, { name: "crank", parent: 0, pos: [0, 0, 10] }, { name: "arm", parent: 0, pos: [5, 0, 0] }];
  const tri = [{ p: [0, 0, 0], uv: [0, 0], bone: 1 }, { p: [4, 0, 0], uv: [1, 0], bone: 1 }, { p: [0, 0, 4], uv: [0, 1], bone: 1 }];
  const still = bones.map((b) => [...b.pos, 0, 0, 0]);
  const texture = smak.indexed({ width: 8, height: 8, rgb: new Uint8Array(192).fill(128) }, "t.bmp");
  let mdl = smak.buildMdl({ name: "t.mdl", bones, bodyparts: [{ name: "b", models: [{ name: "m", meshes: [{ texture, tris: [tri] }] }] }], sequences: ["idle", "spin", "swing"].map((name) => ({ name, fps: 10, frames: [still, still] })) });
  mdl = smak.replaceSequence(mdl, "spin", { frames: [0, Math.PI, 2 * Math.PI - 1e-9].map((a) => still.map((v, i) => (i === 1 ? [...v.slice(0, 3), a, 0, 0] : v))) });
  mdl = smak.replaceSequence(mdl, "swing", { frames: [0, 3000].map((d) => still.map((v, i) => (i === 2 ? [v[0] + d, v[1], v[2], 0, 0, 3] : v))) });
  const back = smak.readSequence(mdl, "spin").frames[1][1][3];
  near(Math.abs(back), Math.PI, 1e-3, "the crank at half a turn, either way round");
});
