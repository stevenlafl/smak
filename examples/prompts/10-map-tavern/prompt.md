# 10 A tavern from a drawing (map, a layout drawn by the person, .map prefabs, model props, two storeys)

## The prompt (220 words)

> The ground floor of a coaching inn, and the bedroom floor over it. Here is my sketch of the ground floor,
> one character for every 64 units, north at the top:
>
>     KKK.HHHHHHHHH
>     KKK.HH1H1HHHH
>     KKK.HHHHHHHBH
>     ....HHHHHHHHH
>     ....HHHHHHHHH
>     .............
>     ..........EE.
>     ..........EE.
>
> K is the kitchen, H the common room, E the entrance hall, where I start, facing north. Dots are solid
> wall. Each 1 is a table with a bench on each side (the same table each time), and B is the bar counter,
> running north to south, with the barkeep standing behind it on its east side. Doors from the entrance to
> the common room and from the kitchen to the common room. The common room is 192 high, the kitchen and
> the entrance 128.
>
> Stairs in the common room go up to a bedroom floor directly over the common room, 128 high, with two beds
> against its east wall and my round tavern table between them. Put three of my barrels in the kitchen and
> two behind the bar. Make the table with its benches, the bar and the beds as prefabs, .map files I can
> reuse in other maps, and use the props I made before for the barrels and the round table. The tables
> each have a candle burning on them; the rest should be lit warmly too.

The drawing was first drawn with a common room 7 cells wide and the entrance under its middle; writing the
spec showed that a straight stair up to the floor above (13 steps, 312 long) then had no wall to run along
that it would not block: the entrance, the kitchen's door, the bar or the tables. The prompt was changed
before anything was built: the room 9 cells wide, the entrance under its east end.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | The ground floor matches the drawing: kitchen, common room and entrance where the drawing has them, of its sizes (judged beside the drawing) | yes | 2 |
| 2 | Doors entrance to common room and kitchen to common room; the start in the entrance facing north | yes | 2 |
| 3 | Tables with benches at both 1s; the bar at B running north to south; the barkeep behind it on its east side | yes | 2 |
| 4 | Stairs up to a bedroom floor over the common room, 128 high, two beds against its east wall, the round table model between them | yes | 2 |
| 5 | Three barrels in the kitchen, two behind the bar | no | 2 |
| 6 | The table, the bar and the beds are .map prefabs, the table's candle an entity of its prefab | yes | 2 |
| 7 | Common room 192 high, kitchen and entrance 128 | no | 2 |
| 8 | Sealed, compiled, every entity reached on foot, nothing in solid, every room lit | yes | 2 |

**Score: 16 of 16 (100%). Passes.**

## How the prompt became the spec

- The drawing is the spec's `layout`, row for row: `cell: 64`, the key giving K, H and E their rooms and
  1 and B their prefabs. A drawn room takes its height from `size` (a number) and its plan from the
  drawing; `wall: 64` is the one cell of dots between rooms.
- The bedroom floor is a room `above` the common room on a slab of 16 (`gap: 16`), the same plan; a
  `stairs` link puts 13 steps along the common room's south wall and cuts their shaft through the slab.
- The table with its benches and its candle, the bar and the bed are `.map` files made by
  `make-prefabs.mjs` (beside the spec), Hammer's way: each a group of brushes (and, for the table, a
  `light` entity: the candle), its origin the point on the floor where it goes, its textures named as the
  spec's materials (`SM_FURNITURE`, `SM_COUNTER`, `SM_LINEN`). The layout's marks put the tables and the
  bar; `furniture` puts the two beds against the bedroom floor's east wall.
- The barrels and the round table are case 01's and case 03's models (`models` by file, `props`).
- `make-prefabs.mjs` also draws the person's drawing as `drawing.png`, which `run.mjs` hands to `build` as
  its `reference`: the plan of the result comes back beside it (picture-1).

## Iterations

1. `ERROR layout: the cells of common make no rectangle (42 cells in a box of 45)`: the kit counted the
   three cells with a 1 or a B as holes in the common room. A mark drawn inside a room's area is now a cell
   of that room with something on it (`readLayout`).
2. The build crashed in the kit (`Cannot set properties of undefined (setting 'light')`): the light report
   also tells of the floor that is in no room (here the stairs' top, "elsewhere"), which the map builder
   took for a room. It is passed over now; a test builds a map with stairs between storeys.
3. Clean, compiled: all 4 entities reached on foot, every room lit (kitchen 219, common room 165, entrance
   242, bedrooms 191). The candles are where the tables are, moved with them (`origin 416 416 44` and
   `544 416 44` in the written map). Picture-1 is the drawing beside the plan of the result: the kitchen,
   the common room 9 cells wide and the entrance under its east end where the drawing has them, the tables
   at the 1s, the bar at B with the barkeep behind it, the stairs along the south wall. Picture-2 has the
   rooms' views (the stairs up, the stairwell in the bedroom floor), picture-3 the section through the
   stairs, picture-4 the props: three barrels in the kitchen, a table and its benches before the bar with
   the barkeep behind it, and upstairs two beds against the east wall with the round table between them.
