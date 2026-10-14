# Reproducing Valve's models and maps: the rubric

Written 2026-10-14, before any input was made or anything built. It does not change after the first build.

The test: an agent that cannot open Valve's files (a fresh `claude -p` with only the SMAK MCP server, given
no game folder for models and only the `.wad` textures for maps) reproduces a model or a map of Half-Life
from one kind of input, a **leg**:

| Leg | Models | Maps |
| --- | --- | --- |
| pictures | renders of the original from six sides and four close angles, and its size in units | a plan from above with floor heights, the storeys, a section, and views from inside at a player's eye |
| words | a description written by another agent who looked at those pictures (no file or game name in it) | the same, for the map |
| bsp | | the compiled map itself, read through the server's tools (never its `.rmf` or `.map`) |

A third agent, the **judge**, scores each reproduction. It sees this rubric, the original's pictures and the
reproduction's, drawn by the harness from the same cameras at the same scale, and the harness's measurements.
It never sees a spec, an input of the leg, or the reproducer's words. Each item is scored 0 (wrong or
missing), 1 (there, clearly off) or 2 (right to a close look).

## Models

| # | Item | Must | What a 2 is |
| --- | --- | --- | --- |
| M1 | Silhouette and proportions | yes | every one of the six views has the original's outline: the measured silhouette overlap (the two outlines centred on each other, at true scale) is 0.80 or more in every view, and no part sticks out or is missing in any |
| M2 | Size | yes | each of length, width and height within 10% of the original's (measured) |
| M3 | Parts | yes | every component of the original is there, the right number of each, in the right place and the right shape (drawers, handles, wheels, legs, a glass panel, a strap) |
| M4 | Colours and materials | yes | each region has the original's colour and material (painted metal, glass, cloth, skin), within what one would call the same colour; the measured colour difference inside the shared outline is under 15 (CIE76 ΔE) on average |
| M5 | Surface detail | no | the original's markings, lettering, panel lines, stripes, glows and wear are there, in their places, at a similar sharpness |
| M6 | Visual fidelity | yes | side by side at the size the game shows it, a player would take the reproduction for the original; and in a line-up of the originals of every subject and five other Valve props, the judge picks the right original for it |
| M7 | Facing and placing | no | the front is the original's front, upright, and it stands (or lies) on its origin as the original does |
| M8 | Fit for the game | yes | SMAK's check passes for GoldSrc; no more than twice the original's triangles; nothing open, inside out or floating |

## Maps

| # | Item | Must | What a 2 is |
| --- | --- | --- | --- |
| P1 | Layout | yes | the same areas, in the same arrangement, joined by the same ways (doors, corridors, stairs, lifts, jumps) |
| P2 | Dimensions | yes | areas' sizes and places within about 10%: the measured overlap of the walkable floor, the two plans aligned, is 0.70 or more |
| P3 | Levels | yes | the same floor heights, ceilings, stairs, ramps, ledges and drops, in the same places (section and storeys agree) |
| P4 | Gameplay entities | yes | the places to start, weapons, ammunition, items and anything that moves (doors, lifts, triggers that matter) are the same classes, in the same places (measured: 80% or more of them matched within 64 units after alignment) |
| P5 | Textures | no | each surface wears the original's texture or one that a player would not tell apart in passing |
| P6 | Light | no | lamps in the same places, of the same colour and brightness; the same bright and dark areas |
| P7 | Landmarks and detail | no | the original's distinctive features (a central corridor, windows, grates, pillars, trim, crates) are there and in place |
| P8 | Works | yes | it compiles, does not leak, every place to start reaches every weapon and item on foot (as the original's do), within the engine's limits |
| P9 | Visual fidelity | yes | the views from the original's places to start, taken from the same points in both maps, look like the same place: a player who knows the map would recognise it at once |

## Weapons, characters and creatures (added 2026-10-14, before any of them was built)

A **weapon** is the game's set of three files: the first-person `v_` model (the weapon in the player's
hands, with its animations), `p_` (in another player's hands) and `w_` (lying in the world). It is reproduced
into the game's own files, whose hands, bones and animations it keeps (the server lets the build fit the new
weapon into them and never shows it the old weapon). A **character** (a person, a creature) is reproduced on
another model's skeleton: its own is refused. The legs are pictures and words, as for any model.

