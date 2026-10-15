# Texturing a character made to match pictures: research and tests

Research of 2026-10-15, after Steven's review of the zombie reproduction ("bulkier ... in side profiles it looks
like he's holding a sledgehammer ... the hands/long fingers are wrong, think salad fingers ... the textures are
nowhere near right. We need to find some method on how to unwrap these textures"). It builds on
`3d-fidelity-methods.md` (FM) and `photo-to-model-experiments.md` (PE) and does not repeat them.

Abbreviations: M4 and M5 (the rubric's colour and surface-detail items; M4 is the CIE76 colour difference,
ΔE, of the judges' pictures smoothed over 7 x 7 dots, pass under 15), IoU (intersection over union), UV (texture
coordinates), MRF (Markov random field), SDF (signed distance field), VRAM (video memory), ROCm (AMD's GPU
compute stack), LLM / VLM (large language / vision-language model), SDS (score distillation sampling), PBR
(physically based rendering materials).

Every number below was measured on this machine today unless marked otherwise. The scripts are in
`~/stignored/texturing-research/` (`lib.mjs` and `e0.mjs` to `e7.mjs`, `charts.mjs`, `warp.mjs`, `hy/`), outside the
repository; they read the game's files in place and write nothing into the kit. Nothing of the game was copied.

## The answer in short

**The texture is not what failed. The shape did.** The kit's own `project`, given the zombie's true shape,
paints it to M4 5.4 (the reproduction scored 16.9; the pass line is 15). The same projector on the maker's shape
gives 16.6. A shape carved from the same pictures (the `carved` kind, as a prop) and projected with nothing
changed scores **8.3**, and 7.7 with a better layout. No texturing method rescues a body whose outline shares
0.26 to 0.42 of the original's: the judges compare pixels where the shape is, and Steven sees a coat painted on
a body that stands differently.

So the order of work for characters is: make the shape fit the pictures (pose, arm length, a carved or fitted
body, real fingers), then lay the texture out by view charts, then paint thin parts by their length. Generative
texturing does not help a reproduction from pictures; it is for parts no picture shows, and on this card the one
open model that now runs gave flat, detail-free colour on this character.

## What went wrong with the zombie, measured

| Leg | Outline IoU front/back, sides, top | M4 | Local contrast against the original (M5 stand-in) | Texture used |
| --- | --- | --- | --- | --- |
| pictures (maker's spec) | 0.42, 0.26, 0.31 | 16.9 | 0.81 | 11.9% of a 512 x 512 sheet |
| words | 0.49, 0.17, 0.21 | 32.9 | 0.64 | 9.6% of 256 x 256 |

Read from the maker's spec and answer, and the judges' pictures:

- **The sledgehammer.** The maker built on Gordon's skeleton (`player/gordon/gordon.mdl`), whose first frame
  holds a gun forward in both hands. The spec's pose keys turned the spine and swung the upper arms a little but
  left the forearms where Gordon holds his gun, so both hands sit raised in front of the chest. From the side,
  with three claws a hand, that reads as holding a hammer.
- **Bulk and short arms.** Gordon's arm is about 22 units shoulder to wrist (the maker's figure); the zombie's
  own skeleton has 15.4 + 13.0 = 28.4, and then fingers of 10 to 13 units, as long as its forearm. The spec has no
  way to lengthen a base's bones, so the maker made the body wider instead and the hands stopped 13 units higher.
- **The hands.** The zombie has four fingers a hand, each three segments of a 3 or 4 sided tube 0.5 to 1 unit
  across, ending in one point: about 25 triangles a finger, curled and splayed. The maker gave three straight
  4-sided cylinders 16 long on one bone each.
- **The texture.** With the shape that far off, each picture's colours land on the wrong surfaces. The sheet was
  also 88% empty: blob parts are laid as six whole-side projections (front, back, left, right, top, below) in a
  3 x 2 grid of the part's zone, so most of the zone is never worn.

## How Valve textured the zombie (and what to copy)

`smak info` and `smak uv` on `models/zombie.mdl` (picture in `~/stignored/texturing-research/orig/uv-montage.png`):

- 844 triangles, **19 textures**, all small: chest 72 x 98, back 56 x 89, pelvis 56 x 63, each arm about 20 x 52,
  each leg's front and back 16 to 20 x 49 to 63, the head's pieces 36 x 21 to 72 x 83, the hand 40 x 74. About
  40,000 texels in all, a sixth of one 512 x 512 sheet, and each texture with its own 256-colour palette.
