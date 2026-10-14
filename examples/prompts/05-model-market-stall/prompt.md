# 05 A market stall (model, built from prefabs)

## The prompt (138 words)

> A small market stall for a medieval town square, as one prop, about 90 units tall. A plain wooden
> counter runs across the front. Four wooden posts hold up a red cloth awning that slopes down towards the
> front and sags a little in the middle. A beam runs across the top at the front, and a lantern like the
> street lamp's hangs from the middle of it, lit. On the counter lie a sword for sale, flat, and a small
> wooden crate. On the ground next to the stall stands one of the barrels I asked for before, a bit smaller.
> Make the lantern and the barrel as separate pieces (prefabs) and reuse them, so they match my other props.
> The stall faces forward (+x), the awning is the highest thing, and nothing hangs in the air.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | About 90 tall, standing on the ground, facing +x | yes | 2 |
| 2 | A wooden counter across the front | yes | 2 |
| 3 | Four posts holding a red cloth awning that slopes down to the front and sags a little; the awning is highest | yes | 2 |
| 4 | A beam across the front top with a lit lantern hanging from its middle | yes | 2 |
| 5 | A sword lying flat and a small crate on the counter | yes | 2 |
| 6 | The barrel of case 01, smaller, on the ground beside the stall | yes | 2 |
| 7 | The lantern and the barrel are prefabs reused (the lantern a prefab file; the barrel case 01's own spec) | yes | 2 |
| 8 | Nothing floating, no holes | yes | 2 |

**Score: 16 of 16 (100%). Passes.**

## How the prompt became the spec

- The stall's own parts by numbers in its space: a counter `box` across the front (+x), front and back
  posts mirrored across y (the back ones taller, so the awning slopes down to the front), a beam across
  the front tops, and the awning a `leaf` of four rows of five points from the back posts' tops down to
  the beam, its middle rows lower in the middle (the sag).
- Three prefabs, each a spec built and checked on its own and then put in:
  - `lantern.json`, a file beside the spec: the street lamp's lantern (case 02) without its arm, hung by
    its chain from the beam's middle (`attach` top to bottom).
  - `crate`, a prefab given in the spec's `prefabs`: a box with an iron band, on the counter.
  - the barrel, read from case 01's own `spec.json` (`file: "../01-model-barrel/spec.json"`) at
    `scale: 0.6`, on the ground beside the counter.
- The sword is the sword kit's (`kit:sword`), turned to lie along the counter and laid on it flat.

## Iterations

1. `FAULT 48 open edges ... in sword`, `inside out ... in sword`, `back_post ... float apart`. Each was
   followed to its cause:
   - The back posts stopped 0.4 under the awning: they were made taller (the spec's slip). The check
     also missed that a post that goes up through the awning touches it, since no corner of either was
     near the other's faces; it now counts two parts whose faces cut through each other as touching.
   - The inside-out shells were the check's: its weld of 0.01 joined points at the sword's narrow tip
     that are apart, and a shell cut off along such edges looked closed. The weld is now 0.002, and a
     shell cut off along edges that did not pair is not taken as closed.
   - The open edges were the sword kit's own, and real: the bar guard's two tips, the blade's base and
     its tip were open slots, and the grip was a tube with no ends, its end showing where it is thicker
     than the guard. The workshop's `plate` learned `ends: true` (closing its first and last section),
     and the sword kit closes its blade, its guard and its turned parts (grip, pommel, collar) at both
     ends. The kit's selftest areas pass as before.
2. Clean, but the awning's sag (1.9) did not show, and the cloth's weave came out as a checkerboard at
   this texture's few pixels a unit. The sag was made 4.5 in the middle, the front edge sagging half as
   much, and the cloth's weave was softened in `src/spec/paint.mjs`.
3. Clean. The sheet (picture-1) shows the awning highest, sloping to the front with its front edge dipping
   in the middle (seen from the back), the beam, the lantern hanging from its middle, the counter and the
   barrel beside it; the close look (picture-2) shows the lantern lit, the sword lying flat and the banded
   crate on the counter.
