# Dressing a level: how a brush map is made to look designed, and how an LLM can specify it

Written 2026-10-17. Every web source was read on 2026-10-17 unless a line says otherwise. This extends
`research/generation-research.md` section 3 (layout: mission graphs, BSP dungeons, Merrell 2010, Holodeck,
ProcTHOR, Infinigen Indoors, OBLIGE, WFC, Todd 2023, Word2World, Word2Minecraft), `research/map-geometry.md`
(Valve's maps in numbers, sketch and plan reconstruction), `research/map-reproduction-failures.md` and
`research/consult/argon-2026-10-17.md` section 3, and repeats none of them. Those cover where rooms go. This
covers what a room looks like once it is there: trim, rhythm, light, texture, landmarks, clutter, and how to
check them without a person.

The kit's `frame` (SPEC.md, the map table; `src/spec/map.mjs` FRAME) already makes dado and cornice bands,
ribs every 224, beams every 192, 45-degree corner cuts, door frames and lamp fixtures as texture lights. The
recommendations below build on it, not beside it.

## 1. Summary

- Valve's and the community's own writing gives few numbers for dressing, but the ones it gives agree with what
  Valve's sources measure: textures at scale 1 (89 to 93% of faces in c1a0), hand-shifted so seams land on
  edges (57 to 62% of faces carry a shift), texture lights doing most of the lighting (276 light-texture faces
  in c1a0 against a median of 13 light entities a map), a third of tall walls wearing a stacked second texture,
  and darkness used on purpose ("make dark spots"; switch two of five corridor lamps off).
- New measurement (section 2.3, on the SDK's `c1a0.rmf` and `c1a0d.rmf`): of Valve's world brushes, 39 to 41%
  are panels (one side 16 or less, two sides 32 or more), 15 to 16% are strips (trim, ribs, beams: two thin
  sides, one long), 12 to 16% carry a light texture (lamps, screens), and 4 to 7% have more or fewer than six
  faces. A third of wall planes 128 or more tall have a texture join up them; joins sit at a median 124 above
  the plane's foot, quartiles 48 to 176.
- Procedural architecture (CGA, split grammars) is the right shape for what the LLM should write: a room or
  wall described as a split ("48 base, then repeat 192 panels with 16 ribs, then 24 cornice"), not as brushes.
  The kit's `frame` is a fixed split; a small split grammar over wall faces generalises it.
- The GDMC competition's winners, through 2026, win with hand-made building libraries placed by a program that
  reads the terrain. The 2026 winners tried LLMs and dropped them because the models "struggled to reason about
  three-dimensional space". The transfer to SMAK: the LLM picks and parameterises pieces from a library, and
  code places them.
- LLM and VLM scene agents (SceneCraft, BlenderAlchemy, SceneWeaver, Holodeck 2.0, LayoutVLM) all loop: write a
  program, render, critique, revise. The 2025-2026 evaluation papers find that plain VLM judges agree poorly
  with people on layout (SceneCritic: 47 to 59% pairwise agreement, near chance; LEGO-Eval: VLM-as-judge
  kappa 0.05), while symbolic checks do much better. So the critique the maker gets should be mostly measured
  facts, with a VLM only for what a measure cannot see.
- Automatic visual measures with evidence behind them: edge density and compression error of a picture
  correlate with human-rated complexity up to rs 0.77 (Machado et al. 2015); isovist measures correlate with
  judges' ratings of GDMC settlements (Hervé and Salge 2022).

The five most likely to raise a judged map toward Valve's own, ranked, are in section 8.

## 2. The craft: what Valve's and id's mappers did

### 2.1 What the sources say

```
Source                                   What it shows                                          Concrete rules (numbers where given)
Valve, "The Cabal" postmortem             How Half-Life's levels were designed as a group         "Experiential density": something happens per unit of
(Birdwell, Gamasutra 1999)                                                                      area; content is distance based. "Player acknowledgment":
                                                                                                the world answers every action visibly (decals). A
                                                                                                200-page design document fixed "how high buttons should be
                                                                                                to what time of the day it was". Areas were built round
                                                                                                "a cool piece of geometry" made in an experiment.
Dario Casali, "Designing Levels"          A Valve level designer's process                       Fix the texture theme, light style and items before
(2017 repost)                                                                                   building. "There is always a main area around which
                                                                                                gameplay hinges". "Texture colours must work together".
                                                                                                "Darkness can conceal areas": a corridor sloping into dark.
                                                                                                Monsters placed where they would be doing something.
VERC "Half-Life Editing Tips" (TWHL)      51 tips from the GoldSrc community, c. 1999-2001        Study Valve's levels by screenshot until "I understand the
                                                                                                motif 95%" (tip 2). Don't use all the textures (5). Match
                                                                                                textures across a corner (9). Spread one texture across
                                                                                                several brushes (11). Silhouette a monster against a lighter
                                                                                                wall (12). Grass and rock at scale 2, rotated about 30
                                                                                                degrees, to hide tiling (13). Few glow sprites (14).
                                                                                                Pillars to mask dull corners (15). Prefabs sparingly: never
                                                                                                five vending machines in a row (18). Decals break repeats
                                                                                                (23). "Make dark spots" (24). Three monster kinds a map
                                                                                                (25). Curved corners: a 12-sided cylinder clipped (27).
                                                                                                Texture lights are the main light; light entities for
                                                                                                switched and pulsing light (28). Spot lights for "eye
                                                                                                candy" (29). "Repetition sucks": a corridor of five
                                                                                                ceiling lamps reads better with two switched off (30).
                                                                                                renderamt 96 for windows (33). Walls 32 or 64 thick, sizes
                                                                                                on 4/8/16 (34). Side rooms and dead ends worth exploring
                                                                                                (35). Steam: env_sprite xsmoke3, additive, 128, raised 32
                                                                                                (36). Flat walls: add supports (37). env_sound room types
                                                                                                (38). Rocks of many brushes, not one (42). Make a vital
                                                                                                button visible: _minlight 0.2 or a light by it (43).
                                                                                                "The world is not a matchbox": angle a corridor (45).
TWHL, "The Complete Guide to Lighting"    GoldSrc light, by entity, texture and compiler options  Texture lights need 1000 to 10000 where a point light needs
                                                                                                100; small fixtures need more. Bounce 2 to 4 for concrete
                                                                                                and carpet, 6 to 8 for metal; 0 is harsh, over 8 washed
                                                                                                out. Volumetric beams: FADE texture on a func_illusionary,
                                                                                                renderamt 20 to 50. A fixture's frame lit as texlight at
                                                                                                about 20 so it is not black beside its glow.
Magnar Jenssen, "Functional Lighting"     Light as guidance                                      Even light reads but leads nowhere: brighten the goal; light
(World of Level Design)                                                                         a route in steps in a complex room; light spilling from a
                                                                                                doorway says where enemies come from; backlight enemies on
                                                                                                high ground; a hint light subordinate to the main light.
"Jokey's Guide to Quake Level Design"     Quake craft, community                                 One consistent theme, no mixed texture sets; every room has
(repost)                                                                                        a purpose; step 17, jump 42.5 up, 225 across.
Burgess and Purkeypile, "Skyrim's         Bethesda's kit workflow (GDC 2013)                     Footprints that are multiples of each other (512 room, 256
Modular Approach to Level Design"                                                               hall; a 384 room "will eventually create gaps"). Grid snap
                                                                                                as large as possible. Hallways tile on one axis, rooms on
                                                                                                two. Players notice "repeated clutter first, then the
                                                                                                repeated architecture". Kits are "the architectural identity
                                                                                                of the space"; content gives its character. Hero pieces come
                                                                                                after the kit; the normal piece is used hundreds of times.
                                                                                                Variants as 01/02/03 swaps. Light and ambient occlusion hide
                                                                                                awkward joins.
Smith and Worch, "What Happened Here?"    Environmental storytelling (GDC 2010)                  Props, decals, light and composition imply an event the
                                                                                                player infers; some clues must be easy to miss. Half-Life
                                                                                                example: bullet decals and a body.
Totten, "An Architectural Approach to     Lynch's paths, edges, districts, nodes, landmarks as    Table of contents only seen (2nd ed. 2019): landmarks
Level Design"                             a level's legibility; sight lines                     ("weenies") to find the way by.
```

Not readable today: the Valve Developer Community wiki answers every request with a proof-of-work page
(Anubis), so its level design and colour theory pages could not be read; TWHL's pages could, through a plain
HTTP client. No transcript of Valve's own Half-Life 1 design talk was found, and Half-Life 1 has no developer
commentary (Lost Coast, 2005, was Valve's first).

### 2.2 The rules, gathered by what they act on

```
Acts on        Rule                                                                Source                       Number
Texture        Stay at scale 1 on architecture                                     c1a0 measured (2.3)          89-93% of faces
Texture        Shift each face so a seam or band lands on the brush edge            c1a0 measured, tip 11        57-62% of faces shifted
Texture        Stack a second texture up a tall wall (base, field, top)             c1a0 measured                34% of walls 128+ tall
Texture        One theme a map; few textures; match across corners                  tips 5, 9; Casali; Jokey     c1a0: 112 textures, 809 brushes
Texture        Natural surfaces: scale 2, turned about 30 degrees                    tip 13
Texture        Decals over repeats                                                 tip 23; Smith and Worch
Structure      Break a flat wall with supports or pillars; pillars at dull corners   tips 15, 37; Bethesda
Structure      Not a matchbox: angled corridors, curved corners (12 sides)           tips 27, 45                  Valve 42% non-axial vertices
Structure      Thin pieces: trim and panels 8 to 16 thick                            map-geometry 3.1             85% of world brushes <=16 thin
Structure      A main area, and a "cool piece of geometry" to build round            Casali; Cabal
Light          Texture lights first; light entities for switched or styled light    tip 28; map-geometry 3.5     5 lamp faces a light entity
Light          Darkness on purpose; not every lamp on                               tips 24, 30; Casali          2 of 5 lamps off in tip 30
Light          Brighten the goal; spill from doorways; backlight silhouettes        Jenssen; tip 12
Light          Bounce 2-4 (concrete), 6-8 (metal)                                   TWHL lighting guide
Light          Few glow sprites                                                     tip 14                       env_glow at lamps (map-geometry 3.4)
Props          Prefabs sparingly; no row of identical ones                          tip 18; Bethesda clutter
Props          Groups by kind: headcrabs 1-3, houndeyes up to 5, slaves 2           tip 48
Props          Three monster kinds a map, besides scientists and guards             tip 25
Story          Each room has a purpose; side rooms worth exploring                  Jokey; tip 35
Story          A scene implies what happened                                       Smith and Worch; Cabal
```

### 2.3 Valve's c1a0 brushes by the part they play (measured here)

Read with `research/rmf-read.mjs`'s `readRmf` on the SDK's two c1a0 sources (RMF 1.8). A world brush is a
"strip" when its two thinner sides are 16 and 24 or less and its long side at least three times the middle
(vertical strips are ribs and pilasters; horizontal ones bands, beams, sills); a "panel" when its thinnest side
is 16 or less and the next 32 or more; "lit" when it wears a light texture (a `~` name or light, lgt, lite in
it: lamps and also screens), and its long side is 128 or less; "angled" when it has other than six faces
(roughly: wedges, prisms, cut corners; six-faced brushes cut off the axes are not counted here, so this is
lower than map-geometry's 23 to 25% non-box share). A brush is counted once, in that order of tests after
lit.

```
                         c1a0 (809 world brushes)        c1a0d (935)
panel                    330  41%  long med 152           361  39%  long med 160
block (anything else)    229  28%                         311  33%
lit (lamp or screen)     129  16%  long med 56            114  12%  long med 64
strip, horizontal         81  10%  long med 92, 8 thin     96  10%  long med 92, 8 thin
strip, vertical           40   5%  long med 96, 8 thin     53   6%  long med 66, 4 thin
angled (not 6 faces)      36   4%                          67   7%
distinct textures        112                              150
light-texture faces      276                              246
```

Walls (faces whose normal is level, sky and tool textures left out), grouped by plane over the whole map:

```
                                               c1a0           c1a0d
wall planes 128 or more tall                   345            637
  with a texture join up them                  118 (34%)      214 (34%)
  one texture only                             102 (30%)      301 (47%)
joins, height above the plane's foot           median 124, q1-q3 56-176    median 124, q1-q3 48-160
  joins by band: <=16 / 17-32 / 33-64 / 65-128 / >128    25 / 6 / 31 / 55 / 100     35 / 9 / 93 / 60 / 166
a face's height when not full height           median 34 (16-128)          median 48 (16-128)
texture scale 1 x 1                            93% of faces   89%
faces with a texture shift                     62%            57%
```

What it says for the kit: Valve's rooms are mostly thin panels with trim between, and a strip is about one
brush in six. The joins up a wall cluster in two places: a low band (33 to 64 above the foot, the kit's dado
of 48 is right) and a high one round 124 to 176 (a door head's height; Valve's doors are 96 to 108 high, and a
second band often runs at or just over the door head). The kit's cornice under the ceiling is less Valve-like
than a band at door-head height. Vertical strips standing in rows were too few to measure a spacing (7 gaps in
each map), so the kit's 224 for ribs has no Valve number behind it yet; a campaign-wide measure on decompiled
BSPs would give one. Caveats: planes are grouped over the whole map, so two rooms' walls on one plane count as
one; RMF 1.8 keeps no texture axes, so only scale and shift are read.

The script is in the appendix (it was run from the scratchpad and not saved in the repo).

## 3. Procedural architecture and detailing

```
Source                                     What it shows                                        Technique                                   For SMAK
Wonka, Wimmer, Sillion, Ribarsky,          Split grammars: a facade split along an axis into     Split(axis){sizes: rules}, with fixed and    A wall face as a split: what the LLM writes
"Instant Architecture" (SIGGRAPH 2003)     parts, each split again, with a control grammar       relative (~) sizes; attributes passed down   instead of brushes. The kit's frame is one
                                           choosing which rule                                   so a whole building stays in one style       fixed split; a grammar generalises it
Muller, Wonka, Haegler, Ulmer, Van Gool,   CGA shape: mass model, then facade splits, then        Split, Repeat (~size), Component split        Repeat(~192){rib | panel} along a wall
"Procedural Modeling of Buildings"         details; context rules keep windows off walls that    (a volume into faces), occlusion queries     gives ribs that fit the wall exactly; the
(SIGGRAPH 2006)                            meet others                                                                                        occlusion query is the kit's "keep clear
                                                                                                                                              of a way through"
Wu, Yan, Dong, Zhang, Wonka, "Inverse      Grammars fitted to example facades                     The split grammar recovered from a layout   A split read off a Valve wall's texture
Procedural Modeling of Facade Layouts"                                                                                                        joins (2.3) gives Valve's own bands as a
(SIGGRAPH 2014, arXiv 1308.0419)                                                                                                              rule
Merrell, Schkufza, Li, Agrawala, Koltun,   Furniture layout from interior design guidelines       A density of terms (clearance, circulation,  Prop placement by rules a mapper would
"Interactive Furniture Layout Using        sampled by Monte Carlo; designers preferred the       conversation distance, balance, alignment   state: against a wall, facing a way,
Interior Design Guidelines"                suggested layouts in four of five rooms (p < 0.01)    to the room's features) sampled             clear of the walk path
(SIGGRAPH 2011)
Yu, Yeung, Tang, Terzopoulos, Chan, Osher, Furniture arranged from examples' learned priors,     Simulated annealing over cost terms of       The same terms, with Valve's own placement
"Make it Home" (SIGGRAPH 2011)             with ergonomic costs                                  accessibility, visibility, pairs,           numbers (map-geometry 3.4) as the priors
                                                                                                 distance to wall
Fisher, Ritchie, Savva, Funkhouser,        New arrangements from a few examples                   Learned co-occurrence and relative place     A prefab group ("a desk with a chair, a
Hanrahan, "Example-based Synthesis of 3D                                                         of objects                                    lamp, papers") varied, not repeated
Object Arrangements" (SIGGRAPH Asia 2012)
Burgess and Purkeypile (GDC 2013)          Modular kits and kitbashing                            Footprints that divide each other; snap      SMAK's grid and prefab sizes on 16, 32,
                                                                                                 large; variants 01/02/03; vary clutter more 64...; prefab variants chosen per copy
                                                                                                 than architecture
Trim sheets (Roblox's environmental-art    One texture of rows (or columns), each row a strip     A row tiles along one axis; pick a row by    GoldSrc's analogue is a texture family with
curriculum, an industry practice)          that tiles along one axis                            where the UV lands                           trim strips (drkmtlt_bord11/16, basetrim02
                                                                                                                                              in c1a0): band and frame brushes wear them
Salingaros, scaling hierarchy               Architecture that reads as ordered has detail at       Sizes roughly L/e, L/e^2, L/e^3 ... down to  A check: does a room have detail at each of
(his papers; no independent validation)    every scale, none missing                             the material; "no level should be missing"   ~4 scales (room, panel, trim, fixture)?
```

The common thread: the program holds the rules of proportion and repetition, and the author (here the LLM)
picks the rule and a few numbers. That is what the spec already does for rooms (a box and its relations) and
what it should do for walls.

## 4. GDMC: what the settlement generators that win do

```
Source                                     What it shows
Salge, Green, Canaan, Togelius,            The competition (from 2018): an unseen map; a settlement judged by people on
"Generative Design in Minecraft (GDMC)"    adaptability, functionality, evocative narrative and aesthetics, 0 to 10.
(arXiv 1803.09853)
van der Staaij et al., "Believable          The 2022 winner ("Mike's Angels", Leiden). Terrain read into height, slope, water
Minecraft Settlements by Means of          and structure maps; about 60 steps of agents placing in turn: 3 road agents, a wall
Decentralised Iterative Planning"          agent, 3 house-plot agents, 5 farm, 9 tree, 3 water-plot, 11 decorative agents
(CoG 2023, arXiv 2309.10871)               (wheelbarrows, benches), a watchtower agent (high ground, far from other towers) and
                                           a church agent. Each agent scores a random sample of places by its own fitness and
                                           takes the best. Plots then become residential, commercial or industrial by a small
                                           economy (commerce likes homes, shuns industry). Cells become towers where they stand
                                           over their neighbours; the wall is a hull, A* and a smoothing filter; farms follow
                                           contours. Highest score in every category to that date (narrative 6.83, aesthetics
                                           7.08); all eight judges ranked it first. Judges still said materials could suit the
                                           place better, furnishing seemed odd, and some foundations floated.
Leiden University news, September 2026     The 2026 winner (Team Merge Conflict, Leiden), "the highest design score in the
                                           competition's history". Roads follow mountains, valleys and rivers; a market square,
                                           castle, homes, farms, harbours; houses change by biome (no water features in desert,
                                           vines in jungle); each house a different layout. They tried LLMs and found the models
                                           "seemed to struggle with reasoning about three-dimensional space", so they built a
                                           large collection of example buildings by hand and let the program place and fit them.
Niels-NTG, GDMC 2023 and 2024 entries      Hand-built structures as NBT files with a Python class each, stacked by wave function
(github.com/niels-ntg/gdmc2024)            collapse over adjacency and rotation rules; wayfinding signs on each landing.
Herve and Salge, "Automated Isovist        Isovist and space-syntax measures from the player's view correlate (rank) with the
Computation for Minecraft" (arXiv          judges' ratings of GDMC settlements. Coefficients not on the abstract page.
2204.03752)
```

What transfers to brush maps:

- **Agents with a fitness each, over a read of the space.** A dressing pass as a set of small placers, each
  with its rule: a lamp placer (on a ceiling over a walk path, spacing, every other one dim), a pipe placer
  (along the top of long walls, turning at corners), a crate placer (corners and wall feet, groups of 2 to 4),
  a sign placer (at each doorway and junction). The kit already has the read: `spaceOf`, `floorUnder`,
  `reachOf`, the openings.
- **Districts by function.** A map's rooms get a role (lab, office, plant, storage, transit) and the dressing
  set follows the role, as the economy step makes districts. The spec has `building` and room ids; a `use`
  word per room would select the set.
- **Hand-made pieces, placed by program.** Every winner places authored pieces. SMAK's prefabs (and Valve's own
  libraries, map-geometry 3.7) are that library; the LLM should choose and vary them, not draw brushes.
- **What the judges still docked**: materials not suited to the place, odd furnishing, floating foundations.
  Those are the same failures our judges name (wrong texture family, props that mean nothing, things that hang).

## 5. LLM and VLM agents as scene and level designers (2024-2026)

```
Work                                        What it does                                          Evaluation and what it found                         For SMAK
SceneCraft (Hu et al., ICML 2024,           LLM writes Blender Python for scenes of up to 100      Beat other LLM agents on constraint adherence and     The shape of SMAK's loop: spec, build,
arXiv 2403.01248)                           assets: a scene graph, then code turning relations    human ratings; code not released then                 views, critique. Its "library learning"
                                            into numeric constraints; a VLM critic on renders                                                         is our prefabs and spec words
                                            revises; reusable functions collected into a library
BlenderAlchemy (Huang, Yang, Guibas,        A VLM edits a Blender program towards a text or        Generator and verifier: candidate edits rendered,     A verifier that compares candidates is more
arXiv 2404.17672, 2024); BlenderGym (2025)  image goal; imagined reference images ground it        the VLM picks; BlenderGym benchmarks such systems     reliable than one that scores one alone
SceneWeaver (Yang, Jia, Zhang, Huang,       An LLM planner picks tools (generative, rule, LLM)     Beat prior methods on physical, visual and semantic   Self-check categories map onto ours:
NeurIPS 2025, arXiv 2509.20414)             and self-checks plausibility, realism and match to     metrics and in human studies                          sealed and reachable (physical), the
                                            the request after each step                                                                                 views (visual), the brief (semantic)
Holodeck 2.0 (Bian, Ren, Yang,              A VLM parses objects, derives spatial constraints      Human and model evaluations above baselines (numbers  Constraints from a VLM, solved by code
Callison-Burch, arXiv 2508.05899)           applied iteratively; edits from human feedback         not on the abstract)
LayoutVLM (Sun et al., CVPR 2025,           VLM gives two representations from marked images;      Above LLM and constraint baselines on plausible,      Marked images: number the walls and
arXiv 2412.02193)                           differentiable optimisation for plausibility           instruction-matched layouts                           openings in the views the maker sees
Text2BIM (Du, Esser, Nousias, Borrmann,     Agents (owner, architect, programmer, reviewer)        A rule-based model checker inside the loop            The reviewer with domain rules = a
arXiv 2408.08054)                           write code against a BIM tool's API                                                                         dressing check with Valve's numbers
VoyagerVision (arXiv 2507.00079, 2025)      Minecraft builder with screenshots to all three        Half the build tests succeed on flat worlds; complex  Screenshots help but do not fix 3D
                                            agents                                                 structures fail most                                  reasoning
MineAnyBuild (arXiv 2505.20148, NeurIPS     4000 Minecraft build tasks scored on spatial           "Serious limitations in spatial planning"; a gap      Do not ask the model for coordinates of
2025)                                       understanding, reasoning, creativity, commonsense      between plan and execution                            details; ask for rules and pieces
AutoUE (Yin et al., ACL Findings 2026,      Multi-agent Unreal 5 game generation, retrieval of     Engine-specific constraints and doc retrieval cut     The kit's docs and spec errors play this
arXiv 2603.07106)                           engine docs, automated play-testing                    tool errors (abstract)                                part
Zero-shot 3D Map Generation with LLM        Actor and critic agents in Unity                       Already in map-geometry.md                            -
Agents (arXiv 2512.10501)
```

Evaluation of such scenes, 2025-2026:

```
Work                                   Finding
SceneEval (Tam et al., arXiv 2503.14756)  VLM checks agree with manual labels 81% on counts, 77% on attributes, 91% on object
                                       relations, 88% on object-architecture relations (GPT-4o); attributes weakest (kappa 0.26
                                       with an open 7B model)
LEGO-Eval (arXiv 2511.03001)           A checklist evaluator: F1 0.81, kappa 0.63 on instruction-scene alignment; plain
                                       VLM-as-judge 0.40 and 0.05
SceneCritic (Sengupta, Ao, Cascante-   Symbolic checks over an ontology (semantic, orientation, geometric, collision): 94% and
Bonilla, arXiv 2604.13035)             83% agreement with people on easy and complex scenes; a VLM evaluator 59% and 47%, near
                                       chance. Text-only LLMs beat VLMs on semantic layout; image-based VLM refinement was the
                                       best critic for semantic and orientation fixes
```

What this says for SMAK: keep the VLM as the maker's eyes for revising (it fixes what it sees), but do not make
it the measure. The measure is a list of facts with Valve's numbers beside them. That matches the kit's own
experience with the judges (argon section 4: single Haiku calls swing 2 to 3 points).

## 6. Measuring a level's visual quality automatically

```
Measure                                   How                                                   Evidence it means something                   Valve's value to aim at
Detail density                            World brushes (and func_detail) per 256 x 256 of        Valve's craft; Salingaros's "no level         About 9 world brushes a 256 x 256 of floor
                                          walked floor                                            missing"                                     (517 brushes over 3.86M square units,
                                                                                                                                                map-geometry 3.1-3.2; a ratio of medians)
Role mix                                  Share of panels, strips, lit brushes, angled (2.3)      Measured on Valve's source                    Panels ~40%, strips ~15%, lit 12-16%
Non-axial share                           Share of vertices off the axes                          map-geometry                                  42% over the campaign; c1a0 77% boxes
Wall banding                              Share of wall planes 128+ tall with a texture join up   Measured (2.3)                                34%; one-texture tall walls 30-47%
                                          them; height of joins
Bare wall                                 Share of wall area in faces over 128 x 128 with no      Tips 37 and 15; Bethesda                      To measure on Valve's maps first
                                          strip, fixture or prop within 16 of it
Texture tiling                            Repeats of one texture up a face (height / texture      Judges' "stretched bands" (argon 3.4)          Valve: face heights median 34-48 where
                                          height)                                                                                               banded
Light from fixtures                       Lit faces a light entity; share of light entities       tip 28; map-geometry 3.5                      5 lamp faces a light entity; 56% of
                                          within 16 of a lamp face or switched                                                                  light entities styled or switched
Light contrast                            On the lightmap of walked floor: share under the dark   Casali, tips 24 and 30, Jenssen               Frenzy: 13% of floor under 24
                                          limit, p90/p10 ratio, how often brightness changes      map-reproduction-failures 1
                                          along a corridor
Picture complexity                        Edge density and PNG or JPEG compression ratio of each  Machado et al. 2015: rs up to 0.77 with       Valve's own views, same cameras and size
                                          view                                                   human complexity ratings
Isovists                                  Area seen, its variation along the walk, sight length,   Martin (Splinter Cell, space syntax); Pech    "sight" median 891 (map-geometry 3.2)
                                          openings as relief points                               et al. 2020; Herve and Salge 2022
Repetition in view                        The same prefab or model more than twice in one view    Bethesda ("clutter first"); tip 18
```

Each of these is cheap with what the kit already reads (`spaceOf`, `map-light`, the plan and views, the
texture of each face, `research/valve-map-stats.mjs`). The ones not yet measured on Valve's campaign (bare wall,
banding over all maps, repetition) should be measured there before any is used as a gate, as the kit did for
everything in map-geometry.

## 7. Mapping onto the map spec

Each item says which kind of change it is: a spec field, a builder (code that makes brushes), a check (in
the build report), or a prompt rule (in SPEC.md's words to the maker).

```
#   Change                                                       Kind              From
1   `frame.bands`: a split up each wall, e.g. [{ to: 48, texture }, Spec field +      2.3, CGA/split grammars
    { to: 128, texture }, { texture }], each band its own brush     builder
    face with a texture join where Valve puts one (48 and ~124);
    the default from the theme's texture family
2   A texture family table for the game's wads: base, field, top,  Builder (data)    2.3 top textures (c1a0_labw4/5,
    trim strip, lamp, per theme (lab, office, plant, sewer);                         drkmtlt_bord11/16, basetrim02)
    built by reading Valve's maps for which textures stack on which
3   Face alignment: world-aligned at scale 1, shifted so a band's   Builder           2.3 scale and shift
    texture edge sits on the brush edge
4   Light as composition: `light: { fixtures, rhythm: "alternate"   Spec field +      tips 24, 28, 30; Jenssen; Casali
    | "even", goal: <room or way>, spill: true }`: fixtures as       builder
    texture lights, one in N styled or off, the goal room the
    brightest, a light just inside each doorway the far side of
    a dark room
5   A main area: `focus` on one room per map (and per large room a   Spec field +      Casali; Cabal; Lynch
    `piece`): the hero, sized to a third of the room's height or     check + views
    more, lit hardest, seen from each entrance; `viewsOf` aims a
    camera at it from each entrance
6   Role-based dressing: a room `use` word picks placers (lamps,     Spec field +      GDMC agents; Merrell 2011;
    pipes along the top of walls, crates at wall feet in 2-4s,       builder           Make it Home; Fisher 2012
    signs at junctions) each with a fitness over the room's read;
    variants chosen per copy
7   Silhouette breaks: pillars at long corners, supports on walls    Builder (frame    tips 15, 27, 37, 45
    with no way and no rib for 256, a 12-sided clipped curve as      words)
    a corner option, an angled corridor as a link option
8   Storytelling vignette: `scene` on a room (a spill, a fight, an   Spec field +      Smith and Worch; Cabal
    abandoned post) = a prefab group of props, decals and a light    prefabs
9   The dressing report: section 6's measures beside Valve's, each   Check             SceneCritic; LEGO-Eval;
    a line the maker reads ("bare wall 61% (Valve: measure);                           Text2BIM's checker
    lamp faces a light entity 0.4 (Valve 5); one-texture walls 100%
    (Valve 30-47%)")
10  Prompt rules in SPEC.md: one theme; few textures; pick the       Prompt rule       Casali; tips 2, 5, 18, 25
    family, not single textures; a main area; dark spots on
    purpose; no row of identical prefabs; at most three monster
    kinds
```

Items 1 to 3 change what the kit already builds under `frame`. Items 4, 5 and 9 are the ones the judge sees
most directly (P6 light, recognisability, views).

## 8. Ranked: the five most likely to raise a judged map toward Valve's own

1. **Walls in the game's texture families, banded where Valve bands them, aligned by hand rules.** Today a
   framed room's bands wear one trim texture and the field one texture tiled up; Valve stacks real family
   members (a base, a field, a strip) and shifts them so joins land on edges. Build the family table (item 2)
   by reading which textures meet at a join on Valve's walls, let `frame` pick bands from it (items 1 and 3),
   and move the upper band to door-head height when a room has a way. Measure: the share of wall planes 128 or
   more tall with a texture join between two family members (not only a trim brush on the wall) moves from 0
   in an unframed spec map to Valve's 34%, one-texture tall walls
   under 47%, scale-1 faces over 89%; the judges' texture items (P5, P7) and "stretched or monotonous"
   reasons drop on a rebuild of the original mod's three maps.
2. **Light composed, not spread.** Fixtures as the main light (the kit has them under `frame.fixtures`), with
   rhythm (one lamp in three dim, styled or off), the goal room brightest, spill from doorways, and dark spots
   kept (item 4). Measure: lamp faces a light entity towards Valve's 5; share of light entities next to a
   fixture or switched near 100%; on the walked floor's lightmap, a dark share and p90/p10 ratio inside the
   range of Valve's maps of the same kind (to measure with `map-light` over the campaign first); P6 on rebuilt
   maps.
3. **A main area with a landmark, and views that find it.** One room per map named the focus, with a hero piece
   (a machine, a pit, a stair tower) large, lit hardest and seen from each entrance; `viewsOf` aims at it (item
   5). This answers "recognisable as a designed place" more than any trim does. Measure: the hero is visible
   from every entrance by a ray test; the judge's views include it (a check on the cameras); the
   recognisability item and the view line-up catch rate (P9) on rebuilt maps.
4. **Silhouette breaks and dressing by role, varied.** Pillars at long corners, supports on long bare walls,
   curved and angled options, and placers per room use with prefab variants (items 6 and 7). Measure: non-axial
   vertex share up from about 0 towards Valve's 42% (c1a0: 23% of world brushes not boxes); detail density
   towards about 9 world brushes a 256 x 256 of floor; no prefab more than twice in any view; bare-wall share
   down to Valve's (measured first).
5. **The dressing report as the maker's critique.** Section 6's numbers printed beside Valve's after every build
   (item 9), fed to the maker with the views in the revision rounds, the VLM kept as the eyes and never the
   measure. Measure: over three revision rounds on the original mod's maps, the report's distance to Valve's
   numbers falls each round, and the judge's map total rises with it; if the judge does not move when the
   report does, the report is measuring the wrong things, and that is the finding.

## 9. What I could not verify

- The Valve Developer Community wiki would not serve pages to a script (Anubis proof of work), so its level
  design, colour theory and lighting pages were not read.
- No first-hand source from Valve on Half-Life 1's dressing rules (trim heights, lamp spacing) was found; the
  numbers here are measured from the c1a0 sources and the campaign BSPs, not stated by Valve.
- The isovist-rating correlations of Herve and Salge, the full rule list of SceneCritic, and Holodeck 2.0's
  numbers were read from abstracts only.
- The GDMC 2023 to 2025 winners were not found by name; the 2022 and 2026 winners were.
- Rib and pilaster spacing in Valve's rooms: too few rows in c1a0 to measure (7 gaps each). Bare-wall share and
  wall banding over the whole campaign were not measured; c1a0 alone is the evidence for the banding numbers.
- The c1a0 role split is by box shape, not by what the mapper meant; a panel can be a desk top.

## Appendix: the two measurements

Run with node from any folder; the RMF path is the SDK's `Map Files/c1a0.rmf` (and `c1a0d.rmf`). Nothing of
Valve's is written; only counts are printed. `rmf-read.mjs` prints its usage line on import; ignore it.

```js
// walls: how often a wall plane wears more than one texture stacked up it, and where the joins sit
import { readFileSync } from "node:fs";
import { readRmf } from "/media/Data3/Packages/smak/research/rmf-read.mjs";
const rmf = readRmf(readFileSync(process.argv[2]));
const faces = [];
const walk = (o, ent) => { if (o.type === "CMapSolid" && !ent) faces.push(...o.faces); for (const c of o.children) walk(c, o.type === "CMapEntity" ? o : ent); };
walk(rmf.world, null);
const planes = new Map();
for (const f of faces) {
  const [a, b, c] = f.plane;
  const n = [(b[1]-a[1])*(c[2]-a[2])-(b[2]-a[2])*(c[1]-a[1]), (b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]), (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])];
  const l = Math.hypot(...n), u = n.map((v) => v / l);
  if (Math.abs(u[2]) > 0.05 || /^(sky|clip|aaatrigger|origin|null)/i.test(f.texture)) continue;
  const d = u[0]*a[0]+u[1]*a[1]+u[2]*a[2], zs = f.verts.map((v) => v[2]), z0 = Math.min(...zs), z1 = Math.max(...zs);
  const xs = f.verts.map((v) => u[1]*v[0]-u[0]*v[1]);
  if (z1 - z0 < 1 || (z1 - z0) * (Math.max(...xs) - Math.min(...xs)) < 64) continue;
  const key = u.map((v) => Math.round(v * 20)).join(",") + "|" + Math.round(d / 2);
  (planes.get(key) || planes.set(key, []).get(key)).push({ t: f.texture.toLowerCase(), z0, z1, s0: Math.min(...xs), s1: Math.max(...xs) });
}
// per plane 128+ tall: a join is a z where a face of one texture ends and one of another begins, overlapping along the wall
```

The brush roles: for each world brush, its box's sides sorted (`a <= b <= c`); lit if any face's texture
matches `/~|light|lgt|lite/i` and `c <= 128`; else a strip if `a <= 16 && b <= 24 && c >= 3 * b` (vertical when
`c` is its height); else a panel if `a <= 16 && b >= 32`; else a block. Angled is counted apart: faces not 6.
Scale and shift: each face's `scale` and `su`, `sv` as `readRmf` gives them.

## Sources

All read 2026-10-17.

- Ken Birdwell, "The Cabal: Valve's Design Process for Creating Half-Life", Gamasutra, 1999; read as the PDF copy
  at [jmeiners.com](https://www.jmeiners.com/shamans/papers/art/half_life_design.pdf).
- Dario Casali, "Designing Levels", repost at [dondeq2.com](https://dondeq2.com/2017/07/04/designing-levels-by-dario-casali/);
  [Dev Game Club episode 70](https://devgameclub.libsyn.com/dgc-ep-70-half-life-interview-with-dario-casali) (show notes only).
- [VERC: Half-Life Editing Tips, TWHL](https://twhl.info/wiki/view/159).
- [The Complete Guide to Lighting, TWHL](https://twhl.info/wiki/view/3277).
- Magnar Jenssen, [Functional Lighting, World of Level Design](https://worldofleveldesign.com/categories/wold-members-tutorials/magnar_jenssen/functional-lighting-magnar-jenssen.php).
- [Jokey's Guide to Quake Level Design](https://dondeq2.com/2017/07/29/jokeys-guide-to-quake-level-design/).
- Joel Burgess, [Skyrim's Modular Approach to Level Design, Game Developer](https://www.gamedeveloper.com/design/skyrim-s-modular-approach-to-level-design) (GDC 2013, with Nathan Purkeypile).
- Harvey Smith and Matthias Worch, [What Happened Here? Environmental Storytelling, GDC 2010](https://gdcvault.com/play/1012647/What-Happened-Here-Environmental);
  [Nieman Storyboard interview](https://niemanstoryboard.org/2011/01/14/harvey-smith-on-environmental-storytelling-and-embedding-narrative/).
- Christopher Totten, [An Architectural Approach to Level Design, 2nd ed.](https://www.routledge.com/An-Architectural-Approach-to-Level-Design/Totten/p/book/9780815361367) (contents only).
- Peter Wonka et al., "Instant Architecture", SIGGRAPH 2003; Pascal Muller et al., "Procedural Modeling of Buildings",
  SIGGRAPH 2006 ([PDF](https://course.ccs.neu.edu/cs5150f13/readings/muller_buildings.pdf));
  [gamedev.net tutorial on CGA splits](https://gamedev.net/tutorials/programming/engines-and-middleware/procedural-modeling-of-buildings-with-shape-grammars-r4596);
  Wu et al., [Inverse Procedural Modeling of Facade Layouts, arXiv 1308.0419](https://arxiv.org/abs/1308.0419).
- Paul Merrell et al., [Interactive Furniture Layout Using Interior Design Guidelines](https://graphics.stanford.edu/projects/furniture/), SIGGRAPH 2011.
- Lap-Fai Yu et al., "Make it Home", SIGGRAPH 2011 ([CAM report](https://ww3.math.ucla.edu/camreport/cam11-49.pdf)).
- Matthew Fisher et al., "Example-based Synthesis of 3D Object Arrangements", SIGGRAPH Asia 2012 (from memory of
  the paper; not re-read today).
- [Roblox environmental-art curriculum, trim sheets](https://create.roblox.com/docs/tutorials/curriculums/environmental-art/develop-polished-assets).
- Nikos Salingaros on scaling hierarchy: [architexturez](https://patterns.architexturez.net/node/231338),
  [Computing the Image of the City, arXiv 1212.0940](https://arxiv.org/pdf/1212.0940).
- Salge et al., [GDMC, arXiv 1803.09853](https://arxiv.org/abs/1803.09853); Salge et al.,
  [First Year Report, arXiv 2103.14950](https://arxiv.org/abs/2103.14950); Salge et al.,
  [Impressions of the GDMC challenge, arXiv 2108.02955](https://arxiv.org/abs/2108.02955).
- van der Staaij et al., [Believable Minecraft Settlements by Means of Decentralised Iterative Planning, arXiv 2309.10871](https://arxiv.org/html/2309.10871).
- [Leiden University news, September 2026](https://www.universiteitleiden.nl/nieuws/2026/09/kan-ai-een-mooie-stad-bouwen-in-minecraft-deze-leidse-studenten-deden-het-beter);
  [Leiden, 2022 win](https://www.universiteitleiden.nl/en/news/2022/09/student-team-wins-minecraft-programming-challenge).
- [Niels-NTG, gdmc2024](https://github.com/niels-ntg/gdmc2024).
- Herve and Salge, [Automated Isovist Computation for Minecraft, arXiv 2204.03752](https://arxiv.org/abs/2204.03752);
  Paul Martin, [A spatial analysis of the JBA headquarters in Splinter Cell: Double Agent](https://nottingham-repository.worktribe.com/output/722027);
  Pech, Lam, Masek, [IEEE Access 2020](https://doaj.org/article/a1d0c9d7c59e43cf99a673c6973b1ea3).
- Hu et al., [SceneCraft, arXiv 2403.01248](https://arxiv.org/abs/2403.01248); Huang, Yang, Guibas,
  [BlenderAlchemy, arXiv 2404.17672](https://arxiv.org/abs/2404.17672); Yang et al.,
  [SceneWeaver, arXiv 2509.20414](https://arxiv.org/abs/2509.20414); Bian et al.,
  [Holodeck 2.0, arXiv 2508.05899](https://arxiv.org/abs/2508.05899); Sun et al.,
  [LayoutVLM, arXiv 2412.02193](https://arxiv.org/abs/2412.02193); Du et al.,
  [Text2BIM, arXiv 2408.08054](https://arxiv.org/abs/2408.08054);
  [VoyagerVision, arXiv 2507.00079](https://arxiv.org/abs/2507.00079);
  [MineAnyBuild, arXiv 2505.20148](https://arxiv.org/abs/2505.20148); Yin et al.,
  [AutoUE, arXiv 2603.07106](https://arxiv.org/abs/2603.07106).
- Tam et al., [SceneEval, arXiv 2503.14756](https://arxiv.org/abs/2503.14756);
  [LEGO-Eval, arXiv 2511.03001](https://arxiv.org/abs/2511.03001); Sengupta, Ao, Cascante-Bonilla,
  [SceneCritic, arXiv 2604.13035](https://arxiv.org/abs/2604.13035).
- Machado et al., [Computerized measures of visual complexity, Acta Psychologica 160 (2015)](https://cdv.dei.uc.pt/wp-content/uploads/2017/11/mrnscc2015.pdf).
- Maleki and Zhao, [PCG survey with LLM integration, AIIDE 2024, arXiv 2410.15644](https://arxiv.org/abs/2410.15644);
  Gallotta et al., [LLMs and Games, arXiv 2402.18659](https://arxiv.org/abs/2402.18659) (located, not read in full).
- Valve, Half-Life SDK `Map Files/c1a0.rmf` and `c1a0d.rmf`, measured locally with `research/rmf-read.mjs`.
