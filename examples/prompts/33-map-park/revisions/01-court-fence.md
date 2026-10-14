# 33 / 01 "A chain-link fence round the tennis court" (a change request)

## The prompt (36 words)

> Put a tall chain-link fence round the tennis court, the kind you can see through, with a gap for a gate
> where the dirt path meets it on the west side. Nothing else changes.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | A fence round all four sides of the tennis court, taller than a player | yes | 2 |
| 2 | It is seen through: the court and the net show through the wire | yes | 2 |
| 3 | A gate gap on the west side where the path runs in, and the court still reached on foot | yes | 2 |
| 4 | Nothing moved, added or taken away but the fence (the change report) | yes | 2 |
| 5 | Still compiles, lit, every bench reached | no | 2 |

**Score: 10 of 10 (100%). Passes.** The benches are props, which the walk test does not count as places to
go, so item 5 is read off its walked plan (`smak map-reach -o`): every bench stands on walked floor, inside
the fence too. The only floor it marks unwalked is the fence's own top edge.

## How the request became the change

- A texture of the spec's own, `chain_link`: the `mesh` base in a dark galvanised grey, `cell` 6 and
  `weave: "diamond"`, which the kit learnt for this request (the cords run along the diagonals).
- Five furniture boxes 2 thick and 120 high, 4 units outside the court's slab: north, south and east whole,
  the west side in two with an 80 wide gap where the dirt path runs onto the court.
- In a map, a `mesh` texture is named with `{` (`{SM_CHAIN_LINK`), its picture has real holes, and the
  furniture wearing it is a `func_wall` in render mode 4, which is how GoldSrc draws a fence's holes. The kit
  does that by itself; the spec says nothing of entities.
- Report: five furniture boxes added, `41 rooms and things are where they were`. The walk test finds the
  gate as an opening 80 wide and walks onto the court through it.

## Iterations

1. The first fence was square cords in a pale grey, a grille rather than chain-link: the diamond weave was
   added, and the tone darkened.
