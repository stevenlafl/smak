# 01 A barrel (model, simple)

## The prompt (62 words)

> Make me a wooden barrel for a tavern map. About 40 units tall, the usual bulging shape so it's wider in
> the middle than at the ends. Two dark iron hoops, one near the top and one near the bottom. Flat wooden
> lids at both ends. It should stand upright on the floor like a normal barrel.

## The rubric

Each item is scored 0 (missing or wrong), 1 (there, but off) or 2 (as asked), judged from the pictures and
the report. It passes when every must-have item scores 2 and the total is at least 85%.

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | Upright, standing on the floor (lowest point z 0, axis vertical) | yes | 2 |
| 2 | About 40 tall | yes | 2 |
| 3 | Wider in the middle than at the ends | yes | 2 |
| 4 | Two iron hoops, one near the top and one near the bottom | yes | 2 |
| 5 | Closed flat lids at both ends, no holes | yes | 2 |
| 6 | Reads as wood with darker iron | no | 2 |

**Score: 12 of 12 (100%). Passes.**

## How the prompt became the spec

- One turned part along z, seven rings from radius 10.5 at the ends to 13.2 in the middle: the bulge.
- `caps: [true, true]`: flat lids.
- Two `band`s on the body at 0.14 and 0.86 of its height: near the bottom and the top.
- `size: { height: 40 }`, so a wrong height is a fault.

## Iterations

1. Built clean the first time. The report: no open edges (the hoops' 64 sunk edges are buried in the
   body), nothing floating, 0% seen through, 40 high, lowest part `body` from 0 to 40, hoops at 4.5 to
   6.7 and 33.3 to 35.5. The sheet (result/picture-1.png) shows the bulge, the two hoops and the lid's
   grain from above.

2. Built again after the kit painted a turned part's closed ends as discs of their own (found on case
   03): the lids' grain now runs across them. Still clean.

The rubric for this first case was written alongside its first build; for every later case it was written
before the spec.
