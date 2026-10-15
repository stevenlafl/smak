The sprite builds OK: `work:sprites/flare1.spr`, with `-sheet.png` and `-animated.png` beside it.

The build reports it as 64x64, 1 frame, additive, placed as an `env_sprite` with render mode 5 (Additive). It sits in the flare class and checks as "1 of 1 in range" against Half-Life's own flare. Its border is 0 and its dark share is 0.51. The envelope peaks at frame 0.

How it matches your description:
- **Shape:** a bright white core about 0.24 of the half-width (roughly a quarter of the frame), with a smooth glow out to 0.92 of the radius, so the halo reaches almost to the edges and fades to black at the corners.
- **Colour:** a ramp from black through dark violet-grey and dusty rose-mauve to warm white at the core.
- **Streaks:** 48 thin, evenly spread rays of varying length, low gain, no cross shape.
- **Motion:** one frame, no loop. Any pulse has to come from the engine, as you said.

Choices I made that you may want to change:
- The colour ramp stops are my estimate from your description. No reference picture was given, so I could not measure the colours against the original.
- The `env_sprite` use and the `flare` class are my reading of "a light flare". Change `use` if you intend it as a `tempent` or `env_glow`.
- The larger sheet render failed with an internal error, so I checked the frame from the build's own small image only. It may be worth a look at `flare1-sheet.png` before you judge it side by side.
