The sprite builds OK with no warnings and is written to `work:sprites/laserbeam.spr`, with a sheet and an animated preview beside it.

**Settings** (a single frame, a beam lit to its ends, parallel, additive, 32x64):
- `use: beam`, `class: beam`, `type: parallel`, `format: additive`, `origin: centre`, `frames: 1`
- One beam layer: a flat profile, core 0.7 of the width, shoulder 0.15, two streak mottling at 0.3, colour taken from the reference's own ramp (`ramp: "reference"`).

**Against the reference** (the judge's measures on the same drawing):

| Measure | Original | Ours | Bar |
| --- | --- | --- | --- |
| Mean colour (delta E) | n/a | 3.3 | 15 or under |
| Dark share | 0.02 | 0.06 | within 0.05 |
| Border light, mean | 0.251 | 0.234 | |
| Border light, brightest | 0.914 | 0.905 | |
| Shape overlap, mean | n/a | 0.92 | 0.8 |
| Brightest pixel, frame 1 | 0.91 | 0.91 | |

Every warning is gone. The last build is the one I'd keep. The dark share is 0.04 over the original's, which is still inside the bar, but it is the number most likely to draw a side-by-side eye, so it is the place to look first.

**Caveats:**
- I could not list the input folder directly, so the reference is the work folder's `pictures/frames.png` (2106 bytes), not the input file itself. I did not confirm the two are byte-identical; they look the same in the picture I saw, and the input's file name and size were not visible to me.
- The spec was given inline, not saved to a file. It is reproduced in the first build call above if you want it in the repo.
- The small white mark in the top-left corner shows in both the original and ours. I left it alone because the reference carries it.
