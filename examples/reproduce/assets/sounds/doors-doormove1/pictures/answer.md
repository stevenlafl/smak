The sound builds OK with no warnings: `work:sound/doors/doormove1.wav`, 11025 Hz, 8-bit mono, 5.04 s. It will take the place of the game's `doors/doormove1.wav` when it is put in `<mod>/sound`.

**The spec (what the final build used):**

```json
{
  "spec": "smak.sound/1",
  "name": "doors/doormove1.wav",
  "rate": 11025,
  "bits": 8,
  "length": 5.04,
  "seed": 3,
  "picture": { "file": "pictures/sound.png", "length": 5.04, "rate": 11025 },
  "layers": [
    {
      "id": "motor",
      "kind": "sample",
      "file": "work:gen/doormove_s0.wav",
      "from": "onset",
      "length": 5.04,
      "env": { "points": [[0,-16],[1.5,-16],[3.5,-14],[4.0,-9],[4.2,-1],[4.3,-4],[4.4,-10],[4.6,-20],[4.9,-34],[5.04,-40]] },
      "filter": [
        { "type": "highpass", "f": 100 },
        { "type": "peak", "f": 350, "q": 0.8, "gain": 4 },
        { "type": "lowpass", "f": 2500 }
      ]
    },
    {
      "id": "grit",
      "kind": "noise",
      "color": "white",
      "filter": [{ "type": "bandpass", "f": 900, "q": 0.6 }],
      "env": { "points": [[0,-24],[1.5,-22],[3.5,-18],[4.0,-10],[4.2,-3],[4.3,-6],[4.4,-12],[4.6,-22],[4.9,-34],[5.04,-40]] },
      "gain": -18
    }
  ],
  "finish": { "saturate": 1.5, "peak": -0.5 }
}
```

**Choices I made:**
- **Source take:** of the four woosh-dflow takes, seed 0 had the closest shape to the original: sustained activity with a burst late in the clip. It is in a `sample` layer, from its onset.
- **Envelope:** the loudest point is at about 4.2 s, where the original's final burst is. The tail falls to -20 dB about 0.4 s after the peak.
- **Brightness:** a 2.5 kHz lowpass, a mid lift at 350 Hz and a bandpassed noise layer bring the centroid to match the original's.
- **Licence:** the take is from woosh-dflow (CC-BY-NC 4.0, non-commercial). You said that is accepted for this test.

**Where it stands against the picture of the original:**

```
measure         original (picture)   ours (final build)
length          5.04 s               5.04 s
centroid        589 Hz               585 Hz
T20             0.35 to 0.58 s       0.43 s
crest           about 12.7 dB        14.8 dB (within the 3 dB the report allows)
600-2k band     about 28% of power   22%, within the 7-point aim
```

**What I could not do:**
- I could not read the original WAV. The read of its `input` folder was refused, so every comparison is against the spectrogram picture of the original (the report's own readings from it), not sample for sample.
- Our sound is smoother than the original. The original has clear clanks and harmonic bands; ours is a steadier roar with the right loudness shape. The report does not measure that, so it needs a listen.
- It has not been heard in the game. Its volume, pitch and the map's room are not checked by the build.

If you can make the original file available to read, I can compare the two directly and tighten the match.
