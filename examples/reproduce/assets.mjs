// The reproduction test for a mod's other assets (rubric.md, "Textures, sounds and sprites"): Valve's sprites
// reproduced, and the textures of a map replaced under their own names, each from pictures or from words, by a
// fresh agent with only the MCP server and no game folder; then judged by another fresh agent from the harness's
// pictures and measurements. Decoys (a plain square, flat colours) must fail. Valve's sounds are replaced from a
// modder's brief (leg "brief"): the engine's checks here, the verdict the person's ear (rubric.md, 2026-10-16).
//
//   node examples/reproduce/assets.mjs inputs|describe|reproduce|rebuild|judge [sprites|sounds|textures] [subject ...] [--again]
//        rebuild: each leg built again from its maker's spec (and the takes it kept), on the kit as it is now, with
//                 no agent: what a change to the kit does to a result, and the proof a result needs no Claude
//        [--generators <folder>]   the sound makers' server offers the tool generate (generators/README.md;
//                                  SMAK_GENERATORS unless told): two makers at a time, each loads its model
//        [--materials <folder>]    the texture and sprite makers' server offers the material library (SMAK_MATERIALS)
//        [--accept-licences]       a test condition: the sound makers are told the person accepts the generators'
//                                  licences (to measure what takes add; the tool itself decides nothing)
//
// Each subject's folder under assets/<kind>/<id>/: input/ (the pictures: Valve's, kept out of git), words.md,
// <leg>/ (spec.json, answer.md, run.json, built/ out of git), <leg>/judge.json. assets/scores.md: every result.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, copyFileSync, rmSync, mkdtempSync, renameSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { HERE, KIT, GAME, savePng, besides } from "./lib.mjs";
import { runAgent, runJudge, failedByMeasure } from "./agents.mjs";
import { toolsFor } from "../../mcp/tools.mjs";
import { openFolders } from "../../mcp/folders.mjs";
import { openMaterials } from "../../mcp/materials.mjs";
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
const GENERATORS = words.includes("--generators") ? words.splice(words.indexOf("--generators"), 2)[1] : process.env.SMAK_GENERATORS;
// a test condition, never the tool's default: the makers told the person accepts the generators' licences
const ACCEPT = words.includes("--accept-licences") && words.splice(words.indexOf("--accept-licences"), 1);
// the texture makers' server offers the material library (the tool materials, library: pictures)
const MATERIALS = words.includes("--materials") ? words.splice(words.indexOf("--materials"), 2)[1] : process.env.SMAK_MATERIALS;
const KINDS = ["sprites", "sounds", "textures"];
const kinds = KINDS.filter((k) => !words.some((w) => KINDS.includes(w)) || words.includes(k));
const named = words.filter((w) => !KINDS.includes(w));
const LEGS = ["pictures", "words"];
// a sound is not copied from a picture or a reading of one (Steven, 2026-10-16: "no one's going to give a sound and say
// replicate this"; the descriptions read the spectrogram, which no model was trained on): its one leg is a modder's
// brief, a line of what the sound is for, and the verdict is the person's ear, at least as good as the game's own
const legsOf = (kind) => (kind === "sounds" ? ["brief"] : LEGS);
/** What a modder asks for, by the game's event its file plays, never by its sound. */
const SOUND_BRIEF = {
  "weapons/cbar_hit1": "the crowbar hitting a metal surface",
  "weapons/357_shot1": "a .357 revolver firing",
  "weapons/sbarrel1": "a pump shotgun firing",
  "player/pl_step1": "a footstep on concrete",
  "player/pl_metal1": "a footstep on a metal floor",
  "doors/doormove1": "a heavy metal sliding door moving",
  "items/smallmedkit1": "using a small medkit to heal",
  "debris/bustmetal1": "a metal panel or crate breaking apart",
  "weapons/explode3": "a grenade exploding",
  "ambience/drips": "a looping ambience of water dripping in a tunnel",
};

