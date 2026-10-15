// Run: node research/layout-ab.mjs <out folder>. The held test's inputs (Valve's pictures) stay out of git.
// The four characters' pictures specs built twice, the six-side grid against view charts, on the kit as it is.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const K = "/media/Data3/Packages/smak";
const { buildModelSpec } = await import(`${K}/src/spec/model.mjs`);
const { unpicture, sheet, png } = await import(`${K}/src/index.mjs`);
const games = ["/media/Data1/SteamLibrary/steamapps/common/Half-Life/valve"];
for (const id of ["barney", "scientist", "zombie", "houndeye"]) {
  const d = `${K}/examples/reproduce/held/characters/${id}`;
  const spec = JSON.parse(readFileSync(`${d}/pictures/spec.json`));
  const readPicture = (name) => unpicture(readFileSync(join(`${d}/input`, name.replace(/^(work:)?pictures\//, "").replace(/^work:/, ""))));
  for (const layout of ["sides", "charts"]) {
    const s = { ...spec, parts: spec.parts.map((p) => (["carved", "blob", "mesh"].includes(p.kind) ? { ...p, layout } : p)) };
    const r = buildModelSpec(s, { folder: `${d}/input`, games, readPicture, refuse: [`${id}.mdl`] });
    const look = r.report.facts.find((f) => /its look against each picture/.test(f)) ?? r.report.errors.join(";").slice(0, 200);
    console.log(id, layout, r.report.ok, look.slice(0, 260), r.report.faults.join("; ").slice(0, 300));
    if (r.mdl) { const sh = sheet(r.mdl, { seq: 0 }); writeFileSync(`${process.argv[2]}/${id}-${layout}.png`, png(sh.width, sh.height, sh.rgba)); }
  }
}
