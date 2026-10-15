The sound is built and the build says OK: `work:sound/weapons/explode3.wav`, 22050 Hz, 8-bit mono, 1.3 s. Its name is the game's own, so it takes the place of `weapons/explode3.wav` when placed in `<mod>/sound`. It has no warnings and all 22 of the game's explosion features are in range.

Against the original's picture (the spectrogram, read by the kit's measure, not listened to):

| Measure | Original (picture) | Made | Off by |
| --- | --- | --- | --- |
| Length | 1.3 s | 1.3 s | 0% |
| Centroid (brightness) | about 605 Hz | 558 Hz | 8% |
| Band under 150 Hz | 36.7% | 35.7% | 1 point |
| Band 150–600 Hz | 36.2% | 36.3% | 0.1 point |
| Band 600–2k Hz | about 21% | 23.8% | 2.6 points |
| T20 (time to fall 20 dB) | 0.668 to 1.113 s | 1.063 s | in range |
| Crest (peak over RMS) | about 8.1 dB | 8 dB | 0.1 dB |

The one thing I could not confirm is onsets. The picture reading gave 1 to 3 and the made sound shows 0 distinct onsets, so the sharp crack at the start may be softer than the original's. I could not open the original's picture or the input folder directly: the Read tool was refused on the reproduce folder, and the picture's path only resolves on the server. The numbers above come from the kit's reading of that picture, not from my own view of it. Please listen to it in the game, since neither the kit nor I can judge how it sounds.

The spec, as built:

```json
{"spec":"smak.sound/1","name":"weapons/explode3.wav","class":"explosion","rate":22050,"bits":8,"length":1.3,"seed":3,"picture":"pictures/sound.png",
"layers":[
 {"id":"crack","kind":"noise","color":"white","filter":[{"type":"highpass","f":800},{"type":"lowpass","f":7000,"q":0.7}],"env":{"attack":0.001,"decay":0.08},"gain":-1},
 {"id":"boom","kind":"tone","f":110,"wave":"sine","sweep":{"to":45,"time":0.4},"env":{"attack":0.002,"decay":0.6},"gain":-2},
 {"id":"mid","kind":"noise","color":"pink","filter":[{"type":"bandpass","f":400,"q":0.6}],"env":{"points":[[0,-6],[0.02,-3],[0.4,-5],[0.9,-11],[1.2,-30],[1.3,-60]]},"gain":-1},
 {"id":"blast","kind":"noise","color":"pink","filter":[{"type":"lowpass","f":2000,"q":0.7}],"env":{"points":[[0,-10],[0.01,-4],[0.3,-6],[0.7,-10],[1.0,-22],[1.3,-40]]},"gain":-3},
 {"id":"hiss","kind":"noise","color":"white","filter":[{"type":"highpass","f":2500}],"env":{"attack":0.001,"decay":0.25},"gain":-4}],
"finish":{"saturate":4,"limit":{"crest":8,"release":0.002},"peak":-0.5}}
```

My choices: the class is `explosion`, the seed is 3, and I built from layers rather than a generated take, since the original has no recording to match. The spec is not saved to a file; it lives in this message.
