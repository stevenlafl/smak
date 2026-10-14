# 13 / 03 "Swap the stove and the shelf" (a change request)

## The prompt (31 words)

> One more thing: swap the stove and the supply shelf. Put the stove along the west wall where the shelf
> was, and the shelf against the back wall where the stove was.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | The stove along the west wall (turned along it), the shelf against the back wall | yes | 2 |
| 2 | Only those two moved (the change report) | yes | 2 |
| 3 | Still clean, and nothing standing in a wall | yes | 2 |

**Score: 6 of 6 (100%). Passes.**

## How the request became the change

- The stove to the shelf's place, turned 90 to lie along the west wall; the shelf to the stove's, unturned.
- Iterations:
  1. The first try put the stove at the shelf's old point unturned: it was 96 long and stood 12 into the
     west wall, and every check passed. The kit had no check for furniture in a wall; it now has one
     (`reaches N into <room>'s <side> wall`), and it found more: the shelf of case 13 itself stood 28 into
     the north wall (fixed there, in its revisions and so in the city), and it called the tavern's beds
     (case 10) 58 into a wall, which was the check's own slip: a `.map` prefab's footprint was measured from
     the points its planes are written by, which lie anywhere on a plane. It is measured from the brushes'
     corners now.
  2. The stove turned 90 at the west wall: clean. Report: `things moved or turned: furniture stove #1 from
     -96 108 0 to -188 72 0, turned 0 to 90; furniture shelf #1 from -188 80 0 to -96 116 0, turned 90 to 0`;
     `20 rooms and things are where they were`. The plan (result-03-swap-stove-shelf/picture-1) shows the
     stove's three pots along the west wall and the shelf by the north wall.
