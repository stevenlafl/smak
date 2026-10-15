`ambience/drips.wav` is built: the final build says OK, with no faults, and the file is in `work:sound/ambience/drips.wav`. It's 7.31 s, 11025 Hz, 8-bit mono, with a loop cue at its start. The spec is layers only, with no generator take, so no licence question arises.

It matches the original's facts: five drops at 0.06, 1.87, 3.68, 3.97 and 5.84 s, with the 3.68 and 3.97 s drops 6 dB softer. Each drop has a click, a sharp body, a short sine bloop that rises from 480 to 560 Hz, and a faint 560/650 Hz ring. A pink hiss bed runs under the whole loop.

The spectrum is not on target yet:

```
Band          target   built
< 150 Hz        15%      2.8%
150-600 Hz      35%     42.8%
600-2000 Hz     30%     50.9%
2000-5000 Hz    18%      3.1%
> 5000 Hz        2%      0.4%
```

- The build reports 18 of 20 features in the game's range for this class. Flatness (0.099) and loudness (-25 dBFS RMS) are in range. The misses are the 150–600 Hz and 600–2000 Hz shares, and 2–5 kHz and the low band sit well under target.
- I tried to fix the bands by moving the bed, the drop bandwidth and the tonal levels. Each change shifted the mix toward either the bottom or the top, and none got all five bands close. The bed alone shaped to the target gave 19 / 43 / 29 / 8.5 / 0.4%, so the drops are likely pushing the middle up. I did not find the lever that fixes it.
- I could not hear it. Judge the drop character and the loop seam in the game.

Things to know:
- Three scratch files are left in `work:sound/scratch/` (`nobloop.wav`, `bedpink.wav`, `bedshape.wav`). They are not part of the sound. My tools cannot delete files, so remove that folder by hand.
- The first drop was briefly lost while I tuned the loop crossfade. The final build has the drop at 0.06 s and the loop seam at 0.05 s.
