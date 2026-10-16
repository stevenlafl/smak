The sound is built and the build says OK: `work:sound/weapons/sbarrel1.wav`, which takes the game's place when put in `<mod>/sound`. It is 1.04 s, 22050 Hz, mono, 8-bit, and plays once.

I did not have the original file, so every comparison is against your description and the figures you gave, not a side-by-side listen.

| Measure | Original (your figures) | Built |
| --- | --- | --- |
| Length | 1.04 s | 1.04 s |
| Centroid | about 615 Hz | 608 Hz |
| Under 150 Hz | 36% | 37% |
| 150 to 600 Hz | 32% | 32% |
| 600 to 2k Hz | 26% | 24% |
| 2k to 5k Hz | 4% | 7% |
| Over 5k Hz | 1% | 0.4% |
| Attack | full volume at start | 30 ms to peak |
| T20 (time to -20 dB) | not given | 0.80 s |

Left short of the target:
- **Texture:** flatness is 0.034, and the explosion class wants 0.05 to 0.15. The blast take is still too tonal. Adding more grain did not move it.
- **Highs:** 2k to 5k Hz is about 3 points high, inside the 7-point tolerance.
- **Hiss:** the 8-bit depth adds a hiss under the quiet tail. The build warns of this, and I kept 8-bit because the original is 8-bit.
- **Static warning:** a brown-noise rumble layer triggers a warning about steady noise over a recorded take. It is kept because it sets the sub-150 Hz share, and it fades with the envelope.

How it is made: a generated take (seed 0 of the woosh-dflow model, "a metal fuel barrel exploding") is the blast. It is shaped by a high-pass at 150 Hz, a cut at 300 Hz, and a low-pass at 2600 Hz. It is joined by a sub-200 Hz brown-noise rumble, a dense crackle of grains from 400 to 3000 Hz, and a short crack on the attack. Saturation at 4 and a limit at 8 dB crest give the pinned opening.

**Licence:** the take comes from woosh-dflow, whose weights are CC-BY-NC 4.0 (non-commercial). You said that is fine for this test. It would need a different source before any commercial release.

The spec was passed inline and not saved to a file, because I have no file-writing tool here. Re-running it needs the spec text from this session.
