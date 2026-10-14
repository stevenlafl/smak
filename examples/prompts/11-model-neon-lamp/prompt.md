# 11 A neon street lamp (model; the first prefab of the city, case 17)

## The prompt (153 words)

> For my cyberpunk city I need a street lamp, about 128 units tall. It stands on a heavy square plinth of
> dark gunmetal with a bolt at each corner of its top. The pole is six-sided and dark, and a thick power
> cable runs down the pole's back from a junction box near the top to the plinth. At the top a slim arm
> leans out over the street to the front and ends in a long housing with a glowing cyan light bar on its
> underside. Halfway up, on the street side, a small advertising panel glows hot pink, set in a dark frame,
> with a thin cyan strip along its bottom edge. Put a yellow-and-black hazard band round the pole just
> above the plinth. The lights must glow in the dark; everything else should look like grimy metal. It
> faces +x (the street), and nothing should float.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | About 128 tall, standing on the ground, facing +x | yes | 2 |
| 2 | A square gunmetal plinth with four bolts on its top corners | yes | 2 |
| 3 | A six-sided dark pole with a hazard band (yellow and black) just above the plinth | yes | 2 |
| 4 | An arm out to +x at the top, ending in a housing with a glowing cyan bar underneath | yes | 2 |
| 5 | A pink glowing ad panel in a dark frame halfway up on the +x side, a cyan strip along its bottom | yes | 2 |
| 6 | A cable down the pole's back (-x) from a junction box near the top to the plinth | no | 2 |
| 7 | Glowing parts fullbright; the rest grimy metal | no | 2 |
| 8 | Nothing floating, no holes | yes | 2 |

**Score: 16 of 16 (100%). Passes.**

## How the prompt became the spec

- A four-sided `cylinder` turned 45 degrees is the square plinth; one bolt on its top, `repeat`ed 4 times
  round it. The pole is a six-sided `cylinder` standing on it; the hazard band a `band` round the pole in a
  new material, `hazard` (stripes of its tone and black on a slant), added to `src/spec/paint.mjs` for this.
- The arm is a `tube` from a point of the pole's surface near its top (`{ s: 0.97, angle: 0 }`: +x, the
  street side), the housing a `box` whose `back` is put on the arm's `end`, the light bar a `box` in a
  `neon` material (fullbright) under it.
- The ad panel: a frame `box` whose back sits on the pole's +x face halfway up, the pink `neon` panel and
  the cyan strip on the frame's front.
- The junction box sits on the pole's back (`angle: 180`) near the top; the cable is a `tube` from its
  bottom down the pole's back into the plinth.

## Iterations

1. Clean, but the parts list said the cable ended at 9.5, over the plinth's top at 8: it hung short of
   the plinth the prompt runs it to. Its path was made longer.
2. Clean. The sheet (picture-1) and the close look (picture-2) showed the plinth, the bolts, the hazard
   band and the pink panel with its cyan strip; the light bar, on the housing's underside, was hidden from
   every view above it. The close look (`focus`) now draws a third view from below.
3. Clean. Picture-2's view from below shows the cyan bar glowing under the housing at the arm's end, and
   the junction box with the cable down the pole's back.
