# Why the frenzy reproductions fail, and what would fix them

Research for SMAK, 2026-10-14. Round 1 of the map reproduction test (`examples/reproduce/rubric.md`) scored
Valve's `frenzy` 11/18 from the compiled map, 8/18 from pictures and 5/18 from words; every leg failed on
textures (P5), light (P6), landmarks (P7) and visual fidelity (P9), and the picture and word legs on layout
(P1, P2). This report measures where each leg went wrong, finds what the kit already has (in this repo and in
Steven's goldsrc.net project), and ranks fixes by expected gain for least work.

Abbreviations: BSP (binary space partition: the compiled map, `.bsp`), MCP (Model Context Protocol, the
kit's server for an agent), SDHLT (seedee's Half-Life compile tools, the compilers the kit uses), ZHLT / VHLT
(Zoner's / Vluzacn's Half-Life tools, SDHLT's ancestors), hlrad (the light compiler), texlight (a texture that
emits light, declared in `lights.rad` or an `info_texlights` entity), NCC (normalised cross-correlation),
LBP (local binary patterns), SSIM (structural similarity index), LPIPS (learned perceptual image patch
similarity), DISTS (deep image structure and texture similarity), FLIP (NVIDIA's difference evaluator for
alternating images), CLIP (contrastive language-image pretraining), VLM (vision-language model, here the
reproducing agent itself), P1-P9 (the rubric's map items).

Experiment scripts: `~/stignored/smak-map-reproduction/` (`facecheck.py`, `texid3.mjs`, `viewmetric.mjs`,
`dcviews.mjs`, `run.mjs`/`probe.mjs`; outputs quoted below). The face and light checks reuse the BSP reader
of `goldsrc.net/godot/tools/bsp2map/bsp2map.py`.

## 1. Summary

The largest failures are not research problems. Five of them are gaps in the kit itself, found while reading
the round's runs, and each is a few hours of work:

1. **The MCP server never lets the map renderer see the game's `.wad` files.** `renderMap` passes
   `mapFolders(folders, file)` = the map's folder and the models folder (`mcp/tools.mjs` lines 420 and 560);
   `folders.wads` (set by `--wads`) is used only by `build`. So every view the BSP-leg agent drew of the
   original was flat colours, and it said so: "the renderer couldn't load the original's textures, so I
   matched each surface by the colour the renderer gives it" (`frenzy/bsp/answer.md`).
2. **No MCP tool says which texture a face wears.** `info` on a BSP lists the 37 names and sizes only; the
   reproduction runs with `--no-run` (`examples/reproduce/agents.mjs`), so no script could read
   `faceTexture`. With the BSP in hand, the agent put the right texture on 30% of the surface area (table 2).
3. **The build calls a dark room a fault** (`DARK_FLOOR = 24`, `src/maps/light.mjs`; `src/spec/map.mjs`
   line 1203). Frenzy itself has 13% of its floor under 24 and eleven dark stretches (`smak map-light`), so
   an honest copy fails the build. The picture-leg agent added 36 lights to clear it ("I kept the 36 as few
   as I could and still keep every room above the darkness limit"), and P6 scored 0: "lights everywhere
   evenly, so the original's dark areas are gone".
4. **The plan picture has no coordinates.** It has a 256-unit scale bar and nothing else to measure by, and
   the agent cannot measure pixels (no `run`). The picture leg came out 2944 x 2480 against 2432 x 2080: a
   uniform 21% scale error on both axes, which alone takes the floor overlap under 0.70.
5. **The spec has no angled solid.** Prefab pieces are `box`, `wedge` (a ramp) and `cylinder` (SPEC.md,
   "Prefabs of brushes"), while `src/maps/source.mjs` already has `prism` and `solid` (any convex brush).
   The agents faked frenzy's 45-degree walls with cylinders: 262 cylinder pieces in the BSP leg's spec, 76 in
   the picture leg's; the judge: "the pit's angled edges and the northeast curved corridor are
   stair-stepped".

For the BSP leg, the answer already exists: **goldsrc.net's `tools/bsp2map`** (Steven's, 844 lines of
standard-library Python) decompiles all 127 retail Half-Life maps into `.map` files SDHLT recompiles, with
99.72% of seen face area matched and 99.99% of it on the retail texture, plus a texlight list calibrated
against the retail lightmaps. Its `frenzy_dc.bsp` scores 0.998 texture agreement, light correlation 0.84 and
a view SSIM of 0.92 against the original, where the BSP leg scored 0.30, 0.53 and 0.36 (tables 2 and 6).

For pictures, a measured result: identifying the game texture a lit view shows, by rectifying each surface
into texture space and correlating it against all 3,116 textures of `halflife.wad`, names the right one first
for 62% of patches (67% within its family), where the kit's present `pick` by average colour names it within
the top 20 for none (table 4).

## 2. Ranked: expected gain for least work

Gains are in rubric points (each item 0-2) on the leg named; they are estimates from the judge's reasons and
the measurements below, not measured.

```
 #  Fix                                                    Legs         Items        Gain     Work
 1  MCP renders maps with the --wads folders               bsp, all     P5 P7 P9     +1 to +2 an hour
 2  Per-face texture listing of a BSP (info full / tool)   bsp          P5 P7 P9     +1 to +2 half a day
 3  Dark rooms allowed: spec `light: "dark"` and a         pictures,    P6 P9        +1 to +2 half a day
    reproduction mode that warns instead of faulting        words
 4  Coordinate grid with labels on plan, storeys, section  pictures     P1 P2 P4     +2 to +3 half a day
 5  Spec pieces `prism`/`solid`, rooms with an `outline`   all          P1 P2 P7     +1 to +2 2-3 days
    polygon (angled walls, octagons, leaning walls)
 6  Calibrated texlight table (goldsrc.net lights.rad)     all          P6 P9        +1      half a day
    used by default for game textures; spec `glow` on a
    game texture
 7  Texture identification tool: rectify + NCC over the    pictures     P5 P7 P9     +1 to +2 2-3 days
    .wad, then a contact sheet for the agent to confirm
 8  View metric in the judge (SSIM/4 + brightness ratio)   all          P9 honesty   measure  a day
    and the aligned lightmap metric for P6
 9  Port bsp2map to the kit (`map-decompile`), and a       bsp          all          leg      1-2 weeks
    spec that includes a decompiled .map as a prefab                                 passes
10  Plan vectoriser tool (trace floors to polygons)        pictures     P1 P2        +1      3-5 days
11  Text-to-texture search (CLIP or captions)              words        P5           +0 to +1 a week
```

Items 1-4 and 6 are the cheapest and touch the failures every leg shares; item 9 decides the BSP leg but
changes what that leg tests (section 5.3).

## 3. What round 1 actually built, measured against the original

### 3.1 Surfaces, textures and light, face by face

`facecheck.py` walks every world face of the original (area-weighted, sky and tool textures left out), looks
for a reproduction face on a parallel plane (normals within 18 degrees) within 6 units that holds the face's
centre, and compares the texture names and the style-0 lightmap at that point. Run with no shift: the
reproducers built at the original's coordinates (the judge's floor alignment of [0, 0, -15] for the BSP leg
drops coverage to 0.38, so it is a floor-plan alignment, not a surface one).

Table 2: the original against each reproduction, and against goldsrc.net's decompile.

```
Map                        Surface found   Same texture   Light ratio     Light correlation   Mean abs diff
                           (share of area) (share of all) (repro/orig)    (area-weighted)     (of 255)
words leg                  0.18            0.00           2.09            0.58                58
pictures leg               0.50            0.00           2.27            0.12                59
bsp leg                    0.85            0.30           0.74            0.53                19
bsp2map frenzy_dc          1.00            1.00           0.81            0.84                12
```

The BSP leg's largest confusions: the original's most-used wall, `c3a1b_w3` (21% of the area), never
appears in it (15% of the map's area went to `c3a1b_w1` instead), nor do `c3a1_w3a` (19%), `tnnl_flr7c`
(11%) or `c3a1b_w7` (10%). The picture leg put `c1a3_w1e` (concrete with a green band) on everything; the
word leg `crete2_flr02`, `grate_rust`, `lab1_compx` and `crete3_wall01`. Frenzy's texture scales: 77% of
its area at scale 1, 23% at scale 2.

goldsrc.net's own `lightcheck.py frenzy dc` (mean at the original's face centres) gives the decompile
`all 0.91, up 0.80, side 0.92`; the 0.81 above is the same comparison by `facecheck.py`'s matching.

### 3.2 The original's light

Frenzy is lit by 8 `light` entities, all `_light "247 249 157 75"`, all in the north-east annex (entities
17-31), and otherwise by texlights: `+0~fifties_lgt2` (40 faces, 18,812 square units),
`+a~fifties_lgt2` (33, 16,992), `+0~fifts_lght01` (4, 20,480) and `+0~generic86` (10, 2,862). SDHLT's
shipped `tools/lights.rad` has every line commented out (`/media/Data3/Packages/SDHLT/tools/lights.rad`,
seedee/SDHLT `8012bc6`), so a game texture emits nothing unless the map says so. The BSP-leg agent did write
an `info_texlights` (values `+0~FIFTS_LGHT01 255 255 210 4000`, `+0~FIFTIES_LGT2 210 225 255 1000`,
`+A~FIFTIES_LGT2 255 245 195 3000`, `+0~GENERIC86 255 250 235 2500`); the picture-leg agent believed "the
spec can't make" them. The spec makes texlights only for its own materials marked `fullbright`
(`src/spec/map.mjs` lines 1124-1134).

### 3.3 A light experiment that did not behave as expected

Recompiling the BSP leg's `.map` with SDHLT (`-extra -bounce 3`, as its spec asked) under four texlight
settings, measured with `facecheck.py`:

```
Variant                                                     Direct lights   Light ratio   Correlation
agent's info_texlights (as built)                            436             0.74          0.53
goldsrc.net calibrated values in info_texlights              436             0.73          0.54
the same values times ten                                    436             0.73          0.54
info_texlights removed (8 light entities only)               8               0.43          0.18
times-ten texlights, the 8 light entities removed            428             2.06          0.61
```

The texlights clearly light the map (0.43 without them), but their brightness made no measurable difference
while the 8 `light` entities were present, and a great one once they were gone. I did not find the cause in
the time (hlrad parsed all of them: "91 texlights parsed", "Reading texlights from info_texlights map
entity"). It needs a proper look before item 6 is built, since it says calibrated values alone may not move
P6 (section 8).

### 3.4 Views

Table 6, from the judge's own `views.png` pairs (8 starts, 480 x 300 each) and, for the decompile, the same
cameras drawn by `dcviews.mjs`. SSIM on luminance at a quarter and an eighth of the size, the Bhattacharyya
distance of 512-bin colour histograms, and the mean absolute log of the brightness ratio.

```
Pair                       SSIM/4   SSIM/8   Colour-histogram distance   |log brightness ratio|   Judge P9
bsp2map frenzy_dc          0.92     0.91     0.16                        0.32                     (not judged)
bsp leg                    0.36     0.33     0.25                        0.70                     1
pictures leg               0.23     0.16     0.67                        1.12                     0
words leg                  0.14     0.11     0.72                        1.37                     0
```

Every column orders the four as the judge did. Three of the eight starts (5-7) look at near-black walls in
the original; on those the histogram distance is 0.00 for the BSP leg (all pixels in the darkest bin), so a
measure must normalise exposure or set those pairs aside.

## 4. Textures (P5, P7): which game texture a picture shows

### 4.1 Experiment: identification against all of halflife.wad

Ground truth without hand labelling: each of 16 views of frenzy (the kit's `viewsOf`, 640 x 480, the
original's light, as the picture leg's `views.png` was made) is drawn three times: lit, and twice with every
texture replaced by an "ID" texture of the same size whose palette encodes the texture's number and whose
pixels encode the texel's column and row (the low four bits in one picture, the high four in the other; the
renderer's scene cache is keyed by texture names, so the two ID renders need different `sky` colours to be
redrawn). Every pixel then knows its texture and its texel. A patch is one texture's texels in one view,
400 or more of them; 97 patches. Candidates: all 3,116 textures of `halflife.wad`.

Table 4 (`texid.mjs`, `texid3.mjs`; output `texid3.out`):

```
Method                                                       Top 1   Top 5   Top 20
average colour, absolute (what the spec's `pick` uses)       0.00    0.00    0.00
average chromaticity                                         0.00    0.01    0.04
colour histogram in the picture, not rectified               0.14    0.26    0.34
rectified: chroma + LBP histograms                           0.02    0.19    0.32
rectified: NCC over all cyclic offsets, all candidates       0.62    0.68    0.71
   (coarse pass at every 4th offset on 400 texels, then
    the top 40 again at every 2nd offset on all texels)
   same, counting a sibling of the family as right           0.67
```

What works: once a patch is in texture space at the right scale, the best NCC over offsets is high for the
true texture (0.66-0.99) and the lit picture's light does not matter much; the texlight textures
(`+0~fifties_lgt2` 0.95, `+a~fifties_lgt2` 0.99), `c3a1b_w2` (0.93-0.97), `tnnl_flr7c` (0.66-0.92) and
`c3a1b_w1` are found every time. Colour statistics fail because the light is coloured and uneven: the
annex's orange lamps moved every patch there out of the histogram shortlist.

What fails: big smooth concrete (`c3a1_w2`, `c3a1_w3a`, parts of `c3a1b_w3`) correlates better with smooth
gradient textures (`c1a4_silo2`, `fade`, `fade2`) because the light's own gradient dominates a patch with
little texture; and `{rail1b`, a masked texture, whose holes show what is behind. Fixes, untried: divide the
patch by a 16-unit low-pass of itself (the lightmap's own resolution, `LUXEL = 16`) before the NCC; weight
the score by the candidate's own contrast; and use the family prior (Valve's names carry the chapter and
area, `c3a1b_*`: once two surfaces are `c3a1*`, siblings go first).

The experiment is generous in one way: it rectifies with the original's own texture coordinates. In the
picture leg the agent has only its own rebuilt geometry. That is enough: the rectification needs the
plane and the camera (the views name their `from` and `yaw`, and the kit's `viewFrom` gives the field of
view), and the cyclic search over offsets makes the texture's alignment irrelevant. Scale and rotation are
not searched here; frenzy's are 1 (77% of the area) or 2 (23%) and unrotated, so search scales {1, 2} and
the four right-angle turns.

### 4.2 Other descriptors, briefly

- Colour histograms (Swain and Ballard, "Color indexing", IJCV 1991) and LBP (Ojala, Pietikainen, Maenpaa,
  IEEE TPAMI 2002): measured above; neither survives the coloured, uneven light on their own.
- Gabor filter banks: the same failure as LBP is likely, since both are statistics of local structure; not
  tested.
- Perceptual hashes (pHash, dHash): designed for near-identical whole images; a patch is a cropped, tiled,
  lit and resampled piece of a texture, so I expect them to fail; not tested.
- Embeddings: CLIP (Radford et al., ICML 2021) or DINOv2 (Oquab et al., 2023) on ROCm. PyTorch is not
  installed on this machine (`import torch` fails), so not tested. For picture-to-texture, NCC already gives
  0.62 with no dependency; an embedding is worth trying only as the shortlist stage.

### 4.3 The agent as the last stage

The reproducing agent reads pictures. The cheapest robust design is a shortlist by NCC (top 8 per surface)
shown as a contact sheet beside the patch, with names, for the agent to choose from. The kit already draws a
`.wad` texture enlarged (`src/spec/wad.mjs` line 118); a sheet of a `.wad`'s textures read from the user's
own game folder copies nothing (AGENTS.md rule 7).

### 4.4 From words

Valve's names are terse (`c3a1b_w3`), so the spec's `pick` by name words and tone has little to go on: the
word leg described "concrete with recessed computer panels" and got `lab1_compx`. Three ways, cheapest first:

1. Contact sheets for the agent: `info` on a `.wad` with `sheet: true` and a filter (tone, size, name
   prefix), 100 textures a page; 32 pages for `halflife.wad`. The agent browses with its own eyes. Hours.
2. A caption index made once on the user's machine (by the agent, a page at a time, or a local VLM), kept in
   the work folder, searched by words. It describes the game's textures, it does not copy them.
3. CLIP text-to-image retrieval over the `.wad`, as an optional Python helper. Not tested here.

A describer helps most by naming what the builder can look up: the texture's colours and pattern in plain
words plus where it is, e.g. "grey concrete, a band of recessed panel windows showing racks of equipment, 160
high, from the floor to 160 on every wall of the halls". Section 6.4 has the rest.

## 5. Light (P6) and the BSP leg

### 5.1 What goldsrc.net already learned

`goldsrc.net/godot/tools/bsp2map/README.md`, "Lighting" (2026-09-04), from recompiling all 127 retail maps:

- Valve's maps are "lit largely by `~light` textures declared at compile time"; SDHLT's list is commented out,
  so maps lit by texlights alone came out black.
- **Recovering emitters from a BSP** (`texlights.py`): a texture whose faces average near-white lightmaps
  wherever it appears is an emitter. **Colour** (`texlight_colours.py`): hlrad adds a texlight's full
  `baselight` to its own face and clips hue-preserving, so the luxels on the emitter with a channel at 250
  or more, normalised, per-channel 25th percentile, are the emission colour. Liquids (`!toxicgrn2`) emit too.
- **Brightness** (`calibrate_texlights.py`): at receiver points near each emitter's faces (world faces
  within 96 units, else 192), the ratio of retail to recompile lightmap luminance; scale by the median; repeat
  after each recompile. A per-map list (`rad/<map>.rad`) for maps off by more than 15%.
