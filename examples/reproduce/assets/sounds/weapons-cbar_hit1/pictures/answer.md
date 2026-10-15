The sound is built and the build says OK: `weapons/cbar_hit1.wav`, 11025 Hz 8-bit mono, 0.712 s, written to the server's work folder at `sound/weapons/cbar_hit1.wav`. It has no warnings and no faults.

I could not listen to it, so "as good as the original" rests on the measurements, not on ears. The one thing I could not compare against is the game's own file: the reference folders weren't given to the server, so the check was against the original's picture and the game's class ranges.

**Against the original's picture (the report's own reading):**

| Feature | Original (picture) | Made | Result |
| --- | --- | --- | --- |
| Length | 0.69 s | 0.712 s | 3% off |
| Onset | instant | 0 ms attack | matches |
| Centroid | 1467 Hz | 1406 Hz | 4% off |
| Bands (150-600, 600-2k, 2k-5k) | about 3 to 5, 69, 19 % | 3.3, 73.3, 23.3 % | within 5 points |
| Crest | about 9.8 dB | 9 dB | within 1 dB |
| Onsets | 0 | 0 | matches |

**Against the game's metal-hit class:** 22 of 22 features in range. T20 is 0.254 s (range 0.24 to 0.7).

**Final spec:**

```json
{
  "spec": "smak.sound/1",
  "name": "weapons/cbar_hit1.wav",
  "class": "metal hit",
  "seed": 3,
  "rate": 11025,
  "bits": 8,
  "length": 0.66,
  "layers": [
    { "id": "body", "kind": "noise", "color": "white",
      "filter": [{ "type": "highpass", "f": 200 }, { "type": "lowpass", "f": 4500 }],
      "env": { "attack": 0.001, "decay": 0.45 }, "gain": -2 },
    { "id": "air", "kind": "noise", "color": "white",
      "filter": [{ "type": "highpass", "f": 2500 }, { "type": "lowpass", "f": 5000 }],
      "env": { "attack": 0.001, "decay": 0.12 }, "gain": -9 },
    { "id": "ring", "kind": "modes", "f": 760, "ratios": "bar", "decay": 0.6, "damping": 1.2, "gain": -10 },
    { "id": "crack", "kind": "noise", "color": "white",
      "filter": [{ "type": "highpass", "f": 2000 }],
      "env": { "attack": 0.001, "decay": 0.004 }, "post": true, "gain": -6 }
  ],
  "finish": {
    "saturate": 1.5,
    "room": { "decay": 0.2, "wet": 0.1 },
    "limit": { "crest": 9.8, "release": 0.002 },
    "peak": -0.5
  },
  "picture": "pictures/sound.png"
}
```

**What I changed on the way, and why:**
- **Slow onset:** the first builds rose over about 0.2 s. The limiter was squashing the click, so the crack moved to a `post` layer, which is added after the limiter and keeps the hit's start sharp.
- **Shaped noise smeared the start:** the spectrum-curve layer had frames about 0.19 s long, so I built the body from filters instead.
- **Too pure, then too bright:** the ring alone made one line dominate. I cut its level, moved energy up into 2 to 5 kHz, then pulled back once it overshot.

**Left as is:**
- The length is 0.712 s, not 0.66 s: the tail is trimmed by the finish, so the requested length is not exact. It is 3% over the original, which I judged acceptable.
- This is layers only. The server offers a generated-recording route (the `generate` tool) that could add the grain of a real hit, but its model is licensed CC-BY-NC, so it is not commercial-safe. I did not use it. Tell me if you want a generated take tried.
- `hit2` variants were not asked for, so none were made.
