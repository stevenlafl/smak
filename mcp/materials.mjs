// The MCP tool `materials`: a library of material photographs (generators/fetch-materials.mjs fills one: Poly
// Haven's CC0 textures), searched by words, and seen as a sheet of small pictures. A map's or a .wad's material
// takes one as its `picture: "library:<name>"`, with the library's real `size`, and the kit makes its texture from it
// (docs/SPEC.md, "A material from a photograph"). Offered only when the server is given --materials <folder>.
//
//   openMaterials(folder)          -> { folder, list: [{ name, title, categories, tags, size, licence }] }
//   materials(folders, args)       -> the tool's answer
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { unpicture, png } from "../src/image.mjs";
import { tile } from "../src/render.mjs";
import { text, image } from "./protocol.mjs";

const LISTED = 40;
const SHOWN = 12;
const THUMB = 192;

/** A material library: its folder and the index fetch-materials.mjs wrote. */
export function openMaterials(folder) {
  const file = join(folder, "materials.json");
  if (!existsSync(file)) throw new Error(`no materials.json in ${folder}: node generators/fetch-materials.mjs ${folder}`);
  return { folder: resolve(folder), list: JSON.parse(readFileSync(file, "utf8")) };
}

/** A picture brought into a square of `side`, whole, on grey. */
function square(picture, side) {
  const k = Math.min(side / picture.width, side / picture.height);
  const rgba = Buffer.alloc(side * side * 4);
  for (let i = 0; i < side * side; i++) rgba.set([58, 62, 70, 255], i * 4);
  const w = Math.round(picture.width * k);
  const h = Math.round(picture.height * k);
  const [x0, y0] = [Math.floor((side - w) / 2), Math.floor((side - h) / 2)];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const s = (Math.min(picture.height - 1, Math.floor(y / k)) * picture.width + Math.min(picture.width - 1, Math.floor(x / k))) * 4;
      rgba.set([picture.rgba[s], picture.rgba[s + 1], picture.rgba[s + 2], 255], ((y0 + y) * side + x0 + x) * 4);
    }
  return { width: side, height: side, rgba };
}

/** The library searched: every word of `match` in a material's name, title, categories or tags; `show`: their pictures. */
export function materials(folders, { match = "", category, show } = {}) {
  const library = folders.materials;
  if (!library) throw new Error("no material library: start the server with --materials <folder>");
  const words = match.toLowerCase().split(/[\s,]+/).filter(Boolean);
  const said = (m) => [m.name, m.title, ...m.categories, ...m.tags].join(" ").toLowerCase();
  const found = library.list.filter((m) => words.every((w) => said(m).includes(w)) && (!category || m.categories.some((c) => c.toLowerCase() === category.toLowerCase())));
  const lines = [
    `${found.length} of ${library.list.length} materials${words.length ? ` holding "${words.join(" ")}"` : ""}${category ? ` in ${category}` : ""} (all CC0)${found.length > LISTED ? `; the first ${LISTED}, narrow with more words` : ""}:`,
    ...found.slice(0, LISTED).map((m) => `library:${m.name}: ${m.title}; ${m.size ? `${m.size[0]} x ${m.size[1]} units across` : "size not given"}; ${m.categories.join(", ")}; ${m.tags.slice(0, 8).join(", ")}`),
    `A material takes one as { "base": "<the base nearest it>", "picture": "library:<name>", "size": <its width in units> } (guide { doc: "spec", find: "A material from a photograph" }); show: [names] draws them.`,
  ];
  if (!found.length && !show) {
    const categories = [...new Set(library.list.flatMap((m) => m.categories))].sort();
    lines.push(`The categories: ${categories.join(", ")}`);
  }
  const answer = [text(lines.join("\n"))];
  if (Array.isArray(show) && show.length) {
    const names = show.slice(0, SHOWN).map((n) => String(n).replace(/^library:/, ""));
    const pictures = names.map((n) => {
      const m = library.list.find((x) => x.name === n);
      if (!m) throw new Error(`no material ${n} in the library`);
      return square(unpicture(readFileSync(join(library.folder, m.file))), THUMB);
    });
    const sheet = tile(pictures, Math.min(4, pictures.length), names);
    answer.push(image(png(sheet.width, sheet.height, sheet.rgba)));
  }
  return answer;
}
