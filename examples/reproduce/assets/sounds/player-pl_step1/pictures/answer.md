The sound is built and the build says OK. It is written to `work:sound/player/pl_step1.wav`, which replaces the game's file of that name when it is put in `<mod>/sound`.

**What it is:** a sample layer from the first woosh-dflow take (seed 0, a generated boot step on a metal plate), cut at its onset. The take is high-passed at 160 Hz twice, with peak filters at 350 Hz (+6 dB), 1.2 kHz (0 dB) and 3 kHz (+6 dB), and a lowpass at 5 kHz. A short 110 Hz sine thump at -5.5 dB sits under it, and a 2 kHz-high white-noise crack at -12 dB is added after the limiter. The finish is a short room (decay 0.2 s, wet 0.08) and a limiter at crest 16 dB. Output is 11025 Hz, 16-bit mono, 0.273 s.

**Against your numbers (the build's measures):**

| Measure | Original | Ours |
| --- | --- | --- |
| Length | 0.27 s | 0.273 s |
| T20 (time to -20 dB) | 0.116 s | 0.105 s |
| Power <150 Hz | 13% | 13.2% |
| Power 150-600 Hz | 60% | 63.2% |
| Power 600-2k Hz | 9% | 10.9% |
| Power 2k-5k Hz | 16% | 12.8% |
| Power >5k Hz | 1% | 0% |
| Centroid | 902 Hz | 712 Hz |

Every band is within 3.2 points of yours, and the build gives no band warning. The centroid is the one clear miss, about 190 Hz low. I could not push it up without throwing the bands off, so I kept the band shares.

**Choices I made that you may want to change:**
- **16-bit, not 8-bit.** The build warns that 8-bit adds a hiss under the quiet tail. Your original is 8-bit, so if you want the exact format, say so and I will switch.
- **The class warnings are not met.** The build says the sound dies sooner than the game's metal steps. Those ranges are for typical steps, and your original's T20 is 0.116 s, so I matched your original rather than the class. The build also says the length is short for a metal step; that is the same reason.
- **The take is generated.** woosh-dflow is CC-BY-NC 4.0, non-commercial. You accepted that for this test, so I have not changed anything over it.
- **The spec is not saved as a file.** It exists only in the build calls. If you want it kept, I can write it into the project.
- **The original's waveform picture was not read.** The Read tool could not reach the picture, so I worked from the numbers in your message.

I have not heard it. Please listen to it in the game, since the build cannot judge how it sounds or how the game's volume and room affect it.
