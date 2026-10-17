// The turnaround guard's shape, from the front half of its sheet: research/out/turnaround (out of git).
//   node research/zimage/turnaround-shape.mjs <generators folder> <work-relative front picture>
import { join, resolve } from "node:path";
import { openFolders } from "../../mcp/folders.mjs";
import { openGenerators, stopWorkers } from "../../mcp/generate.mjs";
import { toolsFor } from "../../mcp/tools.mjs";

const here = resolve(new URL("../..", import.meta.url).pathname);
const folders = openFolders({ work: join(here, "research/out/turnaround") });
folders.wads = [`${process.env.HOME}/.steam/steam/steamapps/common/Half-Life/valve`];
folders.generators = openGenerators(process.argv[2]);
const generate = toolsFor(folders).find((t) => t.name === "generate");
try {
  const made = await generate.call({ kind: "shape", picture: `work:${process.argv[3]}`, base: "player/gordon/gordon.mdl", seeds: 1, name: "guard/turnshape" });
  console.log(made[0].text);
} finally {
  stopWorkers();
}
