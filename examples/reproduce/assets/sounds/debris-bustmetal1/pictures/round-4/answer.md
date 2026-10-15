The sound is built and the build says OK. It is in `work:sound/debris/bustmetal1.wav`, which is the path the game loads in place of its own file. I could not listen to it, so this is judged on the numbers and the picture only, and it still needs an ear check in the game.

The spec is in the chat, not saved to a file. I did not write it into the reproduce folder because you didn't ask for that.

**Final numbers against the original's picture** (the figures the report reads off the picture):

| Measure | Made sound | Original (from picture) | Off by |
| --- | --- | --- | --- |
| Length | 0.869 s | 0.87 s | 0% |
| Centroid (the brightness centre) | 1955 Hz | 1896 Hz | 3% |
| Power, 600 Hz to 2 kHz | 52% | close to picture | 5 points |
| Power, 2 to 5 kHz | 39% | close to picture | within 5 points |
| T20 (time to -20 dB) | 0.54 s | 0.24 to 0.7 s range | in range |
| Crest (peak over RMS) | 10.1 dB | about 12.4 dB | -2.3 dB, within the 3 dB tolerance |
| Peak | -0.6 dBFS | | |

**The spec's approach:** a bright white-noise crack at the onset, a body of noise shaped by a spectrum curve (100 Hz to 8 kHz) that decays over 0.45 s, a particle rattle from 1.5 to 6 kHz for the debris texture, and a short 1.4 kHz plate ring for tone. The finish is a saturation of 1.5 and a limiter at a 9 dB crest. The class is `metal hit`, which is the closest available class.

**Where it still misses the class range:**
- **Flatness** is 0.65 against the metal hit range of 0.16 to 0.28. The picture shows a broadband, noisy original, so I matched that over the class. Pushing the ring harder for tone moved the flatness only a little and pulled the centroid down, so I left it.
- **Length** is flagged "too long" against the class range of 0.37 to 0.86 s. The original is 0.87 s, so I kept the length the original has.

I tried about nine versions. The first three were too dark with too short a decay, the next few were too bright, and the last few settled the balance above.
