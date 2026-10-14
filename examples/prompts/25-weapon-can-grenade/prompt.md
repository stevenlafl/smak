# 25 A tin-can bomb in place of the hand grenade (weapon; a pin that comes out)

## The prompt (89 words)

> Replace the hand grenade with an improvised one: a tin can wrapped in two bands of black electrical tape
> over a faded paper label, nail heads sticking out round its bottom edge, a brass screw cap on top with a
> short black fuse curling out of it, and a wire pull ring on the cap that comes off in your hand when you
> pull it like the grenade's pin. Keep the throw animations. All three models, and show the throw.

Built on Half-Life's own `v_grenade.mdl`, `p_grenade.mdl` and `w_grenade.mdl`: the results stay out of the
repository.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | Three files with the game's names, hands, bones and animations kept | yes | 2 |
| 2 | A tin can with two black tape bands over a paper label, nail heads round its bottom edge | yes | 2 |
| 3 | A brass cap on top with a curling black fuse | yes | 2 |
| 4 | A pull ring on the game's pin bone: it leaves the can when the pin is pulled | no | 2 |
| 5 | Held and thrown as the grenade is; nothing open, inside out or apart | yes | 2 |

**Score: 10 of 10 (100%), judged from the pictures built locally. Passes.**

## How the prompt became the spec

- `weapon: { like: "grenade" }`. The pull ring names the game's pin bone (`bone: "Bone04"`, which carries
  the grenade's own pin ring, `grenCHROME`), so the pin-pull animation takes it off: measured, it stays
  1.5 to 2.1 units from the can until frame 14 and is 18.8 away in the left hand by frame 21.
- The can is a turn with creased rims and a dimpled top; the label a wide band, the tape two narrow ones
  over it; the nail heads `studs` round its bottom edge.

## Iterations

1. Clean, but the tape was wider than the label it covers, the nail heads bunched in one place (the
   studs' path was given in radians: a spec's angles are degrees), and the ring too small to see.
2. A wide label under two narrow tapes, twelve nail heads round the rim, a larger ring.
