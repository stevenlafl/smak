The sound is built and the build says OK with no warnings: `work:sound/weapons/sbarrel1.wav`, 22050 Hz 16-bit mono, 1.05 s. It goes in `<mod>/sound/weapons/` to replace the game's own file. I could not listen to it, so the match is by measurement only.

I read the original's picture (`pictures/sound.png`) and its facts line, not the original file itself: the input folder sits outside the folders this server can read.

**Measured against the original's picture**

| Feature | Original (picture) | Ours | Within |
| --- | --- | --- | --- |
| Length | 1.04 s | 1.05 s | 1% |
| Centroid (brightness) | 615 Hz | 664 Hz | 8% |
| Band 2 to 5 kHz | (closest band) | 6.7% | 2.3 points |
| T20 (time to fall 20 dB) | 0.46 to 1.01 s range | 0.67 s | in range |
| Crest (peak over RMS) | about 11.2 dB | 10.6 dB | within 0.6 dB |

Against the game's own gunshot sounds, all 22 features are in range.

**The spec**

```json
{
  "spec": "smak.sound/1",
  "name": "weapons/sbarrel1.wav",
  "class": "gunshot",
  "seed": 1,
  "length": 1.04,
  "picture": "pictures/sound.png",
  "layers": [
    { "id": "crack", "kind": "noise", "color": "white",
      "filter": [{ "type": "highpass", "f": 2000 }],
      "env": { "attack": 0.001, "decay": 0.012 }, "gain": -10 },
    { "id": "blast", "kind": "noise",
      "shape": [[60, -2], [150, -3], [400, -8], [1200, -13], [4000, -25], [11000, -42]],
      "env": { "points": [[0, -1], [0.03, 0], [0.25, -6], [0.45, -18], [0.7, -30], [1.04, -45]] } },
    { "id": "body", "kind": "tone", "f": 100, "wave": "sine",
      "sweep": { "to": 45, "time": 0.2 },
      "env": { "attack": 0.002, "decay": 0.2 }, "gain": -2 }
  ],
  "finish": {
    "room": { "decay": 0.1, "wet": 0.05 },
    "saturate": 1,
    "limit": { "crest": 11, "release": 0.002 },
    "peak": -0.5
  }
}
```

The layers are a broadband crack, a shaped noise blast that is loud for about 0.25 s and then falls to a quiet tail, and a low sine body that sweeps from 100 Hz to 45 Hz. The limiter's crest is set to 11 dB to match the original's dynamics.

**Choices I made**

- **Layers only, no recording.** I also generated four shotgun-blast takes with the recording tool. Blended in as a sample layer, the best take matched the envelope but added a non-commercial licence warning (CC-BY-NC 4.0 weights, so the sound may not be sold) and pushed the 150 to 600 Hz band further off. I kept the layers-only build, which has no licence restriction and scores better on the picture.
- **The spec is only in this message.** The build call wrote the file but no spec file was saved in the work folder.

**What the measurements cannot show**

How it sounds to a person, its volume and pitch in the game, and how the map's room changes it. Please listen to it in the game next to the original.
