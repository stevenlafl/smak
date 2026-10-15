The sound is built and the build says **OK: built, and every check passed**. It is written to `work:sound/weapons/cbar_hit1.wav`, so it takes the place of the game's own file of that name.

**Final numbers (ours vs the original, as the report read them off its picture):**

| Measure | Ours | Original | Off by |
|---|---|---|---|
| Length | 0.69 s | 0.69 s | 0% |
| Rate and depth | 11025 Hz, 8-bit mono | 11025 Hz, 8-bit | none |
| Centroid | 1337 Hz | 1467 Hz | 9% (aim within 15%) |
| Band 600-2k | 75.6% | 68.9% | 6.7 points (aim within 7) |
| Band 2k-5k | 21.3% | 18.8% | 2.5 points |
| Band 150-600 | 2.6% | 8.4% | 5.8 points |
| T20 | 0.274 s | range 0.24 to 0.7 s | inside range |
| Crest | 9 dB | about 9.8 dB | within 3 dB |
| Onsets | 0 | 0 | none |

Against the game's own metal-hit sounds, all 22 features are in range. The report flagged no warnings.

**How it is made:** a short high-passed noise click for the strike, a band-passed noise clang and a hiss for the bright ring, a low body noise and a mid-band noise for the body, and a modal ring at 760 Hz for the tone. The finish is saturation 1.5 and a limiter at crest 9. I left out the room reverb: it pushed the length past 0.69 s, and the map's `env_sound` adds the room anyway. I did not add variants (`cbar_hit2`), since you didn't ask for them.

**What I could not check:**
- I could not open the original's picture myself. The render and read calls failed on it. I worked from the numbers the build read off that picture, so the match is measured, not heard.
- Nothing here says how it sounds to a person, or how the game plays it (volume, pitch, the map's room). Please listen in the game next to the original before calling it done.
