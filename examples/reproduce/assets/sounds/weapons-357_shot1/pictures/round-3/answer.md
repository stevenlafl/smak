The sound builds OK: `work:sound/weapons/357_shot1.wav`, named so the game loads it in place of the original.

The final build measures:

| Feature | Result | Original (from its picture) |
| --- | --- | --- |
| Length | 1.06 s | 1.06 s |
| T20 (time to fall 20 dB) | 0.718 s | 0.458 to 1.013 s |
| Centroid (brightness) | 932 Hz | 921 Hz |
| Crest (peak over RMS) | 10.9 dB | about 10 dB |
| Peak | -0.5 dBFS | n/a |
| RMS | -11.4 dBFS | n/a |
| Gunshot features in the game's range | 22 of 22 | n/a |

The check reports no faults. The bands are up to 10 points off the picture's, mostly in the under-150 Hz band.

I worked from the spectrogram picture and its facts line, not the original WAV, so the match is to those measurements. I can't hear either file here, so the report's note stands: listen to it in the game, since its volume and the map's room are not checked.

The sound is built from three layers: a 120 Hz sine thump that falls to 45 Hz, a pink-noise blast with a fast fall after 0.46 s, and a band-limited white-noise layer for brightness. A white-noise crack sits after the saturation. Saturation at 6 gives the sustained body, and I dropped the limiter because it lifted the tail and pushed T20 past the original's range.

This is the spec that produced it. It was passed inline, so I haven't saved it to a file in the project; say where you want it kept and I'll write it there.

```json
{"spec":"smak.sound/1","name":"weapons/357_shot1.wav","class":"gunshot","seed":1,"length":1.06,"picture":"pictures/sound.png",
 "layers":[
  {"id":"thump","kind":"tone","f":120,"wave":"sine","sweep":{"to":45,"time":0.15},"env":{"attack":0.001,"decay":0.25},"gain":4},
  {"id":"blast","kind":"noise","color":"pink","filter":[{"type":"bandpass","f":700,"q":0.8},{"type":"lowpass","f":7000,"q":0.7}],
   "env":{"points":[[0,-3],[0.01,0],[0.3,-4],[0.46,-10],[0.6,-18],[0.8,-26],[1.06,-40]]},"gain":10.5},
  {"id":"bright","kind":"noise","color":"white","filter":[{"type":"highpass","f":1500},{"type":"lowpass","f":4000}],
   "env":{"points":[[0,-3],[0.01,0],[0.3,-4],[0.46,-10],[0.6,-18],[0.8,-26],[1.06,-40]]},"gain":-10},
  {"id":"crack","kind":"noise","color":"white","filter":[{"type":"highpass","f":2000}],"env":{"attack":0.0005,"decay":0.012},"gain":-4,"post":true}],
 "finish":{"saturate":6,"peak":-0.5}}
```
