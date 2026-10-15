#!/usr/bin/env node
// Proof that no game file is committed: every file git tracks, held against every file of the game's folders.
//
//   node scripts/no-game-files.mjs [<game folder> ...]    (unless told: Half-Life's valve folder, and ts beside it)
//
// Three ways a game's file could come in, each checked:
//   1. the same bytes: a tracked file whose SHA-256 is a game file's
//   2. a game texture taken out as a picture: a tracked PNG or BMP whose pixels (as RGB) are a texture's of a
//      game .wad, a texture inside a game .mdl, or (at the same size) any of those cut to 256 colours
//   3. a game sound copied as samples: a tracked .wav whose samples, read as numbers, are a game sound's
// It prints what it found and exits 1 on any match. Nothing is written. The game's folders are only read.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readWad } from "../src/maps/wad.mjs";
import { readMdl, textureOf, withTextures } from "../src/mdl.mjs";
import { rgbaOf, unpicture } from "../src/image.mjs";
import { readWav } from "../src/audio/wav.mjs";

const KIT = resolve(fileURLToPath(import.meta.url), "../..");
const STEAM_HL = join(homedir(), ".steam/steam/steamapps/common/Half-Life");
const games = process.argv.slice(2).length ? process.argv.slice(2) : ["valve", "ts"].map((g) => join(STEAM_HL, g)).filter(existsSync);
if (!games.length) {
  console.error("no game folder: name one (node scripts/no-game-files.mjs <folder>)");
  process.exit(2);
}

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
/** A picture's pixels as RGB alone, with its size: the same for a PNG, a BMP or a texture of the same picture. */
const rgbKey = (width, height, rgba) => {
  const rgb = Buffer.alloc(width * height * 3);
  for (let i = 0; i < width * height; i++) rgba.copy?.(rgb, i * 3, i * 4, i * 4 + 3) ?? rgb.set(rgba.subarray(i * 4, i * 4 + 3), i * 3);
  return `${width}x${height}:${sha(rgb)}`;
};
const samplesKey = (x) => sha(Buffer.from(Float32Array.from(x, (v) => Math.round(v * 32767)).buffer));

function* filesUnder(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* filesUnder(p);
    else if (e.isFile()) yield p;
  }
}

// the game's files: their bytes, their textures' pixels and their sounds' samples, each by hash
const bytesOf = new Map();
const picturesOf = new Map();
const soundsOf = new Map();
let counted = { files: 0, textures: 0, sounds: 0 };
for (const game of games)
  for (const file of filesUnder(game)) {
    const ext = extname(file).toLowerCase();
    let bytes;
    try {
      bytes = readFileSync(file);
    } catch {
      continue;
    }
    counted.files++;
    bytesOf.set(sha(bytes), file);
    try {
      if (ext === ".wad")
        for (const t of readWad(bytes).textures) {
          picturesOf.set(rgbKey(t.width, t.height, Buffer.from(rgbaOf(t))), `${file} ${t.name}`);
          counted.textures++;
        }
      else if (ext === ".mdl" && !/t\.mdl$|\d\d\.mdl$/i.test(file)) {
        const t = existsSync(file.replace(/\.mdl$/i, "t.mdl")) ? withTextures(bytes, readFileSync(file.replace(/\.mdl$/i, "t.mdl"))) : bytes;
        const info = readMdl(t);
        for (let i = 0; i < info.textures.length; i++) {
          const tex = textureOf(t, i);
          if (!tex.pixels?.length) continue;
          picturesOf.set(rgbKey(tex.width, tex.height, Buffer.from(rgbaOf(tex))), `${file} ${tex.name}`);
          counted.textures++;
        }
      } else if (ext === ".wav") {
        soundsOf.set(samplesKey(readWav(bytes).x), file);
        counted.sounds++;
      }
    } catch {
      // a file the kit does not read (a Source model, a broken sound): its bytes are still held
    }
  }

// the kit's tracked files, each held against them
const tracked = execFileSync("git", ["-C", KIT, "ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
const found = [];
for (const name of tracked) {
  const path = join(KIT, name);
  if (!existsSync(path) || !statSync(path).isFile()) continue;
  const bytes = readFileSync(path);
  const same = bytesOf.get(sha(bytes));
  if (same) found.push(`${name}: the same bytes as ${same}`);
  const ext = extname(name).toLowerCase();
  try {
    if (ext === ".png" || ext === ".bmp") {
      const p = unpicture(bytes);
      const match = picturesOf.get(rgbKey(p.width, p.height, Buffer.from(p.rgba)));
      if (match) found.push(`${name}: the pixels of the game's texture ${match}`);
    } else if (ext === ".wav") {
      const match = soundsOf.get(samplesKey(readWav(bytes).x));
      if (match) found.push(`${name}: the samples of the game's sound ${match}`);
    }
  } catch {
    // not a picture or a sound the kit reads: its bytes were held above
  }
}
console.log(`${tracked.length} tracked files held against ${counted.files} files of ${games.join(", ")} (${counted.textures} textures, ${counted.sounds} sounds)`);
if (found.length) {
  console.log(`FOUND ${found.length}:\n${found.map((f) => `  ${f}`).join("\n")}`);
  process.exit(1);
}
console.log("none of them is a game file, a game texture's pixels or a game sound's samples");
