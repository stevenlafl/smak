The sound is built and the build says **OK**: `ambience/drips.wav` is written to the work folder at `work:sound/ambience/drips.wav`. I could not listen to it, and I could not read the original's waveform directly, so the match rests on the kit's numbers.

**What it is:** eight water drips in 7.31 s, 11025 Hz, 8-bit mono, looped from its start. Each drip is a short falling sine tone with a little white-noise splash, over a quiet band-limited noise bed and a very faint full-band hiss.

**Figures against the original's picture** (read by the kit from `pictures/sound.png`):

| Feature | Original (picture) | Made | Status |
|---|---|---|---|
| Length | 7.31 s | 7.06 s | 3% short |
| Drip count (onsets) | about 8 | 8 | matches |
| Centroid (brightness) | 795 Hz | 845 Hz | 6% bright |
| Crest (peak over RMS) | about 24.9 dB | 24.2 dB | within 1 dB |
| Band 600 Hz to 2 kHz | about 74% | 80% | close |
| Band 150 to 600 Hz | about 22% (inferred) | 15% | about 7 points low, the worst miss |
| Flatness | class range 0.05 to 0.15 | 0.116 | in range |

The class check (loop drips) passes on all 20 features.

**Choices I made:**
- Drip positions and pitches are my own, read from the picture's onset count and centroid. They are not the original's exact timing, so the two will not line up note for note.
- I did not use the original file as a sample layer, because that would copy it rather than reproduce its character.
- The loop is set with `loop: true`, so the engine uses its start as the cue point.

**Things to check:**
- The kit reports attack of 1.2 s and T20 of 4.9 s for the whole loop. That is because the noise bed never fully decays, so those two numbers describe the bed, not the drips. With the bed removed, the drips alone measured T20 of about 0.05 s, which is in line with a drip. The kit does not flag this, but it is worth knowing when you compare the decays.
- The kit cannot judge how it sounds to a person, its volume in the game, or the room of the map. Please listen to it in the game beside the original.

I stopped after this iteration because the remaining gaps were small and more tuning was giving little back. The spec was not saved to its own file, so the parameters live in the build call above.
