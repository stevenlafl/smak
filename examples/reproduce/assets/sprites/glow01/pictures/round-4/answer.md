The sprite builds OK: `sprites/glow01.spr` is written to the work folder, with `-sheet.png` and `-animated.png` beside it. The build reported no errors and no notes about the sprite's shape or colour.

What it is, and how I matched the original:

- **Shape and size:** a round, soft-edged white glow, 64x64, centred, with one frame. It is a `glow` class with a smooth falloff, so it fades to nothing well inside the frame's edge.
- **Radius and core:** the glow radius is 1.0 and the bright core is 0.3. These were set by measuring against the reference: the first try (radius 0.9, core 0.12) covered too little of the frame, and radius 1.1 covered too much.
- **Colour:** pure white on black, which is what additive needs (black is clear).
- **Type and format:** `parallel` (faces the camera) and `additive`, as in `facts.txt`.
- **Use:** `env_sprite`, placed in render mode 5 (Additive).

Measured against `pictures/frames.png` by the build's report:

| Measure | Original | Mine |
| --- | --- | --- |
| Mean colour (delta E, 15 or under is near) | | 1.9 |
| Share that is dark (within 0.05 is near) | 0.47 | 0.43 |
| Shape overlap (the bar is 0.7) | | 0.83 |
| Frames | 1 | 1 |
| Border light | 0 | 0 |

The build also confirmed it places as Half-Life's glow class (1 of 1 in range).

One thing I did not verify: the reference sheet has a small bracket mark in its top-left corner. I did not reproduce it, since it looks like a sheet marker rather than part of the sprite.
