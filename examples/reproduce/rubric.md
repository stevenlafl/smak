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

## Passing

A reproduction passes when **every must-have item scores 2 and the total is 85% or more**. An item the
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
