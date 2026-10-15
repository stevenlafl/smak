// A map's pictures from photographs: JPEG read (against ImageMagick and ffmpeg where installed), a material's
// detail taken from a picture and made Valve-like (the valve filter), the picture itself (literal), the picture
// made to sit among Valve's (aged), a door that keeps its panels over a picture's grain, the procedural grain that
// is not noise, and all of it through the map and .wad specs and the MCP build tool.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import * as smak from "../src/index.mjs";
import { materialOf, surfacePicture, MATERIALS, UNWORN } from "../src/spec/paint.mjs";
import { lookOf, lookFaults, valveFor, VALVE, ALLOWED } from "../src/spec/look.mjs";
import { materialRect } from "../src/spec/reference.mjs";
import { buildMapSpec } from "../src/spec/map.mjs";
import { buildWadSpec } from "../src/spec/wad.mjs";
import { buildModelSpec } from "../src/spec/model.mjs";
import { toolsFor } from "../mcp/tools.mjs";
import { test, testAsync, sure, tmp } from "./helper.mjs";

const folder = join(tmp, "reference");
mkdirSync(folder, { recursive: true });
const has = (tool) => spawnSync(tool, ["-version"], { stdio: "ignore" }).status === 0;
const lumAt = (image, x, y) => {
  const step = image.rgb ? 3 : 4;
  const data = image.rgb ?? image.rgba;
  const i = (((y + image.height) % image.height) * image.width + ((x + image.width) % image.width)) * step;
  return 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
};
const meanOf = (image) => {
  const sum = [0, 0, 0];
  for (let i = 0; i < image.width * image.height; i++) for (let c = 0; c < 3; c++) sum[c] += image.rgb[i * 3 + c] / 255 / (image.width * image.height);
  return sum;
};
/** The step across the picture's right edge (and bottom) against the mean step inside it, as test 53 measures. */
const seamOf = (image) => {
  const across = (x) => {
    let d = 0;
    for (let y = 0; y < image.height; y++) d += Math.abs(lumAt(image, x + 1, y) - lumAt(image, x, y));
    return d / image.height;
  };
  const down = (y) => {
    let d = 0;
    for (let x = 0; x < image.width; x++) d += Math.abs(lumAt(image, x, y + 1) - lumAt(image, x, y));
    return d / image.width;
  };
  let inX = 0;
  for (let x = 0; x < image.width - 1; x++) inX += across(x) / (image.width - 1);
  let inY = 0;
  for (let y = 0; y < image.height - 1; y++) inY += down(y) / (image.height - 1);
  return { x: across(image.width - 1) / inX, y: down(image.height - 1) / inY };
};

/**
 * A stand-in for a photograph of a wall (no photo is kept in the kit): plaster's lumps and pits of a few pixels
 * across, under a light that falls off to one side, with a strip of something else (a dark skirting) along its
 * foot. 600 by 400.
 */
function photoOfWall() {
  const [w, h] = [600, 400];
  const rgb = new Uint8Array(w * h * 3);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const light = 0.55 + 0.45 * (x / w);
      const lumps = smak.workshop.fbm(x * 0.05, y * 0.05, 3, 4) - 0.5;
      const pits = smak.workshop.fbm(x * 0.4, y * 0.4, 9, 2) > 0.7 ? -0.25 : 0;
      const skirting = y > 340;
      const v = skirting ? 0.12 + 0.02 * Math.sin(x) : light * (0.78 + 0.35 * lumps + pits);
      const tint = skirting ? [1, 0.6, 0.4] : [1.02, 1, 0.94];
      for (let c = 0; c < 3; c++) rgb[(y * w + x) * 3 + c] = Math.max(0, Math.min(255, Math.round(255 * v * tint[c])));
    }
  return { width: w, height: h, rgb };
}
const wall = photoOfWall();
const rgbaOf = (image) => {
  const rgba = new Uint8Array(image.width * image.height * 4);
  for (let i = 0; i < image.width * image.height; i++) rgba.set([...image.rgb.subarray(i * 3, i * 3 + 3), 255], i * 4);
  return rgba;
};
writeFileSync(join(folder, "wall.png"), smak.png(wall.width, wall.height, rgbaOf(wall)));

