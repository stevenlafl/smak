The sound is built and the build says OK: `work:sound/weapons/sbarrel1.wav`. It is 22050 Hz, 8-bit mono, 1.04 s long, and plays once with no loop. To use it, copy it into your mod's `sound/weapons/` folder, where it replaces the game's file of that name.

It passes all 22 of the game's gunshot measures. The final build's numbers:

```
Measure            Made     Game's range
Attack             0 ms     (in range)
T20 (-20 dB)       0.559 s  (in range)
T40 (-40 dB)       0.713 s  (in range)
Centroid           598 Hz   (in range)
Power <150 Hz      40.8%    (in range)
Power 150-600 Hz   35.5%    (in range)
Power 600-2k Hz    15.5%    (in range)
Power 2k-5k Hz     6.9%     (in range)
Power >5k Hz       1.3%     (in range)
```

How it is built, against your description:
- **The boom:** white noise, hard-driven and low-passed at 250 Hz, with a sine thump that falls from 110 Hz to 40 Hz over 0.15 s.
- **The crack:** broadband noise, shaped to reach about 10 kHz, that dies within 0.3 s.
- **The tail:** pink noise low-passed at 150 Hz, fading out by 1.04 s.
- **The pops:** three short band-passed bursts at 0.09 s, 0.17 s and 0.26 s.
- **The finish:** saturation at 2.5, with a limiter at a crest of 8 dB, which is in the game's range for weapons.

Changes made after the first build: I moved the boom's low-pass from 600 Hz down to 250 Hz and lifted the crack's 1 to 2 kHz content, because the first versions had too much energy in 150 to 600 Hz and too little in 600 Hz to 2 kHz.

What I could not check: the tool measures numbers and draws a picture, but it cannot say how the sound feels or how loud it plays in the game. Please listen to it in the game and against the original. The high end is the part most likely to differ, since I matched your description's 8 to 10 kHz crack with the measured figures rather than a recording.
