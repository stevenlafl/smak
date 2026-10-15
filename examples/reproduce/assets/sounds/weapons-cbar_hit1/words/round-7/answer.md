`weapons/cbar_hit1.wav` builds with the build saying OK and every check passed. It is not yet a close match to the original: 17 of 22 features fall within the range of the game's own metal hits.

It is 0.69 s, mono, 11025 Hz, 8-bit, written to `work:sound/weapons/cbar_hit1.wav`, and plays once. It is made of layers only, with no generated recording.

- **Onset:** it starts instantly at full scale (attack 0 ms), with a short broadband crack.
- **Loud stretch:** noise heaviest around 150 to 1000 Hz, with a rattle layer for the chatter and a bump of extra roughness around 0.2 to 0.3 s.
- **Drop:** the level falls to roughly a third at 0.31 s, then fades in an exponential die-off to the end. The picture shows this clearly.
- **Ring:** a steady 1 kHz line with a fainter 3 kHz partial, at constant pitch, that carries the tail.

Still off, from the build's own report:
- **Too bright:** 2–5 kHz holds 44.8% of the power, against the game's 3.7–24.6%. The centroid is 1797 Hz against the game's 1074–1654 Hz.
- **Too tonal:** flatness is 0.088 against the game's 0.16–0.28.
- **Mid band short:** 600–2 kHz holds 38.1%, against the game's 63.7–83.8%.

I stopped here rather than keep tuning. The excess highs probably come from 8-bit quantisation noise and the saturation, but I haven't tested that. A recording from `generate` might also come closer to the original's grain, but it comes with a non-commercial licence, which is your call. I can't judge how it sounds or how the game plays it (volume, pitch, the map's room), so it needs a listen in the game.