test("JPEG: baseline, progressive, grey, 4:2:0, 4:2:2, restarts, CMYK and EXIF turns read as libjpeg and ffmpeg read them", () => {
  if (!has("magick") && !has("ffmpeg")) return void console.log("      (neither ImageMagick nor ffmpeg here: only the kit's own JPEG test ran, in 39-import-faults)");
  const source = join(folder, "jpeg-source.png");
  writeFileSync(source, smak.png(wall.width / 2, wall.height / 2, rgbaOf(smak.shrink(wall, 2))));
  const kinds = has("magick")
    ? {
        b420: ["-quality", "85", "-sampling-factor", "4:2:0"],
        b422: ["-quality", "85", "-sampling-factor", "4:2:2"],
        b444: ["-quality", "92", "-sampling-factor", "4:4:4"],
        grey: ["-quality", "85", "-colorspace", "gray"],
        p420: ["-quality", "85", "-interlace", "JPEG", "-sampling-factor", "4:2:0"],
        p444: ["-quality", "92", "-interlace", "JPEG", "-sampling-factor", "4:4:4"],
        pgrey: ["-quality", "85", "-interlace", "JPEG", "-colorspace", "gray"],
        restarts: ["-quality", "85", "-define", "jpeg:restart-interval=3"],
        prestarts: ["-quality", "85", "-interlace", "JPEG", "-define", "jpeg:restart-interval=2"],
        cmyk: ["-quality", "90", "-colorspace", "CMYK"],
      }
    : {};
  const said = [];
  for (const [kind, flags] of Object.entries(kinds)) {
    const file = join(folder, `${kind}.jpg`);
    spawnSync("magick", [source, ...flags, file]);
    const theirs = join(folder, `${kind}.im.png`);
    spawnSync("magick", [file, "-colorspace", "sRGB", "-type", "TrueColor", "-depth", "8", theirs]);
    const mine = smak.unjpeg(readFileSync(file));
    const ref = smak.unpng(readFileSync(theirs));
    sure(mine.width === ref.width && mine.height === ref.height, `${kind}: ${mine.width}x${mine.height} against ${ref.width}x${ref.height}`);
    let most = 0;
    let sum = 0;
    for (let i = 0; i < ref.width * ref.height; i++)
      for (let c = 0; c < 3; c++) {
        const d = Math.abs(ref.rgba[i * 4 + c] - mine.rgb[i * 3 + c]);
        most = Math.max(most, d);
        sum += d;
      }
    said.push(`${kind} ${most}`);
    // libjpeg's integer DCT and the kit's floating one differ by a step or two
    sure(most <= 4 && sum / (ref.width * ref.height * 3) < 0.5, `${kind}: off by ${most} at most, ${(sum / (ref.width * ref.height * 3)).toFixed(2)} on the mean, against ImageMagick`);
  }
  // the EXIF orientation: each of the seven turns, against ImageMagick's -auto-orient
  if (has("magick")) {
    const plain = readFileSync(join(folder, "b444.jpg"));
    for (let o = 2; o <= 8; o++) {
      const tiff = Buffer.alloc(26);
      tiff.write("MM", 0, "latin1");
      tiff.writeUInt16BE(42, 2);
      tiff.writeUInt32BE(8, 4);
      tiff.writeUInt16BE(1, 8);
      tiff.writeUInt16BE(0x0112, 10);
      tiff.writeUInt16BE(3, 12);
      tiff.writeUInt32BE(1, 14);
      tiff.writeUInt16BE(o, 18);
      const body = Buffer.concat([Buffer.from("Exif\0\0", "latin1"), tiff]);
      const head = Buffer.from([0xff, 0xe1, 0, 0]);
      head.writeUInt16BE(body.length + 2, 2);
      const file = join(folder, `turn${o}.jpg`);
      writeFileSync(file, Buffer.concat([plain.subarray(0, 2), head, body, plain.subarray(2)]));
      spawnSync("magick", [file, "-auto-orient", "-type", "TrueColor", "-depth", "8", `${file}.png`]);
      const mine = smak.unjpeg(readFileSync(file));
      const ref = smak.unpng(readFileSync(`${file}.png`));
      let most = 0;
      for (let i = 0; i < ref.width * ref.height; i++) for (let c = 0; c < 3; c++) most = Math.max(most, Math.abs(ref.rgba[i * 4 + c] - mine.rgb[i * 3 + c]));
      sure(mine.orientation === o && mine.width === ref.width && most <= 4, `orientation ${o}: ${mine.width}x${mine.height}, off by ${most}`);
    }
  }
  // ffmpeg spreads half-sampled colour back by repeating it, not blending: held to the same where the colour is
  // sampled in full, and to the mean elsewhere
  if (has("ffmpeg")) {
    for (const [kind, args] of [["ff444", ["-pix_fmt", "yuvj444p", "-q:v", "2"]], ["ff420", ["-pix_fmt", "yuvj420p", "-q:v", "3"]]]) {
      const file = join(folder, `${kind}.jpg`);
      spawnSync("ffmpeg", ["-loglevel", "error", "-y", "-i", source, ...args, file]);
      spawnSync("ffmpeg", ["-loglevel", "error", "-y", "-i", file, "-pix_fmt", "rgb24", `${file}.png`]);
      const mine = smak.unjpeg(readFileSync(file));
      const ref = smak.unpng(readFileSync(`${file}.png`));
      let sum = 0;
      let most = 0;
      for (let i = 0; i < ref.width * ref.height; i++)
        for (let c = 0; c < 3; c++) {
          const d = Math.abs(ref.rgba[i * 4 + c] - mine.rgb[i * 3 + c]);
          sum += d;
          most = Math.max(most, d);
        }
      const mean = sum / (ref.width * ref.height * 3);
      sure(kind === "ff444" ? most <= 4 : mean < 3, `${kind}: off by ${most} at most, ${mean.toFixed(2)} on the mean, against ffmpeg`);
    }
  }
  // a picture reader takes all three, and a texture is made from a JPEG
  sure(smak.unpicture(readFileSync(join(folder, "wall.png"))).width === 600, "a PNG through unpicture");
  if (existsSync(join(folder, "b420.jpg"))) {
    sure(smak.unpicture(readFileSync(join(folder, "b420.jpg"))).rgba.length === 300 * 200 * 4, "a JPEG through unpicture");
    sure(smak.textureFrom(readFileSync(join(folder, "b420.jpg")), "wall.bmp").pixels.length === 300 * 200, "a texture from a JPEG");
  }
});

