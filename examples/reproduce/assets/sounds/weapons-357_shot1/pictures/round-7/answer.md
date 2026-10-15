`weapons/357_shot1.wav` is built and the build says OK with no warnings. It matches the original on length and overall tone. Loudness is the one remaining gap, and I haven't heard it. The file is at `work:sound/weapons/357_shot1.wav`, and the game plays it in the original's place once it's in `<mod>/sound`.

It is made from layers alone: a shaped noise blast, a falling 110 to 55 Hz boom and a short mid crack, saturated and written as 8-bit, 22050 Hz mono. I didn't try a generated take.

| | Original | Mine |
| --- | --- | --- |
| Length | 1.06 s | 1.063 s |
| Centroid (the spectrum's centre, in Hz) | 921 Hz | 1035 Hz (12% off, inside the 15% limit) |
| Time to fall 20 dB (T20) | 0.458 to 1.013 s (the class range) | 0.654 s |
| Crest (peak over RMS) | about 10 dB | 11.3 dB |
| Power, over 600 Hz | not read | 57.7% |

- **Where it's weakest:** the build puts the low-end power, under 150 Hz, 6.4 points off the original, the worst of the bands.
- **Against the game's gunshots:** it is in range on 21 of 22 measures. The 22nd is RMS (average level), at -11.9 dBFS against a floor of -11.7, so it is slightly quieter than the game's own shots.
- **What I can't check:** how it sounds, and how the game plays it (volume, pitch, the map's room). That needs a listen in the game.
