The sound is built and the build says **OK**: `work:sound/weapons/sbarrel1.wav` (22050 Hz, 8-bit, mono, 1.04 s, one hit, no loop). Copy it into `<mod>/sound/weapons/` to replace the game's file.

Measured against your description of the original:

| Measure | Original (your description) | Made | Status |
| --- | --- | --- | --- |
| Length | 1.04 s | 1.04 s | matches |
| Sample rate, depth | 22050 Hz, 8-bit | 22050 Hz, 8-bit | matches |
| Fade to -20 dB after peak | 0.604 s | 0.688 s | close |
| Centroid | about 615 Hz | 607 Hz | close |
| Under 150 Hz | 36% | 34.2% | within 2 points |
| 150 to 600 Hz | 32% | 32.4% | within 1 point |
| 600 to 2k Hz | 26% | 27.3% | within 2 points |
| 2k to 5k Hz | 4% | 5.7% | within 2 points |
| Over 5k Hz | 1% | 0.4% | within 1 point |
| Crest (peak over RMS) | not given | 8 dB | class range is 2.7 to 8.7 |
| Flatness | not given | 0.038 | class range is 0.05 to 0.15, slightly too pure |

How it's built:
- **Burst:** white noise shaped by a spectrum that falls with frequency and darkens over time. It starts at full level, is near clipping for the first 0.4 s, then drops 20 dB by 0.6 s and is near silent at 1.0 s.
- **Grit:** a train of short bursts between 800 and 3000 Hz in the first 0.4 s.
- **Crack:** a short high-passed spike near 0.02 s for the sharp transient.
- **Finish:** a peak limiter at 8 dB crest. No reverb, since the original's tail is dry in your description and reverb lengthened the file.

Remaining differences:
- **Attack:** the tool reports 0.165 s to peak, not the near-instant onset you describe. I tried stronger spikes at 0 s, but they pushed the tail shorter and the body quieter, so I kept the milder version. The waveform does open at full level.
- **Flatness:** 0.038 against a class range of 0.05 to 0.15. Adding grit to fix it also pushed the tail shorter, so I left it.
- **Depth warning:** the tool warns that 8-bit adds hiss under the quiet tail. I kept 8-bit because your original is 8-bit.

The spec was passed inline and is not saved as a `.json` file in the work folder, so the sound can't be rebuilt from a file yet. I can save it beside the build if you want it reproducible. No generator takes were used, so no licence applies.

Nothing here was heard. Listen to it in the game, where the map's room and the volume it plays at both change how it sounds.
