I built `ambience/drips.wav` and the build says OK. It passes every engine check and has all 20 measured features inside the range of the game's own "loop drips" sounds.

**The file:** 7.31 s, mono, 11025 Hz, 8-bit, with a cue point at its start so it loops. The seam is crossfaded over 0.05 s, so the last drip's tail runs into the loop point. Peak is -1.1 dBFS and RMS is -28.7 dBFS.

**The drips:** five, at 0.05, 1.87, 3.69, 3.97 and 5.85 s. Their levels match the description: the first and last are loudest (0 dB), the second is -3 dB, and the double drip in the middle is -5 dB each. Each one is built from three parts:
- **"Plip":** a few milliseconds of noise centred on 720 to 900 Hz.
- **Tail:** a wet noise tail shaped to peak around 450 to 900 Hz. It is weaker from 1.2 to 2 kHz and faint above 3 kHz. It decays to -60 dB in 0.6 to 1.1 s.
- **Ring:** faint sine tones that differ per drip, from 610 Hz to 1.95 kHz. Some glide up by about 10% over the first 0.1 s, like a drop's bubble.

**The background:** a steady noise bed weighted below 200 Hz sits about 27 dB down, so the level never drops to silence between drips.

**Measured:**

```
centroid         975 Hz
flatness         0.138   (mostly noise, a slight ring)
T20 / T40        0.25 s / 1.46 s   (time to fall 20 / 40 dB)
power by band    <150 Hz 1.6%   150-600 17.2%   600-2k 77.1%   2k-5k 4.1%   >5k 0.1%
```

**Two things that could stand out side by side:**
- The onset detector counts 4 onsets, not 5. It probably merges the double drip at 3.69 and 3.97 s, which are only 0.28 s apart. The spectrogram shows them as two separate strikes.
- I wrote this from the description alone. I never had the original file to draw beside it, so how close the shape and colour of each tail are is a judgment call.

The tool can't judge how it sounds to a person, or how loud and how pitched the game plays it in a map's room. Someone needs to listen to it in the game.
