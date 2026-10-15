#!/usr/bin/env node
// A library of material photographs for the `picture` of a map's or a .wad's materials: every texture Poly Haven
// gives away (CC0: no rights reserved), its diffuse map at 1k, with an index of what each is and how large it is in
// the world. The MCP server offers it with --materials <folder> (the tool `materials`, and `picture:
// "library:<name>"`): a maker with no web access then has real surfaces to make a game's textures from.
//
//   node generators/fetch-materials.mjs <folder> [--res 1k|2k] [--only name,name]
//
// Idempotent: a file already there at the size Poly Haven lists is kept. Writes <folder>/<name>.jpg and
// <folder>/materials.json: [{ name, title, categories, tags, size: [width, height] in game units (25.4 mm a
// unit), file, source, licence }]. About 600 MB at 1k. Undo: delete the folder.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const folder = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--res" && args[args.indexOf(a) - 1] !== "--only");
if (!folder) {
  console.error("node generators/fetch-materials.mjs <folder> [--res 1k|2k] [--only name,name]");
  process.exit(2);
}
const res = args.includes("--res") ? args[args.indexOf("--res") + 1] : "1k";
const only = args.includes("--only") ? new Set(args[args.indexOf("--only") + 1].split(",")) : null;
const AGENT = { "User-Agent": "smak-material-library" };
const UNIT_MM = 25.4;

const out = resolve(folder);
mkdirSync(out, { recursive: true });
const assets = await (await fetch("https://api.polyhaven.com/assets?t=textures", { headers: AGENT })).json();
const names = Object.keys(assets).filter((n) => !only || only.has(n)).sort();
const index = [];
let fetched = 0;
let kept = 0;
let failed = 0;

async function one(name) {
  const a = assets[name];
  const files = await (await fetch(`https://api.polyhaven.com/files/${name}`, { headers: AGENT })).json();
  const file = files.Diffuse?.[res]?.jpg;
  if (!file) return;
  const path = join(out, `${name}.jpg`);
  if (existsSync(path) && statSync(path).size === file.size) kept++;
  else {
    const bytes = Buffer.from(await (await fetch(file.url, { headers: AGENT })).arrayBuffer());
    if (file.md5 && createHash("md5").update(bytes).digest("hex") !== file.md5) {
      failed++;
      console.error(`${name}: its checksum does not match; left out`);
      return;
    }
    writeFileSync(path, bytes);
    fetched++;
  }
  const [w, h] = a.dimensions ?? [];
  index.push({
    name,
    title: a.name,
    categories: a.categories ?? [],
    tags: a.tags ?? [],
    size: w && h ? [Math.round(w / UNIT_MM), Math.round(h / UNIT_MM)] : null,
    file: `${name}.jpg`,
    source: `https://polyhaven.com/a/${name}`,
    licence: "CC0",
  });
}

// a few at a time
const queue = [...names];
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const name = queue.shift();
      try {
        await one(name);
      } catch (error) {
        failed++;
        console.error(`${name}: ${error.message}`);
      }
    }
  }),
);
index.sort((a, b) => a.name.localeCompare(b.name));
const old = existsSync(join(out, "materials.json")) && only ? JSON.parse(readFileSync(join(out, "materials.json"), "utf8")).filter((m) => !only.has(m.name)) : [];
writeFileSync(join(out, "materials.json"), `${JSON.stringify([...old, ...index].sort((a, b) => a.name.localeCompare(b.name)), null, 1)}\n`);
console.log(`${index.length} materials in ${out}: ${fetched} fetched, ${kept} already there, ${failed} failed`);
