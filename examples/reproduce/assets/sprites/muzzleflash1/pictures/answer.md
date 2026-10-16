The sprite builds OK with no warnings: `sprites/muzzleflash1.spr`, written to the work folder as `work:sprites/muzzleflash1.spr`, with its `-sheet.png` and `-animated.png` beside it.

**What it is:** a muzzle flash of five thin, tapering spikes radiating from a bright peach-white core, one spike pointing up. It is 64x64, 2 frames, parallel (faces the camera), additive (black is clear), placed as a `tempent` (rendered additive at 20 fps). It is a one-shot (not looping), so it ends dark.

**Spec choices:**
- **Spikes:** a `flare` layer with five half-streaks at 90°, 18°, -54°, -126° and 162°, length 1.0, width 0.05, tapered. The `half` flag matters: without it each streak also drew its opposite arm, giving ten spikes.
- **Core:** a `glow` layer at the centre, radius 0.3, core 0.12.
- **Colour and timing:** both layers use `ramp: "reference"`, so the colours are read off your contact sheet rather than guessed. Both layers peak on the second frame, starting at 0.95 of peak, as the reference does.
- **Reference:** `pictures/frames.png` read as two 128-pixel cells, two columns.

**Measured against the reference:**

| Measure | Reference | Mine |
| --- | --- | --- |
| Mean colour (delta E, 15 or under is near) | | 0.7 |
| Share that is dark | 0.76 | 0.74 |
| Brightest (share of play) | 1 and 1 | 1 and 1 |
| Shape overlap, frame 0 / frame 1 | | 0.82 / 0.82 (bar 0.8) |

The first build had two warnings I fixed: the peak was on the first frame instead of the second, and the arms were too short for the shape to match. The last build is clean.

**Caveats:**
- The reference was measured from the contact sheet only. I could not list the original input folder (the read was denied), so I did not see any other files there.
- I did not check the render in the game. The judge's measures above are the only check I have run.
