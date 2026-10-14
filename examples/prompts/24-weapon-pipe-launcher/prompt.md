# 24 A launcher made from a drainpipe, in place of the RPG (weapon)

## The prompt (104 words)

> Make me a junkyard rocket launcher to replace the RPG: a length of grey plastic drainpipe, open at the
> front, with three wraps of silver duct tape and two steel hose clamps round it, a wooden pistol grip and a
> wooden front grip screwed on underneath, a bent steel rod for a trigger, a tin can on a post for a sight,
> and an old orange towel wrapped round the back end where it sits on your shoulder. It still fires the
> game's rockets. All three models, and show it firing.

Built on Half-Life's own `v_rpg.mdl`, `p_rpg.mdl` and `w_rpg.mdl`: the results stay out of the repository.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | Three files with the game's names, hands, bones and animations kept, the game's rocket still in it | yes | 2 |
| 2 | A grey drainpipe open at the front (its inside seen), three tape wraps, two hose clamps | yes | 2 |
| 3 | A wooden pistol grip and front grip underneath, a rod trigger, a can sight on a post | yes | 2 |
| 4 | An orange towel round the back end | no | 2 |
| 5 | Held on the shoulder as the RPG is; nothing open, inside out or apart | yes | 2 |

**Score: 10 of 10 (100%), judged from the pictures built locally. Passes.**

## How the prompt became the spec

- `weapon: { like: "rpg" }`: fitted over the RPG's tube, the bodypart that holds most of it (the second:
  the rocket is the first, and stays the game's, so the launcher still loads and fires the game's rocket).
- The pipe is a turn with a `lining`, open at the muzzle: a lined turn's open end is its first ring, so it
  is built from the muzzle back (`rotate: [180, 0, 0]`) with `caps: [false, true]`. Tape and clamps are
  bands on it; the towel a fat short turn round its back end.

## Iterations

1. The pipe and the shotgun's barrel (case 27) were built with the open end last: 14 open and 14 crowded
   edges at the muzzle, the lining's rim on the wrong end. Turned to begin at the muzzle: clean.
2. Held on the shoulder as the RPG, the towel by the eye, the game's rocket in its place.
