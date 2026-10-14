# Why round 1 failed the same items, and what to build

Written 2026-10-14 against commit adc09ae and round 1's results (`examples/reproduce/*/*/round-1/`). Round 2 was
running while this was written; nothing here uses its results.

Abbreviations: CIE (Commission Internationale de l'Eclairage), CIELAB or Lab (its lightness L and colour axes a and
b), delta E (CIE76 colour difference: the straight-line distance in Lab), IoU (intersection over union), QEM
(quadric error metric, Garland and Heckbert's mesh reducer), AO (ambient occlusion), RANSAC (random sample
consensus), CSG (constructive solid geometry), XKCD (Randall Munroe's web comic, whose 2010 colour survey named
954 colours), sRGB (the standard red-green-blue colour space of a picture).

Items are the rubric's (`examples/reproduce/rubric.md`): M1 silhouette, M3 parts, M4 colour, M5 surface detail,
M8 fit for the game (triangles at most twice the original's).

## The short version

Before any method, I measured what round 1's failures are made of. Four of the brief's assumptions do not hold,
and the order of work changes because of it:

1. **The triangle overruns come from boxes, not turned parts.** Every prop over budget spent most of its triangles
   on small boxes (frames, lamps, tabs, drawer fronts, pulls) that Valve paints. Turned parts cost little.
2. **The colour error is not a global cast.** If the whole reproduction is shifted by its mean Lab difference,
   delta E falls by at most 1.6 in every leg except one: the filing cabinet's words leg, where the describer
   called a mid-dark grey "dark charcoal". The words-leg reproductions came out *lighter* than the originals in
   four of five subjects, not darker.
3. **From words, M4 is close to impossible as measured.** A per-pixel delta E counts the original's texture
   grain. A reproduction with every region's colour *exactly* right, perfectly aligned, but without the grain,
   already scores 10 to 14 on the battery, forklift and headcrab. Named in the nearest of 949 XKCD names, 13 to 16.
   The pass line is 15.
4. **The harness counts a view where the original shows nothing as delta E 100.** The medkit's open underside
   gives no shared pixels, so its "below" view counts as 100. The other nine views of the medkit pictures leg
   average 15.1, but the recorded mean is 23.6.

Ranked by expected gain on the failing items for the least work:

| Rank | Build | Items | Work | Evidence |
| --- | --- | --- | --- | --- |
| 1 | A triangle budget the build enforces, plus a `paint` flag that bakes a small part into the face under it | M8 (failed on 7 of 10 legs) | Small | Table 2 |
| 2 | Shape from views: carve the pictures' outlines into a closed part, reduce it to a budget, then `project` | M1, M3 for complex outlines (pictures leg) | Medium (Node carving, plus a Node reducer that is already on the backlog) | Table 4 |
| 3 | Two harness fixes for Steven to decide: skip views that are empty in the original, and measure M4 on blurred pictures | M4 | Tiny | Tables 3, 5 |
| 4 | Colours given "as seen": the build divides by the renderer's light (measured 0.80); named colours from the XKCD table, with modifiers | M4 (words leg) | Small | Tables 6, 7 |
| 5 | Round parts shaded smooth by default; sides chosen by a rule | M8, the look of round parts | Small | Section 5 |
| 6 | A part library: painted part shapes (cup pull, vent, hex nut seen head-on) and a few built ones (wheel, mast rail, jointed leg) | M3 | Medium | Section 2 |
| 7 | Projection that undoes the renderer's known light | M4 (pictures leg) | Small | Table 8: worth about 1 delta E |
| 8 | Wear and dirt masks from cavity and AO, and a "too clean" measure | M5 | Medium | Section 4 |
| 9 | Learned primitive fitting (cuboids, superquadrics, CSGNet) | M3 | Large | Declined: the agent is the fitter |

## 0. What round 1's failures are made of (measured)

Scripts: `~/stignored/smak-repeated-failures/` (`colour.mjs`, `parts.mjs`, `names.mjs`, `gain.mjs`,
`hlcolours.mjs`, `carve.mjs`, `mesh.py`, `score.mjs`, `delight.mjs`). They read the round-1 builds and the game's
files through `examples/reproduce/lib.mjs`. Intermediate files went to `/tmp/claude-1000/rf/`, which does not persist.

### Table 1: the colour difference split up (ten views, 256 pixels square, round-1 builds)

`dE` is the judge's measure. "Shift removed" subtracts the mean Lab difference first, so it shows how much a
global cast explains. "Blurred" compares both pictures after a 9-pixel box blur, so it shows how much is grain and
misregistration. `hfL` is the standard deviation of lightness left after that blur: texture energy.

| Subject | Leg | dE | Shift removed | Blurred | L orig | L repro | b orig | b repro | hfL orig | hfL repro |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| filecabinet | pictures | 4.2 | 3.1 | 3.6 | 29.3 | 29.0 | -0.1 | 0.1 | 2.7 | 2.7 |
| filecabinet | words | 11.3 | 4.3 | 10.5 | 29.3 | 19.2 | -0.1 | -0.9 | 2.7 | 3.2 |
| battery | pictures | 20.7 | 20.5 | 15.0 | 46.8 | 50.4 | 9.9 | 9.2 | 9.7 | 7.8 |
| battery | words | 27.8 | 26.5 | 22.1 | 46.6 | 52.7 | 9.8 | 6.5 | 9.9 | 8.6 |
| medkit | pictures | 14.9 | 14.3 | 10.8 | 59.4 | 61.2 | 4.2 | 3.8 | 8.9 | 8.9 |
| medkit | words | 19.9 | 19.0 | 14.7 | 61.3 | 65.8 | 4.1 | 7.4 | 9.1 | 9.5 |
| forklift | pictures | 13.1 | 13.0 | 6.1 | 28.2 | 27.0 | 3.1 | 3.2 | 11.9 | 11.7 |
| forklift | words | 29.3 | 27.7 | 22.6 | 28.9 | 41.2 | 3.3 | 5.7 | 11.8 | 11.4 |
| headcrab | pictures | 16.6 | 15.2 | 10.5 | 39.5 | 34.2 | 26.1 | 22.5 | 9.1 | 8.0 |
| headcrab | words | 25.7 | 24.1 | 19.8 | 39.2 | 43.8 | 25.8 | 26.6 | 8.7 | 6.2 |

Readings:

- The words legs are lighter than the original in four of five (forklift +12 L, battery +6, medkit +4.5,
  headcrab +4.6) and darker in one (filing cabinet -10). "Too dark" is not the pattern; region colours are wrong
  in both directions.
- "Too cool" holds for the battery's words leg (b 9.8 to 6.5, chroma 15.7 to 11.1: the judge's "flat cool grey
  where the original is warm brownish"). The medkit's words leg went the other way (b 4.1 to 7.4: "warmer cream").
- "Too clean" in the sense of texture energy is mild: the reproduction's `hfL` is 0.71 to 0.87 of the original's
  on the battery and the headcrab, and equal elsewhere. The judges' M5 complaints are about *which* marks and
  *where* (ragged hazard chevrons, speckled glow, grime at edges, legible lettering), not about overall noise.
- On the pictures leg, the forklift and headcrab used `project` and their blurred delta E is 6 and 10. What is
  left is grain that lands a pixel or two off, which only better shape fixes.

### Table 2: where the props' triangles went (round-1 specs rebuilt without projection)

| Subject | Leg | Total | Boxes | Leaves | Round parts (cylinder, turn, tube, sphere) | Valve's |
| --- | --- | --- | --- | --- | --- | --- |
| battery | pictures | 900 | 684 | 120 | 96 | 116 |
| battery | words | 896 | 552 | 240 | 104 | 116 |
| filecabinet | pictures | 276 | 276 | 0 | 0 | 14 |
| filecabinet | words | 408 | 408 | 0 | 0 | 14 |
| medkit | pictures | 600 | 156 | 300 | 144 | 99 |
| medkit | words | 468 | 156 | 144 | 168 | 99 |
| forklift | words | 2128 | 408 | 0 | 1720 | 749 |

The battery's pictures leg is 57 boxes. The cabinet's drawers and pulls are 23 boxes where Valve's whole cabinet
is 14 triangles: one box plus a plinth, everything else painted. The budget table and the painted `panels` were
already in `docs/SPEC.md` for round 1 (commit c235986); the agents built boxes anyway. Advice in a document did
not change behaviour, so the build has to enforce it. The forklift's words leg is the one case where round parts
dominate (sixteen-sided wheels and cylinders).

### Table 3: the medkit's views, as the judge recorded them

| View | front | left | back | right | top | below | front-left | front-right | back-left | back-right |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| pictures | 14.7 | 13.5 | 11.8 | 13.4 | 18.0 | null (counted 100) | 16.8 | 17.8 | 15.1 | 14.9 |
| words | 21.5 | 20.6 | 12.8 | 21.9 | 21.8 | null (counted 100) | 21.7 | 21.7 | 19.7 | 19.1 |

`measureModel` in `examples/reproduce/judge.mjs` writes `c.deltaE ?? 100`. A view where the original shows nothing
gives no shared pixels, so the reproduction is charged 100 there whatever it does. The judge read "23.6" and
scored M4 a 1 with that number in its reason. Without the empty view the pictures leg is at 15.1, just over the
line. This is Steven's call, since the rubric says it does not change after the first build; the fix is to leave
out views with no pixels in the original.

## 1. Shape from views: a closed low-poly part from the pictures

### Methods

- **Visual hull** (Laurentini 1994, IEEE Transactions on Pattern Analysis and Machine Intelligence 16(2):150-162,
  doi 10.1109/34.273735). The largest solid consistent with a set of silhouettes: the intersection of each
  silhouette swept along its view direction. With orthographic views the sweep is a prism. A hull is always a
  superset of the object: it cannot see a concavity that no silhouette shows (a cup's inside, the gap under a
  forklift's guard seen only end-on).
- **Octree carving** (Szeliski 1993, "Rapid octree construction from image sequences", CVGIP: Image
  Understanding 58(1):23-32). Voxels kept where every silhouette covers their projection, subdivided only at the
  border. In Node a flat grid of 10^6 to 10^7 bytes is enough at prop sizes; the octree is an optimisation.
- **Polyhedral visual hull** (Matusik, Buehler and McMillan 2001, "Polyhedral Visual Hulls for Real-Time
  Rendering", Eurographics Workshop on Rendering, doi 10.2312/EGWR/EGWR01/115-126,
  https://diglib.eg.org/items/f529c7f5-522b-4cbb-89df-b3d2c3ceb755). Each silhouette is a polygon; each of its
  edges sweeps a face; each face is clipped by the other silhouettes in 2D, by projecting it into each other view
  and intersecting polygons. The result is exact and its face count follows the polygons' vertex counts, so a
  budget becomes a budget of silhouette vertices: simplify each outline (Ramer-Douglas-Peucker) to k vertices
  and the hull has roughly as many faces as the edges that survive. Franco and Boyer (2009, "Efficient Polyhedral
  Modeling from Silhouettes", IEEE TPAMI 31(3):414-427) give a version that is watertight by construction.
- **Concavities.** Space carving (Kutulakos and Seitz 2000, "A Theory of Shape by Space Carving", International
  Journal of Computer Vision 38(3):199-218) removes voxels whose colours disagree between the views that see them.
  It needs many views; with six sides and four angles it is weak. For SMAK the practical answer is the one artists
  use with blueprints: the hull gives the outer volume, and the agent subtracts or adds named parts where the
  pictures show a hole or a recess (a `cut` box, or the hull split into parts). Most of a GoldSrc prop's
  concavities are painted anyway.
- **Reference-image modelling as artists do it.** Box modelling against front, side and top blueprints: start
  from a box sized to the blueprint, extrude and move vertices until the edges sit on the outlines in each view,
  and keep the count low by putting vertices only where the outline turns. The polygonal hull with simplified
  outlines is the automatic form of this; the agent's spec is the manual form.
- **Fitting to a budget.** Marching cubes over the voxels, then QEM (Garland and Heckbert 1997, "Surface
  Simplification Using Quadric Error Metrics", SIGGRAPH, doi 10.1145/258734.258849) in stages. A Node QEM is
  already item 33 of `research/backlog.md`, from `3d-fidelity-methods.md` section 1.

### The experiment (run here)

Masks drawn from each original as the six pictures show it (orthographic outlines along x, y and z), carved into
a grid of 128 to 300 voxels along the longest side, meshed by marching cubes and reduced by QEM in stages to half,
one, two and four times the original's triangle count (pymeshlab in `local-3d/venvs/torch-rocm`). Scored with the
judge's own `silhouettes()`, and by the outline IoU in the four angle views, which measures the hull's extra
volume.

### Table 4: carved hulls at a budget

| Subject | Voxels on the long side | Views carved | Triangles (x original) | M1 worst axis | Angle views IoU, mean |
| --- | --- | --- | --- | --- | --- |
| filecabinet | 128 | 6 sides | 14 (1x) | 0.979 | 0.870 |
| filecabinet | 128 | 6 sides | 28 (2x) | 0.979 | 0.995 |
| battery | 128 | 6 sides | 116 (1x) | 0.988 | 0.967 |
| battery | 128 | 6 sides | 232 (2x) | 0.991 | 0.957 |
| medkit | 128 | 6 sides | 98 (1x) | 0.931 | 0.965 |
| medkit | 128 | 6 sides | 198 (2x) | 0.956 | 0.966 |
| forklift | 128 | 6 sides | 1498 (2x) | 0.816 | 0.810 |
| forklift | 300 | 6 sides | 748 (1x) | 0.666 | 0.786 |
| forklift | 300 | 6 sides | 1498 (2x) | 0.883 | 0.828 |
| forklift | 300 | 6 sides and 4 angles | 1498 (2x) | 0.831 | 0.883 |
| forklift | 300 | 6 sides and 4 angles | 2996 (4x) | 0.883 | 0.927 |
| headcrab | 128 | 6 sides | 478 (1x) | 0.935 | 0.697 |
| headcrab | 128 | 6 sides | 956 (2x) | 0.944 | 0.694 |
| headcrab | 160 | 6 sides and 4 angles | 478 (1x) | 0.946 | 0.920 |
| headcrab | 160 | 6 sides and 4 angles | 956 (2x) | 0.951 | 0.929 |

Round 1's best for comparison: forklift 0.761, headcrab 0.746 (pictures leg).

Readings:

- Every subject clears M1's 0.80 at twice the original's triangles or fewer. The forklift needs fine voxels (0.62
  units): at 1.46 units its thin mast rails and guard posts are lost. At exactly 1x its thin parts collapse under
  QEM (0.666). Carved with the angle views as well, the reducer could not get below 1,060 triangles while
  keeping the topology, and forcing it there broke the mesh (M1 0.30). A reducer that protects thin parts, or the
  forklift cut into parts first, is needed there. At 2x, carving with the angles trades a little axis overlap
  (0.883 to 0.831) for less extra volume (0.828 to 0.883).
- The headcrab's hull from the six sides has much extra volume between its legs (angle IoU 0.70). Carving with the
  four angle pictures as well brings it to 0.92 at the same budget. Those four views were also the ones scored, so
  this is consistency, not a held-out test; drawn and looked at (`hc_hull.png` in the scratch folder), the
  hull at 478 triangles has the original's dome, jointed forelegs with the claws turned up, and back legs. Round 1's
  judge faulted exactly those three. The angle pictures are orthographic (`render` with `view: "orbit"`), so they
  carve as simply as the sides, but the agent is not told their yaw and pitch (35, -35, 145, 215 at pitch 20).
  The harness prompt should say them.
- M1 as measured looks only along the three axes, which an axis-carved hull matches by construction. The judge's
  M3 and M6 still look at the angle views, which is why carving with the angles matters.

### Verdict

Build it, in Node, as a part kind: `{ "kind": "views", "pictures": [...as project takes them], "budget": 400,
"voxels": 200 }`, giving a closed part that `project` then textures. First version: grid carving (sides and
any orbit views given with yaw and pitch), surface nets or marching cubes, then the Node QEM from the backlog with
a thin-part guard (do not collapse an edge whose two sides' normals are opposite within a few voxels). Second
version: Matusik's polygonal hull with outlines simplified to a vertex budget, which needs no reducer at all and
gives flat faces where the outline is straight (better for boxy props). Concavities: let the agent subtract `cut`
parts, and say in the report where the hull's angle-view outline exceeds the picture's by more than a few percent
("extra volume between the legs: carve with the angle pictures, or cut").

First experiment: rebuild the forklift and headcrab pictures legs with the hull as one part plus the round-1
projection, and score with the judge's measurements. Metric: M1 worst axis at or above 0.85, angle IoU above 0.9,
triangles at most 2x, and the blurred delta E of Table 1 below 8.

## 2. Primitive and part fitting

### Methods

| Method | What it does | Needs | Verdict for SMAK |
| --- | --- | --- | --- |
| Cuboid abstraction: Tulsiani, Su, Guibas, Efros and Malik 2017, "Learning Shape Abstractions by Assembling Volumetric Primitives", CVPR, arXiv 1612.00404 | A network predicts a few boxes that cover a shape, trained per category | Training data and a GPU | Decline: the agent is the fitter, and a learned model per category is out of scope |
| Superquadrics: Paschalidou, Ulusoy and Geiger 2019, "Superquadrics Revisited: Learning 3D Shape Parsing beyond Cuboids", CVPR, arXiv 1904.09970 | Same with superquadrics (two exponents make a box, a cylinder, an ellipsoid or a rounded box) | As above | Take the primitive, not the network: one `superquadric` part kind (size, two exponents) covers a rounded cowl, a counterweight or a carapace in about 100 triangles |
| RANSAC primitives: Schnabel, Wahl and Klein 2007, "Efficient RANSAC for Point-Cloud Shape Detection", Computer Graphics Forum 26(2):214-226 | Finds planes, spheres, cylinders, cones and tori in a point cloud by sampling | A point cloud | Useful after section 1: fit planes and cylinders to a carved hull, so that a boxy hull becomes clean boxes and a round one a `turn` |
| CSG recovery: Sharma et al. 2018, "CSGNet: Neural Shape Parser for Constructive Solid Geometry", CVPR, arXiv 1712.08290; Du et al. 2018, "InverseCSG", ACM Transactions on Graphics 37(6) | A program of unions and differences of primitives from a shape | Training, or a solver | Decline the networks; the idea that a part is "box minus box" is worth a `cut` kind |

### What M3 actually missed

From the judges' reasons, round 1: a cup pull made a slot (cabinet, both legs); a hex cap and a ring terminal
built small (battery); a sloped cowl and a rounded counterweight built as boxes (forklift); jointed forelegs built
straight (headcrab pictures); a slack strap built tight (medkit); a sunken panel built flat (medkit words). Valve's
cabinet is 14 triangles, so its cup pulls are *paint*. Half of these misses are painted shapes, not geometry.

### Verdict

A part library in two halves:

- **Painted shapes**, as `panels` presets with their lit bevels: `cup` (a lit lip over a dark scoop), `slot`,
  `vent` (slats), `grille`, `screen` (dark with a glow), `hexnut` (a hexagon with a lit top edge), `rivet`,
  `knob`. Each is a function of the panel's size; costs no triangles.
- **Built shapes** where the outline needs them: `wheel` (tyre and hub, 8 sides), `rail` (an I or C section along
  a path: a mast), `leg` (a tube with a joint and a claw, bends as `[thigh, shin, foot]` angles), `strap` (a tube
  that sags between two anchors by a slack), `superquadric`, and `cut` (a box taken out of a box: a recess).
  Each with a `chamfer` (one ring of bevel: 2 triangles a corner) rather than many sides.

First experiment: rebuild the filecabinet and medkit words specs with `panels` `cup` and `screen` in place of the
boxes, and score M3 and M8. Metric: M8 at 2 (28 and 198 triangles) and the judge's M3 reason no longer naming the
pulls or the panel.

## 3. Colour from words

### Sources

- Berlin and Kay 1969, *Basic Color Terms: Their Universality and Evolution* (University of California Press):
  eleven basic terms in English.
- Lindsey and Brown 2014, "The color lexicon of American English", Journal of Vision 14(2):17 (DOI from memory,
  not verified): English speakers use more than the eleven reliably (peach, tan, teal, lavender and others), and
  modifiers vary widely between people.
- The XKCD colour survey (Munroe 2010, https://blog.xkcd.com/2010/05/03/color-survey-results/): about five
  million names typed for random colours by some 200,000 people; the table https://xkcd.com/color/rgb.txt gives
  949 names with sRGB values, released under CC0 (public domain), which the kit may ship.
- Heer and Stone 2012, "Color Naming Models for Color Selection, Image Editing and Palette Design", CHI
  (https://idl.uw.edu/papers/color-naming-models): a probabilistic model over the XKCD data, giving for each
  colour the distribution of names and a "name distance".
- Monroe, Goodman and Potts 2016, "Learning to Generate Compositional Color Descriptions", EMNLP
  (https://aclanthology.org/D16-1243/): names like "greenish", "faded teal" composed from parts.
- Winn and Muresan 2018, "'Lighter' Can Still Be Dark: Modeling Comparative Color Descriptions", ACL
  (https://aclanthology.org/P18-2125/): a modifier ("lighter", "darker", "more muted") as a direction in colour
  space from a reference colour; their predictions land under delta E 7 of the target.

### Measured here

#### Table 5: how much colour words can carry (originals compared with themselves, ten views)

| Subject | Each pixel named (949 XKCD names) | Each pixel named (30 plain names) | Grain lost (13-pixel average, exact) | Grain lost, then named |
| --- | --- | --- | --- | --- |
| filecabinet | 4.0 | 6.6 | 1.9 | 4.6 |
| battery | 6.1 | 13.7 | 14.4 | 16.0 |
| medkit | 6.1 | 10.0 | 9.9 | 12.8 |
| forklift | 6.0 | 9.2 | 12.6 | 14.2 |
| headcrab | 6.3 | 11.0 | 12.9 | 14.3 |

Naming costs 4 to 6 delta E with a fine vocabulary and 7 to 14 with plain words. Losing the grain costs 10 to 14
on textured subjects. A words-leg reproduction with perfect geometry, perfect region colours from the 949 names and
no grain is at 13 to 16, before any misalignment. M4's line of 15, measured per pixel, is therefore not a
fair test of colour from words. Measured on pictures blurred by a few pixels it would test colour instead
(Table 1's "Blurred" column). That is a rubric change: flagged for Steven, not made.

#### Table 6: what the renderer does to a tone

A box of one grey tone, `paint`, drawn from the judge's ten views:

| Tone (sRGB 0 to 1) | Rendered mean, no finish | Rendered mean, default finish | L of the tone | L rendered |
| --- | --- | --- | --- | --- |
| 0.25 | 0.202 | 0.214 | 27.0 | 21.6 |
| 0.50 | 0.403 | 0.411 | 53.4 | 43.5 |
| 0.75 | 0.604 | 0.602 | 77.4 | 63.6 |

The stand-in light (`AMBIENT` 0.38 plus up to 0.62 toward a lamp behind the camera, `src/render.mjs`) averages
0.80 over these views. Both describer and builder see rendered pictures: a colour named from a picture is the
tone times 0.8. A builder who types the named colour as the `tone` gets 0.8 of it again. The filing cabinet's
words leg shows this chain: the original renders at L 29 (fairly called "dark charcoal-grey"); the builder typed
a charcoal tone; it rendered at L 19.

#### Table 7: Half-Life's own model textures (186 models, 1,114 textures, every pixel's palette colour)

| Measure | Value |
| --- | --- |
| Lightness L, quartiles of all pixels | 11, 28, 50 (10th and 90th percentiles 2 and 72) |
| Mean L of a texture, quartiles | 18, 29, 45 |
| Standard deviation of L inside a texture, quartiles | 9.4, 13.9, 18.6 |
| Chroma (colourfulness), quartiles | 0.6, 9, 26; 21% of pixels over 30 |
| Hue of coloured pixels (chroma over 8) | 71% between Lab hue 30 and 120 degrees (red-orange through yellow and olive); 4% in the blues (240 to 300) |
| Greys (chroma under 15), mean a and b | +0.07, +1.2 (very slightly warm) |

Counted over every texel, including unused padding, so the darkest share is overstated. Against this, SMAK's
`metal` base is L 47, b -4.9 and `steel` L 64, b -3.0 (`src/spec/paint.mjs`): lighter and bluer than the game's
greys. A builder who leaves "grey metal" at the default lands cooler and lighter than Valve's, which is the
battery's words leg.

### Verdict

- **`seen` colours.** Let a material take `seen: [r, g, b]` or `seen: "<words>"`: the colour as it shows in the
  pictures, which the build divides by the renderer's measured light (0.80, or the exact mean of each part's
  normals under the stand-in lamp). Say in `docs/SPEC.md` that `tone` is the paint and `seen` the picture. Small.
- **Names to numbers.** Ship the XKCD table (CC0) and a small grammar: a head name from the table; `dark` and
  `light` as L -15 and +15 (Winn and Muresan's directions are learned; fixed steps are the cheap form); `pale`
  and `muted` as chroma times 0.5; `warm` and `cool` as b +6 and -6; `grimy` or `dirty` as a mix 30% toward the
  game's grime (L 35, a 2, b 10, from Table 7's warm darks); `-ish` as half a step toward the second name
  ("greyish brown" is in the table itself). The build reports the number it chose for each phrase. Small.
- **Defaults nearer the game.** Warm the metal and steel bases to b about +2 and darken `metal` toward L 40.
  Maps share these bases: check the map cases' pictures before changing them.
- **What words cannot do.** Table 5 says no vocabulary passes M4 per pixel. The remaining gain from words is in
  region colours; measure it with the blurred delta E.

First experiment: rewrite only the `materials` of the five words-leg specs from their `words.md` colour phrases
through the table and grammar, with `seen`, and rebuild. Metric: Table 1's blurred delta E for the words legs
(today 10.5 to 22.6) and the mean L difference (today -10 to +12). Success is the blurred delta E under 12 on all
five.

## 4. Surface detail and wear (M5)

### Methods

| Method | Source | What it gives | Cost in SMAK |
| --- | --- | --- | --- |
| Accessibility shading | Miller 1994, "Efficient Algorithms for Local and Global Accessibility Shading", SIGGRAPH, pp. 319-326 | How hard it is for a sphere of a given size to touch each point: grime collects where it cannot, polish where it can | A sphere test per texel against the part's own triangles; the kit already finds each texel's point and normal (`paint`) |
| Obscurance and AO | Zhukov, Iones and Kronin 1998, "An Ambient Light Illumination Model", Eurographics Rendering Workshop | Darkening by nearby geometry within a distance: the soft dirt in corners | Rays per texel against a BVH (bounding volume hierarchy); item 34 of the backlog |
| Dust accumulation | Hsu and Wong 1995, "Simulating Dust Accumulation", IEEE Computer Graphics and Applications 15(1) | More on faces turned up, less where exposed to rubbing | Normal's z times accessibility; cheap |
| Edge wear by curvature | Common practice in layered materials (Substance Painter's generators) | Convex edges rubbed light, concave ones dark | `finish.wear` already does convex edges at 65 degrees; concave is the AO above |
| Layered materials | The same practice: base, then masks of noise times AO times curvature, each layer a material | Mottle, stains, chipped paint showing an undercoat | `paint` with passes already does this per pixel; the spec lacks a way to name a layer |

### Measures for "too clean"

Table 1's `hfL` (lightness energy above a 9-pixel blur) is one. Two more, cheap from the same pictures: the
standard deviation of L in blocks of 16 pixels (low-frequency mottle, which a 9-pixel blur keeps), and the share
of pixels more than 10 L below their block's median (stains and grime). Each as a ratio of reproduction to
original over the shared outline; under 0.7 is "too clean". Round 1's battery and headcrab words legs are at 0.71
and 0.87 on `hfL`.

### Verdict

Middle priority. For the pictures leg, `project` carries the original's wear already. For the words leg, the
judges asked for named marks in named places (chipped hazard stripes, grime on the rim, a speckled glow): a
`wear` layer list in the spec (`{ "kind": "chips", "on": "stripe", "amount": 0.4 }`, `{ "kind": "grime",
"where": "cavities" }`, `{ "kind": "speckle", "material": "energy" }`) over accessibility and dust masks would
serve those words directly. First experiment: the battery words spec with three such layers. Metric: the three
ratios above 0.85, and the judge's M5 reason.

## 5. Low-poly modelling to a budget

### Rules with their arithmetic

- A closed cylinder of n sides is 4n - 4 triangles (2n round it, n - 2 a cap). Valve's can at 28 triangles is
  therefore an 8-sided cylinder.
- A regular n-gon in a circle of radius r strays from the circle by r(1 - cos(pi/n)). As a share of the radius:
  6 sides 13.4%, 8 sides 7.6%, 12 sides 3.4%, 16 sides 1.9%. On a 6-unit radius (a forklift wheel is about 10),
  8 sides is under half a unit off: invisible at game distance. Rule: the smallest n with r(1 - cos(pi/n)) under
  0.25 units for things a player is near, under 0.5 for props, 6 at least for anything seen as round.
- Spend sides where the outline shows them: a wheel seen side-on needs its sides; a pipe seen only lengthways
  can be 6.

### The normals finding

`docs/SPEC.md` gives `smooth` a default of 40 degrees and says a round part whose faces meet at more than its
angle is shaded flat. A 6-sided part's faces meet at 60 degrees and an 8-sided one's at 45, so a 6- or 8-sided
cylinder is faceted unless the agent raises `smooth`. That pushes agents to 16 sides to make things look round.
Shaded smooth, an 8-sided cylinder reads round in the engine's soft light (Gouraud shading across the facets);
only its outline shows the corners, which the arithmetic above keeps small. Default round parts (turn, cylinder,
sphere, tube) to smooth across their own rings whatever their side count, and keep `smooth` for the creases
between parts. The light painted in `finish` (`cylinderLight` in the workshop) does the rest.

### Reduction of primitives

For built parts the budget is set by sides and rings, not by a reducer: the report should list each part's
triangles against the kind's budget (Table 2 shows the agent needs to see it) and suggest the cut ("tabs 1 to 5:
60 triangles, painted as panels: 0"). A reducer (QEM) matters only for the carved parts of section 1 and imports.

### Verdict

Build now, together with rank 1: a `budget` (default from the kind table in `docs/SPEC.md`, the three-quarters
column) that is a FAULT when exceeded; per-part triangles beside the budget; round parts smooth by default; a
`paint: true` on a part that renders it into the faces under it (its colours, plus its lit bevel as `panels` draw
one) and leaves no triangles. First experiment: round 1's battery and filecabinet pictures specs with every box
under one unit proud marked `paint`. Metric: triangles at or under 2x (232, 28) and the blurred delta E no worse.

## Build list

In order. Each line: what, where it would go, its first test.

1. Triangle budget as a fault, per-part triangles in the report, `paint: true` on small parts
   (`src/spec/model.mjs`, `src/spec/faces.mjs`). Test: battery and cabinet round-1 specs at 2x or under.
2. Round parts shaded smooth by default; the sides rule in `docs/SPEC.md`. Test: an 8-sided cylinder drawn with
   no facet lines across it.
3. For Steven: the harness's empty-view 100 and a blurred M4 (`examples/reproduce/judge.mjs`); the angle pictures'
   yaw and pitch in the pictures-leg prompt (`examples/reproduce/reproduce.mjs`).
4. Part kind `views` (carved hull, then Node QEM with a thin-part guard), textured by `project`; later the polygonal
   hull. Test: Table 4's rows rebuilt in Node within 0.02 of the Python numbers; forklift and headcrab pictures
   legs over 0.85 on M1.
5. `seen` colours and the XKCD table with the modifier grammar; warmer metal defaults. Test: words-leg blurred
   delta E under 12.
6. Painted part shapes for `panels` (`cup`, `vent`, `grille`, `screen`, `hexnut`, `knob`) and built `wheel`,
   `rail`, `leg`, `strap`, `superquadric`, `cut`. Test: the M3 reasons of round 1 rebuilt.
7. `project` divides by the stand-in lamp's light for each texel's normal and view. Test: Table 8 below, exact
   instead of a single gain.
8. A spec `wear` layer list over accessibility and dust masks; the three "too clean" ratios in the harness.
9. RANSAC planes and cylinders on a carved hull, to turn it into clean parts (after 4).

### Table 8: undoing the pictures' light before projecting (a crude test)

Every picture pixel divided by one gain in linear light before `project`, round-1 pictures specs:

| Subject | Gain 1 (as round 1) | Gain 0.9 | Gain 0.82 |
| --- | --- | --- | --- |
| headcrab | 16.6 | 15.9 | 15.6 |
| forklift | 13.1 | 13.1 | 13.0 |

About one delta E on the headcrab and nothing on the darker forklift. Exact per-normal division would do a little
better; it is a small item.

## What I could not verify

- The carving used outlines rasterised from the original model, the same information as the six pictures but
  without the work of finding the outline in a PNG and scaling it from `size.txt`. The kit's `project` already
  finds the outline box; I did not run carving from the PNGs themselves.
- The hull meshes were reduced with pymeshlab in Python, not with a Node reducer, which does not exist yet. A Node
  QEM may do worse on thin parts. pymeshlab's reducer stalled without end on the forklift carved with the angle
  views; it was stopped and rerun with a guard that ends the loop when a pass removes nothing.
- The headcrab's angle-view IoU was measured on the same four views it was carved with. A held-out test (carve
  with three, score the fourth) was not run.
- No hull was textured by `project` and judged; the gain on M4 and M6 from better shape is inferred from Table 1's
  blurred column, not measured.
- Table 7 counts every texel, including texture padding no triangle uses. Weighting by the area each texel covers
  on the model would be the right measure.
- Lindsey and Brown 2014's volume, issue and DOI are from memory; the other papers' venues and links were checked
  by search on 2026-10-14 except Tulsiani 2017, Paschalidou 2019, Schnabel 2007, Sharma 2018, Du 2018, Szeliski
  1993, Laurentini 1994, Franco and Boyer 2009, Kutulakos and Seitz 2000, Zhukov 1998 and Hsu and Wong 1995, which
  are cited from memory with their standard identifiers.
- The modifier steps (L plus or minus 15, b plus or minus 6, the grime colour) are my choices, not measured from
  how people use the words. Heer and Stone's model over the XKCD data could set them; not done.
- Nothing here was run in the game. The judge's measurements and SMAK's renderer are the only yardstick.

## Sources

- Laurentini, A. 1994. The visual hull concept for silhouette-based image understanding. IEEE TPAMI 16(2). doi 10.1109/34.273735
- Szeliski, R. 1993. Rapid octree construction from image sequences. CVGIP: Image Understanding 58(1).
- Matusik, W., Buehler, C., McMillan, L. 2001. Polyhedral Visual Hulls for Real-Time Rendering. EGWR. https://diglib.eg.org/items/f529c7f5-522b-4cbb-89df-b3d2c3ceb755
- Franco, J.-S., Boyer, E. 2009. Efficient Polyhedral Modeling from Silhouettes. IEEE TPAMI 31(3).
- Kutulakos, K., Seitz, S. 2000. A Theory of Shape by Space Carving. IJCV 38(3).
- Garland, M., Heckbert, P. 1997. Surface Simplification Using Quadric Error Metrics. SIGGRAPH. doi 10.1145/258734.258849
- Tulsiani, S., Su, H., Guibas, L., Efros, A., Malik, J. 2017. Learning Shape Abstractions by Assembling Volumetric Primitives. CVPR. arXiv 1612.00404
- Paschalidou, D., Ulusoy, A. O., Geiger, A. 2019. Superquadrics Revisited. CVPR. arXiv 1904.09970
- Schnabel, R., Wahl, R., Klein, R. 2007. Efficient RANSAC for Point-Cloud Shape Detection. Computer Graphics Forum 26(2).
- Sharma, G. et al. 2018. CSGNet: Neural Shape Parser for Constructive Solid Geometry. CVPR. arXiv 1712.08290
- Du, T. et al. 2018. InverseCSG: Automatic Conversion of 3D Models to CSG Trees. ACM TOG 37(6).
- Berlin, B., Kay, P. 1969. Basic Color Terms. University of California Press.
- Lindsey, D., Brown, A. 2014. The color lexicon of American English. Journal of Vision 14(2):17.
- Munroe, R. 2010. Color survey results. https://blog.xkcd.com/2010/05/03/color-survey-results/ ; table https://xkcd.com/color/rgb.txt (CC0)
- Heer, J., Stone, M. 2012. Color Naming Models for Color Selection, Image Editing and Palette Design. CHI. https://idl.uw.edu/papers/color-naming-models
- Monroe, W., Goodman, N., Potts, C. 2016. Learning to Generate Compositional Color Descriptions. EMNLP. https://aclanthology.org/D16-1243/
- Winn, O., Muresan, S. 2018. 'Lighter' Can Still Be Dark: Modeling Comparative Color Descriptions. ACL. https://aclanthology.org/P18-2125/
- Miller, G. 1994. Efficient Algorithms for Local and Global Accessibility Shading. SIGGRAPH, 319-326. https://history.siggraph.org/?p=119714
- Zhukov, S., Iones, A., Kronin, G. 1998. An Ambient Light Illumination Model. Eurographics Rendering Workshop.
- Hsu, S.-C., Wong, T.-T. 1995. Simulating Dust Accumulation. IEEE Computer Graphics and Applications 15(1).
