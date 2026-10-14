# 37 A broom in place of the crowbar, with a sweep of its own (weapon; a custom animation)

## The prompt (104 words)

> Turn the crowbar into a broom: a long wooden handle with a red plastic cap on the end, a dark wooden
> block at the head and a thick fan of straw bristles. Hold it by the handle. It mustn't chop like the
> crowbar: when you attack, swing it low and sideways, a hard sweep from right to left and back, in the
> same time the crowbar's swing takes so the game's hits still land. Keep the hands and the other
> animations. I want the first-person, other-player and floor models. Show me the sweep.

Built on Half-Life's own `v_crowbar.mdl`, `p_crowbar.mdl` and `w_crowbar.mdl`: the results stay out of the
repository.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | Three files with the game's names, the hands and the other animations kept | yes | 2 |
| 2 | A broom: a long wooden handle with a red cap, a dark head block, a thick fan of straw | yes | 2 |
| 3 | Held by its handle; nothing open, inside out or apart | yes | 2 |
| 4 | The attacks are a low sideways sweep, right to left and back, not the crowbar's chop | yes | 2 |
| 5 | Each sweep lasts what the crowbar's swing it replaces lasted | yes | 2 |
| 6 | Shown sweeping | no | 2 |

**Score: 12 of 12 (100%), judged from the pictures built locally. Passes.** Plainest: through the sweep the
broom stays leaning up from the hand, more a swipe across than a sweep along the floor.

## How the prompt became the spec

- `weapon: { like: "crowbar", size: "own" }`: a broom 38 long, handle low, fitted over the crowbar.
- `weapon.animations`, a thing the kit learnt for this case: the six attacks (`attack1` to `attack3hit`)
  made anew from the crowbar's `idle1` frame, each with the same frames and rate as the one it replaces, by
  four keys: rest, low on one side, low on the other, rest. The first and third pairs sweep right to left,
  the second left to right.
- The keys' turns were found by measuring, not by eye: a script turned the right arm and the hand about
  the model's axes and projected the broom's head onto the first-person screen, and took the turns that
  put it low right (40 about y, -20 about z) and low left (50 and 25). Guessed turns had swung it out of
  view, or the wrong way.

## Iterations

1. Guessed turns about z alone swung the broom from side to side held up out of view; with a tilt about y
   added, it went below the screen. The kit has no way yet to say where the weapon is to be on the screen;
   the turns were found by a search of the projection (kept with the person's scripts). The sweep now goes
   low right, across, low left and back.

