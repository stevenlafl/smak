// The whole route through the MCP tool `generate` with the real models: the guard's picture by Z-Image-Turbo held to
// Gordon's pose, then its shape by Hunyuan3D-2mini from that picture.
//   node research/zimage/whole.mjs <local-3d folder> <game valve folder> <out folder> [seed]
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { openFolders } from "../../mcp/folders.mjs";
import { openGenerators, stopWorkers } from "../../mcp/generate.mjs";
import { toolsFor } from "../../mcp/tools.mjs";

const [local3d, game, out, seed = "1"] = process.argv.slice(2);
const guard = JSON.parse(readFileSync(new URL("../../examples/reproduce/briefs.json", import.meta.url), "utf8")).characters.barney.brief;
const gens = join(out, "gens");
mkdirSync(gens, { recursive: true });
writeFileSync(join(gens, "generators.json"), JSON.stringify({ models: [
  { name: "hunyuan3d-mini", kind: "shape", root: local3d, python: "venvs/torch-rocm/bin/python", licence: "Tencent", default: true },
  { name: "zimage-turbo", kind: "picture", root: local3d, python: "venvs/zimage-rocm/bin/python", licence: "Apache-2.0", env: { HF_HUB_OFFLINE: "1", PYTORCH_HIP_ALLOC_CONF: "expandable_segments:True" } },
] }));
const folders = openFolders({ work: join(out, "work") });
folders.wads = [game];
folders.generators = openGenerators(gens);
try {
  const answer = await toolsFor(folders).find((t) => t.name === "generate").call({ kind: "shape", prompt: guard, base: "player/gordon/gordon.mdl", seeds: [Number(seed)], name: "guard" });
  console.log(answer.filter((p) => p.type === "text").map((p) => p.text).join("\n"));
  const shown = answer.find((p) => p.type === "image");
  if (shown) writeFileSync(join(out, "answer.png"), Buffer.from(shown.data, "base64"));
} finally {
  stopWorkers();
}
