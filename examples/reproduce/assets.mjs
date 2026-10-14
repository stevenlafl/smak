// The reproduction test for a mod's other assets (rubric.md, "Textures, sounds and sprites"): Valve's sprites
// reproduced, and Valve's sounds and the textures of a map replaced under their own names, each from pictures
// or from words, by a fresh agent with only the MCP server and no game folder; then judged by another fresh
// agent from the harness's pictures and measurements. Decoys (a plain square, a hiss, flat colours) must fail.
//
//   node examples/reproduce/assets.mjs inputs|describe|reproduce|judge [sprites|sounds|textures] [subject ...] [--again]
//
// Each subject's folder under assets/<kind>/<id>/: input/ (the pictures: Valve's, kept out of git), words.md,
// <leg>/ (spec.json, answer.md, run.json, built/ out of git), <leg>/judge.json. assets/scores.md: every result.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, copyFileSync, rmSync, mkdtempSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { HERE, KIT, GAME, savePng, besides } from "./lib.mjs";
import { runAgent } from "./agents.mjs";
import * as smak from "../../src/index.mjs";
import { tile } from "../../src/render.mjs";
import { sheetOf } from "../../src/sprite/draw.mjs";
import { measureSprite } from "../../src/sprite/measure.mjs";
import { toLab } from "../../src/spec/colours.mjs";
import { writeSpr } from "../../src/sprite/spr.mjs";

const { maps, audio: A } = smak;
const ROOT = join(HERE, "assets");
const RUBRIC = readFileSync(join(HERE, "rubric.md"), "utf8");
const words = process.argv.slice(2);
const step = words.shift();
const again = words.includes("--again") && words.splice(words.indexOf("--again"), 1);
const KINDS = ["sprites", "sounds", "textures"];
const kinds = KINDS.filter((k) => !words.some((w) => KINDS.includes(w)) || words.includes(k));
const named = words.filter((w) => !KINDS.includes(w));
const LEGS = ["pictures", "words"];

const SOUND_CLASS = { "weapons/cbar_hit1": "metal hit", "weapons/357_shot1": "gunshot", "weapons/sbarrel1": "gunshot", "player/pl_step1": "step concrete", "player/pl_metal1": "step metal", "weapons/explode3": "explosion", "ambience/drips": "loop drips" };
const SUBJECTS = {
  sprites: ["glow01", "flare1", "fire", "zerogxplode", "steam1", "xspark1", "laserbeam", "muzzleflash1"].map((id) => ({ id, file: `sprites/${id}.spr` })),
  // a class of src/audio/classes.mjs where the sound is of one, for its envelope's range (S2)
  sounds: ["weapons/cbar_hit1", "weapons/357_shot1", "weapons/sbarrel1", "player/pl_step1", "player/pl_metal1", "doors/doormove1", "items/smallmedkit1", "debris/bustmetal1", "weapons/explode3", "ambience/drips"].map((n) => ({ id: n.replace("/", "-"), file: `sound/${n}.wav`, name: `${n}.wav`, class: SOUND_CLASS[n] })),
  textures: [{ id: "frenzy", file: "maps/frenzy.bsp" }],
};
const chosen = (kind) => SUBJECTS[kind].filter((s) => !named.length || named.includes(s.id));
const folderOf = (kind, id) => join(ROOT, kind, id);
const round = (v, k = 1) => Math.round(v * 10 ** k) / 10 ** k;
const png = (picture) => smak.png(picture.width, picture.height, picture.rgba);

// ── what the game has ─────────────────────────────────────────────────────

/** The mean light (0 to 255) of a face's lightmap under which it counts as unlit: black in any picture. */
const LIT_LEAST = 12;

