The sound is built and the build says **OK**. It is at `work:sound/weapons/explode3.wav`. Copy it to `<mod>/sound/weapons/explode3.wav` and the game plays it in place of its own `weapons/explode3.wav`, with no code. I could not listen to it, so the decision on whether it beats the game's sound is yours to make in the game.

**How it was made**

1. I asked the local sound generator (Stable Audio 3 SFX) for four takes of "a hand grenade exploding, one sharp crack then a deep boom, debris scattering after, close-miked, dry", three seconds each. I picked seed 3 because its hit comes first and is the sharpest.
2. The final spec, built as a `smak.sound/1` file, is:

```json
{
  "spec": "smak.sound/1",
  "name": "weapons/explode3.wav",
  "class": "explosion",
  "rate": 22050,
  "bits": 16,
  "seed": 3,
  "length": 1.2,
  "layers": [
    {
      "id": "blast",
      "kind": "sample",
      "file": "work:gen/grenade_explode_s3.wav",
      "from": "onset",
      "length": 1.2,
      "filter": [
        { "type": "highpass", "f": 100 },
        { "type": "peak", "f": 1500, "q": 0.8, "gain": 8 },
        { "type": "peak", "f": 3000, "q": 1, "gain": 4 }
      ]
    }
  ],
  "finish": {
    "room": { "decay": 0.25, "wet": 0.1 },
    "saturate": 3,
    "limit": { "crest": 7, "release": 0.002 },
    "peak": -0.5
  }
}
```

**What the build reports**

- Format: 22050 Hz, 16-bit, mono, 1.37 s, peak -0.5 dBFS.
- Attack 45 ms, T20 (time to fall 20 dB) 0.82 s, centroid (brightness) 494 Hz.
- Against the game's explosion sounds, 21 of 22 measures are in range. The one still off is flatness (how much of the sound is noise rather than tone): 0.026 against a range of 0.05 to 0.15, so it is a little too tonal.
- No faults, and no clipping.

**Earlier attempts**

- A short noise "crack" layer put on top made the spectrum noisy and did not fix the attack, so I dropped it.
- An envelope on the take shortened the tail too much, so I dropped that as well.
- The take's loudest point is about 45 ms in, not at the very start. The build accepts that.

**Licence:** the take was made by Stable Audio 3 SFX under the Stability AI Community Licence. That licence is free for organisations under US$1M annual revenue, and needs an enterprise licence above that. You said the modder accepts the local generators' licences, so I have not changed anything for it. The take's sidecar file (`grenade_explode_s3.json`) records the licence and the prompt.

If it sounds too dark or too soft in the game, the easiest knobs are the two peak filters' gains and the `saturate` value.
