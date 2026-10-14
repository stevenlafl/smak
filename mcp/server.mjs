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
//
// The protocol is in protocol.mjs, the tools in tools.mjs (and run.mjs), the two folders' rule in
// folders.mjs. Nothing is printed on stdout but the protocol's messages; what is worth saying goes to stderr.
import { readFileSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "./protocol.mjs";
import { openFolders } from "./folders.mjs";
import { toolsFor } from "./tools.mjs";
import { KIT } from "./guide.mjs";

/** What a client's model is told beside the tools, once. */
const INSTRUCTIONS =
  "SMAK makes and changes GoldSrc studio models (.mdl) and maps. Call `guide` first and read only the sections the task needs. To make a model or a map from a person's words (or a drawing), read `guide { doc: \"spec\" }`, write a spec and `build` it; change models in other ways with `run`. Look at every result's pictures before reporting it.";
const USAGE = "node mcp/server.mjs --models <dir> --work <dir> [--no-run] [--compilers <dir>]";

/** The server's flags read: { models, work, run }. `--name value`, and `--no-run`. */
function parseArgs(argv) {
  const flags = { run: true };
  for (let i = 0; i < argv.length; i++) {
    const word = argv[i];
    if (word === "--no-run") flags.run = false;
    else if (word === "--models" || word === "--work" || word === "--compilers") flags[word.slice(2)] = argv[++i];
    else throw new Error(`what is ${word}?`);
  }
  return flags;
}

/**
 * Starts the server over the process's own stdin and stdout. Resolves when the client has closed stdin and
 * every call has been answered.
 */
export function start({ models, work, run = true, compilers }) {
  const folders = openFolders({ models, work });
  folders.compilers = compilers;
  const { version } = JSON.parse(readFileSync(join(KIT, "package.json"), "utf8"));
  const log = (line) => process.stderr.write(`${line}\n`);
  log(
    `smak mcp ${version}: models ${folders.models ?? "(none)"}, work ${folders.work}${run ? "" : ", without run"}`,
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