/** A texture's largest lit face of the world (its largest when none is lit), and a camera square in front of it. */
export function texturePlaces(bsp) {
  const best = new Map();
  const world = bsp.models[0];
  for (let f = world.firstFace; f < world.firstFace + world.faceCount; f++) {
    const tex = maps.faceTexture(bsp, f);
    if (/^(aaatrigger|sky|clip|null|origin|hint|skip)$/i.test(tex.name)) continue;
    const corners = maps.facePolygon(bsp, f);
    let a = [0, 0, 0];
    for (let i = 1; i + 1 < corners.length; i++) {
      const u = corners[i].map((v, k) => v - corners[0][k]);
      const w = corners[i + 1].map((v, k) => v - corners[0][k]);
      a = a.map((s, k) => s + [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]][k] / 2);
    }
    const area = Math.hypot(...a);
    // a face the map leaves unlit is black in either picture: one that is lit stands before any that is not
    const light = maps.faceLightmap(bsp, f)?.styles.find((st) => st.style === 0)?.rgb;
    let lum = 0;
    if (light) for (let i = 0; i < light.length; i += 3) lum += (light[i] + light[i + 1] + light[i + 2]) / 3;
    const lit = light && lum / (light.length / 3) >= LIT_LEAST;
    const rank = area * (lit ? 1 : 1e-6);
    if (rank > (best.get(tex.name)?.rank ?? 0)) best.set(tex.name, { area, rank, lit: Boolean(lit), corners, normal: maps.faceNormal(bsp, f), texture: tex });
  }
  return [...best.values()].map(({ corners, normal, texture, area, lit }) => {
    const mid = corners.reduce((s, c) => s.map((v, k) => v + c[k] / corners.length), [0, 0, 0]);
    const span = Math.sqrt(area);
    const dist = Math.min(160, Math.max(40, span * 0.8));
    const from = mid.map((v, k) => v + normal[k] * dist);
    const yaw = (Math.atan2(-normal[1], -normal[0]) * 180) / Math.PI;
    const pitch = (Math.asin(Math.max(-1, Math.min(1, -normal[2]))) * 180) / Math.PI;
    return { name: texture.name, width: texture.width, height: texture.height, from, yaw, pitch, area, lit };
  });
}

/** A wad texture as a picture: its palette's colours, a `{` texture's holes shown in a pale grey. */
function flatOf(t) {
  const rgba = new Uint8Array(t.width * t.height * 4);
  const holes = t.name.startsWith("{");
  for (let i = 0; i < t.width * t.height; i++) {
    const c = t.pixels[i];
    const hole = holes && c === 255;
    rgba.set(hole ? [200, 200, 200, 255] : [t.palette[c * 3], t.palette[c * 3 + 1], t.palette[c * 3 + 2], 255], i * 4);
  }
  return { width: t.width, height: t.height, rgba };
}

/** A picture scaled by whole steps (nearest) to fit a square of `cell`, so that texels stay sharp. */
function scaled(picture, cell = 256) {
  const k = Math.max(1, Math.floor(cell / Math.max(picture.width, picture.height)));
  const width = picture.width * k;
  const height = picture.height * k;
  const rgba = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) rgba.set(picture.rgba.subarray(((((y / k) | 0) * picture.width) + ((x / k) | 0)) * 4, ((((y / k) | 0) * picture.width) + ((x / k) | 0)) * 4 + 4), (y * width + x) * 4);
  return { width, height, rgba };
}

/** A picture in the top left of a canvas of a fixed size, so that every cell of a sheet is the same. */
function onCanvas(picture, width, height) {
  const rgba = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) rgba.set([24, 26, 30, 255], i * 4);
  for (let y = 0; y < Math.min(height, picture.height); y++)
    rgba.set(picture.rgba.subarray(y * picture.width * 4, y * picture.width * 4 + Math.min(width, picture.width) * 4), y * width * 4);
  return { width, height, rgba };
}

/** The game's own textures of a map, by name in small letters, from the .wad files its worldspawn names. */
function gameTextures(bsp) {
  const ws = maps.entitiesOf(bsp).find((e) => e.classname === "worldspawn")?.pairs ?? [];
  const named = (ws.find(([k]) => k === "wad")?.[1] ?? "").split(";").map((w) => basename(w.replace(/\\/g, "/"))).filter(Boolean);
  const found = new Map();
  for (const wad of [...named, "halflife.wad"]) {
    const file = join(GAME, wad);
    if (!existsSync(file)) continue;
    for (const t of maps.readWad(readFileSync(file)).textures) if (!found.has(t.name.toLowerCase())) found.set(t.name.toLowerCase(), t);
  }
  return found;
}

/** The names that go with a map's texture: its animation's frames (+0name..+9name, +Aname..) and random tiles (-0name..). */
function siblingsOf(name, known) {
  const m = name.match(/^([+-])[0-9a-j](.+)$/i);
  if (!m) return [name];
  const rest = m[2].toLowerCase();
  return [...known.keys()].filter((k) => k.length === name.length && /^[+-][0-9a-j]/i.test(k) && k[0] === m[1] && k.slice(2) === rest).sort();
}

