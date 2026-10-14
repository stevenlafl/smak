The build passed with no faults. All 22 of the measured features fall inside the range of the game's own explosion sounds. The file is `work:sound/weapons/explode3.wav`. Copy it to `<mod>/sound/weapons/explode3.wav` and the game plays it in place of the original.

```
format      22050 Hz, 8-bit, mono, 1.3 s, no loop
peak / RMS  -0.6 dBFS / -8.8 dBFS (crest 8.2 dB)
decay       T20 0.75 s, T40 0.91 s
centroid    661 Hz, flatness 0.11 (noise, no tone)
bands       <150 Hz 38% | 150-600 35% | 600-2k 18% | 2k-5k 6% | >5k 2%
```

**How it lines up with the description:**
- **Start and loudness:** the waveform starts at full scale on the first sample, with no fade-in and no separate click. It stays clipped against the top for about the first 0.4 s, then decays smoothly. The report gives an "attack" of 349 ms. That is the time to its loudest point, which comes at the end of the clipped section. The sound itself starts instantly.
- **Decay:** about -9 dB at 0.8 s (roughly a third of full scale), a quiet low rumble by 1.1 s, and near silence at 1.3 s with no sharp cutoff.
- **Spectrum:** most of the energy sits below 600 Hz as the boom and rumble. A 300 Hz to 2.5 kHz crackle layer adds the gritty bursts, and heavy saturation gives the dense, distorted roar. The highs are the weakest band and die out first, by about 0.7 s. The midrange is also low-passed, falling from 6 kHz to 600 Hz over the length, so the tail gets darker without any pitch change.

**Layers:**
- low-passed brown noise for the boom
- band-passed pink noise for the body
- a short high-passed hiss
- crackle particles

The finish is saturated at drive 8, the maximum, and the seed is fixed so the build is reproducible.

I couldn't compare it with the original file itself, so the match is against your description and the game's explosion set. I also couldn't hear it, and its volume and pitch as the game plays it are unchecked. Have a listen in-game.
