// A spec of textures for a map's .wad: each texture a seamless material with panels and words painted on it,
// built into a .wad and drawn as a sheet. The .wad can stand in for a game's own: textures of the same names
// take their place in any map that wears them (the MCP render tool's `wad`).
//
//   validateWadSpec(spec) -> { errors, warnings }
//   buildWadSpec(spec, { out, folder, readPicture }) -> { report, files: { wad, sheet }, textures: [{ name, image }] }
//
// A texture: { name (15 letters at most: `{` first for one with holes, `!` for a liquid, `+0` an animation's
// frame), size: [width, height] (multiples of 16, 512 at most), material (a word of `materials` or a base),
// panels (as a box face's, in texels from the bottom left), print (words, as a box face's), grime (0 to 1: dirt
// gathered toward its foot), relief (pipes, bars, louvres, rivets, seams, lamps, lit: relief.mjs), wear ({ stains,
// streaks, cracks, scratches, speckle } 0 to 1: weather.mjs) }. A material may take its detail, or be, a photograph
// (`picture`, read from `folder` or by `readPicture`: reference.mjs).
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { sheet as workshopSheet, fbm } from "../workshop.mjs";
import { tile } from "../render.mjs";
import { png, unpicture } from "../image.mjs";
import { writeWad } from "../maps/wad.mjs";
import { readBsp } from "../maps/bsp.mjs";
import { liftTexture } from "../maps/lift.mjs";
import { materialOf, surfacePicture, UNWORN } from "./paint.mjs";
import { lookSentence, ALLOWED } from "./look.mjs";
import { paintPanels, paintWords } from "./faces.mjs";
import { weather, WEAR_LAYERS } from "./weather.mjs";
import { relief, RELIEF_KINDS } from "./relief.mjs";

export const WAD_SPEC = "smak.wad/1";
const TOP = ["spec", "name", "materials", "textures", "preview", "note"];
const FIELDS = ["name", "size", "material", "panels", "print", "relief", "grime", "wear", "note", "lift", "from"];
const isNumber = (v) => typeof v === "number" && Number.isFinite(v);
/** The largest side a texture of GoldSrc's is drawn at as painted. */
const SIDE_MOST = 512;

