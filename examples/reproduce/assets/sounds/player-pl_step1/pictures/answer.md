The sound is built and written to `work:sound/player/pl_step1.wav`, so the game will load it in place of the original. The build says OK, but two measures are still a little outside the game's range for footsteps, so the match is close rather than exact.

Measured against the original's picture (the only reading I had of it, since its `.wav` can't be read here):

| Feature | Original (from picture) | Made | Note |
| --- | --- | --- | --- |
| Length | 0.27 s | 0.264 s | 2% short; the file ends at its audible end |
| Centroid (brightness) | about 902 Hz | 883 Hz | 2% off |
| Power below 150 Hz | about 13% | 15.2% | within range |
| Power 150 to 600 Hz | about 60% | 59.8% | at the top of the class range (59.7%) |
| Power 600 to 2k Hz | about 9% | 9.8% | close |
| Power 2k to 5k Hz | about 16% | 14.9% | close |
| Crest (peak over RMS) | about 21.8 dB | 19.2 dB | within 3 dB of the picture's reading |
| T20 (time to −20 dB) | in range | 0.095 s | within the class range |
| Flatness (noisiness) | class range 0.2 to 0.35 | 0.187 | slightly too pure: the one open miss |

What it is: a heel hit at the start (pink noise, a short white click, a low sine thump that falls from 110 Hz to 50 Hz), a smaller toe hit at 0.09 s, and a body tail that decays over about 0.36 s, all in 11025 Hz 8-bit mono. It is held against the game's `step concrete` class, where it matches 20 of 22 features.

What I could not do:
- **Flatness.** I tried a broadband air layer, a noise sub and swapping the sine thump for noise. The air layer pushed the top end too bright, and the noise sub changed the other bands in a way I couldn't explain. Flatness stayed at 0.187 for the best version, so I kept that one.
- **Listening.** The original's samples aren't readable here, so the comparison rests on the picture and the build's measurements. Someone needs to listen in the game to judge how it sits next to the original; volume and the map's room are not in the build.
- **Spec file.** The spec lives in this session only. I haven't saved it to the reproduce folder; say if you want it written there beside the input.
