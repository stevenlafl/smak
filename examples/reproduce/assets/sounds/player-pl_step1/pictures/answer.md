I built `player/pl_step1.wav` as a `smak.sound/1` spec. The build says OK, with no warnings and no faults, and the file is written to `sound/player/pl_step1.wav` in the work folder. I can't hear it, so please listen in the game.

It has the original's format (11025 Hz, 8-bit, mono, played once) and event: a heavy heel thud, a short decay, then a small second bump (the toe) at about 0.09 s. The spec is layers of filtered noise with a gentle limiter, and the build compares it against the original's picture and the game's own concrete steps.

| | Original (picture) | Mine |
| --- | --- | --- |
| Length | 0.27 s | 0.258 s (4% off) |
| Centroid (where the sound's energy sits) | 902 Hz | 870 Hz (4% off) |
| Largest band difference | n/a | 6.8 points (600–2k Hz), inside the 7-point limit |
| Time to -20 dB | within 0.04–0.18 s | 0.085 s |
| Crest (peak over RMS) | about 21.8 dB (read off the outline, ±3) | 17.8 dB |
| Match to the game's concrete steps | n/a | 21 of 22 features in range |

- **Flatness:** it comes out at 0.19 against the class range of 0.2 to 0.35, so it is slightly too tonal. This is the one feature out of range, and the build doesn't warn on it.
- **Crest:** it is about 4 dB below the picture's reading. It is inside the game's step range of 14 to 26 dB, but a bit more squashed than the original looks.
- **Not a recording:** it is made from layers alone, not from a generated take. I tried the layers first because the picture's numbers were close, but a generated sample might give a more natural grain. I haven't tried that.