- **Reflectivity**: `-texreflectgamma 1.0 -texreflectscale 0.7` ("qrad's own formula") is its default; with
  it the set's median ratio is 0.97 and 112 of 127 maps are within 25% of retail.
- The list: `mods/valve/src/maps/lights.rad`, 91 entries. Frenzy's four: `+0~FIFTS_LGHT01 210 218 255 2500`,
  `+0~FIFTIES_LGT2 217 224 255 2600`, `+A~FIFTIES_LGT2 247 255 205 2000`, `+0~GENERIC86 255 241 172 16100`.

hlrad reads `lights.rad` from the map's folder, then its own folder, then the working directory, plus any
`-lights <file>`, then `info_texlights`, which wins for a name given twice (SDHLT `src/sdhlt/sdHLRAD/qrad.cpp`
lines 3071-3203 and 3531; Valve Developer Community, "Info texlights (GoldSrc)" and "Rad file"). The kit
compiles in a temporary folder (`compileMap`, `src/maps/compile.mjs` line 456), so a `lights.rad` beside the
`.map` is not seen: it must go through `-lights` or `info_texlights`. A `light` entity's keys hlrad reads
include `_light "r g b brightness"` and `_fade` (`lightmap.cpp` lines 1869-1901).

### 5.2 Recommendations for light

