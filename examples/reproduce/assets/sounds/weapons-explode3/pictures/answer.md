The sound is built and passes every check: `OK: built, and every check passed`. It is written to `work:sound/weapons/explode3.wav`, so copy it into `<mod>/sound/weapons/` to replace the game's file.

Measured against the original (both from the picture and against the class of the game's explosion sounds):

| Feature | Original (from picture) | Made | Result |
| --- | --- | --- | --- |
| Length | 1.3 s | 1.3 s | match |
| Centroid (brightness) | about 605 Hz | 610 Hz | 1% off |
| Crest (peak over RMS) | about 8.1 dB | 8.2 dB | within 0.1 dB |
| T20 (time to -20 dB) | 0.67 to 1.11 s | 1.07 s | in range |
| Class features | | 22 of 22 | every one in range |

The check is numbers only. I have not listened to it, and the report says the in-game volume and the map's room are not checked here. Please play it in the game next to the original.

The spec, for reproducing it:

```json
{
  "spec": "smak.sound/1", "name": "weapons/explode3.wav", "class": "explosion", "seed": 3,
  "length": 1.3, "picture": "pictures/sound.png",
  "layers": [
    { "id": "blast", "kind": "noise", "iterations": 32, "drive": 6,
      "shape": { "keys": [
        { "at": 0, "curve": [[60, 4], [200, 6], [600, 2], [1000, -2], [2000, -10], [5000, -22], [11000, -38]] },
        { "at": 0.5, "curve": [[60, 2], [200, 3], [600, 0], [1000, -4], [2000, -14], [5000, -26], [11000, -44]] } ] },
      "filter": [{ "type": "lowpass", "f": 2500, "q": 0.7 }],
      "env": { "points": [[0, -2], [0.01, 0], [0.5, -4], [0.75, -12], [1.0, -22], [1.3, -45]] }, "gain": 0 },
    { "id": "hiss", "kind": "noise", "color": "white",
      "shape": [[60, -10], [500, -6], [2000, -4], [6000, -8], [11000, -14]],
      "env": { "points": [[0, -6], [0.05, 0], [0.5, -4], [0.8, -14], [1.3, -45]] }, "gain": -4 },
    { "id": "boom", "kind": "tone", "f": 90, "wave": "sine", "sweep": { "to": 35, "time": 0.6 },
      "env": { "points": [[0, 0], [0.02, 0], [0.4, -8], [0.7, -18], [1.0, -32], [1.3, -50]] }, "gain": 0 },
    { "id": "crack", "kind": "noise", "color": "white", "filter": [{ "type": "highpass", "f": 2000 }],
      "env": { "decay": 0.02 }, "post": true, "gain": -8 },
    { "id": "debris", "kind": "particles", "rate": 80, "band": [300, 3000], "grain": 0.01,
      "env": { "points": [[0, -40], [0.1, -18], [0.5, -12], [0.8, -24], [1.3, -50]] }, "gain": -3 }
  ],
  "finish": { "saturate": 4.5, "peak": -0.5 }
}
```

What I chose along the way:
- **No limiter.** A crest limit flattened the decay: the quiet tail was lifted back to the same level as the body. The loudness and crest come from a `drive` on the blast layer instead.
- **Low-pass on the blast, plus a quiet hiss.** The driven noise was too bright, and it left holes in the spectrum (flatness 0.005). The low-pass and hiss fixed both.
- **The picture is the only source.** The spec is a hand-made draft from the picture. I did not use the `reference` field, so the game's own sounds were only used for the class ranges.

The spec exists only in this conversation. If you want it kept, I can write it into the project next to the asset.
