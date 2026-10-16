The sound is built and the build says OK: `work:sound/debris/bustmetal1.wav`, 0.87 s, 11025 Hz, 8-bit mono. It is a drop-in for the game's `debris/bustmetal1.wav` once it sits under `<mod>/sound`. I have not heard it, and the game has not played it.

The sound is a generated take of a metal break, cut and shaped with layers: an instant hit, a dense clatter, and faint ringing. It is not a copy of the original.

Measured against your targets:

```
Band            Original   Made
under 150 Hz       8%       6.4%
150-600 Hz        22%       21.9%
600-2000 Hz       38%       37%
2000-5000 Hz      30%       33.7%
over 5000 Hz       2%       1%
```

- **Envelope:** The level starts at full with no fade-in. Amplitude is about 50% (−6 dB) at 0.3 s and 25% (−12 dB) at 0.45 s. It is near silent by 0.75 s (−40 dB), and the last 0.03 s is silent.
- **Length and rate:** 0.867 s, 11025 Hz, 8-bit, mono, played once with no loop.
- **Not matched:** Flatness is 0.42 against the game's metal hits at 0.16 to 0.28, so this sounds noisier than a tonal metal hit. I kept it because your description says the sound is mainly noisy. The centroid is 1869 Hz, a little above the metal class range of 1074 to 1654 Hz, because your description puts most energy in the mids and upper mids.
- **Class:** The build has no debris class, so I held it against `metal hit`.
- **Reference:** I did not get a game reference picture, since no game folder was in the build's reach.

**Licence:** The first hit is a sample from woosh-dflow (CC-BY-NC 4.0, non-commercial), which you said you accept for this test. The other layers are generated with SMAK's own code.

The spec is inline, not saved as a file, so it is not in the repo. Here it is for saving:

```json
{"spec":"smak.sound/1","name":"debris/bustmetal1.wav","class":"metal hit","rate":11025,"bits":8,"seed":7,"length":0.87,
"layers":[
{"id":"hit","kind":"sample","file":"work:gen/debris_metal_s2.wav","from":"onset","length":0.6,"gain":-1,
 "env":{"points":[[0,0],[0.004,0],[0.15,-1],[0.3,-6],[0.45,-12],[0.6,-20],[0.75,-40],[0.84,-55],[0.87,-60]]},
 "filter":[{"type":"highpass","f":70},{"type":"peak","f":300,"q":0.9,"gain":1},{"type":"peak","f":1200,"q":0.6,"gain":-3},{"type":"peak","f":3200,"q":0.8,"gain":3}]},
{"id":"body","kind":"tone","f":110,"wave":"sine","sweep":{"to":70,"time":0.05},"gain":-14,
 "env":{"points":[[0,0],[0.005,-2],[0.05,-12],[0.12,-24],[0.25,-40],[0.4,-60]]}},
{"id":"clatter","kind":"particles","rate":350,"band":[2000,5000],"grain":0.002,"gain":-8,
 "env":{"points":[[0,-40],[0.01,-3],[0.15,-3],[0.3,-9],[0.45,-15],[0.6,-22],[0.75,-40],[0.84,-55],[0.87,-60]]}},
{"id":"ring","kind":"modes","f":1150,"ratios":[1,1.63,2.41,3.37,4.52],"gains":[0,-4,-6,-9,-12],"decay":0.5,"damping":1.2,"gain":-14,
 "env":{"points":[[0,-30],[0.01,0],[0.3,-6],[0.6,-22],[0.75,-40],[0.87,-60]]}}],
"finish":{"saturate":1.5,"limit":{"crest":12,"release":0.002},"peak":-0.5}}
```

Things to know:
- The build warns that 8-bit adds a faint hiss under the quiet tail. I left it at 8-bit to match the original's depth.
- The sample was made by a take from `generate` with seed 2, and the spec points at `work:gen/debris_metal_s2.wav`. That file is needed to rebuild it.

Next step: listen to it in the game (or against the original) and tell me what sounds off. The spec's levels can be changed quickly if it needs to be louder or brighter.
