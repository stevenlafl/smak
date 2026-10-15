// How sharp a reproduction's picture is against its original's, as the judges see them (M5: "the markings are
// there but softer"). Each model is drawn from the same six sides, lit as the judges' pictures are, and its local
// contrast taken: the mean, over the pixels both outlines cover, of how far a pixel's brightness stands from the
// mean of the 3 x 3 about it. Over 1 the copy is sharper, under 1 softer.
//
//   node research/sharpness.mjs [reproduce|held] ...        the legs of examples/reproduce/ with a built model
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { sheet } from "../src/render.mjs";

const REPRO = join(import.meta.dirname, "..", "examples", "reproduce");
const STEAM = join(homedir(), ".steam/steam/steamapps/common/Half-Life");

/** Mean |L - local mean| over the pixels where both pictures are not ground. */
export function localContrast(a, b) {
  const lum = (img, i) => 0.3 * img.rgba[i * 4] + 0.59 * img.rgba[i * 4 + 1] + 0.11 * img.rgba[i * 4 + 2];
  const ground = (img, i) => img.rgba[i * 4] === 58 && img.rgba[i * 4 + 1] === 62 && img.rgba[i * 4 + 2] === 70;
  const one = (img) => {
    let sum = 0;
    let n = 0;
    for (let y = 1; y < img.height - 1; y++)
      for (let x = 1; x < img.width - 1; x++) {
        const i = y * img.width + x;
        if (ground(a, i) || ground(b, i)) continue;
        let m = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) m += lum(img, i + dy * img.width + dx);
        sum += Math.abs(lum(img, i) - m / 9);
        n++;
      }
    return n ? sum / n : 0;
  };
  return { a: one(a), b: one(b) };
}

/** The legs to measure: [{ name, original, copy }]. */
function legs(which) {
  const out = [];
  if (which.includes("reproduce"))
    for (const s of JSON.parse(readFileSync(join(REPRO, "subjects.json"), "utf8")).models) {
      const built = join(REPRO, s.id, "pictures", "built");
      if (!existsSync(built)) continue;
      const mdl = readdirSync(built).find((f) => f.endsWith(".mdl"));
      if (mdl) out.push({ name: `${s.id} pictures`, original: join(STEAM, "valve", s.file), copy: join(built, mdl) });
    }
  if (which.includes("held"))
    for (const kind of ["characters", "players", "weapons"])
      for (const id of readdirSync(join(REPRO, "held", kind))) {
        const built = join(REPRO, "held", kind, id, "pictures", "built");
        if (!existsSync(built)) continue;
        const mdl = readdirSync(built).find((f) => f.endsWith(".mdl") && !f.startsWith("v_"));
        if (!mdl) continue;
        const original = [join(STEAM, "valve", "models", mdl), join(STEAM, "ts", "models", "player", id, `${id}.mdl`), join(STEAM, "valve", "models", `${id}.mdl`)].find(existsSync);
        if (original) out.push({ name: `${kind}/${id} pictures`, original, copy: join(built, mdl) });
      }
  return out;
}

const which = process.argv.slice(2).length ? process.argv.slice(2) : ["reproduce", "held"];
const ratios = [];
for (const leg of legs(which)) {
  const draw = (file) => sheet(readFileSync(file), { seq: 0, size: 256 });
  try {
    const { a, b } = localContrast(draw(leg.original), draw(leg.copy));
    ratios.push(b / a);
    console.log(`${leg.name.padEnd(28)} original ${a.toFixed(2)}  copy ${b.toFixed(2)}  ratio ${(b / a).toFixed(2)}`);
  } catch (error) {
    console.log(`${leg.name}: ${error.message.split("\n")[0]}`);
  }
}
if (ratios.length) console.log(`median ratio ${ratios.sort((x, y) => x - y)[Math.floor(ratios.length / 2)].toFixed(2)} over ${ratios.length} legs`);
