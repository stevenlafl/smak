The sound is built and the build says OK: `work:sound/weapons/explode3.wav`, to go in `<mod>/sound/weapons/` so the game plays it in place of the original. I did not compare it against the original file, which I don't have here. The measurements below are from the build's own report, and how it sounds is for you to judge in the game.

| Feature | Built file | Original (as described) |
|---|---|---|
| Length | 1.3 s | 1.3 s |
| Format | 22050 Hz, 8-bit, mono | 22050 Hz, 8-bit, mono |
| Start | 0 ms attack, full level | instant, full level |
| Half amplitude | about 0.8 s | about 0.8 s |
| T20 (time to −20 dB) | 0.83 s (class range 0.67 to 1.11) | not given |
| Band below 150 Hz | 40% | 35% |
| Band 150 to 600 Hz | 35% | 30% |
| Band 600 to 2000 Hz | 16% | 20% |
| Band 2000 to 5000 Hz | 6.5% | 10% |
| Band above 5000 Hz | 2.8% | 5% |
| Centroid | 705 Hz | not given |
| Flatness | 0.135 | noisy, no tone |

The build reports all 22 features in the range of the game's own explosion sounds.

**What it is:** a pink-noise body with a spectrum that falls over time, so the highs fade faster than the lows. It is driven hard by saturation for the clipped wall, and has a slow crackle of debris under it. There is no tone and no separate impact after the first blast. Nothing was generated, so there is no licence to declare.

**Gaps to know about:**
- **Flatness is above the class range** (0.135 is inside it, but the build's first readings were 0.19 and 0.20 in the range of 0.05 to 0.15). The original's flatness is not given, so this may be fine. Bringing it down would need some tonal content, which the character you gave rules out.
- **The high-band shares are a little low** (600 to 2000 Hz at 16% against 20%, and above 2 kHz at 9% against 15%). I tried to close that and overshot: the centroid went to 968 Hz, which is too bright for the class. I rebuilt the version above, which is the best balance I got.
- **8-bit has a hiss warning** under the quiet tail. You asked for 8-bit, so I kept it.

The spec, for reproducing it:

```json
{"spec":"smak.sound/1","name":"weapons/explode3.wav","class":"explosion","rate":22050,"bits":8,"seed":7,"length":1.3,
 "layers":[
  {"id":"body","kind":"noise","color":"pink","iterations":32,
   "shape":{"keys":[{"at":0,"curve":[[40,4],[100,5],[150,3],[300,-4],[600,-5],[1000,-7],[2000,-9],[5000,-14],[11000,-22]]},
                    {"at":0.45,"curve":[[40,4],[100,5],[150,3],[300,-4],[600,-8],[1000,-13],[2000,-20],[5000,-28],[11000,-40]]}]},
   "env":{"points":[[0,0],[0.45,-0.5],[0.8,-6],[1.0,-14],[1.15,-26],[1.3,-45]]},"gain":0},
  {"id":"debris","kind":"particles","rate":260,"band":[200,1500],"grain":0.004,
   "env":{"points":[[0,-6],[0.45,-4],[0.9,-16],[1.3,-40]]},"gain":-11}],
 "finish":{"saturate":8,"peak":-0.5}}
```

The spec is not saved as a file in the work folder, so the JSON above is the only copy of it.
