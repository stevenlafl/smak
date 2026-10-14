# 07 A cottage (map, rooms joined by a door, a step and a hatch)

## The prompt (151 words)

> A little cottage interior for a single-player map. The main room is about 384 by 320 with a brick
> fireplace in the middle of its west wall, a fire glowing orange in it (a warm orange light is enough), and
> a wooden floor. I start in the main room near the south-east corner, looking towards the fireplace. To
> the east, through a wooden door, is a bedroom about 256 by 320 whose floor is one step higher than the
> main room. It has a bed against its east wall. North of the main room is a narrow pantry, 384 by 160,
> reached by an open doorway, with a serving hatch (a window) in the same wall next to the doorway. The
> pantry has shelves along its north wall and a headcrab hiding in it. Every room should be lit, and I
> want to be able to walk everywhere.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | Three rooms of about the sizes asked: main 384 x 320, bedroom 256 x 320 to the east, pantry 384 x 160 to the north | yes | 2 |
| 2 | A brick fireplace in the middle of the main room's west wall, with an orange light in it | yes | 2 |
| 3 | The start near the main room's south-east corner, facing the fireplace | yes | 2 |
| 4 | A door to the bedroom, whose floor is one step up; a bed against its east wall | yes | 2 |
| 5 | An open doorway to the pantry and a hatch (window) beside it in the same wall | yes | 2 |
| 6 | Shelves along the pantry's north wall, a headcrab in it | no | 2 |
| 7 | Wooden floor in the main room | no | 2 |
| 8 | Sealed, compiled, every entity reached on foot, nothing in solid, every room lit | yes | 2 |

**Score: 16 of 16 (100%). Passes.**

## How the prompt became the spec

- Three rooms placed by words: `bedroom` `east_of` `main` with `floor: 16` (one step up), `pantry`
  `north_of` `main`. The main room's floor is lined with `boards` (`surfaces`); the theme gives the rest.
- Links: a `door` from main to bedroom (the kit puts a sliding `func_door` in it and notes the step of 16);
  an `opening` and a `window` (the hatch, 64 wide, its sill 40 up) in the main room's north wall, at 0.3
  and 0.7 along it.
- Three brush prefabs: a `fireplace` of brick (hearth, jambs, mantel, chimney breast up to the ceiling),
  put with its back against the middle of the west wall (`at: [-192, 0]`: the wall itself); a `bed`
  (frame, linen mattress, headboard) against the bedroom's east wall; `shelves` (three boards on
  uprights) along the pantry's north wall.
- The fire is a `light` entity in the hearth, low and orange; the rooms' own lamps light the rest. The
  start is in the main room's `corner se` facing `west` (the fireplace); the headcrab in the pantry.

## Iterations

1. Clean on the first build, compiled with SDHLT: 3 rooms, 3 ways through, all 3 entities reached on
   foot, no one-way place, nothing in solid, the floors lit 197 (main), 172 (bedroom), 151 (pantry). The
   plan (picture-1) shows the fireplace in the middle of the west wall with its light, the doorway and the
   hatch side by side in the north wall, the door east to the bedroom, the bed against its east wall, the
   shelves and the headcrab in the pantry and the start in the south-east corner. The views (picture-2)
   show the plank floor and the brick fireplace, the bed, and the shelves.
