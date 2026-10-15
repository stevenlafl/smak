The sound is built and the build says OK: `work:sound/doors/doormove1.wav`. Copy it into your mod's `sound/doors/` folder to replace the game's file. I have not listened to it, and I could not compare it side by side with the original, because I don't have the original file. Everything below is measured against your description, not against the recording.

**What it is made from**
- **Scrape (the body):** the take from woosh-dflow, seed 5 (`work:gen/doormove1b_s5.wav`). It is the best match of the eight takes on the energy split. Its envelope gives the 0.1 s fade-in, the steady level, the swell at 4.0 to 4.5 s, and the 0.4 s fade to silence at the end.
- **Grit:** white noise high-passed at 700 Hz and low-passed at 4.5 kHz, at -30 dB, for the granular scrape.
- **Squeal:** four short upward sweeps (360 to 560 Hz) at 0.05, 1.25, 2.45 and 3.7 s, at -24 dB. Your description puts them near 0.2, 1.4, 2.6 and 3.8 s; I moved them slightly earlier, so the arcs repeat every 1.2 s rather than 1.25 s.
- **Judder:** a train of pulses 30 to 50 ms apart in the 150 to 1500 Hz band, from 4.0 s.
- **Thump:** a sine that falls from 110 to 50 Hz, from 4.0 s.

**Settings**
- 11025 Hz, 8-bit, mono, as the original.
- Sample taken from 0.08 s, so the take's leading silence is cut.
- No `class` is set. The list has no door class, so the build made no class comparison.

**Measured against your energy split**

| Band | Original | Built |
| --- | --- | --- |
| under 150 Hz | 20% | 30% |
| 150 to 600 Hz | 35% | 31% |
| 600 to 2000 Hz | 30% | 20% |
| 2000 to 5000 Hz | 13% | 18% |
| over 5000 Hz | 2% | 0.1% |

The low end is about 10 points heavy and the upper-mid end about 5 points heavy. The 600 to 2000 Hz band is short. I stopped there because the build passed and each change I tried pushed another band out.

**Licence:** the woosh-dflow model is CC-BY-NC 4.0 (non-commercial). You said that is acceptable for this test. It would need a different source before any commercial release.
