The sound is built and the build says OK: `work:sound/weapons/cbar_hit1.wav`, 11025 Hz, mono, 8-bit, 0.69 s. It is layers only, with no generated recording, so no generator licence applies. The game's own file was not in the folders this server was given, so the build could not draw it beside the copy. The side-by-side is yours to make.

**Measured against your numbers**

```
Measure            Original (your figure)   This build
Length             0.69 s                   0.69 s
Attack             instant                  10 ms (T20 0.54 s, T40 0.67 s)
under 150 Hz       20%                      20.2%
150 to 600 Hz      35%                      36.7%
600 to 2000 Hz     30%                      26.7%
2000 to 5000 Hz    13%                      15.3%
over 5000 Hz       2%                       1.1%
1.1 kHz ring       steady, visible in tail  present, steady, visible in the spectrogram
Flatness           not given                0.35 (the game's metal hits are 0.16 to 0.28)
Centroid           not given                1041 Hz (the game's metal hits are 1074 to 1654)
```

The build's own report also flags the flatness and centroid as too noisy and too dark against the game's metal hits. I kept your band shares as the target over that class range. If you want the sound brighter and more tonal, the next step is a different noise shape, and I'd expect it to move the band shares.

**How it is made**
- **Click:** a 12 ms high-passed burst at the start, for the contact click.
- **Body:** broadband noise with an envelope at full level to 0.30 s, a swell to 0.35 s, a fall to about a third by 0.43 s, and near silence by 0.69 s. Its spectrum is shaped to the band shares above, with a notch at 330 Hz and a lift at 1.4 kHz.
- **Rattle:** 120 short grains between 700 Hz and 4 kHz, dying out by 0.4 s.
- **Ring:** a 1100 Hz mode that rings to the end, with fainter modes at 320 and 460 Hz.
- **Finish:** mild saturation and a limiter with a crest of 9 dB.

**Warnings from the build, kept on purpose**
- **8-bit hiss:** the build warns of hiss under the quiet tail. That hiss is part of the original, so I kept 8 bits.
- **Dry tail:** the build warns the tail dies sooner than the game's metal hits. The original has no room either, so I did not add one.

**Tool note:** in `modes`, a mode with `gain: 0` is silent. I used -2 for the 1.1 kHz ring instead, so any later build should avoid exactly 0.

**Spec to rebuild it** (the build's file is in the work folder, and the spec is above):

```json
{
  "spec": "smak.sound/1",
  "name": "weapons/cbar_hit1.wav",
  "class": "metal hit",
  "seed": 3,
  "rate": 11025,
  "bits": 8,
  "length": 0.69,
  "layers": [
    { "id": "click", "kind": "noise", "length": 0.012, "filter": [{ "type": "highpass", "f": 1500 }], "env": { "attack": 0, "decay": 0.006 }, "gain": -3 },
    { "id": "body", "kind": "noise", "length": 0.69,
      "shape": [[40, 14], [100, 12], [150, 8], [250, -6], [400, -10], [600, -3], [1000, 0], [2000, -3], [3000, -7], [5000, -8], [5500, -10]],
      "filter": [{ "type": "peak", "f": 330, "q": 0.8, "gain": -8 }, { "type": "peak", "f": 1400, "q": 0.7, "gain": 3 }],
      "env": { "points": [[0, 0], [0.3, -1], [0.35, 0], [0.4, -1], [0.43, -9], [0.5, -14], [0.6, -24], [0.69, -40]] },
      "gain": -4 },
    { "id": "rattle", "kind": "particles", "count": 120, "band": [700, 4000], "grain": 0.003, "at": 0.01, "length": 0.4,
      "env": { "points": [[0, -2], [0.2, -6], [0.4, -30]] }, "gain": -8 },
    { "id": "ring", "kind": "modes", "length": 0.69, "gain": -18,
      "modes": [{ "f": 1100, "gain": -2, "decay": 0.9 }, { "f": 320, "gain": -12, "decay": 0.6 }, { "f": 460, "gain": -14, "decay": 0.5 }] }
  ],
  "finish": { "saturate": 1.3, "limit": { "crest": 9, "release": 0.002 }, "peak": -0.5 }
}
```

I did not place the file in a game folder. To test it in the game, copy it to `<mod>/sound/weapons/` as the build notes say.
