// A blind session of a person making an asset with an agent through the MCP server, as docs/WORKFLOWS.md means
// it to go: a fresh maker that has only the server (as ~/stignored/smak-mcp/.mcp.json starts it, with the
// generators and the material library, but on a work folder of its own and without `run`), and a second agent
// playing the person, who has only a brief of what they want and the pictures the maker writes. Each turn of
// either is `claude -p`, continued with --resume, so both keep the conversation; the maker's turn ends where it
// stops to ask, which is what is being tested.
//
//   node examples/reproduce/session.mjs <case> [--turns 8] [--out dir] [--resume]
//
// --resume goes on from where <out>/session.json stopped, in the same work folder and the maker's same
// conversation (a session the harness ended wrongly: a character's four picture rounds are half an hour of GPU).
//
// Cases are in SESSIONS below. Writes <out>/session.json (every turn: what was said, the tools each maker turn
// called, the time, cost and tokens) and transcript.md, words only: the work folder (the maker's pictures, which
// may draw the game's models beside its own) is left in the temp folder it names and never copied here.
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { tmpdir } from "node:os";
import { KIT, HERE, GAME, SDHLT, STEAM } from "./lib.mjs";
import { MAKER_MODEL } from "./agents.mjs";

const GENERATORS = process.env.SMAK_GENERATORS || "/media/Data3/Packages/local-audio";
const MATERIALS = process.env.SMAK_MATERIALS || "/media/Data3/Packages/material-library";
/** The person runs on the makers' model too: Haiku unless told (cost first). */
const PERSON_MODEL = process.env.SMAK_PERSON_MODEL || MAKER_MODEL;

/** What each case's person says first, and the brief only they know. */
const SESSIONS = {
  prop: {
    request: "Make me a crate for my mod.",
    brief:
      "A wooden supply crate for a warehouse level of your Half-Life mod. About waist high, square. Worn and a bit dirty, " +
      "planks with metal corner brackets. No picture of one. It should look like it belongs beside Half-Life's own crates, " +
      "not like a cartoon. It will replace nothing: a new file name is fine.",
  },
  sound: {
    request: "I need a sound of a heavy metal door slamming shut.",
    brief:
      "For a big sliding steel door (a func_door) in your mod. One-shot, about a second long, heavy and dull with a short " +
      "rumble after the hit, not ringing like a bell and not echoing like a cathedral. A new file name is fine, under " +
      "sound/doors/. You cannot attach a reference.",
  },
  character: {
    request: "Make me a character: a security guard in a dark blue uniform.",
    brief:
      "It replaces Barney (barney.mdl) in your mod, so it keeps his skeleton and animations. Dark navy blue uniform shirt " +
      "and trousers, black boots, a dark blue cap, a silver badge on the left chest. Short dark hair, a plain face. " +
      "Realistic, in the style of Half-Life's own characters.",
  },
};

/** The flags the person's .mcp.json gives the server, on this session's work folder and without `run`. */
function serverArgs(work) {
  const args = [join(KIT, "mcp", "server.mjs"), "--work", work, "--no-run", "--models", GAME, "--wads", GAME];
  if (existsSync(SDHLT)) args.push("--compilers", SDHLT);
  for (const fgd of [join(STEAM, "Half-Life SDK/Hammer Editor/fgd/half-life/halflife.fgd"), join(SDHLT, "sdhlt.fgd")]) if (existsSync(fgd)) args.push("--fgd", fgd);
  if (existsSync(GENERATORS)) args.push("--generators", GENERATORS);
  if (existsSync(MATERIALS)) args.push("--materials", MATERIALS);
  return args;
}

