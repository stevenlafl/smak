# 29 A ranch house on its lot (map module; a building that stands in the open, furnished)

## The prompt (198 words)

> First house for the neighbourhood: a one-storey ranch house in pale blue siding with a grey shingle
> gable roof, standing on a lawn with a gap to the street for a driveway. Inside: a living room with the
> front door and a big front window, a sofa facing a TV, a coffee table, an armchair and a plant; a kitchen
> beside it through a wide opening, with a tiled floor, the fridge, stove and sink along the back wall, a
> small table and a back door out to the side yard; and across the back a main bedroom, a bathroom tiled in
> pale blue with a toilet and a tub, and a kid's room, each bedroom with its bed and dresser. Windows on
> every outside wall of the living room, kitchen and bedrooms, with glass. In the yard: two trees, two
> bushes by the front door, a bench and a swing set out the back. It has to be lit inside, every room has
> to be walkable from the street, and it has to fit into the neighbourhood later. Show me it from the
> street and inside.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | A house that stands on its lot: blue siding outside, a grey gable roof, a driveway gap to the street | yes | 2 |
| 2 | Living room with the front door, a front window, sofa, TV, coffee table, armchair, plant | yes | 2 |
| 3 | Kitchen through a wide opening: tiled floor, fridge, stove and sink on the back wall, a table, a back door | yes | 2 |
| 4 | A main bedroom, a kid's room (each a bed and a dresser), a blue-tiled bathroom with a toilet and a tub | yes | 2 |
| 5 | Glass windows on the outside walls; two trees, two bushes, a bench, a swing set in the yard | no | 2 |
| 6 | Compiles, lit inside, every room reached on foot from the street, nothing in a wall | yes | 2 |

**Score: 12 of 12 (100%), judged from the pictures. Passes.** Plainest: the roof's gable ends wear shingles
where a house has siding.

## How the prompt became the spec

- The lot is an open room (`sky`, a lawn) with a gap to a stretch of street (`test`: left out when the
  neighbourhood takes the house in). The house is a **building**, a thing the kit learnt for this case: its
  first room, the living room, stands `in` the lot (`stand: true`), and the kitchen, the bedrooms and the bath
  are placed against it by compass words, in two rows that fill its outline. Its shell is carved round them
  in `siding_blue` (the theme's `outside`, naming a texture of the spec's), and it has a gable of shingles.
- The ways out (the front door, the back door, the windows) are links to the lot with the `side` of the house
  they go through; the rooms within are joined as any rooms are.
- The furniture is case 28's models, by file: each room's things placed against its walls and facing in.

## Iterations

1. The kit learnt buildings that stand in the open (a shell, a roof, ways out by side), and on the way: the
   light report gave a floor to the first room whose box held it, so every room of a house in its yard read
   0; rooms `in` another were kept from the dark check, as a channel under water is; a module's own theme
   words (`outside`, `roof`) and a building's linings were not carried into a map that takes it in; and a
   theme's word could not name one of the spec's own textures. Each fixed with a test.
2. The bushes by the front door stood inside the living room: placed in the lot, they were checked against
   the lot's walls and not the house in it. The kit now faults a thing that stands in a building of its room
   (a test); moved out in front. The beds had their headboards in the middle of the room: turned to face north.
3. The map's views showed the house's outside only by chance: the kit now draws each building from the
   corner of its open room on its front's side, where its front door is.

## Blind run

`blind.mjs`: the prompt alone, to a fresh agent with nothing but the MCP server. It read the guide six times, asked
`entities` once, built three times, in 294 seconds and 17 turns. Its spec, built again, passes every check:
a pale blue clapboard house with a grey gable roof standing on its lawn (a building, from the guide), a
driveway through a hedge, the five rooms and a hall it added, every one furnished: having none of case 28's
models, it made the furniture as brush prefabs of its own (26 pieces: a TV, a sofa, beds, a tub, a fridge
...), trees and bushes as blocks. Its lot's walls wear grass, which reads oddly from inside the yard; no item
of the rubric says otherwise. Against this rubric: **12 of 12**.