/** A view of a texture's place in the map: from its camera, wearing `textures` (a .wad's) or the game's. */
function placeView(bsp, place, textures) {
  // three times as bright as the map has it: many of its walls are in its dark, and the texture must show
  return maps.drawMap(bsp, { from: place.from, yaw: place.yaw, pitch: place.pitch, fov: 70, width: 320, height: 240, folders: textures ? [] : [GAME], textures, entities: "none", labels: false, brightness: 4.5 });
}

// ── inputs ────────────────────────────────────────────────────────────────

function inputs(kind, subject) {
  const out = join(folderOf(kind, subject.id), "input");
  mkdirSync(out, { recursive: true });
  const file = join(GAME, subject.file);
  if (kind === "sprites") {
    const spr = maps.readSpr(readFileSync(file));
    savePng(join(out, "frames.png"), sheetOf(spr, { cols: 8, cell: 128 }));
    writeFileSync(join(out, "facts.txt"), `${spr.width}x${spr.height}, ${spr.frames.length} frame${spr.frames.length === 1 ? "" : "s"}, type ${spr.type}, format ${spr.format}.\n`);
  } else if (kind === "sounds") {
    const wav = A.readWav(readFileSync(file));
    savePng(join(out, "sound.png"), A.soundPicture([{ name: subject.name, x: wav.x, rate: wav.rate, loop: wav.cue?.length ? wav.cue[0] : undefined }], { width: 960 }));
    writeFileSync(join(out, "facts.txt"), `${subject.name}: ${round(wav.x.length / wav.rate, 2)} s, ${wav.rate} Hz, ${wav.bits} bits${wav.cue?.length ? ", looped (a cue point at its start)" : ", played once"}.\n`);
  } else {
    const bsp = maps.readBsp(readFileSync(file));
    const places = texturePlaces(bsp).sort((a, b) => b.area - a.area);
    for (const p of places) savePng(join(out, `${p.name.replace(/[^\w~+{!-]/g, "_")}.png`), placeView(bsp, p));
    savePng(join(out, "views.png"), maps.viewsOf(bsp, { count: 8, folders: [GAME], entities: "none", labels: false, width: 320, height: 240 }));
    writeFileSync(join(out, "list.txt"), `${places.map((p) => `${p.name} ${p.width}x${p.height} (${p.name.replace(/[^\w~+{!-]/g, "_")}.png)`).join("\n")}\n`);
  }
  return out;
}

// ── the agents ────────────────────────────────────────────────────────────

const DESCRIBE = {
  sprites: (dir) => `You are looking at the frames of one sprite of a video game (a flat picture the game turns to face the eye: a glow, a flame, smoke, an explosion, sparks, a beam), in ${dir}/frames.png, each frame as the engine blends it (an additive sprite over a dark ground, others over grey), numbered in order; its size, frame count, type and format are in ${dir}/facts.txt. Someone who will never see them must make it again from your words: describe what it is, its shape and size within the frame, its colours, how it changes from frame to frame (grows, rises, flickers, fades, loops or plays once) and anything special. At most 250 words.`,
  sounds: (dir) => `You are looking at a picture of one sound of a video game, in ${dir}/sound.png: its waveform over its spectrogram (log frequency, 50 Hz at the bottom), with its name and length; its facts are in ${dir}/facts.txt. Someone who will never hear it must make it again from your words: describe what event it is (from its name and its shape), its length, how it starts and dies, its loudness over time, where its energy is in frequency, its hits or clicks, whether it is tonal or noisy, any pitch movement, and whether it loops. At most 250 words.`,
  textures: (dir) => `You are looking at the textures of one map (a level) of a video game, each seen on its wall in the map, lit: one picture a texture in ${dir} (named after it), and eight views of the map in ${dir}/views.png. ${dir}/list.txt gives each texture's name, size and picture. Someone who will never see them must make every texture again from your words, at its size: for each, what it is (concrete, metal panel, grate, floor tiles, a light's face), its colours, its pattern and how large its panels, seams or tiles are against its size, its wear and dirt, and anything special (holes, glow, an animation's frames). Go texture by texture, by name. At most 1800 words.`,
};
const RULES = `Do not name the game, the file's origin, the series or the company. Reply with the description alone, plain text.`;

function reproducePrompt(kind, subject, leg, given) {
  const judged = "It will be judged side by side with the original, to high standards, by someone who sees only the two drawn and measured.";
  if (kind === "sprites")
    return `Make this sprite for the GoldSrc engine with a smak.sprite/1 spec (guide { doc: "spec" }, "A sprite"), named ${subject.file}, as close to the original as you can: what it is, its shape and size in its frames, its colours, its frames and how it moves, its type and format. ${judged} Build until the build says OK.\n\n${given}`;
  if (kind === "sounds")
    return `Make this sound for the GoldSrc engine with a smak.sound/1 spec (guide { doc: "spec" }, "A sound"), named ${subject.name} so the game plays it in the original's place, as close to the original as you can, and at least as good: the same event, length, envelope, spectrum and character. ${judged} Build until the build says OK.\n\n${given}`;
  return `Make every texture of this map again for the GoldSrc engine, in one smak.wad/1 spec (guide { doc: "spec" }, "Textures for maps") named frenzy_new.wad, each under the original's exact name and size, so the map wears ours in their place, as close to the originals as you can and at least as good: what each is, its colours, its pattern and scale, tiling without a seam, its kind kept (a { texture's holes, a +0 animation's frames, a light's face). The compiled map is models:frenzy.bsp: give the spec preview: { map: "models:frenzy.bsp" } to see the map wearing yours (the game's own textures are not here). ${judged} Build until the build says OK.\n\n${given}`;
}

async function describe(kind, subject) {
  const dir = join(folderOf(kind, subject.id), "input");
  const r = await runAgent({ prompt: `${DESCRIBE[kind](dir)}\n${RULES}`, read: dir, hours: 0.5 });
  writeFileSync(join(folderOf(kind, subject.id), "words.md"), `${r.answer.trim()}\n`);
  return `${kind}/${subject.id}: ${r.answer.split(/\s+/).length} words`;
}

async function reproduce(kind, subject, leg) {
  const base = folderOf(kind, subject.id);
  const out = join(base, leg);
  if (existsSync(join(out, "run.json")) && !again) return `${kind}/${subject.id}:${leg}: done before`;
  const input = join(base, "input");
  const files = {};
  let given;
  if (leg === "pictures") {
    for (const f of readdirSync(input)) files[`pictures/${f}`] = join(input, f);
    given = `The original, in pictures: every file of ${input} (also in the server's work folder under pictures/). ${readdirSync(input).filter((f) => f.endsWith(".txt")).map((f) => readFileSync(join(input, f), "utf8")).join("\n")}`;
  } else given = `The original, as someone who has seen it describes it:\n\n${readFileSync(join(base, "words.md"), "utf8")}${kind !== "textures" ? `\nIts facts: ${readFileSync(join(input, "facts.txt"), "utf8")}` : ""}${kind === "textures" ? `\nThe textures, each name and size:\n${readFileSync(join(input, "list.txt"), "utf8").replace(/ \(.*\)/g, "")}` : ""}`;
  // the map, for a textures leg: alone in the server's models folder, with no game folder for its textures
  let models = null;
  if (kind === "textures") {
    models = mkdtempSync(join(tmpdir(), "smak-assets-map-"));
    copyFileSync(join(GAME, subject.file), join(models, basename(subject.file)));
  }
  const kit = execFileSync("git", ["-C", HERE, "rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
  const r = await runAgent({ prompt: reproducePrompt(kind, subject, leg, given), read: leg === "pictures" ? input : null, server: { wads: false, models }, files, hours: kind === "textures" ? 2 : 1 });
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "answer.md"), `${r.answer.trim()}\n`);
  const all = [];
  const look = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) look(p);
      else all.push({ p, name: e.name, at: statSync(p).mtimeMs });
    }
  };
  look(r.work);
  const newest = (test) => all.filter((f) => test(f.name, f.p)).sort((a, b) => b.at - a.at)[0];
  const spec = newest((n) => n.endsWith(".spec.json"));
  if (spec) writeFileSync(join(out, "spec.json"), readFileSync(spec.p));
  const built = join(out, "built");
  rmSync(built, { recursive: true, force: true });
  mkdirSync(built, { recursive: true });
  const ext = kind === "sprites" ? ".spr" : kind === "sounds" ? ".wav" : ".wad";
  const want = kind === "textures" ? "frenzy_new.wad" : basename(subject.file);
  const found = newest((n) => n === want) ?? newest((n) => n.endsWith(ext));
  if (found) copyFileSync(found.p, join(built, basename(want)));
  writeFileSync(join(out, "run.json"), `${JSON.stringify({ kit, seconds: r.seconds, turns: r.turns, cost: r.cost, error: r.error, built: found?.name ?? null }, null, 1)}\n`);
  return `${kind}/${subject.id}:${leg}: ${r.seconds} s, built ${found?.name ?? "nothing"}`;
}

