# 16 A cyber-clinic (map module; a prefab of the city, case 17)

## The prompt (214 words)

> One more shop for my cyberpunk city: a back-street cyber-clinic, as a piece I can drop in, with a bit of
> night street in front to try it alone (I start there, facing its door).
>
> From the street a door opens into a cramped waiting room (about 320 by 256) with dirty white tiles: a
> bench along one wall, a reception desk with the doctor behind it, and a vending machine whose front
> glows. Through a second door at the back is the surgery (about 384 by 320, a little taller): clean
> white tile floor and walls, an operating chair in the middle under a bright white surgical lamp, two
> glowing cyan monitors on a cart beside the chair, and along the back wall a shelf of glowing green jars
> of cybernetic parts. A tray of tools (a health kit) sits on a small table by the chair. The waiting room
> is lit flat and sickly green-white; the surgery is the brightest room in the city, white light pooled on
> the chair. The street outside is night and faint. Walkable, reachable, sealed, nothing stuck in
> anything.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | A door from the night street into a waiting room 320 x 256 with dirty white tiles; the start on the street facing it | yes | 2 |
| 2 | In the waiting room a bench along a wall, a reception desk with the doctor behind it, a vending machine with a glowing front | yes | 2 |
| 3 | A second door at the back into the surgery, 384 x 320 and taller | yes | 2 |
| 4 | An operating chair in the middle under a bright white lamp; two cyan monitors on a cart beside it | yes | 2 |
| 5 | A shelf of glowing green jars along the surgery's back wall; a health kit on a small table by the chair | yes | 2 |
| 6 | The waiting room lit green-white; the surgery the brightest room, light pooled on the chair; the street faint | no | 2 |
| 7 | Clean white tile in the surgery, dirtier white in the waiting room | no | 2 |
| 8 | Sealed, compiled, every entity reached on foot, nothing in solid; a module the city can include | yes | 2 |

**Score: 16 of 16 (100%). Passes.**

## How the prompt became the spec

- A module: the waiting room first, the surgery `north_of` it (taller, its floor and ceiling lined with a
  cleaner tile), the night street `test` in front; a `door` from the street and a `door` at 0.75 along the
  waiting room's north wall into the surgery.
- Brush prefabs: the bench (seat, legs, back) against the north wall, the reception desk with the doctor
  (a `monster_scientist`) behind it, the vending machine with a `neon` front, the operating chair (base,
  seat, a `wedge` for its raised back, a foot rest), the cart with two `neon` monitors, the shelf of jars
  (green `neon` boxes on three boards), and the small table with the health kit on it.
- Light: the waiting room two green-white lamps of 160; the surgery one white lamp and a `light_spot`
  straight down over the chair (the kit's `light` class for an entity names a point light; a spot is
  given as an entity of its own class, with `_cone`, `_cone2` and `_light`).

## Iterations

1. The surgery's health kit was "only by a jump": the walk test's sentence named the gap, 28 wide between
   the reception desk and the wall, in front of the surgery's door. The desk was moved south.
2. Clean, floors lit 119 (waiting room), 218 (the surgery, the brightest), 46 (the street). The views
   showed the vending machine's glowing front against the wall: turned 270 its front faces west, and it
   needed 90 to face the room. Turned.
3. Clean. The views (picture-2) show the waiting room's dirty tiles, the bench, the desk with the doctor,
   the vending machine glowing orange, and the white surgery with the chair in its pool of light, the cyan
   monitors on their cart and the shelf of glowing green jars along the back wall.
