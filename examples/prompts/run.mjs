// Every prompt of this folder built again through the MCP server, as a client sees it: the server is started
// as a client starts it, each case's spec handed to its tool `build`, and what comes back (the report and
// the pictures) written into the case's `result` folder. Nothing here builds anything itself.
//
//   node examples/prompts/run.mjs [case ...] [--work <folder>] [--compilers <folder>]
//
// A case is a folder NN-name holding prompt.md (the person's words, the rubric and its score), spec.json
// (what the words were turned into), and maybe drawing.png (a drawing or a picture the person gave) and
// prefab specs the spec names by file. With no case named, all of them. --work is where the server writes
// (a fresh temporary folder unless told); --compilers the map compilers' folder (SDHLT), else VHLT_DIR, else
// ../SDHLT/tools beside the kit. --fgd: an entity definitions file the maps are held against (again for
// more); unless told, Half-Life's from the SDK in the Steam folder and SDHLT's own, where they are.
// It ends with code 1 when any case's checks do not pass.
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { readdirSync, existsSync, mkdirSync, writeFileSync, readFileSync, mkdtempSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir, homedir } from "node:os";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SERVER = join(HERE, "..", "..", "mcp", "server.mjs");

const words = process.argv.slice(2);
const option = (name) => {
  const at = words.indexOf(name);
  if (at < 0) return undefined;
  const [, value] = words.splice(at, 2);
  return value;
};
const work = option("--work") ?? mkdtempSync(join(tmpdir(), "smak-prompts-"));
// the map compilers: as told, or VHLT_DIR, or SDHLT built beside the kit (git clone of seedee/SDHLT next
// to smak, built with cmake: its programs land in SDHLT/tools)
const beside = join(HERE, "..", "..", "..", "SDHLT", "tools");
const compilers = option("--compilers") ?? process.env.VHLT_DIR ?? (existsSync(beside) ? beside : undefined);
// the entity definitions the maps are held against: as told (--fgd, again for more), else Half-Life's from the
// SDK where Steam keeps it and the compilers' own beside them
const fgds = [];
for (let at = words.indexOf("--fgd"); at >= 0; at = words.indexOf("--fgd")) fgds.push(words.splice(at, 2)[1]);
if (!fgds.length) {
  const sdk = join(homedir(), ".steam/steam/steamapps/common/Half-Life SDK/Hammer Editor/fgd/half-life/halflife.fgd");
  const own = join(beside, "sdhlt.fgd");
  for (const file of [sdk, own]) if (existsSync(file)) fgds.push(file);
}
const cases = readdirSync(HERE)
  .filter((name) => /^\d\d-/.test(name) && existsSync(join(HERE, name, "spec.json")))
  .filter((name) => !words.length || words.some((word) => name.startsWith(word)))
  .sort();

// the server, started as a client starts it
const child = spawn(
  process.execPath,
  [SERVER, "--models", HERE, "--work", work, "--no-run", ...(compilers ? ["--compilers", compilers] : []), ...fgds.flatMap((file) => ["--fgd", file])],
  { stdio: ["pipe", "pipe", "inherit"] },
);
const waiting = new Map();
let nextId = 1;
createInterface({ input: child.stdout }).on("line", (line) => {
  const answer = JSON.parse(line);
  waiting.get(answer.id)?.(answer);
  waiting.delete(answer.id);
});
const request = (method, params) =>
  new Promise((answered) => {
    const id = nextId++;
    waiting.set(id, answered);
    child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
  });
await request("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "prompts", version: "1" } });

let failed = 0;
for (const name of cases) {
  const args = { spec: `models:${name}/spec.json` };
  if (existsSync(join(HERE, name, "drawing.png"))) args.reference = `models:${name}/drawing.png`;
  // a close look at parts too small to judge in the sheet, as the case's focus.json lists them
  if (existsSync(join(HERE, name, "focus.json"))) args.focus = JSON.parse(readFileSync(join(HERE, name, "focus.json"), "utf8"));
  const began = Date.now();
  const answer = await request("tools/call", { name: "build", arguments: args });
  const result = answer.result ?? { content: [{ type: "text", text: `ERROR ${answer.error?.message}` }], isError: true };
  const said = result.content.filter((piece) => piece.type === "text").map((piece) => piece.text).join("\n");
  const out = join(HERE, name, "result");
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "report.txt"), `${said}\n`);
  result.content
    .filter((piece) => piece.type === "image")
    .forEach((piece, i) => writeFileSync(join(out, `picture-${i + 1}.png`), Buffer.from(piece.data, "base64")));
  const ok = !result.isError && said.startsWith("OK");
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"}  ${name}  (${((Date.now() - began) / 1000).toFixed(1)} s)${ok ? "" : `\n${said.split("\n").filter((line) => /^(NOT OK|ERROR|FAULT)/.test(line)).join("\n")}`}`);
}
child.stdin.end();
console.log(`\n${cases.length - failed} of ${cases.length} cases pass their checks; the server wrote to ${work}`);
process.exit(failed ? 1 : 0);
