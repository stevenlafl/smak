# Maps from a sketch, a plan or screenshots: why the legs fail, how Valve builds, and a staged pipeline

Research for SMAK, 2026-10-15. The map legs of the reproduction test (`examples/reproduce/`) score 0 of 3, with a
walked-floor overlap of 0.315 to 0.689 against Valve's `frenzy`. Steven wants a maker to take a sketch, a
basic screenshot, a few in-game screenshots or a floor plan and rebuild the map's geometry, and to place
entities and choose brush entities as Valve does, tried against the campaign maps (`c1a0`, `c1a1`, `c2a5`...).
His shape for it: a map built in stages, floor plan first, then light, then entities, then prefabs inserted,
each stage checked before the next.

Abbreviations: P1 to P9 (the rubric's map items), IoU (intersection over union: shared cells over all cells
of either), BSP (a compiled map), RMF (Hammer's binary map source, "Rich Map Format"), FGD (an editor's
entity definitions), VLM (vision-language model), DA-V2 (Depth Anything V2, a monocular depth network), ROCm
(AMD's GPU compute stack), SDHLT (seedee's Half-Life compile tools), SDK (Valve's Half-Life Software
Development Kit, the Steam "Half-Life SDK" app), DM (deathmatch).

Scripts in the repo (they read the game and print numbers; nothing of the game is written into the repo):
`research/map-floor-diff.mjs` (where a copy's walked floor differs, by height, drawn),
`research/valve-map-stats.mjs` (96 campaign maps in numbers), `research/rmf-read.mjs` (Valve's own map
sources and Hammer's prefab libraries from the SDK). Experiments, outside the repo:
`~/stignored/map-research/` (`draw-heightplan.mjs`, `trace-heightplan.mjs`, `compile.mjs`, `measure.mjs`,
`measure2d.mjs`, `measure-every.mjs`, `render-views.mjs`, `py/depth.py`, `carve-views.mjs`,
`entity-errors.mjs`, `snap-entities.mjs`; outputs under `hp/`, `sv/`, `stats/`).

## 1. Summary

1. **The legs get the outline right and the heights wrong.** Seen from above alone (any height), the
   pictures and plans legs overlap frenzy's walked floor at 0.858 and 0.839; with heights (the judge's
   measure, floors within 24) they fall to 0.689 and 0.607. The plan they are given draws only the top floor at
   each place and writes a height on a floor only where the words fit, so stacked floors and the floors under
   the 512 roof slabs were guessed. The words leg is wrong in outline too (0.533 from above).
2. **A height plan read by a tool rebuilds the floor at 0.84 to 0.94.** Experiment A: each layer of floor
   drawn as colours by height and by headroom (with a legend), read back by a script with no agent, cells of
   16 merged into box brushes, compiled: frenzy 0.898 on the judge's own measure (the best leg had 0.689),
   c1a0 0.98, c1a0d 0.945, c2a3 0.742, and on every standable floor 0.83 to 0.94 on all six maps tried.
   Gameplay entities put on their layer's floor from their dots: frenzy 54 of 58 matched (0.931).
3. **Screenshots alone cannot give a map's plan.** Experiment C: sixteen views of the kind the harness draws,
   back-projected with their known cameras, see 24 to 30% of the walked floor even with perfect depth. With
   DA-V2's metric indoor model (small, Apache-2.0, run here on ROCm) scaled by the eye's height, the floor
   found is 72 to 74% right on c1a0 and c1a1 and covers almost as much as perfect depth does; on frenzy (dark,
   tall, stacked) 54% right. Screenshots are for heights, shapes of single rooms and textures; the plan has to
   come from a plan or a sketch.
4. **The harness's floor measure needs two changes before campaign maps are subjects.** It walks only from the
   places to start, and a campaign map's walk is cut short by what its scripts open: on c1a2 the walk covers
   1,667 cells of some 6,000 a player fits on, so a copy that is right everywhere scores 0.286 (0.916 on every
   standable floor). And `alignMaps` searches within 128 of the boxes' centres and never tries leaving the copy
   where it was built: c1a1's copy, built in place, scores 0.44 where in place it is 0.79.
5. **Valve's own sources and prefabs are on this machine.** The Steam "Half-Life SDK" app ships `c1a0.rmf`,
   `c1a0d.rmf` (Valve's map sources, with `.rad` texture-light files) and Hammer's five prefab libraries (147
   prefabs). They give the ground truth for how Valve drew brushes (c1a0: 809 world brushes, 77% axis-aligned
   boxes, thinnest side median 16, every vertex on the 1-unit grid) and which set pieces Valve kept as
   prefabs, with their brush entities and wiring (the explosive crate's note: "you need to change targetnames
   if you use more than one").
6. **Brush entities and point entities follow measurable rules** (section 7), measured over all 96 campaign
   maps: items, weapons and ammo stand 2 to 6 over their floor (median; frenzy's all 16), starts 56 (frenzy's
   DM starts 64), tripmines 10 from a wall; `func_wall` carries glass, desks and grates (render mode 4 on 571
   of 1,905); 94% of sliding doors are named; 95% of buttons target something; Valve wires through
   `multi_manager` (`multi_manager -> ambient_generic` in 70 maps, `trigger_once -> multi_manager` in 62).

The ranked kit changes (section 9) follow Steven's stages: a height plan picture and a `trace` tool for the
floor plan, a floor-plan form in the spec (cells with floor and ceiling, layered), the plan measure in the
build report, then light, entities by rule, and prefabs of brushes with their brush entities and wiring
renamed at each insertion.

## 2. Why the frenzy legs fail (measured)

### 2.1 Outline against heights

`~/stignored/map-research/measure2d.mjs`: the walked floor of each leg's build against the original's at the
judge's own alignment, from above only and with heights.

```
Leg              3D overlap (judge)   2D overlap (from above)   Loss from heights
pictures         0.689                0.858                     0.169
plans            0.607                0.839                     0.232
words            0.315                0.533                     0.218
bsp (round 2)    0.942                0.969                     0.027
```

`research/map-floor-diff.mjs` on the pictures leg (cells of 16 x 16; "missed" are the original's cells with no
floor of the copy within 24 of their height):

```
floor z band   original   both   original missed
0 to 32        7511       6814   697
160 to 192     5661       4349   1312
192 to 224     180        0      180
320 to 352     2116       1716   400
total          15594      12989  (copy 16243 cells; IoU 0.689)
```

Drawn (green both, red original only, blue copy only), the losses are three places: the centre, where the
original has two hexagonal floors at 0 on either side of the spine and the copy made one octagon at 160 (the
plan shows the 512 roof slabs over them and writes "z 512"); the four pits round the pillars, where the
copy's walkway at 160 reaches over floor that is at 0; and the north-east annex, whose diagonal corridor the
copy straightened. The plans leg has the same centre and annex faults. The input plan (`frenzy/input/plan.png`)
is the reason: every floor is a shade of grey, the height is written on a floor only where its label fits
(about twenty-five labels for a map with 34 distinct floor heights, counted to 4 units), and what lies under a higher floor is not
drawn. `storeys.png` cuts at fixed heights and does not say which floor is which layer.

### 2.2 Entities

`entity-errors.mjs`: for each of the original's 58 gameplay entities, the nearest of the copy's of its class.

```
Leg        within 64 (3D)   plan within 64   plan within 32   right in plan, wrong height   median plan error   median height error
pictures   48               55               50               7                             11                  32
plans      45               50               43               5                             23                  0
words      21               25               10               4                             141                 12
```

The pictures leg put entities where the plan's dots are (median 11 units off) and at the wrong heights (57 of
58 more than 24 off): 7 of its 11 misses are height alone. Putting every entity on the copy's own floor by
Valve's rule (frenzy's items are all 16 over their floor, its DM starts all 64; `snap-entities.mjs`) made it
worse, 0.81 to 0.76, because the copy's floors are themselves at the wrong heights there. An entity's height
follows its floor: fix the floor plan first, then the rule pays (it does in experiment A, 0.931).

### 2.3 Brush entities

The bsp leg (round 2) matched every point entity (P4 measured 1.0) and was judged 1 on P4 for brush entities:
the two `func_ladder`s at the spine's south end replaced by `func_wall`s, the two `trigger_multiple`s beside
the west doors missing, a `func_illusionary` added. The pictures leg's answer: "what doors 46/47 actually do is
a guess". The plan marks brush entities with an outline and a class in the legend, but nothing says what each
is for or what it is wired to.

### 2.4 The measure itself, on campaign maps

`measure-every.mjs` and `measure.mjs` on experiment A's rebuilds (section 6.1), which were built in the
original's coordinates:

```
Map      judge (walk from starts, aligned)   walk, in place   every floor a player fits on, in place
c1a0     0.980                               0.982            0.944
c1a0d    0.944                               0.945            0.936
c1a1     0.440 (moved 112 in x)              0.810            0.848
c1a2     0.103 (moved 928 in x)              0.286            0.916
c2a3     0.742                               0.797            0.828
frenzy   0.898                               0.898            0.840
```

- `alignMaps` (`examples/reproduce/judge.mjs`) starts from the difference of the two walked boxes' centres and
  searches 128 about it; it never tries the copy as built. When the copy walks more than the original (no
  scripted blockers), the boxes differ and the search lands elsewhere: c1a1 0.44 against 0.79 in place.
- The walk goes from the places to start, with doors open but `func_breakable`, `func_wall_toggle` and
  lifts in the way. Valve's campaign maps are progressions: c1a2's walk covers 1,667 cells of the 6,000 a
  player fits on. A copy that is open everywhere is punished for it.

Both are proposals for the harness (rubric amendment), not changes made here: try the identity move among the
candidates, and for campaign maps measure P2 on every standable floor (`reachOf(...).stands`, walls gone), or
walk with `walls: "gone"` and the map's own `func_train`/lift routes taken as open.

## 3. Valve's maps in numbers

### 3.1 How Valve drew the brushes (their own sources)

`research/rmf-read.mjs map` on the SDK's `c1a0.rmf` and `c1a0d.rmf` (RMF 1.8, Worldcraft 1.6 to 2.1):

```
                                     c1a0          c1a0d
brushes                              942           1129
  world                              809           935
  in brush entities                  133           194
world brushes that are boxes         77%           75%
thinnest side of a world brush       median 16 (q1 8, q3 16) in both
  16 or less                         85%           81%
  8 or less                          34%           33%
longest side                         median 96     median 108   (p90 340 / 308)
faces a world brush                  median 6, p90 6, most 9 / 12
vertices on the 1 grid               100%          100%
vertices on the 8 grid               73%           72%
vertices on the 16 grid              47%           54%
groups                               0             27 (median 6 brushes)
the kit's decompile, brushes         1231 (1.31x)  1440 (1.28x)
```

So a Valve room is a few dozen boxes 8 to 16 thick, most on the 8 grid, a quarter of them cut at an angle
(chamfers, slanted panels). The decompiler's brush count is within a third of the mapper's; its brushes are
split along the tree's planes, not the mapper's.

Brush entities in the two sources (count, brushes each, box of median sorted sides):

```
func_wall            32 / 30   1 brush (most 3 / 9)   4 x 46 x 64 / 4 x 20 x 36   generic028, {gratestep2, glass_med, fifties_dsk1
func_door            10 / 13   1 / 2                  12 x 64 x 160 / 8 x 66 x 108
trigger_once          9 / 8    1                      40 x 70 x 158 / 16 x 112 x 140
func_breakable        7 / 9    1                      8 x 80 x 88 (glass) / 11 x 12 x 14
func_door_rotating    6 / 1    2 / 6 (with ORIGIN)
func_button           3 / 19   1                      2 x 6 x 10 / 3 x 9 x 12
func_healthcharger    2 / 2    1                      8 x 32 x 48
```

### 3.2 Space, over the campaign

`research/valve-map-stats.mjs` over the campaign maps (`valve/maps/c*a*.bsp`; a value a map, then quartiles
over the maps).

```
                                      median   quartiles      p10 to p90      (96 maps)
walked floor (square units)           3.86M    2.35M-5.94M    1.16M-9.18M
footprint x by y                      3360 x 3168
share of the footprint that is floor  0.29     0.19-0.40      0.11-0.50
width (a map's median)                250      215-371        185-505
share of floor under 176 wide         0.21     0.12-0.32      0.06-0.46
headroom (a map's median)             240      200-336        160-544
headroom in corridors                 172      144-220        128-386
headroom in rooms                     256      207-352        160-572
sight (a map's median)                891      668-1299       586-1992
floor heights spanned                 1347     864-2303       532-3400
floors stacked at most                3        3-4            2-5
openings the walk finds               7        2-13           0-22
opening width (all 867)               96       64-128         48-184
```

Rises between neighbouring cells of 16 (all maps, 2 to 18 units), the commonest: 16 (26,152), 4 (23,591),
3 (19,028), 8 (16,274), 2 (14,821), 5 (13,119), 7 (9,760), 12 (9,690). Steps of 16 and 8 are stairs; the small
ones are ramps and slopes crossed cell by cell. Against the kit's own sizes (`docs/MAPS-MAKING.md`): a
corridor 96 to 128 wide and 112 to 128 high is narrower and lower than Valve's (the median place is 250 wide
and corridors 172 high); a doorway of 64 is Valve's lower quartile, 96 its median.

