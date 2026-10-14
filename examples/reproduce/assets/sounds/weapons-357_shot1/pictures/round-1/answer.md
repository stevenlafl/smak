The 357 shot builds OK and all checks pass. Against the game's own gunshots it's in range on all 22 measured features. I haven't heard it, though. The tool only measures it and draws it, so it still needs a listen in-game.

```
                original                 ours
length          1.06 s                   1.064 s
format          22050 Hz 8-bit mono      22050 Hz 8-bit mono
peak / RMS      (not given)              -0.6 dBFS / -9 dB
attack          instant                  0 ms
body            clipped solid ~0.45 s    clipped solid ~0.42 s
tail            fades out by ~1.0 s      T20 0.77 s, T40 1.03 s
spectrum        broadband, heavy lows,   <150 Hz 30%, 150-600 26%,
                highs fade in the tail   600-2k 29%, 2k-5k 12%, >5k 3%
```

Side by side, the waveform and spectrogram follow the original closely. Both start with a hard full-scale block, saturated for about 0.45 s, then fall off steadily while the top end darkens.

What it's made of:
- **Crack:** a short highpassed white-noise crack for the first ~20 ms.
- **Blast:** pink noise held loud to 0.42 s, then decaying. Its lowpass sweeps down from 6 kHz to 1.8 kHz so the tail gets darker, and a boost around 1.2 kHz gives it the mid bite.
- **Low end:** a quiet falling boom (100 Hz down to 50 Hz) plus brown-noise body.
- **Finish:** saturate 8, which gives the clipped, squashed body, and a short room (0.12 s decay). With a longer room the file ran to 1.13 s, so I cut it back to keep the original length.

The file is `work:sound/weapons/357_shot1.wav`. Drop it into `<mod>/sound/weapons/` and the game plays it instead of the original.
