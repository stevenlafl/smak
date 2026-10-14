# 09 A village square (map, open sky, buildings round it, model props)

## The prompt (167 words)

> A little village square at midday. The square itself is open to the sky, about 640 by 512, paved with
> cobbles, and the sun lights it. On its north side is the inn, a room about 512 by 320, entered through a
> wooden door in the middle of the square's north wall; a security guard stands inside by the door. On the
> east side is the smithy, 320 by 384 and taller than the inn, open to the square through a wide archway
> (about 128 wide and 128 high) near its south end. On the south side is a gatehouse, 256 by 192, which is
> where I come in: I start there facing north into the square. In the square put two of my street lamps,
> one on each side of the inn's door, three of my barrels against the inn's wall to the left of the door,
> and my handcart parked in the middle. Use the props I already made. Everything indoors lit by lamps,
> the square by the sun.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | A square about 640 x 512 open to the sky, cobbled, lit by the sun | yes | 2 |
| 2 | The inn to the north (512 x 320) through a door in the middle of the north wall, a guard inside by the door | yes | 2 |
| 3 | The smithy to the east (320 x 384, taller), through a wide archway near its south end | yes | 2 |
| 4 | The gatehouse to the south (256 x 192) with the start, facing north | yes | 2 |
| 5 | Two street lamps (case 02's model) either side of the inn's door | yes | 2 |
| 6 | Three barrels (case 01's) against the inn's wall left of the door; the handcart (case 04's) in the middle | yes | 2 |
| 7 | The props are the models already made, built from their own specs | no | 2 |
| 8 | Sealed, compiled, every entity reached on foot, nothing in solid, indoors lit by lamps | yes | 2 |

**Score: 16 of 16 (100%). Passes.**

## How the prompt became the spec

- The square is a room with `sky: true` (its ceiling a slab of `sky`, lit by a `light_environment` the
  kit adds: the sun, `sun` in the spec) and a floor of `cobbles`. The inn `north_of` it, the smithy
  `east_of` it aligned `south` and 224 high, the gatehouse `south_of` it.
- Links: a `door` in the middle of the north wall; an `opening` 128 by 128 at 0.25 along the east wall (its
  south end); an `opening` to the gatehouse.
- `models` names the three props by the spec files of cases 01, 02 and 04; the map's build builds each
  (and checks it) into `models/` beside the map, and `props` puts them in: `cycler_sprite` entities whose
  `model` key names them, at points in the square given from its middle.
- The guard is a `monster_barney` inside the inn, by the door.

## Iterations

1. The build crashed in the kit (`Cannot read properties of undefined (reading 'min')`): a room with both
   a floor and a ceiling of its own (the cobbles and the sky) lost track of its own box after the first
   lining. That part of `src/spec/map.mjs` was rewritten, each room's carved box kept apart from its
   linings; a test now builds such a room.
2. Clean, compiled: all 3 entities reached on foot, floors lit 181 (the square, by the sun), 206, 169,
   185. The plan (picture-1) shows every prop where it was put; but the views of the rooms (picture-2),
   taken across a whole room from its corner, were too small to judge the models by. The build now adds,
   for every room with props, a larger view at a man's height from across the room towards them.
3. Clean. That view (picture-3) shows the inn's door in the square's north wall with a street lamp on
   each side of it, the barrels by the wall to its left, and the handcart in the middle, lit and shadowed
   by the compiled sun.
