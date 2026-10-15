`sprites/steam1.spr` builds and the build says OK, but one shape warning is still open, so it is not a clean match to the original.

**What I built:** a white smoke puff, 32x48, 16 frames, played once (not a loop). It is type parallel oriented and format index alpha, placed as a tempent at 15 fps. Colour is plain white coverage.

**Measured against the original:**

| Measure | Original | Mine |
| --- | --- | --- |
| Mean colour difference (delta E, bar 15) | – | 6 |
| Share of the frame that is dark | 0.63 | 0.65 |
| Frame count | 16 | 16 |
| Brightest pixel on the border | 0.341 | 0.566 |
| Shape overlap, mean over frames (bar 0.8) | – | 0.73 |

The puff starts as a small dot, swells into a rough cloud with a tail underneath, then fades. Frames 1 to 9 overlap the original's shape at about 0.84 to 0.93.

**Still open:**
- **Late frames (12 to 15):** the original keeps a faint wispy column, while mine fades out earlier. Frame 15 is empty in mine, and the original still has a thin trace there.
- **Border light:** it is higher than the original's, though the build treats it as passing.
- **How I got here:** I tried a few fade and mask settings, and each trade-off either lost frame 0 or worsened the colour. I stopped at this version, which has the best colour match with frame 0 kept.

The sprite and its sheet are written to the work folder as `sprites/steam1.spr`, with `-sheet.png` and `-animated.png` beside it.
