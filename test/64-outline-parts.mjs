// What of each part a player sees (src/spec/outline-parts.mjs): a part that changes no outline at the size the
// game shows a model, and costs more triangles than Valve spends on such a piece, is warned of; one that changes
// the outline, or is a few flat triangles, is not.
import { test, sure } from "./helper.mjs";
import { outlineShares, UNSEEN_TRIS_MOST } from "../src/spec/outline-parts.mjs";
import { buildModelSpec } from "../src/spec/model.mjs";

const box = (mn, mx) => {
  const c = (i) => [i & 1 ? mx[0] : mn[0], i & 2 ? mx[1] : mn[1], i & 4 ? mx[2] : mn[2]];
  const faces = [[0, 1, 3, 2], [4, 6, 7, 5], [0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3]];
  return faces.flatMap(([a, b, d, e]) => [[c(a), c(b), c(d)], [c(a), c(d), c(e)]]);
};

test("outline: a part inside another covers nothing alone from any side; one standing out does", () => {
  const tris = [...box([0, 0, 0], [10, 10, 40]).map((p) => ({ p, part: "body" })), ...box([2, 2, 10], [8, 8, 20]).map((p) => ({ p, part: "inner" })), ...box([10, 4, 30], [16, 6, 32]).map((p) => ({ p, part: "arm" }))];
  const s = outlineShares(tris);
  sure(s.inner.most === 0 && s.inner.tris === 12, `buried: ${JSON.stringify(s.inner)}`);
  sure(s.arm.most > 10 && s.body.most > 100, `standing out: arm ${s.arm.most}, body ${s.body.most}`);
});

test("outline: a model spec warns of a costly part that changes no outline, and not of a cheap one or of one that shows", () => {
  const spec = (parts) => ({ spec: "smak.model/1", name: "o.mdl", kind: "prop", parts: [{ id: "block", kind: "box", size: [12, 12, 30], material: "wood" }, ...parts] });
  const said = (parts) => buildModelSpec(spec(parts)).report.warnings.filter((w) => /no outline from any side/.test(w));
  const ball = { kind: "superquadric", size: [3, 3, 3], material: "steel", at: [0, 0, 15] };
  const buried = said([{ id: "core", ...ball }]);
  sure(buried.length === 1 && /core \(\d+ triangles, buried in another part: nothing of it shows\)/.test(buried[0]) && Number(/core \((\d+)/.exec(buried[0])[1]) > UNSEEN_TRIS_MOST, buried.join(" | "));
  sure(!said([{ id: "plate", kind: "box", size: [1, 4, 4], material: "steel", at: [0, 0, 15] }]).length, "a box of 12 triangles inside is a cheap piece");
  sure(!said([{ id: "knob", ...ball, at: [0, 0, 32] }]).length, "a part on top changes the outline");
});