// ── measuring ─────────────────────────────────────────────────────────────

/** Mean colour (Lab) of a picture's dots that differ from its ground. */
function meanLab(picture, ground) {
  let s = [0, 0, 0];
  let n = 0;
  for (let i = 0; i < picture.rgba.length; i += 4) {
    const c = [picture.rgba[i], picture.rgba[i + 1], picture.rgba[i + 2]];
    if (ground && c.every((v, k) => Math.abs(v - ground[k]) < 4)) continue;
    const lab = toLab(c.map((v) => v / 255));
    s = s.map((v, k) => v + lab[k]);
    n++;
  }
  return n ? s.map((v) => v / n) : null;
}
const deltaE = (a, b) => (a && b ? round(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])) : null);
const band = (v, two, one, lowerBetter = true) => (v === null || v === undefined ? 0 : lowerBetter ? (v <= two ? 2 : v <= one ? 1 : 0) : v >= two ? 2 : v >= one ? 1 : 0);

export function measureSpriteCopy(original, copy, dir) {
  const o = maps.readSpr(original);
  const c = maps.readSpr(copy);
  const so = sheetOf(o, { cols: 8, cell: 128 });
  const sc = sheetOf(c, { cols: 8, cell: 128 });
  savePng(join(dir, "original.png"), so);
  savePng(join(dir, "reproduction.png"), sc);
  const ground = o.format === "additive" ? [20, 22, 26] : [110, 112, 116];
  const mo = measureSprite(o, { loop: o.frames.length > 2 });
  const mc = measureSprite(c, { loop: c.frames.length > 2 });
  const colour = deltaE(meanLab(so, ground), meanLab(sc, ground));
  const frameShare = Math.abs(c.frames.length - o.frames.length) / o.frames.length;
  const measured = {
    original: { size: [o.width, o.height], frames: o.frames.length, type: o.type, format: o.format, measures: mo },
    reproduction: { size: [c.width, c.height], frames: c.frames.length, type: c.type, format: c.format, measures: mc },
    meanColourDeltaE: colour,
  };
  const caps = { R2: o.width === c.width && o.height === c.height ? 2 : 1, R3: band(colour, 15, 25), R4: band(frameShare, 0.25, 0.5), R5: o.type === c.type && o.format === c.format ? 2 : 0 };
  return { measured, caps, pictures: `${dir}/original.png (the original's frames as the engine blends them, numbered) and ${dir}/reproduction.png (the reproduction's, the same way)` };
}

