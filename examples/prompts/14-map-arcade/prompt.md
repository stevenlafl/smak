# 14 A neon arcade (map module; a prefab of the city, case 17)

## The prompt (232 words)

> Another piece for the cyberpunk city: an all-night arcade. Build it to drop into the city, with a
> short stretch of night street in front to try it alone (I start on the street, facing the way in).
>
> The arcade is a hall about 512 wide, 384 deep and 176 high, entered from the street through a doorway
> about 128 wide. Black ceiling, dark floor with glowing purple strips running along the foot of the walls.
> In the middle stand eight arcade cabinets in two rows of four, back to back: each cabinet a tall dark box
> with a glowing screen on its front and a glowing pink marquee across its top, one row facing the street
> and the other facing the back. Against the west wall is a prize counter with a change machine beside
> it; a security guard stands behind the counter and there's a battery on it. In the north-east corner a
> door leads to a small server closet with three tall racks covered in green status lights. The only light
> in the hall should come from the screens, the marquees and the floor strips, so it feels dark and
> electric; the closet glows green. Everything walkable and reachable, sealed, nothing stuck in anything.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | A hall 512 x 384 x 176 entered from the street by a doorway about 128 wide; the street in front with the start facing it | yes | 2 |
| 2 | Eight cabinets in two back-to-back rows of four in the middle, one row facing the street, one the back | yes | 2 |
| 3 | Each cabinet dark with a glowing screen on its front and a glowing pink marquee on top | yes | 2 |
| 4 | Glowing purple strips along the foot of the walls; black ceiling, dark floor | no | 2 |
| 5 | A prize counter against the west wall with a change machine beside it, a guard behind it, a battery on it | yes | 2 |
| 6 | A door in the north-east corner to a server closet with three racks of green lights | yes | 2 |
| 7 | The hall lit only by its glowing things (no lamps), dark but not black; the closet green | yes | 2 |
| 8 | Sealed, compiled, every entity reached on foot, nothing in solid; a module the city can include | yes | 2 |

**Score: 16 of 16 (100%). Passes.**

## How the prompt became the spec

- A module as case 13 is: the hall first, the server closet `north_of` it aligned `east` (its door at
  0.85 along the hall's north wall: the north-east corner), the street in front marked `test`.
- No lamps (`light: "none"` on every room): the light is the texture lights of four `neon` materials, each
  with its own `glow`: the cabinets' screens and marquees, the purple floor strips, the racks' green status
  lights.
- Brush prefabs: the cabinet (a dark body, a screen and a marquee on its front, a control ledge), put eight
  times in two back-to-back rows (the far row turned 180); the floor strips along three walls; the prize
  counter and the change machine; the rack with five rows of green lights, put three times.

## Iterations

1. Two faults, both the spec's: the battery on the 38-high prize counter was reached only by a jump, and
   the guard stood 4 into the purple strip at the foot of the west wall. The counter was made 34 high.
2. The guard now stood in the counter: 32 between the counter and the wall strip, a player's width
   exactly. The counter moved 16 east (48 behind it).
3. Clean, the floors lit 40 (hall), 42 (closet), 40 (street): dark, not black. But the views were too dark
   to judge what is in the rooms, and the closet showed nothing: the racks had been turned 180 degrees, their
   lights to the wall. The racks were put the right way, and a map whose darkest room is under 80 now gets
   its views drawn again three times as bright (picture-3), as `map-view --brightness` does.
4. Clean. Picture-2 shows the hall as it is lit, dark, with the screens and marquees and the purple floor
   strips; picture-3, three times as bright, the row of cabinets with their screens and marquees, and the
   closet's three racks covered in green lights.