export function validateWadSpec(spec) {
  const errors = [];
  const warnings = [];
  if (spec?.spec !== WAD_SPEC) errors.push(`spec: "${WAD_SPEC}"`);
  for (const key of Object.keys(spec ?? {})) if (!TOP.includes(key)) warnings.push(`${key}: a wad spec takes no ${key}, left out`);
  if (typeof spec?.name !== "string" || !/^[\w.-]+\.wad$/i.test(spec.name)) errors.push("name: the file, letters, digits and _ . -, ending .wad");
  if (!Array.isArray(spec?.textures) || !spec.textures.length) {
    errors.push("textures: a list of one texture at least");
    return { errors, warnings };
  }
  const seen = new Set();
  spec.textures.forEach((texture, i) => {
    const at = `textures[${i}]${texture?.name ? ` (${texture.name})` : ""}`;
    if (typeof texture?.name !== "string" || !texture.name || texture.name.length > 15 || /\s/.test(texture.name))
      errors.push(`${at}.name: one word of 15 letters at most`);
    else if (seen.has(texture.name.toLowerCase())) errors.push(`${at}.name: given twice`);
    else seen.add(texture.name.toLowerCase());
    for (const key of Object.keys(texture ?? {})) if (!FIELDS.includes(key)) warnings.push(`${at}.${key}: a texture takes no ${key}, left out`);
    if (!Array.isArray(texture?.size) || texture.size.length !== 2 || !texture.size.every((v) => Number.isInteger(v) && v >= 16 && v <= SIDE_MOST && v % 16 === 0))
      errors.push(`${at}.size: [width, height], each a multiple of 16 from 16 to ${SIDE_MOST}`);
    try {
      const given = texture?.material ?? "plaster";
      materialOf(typeof given === "string" && spec.materials?.[given] !== undefined ? spec.materials[given] : given, `${at}.material`);
    } catch (error) {
      errors.push(error.message);
    }
    if (texture?.grime !== undefined && !(isNumber(texture.grime) && texture.grime >= 0 && texture.grime <= 1)) errors.push(`${at}.grime: 0 to 1`);
    if (texture?.lift !== undefined && (!(typeof texture.lift?.map === "string" && typeof texture.lift?.view === "string") || (texture.lift.views !== undefined && typeof texture.lift.cameras !== "string")))
      errors.push(`${at}.lift: { map: "models:<the map>.bsp", view: "work:pictures/<its view>.png", texture, views, cameras }: the texture taken off a view of it on its wall, as the map's place view draws it, and off the map's views too (views: their sheet, cameras: its .json)`);
    if (texture?.from !== undefined) {
      const f = typeof texture.from === "string" ? { texture: texture.from } : texture.from;
      const earlier = spec.textures.slice(0, i).map((t) => t?.name?.toLowerCase());
      if (!f || typeof f.texture !== "string" || !earlier.includes(f.texture.toLowerCase()))
        errors.push(`${at}.from: the name of a texture above it in this spec ("-0genpipe1"), or { texture, brightness, flip: "x" | "y", shift: [x, y] }: this one made from that one's picture (a random set's other tiles, an animation's other frames)`);
      else if ((f.brightness !== undefined && !(typeof f.brightness === "number" && f.brightness > 0 && f.brightness <= 4)) || (f.flip !== undefined && !["x", "y", "xy"].includes(f.flip)) || (f.shift !== undefined && !(Array.isArray(f.shift) && f.shift.length === 2 && f.shift.every(Number.isInteger))))
        errors.push(`${at}.from: brightness (a multiple, 0.4 a lamp switched off), flip ("x", "y" or "xy") and shift ([x, y] texels, wrapping) are its changes`);
    }
    if (texture?.lift?.brightness !== undefined && !(typeof texture.lift.brightness === "number" && texture.lift.brightness > 0 && texture.lift.brightness <= 8))
      errors.push(`${at}.lift.brightness: the brightness its view was drawn at (4.5, the place view's, unless told; a darker view of a lamp, 0.5)`);
    if (texture?.wear !== undefined) {
      if (typeof texture.wear !== "object" || Array.isArray(texture.wear)) errors.push(`${at}.wear: { ${WEAR_LAYERS.join(", ")} } each 0 to 1, and seed`);
      else
        for (const [key, value] of Object.entries(texture.wear))
          if (key === "seed") continue;
          else if (!WEAR_LAYERS.includes(key)) warnings.push(`${at}.wear.${key}: no such layer (${WEAR_LAYERS.join(", ")}), left out`);
          else if (!(isNumber(value) && value >= 0 && value <= 1)) errors.push(`${at}.wear.${key}: 0 to 1`);
    }
    for (const [k, part] of (Array.isArray(texture?.relief) ? texture.relief : texture?.relief === undefined ? [] : [null]).entries()) {
      const where = `${at}.relief[${k}]`;
      if (!RELIEF_KINDS.includes(part?.kind)) {
        errors.push(`${where}.kind: one of ${RELIEF_KINDS.join(", ")}`);
        continue;
      }
      const point = (p) => Array.isArray(p) && p.length === 2 && p.every(isNumber);
      if (part.kind === "pipe" && !(Array.isArray(part.path) && part.path.length >= 2 && part.path.every(point))) errors.push(`${where}.path: [[x, y], [x, y], ...] in texels from the bottom left, two points at least`);
      if (["bars", "louvre", "lamp"].includes(part.kind) && !(point(part.at) && point(part.size))) errors.push(`${where}: at [x, y] (its middle) and size [w, h], in texels`);
      if (["rivets", "seam"].includes(part.kind) && !(point(part.from) && point(part.to))) errors.push(`${where}: from [x, y] and to [x, y], in texels`);
      if (part.material !== undefined)
        try {
          materialOf(typeof part.material === "string" && spec.materials?.[part.material] !== undefined ? spec.materials[part.material] : part.material, `${where}.material`);
        } catch (error) {
          errors.push(error.message);
        }
    }
    for (const [k, panel] of (texture?.panels ?? []).entries())
      if (!Array.isArray(panel?.at) || !Array.isArray(panel?.size)) errors.push(`${at}.panels[${k}]: { at: [x, y], size: [w, h], shape, style, edge, material }`);
  });
  return { errors, warnings };
}