export function measureSoundCopy(original, copy, dir, subject) {
  const o = A.readWav(original);
  const c = A.readWav(copy);
  savePng(join(dir, "sounds.png"), A.soundPicture([{ name: `ORIGINAL ${subject.name}`, x: o.x, rate: o.rate, loop: o.cue?.length ? 0 : undefined }, { name: "REPRODUCTION", x: c.x, rate: c.rate, loop: c.cue?.length ? 0 : undefined }], { width: 960 }));
  const fo = A.features(o);
  const fc = A.features(c);
  const checks = A.checks(c, { loop: Boolean(o.cue?.length) });
  const lengthShare = Math.abs(fc.length - fo.length) / fo.length;
  const centroidShare = Math.abs(fc.centroid - fo.centroid) / fo.centroid;
  const bandsOff = Math.max(...Object.keys(fo.bands).map((k) => Math.abs(fc.bands[k] - fo.bands[k])));
  // the envelope's range: the class's where the sound is of one, else the original's own decay within a quarter
  // (or 0.05 s); a loop has no decay to hold to
  const loop = Boolean(o.cue?.length);
  const t20Range = loop ? null : subject.class ? A.rangesOf(subject.class).t20 : [fo.t20 - Math.max(0.05, fo.t20 * 0.25), fo.t20 + Math.max(0.05, fo.t20 * 0.25)];
  const t20In = !t20Range || (fc.t20 >= t20Range[0] && fc.t20 <= t20Range[1]);
  const measured = { original: fo, reproduction: fc, envelope: { class: subject.class ?? "none: the original's own decay", t20Range: t20Range && t20Range.map((v) => round(v, 3)), t20: round(fc.t20, 3), inRange: t20In }, lengthOff: round(lengthShare, 3), centroidOff: round(centroidShare, 3), bandsOffMost: round(bandsOff), engineFaults: checks.faults, sameName: true, format: { rate: c.rate, bits: c.bits, channels: c.channels } };
  const caps = { S2: Math.min(band(lengthShare, 0.25, 0.5), t20In ? 2 : 1), S3: Math.min(band(centroidShare, 0.2, 0.4), band(bandsOff, 10, 20)), S5: checks.faults.length ? 0 : 2 };
  return { measured, caps, pictures: `${dir}/sounds.png (the original's waveform over its spectrogram above, the reproduction's below, at one time scale)` };
}

