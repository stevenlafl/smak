The sound is built and the build says OK: `work:sound/weapons/sbarrel1.wav`, 22050 Hz, 8-bit mono, 1.04 s, no loop. Copy it to `<mod>/sound/weapons/` so the game plays it in place of its own file. I have not heard it, and the tool can't say how it sounds. The numbers below are the tool's readings, so listen to it in the game before you trust them.

It is built from layers only, with no recording in it. I generated four takes with woosh-dflow (a non-commercial model, which you accepted). They were too dark and not clipped: 64 to 85% of their energy sat under 150 Hz, against a target of 35%. None of them went into the file, so the non-commercial licence does not apply to the output.

Measured against the original's targets:

```
Measure              Target            Made
length               1.04 s            1.04 s
rate, bits           22050, 8-bit      22050, 8-bit, mono
under 150 Hz         35%               41%
150 to 600 Hz        30%               28%
600 to 2000 Hz       20%               18%
2000 to 5000 Hz      10%               9%
over 5000 Hz         5%                4%
T20 (to -20 dB)      falls 0.4 to 0.6 s,  0.57 s
                     silent by 1.04 s
T40 (to -40 dB)      -                    0.86 s
crest (peak/RMS)     6 to 10 dB (class 4.5 to 11.7)   10.8 dB
flatness             low, noisy           0.19 (class 0 to 0.2)
attack               instant              15 ms
```

The tool reports 22 of 22 features in the range of the game's own gunshot sounds. The attack of 15 ms is the tool's reading, not zero. The waveform starts at full level, but the measure reads a few milliseconds of build-up. The sound's last samples are one 8-bit step (the smallest level 8-bit audio can hold), so it is silent by ear before 1.04 s.

What the layers do:
- **Slab:** shaped noise pinned by saturation for the first 0.4 s, then a steep fall to silence by about 0.7 s.
- **Double crack:** a high-passed noise transient at 0 s, and a second at 0.03 s, a little quieter.
- **Thump:** a sine sweeping from 110 Hz down to 45 Hz, over the first second.
- **Tail:** low-heavy noise and crackle from 0.4 s to the end.
- **Roar:** 600 to 5000 Hz particles, for the grit in the first half.

Two things I found while building, which may matter if you change it:
- A peak limiter or a layer's `drive` lifts quiet tails back to full level, so the decay never came down. I dropped both and used the finish's `saturate` alone.
- Parts added after saturation (the thump, tail, roar and cracks) keep the pinned slab looking clipped. Parts added before it dent the clipping.

The spec was saved beside the sound as `work:weapons_sbarrel1.spec.json` by the build.
