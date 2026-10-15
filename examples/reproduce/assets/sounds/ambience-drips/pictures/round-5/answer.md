The sound is built and the build says **OK**: `work:sound/ambience/drips.wav`, 11025 Hz, 8-bit, mono, looped from its start. Copy it into the mod's `sound/ambience/` folder to replace the game's file.

I built it from the original's picture (`pictures/sound.png`), not the WAV itself. The kit cannot read the WAV directly, so the event times and the spectrum are read off the picture. Event times are approximate, to within about 50 ms.

Against the picture, after the last build:

| Feature | Original (from picture) | Made | Off by |
| --- | --- | --- | --- |
| Length | 7.31 s | 7.06 s | 3% |
| Centroid | 795 Hz | 745 Hz | 6% |
| 150 to 600 Hz band | about 22% | 21% | within tolerance |
| 600 to 2000 Hz band | about 74% | 78% | 4 points |
| Crest | about 24.9 dB | 27.9 dB | +3 dB |
| Onsets | 4 to 8 | 4 | within range |

The report has no FAULT lines and no warnings about the picture.

What I chose and what is left:

- **Event times:** five drips at 0.0, 1.87, 3.70, 4.00 and 5.80 s, each a falling sine with a short splash of band-limited noise.
- **Bed:** white noise shaped to peak near 450 Hz, held across the whole loop.
- **Level:** RMS -28.5 dBFS, inside the game's drip-loop range.
- **Length:** the sound comes out 7.06 s, not 7.31 s. Lengthening the bed's hold made no difference, so I did not pursue it further. The 3% gap is within the tolerance.
- **Flatness:** 0.042, just below the drip class's 0.05 to 0.15. I left it: the original's picture has a dark top end, so it is probably low too. This is a judgement, not a measurement.
- **Not checked:** how it sounds to a person, its volume in the game, and the map's room. Listen to it in the game.

The spec lives only in this session, not in the project folder. If you want it kept, I can save it next to the reproduce assets.
