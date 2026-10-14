The sound is built: `debris/bustmetal1.wav` is 0.87 s, mono, 11025 Hz, 8-bit, plays once, and passed every engine check (no clipping, no offset, no silence before it starts, no click at the end).

How it's put together:
- **Crunch:** noise at full loudness from the first sample (0 ms attack). It holds about 0.15 s, then falls off smoothly and is quiet by 0.6 s. Its spectrum shifts over time so the lows fade first and the tail ends thin and bright.
- **Debris:** a dense spray of short grains (500 to 3000 Hz) for the crash in the first 0.1 s.
- **Thump:** a short low tone falling from 120 Hz to 70 Hz, for weight at the impact only.
- **Ring:** eight steady, inharmonic metal partials from 523 Hz to 4523 Hz that don't change pitch. The higher ones ring longer (decay 0.4 s up to 1.0 s).
- **Flutter:** a faint rattle in the tail from 0.3 s on.
- **Finish:** light saturation and a peak limiter.

Measured result:
```
attack     0 ms
T20/T40    0.47 s / 0.71 s   (seconds to -20 / -40 dB)
peak/RMS   -0.6 / -12.6 dBFS, crest 12 dB
centroid   1788 Hz
flatness   0.41              (0 = pure tone, 1 = white noise)
bands      <150 2% | 150-600 5% | 600-2k 61% | 2k-5k 31% | >5k 0.5%
```

It matches 16 of the 22 measures for the game's "metal hit" sounds. That class is crowbar-type hits, which are shorter and darker. Two of the misses, the 0.87 s length and the high 2k to 5k share, are there because your description of the original calls for them. The other four are a bit too noisy, a bit too bright overall, and slightly low in the 600 to 2k band. I chose to stay with your description over the class averages.

One correction along the way: in a `modes` layer, each partial's `gain` is a plain multiplier, not decibels. My first tries used negative dB numbers, which made the top partials blow up and pushed the 2k to 5k band to 97%. Linear values fixed it.

I've only seen the waveform and spectrogram, not heard it. How it sounds, and its volume and pitch in the game, still need checking in the game. The file is at `work:sound/debris/bustmetal1.wav`; copy it to `<mod>/sound/debris/` to replace the original.