- **Ship the calibrated values as the kit's default for game textures** (item 6): any game texture whose
  name is in the table and that the map wears gets an `info_texlights` line, unless the spec says otherwise.
  Spec: a material `{ "texture": "+0~FIFTIES_LGT2", "glow": 2600 }` or `"glow": false`. Ask Steven whether
  the goldsrc.net numbers may be copied into this kit (they are measured numbers, not Valve's files).
- **Dark is allowed** (item 3): a room's `light: "dark"` (or a floor target) is held to it, and a
  map-level `reproduce: true` turns the dark fault into a note. The report should state the dark share, so the
  agent can match the original's 13%.
- **From pictures, close the loop on brightness**: the views give each place's mean brightness
  (`facts.brightness`); the build draws its own views from the same points (the `reference` mechanism) and
  states the ratio per view. An agent then scales lamps to match. Inverse lighting proper (Marschner and
  Greenberg, "Inverse lighting for photography", Color Imaging Conference 1997; Yu, Debevec, Malik, Hawkins,
  "Inverse global illumination", SIGGRAPH 1999) recovers light or reflectance from photographs with known
  geometry; here the emitters are visible textures whose values the table already gives, so the inverse
  problem reduces to "which faces are lamps" (section 4) and one brightness scale per lamp type.
- **The metric for P6**: table 2's columns, given to the judge as a measurement: light ratio, area-weighted
  correlation and mean absolute difference at matched surface points, plus the dark-floor share of each map.
  Where too little surface matches (the word leg: 0.18), fall back to floor light sampled on a grid at the
  aligned floor positions (`lightReport` cells).

### 5.3 Recovering brushes from a BSP (item 9)

How decompilers work, from bsp2map's README ("Method", "Versus the existing decompilers"):

- **Face extrusion** (BSPTwoMAP, WinBSPC): each face is pushed back into a thin brush. Documented as
  "razor-thin, leaking and misaligned".
- **Tree walking** (bsp2map, and the Half-Life Unified SDK Map Decompiler's "Tree" mode): each non-empty leaf
  of a model's hull-0 tree is the convex region its path's node planes cut out of the model's box; one brush
  per region, textures taken from the BSP face of the same model on the same plane with the largest overlap,
  written as Valve 220 axes ("lossless"). Then the compiler's rules: no face under half a square unit, no
  acute wedges, near-coplanar planes unified, thin air leaves filled, brush entities clipped to their box,
  convex cells merged.
- Measured on all 127 retail maps with SDHLT: bsp2map 127 of 127 compile; Unified SDK Tree 62 of 127 (54
  leaks). newbspguy edits a BSP in place and exports `.obj`, `.wad`, `.ent`, not `.map` (Valve Developer
  Community, "Newbspguy"; github.com/UnrealKaraulov/newbspguy).
- Lost by construction: the clip-only brushes, the mapper's own brush split, and the lightmap (recomputed).

**Is it in scope?** For people, yes: "change the brushes of a compiled map" is in the right-hand column of
AGENTS.md today, and a decompiler moves it left. The spec can already take a `.map` as a prefab
(`prefabs: { name: { file } }`), so a decompiled map becomes a spec of one prefab plus its entities. For the
reproduction test it makes the BSP leg a test of the decompiler rather than of the agent's reading. Two
sound options: keep the decompile tool out of the BSP leg's server (the leg then measures reading), or score
it as its own leg. Porting is about 1,000 lines of JavaScript from 844 of Python with no dependency; goldsrc.net
has no LICENSE file, so the copy needs Steven's say.

Short of a decompiler, items 1 and 2 give the BSP-leg agent what it lacked: textured views of the original
and a list of faces with their texture, plane, area and centre (`faceTexture`, `facePolygon` in
`src/maps/bsp.mjs` already exist).

## 6. Layout from pictures and words (P1, P2, P3)

### 6.1 The scale

The picture leg's 21% oversize is uniform, which says scale, not shape. A plan for a builder should carry
coordinates: a grid every 256 units with its numbers on the edges (and `+x`, `+y` as now), on the plan, each
storey and each section's horizontal axis, and the eye point and yaw printed under each view (the views
already name their entity). Then no pixel has to be measured.

### 6.2 Vectorising a plan picture

- Real floor plans: Liu, Wu, Kohli and Furukawa, "Raster-to-Vector: Revisiting Floorplan Transformation",
  ICCV 2017 (a network predicts junctions, integer programming joins them into walls, doors and icons;
  about 90% precision and recall). Later learned methods (CubiCasa5K, Kalervo et al. 2019; RoomFormer, Yue et
  al., CVPR 2023) need training data and a GPU, and solve noise this kit's pictures do not have.
- The kit's own plans are clean: floors are flat fills, outlines white, entities marked, the scale bar fixed.
  A `trace` tool (item 10) can segment by fill colour, follow each region's border, simplify it (Douglas and
  Peucker, "Algorithms for the reduction of the number of points required to represent a digitized line",
  Cartographica 1973), snap edges to multiples of 45 degrees and corners to an 8- or 16-unit grid, read the
  scale bar, and return polygons in units with the floor height written beside each. With grid labels (6.1)
  even that is optional for an agent that can read the numbers off the picture.
