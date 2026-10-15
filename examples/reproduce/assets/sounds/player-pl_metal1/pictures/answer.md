The sound is built and the build says OK with no warnings. The file is `player/pl_metal1.wav` at 11025 Hz, 8-bit, mono, 0.58 s long, written to the server's work folder as `work:sound/player/pl_metal1.wav`. I have not listened to it, and the build can't judge how it sounds, so a listen in the game is still needed.

The sound is built from one generated take of a metal footstep, which I chose from four seeds, plus two synthesized layers: a low sine thump and a dark pink-noise tail. The take is the sample for the click and the first hit. The tail carries the body.

Measured against the original's picture:

```
measure        original   built
length         0.58 s     0.58 s
centroid       361 Hz     354 Hz
T20            0.315-0.525 s (in range)   0.394 s
band <150 Hz   32%        31%
band 150-600   47%        49%
band 600-2k    ~20%       20%
crest          ~16 dB     14 dB
peak           -0.6 dBFS
```

T20 is the time for the sound to fall 20 dB from its peak. Against the game's own metal steps, all 22 features are in range. The report's only numbers that differ from the original are the crest (14 dB against about 16) and the 150-600 band (2.6 points off), both within the tolerances the kit uses.

The build used a `picture` of the original, and I set the spec's `class` to `step metal`. The spec's `seed` is 4, so rebuilding gives the same bytes.

Licence: the take comes from woosh-dflow (CC-BY-NC 4.0, non-commercial). You said that was acceptable for this test, but it means the file can't ship in a commercial product as is.
