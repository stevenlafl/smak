The sound is built as `work:sound/weapons/explode3.wav`, 22050 Hz, 8-bit mono, 1.3 s. The build says OK, and the measured features are all inside the range of the game's own explosion sounds (22 of 22).

The spec has two layers, then a finish:

- **Body:** white noise with a spectrum that falls with frequency and a level that starts at full scale, holds through 0.4 s, falls to -9.5 dB at 0.8 s, and reaches -45 dB at 1.3 s. Its spectrum is darker after 0.7 s.
- **Crackle:** 1200 short grains a second in the 400 Hz to 2 kHz band, a little quieter than the body and fading on the same envelope. This gives the gritty midrange.
- **Finish:** saturation of 8 for the hard clipping at the start, and a limiter with a 6 dB crest, which is the low end of Valve's weapon range.

Measured against the original's description:

| Feature | Made sound | Game's range |
|---|---|---|
| Attack | 0 ms (no fade-in) | none |
| T20 (time to -20 dB) | 0.86 s | 0.67 to 1.11 s |
| Centroid (brightness) | 551 Hz | 493 to 739 Hz |
| Flatness (0 tone, 1 noise) | 0.055 | 0.05 to 0.15 |
| Power under 150 Hz | 35% | 26 to 46% |
| Power 150 to 600 Hz | 42% | in range |
| Power 600 Hz to 2 kHz | 16% | 9.5 to 30% |
| Power 2 to 5 kHz | 6% | 0 to 15% |

Two things to know:

- I could not listen to it. The check measures the numbers and the picture only, so the final judgement of how it sounds is yours in the game.
- The spec lives in this conversation only; the folder has no file for it. If you want it reproducible, I can save it as a `.json` in the work folder.
