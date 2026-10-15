The sound is built and the build says OK, with no warnings. It is at `work:sound/weapons/357_shot1.wav`, ready to go in `<mod>/sound/weapons/` so the game loads it in place of the original.

I could not listen to it, and I could not read the original's `.wav` directly, so the comparison is against the original's picture (the work folder's `pictures/sound.png`) and the numbers read off it. The last build against that picture:

| Measure | Made sound | Original (from picture) | Result |
| --- | --- | --- | --- |
| Length | 1.059 s | 1.06 s | 0% off |
| Centroid (the spectral centre, where the energy sits) | 883 Hz | about 921 Hz | 4% off |
| Worst band (2k to 5k) | 10% | about 6% | 3.9 points off (aim within 7) |
| T20 (time to fall 20 dB) | 0.693 s | 0.458 to 1.013 s | in range |
| Crest (peak over average level) | 11.1 dB | about 10 dB | within 3 dB |
| Against the game's own gunshots | 22 of 22 | | every feature in range |

How it is made: a sharp high-passed crack, a pink-noise blast with a fast fall (0.22 s), a short falling sine thump (150 Hz sweeping to 55 Hz), and a longer low-passed tail, all with a saturation and a limiter for the crest. The seed is 1, so the same spec gives the same bytes.

I did not use a generated recording as a base layer. That would probably add more grain and real room character than layers can, so it is the next thing to try if the side-by-side listen finds it too synthetic. The volume and pitch in the game, and the map's room, can only be judged by listening in the game.