test("a picture's material is found in it: the largest part like the rest, the skirting left out", () => {
  const [x0, y0, x1, y1] = materialRect(wall);
  sure(y1 <= 345 && y1 >= 300 && x1 - x0 >= 500 && y0 <= 20, `${x0},${y0} to ${x1},${y1}`);
});

test("the valve filter: a picture's detail, seamless, in its tone and in Valve's range for its kind, grain that is the material's", () => {
  for (const [base, tone] of [["plaster", [0.5, 0.48, 0.44]], ["planks", null], ["stone", [0.42, 0.42, 0.44]]]) {
    const material = { base, picture: wall, size: 96, ...(tone ? { tone } : {}) };
    const image = surfacePicture(material, 128, 128);
    const look = lookOf(image);
    const range = valveFor(base);
    const seam = seamOf(image);
    // the step across the edge is like the steps inside (planks: their own seams are the base's, drawn on the grid)
    // (planks across: the base draws a plank's groove on the tile's edge, which a photo's grain raised at most twice
    // no longer hides; 1.72 for this smooth wall)
    sure(seam.x < (base === "planks" ? 2 : 1.6) && seam.y < 1.8, `${base}: the step across the edge ${seam.x.toFixed(2)} and ${seam.y.toFixed(2)} times the steps inside`);
    sure(look.fine >= range.fine[0] && look.fine <= range.fine[2] * 1.05, `${base}: grain ${look.fine.toFixed(3)} against Valve's ${range.fine}`);
    sure(look.colour <= range.colour[2], `${base}: colour ${look.colour.toFixed(3)} against Valve's ${range.colour}`);
    sure(look.structure >= Math.max(0.05, VALVE.structure[0]), `${base}: grain alike ${look.structure.toFixed(2)}`);
    // the light that fell off across the photo is gone: the left half as bright as the right
    let [left, right] = [0, 0];
    for (let y = 0; y < 128; y++) for (let x = 0; x < 64; x++) [left, right] = [left + lumAt(image, x, y), right + lumAt(image, x + 64, y)];
    sure(Math.abs(left - right) / right < 0.08, `${base}: left ${left.toFixed(0)} right ${right.toFixed(0)}`);
    if (tone) {
      const mean = meanOf(image);
      const lum = (c) => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
      sure(Math.abs(lum(mean) - lum(tone)) < 0.04 && Math.abs(mean[2] / mean[0] - tone[2] / tone[0]) < 0.06, `${base}: mean ${mean.map((v) => v.toFixed(2))} against the tone ${tone}`);
    }
    sure(image.facts?.some((f) => /^valve: .*as 96 across units.*made to tile/.test(f)), (image.facts ?? []).join("; "));
  }
  // the procedural grain it stands in for has none of the picture's lumps: the picture's are there
  const plain = surfacePicture({ base: "plaster" }, 128, 128);
  const pictured = surfacePicture({ base: "plaster", picture: wall, size: 96 }, 128, 128);
  sure(Math.abs(lookOf(plain).structure - lookOf(pictured).structure) > 0.01 || lookOf(plain).fine !== lookOf(pictured).fine, "the picture changed nothing");
});

