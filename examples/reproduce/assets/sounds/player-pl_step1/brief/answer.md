The sound is made and the build says OK. It is in `work:sound/player/pl_step1.wav`, and it goes in the mod's `sound/player/` folder under the same name. Nobody has listened to it yet: the measurements can't say whether it's as good as the game's own step. Please have the modder play it in the game and compare.

**What I made**

- The source is a generated take from woosh-dflow, a local sound model, prompted with "hard leather shoe heel stepping onto a concrete floor, one sharp tap and a short scuff, close-miked, dry". I tried a boot prompt first, then the heel prompt, which measured closer to a concrete step.
- I kept seed 1 of the heel takes, trimmed it to 0.35 s, and cut its low rumble with a high-pass at 120 Hz. I added a small boost at 4 kHz and a short white-noise crack after the limiter for the click. A small room adds a little space.
- Format: 22050 Hz, 16-bit, mono, 0.26 s long, peak -0.5 dBFS.

The spec I built from:

```json
{
  "spec": "smak.sound/1",
  "name": "player/pl_step1.wav",
  "class": "step concrete",
  "seed": 1,
  "length": 0.35,
  "layers": [
    {
      "id": "step",
      "kind": "sample",
      "file": "work:gen/step_heel_s1.wav",
      "from": "onset",
      "length": 0.35,
      "env": { "attack": 0.002, "decay": 0.15 },
      "filter": [
        { "type": "highpass", "f": 120 },
        { "type": "peak", "f": 4000, "q": 1, "gain": 3 }
      ]
    },
    {
      "id": "crack",
      "kind": "noise",
      "color": "white",
      "at": 0,
      "env": { "decay": 0.008 },
      "filter": [{ "type": "highpass", "f": 2500 }],
      "gain": -2,
      "post": true
    }
  ],
  "finish": {
    "room": { "decay": 0.25, "wet": 0.12 },
    "limit": { "crest": 17, "release": 0.002 },
    "peak": -0.5
  }
}
```

**How it measures against the game's concrete steps**

- 15 of 22 measured features are in the range of the game's own concrete steps.
- Still off: the centroid (the frequency centre of its energy) is 674 Hz, just under the game's 678 to 1024 Hz, so it sounds a little dark. Its 150 to 600 Hz share is 70%, against the game's 38 to 60%. Its low end under 150 Hz is 4%, against the game's 15 to 37%. Its flatness is 0.009, against 0.2 to 0.35, so it is more tonal than a game's step. Its crest (the peak against the average level) is 13.4 dB, against 14 to 26 dB, so it is a little squashed by the limiter.
- I tried to fix the low end with a low thump layer. That made it much worse, so I dropped it and rebuilt this version.

**Licence: please read this**

The take comes from woosh-dflow. Its weights are licensed CC-BY-NC 4.0 (Creative Commons, Attribution, NonCommercial), so the sound is non-commercial only. You said the licences of the local generators are accepted for this test. Please pass that on to the modder: if the mod is ever sold or monetised, this sound cannot go in it without a different source.
