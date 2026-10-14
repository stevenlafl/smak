I built `player/pl_step1.wav` and the build says **OK**. The engine checks all passed, and all 22 measured features fall within the range of the game's own concrete footsteps. It took three builds: the first two were in range on only 19 and then 17 of the 22.

**The file:** 0.27 s, 11025 Hz, 8-bit, mono, plays once. Its peak is -0.6 dBFS and its peak-to-average ratio (crest) is 17 dB.

**How the description maps onto the layers:**
- **Heel strike:** starts instantly (0 ms attack). Its loudest part is in the first ~18 ms, it's down to about a fifth by 0.04 s, and it's gone by 0.1 s. The spectrum is brightest when it lands and darkens as it decays.
- **Scuff:** a few short spikes at 1.8 to 5 kHz in the first 22 ms. These are the jagged rattle and give the click its edge.
- **Toe tap:** arrives at 0.08 s, 12 dB under the heel (about a quarter as loud), and dies in about 20 ms. Its spectrum also darkens as it fades.
- **Tail:** faint grit from 0.1 s that fades out by 0.27 s.

**Where the energy sits:**

```
band        share
<150 Hz     18.4%
150-600     57.6%   (the thump)
600-2k      12.9%
2k-5k       10.9%   (presence)
>5k          0.3%
```

The average brightness (centroid) is 688 Hz, and the noisiness (flatness) is 0.24, so it reads as noise with no pitch.

**Two things to check by eye:**
- The report counted 0 onsets, so its detector doesn't count the toe tap as a second hit. It shows clearly in the waveform, though.
- In the waveform the toe peak looks closer to a third of the heel's than a quarter. If the side-by-side comparison is strict on that, the fix is 2 to 3 dB less gain on the toe.

The file is in `work:sound/player/pl_step1.wav`. To replace the game's sound, put it in `<mod>/sound/player/`. The tools can't tell how it sounds or how it plays in a map's room, so it's worth listening to in the game.