- For a person's own drawing (a photo of paper), the learned methods are the reference; not needed for this
  test.

### 6.3 Angled walls in the spec

The library has what is needed (`prism(axis, outline, from, to, texture)` for a convex outline drawn along
an axis, `solid(points)` for any convex brush, `src/maps/source.mjs` lines 456-496); the spec does not expose
it. Proposed (item 5):

```json
{ "id": "pit", "outline": [[-890, -100], [-700, -300], [-190, -300], [0, -100], [0, 100], [-190, 300], [-700, 300], [-890, 100]],
  "floor": 0, "height": 600 }
```

- A room's `outline` (a polygon in the plan, either way round, convex or not) carved from the rock: the rock
  round it is the box of the outline minus the outline, cut into convex prisms (a concave outline split into
  convex pieces first, e.g. Hertel-Mehlhorn). Links between outlined rooms go through the edge they share.
- Pieces `{ "prism": { "outline": [...], "from": 0, "to": 128, "axis": "z" } }` and
  `{ "solid": [[x, y, z], ...] }` (the convex hull of the points), so a 45-degree wall, a chamfered pillar or
  a leaning wall (`axis: "x"` with a sloped outline) is one brush.
- `lean` on a wall of an outlined room (inward by so many units over its height), for frenzy's outer walls
  "that slope inward from 576 down to 320".
