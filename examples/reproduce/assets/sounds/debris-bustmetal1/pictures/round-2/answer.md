The sound is built as `debris/bustmetal1.wav` and the build says OK. It's 11025 Hz, 8-bit mono, 0.87 s, so it drops in where the original goes.

Measured against the original's picture:

```
measure        ours        original (read off picture)
length         0.87 s      0.87 s
centroid       1968 Hz     1896 Hz   (4% off)
worst band     150-600 Hz, 2.4 points off
T20            0.559 s     0.24 to 0.7 s range
crest          12 dB       ~12.4 dB  (within 3 dB read accuracy)
onsets         0           0
```

The centroid is the "average" frequency, which tells you how bright it sounds. T20 is how long it takes to drop 20 dB.

How it's built:
- **Main crash:** a broadband noise layer whose spectrum moves over time. It's loud and full for the first ~0.1 s, then fades steadily to silence near 0.8 s, like the original.
- **Metal ring:** two ringing layers, a plate and a bell, slightly detuned. They give the faint pitched lines seen in the original's spectrogram.
- **Rattle and onset:** a scatter of fragment ticks, plus a 20 ms high crack at the start.

The report also flags 5 of 22 features as outside the range of the game's "metal hit" sounds: too long, too bright, too noisy, and too much energy above 2 kHz relative to the 600-2k band. I left those alone on purpose. The original's own centroid of about 1896 Hz is outside that range too, and it's a debris crash, not a single strike. Making it fit the metal-hit range would have pulled it away from the original.

All of this comes from pictures and numbers. I haven't heard it, and how it plays depends on the game's volume and pitch and the map's room. Give it a listen in game next to the original. It's in the work folder at `sound/debris/bustmetal1.wav`; copy it to `<mod>/sound/debris/` to use it.
