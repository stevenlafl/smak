The sound is built and the build says OK: `work:sound/player/pl_metal1.wav`, 11025 Hz, 8-bit mono, 0.60 s. It is layers only, with no recording generator, so no generator licence applies to it.

I read the original as a metal footstep and built it as the game's `step metal` class. The class check passes on all 22 features.

Measured against the original's picture (the numbers read off its spectrogram):

| Measure | Original (from picture) | Built | Status |
| --- | --- | --- | --- |
| Length | 0.58 s | 0.60 s | 4% off |
| Time to fall 20 dB (T20) | 0.315 to 0.525 s | 0.32 s | in range |
| Power below 150 Hz | 32% | 36% | 4 points off |
| Power 150 to 600 Hz | 47% | 49% | 2 points off |
| Power 600 Hz to 2 kHz | 20% | 13% | 6 points off |
| Centroid (brightness) | 361 Hz | 413 Hz | 14% off |
| Crest (peak over RMS) | about 16.3 dB | 14.6 dB | within 3 dB |

The sound is made of four layers: a short noise crack, a band of grit between 600 Hz and 1.6 kHz, a ringing metal mode at 380 Hz, and a low sine thump that falls from 130 Hz to 50 Hz. Each was tuned by building and reading the report.

What is left:
- **Brightness:** the centroid is 14% high. My attempts to close that also broke the length or the T20, so I stopped there.
- **Bit depth:** the build notes that 8 bits adds a hiss under the quiet tail. I kept 8-bit and 11025 Hz to match the original's format. Dropping to 16 bits would remove the hiss; say if you want that.
- **Not checked:** I have only checked the numbers. I have not listened to it, and I have not played it in the game. The spectrogram of the built sound looks like the original's, but a side-by-side listen is the real test.

One thing I found about the kit: the `modes: [...]` form of the modes layer normalises its level per layer, so a second modes layer swamped the whole mix whatever gain I gave it. I used a single `ring` mode instead.