const SOUND_CLASS = { "weapons/cbar_hit1": "metal hit", "weapons/357_shot1": "gunshot", "weapons/sbarrel1": "gunshot", "player/pl_step1": "step concrete", "player/pl_metal1": "step metal", "weapons/explode3": "explosion", "ambience/drips": "loop drips" };
const SUBJECTS = {
  sprites: ["glow01", "flare1", "fire", "zerogxplode", "steam1", "xspark1", "laserbeam", "muzzleflash1"].map((id) => ({ id, file: `sprites/${id}.spr` })),
  // a class of src/audio/classes.mjs where the sound is of one, for its envelope's range (S2)
  sounds: ["weapons/cbar_hit1", "weapons/357_shot1", "weapons/sbarrel1", "player/pl_step1", "player/pl_metal1", "doors/doormove1", "items/smallmedkit1", "debris/bustmetal1", "weapons/explode3", "ambience/drips"].map((n) => ({ id: n.replace("/", "-"), file: `sound/${n}.wav`, name: `${n}.wav`, class: SOUND_CLASS[n], brief: SOUND_BRIEF[n] })),
  textures: [{ id: "frenzy", file: "maps/frenzy.bsp" }],
};
const chosen = (kind) => SUBJECTS[kind].filter((s) => !named.length || named.includes(s.id));
const folderOf = (kind, id) => join(ROOT, kind, id);
const round = (v, k = 1) => Math.round(v * 10 ** k) / 10 ** k;
const png = (picture) => smak.png(picture.width, picture.height, picture.rgba);

// ── what the game has ─────────────────────────────────────────────────────

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

/** A view of a texture's place in the map: from the judge's camera, wearing `textures` (a .wad's) or the game's. */
/** The brightness a white place view is drawn again at, for its colour (a lamp's face). */
const DARK_VIEW = 0.5;
const placeView = (bsp, place, textures) => maps.placeView(bsp, place, textures ? { textures } : { folders: [GAME] });
const texturePlaces = (bsp) => maps.texturePlaces(bsp);
export { texturePlaces };

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
    const picture = A.soundPicture([{ name: subject.name, x: wav.x, rate: wav.rate, loop: wav.cue?.length ? wav.cue[0] : undefined }], { width: 960 });
    savePng(join(out, "sound.png"), picture);
    // and what a careful eye reads off that picture, measured off the picture itself (not the samples): its centroid
    // and band shares. Read by eye, a describer gave the crowbar's hit 30% at 600 to 2000 Hz where it has 74%, and
    // two sounds the same five shares; the words leg then built to the wrong numbers (2026-10-16)
    const read = A.pictureMeasures(smak.unpng(smak.png(picture.width, picture.height, picture.rgba)), { length: wav.x.length / wav.rate, rate: wav.rate });
    const shares = Object.entries(read.bands).map(([k, v]) => `${k} Hz ${Math.round(v)}%`).join(", ");
    writeFileSync(join(out, "facts.txt"), `${subject.name}: ${round(wav.x.length / wav.rate, 2)} s, ${wav.rate} Hz, ${wav.bits} bits${wav.cue?.length ? ", looped (a cue point at its start)" : ", played once"}.\nRead off its picture: loudest at ${read.peakAt} s, falling 20 dB in ${read.t20} s after it, ${read.onsets} hit${read.onsets === 1 ? "" : "s"}; centroid about ${Math.round(read.centroid)} Hz; power ${shares}.\n`);
  } else {
    const bsp = maps.readBsp(readFileSync(file));
    const places = texturePlaces(bsp).sort((a, b) => b.area - a.area);
    // and where the place view is white (a lamp's face at the place view's brightness), the same place darker: the
    // colour is there to read (lifted so, frenzy's lamps came within 2.5 to 9 of delta E, against 28 to 46)
    const dark = new Set();
    for (const p of places) {
      const view = placeView(bsp, p);
      savePng(join(out, `${p.name.replace(/[^\w~+{!-]/g, "_")}.png`), view);
      let white = 0;
      for (let i = 0; i < view.width * view.height; i++) if (view.rgba[i * 4] === 255 || view.rgba[i * 4 + 1] === 255 || view.rgba[i * 4 + 2] === 255) white++;
      // any of it white: a texture's face is often a small part of its view (yellow's, 1.6% of it, white all over)
      if (white > 0.01 * view.width * view.height) {
        savePng(join(out, `${p.name.replace(/[^\w~+{!-]/g, "_")}-dark.png`), maps.placeView(bsp, p, { folders: [GAME], brightness: DARK_VIEW }));
        dark.add(p.name);
      }
    }
    const views = maps.viewsOf(bsp, { count: 8, folders: [GAME], entities: "none", labels: false, width: 320, height: 240 });
    savePng(join(out, "views.png"), views);
    // each view's camera beside the sheet, so that a texture can be lifted off them too (lift.views)
    writeFileSync(join(out, "views.json"), `${JSON.stringify({ width: 320, height: 240, cols: Math.min(4, views.facts.views.length), cameras: views.facts.views.map(({ name, from, yaw, pitch }) => ({ name, from, yaw, pitch })) }, null, 1)}\n`);
    // an animation's other frames and a random set's other tiles, by name: the map names its first, the game's .wad
    // holds the rest, and a modder replacing them sees them there (a maker who made only the first lost T6 on all
    // four lamps). Names only: their pictures are the game's
    const game = gameTextures(bsp);
    const frames = (name) => siblingsOf(name, game).filter((n) => n.toLowerCase() !== name.toLowerCase());
    writeFileSync(join(out, "list.txt"), `${places.map((p) => `${p.name} ${p.width}x${p.height} (${p.name.replace(/[^\w~+{!-]/g, "_")}.png${dark.has(p.name) ? `; darker, at brightness ${DARK_VIEW}: ${p.name.replace(/[^\w~+{!-]/g, "_")}-dark.png` : ""}${frames(p.name).length ? `; its other frames in the game: ${frames(p.name).join(", ")}` : ""})`).join("\n")}\n`);
  }
  return out;
}

