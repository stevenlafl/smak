I built `weapons/357_shot1.wav` to the original's format: 22,050 Hz, 8-bit, mono, 1.057 s, played once. The build says OK and every check passed. Against the game's gunshot sounds, 21 of 22 features are in range. I haven't heard it, and I haven't tried it in the game.

- **One feature still off:** the 150–600 Hz band holds 54.6% of the power, just over the range of 16 to 47.9%. I stopped there rather than keep tuning.
- **Onset:** a 3 ms high-passed click, added after the saturation, then the main blast at 8 ms. Measured attack is 10 ms. The report counted 0 onsets, so the double transient may not show as two hits. I didn't check it on the drawn waveform.
- **Body:** one broadband noise layer, saturated hard so it is gritty and clipped, with no tone or pitch. It stays at full level to about 0.44 s, then decays to quiet by about 0.75 s and nearly silent at 1.0 s.
- **Darkening tail:** the spectrum moves over time, so the highs die first and the tail is low rumble. The measured centroid is 558 Hz, inside the game's range of 421 to 1258 Hz.
- **Decay timing:** T20 is 0.50 s and T40 is 0.75 s, so it reaches -40 dB right around the 0.75 s mark in your description.

I made it from layers alone, with no generated recording. The server offers one for gunshots, and a take might have more grain. The spec is the last `build` call in this conversation. It is not saved to a file, and the audio is at `work:sound/weapons/357_shot1.wav`.
