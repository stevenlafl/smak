The sound is built and the build says OK: `work:sound/weapons/cbar_hit1.wav`, ready to go in a mod's `sound` folder in place of the game's file of that name. I can't listen to it, so the judgement against the original is by measurement only.

The build ran on layers alone. I tried one generated take as the crack layer, from a text-to-sound model (woosh-dflow, non-commercial licence). It changed none of the measures, so I left it out and the file needs no licence beyond the local generators.

| Measure | Original (picture) | Built |
| --- | --- | --- |
| Length | 0.69 s | 0.71 s (3% long) |
| Centroid (brightness) | 1467 Hz | 1617 Hz (10% high) |
| 600 Hz to 2 kHz band | 68.9% | 66.7% |
| Crest (peak over average) | about 9.8 dB | 9.5 dB |
| Attack | instant | 5 ms |
| Game class (metal hit) | 22 features checked | 21 of 22 in range |

The one miss is flatness (how noisy against tonal), 0.126 against the game's 0.16 to 0.28 range. I tried flattening the top of the spectrum to raise it, but that pushed the centroid to 2.3 kHz and moved the 600 Hz to 2 kHz band off the original's, so I kept the closer version.

The spec is written only in this conversation and not saved to the project; say if you want it kept as a `.json` beside the build.

Two things I could not do:
- The original's own flatness and spectrum could not be measured: the reference path is not in the game folders the server was given, so the comparison is against the original's picture only.
- The picture is only a reading of the original, so the match is as close as its readings allow.
