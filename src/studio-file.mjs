// A studio model read from the disk, with its textures when they are kept in the file beside it (`name`t.mdl):
// the one way every command, the MCP server, the viewer, the editor and the specs read a model.
//
//   readStudio(file, { read, exists })   -> { src, textures }: the model, and the textures file it took, or null
//   modelsIn(folder, { deep })           -> the models of a folder, but for the side files of another beside them
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { texturesInside, withTextures } from "./mdl.mjs";

/** `name`.mdl's textures file, `name`t.mdl. */
export const texturesFileOf = (file) => file.replace(/\.mdl$/i, "t.mdl");

/**
 * The model in `file`, with the textures of `name`t.mdl put inside it when it holds none of its own and that
 * file is there. `read` and `exists` stand in for the disk (a server's folders). Returns { src, textures }:
 * `textures` the file they came from, or null.
 */
export function readStudio(file, { read = readFileSync, exists = existsSync } = {}) {
  const src = read(file);
  const textures = texturesFileOf(file);
  if (texturesInside(src) || textures === file || !exists(textures)) return { src, textures: null };
  return { src: withTextures(src, read(textures)), textures };
}

/**
 * The models of a folder (and the folders under it, with `deep`), each a path, but for the side files of another
 * model beside them: <name>t.mdl (its textures) and <name>01.mdl (its animations), when <name>.mdl is there. A
 * model whose own name ends in t or in two digits (filecabinet.mdl, rocket.mdl) is a model.
 */
export function modelsIn(folder, { deep = false } = {}) {
  const entries = readdirSync(folder, { withFileTypes: true });
  const names = new Set(entries.filter((entry) => !entry.isDirectory()).map((entry) => entry.name.toLowerCase()));
  const isSideFile = (name) => {
    const parts = /^(.+?)(t|\d\d)\.mdl$/i.exec(name);
    return Boolean(parts) && names.has(`${parts[1].toLowerCase()}.mdl`);
  };
  return entries.flatMap((entry) => {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) return deep ? modelsIn(path, { deep }) : [];
    return /\.mdl$/i.test(entry.name) && !isSideFile(entry.name) ? [path] : [];
  });
}
