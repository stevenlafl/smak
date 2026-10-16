The sound is built and the build says OK: `work:sound/doors/doormove1.wav`. It is 11025 Hz, 8-bit, mono, and plays once. I have not listened to it, so the judgement of how it sounds is still yours.

Measured against the figures you gave:

```
Measure          Original    Made
Length           5.04 s      5.015 s
Centroid         589 Hz      573 Hz
<150 Hz          30%         27.4%
150-600 Hz       38%         44.6%
600-2k Hz        28%         23.8%
2k-5k Hz         4%          4.3%
>5k Hz           0%          0%
```

How it's made:
- **Grind:** a take from the local generator woosh-dflow (seed 0, prompted as a heavy sliding gate on a track with rollers, motor drone and squeal). It is shaped with EQ toward the band split, a 0.1 s fade-in, a swell to full at 4.1 s, and a fade over the last half second.
- **Squeal:** five short triangle sweeps from 320 to 470 Hz, at 0.3, 1.3, 2.4, 3.0 and 4.0 s.
- **End pulse:** a fast train of short crackles from 4 s to the end.

Things that differ from the original:
- **Length:** 15 ms short of 5.04 s. The take is exactly 5 s, and I could not pad it without changing the pitch.
- **8-bit:** you asked for it, so the build's warning about hiss under the quiet tail is accepted as it is.
- **Band split:** the 150-600 Hz share is about 7 points high. I tried harder cuts and they pushed it further out, so I kept the setting with the least error.
- **Squeal and pulse:** approximations. Their timing matches your description but they were not tuned against the original's real arcs.
- **Class:** the kit has no door class, so the build did not score it against the game's own sounds.

Licence: the take comes from woosh-dflow, whose weights are CC-BY-NC 4.0 (Creative Commons, non-commercial). You accepted that for this test. The build report flags the sound as non-commercial, so it should not go into a commercial mod without a decision on that.

The spec was passed inline in the build call and is not saved as a file, since I have no tool to write one. The take it depends on is `work:gen/doors_doormove1_s0.wav`, so keep that file if you want to rebuild it. To use the sound in the game, copy it to `<mod>/sound/doors/doormove1.wav`. I don't know your mod's folder path, so I haven't placed it.
