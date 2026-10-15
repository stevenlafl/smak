The glow is built and the build says **OK**: `work/sprites/glow01.spr`, with a contact sheet and an animated preview beside it.

What it is, as specified:

- **Size and frames:** 64 by 64 pixels, one frame, no animation. The engine's own sprite header is written with the first frame as the only frame.
- **Type and format:** `parallel` (always faces the viewer) and `additive` (black is clear, brighter pixels add light). The build places it as an `env_sprite` with render mode 5 (Additive).
- **Shape:** one circular radial glow centred in the frame, with no rays, rings or noise. The build reports the border as black (brightest 0), so no square outline should show.
- **Colour:** neutral white (1, 1, 1), so the game can tint it with render colour.
- **Falloff:** a glow layer with radius 0.97 of the half-frame (about 31 pixels) and core 0.31 (about 10 pixels). The falloff is the smooth kind, which is cut to nothing between 0.55 and 1 of the radius.

Where I'm not sure:

- **I could not measure the pixels.** The tools here show only a 128-pixel thumbnail and summary figures, and I had no way to read the PNG values. The mid-grey at 10 pixels, the dim grey at 20 and the black by 30 to 32 come from my reading of how the spec's smooth falloff is built, not from a measured profile. Please check those three points against the original.
- **I had no reference sheet.** The build's comparison against Half-Life's own glow passes (1 of 1 in range), but I could not compare against your original, so no delta-E or dark-share figure against it. The build reports a dark share of 0.46 for this glow.
- **Choices I made:** I tried radius 1.0 and core 0.5 along the way and kept radius 0.97 and core 0.31, which best matched the described falloff. The final file is the last build.
