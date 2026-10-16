The sound is built and the build says OK with no warnings. It's at `work:sound/weapons/explode3.wav`, ready to go in `<mod>/sound/weapons/`. I can't listen to it, so the comparison below is measured only, and the listening test is yours.

**Measured against the original (from the build report and your numbers):**

```
measure         original        made
length          1.30 s          1.37 s   (+5%, the room tail)
centroid        605 Hz          653 Hz   (+8%)
power <150 Hz   37%             31%      (-6)
power 150-600   36%             36%      (0)
power 600-2k    21%             26%      (+5)
power 2k-5k     4%              6.5%     (+2.5)
power >5k       2%              0.8%     (-1.2)
T20 (s)         0.67 to 1.11    1.11     (inside the game's range for the class)
crest (dB)      about 8.1       8.7      (within 3 dB)
flatness        in class range  in class range
class check     -               22 of 22 features in the game's explosion range
```

**Differences to know about:**
- The original is 8-bit. I kept 16-bit, which is the default. A copy isn't held to the original's bit depth, and 8-bit would add hiss under the tail.
- The length is 1.37 s, not 1.30 s. The room tail adds about 0.07 s. The build's 10% length tolerance is met.
- No generated recording is in the mix. The sound is built from layers alone: a noise blast, a 60 to 40 Hz sine thump, a short high-passed crack, a low noise body, and some debris particles.

**The spec, to reproduce it** (save as a `.json` and build it):

```json
{
  "spec": "smak.sound/1",
  "name": "weapons/explode3.wav",
  "class": "explosion",
  "seed": 3,
  "length": 1.3,
  "layers": [
    { "id": "blast", "kind": "noise", "iterations": 32,
      "env": { "points": [[0, -40], [0.012, 0], [0.1, -6], [0.2, -18], [0.35, -30], [0.6, -45], [1.3, -70]] },
      "shape": { "keys": [
        { "at": 0, "curve": [[60, -2], [150, -1], [300, -2], [600, -3], [1200, -10], [2500, -14], [5000, -20], [11000, -36]] },
        { "at": 0.4, "curve": [[60, -6], [150, -5], [300, -6], [600, -7], [1200, -14], [2500, -20], [5000, -28], [11000, -46]] } ] } },
    { "id": "thump", "kind": "tone", "f": 60, "wave": "sine", "sweep": { "to": 40, "time": 0.4 },
      "env": { "attack": 0.003, "hold": 0.05, "decay": 0.2 }, "gain": -3 },
    { "id": "body", "kind": "noise", "filter": [{ "type": "lowpass", "f": 200 }, { "type": "highpass", "f": 40 }],
      "env": { "attack": 0.003, "hold": 0.02, "decay": 0.12 }, "gain": -1 },
    { "id": "crack", "kind": "noise", "filter": [{ "type": "highpass", "f": 1500 }],
      "env": { "decay": 0.02 }, "gain": -12 },
    { "id": "debris", "kind": "particles", "rate": 14, "band": [300, 1200], "grain": 0.01,
      "env": { "points": [[0, -30], [0.12, -16], [0.3, -30], [0.6, -45], [1.3, -70]] }, "gain": -12 }
  ],
  "finish": { "room": { "decay": 0.2, "wet": 0.05 }, "saturate": 1.5, "limit": { "crest": 8, "release": 0.002 }, "peak": -0.5 },
  "bands": { "<150": 37, "150-600": 36, "600-2k": 21, "2k-5k": 4, ">5k": 2 },
  "picture": "pictures/sound.png"
}
```

**Caveats:**
- The bands and the picture numbers came from your description and the picture in the work folder. I couldn't open the original's audio directly from here.
- The 60 Hz sine is what gives the sub-150 Hz power. Without it, the flatness and the band shares went the wrong way, which is why it stays.
- The report can't say how it sounds or how it plays in the game (volume, pitch, the map's room). Please listen to it in the game next to the original.
