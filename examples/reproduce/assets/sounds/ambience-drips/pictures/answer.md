The sound is built and the build says OK, with 19 of 20 features in the drip class's range. It is written to `sound/ambience/drips.wav` in the smak work folder, so it takes the place of the game's file of that name when put in `<mod>/sound`.

**What it is:** a 7.36 s mono 8-bit 11025 Hz loop (cue point at the start, seam crossfaded). It is made from layers, not copied from the original. A continuous band-shaped noise bed (peaked near 900 Hz) runs under a fainter hiss, and 17 drip strikes (sweep tones with ringing modes) sit at the five strike times I read off the original's picture (about 0.0, 1.87, 3.69, 3.96 and 5.80 s), with smaller strikes between. The finish is a short room, a mild saturation and a limiter at 26 dB crest.

**Measures against the original and the class:**

```
measure            made         original / class range      result
RMS                -26.9 dBFS   -30.3 to -24.3 (class)      in range
crest              26.3 dB      20.2 to 33.6 (class)        in range
flatness           0.046        0.05 to 0.15 (class)        just under
centroid           943 Hz       795 (picture), 671-1007     in class range, 19% over picture
band 150-600 Hz    34.2%        13.2 to 33.2 (class)        just over
band 600-2k Hz     64.6%        62.3 to 82.3 (class)        in range
length             7.36 s       7.31 (picture)              1% off
```

**What is left:** flatness sits just under its range and the 150 to 600 Hz band just over. Pushing the centroid down to the picture's 795 Hz made the 150 to 600 Hz share worse, so I kept the balance that passed most checks. I could not listen to it, so the sound itself has not been judged by ear. Its volume and pitch in the game, and the map's room, are also untested. Please listen to it in the game before trusting the match.

The picture-based comparison is the only measure taken from the original; its raw samples were not read, since I didn't want to copy it. If you want it tighter, the next step is to adjust the bed and hiss shapes to bring the 150 to 600 Hz share down a few points and raise flatness.
