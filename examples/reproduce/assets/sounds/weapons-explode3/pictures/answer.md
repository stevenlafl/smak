The build says OK and every check passed. It's written to `work:sound/weapons/explode3.wav`, so it takes the original's place once it's in `<mod>/sound`.

Here's how it measures against the original's picture and the game's own explosion sounds:

```
                      made        original / range
length                1.3 s       1.3 s
format                22050 Hz 8-bit mono, played once
centroid              626 Hz      605 Hz (4% off)
worst band            1.3 points off (2k-5k)
T20 (to -20 dB)       0.758 s     0.668-1.113 s (in range)
crest (peak over RMS) 8.6 dB      ~8.1 dB (within 3)
RMS                   -9.1 dBFS   -9.2 to -3.2
vs game explosions    22 of 22 features in range
onsets                0           3
```

It's built in layers:
- **Main blast:** shaped noise that holds near full level for about 0.45 s, then darkens and fades.
- **Low boom:** a quiet tone falling from 75 to 40 Hz.
- **Rumbles:** two lower bursts at 0.15 s and 0.36 s.
- **Debris:** a light crackle.
- **Crack:** a 3 ms crack at the start.

Strong saturation squashes the sound so it looks clipped, like the original's waveform.

**The one mismatch is onsets.** The original reads 3 separate hits and mine reads 0. The two later bursts are audible in the spectrogram, but the saturation smears them below what the detector counts. I tried making them sharper and louder, but that threw off the loudness and decay, so I kept them as they are.

None of this tells you how it sounds or how the game plays it (volume, pitch, the map's room effect), so it needs a listen in-game.
