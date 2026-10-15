The sound is built and the build says OK: `work:sound/weapons/sbarrel1.wav`, 22050 Hz, 8-bit mono, 1.04 s, one shot with no loop. Measured against the game's gunshot sounds, all 22 features are in range. Your original's file isn't in the folders I can read, so the comparison is against the class ranges, not against that file.

| Measure | Original (your description) | Made sound |
| --- | --- | --- |
| Length | 1.04 s | 1.04 s |
| Format | 22050 Hz, 8-bit, mono | 22050 Hz, 8-bit, mono |
| Attack | full scale in a few ms | 55 ms to full scale |
| T20 (time to fall 20 dB) | about 0.46 to 1.01 s (class range) | 0.65 s |
| Centroid | dark, mostly 50 to 500 Hz | 1179 Hz (class range 421 to 1258) |
| Power under 150 Hz | most of the energy | 24.7% |
| Power 150 to 600 Hz | body | 30.5% |
| Power 600 to 2k Hz | | 23.7% |
| Power 2k to 5k Hz | | 17.7% |
| Power over 5k Hz | highs gone by 0.3 s | 3.4% |
| Crest | Valve gunshot range 4.5 to 11.7 dB | 10.6 dB |

How it is built, all in one spec:
- **Crack:** white noise high-passed at 150 Hz and low-passed at 4 kHz, with a fast decay from the onset, about -18 dB at 0.4 s and -28 dB at 0.6 s.
- **Body:** a band-passed noise at 300 Hz, driven to add grit, decaying over about 1 s.
- **Boom:** a sine at 110 Hz sweeping down to 55 Hz, decaying in 0.3 s.
- **Thump:** brown noise low-passed at 300 Hz, the low rumble that carries the tail.
- **Click:** a short high-passed burst for the crack's bite.
- **Finish:** saturation at 8, peak at -0.5 dBFS, no limiter.

What is not matched:
- **Attack.** The attack is 55 ms, not a few milliseconds. The spectral shape I use to shape the crack starts with a short fade-in in the generator. The layers that start instantly all made the spectrum too bright, or too flat, for the class. I kept the spectrum in range and accepted the slower attack. Ask me and I can trade some brightness for a faster attack.
- **Limiter.** I tried a peak limiter for the crest. It flattened the tail, so the decay stopped falling. I dropped it.
- **Not listened to.** The report can't say how it sounds, only how its numbers compare. Listen in the game, since the map's room and the mix will change how it lands.

The spec exists only in this conversation, not as a file in the work folder. I can save it as a `.json` next to the `.wav` so it can be rebuilt.
