The sound is built and the build says OK: `weapons/cbar_hit1.wav` is in the work folder under `sound/weapons/`, ready to go in a mod's `sound` folder in its place. One class feature is still off, and I can't confirm the original's flatness because the picture doesn't report it.

**Measured against the original's picture (the original's numbers are read off its picture, which is approximate):**

```
measure               original (picture)    copy
length                0.69 s                0.696 s (1% off)
centroid (brightness) 1467 Hz               1360 Hz (7% off)
600-2k band           68.9%                 73.3% (4 points off)
2k-5k band            18.8%                 22.1%
T20 (time to -20 dB)  0.24 to 0.7 s range   0.409 s (in range)
crest (peak over RMS) about 9.8 dB          10.2 dB
```

**Against the game's metal-hit sounds:** 21 of 22 features in range. The one still out is flatness (how noise-like it is): 0.106 against the class range of 0.16 to 0.28. Dense grain barely moved it. The tonal take and the ring dominate the measure, and I ran out of cheap levers before fixing it.

**What the spec does (the final build):**
- A generated take (woosh-dflow seed 0, "a steel crowbar striking a metal pipe…") from its onset, high-passed at 120 Hz and low-passed at 2.2 kHz, with a 1.0 s decay.
- A 760 Hz bar-mode ring at −20 dB, for the sustained line in the original's spectrogram.
- A low sine body sweeping 220 to 140 Hz at −19 dB, for the 150 to 600 Hz energy.
- 800 short grains (300 to 2000 Hz) at −1 dB, for the grit.
- Finish: saturate 1.5, room decay 0.35 s at 15% wet, limiter at a crest of 8 dB, peak at −0.5 dBFS.
- 11025 Hz, 8-bit, mono, to match the original. The build warns that 8-bit adds hiss under a quiet tail. I kept it because the original is 8-bit; leaving bits out gives a 16-bit file if you prefer it.

**Licence:** the take comes from woosh-dflow, whose weights are CC-BY-NC 4.0 (non-commercial). You said you accept the local generators' licences for this test; any real mod release would need that decision made again.

**Not checked here:** how it sounds to a person, its volume in the game, and the mix. Listen to it in the game beside the original before calling it done.

**Open:** flatness is the one class feature still out, and it may be the first thing a listener hears as "too clean". The next attempt would be a second take with more noise in the onset (seed 2 is the other sharp hit), or a shorter tonal ring.
