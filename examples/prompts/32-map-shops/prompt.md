# 32 A row of shops (map module; five shops in one building, each furnished for what it sells)

## The prompt (205 words)

> The neighbourhood's shops: one long single-storey building of tan stucco with a flat roof, set back from
> the street behind a parking lot, five shops side by side, each with its own glass front door, two shop
> windows and a lit sign over the door in its own colour. A grocery store, the biggest, with eight rows of
> shelves of boxes and cans and two checkouts by the door, and a side door. A corner store with two shelves,
> two drink fridges and a counter. A gun store with three glass cases of pistols and a counter. A clothing
> shop with four racks of shirts, a plant and a counter. An electronics shop with three shelves of boxes, two
> TVs on stands and a counter. Tiled floors, all lit. Three cars parked in the lot, a bush at each end. It
> goes on the south side of the main street, so the shops face north. Every shop must be walkable from the
> street. Show me the row from the lot and inside each shop.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | One flat-roofed stucco building of five shops facing north across a parking lot | yes | 2 |
| 2 | Each shop a glass front door, two windows and a lit sign of its own colour | yes | 2 |
| 3 | The grocery's eight shelves and two checkouts; the corner store's shelves, fridges and counter | yes | 2 |
| 4 | The gun store's cases, the clothing racks, the electronics shelves and TVs, each with a counter | yes | 2 |
| 5 | Three parked cars and two bushes | no | 2 |
| 6 | Compiles, lit, every shop reached on foot from the street, nothing in a wall | yes | 2 |

**Score: 12 of 12 (100%), judged from the pictures. Passes.**

## How the prompt became the spec

- One building of five rooms in a row: the grocery stands in the parking lot (`stand: true`, a flat roof:
  `roof: false`, stucco outside) and each shop after it is placed `east_of` the one before. Each has a door
  and two windows to the lot on its north side; the grocery a side door too.
- The signs are brush furniture in the lot, just in front of the wall over each door, of `neon` in the
  shop's colour: texture lights, lit in the compile.
- The shops face north and the test street lies north, so that the neighbourhood puts the row on the south
  side of its main street.

## Iterations

1. Clean on the first build that ran. (The run before failed in the generating script, not the kit: a name
   of its own clashed with another.)
