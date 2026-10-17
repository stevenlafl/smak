// The tool `command`: any of the command line's commands (bin/smak.mjs), run as the command line runs them, on
// the server's folders. Every command and every flag the command line has, this server has, through the one
// program that has them: nothing is written twice.
//
// Files are named as the other tools name them: `work:<name>` (a bare name is the work folder's), `models:<name>`,
// `library:<name>`, and `game:<folder>` (or `game:<folder>/<path>`, a file in it) for one of the game folders the server was given (--wads). What a command
// writes (-o, --pictures) goes to the work folder only. A name outside the folders is refused before anything runs.
// Under --no-run, an argument that would load code (a .mjs or .js file, a `layers` expression) is refused.
import { join, basename } from "node:path";
import { existsSync } from "node:fs";
import { pathOf, filesUnder } from "./folders.mjs";
import { runNode, endedAnswer, TIMEOUT_SECONDS, TIMEOUT_MOST_SECONDS, SHOWN_MOST } from "./run.mjs";
import { KIT } from "./guide.mjs";

const CLI = join(KIT, "bin", "smak.mjs");
/** The flags whose value is something a command writes. */
const WRITES = new Set(["-o", "--out", "--pictures"]);
/** A name the server resolves: a folder's prefix. */
const NAMED = /^(work|models|library|game):/;
/** Commands that do not end by themselves (a page, a session), or that are the server: not run here. */
const NOT_HERE = { mcp: "this is the server", view: "a page that stays up: not a call", edit: "a page that stays up: not a call" };
/** What loads code, refused under --no-run: a module given as a file, a `layers` expression. */
const CODE = /\.(mjs|cjs|js)$/i;

/**
 * A game folder the server was given, by its name or its number in the list, or a path under one
 * (`game:valve/models/headcrab.mdl`): a maker that named a file so was told there were no game folders.
 */
function gameFolder(folders, which) {
  const games = folders.wads ?? [];
  const [head, ...rest] = which.split("/");
  const found = games.find((game) => basename(game) === head) ?? (/^\d+$/.test(head) ? games[Number(head)] : undefined);
  if (!found) throw new Error(`game:${which}: no game folder ${JSON.stringify(head)}; the server's are ${games.map((game, i) => `${i} ${basename(game)}`).join(", ") || "none (--wads)"}, named as game:<folder> or game:<folder>/<path under it>`);
  if (!rest.length) return found;
  if (rest.some((part) => part === ".." || part === "")) throw new Error(`game:${which}: a path under the folder, without ..`);
  const path = join(found, ...rest);
  if (!existsSync(path)) throw new Error(`game:${which}: not there (${rest.join("/")} under ${basename(found)})`);
  return path;
}

/** One word of the command's, with the names in it resolved to the server's folders; `out`: it is written to. */
function resolved(folders, word, { out, allowCode }) {
  if (!allowCode && CODE.test(word)) throw new Error(`${word}: a module is code, and this server runs no code (--no-run)`);
  if (word.startsWith("game:")) {
    if (out) throw new Error(`${word}: the game's folders are only read; write to the work folder`);
    return gameFolder(folders, word.slice("game:".length));
  }
  if (out) return pathOf(folders, word.startsWith("work:") ? word : `work:${word}`, { write: true });
  if (NAMED.test(word)) {
    try {
      return pathOf(folders, word);
    } catch (error) {
      try {
        return pathOf(folders, word, { folder: true });
      } catch {
        throw error;
      }
    }
  }
  // a word that is no name of the server's is passed as it is; one that reaches outside the folders is refused
  if (/^([/\\]|[a-z]:)/i.test(word) || /(^|[/\\])\.\.([/\\]|$)/.test(word)) throw new Error(`${word} is outside the models and work folders: refused. Name files as work:<name> or models:<name>`);
  return word;
}

/**
 * The tool: `name` a command of the command line, `args` its words and flags as the command line takes them
 * (`guide { topic: "The command line" }` lists them), with files named as above. Its answer: what it printed,
 * what it wrote, and the pictures it wrote (or those `show` names), up to SHOWN_MOST.
 */
export async function command(folders, { name, args = [], show, timeout }, { signal, allowCode = false } = {}) {
  if (typeof name !== "string" || !/^[a-z][a-z-]*$/.test(name)) throw new Error("name: a command of the command line (info, check, map-plan ...)");
  if (NOT_HERE[name]) throw new Error(`${name}: ${NOT_HERE[name]}`);
  if (!Array.isArray(args) || args.some((word) => typeof word !== "string")) throw new Error("args: the command's words, as strings");
  if (!allowCode && name === "layers" && args.some((word) => /=/.test(word))) throw new Error("layers: an expression is code, and this server runs no code (--no-run)");
  if (args.includes("--serve") || args.includes("--attach")) throw new Error(`${name}: a session that stays up is not a call`);
  const words = args.map((word, i) => resolved(folders, word, { out: WRITES.has(args[i - 1]), allowCode }));
  const seconds = Math.min(TIMEOUT_MOST_SECONDS, Math.max(1, Number(timeout) || TIMEOUT_SECONDS));
  const before = filesUnder(folders.work);
  const ended = await runNode([CLI, name, ...words], folders, seconds, signal);
  const after = filesUnder(folders.work);
  // the pictures it wrote, the newest first, unless the call names its own
  const was = new Map(before.map((file) => [file.name, file.stamp]));
  const drawn = after.filter((file) => /\.png$/i.test(file.name) && was.get(file.name) !== file.stamp).sort((a, b) => b.stamp - a.stamp).map((file) => file.name);
  return endedAnswer(ended, folders, { before, after, show: (show ?? drawn).slice(0, SHOWN_MOST) });
}
