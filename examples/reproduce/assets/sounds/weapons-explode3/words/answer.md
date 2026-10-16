The sound is built and the build says OK: `weapons/explode3.wav`, 22050 Hz, 8-bit mono, 1.3 s, in the work folder at `sound/weapons/explode3.wav`. To use it, copy it to `<mod>/sound/weapons/explode3.wav`, and it takes the place of the game's file.

I could not compare it against the original side by side, because no game folders were given and the work folder has no reference picture. Every number below comes from your description of the original, so the match is measured, not heard. Please listen to it in the game.

```
Measure                    Original (described)    Made
-------------------------  ----------------------  ---------------------
Length                     1.3 s                   1.3 s
Rate, depth                22050 Hz, 8-bit        22050 Hz, 8-bit
Decay (T20, fall of 20 dB) 0.87 s after peak       0.86 s
Power under 150 Hz         37%                     39.3%
Power 150-600 Hz           36%                     36.1%
Power 600-2k Hz            21%                     18.6%
Power 2k-5k Hz             4%                      5.0%
Power over 5k Hz           2%                      1.0%
Centroid                   about 605 Hz            553 Hz (class range 493-739)
Crest (peak over RMS)      class 2.7-8.7 dB        7.6 dB
RMS level                  class -9.2 to -3.2 dBFS -8.1 dBFS
Hits in first third        3                       3 layers, 2 detected as onsets
```

All 22 of the game's explosion features are in range. Power is within 2.4 points of every band.

How it's built, from layers and no generator, so no licence question arises:
- **Body:** one shaped noise layer, held at full level, with a fall to 0 dB at the 0.255 s peak. It is driven hard (saturated) so it is pinned, and low-passed at 4 kHz. Its spectrum darkens over 0 to 1 s, so the highs go first.
- **Hits:** three short crack layers at 0, 0.12 and 0.23 s, with the body dipping between them.
- **Tail:** a fall to about -20 dB at 1.13 s and near silence (-45 dB) at 1.3 s, with no cut at the end.

Three things to know:
- **8-bit hiss:** the build warns that 8-bit adds a hiss under the quiet tail. I kept 8-bit because the original is 8-bit. Drop `bits` for 16-bit if the hiss is a problem.
- **Hit count:** the 3 hits are in the sound, but the onset detector counts 2 of them. The build can't say which is closer to the original's count.
- **Rejected tries:** a crest limiter flattened the tail, and a broadband wash pushed the highs far past their share. Neither is in the final spec.

The spec exists only inline in the build call, not as a file in the work folder. I can save it as a `.json` next to the sound if you want it kept for rebuilding.
