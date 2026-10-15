`weapons/sbarrel1.wav` is built, and the last build said OK with no warnings. It's written to `work:sound/weapons/sbarrel1.wav`, so it replaces the game's file when put in `<mod>/sound`.

It's made from layers only (no generated recording): a shaped noise blast that is loud from the start and fades over the second, a short falling low thump, and a brief bright crack added after the limiter.

Measured against the original's picture:

| | Original | Mine |
| --- | --- | --- |
| Length | 1.04 s | 1.045 s |
| Centroid (brightness) | 615 Hz | 628 Hz |
| Crest (peak over RMS) | about 11.2 dB | 11.9 dB |
| T20 (time to fall 20 dB) | 0.458–1.013 s allowed | 0.823 s |
| Largest band difference | within 7 points allowed | 3.6 points (150–600 Hz) |

- **Format:** 22050 Hz, 8-bit mono.
- **Gunshot class:** 20 of its 22 measures are in range. The two off are crest (11.9 dB against a limit of 11.7 dB) and RMS (-12.5 dBFS, slightly under the range), both slight.

I haven't heard it. How it sounds, and how the game plays it (volume, pitch, the map's room), still needs a listen in the game.
