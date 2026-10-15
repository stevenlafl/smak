The sprite is built and the build says OK: `work:sprites/flare1.spr`, with `sprites/flare1-sheet.png` and `sprites/flare1-animated.png` beside it.

The final spec is one sprite, `sprites/flare1.spr`:
- **Size and frames:** 64x64, 1 frame, no animation.
- **Type and format:** parallel (always faces the viewer), additive (black is clear).
- **Use:** `env_sprite`, so the engine can scale or dim it for any flicker. The build placed it as an env_sprite in render mode 5 (Additive).
- **Halo:** a soft glow centred on the frame, radius 0.95 of the half-width, fading smoothly to nothing. The corners and outer edge come out pure black (border brightness 0).
- **Core:** a white centre about 30% of the frame wide, with no hard edge.
- **Colour:** a ramp from black through dusty violet-grey and rose-mauve to warm white, as you described.
- **Rays:** 48 faint, fine radial streaks at low gain (0.2), so they add a grainy sunburst texture without a cross.

Two choices to know about:
- **Cross artifact removed.** My first version had a strong horizontal and vertical cross, which you said the original does not have. The cause was the flare layer's default streaks. I set `streaks: []` so only the fine rays remain, and the cross is gone.
- **Core brightened.** I raised the glow gain to 1.4 so the centre reads as a saturated white disc rather than a pink-tinted one.

I had no reference image of the original, only your description, so I could not measure it side by side. The build's comparison against Half-Life's own flare reports 1 of 1 in range, and its colour and shape comparisons are only as good as that description. The thumbnail I could see is 128 pixels, so the rays are checked by eye only at that size. The full-size sheet is `sprites/flare1-sheet.png` if you want to look closer.
