I built `player/pl_step1.wav` and the build says OK. The engine checks all pass, and all 22 of its measured features fall within the range of the game's own concrete footsteps.

```
                    original          rebuilt
length              0.27 s            0.268 s
rate / bits         11025 Hz, 8-bit   11025 Hz, 8-bit mono
heel hit            ~0.007 s          0 s
toe hit             ~0.089 s          0.087 s
peak                (not given)       -0.6 dBFS
centroid            (not given)       901 Hz  (game range 678 to 1024)
flatness            (not given)       0.257   (game range 0.2 to 0.35)
power <150 Hz       (not given)       26.1%
power 150-600 Hz    (not given)       44.1%
power 600-2k Hz     (not given)       13.5%
power 2k-5k Hz      (not given)       15.2%
```

The original came only as a picture and a length, so the "original" column is what I read off its waveform and spectrogram. Its numbers can't be measured. The rebuilt values are the build's own measurements, and the ranges come from the game's other concrete footsteps, not from pl_step1 itself.

The structure matches the original:
- **Heel:** a sharp hit with a little grit on top.
- **Toe:** a second, quieter hit about 0.09 s later.
- **Tail:** a quiet one that fades out by 0.27 s.

The one visible difference: in the original's spectrogram the tail stays brighter in its second half. Mine gets darker from about 0.15 s on. I left it there because it already passed every check, and brightening the tail would push the spectrum measurements out of range again.

The build can't tell how it sounds, or how loud it plays in-game with the map's room effect added, so it still needs a listen in the game. The file is at `work:sound/player/pl_step1.wav`. Put it in `<mod>/sound/player/` and the game will play it instead of the original.
