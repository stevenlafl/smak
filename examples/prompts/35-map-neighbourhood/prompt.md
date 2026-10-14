# 35 The neighbourhood (map; six modules on a street, in four seasons as change requests)

## The prompt (222 words)

> Now put the neighbourhood together. One long main street running east to west, asphalt with a yellow
> dashed line down the middle and a sidewalk along each side, street lamps along both sidewalks and a few
> cars parked. On the north side, from the west, the three houses: the blue ranch house, the red brick
> two-storey and the yellow bungalow with its garage, each on its lot with its driveway onto the street. On
> the south side the row of shops behind its parking lot, and next to it the building site behind its
> hoarding. At the east end of the street, the park with its courts and playground. Every house, shop and
> the site keep everything they have on their own: their rooms, furniture, yards and lights. It is a
> deathmatch map, so put a start at the west end and two more along the street. A player has to be able to
> walk from the street into every house, every shop, the site and the park, and every room has to be lit.
> It must compile and fit the engine's limits. Show me the plan, the street, and each building from the
> street. Then I'll ask for it in winter, autumn and spring.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | A main street: asphalt, a yellow dashed line, sidewalks, lamps both sides, parked cars | yes | 2 |
| 2 | The three houses on the north side, each on its lot with its driveway to the street | yes | 2 |
| 3 | The shops and the building site on the south side; the park at the east end | yes | 2 |
| 4 | Every module as it was alone: rooms, furniture, yards, lights | yes | 2 |
| 5 | Three starts for deathmatch | no | 2 |
| 6 | Compiles within the engine's limits, every room lit, every place reached on foot from the street | yes | 2 |

**Score: 12 of 12 (100%), judged from the pictures and the change report. Passes.**

## How the prompt became the spec

- The street is the one room of its own: asphalt, the dashed line and the sidewalks brush furniture laid on
  it, case 02's street lamp along both sidewalks, case 28's sedan parked. The six modules are taken in by
  `include`, each placed against the street by a compass word and an `align` (its distance along it), and
  linked to it where its own test street was; their test streets are left out.
- Every module keeps what it had: its rooms, buildings, furniture, models and lights, under its prefix.
  The models the modules share (one sofa file in three houses) are built once.

## Iterations

1. A module's theme word naming one of its own textures (`outside: "siding_blue"`) did not come into the
   larger map under the module's prefix: fixed in the kit, with a test.
2. Two starts stood on the dashed line, half a unit high: moved off it.
3. The houses' front doors were grey metal, the map's own door, where the modules ask for wood: a module's
   doors now keep its door material (a test).
4. Every module built its own copy of the models they share (three sofas, four fridges): about 60 models
   for 25 files, each loaded by the engine. A model of one file is now one model (a test): 25, and the
   build in 33 seconds where it took 50 to 64.

The engine's limits, from the compilers' own chart: models 59 of 512 before the last fix, planes 1093 of
32768, faces 3812 of 32768, clipnodes 3053 of 32767, leaves 532 of 8192, lightmap blocks 14 of 64.
