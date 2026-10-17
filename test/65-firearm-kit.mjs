// The firearm kit: its presets built whole and sound, at real sizes and in GoldSrc's budget; a part left out;
// an outline that crosses itself refused; in a weapon's files its stock kept out of first person; and the fit
// that lays a piece knowing its up and front the right way round where its outline cannot choose.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as smak from "../src/index.mjs";
import { firearm, FIREARM_PRESETS } from "../kits/firearmkit.mjs";
import { buildModelSpec } from "../src/spec/model.mjs";
import { shapeSoundness } from "../src/sound.mjs";
import { bestTurn } from "../src/fit.mjs";
import { test, sure, tmp } from "./helper.mjs";

const boxOf = (tris) => {
  const points = tris.flat().map((c) => c.p);
  return [0, 1, 2].map((k) => Math.max(...points.map((p) => p[k])) - Math.min(...points.map((p) => p[k])));
};

test("the firearm kit: each preset a sound gun at its real size, in a first-person weapon's budget", () => {
  // real sizes (length, height): a Glock 17 7.3 by 5.4, a pump shotgun about 40, an MP5 with its stock about 24
  const sizes = { pistol: [[7, 9], [5, 6]], shotgun: [[36, 46], [5, 8]], smg: [[20, 27], [8, 11]], rifle: [[28, 38], [8, 11]] };
  for (const preset of Object.keys(FIREARM_PRESETS)) {
    const piece = firearm({ preset });
    const [length, , height] = boxOf(piece.tris);
    sure(length >= sizes[preset][0][0] && length <= sizes[preset][0][1] && height >= sizes[preset][1][0] && height <= sizes[preset][1][1], `${preset}: ${length.toFixed(1)} long, ${height.toFixed(1)} high`);
    // Valve's first-person guns are 276 to 363 triangles without the hands
    sure(piece.tris.length >= 150 && piece.tris.length <= 450, `${preset}: ${piece.tris.length} triangles`);
    sure(piece.image.width === 1024 && piece.image.height === 512, `${preset}: a 1024x512 picture`);
    const names = piece.parts.flatMap((part) => new Array(part.triangles).fill(part.name));
    sure(names.length === piece.tris.length, `${preset}: every triangle in a part`);
    const sound = shapeSoundness(piece.tris.map((t, i) => ({ p: t.map((c) => c.p), name: names[i] })));
    sure(!sound.faults.length, `${preset}: ${sound.faults.join(" | ")}`);
    sure(["receiver", "guard", "trigger"].every((name) => piece.parts.some((part) => part.name === name)), `${preset}: ${piece.parts.map((p) => p.name)}`);
  }
  const plain = firearm({ preset: "smg", stock: false, magazine: { kind: "straight" } });
  sure(!plain.parts.some((part) => part.name === "stock") && !plain.views.stock, "a part given false is left out");
  sure(firearm({ preset: "shotgun" }).views.stock.join() === "p,w", "a stock is left out of first person, as Valve's are");
  sure(firearm({ preset: "shotgun", stock: { firstPerson: true } }).views.stock === undefined, "unless told");
  const refused = (options, pattern) => {
    try {
      firearm(options);
    } catch (error) {
      return pattern.test(error.message);
    }
    return false;
  };
  sure(refused({ preset: "shotgun", stock: { wrist: -6 } }, /the stock's outline crosses itself/), "an outline that crosses itself is refused");
  sure(refused({ preset: "pistol", grip: { depth: -2 } }, /grip\.depth: a size, a number over 0/), "a size under 0 is refused");
  sure(refused({ preset: "musket" }, /no preset "musket": pistol, shotgun, smg, rifle/), "an unknown preset is refused");
  sure(refused({ preset: "pistol", finish: "gold" }, /no finish "gold"/), "an unknown finish is refused");
});

test("the firearm kit: a whole gun made a length, and an option it does not have refused in words", () => {
  const span = (piece) => { const xs = piece.tris.flatMap((t) => t.map((c) => c.p[0])); return Math.max(...xs) - Math.min(...xs); };
  sure(Math.abs(span(firearm({ preset: "pistol", length: 10 })) - 10) < 1e-6, "a pistol made 10 long");
  let said = "";
  try {
    firearm({ preset: "pistol", size: [10, 1.2, 5.5] });
  } catch (error) {
    said = error.message;
  }
  sure(/no option "size".*the whole gun's length is `length`/.test(said), said);
});

test("a weapon spec names the firearm kit: its stock left out of the first-person file", () => {
  const folder = join(tmp, "firearm-kit");
  mkdirSync(folder, { recursive: true });
  // a stand-in for a game's files: a gun of the kit's own on a hand, a glove beside it in first person
  const old = firearm({ preset: "shotgun" });
  const texture = smak.indexed(smak.shrink(old.image, 8), "gun.bmp");
  const gun = { tris: old.tris.map((t) => t.map((c) => ({ ...c, bone: "hand" }))), texture };
  const W = smak.workshop;
  const M = W.shape(64, 64);
  M.lathe([[-3, 1.5], [0, 1.5]], { x: 0, y: 0, w: 64, h: 64 }, { sides: 6, caps: [true, true] });
  const glove = { tris: M.tris.map((t) => t.map((c) => ({ ...c, bone: "hand" }))), texture: smak.indexed(W.sheet(64, 64).image(), "rubbergloveCHROME.bmp") };
  const fileOf = (meshes) =>
    smak.buildMdl({
      name: "x.mdl",
      bones: [{ name: "hand", parent: -1 }],
      bodyparts: [{ name: "studio", models: [{ name: "gun_reference", meshes }] }],
      sequences: [{ name: "idle", fps: 10, frames: [[[0, 0, 0, 0, 0, 0]]] }],
    });
  writeFileSync(join(folder, "v_boomstick.mdl"), fileOf([glove, gun]));
  writeFileSync(join(folder, "p_boomstick.mdl"), fileOf([gun]));
  const spec = { spec: "smak.model/1", name: "pump.mdl", kind: "held", weapon: { like: "boomstick", views: ["v", "p"] }, parts: [{ id: "gun", kind: "kit:firearm", options: { preset: "shotgun" } }] };
  const { report, files } = buildModelSpec(spec, { folder });
  sure(report.ok && files.length === 2, [...report.errors, ...report.faults].join("; "));
  const weaponTris = (name) => smak.readMdl(files.find((f) => f.name === name).mdl).bodyparts[0].models[0].meshes.filter((m) => /^pump_/.test(m.texture?.name ?? "")).reduce((n, m) => n + m.numtris, 0);
  const stock = old.parts.find((part) => part.name === "stock").triangles;
  sure(weaponTris("v_boomstick.mdl") === old.tris.length - stock, `first person without the stock: ${weaponTris("v_boomstick.mdl")} of ${old.tris.length} (${stock} the stock's)`);
  sure(weaponTris("p_boomstick.mdl") > weaponTris("v_boomstick.mdl") * 0.5, `in the hands, with it: ${weaponTris("p_boomstick.mdl")}`);
  sure(report.parts["gun.stock"]?.tris === stock && report.parts["gun.receiver"], `the kit's own parts are told: ${Object.keys(report.parts).join(", ")}`);
  sure(/p_boomstick\.mdl[^\n]*laid as drawn/.test(report.facts.join("\n")), `laid as drawn on its own outline: ${report.facts.filter((f) => /laid/.test(f)).join(" | ")}`);
  // with the game's files in a game folder, a file of that name beside the spec (a copy of a build's own, here
  // a glove with no gun) is not the one fitted to
  const game = join(tmp, "firearm-game");
  mkdirSync(join(game, "models"), { recursive: true });
  writeFileSync(join(game, "models", "v_boomstick.mdl"), fileOf([glove, gun]));
  writeFileSync(join(game, "models", "p_boomstick.mdl"), fileOf([gun]));
  writeFileSync(join(folder, "v_boomstick.mdl"), fileOf([glove]));
  const fromGame = buildModelSpec(spec, { folder, games: [game] });
  sure(fromGame.report.ok && fromGame.files.length === 2, `the game's own fitted to: ${[...fromGame.report.errors, ...fromGame.report.faults].join("; ")}`);
  // each file at the share of life the game draws this very weapon at, against in another's hands: the stand-in
  // draws its gun at one length in both, so the first person is 0.82 too, not the guns' median 1.24
  sure(fromGame.report.facts.some((f) => /a weapon at its real size is laid in each at v_ 0\.82, p_ 0\.82 of life/.test(f)), fromGame.report.facts.filter((f) => /drawn/.test(f)).join(" | "));
});

test("upright: a piece that knows its up and front keeps them where its outline cannot choose, and only there", () => {
  const piece = firearm({ preset: "shotgun" }).tris;
  const way = (fit, v) => {
    const a = fit.at([0, 0, 0]);
    const b = fit.at(v);
    return [0, 1, 2].map((k) => b[k] - a[k]);
  };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  // a plain bar: every turn of the gun follows its outline as well
  const W = smak.workshop;
  const M = W.shape(64, 64);
  M.lathe([[-20, 1], [20, 1]], { x: 0, y: 0, w: 64, h: 64 }, { sides: 4, caps: [true, true] });
  const bar = M.tris;
  const drawn = bestTurn(piece, bar, false, "as drawn");
  const upright = bestTurn(piece, bar, false, "upright");
  sure([[1, 0, 0], [0, 0, 1]].every((v) => dot(way(upright, v), way(drawn, v)) > 0), `on a bar it keeps the way it was drawn: ${upright.name}`);
  // the gun itself, turned end for end: where the outline chooses, upright never lays it worse than the free fit
  const turned = piece.map((t) => t.map((c) => ({ ...c, p: [-c.p[0], -c.p[1], c.p[2]] })));
  const free = bestTurn(piece, turned, false, null);
  const kept = bestTurn(piece, turned, false, "upright");
  sure(kept.left <= free.left + 1e-9, `where the outline chooses, no worse: ${kept.name} ${kept.left.toFixed(3)} for ${free.name} ${free.left.toFixed(3)}`);
});
