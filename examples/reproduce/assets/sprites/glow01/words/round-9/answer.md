I built `sprites/glow01.spr` and the build says OK. Every check passed and it falls in range against Half-Life's own glow sprites. I had no reference picture, so it was only measured against Half-Life's glow class, not against your original.

**Specs:**
- **Size and frames:** 64×64, one frame, no animation.
- **Type and format:** parallel, additive.
- **Origin:** centred.

**How the glow is drawn:** one white radial glow with a smooth falloff, brightness = 1 / (1 + (r / core)²). I set the core so it hits mid grey at about 10 px from the centre.
- **Hot spot:** about 92% brightness at 3 px, so the centre few pixels are close to white.
- **At 20 px:** about 20%, a dim grey.
- **At 30 px:** a faint haze that eases to pure black at 32 px.
- **Border and corners:** pure black (brightest border pixel is 0), so no square outline shows.

The palette is 111 neutral greys with no tint, so render colour tints it in game. Quantising lost 0.0023, which is under 1%, and the gradient shows no visible banding. About 56% of the pixels count as dark: the corners plus the faint outer haze.

It's set up to be placed as an `env_glow` with render mode 3 (Glow). Files are in the work folder: `sprites/glow01.spr`, plus a `-sheet.png` and `-animated.png` beside it.
