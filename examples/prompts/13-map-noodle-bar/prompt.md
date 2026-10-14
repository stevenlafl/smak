# 13 A noodle bar (map module; a prefab of the city, case 17)

## The prompt (226 words)

> For my cyberpunk city, a tiny noodle bar that opens onto the street. Build it as a piece I can drop into
> the city later, with a short stretch of night street in front of it to try it on its own (I start out on
> that street, facing the bar).
>
> The bar is one room about 448 wide and 256 deep, 160 high, with its whole street side open (a wide
> opening about 192 across, like a rolled-up shutter). Dark tiled floor, grimy plaster walls, a black
> ceiling. A long counter runs along the room, set back from the street, with five stools in front of it
> on the customers' side and a glowing pink neon strip along its front. Behind the counter: a stove with
> three big pots on it, a tall steel fridge and a shelf of supplies. The cook stands behind the counter
> and there's a bowl of noodles (a health kit) on it. On the back wall hangs a neon sign of a bowl with
> chopsticks, pink and cyan, and three red paper lanterns hang from the ceiling over the counter. Through
> a door at the back is a small storeroom with crates. Lighting is dim and warm, with pink from the sign;
> the street outside is night, lit only faintly. Keep it walkable, sealed, nothing stuck in anything.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | One room 448 x 256 x 160, its street side open across about 192; the night street in front, the start there facing the bar | yes | 2 |
| 2 | Dark tiled floor, grimy plaster walls, black ceiling | no | 2 |
| 3 | A long counter set back from the street, five stools on the customers' side, a pink neon strip along its front | yes | 2 |
| 4 | Behind the counter a stove with three pots, a tall steel fridge, a shelf; the cook behind it, a health kit on it | yes | 2 |
| 5 | A neon bowl-and-chopsticks sign (pink and cyan) on the back wall; three red lanterns hanging over the counter | yes | 2 |
| 6 | A door at the back to a small storeroom with crates | no | 2 |
| 7 | Dim warm light with pink from the sign; the street faintly lit | no | 2 |
| 8 | Sealed, compiled, every entity reached on foot, nothing in solid; a module the city can include | yes | 2 |

**Score: 16 of 16 (100%). Passes.**

## How the prompt became the spec

- A module: its first room is the bar (`shop`), so that a city that includes it places the bar; the night
  street in front is a room marked `test: true`, there only to try the module alone (with the start), and
  left out when it is included (case 17). The storeroom is `north_of` the shop through a `door`.
- The street side is an `opening` 192 by 112 (the rolled-up shutter). The theme is dark tile, grimy plaster
  and a black metal ceiling; `night: true` gives the street a dark sky and a moon.
- Brush prefabs given in the spec: the counter (with a `neon` strip on its front: a texture light), the
  stool (put five times), the stove with its three pots, the fridge, the shelf, the stack of crates.
- Two models given in the spec (`models`, built and checked with the map): the neon sign (a board with
  `neon` tubes for the bowl, its rim, the chopsticks and the steam), on the back wall at z 64, and the red
  paper lantern (`fullbright` cloth), put three times hanging under the ceiling over the counter.
- Light: two dim warm lamps, a pink `light` before the sign, the counter's neon strip.

## Iterations

1. Two faults from the walk test, both right: the health kit in the counter's middle was reached only by
   a jump, and the cook's aisle between the counter and the stove was 40 wide (48 is safe). The counter and
   the stools were moved 24 towards the street, the kit to the counter's front edge.
2. The kit still only by a jump: the walk test takes a thing on a counter 42 high to stand on it. The
   counter was made 34 high, a bar's height, and the kit is reached from beside it (the table of case 06,
   32 high, was the same). The check was not loosened to pass it.
3. Clean, but the street's floor had more light (92) than the bar's (56), where the prompt asks for a
   faint street: the spec's own street lamp was taken out, and still the street had 60. Measured with the
   moon off (11) and on: the moon's direct light alone did it. The kit's night now gives the sky's own
   light (`_diffuse_light`) far under the moon's, and this street's moon is 16: the street 44, the bar 54.
   The props' view also turned to look at its props' height (the lanterns were above the view).
4. Clean. The props' view (picture-3) shows the three red lanterns hanging from the black ceiling and the
   pink and cyan bowl-and-chopsticks sign; the views (picture-2) the counter's pink strip, the stools, the
   stove, the fridge and the shelf; the plan (picture-1) the whole module with the street in front.
5. Built again after the kit learned to call out furniture that stands in a wall (found by revision 03):
   the shelf, turned along the west wall at y 116, stood 28 into the north wall. Moved to y 80. Clean.

## Revisions

The person's follow-up requests on this map are in `revisions/`: a second fridge beside the first, the
counter's strip blue, the stove and the shelf swapped. Each is scored on doing the change and leaving
everything else as it was, by the build's change report.
