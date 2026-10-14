# 13 / 02 "Make the neon strip blue" (a change request)

## The prompt (21 words)

> Actually, make the neon strip along the front of the counter electric blue instead of pink. Keep the sign
> pink.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | The counter's strip blue (seen in the views) | yes | 2 |
| 2 | The sign still pink; nothing moved (the change report) | yes | 2 |
| 3 | Still clean | yes | 2 |

**Score: 6 of 6 (100%). Passes.**

## How the request became the change

- A new material `blue_neon` (a `neon` of tone 0.2, 0.5, 1.0), and the counter prefab's strip piece wears it.
  The sign is a model with its own pink material, untouched.
- Report: `materials added: blue_neon`; `22 rooms and things are where they were`. The views of the result
  (result-02-blue-strip/picture-2) show the blue strip along the counter and the pink sign on the wall.
