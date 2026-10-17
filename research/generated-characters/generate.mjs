// Takes of a character from words, made as the MCP tool `generate` makes a shape (SD-Turbo draws it, BiRefNet cuts
// it out, Hunyuan3D-2mini makes the mesh): the same function the server calls, with the same folders.
//
//   node research/generated-characters/generate.mjs <work folder> <name> <seed,seed> "<prompt>" [picture | base.mdl]
//
// A fifth argument ending .mdl is a character's base (player/gordon/gordon.mdl): the take is drawn over it in
// the stance it is built in (generate's base).
//
// The takes land in <work>/gen/<name>_s<seed>.obj with their picture, cut-out and sidecar; the tool's contact
// sheet is written as <work>/gen/<name>-takes.png and its words printed. The generators folder is the one
// ~/stignored/smak-mcp/.mcp.json gives the server (SMAK_GENERATORS overrides it).
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { openFolders } from "../../mcp/folders.mjs";
import { openGenerators, generate, stopWorkers } from "../../mcp/generate.mjs";

const [work, name, seedList, prompt, fifth] = process.argv.slice(2);
const [picture, base] = /\.mdl$/i.test(fifth ?? "") ? [undefined, fifth] : [fifth, undefined];
if (!work || !name || !seedList || !prompt) throw new Error("generate.mjs <work> <name> <seeds> <prompt> [picture]");
const folders = openFolders({ work, models: "/media/Data1/SteamLibrary/steamapps/common/Half-Life/valve/models" });
folders.wads = ["/media/Data1/SteamLibrary/steamapps/common/Half-Life/valve"];
folders.generators = openGenerators(process.env.SMAK_GENERATORS ?? "/media/Data3/Packages/local-audio");
const started = Date.now();
const answer = await generate(folders, { kind: "shape", prompt, name, seeds: seedList.split(",").map(Number), ...(picture ? { picture } : {}), ...(base ? { base } : {}) });
for (const piece of answer) {
  if (piece.type === "text") console.log(piece.text);
  else writeFileSync(join(folders.work, "gen", `${name}-takes.png`), Buffer.from(piece.data, "base64"));
}
console.log(`wall time ${((Date.now() - started) / 1000).toFixed(1)} s`);
stopWorkers();
