# 22 A wrench in place of the crowbar (weapon; the game's v_, p_ and w_ files)

## The prompt (96 words)

> Replace the crowbar in Half-Life with a big steel combination wrench: an open jaw at one end and a closed
> ring at the other, on a long flat handle. It should be held by the handle the way the crowbar is, swing
> the same way, and keep Gordon's gloved hands and every crowbar animation. I want all three models: the
> first-person one, the one other players see in your hand, and the one lying on the floor as a pickup.
> Show me how it looks swinging.

Built on Half-Life's own `v_crowbar.mdl`, `p_crowbar.mdl` and `w_crowbar.mdl`: the results stay out of
the repository (`.gitignore`), and `run.mjs` builds them again where the game is installed.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | Three files with the game's names (v_, p_, w_crowbar), each with its hands, bones and animations kept | yes | 2 |
| 2 | A wrench: a long flat handle, an open jaw at one end, a closed ring at the other | yes | 2 |
| 3 | Steel, sound: nothing open, inside out or apart | yes | 2 |
| 4 | Held by its handle where the crowbar was held, the same length | yes | 2 |
| 5 | Swings as the crowbar swings, in first person | no | 2 |

**Score: 10 of 10 (100%), judged from the pictures built locally. Passes.**

## How the prompt became the spec

- `kind: "held"` and `weapon: { like: "crowbar", size: "old" }`: the wrench is built lying along +x, the
  ring end (the end held) low, and fitted by the build over the crowbar in each of its three files, the
  same length as the crowbar there (scaled 1.02 in the v_ file, 1.03 in the p_, 1.72 in the w_, whose
  crowbar is drawn larger).
- The handle is a flat bar with a darker flute along it. The two heads are flat: an arc of short boxes,
  each turned along the arc, round the jaw's opening and round the ring: a C and a closed ring, flat as a
  forged wrench's are.

## Iterations

1. The kit learnt weapons for this case: `weapon` in a model spec, `swapMesh` on any bodypart, and the hands
   told by Half-Life's glove and sleeve textures (`GLOVED_sleeve`, `rubbergloveCHROME`). First build clean,
   but the jaw was two square prongs and the ring a round wire: a fork and a key ring.
2. The heads made flat arcs: it reads as a combination wrench in all three views, and swings through the
   crowbar's attack held by its handle.

