// Bodies made from workshop triangles: putBody puts one in a model (new, or in place of another), and
// carryPicture takes a painted picture over to a shape that has changed since it was painted.
//
// The pot of fixture-pot.mjs is painted by place (a green band under its middle ring, a red one from 3.5 to
// 4.5 up it, a blue dome) and then made taller above that ring: its top ring goes from 9 to 13.
import * as smak from "../src/index.mjs";
import { test, sure, near, knife } from "./helper.mjs";
import { workshop, potOf, plainModel, potTris } from "./fixture-pot.mjs";

/** the name of a paint colour (0 to 1 a channel): "red", "blue", "green", or "grey" for anything else */
const hueOf = (rgb) =>
  rgb[0] > 0.6 && rgb[1] < 0.3
    ? "red"
    : rgb[2] > 0.6 && rgb[0] < 0.3
      ? "blue"
      : rgb[1] > 0.6 && rgb[0] < 0.3
        ? "green"
        : "grey";

/**
 * Where on the body a painted band is: [lowest x, highest x] of the pixels of that colour, or null when
 * there are none. Pixels 205 or more across the picture (past the wall's zone) are left out.
 */
const bandOf = (mdl, colour = "red") => {
  const heights = [];
  smak.paint(mdl, ({ p, rgb, u }) => {
    if (hueOf(rgb) === colour && u < 205) heights.push(p[0]);
  });
  return heights.length ? [Math.min(...heights), Math.max(...heights)] : null;
};

/** the pot as first built, painted: blue above 9.02, red from 3.5 to 4.5, green from 2 to 2.8 */
const paintedPot = smak.paint(plainModel("pot", potTris), ({ p }) =>
  p[0] > 9.02
    ? [0.1, 0.1, 0.9]
    : p[0] > 3.5 && p[0] < 4.5
      ? [0.9, 0.1, 0.1]
      : p[0] > 2 && p[0] < 2.8
        ? [0.1, 0.9, 0.1]
        : undefined,
).mdl;

/** the triangles of the same pot with its top ring at 13 instead of 9 */
const tallShape = workshop.shape(256, 256);
potOf(tallShape, 13);
const tallTris = tallShape.tris;

/** the corners' places of a posed model's triangles, as one list of points */
const pointsOf = (posedTriangles) =>
  posedTriangles.flatMap((triangle) => triangle.c.map((corner) => corner.p));