- Multi-level walkways are already rooms `in` others with a `floor`; with outlines they take the same shape
  as the ring they follow.

### 6.4 From words

The word leg's description did give numbers (x -1480 to 944, y -1000 to 1040, heights 0, 160, 320, 512),
yet the build came out 3616 x 2336 with 16 of 58 entities placed, as one room filled with 237 box pieces.
Two things would have caught it:

- **A declared target, checked by the build**: `expect: { bounds: [[-1480, -1000], [944, 1040]],
  floors: [0, 160, 320, 512] }`, and the report says how far the built extents and walkable floor heights
  are from it. The builder then iterates against numbers, not against a memory of the text.
- **What a describer must say**, to be placeable: every area's corners or centre and size in units, its floor
  and ceiling height, the angle of any wall that is not along an axis, which areas it opens into and through
  what (door, stair with its run and rise, ladder, drop), and the coordinates of every pickup and start. A
  description by relations only ("east of the atrium, a little lower") lets the builder choose sizes, and the
  overlap shows it. This is the kit's own spec vocabulary; a describer told to write in it is told what the
  builder can use.

## 7. A measured gate for P9 (item 8)

- **SSIM** (Wang, Bovik, Sheikh, Simoncelli, IEEE Transactions on Image Processing 2004) on luminance at a
  quarter of the size separates the four maps cleanly (table 6: 0.92 / 0.36 / 0.23 / 0.14) and runs in plain
  JavaScript in milliseconds. It is pixel-aligned, so it also punishes a small camera offset; downsampling
  softens that.
