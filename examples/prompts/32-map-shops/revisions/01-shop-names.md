# 32 / 01 "Put each shop's name on its sign" (a change request)

## The prompt (34 words)

> The signs are just colour. Put each shop's name on its sign in big dark letters, GROCERY, CORNER STORE,
> GUNS, CLOTHES, ELECTRONICS, and keep the glow. Nothing else changes.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | Each of the five signs carries its shop's name, readable from the lot | yes | 2 |
| 2 | The signs still glow their colours | yes | 2 |
| 3 | Nothing moved, added or taken away but the names (the change report) | yes | 2 |
| 4 | Still compiles, lit, every shop reached, nothing in a wall or a building | yes | 2 |

**Score: 8 of 8 (100%). Passes.**

## How the request became the change

- `print`, which the kit learnt for this request: a model's box may carry words on a face, in the labels'
  capitals, as large as the face holds, in an ink. Each shop gets a sign model, a box of its own neon colour
  with its name in near-black, placed in the lot just in front of the old neon panel over its door (`z` 121),
  facing the street. The panels stay, as the lit brush behind each name, so the lot keeps its coloured light.
- Report: five `props sign_* #1` added, `49 rooms and things are where they were`.

## Iterations

1. The words first came out in the wrong colours: cyan boards, green letters. The faces' cells of a box's
   picture begin on fractions of a pixel, and the workshop's sheet wrote a colour at a fractional place, one
   channel off. The sheet keeps to whole pixels now (a test in `test/46-specs.mjs`).
2. Its model paths were one folder short (a revision lies a folder deeper): fixed in the spec.

