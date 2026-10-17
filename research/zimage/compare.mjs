// The guard brief's pictures drawn through the MCP tool `generate`, old route against new: SD-Turbo over the base's
// grey figure (a manifest with Hunyuan3D-2mini alone) and Z-Image-Turbo held to the base's pose (with zimage-turbo).
//   node research/zimage/compare.mjs <local-3d folder> <game valve folder> <out folder> [seeds]
import { mkdirSync, writeFileSync, readFileSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { openFolders } from "../../mcp/folders.mjs";
import { openGenerators, stopWorkers } from "../../mcp/generate.mjs";
import { toolsFor } from "../../mcp/tools.mjs";

const [local3d, game, out, seedList = "0,1,2,3"] = process.argv.slice(2);
const seeds = seedList.split(",").map(Number);
const briefs = JSON.parse(readFileSync(new URL("../../examples/reproduce/briefs.json", import.meta.url), "utf8"));
const guard = briefs.characters?.barney?.brief ?? briefs.barney?.brief;
const shape = { name: "hunyuan3d-mini", kind: "shape", root: local3d, python: "venvs/torch-rocm/bin/python", licence: "Tencent", default: true };
const picture = { name: "zimage-turbo", kind: "picture", root: local3d, python: "venvs/zimage-rocm/bin/python", licence: "Apache-2.0", env: { HF_HUB_OFFLINE: "1", PYTORCH_HIP_ALLOC_CONF: "expandable_segments:True" } };
const result = { brief: guard, routes: {} };
for (const [route, models] of [["old", [shape]], ["new", [shape, picture]]]) {
  const gens = join(out, `gens-${route}`);
  mkdirSync(gens, { recursive: true });
  writeFileSync(join(gens, "generators.json"), JSON.stringify({ models }));
  const folders = openFolders({ work: join(out, `work-${route}`) });
  folders.wads = [game];
  folders.generators = openGenerators(gens);
  const generate = toolsFor(folders).find((t) => t.name === "generate");
  const started = Date.now();
  try {
    const answer = await generate.call({ kind: "shape", prompt: guard, base: "player/gordon/gordon.mdl", only: "picture", seeds, name: "guard" });
    const said = answer.filter((p) => p.type === "text").map((p) => p.text).join("\n");
    console.log(`== ${route}\n${said}`);
    result.routes[route] = { seconds: Math.round((Date.now() - started) / 100) / 10, said };
    for (const seed of seeds) copyFileSync(join(folders.work, "gen", `guard_s${seed}.png`), join(out, `${route}_s${seed}.png`));
  } finally {
    stopWorkers();
  }
}
writeFileSync(join(out, "compare.json"), `${JSON.stringify(result, null, 1)}\n`);