// ── the agents ────────────────────────────────────────────────────────────

const DESCRIBE = {
  sprites: (dir) => `You are looking at the frames of one sprite of a video game (a flat picture the game turns to face the eye: a glow, a flame, smoke, an explosion, sparks, a beam), in ${dir}/frames.png, each frame as the engine blends it (an additive sprite over a dark ground, others over grey), numbered in order; its size, frame count, type and format are in ${dir}/facts.txt. Someone who will never see them must make it again from your words: describe what it is, its shape and size within the frame, its colours (as they look on the screen from core to rim, how white each part is, and an RGB from 0 to 1 for the core, the middle and the rim: a hue word alone drifts, and a pinkish-white halo read as "rose-mauve" was made violet), how it changes from frame to frame (grows, rises, flickers, fades, loops or plays once) and anything special. At most 250 words.`,
  sounds: (dir) => `You are looking at a picture of one sound of a video game, in ${dir}/sound.png: its waveform over its spectrogram (log frequency, 50 Hz at the bottom), with its name and length; its facts are in ${dir}/facts.txt. Someone who will never hear it must make it again from your words: describe what event it is (from its name and its shape), its length, how it starts and dies, its loudness over time, where its energy is in frequency (and roughly what share of it lies under 150 Hz, 150 to 600, 600 to 2000, 2000 to 5000 and over 5000, as the picture shows it), its hits or clicks, whether it is tonal or noisy, any pitch movement, and whether it loops. At most 250 words.`,
  textures: (dir) => `You are looking at the textures of one map (a level) of a video game, each seen on its wall in the map, lit: one picture a texture in ${dir} (named after it; where that one is white, a lamp's face, a darker one beside it, named -dark, shows its colour), and eight views of the map in ${dir}/views.png. ${dir}/list.txt gives each texture's name, size and picture. Someone who will never see them must make every texture again from your words, at its size: for each, what it is (concrete, metal panel, grate, floor tiles, a light's face), its colours, its pattern and how large its panels, seams or tiles are against its size, its wear and dirt, and anything special (holes, glow, an animation's frames). Go texture by texture, by name. At most 1800 words.`,
};
const RULES = `Do not name the game, the file's origin, the series or the company. Reply with the description alone, plain text.`;

