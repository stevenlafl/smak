I built `sprites/steam1.spr` and it passes every check. Its measurements match the original's closely.

**Measured against the original** (from the sheet drawn of each):

```
measure                     original   mine
mean colour (delta E)       -          0.3   (15 or under counts as near)
share of frame that's dark  0.63       0.63
brightest border pixel      0.341      0.239
mean border light           0.002      0.004
frames                      16         16
```

It also lands inside the range of Half-Life's own smoke puffs on all 5 of the build's checks.

**What it is:** a 32x48 sprite, 16 frames, parallel oriented, index alpha, with its origin at the centre. It plays once and doesn't loop. It starts as a small white dot near the top and swells into a lumpy, shaded white cloud that fills the width by about frame 8. It then fades, breaks up, and leaves a faint grey wisp trailing down below it until frame 15 is empty. I set the colours to the original's mid-grey-to-white shading, and the edge is faded so the border stays dark.

**Where it still differs from the original:**
- Frame 0's dot is a little bigger than the original's.
- In the last frames the cloud breaks into patches. The original thins out more evenly.
- The trail underneath is a bit straighter and fainter than the original's.

The file is in the work folder at `sprites/steam1.spr`, with `-sheet.png` and `-animated.png` previews beside it. The final spec is the last build call above. I didn't save it as a separate `.json` file.