- **Each texture is one region seen from one side**, painted as a picture of that side: the chest from the front
  with the ribcage drawn in, the back from behind, each leg's front and back apart, each arm as one strip. The
  wireframe over each texture is a planar projection of that region (3ds Max's planar mapping per region, the
  practice of 1998). Faces at the region's sides are stretched; nobody sees them squarely.
- **The hand is one drawing** of a whole hand from above (40 x 74), and all 254 claw triangles of both hands, 30%
  of the model, are laid on it by the same planar projection. Fingers get their colour from where they lie on that
  drawing: dark flesh at the knuckles, red at the tips.
- Front and back of some parts share pixels (an arm's strip), as mirrored halves did then.

What an automatic pipeline can copy: regions by bone, each projected along the direction its pictures see it,
charts split where two layers would share texels, the head and hands given their own texels, thin repeated parts
(fingers) sharing one strip painted by position along them. All of it follows from the pictures and the
skeleton; none of it needs a person.

## Tests on the zombie

All measured as the judge measures (`examples/reproduce/lib.mjs`: ten views at 384 dots, M4 over the outline both
share), plus the local contrast of `research/sharpness.mjs` over the six sides (1.0 is the original's).

### E1: the kit's projector on the true shape (the upper bound)

The original's triangles in the first frame, its own 19-texture layout cleared to grey, the eight input pictures
projected by `paintProjections` exactly as a spec build would.

| Shape | M4 | Contrast | Note |
| --- | --- | --- | --- |
| the original's | **5.4** | 0.86 | near identical to the original by eye (`e1-orig-geom.png`) |
| the original's, views blended more (`SMAK_SQUARE_SHARE` 0.5) | 5.2 | 0.78 | softer |
| the original's, light not divided out | 5.4 | 0.86 | the pictures are flat renders: little light to remove |
| the maker's | 16.6 | 0.80 | what the judge saw (16.9 with the build's finish) |

One fault found on the way, in my harness only: the triangles a `.mdl` holds wind the other way from what
`paintProjections` expects of a spec's meshes (signed volume negative), so a script that projects onto a model read
from a file must reverse each triangle. Worth a line in the docs if `project` is ever offered on an existing model.

### E2: a hull carved from the pictures

A `kind: "prop"` spec with one `carved` part from `sides.png` and the four angle pictures, `smooth: 80`, 1,700
triangles, and the same eight pictures projected (spec and build in `~/stignored/texturing-research/e2/`).

| Cells | M4 | Contrast | Outline IoU front/back, sides, top | Lost thin pieces |
| --- | --- | --- | --- | --- |
| 160 | **8.3** | 0.94 | 0.87, 0.96, 0.84 | 50 (finger segments) |
| 256 | 9.6 | 0.98 | 0.70, 0.96, 0.66 | 52 |

It passes M4 with no change to texturing. At 256 cells the reduction to 1,700 triangles spends them worse and the
outline drops. 1,700 is just over twice the original's 844, the judges' cap, so a real run wants about 1,600. The
fingers come out broken and thin (`e2/carved160-cmp.png`): a carve loses what is thinner than its cells.

### E3: warping each picture onto the model's outline before projecting

Gal et al. 2010 shift labels per face to fix misregistration; Zhou and Koltun 2014 warp each image on a lattice.
I tried the cheap form: per view, the picture's outline registered to the model's own outline by demons (Thirion
1998) on clamped signed distance fields, 150 iterations, Gaussian regularisation, then the warped picture handed to
the unchanged projector (`warp.mjs`).

| Shape | Outline IoU before, after (8 views) | M4 plain | M4 warped |
| --- | --- | --- | --- |
| maker's (pictures leg) | 0.33 to 0.47, 0.51 to 0.79 | 16.6 | 17.4 |
| maker's (words leg) | 0.12 to 0.48, 0.15 to 0.68 | (n/a) | 19.0 |
| the original's | 0.86 to 0.98, 0.91 to 0.98 | 5.4 | 5.3 |

**No gain.** A smooth warp cannot turn a raised arm into a hanging one, and where the shape is right there is
nothing to fix. The warped texture does land more coherently on the maker's body (the back's ribcage on its back),
but M4 measures the shape too. Declined as a build item; it may still matter for photographs of real things,
where a generated shape is close but never exact (PE), at 0.8 IoU and over.

### E4: the layout, with shape and pictures fixed