- **Brightness**: the mean |log ratio| of the views' brightness, with near-black pairs compared by their
  brightness only.
- **LPIPS** (Zhang, Isola, Efros, Shechtman, Wang, CVPR 2018), **DISTS** (Ding, Ma, Wang, Simoncelli, IEEE
  TPAMI, arXiv 2004.07728; built to tolerate texture resampling) and **FLIP** (Andersson et al., Proc. ACM
  Comput. Graph. Interact. Tech. 3(2), 2020; made for rendered images against a reference, with reference
  code in C++, NumPy and PyTorch) are better models of what a person notices; each needs Python or a port.
  Not tested here.
- **A gate**: from table 6, a view SSIM/4 of 0.6 or more on the lit starts would pass the decompile and fail
  every round-1 leg. That threshold is a guess from four points; the rubric's decoys (a plain room of the
  original's size, another subject's map) must be scored before it is written into the rubric, which per
  `rubric.md` does not change after the first build: so it would be a measurement handed to the judge (as P2
  and P4 are), not a new rule.

## 8. Build list

1. `mcp/tools.mjs` `renderMap`: add `folders.wads` to the folders (and to `info` and `check` of a map).
   Verify: a BSP view of frenzy through the server reports no `missing` textures.
2. A per-face texture listing for a BSP: `info` with `faces: true` (or a `faces` tool), each world and brush
   entity face with texture, scale, normal, area and centre, grouped by plane; or textures by region on the
   plan. Verify: rerun the BSP leg; target "same texture" in `facecheck` from 0.30 to over 0.8.
