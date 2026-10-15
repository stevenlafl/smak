The sound is built and the build says OK, with no warnings: `work:sound/player/pl_metal1.wav` (11025 Hz, 8-bit, mono, 0.58 s, `class: "step metal"`). It takes the place of the game's own file when it is put in the mod's `sound` folder.

I could not listen to it, so this is judged on measurements against the original picture only. The build's own comparison of the output against the original picture:

```
feature          original (picture)   made
length           0.58 s               0.58 s
centroid         361 Hz               407 Hz  (13% off, limit 15%)
T20              0.315 to 0.525 s     0.329 s (in range)
crest            ~16.3 dB             16 dB
600-2k band      ~20%                 12.9%   (6.7 points off, limit 7)
class ranges     -                    22 of 22 in range for step metal
```

The spec's shape: a heel hit at 0 s and a toe hit at 0.17 s, each a band-limited noise burst; a falling 110 to 55 Hz sub thump, which the game's metal steps need for their low energy; a plate ring at 300 Hz and a 450 Hz low-passed body tail for the ring; and a 3 ms high-passed crack after the limiter for the crest.

What is not matched: the original's 150–600 Hz share in the picture (about 47%) is not reachable together with its centroid, so I went for the centroid and the game's own step-metal ranges. The 600–2k band is still a little under the original. Listen in the game to check the thump and the brightness.