function reproducePrompt(kind, subject, leg, given) {
  const judged = "It will be judged side by side with the original, to high standards, by someone who sees only the two drawn and measured.";
  if (kind === "sprites")
    return `Make this sprite for the GoldSrc engine with a smak.sprite/1 spec (guide { doc: "spec" }, "A sprite"), named ${subject.file}, as close to the original as you can: what it is, its shape and size in its frames, its colours, its frames and how it moves, its type and format. ${judged} Build until the build says OK.\n\n${given}`;
  if (kind === "sounds" && leg === "brief")
    return `A modder asks you: "${subject.brief}". It is for their GoldSrc mod, in the place of the game's own ${subject.name}, so the game plays it there with no code. Make it with a smak.sound/1 spec (guide { doc: "spec" }, "A sound"), named ${subject.name}. They will listen to it in the game and decide whether it is at least as good as the game's own. Build until the build says OK, and tell them what you made and how.${ACCEPT ? " For this test the person accepts the licences of the local generators, non-commercial ones included." : ""}`;
  if (kind === "sounds")
    return `Make this sound for the GoldSrc engine with a smak.sound/1 spec (guide { doc: "spec" }, "A sound"), named ${subject.name} so the game plays it in the original's place, as close to the original as you can, and at least as good: the same event, length, envelope, spectrum and character. ${judged} Build until the build says OK.${ACCEPT ? " For this test the person accepts the licences of the local generators, non-commercial ones included." : ""}\n\n${given}`;
  return `Make every texture of this map again for the GoldSrc engine, in one smak.wad/1 spec (guide { doc: "spec" }, "Textures for maps") named frenzy_new.wad, each under the original's exact name and size, so the map wears ours in their place, as close to the originals as you can and at least as good: what each is, its colours, its pattern and scale, tiling without a seam, its kind kept (a { texture's holes, a +0 animation's frames, a light's face). The compiled map is models:frenzy.bsp: give the spec preview: { map: "models:frenzy.bsp", each: true } to see the map wearing yours, and each texture on its own place from the very camera and brightness of the pictures given (the game's own textures are not here). ${judged} Build until the build says OK.\n\n${given}`;
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
  // the last round kept: its records and what it built, under round-<n>
  if (existsSync(join(out, "run.json"))) {
    const n = readdirSync(out).filter((f) => /^round-\d+$/.test(f)).length + 1;
    const keep = join(out, `round-${n}`);
    mkdirSync(keep);
    for (const f of ["spec.json", "answer.md", "run.json", "judge.json", "built", "takes"]) if (existsSync(join(out, f))) renameSync(join(out, f), join(keep, f));
  }
  const input = join(base, "input");
  const files = {};
  let given;
  if (leg === "brief") given = "";
  else if (leg === "pictures") {
    for (const f of readdirSync(input)) files[`pictures/${f}`] = join(input, f);
    given = `The original, in pictures: every file of ${input} (also in the server's work folder under pictures/). ${readdirSync(input).filter((f) => f.endsWith(".txt")).map((f) => readFileSync(join(input, f), "utf8")).join("\n")}${kind === "textures" ? `\nEach texture's picture is the map's own view of its place: a texture's lift: { map: "models:${subject.map ?? "frenzy"}.bsp", view: "work:pictures/<its picture>" } takes the texture itself off it (docs/SPEC.md, "Textures for maps"), its light divided out (add views: "work:pictures/views.png", cameras: "work:pictures/views.json" to take what the map's views show of it too); the build says how much of it the view shows and how much is white there. Where list.txt gives a darker view (a lamp, white at the place view's brightness), lift it off that one with brightness: ${DARK_VIEW}. Use it on every texture the build does not warn is white or tinted in its view, however little of it the view shows (its colour and grain come back true from a small part), and paint only those.` : ""}`;
  } else given = `The original, as someone who has seen it describes it:\n\n${readFileSync(join(base, "words.md"), "utf8")}${kind !== "textures" ? `\nIts facts: ${readFileSync(join(input, "facts.txt"), "utf8")}` : ""}${kind === "textures" ? `\nThe textures, each name and size:\n${readFileSync(join(input, "list.txt"), "utf8").replace(/ \((?:.*; )?(its other frames in the game: [^)]*)\)/g, " ($1)").replace(/ \([^)]*\.png[^)]*\)/g, "")}\nThe colours in these words were read off each texture's place in the map as lit there, from the camera and brightness the preview draws yours from: match them to what the preview says yours reads as in each view, not to the paint.` : ""}`;
  // the map, for a textures leg: alone in the server's models folder, with no game folder for its textures
  let models = null;
  if (kind === "textures") {
    models = mkdtempSync(join(tmpdir(), "smak-assets-map-"));
    copyFileSync(join(GAME, subject.file), join(models, basename(subject.file)));
  }
  const kit = execFileSync("git", ["-C", HERE, "rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
  const generators = kind === "sounds" ? GENERATORS : undefined;
  const r = await runAgent({ prompt: reproducePrompt(kind, subject, leg, given), read: leg === "pictures" ? input : null, server: { wads: false, models, generators, materials: kind === "textures" || kind === "sprites" ? MATERIALS : undefined }, files, hours: kind === "textures" ? 2 : 1 });
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
  // the generated takes the spec names (work:gen/...), with their sidecars, kept beside it under takes/ (not
  // committed, as built/ is not): the spec is rebuilt from them with no agent, after the maker's folder is gone
  if (spec) {
    const takes = join(out, "takes");
    rmSync(takes, { recursive: true, force: true });
    for (const name of new Set([...readFileSync(spec.p, "utf8").matchAll(/"(?:work:)?(gen\/[^"]+\.(?:wav|obj|png))"/g)].map((m) => m[1])))
      for (const file of [name, name.replace(/\.(wav|obj|png)$/, ".json")])
        if (existsSync(join(r.work, file))) {
          mkdirSync(dirname(join(takes, file)), { recursive: true });
          copyFileSync(join(r.work, file), join(takes, file));
        }
  }
  const built = join(out, "built");
  rmSync(built, { recursive: true, force: true });
  mkdirSync(built, { recursive: true });
  const ext = kind === "sprites" ? ".spr" : kind === "sounds" ? ".wav" : ".wad";
  const want = kind === "textures" ? "frenzy_new.wad" : basename(subject.file);
  const found = newest((n) => n === want) ?? newest((n) => n.endsWith(ext));
  if (found) copyFileSync(found.p, join(built, basename(want)));
  // the maker's folder, all of it kept above that is wanted: removed, and only ever a folder this run made
  const made = dirname(r.work);
  if (basename(made).startsWith("smak-repro-") && dirname(made) === tmpdir()) rmSync(made, { recursive: true, force: true });
  writeFileSync(join(out, "run.json"), `${JSON.stringify({ kit, model: r.model, generators: generators ? "generate" : null, licencesAccepted: kind === "sounds" && ACCEPT ? true : undefined, seconds: r.seconds, turns: r.turns, cost: r.cost, tokens: r.tokens, error: r.error, built: found?.name ?? null }, null, 1)}\n`);
  return `${kind}/${subject.id}:${leg}: ${r.seconds} s, built ${found?.name ?? "nothing"}`;
}

/**
 * A leg built again from its maker's spec, with no agent: the work folder remade as the maker had it (the leg's
 * pictures under pictures/, the takes it kept under gen/, the spec), built by the MCP tool build on the kit as it
 * is now. The last round's build and judgement are kept under round-<n>/ first; spec.json, answer.md and
 * run.json stay (they are still the maker's), and rebuilt.json says which kit built it again.
 */
async function rebuild(kind, subject, leg) {
  const base = folderOf(kind, subject.id);
  const out = join(base, leg);
  if (!existsSync(join(out, "spec.json"))) return `${kind}/${subject.id}:${leg}: no spec.json to build again`;
  const work = mkdtempSync(join(tmpdir(), "smak-rebuild-"));
  try {
    if (leg === "pictures") {
      mkdirSync(join(work, "pictures"));
      for (const f of readdirSync(join(base, "input"))) copyFileSync(join(base, "input", f), join(work, "pictures", f));
    }
    const takes = join(out, "takes");
    if (existsSync(takes))
      for (const f of readdirSync(takes, { recursive: true }).map(String)) {
        if (statSync(join(takes, f)).isDirectory()) continue;
        mkdirSync(dirname(join(work, f)), { recursive: true });
        copyFileSync(join(takes, f), join(work, f));
      }
    copyFileSync(join(out, "spec.json"), join(work, "spec.json"));
    let models;
    if (kind === "textures") {
      models = mkdtempSync(join(tmpdir(), "smak-rebuild-map-"));
      copyFileSync(join(GAME, subject.file), join(models, basename(subject.file)));
    }
    const folders = { ...openFolders({ work, models }), wads: [], fgd: [], hide: [], refuse: [], materials: MATERIALS ? openMaterials(MATERIALS) : null };
    const build = toolsFor(folders, { allowRun: false }).find((tool) => tool.name === "build");
    const said = (await build.call({ spec: "work:spec.json" })).filter((p) => p.type === "text").map((p) => p.text).join("\n");
    const ext = kind === "sprites" ? ".spr" : kind === "sounds" ? ".wav" : ".wad";
    const want = kind === "textures" ? "frenzy_new.wad" : basename(subject.file);
    const files = readdirSync(work, { recursive: true }).map(String).filter((f) => f.endsWith(ext) && !f.startsWith("gen/")).map((f) => join(work, f));
    const found = files.find((f) => basename(f) === want) ?? files.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0];
    if (!found) return `${kind}/${subject.id}:${leg}: built nothing: ${said.split("\n").slice(0, 3).join(" | ")}`;
    const n = readdirSync(out).filter((f) => /^round-\d+$/.test(f)).length + 1;
    const keep = join(out, `round-${n}`);
    mkdirSync(keep);
    for (const f of ["judge.json", "built", "rebuilt.json"]) if (existsSync(join(out, f))) renameSync(join(out, f), join(keep, f));
    for (const f of ["spec.json", "answer.md", "run.json"]) if (existsSync(join(out, f))) copyFileSync(join(out, f), join(keep, f));
    mkdirSync(join(out, "built"), { recursive: true });
    copyFileSync(found, join(out, "built", want));
    const kit = execFileSync("git", ["-C", HERE, "rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
    writeFileSync(join(out, "rebuilt.json"), `${JSON.stringify({ kit, from: "spec.json", ok: /^OK/.test(said), report: said.split("\n").slice(0, 12) }, null, 1)}\n`);
    return `${kind}/${subject.id}:${leg}: rebuilt on ${kit}${/^OK/.test(said) ? "" : " (NOT OK)"}`;
  } finally {
    // only the folders this call made, directly in the system's temporary folder
    for (const made of [work]) if (basename(made).startsWith("smak-rebuild-") && dirname(made) === tmpdir()) rmSync(made, { recursive: true, force: true });
  }
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

export function measureSpriteCopy(original, copy, dir, { sameName = true } = {}) {
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
    // R5's facts: written under the original's name, and read back by the engine's reader as written
    sameName,
    readsBack: c.frames.length > 0 && c.frames.every((f) => f.pixels?.length === f.width * f.height),
  };
  const caps = { R2: o.width === c.width && o.height === c.height ? 2 : 1, R3: band(colour, 15, 25), R4: band(frameShare, 0.25, 0.5), R5: o.type === c.type && o.format === c.format ? (sameName && measured.readsBack ? 2 : 1) : 0 };
  return { measured, caps, pictures: `${dir}/original.png (the original's frames as the engine blends them, numbered) and ${dir}/reproduction.png (the reproduction's, the same way)` };
}

export function measureSoundCopy(original, copy, dir, subject, { sameName = true } = {}) {
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
  const measured = { original: fo, reproduction: fc, envelope: { class: subject.class ?? "none: the original's own decay", t20Range: t20Range && t20Range.map((v) => round(v, 3)), t20: round(fc.t20, 3), inRange: t20In }, lengthOff: round(lengthShare, 3), centroidOff: round(centroidShare, 3), bandsOffMost: round(bandsOff), engineFaults: checks.faults, sameName, format: { rate: c.rate, bits: c.bits, channels: c.channels } };
  const caps = { S2: Math.min(band(lengthShare, 0.25, 0.5), t20In ? 2 : 1), S3: Math.min(band(centroidShare, 0.2, 0.4), band(bandsOff, 10, 20)), S5: checks.faults.length ? 0 : sameName ? 2 : 1 };
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
      const set = siblingsOf(p.name, game);
      const label = set.length > 1 ? `${name} (frame ${set.indexOf(name) + 1} of ${set.length} of ${p.name})` : name;
      flats.push({ name: label, pair: besides([onCanvas(scaled(o ? flatOf(o) : blank(p.width, p.height)), 256, 256), onCanvas(scaled(r ? flatOf(r) : blank(p.width, p.height)), 256, 256)]) });
    }
  // T2 by the texture itself too: a face lit by a coloured light (a blue lamp on a wall) hides its colour in
  // the view, so the larger of the two differences is the measure (rubric amendment of 2026-10-14)
  for (const row of rows) {
    const o = game.get(row.name.toLowerCase());
    const r = mine.get(row.name.toLowerCase());
    row.flatDeltaE = o && r ? deltaE(meanLab(flatOf(o), null), meanLab(flatOf(r), null)) : null;
    // an animation's frames (a random set's tiles) counted, not left to the judge to find among the flat pictures:
    // with every frame made and shown, each its own tile, it judged four lamps "the frames are not shown" (T6 1)
    const frames = siblingsOf(row.name, game);
    if (frames.length > 1) row.frames = { original: frames, replacement: frames.filter((n) => mine.has(n.toLowerCase())), allKept: frames.every((n) => mine.has(n.toLowerCase())) };
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
    const r = await runJudge({
      read: dir,
      hours: 1,
      prompt: `${head}\n\nThe pictures: ${m.pictures}. Look at every picture closely.\n\nThe measurements, texture by texture (deltaE: the mean colour of its view, original against replacement; flatDeltaE: the same of the textures themselves, flat; present and sizeKept: the replacement has the name and its size; frames: an animation's frames or a random set's tiles, the original's and those the replacement has, allKept true when it has every one, each frame shown flat as its own tile labelled "frame n of m of <name>"):\n${JSON.stringify(m.rows)}\n\nScore EVERY texture, items ${items.join(", ")}, 0, 1 or 2 each with a reason. Reply with JSON alone: { "<texture name>": { ${items.map((i) => `"${i}": { "score": 0, "reason": "..." }`).join(", ")} }, ... }\n\nTHE RUBRIC\n${RUBRIC}`,
    });
    const judged = parse(r.answer) ?? {};
    const results = m.rows.map((row) => {
      const caps = { T2: band(Math.max(row.deltaE ?? 0, row.flatDeltaE ?? 0), 15, 25), T6: row.sizeKept ? 2 : 0 };
      return { texture: row.name, measured: row, caps, ...settle(kind, judged[row.name], caps) };
    });
    const passed = results.filter((x) => x.passes).length;
    return { kind, subject: subject.id, leg: decoy ? `decoy: ${decoy}` : leg, textures: results, passed, of: results.length, passes: passed >= 0.8 * results.length, total: passed, error: Object.keys(judged).length ? undefined : "the judge's answer was not JSON" };
  }
  // the name the maker wrote it under (run.json's built): the harness copies the build under the original's name
  // either way, so the judge is told whether the maker named it so (R5, S5), and does not have to guess
  const ran = !decoy && existsSync(join(folderOf(kind, subject.id), leg, "run.json")) ? JSON.parse(readFileSync(join(folderOf(kind, subject.id), leg, "run.json"), "utf8")) : null;
  const sameName = ran ? ran.built === basename(subject.file) : true;
  const m = kind === "sprites" ? measureSpriteCopy(original, copy, dir, { sameName }) : measureSoundCopy(original, copy, dir, subject, { sameName });
  const failed = failedByMeasure(m.caps, MUST[kind]);
  if (failed.length) return { kind, subject: subject.id, leg: decoy ? `decoy: ${decoy}` : leg, measured: m.measured, caps: m.caps, passes: false, failedByMeasure: failed, total: 0, of: 2 * ITEMS[kind].length };
  const r = await runJudge({
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
else if (step === "reproduce") await pool(kinds.flatMap((kind) => chosen(kind).flatMap((s) => legsOf(kind).map((leg) => () => reproduce(kind, s, leg)))), GENERATORS && kinds.includes("sounds") ? 2 : 5);
else if (step === "rebuild") await pool(kinds.flatMap((kind) => chosen(kind).flatMap((s) => legsOf(kind).map((leg) => () => rebuild(kind, s, leg)))), 4);
else if (step === "judge") {
  const jobs = [];
  for (const kind of kinds)
    for (const s of chosen(kind)) {
      for (const leg of legsOf(kind)) {
        const built = join(folderOf(kind, s.id), leg, "built", kind === "textures" ? "frenzy_new.wad" : basename(s.file));
        // a sound from a brief: the engine's checks here, its verdict the person's ear (reviews/)
        if (leg === "brief" && existsSync(built)) {
          const c = A.readWav(readFileSync(built));
          const o = A.readWav(readFileSync(join(GAME, s.file)));
          const checks = A.checks(c, { loop: Boolean(o.cue?.length) });
          const r = { kind, subject: s.id, leg, brief: s.brief, engineFaults: checks.faults, warnings: checks.warnings ?? [], length: round(c.x.length / c.rate, 3), rate: c.rate, bits: c.bits, verdict: "by ear: the person's, in reviews/" };
          writeFileSync(join(folderOf(kind, s.id), leg, "judge.json"), `${JSON.stringify(r, null, 1)}\n`);
          jobs.push(async () => `${kind}/${s.id}:brief: ${checks.faults.length ? `${checks.faults.length} engine faults` : "no engine faults"}; by ear`);
          continue;
        }
        if (existsSync(built)) jobs.push(() => judgeOne(kind, s, leg, built).then((r) => (writeFileSync(join(folderOf(kind, s.id), leg, "judge.json"), `${JSON.stringify(r, null, 1)}\n`), `${kind}/${s.id}:${leg}: ${r.error ?? `${r.total} of ${r.of}, ${r.passes ? "PASSES" : "fails"}`}`)));
      }
      // a decoy proves a likeness judge cannot be fooled; a sound from a brief has none (its verdict is by ear)
      if (kind !== "sounds") jobs.push(() => judgeOne(kind, s, "decoy", decoyOf(kind, s), { decoy: "plain" }).then((r) => (writeFileSync(join(folderOf(kind, s.id), "judge", "decoy.json"), `${JSON.stringify(r, null, 1)}\n`), `${kind}/${s.id} decoy: ${r.error ?? `${r.total} of ${r.of}, ${r.passes ? "PASSES (the judge is lenient)" : "fails, as it must"}`}`)));
    }
  await pool(jobs, 4);
} else console.log("node examples/reproduce/assets.mjs inputs|describe|reproduce|rebuild|judge [sprites|sounds|textures] [subject ...] [--again]");
