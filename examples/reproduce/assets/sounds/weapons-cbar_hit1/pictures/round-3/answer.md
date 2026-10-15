The sound is built and the build says OK: `work:sound/weapons/cbar_hit1.wav`, 11025 Hz, 8-bit mono, 0.69 s, peak -0.6 dBFS. It is written under `sound/` so it takes the place of the game's own `weapons/cbar_hit1.wav` when put in a mod's `sound` folder.

**Measured against the original's picture:**

| Feature | Original (from picture) | Made sound |
| --- | --- | --- |
| Length | 0.69 s | 0.69 s (exact) |
| Centroid | 1467 Hz | 1332 Hz (9% off) |
| Band 600 Hz to 2 kHz | about 80% (read off the picture) | 75% (6 points off) |
| Crest | about 9.8 dB | 9 dB |
| Attack | instant | 0 ms |
| T20 | 0.24 to 0.7 s | 0.53 s |

Against the game's own metal hits, all 22 features are in range.

**Choices I made:**
- **Layers:** a short high-passed crack at the start, a broadband body that starts at full level and falls after about 0.3 s, a small bloom near 0.28 s (the second bump in the picture), and a 1 kHz modal ring for the metallic tone.
- **No room reverb:** the room tail pushed the length to 0.98 s, past the original's 0.69 s, so I left it out. The map's `env_sound` can add room.
- **Seed 3:** the same spec always gives the same bytes.

**What I could not check:** I can't listen, so "at least as good" is judged only by the measurements above, not by ear. The picture's numbers are read off the spectrogram, so they are approximate. I also did not check the sound's volume or pitch as the game plays it. Listening in the game is the real test.

The spec itself is only in this chat, not saved to a file. Say if you want it saved next to the work folder so it can be re-run.
