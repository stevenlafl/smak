The sound is built and the build says OK. It is at `work:sound/weapons/357_shot1.wav`, 22050 Hz, 8-bit mono, 1.059 s long, and it plays once.

The spec is in `work:sound` as a `smak.sound/1` spec with three layers and a finish:

- **Click:** a 3 ms high-passed white-noise snap at 0 s.
- **Blast:** brown-to-white noise starting at 7 ms, shaped so the low end (about 50 to 300 Hz) is strongest and the highs fall off faster as it decays. It is driven hard and held near full scale to about 0.45 s, then falls to -60 dB by the end.
- **Rumble:** brown noise below 350 Hz, starting at 50 ms, for the low tail.
- **Finish:** saturation of 4 and a limiter at a crest of 7 dB, which gives the clipped, gritty wall. I left out the room reverb because it pushed the length to 1.19 s. The map's own room sound will add its echo in the game.

What the report measures: attack 10 ms, T20 (time to fall 20 dB) 0.95 s, T40 (time to fall 40 dB) 1.01 s, centroid 1129 Hz, and most of the power between 150 and 600 Hz. Against the game's gunshot sounds, 21 of 22 features are in range.

The one feature out of range is flatness: 0.23, where the game's gunshots sit at 0 to 0.2 and the report says "more tone". I left it. Your description says the original has no tone at all, so I kept the sound entirely noisy rather than adding a tonal ring to hit that range. If you'd rather match the game's own gunshots on that measure, a low `modes` ring would do it.

I did not compare it against the original file, which I don't have here. Judge the side-by-side in the game, since the report can't say how it sounds or how loud it plays.
