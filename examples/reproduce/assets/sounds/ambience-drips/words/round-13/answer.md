The sound is built at `work:sound/ambience/drips.wav`, and the last build says OK with every one of the 20 class features in range. It is not byte-verified against the original, because I only had the description, not the file.

**What it is:** 11025 Hz, 8-bit, mono, looped from its start, 7.26 s long. The length is 0.05 s short of the 7.31 s target, about 0.7%.

**How it's made:** five drips at 0.0, 1.9, 3.7, 4.0 and 5.9 s. Each has a short high-passed click, a 700 Hz tube-resonance ring, a burst of grains from 600 to 1500 Hz, and a 1000 to 1400 Hz upward blip. The 4.0 and 5.9 s drips are 1 to 3 dB louder. A low pink-noise bed (bandpassed around 320 Hz) plus a quieter band around 1 kHz runs under everything, so the file never goes silent.

**Against the target spectrum:**

| Band | Target | Made |
| --- | --- | --- |
| under 150 Hz | 1% | 4.8% |
| 150 to 600 Hz | 22% | 18% |
| 600 to 2k Hz | 74% | 72.8% |
| 2k to 5k Hz | 2% | 4.2% |
| over 5k Hz | 1% | 0.2% |

The centroid (the spectral centre of mass) is 822 Hz, against 795 Hz.

**Choices I made:**
- **No generated takes.** I generated four takes with the local generator, but they came out about 2.7 to 2.9 kHz bright with a loud bed, far off the target. Their licence is non-commercial, so I used none of them.
- **Kept 8-bit**, because the original is 8-bit. The build warns that 8 bits adds a hiss under quiet tails. That is the trade-off for matching the format. If you would rather have 16-bit, change `bits` to 16.
- **Kept the steady bed**, though the build warns that smooth noise can read as static. The description asks for a steady bed of room tone, so I kept it.

**Not checked:** how it sounds in the game, its volume, or the map's room. Those need a listen in GoldSrc.