### 3.3 Brush entity classes, over the campaign

```
Class               maps  count  faces   box (short x long x high)  render modes          what it wears; keys
func_wall           94    1905   6.9%    16 x 68 x 32               0:1265 4:571 2:56     swamp walls, desks, turbines, {grate4a; named 110 (6%)
func_breakable      82    1874   4.5%    32 x 64 x 48               0:1486 2:328 4:56     vents, file boxes, cacti, barrels, crates; health 1/5/10/90,
                                                                                         material wood 678, metal 443, glass 223/168; named 518, targets 557
func_door           75    623    2.2%    12 x 96 x 97               0:456 4:104 2:56      named 583 (94%); speed 100, wait -1 (246) or 4 (217)
trigger_once        81    528    0.8%    38 x 143 x 86              -                     aaatrigger
func_illusionary    62    469    1.3%    10 x 112 x 32              4:207 2:125 1:67      fill1, !toxicgrn2, {rail1, {rail2, glassgreen
func_pushable       46    302    0.8%    48 x 56 x 56               0                     crates, barrels
trigger_hurt        63    246    0.7%    140 x 289 x 58             -
func_train          43    243    1.7%    80 x 112 x 64
trigger_changelevel 96    222    0.4%    16 x 128 x 104
func_button         58    222    0.3%    3 x 12 x 12                0:195 2:27            targets 212 (95%); wait 10 or 3; sounds 9 or 14
func_door_rotating  51    220    1.0%    12 x 68 x 39               0:195 4:17            named 185 (84%); wait -1 (148)
trigger_multiple    47    178    0.3%    56 x 144 x 64
func_ladder         63    174    0.3%    4 x 32 x 244               0                     never named; rungs {ladder1, {ladder2, {ladder3b beside it
trigger_autosave    73    155    0.2%
trigger_push        26    152    0.4%
func_monsterclip    23    147    0.2%
func_rotating       41    131    1.0%    fans, turbines
func_water          31    94     0.6%
func_healthcharger  48    87     0.1%    8 x 32 x 48
```