export function measureTexturesCopy(originalBsp, wadBytes, dir) {
  const bsp = maps.readBsp(originalBsp);
  const wad = maps.readWad(wadBytes);
  const mine = new Map(wad.textures.map((t) => [t.name.toLowerCase(), t]));
  const places = texturePlaces(bsp).sort((a, b) => b.area - a.area);
  const rows = [];
  const pairs = [];
  for (const p of places) {
    const t = mine.get(p.name.toLowerCase());
    const a = placeView(bsp, p);
    const b = placeView(bsp, p, wad.textures);
    pairs.push(besides([a, b]));
    const kindKept = Boolean(t) && t.width === p.width && t.height === p.height;
    rows.push({ name: p.name, size: [p.width, p.height], present: Boolean(t), sizeKept: kindKept, deltaE: deltaE(meanLab(a), meanLab(b)) });
  }
  // sheets of pairs, eight textures a sheet
  for (let i = 0; i < pairs.length; i += 8)
    savePng(join(dir, `textures-${i / 8 + 1}.png`), tile(pairs.slice(i, i + 8), 2, places.slice(i, i + 8).map((p) => `${p.name}: ORIGINAL | REPLACEMENT`)));
  // each texture flat, on its own, at whole-number scale: the original's beside the replacement's, with the
  // frames of an animation and the tiles of a random set beside the one the map names (T6)
  const game = gameTextures(bsp);
  const flats = [];
  const shown = new Set();
  for (const p of places)
    for (const name of siblingsOf(p.name, game)) {
      if (shown.has(name.toLowerCase())) continue;
      shown.add(name.toLowerCase());
      const o = game.get(name.toLowerCase());
      const r = mine.get(name.toLowerCase());
      const blank = (w, h) => ({ width: w, height: h, rgba: new Uint8Array(w * h * 4).fill(40) });
      flats.push({ name, pair: besides([onCanvas(scaled(o ? flatOf(o) : blank(p.width, p.height)), 256, 256), onCanvas(scaled(r ? flatOf(r) : blank(p.width, p.height)), 256, 256)]) });
    }
  // T2 by the texture itself too: a face lit by a coloured light (a blue lamp on a wall) hides its colour in
  // the view, so the larger of the two differences is the measure (rubric amendment of 2026-10-14)
  for (const row of rows) {
    const o = game.get(row.name.toLowerCase());
    const r = mine.get(row.name.toLowerCase());
    row.flatDeltaE = o && r ? deltaE(meanLab(flatOf(o), null), meanLab(flatOf(r), null)) : null;
  }
  for (let i = 0; i < flats.length; i += 8)
    savePng(join(dir, `flat-${i / 8 + 1}.png`), tile(flats.slice(i, i + 8).map((f) => f.pair), 2, flats.slice(i, i + 8).map((f) => `${f.name}: ORIGINAL | REPLACEMENT (flat)`)));
  const views = maps.viewsOf(bsp, { count: 6, folders: [GAME], entities: "none", labels: false, width: 320, height: 240 });
  const viewsMine = maps.viewsOf(bsp, { count: 6, textures: wad.textures, entities: "none", labels: false, width: 320, height: 240 });
  savePng(join(dir, "views.png"), tile([views, viewsMine], 1, ["ORIGINAL", "REPLACEMENT"]));
  const flatSheets = Math.ceil(flats.length / 8);
  return { rows, sheets: Math.ceil(pairs.length / 8), pictures: `${dir}/textures-1.png ... textures-${Math.ceil(pairs.length / 8)}.png (each texture on its wall, the ORIGINAL on the left and the REPLACEMENT on the right, the same camera and light), ${dir}/flat-1.png ... flat-${flatSheets}.png (each texture flat on its own at a whole-number scale, ORIGINAL left and REPLACEMENT right, with an animation's frames and a random set's tiles each shown; a hole of a { texture in pale grey; a dark square where one has none) and ${dir}/views.png (views of the map wearing the originals above and the replacements below)` };
}

