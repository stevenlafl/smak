#!/usr/bin/env node
// SMAK as an MCP server: the kit for a client that has no shell (Claude Desktop, say). It speaks the Model
// Context Protocol over stdin and stdout and offers a handful of tools: read the guide a section at a time,
// list, describe, check and draw models, and run a script over the kit.
//
//   node mcp/server.mjs --models <dir> --work <dir> [--no-run] [--compilers <dir>]
//
//   --models  the folder of models to work from (a mod's `models`). Only ever read; may be left out
//   --work    the folder everything made is written to; made when it is not there
//   --no-run  without the tool `run`. That tool runs whatever code the client sends, as the person who
//             started the server: without it the server can only read, draw and build from specs
//   --compilers  the map compilers' folder (SDHLT or VHLT), for `build` of a map; VHLT_DIR and the PATH
//             are looked in unless told
//   --fgd     an entity definitions file (the game's .fgd; the compilers' own): `build` holds a map's
//             entities against them, `entities` lists them. Given again for more than one
//   --wads    a folder of a game's .wad files (its valve or mod folder): a map spec's `wads` are looked for
//             there by name. Given again for more than one
//   --generators  a folder of models run on this machine (generators/README.md; SMAK_GENERATORS unless told):
//             the tool `generate` makes sounds, music and shapes with them
//   --materials   a library of material photographs (generators/fetch-materials.mjs; SMAK_MATERIALS unless told):
//             the tool `materials` searches it, and a material's picture may be "library:<name>"
//
// The protocol is in protocol.mjs, the tools in tools.mjs (and run.mjs), the two folders' rule in
// folders.mjs. Nothing is printed on stdout but the protocol's messages; what is worth saying goes to stderr.
import { readFileSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "./protocol.mjs";
import { openFolders } from "./folders.mjs";
import { toolsFor } from "./tools.mjs";
import { openGenerators } from "./generate.mjs";
import { openMaterials } from "./materials.mjs";
import { KIT } from "./guide.mjs";

/** What a client's model is told beside the tools, once. */
const INSTRUCTIONS =
  "SMAK makes and changes GoldSrc studio models (.mdl) and maps. Call `guide` first and read only the sections the task needs. To make a model or a map from a person's words (or a drawing), read `guide { doc: \"spec\" }`, write a spec and `build` it; change models and maps in other ways with `command` (any command of the command line, every flag) or `run`. `file` reads back what was made (a sound to listen to), `page` opens the viewer or the editor for the person. Look at every result's pictures before reporting it.";
export const USAGE = "node mcp/server.mjs --models <dir> --work <dir> [--no-run] [--compilers <dir>] [--fgd <file> ...] [--wads <dir> ...] [--generators <dir>] [--materials <dir>]";

/** The server's flags read: { models, work, run }. `--name value`, and `--no-run`. */
export function parseArgs(argv) {
  const flags = { run: true };
  for (let i = 0; i < argv.length; i++) {
    const word = argv[i];
    if (word === "--no-run") flags.run = false;
    else if (word === "--models" || word === "--work" || word === "--compilers" || word === "--generators" || word === "--materials") flags[word.slice(2)] = argv[++i];
    else if (word === "--fgd") (flags.fgd ??= []).push(argv[++i]);
    else if (word === "--wads") (flags.wads ??= []).push(argv[++i]);
    // for a blind test: game files a build may fit into but never draw or describe (--hide), or never read (--refuse)
    else if (word === "--hide") (flags.hide ??= []).push(argv[++i]);
    else if (word === "--refuse") (flags.refuse ??= []).push(argv[++i]);
    else throw new Error(`what is ${word}?`);
  }
  return flags;
}

/**
 * Starts the server over the process's own stdin and stdout. Resolves when the client has closed stdin and
 * every call has been answered.
 */
export function start({ models, work, run = true, compilers, fgd = [], wads = [], hide = [], refuse = [], generators = process.env.SMAK_GENERATORS, materials = process.env.SMAK_MATERIALS }) {
  const folders = openFolders({ models, work });
  folders.compilers = compilers;
  folders.fgd = fgd;
  folders.wads = wads;
  folders.hide = hide;
  folders.refuse = refuse;
  folders.generators = generators ? openGenerators(generators) : null;
  folders.materials = materials ? openMaterials(materials) : null;
  const { version } = JSON.parse(readFileSync(join(KIT, "package.json"), "utf8"));
  const log = (line) => process.stderr.write(`${line}\n`);
  log(
    `smak mcp ${version}: models ${folders.models ?? "(none)"}, work ${folders.work}${run ? "" : ", without run"}${folders.generators ? `, generators ${folders.generators.models.map((m) => m.name).join(", ")}` : ""}${folders.materials ? `, ${folders.materials.list.length} materials` : ""}`,
  );
  return serve({
    input: process.stdin,
    output: process.stdout,
    serverInfo: { name: "smak", version },
    instructions: INSTRUCTIONS,
    tools: toolsFor(folders, { allowRun: run }),
    log,
  });
}

// run as a command (not imported by another module): the flags, then the server until stdin closes
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  try {
    await start(parseArgs(process.argv.slice(2)));
    process.exit(0);
  } catch (error) {
    process.stderr.write(`smak mcp: ${error.message}\n${USAGE}\n`);
    process.exit(1);
  }
}
