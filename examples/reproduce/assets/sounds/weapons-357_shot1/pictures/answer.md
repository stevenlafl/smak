The sound is built and the build says OK. It is at `work:sound/weapons/357_shot1.wav`, ready to go in `<mod>/sound/weapons/`.

The final build reads 22050 Hz, 16-bit mono, 1.06 s, peak -0.5 dBFS, crest 8 dB. Against the original's picture:

| Feature | Made sound | Original (read off picture) |
| --- | --- | --- |
| Length | 1.06 s | 1.06 s |
| Centroid | 974 Hz | 921 Hz (6% off) |
| T20 | 0.923 s | within 0.458 to 1.013 s |
| Under 150 Hz | 17.2% | 21.1% |
| 150 to 600 Hz | 25.6% | 25.6% |
| 600 Hz to 2 kHz | 45.8% | not stated |
| 2 to 5 kHz | 10.7% | not stated |
| Crest | 8 dB | about 10 dB (within 3 dB) |

The game's gunshot class check passes 22 of 22 features. The build raised no warnings.

What I built, in short: a sharp white-noise crack above 2.5 kHz, a sine boom falling from 120 Hz to 40 Hz, a pink-noise body band-passed at 800 Hz, and a low-passed tail. The finish is saturation 3 and a limiter at 8 dB crest. I left out the room, since the map's own `env_sound` adds it.

Limits to know about:
- **It is matched to the picture, not the recording.** The input folder holds only the picture and a facts file, so I could not measure the original's samples. Its finer detail (grain, exact ring) is not reproduced.
- **No side-by-side reference was drawn.** The game's original file isn't on this server, so the `reference` field had nothing to read.
- **Listen in the game.** The report can't say how it sounds or how loud it plays.
- **The spec is inline only.** I didn't save it as a file in the project. Say if you want it written into the reproduce folder so the build can be rerun.
