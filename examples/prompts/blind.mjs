// A case's prompt handed to a fresh agent that has nothing but the MCP server: no shell, no files, no
// memory, none of this folder's specs. It reads the server's guide, writes its own spec, builds it and looks
// at the pictures, as anyone's agent would. What it made is built again through the server and kept beside
// the case (blind/), to be scored with the case's own rubric.
//
//   node examples/prompts/blind.mjs <case ...> [--model <name>] [--keep]
//
// It needs Claude Code's `claude` on the PATH, signed in. Each run is `claude -p --tools ""` with the SMAK
// server alone (`--strict-mcp-config`, `--no-run`: no tool that runs code), in a fresh empty folder: it
// knows nothing of this kit but what the server tells it. (Not `--bare`, which skips the sign-in; the
// person's own global CLAUDE.md is read, as it is in every session of theirs.) The
// compilers, FGDs and game folders are passed to that server as run.mjs passes them. blind/ gets: spec.json
// (the agent's last spec), answer.md (what it said at the end), run.json (turns, time, cost), and result/
// (the report and pictures of its spec built again).
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync, mkdirSync, mkdtempSync, existsSync, statSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir, tmpdir } from "node:os";
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
const model = option("--model");
const keep = words.includes("--keep") && words.splice(words.indexOf("--keep"), 1);
const cases = readdirSync(HERE).filter((name) => /^\d\d-/.test(name) && words.some((word) => name.startsWith(word))).sort();

// what the server gets beside its folders: as run.mjs gives it
const beside = join(HERE, "..", "..", "..", "SDHLT", "tools");
const steam = join(homedir(), ".steam/steam/steamapps/common");
const extra = [];
if (process.env.VHLT_DIR || existsSync(beside)) extra.push("--compilers", process.env.VHLT_DIR ?? beside);
for (const fgd of [join(steam, "Half-Life SDK/Hammer Editor/fgd/half-life/halflife.fgd"), join(beside, "sdhlt.fgd")])
  if (existsSync(fgd)) extra.push("--fgd", fgd);
for (const game of ["valve", "ts"]) if (existsSync(join(steam, "Half-Life", game))) extra.push("--wads", join(steam, "Half-Life", game));

const INSTRUCTIONS = `
You work for this person through the smak MCP server only: there is no shell and no file you can open.
Make what they ask. Read the server's guide as you need it (guide, and guide { doc: "spec" }), write a spec,
build it with the tool build, look at the pictures and the report it gives, and change the spec and build
again until the build says OK and the result matches what they asked. Finish with the file you built, what
you made of each thing they asked for, and anything you could not do.`;

for (const name of cases) {
  const prompt = readFileSync(join(HERE, name, "prompt.md"), "utf8")
    .split("\n")
    .filter((line) => line.startsWith(">"))
    .map((line) => line.replace(/^> ?/, ""))
    .join("\n");
  const folder = mkdtempSync(join(tmpdir(), "smak-blind-"));
  const work = join(folder, "work");
  mkdirSync(work);
  const config = join(folder, "mcp.json");
  writeFileSync(config, JSON.stringify({ mcpServers: { smak: { command: process.execPath, args: [SERVER, "--work", work, "--no-run", ...extra] } } }));
  const began = Date.now();
  console.log(`${name}: the agent is working (in ${folder})`);
  const run = spawnSync(
    "claude",
    ["-p", `${prompt}\n${INSTRUCTIONS}`, "--tools", "", "--mcp-config", config, "--strict-mcp-config", "--allowedTools", "mcp__smak__*", "--output-format", "json", ...(model ? ["--model", model] : [])],
    { cwd: folder, encoding: "utf8", input: "", maxBuffer: 256 * 1024 * 1024, timeout: 60 * 60 * 1000 },
  );
  const messages = (() => {
    try {
      return JSON.parse(run.stdout);
    } catch {
      return [];
    }
  })();
  const result = [messages].flat().find((message) => message.type === "result") ?? {};
  const calls = [messages].flat().flatMap((message) => message.message?.content ?? []).filter((piece) => piece.type === "tool_use");
  const out = join(HERE, name, "blind");
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "answer.md"), `${result.result ?? run.stderr ?? "(no answer)"}\n`);
  const tools = {};
  for (const call of calls) tools[call.name] = (tools[call.name] ?? 0) + 1;
  // its last spec: the newest .spec.json the server wrote for it
  const specs = [];
  const look = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) look(path);
      else if (entry.name.endsWith(".spec.json")) specs.push({ path, at: statSync(path).mtimeMs });
    }
  };
  look(work);
  const last = specs.sort((a, b) => b.at - a.at)[0];
  writeFileSync(
    join(out, "run.json"),
    `${JSON.stringify({ seconds: Math.round((Date.now() - began) / 1000), turns: result.num_turns, cost: result.total_cost_usd, tools, specs: specs.length, model: model ?? "default" }, null, 1)}\n`,
  );
  if (!last) {
    console.log(`${name}: the agent built nothing (blind/answer.md says what it said)`);
    continue;
  }
  writeFileSync(join(out, "spec.json"), readFileSync(last.path));
  // built again, as the case's own spec is, by run.mjs's way: the report and the pictures beside it
  const again = spawnSync(process.execPath, [join(HERE, "run.mjs"), "--blind", name], { encoding: "utf8" });
  console.log(`${name}: ${calls.length} tool calls (${Object.entries(tools).map(([tool, n]) => `${tool.replace("mcp__smak__", "")} ${n}`).join(", ")}), ${result.num_turns} turns, ${Math.round((Date.now() - began) / 1000)} s; its spec built again: ${again.stdout.trim().split("\n")[0]}`);
  if (!keep) rmSync(folder, { recursive: true, force: true });
}
