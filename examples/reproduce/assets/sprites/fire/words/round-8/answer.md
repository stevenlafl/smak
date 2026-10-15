The sprite is built and the build says OK: `work:sprites/fire.spr`, with `-sheet.png` and `-animated.png` beside it.

**What it is:** a looping campfire flame, drawn additively so the black background drops out. It is a parallel oriented sprite that stays upright, with its base at the bottom of the frame.

**Spec used:**
- **Name:** `sprites/fire.spr`, class `fire loop`
- **Size and frames:** 32×96, 15 frames in the file. That is a loop of 14 plus the first frame again at the end, which is how the kit wraps a loop. I chose 14 so the file holds the 15 frames you described.
- **Type and format:** parallel oriented, additive. The build placed it as an `env_sprite` in render mode 5 (Additive) at 10 frames a second, the engine's cap for that class.
- **Origin:** bottom, so the flame sits on its base.
- **Layers:**
  - Main fire: full width at the base, tapering to 0.6 of that at the top, with tongues at 0.8. Turbulence is low (0.15) so the frames stay steady and don't drop out.
  - A narrower second fire layer (half width, gain 0.8) that adds to the body.
  - A warm glow centred low in the frame, colour around (1.0, 0.8, 0.4), gain 0.4, for the white-hot core.
- **Edge fade:** 2 pixels, so the base is soft and not cut hard at the bottom edge.

**What the build measured:** the palette is 255 colours, the border is almost black (0.005 against a brightest of 0.115), and the loop wrap scores 0.67. The report flags nothing; its checks against Half-Life's fire loop are all within range, and the brightness envelope peaks at 0.86.

**Choices and limits:**
- No reference picture came with the description, so I could not measure it side by side with the original. Everything above is tuned by eye from the contact sheet and against the description, not against the original's pixels. Put the two next to each other before you judge it.
- I tried several turbulence settings. The higher ones gave frames that dropped out almost to nothing (frames 5 and 6 especially). The current setting holds the brightness steady across the loop.
- The colours follow the description: yellow-orange core, orange body, red-brown tips, no blue, no smoke, no sparks.
