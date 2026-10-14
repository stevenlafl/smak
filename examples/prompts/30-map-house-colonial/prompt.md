# 30 A brick two-storey house (map module; a building of two storeys, stairs inside)

## The prompt (196 words)

> The second house must look nothing like the first: a two-storey red brick house with a steep dark roof,
> on a lawn with a driveway gap to the street. The front door opens into a hall with a dark tiled floor and
> the stairs up. To the left of the hall a living room with two front windows and one on the side: a sofa
> facing a TV, a coffee table, an armchair, a plant. To the right a kitchen with the fridge, stove and sink
> along the back wall, a small table, a back door to the garden and windows front and side. Upstairs a
> landing over the hall with a plant, a big main bedroom over the living room (bed, dresser, a reading
> chair, three windows), a smaller bedroom with its bed and dresser, and a white-tiled bathroom with a
> toilet and a tub and a small window. Three trees, two bushes by the door and a bench at the back. Lit
> inside, every room on both floors walkable from the street, ready to go into the neighbourhood. Show it
> from the street, the stairs, and the upstairs rooms.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | Two storeys of red brick under a steep dark roof, on a lawn with a driveway gap; unlike case 29 | yes | 2 |
| 2 | A hall with a dark tiled floor and stairs up to a landing; the front door into the hall | yes | 2 |
| 3 | Living room and kitchen downstairs as asked, with their windows and the back door | yes | 2 |
| 4 | Upstairs: the main bedroom with three windows and a chair, a second bedroom, a white bathroom | yes | 2 |
| 5 | Three trees, two bushes by the door, a bench | no | 2 |
| 6 | Compiles, lit, every room on both floors reached on foot from the street, nothing in a wall | yes | 2 |

**Score: 12 of 12 (100%), judged from the pictures. Passes.**

## How the prompt became the spec

- A building of two storeys: the hall stands in the lot, the living room and the kitchen against it; the
  landing is `above` the hall and the bedrooms and the bath against the landing, so they are of the building
  too, and the shell and the roof go over both storeys. The stairs are a link between the hall and the
  landing (`stairs`), the front door in the hall's front wall.
- Red brick outside (`red_brick`, the theme's `outside`), a 35 degree roof of dark shingles.

## Iterations

1. Nothing upstairs was reached: the stairs were built against the hall's south wall, where the front door
   is, so a player came in onto the side of a step. The kit's stairs climbed against a room's south wall and
   no other; they now take `along` (1: the north wall). Put against the north wall: every room reached.
