The sound is built and the build says OK: `work:sound/debris/bustmetal1.wav`, 11025 Hz, 8-bit mono, 0.87 s, which is the file the game loads for `debris/bustmetal1.wav`.

I built it from layers and did not use a generated recording. I did not get a reference picture of the original, so the comparison is against the numbers you gave, not its waveform.

**Measured against your figures:**

| Feature | Original | Made |
| --- | --- | --- |
| Length | 0.87 s | 0.87 s |
| Centroid | about 1896 Hz | 1896 Hz |
| Under 150 Hz | 0% | 2.9% |
| 150 to 600 Hz | 10% | 9.7% |
| 600 to 2k Hz | 47% | 52.3% |
| 2k to 5k Hz | 41% | 34.8% |
| Over 5k Hz | 2% | 0.3% |
| Peak | 0.046 s | 0.046 s (instant attack) |
| Fall of 20 dB after the peak | 0.441 s | about 0.52 s, a little slow |
| Silent by | about 0.8 s | about 0.8 s |

**Layers:** a broadband noise hit with a spectrum shaped to the bands and an envelope that peaks at 0.046 s and falls to silence by 0.87 s; and a set of inharmonic ringing bands (modes) at 900 Hz to 4.3 kHz, which give the streaked metallic tone. The upper bands die sooner than the mid band.

**Choices I made:**
- I kept 8-bit, as the original is. The build warns of a faint hiss under the quiet tail, which the original would share.
- I did not use a generated take, so the grain is synthetic. A generated take could get closer on character; that is the next thing to try if the side-by-side listen is not close enough.
- The flatness is 0.35, above the game's metal-hit range of 0.16 to 0.28. Your description says "mostly noisy", so I kept it noisy. Adding tone to lower it moved the band shares off target.
- The 0.87 s length is flagged as long against the class range. That range is a guess for metal hits, and your original is 0.87 s, so I left it.

**Not verified:** how it sounds, and how it plays in the game (volume, the map's room). Listen in the game before you trust the match.

**Leftover files:** three test builds are in the work folder as `work:sound/debris/test_smash.wav`, `test_smash2.wav` and `test_modes.wav`. They are not the game's file and nothing loads them. The tools here can't delete files, so remove them by hand if you don't want them.