Each is scored on the Models table, M1 to M8, with these readings:

- A weapon's M1, M2, M4 and M8 are measured on its `w_` model; M3, M5 and M6 are judged over all three files,
  the first-person view (still and in its attack) first among them, since that is how the player sees it.
- A character's or creature's M1 to M8 are measured and judged in the first frame of its first animation, as any
  model's are.

And one more item each:

| # | Item | Must | What a 2 is |
| --- | --- | --- | --- |
| W1 | In the hands | yes | in the first-person view the weapon sits where the original sits, held the same way, the same way round, and moves with the hands through its attack without leaving them |
| C1 | In motion | yes | through a run and an attack (or a walk), drawn frame by frame, every part stays on the body and moves as the original's does: nothing comes apart, sinks or floats |

A weapon passes on M1 to M8 and W1, a character on M1 to M8 and C1, by "Passing" below.

## Textures, sounds and sprites (added 2026-10-14, before any of them was built)

The same test for the other kinds of a mod's assets. A **texture** or a **sound** is replaced: a set of Valve's
is made again under the same names, so the game takes ours in their place, and judged at least as good. A
**sprite** is reproduced, as a model is. Legs: **pictures** (a texture's place in the map seen from inside, never
the texture itself, which would be a copy; a sprite's frames as a contact sheet; a sound's waveform over its
spectrogram) and **words** (another agent's description of those pictures). The judge sees the original and the
replacement side by side, drawn and measured by the harness: textures each on its own and in the map's own
views (the original map drawn wearing each .wad in turn), sounds as pictures and features (it cannot listen;
that limit is said in every sound result), sprites as sheets and their measures.

### Textures (each texture)

| # | Item | Must | What a 2 is |
| --- | --- | --- | --- |
| T1 | What it is | yes | a player would call it the same thing: the same material and purpose (concrete wall panel, metal grate, tiled floor, a light's face) |
| T2 | Colour | yes | its mean colour in the map's views within 15 (CIE76 delta E, measured over the faces that wear it, smoothed as M4 is) |
| T3 | Layout and scale | yes | its panels, seams, bricks or tiles at the original's spacing on the wall, so the map's surfaces line up as they did |
| T4 | Tiling | no | no seam where it repeats (measured: the step across its edges no larger than inside it) |
| T5 | Quality | yes | side by side at the size the game shows it, at least as good: as sharp, as detailed, as believable, with nothing smeared or noisy that the original is not |
| T6 | Kind kept | yes | its name and size exactly (the map's faces depend on both), and what its name means kept: a `{` texture with holes where the original has them, a `+0`..`+9` animation with its frames, a `!` liquid, a light's face lit |

### Sounds (each sound)

| # | Item | Must | What a 2 is |
| --- | --- | --- | --- |
| S1 | What it is | yes | from its picture and features, the same event (a crowbar striking metal, a shotgun's blast, a door's slide) |
| S2 | Envelope | yes | its length within 25%, its attack and decay (T20) within the class's range (measured) |
| S3 | Spectrum | yes | its centroid within 20% and each band's share within 10 points (measured) |
| S4 | Character | no | the onsets (hits, clicks), the tone or noise (flatness) and any pitch movement match |
| S5 | Fit for the game | yes | the file the engine plays: mono PCM at 11025, 22050 or 44100 Hz, 8 or 16 bits, no clipping, no DC, a loop's cue where the original has one, the same name |

### Sprites (each sprite)

| # | Item | Must | What a 2 is |
| --- | --- | --- | --- |
| R1 | What it is | yes | the same effect (a glow, a flame, an explosion, smoke, sparks, a beam) |
| R2 | Shape and size | yes | its frames the original's size, the effect filling them as the original's does |
| R3 | Colour | yes | the same colours as the engine blends them (measured: the frames' mean colour within 15, smoothed) |
| R4 | Motion | yes | the same number of frames within 25%, the same kind of motion (grows, rises, flickers, fades), a loop that closes where the original loops and a one-shot that ends dark where it does (measured) |
| R5 | Fit for the game | yes | the original's type and format (additive, index alpha, alpha test), the same name, read back as written |

## Original creation: a small mod from a brief (added 2026-10-14, before any of it was built)

The test that the kit makes a mod, not only copies one. The brief is `original/brief.md`, fixed with this
section: three connected maps, five props, a weapon in place of the crowbar, an enemy in place of the
headcrab's model, a .wad of twelve textures or more, three sprites, six sounds and the pictures and videos to
show them. One fresh agent with only the MCP server (the game's folder for its `.wad` and its own files to fit
into, as in the other tests) makes all of it from the brief alone, with as long as it needs.

The judge sees the brief, this rubric, and the harness's pictures and measurements of what was made; never a
spec or the maker's words. Each asset is scored on its kind's table above, with "the original" read as **what
the brief asks**, and these measures in place of the ones against an original:

| Kind | Measured in place of the original's |
| --- | --- |
| A prop, the weapon, the enemy | M1: its outline judged against the brief's words; M2: within 15% of a size the brief gives; M6: beside three of Half-Life's own of its kind at the same scale (a line-up the harness draws), a player would take it for one of the game's; M8: no more than twice the median triangles of Half-Life's own of its kind and size (`docs/SPEC.md`, "How many triangles") |
| The enemy | C2: it keeps the headcrab's contract (`compareContract`, measured), so the game's own headcrab plays it |
| A map | P1 to P3: the brief's areas, joined as it says, at its sizes within 25%; P4: the entities it names (starts, the wrench, the crawlers, the doors, the lift) are there and reached; P8 measured as for any map (compiles, no leak, the walk test reaches every item and the way out); P9: from inside, a player would take it for a map of Half-Life's |
| A texture | T2: its colour as the brief says; T3: its pattern at a scale a wall of the game's has; T5: beside Half-Life's own textures of its kind, flat and on a wall, at least as good (its fine detail within Valve's band, measured as in research/asset-reproduction-failures.md, Table 4) |
| A sound | S2 and S3: within the range of Half-Life's own sounds of its class (`src/audio/classes.mjs`), measured |
| A sprite | R2 to R4: within the measures of Half-Life's own sprites of its class (`SPRITE_CLASSES`), measured |

And the mod as a whole:

| # | Item | Must | What a 2 is |
| --- | --- | --- | --- |
| O1 | Complete | yes | every asset the brief lists is there, under the file name the game looks for, and passes SMAK's checks for GoldSrc |
| O2 | Wired | yes | each map leads to the next where the player can walk to it, by a level change with its landmark, and arrives where the last left (measured: the walk test reaches each change of level from the start); every model, sprite and sound a map names is among the mod's files or the game's |
| O3 | One place | yes | the assets read as one place: the palette, the materials and the wear agree across maps, props, textures and sprites (judged from one sheet of everything) |
| O4 | Shown | no | the videos and the sheet of props the brief asks for are there and show each asset as it is |

The mod passes when O1, O2 and O3 score 2 and at least 80% of the assets of each kind pass by "Passing" below.
The decoy is the brief made plainly by the harness itself (each prop a box of its size, each texture one flat
colour, each sound a hiss of its length, each sprite one disc, each map one room with the entities in it): it
must fail.

## Houses from their drawings (added 2026-10-14, before any of it was built)

A map made from a real house's measured drawings and photographs: three houses of the Historic American
Buildings Survey (`research/blueprint-sources.md`: a Wyoming homestead, a Hawaiian teacher's cottage, a Maine
house with a kitchen wing), public domain. The maker sees the plan sheets (and the elevations and sections) and
the photographs, and builds the house as a map a player walks through, its doors as doors that open and its
windows as windows. One leg (the drawings and photos), iterations allowed.

The **key** is written from the drawings before anything is built (`blueprints/<house>/key.json`): each room's
outline in feet, with its storey and floor height, and each door and window with its wall and width. A foot is
12 units. The judge sees the drawings, the photos, this rubric and the harness's pictures and measures, never a
spec. Each house is scored on the Maps table, read against the house:

| # | Read as | Measured |
| --- | --- | --- |
| P1 | the rooms the plans show, joined as they are | |
| P2 | each room's size and place within 10% | the walkable floor against the key's rooms, aligned: 0.70 or more overlap, each storey |
| P3 | the storeys, the stairs where the plans put them, ceiling heights from the sections | |
| P4 | every door of the plans a door entity that opens (`func_door` or `func_door_rotating`), every window a window, at its place | 80% or more of the key's doors matched by a door entity within 24 units, and of its windows by an opening within 24 units |
| P5 | the surfaces of the photos: their materials and colours | |
| P6 | light as the photos show it: rooms lit by their windows and lamps | |
| P7 | the house's details: a bay window, a porch, a fireplace, trim | |
| P8 | compiles, does not leak, every room reached on foot from the start | as for any map |
| P9 | from inside, at a photo's place, a player would know the room in the photo | |

A house passes by "Passing" below. The decoy is the key's outer walls made one room with no inside walls, doors
or windows: it must fail.

## Passing

A reproduction (or a replacement) passes when **every must-have item scores 2 and the total is 85% or more**. An item the
original does not have (surface detail on a plain prop) is scored 2 when the reproduction adds nothing wrong.

## Keeping the judge honest

- **Controls.** Each judging run also scores, unknown to it among the real ones, two decoys: the reproduction
  of another subject, and a plain box (or a single room) of the original's size. Both must fail. If a decoy
  passes, every score of that run is void and the judge is run again with the rubric's wording tightened.
- **Order.** Original and reproduction are always labelled, never swapped; the judge scores each item before it
  writes a total.
- **Measured, not guessed.** M1, M2, M4, M8, P2, P4 and P8 have a measurement each, given to the judge. The
  judge may score lower than the measurement allows (what the measurement misses), never higher.
- **Reasons.** Every score under 2 names what is wrong and where, so it can be checked against the pictures.

## What is not tested

Animations, sounds, how a model sits in a hand, and how a map plays with people in it: the kit's pictures and
walk test, not the game.

## Amendments

- **2026-10-14, M4 measured on smoothed pictures (Steven's decision).** After rounds 1 and 2, the failure
  research (research/repeated-failures.md) found that M4's per-dot colour difference also counts the texture's
  grain: an original whose every region kept its exact colour but lost its grain scored 10 to 14, against the
  pass line of 15. Grain is M5's item. From this date M4's measurement smooths both pictures over 7 x 7 dots
  (at the judge's 384-dot pictures), inside each outline, before the difference is taken; the line stays 15.
  Round 2 was judged again under it; round 1 keeps the scores it was given at the time. Views where the original shows nothing (an open underside
  from below) are left out of the mean, as "inside the shared outline" always said; the harness had counted
  them as 100.
- **2026-10-14, a mod's player models (Steven's request, before any was built).** Mods use a player model's
  bones, animations, attachments and bodyparts by name and number from their code (The Specialists turns
  "Bip01 Dorso" to aim and plays "dive_f_" with a weapon's suffix). Two of The Specialists' own players, seal
  and merc, are reproduced in both legs on its canonical player (player/gordon/gordon.mdl, 171 animations with
  every stunt), whose contract the mod's code relies on. Each is scored on M1 to M8, C1 and **C2, its
  contract (must-have)**: a 2 keeps every bone, animation (at its number, with its activity), attachment (on
  its bone) and bodypart of the base (`compareContract`, measured: any fault caps C2 at 0). C1 is judged on
  its run and on a stunt (a forward dive), each beside the original's.
- **2026-10-14, the asset test's pictures and measures, after round 1 (research/asset-reproduction-failures.md).**
  Before round 2: each texture's face is its largest face lit in every colour, else its largest lit one (four
  of frenzy's were judged on faces the map leaves black; `maps.texturePlaces`, which the agents' preview uses too); the judge also sees every texture flat, on its own, beside the original, with an
  animation's frames and a random set's tiles (T6 needs them, and "on its own" always said so); T2 is the
  larger of the view's colour difference and the flat textures' (a face under a coloured lamp hides its
  texture's colour). The words leg is given the facts the pictures leg has (a sprite's size, frames, type and
  format; a sound's length and rate). S2's decay range is the sound's class's where it is of one
  (`src/audio/classes.mjs`), else the original's own decay within a quarter or 0.05 s; outside it caps S2 at 1.
  Round 1 keeps the scores it was given.
- **2026-10-14, who judges (Steven's decision: cost first).** Judging on Opus cost about a percent of Steven's
  plan a minute. From this date: an asset whose measure already holds a must-have item under 2 fails with no
  judge asked; the judge is Haiku; and a model Haiku fails only on M3, M4 or M6 (every must-have item short of
  2 one of those, at 1 and held there by the judge, not a measure, and a point more on each would reach the
  bar) is judged again by Opus, whose scores stand (`closeCall`, examples/reproduce/judge.mjs). On eight legs
  Opus had judged (calibration-haiku.md), Haiku scored within 1 of Opus on every item and never above it, lower
  on M3, M4 and M6 only, and turned three of Opus's passes into fails; with Opus on the close calls, all eight
  came out as Opus had them, with four Opus judgements in place of eight. Decoys are judged the same way and
  must still fail. Results judged on Opus alone before this date keep their scores.
- **2026-10-14, later: a person's reviews of the close calls; Haiku's verdict stands.** Steven reviewed round 7
  blind (pictures only, the judges' words after his verdict; examples/reproduce/reviews/). The battery he put at
  about 95%, its top's textures and a 7-sided cylinder (the original's 8) short of it; the headcrab at 80%, its
  claws missing and seams showing, "needs work to be perfect"; and he holds the rubric's stricter reading right:
  "Textures matter a lot". On both, Haiku failed and Opus passed, so close calls are no longer handed to Opus
  (`closeCall` only with SMAK_OPUS_CLOSE_CALLS set). His forklift notes (the lift shifted in the side view, the
  back's slopes built as blocks, a half-sphere helmet) agree with its measured fail. Neither judge saw the missing
  claws or the cylinder's sides. Read so, props from pictures pass 1 of 5 in round 7 (the filing cabinet).
- **2026-10-14, the houses' floor measure, after Kaupo's first judging.** P2 had compared the key's rooms with
  every floor the walk test reached, and Kaupo scored 0.18 with 0 of 9 doors. Four faults of the measure, not
  the house, were found, and the measure now: takes only floor indoors (the nearest ceiling over it is not the
  sky and is within 160 units: a yard, and the ground under the eaves, are no rooms); widens it by a cell
  (16) each way, since the walk test keeps a player's middle 16 off every wall and the key's rooms run to their
  walls; keeps only floor at a height one of the key's storeys has; and tries the key at each quarter turn,
  keeping the best (the drawings fix the plan, not which way the map's axes run; Kaupo was built turned half
  round; a mirror is not tried). Doors and windows are matched with the same turn. Kaupo then measures 0.64,
  9 of 9 doors and 19 of 19 windows, and still fails P2. The decoy (the outer walls as one room) measures
  0.69 on floor, since an empty shell covers the footprint, and fails on its doors and windows (P4), as the
  decoy is meant to. A house's open deck under the sky (Grindle's) is not counted as floor, and an attic
  whose ridge is over 160 may lose part of its floor: both noted for when those houses are judged.
- **2026-10-14, later: the model judge's prompt, and a control of the judge itself.** From Steven's reviews (the
  headcrab's missing claws and the battery's 7-sided cylinder seen by neither judge; texture faults charged to
  shape), the model judge is told to list the original's parts down to the small ones (claws, teeth, rivets, the
  sides of a round part) and find each before scoring M3, and to charge a difference only in the painted
  picture to M4 or M5, never M1 or M3. A control judges each original against itself, told it is the
  reproduction (`judge.mjs identical`), and again with one pixel of the reproduction's half lightened
  (`touched`): Haiku gave the battery and the headcrab 16 every time and never docked a shape item, but took a
  point off the filing cabinet's surface detail in four runs of six and failed it once (14, M6). A single 1 on
  M5 or M6 from Haiku is therefore not yet proof of a fault.
- **2026-10-14, later: two readings for a model.** Each model is judged twice by Haiku and each item takes the
  better of the two scores, with that reading's reason. On the control (an original against itself, one pixel
  touched) one reading had docked surface detail in four runs of six; with two readings, six runs of six scored
  16 of 16. Every decoy still fails (the filing cabinet's box, the one judged, at 7 of 16). A fault that is there
  shows in both readings; one that a reading made up seldom does.

