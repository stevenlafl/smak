The sound is built and the build says OK, with no warnings from the picture check. It is written as `work:sound/debris/bustmetal1.wav`, which takes the place of the game's own file when it is put in the mod's `sound` folder.

I could not save the spec to a file: the Write tool is disabled in this session. The spec is below, so you can save it yourself.

```json
{
  "spec": "smak.sound/1",
  "name": "debris/bustmetal1.wav",
  "class": "metal hit",
  "rate": 11025,
  "bits": 8,
  "seed": 7,
  "length": 0.87,
  "picture": "pictures/sound.png",
  "layers": [
    { "id": "crack", "kind": "noise", "color": "white", "shape": [[60, -22], [150, -12], [300, -6], [600, -2], [1500, -2], [3000, -5], [5000, -14], [7000, -22], [11000, -34]], "filter": [{ "type": "peak", "f": 1200, "q": 0.6, "gain": -12 }, { "type": "peak", "f": 3000, "q": 0.6, "gain": 0 }, { "type": "peak", "f": 350, "q": 0.8, "gain": 4 }], "env": { "points": [[0, 0], [0.02, -4], [0.07, -12], [0.15, -22], [0.3, -32], [0.6, -44], [0.87, -55]] }, "gain": -5 },
    { "id": "hiss", "kind": "noise", "color": "white", "shape": [[1500, -30], [2000, -8], [3000, -2], [4000, -8], [5000, -18], [6500, -40]], "filter": [{ "type": "lowpass", "f": 3200, "q": 0.7 }], "env": { "points": [[0, -6], [0.03, -2], [0.12, -8], [0.3, -18], [0.6, -30], [0.87, -42]] }, "gain": -10 },
    { "id": "body", "kind": "modes", "modes": [{ "f": 420, "gain": 7, "decay": 0.2 }, { "f": 700, "gain": 4, "decay": 0.15 }] },
    { "id": "ring", "kind": "modes", "modes": [{ "f": 1800, "gain": -10, "decay": 0.25 }, { "f": 2600, "gain": -12, "decay": 0.2 }, { "f": 3500, "gain": -14, "decay": 0.15 }] }
  ],
  "finish": { "saturate": 1.5, "limit": { "crest": 10.5, "release": 0.002 }, "peak": -0.5 }
}
```

**Measured against the original's picture (the only data I had of it):**

| Measure | Original (from picture) | Ours | Within aim? |
| --- | --- | --- | --- |
| Length | 0.87 s | 0.87 s | yes |
| T20 (time to -20 dB) | 0.24 to 0.7 s range | 0.56 s | yes |
| Crest (peak over RMS) | about 12.4 dB | 10.5 dB | within 3 dB |
| Centroid (brightness) | 1896 Hz | 2138 Hz (13% off) | yes (aim 15%) |
| 150 to 600 Hz band | about 9.6% | 5.5% | yes (within 7 points) |
| 600 Hz to 2 kHz band | about 47% | 53.5% | yes (within 7 points) |
| 2 to 5 kHz band | about 41% | 40.9% | yes |

**What still differs, which I did not force:**
- Flatness is 0.106. The game's own metal-hit range is 0.16 to 0.28, so the sound is more tonal than a typical game hit. Every try to lift it pushed the centroid past its aim, so I kept the better picture match.
- The class report also calls the centroid too bright for the game's metal hits (1074 to 1654 Hz). The picture's own centroid is 1896 Hz, so I followed the picture.
- The length is flagged "too long" against the class range (up to 0.86 s). The original is 0.87 s, so I kept it.

**Choices I made:**
- Class `metal hit`, since the kit has no debris class.
- The bit depth, rate and seed are as in the original.
- The crest is 10.5 rather than the picture's 12.4. At 12 the tail was right but the spectrum went too pure, and at 9 the tail was too long.

**Things I could not check:**
- I have not heard it. The kit's report cannot say how it sounds, how loud it plays in the game, or how the map's room changes it, so please listen in the game before you call it done.
- The original WAV is not in the folder, only its picture and facts file, so I compared against those. A direct A/B against the real file would tell more.
- The `particles` layer had no audible effect in this build: changing its gain left every measure unchanged, and removing it changed nothing either. I dropped it and used a noise layer instead. That looks like a problem in the kit, not in this sound, and it may be worth a bug report.
