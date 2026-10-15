The sound is built and the build says OK: `work:sound/weapons/sbarrel1.wav`, to go in `<mod>/sound/weapons/` so the game plays it in place of the original.

**What it is:** 1.04 s, 22050 Hz, 8-bit, mono, played once. It is made entirely from layers: no recording was used, so no generator licence applies.

**Layers**

| Layer | Role |
| --- | --- |
| Crack | High-passed noise at 0 s, plus a second at 0.03 s for the two barrels |
| Blast | Broadband noise, heavy at the bottom, clipped by the finish. Its spectrum falls after 0.5 s so the highs die first |
| Thump | Sine sweeping 110 to 45 Hz, plus a steady 62 Hz body tone |
| Crackle | Sparse particles from 0.2 s to 1.0 s, fading |

Finish: saturate 3, limiter at 8 dB crest, peak -0.5 dBFS.

**Measured against your description**

| Band | Target | Built |
| --- | --- | --- |
| Under 150 Hz | 35% | 36.9% |
| 150 to 600 Hz | 30% | 32.5% |
| 600 to 2000 Hz | 20% | 17.9% |
| 2000 to 5000 Hz | 10% | 8.8% |
| Over 5000 Hz | 5% | 3.9% |

Other figures: T20 0.92 s and T40 1.01 s; the first 0.4 s is at full level; the level falls steeply from 0.4 to 0.6 s. The build checks the file against the game's gunshot sounds and reports 22 of 22 features in range.

**Things to know**

- **8-bit hiss:** the build warns that 8-bit adds a hiss under the quiet tail. You asked for 8-bit, so I kept it. Removing `"bits": 8` gives a 16-bit file with no hiss, which is the safer choice if the 8-bit depth is not a hard requirement.
- **No side-by-side:** the original's file is not on this machine, so I could only compare against your written description and the game's gunshot class, not against the original itself.
- **Clipping:** the first 0.4 s is held at the limiter's ceiling and fills the top of the spectrogram, but the peak is -0.6 dBFS rather than hard-clipped at 0 dBFS. If your listening test needs literal flat tops, the finish would need changing.
- **Not checked by the build:** how it sounds to a person and how the game plays it. Listen to it in the game before judging it against the original.
