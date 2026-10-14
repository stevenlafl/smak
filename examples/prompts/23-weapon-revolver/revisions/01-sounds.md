# 23 / 01 "Now give it its sounds" (a change request)

## The prompt (49 words)

> Great, now the six-shooter needs to sound like one: a big booming shot with a crack to it (two takes, so
> shots don't all sound alike), and when you reload, the clicks of the cylinder swinging open, the shells
> rattling out and the new ones going in. Keep the gun as it is.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | Two shot files under the .357's names (`357_shot1`, `357_shot2`), every check passed | yes | 2 |
| 2 | The shots like the game's gunshots: compressed (crest under 11 dB), a T20 near the game's, mostly under 2 kHz | yes | 2 |
| 3 | A reload file played by the reload animation at the frame the game's is, fitting the time left | yes | 2 |
| 4 | The reload's events heard as events: clicks and a rattle, its power over 2 kHz | no | 2 |
| 5 | Nothing about the gun changed (the change report) | yes | 2 |

**Score: 10 of 10 (100%), from the report's measures. Passes.** The shots 19 of 22 against the game's
gunshots, crest 10.7 and 10.8 dB, T20 0.57 and 0.59 s (the game's 0.61 to 0.81), 80 and 84% of their power
under 2 kHz; the reload 17 of 22 against the game's reload, 97% of its power over 2 kHz, two onsets, 0.58 s
in the 1.14 s left after frame 70. How they sound is the person's to hear in the game.

## How the request became the change

- `weapon.sounds`, which the kit learnt with the noodle bar's hum: the shot under the .357's name, with a
  variant for `357_shot2` (the game's code plays both), and the reload with `event: { sequence: "reload",
  frame: 70 }`, the frame where the game's own reload sound is: the build wrote event 5004 there in place of
  the game's, and held the sound against the time left.
- The shot from the research's recipe: a crack of high-passed noise, a body of noise held 0.12 s, a boom
  falling from 140 to 45 Hz, a room, and hard saturation. The reload a sequence in time: the cylinder's click,
  a rattle of shells out (particles from 800 to 5000 Hz), two clicks of shells in, the cylinder shut.
- Report: `nothing changed`, `18 parts are where they were`.

## Iterations

1. The shots were spiky (crest 14.6 dB): the kit saturated before the room, so the room's tail stayed thin
   beside the blast. It saturates after the room now, as the research's best pass did; case 38's hits
   gained by it too. The reload's clicks were too short and too pure: noisier, longer clicks and a lower
   rattle. The weapon's report now carries each sound's features line too.

