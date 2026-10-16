// The pictures leg's input: pictures of each original, made from Valve's files where the game is installed.
// They are the game's art, so they stay out of git (.gitignore); this script makes them again.
//
//   node examples/reproduce/inputs.mjs [subject ...]
//
// A model: <id>/input/sides.png (six sides, one scale), <id>/input/<angle>.png (four close angles) and
// <id>/input/size.txt (its size in units, as a person would say it with the pictures).
// A map: <id>/input/plan.png (from above, floor heights, the entities and a grid of coordinates), storeys.png, section-x.png and
// section-y.png (cut through its middle each way), views.png (from inside at a player's eye).
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { HERE, KIT, SUBJECTS, GAME, readModel, boxOf, picturesOf, savePng, SIDES, ANGLES } from "./lib.mjs";
import { tile } from "../../src/render.mjs";

const wanted = process.argv.slice(2);
const chosen = (id) => !wanted.length || wanted.includes(id);
const round = (v) => Math.round(v * 10) / 10;

for (const model of SUBJECTS.models.filter((m) => chosen(m.id))) {
  const src = readModel(join(GAME, model.file));
  const out = join(HERE, model.id, "input");
  mkdirSync(out, { recursive: true });
  const pictures = picturesOf(src, { size: 512 });
  const sides = pictures.filter((p) => SIDES.some(([name]) => name === p.name));
  savePng(join(out, "sides.png"), tile(sides.map((p) => p.picture), 3, sides.map((p) => p.name)));
  for (const p of pictures.filter((p) => ANGLES.some(([name]) => name === p.name))) savePng(join(out, `${p.name}.png`), p.picture);
  const { size, mn } = boxOf(src);
  writeFileSync(
    join(out, "size.txt"),
    `${round(size[0])} units long (front to back), ${round(size[1])} wide (side to side), ${round(size[2])} high` +
      `${mn[2] >= -0.5 ? ", standing on the floor" : `, its lowest point ${round(-mn[2])} under its origin`}.\n`,
  );
  console.log(`${model.id}: ${pictures.length} pictures, ${size.map(round).join(" x ")}`);
}

const smak = (...args) => execFileSync(process.execPath, [join(KIT, "bin", "smak.mjs"), ...args], { encoding: "utf8", maxBuffer: 64 << 20 });
for (const map of SUBJECTS.maps.filter((m) => chosen(m.id))) {
  const bsp = join(GAME, map.file);
  const out = join(HERE, map.id, "input");
  mkdirSync(out, { recursive: true });
  const game = ["--game", GAME];
  smak("map-plan", bsp, "-o", join(out, "plan.png"), "--heights", "--legend", "--grid", "256", ...game);
  smak("map-storeys", bsp, "-o", join(out, "storeys.png"), ...game);
  // sections through the middle of the map's box, each way
  const { mins, maxs } = JSON.parse(smak("map-info", bsp, "--json")).bounds;
  const mid = [0, 1].map((a) => Math.round((mins[a] + maxs[a]) / 2));
  smak("map-section", bsp, "-o", join(out, "section-x.png"), "--from", `${mins[0]},${mid[1]}`, "--to", `${maxs[0]},${mid[1]}`, ...game);
  smak("map-section", bsp, "-o", join(out, "section-y.png"), "--from", `${mid[0]},${mins[1]}`, "--to", `${mid[0]},${maxs[1]}`, ...game);
  smak("map-views", bsp, "-o", join(out, "views.png"), "--count", "16", "--models", ...game);
  // the height plans of the heightplan leg: a layer of floor a picture, its height and headroom as colours
  smak("map-heights", bsp, "-o", join(out, "heightplan"));
  console.log(`${map.id}: plan, storeys, two sections, sixteen views, height plans`);
}
