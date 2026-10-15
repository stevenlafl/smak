The sprite is built and the build says OK: `sprites/muzzleflash1.spr` in the work folder, with `-sheet.png` and `-animated.png` beside it.

What the build reports:
- 64x64, 2 frames, additive (black is clear), render mode 5, placed as a temporary entity at 20 fps.
- Border light is 0, so no square edge shows. Dark share is 0.5, and it is "in range" against Half-Life's own flare.

How it's made:
- **Shape:** five explicit rays at 90, 10, 170, 240 and 300 degrees, so one points up, two sit a little above horizontal, and two point down and out at about 5 and 7 o'clock. Each runs about 27 to 29 pixels from the centre, with a tapering base about 4 to 5 pixels wide.
- **Core:** a soft cream glow, about 10 pixels across, at the centre.
- **Colour:** a single gold-amber tint on the rays, with the core whitened by the glow. The brightness falls off smoothly outward.
- **Format:** `flare` class, `tempent` use, parallel type, centre origin.

Choices and gaps you should know about:
- **Frame count:** I set `loop: false` so the file holds exactly 2 frames. With `loop: true` the kit writes a third frame (a copy of the first) for the wrap, which would give 3 frames, not the 2 you asked for. The trade-off is that the engine plays the two frames once per trigger, and the game code has to re-fire it while the weapon shoots. If you want the flicker to loop inside the sprite itself, the wrap frame has to come back.
- **Frame-to-frame shimmer is missing.** The two frames are identical. The kit's streak layer has no per-frame variation, and the only per-frame randomness I found (the rays layer) adds faint random spikes rather than moving your five rays. I didn't add it because it would alter the star's shape. If you want the one- or two-pixel ray shift, it needs a different approach.
- **No gradient ramp.** I tried a brightness ramp to get the gold-to-brown tips, but it put a bright field across the whole frame, so I dropped it. The tips are a flat amber rather than fading to brown.
- **Scratch files:** my test builds left `test-a` through `test-j` `.spr` files and their pictures in the work folder. I have no shell here to delete them, so you may want to remove them.
