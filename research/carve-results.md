# Carved hulls in Node: results

Written 2026-10-14. What `src/spec/carve.mjs` (a shape carved from its outlines) and `src/qem.mjs` (the reducer)
give on the reproduction subjects, measured as the judge measures. The methods are in
`research/repeated-failures.md` section 1 and `research/3d-fidelity-methods.md` section 1; this is the Node
build of what the Python experiments there (Table 4) tried with pymeshlab.

Abbreviations: QEM (quadric error metric, Garland and Heckbert's mesh reducer), IoU (intersection over union),
M1 (the rubric's silhouette overlap: `silhouettes()` in `examples/reproduce/lib.mjs`, the outline seen along
each axis, each centred on its own box, at true scale).

## The short version

- Carved from the six sides of the input sheet at 64 cells on the long side and reduced to the original's own
  triangle count, every subject but the forklift scores M1 0.93 or better on every axis. The headcrab, barney
  and the houndeye are at 0.95 to 0.99; round 1's best headcrab was 0.746.
- Carving with the four angle pictures as well changes M1 little (it cannot: M1 looks along the axes the sides
  already fix) but takes the angle-view overlap from 0.72 to 0.96 on the headcrab, 0.74 to 0.98 on barney and
  0.82 to 0.98 on the houndeye: the extra volume between legs and under arms goes. Those are the views it was
  carved from, so it is consistency, not a held-out test.
- The forklift needs a finer grid: its fork tips, mast rails and cage are thinner than a cell at 64 (2.9 units)
  and go. At 192 cells it is M1 0.89 to 0.98 at 1x and 2x, against 0.88 at 300 voxels in the Python experiment,
  in about 20 seconds.
- One 512-dot sheet of sides and a size are enough input. The outline's place comes from the sheet itself; no
  camera is fitted.
- What it cannot do is in "Limits" below: hollows no outline sees, holes seen edge on, parts thinner than a cell.

## What was built

**`reduce(tris, { target, keepBoundary, creaseAngle, stages })`** in `src/qem.mjs`. Corners at one point are
welded into vertices; each face's plane is a quadric on its corners, weighed by area; edges are joined cheapest
first from a heap (stale entries skipped by a stamp on each vertex). A join is refused when it breaks the link
condition, would turn a face over (less than 0.2 cosine with its old facing) or flatten a closed piece of four
corners, or joins two border vertices across the inside. Open borders, and creases past `creaseAngle`, are held by
upright planes weighed 1000 times a face. `stages` (the default) joins in rounds that each halve the count, the
planes measured again at each round's start. The end nearer the joined point survives, so a corner that stays
keeps the fields it carried (texture place, bone).

Staged against one round, on the hulls of the table (same input, reduced both ways):

| Subject | Triangles | Staged M1 (front, side, top) | One round M1 |
| --- | --- | --- | --- |
| headcrab | 478 | 0.975, 0.951, 0.957 | 0.975, 0.952, 0.955 |
| barney | 784 | 0.971, 0.975, 0.967 | 0.952, 0.972, 0.953 |
| forklift (192 cells) | 1498 | 0.970, 0.948, 0.958 | 0.971, 0.854, 0.958 |
| forklift (192 cells) | 748 | 0.952, 0.869, 0.968 | 0.954, 0.732, 0.907 |

Staging matters where thin parts are many (the forklift's side, 0.73 to 0.87 at 1x); elsewhere it is even.

**`carve(views, { size, cells, target, smooth })`** in `src/spec/carve.mjs`:

1. A grid of cells over the thing's box (`size`, centred on x and y, from z 0), 64 on the long side unless told.
   A cell stays when its middle is inside every view's outline.
2. A view along an axis has its outline's box stretched onto the box seen that way, as `project.mjs` puts a
   picture on a model. A view at an angle takes its scale from those (one sheet is one scale) and its middle from
   `centre` (the middle of its picture, where the kit's sheets put the middle of the thing), else from the hull
   carved so far.
3. A view and the one opposite it are one outline: a cell is cut only when both leave it out. The kit draws faces
   from their front only, so a side no face turns to shows less than the thing: the battery's open bottom is a
   ring from below, and the medkit's underside is empty. Carved alone, the ring bored a hole down the battery
   (top/below 0.556); with its opposite, 1.000. A view that shows nothing is left out and named in
   `report.empty`.
4. The surface by marching tetrahedra over the cells' middles (six tetrahedra a cube about its long diagonal):
   closed, every edge between two faces, facing out by construction.
5. Each surface point is moved along its edge to where the outlines cross it, by eight halvings. This was the
   largest single gain: on midpoints the barney hull was 0.84 to 0.89; refined, 0.96 to 0.98.
6. Eight rounds of Taubin smoothing, each point kept within a quarter cell of where the outlines put it, then
   `reduce` to `target`.
7. `report.overlapByView` gives the result's outline against each mask, in the mask's own dots.

**`masksFromPicture(picture, area, rect)`** and **`sheetViews(picture)`**. The area's border says what the ground
is. When 95 in 100 of its dots are one colour (a picture the kit drew), every dot farther than 2 from it is the
thing; otherwise `foregroundOf`'s 14. The finer rule was needed: the filing cabinet is grey on the grey ground
and `foregroundOf` read half its body as background (a carved cabinet of 1,800 triangles at M1 0.63). Holes
inside the outline are filled, except, in a drawn picture, patches of the ground's own colour larger than a
speck: those are holes through the thing. A caption in the top left corner is dropped.

## The experiment

Inputs as the pictures leg gets them: `examples/reproduce/<id>/input/sides.png` (six sides, 512 dots each, one
scale), the four angle pictures beside it, and the size from `size.txt` or `facts.txt` (rounded to 0.1 unit).
Originals read in place from `~/.steam/steam/steamapps/common/Half-Life/valve/models`. Each hull built into a
one-bone model with `buildMdl` and a flat 16 by 16 texture, `smooth: 80`, and measured with the judge's
`silhouettes(original, copy)`. "Angle IoU" is the mean outline IoU over the four angle views (yaw 35, -35, 145,
215 at pitch 20), each model drawn about its own box's middle at the original's scale. "Surface" is the triangle
count before reducing. Time is the carve and the reduce together, on this machine while other work ran on it
(a second run differed by up to 2x).

### Table 1: carved hulls at 1x and 2x the original's triangles

| Subject | Cells | Views | Triangles | M1 front/back | M1 left/right | M1 top/below | Angle IoU | Surface | Seconds |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| filecabinet | 64 | 6 sides | 28 (2x) | 1.000 | 1.000 | 1.000 | 0.986 | 64376 | 3.0 |
| filecabinet | 64 | 6 sides | 14 (1x) | 1.000 | 1.000 | 1.000 | 0.998 | 64376 | 2.7 |
| filecabinet | 64 | 6 sides, 4 angles | 14 (1x) | 1.000 | 1.000 | 1.000 | 0.998 | 64376 | 2.3 |
| battery | 64 | 6 sides | 232 (2x) | 0.993 | 0.993 | 1.000 | 0.975 | 78488 | 2.3 |
| battery | 64 | 6 sides | 116 (1x) | 0.998 | 0.998 | 1.000 | 0.977 | 78488 | 2.2 |
| battery | 64 | 6 sides, 4 angles | 232 (2x) | 0.997 | 0.996 | 1.000 | 0.995 | 77664 | 2.8 |
| battery | 64 | 6 sides, 4 angles | 116 (1x) | 0.996 | 0.997 | 1.000 | 0.993 | 77664 | 4.4 |
| medkit | 64 | 6 sides | 198 (2x) | 0.993 | 0.994 | 0.988 | 0.976 | 51828 | 3.0 |
| medkit | 64 | 6 sides | 98 (1x) | 0.949 | 0.950 | 0.974 | 0.973 | 51828 | 2.5 |
| medkit | 64 | 6 sides, 4 angles | 198 (2x) | 0.992 | 0.989 | 0.989 | 0.985 | 51580 | 3.8 |
| medkit | 64 | 6 sides, 4 angles | 98 (1x) | 0.950 | 0.937 | 0.931 | 0.939 | 51580 | 3.9 |
| forklift | 64 | 6 sides | 1498 (2x) | 0.964 | 0.425 | 0.712 | 0.659 | 49764 | 3.6 |
| forklift | 64 | 6 sides | 748 (1x) | 0.961 | 0.427 | 0.720 | 0.661 | 49764 | 3.3 |
| forklift | 128 | 6 sides | 1498 (2x) | 0.965 | 0.558 | 0.816 | 0.752 | 211668 | 8.6 |
| forklift | 128 | 6 sides, 4 angles | 1498 (2x) | 0.969 | 0.559 | 0.819 | 0.760 | 197100 | 10.1 |
| forklift | 192 | 6 sides | 1498 (2x) | 0.969 | 0.889 | 0.976 | 0.847 | 501184 | 21.4 |
| forklift | 192 | 6 sides | 748 (1x) | 0.967 | 0.903 | 0.973 | 0.846 | 501184 | 19.3 |
| forklift | 192 | 6 sides, 4 angles | 1498 (2x) | 0.970 | 0.896 | 0.977 | 0.975 | 468896 | 19.5 |
| forklift | 192 | 6 sides, 4 angles | 748 (1x) | 0.956 | 0.893 | 0.971 | 0.961 | 468896 | 18.9 |
| headcrab | 64 | 6 sides | 956 (2x) | 0.979 | 0.960 | 0.961 | 0.725 | 65836 | 4.7 |
| headcrab | 64 | 6 sides | 478 (1x) | 0.976 | 0.957 | 0.958 | 0.722 | 65836 | 4.9 |
| headcrab | 64 | 6 sides, 4 angles | 956 (2x) | 0.977 | 0.964 | 0.966 | 0.969 | 51540 | 3.2 |
| headcrab | 64 | 6 sides, 4 angles | 478 (1x) | 0.975 | 0.951 | 0.957 | 0.960 | 51540 | 2.6 |
| headcrab | 128 | 6 sides, 4 angles | 478 (1x) | 0.975 | 0.953 | 0.956 | 0.963 | 210316 | 8.6 |
| barney | 64 | 6 sides | 1570 (2x) | 0.973 | 0.979 | 0.967 | 0.746 | 35272 | 1.8 |
| barney | 64 | 6 sides | 784 (1x) | 0.974 | 0.979 | 0.967 | 0.744 | 35272 | 1.4 |
| barney | 64 | 6 sides, 4 angles | 1570 (2x) | 0.959 | 0.980 | 0.963 | 0.975 | 27856 | 1.2 |
| barney | 64 | 6 sides, 4 angles | 784 (1x) | 0.971 | 0.975 | 0.967 | 0.976 | 27856 | 1.5 |
| barney | 128 | 6 sides, 4 angles | 784 (1x) | 0.970 | 0.980 | 0.972 | 0.982 | 116548 | 5.1 |
| houndeye | 64 | 6 sides | 616 (2x) | 0.991 | 0.991 | 0.992 | 0.824 | 76596 | 4.0 |
| houndeye | 64 | 6 sides | 308 (1x) | 0.980 | 0.986 | 0.993 | 0.821 | 76596 | 3.6 |
| houndeye | 64 | 6 sides, 4 angles | 616 (2x) | 0.988 | 0.988 | 0.992 | 0.988 | 68340 | 2.9 |
| houndeye | 64 | 6 sides, 4 angles | 308 (1x) | 0.974 | 0.980 | 0.990 | 0.979 | 68340 | 3.3 |

Original triangle counts (the first pose's, as `posed` draws them): filecabinet 14, battery 116, medkit 99,
forklift 749, headcrab 478, barney 785, houndeye 308. Every model above passes `check` for GoldSrc.

Readings:

- The filing cabinet comes back as its own box: 14 triangles on its 8 corners. The reducer stops at 28 for 2x
  because that is what was asked; the extra 14 lie in the box's faces.
- The medkit at 1x (98) loses a little along x and y: the reducer spends what it has on the strap, which is a long
  thin loop. At 2x it is 0.99.
- The forklift at 128 cells is still under 0.6 on its side: the fork tips taper below a cell and are lost, and
  `silhouettes()` centres each outline on its own box, so a shorter copy is shifted against the original over
  its whole length. At 192 the tips survive. A thin-part guard in the reducer is not what is missing here; the
  grid is.
- 128 cells instead of 64 gains under 0.01 on the organic subjects and costs three to four times the time.
  64 is the right default for them; a prop with rails, rods or blades wants its thinnest part to be at least
  one and a half cells.

### Looked at

Drawn with `smak sheet` and read: the headcrab hull at 478 triangles (six sides and the angles) has the dome,
both forelegs reaching forward with the claws, and the back legs; barney at 784 stands with separate legs and
arms, hands at the hips, a head with a face's profile and boots; the houndeye at 308 has its hunched body, the
pointed snout from above and three thin legs; the forklift at 192 cells and 1,498 triangles has the mast, the
cage's posts and roof, the seated driver and both forks; the battery at 116 has its top fittings; the medkit at
98 has its body and the strap's loop; the filing cabinet is a box.

## Limits

- **Hollows no outline sees.** The hull is the thing or more. The drawers of the filing cabinet, the battery's
  recessed top tray and the inside of the medkit's open underside are filled. The headcrab's belly and the
  space between its legs are filled where no picture looks between them: the four angle pictures remove most of
  it (angle IoU 0.72 to 0.96), and what remains needs a cut by hand or more views.
- **Holes seen edge on.** A handle's hole or a loop shows as a hole only in a picture that looks through it. The
  medkit's strap loop is kept because the top view looks through it; a cup's handle seen only from the sides
  would be filled.
- **Parts thinner than a cell** are lost: the forklift at 64 cells. The cure is `cells`, at a cost in time that
  grows with the cube of it (64: about 3 seconds, 192: about 20).
- **Faces seen from one side only.** A picture of a side no face turns to shows less than the thing. Opposite
  views are taken together, which cures the kit's own sheets; a lone angle view with no opposite, drawn that way,
  would still cut wrongly.
- **One picture of the outline, not a measure.** The views along the axes are stretched onto `size`, so a size
  given wrongly stretches the thing. Pictures that are not to one scale (separate photographs) need `scale` and
  `centre` given for each angle view.
- **Normals.** A hull at 2x the original's count has many faces meeting at gentle angles; `buildMdl` with its
  default 40 degree smoothing gave the 2x forklift and barney hulls 2,542 and 2,586 normals, over GoldSrc's 2,048
  a submodel. Built with `smooth: 80` they pass. The part kind should build its hull smoothed wider.
- **Texture.** None: the hull is a shape. `project.mjs` paints it from the same pictures.
- **Timing and lighting in the game** are not measured by any of this.

## How to run it again

The script, run from anywhere with the game installed (it reads the originals in place and writes nothing into
the repository): `node carve-experiment.mjs [ids,comma,separated] [cells,list] <out folder>`.

```js
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
const KIT = "/media/Data3/Packages/smak";
const smak = await import(`${KIT}/src/index.mjs`);
const { carve, sheetViews, masksFromPicture } = await import(`${KIT}/src/spec/carve.mjs`);
const { GAME, POSE, ANGLES, readModel, silhouettes, boxOf } = await import(`${KIT}/examples/reproduce/lib.mjs`);
const { posed, framing, render } = await import(`${KIT}/src/render.mjs`);
const R = `${KIT}/examples/reproduce`;
const all = [
  ["filecabinet", `${R}/filecabinet/input`, "models/filecabinet.mdl", "size.txt"],
  ["battery", `${R}/battery/input`, "models/w_battery.mdl", "size.txt"],
  ["medkit", `${R}/medkit/input`, "models/w_medkit.mdl", "size.txt"],
  ["forklift", `${R}/forklift/input`, "models/forklift.mdl", "size.txt"],
  ["headcrab", `${R}/headcrab/input`, "models/headcrab.mdl", "size.txt"],
  ["barney", `${R}/held/characters/barney/input`, "models/barney.mdl", "facts.txt"],
  ["houndeye", `${R}/held/characters/houndeye/input`, "models/houndeye.mdl", "facts.txt"],
];
const want = process.argv[2] ? process.argv[2].split(",") : null;
const cellsList = (process.argv[3] ?? "64").split(",").map(Number);
const OUT = process.argv[4] ?? "carved";
mkdirSync(OUT, { recursive: true });
const pic = (file) => smak.unpng(readFileSync(file));
// the dots that are not the renderer's ground colour
const drawn = (p) => {
  const m = new Uint8Array(p.width * p.height);
  for (let i = 0; i < m.length; i++) m[i] = p.rgba[i * 4] !== 58 || p.rgba[i * 4 + 1] !== 62 || p.rgba[i * 4 + 2] !== 70 ? 1 : 0;
  return m;
};
for (const [id, dir, file, facts] of all) {
  if (want && !want.includes(id)) continue;
  const original = readModel(join(GAME, file));
  const orig = posed(original, POSE).tris.length;
  const size = readFileSync(join(dir, facts), "utf8").match(/[\d.]+/g).slice(0, 3).map(Number);
  const sides = sheetViews(pic(join(dir, "sides.png")));
  const angles = ANGLES.map(([name, yaw, pitch]) => ({ ...masksFromPicture(pic(join(dir, `${name}.png`))), yaw, pitch, name }));
  const within = framing(original, [POSE]);
  const angleIoU = (copy) => {
    const b = boxOf(copy);
    const mine = { mid: b.mn.map((v, a) => (v + b.mx[a]) / 2), far: within.far };
    let sum = 0;
    for (const [, yaw, pitch] of ANGLES) {
      const a = drawn(render(original, { ...POSE, view: "orbit", within, yaw, pitch, width: 256, height: 256 }));
      const c = drawn(render(copy, { ...POSE, view: "orbit", within: mine, yaw, pitch, width: 256, height: 256 }));
      let both = 0;
      let either = 0;
      for (let i = 0; i < a.length; i++) (both += a[i] & c[i]), (either += a[i] | c[i]);
      sum += both / either;
    }
    return Math.round((1000 * sum) / ANGLES.length) / 1000;
  };
  for (const cells of cellsList)
    for (const [which, views] of [["6 sides", sides], ["6 sides, 4 angles", [...sides, ...angles]]])
      for (const k of [2, 1]) {
        const t0 = Date.now();
        const { tris, report } = carve(views, { size, cells, target: orig * k });
        const ms = Date.now() - t0;
        const texture = { name: "flat.bmp", width: 16, height: 16, pixels: new Uint8Array(256), palette: new Uint8Array(768).fill(160), flags: 0 };
        const meshes = [{ tris: tris.map((t) => t.map((c) => ({ p: c.p, uv: [0.5, 0.5] }))), texture }];
        const mdl = smak.buildMdl({ smooth: 80, name: `${id}.mdl`, bodyparts: [{ name: "body", models: [{ name: "hull", meshes }] }], sequences: [{ name: "idle", fps: 10, frames: [[[0, 0, 0, 0, 0, 0]]] }] });
        const row = { id, cells, which, k, orig, tris: tris.length, ...silhouettes(original, mdl), angles: angleIoU(mdl), ms, surfaced: report.surfaced, errors: smak.check(mdl, "goldsrc").errors.length };
        console.log(JSON.stringify(row));
        writeFileSync(join(OUT, `${id}-${cells}-${views.length}-${k}x.mdl`), mdl);
      }
}
```

The staged against one-round table: the same, carving once with no `target` and calling
`reduce(tris, { target, stages })` both ways on the result.
