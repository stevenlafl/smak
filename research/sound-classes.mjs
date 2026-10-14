// Measures again, from the game's own files in a person's install, the reference rows of src/audio/classes.mjs:
// the numbers the kit holds a made sound against. Reads only; prints one row a file to paste.
//   node research/sound-classes.mjs <the game's valve folder>
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { readWav, features, CLASSES } from "../src/audio/index.mjs";

const game = process.argv[2];
if (!game) throw new Error("node research/sound-classes.mjs <the game's valve folder, the one with sound/ in it>");
for (const [name, rows] of Object.entries(CLASSES)) {
  for (const { file } of rows) {
    const path = join(game, "sound", file);
    if (!existsSync(path)) {
      console.log(`// ${name}: ${file} is not in ${game}/sound`);
      continue;
    }
    const f = features(readWav(readFileSync(path)));
    const b = f.bands;
    console.log(`  ${JSON.stringify(name)}: row(${JSON.stringify(file)}, ${f.length}, ${f.peak}, ${f.rms}, ${f.crest}, ${Math.round(f.attack * 1000)}, ${f.t20}, ${f.t40}, ${f.centroid}, ${f.flatness}, ${b["<150"]}, ${b["150-600"]}, ${b["600-2k"]}, ${b["2k-5k"]}, ${b[">5k"]}),`);
  }
}