3. Dark rooms: spec `light: "dark"` per room and `reproduce: true` per map; the dark fault becomes a note
   there; the report gives the dark share.
4. Plan, storeys and section pictures with a labelled 256-unit grid; views with their eye point and yaw
   printed. Regenerate `frenzy/input/`.
5. Spec `outline` rooms and `prism` / `solid` pieces, with `lean`; SPEC.md updated; a worked octagon in
   `examples/prompts/`.
6. Investigate section 3.3 (texlight brightness ignored while `light` entities are present) in SDHLT's
   hlrad, then ship the calibrated texlight table as the default for game textures, with the spec's
   `glow` to override. Verify with `facecheck`'s light ratio and correlation on the BSP leg's map.
7. Texture identification: rectify each surface of a view through the agent's rebuilt geometry, NCC against
   the `.wad` at scales 1 and 2 and four turns, low-pass light removal, family prior; return a contact sheet
   of the top 8. Target top-1 above 0.62 on `texid3.mjs`'s 97 patches, then on a second map.
8. Judge measurements: `facecheck`'s texture share and light ratio/correlation (P5, P6), view SSIM/4 and
   brightness ratio (P9), all given to the judge; decoys scored first.
9. Ask Steven about porting bsp2map and its texlight table into the kit, and whether the BSP leg's server
   gets the decompiler.
