The sound is built and checks OK with no warnings: `work:sound/player/pl_step1.wav`, which goes into `<mod>/sound/player/` so the game plays it in the original's place.

The build reads the original's measures from its picture (`pictures/sound.png`), and I compared the made sound against them:

```
Feature              Original (from picture)   Made
Length               0.27 s                    0.274 s
Centroid (brightness) 902 Hz                   994 Hz
Power below 150 Hz   13%                       15%
Power 150-600 Hz     about 60%                 54%
Power 600-2k Hz      about 9%                  11%
Power 2k-5k Hz       about 16%                 18%
Time to fall 20 dB   0.04 to 0.18 s           0.145 s
Crest (peak over RMS) about 21.8 dB            19 dB
```

Every feature is in the range of the game's own step sounds (22 of 22). The sound is a low body tone and a pink-noise heel thump, then a toe click at 0.14 s with a little white hiss, over a short tail.

What I could not do:
- **Listen.** The report can't say how it sounds, so judge it in the game.
- **Match the crest.** It sits about 3 dB under the original's. Loosening the limiter did nothing, because the saturation sets the crest, and I stopped there rather than squash the sound to chase it.
- **Compare against the original's own file.** The input folder is a directory, and the tools here won't read the original WAV, so the comparison rests on the picture's numbers. The picture's label reads 0.27 s, which is the original's length, so I took it to be the original's picture.
