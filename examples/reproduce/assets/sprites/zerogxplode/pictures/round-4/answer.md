The sprite builds OK and is at `work:sprites/zerogxplode.spr` on the server, with `-sheet.png` and `-animated.png` beside it. It is 64x64, 15 frames, parallel type, additive format, placed as a temporary entity (`tempent`) in render mode 5 (additive).

**Built with the final spec**

- **Body:** an `explosion` layer, a ball that grows and turns lumpy with turbulence. Its colours are my own stops: black at the rim, dark red, orange, cream, and near-white at the core. It fades to black by the last frame.
- **Core flash:** a `glow` at the centre, cream-coloured, that fades quickly.
- **Flicker:** 12 `blobs` (soft discs redrawn each frame) for frame-to-frame sparkle.
- **Flecks:** 30 `sparks`, pale grey, short trails, to match the scattered dots in the original.
- **Edges:** `finish: edge` fades the border so no square shows.

**Against the original (the judge's measures)**

| Measure | Original | Mine | Bar | Result |
| --- | --- | --- | --- | --- |
| Mean colour (delta E, colour difference) | reference | 10.3 | 15 or under | in range |
| Dark share of pixels | 0.72 | 0.57 | within 0.05 | out (mine too bright) |
| Shape overlap | reference | 0.42 | 0.7 or over | out |
| Flicker (jitter) | 1.04 to 1.48 band | 1.13 | in band | in range |
| Half-Life explosion range | — | 5 of 5 | — | in range |
| Frame 0 | small dot | small dot | — | matches |
| Final frame | dark | dark | — | matches |

The two misses are the ones I could not close with this layer set: my cloud has a brighter rim than the original's, and its outline doesn't follow the original's lobes frame by frame. The `billow` layer (a lit cloud of spheres) would match the lobes better, but it renders grey whichever colour ramp I give it, so I did not use it.

**Things I could not check**

- The original's playback rate. I set 15 frames per second because I could not read one from the original's files, so its timing is a guess.
- The original's folder listing. I could only open `frames.png` from the input folder, not list the folder. The `facts.txt` in the work folder is the only other file I saw, and I did not read it.
- The spec is in this conversation only; I did not save it to the repo.
