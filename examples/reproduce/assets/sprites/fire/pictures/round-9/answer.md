I built `sprites/fire.spr` and the build says OK with no warnings. It's in the work folder, with its frame sheet and an animated preview beside it.

**What it is:** a looping torch flame, 32x96, 15 frames, type parallel oriented, format additive (black shows as clear). It runs at 10 frames per second and goes in as an env_sprite with render mode 5 (Additive). The spec has 14 frames with `loop: true`, and the build adds the first frame again at the end, so there are 15 frames like the original. The flame is orange with dark-red edges and a slightly hotter middle in the lower half, and it flickers into licks toward the top.

**Measured against the original** (the build's own report):

```
measure                                ours    original   bar
mean colour difference (delta E)       12.8    -          15 or under
share of pixels that are dark          0.42    0.38       within 0.05
brightest pixel                        0.66    0.69       -
pixels over 0.7 brightness, per frame  0       0          -
shape overlap, mean of 15 frames       0.80    -          0.8
  faint edge / body / core             0.92 / 0.94 / 0.55
border brightest                       0.27    0.275      -
frame count                            15      15         -
```

How it's made: a fire layer and a soft orange glow, both limited to the original's outline frame by frame. The build takes only the outline from the original, not its colours. The other fire-loop checks passed 5 of 5 against Half-Life's own fire sprites, and the loop wraps without a jump.

**Where it's weakest:**
- **The hot middle sits low.** It matches the original only 0.55. The original's brightest band runs from about row 46 to row 84, and ours runs from about 51 to 89. The fire layer always puts its brightest light at its base, and I found no setting that moves it up.
- **Only the mean overlap clears the bar.** Frames 0 to 4 and 13 are at or above 0.8, but the rest are between 0.76 and 0.79.
- **The bottom few rows are dark.** Our flame stops at row 89, while the original's is lit down to row 94.
- **Colour versus coverage was a trade.** A deeper-red version brought the colour difference down to 10.9, but more of the frame went dark (0.44 against 0.38, over the limit). Raising its brightness to fix that pushed the colour difference back up to 14. So I kept the version with no warnings.
