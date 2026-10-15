The sound is built and the build says **OK**: `work:sound/weapons/explode3.wav`, which goes in `<mod>/sound/weapons/` to replace the game's file.

**Measured against your description of the original:**

| Feature | Original (your description) | Built file |
| --- | --- | --- |
| Length | 1.3 s | 1.3 s |
| Format | 22050 Hz, 8-bit, mono, no loop | 22050 Hz, 8-bit, mono, no loop |
| Onset | instant, full level | attack 10 ms |
| Loudness | pinned to about 0.45 s, half by 0.8 s, faint by 1.0 s | sustained to 0.45 s, -6 dB at 0.8 s, -18 dB at 1.0 s, -60 dB at 1.3 s |
| Decay (T20, time to -20 dB) | about 1.0 s | 1.06 s |
| Energy under 150 Hz | 35% | 40% |
| 150 to 600 Hz | 30% | 36% |
| 600 to 2000 Hz | 20% | 13% |
| 2000 to 5000 Hz | 10% | 8.5% |
| Over 5000 Hz | 5% | 2.4% |
| Centroid (brightness) | not given | 700 Hz |
| Flatness (0 tone, 1 noise) | noisy, no tone | 0.107 |

The built file's report says all 22 of its features are in the range of the game's own explosion sounds.

**How it's made:**
- **Body:** a take from the local generator `woosh-dflow` (seed 0), with the attack held full to 0.45 s and then the decay above. It is high-passed at 80 Hz, lifted slightly at 1.5 kHz, and low-passed on a sweep from 8 kHz down to 500 Hz so the highs leave first.
- **Rumble:** a noise layer whose spectrum darkens over time, which gives the falling low tail.
- **Debris grain:** particles in 800 to 4000 Hz, fading over the first second.
- **Crackle and crack:** white noise in the 2 to 5 kHz band for the first half second, plus a short blast crack at the onset.
- **Finish:** saturation at 4 and a limiter at 6 dB crest, which gives the hard-clipped wall at the start.

**Where it falls short:**
- The highs (over 5 kHz and 2 to 5 kHz) are a little under target and the low end is a little over. I stopped there because the remaining tweaks were just shifting the balance back and forth.
- "Clipped hard" is approximated by saturation, not a flat-topped waveform. The built file's crest is 6 dB, so I haven't confirmed the top is literally flat.
- I could not listen to it. Its volume and pitch in the game, and how it sits in the mix, are for you to check by playing it.
- The spec was passed inline and not saved to a file. I can write it to a `.json` in the work folder if you want it kept.

**Licence:** the body comes from `woosh-dflow`, under CC-BY-NC 4.0 (non-commercial). You said you accept the local generators' licences for this test, so I've used it. It would need a different source before any commercial use.
