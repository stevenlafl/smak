// What the readers refuse, and say: a file cut short, a version not read, a file of another kind, a mesh packed
// with Draco, a .gltf whose .bin was not given; a JPEG read, and one of a kind that is not (progressive); names
// longer than the format holds.
import * as smak from "../src/index.mjs";
import { test, sure } from "./helper.mjs";
import { fbxBinary, globalSettings, model, geometry, connections, objects, gltfBuilder, jpegOfBlocks, CUBE_POINTS, CUBE_FACES } from "./fixture-import.mjs";

/** The message a call throws, or "" when it does not. */
const said = (run) => {
  try {
    run();
  } catch (e) {
    return e.message;
  }
  return "";
};
const cube = () =>
  fbxBinary([globalSettings(), objects(model(1, "cube", "Mesh"), geometry(2, "cube", { points: CUBE_POINTS, polygons: CUBE_FACES })), connections([1, 0], [2, 1])]);

test("readFbx refuses a file cut short, an old version and one that is no FBX, saying which", () => {
  const whole = cube();
  sure(/cut short/.test(said(() => smak.readFbx(whole.subarray(0, 200)))), said(() => smak.readFbx(whole.subarray(0, 200))));
  const old = Buffer.from(whole);
  old.writeUInt32LE(6100, 23);
  sure(/version 6\.1: 7\.0 to 7\.7 are read/.test(said(() => smak.readFbx(old))), said(() => smak.readFbx(old)));
  sure(/not an FBX file/.test(said(() => smak.readFbx(Buffer.from("hello")))), "not FBX");
  sure(/text FBX of version 6/.test(said(() => smak.readFbx(Buffer.from("FBXHeaderExtension: {\n FBXVersion: 6100\n}\n")))), "an old text FBX");
  // a file with nothing but a skeleton reads, and says it has no mesh
  const bare = smak.readFbx(fbxBinary([globalSettings(), objects(model(1, "bone", "LimbNode")), connections([1, 0])]));
  sure(!bare.groups.length && bare.warnings.some((line) => /no mesh/.test(line)), bare.warnings.join(" | "));
  sure(/no mesh/.test(said(() => smak.importModel(bare, {}))), "and makes no model of it");
});

test("readGlb refuses a mesh packed with Draco, a .bin not given, another glTF version, and what is no glTF", () => {
  const g = gltfBuilder();
  const POSITION = g.accessor([0, 0, 0, 1, 0, 0, 0, 1, 0], "VEC3");
  Object.assign(g.json, { nodes: [{ mesh: 0 }], meshes: [{ primitives: [{ attributes: { POSITION } }] }] });
  const draco = gltfBuilder();
  Object.assign(draco.json, { extensionsRequired: ["KHR_draco_mesh_compression"] });
  sure(/packed with KHR_draco_mesh_compression/.test(said(() => smak.readGlb(draco.glb()))), said(() => smak.readGlb(draco.glb())));
  sure(/scene\.bin, which was not given/.test(said(() => smak.readGlb(Buffer.from(g.gltf("scene.bin"))))), "a .bin not given");
  const one = Buffer.from(g.glb());
  one.writeUInt32LE(1, 4);
  sure(/version 1/.test(said(() => smak.readGlb(one))), "glTF 1");
  sure(/neither a \.glb/.test(said(() => smak.readGlb(Buffer.from("hello")))), "not glTF");
  sure(/cut short/.test(said(() => smak.readGlb(g.glb().subarray(0, 60)))) || /not whole|JSON/.test(said(() => smak.readGlb(g.glb().subarray(0, 60)))), said(() => smak.readGlb(g.glb().subarray(0, 60))));
});

test("a JPEG picture inside a file is read, and one of a kind not read (lossless) is named, the material its colour", () => {
  // 24x16: the top left block red, the third column blue, the rest grey
  const jpeg = jpegOfBlocks(24, 16, (column, row) => (column === 0 && row === 0 ? [220, 30, 20] : column === 2 ? [20, 40, 200] : [128, 128, 128]));
  const picture = smak.unjpeg(jpeg);
  const at = (x, y) => [...picture.rgb.subarray((y * 24 + x) * 3, (y * 24 + x) * 3 + 3)];
  sure(picture.width === 24 && picture.height === 16, `${picture.width}x${picture.height}`);
  const close = (a, b) => a.every((v, i) => Math.abs(v - b[i]) <= 3);
  sure(close(at(0, 0), [220, 30, 20]) && close(at(12, 12), [128, 128, 128]) && close(at(20, 3), [20, 40, 200]), `${at(0, 0)} ${at(12, 12)} ${at(20, 3)}`);
  const sceneWith = (bytes) => {
    const g = gltfBuilder();
    const POSITION = g.accessor([0, 0, 0, 1, 0, 0, 0, 1, 0], "VEC3");
    const image = g.image(bytes, "image/jpeg");
    Object.assign(g.json, {
      nodes: [{ mesh: 0 }],
      meshes: [{ primitives: [{ attributes: { POSITION }, material: 0 }] }],
      materials: [{ name: "photo", pbrMetallicRoughness: { baseColorTexture: { index: 0 }, baseColorFactor: [0.5, 0.25, 0, 1] } }],
      textures: [{ source: image }],
    });
    return smak.readGlb(g.glb());
  };
  const made = smak.importModel(sceneWith(jpeg), { name: "photo.mdl" });
  sure(made.report.textures[0].from === "the picture given" && made.report.textures[0].width === 24, JSON.stringify(made.report.textures));
  // a lossless JPEG: its frame marker SOF3
  const lossless = Buffer.from(jpeg);
  lossless[lossless.indexOf(Buffer.from([0xff, 0xc0])) + 1] = 0xc3;
  sure(/lossless JPEG \(SOF3\)/.test(said(() => smak.unjpeg(lossless))), said(() => smak.unjpeg(lossless)));
  const refused = smak.importModel(sceneWith(lossless), { name: "photo.mdl" });
  sure(refused.warnings.some((line) => /photo: .*lossless/.test(line)), refused.warnings.join(" | "));
  sure(refused.report.textures[0].from.startsWith("the colour 0.5 0.25 0"), refused.report.textures[0].from);
});

test("importModel and importPiece refuse what they cannot do, saying so", () => {
  const read = smak.readFbx(cube());
  sure(/origin is keep, base, centre/.test(said(() => smak.importModel(read, { origin: "middle" }))), "an origin");
  sure(/fit is a number of units over 0/.test(said(() => smak.importModel(read, { fit: -3 }))), "a fit");
  sure(/as is auto, haft, plain, shield/.test(said(() => smak.importPiece(read, { as: "sword" }))), "a way of holding");
  sure(/x, y or z/.test(said(() => smak.importPiece(read, { axis: "w" }))), "an axis");
  sure(/longer than the 63/.test(said(() => smak.importRigged(read, { name: "x".repeat(70) }))), "a name too long");
});
