# 02 A street lamp (model, a stack of parts and an arm)

## The prompt (96 words)

> I need a cast-iron street lamp for a village street, about 110 units tall overall. It has a heavy round
> base that steps in as it goes up, then a tall slim post that tapers a little towards the top, with a
> small ball on the very top. Near the top a curved arm reaches out to one side, and a lantern hangs from
> the end of the arm on a short chain. The lantern is a small square iron frame with yellow glass on all
> four sides and a little pointed roof. The glass should glow even at night.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | Upright on the floor, about 110 tall | yes | 2 |
| 2 | Round base that steps in as it rises | yes | 2 |
| 3 | Tall slim post, tapering towards the top, a ball on top | yes | 2 |
| 4 | A curved arm out to one side near the top | yes | 2 |
| 5 | A lantern hanging from the arm's end on a short chain | yes | 2 |
| 6 | The lantern: square iron frame, yellow glass on four sides, glowing (fullbright) | yes | 2 |
| 7 | A small pointed roof on the lantern | no | 2 |
| 8 | Every part joined to the next: nothing floating, no holes | yes | 2 |

**Score: 16 of 16 (100%). Passes.**

## How the prompt became the spec

- A stack, each part standing on the one before (`attach` with its defaults: bottom on top): a `turn` base
  whose rings step in with creases, a `cylinder` post with `top` smaller than its `radius` (the taper), a
  `sphere` on top.
- The arm is a `tube` whose path rises and levels off (the curve), attached by its `start` to a point of
  the post's surface at 0.9 of its height, facing +x, sunk 0.6 into it.
- The lantern hangs from the arm's `end`: a thin `cylinder` chain, a four-sided `cylinder` turned 45
  degrees (a square pyramid: the roof), plates, a glass `box` in a `fullbright` material of its own, and
  one corner post repeated four times round the glass.
- `size: { height: 110 }`; it came to 109.1.

## Iterations

1. Built: `FAULT 1 pieces float apart from the rest: glass 0.3 units away`. The glass was sunk 0.3 into
   the plates, which is touching; the check measured surface to surface and missed that a corner inside a
   solid part touches it. Fixed in the check (`src/sound.mjs`: a point of one piece inside a closed part
   of another counts as touching), not in the spec.
2. Built clean. The sheet (picture-1) shows the stepped base, the tapered post with its ball, the arm to
   +x and the lantern on its chain; the close look (picture-2, `focus.json`) shows the square frame, the
   glowing glass on four sides and the pointed roof.
