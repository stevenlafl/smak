// The guard brief drawn as a turnaround (front and back in one picture) and, for comparison, as the separate front
// and back pictures a maker drew before: through the MCP tool `generate` on the live generators. Pictures go to
// research/out/turnaround (out of git). Nothing of the game's is written.
//   node research/zimage/turnaround.mjs <generators folder> [seeds]
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { openFolders } from "../../mcp/folders.mjs";
import { openGenerators, stopWorkers } from "../../mcp/generate.mjs";
import { toolsFor } from "../../mcp/tools.mjs";

const here = resolve(new URL("../..", import.meta.url).pathname);
const work = join(here, "research/out/turnaround");
mkdirSync(work, { recursive: true });
const folders = openFolders({ work });
folders.wads = [process.env.SMAK_GAME ?? `${process.env.HOME}/.steam/steam/steamapps/common/Half-Life/valve`];
folders.generators = openGenerators(process.argv[2]);
const generate = toolsFor(folders).find((t) => t.name === "generate");
const seeds = Number(process.argv[3] ?? 2);
// the brief's look, without what it does in the game (it pulls the figure out of its stance: docs/SPEC.md)
const prompt = "a security guard: a man in a blue uniform shirt and blue-violet trousers, a helmet with a visor and a black bulletproof vest with SECURITY on the back, a pistol holster on his belt";
try {
  const started = Date.now();
  const turned = await generate.call({ kind: "shape", prompt, base: "player/gordon/gordon.mdl", turnaround: true, only: "picture", seeds, name: "guard/turn" });
  console.log(turned[0].text, `\n${Math.round((Date.now() - started) / 1000)} s`);
  for (const [i, part] of turned.entries()) if (part.type === "image") writeFileSync(join(work, `turn-sheet-${i}.png`), Buffer.from(part.data, "base64"));
} finally {
  stopWorkers();
}
