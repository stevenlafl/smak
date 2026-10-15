The sound is built and the build says OK. The file is `work:sound/player/pl_step1.wav`, 11025 Hz, 8-bit mono, 0.269 s, peak -0.6 dBFS. It is not yet copied into a game folder.

I took the original to be a concrete footstep (`class: "step concrete"`), since the name is a player step and that's the class the kit scores against. Its picture shows a low thump at the onset, a second small event near 0.09 s (heel then toe), and a decaying low-mid tail.

Measured against the picture I read off the original, the copy is:

| Feature | Original (from picture) | Made | Off by |
| --- | --- | --- | --- |
| Length | 0.27 s | 0.269 s | 0% |
| Centroid | 902 Hz | 866 Hz | 4% |
| Crest | about 21.8 dB | 21 dB | within 1 dB |
| T20 | 0.04 to 0.18 s range | 0.095 s | in range |
| Bands (under 150 / 150-600 / 600-2k / 2k-5k) | read off the picture | within 1.4 points | |

Against the game's own concrete steps, 19 of 22 features are in range. The three misses are at the edges: flatness 0.197 (range 0.2 to 0.35), the under-150 Hz band at 14.2% (range 15.2 to 36.8), and the 150-600 Hz band at 60.7% (range 38.3 to 59.7). Getting those three inside their ranges moved the centroid and length away from the picture, so I stopped there.

What the build cannot tell me: how it sounds to a person, or how the game plays it (volume, pitch, the map's room). Those need a listen in the game. The picture numbers are also the kit's reading of the original's picture, not of the original file itself, so a side-by-side listen is the real check.

The spec, which is what reproduces the bytes (seed 1):

```json
{
  "spec": "smak.sound/1",
  "name": "player/pl_step1.wav",
  "class": "step concrete",
  "rate": 11025,
  "bits": 8,
  "seed": 1,
  "length": 0.27,
  "layers": [
    { "id": "heel", "kind": "tone", "f": 120, "wave": "sine", "sweep": { "to": 50, "time": 0.03 }, "env": { "attack": 0.001, "decay": 0.04 }, "filter": [{ "type": "highpass", "f": 30 }], "gain": -1.5 },
    { "id": "crack", "kind": "noise", "color": "white", "filter": [{ "type": "highpass", "f": 1800 }], "env": { "attack": 0.0005, "decay": 0.008 }, "gain": -5 },
    { "id": "snap", "kind": "noise", "color": "white", "filter": [{ "type": "bandpass", "f": 3500, "q": 0.8 }], "env": { "attack": 0.0005, "decay": 0.015 }, "gain": -5 },
    { "id": "shimmer", "kind": "noise", "color": "white", "at": 0.005, "filter": [{ "type": "bandpass", "f": 4000, "q": 0.7 }], "env": { "attack": 0.003, "decay": 0.12 }, "gain": -13 },
    { "id": "grit", "kind": "noise", "color": "pink", "filter": [{ "type": "bandpass", "f": 330, "q": 0.5 }], "env": { "attack": 0.001, "decay": 0.05 }, "gain": -6 },
    { "id": "toe", "kind": "noise", "color": "pink", "at": 0.085, "filter": [{ "type": "bandpass", "f": 400, "q": 0.8 }], "env": { "attack": 0.002, "decay": 0.06 }, "gain": -9 },
    { "id": "tail", "kind": "noise", "color": "pink", "at": 0.01, "filter": [{ "type": "lowpass", "f": 600 }, { "type": "highpass", "f": 120 }], "env": { "attack": 0.004, "decay": 0.42 }, "gain": -12 }
  ],
  "finish": { "limit": { "crest": 21, "release": 0.002 }, "peak": -0.5 },
  "picture": "pictures/sound.png"
}
```

Two things I noticed along the way. Adding or removing a layer reshuffles the random noise, so the numbers jump; only gains and decays were tuned after the layer list settled. And the spec lives only in this conversation, since I have no way to write files into the work folder. Save it to the project if you want to rebuild it later.