World faces are 72.4% of all faces; func_wall, func_breakable and func_door carry another 13.6%. Valve had no
`func_detail` (it is Vluzacn's, later): its small detail is `func_wall` or world.

### 3.4 Where point entities stand

"gap": origin over the floor under it (the world's, or the top of a brush entity under it); "ceil": room over
the origin; "wall": the nearest solid along 16 level directions at the origin's height; "wall at foot": the
same 16 over the floor. Medians with quartiles.

```
Class                n      gap over floor      room over it        nearest wall      stands on
info_player_start    135    56 (40-72)          140 (101-280)       90 (64-130)       world 91%
item_*               213    2 (0-16)            164                 40 (26-102)       world 83%, func_wall 10%, func_breakable 4%
weapon_*             158    6 (0-16)            136                 38 (26-62)        world 77%, func_wall 17%, func_breakable 6%
ammo_*               250    4 (1-16)            164                 32 (24-50)        world 85%, func_wall 11%
monster_scientist    93     4 (0-17)            160                 66 (40-96)        world 88%
monster_human_grunt  163    4 (0-16)            192                 66 (46-104)       world 93%
monster_alien_slave  98     4 (0-16)            208                 68
monster_headcrab     166    15 (4-32)           128                 48                world 89%, func_breakable 8% (vents)
monster_zombie       36     1 (0-33)            150                 68
monster_barnacle     86     397 (328-488)       0 (in the ceiling)  -                 hangs
monster_tripmine     58     38 (28-59)          122                 10 (8-10)         on a wall, 93% within 32
info_node            4804   24 (16-32)          224                 68 (48-102)
env_glow             216    238 (140-280)       4 (4-20)            14 (2-66)         at a lamp
env_beverage         14     31                  38                  8                 inside the machine's front
frenzy (DM)          items, weapons, ammo all 16; info_player_deathmatch all 64
```

About half of the items and ammo are within 32 of a wall at their foot (44% and 52%); monsters stand clear
of walls (9 to 31% within 32).

### 3.5 Light

```
                             n      gap over floor   below the ceiling     nearest wall    brightness          styled or switched
light                        2039   94 (51-204)      134 (60-360)          64 (30-146)     100 (50-150)        1150 (56%)
light_spot                   753    136 (67-232)     125 (32-374)          68 (32-128)     175 (100-250)       521 (69%)
light within 16 of ceiling   9% (light), 19% (light_spot); within 48: 22%, 29%
a map's light entities       median 13 (4-32); 8 maps have none
a map's texture-lamp faces   median 66 (23-117) faces wearing a texture of the calibrated texture-light list
light per 256 x 256 of floor 0.26 light entities (median over maps)
```

Valve lights mostly by texture lamps: a median map has five lamp faces for each `light` entity, and half its
`light` entities are switched or flicker (a named light, or a style). The kit's `light: "auto"` hangs one lamp
for each 256 x 256 of floor, four times Valve's count of light entities, and lights by entities, not lamp
faces. The SDK's `c1a0.rad` and `c1a0d.rad` give Valve's own texture-light values (`+0~LIGHT3A 255 255 255
25000`, `+0~FIFTIES_LGT2 255 255 255 20000`...).

### 3.6 Wiring

What names what, as "the classes that fire X -> X's class", counted by maps using it.

```
maps  count  motif
70    478    multi_manager -> ambient_generic
62    126    trigger_once -> multi_manager
60    186    multi_manager -> multi_manager
46    581    path_corner -> path_corner
42    239    multi_manager -> env_sprite
38    113    multi_manager -> func_breakable
35    47     trigger_once -> scripted_sequence
33    104    multi_manager -> env_beam
31    88     multi_manager -> light
31    50     func_button -> multi_manager
29    148    func_train+path_corner -> path_corner
29    61     multi_manager -> func_door
26    618    path_track -> path_track
22    57     multi_manager -> monstermaker
17    41     func_breakable -> multi_manager
11    45     trigger_teleport -> info_teleport_destination
10    15     func_button -> func_door
9     14     trigger_multiple -> func_door
```

Valve wires through `multi_manager` (a trigger or a button fires one, which fires sounds, sprites, beams,
lights, doors and breakables): that is what a scripted moment is made of. A door is opened by touch far more
often than by a button.

### 3.7 Valve's prefab libraries

`research/rmf-read.mjs prefabs` on `Half-Life SDK/Hammer Editor/prefabs/*.ol` (141 of 147 read; `old stuff.ol`
is an older layout). Every one is brushes, never a model:

```
Library            Prefabs   What
Crates             47        crates 32/48/64/96 as func_pushable (light) or func_breakable (heavy), stacks
                             broken into 5 to 9 func_breakable pieces, ammo boxes, lockers, sandbags and a
                             cage as world brushes, two barrels, and an explosive crate: func_breakable +
                             env_explosion + env_shooter, wired by the crate's target ("you need to change
                             targetnames if you use more than one")
Usable Objects     33        emergency lights (func_wall, 4 to 5 brushes, four facings), a file cabinet whose
                             bottom drawer is a func_door ("opens for surprise goody"), wheel valves, a
                             pushable supply ladder (22 brushes), suit chargers, retinal scanners
                             (func_button 32 x 8 x 40), func_healthcharger and func_recharge 32 x 8 x 48
computers          14        mainframes 32 x 72 x 96 (world), and the "White Computer, Large" from c1a0:
                             71 brushes, 7 func_wall, 12 env_beam, 18 info_target, 14 env_spark, wired by name
random objects     51        shelves, desks, couches, armchairs, a trash can, signs, carts, chairs
                             (func_pushable), a metal shelf of 4 func_breakable boxes "to hide small goodies
                             in", and 16 vending machines 64 x 48 x 100 in four facings (world brushes)
```

Each facing is a prefab of its own (north, south, east, west), which is how Hammer 3 handled turning. In
c1a0d the vending machine is that prefab plus five `func_button`s (`target soda_machine_2`, `wait 10`,
`sounds 14`, `lip 2`, `angle 90`) and one `env_beverage` (`targetname soda_machine_2`, `skin` the flavour,
`health` the number of cans) at the slot, 31 over the floor and 8 from the front: the library holds the body,
the map adds the wiring.

## 4. Methods from outside

```
Method                                    What it does                                     For SMAK
Floor-plan vectorisation                  A raster plan to room polygons, doors, windows   The kit's plans are clean: a rule-based tracer
  Raster-to-Vector (Liu et al. 2017),                                                     does it (section 6.1). The learned ones are for
  RoomFormer (Yue et al. 2023),                                                           scans of paper plans; RoomFormer's code is
  Raster2Seq (2026), FloorplanVLM (2026)                                                  public (ywyue/RoomFormer) and could run on ROCm
                                                                                          for a person's photographed sketch
Manhattan room layout from one image       A room's corners and walls from one picture,    One room at a time, mostly panoramas; trained
  LayoutNet (Zou et al. 2018),             under right-angled walls                         on real rooms. Not tried; a VLM reading a view
  HorizonNet (Sun et al. 2019),                                                           with the kit's grid does the same for a box room
  comparative study (Zou et al. 2019)
Single-view metrology                      Heights and lengths from vanishing points and    The arithmetic a maker needs to read a door's
  (Criminisi, Reid, Zisserman 2000)        one known height                                 height off a screenshot; the eye at 64 is the
                                                                                          known height in every in-game view
Monocular metric depth                     Depth per pixel from one picture                 Tried (section 6.2): usable indoors after
  Depth Anything V2 (Yang et al. 2024)                                                    scaling by the eye's height; runs here on ROCm
Multi-view geometry without calibration    Cameras and points from a few to hundreds of     A few screenshots with unknown cameras into one
  DUSt3R, MASt3R, VGGT (Wang et al. 2025)   pictures, in one forward pass (VGGT)             point cloud. Not tried; VGGT is the one to try
                                                                                          (code public; GPU memory not checked)
Sketch to game scene                       A sketch to an isometric picture by diffusion,   The layout-from-a-picture step, for terrain;
  Sketch2Scene (Xu et al. 2024)            segmented to a 2D layout, built procedurally     its 2D layout is what our trace gives
LLM proposes, solver places                The model writes relations, an optimiser         The spec's words (`against`, `beside`, `near`)
  Holodeck (Yang et al. 2024),             satisfies them                                   are this already; extend them to entities by
  Constraint Is All You Need (2025)                                                       class rules (section 7)
Level images as channels                   Doom levels as images of walkable floor,         The height plan of section 6.1 is this
  Giacomello, Lanzi, Loiacono 2018          walls, height and things                         representation, used to read, not to generate
Hammer instances with name fix-up          An inserted map's names prefixed or suffixed     The rule for wired prefabs (section 7.3)
  (func_instance, Source)                  per insertion
Decompilers                                bsp2map (goldsrc.net, now the kit's              The bsp leg's answer; not a method for
                                           map-decompile), newbspguy, the Unified SDK's     pictures
```

Which apply to an LLM with tools and no training: the tracer, single-view metrology (arithmetic the maker
does with the eye height and the camera the view names), constraint-style placement, the channel
representation, and name fix-up. Which run locally on this AMD GPU: DA-V2 (done), VGGT and RoomFormer (both
PyTorch; not tried). None needs training.

## 5. What a maker is given, and what each input can carry

```
Input                        Outline   Heights   Stacked floors   Entities      Brush entities   Light   Textures
plan.png (today)             yes       sparse    no               dots, legend  outlines         no      tone only
storeys.png (today)          yes       sparse    by cut height    dots          outlines         no      tone only
sections (today)             a line    yes       on the line      near the line on the line      no      no
views (today)                little    readable  no               visible ones  visible ones     yes     yes
height plan (proposed)       yes       all       by layer         dots          outlines + class no      no
a person's sketch            yes       if written no              if drawn      rarely           no      no
a few screenshots            ~25%      readable  no               visible ones  visible ones     yes     yes
```

## 6. Experiments

### 6.1 A: a height plan read by a tool

`draw-heightplan.mjs` draws, from the original BSP, for each layer of floor (layer 0 the lowest at a place),
the floor's height and the headroom over it as colours, 4 pixels a 16-unit cell, with a legend (written as
`legend.json`: what a printed legend and grid labels say) and the gameplay entities' dots with the layer they
are drawn on (`marks.json`). `trace-heightplan.mjs` reads only those: each cell's open stretches, the walked
floor grown by one cell (the walk keeps a player's middle 16 off every wall, so the room is one cell wider),
cells of the same stretches merged into rectangles, each solid stretch one box, a frame of rock round it
all; entities on their layer's floor, items at the floor and starts 36 over it. Compiled with SDHLT (no vis,
no light), measured with the judge's own functions.

```
Map      cells        layers  heights  brushes  judge P2   in place   every floor   P4 (judge)
frenzy   153 x 131    4       34       2710     0.898      0.898      0.840         0.931 (54 of 58)
c1a0     174 x 141    2       29       825      0.980      0.982      0.944         0.25 (doors)
c1a0d    215 x 186    2       30       921      0.944      0.945      0.936         0 of 2 (a door)
c1a1     149 x 170    8       47       1420     0.440      0.810      0.848         0.158
c1a2     270 x 133    3       45       1158     0.103      0.286      0.916         0.286
c2a3     212 x 258    6       128      6264     0.742      0.797      0.828         0.333
```

- Growing the floor by one cell matters: frenzy 0.841 with none, 0.898 with one, 0.855 with two.
- Its P4 misses on campaign maps are brush entities (`func_door_rotating`, `func_train`, `func_tracktrain`): a
  height plan carries no doors. The four frenzy misses are on the 336 ledges, a layer read wrongly.
- `c2a5` (a canyon) did not compile: 514 floor heights made 57,000 to 67,000 brushes, past SDHLT's brush limit
  even with heights rounded to 16. Columns are the wrong shape for terrain: sloped ground wants the kit's
  `terrain` (triangles from heights), which the same picture would feed.
- It is an upper bound for a picture a tool reads exactly; a person's sketch carries less. It says the
  geometry part of P2 is solved once the heights reach the maker per place and per layer.
- 2026-10-16, the kit's own path (`smak map-heights`, then a spec of `floorplan: { dir }` and one start,
  compiled draft): frenzy 0.840 on every floor, the bound above. The height-plan leg's round 12 (Haiku) built
  0.826, so the maker is within 0.014 of it and P2 (2 from 0.7) has no more to give. Of the 3,112 floor cells
  the bound misses, 1,463 are not in the plan and 1,443 are in it and lost in the carve. 1,062 of the plan's
  12,357 columns tell one floor twice and the ledge over it not at all: a player standing on a ledge's edge
  has the middle over the floor below, and the plan draws the surface under the middle. Drawing the ledge's
  height there instead lowered the bound to 0.795 (the reader's one cell of growth then widens every ledge
  twice), so it was not kept. The judge's P3 of 1 on round 12 ("lower rooms at about 64 in the original and
  128 in the reproduction") is not in the floors: both have their floors at 0, 160, 320 and 512 in the same
  shares.

