The sound is built and the build says OK with no warnings: `work:sound/weapons/sbarrel1.wav`. Nobody has heard it in the game yet, so the modder's ears decide whether it beats the stock one.

**What it is:** one shotgun blast from a generated take, about 1.1 seconds long, with a short low thump and a sharp crack under the start. The generated take also had a slide rack about 1.6 seconds in. I cut the sound before it, so this is the shot alone, not a pump rack.

**How it was made:**
1. I generated four takes from the caption "a pump action shotgun firing, one loud blast then a metal slide racking, close-miked, dry". Take 1 (seed 1) had the cleanest single blast.
2. The spec, built as a `gunshot` sound:

```json
{
  "spec": "smak.sound/1",
  "name": "weapons/sbarrel1.wav",
  "class": "gunshot",
  "seed": 1,
  "length": 1.2,
  "layers": [
    { "id": "shot", "kind": "sample", "file": "work:gen/shotgun_fire_s1.wav", "from": "onset", "length": 1.2,
      "filter": [{ "type": "highpass", "f": 90 }, { "type": "lowpass", "f": 2200, "q": 0.7 }],
      "env": { "attack": 0.002, "hold": 0.6, "decay": 0.6 } },
    { "id": "boom", "kind": "tone", "f": 200, "wave": "sine", "sweep": { "to": 100, "time": 0.2 },
      "env": { "attack": 0.002, "decay": 0.25 }, "gain": -8 },
    { "id": "crack", "kind": "noise", "color": "white", "filter": [{ "type": "highpass", "f": 2000 }],
      "env": { "attack": 0.001, "decay": 0.004 }, "gain": -6, "post": true }
  ],
  "finish": { "saturate": 2, "limit": { "crest": 9, "release": 0.002 }, "peak": -0.5 }
}
```

3. The build's first pass was too bright, then too dark, then too short. Each pass changed one thing: the low-pass filter, the thump's level and pitch, then the sample's tail. The final version measures 22 of 22 features in range for the game's gunshot sounds.

**Measured:** 22050 Hz, 16-bit mono, about 1.1 s, peak -0.5 dBFS, centroid (brightness centre) 876 Hz, T20 (time to fall 20 dB) 0.69 s.

**Licence:** the take comes from woosh-dflow, whose weights are Creative Commons Attribution Non-Commercial 4.0 (CC-BY-NC). You said the licences of the local generators were accepted for this test. If the mod is ever sold or used commercially, this sound cannot go in as it is.

**To use it:** copy `sound/weapons/sbarrel1.wav` into the mod's `sound/weapons/` folder. It replaces the stock file with no code. I did not compare it against the stock `sbarrel1.wav` by ear, and I cannot check its volume in the game, so the modder should listen to it there.