The carved hull of E2, its own triangles, the same projector; only the texture coordinates change. The new layout
is **view charts** (`charts.mjs`, 250 lines): each face to the axis view that sees it best (data term (1 - cos) x
area, Potts smoothing by shared edge length, ICM), its coordinates its orthographic projection along that view, a
chart split into layers wherever two of its faces would share texels (the arm in front of the chest), then shelf
packing at the one scale that fills the sheet.

| Layout | Charts | Sheet covered | M4 | Contrast |
| --- | --- | --- | --- | --- |
| kit's six-side grid (as built) | 6 cells, overlapping | 6.9% | 8.3 | 0.97 |
| view charts, 6 views, 512 | 267 (192 of 1 to 3 faces) | 24% | **7.7** | 0.87 |
| view charts, Potts 2 | 263 | 23% | 7.7 | 0.86 |
| view charts, 10 views | 427 | 23% | 7.7 | 0.87 |
| view charts, 6 views, 256 x 256 | 267 | 19% | 7.8 | 0.87 |
| on the original's shape: Valve's 19 textures | 19 | | 5.4 | 0.86 |
| on the original's shape: view charts, 512 | 188 | 25% | 5.2 | 0.84 |

What this says:

- **The automatic layout is as good as Valve's hand layout** for what the judges measure (5.2 against 5.4 on the
  true shape).
- **The six-side grid's overlap shows as speckle.** Faces that face the same way share texels there, so a face
  hidden in one picture takes the colour of what hid it. On the coat that is dark specks (`e4-crop.png`, left
  pair against right pair). The local contrast counts the speckle as detail, which is why 0.97 falls to 0.87 as
  the picture gets cleaner: the contrast measure alone cannot judge this; Steven's eye and M4 can.
- **Texel density is not the limit at the judges' size**: a 256 sheet scores as a 512 one. In the game, close up,
  it would be; the charts also make the 512 sheet worth having (3.5 times the texels worn).
- 192 of 267 charts are of three faces or fewer: the carved hull's small folds. Merging them into a neighbour
  (FM 6.5 measured 96 charts that way) is the next step and costs nothing in fit.

### E5: what no picture sees

Eight views leave 1.4% of the true shape's worn texels unpainted and 8.6% of the carved hull's (the hollows
between arm and body, the inside of the elbows). Push-pull fill, or the nearest painted texel across the surface,
covers that; it is a small item, not the problem.

### E6: thin parts break first

On the true shape, every picture's outline moved by 0, 1, 2 and 4 dots (a dot is about a sixth of a unit here);
error measured in texture space against the original's own textures, by region (ΔE, mean over worn texels):

| Shift | Claws | Head and crab | Arms | Chest, back, pelvis | Legs |
| --- | --- | --- | --- | --- | --- |
| 0 | 13.1 | 12.6 | 10.3 | 12.7 | 11.7 |
| 1 | 15.5 | 15.8 | 11.9 | 14.1 | 13.0 |
| 2 | 20.9 | 19.7 | 15.9 | 17.3 | 14.9 |
| 4 | 24.7 | 24.2 | 19.3 | 21.2 | 17.3 |

A third of a unit of misregistration raises the claws' error by 60% and the legs' by 27%. (The floor of about 12
at no shift is the pictures' rendered light and the resampling, not misplacement.) A finger 0.6 units across is
three or four dots wide in the pictures: projection can only sample it reliably when the shape is exact, which a
reproduction never is. Thin parts want their colour by position along them, not by projection.

### E7: generative texturing on this card (Hunyuan3D-2 paint, turbo)

The backlog's FM item 10 said the paint stage waited on `libhipblaslt-dev`. With it installed, the custom
rasteriser hipifies and builds against the venv's PyTorch 2.9.1 (ROCm 6.4) in a scratch copy
(`~/stignored/texturing-research/build/cr`, nothing installed), loads, and rasterises on the GPU, agreeing with its
CPU path. **I downloaded the turbo paint model and the de-lighter (about 11 GB, into
`/media/Data3/Packages/local-3d/weights/hf`)**; the turbo unet ships as `.bin` and `.safetensors`, I fetched only the
second, and the pipeline's loader had to be patched in my script to read it and drop its image-adapter keys (the
`.bin` has none), so this is not quite the shipped configuration.

- From one front picture to six views: **16 s**, peak **10.7 GB**. Hunyuan's own bake at 2048 then runs out of
  memory on 16 GB; at 1024 it takes 2 s.
- The six views it generated (`hy/run1/views.png`) are flat salmon figures with dark red hands: the coat, the
  blood and the ribcage of the picture are gone.
