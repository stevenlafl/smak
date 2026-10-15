The sound is built: `work:sound/debris/bustmetal1.wav`, 11025 Hz, 8-bit mono, 0.87 s. The build says OK with no warnings, and the picture comparison is inside tolerance. I could not listen to it, so the match is by measurement only.

| Measure | Original (from its picture) | Built |
|---|---|---|
| Length | 0.87 s | 0.87 s |
| Onsets | 0 | 0 |
| Attack | sharp | 0 ms |
| T20 (time to fall 20 dB) | 0.24 to 0.7 s | 0.49 s |
| Crest (peak over RMS) | about 12.4 dB | 12 dB |
| Centroid (brightness) | 1896 Hz | 2083 Hz (10% high) |
| 150 to 600 Hz share | 9.6% | 3.8% (within 6 points) |
| 600 Hz to 2 kHz share | 47.3% | 49.9% |
| 2 to 5 kHz share | about 40% (read from the picture's remainder) | 45.6% |

The build is four layers and a finish, with no recording and no generator used, so no non-commercial licence applies. The spec is the one in the last build call: white noise shaped by a spectrum curve for the crack and body, a 2.6 kHz bell ring, a 300 Hz plate thump, sparse 2 to 5 kHz debris, then saturation and a limiter at 12 dB crest.

Things to know:
- The original's picture is the one the report reads, so every figure above comes from that read, not from the original's own samples. The reference file was not found in the game folders, so no side-by-side image of the original was drawn.
- The report still says the length is too long for a metal hit. That comes from the class's typical range (0.37 to 0.86 s); the original's own picture is 0.87 s, so I kept it.
- The centroid is still 10% bright. Pulling it further would have cost the 600 Hz to 2 kHz share, which was already the more important match.
- The file is written to the work folder but not put in a game folder, and the spec is not saved to a file. If you want it reproducible in the repro folder, I can add it there.
