`sprites/muzzleflash1.spr` builds and the build says OK, but it only partly matches the original. The two frames come out identical, so it has none of the shimmer you described.

It is 64x64 with 2 frames, type parallel, format additive, placed as a tempent. The picture shows a five-pointed star with a near-white cream core. The rays run up, left and right a little above horizontal, and down at about 7 and 5 o'clock. The colours go cream to gold to amber, and the border is dark.

- **Frames identical:** I couldn't find a per-frame setting for the streaks, and I didn't try separate layers or an `env` to vary them. The original's second frame has ray lengths and angles that shift by a pixel or two.
- **Rays are soft, not tapering:** they are uniform and blurred rather than tapering to points. A `taper` above 0 turned them into a fat wedge that swallowed the core, so I left it at 0.
- **Not measured against the original:** I had no reference sheet, so I only compared by eye. The report's one comparison, against Half-Life's own flare class, was in range, and the 0 to 0.005 border limit it checks is met. I didn't confirm that the ray length (about 26 to 30 px) or the width (3 to 4 px) matches.
- **No haze:** I dropped the faint haze round the core.

I'd need to try layering a second set of streaks, or find another way to vary frame 2, to get the shimmer.