// ── the judge ─────────────────────────────────────────────────────────────

const ITEMS = { sprites: ["R1", "R2", "R3", "R4", "R5"], sounds: ["S1", "S2", "S3", "S4", "S5"], textures: ["T1", "T2", "T3", "T4", "T5", "T6"] };
const MUST = { sprites: ["R1", "R2", "R3", "R4", "R5"], sounds: ["S1", "S2", "S3", "S5"], textures: ["T1", "T2", "T3", "T5", "T6"] };
const TITLE = { sprites: "Sprites (each sprite)", sounds: "Sounds (each sound)", textures: "Textures (each texture)" };

function settle(kind, judged, caps) {
  const items = ITEMS[kind];
  const scores = {};
  for (const item of items) {
    const given = Math.max(0, Math.min(2, Number(judged?.[item]?.score ?? 0)));
    scores[item] = { judge: given, cap: caps[item] ?? null, score: Math.min(given, caps[item] ?? 2), reason: judged?.[item]?.reason ?? "" };
  }
  const total = items.reduce((s, i) => s + scores[i].score, 0);
  return { scores, total, of: 2 * items.length, passes: MUST[kind].every((i) => scores[i].score === 2) && total >= 0.85 * 2 * items.length };
}

const parse = (answer) => {
  try {
    return JSON.parse(answer.slice(answer.indexOf("{"), answer.lastIndexOf("}") + 1));
  } catch {
    return null;
  }
};

async function judgeOne(kind, subject, leg, copyFile, { decoy } = {}) {
  const dir = join(folderOf(kind, subject.id), "judge", decoy ? `decoy-${decoy}` : leg);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const original = readFileSync(join(GAME, subject.file));
  const copy = readFileSync(copyFile);
  const items = ITEMS[kind];
  const head = `You are an independent judge. A ${kind === "textures" ? "set of replacement textures" : kind === "sounds" ? "replacement sound" : "reproduction of a sprite"} was made of a game's own by someone who could not open the original's files. Judge it strictly by the rubric below (the "${TITLE[kind]}" table, and "Passing" and "Keeping the judge honest"). A measured item may score lower than its measurement allows, never higher.`;
  if (kind === "textures") {
    const m = measureTexturesCopy(original, copy, dir);
    const r = await runAgent({
      read: dir,
      hours: 1,
      prompt: `${head}\n\nThe pictures: ${m.pictures}. Look at every picture closely.\n\nThe measurements, texture by texture (deltaE: the mean colour of its view, original against replacement; flatDeltaE: the same of the textures themselves, flat; present and sizeKept: the replacement has the name and its size):\n${JSON.stringify(m.rows)}\n\nScore EVERY texture, items ${items.join(", ")}, 0, 1 or 2 each with a reason. Reply with JSON alone: { "<texture name>": { ${items.map((i) => `"${i}": { "score": 0, "reason": "..." }`).join(", ")} }, ... }\n\nTHE RUBRIC\n${RUBRIC}`,
    });
    const judged = parse(r.answer) ?? {};
    const results = m.rows.map((row) => {
      const caps = { T2: band(Math.max(row.deltaE ?? 0, row.flatDeltaE ?? 0), 15, 25), T6: row.sizeKept ? 2 : 0 };
      return { texture: row.name, measured: row, caps, ...settle(kind, judged[row.name], caps) };
    });
    const passed = results.filter((x) => x.passes).length;
    return { kind, subject: subject.id, leg: decoy ? `decoy: ${decoy}` : leg, textures: results, passed, of: results.length, passes: passed >= 0.8 * results.length, total: passed, error: Object.keys(judged).length ? undefined : "the judge's answer was not JSON" };
  }
  const m = kind === "sprites" ? measureSpriteCopy(original, copy, dir) : measureSoundCopy(original, copy, dir, subject);
  const r = await runAgent({
    read: dir,
    hours: 0.5,
    prompt: `${head}\n\nThe pictures: ${m.pictures}. Look closely.\n\nThe measurements:\n${JSON.stringify(m.measured, null, 1)}\n\n${kind === "sounds" ? "You cannot listen: judge S1 and S4 from the pictures and features, and say so in their reasons.\n\n" : ""}Score every item, ${items.join(", ")}, 0, 1 or 2, each with a reason. Reply with JSON alone: {${items.map((i) => `"${i}": { "score": 0, "reason": "..." }`).join(", ")}}\n\nTHE RUBRIC\n${RUBRIC}`,
  });
  const judged = parse(r.answer);
  if (!judged) return { kind, subject: subject.id, leg, error: "the judge's answer was not JSON", answer: r.answer };
  return { kind, subject: subject.id, leg: decoy ? `decoy: ${decoy}` : leg, measured: m.measured, caps: m.caps, ...settle(kind, judged, m.caps) };
}

