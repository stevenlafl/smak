The sprite is built and the build says OK: `work:sprites/flare1.spr`, with `-sheet.png` and `-animated.png` beside it.

**What I made** (spec `smak.sprite/1`, class `flare`, `env_sprite`):
- **Size and frames:** 64x64, one frame, no loop, 10 fps.
- **Type and format:** parallel (faces the viewer), additive (black is clear).
- **Shape:** a white core about 0.3 of the half-width (roughly 19 px across), and a smooth halo with a radius of 0.85 that fades to pure black before the frame edges. `finish: edge` keeps the border black.
- **Colour:** one ramp used on both the halo and the core, from black at the rim, through violet-grey and dusty rose-mauve, to warm white at the centre.
- **Rays:** 48 thin radial rays (length 0.9, width 0.012, gain 0.35), evenly spread, with no cross or dominant spikes.
- **Motion:** none in the image. Any flicker has to come from the engine's scale or brightness.

**Build results:**
- The first two attempts failed the border check: the ramp's dark stop was not black, so light leaked to the edge. Setting the bottom stop to pure black fixed it.
- The final build reports border 0 and 1 of 1 in range against Half-Life's own flare, with no faults.

**What I could not check:** I have no copy of the original to compare against, so the match rests on your description. The rays are faint in the preview, which fits "subtle", but I could not render a larger sheet because the render tool does not take sprites. Look at `flare1-sheet.png` at full size before you judge the rays.
