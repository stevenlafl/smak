`debris/bustmetal1.wav` is built and the build says OK. It is written to the server's work folder as `sound/debris/bustmetal1.wav`, so it takes the game's place when put in `<mod>/sound`. I can't listen to it, so the match rests on the measurements below.

I read the original's picture (`input/sound.png`) and the build's report against it:

| Measure | Original (from its picture) | Built | Off by |
| --- | --- | --- | --- |
| Length | 0.87 s | 0.87 s | 0% |
| Centroid (brightness) | 1896 Hz | 1987 Hz | 5% |
| Crest (peak over RMS) | about 12.4 dB | 12 dB | within 3 dB |
| Decay T20 | 0.24 to 0.7 s range | 0.53 s | in range |
| Onsets | 0 | 0 | none |
| Worst band (150-600 Hz) | | | 2.9 points |

Format: 11025 Hz, 8-bit, mono, peak -0.6 dBFS. The spec is a broadband noise body with a crisp onset, a fine grit of short particles, and a short plate-like ring. The final spec is in this conversation, not saved to a file. I can save it into the project if you want it kept.

Two flags in the report stay, on purpose. The game's metal hit sounds are shorter and more tonal (flatness 0.16 to 0.28, length 0.37 to 0.86 s). The original is a long, noisy crash, so matching it means not matching those.

Listen to it in the game before calling it done. Volume and pitch as the engine plays it, and the map's room, can't be checked from here.
