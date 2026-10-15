`weapons/explode3.wav` is built and the build says OK with every check passed. It is written to `work:sound/weapons/explode3.wav`. Against the game's explosion sounds it scores 21 of 22 features. I haven't heard it, and I haven't compared it with the original file, only against the game's explosion class.

- **Format:** 22050 Hz, 8-bit, mono, 1.3 s. It plays once, with no loop.
- **Onset:** it starts at full level with no fade-in. Attack is 10 ms, and the build reports no separate onset.
- **Body:** noise saturated hard to hold a clipped, dense roar for the first 0.4 s. The peak is -0.6 dBFS and RMS is -9 dB.
- **Decay:** the envelope falls to about -9.5 dB (a third of full scale) at 0.8 s. It is a low rumble by 1.1 s and near silence at 1.3 s, with no cutoff.
- **Spectrum:** the build reports these figures.

  | Band | Share of power |
  | --- | --- |
  | under 150 Hz | 37% |
  | 150–600 Hz | 36% |
  | 600 Hz–2 kHz | 21% |
  | 2–5 kHz | 6% |
  | over 5 kHz | 0.6% |

  The centroid (the spectrum's centre of weight) is 572 Hz. The highs fall away over time, so the tail is darker.
- **Crackle:** a thin layer of short grains from 400 Hz to 3 kHz adds the bursty debris texture inside the body. There are no distinct hits after the onset.

**The one miss:** flatness is 0.046 against a range of 0.05 to 0.15, so it is slightly too tonal. I lowered it from a brighter attempt that overshot the centroid.

**T20 varies:** T20 (time to fall 20 dB) moved between 0.68 and 1.1 s across my last few builds. At 0.68 s the tail may fall a bit early next to the original.
