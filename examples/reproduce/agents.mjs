// A fresh agent for one job: `claude -p` in an empty folder of its own, with only what the job allows (the
// SMAK MCP server, with or without the game's .wad folder; reading one folder of pictures), and nothing of
// this kit's folders, Valve's files or this session. Used by describe.mjs, reproduce.mjs and judge.mjs.
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, copyFileSync, readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { KIT, GAME, SDHLT, STEAM } from "./lib.mjs";

/**
 * Runs one agent. `prompt`; `read`: a folder it may read (pictures), or null; `server`: null, or { wads, games,
 * models, hide, refuse } (wads: true gives the game's folder for .wad textures and skeletons, with `games`, a
 * mod's folders, before it; models: a folder its tools may read, such as one holding a compiled map); `files`: { "path in the work folder": "file to copy there" }; `hours`. Resolves to { answer, seconds, turns, cost, error, work, folder }.
 */
// An agent given the MCP server is a maker, and runs on the makers' model unless told: every leg's script gets
// SMAK_MAKER_MODEL without passing it (the blueprint leg once ran on Opus when Haiku was asked). Judges and
// describers have no server and name their own.
export async function runAgent({ prompt, read = null, server = null, files = {}, hours = 1, model = server ? MAKER_MODEL ?? undefined : undefined }) {
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
    // a blind test's originals: fitted into but never shown (hide), or never read (refuse)
    for (const file of server.hide ?? []) extra.push("--hide", file);
    for (const file of server.refuse ?? []) extra.push("--refuse", file);
    // local generators (the tool generate): only when a leg gives them
    if (server.generators) extra.push("--generators", server.generators);
    if (server.materials) extra.push("--materials", server.materials);
    if (server.wads) {
      // a mod's game folder first (its models and skeletons), then Half-Life's
      for (const game of [...(server.games ?? []), GAME]) extra.push("--wads", game);
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
    model: model ?? "opus (the command's own)",
    answer: result.result ?? run.stderr ?? "(no answer)",
    // how the session ended (success, error_max_turns, error_during_execution...), and what it said on stderr
    ended: result.subtype ?? null,
    stderr: run.stderr.slice(-2000),
    seconds: Math.round((Date.now() - began) / 1000),
    turns: result.num_turns,
    cost: result.total_cost_usd,
    // what it used, as the session counts it: the CLI's cost under-reported Haiku 5.5 forty times over (round 8)
    tokens: result.usage ? { input: result.usage.input_tokens, cacheWrite: result.usage.cache_creation_input_tokens, cacheRead: result.usage.cache_read_input_tokens, output: result.usage.output_tokens } : null,
    error: run.error?.message ?? (run.status ? `exit ${run.status}` : null),
    work,
    folder,
  };
}

/**
 * A judge: runAgent until its answer holds a JSON object (or matches `accept`, for a judge asked for something
 * else: the line-up's one letter), three tries at most, a minute apart. A judge whose session ended with nothing
 * said (round 3 lost nine judgements so) is asked again, not scored as a fault.
 */
/**
 * The model the judges run on: Haiku unless SMAK_JUDGE_MODEL says otherwise (Steven, 2026-10-14: judging on Opus
 * cost a percent of his plan a minute). Scoring pictures against a fixed rubric, its numbers given, is a far
 * smaller task than building; calibrate.mjs measures how far its scores stand from Opus's on judged rounds.
 */
export const JUDGE_MODEL = process.env.SMAK_JUDGE_MODEL || "haiku";

/**
 * The model the makers run on: Haiku, Steven's choice for every round (2026-10-15: "it makes sense to continue
 * haiku"), unless SMAK_MAKER_MODEL names another for a question about the maker. It was the claude command's own
 * (Opus) unless told, and a sprite round forgot to tell it: $6.53 of Opus where Haiku was meant.
 */
export const MAKER_MODEL = process.env.SMAK_MAKER_MODEL || "haiku";

/**
 * The must-have items a measurement already holds under 2: an asset with any fails whatever a judge says, so no
 * judge is asked (unless SMAK_JUDGE_ALL is set) and the result says which measure failed it.
 */
export function failedByMeasure(caps, must) {
  if (process.env.SMAK_JUDGE_ALL) return [];
  return must.filter((item) => caps[item] !== undefined && caps[item] !== null && caps[item] < 2);
}

/** Where a judge's answers are kept by what it was asked: the same prompt and pictures, the same answer. */
const JUDGED = join(KIT, "examples", "reproduce", ".judged");
/** A key for a judge's question: its model, its prompt and every picture of the folder it reads. */
function judgedKey(options) {
  const hash = createHash("sha256").update(JUDGE_MODEL).update(options.model ?? "").update(options.prompt ?? "");
  // a second or third judge of the same work is a draw of its own (assets.mjs --judges); the first keeps the key it had
  if (options.draw) hash.update(`draw ${options.draw}`);
  const look = (dir) => {
    if (!dir || !existsSync(dir)) return;
    for (const e of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = join(dir, e.name);
      if (e.isDirectory()) look(p);
      else if (/\.png$/i.test(e.name)) hash.update(e.name).update(readFileSync(p));
    }
  };
  look(options.read);
  return hash.digest("hex");
}

export async function runJudge(options) {
  const key = judgedKey(options);
  const kept = join(JUDGED, `${key}.json`);
  if (existsSync(kept)) return { ...JSON.parse(readFileSync(kept, "utf8")), reused: true };
  let last;
  for (let attempt = 1; attempt <= 3; attempt++) {
    last = await runAgent({ model: JUDGE_MODEL, ...options });
    if ((options.accept ?? /\{[\s\S]*\}/).test(last.answer ?? "")) {
      mkdirSync(JUDGED, { recursive: true });
      writeFileSync(kept, JSON.stringify({ answer: last.answer, ended: last.ended, model: options.model ?? JUDGE_MODEL }));
      return { ...last, attempts: attempt };
    }
    if (attempt < 3) await new Promise((wake) => setTimeout(wake, 60_000));
  }
  return { ...last, attempts: 3 };
}