- Baked onto the carved hull by the kit's projector, with the real front picture:

| Pictures | M4 | Contrast |
| --- | --- | --- |
| the real front only (sides left grey) | 16.3 | 0.59 |
| the real front and the generated left, back, right | 15.2 | 0.61 |
| all eight real pictures | 7.7 | 0.87 |

One run of one model with a substituted checkpoint is not a verdict on generative texturing, but it settles the
reproduction case: pictures beat it by a factor of two, and nothing about the zombie's look came through. Its
place is the words leg and a person's own new character, where no picture of the back exists.

## Findings by question

### 1. Classical multi-view texturing

The standard pipeline (Lempitsky and Ivanov 2007, CVPR, doi:10.1109/CVPR.2007.383078; Waechter, Moehrle and Goesele
2014, "Let There Be Color!", ECCV, doi:10.1007/978-3-319-10602-1_54) is: per-face view labels by an MRF (data term:
Waechter's is the image gradient summed over the face's projection, so sharp, close views win; smoothness: Potts),
a photo-consistency check that drops views disagreeing with the rest (mean-shift on the face's colour across
views), global seam levelling (an additive correction per vertex and label, least squares by conjugate gradient)
and local Poisson editing in a 20-pixel strip along each seam. Its reference code, `mvs-texturing`, is BSD-3,
last commit 2026-03-11. Gal et al. 2010 ("Seamless Montage for Texturing Models", Computer Graphics Forum 29(2),
doi:10.1111/j.1467-8659.2009.01617.x) add a small image-space shift to each label to absorb misregistration; Zhou and
Koltun 2014 (doi:10.1145/2601097.2601134) warp each image on a 21 x 17 lattice jointly with the cameras.

For the kit: `project` already is the per-texel version of this (cos^4 weights, best-view share, light divided
out). Hunyuan3D-2's own bake is the same thing (`bake_exp` 4, a weighted blend, then inpainting). The labels,
levelling and Poisson strips matter for real photographs with differing exposure (PE); the judges' pictures are
one renderer's output and E1 shows the blend at M4 5.4. They stay where FM put them (backlog 35).

UV atlases: xatlas (MIT, last commit 2022-07-25; Python binding 0.0.11, 2025-07-04) fragments a decimated shape
(FM 6.1: 185 charts on the car). Blender's Smart UV Project cuts at sharp edges and projects each group along its
mean normal; Project From View lays faces as the picture sees them and is what Blender's manual recommends for a
photograph used as a texture. View charts (E4) are Project From View done per region automatically, with the
overlap split that a person does by hand.

### 2. Generative texturing

From the survey (repositories read through the GitHub API and shallow clones; venues and dates from arXiv):

| Method | Conditioning | Keeps the mesh's UVs | Stated VRAM | Licence | On this card (16 GB, ROCm 6.4) |
| --- | --- | --- | --- | --- | --- |
| Hunyuan3D-2 paint (arXiv:2501.12202) | image | no, xatlas always | 16 GB with shape | Tencent Hunyuan 3D 2.0 Community (not EU, UK, South Korea); file headers say non-commercial | **runs** (E7): rasteriser hipified, 16 s, 10.7 GB; bake at 1024 |
| Hunyuan3D-2.1 paint (arXiv:2506.15442) | image, PBR | no | 21 GB | Tencent 2.1 Community | same rasteriser; over 16 GB without offload |
| MV-Adapter texture (arXiv:2412.03632) | text or image | yes | under 10 GB with SD2.1 | Apache 2.0 | needs nvdiffrast (community gfx1201 ports on ROCm 7.2 exist) and cvcuda swapped for OpenCV |
| TRELLIS.2 texturing (arXiv:2512.14692) | image | yes | 24 GB | MIT, nvdiffrast non-commercial | no (memory, several CUDA extensions) |
| Paint3D (arXiv:2312.13913) | text or image | no | not stated | Apache 2.0 | needs kaolin |
| TEXTure, Text2Tex, SyncMVD, MVPaint | text | some with a flag | 12 GB and up | MIT to CC BY-NC-SA | need pytorch3d or kaolin ports |
| TEXGen, FlexPainter, SeqTex (UV-space) | image (+text) | yes, in UV space | 24 to 80 GB | none or MIT | no (spconv, nvdiffrast, memory) |
| UniTEX, MaterialMVP, Step1X-3D | image | no | 27 GB (Step1X) | Apache 2.0 or none | no, or the Hunyuan rasteriser |
| StableGen (Blender add-on, GPL-3.0) | text + reference image (IP-Adapter) | bakes with Smart UV | 8 GB SDXL | GPL-3.0 | likely (no custom CUDA kernels, ComfyUI runs on ROCm); untested |
| RomanTex, TEXTRIX, LaFiTe, NaTex, EASI-Tex, DirectUV, Meta TextureGen | various | | | | no code |