test("putBody: a body from triangles, new or in place, and a warning when its picture no longer fits", () => {
  // the tall pot put three ways, with console.warn caught: in place by number, in place by name and quiet,
  // and as a new body
  const warned = [];
  const realWarn = console.warn;
  console.warn = (line) => warned.push(line);
  let inPlace;
  let inPlaceQuiet;
  let asNewBody;
  try {
    inPlace = smak.putBody(paintedPot, { body: 0, tris: tallTris, texture: "pot.bmp" });
    inPlaceQuiet = smak.putBody(paintedPot, { body: "pot", tris: tallTris, texture: "pot.bmp", quiet: true });
    asNewBody = smak.putBody(paintedPot, { name: "tall", tris: tallTris, texture: "pot.bmp" });
  } finally {
    console.warn = realWarn;
  }

  // in place, the body keeps none of the old one's points or normals: only the new mesh's count against
  // the engine's 2048 a submodel
  const placed = smak.readMdl(inPlace.mdl).bodyparts[0].models[0];
  sure(
    placed.numverts === inPlace.report.verts && placed.numnorms === inPlace.report.norms,
    `a body put in place has the new mesh's points and normals alone: ${placed.numverts} points for ${inPlace.report.verts}, ${placed.numnorms} normals for ${inPlace.report.norms}`,
  );
  // in place, the new shape lies elsewhere on the picture the old one was painted for: that is said
  sure(
    inPlace.warnings.length === 1 &&
      /another place/.test(inPlace.warnings[0]) &&
      /carryPicture/.test(inPlace.warnings[0]) &&
      warned.length === 1 &&
      /^smak: putBody/.test(warned[0]),
    `it warns once, in its result and on the console: ${inPlace.warnings} / ${warned}`,
  );
  sure(
    inPlaceQuiet.warnings.length === 1 && inPlaceQuiet.mdl.equals(inPlace.mdl),
    "quiet, it still tells in its result",
  );
  sure(
    inPlace.body === 0 &&
      smak.posed(inPlace.mdl).tris.length === tallTris.length &&
      inPlace.report.tris === tallTris.length &&
      smak.readMdl(inPlace.mdl).textures.length === 1,
    "in place: the same body number, the new triangles, the same texture",
  );
  sure(!smak.check(inPlace.mdl).errors.length, smak.check(inPlace.mdl).errors.join("; "));

  // as a new body nothing was painted for it yet, so there is nothing to warn of
  sure(
    asNewBody.body === 1 &&
      !asNewBody.warnings.length &&
      smak.posed(asNewBody.mdl).tris.length === potTris.length &&
      smak.posed(asNewBody.mdl, { body: 1 }).tris.length === tallTris.length,
    "as a new body: after the others, the old one untouched",
  );

  // layoutMoved says how much of a body's picture is laid out otherwise than it was
  const moved = smak.layoutMoved(paintedPot, inPlace.mdl)["pot.bmp"];
  const unmoved = smak.layoutMoved(paintedPot, paintedPot)["pot.bmp"];
  sure(
    unmoved.share === 0 &&
      unmoved.warning === null &&
      unmoved.kept === unmoved.pixels &&
      moved.share > 0.3 &&
      moved.kept > 0 &&
      moved.pixels > 20000,
    `layoutMoved: ${JSON.stringify(moved)}`,
  );

  // on a bone, from points in model space as the model stands
  const onTheHand = smak.putBody(knife.mdl, {
    name: "pot",
    tris: potTris,
    texture: { name: "pot.bmp", width: 64, height: 64, rgb: new Uint8Array(64 * 64 * 3).fill(90) },
    bone: "hand",
    pose: { seq: "wave", frame: 6 },
  });
  const boxInThatPose = smak.box(
    pointsOf(smak.posed(onTheHand.mdl, { seq: "wave", frame: 6, body: onTheHand.body }).tris),
  );
  sure(
    onTheHand.body === 1 &&
      smak
        .readMesh(
          onTheHand.mdl,
          smak.readMdl(onTheHand.mdl).bodyparts[0].models[1],
          smak.readMdl(onTheHand.mdl).bodyparts[0].models[1].meshes[0],
        )
        .every((triangle) => triangle.every((corner) => corner.bone === 1)),
    "on the bone it was told",
  );
  near(boxInThatPose.mn[0], -2, 1e-3, "where it was drawn, in the pose it was drawn in");
  near(boxInThatPose.mx[0], 12, 1e-3, "its top");

  // a texture named as one the model has, but with other colours (the knife's palette inverted)
  const nameClash = smak.putBody(knife.mdl, {
    name: "x",
    tris: potTris,
    texture: { ...knife.texture, palette: knife.texture.palette.map((value) => 255 - value) },
    quiet: true,
  });
  sure(
    nameClash.warnings.length === 1 && /already/.test(nameClash.warnings[0]),
    "a texture's name that is taken, with another picture, is told",
  );

  // a bone the model does not have
  let refusal = "";
  try {
    smak.putBody(knife.mdl, { name: "x", tris: potTris, texture: knife.texture, bone: "tail" });
  } catch (e) {
    refusal = e.message;
  }
  sure(/no bone tail/.test(refusal), "a bone that is not there is refused by name");
});

