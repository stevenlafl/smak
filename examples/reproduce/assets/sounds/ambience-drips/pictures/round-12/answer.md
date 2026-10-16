`ambience/drips.wav` builds OK with no faults and no warnings. It's written to `work:sound/ambience/drips.wav`, and it will take the place of the game's own file of that name when placed in `<mod>/sound`.

I could not hear or see the original side by side. The reading tools refused the original .wav (it's binary) and the reproduce folder (permission denied). So the targets are the numbers the build reads from the original's picture (`pictures/sound.png`), not the original's audio.

```
Measure            Made sound        Target (from the original's picture)
length             7.56 s            7.31 s (3% off)
centroid           800 Hz            795 Hz (1% off)
150-600 Hz share   23.6%             22%
600-2k Hz share    72.9%             74%
2-5k Hz share      3.4%              3%
crest              24 dB             about 24.9 dB
onsets             8                 8
flatness           0.050             class 0.05 to 0.15
RMS                -24.5 dBFS        class -30.3 to -24.3
Class features     20 of 20 in range
```

**What the sound is:** eight drips at the same times as the picture's onsets. Each drip is a bell-like ring (1.4 s decay), a short falling 380 to 220 Hz body for the low share, and a 2 kHz band-passed crack for grain. The loop's start is the cue point, with a 0.05 s crossfade at the seam.

**Choices you may want to change:**
- **16-bit, not 8-bit.** The original is 8-bit. The build warns that 8-bit adds a hiss under quiet tails, and that a copy isn't held to the original's depth. Say if you want 8-bit to match the original exactly.
- **Length 7.56 s, not 7.31 s.** The ring tails run past the 7.31 s cut, so the file comes out 3% longer. It is within the 10% the build allows.
- **No generator used.** The sound is made from layers only, so no generator licence applies to it.

**Not checked:** how it sounds to a person, its volume and pitch in the game, and the map's room. Please listen in the game.

**Not saved to a file:** the spec exists only in this conversation. I have no file-writing tool here, so I can't put it in the reproduce folder. I can write it there if you want the sound rebuilt from a fresh clone.