test("literal: the picture itself, cropped and laid over the texture, made to tile only when asked; aged keeps its content", () => {
  // a picture as large as the texture, taken whole: the very pixels
  const small = { width: 64, height: 32, rgb: smak.shrink(wall, 1).rgb.slice(0, 64 * 32 * 3) };
  for (let y = 0; y < 32; y++) small.rgb.set(wall.rgb.subarray(y * 600 * 3, y * 600 * 3 + 64 * 3), y * 64 * 3);
  const same = surfacePicture({ base: "plaster", picture: small, filter: "literal" }, 64, 32);
  sure(Buffer.from(same.rgb).equals(Buffer.from(small.rgb)), "a picture of the texture's size taken as it is changed");
  // a rect: that part only
  const part = surfacePicture({ base: "plaster", picture: wall, filter: "literal", rect: [100, 50, 164, 82] }, 64, 32);
  sure(Math.abs(lumAt(part, 10, 10) - lumAt(wall, 110, 60)) < 1, `${lumAt(part, 10, 10)} against ${lumAt(wall, 110, 60)}`);
  // not made to tile: a photo's light falls off across it, so its edges differ; tile: true joins them
  const loose = surfacePicture({ base: "plaster", picture: wall, filter: "literal", rect: [0, 0, 600, 300] }, 128, 64);
  const tiled = surfacePicture({ base: "plaster", picture: wall, filter: "literal", rect: [0, 0, 600, 300], tile: true }, 128, 64);
  sure(seamOf(loose).x > 2 && seamOf(tiled).x < 1.6, `the edge's step: ${seamOf(loose).x.toFixed(2)} as it is, ${seamOf(tiled).x.toFixed(2)} made to tile`);
  // aged: the same content (its light flattened), its look moved into Valve's range
  const aged = surfacePicture({ base: "plaster", picture: wall, filter: "aged", rect: [0, 0, 600, 300] }, 128, 64);
  let [sa, sb, sab] = [0, 0, 0];
  const [ma, mb] = [lookOf(loose).bright * 255, lookOf(aged).bright * 255];
  for (let y = 0; y < 64; y++)
    for (let x = 0; x < 128; x++) {
      // the fine detail of each against its own neighbours, so the flattened light does not count
      const da = lumAt(loose, x, y) - (lumAt(loose, x + 2, y) + lumAt(loose, x - 2, y)) / 2;
      const db = lumAt(aged, x, y) - (lumAt(aged, x + 2, y) + lumAt(aged, x - 2, y)) / 2;
      [sa, sb, sab] = [sa + da * da, sb + db * db, sab + da * db];
    }
  sure(sab / Math.sqrt(sa * sb) > 0.8, `aged keeps the picture's detail: ${(sab / Math.sqrt(sa * sb)).toFixed(2)} alike (means ${ma.toFixed(0)}, ${mb.toFixed(0)})`);
  const range = valveFor("plaster");
  sure(lookOf(aged).bright >= range.bright[0] && lookOf(aged).bright <= range.bright[2] && lookOf(aged).fine >= range.fine[0], JSON.stringify(lookOf(aged)));
  // a wrong filter, a rect, a size or a mesh with a picture are refused in words
  for (const [given, said] of [
    [{ base: "plaster", picture: wall, filter: "sepia" }, /filter: one of valve, literal, aged/],
    [{ base: "plaster", picture: wall, rect: [5, 5, 2, 9] }, /rect: \[x0, y0, x1, y1\]/],
    [{ base: "plaster", picture: wall, size: -3 }, /size: the units/],
    [{ base: "mesh", picture: wall }, /a mesh is its cords/],
    [{ base: "plaster", picture: 7 }, /picture: a picture file/],
  ]) {
    let message = "";
    try {
      materialOf(given);
    } catch (error) {
      message = error.message;
    }
    sure(said.test(message), `${JSON.stringify({ ...given, picture: typeof given.picture })}: ${message}`);
  }
});