### 6.2 C: screenshots with known cameras

`render-views.mjs` draws the views `viewsOf` picks (the places to start and the largest rooms, 14 to 16 a map,
640 x 480, 90 degrees), and for the bound marches each ray through the map for its true depth (160 x 120).
`py/depth.py` runs DA-V2 metric indoor small on each picture (`torch-rocm` venv in `local-3d`, weights in its
`weights/hf`). `carve-views.mjs` back-projects each depth with the view's camera, scales the model's metres so
that the floor at the picture's foot is 64 under the eye, keeps points whose surface faces up, and bins them in
cells of 16 with their height. Precision against the walked floor grown by a cell; recall against the walked
floor.

```
Map      views   depth   floor cells   precision   recall   IoU
c1a0     14      true    2384          0.831       0.240    0.217
c1a0     14      model   2546          0.736       0.224    0.198
c1a1     14      true    2011          0.942       0.248    0.231
c1a1     14      model   2580          0.717       0.234    0.206
frenzy   16      true    5710          0.939       0.302    0.283
frenzy   16      model   3733          0.542       0.114    0.101
```

- A handful of views sees a quarter of the floor, however good the depth.
- DA-V2's own metric scale is far off on game pictures (19 to 90 units a metre where 39.4 is right); scaled
  by the eye's height it is close to true depth on lit indoor maps and fails on frenzy's dark, tall halls.