/**
 * A texture made from another of the spec, above it: its picture brightened or dimmed, flipped and shifted (wrapping),
 * then fitted to this one's size. A random set's other tiles (-1, -2 beside a lifted -0) and an animation's other
 * frames (a lamp's +a, off) are not on the map's faces to be lifted, and painted apart they did not match their set
 * (-0genpipe1's, unanimously docked by three judges).
 */
function fromTexture(texture, made) {
  const f = typeof texture.from === "string" ? { texture: texture.from } : texture.from;
  const source = made.find((t) => t.name.toLowerCase() === f.texture.toLowerCase()).image;
  const [width, height] = texture.size;
  const ch = source.rgba ? 4 : 3;
  const px = source.rgba ?? source.rgb;
  const out = new Uint8Array(width * height * ch);
  const [dx, dy] = f.shift ?? [0, 0];
  const k = f.brightness ?? 1;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      let sx = Math.floor((x * source.width) / width);
      let sy = Math.floor((y * source.height) / height);
      if (f.flip?.includes("x")) sx = source.width - 1 - sx;
      if (f.flip?.includes("y")) sy = source.height - 1 - sy;
      sx = (((sx + dx) % source.width) + source.width) % source.width;
      sy = (((sy + dy) % source.height) + source.height) % source.height;
      const i = (sy * source.width + sx) * ch;
      const o = (y * width + x) * ch;
      for (let c = 0; c < 3; c++) out[o + c] = Math.min(255, Math.round(px[i + c] * k));
      if (ch === 4) out[o + 3] = px[i + 3];
    }
  const said = [f.brightness !== undefined ? `times ${f.brightness}` : null, f.flip ? `flipped ${f.flip}` : null, f.shift ? `shifted ${f.shift.join(", ")}` : null].filter(Boolean);
  return { width, height, [ch === 4 ? "rgba" : "rgb"]: out, facts: [`made from ${f.texture}${said.length ? `, ${said.join(", ")}` : ""}`] };
}