/** The decoys: a plain square sprite of the original's size, a hiss of the original's length, flat textures. */
function decoyOf(kind, subject) {
  const dir = join(folderOf(kind, subject.id), "judge");
  mkdirSync(dir, { recursive: true });
  const original = readFileSync(join(GAME, subject.file));
  if (kind === "sprites") {
    const o = maps.readSpr(original);
    const palette = new Uint8Array(768).fill(200);
    palette.set([0, 0, 0], 0);
    const frames = [{ width: o.width, height: o.height, pixels: new Uint8Array(o.width * o.height).fill(1) }];
    return writeDecoy(join(dir, "decoy.spr"), writeSpr({ type: o.type, format: o.format, palette, frames }));
  }
  if (kind === "sounds") {
    const o = A.readWav(original);
    const x = new Float32Array(o.x.length).map(() => (Math.random() * 2 - 1) * 0.3);
    for (let i = 0; i < 64; i++) x[x.length - 1 - i] *= i / 64;
    return writeDecoy(join(dir, "decoy.wav"), A.writeWav(x, { rate: o.rate, bits: 16 }));
  }
  const bsp = maps.readBsp(original);
  const textures = texturePlaces(bsp).map((p) => ({ name: p.name, image: { width: p.width, height: p.height, rgb: new Uint8Array(p.width * p.height * 3).fill(128) } }));
  return writeDecoy(join(dir, "decoy.wad"), maps.writeWad(textures));
}
const writeDecoy = (file, bytes) => {
  writeFileSync(file, bytes);
  return file;
};

// ── the steps ─────────────────────────────────────────────────────────────

async function pool(jobs, atOnce = 4) {
  const queue = [...jobs];
  const out = [];
  await Promise.all(
    Array.from({ length: Math.min(atOnce, queue.length) }, async () => {
      while (queue.length) {
        try {
          const r = await queue.shift()();
          out.push(r);
          if (typeof r === "string") console.log(r);
        } catch (error) {
          console.log(`failed: ${error.message.split("\n")[0]}`);
        }
      }
    }),
  );
  return out;
}

const direct = process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]));
if (!direct);
else if (step === "inputs") for (const kind of kinds) for (const s of chosen(kind)) console.log(`${kind}/${s.id}: ${inputs(kind, s)}`);
else if (step === "describe") await pool(kinds.flatMap((kind) => chosen(kind).filter((s) => again || !existsSync(join(folderOf(kind, s.id), "words.md"))).map((s) => () => describe(kind, s))), 6);
else if (step === "reproduce") await pool(kinds.flatMap((kind) => chosen(kind).flatMap((s) => LEGS.map((leg) => () => reproduce(kind, s, leg)))), 5);
else if (step === "judge") {
  const jobs = [];
  for (const kind of kinds)
    for (const s of chosen(kind)) {
      for (const leg of LEGS) {
        const built = join(folderOf(kind, s.id), leg, "built", kind === "textures" ? "frenzy_new.wad" : basename(s.file));
        if (existsSync(built)) jobs.push(() => judgeOne(kind, s, leg, built).then((r) => (writeFileSync(join(folderOf(kind, s.id), leg, "judge.json"), `${JSON.stringify(r, null, 1)}\n`), `${kind}/${s.id}:${leg}: ${r.error ?? `${r.total} of ${r.of}, ${r.passes ? "PASSES" : "fails"}`}`)));
      }
      jobs.push(() => judgeOne(kind, s, "decoy", decoyOf(kind, s), { decoy: "plain" }).then((r) => (writeFileSync(join(folderOf(kind, s.id), "judge", "decoy.json"), `${JSON.stringify(r, null, 1)}\n`), `${kind}/${s.id} decoy: ${r.error ?? `${r.total} of ${r.of}, ${r.passes ? "PASSES (the judge is lenient)" : "fails, as it must"}`}`)));
    }
  await pool(jobs, 4);
} else console.log("node examples/reproduce/assets.mjs inputs|describe|reproduce|judge [sprites|sounds|textures] [subject ...] [--again]");
