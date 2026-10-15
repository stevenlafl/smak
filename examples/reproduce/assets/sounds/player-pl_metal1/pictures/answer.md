`player/pl_metal1.wav` is built, and the last build said OK with no warnings. It's written to `work:sound/player/pl_metal1.wav`. It's 11025 Hz, 8-bit mono, 0.58 s, and it takes the original's place when put in `<mod>/sound`.

It's made from layers only (shaped noise, a plate-mode ring, a low thump and a scuff of particles), with no generated recording. The spec is the final build call above.

**Against the game's own metal steps:** all 22 features are in range.

**Against the original's picture:**

| Measure | Mine | Original |
| --- | --- | --- |
| Length | 0.58 s | 0.58 s |
| Centroid (brightness) | 393 Hz | 361 Hz (9% off) |
| T20 (time to -20 dB) | 0.404 s | 0.315 to 0.525 s range, so inside it |
| Crest (peak over RMS) | 14.9 dB | about 16.3 dB |
| Onsets | 0 | 0 |
| Worst band | 150-600 Hz, 3.4 points off | |

The crest is read off the picture's outline, so it's only good to about 3 dB. The first build got the picture path wrong: it has to be `pictures/sound.png` in the work folder, not the examples path.

I can't judge how it sounds, or how the game plays it (volume, pitch, the map's room), from here. Listen in the game.
