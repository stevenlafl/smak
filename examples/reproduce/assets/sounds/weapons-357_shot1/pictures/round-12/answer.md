The sound is built as `weapons/357_shot1.wav` (written to the server's work folder as `sound/weapons/357_shot1.wav`), and the build says OK. I couldn't listen to it, so the match is from the measurements and the picture only. The final build is the one on disk.

**What it is:** a 22050 Hz, 16-bit mono file of 1.12 s. It is a short broadband crack at the start, a low boom that falls, a body of noise shaped to the original's spectrum, and a generated revolver take filtered and enveloped as the tail. Peak is -0.5 dBFS.

**Against the original's picture:**

| Measure | Original | Made | Off by |
| --- | --- | --- | --- |
| Length | 1.06 s | 1.12 s | 6% |
| Centroid (brightness centre) | 921 Hz | 942 Hz | 2% |
| Band shares (<150 / 150-600 / 600-2k / 2k-5k) | within 5.7 points | | |
| Time to -20 dB (T20) | in range (0.46 to 1.01 s) | 0.99 s | in range |
| Crest (peak over RMS) | about 10 | 12.5 | 2.5 dB, within the picture's 3 dB tolerance |

**Choices and gaps you should know about:**
- **16-bit, not 8-bit.** The original is 8-bit. The build warns that 8-bit adds a hiss under the tail, so I took the default depth. Say if you want 8-bit to match the original's depth.
- **Crest is above the gunshot class's top (12.5 against 11.7).** Pulling it lower lifts the tail through the limiter, and T20 goes out of range. I kept the tail in range.
- **The body noise sits over the take.** The build warns about this. I tested dropping the body, and the sound went dark and boom-heavy (centroid 238 Hz), so I kept it.
- **Licence:** the take is from woosh-dflow, CC-BY-NC 4.0 (weights; code MIT). That is non-commercial. You said that's fine for this test, so I used it. It would need replacing for a commercial release.
- **Seed:** the take is seed 0 of the revolver prompt. The spec uses seed 7 for its own noise.

**The spec:**

```json
{
  "spec": "smak.sound/1", "name": "weapons/357_shot1.wav", "class": "gunshot", "seed": 7,
  "length": 1.06, "rate": 22050, "bits": 16,
  "picture": "pictures/sound.png",
  "layers": [
    { "id": "crack", "kind": "noise", "color": "white", "filter": [{ "type": "highpass", "f": 1500 }],
      "env": { "attack": 0.001, "decay": 0.02 }, "gain": -4, "post": true },
    { "id": "body", "kind": "noise",
      "shape": [[60, -4], [150, 0], [500, 0], [1000, -1], [2000, -5], [4000, -15], [8000, -30]],
      "env": { "points": [[0, -6], [0.005, 0], [0.1, -6], [0.3, -20], [0.6, -40], [1.06, -60]] },
      "gain": -4, "iterations": 16 },
    { "id": "boom", "kind": "tone", "f": 110, "wave": "sine", "sweep": { "to": 45, "time": 0.25 },
      "env": { "attack": 0.001, "decay": 0.3 }, "gain": 0 },
    { "id": "take", "kind": "sample", "file": "work:gen/a_large_revolver_s0.wav", "from": "onset", "length": 1.06,
      "filter": [{ "type": "lowpass", "f": 2000 }, { "type": "peak", "f": 900, "q": 0.8, "gain": 4 }],
      "env": { "points": [[0, 0], [0.05, 0], [0.3, -8], [0.5, -20], [0.8, -35], [1.06, -50]] }, "gain": -4 }
  ],
  "finish": { "room": { "decay": 0.2, "wet": 0.08 }, "saturate": 3.5,
              "limit": { "crest": 13, "release": 0.002 }, "peak": -0.5 }
}
```

One thing I noticed: the take's peak filter made no measurable difference in any of the builds. The tool may be ignoring filters on a sample layer, so the mid lift came from the body layer instead.