- So screenshots serve stage 1 for heights and the shape of a room seen whole, and stages 2 and 4 for light
  and textures; the plan comes from a plan or a sketch. Unknown cameras (a player's own screenshots) would
  need VGGT or the maker's reading; not tried.

### 6.3 B: entities snapped to the floor

Section 2.2: snapping a leg's entities to its own floors by Valve's rule lowered the pictures leg from 0.81 to
0.76; in experiment A the same rule on right floors gives 0.931. The rule is worth having only after the
floor plan is right.

## 7. Rules: brush entities, point entities, prefabs

### 7.1 When geometry is a brush entity (Valve's practice, measured)

```
It is ...                                           Valve makes it                       Numbers (section 3)
glass, a grate, a fence, a railing with holes       func_wall, render mode 4 (holes) or  glass_med, {grate4a, {rail2; func_wall
  ({ texture) or see-through                         2 with renderamt (glass)             render 4 on 571 of 1,905, 2 on 56
small detail in a room: a desk top, a lamp housing,  func_wall (16 x 68 x 32 median)      the commonest func_wall textures are desks,
  trim, a computer panel                              or world                             turbines and panels; Valve had no func_detail
detail a player walks through                        func_illusionary                     469 over 62 maps; fill1, !toxicgrn2, {rail
something that breaks: a window, a vent cover, a     func_breakable, material by what it  1,874 over 82 maps; health 1, 5, 10, 90; material 1
  crate, a box hiding an item                         is, spawnobject for what is inside  (wood) 678, 2 (metal) 443, glass 391
something pushed                                     func_pushable                        302; crates 32 to 64, barrels 42 x 42 x 56
a door that slides or lifts                          func_door, named                     623 over 75 maps; 94% named; speed 100, wait -1 or 4
a door on hinges                                     func_door_rotating with ORIGIN       220; 84% named; wait -1 in 148
a button, a switch, a keypad, a retinal scanner      func_button / func_rot_button        222 / 31; 95% target; wait 10 or 3, sounds 9 or 14
a ladder                                             func_ladder (4 thick) behind a       174 over 63 maps; {ladder1, {ladder2, {ladder3b
                                                       func_wall of rungs (render 4)
a lift, a tram, a moving platform                    func_train + path_corner, or         243 / 38
                                                       func_tracktrain + path_track
a health or suit station                             func_healthcharger / func_recharge   87 over 48 maps; 8 x 32 x 48 on a wall
a hurting or pushing volume, a level change, a save  trigger_hurt / push / changelevel /  aaatrigger, no light
                                                       autosave / once / multiple
```

Rules a check could hold: a `{` texture on the world is a fault (holes filled); a breakable has a material
and a health; a door that nothing names opens by touch (fine) but one with `wait -1` that nothing names never
closes; a func_ladder has rungs in render mode 4 in front of it; a turning entity has an ORIGIN brush; a
trigger wears `aaatrigger`. Since SDHLT has `func_detail`, the kit's own default for furniture (func_detail)
stays right for building; it is not what Valve did, which matters only for counting entities in a copy.

### 7.2 Where point entities stand (Valve's numbers, section 3.4)

- **Items, weapons, ammo**: on the floor or a brush under them (a desk is a `func_wall` in 10 to 17%, a
  breakable box 2 to 6%), 0 to 16 over it (campaign medians: items 2, ammo 4, weapons 6; frenzy: all 16);
  about half within 32 of a wall.
- **Places to start**: campaign `info_player_start` 56 over the floor (40 to 72; 36 is the box's middle, so
  Valve's sit higher and drop); frenzy's DM starts all 64.
- **Monsters**: on the floor (scientists, grunts and alien slaves 4), headcrabs 15 and 8% on breakables (a vent
  cover); barnacles in the ceiling; tripmines 10 from a wall; clear of walls (median 66 to 68).
- **Lights**: `light` 94 over the floor, 64 from a wall, 9% within 16 of the ceiling; 56% are switched or
  styled; most of a map's light comes from texture lamps (a median of 66 lamp faces a map against 13 light
  entities).
- **Wired objects**: `env_beverage` 31 over the floor and 8 inside the machine's front; `info_node` 24 over
  the floor, 68 from walls.

These belong in the spec as defaults by class (`at` gives the plan place; the height comes from the class),
and in the report as a warning when an entity strays outside its class's range.

### 7.3 Prefabs with brush entities and wiring

A set piece that does something is a prefab of brushes (a `.map`, never a `.mdl`) that carries its brush
entities and point entities and their wiring: the vending machine (body, five buttons, an `env_beverage`), the
explosive crate (breakable, explosion, shooter), the large computer (walls, beams, targets, sparks), the file
cabinet (a drawer that is a door), a metal shelf of breakable boxes, a retinal scanner beside its door, a
health charger. Studio models stay for detailed props.

The kit already renames a prefab's own names at each insertion (`prefabFromMap` in `src/spec/map.mjs`: a name
the prefab gives gets `_<tag>`, and every key in `NAME_KEYS` that names it follows). From the wiring Valve
uses, three gaps:

