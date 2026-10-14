The build says OK, and the numbers match the original closely. The file is `work:sound/weapons/357_shot1.wav`: 22050 Hz, 8-bit mono, 1.06 s. Putting it in `<mod>/sound/weapons/` makes the game play it in place of the original.

How it compares with the original's picture:

```
                     made        original (picture)
length               1.06 s      1.06 s
centroid             959 Hz      921 Hz (4% off)
worst band           150-600 Hz, 2.8 points off
T20 (time to -20dB)  0.61 s      0.46 to 1.01 s range
crest                10.7 dB     about 10 dB (±3 dB)
onsets               0           3
gunshot class check  22 of 22 features in range
```

How it's built:
- **Main blast:** a shaped noise layer. It stays loud and saturated until about 0.4 s, then fades to silence by 1.06 s, getting darker as it goes. Most of its energy is between 150 and 2000 Hz.
- **Opening:** a short high crack, with a brief dip at about 0.03 s like the original's.
- **Low thump:** a falling tone from 100 Hz down to 50 Hz underneath.

**Still off:** onsets. The original's picture shows 3 separate hits and mine shows 0. I tried adding two short bursts at 0.045 s and 0.12 s, but the saturation smooths them into the body and they don't register.

The check only measures the waveform and spectrum. It can't tell how the sound actually sounds or how it plays in the game, so it needs a listen in the game.
