# 03 A tavern table, set (model, repeated parts and things on things)

## The prompt (115 words)

> A round tavern table for my inn, as one prop. The top is a thick round slab of dark wood, about 48 units
> across, standing about 30 units off the floor. It sits on a single thick central pedestal, turned like a
> chair leg, and the pedestal has four curved feet that spread out in a cross so it doesn't tip. On the
> table there's a pewter tankard with a handle on its side, and a short candle in a little brass holder
> with its flame lit (the flame should glow). Put the tankard and the candle apart from each other, not
> in the middle. Everything should be properly joined, nothing hovering above the table.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | Stands on the floor; the table top about 30 off the floor and about 48 across | yes | 2 |
| 2 | A thick round top of dark wood | yes | 2 |
| 3 | One turned central pedestal | yes | 2 |
| 4 | Four curved feet spreading in a cross | yes | 2 |
| 5 | A pewter tankard with a handle on its side, standing on the top | yes | 2 |
| 6 | A short candle in a brass holder with a glowing flame, on the top, apart from the tankard | yes | 2 |
| 7 | Nothing floating, no holes (the report) | yes | 2 |
| 8 | Reads as dark wood, grey pewter, yellow brass | no | 2 |

**Score: 16 of 16 (100%). Passes.**

## How the prompt became the spec

- The pedestal is a `turn` of nine rings that swell and narrow (turned like a chair leg), standing at the
  origin. The top is a short `turn` with a rounded edge (rings 23 to 24 to 23.4), 48 across, attached on the
  pedestal and sunk 0.5 into it: its upper face at z 30.5.
- One foot is a `tube` that falls and thins as it goes out; `repeat` makes four of it round the centre,
  starting at 45 degrees: a cross.
- The tankard and the candle's holder are attached on the top's `top` anchor with an `offset` each, 10 and
  9 units out on opposite sides. The handle is a `tube` whose `start` is a point of the tankard's surface
  (`{ s: 0.82, angle: 0 }`) and whose path comes back into it. The flame is a `turn` coming to a point, in
  the `flame` material (fullbright).
- `size: { height: 37, length: 48 }`: the table with the candle on it.

## Iterations

1. `FAULT 2 edges are shared by three triangles or more`, and the feet stood in an X with one foot
   unturned. Two findings in the kit: `repeat` with a `start` turned the copies and not the part itself
   (fixed: the part is turned to `start` first), and the fault did not say which part (fixed: it names
   them). The crowded edges were the four feet's ends, all starting at the one point in the pedestal's
   middle.
2. The feet start 1.2 off the middle, inside the pedestal still: clean. The table top's grain ran out from
   the middle like spokes, since a closed end was painted as part of the strip; fixed in the kit (a
   turned part's closed ends get a disc of the picture of their own), and the grain now runs across.
3. Clean. The sheet (picture-1) shows the cross of feet, the turned pedestal and the round top; the close
   look (picture-2) the pewter tankard with its handle and the candle burning in its brass dish, on
   opposite sides of the top.

## Revisions

The person's follow-up requests on this model are in `revisions/`: a second tankard beside the first, then
the candle twice as tall; each scored on doing the change and leaving the rest as it was (the change report).