10. Later: plan `trace` tool; `.wad` contact sheets and a caption index for words; CLIP only if those fall
    short.

## 9. What I could not verify

- Why texlight brightness had no effect on the BSP leg's map while its 8 `light` entities were present
  (section 3.3). Until that is understood, the gain claimed for item 6 is unproven.
- The texture identification was measured with the original's exact texture coordinates and on frenzy only;
  with an agent's rebuilt geometry, other maps, and textures at scale 2, it is untested. Low-pass light
  removal and the family prior are untested.
- CLIP, DINOv2, LPIPS, DISTS and FLIP: no PyTorch on this machine; none was run.
- The gains in section 2 are estimates from the judge's reasons, not reruns of the legs.
- Whether goldsrc.net's bsp2map code and calibrated numbers may be copied into this kit (no LICENSE file in
  that repository).
- The 0.6 SSIM gate: four data points and no decoy.
- Web claims about third-party decompilers' current state come from bsp2map's README (measured 2026-09-03)
  and the Valve Developer Community pages, not from running them here.

## Sources

- This repo: `examples/reproduce/rubric.md`, `examples/reproduce/frenzy/*/judge.json`, `answer.md`,
  `spec.json`, `built/`; `mcp/tools.mjs`; `src/spec/map.mjs`; `src/maps/{light,compile,source,bsp,draw}.mjs`;
  `docs/SPEC.md`; `research/backlog.md`.
- goldsrc.net (git@github.com:goldsrc-net/godot.git): `tools/bsp2map/README.md` and its scripts;
  `mods/valve/src/maps/lights.rad`; `mods/valve/gamedir/valve/maps/frenzy_dc.bsp` (2026-09-04).
- SDHLT, seedee/SDHLT `8012bc6`: `src/sdhlt/sdHLRAD/qrad.cpp`, `lightmap.cpp`, `tools/lights.rad`.
- Half-Life (Steam): `valve/maps/frenzy.bsp`, `valve/halflife.wad`; measured, nothing copied.
- [Valve Developer Community: Info texlights (GoldSrc)](https://developer.valvesoftware.com/wiki/Info_texlights),
  [Rad file](https://developer.valvesoftware.com/wiki/Rad_file),
  [RAD file (GoldSrc)](https://developer.valvesoftware.com/wiki/RAD_file_(GoldSrc)),
  [Newbspguy](https://developer.valvesoftware.com/wiki/Newbspguy),
  [BSP Decompilation](https://developer.valvesoftware.com/wiki/BSP_Decompilation);
  [TWHL: Texture Lighting](https://twhl.info/wiki/view/50);
  [newbspguy](https://github.com/UnrealKaraulov/newbspguy).
- [Liu et al., Raster-to-Vector, ICCV 2017](https://openaccess.thecvf.com/content_iccv_2017/html/Liu_Raster-To-Vector_Revisiting_Floorplan_ICCV_2017_paper.html);
  [Ding et al., DISTS, arXiv 2004.07728](https://arxiv.org/pdf/2004.07728);
  [Andersson et al., FLIP, 2020](https://research.nvidia.com/publication/flip).
- Cited from the literature without re-reading here: Swain and Ballard 1991; Ojala et al. 2002; Wang et al.
  2004 (SSIM); Zhang et al. 2018 (LPIPS); Radford et al. 2021 (CLIP); Oquab et al. 2023 (DINOv2); Marschner
  and Greenberg 1997; Yu et al. 1999; Douglas and Peucker 1973; Kalervo et al. 2019 (CubiCasa5K); Yue et al.
  2023 (RoomFormer).
