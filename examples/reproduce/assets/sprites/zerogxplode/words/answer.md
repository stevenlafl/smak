The sprite builds OK: `work:sprites/zerogxplode.spr`, with `-sheet.png` and `-animated.png` beside it. It's a 64x64, 15-frame, additive, parallel tempent that plays once at 15 fps.

I built it from the description alone. There's no reference picture, so the report measured it against Half-Life's own explosion class, not the original. It came back 5 of 5 in range, with a border light of 0.003 and an envelope that ends dark.

How it matches the description:
- **Frame 0:** a small white point, a little left of centre, about 8 px across.
- **Frames 1–3:** a white burst that grows into a lumpy blob, with a thin orange rim.
- **Frames 4–7:** the blob fills most of the frame, with a narrower top lobe and a wider bottom, and the colour moves from white to gold.
- **Frames 8–11:** a billowing cloud about 50x60 px. The top stays brightest and the bottom goes amber and brown with a ragged lower-left edge.
- **Frames 12–14:** it dims quickly through dark brown to black.

Where it falls short of the description:
- Frame 14 is fully black. The description has a faint brown smudge near the top, and I couldn't get one without the one-shot failing its "ends dark" check.
- The top lobe is more white-gold than the pale cream-yellow described.
- The debris sparks are faint. I raised their count to 60, but they hardly show in the sheet.
- The edge fade is set to 4 px, which brings the border light under the threshold.

The spec was passed inline to the build tool and isn't saved as a file in the work folder. If you want it kept for rebuilding, I can write it out as a `.json` alongside the sprite.
