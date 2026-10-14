// Every worked case's spec built again, with no agent, on a given copy of the kit: what a change to the kit does to
// all of them at once, not to the few it was made for. Each spec (spec.json, blind/spec.json, revisions/*.json) is
// built into <out>/<case>/<file>/, and <out>/summary.json holds, per spec: whether it built, its faults and
// warnings (the sentences, numbers taken out, so two kits' can be set side by side), and the report's facts.
//
//   node examples/prompts/rebuild-all.mjs <out folder> [--kit <folder of a smak checkout>] [--compilers <folder>]
//          [--game <folder>] [--only <case word>]
//   node examples/prompts/rebuild-all.mjs --compare <summary a.json> <summary b.json>
//
// A kit from another commit: `git worktree add <folder> <commit>`, then --kit <folder>.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);

if (args[0] === "--compare") {
  const [a, b] = [args[1], args[2]].map((f) => JSON.parse(readFileSync(f, "utf8")));
  const names = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
  const words = (list) => new Set((list ?? []).map((line) => line.replace(/-?\d+(\.\d+)?/g, "#").slice(0, 90)));
  let changed = 0;
  for (const name of names) {
    const [x, y] = [a[name], b[name]];
    if (!x || !y) {
      console.log(`${name}: only in ${x ? "the first" : "the second"}`);
      continue;
    }
    const lines = [];
    if (x.built !== y.built) lines.push(`built: ${x.built} -> ${y.built}${y.error ? ` (${y.error})` : ""}`);
    for (const [kind, label] of [["faults", "fault"], ["warnings", "warning"]]) {
      const [before, after] = [words(x[kind]), words(y[kind])];
      for (const w of after) if (!before.has(w)) lines.push(`+ ${label}: ${w}`);
      for (const w of before) if (!after.has(w)) lines.push(`- ${label}: ${w}`);
    }
    if (lines.length) {
      changed++;
      console.log(`${name}\n  ${lines.join("\n  ")}`);
    }
  }
  console.log(`${changed} of ${names.length} specs changed`);
  process.exit(0);
}

const out = resolve(args[0] ?? "rebuilt");
const kit = resolve(option("--kit") ?? join(HERE, "..", ".."));
const only = option("--only");
const { buildModelSpec } = await import(pathToFileURL(join(kit, "src", "spec", "model.mjs")).href);
const { buildMapSpec } = await import(pathToFileURL(join(kit, "src", "spec", "map.mjs")).href);
const { findCompilers } = await import(pathToFileURL(join(kit, "src", "maps", "compile.mjs")).href);
const compilers = option("--compilers") ? findCompilers({ folder: option("--compilers") }) : { found: false, message: "not asked" };
const game = option("--game");

const specs = [];
for (const name of readdirSync(HERE).filter((n) => statSync(join(HERE, n)).isDirectory()).sort()) {
  if (only && !name.includes(only)) continue;
  const dir = join(HERE, name);
  for (const f of ["spec.json", "blind/spec.json"]) if (existsSync(join(dir, f))) specs.push(join(dir, f));
  if (existsSync(join(dir, "revisions"))) for (const f of readdirSync(join(dir, "revisions")).filter((f) => f.endsWith(".json")).sort()) specs.push(join(dir, "revisions", f));
}

const summary = {};
mkdirSync(out, { recursive: true });
for (const file of specs) {
  const name = relative(HERE, file);
  let spec;
  try {
    spec = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    continue;
  }
  const where = join(out, name.replace(/[\\/]/g, "__").replace(/\.json$/, ""));
  mkdirSync(where, { recursive: true });
  const started = Date.now();
  try {
    let report;
    if (spec.spec === "smak.map/1") report = buildMapSpec(spec, { out: where, folder: dirname(file), compilers, wads: game ? [game, dirname(file)] : [dirname(file)] }).report;
    else if (spec.spec === "smak.model/1") {
      const built = buildModelSpec(spec, { folder: dirname(file), games: game ? [game] : [] });
      report = built.report;
      if (built.mdl) writeFileSync(join(where, spec.name ?? "model.mdl"), built.mdl);
    } else continue;
    summary[name] = { built: report.errors.length === 0, errors: report.errors, faults: report.faults ?? [], warnings: report.warnings ?? [], facts: report.facts ?? [], seconds: Math.round((Date.now() - started) / 1000) };
  } catch (error) {
    summary[name] = { built: false, error: error.message.split("\n")[0] };
  }
  const s = summary[name];
  console.log(`${name}: ${s.built ? "built" : `NOT built${s.error ? ` (${s.error})` : ""}`}, ${s.faults?.length ?? "-"} faults, ${s.warnings?.length ?? "-"} warnings, ${s.seconds ?? "-"} s`);
  writeFileSync(join(out, "summary.json"), `${JSON.stringify(summary, null, 1)}\n`);
}
