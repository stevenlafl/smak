The sound is built and the build says OK: `work:sound/debris/bustmetal1.wav`, 11025 Hz, 8-bit, mono, 0.87 s. Copy it into a mod's `sound/debris/` folder to replace the game's file.

I could not compare it to the original. The game folders weren't given to the tool, so the reference was not found. Without the original, the numbers below are checked against the game's own metal-hit sounds, not against this file. If you give me the game folder path, I can rebuild with the original as the reference.

The sound is one noisy crash that starts at full level and falls off, with seven inharmonic metal partials ringing on top. The low and middle partials are loudest and the highest ones ring longest. The result is a noise-and-tone mix, with no pitch movement.

| Measure | Result | Game's metal-hit range |
| --- | --- | --- |
| Centroid (the brightness centre) | 1392 Hz | 1074 to 1654 Hz |
| Flatness (0 pure tone, 1 white noise) | 0.175 | 0.16 to 0.28 |
| Band 600 Hz to 2 kHz | 76% | 64% to 84% |
| Band 2 to 5 kHz | 17.5% | 3.7% to 24.6% |
| Time to fall 20 dB (T20) | 0.54 s | |
| Features in range | 21 of 22 | |

The one flag is length: the game's metal hits run 0.37 to 0.86 s, and this one is 0.87 s because you gave that length. The original is also 0.87 s, so I left it.

Two things you should know:
- The tool's `modes` gain is a linear amplitude, not decibels, and a gain of 0 means silence. I used that in the spec.
- Four scratch test files are left in `work:sound/debris/` (`test_crash.wav`, `test_ring.wav`, `test_low.wav`, `test_high.wav`). They are not part of the sound. I have no tool to delete them, so remove them by hand if you don't want them.