1. **Keys that name entities but are not in `NAME_KEYS`**: `LightningStart`, `LightningEnd` (`env_beam`, the
   large computer's twelve beams), `LaserTarget` (`env_laser`), `m_iszEntity` (`scripted_sequence`,
   `aiscripted_sequence`: names the monster), `m_iszNewTarget` (`trigger_changetarget`), `TriggerTarget` (any
   monster), `altpath` (`path_track`), `train`, `toptrack`, `bottomtrack` (`func_trackchange`). The SDK's
   `halflife.fgd` types some of them `target_destination` (`LightningStart`, `LaserTarget`, `toptrack`,
   `altpath`) and others plain strings (`TriggerTarget`, `m_iszEntity`, `m_iszNewTarget`), so: rename every
   key whose FGD type is `target_destination` or `target_source` (the kit reads FGD types already,
   `src/maps/fgd.mjs`), the string-typed ones by a short list, and `multi_manager`'s own keys as now.
2. **`angle` is not turned** with the prefab; only `angles` is. Valve's buttons, doors and pushers give their
   move direction in `angle` (c1a0d's soda buttons: `angle 90`); turned a quarter, the buttons would press
   sideways. `-1` and `-2` (up, down) stay.
3. **Names given outside the prefab**: a prefab that targets a name it does not give (a door it opens) keeps
   it, as now; the insertion should take a map of such names (`wire: { door: "lab_door" }`), as Hammer's
   instances take parameters.

Hammer's own answer in Source is the instance's fix-up name, prefix or suffix (`func_instance`); the kit's
suffix is the same idea.

## 8. The pipeline, stage by stage

```
Stage            The kit has                                Missing                                    Measured against the original by
1 floor plan     rooms as boxes by words, `layout` (text    a height plan picture; a `trace` tool from  P2 overlap on every standable floor, in
                 grid, cell 64), `outline` pieces (prism),  a plan picture to a draft; a floor-plan     place (section 2.4); the build's own plan
                 carve, sections, storeys, the walk test,   form of cells with floor and ceiling and    against the reference picture (pixel IoU
                 the plan grid                              layers; polygon room outlines; terrain     of floor masks per layer)
                                                            from heights; the plan in the report
2 light          room light auto/none/dark, the calibrated  lamps by Valve's placement (texture-lamp   floor light on a grid at matched cells;
                 texture lights (TEXLIGHTS), lightParity,   faces, wall lamps 8 off the wall),         lightParity at matched faces; the dark
                 map-light                                  brightness against the views               share
3 entities       entities by room and words, FGD checks,    heights by class (7.2), a warning outside  P4 within 64 after the floor is right;
                 the walk test, the sweep                   the class's range, the plan's dots read    the same per class family
                                                            as places
4 prefabs and    prefabs of pieces or `.map` files with     the gaps of 7.3; a prefab library from     P4 for brush entities by class and box;
  brush          their entities, renamed; func_detail by    the person's own `.ol`/`.map` files; brush a list of wired motifs against the
  entities       default; ladders as Valve's               entities by the rules of 7.1               original's (section 3.6)
```

Each stage checked before the next: a floor plan whose standable floor matches the reference's under 0.85 is
not lit; lamps follow rooms; entities follow floors; prefabs follow walls and floors (a vending machine against
a wall, a charger on one).

## 9. Ranked kit changes

Gains are in the judge's measures where measured, else estimates.

```
 #  Change                                                           Stage  Cost          Expected gain
 1  Harness: identity move in alignMaps; for campaign maps P2 on     -      half a day    Makes cXaY subjects measurable at all
    every standable floor (walls gone); rubric amendment                                   (c1a2 0.29 -> 0.92 for a right copy)
 2  A height plan picture: `map-plan --by height|headroom --layer n`  1      a day         Measured upper bound: frenzy P2 0.69 ->
    with a printed legend; in the pictures, plans and bsp legs'                            0.90 when read exactly; heights were
    inputs                                                                                 the legs' main loss (0.17 to 0.23)
 3  A `trace` tool: a plan picture (the kit's, or a person's with a   1      2 to 3 days   The maker gets a draft of rooms and
    legend) to a draft floor plan: regions, polygons snapped to 8/16,                     heights instead of reading pixels
    floor and ceiling per region, layers; output as the spec form of 4
 4  A floor-plan form in the map spec: cells (16 to 64) keyed to      1      2 days        What 2 and 3 produce; any outline, any
    floor and ceiling, several layers, merged into boxes; `terrain`                       stack of floors, sealed by construction
    where the key says ground
 5  The build's plan against the reference: pixel IoU of floor masks 1      a day         The maker sees P2 before the judge does
    per layer, with the diff picture (map-floor-diff's colours)
 6  Prefab wiring fixes: FGD-typed name keys, `angle` turned, `wire`  4      half a day    Wired set pieces insert correctly more
    parameters                                                                            than once (7.3)
 7  Entity heights by class and a warning outside Valve's range       3      half a day    frenzy items all 16, starts 64; gain
                                                                                          only after 2 to 5
 8  Brush-entity rules as checks (7.1) and a library of Valve-like    4      2 days        P4 for brush entities, P7 detail
    wired prefabs as `.map` files written by the kit (no Valve
    files): vending machine, charger, scanner and door, breakable
    vent, crate stack, file cabinet with a drawer
 9  Polygon room outlines (`outline` rooms; MF 5)                     1      2 to 3 days   Angled walls without cylinders; also
                                                                                          what a tracer's polygons become
10  Light by Valve's placement: texture-lamp faces in ceilings, wall  2      2 days        P6
    lamps 8 off, brightness held to the views
11  Screenshots: DA-V2 depth to heights and a room's shape, scaled    1      2 days        Heights for a sketch with no numbers;
    by the eye, as a helper outside the kit (generators, like                             recall is a quarter of the map per 15
    `generate`)                                                                           views, so not a plan
12  VGGT for screenshots with unknown cameras                          1      try first     Unknown
```

## 10. What I could not verify

- Experiment A reads a picture exactly; no agent read it, and a person's sketch with written heights was not
  tried. Its gain on a leg's score is the bound, not a rerun of a leg.
- The light, texture, landmark and view items (P5, P6, P7, P9) were not measured on any experiment's build
  (compiled without light, one texture).
- DA-V2 was run at its small size only (base and large are non-commercial); VGGT, RoomFormer and LayoutNet were
  not run.
- c2a5 and other terrain maps were not rebuilt (brush limit); `terrain` from the same picture is untried.
- The point entity numbers are medians over what the stats script kept (up to 400 a class a map) and use the
  hull-0 floor under the origin; an entity over a hole reads high.
- `old stuff.ol` (six prefabs) is in a layout the reader does not parse.
- Whether the kit should ship a prefab library modelled on Valve's (written fresh, no Valve file copied) is
  Steven's call.

## 11. How to run it again

```
G=~/.steam/steam/steamapps/common/Half-Life/valve/maps
S="$HOME/.steam/steam/steamapps/common/Half-Life SDK"
node research/map-floor-diff.mjs $G/frenzy.bsp examples/reproduce/frenzy/pictures/built/frenzy_copy.bsp -o diff.png
node research/valve-map-stats.mjs $G ~/stignored/map-research/stats      # resumable, about an hour for 96 maps
node research/valve-map-stats.mjs --sum ~/stignored/map-research/stats
node research/rmf-read.mjs map "$S/Map Files/c1a0.rmf"
node research/rmf-read.mjs prefabs "$S/Hammer Editor/prefabs"
cd ~/stignored/map-research
node draw-heightplan.mjs $G/frenzy.bsp hp/frenzy && node trace-heightplan.mjs hp/frenzy hp/frenzy_g1.map --grow 1
node compile.mjs hp/frenzy_g1.map && node measure.mjs $G/frenzy.bsp hp/frenzy_g1.bsp && node measure-every.mjs $G/frenzy.bsp hp/frenzy_g1.bsp
node render-views.mjs $G/c1a0.bsp sv/c1a0 16
HF_HOME=/media/Data3/Packages/local-3d/weights/hf /media/Data3/Packages/local-3d/venvs/torch-rocm/bin/python -I py/depth.py sv/c1a0
node carve-views.mjs $G/c1a0.bsp sv/c1a0
```

## Sources

- This repo: `examples/reproduce/` (`judge.mjs`, `inputs.mjs`, `reproduce.mjs`, `rubric.md`, `scores.md`,
  `frenzy/*/judge.json`, `answer.md`, `spec.json`, `built/`), `src/spec/map.mjs` (`prefabFromMap`),
  `src/maps/`, `docs/SPEC.md`, `docs/MAPS.md`, `docs/MAPS-MAKING.md`, `research/map-reproduction-failures.md`.
- Half-Life (Steam): `valve/maps/*.bsp`; Half-Life SDK (Steam): `Map Files/c1a0.rmf`, `c1a0d.rmf`, `c1a0.rad`,
  `c1a0d.rad`, `Hammer Editor/prefabs/*.ol`, `Hammer Editor/fgd/half-life/halflife.fgd`. Read and measured;
  nothing copied.
- [TWHL, Specification: RMF](https://twhl.info/wiki/page/Specification:_RMF); [Valve Developer Community, RMF](https://developer.valvesoftware.com/wiki/RMF_(Rich_Map_Format)).
- [Valve Developer Community, func_instance](https://developer.valvesoftware.com/wiki/Func_instance) (name fix-up);
  [func_wall (GoldSrc)](https://developer.valvesoftware.com/wiki/Func_wall_(GoldSrc)),
  [func_detail_illusionary (GoldSrc)](https://developer.valvesoftware.com/wiki/Func_detail_illusionary_(GoldSrc)),
  [TWHL func_wall](https://twhl.info/wiki/page/func_wall/6081), [TWHL func_illusionary](https://twhl.info/wiki/page/func_illusionary).
- Liu, Wu, Kohli, Furukawa, [Raster-to-Vector, ICCV 2017](https://openaccess.thecvf.com/content_iccv_2017/html/Liu_Raster-To-Vector_Revisiting_Floorplan_ICCV_2017_paper.html);
  Yue, Kontogianni, Schindler, Engelmann, [RoomFormer, CVPR 2023, arXiv 2211.15658](https://arxiv.org/abs/2211.15658);
  [Raster2Seq, arXiv 2602.09016](https://arxiv.org/html/2602.09016v1); [FloorplanVLM, arXiv 2602.06507](https://arxiv.org/pdf/2602.06507).
- Zou, Colburn, Shan, Hoiem, [LayoutNet, arXiv 1803.08999](https://arxiv.org/abs/1803.08999); Sun et al.,
  [HorizonNet, arXiv 1901.03861](https://arxiv.org/abs/1901.03861); Zou et al., [Manhattan room layout comparative study, arXiv 1910.04099](https://arxiv.org/abs/1910.04099).
- Criminisi, Reid, Zisserman, [Single view metrology, IJCV 2000](https://www.microsoft.com/en-us/research/publication/single-view-metrology-4/).
- Yang et al., Depth Anything V2 (2024), [metric indoor models](https://huggingface.co/depth-anything/Depth-Anything-V2-Metric-Indoor-Small-hf).
- Wang et al., [VGGT, CVPR 2025, arXiv 2503.11651](https://arxiv.org/abs/2503.11651) (and DUSt3R, MASt3R as compared there).
- Xu et al., [Sketch2Scene, arXiv 2408.04567](https://arxiv.org/abs/2408.04567).
- Yang et al., [Holodeck, CVPR 2024, arXiv 2312.09067](https://arxiv.org/abs/2312.09067);
  [Constraint Is All You Need, PCG workshop 2025](https://www.pcgworkshop.com/archive/xu2025constraint.pdf);
  [Zero-shot 3D Map Generation with LLM Agents, arXiv 2512.10501](https://arxiv.org/pdf/2512.10501).
- Giacomello, Lanzi, Loiacono, [DOOM Level Generation using GANs, arXiv 1804.09154](https://arxiv.org/abs/1804.09154).
- Birdwell, "The Cabal: Valve's Design Process For Creating Half-Life" (1999), as listed by the
  [Valve Developer Community](https://developer.valvesoftware.com/wiki/Cabal_process); not re-read here.
