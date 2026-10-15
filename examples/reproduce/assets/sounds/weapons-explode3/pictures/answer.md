The sound is built and the build says OK: `weapons/explode3.wav`, written to the server's work folder at `work:sound/weapons/explode3.wav`. To make the game use it, copy it to `<mod>/sound/weapons/explode3.wav`. I have not listened to it, and the report can't judge how it sounds or how the game plays it, so it still needs a listen in the game.

**Format and event:** 22050 Hz, 8-bit, mono, 1.308 s, matching the original's 1.3 s, 22050 Hz, 8-bit. I read it as one explosion played once.

**Measured against the original's picture (the report's own reading):**

| Feature | Original (from its picture) | Built file |
| --- | --- | --- |
| Length | 1.3 s | 1.31 s (1% off) |
| Centroid (the frequency centre of its energy) | about 605 Hz | 666 Hz (10% off) |
| T20 (time to fall 20 dB) | 0.67 to 1.11 s | 0.94 s (in range) |
| Crest (peak over RMS, the average level) | about 8.1 dB | 8.9 dB |
| Band 150 to 600 Hz | about 36% | 32% |
| Band 600 Hz to 2 kHz | about 21% | 25% |

The report's last warning for the picture is gone, so the build's own picture check passes.

**What the sound is:** a falling sine boom (120 to 55 Hz), a pink-noise body under 450 Hz, a mid blast to 1.3 kHz, a low rumble tail, a hiss and a quiet full-band air layer, debris crackle, and three sharp cracks at 0, 0.2 and 0.45 s, with saturation and a limiter.

**What is still off, from the class check against the game's own explosions:**
- **Onsets:** the report counts 0 where the original has 3. The three cracks are too quiet to register as separate hits; louder cracks fixed that but pushed the crest up, so I kept the quieter cracks.
- **Flatness:** 0.044, just under the 0.05 that the game's explosions start at.
- **Crest and RMS:** the crest is 8.9 dB, just above the 8.7 top of the range, and the RMS is 0.3 dB under the range. Harder saturation fixed the crest but pushed the centroid out of range, so I stopped there.

I could not open the original's picture myself by its file path, so the original figures above come from the report's readings of it, and I did not compare the two spectrograms by eye.
