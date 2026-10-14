# 13 / 04 "Add the hum of the fridges and the stove's sizzle" (a change request)

## The prompt (36 words)

> Last thing for the noodle bar: it's too quiet. Give the drink fridges a low electric hum you hear when
> you're near them, and the stove a sizzle of hot oil. Leave everything else as it is.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | A low hum looping at the fridges, heard near them only | yes | 2 |
| 2 | A sizzle looping at the stove | yes | 2 |
| 3 | Both files pass every check (a cue point, a seam that does not click) and sit in the range of the game's own loops | yes | 2 |
| 4 | Nothing moved, added or taken away but the two sounds (the change report) | yes | 2 |
| 5 | Still compiles, lit, every place reached | yes | 2 |

**Score: 10 of 10 (100%). Passes.**

## How the request became the change

- `sounds`, a thing the kit learnt for this request: two sound specs, each played where it is put by an
  `ambient_generic` (looped, as each file has a cue point; heard in a small radius). The hum is three tones
  of a compressor at 180, 360 and 540 Hz over a little pink noise; the sizzle a body of band-passed noise at
  500 Hz, a hiss over 2500, crackles and a faint rumble. Both are written beside the map under `sound/`.
- Report: `things added: sounds ambient_generic #1 in shop at 184 80 0; ... #2 at -188 72 0`; `22 rooms
  and things are where they were`. Against the game's own: the hum 19 of 20 of its machine loops (a little
  squashed: a steady hum has no peaks), the sizzle 16 of 20 of its fire loop (brighter than a fire's roar,
  as a sizzle is).

## Iterations

1. The hum at 60 Hz was flagged as clicking at its seam: it was crossfaded and smooth, but the check held
   the seam against the sound's mean step, and a low hum's steep slope makes three times that. The kit's
   check now holds the seam against the steps beside it. The hum was also darker than any machine loop of
   the game's (its fundamental under 150 Hz): raised to 180, a compressor's. The sizzle was all rumble at
   first: its brown noise lowered, a band of noise at 500 Hz given the body.

