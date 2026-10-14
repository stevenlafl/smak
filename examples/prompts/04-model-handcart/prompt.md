# 04 A handcart (model, wheels with spokes, mirrored sides, a load)

## The prompt (154 words)

> A wooden handcart for a market scene, the kind a farmer pushes, about 80 units long including the
> handles. It has a flat rectangular bed of planks with low side boards along the left and right and a
> board across the back; the front of the bed is open. Two big wooden wheels, one each side, on an iron
> axle under the bed, a bit behind the middle so the cart balances. Each wheel has an iron rim, a round
> hub, and eight spokes. Two long handles stick out forward from the front corners of the bed, and a
> short wooden leg under the front holds the cart level when it's parked, so the bed is flat and the
> whole thing stands on the ground on its wheels and the leg. In the bed there's a fat cloth sack lying
> down and a small wooden crate. The wheels must not float off the axle, and the load must sit in the
> bed, not hover.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | Stands on the ground on its two wheels and the front leg; the bed level | yes | 2 |
| 2 | About 80 long including the handles | yes | 2 |
| 3 | A rectangular bed with side boards left and right and a back board, front open | yes | 2 |
| 4 | Two wheels, one each side, on an axle under the bed behind the middle | yes | 2 |
| 5 | Each wheel: iron rim, hub, eight spokes | yes | 2 |
| 6 | Two long handles forward from the front corners | yes | 2 |
| 7 | A cloth sack lying down and a small crate in the bed | no | 2 |
| 8 | Nothing floating, no holes | yes | 2 |

**Score: 16 of 16 (100%). Passes.**

## How the prompt became the spec

- Laid out by numbers in the cart's own space (`at`), since every part's place follows from two choices:
  wheels of radius 12 (so the axle's middle is at z 12 and a wheel stands on z 0) and a bed 50 by 30
  just over the axle (z 12.6 to 14.6). The leg in front is 12.9 tall: the bed is level.
- One wheel is made and `mirror: "y"` gives the other: a `turn` along `y` for the hub, a `tube` round a
  circle of 24 points for the iron rim (its two ends meet face to face), and one spoke, a thin
  `cylinder` from just off the hub's middle out into the rim, `repeat`ed 8 times about the `y` axis
  (the kit learned `repeat.axis` for this case).
- The axle is a `turn` along `y` through both hubs. The side boards are one `box` mirrored; the back
  board closes the -x end and the +x end is left open. The handles are `tube`s from inside the front
  corners out to x 56, mirrored: 81 long in all, where 80 was asked.
- The sack is a `turn` along `x` lying in the bed, the crate a `box` beside it; both sink 0.2 into the bed.

## Iterations

1. Clean on the first build. The report lists the parts from the ground up (rim and leg from 0, axle at
   11.2 to 12.8, bed 12.6 to 14.6, the load and the boards above it). The sheet (picture-1) shows it on
   its wheels and leg with the bed level, the handles forward and the open front; the close look
   (picture-2) shows the iron rims, the hubs and the eight spokes, and the sack and the crate in the bed.
