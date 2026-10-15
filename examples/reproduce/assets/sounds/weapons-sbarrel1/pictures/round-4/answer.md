The sound is built and the build says OK: `work:sound/weapons/sbarrel1.wav`, 22050 Hz, 8-bit mono, 1.04 s, peak -0.6 dBFS. It is a reconstruction from the original's spectrogram picture, not a copy of its samples. I could not listen to it, so the match is by measurement only.

Against the original's picture (`input/sound.png`, 1.04 s):

| Feature | Original (picture) | Made sound |
| --- | --- | --- |
| Length | 1.04 s | 1.04 s |
| Centroid (the brightness centre, Hz) | 615 | 609 |
| Crest (peak over average loudness, dB) | about 11.2 | 11.0 |
| T20 (seconds to fall 20 dB) | 0.46 to 1.01 range | 0.81 |
| Bands, 150 to 600 Hz | | 10.3 points off, the largest remaining gap |

Against the game's own gunshots, all 22 features are in range.

The spec:

```json
{
  "spec": "smak.sound/1",
  "name": "weapons/sbarrel1.wav",
  "class": "gunshot",
  "bits": 8,
  "rate": 22050,
  "seed": 7,
  "length": 1.04,
  "layers": [
    {
      "id": "blast", "kind": "noise", "color": "pink", "length": 1.04, "iterations": 32,
      "shape": { "keys": [
        { "at": 0,    "curve": [[50,5],[150,5],[400,0],[1000,-3],[3000,-10],[8000,-24]] },
        { "at": 0.35, "curve": [[50,3],[150,3],[400,-2],[1000,-8],[3000,-20],[8000,-36]] },
        { "at": 0.8,  "curve": [[50,1],[150,1],[400,-4],[1000,-12],[3000,-28],[8000,-44]] }
      ] },
      "env": { "points": [[0,-6],[0.02,0],[0.08,-2],[0.2,-6],[0.35,-12],[0.6,-22],[0.85,-34],[1.04,-45]] }
    },
    { "id": "crack", "kind": "noise", "color": "white", "length": 0.01,
      "filter": [{ "type": "highpass", "f": 2000 }], "env": { "decay": 0.01 }, "gain": -4, "post": true },
    { "id": "thump", "kind": "tone", "f": 110, "wave": "sine", "length": 0.5,
      "sweep": { "to": 45, "time": 0.3 }, "env": { "attack": 0.002, "decay": 0.25 }, "gain": -8 },
    { "id": "echo", "kind": "noise", "color": "pink", "at": 0.3, "length": 0.45,
      "filter": [{ "type": "lowpass", "f": 900 }], "env": { "attack": 0.02, "decay": 0.2 }, "gain": -10 }
  ],
  "finish": { "saturate": 2, "limit": { "crest": 11, "release": 0.002 }, "peak": -0.5 },
  "picture": "pictures/sound.png"
}
```

What the layers do:
- **blast:** a pink-noise body with a spectrum that darkens over time, matching the original's bright low end that fades from the top down.
- **crack:** a short high-passed click at the onset.
- **thump:** a falling sine for the low boom.
- **echo:** a low-passed burst at 0.3 s, for the second bulge in the original's waveform.

Notes:
- I kept `saturate` at 2 and the limiter at 11 dB crest. Saturation of 2.5 or a 9 dB crest flattened the envelope into a constant hum, so I backed off.
- The 150 to 600 Hz band is the one gap left. Pushing it lower moved the centroid too far, so I kept the balance that scored best overall.
- The game-side level and room are not checked here. Listen to it in the game before you trust the match.
