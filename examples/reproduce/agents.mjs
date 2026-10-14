// A fresh agent for one job: `claude -p` in an empty folder of its own, with only what the job allows (the
// SMAK MCP server, with or without the game's .wad folder; reading one folder of pictures), and nothing of
// this kit's folders, Valve's files or this session. Used by describe.mjs, reproduce.mjs and judge.mjs.
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { KIT, GAME, SDHLT, STEAM } from "./lib.mjs";

/**
 * Runs one agent. `prompt`; `read`: a folder it may read (pictures), or null; `server`: null, or { wads, models }
 * (wads: true gives the game's folder for .wad textures; models: a folder its tools may read, such as one
 * holding a compiled map); `files`: { "path in the work folder": "file to copy there" }; `hours`. Resolves to { answer, seconds, turns, cost, error, work, folder }.
 */
export async function runAgent({ prompt, read = null, server = null, files = {}, hours = 1, model }) {
  const folder = mkdtempSync(join(tmpdir(), "smak-repro-"));
  const work = join(folder, "work");
  mkdirSync(work);
  for (const [to, from] of Object.entries(files)) {
    mkdirSync(dirname(join(work, to)), { recursive: true });
    copyFileSync(from, join(work, to));
  }
  const args = ["-p", prompt, "--output-format", "json", "--strict-mcp-config"];
  const allowed = [];
  if (server) {
    const extra = ["--work", work, "--no-run"];
    if (server.models) extra.push("--models", server.models);
    if (server.wads) {
      extra.push("--wads", GAME);
      if (existsSync(SDHLT)) extra.push("--compilers", SDHLT);
      for (const fgd of [join(STEAM, "Half-Life SDK/Hammer Editor/fgd/half-life/halflife.fgd"), join(SDHLT, "sdhlt.fgd")]) if (existsSync(fgd)) extra.push("--fgd", fgd);
    }
    const config = join(folder, "mcp.json");
    writeFileSync(config, JSON.stringify({ mcpServers: { smak: { command: process.execPath, args: [join(KIT, "mcp", "server.mjs"), ...extra] } } }));
    args.push("--mcp-config", config);
    allowed.push("mcp__smak__*");
  } else {
    const config = join(folder, "mcp.json");
    writeFileSync(config, JSON.stringify({ mcpServers: {} }));
    args.push("--mcp-config", config);
  }
  // no shell, no writing, no web: reading the one folder of pictures at most
  args.push("--tools", read ? "Read" : "");
  if (read) allowed.push(`Read(/${read}/**)`);
  if (allowed.length) args.push("--allowedTools", ...allowed);
  if (model) args.push("--model", model);
  const began = Date.now();
  const run = await new Promise((done) => {
    const child = spawn("claude", args, { cwd: folder, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    const timer = setTimeout(() => child.kill("SIGTERM"), hours * 3600 * 1000);
    child.on("close", (status, signal) => {
      clearTimeout(timer);
      done({ stdout, stderr, status, error: signal ? { message: `stopped (${signal}) after ${hours} h` } : null });
    });
  });
  let messages = [];
  try {
    messages = [JSON.parse(run.stdout)].flat();
  } catch {}
  const result = messages.find((m) => m.type === "result") ?? {};
  return {
    answer: result.result ?? run.stderr ?? "(no answer)",
    seconds: Math.round((Date.now() - began) / 1000),
    turns: result.num_turns,
    cost: result.total_cost_usd,
    error: run.error?.message ?? (run.status ? `exit ${run.status}` : null),
    work,
    folder,
  };
}