/** One texture's picture: { width, height, rgb } (rgba for one with holes). */
function paintTexture(texture, materials, readPicture, readMap, readText) {
  // lifted off a view of it on its wall in a compiled map (src/maps/lift.mjs): the picture itself, its light divided out
  if (texture.lift) {
    const bsp = readMap(texture.lift.map);
    const extra = texture.lift.views ? { ...JSON.parse(readText(texture.lift.cameras)), picture: readPicture(texture.lift.views) } : null;
    const lifted = liftTexture(bsp, texture.lift.texture ?? texture.name, readPicture(texture.lift.view), { ...(extra ? { views: extra } : {}), ...(texture.lift.brightness !== undefined ? { brightness: texture.lift.brightness } : {}) });
    const [width, height] = texture.size;
    const { image } = lifted;
    const rgb = new Uint8Array(width * height * 3);
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const i = (Math.floor((y * image.height) / height) * image.width + Math.floor((x * image.width) / width)) * 3;
        rgb.set(image.rgb.subarray(i, i + 3), (y * width + x) * 3);
      }
    const facts = [`lifted off ${texture.lift.view}: ${Math.round(lifted.seen * 100)}% of its texels seen, ${Math.round(lifted.saturated * 100)}% of those white in the view, ${Math.round(lifted.tinted * 100)}% under a light of one strong colour`];
    const warnings = [];
    if (lifted.seen < 0.3) warnings.push(`lifted off ${texture.lift.view}, which shows ${Math.round(lifted.seen * 100)}% of it: its colour and grain are the texture's own (on frenzy, within 2 to 5 of delta E from 5% seen), and the rest is that part repeated, so a pattern larger than the part (a row of studs, a panel) is not there: add the map's views (views, cameras) to see more of it`);
    if (lifted.tinted > 0.3) warnings.push(`lifted off ${texture.lift.view}, ${Math.round(lifted.tinted * 100)}% of whose texels are under a light of one strong colour (a blue lamp): their other colours are not there to read and come back as the light's. Paint it, its colour from another view of it or from its name's kind`);
    if (lifted.saturated > 0.3) warnings.push(`lifted off ${texture.lift.view}, ${Math.round(lifted.saturated * 100)}% of whose texels are white in the view (a lamp, a bright light): their colour is not there to read. Lift it off a darker view of the same place (brightness: what it was drawn at, 0.5 or 1: frenzy's lamps came back within 2.5 to 9 of delta E so, against 28 to 46), or paint it`);
    return { width, height, rgb, facts, warnings };
  }
  const resolved = (given) => materialOf(typeof given === "string" && materials?.[given] !== undefined ? materials[given] : given);
  const material = resolved(texture.material ?? "plaster");
  const [width, height] = texture.size;
  const base = surfacePicture(material, width, height, { readPicture });
  if (base.rgba) return base; // a mesh: its holes are its picture
  const S = workshopSheet(width, height);
  const cell = { x: 0, y: 0, w: width, h: height };
  const at = (u, v) => {
    const i = (Math.min(height - 1, Math.floor(v)) * width + Math.min(width - 1, Math.floor(u))) * 3;
    return [base.rgb[i] / 255, base.rgb[i + 1] / 255, base.rgb[i + 2] / 255];
  };
  S.zone(cell, at, 0);
  // panels and words over the base, read back from the sheet so that later ones go over earlier ones
  const now = () => S.image();
  if (texture.panels?.length) {
    const was = now();
    const under = (u, v) => {
      const i = (Math.floor(v) * width + Math.floor(u)) * 3;
      return [was.rgb[i] / 255, was.rgb[i + 1] / 255, was.rgb[i + 2] / 255];
    };
    const panels = texture.panels.map((panel) => (panel.material ? { ...panel, material: resolved(panel.material) } : panel));
    paintPanels(S, cell, panels, material, 1, false, false, [width, height], { under });
  }
  for (const print of [texture.print ?? []].flat()) {
    const was = now();
    const under = (u, v) => {
      const i = (Math.floor(v) * width + Math.floor(u)) * 3;
      return [was.rgb[i] / 255, was.rgb[i + 1] / 255, was.rgb[i + 2] / 255];
    };
    paintWords(S, cell, print, material, 1, false, false, { under });
  }
  const image = now();
  if (texture.relief?.length) {
    const pictures = (material) => surfacePicture(resolved(material), width, height, { readPicture });
    relief(image, texture.relief, pictures);
  }
  // grime: darker toward the foot, broken up by noise that tiles across the sides
  if (texture.grime) {
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const low = (y / (height - 1)) ** 2;
        const n = fbm(Math.cos((2 * Math.PI * x) / width) * 3, Math.sin((2 * Math.PI * x) / width) * 3 + y * 0.08, 5, 3);
        const k = 1 - texture.grime * 0.55 * low * (0.4 + n);
        const i = (y * width + x) * 3;
        for (let c = 0; c < 3; c++) image.rgb[i + c] = Math.round(image.rgb[i + c] * Math.max(0, k));
      }
  }
  if (texture.wear) weather(image, texture.wear);
  return base.facts ? { ...image, facts: base.facts } : image;
}

const rgbaOf = (image) => {
  if (image.rgba) return image;
  const rgba = new Uint8Array(image.width * image.height * 4);
  for (let i = 0; i < image.width * image.height; i++) rgba.set([image.rgb[i * 3], image.rgb[i * 3 + 1], image.rgb[i * 3 + 2], 255], i * 4);
  return { width: image.width, height: image.height, rgba };
};

