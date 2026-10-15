`sprites/zerogxplode.spr` is built and the build says OK, with no warnings left. It is 64x64, 15 frames, type parallel, format additive, placed as a tempent (render mode 5, additive). It is one `billow` layer in a custom orange-to-cream ramp, masked to the reference's outline, so the shape follows the original frame by frame.

Measured against the reference:

| Measure | Reference | Mine |
| --- | --- | --- |
| Mean colour difference (delta E, bar 15) | – | 14.8 |
| Share dark (within 0.05 is near) | 0.72 | 0.74 |
| Frame count | 15 | 15 |
| Shape overlap, mean (bar 0.8) | – | 0.80 |
| Border brightest | 0.818 | 0.538 |

- **Tight margins:** both the colour and the shape pass with almost nothing to spare. I tuned the cooling rate and gain several times, and each pass pulled one measure down as the other came up.
- **Shape by frame:** it is weakest in the last three frames, 12 to 14 (0.65, 0.56, 0.68). Frames 1 to 9 are 0.83 to 0.91.
- **Border:** the border is dimmer than the original's, but the build raises no fault for it.
- **Flicker:** its frame-to-frame flicker (1.65) is above Half-Life's own explosions (1.04 to 1.48). It also ends slightly lit (0.05 against 0 to 0.03). The build lists both as facts, not warnings.

The sprite is in the work folder with its `-sheet.png` and `-animated.png` beside it.