/** One turn of `claude -p`: its words back, the tools it called, its session to continue, its cost. */
function turn({ cwd, prompt, resume, model, config, tools, allowed, hours = 0.75 }) {
  const args = ["-p", prompt, "--output-format", "stream-json", "--verbose", "--strict-mcp-config", "--mcp-config", config, "--model", model, "--tools", tools];
  if (allowed.length) args.push("--allowedTools", ...allowed);
  if (resume) args.push("--resume", resume);
  const began = Date.now();
  return new Promise((done) => {
    const child = spawn("claude", args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    const timer = setTimeout(() => child.kill("SIGTERM"), hours * 3600 * 1000);
    child.on("close", (status, signal) => {
      clearTimeout(timer);
      const messages = out.split("\n").flatMap((line) => {
        try {
          return [JSON.parse(line)];
        } catch {
          return [];
        }
      });
      const result = messages.find((m) => m.type === "result") ?? {};
      const calls = messages
        .filter((m) => m.type === "assistant")
        .flatMap((m) => m.message?.content ?? [])
        .filter((c) => c.type === "tool_use")
        .map((c) => ({ tool: c.name.replace(/^mcp__smak__/, ""), input: JSON.stringify(c.input).slice(0, 400) }));
      const failed = messages
        .filter((m) => m.type === "user")
        .flatMap((m) => m.message?.content ?? [])
        .filter((c) => c.type === "tool_result" && c.is_error).length;
      done({
        words: result.result ?? "",
        session: result.session_id ?? messages.find((m) => m.session_id)?.session_id,
        ended: result.subtype ?? (signal ? `stopped after ${hours} h` : `exit ${status}`),
        calls,
        failed,
        seconds: Math.round((Date.now() - began) / 1000),
        cost: result.total_cost_usd ?? 0,
        tokens: result.usage ? { input: result.usage.input_tokens, cacheWrite: result.usage.cache_creation_input_tokens, cacheRead: result.usage.cache_read_input_tokens, output: result.usage.output_tokens } : null,
        stderr: err.slice(-1000),
      });
    });
  });
}

/** The files of the work folder written since `since` (ms), as paths under it: what the person may look at. */
function newFiles(work, since) {
  const found = [];
  const look = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name === "node_modules") continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) look(p);
      else if (statSync(p).mtimeMs >= since) found.push(p);
    }
  };
  look(work);
  return found.sort();
}

const PERSON_RULES = (brief) =>
  [
    "You are a modder making a Half-Life mod, talking to an assistant that makes the asset for you. You are not an AI",
    "and know nothing of its tools. What you want (only you know this; say it only when asked, in your own words):",
    brief,
    "How you answer, every time:",
    "- Short and plain, a line or three, as a busy person types.",
    "- If it asks questions, answer them from what you want; if you do not care, say so.",
    "- If it shows you something, LOOK at the pictures with the Read tool first (the paths are listed under its message).",
    "  For a sound you cannot hear in this chat: judge by its picture and its numbers as best you can, as if listening.",
    "  Then either approve it, or give ONE note: the single most important thing that is off from what you want. Be",
    "  honest and somewhat picky: if it does not look like it belongs in Half-Life, say what is wrong.",
    "- If it has shown you nothing and asks nothing, ask to see what it has.",
    "- When you are happy with the finished asset, end your reply with the words ship it alone on its last line. Never",
    "  write those two words anywhere else, not even to say you will later.",
    "Write only your reply to the assistant, nothing else.",
  ].join("\n");

