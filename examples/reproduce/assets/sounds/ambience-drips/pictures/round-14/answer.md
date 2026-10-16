The sound is built and says OK: `work:sound/ambience/drips.wav`, which takes the place of the game's own file when put in `<mod>/sound`. I did not listen to it, so the judging ear is still needed.

**What it is:** a looped 7.36 s file at 11025 Hz, mono, with a cue point at its start. It is eight struck drops (plink tones with a short downward chirp) at the hit times I read off the picture, over a faint grain bed in the 100-600 Hz range that falls with the same curve as the original. The eight hit times are my estimates from the waveform, so they will be a little off.

**Against the original, by the kit's measures:**

| Measure | Original (picture) | Made | Status |
| --- | --- | --- | --- |
| Length | 7.31 s | 7.36 s | within 1% |
| Centroid | 795 Hz | 904 Hz | 14% high (inside the 15% aim) |
| Power <150 Hz | 1% | 1.3% | ok |
| Power 150-600 Hz | 22% | 26.4% | 4 points off |
| Power 600-2k Hz | 74% | 71% | ok |
| Power 2k-5k Hz | 2% | 1.3% | ok |
| Power >5k Hz | 1% | 0% | ok |
| T20 (decay to -20 dB) | about 6.2 s | 5.05 s | not in range check |
| Loudness (RMS) | not given | -22.3 dBFS | 2 dB over the class range |
| Flatness | not given | 0.04 | just under the class range (too pure) |

The build reports no warnings and no faults.

**Choices I made that you should know about:**
- **16-bit, not 8-bit.** The original is 8-bit. The kit warned that 8-bit adds a hiss under the quiet tail, so I used 16-bit. The sample rate and length match the original.
- **No recording used.** The generator's four takes were hiss-floored, not clean drips, and capped at 5 s, so I dropped them. The output contains no generated audio, so the non-commercial licence of the generator does not apply to this file.
- **Not a copy.** I built it from layers and read the target numbers off the original's picture. I did not have the original's samples to compare against directly.

**Known gaps:** the flatness is a little too pure and the loudness a little hot. Adding noise to fix the flatness would have added static, which the kit warns against, so I left it. The decay is a little faster than the original, because the drops ring shorter.
