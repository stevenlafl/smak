I built `sprites/glow01.spr` from a `smak.sprite/1` spec. The build says OK and every check passed. I only looked at the one contact-sheet picture, and I had no reference sheet to measure it against.

- **Format:** 64x64, one frame, type parallel, format additive. It is a single still image with no animation.
- **Shape:** one `glow` layer with the `power` falloff, `core` 0.31, `power` 2 and `reach` 1.0, in plain white (1, 1, 1) with no tint.
- **Falloff:** the curve is 1 / (1 + (r/core)²). That gives about 50% brightness at 10 px from the centre, about 20% at 20 px, and a faint haze fading to black near the frame edge. This comes from the formula, not from measuring the rendered pixels.
- **Border:** the border light is 0, so there is no square outline. The sheet shows a clean round gradient with no rays or rings.
- **Colours:** 52 colours after quantising to the palette, which lost 0.0035. The report says it is in range against Half-Life's own glow sprite.

I put `"use": "env_glow"` in the spec, and the report says to place it with render mode 3 (Glow). If you want it placed as a plain `env_sprite`, that field would change.

I didn't separately build the 4 to 6 px near-white hot spot. The formula peaks at full white at the centre, and the sheet shows a bright core.

The files are in the work folder: `sprites/glow01.spr`, with `-sheet.png` and `-animated.png` beside it.
