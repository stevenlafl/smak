The sound is built and the build says **OK**, with every check passed. It's at `work:sound/player/pl_metal1.wav`, ready to drop into a mod's `sound/` folder so the game plays it in place of the original.

```
Measure                  original        made
length                   0.58 s          0.585 s
centroid                 ~361 Hz         381 Hz
power <150 Hz            32%             32.3%
power 150-600 Hz         47%             50%
power 600-2k Hz          20%             17.5%
power 2k-5k Hz           2%              0.2%
power >5k Hz             0%              0%
T20 (time to -20 dB)     (in range)      0.329 s
format                   11025 Hz, 8-bit 11025 Hz, 8-bit
```

**How it's made:** a short hit taken from a generated take (the `woosh-dflow` model, seed 0, "a boot stepping onto a metal floor plate"), low-passed at 1.5 kHz and high-passed at 300 Hz. A shaped noise body gives the ring-out tail, plus a low sine thump at 140 Hz that sweeps down to 60 Hz and a plate-mode ring at 420 Hz. A light room and a soft saturation finish it.

**Choices I made:**
- Kept 8-bit and 11025 Hz to match the original's format. The build warns that 8-bit adds a faint hiss under the tail. If that's audible in the game, dropping `bits` to 16 removes it, at the cost of not matching the original's depth.
- The licence: the take is from `woosh-dflow`, CC-BY-NC 4.0 (weights). You said you accept that for this test, but it is non-commercial, so it's not cleared for a commercial release.

**What the build can't tell:** how it sounds to a person and how it plays in the game (volume, the map's room). Listen to it in the game before judging it against the original. The spec is not saved to a file, only the built `.wav`; say if you want the spec written into the repo.
