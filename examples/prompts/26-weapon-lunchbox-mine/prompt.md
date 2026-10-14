# 26 A lunchbox tripwire mine in place of the tripmine (weapon; two views)

## The prompt (82 words)

> Turn the laser tripmine into something homemade: a red metal lunchbox with a rounded lid and a black
> carry handle, a strip of grey duct tape round its middle, a flat battery taped to its front with a red
> wire running from it, a red light on the front and a spool of wire on its side. It still sticks to walls
> and shoots its beam like the tripmine. I need the first-person one and the one in other players' hands.

Built on Half-Life's own `v_tripmine.mdl` and `p_tripmine.mdl` (the tripmine has no `w_` file: placed, it
is the `v_` file's own world body): the results stay out of the repository.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | Two files with the game's names, hands and animations kept; the placed body replaced too | yes | 2 |
| 2 | A red lunchbox with a rounded lid and a black handle | yes | 2 |
| 3 | Grey tape round its middle, a battery with a red wire, a red light, a wire spool | yes | 2 |
| 4 | Held as the tripmine is; nothing open, inside out or apart | yes | 2 |

**Score: 8 of 8 (100%), judged from the pictures built locally. Passes.**

## How the prompt became the spec

- `weapon: { like: "tripmine", views: ["v", "p"], turn: { v: "as drawn" } }`: the tripmine has no `w_`
  file; placed on a wall it is the `v_` file's own world body (`tripmine_boned_world`), which is replaced
  as well as the one held. Its beam comes from the game's attachment, kept.
- A box is the same outline every way round, so the fit could not tell which face is the front: the kit
  learnt `turn` for this case, and the four turns were drawn side by side; "as drawn" holds the battery,
  the light and the wire towards the player, as the tripmine holds its lens.

## Iterations

1. Clean, but held with its taped top towards the player. `weapon.turn` added to the kit (a test in
   `test/46-specs.mjs`); the front now faces the player.
