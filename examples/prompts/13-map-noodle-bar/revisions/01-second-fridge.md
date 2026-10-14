# 13 / 01 "Now add a second fridge next to the first" (a change request)

## The prompt (19 words)

> Looks good! Now add a second fridge right next to the first one, on its west side. Change nothing else.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | One fridge added, against the first one's west side, the same kind | yes | 2 |
| 2 | Nothing else moved, added or taken away (the change report) | yes | 2 |
| 3 | Still clean: sealed, compiled, everything reached, nothing in a wall | yes | 2 |

**Score: 6 of 6 (100%). Passes.**

## How the request became the change

- The first fridge was given an `id` (`fridge`), and one more fridge put `at: { beside: "fridge", side:
  "west", gap: 4 }`: the kit puts it against the first one's footprint, lined up with its middle.
- Report: `things added: furniture fridge #2 in shop at 140 108 0`; `21 rooms and things are where they
  were`. Giving the first fridge an id did not count as a change (a thing's key in the report is its kind
  and its count, not its id).