async function main() {
  const argv = process.argv.slice(2);
  const name = argv[0];
  const flag = (f, d) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : d);
  const most = Number(flag("--turns", 8));
  const kind = SESSIONS[name];
  if (!kind) throw new Error(`which case? ${Object.keys(SESSIONS).join(", ")}`);
  const date = new Date().toISOString().slice(0, 10);
  const out = flag("--out", join(HERE, "sessions", `${name}-${date}`));
  mkdirSync(out, { recursive: true });

  // a session taken up again: its folder, its turns and the two conversations as they were left
  const kept = argv.includes("--resume") ? JSON.parse(readFileSync(join(out, "session.json"), "utf8")) : null;
  const folder = kept?.folder ?? mkdtempSync(join(tmpdir(), "smak-session-"));
  const work = join(folder, "work");
  const people = join(folder, "person");
  mkdirSync(work, { recursive: true });
  mkdirSync(people, { recursive: true });
  const makerConfig = join(folder, "maker.json");
  writeFileSync(makerConfig, JSON.stringify({ mcpServers: { smak: { command: process.execPath, args: serverArgs(work) } } }));
  const personConfig = join(folder, "person.json");
  writeFileSync(personConfig, JSON.stringify({ mcpServers: {} }));
  const maker = { cwd: folder, model: MAKER_MODEL, config: makerConfig, tools: "", allowed: ["mcp__smak__*"] };
  const person = { cwd: people, model: PERSON_MODEL, config: personConfig, tools: "Read", allowed: [`Read(/${work}/**)`] };

  const log = kept?.turns ?? [];
  let makerSession = log.findLast((t) => t.who === "maker")?.session;
  let personSession = kept?.personSession;
  const save = () => {
    const total = log.reduce((sum, t) => sum + (t.cost || 0), 0);
    writeFileSync(join(out, "session.json"), `${JSON.stringify({ case: name, date: kept?.date ?? date, kit: process.env.SMAK_KIT_COMMIT ?? kept?.kit ?? null, makerModel: MAKER_MODEL, personModel: PERSON_MODEL, request: kind.request, brief: kind.brief, folder, personSession, cost: total, turns: log }, null, 1)}\n`);
    writeFileSync(join(out, "transcript.md"), [
      `# Session: ${name} (${kept?.date ?? date})`, "", `Maker ${MAKER_MODEL}, person ${PERSON_MODEL}. Reported cost $${total.toFixed(2)}.`, "", `Brief (the person's only): ${kind.brief}`, "",
      ...log.flatMap((t) => [
        `## ${t.who} ${t.n}${t.who === "maker" ? ` (${t.seconds} s, ${t.calls.length} calls${t.failed ? `, ${t.failed} failed` : ""}: ${t.calls.map((c) => c.tool).join(", ") || "none"})` : ""}`,
        "",
        t.words.trim(),
        ...(t.files?.length ? ["", `Files written: ${t.files.join(", ")}`] : []),
        "",
      ]),
    ].join("\n"));
  };
  // the go-ahead: "ship it" alone on the reply's last line. Matched anywhere it ended two sessions early ("don't ship
  // it until", "before I say ship it", 2026-10-18)
  const ships = (words) => /^\W*ship it\W*$/i.test(words.trim().split("\n").filter((line) => line.trim()).pop() ?? "");

  /** The person's answer to a maker's turn: the rules first in a new conversation (with what was said before, on a resume). */
  const answer = async (m) => {
    const shown = m.files.filter((f) => /\.(png|json|txt|gif)$/i.test(f) && !/(^|\/)(node_modules|\.)/.test(f));
    const before = !personSession && log.length > 2 ? `What was said so far:\n${log.slice(0, -1).map((t) => `${t.who === "maker" ? "Assistant" : "You"}: ${t.words.trim()}`).join("\n\n")}\n` : "";
    const prompt = [
      personSession ? "" : PERSON_RULES(kind.brief),
      before,
      "The assistant says:",
      m.words,
      shown.length ? `\nFiles it wrote that you can look at (Read them):\n${shown.map((f) => join(work, f)).join("\n")}` : "\n(It wrote no pictures this time.)",
    ].join("\n");
    const p = await turn({ ...person, prompt, resume: personSession });
    personSession ??= p.session;
    const said = p.words.trim() || "Show me what you have.";
    log.push({ who: "person", n: m.n, words: said, read: p.calls.length, seconds: p.seconds, cost: p.cost, tokens: p.tokens, ended: p.ended });
    save();
    process.stderr.write(`person ${m.n}: ${said.slice(0, 120).replace(/\n/g, " ")}\n`);
    return said;
  };

  let last = log.at(-1);
  if (!last) {
    last = { who: "person", n: 0, words: kind.request, cost: 0 };
    log.push(last);
  }
  // a resume that stopped after the maker spoke: the person answers that turn first
  let said = last.who === "maker" ? await answer(last) : last.words;
  let shipped = log.some((t) => t.who === "person" && ships(t.words));
  for (let n = last.n + 1; n <= most + (shipped ? 1 : 0); n++) {
    const since = Date.now();
    const m = await turn({ ...maker, prompt: said, resume: makerSession });
    makerSession ??= m.session;
    const files = newFiles(work, since).map((f) => relative(work, f));
    log.push({ who: "maker", n, ...m, files });
    save();
    process.stderr.write(`maker ${n}: ${m.seconds} s, ${m.calls.length} calls, $${m.cost.toFixed(2)}, ${m.ended}\n`);
    if (shipped || !m.words) break;
    said = await answer({ n, words: m.words, files });
    if (ships(said)) shipped = true;
  }
  save();
  process.stderr.write(`${out}\nwork folder ${work}\n`);
}

await main();