test("a door with a picture keeps its panels, bevels and handle, the picture's grain under them", () => {
  const plain = surfacePicture({ base: "door" }, 64, 128);
  const pictured = surfacePicture({ base: "door", picture: wall, size: 48, tone: [0.42, 0.28, 0.16] }, 64, 128);
  // the handle: brass in both, red over blue (the plain one's patches and grain lie over it too)
  for (const image of [plain, pictured]) {
    const i = (68 * 64 + 53) * 3;
    sure(image.rgb[i] > 2 * image.rgb[i + 2] && image.rgb[i] > 120, `the handle ${[...image.rgb.subarray(i, i + 3)]}`);
  }
  // a panel's lit top bevel brighter than its middle, its shadowed left bevel darker, as without the picture
  const row = (image, y, x0, x1) => {
    let s = 0;
    for (let x = x0; x < x1; x++) s += lumAt(image, x, y);
    return s / (x1 - x0);
  };
  const column = (image, x, y0, y1) => {
    let s = 0;
    for (let y = y0; y < y1; y++) s += lumAt(image, x, y);
    return s / (y1 - y0);
  };
  for (const image of [plain, pictured]) {
    const middle = row(image, 35, 20, 44);
    sure(column(image, 12, 20, 50) < 0.85 * middle, `the shadowed bevel ${column(image, 12, 20, 50).toFixed(0)} against the panel ${middle.toFixed(0)}`);
    sure(row(image, 1, 4, 60) < 0.85 * row(image, 6, 4, 60), "the frame's dark rim");
  }
  // and the picture's grain is in the panel: the two differ there
  let diff = 0;
  for (let y = 20; y < 50; y++) for (let x = 20; x < 44; x++) diff += Math.abs(lumAt(plain, x, y) - lumAt(pictured, x, y));
  sure(diff / (30 * 24) > 3, `the panel with and without the picture differ by ${(diff / 720).toFixed(1)}`);
});

