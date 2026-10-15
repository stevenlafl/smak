The sound is built and the build says OK: `work:sound/doors/doormove1.wav`, 11025 Hz, 8-bit mono, 5.02 s, peak -0.6 dBFS. It is a layered synthesis with no recording, so it is an approximation of the original rather than a close copy. It has not been listened to.

**What I built** (the spec is the last build, from the layers I wrote):
- **Body:** pink noise with a shaped spectrum from 100 Hz to 4 kHz, peaking at 200 to 500 Hz and rolling off above 1.5 kHz. Its envelope fades in over 0.1 s to a steady level, holds to 4.0 s, and tapers to silence by 4.9 s.
- **Rumble:** brown noise below 150 Hz, about 2 dB under the body in its steady part, swelling at 4.1 s and pulsing at about 8 Hz until 4.5 s.
- **Rattle:** band-passed pink noise at 4.1 to 4.7 s, with pulsed gain, for the shudder at the end.
- **Squeals:** four sine sweeps from 300 Hz to 600 Hz, each one second long, at 0.3, 1.5, 2.8 and 3.9 s, at -20 dB.

**Measured against the description:**

| Feature | Original (description) | Made | Note |
| --- | --- | --- | --- |
| Length | 5.04 s | 5.02 s | |
| Centroid | Dull top, densest 200 Hz to 1.5 kHz | 393 Hz | Inside the class range of 237 to 437 Hz |
| Flatness | Mostly noisy | 0.037 | Inside the class range |
| Power under 150 Hz | "Firm" rumble | 39% | Over the class range (0 to 14%) |
| Power 150 to 600 Hz | Densest band | 38% | Under the class range (84 to 100%) |
| Power 600 Hz to 2 kHz | Densest band | 22% | Over the class range |
| Attack | About 0.1 s | 1.0 s | Not met, see below |

**What is not matched:**
- **Attack:** the tool reads 1.0 s, not 0.1 s. It seems to measure against the loudest section, and it flipped between about 1 s and 4 s as I raised and lowered the steady level. Getting the steady level within a couple of dB of the loudest section was the best I could do without losing the description's level change.
- **Spectrum:** the class ranges come from the game's generic loop-machine sounds, which don't fit this description. I followed the description. The low band at 39% is the most visible difference from the class.
- **Reference:** `doors/doormove1.wav` is not in any game folder on this machine, so no measurement is taken against the original. Please check the numbers against your copy.
- **Squeals:** they are sine tones at -20 dB. They show as faint lines in the spectrogram, but they may be hard to hear.
- **Class:** there is no door class, so I used `loop machine`. The report's class checks use that choice.

**Options if the listening test falls short:** a generated take of a heavy door grinding along a track, used as a sample layer, would bring in real grain and room. The generator's weights are CC-BY-NC 4.0, so that would be non-commercial. Or I can adjust the rumble and attack balance by ear if you tell me what the side-by-side listen shows.
