The sprite builds OK: `sprites/muzzleflash1.spr`, written to the work folder with its `-sheet.png` and `-animated.png` beside it.

**What the original is:** a five-armed star flare. A bright white-peach core sits at the centre, with five thin rays at about 90°, 162°, 234°, 306° and 18°, and the rays reach near the frame edge. The two frames are almost the same, with the second slightly rotated.

**The spec I built:**
- `class` flare, `use` tempent, `type` parallel, `format` additive, `origin` centre
- size 64x64, 2 frames, not looping, 12 fps
- one flare layer: core 0.12, `ramp` muzzle, and five half-streaks (`half: true`, so each runs out from the core only) at the angles above. Length 0.95 to 0.98, width 0.05, gain 0.8 to 0.9, with `haze`, `blur` and `taper` off so the rays stay thin and no halo is added.
- `reference` set to `pictures/frames.png`, cell 128, 2 columns, so the report measures against the original

**Final measures against the original (last build):**
- Mean colour delta E 6 (15 or under is near)
- Shape overlap 0.70 against a bar of 0.7, frame by frame 0.70 and 0.70
- Dark share 0.66 against the original's 0.76, so it is still off by about 0.10 (the 0.05 bar is missed)
- Frames 2 and 2, border light 0, render mode 5 (additive), no FAULTs

**Choices I made:**
- The glow layer I first tried added a round halo the original does not have, so I dropped it.
- The dark-share gap is the one open difference. The faint disc round the core is still a little brighter than the original's background. I did not find a streak setting that removed it without thinning the rays, so the rays were kept as the shape match needed.