/** How large each texture is shown on the sheet: in a square this wide, enlarged by a whole number of times. */
const SHOWN = 256;
/** A picture enlarged by whole times (each texel a block, as the game draws it close) into a dark square. */
function fitted(image, side) {
  const k = Math.max(1, Math.floor(side / Math.max(image.width, image.height)));
  const out = new Uint8Array(side * side * 4);
  for (let i = 0; i < side * side; i++) out.set([34, 36, 40, 255], i * 4);
  const ox = Math.floor((side - image.width * k) / 2);
  const oy = Math.floor((side - image.height * k) / 2);
  for (let y = 0; y < Math.min(side, image.height * k); y++)
    for (let x = 0; x < Math.min(side, image.width * k); x++) {
      const i = (Math.floor(y / k) * image.width + Math.floor(x / k)) * 4;
      out.set(image.rgba.subarray(i, i + 4), ((oy + y) * side + ox + x) * 4);
    }
  return { width: side, height: side, rgba: out };
}

/** Builds a wad spec into `out`: the .wad and a sheet of its textures. */
export function buildWadSpec(spec, { out, folder = ".", readPicture, readFile } = {}) {
  const { errors, warnings } = validateWadSpec(spec);
  const report = { ok: false, errors, warnings, faults: [], notes: [], facts: [] };
  if (errors.length) return { report, files: {} };
  // a material's photograph, read once: from the spec's folder unless the build says how (the MCP's folders)
  const read = new Map();
  const readOnce = (name) => {
    if (!read.has(name)) read.set(name, (readPicture ?? ((file) => unpicture(readFileSync(resolve(folder, file.replace(/^(work|models):/, ""))))))(name));
    return read.get(name);
  };
  let textures;
  try {
    const maps = new Map();
    const readMap = (name) => {
      if (!maps.has(name)) maps.set(name, readBsp(readFile ? readFile(name) : readFileSync(resolve(folder, name.replace(/^(work|models):/, "")))));
      return maps.get(name);
    };
    // in order: a texture `from` another takes that one's picture, made above it
    textures = [];
    for (const texture of spec.textures) {
      const image = texture.from !== undefined ? fromTexture(texture, textures) : paintTexture(texture, spec.materials, readOnce, readMap, (name) => (readFile ? readFile(name) : readFileSync(resolve(folder, name.replace(/^(work|models):/, "")))).toString("utf8"));
      textures.push({ name: texture.name, image, lifted: Boolean(texture.lift) || Boolean(texture.from && textures.find((t) => t.name.toLowerCase() === (texture.from.texture ?? texture.from).toLowerCase())?.lifted) });
    }
  } catch (error) {
    errors.push(`textures: ${error.message}`);
    return { report, files: {} };
  }
  for (const t of textures) for (const fact of t.image.facts ?? []) report.facts.push(`${t.name}: ${fact}`);
  for (const t of textures) for (const line of t.image.warnings ?? []) warnings.push(`${t.name}: ${line}`);
  mkdirSync(out, { recursive: true });
  const wad = join(out, spec.name);
  writeFileSync(wad, writeWad(textures));
  const shown = tile(
    textures.map((t) => fitted(rgbaOf(t.image), SHOWN)),
    Math.min(6, textures.length),
    textures.map((t) => `${t.name} ${t.image.width}x${t.image.height}`),
  );
  const sheetFile = join(out, spec.name.replace(/\.wad$/i, "-textures.png"));
  writeFileSync(sheetFile, png(shown.width, shown.height, shown.rgba));
  report.facts.push(`${textures.length} textures: ${textures.map((t) => `${t.name} ${t.image.width}x${t.image.height}`).join(", ")}`);
  const given = spec.textures.map((texture) => {
    const named = texture.material ?? "plaster";
    return materialOf(typeof named === "string" && spec.materials?.[named] !== undefined ? spec.materials[named] : named);
  });
  // a photograph laid as it is (literal) is the person's picture, not a surface to hold to Valve's
  const looks = lookSentence(textures.map((t, i) => ({ ...t, base: given[i].base, filter: given[i].filter, allow: ALLOWED[given[i].base] })).filter((t) => !t.image.rgba && !UNWORN.has(t.base) && t.filter !== "literal" && !t.lifted));
  if (looks) warnings.push(looks);
  report.ok = true;
  return { report, files: { wad, sheet: sheetFile }, textures };
}