All of these generate several views of the mesh and project them (or diffuse in UV space). They help where no
picture exists; with pictures of the thing, the pictures win (E7). EASI-Tex (arXiv:2405.17393) and NI-Tex
(arXiv:2511.18765) target a reference whose proportions differ from the mesh, by conditioning, not by warping; no
code for the first.

### 3. LLM agents that make or texture 3D

| Work | What it does for UVs and texture | Reported |
| --- | --- | --- |
| BlenderMCP (MIT, active) | runs any `bpy`; Poly Haven PBR sets on the object's existing UVs; its guide tells the agent to `smart_project` or box-project scripted meshes; Rodin, Hunyuan3D, Tripo make new textured models in the cloud | no unwrap of its own |
| LL3M (arXiv:2508.08228, non-commercial) | procedural Blender shader nodes; no UVs or images | VLM critics miss spatial faults; geometry flaws survive refinement |
| 3D-GPT (arXiv:2310.12945), BlenderAlchemy (arXiv:2404.17672), VLMaterial (arXiv:2501.18623) | procedural node graphs (Infinigen; an image to a node graph) | shading detail is the stated weakness |
| ShapeCraft (arXiv:2510.17603, NeurIPS 2025) | xatlas, then a UV texture field optimised by SDS | no code |
| MeshQuery (arXiv:2610.02507, 2026-10-01) | a VLM plans UV seams with tools and UV-quality feedback: 2.9 to 4.3 times fewer charts than the best baseline, artists preferred it 81% | seams only, no painting |
| LLaMA-Mesh, MeshLLM, MeshCoder, CAD-Recode, BlenderLLM, SceneCraft | geometry or layout only | |

No published agent unwraps and paints an image texture onto a given mesh from reference pictures. The ones that
texture use procedural materials or a generator; the one that unwraps (MeshQuery) plans seams, which E4 says is
not the bottleneck here. SMAK's design (the agent writes a spec, the kit does the geometry and the projection) is
already ahead of these for this task; the gap is the shape.

### 4. 1998-style practice

Planar projection per region from the front and back, a few small charts, the head and hands given more texels,
mirrored or shared pixels for repeated parts, the picture painted with the light in it (see "How Valve textured
the zombie"). An automatic pipeline copies all of that: regions from bones, projection directions from the views,
charts split where layers overlap, texel weight by part (`texels` already exists), shared strips for repeated
thin parts. The one thing it cannot copy is the painter's judgement of what to draw where no picture looks.

### 5. Hands and thin parts

Valve's zombie: fingers as 3 or 4 sided tubes on three bones each, ending in a point, about 25 triangles each,
curled at the joints, all wearing one drawing of a hand. Other low-polygon practice of the time: mitten hands
(a paddle with a thumb) with the fingers painted on, or fingers fused in pairs. At this budget a finger thinner
than about three picture dots cannot be textured by projection (E6) and cannot be carved (E2 lost 50 pieces). The
two working ways: build each finger as a tapered tube along its bones and paint it by position along its length,
from a colour profile read off the pictures along the finger's projected centre line (a median across the views
that see it); or, where a finger bone chain is missing from the base, a flat hand-shaped `leaf` with a picture.

## Recommendation for SMAK, ranked by value for effort