test("carryPicture: a painted picture carried to a changed shape, by its parts, by its triangles and by place", () => {
  // the tall pot under the short pot's picture, nothing carried: the red band is stretched up the wall
  const tall = smak.putBody(paintedPot, { body: 0, tris: tallTris, texture: "pot.bmp", quiet: true }).mdl;
  const redLeftAlone = bandOf(tall);
  sure(
    redLeftAlone && redLeftAlone[0] > 4.2,
    `left as it was, the band painted at 3.5 to 4.5 is now at ${redLeftAlone}`,
  );

  // carried by its parts (the old and the new workshop triangles say which part of the pot a pixel is on)
  const byPart = smak.carryPicture(paintedPot, tall, { was: potTris, is: tallTris });
  const redByPart = bandOf(byPart.mdl);
  const reportByPart = byPart.report["pot.bmp"];
  const greenBefore = bandOf(paintedPot, "green");
  const greenByPart = bandOf(byPart.mdl, "green");
  sure(
    greenByPart &&
      Math.abs(greenByPart[0] - greenBefore[0]) < 0.2 &&
      Math.abs(greenByPart[1] - greenBefore[1]) < 0.2 &&
      Math.abs(bandOf(tall, "green")[1] - greenBefore[1]) > 0.5,
    `carried by its parts, what was painted under the ring that stayed is where it was: ${greenByPart} (${greenBefore}; left as it was ${bandOf(tall, "green")})`,
  );
  // the band between the rings at 3 and 9 is now between 3 and 13: 10 units where there were 6
  sure(
    redByPart &&
      Math.abs(redByPart[0] - (3 + (0.5 * 10) / 6)) < 0.3 &&
      Math.abs(redByPart[1] - (3 + (1.5 * 10) / 6)) < 0.3,
    `and what was in the band that grew is stretched with it: ${redByPart}`,
  );
  sure(
    reportByPart.part > 20000 && reportByPart.lost === 0 && reportByPart.place === 0,
    JSON.stringify(reportByPart),
  );

  // the share of blue among the pixels of the dome's disc in the picture
  const blueShareOfDome = (mdl) => {
    let blue = 0;
    let pixels = 0;
    smak.paint(mdl, ({ rgb, u, v }) => {
      if (Math.hypot(u - 34, v - 140) < 28) {
        pixels++;
        if (hueOf(rgb) === "blue") blue++;
      }
    });
    return blue / pixels;
  };
  sure(
    blueShareOfDome(byPart.mdl) > 0.97 && blueShareOfDome(tall) > 0.97,
    "the dome went up with its picture",
  );

  // carried by place alone (no triangles given): each pixel takes the colour that was at its place in space
  const byPlace = smak.carryPicture(paintedPot, tall);
  const redByPlace = bandOf(byPlace.mdl);
  const reportByPlace = byPlace.report["pot.bmp"];
  sure(
    redByPlace &&
      Math.abs(redByPlace[0] - 3.5) < 0.25 &&
      Math.abs(redByPlace[1] - 4.5) < 0.25 &&
      reportByPlace.place > 10000 &&
      reportByPlace.part === 0,
    `by place alone, the band is at ${redByPlace}: ${JSON.stringify(reportByPlace)}`,
  );

  // a body that only moved lies on its picture as it did: every pixel is kept as it is
  const movedAway = smak.putBody(paintedPot, {
    body: 0,
    tris: potTris.map((triangle) =>
      triangle.map((corner) => ({ ...corner, p: [corner.p[0], corner.p[1] + 30, corner.p[2]] })),
    ),
    texture: "pot.bmp",
    quiet: true,
  }).mdl;
  const keptWhole = smak.carryPicture(paintedPot, movedAway, { was: potTris, is: potTris });
  const reportKept = keptWhole.report["pot.bmp"];
  sure(
    reportKept.same === reportKept.pixels &&
      reportKept.pixels > 20000 &&
      Buffer.from(smak.textureOf(keptWhole.mdl, "pot.bmp").pixels).equals(
        Buffer.from(smak.textureOf(paintedPot, "pot.bmp").pixels),
      ),
    `moved whole, its picture is the same: ${JSON.stringify(reportKept)}`,
  );

  // from a picture kept outside the file, and from a texture of another name
  const allGreen = {
    width: 256,
    height: 256,
    rgb: new Uint8Array(256 * 256 * 3).fill(0).map((_, i) => (i % 3 === 1 ? 255 : 0)),
  };
  const fromPicture = smak.carryPicture(paintedPot, tall, { picture: allGreen }).mdl;
  let greenPixels = 0;
  let allPixels = 0;
  smak.paint(fromPicture, ({ rgb }) => {
    allPixels++;
    if (rgb[1] > 0.9 && rgb[0] < 0.1) greenPixels++;
  });
  sure(greenPixels === allPixels && allPixels > 20000, "from a picture handed over");

  // the tall pot as a second body with a grey texture of its own, painted from body 0's texture
  const twoBodies = smak.putBody(paintedPot, {
    name: "tall",
    tris: tallTris,
    texture: { name: "tall.bmp", width: 256, height: 256, rgb: new Uint8Array(256 * 256 * 3).fill(150) },
  }).mdl;
  const toOtherTexture = smak.carryPicture(paintedPot, twoBodies, {
    body: 1,
    from: 0,
    tex: "tall.bmp",
    fromTex: "pot.bmp",
    was: potTris,
    is: tallTris,
  });
  const redOnSecondBody = bandOf(smak.together([{ mdl: toOtherTexture.mdl, body: 1 }]));
  sure(
    redOnSecondBody &&
      Math.abs(redOnSecondBody[0] - (3 + (0.5 * 10) / 6)) < 0.3 &&
      smak.readMdl(toOtherTexture.mdl).textures.length === 2,
    `from another body of the same file, in a texture of another name: ${redOnSecondBody}`,
  );
});
