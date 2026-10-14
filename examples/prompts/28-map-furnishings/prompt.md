# 28 A furnishings set, shown in a showroom (models made to be placed many times; a map to see them in)

## The prompt (214 words)

> Before we build the neighbourhood, make me the set of things it gets furnished with, each a model I can
> place as many times as I like, at a real size next to a player. For the houses: a white fridge with two
> doors and handles, a stove with four burners, knobs and an oven window, a sink cabinet with a steel basin
> and a tap, a blue sofa with cushions and a pillow, an armchair, a TV on a stand with a game console, a
> coffee table with a book and a mug, a bed with pillows and a blanket and a headboard, a dresser with six
> drawers and a lamp on it, a toilet, a bathtub with water in it, and a potted plant. For outside: a leafy
> tree in summer, autumn, spring blossom and winter (bare, with snow), a bush, a park bench, a swing set, a
> basketball hoop with its backboard, rim and net, and a tennis net with its posts. For the shops: a
> grocery shelf of boxes and cans, an electronics shelf, a checkout counter with a register, a clothing
> rack of shirts and a glass gun case. Put them all in a showroom: a lit hall for the indoor things and a
> yard under the sky for the outdoor ones, so I can walk round and look at each.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | All 26 models built, each closed and sound: nothing open, inside out, floating or seen through | yes | 2 |
| 2 | Each at a real size beside a player (a fridge 68, a bed 80 long, a hoop's rim at 10 feet) | yes | 2 |
| 3 | The kitchen, living room, bedroom and bath things read as what they are, with their details | yes | 2 |
| 4 | The four trees read as their seasons; the bush, bench, swings, hoop and tennis net read | yes | 2 |
| 5 | The shop fittings read: goods on the shelves, a register, shirts on a rack, guns under glass | yes | 2 |
| 6 | The showroom compiles, is lit, and every prop is reached on foot and stands clear of the walls | yes | 2 |

**Score: 12 of 12 (100%), judged from the gallery of the 26 models, close views of the nets, the bathtub and
the winter tree, and the showroom's views. Passes.** Plainest: the gun case's guns are dark shapes under the
glass, and the shelves' goods are boxes in colours, labels to come with painted detail.

## How the prompt became the spec

- Each thing is a model spec of its own (`fridge.json`, `tree_winter.json`, ...), made of boxes, turns, tubes
  and leaves at real sizes (a fridge 68 high, a bed 80 long, a hoop's rim at 105, 10 feet less its
  thickness). The map names them in `models` and places each as a prop; it can place any of them again.
- The showroom is two rooms: a lit hall (tile floor) for the indoor things, opening onto a yard under the
  sky (grass) for the outdoor ones.
- The nets are `mesh`, a material the kit learnt for this case: a masked picture, cords in its tone with
  holes between, seen through as in the game.
- The script that writes these specs is not part of the case (the specs are); it is kept with the person's
  scripts.

## Iterations

1. Six models failed their checks, each a joint the floating check named: the hoop's rim a closed tube
   whose start met its end (crowded edges) and its net strands 0.5 inside the rim, the bench's tilted back
   slats missing their tilted posts, the rack's shirts 0.8 under the rail, two legs of the swing set ending
   at one point, the tennis net 0.4 short of its posts, a lump of snow in the air. Each moved into what it
   hangs from.
2. The map's views showed 26 models too small to judge. The kit now draws, for a map that builds models, a
   gallery of them one by one, named (a test in `test/46-specs.mjs`). In it: the bathtub a solid block
   (its water inside the box), the winter tree's snow a ball on its trunk. A tub of walls round the water;
   snow lying on the branches.
3. The nets were solid sheets. `mesh` added: a masked texture whose holes are holes. Three faults of the
   kit came out with it: the see-through check took a net's far side, seen through its holes, for a hole
   (masked faces are now drawn as the game draws them in that check); a sheet of points (`rows`) was given
   an 8 by 8 picture whatever its size, and then one laid across the wrong way; and a picture of its own
   (a net's, a flame's) was always 256 square, so a long net had a strip of it. Fixed, with a test of a
   net and a basket of mesh.
4. A sedan added for the neighbourhood's streets and garages (a change after the case passed, so it has
   no line of the rubric). Built first of oval turns, it came out a red pillow with a cushion for a cabin;
   built again of boxes (a chassis, a hood, a cabin with slanted glass, wheels standing out under it), it
   reads as a car.

