// The tool `file`: a file of the server's folders read back as what it is (words, a picture, a sound), or a text
// file written into the work folder. What a build, a command or a generator made is so seen and heard by a
// client with no shell, and a .map, a rules file or a list of steps written for a command to take.
import { readFileSync, writeFileSync, mkdirSync, statSync, copyFileSync } from "node:fs";
import { dirname, extname, basename } from "node:path";
import * as smak from "../src/index.mjs";
import { text, image, audio } from "./protocol.mjs";
import { pathOf } from "./folders.mjs";
import { pictureWithin, OUTPUT_MOST } from "./run.mjs";

/** Files read as words. */
const TEXT = /\.(map|json|txt|md|fgd|qc|rad|cfg|ini|log|csv|mjs|js|smd|mtl|obj|lst|rc)$/i;
/** Pictures: a PNG as it is, the others drawn into one. */
const PICTURE = /\.(png|bmp|jpe?g)$/i;
/** Sounds, with what the protocol calls them. */
const SOUND = { ".wav": "audio/wav", ".mp3": "audio/mpeg" };
/** The most characters a read gives at once: more is read by `from`. */
const READ_MOST = OUTPUT_MOST * 4;

/**
 * The tool. `name` alone: the file read back, by what it is (words from `from`, READ_MOST characters at a time;
 * a picture; a sound); `text`: written as the file's whole text, in the work folder only; `to`: copied to that
 * place of the work folder, as a mod lays its files out (a model built at the top into models/). A maker with no
 * way to copy put a model under models/ by retexturing it with its own picture (2026-10-17).
 */
export function file(folders, { name, text: words, from = 0, to }) {
  if (typeof to === "string") {
    if (typeof words === "string") throw new Error("file: text or to, not both");
    const source = pathOf(folders, name);
    const path = pathOf(folders, to.startsWith("work:") ? to : `work:${to}`, { write: true });
    if (source === path) throw new Error(`file: ${name} is already there`);
    mkdirSync(dirname(path), { recursive: true });
    copyFileSync(source, path);
    return [text(`copied: ${name} to ${to.replace(/^work:/, "")} (${statSync(path).size} bytes)`)];
  }
  if (typeof words === "string") {
    const path = pathOf(folders, name.startsWith("work:") ? name : `work:${name}`, { write: true });
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, words);
    return [text(`written: ${name.replace(/^work:/, "")} (${Buffer.byteLength(words)} bytes)`)];
  }
  const path = pathOf(folders, name);
  const ext = extname(path).toLowerCase();
  if (TEXT.test(path)) {
    const all = readFileSync(path, "utf8");
    const start = Math.max(0, Number(from) || 0);
    const part = all.slice(start, start + READ_MOST);
    const more = start + part.length < all.length ? `\n[characters ${start} to ${start + part.length} of ${all.length}: from ${start + part.length} reads on]` : "";
    return [text(`${basename(path)}:\n${part}${more}`)];
  }
  if (/\.png$/i.test(path)) return [image(pictureWithin(readFileSync(path)))];
  if (PICTURE.test(path)) {
    const picture = smak.unpicture(readFileSync(path));
    return [image(pictureWithin(smak.png(picture.width, picture.height, picture.rgba)))];
  }
  if (SOUND[ext]) return [text(`${basename(path)} (${statSync(path).size} bytes): the sound itself`), audio(readFileSync(path), SOUND[ext])];
  return [text(`${basename(path)}: ${statSync(path).size} bytes, not words, a picture or a sound: \`info\` tells what a .mdl, .bsp, .wad or .spr holds, \`render\` draws it`)];
}
