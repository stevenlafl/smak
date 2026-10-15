The sprite builds OK: `sprites/laserbeam.spr` is written to the work folder, with its `-sheet.png` and `-animated.png` beside it.

The spec, as built:

- **Class and use:** `beam`, so it tiles along its length. Type `parallel`, format `additive`, one frame, no loop.
- **Size:** 32x64.
- **Core:** `core: 0.31`, a flat-topped stripe about 10 px wide at the centre, white.
- **Falloff:** `shoulder: 0.2`, the glow fading to black, leaving the outer edges dark.
- **Colour:** a ramp of pure white, then 0.55, 0.56, 0.60, then 0.12, 0.12, 0.14, then black, as you gave it.
- **Texture:** `noise: 0.25` and `streaks: 0.35` for the blotchy vertical streaking on the flanks.
- **Gain:** 2, so the core reaches full white. At the default gain it peaked at about 0.55.

The build's measures for the final version are: brightest pixel 0.994, border light 0.055, and 105 colours after quantising. The report did not measure the brightness ramp per column, and the tool gave no pixel readout, so I could not check the stripe's exact column positions or the glow widths directly.

Things to know:

- **No reference to compare against.** I only had your description, and the engine has no beam sprite stats to compare with, so "0 of 0 in range" means nothing was compared. The match is to the description, not to the original file.
- **Shoulder units are inferred.** I read `shoulder` as a fraction of the full width, which fits the measured border light. The build's own documentation doesn't say so, so treat that as my reading.
- **Looks unverified by eye.** The preview is too small for me to confirm the core is centred or the streaks look right, so it's worth a look in the sheet image.
