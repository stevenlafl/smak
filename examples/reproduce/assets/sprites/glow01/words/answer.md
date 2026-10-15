The sprite builds OK: `work:sprites/glow01.spr`, with a preview sheet and animated picture beside it. I could not confirm that the falloff matches the original, so the match is unverified.

**What's in the file**
- 64 by 64, one frame, type `parallel`, format `additive` (black is clear), white with no tint, no animation.
- The build's report: border light 0, dark share 0.30 (the original's black ring beyond about 31 px would give roughly 0.26), no faults.
- Placed as an `env_sprite` with render mode 5 (Additive). I left `use` at the spec default because you didn't name one. If the original is meant for `env_glow`, say so and I'll change it.

**How I got the falloff**
- The spec's `power` falloff ignored `radius` and left the frame border bright (0.84 mean), so I dropped it.
- The `smooth` falloff with `radius` 0.97 fades to black at the frame edge. I stacked four of those discs with gains 0.3, 0.3, 0.25 and 0.15 and radii 0.97, 0.6, 0.35 and 0.15 (of the half-frame). The aim was a bright centre, mid grey near 10 px, dim near 20 px, and black by about 31 px.

**What I could not check**
- The report's "brightest" figure does not fit the preview: a flat white disc reported 0.02 and a gain of 0.1 reported 0. So I could not read the actual grey levels, and the preview may be contrast-stretched. The mid grey at 10 px and dim grey at 20 px are my estimate from the stacking, not a measurement.
- I had no reference picture of the original, only the description, so there was no side-by-side measure. If you can give me the original file or a sheet of it as `reference`, I can check the mean colour and dark share against it.
