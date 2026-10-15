// Props that look as GoldSrc's do: a crown of crossed cards wearing leaves with holes between them (a masked
// texture), and a model's pictures held to Valve's models' (look.mjs, VALVE_MODELS): a clean white fridge and toy
// colours are told, as a Xash3D developer told them of the kit's furniture (2026-10-15: "like The Sims").
import { test, sure } from "./helper.mjs";
import { buildModelSpec } from "../src/spec/model.mjs";
import { readMdl, textureOf } from "../src/index.mjs";

test("cards: crossed sheets through a crown, both sides, a masked picture of leaves with holes that fade to its edge", () => {
  const { report, mdl } = buildModelSpec({ spec: "smak.model/1", name: "tree.mdl", kind: "prop", parts: [
    { id: "trunk", kind: "cylinder", radius: 2, height: 60, material: "darkwood" },
    { id: "crown", kind: "cards", size: [48, 40, 36], count: 4, attach: { to: "trunk", toAt: "top", at: "centre" } },
  ] });
  sure(report.ok, [...report.errors, ...report.faults].join("; "));
  const info = readMdl(mdl);
  const leaves = info.textures.find((t) => t.flags & 64);
  sure(leaves, `a masked texture: ${info.textures.map((t) => `${t.name} ${t.flags}`).join(", ")}`);
  const t = textureOf(mdl, leaves.name);
  const holes = t.pixels.filter((p) => p === 255).length / t.pixels.length;
  sure(holes > 0.3 && holes < 0.95, `${Math.round(holes * 100)}% of the leaves' picture is holes`);
  // the crown's box: as wide as its size, its top near the trunk's top plus half the crown
  const crown = report.parts.crown;
  sure(crown && Math.abs(crown.to[0] - crown.from[0] - 48) < 1 && Math.abs(crown.to[2] - crown.from[2] - 36) < 1, JSON.stringify(crown));
  // scattered: smaller cards inside the crown
  const scattered = buildModelSpec({ spec: "smak.model/1", name: "bush.mdl", kind: "prop", parts: [{ id: "bush", kind: "cards", size: [40, 40, 24], count: 10, card: [16, 12], tilt: 40 }] });
  sure(scattered.report.ok, [...scattered.report.errors, ...scattered.report.faults].join("; "));
  const bad = buildModelSpec({ spec: "smak.model/1", name: "b.mdl", kind: "prop", parts: [{ id: "b", kind: "cards", size: [4, 4], count: 1 }] });
  sure(bad.report.errors.some((e) => /size: \[x, y, z\]/.test(e)) && bad.report.errors.some((e) => /count: how many cards/.test(e)), bad.report.errors.join(" | "));
});

test("a model's pictures against Valve's models: near white and toy colours warned of, a used grey not", () => {
  const box = (tone) => buildModelSpec({ spec: "smak.model/1", name: "fridge.mdl", kind: "prop", finish: false, parts: [{ id: "body", kind: "box", size: [30, 28, 66], material: { base: "paint", tone } }] });
  const white = box([0.92, 0.92, 0.9]);
  sure(white.report.warnings.some((w) => /look unlike nine in ten of Valve's models': \S+ \d+% near white/.test(w)), white.report.warnings.join(" | "));
  const toy = box([0.9, 0.1, 0.1]);
  sure(toy.report.warnings.some((w) => /\d+% strongly coloured/.test(w)), toy.report.warnings.join(" | "));
  // a used grey is not near white; flat paint with no finish is still told it has little grain (a toy's surface)
  const used = box([0.55, 0.55, 0.52]);
  sure(!used.report.warnings.some((w) => /near white|strongly coloured/.test(w)) && used.report.warnings.some((w) => /little grain/.test(w)), used.report.warnings.join(" | "));
});
