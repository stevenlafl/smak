The sound is built and the build says **OK**: `work:sound/weapons/sbarrel1.wav`, to install as `<mod>/sound/weapons/sbarrel1.wav` so the game plays it in the original's place. I have not heard it, and the game's volume and mix aren't checked here, so it needs a listen in the game.

I built it from layers only. I tried the local generator (woosh-dflow, a CC-BY-NC model, which you accepted), but its four takes were sub-bass rumbles with centroids of 82 to 114 Hz and no shotgun character. None went in the final file, so no generated audio is in it and its licence doesn't carry over.

Measured against the original's numbers (read off its picture):

```
Measure            Original   Made     Off by
Length             1.04 s     1.08 s   4%
Centroid           615 Hz     635 Hz   3%
<150 Hz            36%        36.3%    0.3 pts
150-600 Hz         32%        31.4%    0.6 pts
600-2k Hz          26%        26.8%    0.8 pts
2k-5k Hz           4%         4.3%     0.3 pts
>5k Hz             1%         1.2%     0.2 pts
Flatness           0.087      0.075    14%
T20 (fall 20 dB)   0.604 s    0.908 s  50% (inside the game range, 0.46 to 1.01 s)
Crest              ~11.2 dB   8.4 dB   about 3 dB (the build's own tolerance)
```

The two gaps are the tail and the crack. The tail is longer than the original's, because shortening it moved the band shares off the original's, and the bands matter more. The crack is a little softer than the picture's outline suggests.

The spec, which rebuilds the file exactly (`seed` 7):

```json
{"spec":"smak.sound/1","name":"weapons/sbarrel1.wav","class":"gunshot","seed":7,"length":1.04,
 "layers":[
  {"id":"crack","kind":"noise","color":"white","filter":[{"type":"highpass","f":300},{"type":"lowpass","f":1500}],"env":{"attack":0.001,"decay":0.03},"gain":-5},
  {"id":"sub","kind":"noise","color":"pink","filter":[{"type":"highpass","f":40},{"type":"lowpass","f":140}],"env":{"attack":0.002,"decay":1.2},"gain":-2},
  {"id":"body","kind":"noise","color":"white","filter":[{"type":"highpass","f":100},{"type":"lowpass","f":500}],"env":{"attack":0.002,"decay":1.2},"gain":-4},
  {"id":"mid","kind":"noise","color":"white","filter":[{"type":"bandpass","f":1300,"q":0.6},{"type":"lowpass","f":1800,"q":0.7}],"env":{"attack":0.002,"decay":0.9},"gain":-5},
  {"id":"floor","kind":"noise","color":"white","filter":[{"type":"highpass","f":200}],"env":{"attack":0.002,"decay":0.8},"gain":-24}],
 "finish":{"saturate":2.5,"room":{"decay":0.2,"wet":0.05},"limit":{"crest":9,"release":0.002},"peak":-0.5},
 "bands":{"<150":36,"150-600":32,"600-2k":26,"2k-5k":4,">5k":1},
 "picture":"pictures/sound.png"}
```

Two notes from the build. The `picture` path is relative to the work folder, so `pictures/sound.png` is the one that works there. The build also warns that the noise tail is smooth and could be heard as a faint hiss or reverb. That's the cost of the layer-only approach.