test("the procedural grain is the material's, not noise: alike from texel to texel as Valve's are, and white noise is named", () => {
  for (const base of Object.keys(MATERIALS).filter((b) => b !== "mesh" && !UNWORN.has(b) && !(ALLOWED[b] ?? []).includes("structure"))) {
    const look = lookOf(surfacePicture({ base }, base === "door" ? 64 : 128, 128));
    sure(look.structure >= VALVE.structure[0], `${base}: grain alike ${look.structure.toFixed(3)}, Valve's 10th ${VALVE.structure[0]}`);
  }
  // a grey of white noise texel by texel: grain enough for the old measure, and named for what it is
  const noise = { width: 64, height: 64, rgb: new Uint8Array(64 * 64 * 3) };
  for (let i = 0; i < 64 * 64; i++) noise.rgb.fill(Math.round(110 + 30 * smak.workshop.rand(i % 64, Math.floor(i / 64), 4)), i * 3, i * 3 + 3);
  const look = lookOf(noise);
  sure(look.fine > VALVE.fine[0] && look.structure < 0, `noise: grain ${look.fine.toFixed(3)}, alike ${look.structure.toFixed(3)}`);
  sure(lookFaults(look).some((f) => /grain that is noise/.test(f)), lookFaults(look).join(", "));
  // a .wad's speckle, the remedy the warning names, is grit too: more grain than none, and alike
  const built = buildWadSpec({ spec: "smak.wad/1", name: "grit.wad", textures: [{ name: "plain", size: [128, 128], material: { base: "plaster" } }, { name: "speckled", size: [128, 128], material: { base: "plaster" }, wear: { speckle: 1 } }] }, { out: join(folder, "grit") });
  const [plain, speckled] = built.textures.map((t) => lookOf(t.image));
  sure(speckled.fine > 1.4 * plain.fine && speckled.structure >= VALVE.structure[1], `speckle: grain ${plain.fine.toFixed(3)} to ${speckled.fine.toFixed(3)}, alike ${speckled.structure.toFixed(2)}`);
});

