# 06 A guard room (map, one room, furnished)

## The prompt (101 words)

> A small guard room as a Half-Life map I can load and walk around in. One room, about 384 units by 320,
> and 160 high, with a stone floor, plaster walls and a ceiling of wooden planks. I start by the south wall
> facing north. There's a wooden table in the middle of the room with a health kit on it, three wooden
> crates stacked in the north-east corner (two on the floor, one on top), and a box of 9mm ammo by the west
> wall. A lamp lights the room well. It must be sealed, with nothing stuck in walls.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | One room about 384 x 320 x 160 | yes | 2 |
| 2 | Stone floor, plaster walls, plank ceiling | no | 2 |
| 3 | The start by the south wall, facing north | yes | 2 |
| 4 | A table in the middle with a health kit on it | yes | 2 |
| 5 | Three crates in the north-east corner, two on the floor and one on top | yes | 2 |
| 6 | 9mm ammo by the west wall | no | 2 |
| 7 | Sealed (no leak), compiled, every entity reached on foot, nothing in solid, lit | yes | 2 |

**Score: 14 of 14 (100%). Passes.**

## How the prompt became the spec

- One room, `size: [384, 320, 160]`, and the theme: `stone` floor, `plaster` walls, `planks` ceiling.
  The map makes its own .wad of these pictures: it needs no game's.
- The table and the stack of crates are brush `prefabs` (pieces of boxes, in units from the point on the
  floor where they are put): the table a top on four legs, 32 high; the crates two 32 cubes side by side
  and one on top of them. They are put with `furniture`: the table at the room's `centre`, the crates 136
  east and 128 north of it (in the north-east corner, clear of the walls).
- The start is `against south` facing `north`; the health kit 24 east of the middle at `z: 32` (on the
  table's top); the ammo `against west`. The light is the room's own (`auto`: two lamps for its floor).

## Iterations

1. Clean on the first build, compiled with SDHLT: all 3 entities reached on foot (the kit on the table is
   within reach of the floor beside it), nothing in solid, no leak, the floor's light 189 of 255. The view
   of the room was taken from a man's height in the south-west corner, and the start's marker box stood in
   front of most of it.
2. The views of every map now look down across each room from high in its corner (`src/spec/map.mjs`).
   The plan (picture-1) shows the table in the middle with the health kit on it, the three crates in the
   north-east corner, the ammo by the west wall and the start by the south wall; the view (picture-2)
   shows the stone floor, the plaster walls, the plank ceiling, the table and the stacked crates.
