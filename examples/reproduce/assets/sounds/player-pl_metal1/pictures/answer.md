The sound is built and the build says OK. It is written to `work:sound/player/pl_metal1.wav`, so it takes the place of the game's own `player/pl_metal1.wav` when it sits in the mod's `sound` folder. I have not listened to it, so how it sounds is untested.

**The build says:** OK, with two warnings I kept on purpose.
- **8-bit:** the original is 8-bit, so I matched it. The warning says a 16-bit copy is safer, which you can switch on with `bits: 16`.
- **Distance from the picture:** the sound is 11 points off on the sub-150 Hz band (43% against 32%). Every other measure is within range.

| Measure | Original (from its picture) | Built |
|---|---|---|
| Length | 0.58 s | 0.614 s (6% off) |
| T20 (decay to -20 dB) | 0.315 to 0.525 s range | 0.319 s |
| Centroid | 361 Hz | 406 Hz (13% off) |
| Power: under 150 Hz / 150 to 600 Hz / 600 Hz to 2 kHz | about 32 / 47 / 20% | 43 / 43 / 11% |
| Game's step-metal features in range | | 22 of 22 |

Format is 11025 Hz, 8-bit, mono. The spec is a layer synth: a 120 Hz thump with a sweep, a short 600 Hz to 1.8 kHz click, a little filtered grit, and a 420 Hz modal ring, finished with a short room. The spec exists only in this conversation; I did not save it to the project folder. Say the word and I will.

**What I could not check:** I could not read the original `.wav` directly, because the tools refuse binary files outside the work folder. Its numbers come from `pictures/sound.png` and the picture's own readings, not from the file itself. Two things for you to check by ear: the balance of the thump against the ring, and whether the 8-bit hiss shows under the tail.

**Generated takes:** I tried four takes from the local generator (woosh-dflow, non-commercial licence, accepted for this test). They were much brighter than the original, with centroids of 1.2 to 2.6 kHz, and they died too fast. Mixing the closest one in lowered the centroid by only about 2 points, so I dropped it. The final file has no generated audio and no non-commercial licence attached.
