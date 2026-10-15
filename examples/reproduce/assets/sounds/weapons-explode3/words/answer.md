The sound builds OK and every check passed. It is at `work:sound/weapons/explode3.wav`, 22050 Hz, 8-bit mono, 1.3 s. To use it, copy it into `<mod>/sound/weapons/` so it takes the place of the game's own file.

I could not compare it with the original. The reference file `weapons/explode3.wav` was not in any game folder the server was given, so the check ran against the description you gave, not the real sound. Against the kit's set of game explosion sounds, all 22 measured features are in range.

| Measure | Result | Target from your description |
| --- | --- | --- |
| Start | Full scale at the first sample, no fade-in | Same |
| Plateau | Pinned and clipped to about 0.4 s | Same |
| T20 (time to -20 dB) | 0.93 s | Fits a fade that is about a third of full scale by 0.8 s and quiet by 1.1 s |
| Centroid | 497 Hz | Dark, low-weighted |
| Flatness | 0.05 | Noisy, with no tonal part |
| Power below 150 Hz | 33% | Strongest part under 300 Hz |
| Power 150 to 600 Hz | 46% | Heavy low-mid body |
| Power 600 Hz to 2 kHz | 16% | Gritty crackle, weaker than the lows |
| Power 2 to 5 kHz | 4% | Highs present but weaker |
| Power above 5 kHz | 0.7% | Highs die fastest |

The spec has three parts:
- **Blast:** broadband noise shaped to the low end, with a steady treble roll-off that gets stronger after 0.7 s. Its loudness follows a decay from full scale at the start to -9.5 dB at 0.8 s, -20 dB at 1.1 s and -42 dB at 1.3 s.
- **Crackle:** short grains of noise between 300 Hz and 2 kHz, which give the bursty grain inside the body.
- **Finish:** a hard saturation of 6 to pin the start, and a limiter with a crest of 8 dB.

The spectrogram shows the drop in the highs after about 0.7 s, and the waveform shows the full-scale start.

I did not use a generated take. The description is of a noise blast with no tonal part, so layers of noise were the closer match. Nothing was copied into a game folder. Listen to it in the game: the kit cannot judge how it sounds, its volume, or the map's room.
