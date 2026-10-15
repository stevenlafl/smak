I built `debris/bustmetal1.wav` and the build says OK. It matches the description you gave, but it still misses the game's own metal-hit range on three measures, and I haven't heard it.

It is 11025 Hz, 8-bit, mono and 0.87 s, played once. It starts at full level with no fade-in, and the crunch holds for about 0.1 s before falling off. The ring is built from inharmonic partials, and a quiet rattle runs through the tail. It is written to `work:sound/debris/bustmetal1.wav`.

Measured against the game's own metal-hit sounds, it is in range on 19 of 22 features:

| Measure | Mine | Game range | Verdict |
| --- | --- | --- | --- |
| Length | 0.87 s | 0.37 to 0.86 s | slightly over, but it is the length you specified |
| Centroid (the spectrum's average frequency) | 1699 Hz | 1074 to 1654 Hz | a little bright |
| Power in the 2k to 5k band | 24.8% | 3.7 to 24.6% | a hair over |

The decay is close to what you described. It reaches -20 dB at 0.4 s and -40 dB at 0.7 s.

I made it from layers alone, with no generated recording, so it has none of a real take's grain. I didn't try the `generate` route, which might get closer, and I can't judge how it sounds or how the game plays it. Listen to it in the game before you rely on it.
