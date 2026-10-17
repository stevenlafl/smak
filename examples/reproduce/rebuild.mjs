// A leg built again from the spec its maker left, on the kit as it is now, with no agent: what a change to the
// kit does to a result, for the price of a build and a judge. The last round's records are kept under
// <id>/<leg>/round-<n>/ first, as reproduce.mjs --again keeps them; spec.json, answer.md and run.json stay (they
// are still the maker's), and rebuilt.json says which kit built it again.
//
//   node examples/reproduce/rebuild.mjs subject:leg ...        models and maps (a map compiled with SDHLT)
//   then: node examples/reproduce/judge.mjs subject:leg ... --again
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, copyFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { HERE, SUBJECTS, GAME, SDHLT, STEAM, kitCommit, keepRound, filesOf } from "./lib.mjs";
import { toolsFor } from "../../mcp/tools.mjs";

const asked = process.argv.slice(2).map((a) => a.split(":"));
if (!asked.length) throw new Error("rebuild.mjs subject:leg ...: which legs to build again");
const kit = kitCommit();

for (const [id, leg] of asked) {
  const map = SUBJECTS.maps.find((m) => m.id === id);
  if (map) {
    await rebuildMap(map, leg);
    continue;
  }
  const subject = SUBJECTS.models.find((m) => m.id === id);
  if (!subject) throw new Error(`${id}: not a model or a map of subjects.json`);
  const out = join(HERE, id, leg);
  if (!existsSync(join(out, "spec.json"))) {
    console.log(`${id}:${leg}: no spec.json to build again`);
    continue;
  }
  // the work folder as the maker had it: the leg's pictures under pictures/, the spec beside them
  const work = mkdtempSync(join(tmpdir(), "smak-rebuild-"));
  mkdirSync(join(work, "pictures"));
  const input = join(HERE, id, "input");
  if (leg === "pictures") for (const f of readdirSync(input).filter((f) => f.endsWith(".png"))) copyFileSync(join(input, f), join(work, "pictures", f));
  copyFileSync(join(out, "spec.json"), join(work, "spec.json"));
  const build = toolsFor({ work }, { allowRun: false }).find((tool) => tool.name === "build");
  const answer = await build.call({ spec: "work:spec.json" });
  const said = answer.filter((piece) => piece.type === "text").map((piece) => piece.text).join("\n");
  const mdl = filesOf(work).newest((f) => f.name.endsWith(".mdl"))?.p;
  if (!mdl) {
    console.log(`${id}:${leg}: the spec did not build: ${said.split("\n").slice(0, 3).join(" | ")}`);
    continue;
  }
  // the round before kept whole; the maker's own records copied into it, and left where they are
  const n = keepRound(out, { move: ["judge.json", "built", "rebuilt.json"], copy: ["spec.json", "answer.md", "run.json"] });
  mkdirSync(join(out, "built"));
  copyFileSync(mdl, join(out, "built", `${id}.mdl`));
  writeFileSync(join(out, "rebuilt.json"), `${JSON.stringify({ kit, from: `round-${n}`, at: new Date().toISOString(), ok: said.startsWith("OK") }, null, 1)}\n`);
  console.log(`${id}:${leg}: built again on ${kit} (${said.split("\n")[0]}); the last round kept as round-${n}`);
}

/**
 * A map leg built again from its maker's spec, with no agent: the work folder as the maker had it (the leg's
 * drawings under pictures/, the spec), built by the MCP tool with the game's .wad folder, the compilers and the FGDs
 * the maker's server had; the .bsp, .map and .wad kept under the names reproduce.mjs keeps them.
 */
async function rebuildMap(map, leg) {
  const out = join(HERE, map.id, leg);
  if (!existsSync(join(out, "spec.json"))) {
    console.log(`${map.id}:${leg}: no spec.json to build again`);
    return;
  }
  const work = mkdtempSync(join(tmpdir(), "smak-rebuild-"));
  mkdirSync(join(work, "pictures"));
  const input = join(HERE, map.id, "input");
  if (leg !== "words") for (const f of readdirSync(input).filter((f) => f.endsWith(".png"))) copyFileSync(join(input, f), join(work, "pictures", f));
  copyFileSync(join(out, "spec.json"), join(work, "spec.json"));
  const fgd = [join(STEAM, "Half-Life SDK/Hammer Editor/fgd/half-life/halflife.fgd"), join(SDHLT, "sdhlt.fgd")].filter(existsSync);
  const folders = { work, models: null, wads: [GAME], compilers: existsSync(SDHLT) ? SDHLT : undefined, fgd, hide: [], refuse: [] };
  const build = toolsFor(folders, { allowRun: false }).find((tool) => tool.name === "build");
  const said = (await build.call({ spec: "work:spec.json" })).filter((piece) => piece.type === "text").map((piece) => piece.text).join("\n");
  const made = filesOf(work);
  const newest = (ext) => made.newest((f) => f.name.endsWith(ext))?.p;
  if (!newest(".bsp")) {
    console.log(`${map.id}:${leg}: the spec did not compile: ${said.split("\n").slice(0, 3).join(" | ")}`);
    return;
  }
  const n = keepRound(out, { move: ["judge.json", "built", "rebuilt.json"], copy: ["spec.json", "answer.md", "run.json"] });
  mkdirSync(join(out, "built"));
  for (const ext of [".bsp", ".map", ".wad"]) if (newest(ext)) copyFileSync(newest(ext), join(out, "built", `${map.id}_copy${ext}`));
  writeFileSync(join(out, "rebuilt.json"), `${JSON.stringify({ kit, from: `round-${n}`, at: new Date().toISOString(), ok: said.startsWith("OK"), report: said.split("\n").slice(0, 12) }, null, 1)}\n`);
  console.log(`${map.id}:${leg}: built again on ${kit} (${said.split("\n")[0]}); the last round kept as round-${n}`);
}
