The sprite is built at `sprites/laserbeam.spr` (32x64, one frame, parallel, additive), and the build says OK with every check passed.

It's two beam layers added together:

- **Core:** a pure white band about 9 pixels wide with a sharp falloff. It has no noise, so it's equally bright from top to bottom, and it sits about a pixel left of centre.
- **Halo:** a wider pale grey layer that's slightly blue (colour 0.84, 0.87, 0.95 on a 0-to-1 scale) at 60% brightness. It carries the vertical streaks and the patchy mottling. Its centre is a bit right of the core's, so the right side of the halo comes out a little wider and brighter than the left.
- **Edges:** a 3-pixel fade keeps the left and right edges dark. The beam stays lit all the way to its top and bottom, so it tiles seamlessly along its length.

Two limits on how far I could check it:

- **No measured comparison:** I had no picture of the original, so the build couldn't score this one against it. The match is judged only by eye against the description.
- **Off-centre shift unconfirmed:** the spec guide doesn't list an `at` (position) field for beam layers. The build didn't reject it, but I can't confirm from the render that the shift actually took effect.

Out of five builds I kept the last one. It has the clearest streaks along the halo edges while the core stays steady.