| # | Build | Size | Why |
| --- | --- | --- | --- |
| 1 | **A character's shape must fit before it is painted.** In a character build, an outline IoU under 0.7 against any `project` picture becomes a FAULT (today a WARN under 0.8), saying the projection will paint the wrong surfaces; and a check that each hand in the first frame is within some units of where the pictures' outlines put it (the sledgehammer) | small | E1 to E3: on a shape that fits, today's projector already passes M4 (5.4 to 8.3); on one that does not, nothing does. The maker read the warning and shipped anyway |
| 2 | **`carved` on a character**: the hull carved from the pictures in the fitted first-frame pose, each corner hung on the bone of its nearest bone segment (one bone a corner, as Valve's), the limbs bending at their joints; the blob kept for what the pictures do not cover | medium (carve exists; nearest-segment binding about 100 lines) | E2: M4 8.3 with nothing else changed; the maker's answer asked for exactly this |
| 3 | **Bone lengths in a character's spec** (`base.scale: { "Bip01 L Arm1": 1.3 }`): the bones' rest offsets and every frame's translation of their children scaled, animations kept | small to medium | the arm shortfall forced the bulk and the high hands; a zombie on a scientist's or Gordon's skeleton needs longer forearms and fingers. A design choice for Steven: it changes the base's animations' reach |
| 4 | **View charts for `carved`, `blob` and `mesh` parts** in place of the six-side grid: labels by best view with Potts smoothing, overlap split into layers, small charts merged, packed to fill the part's zone | 250 to 350 lines (prototype in `~/stignored/texturing-research/charts.mjs`) | E4: removes the shared-texel speckle, M4 8.3 to 7.7, 3.5 times the texels worn; on the true shape equal to Valve's hand layout |
| 5 | **Fingers as built parts, painted by length**: a `fingers` helper (or a documented `tube` recipe) that runs a tapered 3 or 4 sided tube along each finger chain of the base (or along `path` where the base has none), and a paint mode for thin parts that samples the pictures along the part's projected centre line and paints by position along it, all fingers sharing one strip | medium | E6: projection error on claws rises 60% at a third of a unit of misfit; carving loses them. Steven's "salad fingers" |
| 6 | Push-pull (or nearest across the surface) fill of worn texels no picture sees | small | E5: 1.4 to 8.6% of texels; today they keep the material's flat paint |
| 7 | Generative fill for the words leg and new characters: try Hunyuan3D-2 paint at full (non-turbo) weights and StableGen-style SDXL with an IP-Adapter reference, both as a `generate` kind giving pictures for `project` | medium, Python outside the kit | E7: runs here now, but one turbo run gave flat colour; worth one more try before building anything |
| - | Declined: per-view silhouette warping before projection (E3: no gain); a VLM seam planner (MeshQuery) or xatlas tuning (layout is not the bottleneck: E4, FM 6.1) | | |

Items 1 to 3 are shape work; Steven's complaint about textures is answered by them first. 4 and 5 are the
texturing proper. Before building 2, it is worth telling the maker today (guide text) that a character from
pictures should carve the body and should turn the base's forearms down to the pictures' hands.

## Experiment plan

On the four held characters (zombie, scientist, barney, houndeye), pictures leg, each change rebuilt from the
same maker spec where the spec allows, then once with a fresh Opus maker (Haiku makers scored 0 of 7 characters,
backlog "Which maker"):

| Step | Change | Measure | Bar |
| --- | --- | --- | --- |
| A | Guide text only: carve the body for a character from pictures, turn the forearms to the pictures' hands | outline IoU per axis, M4, judge M1 and M4 | outline 0.8 on all three axes, M4 under 15 on all four |
| B | Item 1 (fault under 0.7, hand check) | how many maker runs end with a fitting shape | half of runs |
| C | Item 2 (carved on a character) and item 3 (bone lengths) | M1, M4 in frame 0; the run and walk drawn (no part apart) | M4 under 10, as E2 |
| D | Item 4 (view charts) against the six-side grid, same shape | M4, local contrast, speckle (share of texels whose colour differs from all 8 neighbours by over 40) | M4 no worse, speckle halved |
| E | Item 5 (fingers by length) | M4 inside the hands' outline only; Steven's eye on the hands close up | hands read as the original's |
| F | Steven's blind review | compare sheets of A to E against the original, his verdict before the judges' scores (memory: blind human review) | he picks the new one |

The zombie numbers above are one subject. The rule of the benchmark memory holds: keep the six-side grid until
the view charts win on all four.

## Could not verify

- E2 and E4 are props built from the pictures: they are not on a skeleton and do not animate. That a carved hull
  hung on bones keeps its look through the run and walk is untested; the judges measure frame 0 only.
- E7 used a patched loader (the `.safetensors` unet with its image-adapter keys dropped); whether the shipped
  `.bin` behaves differently, and whether the non-turbo model gives detail, is untested. The Hunyuan 2.0 licence
  text in the repository files says "non-commercial" in their headers while the repository licence is the
  community licence: which governs was not settled.
- StableGen on ROCm, MV-Adapter with a community nvdiffrast port, and any generator other than Hunyuan's were
  not run.
- The local contrast measure rewards speckle (E4); a speckle measure as in step D is proposed, not built.
- Survey facts on repositories are as read on 2026-10-15; MeshQuery's baselines and code were not found.
