The sound is built and passes (`OK: built, and every check passed`). It is at `work:sound/weapons/cbar_hit1.wav`, ready to go in your mod's `sound/weapons/` folder. I can't hear it, so the side-by-side listen is still yours to judge.

The final spec is saved with the build as `work:weapons_cbar_hit1.spec.json`, so it can be rebuilt without repeating the tuning.

**Measures against the original (numbers read off its picture, which may be a few points off):**

```
measure            original (picture)   copy
length             0.69 s               0.694 s
attack             0 ms (loud at start) 0 ms
T20 (decay)        0.24 to 0.7 s        0.244 s
centroid           1467 Hz              1504 Hz (3% off)
600 Hz to 2 kHz    68.9%                75.9% (7 points off)
flatness           class 0.16 to 0.28   0.163
crest              about 9.8 dB         10.9 dB
class features     -                    22 of 22 in range
```

**How it's made:** pure synthesis, no recording. Each layer is a filtered noise burst or a struck-bar ring at 1 kHz, with a short crack added after the finish so the hit lands at 0 s. Level and tone were set against the picture's numbers.

**Choices you may want to change:**
- **8-bit kept**, to match the original's format. The build warns that 8-bit adds a hiss under the quiet tail. Changing `bits` to `16` removes it; the sound otherwise stays the same.
- **Crest limiter at 12 dB**, not 10. At 10 the early part was squashed and the hit started late.
- **Generated takes tried and dropped.** I made four clang takes with woosh-dflow (CC-BY-NC, non-commercial). Two were real hits, but both were far too bright (centroid 3.1 to 3.3 kHz) and a low-pass on the take did not bring them down. The final file uses no generated take, so it carries no non-commercial licence. Take 2 is still in the work folder if you want real grain later.
- **Not done:** the variant `cbar_hit2` (not asked for).

**Left in the work folder:** about 12 scratch builds under `work:sound/diag/` and `work:diag_*.spec.json`. My tools can't delete files, so you'll need to remove them, or tell me to move them somewhere.