test("a map and a .wad take a picture by its path, beside the spec; a model's part refuses one; a picture not there is an error", () => {
  const spec = {
    spec: "smak.map/1",
    name: "photo_room",
    theme: { wall: "wall", door: "front" },
    textures: { wall: { base: "plaster", picture: "wall.png", size: 96, tone: [0.5, 0.48, 0.44] }, front: { base: "door", picture: "wall.png", rect: [0, 0, 300, 300] }, poster: { base: "paint", picture: "wall.png", filter: "literal", rect: [0, 0, 200, 300], size: [32, 48] } },
    rooms: [{ id: "a", size: [256, 256, 128] }, { id: "b", size: [256, 256, 128], place: { east_of: "a" } }],
    links: [{ between: ["a", "b"], kind: "door" }],
    furniture: [{ prefab: "sign", room: "a", at: "against north" }],
    prefabs: { sign: { pieces: [{ box: [[-16, -1, 40], [16, 1, 88]], texture: "poster" }] } },
    entities: [{ class: "info_player_start", room: "a", at: "centre" }],
  };
  const out = join(folder, "map");
  const built = buildMapSpec(spec, { out, folder, compilers: { found: false, message: "" } });
  sure(!built.report.errors.length, built.report.errors.join("; "));
  const wad = smak.maps.readWad(readFileSync(join(out, "photo_room.wad")));
  const named = (part) => wad.textures.find((t) => t.name.toLowerCase().includes(part));
  sure(named("wall") && named("front") && named("poster"), wad.textures.map((t) => t.name).join(", "));
  sure(named("poster").width === 32 && named("poster").height === 48, `the poster ${named("poster").width}x${named("poster").height}: its size in units`);
  sure(named("front").width === 64 && named("front").height === 128, "the door 64 by 128");
  sure(built.report.facts.some((f) => /texture \S*wall: valve: /i.test(f)) && built.report.facts.some((f) => /poster: literal: 200x300/i.test(f)), built.report.facts.filter((f) => /texture/.test(f)).join("; "));
  // not there: an error in words, no map
  const missing = buildMapSpec({ ...spec, name: "photo_missing", textures: { ...spec.textures, wall: { base: "plaster", picture: "nowhere.jpg" } } }, { out: join(folder, "missing"), folder, compilers: { found: false, message: "" } });
  sure(missing.report.errors.some((e) => /textures: .*nowhere\.jpg/.test(e)) && !missing.map, missing.report.errors.join("; "));
  // a model's material takes a photograph too: its detail over the part at its real size, in the tone given
  const boxOf = (material) => buildModelSpec({ spec: "smak.model/1", name: "box.mdl", kind: "prop", finish: false, parts: [{ id: "body", kind: "box", size: [32, 32, 32], material }] }, { folder });
  const plain = boxOf({ base: "plaster", tone: [0.45, 0.43, 0.4] });
  const photo = boxOf({ base: "plaster", tone: [0.45, 0.43, 0.4], picture: "wall.png", size: 48 });
  sure(photo.report.ok && photo.report.facts.some((f) => /^material plaster \(wall\.png\): valve: .* at 4 texels a unit/.test(f)), [...photo.report.errors, ...photo.report.facts.filter((f) => /material/.test(f))].join("; "));
  const looks = [plain, photo].map((b) => { const t = smak.textureOf(b.mdl, smak.readMdl(b.mdl).textures[0].name); const rgba = smak.rgbaOf(t); return lookOf({ width: t.width, height: t.height, rgba }); });
  sure(looks[1].fine > looks[0].fine, `plain ${JSON.stringify(looks[0])} photo ${JSON.stringify(looks[1])}`);
  const unread = boxOf({ base: "plaster", picture: "nowhere.jpg" });
  sure(unread.report.errors.some((e) => /materials: .*nowhere\.jpg/.test(e)), unread.report.errors.join("; "));
  // a .wad spec, its picture beside it
  const wadBuilt = buildWadSpec({ spec: "smak.wad/1", name: "photos.wad", textures: [{ name: "photo_wall", size: [64, 64], material: { base: "plaster", picture: "wall.png", size: 64 } }, { name: "photo_sign", size: [64, 32], material: { base: "paint", picture: "wall.png", filter: "literal" } }] }, { out: join(folder, "wad"), folder });
  sure(wadBuilt.report.ok && wadBuilt.report.facts.some((f) => /^photo_sign: literal/.test(f)), [...wadBuilt.report.errors, ...wadBuilt.report.facts].join("; "));
});

await testAsync("the MCP build tool reads a .wad spec's picture from the work folder, a JPEG among them", "MCP picture", async () => {
  const work = join(folder, "work");
  mkdirSync(join(work, "refs"), { recursive: true });
  // a JPEG when a tool here can write one, a PNG otherwise
  let picture = "refs/wall.png";
  writeFileSync(join(work, picture), readFileSync(join(folder, "wall.png")));
  if (has("magick")) {
    spawnSync("magick", [join(folder, "wall.png"), "-quality", "85", "-interlace", "JPEG", join(work, "refs", "wall.jpg")]);
    if (existsSync(join(work, "refs", "wall.jpg"))) picture = "refs/wall.jpg";
  }
  const spec = { spec: "smak.wad/1", name: "refs.wad", textures: [{ name: "ref_wall", size: [128, 128], material: { base: "stone", picture: `work:${picture}`, size: 96 } }] };
  const build = toolsFor({ work }).find((tool) => tool.name === "build");
  const answer = await build.call({ spec: JSON.stringify(spec) });
  const words = answer.find((piece) => piece.type === "text").text;
  sure(/^OK/.test(words) && /ref_wall: valve: /.test(words), words.slice(0, 600));
  // a path outside the folders is refused
  const outside = await build.call({ spec: JSON.stringify({ ...spec, textures: [{ ...spec.textures[0], material: { base: "stone", picture: "/etc/hostname" } }] }) });
  const refused = outside.find((piece) => piece.type === "text").text;
  sure(/outside the models and work folders|no such file/.test(refused), refused.slice(0, 300));
});
