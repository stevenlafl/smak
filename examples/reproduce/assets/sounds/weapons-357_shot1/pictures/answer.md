The sound is built and the build says OK, with every check passed. It is written to `work:sound/weapons/357_shot1.wav`, so it takes the place of the game's own file of that name.

**What's checked against the original's picture (the only reference here)**

| Feature | Made sound | Original (read off picture) | Note |
| --- | --- | --- | --- |
| Length | 1.057 s | 1.06 s | matches |
| Decay to -20 dB (T20) | 0.659 s | 0.458 to 1.013 s range | inside range |
| Centroid (brightness) | 881 Hz | 921 Hz | 4% off |
| Crest (peak over RMS) | 9.6 dB | about 10 dB | within tolerance |
| Largest band miss | 3.6 points (2 to 5 kHz) | | |
| Game gunshot sounds | 22 of 22 features in range | | |

The band levels are: under 150 Hz 20%, 150 to 600 Hz 26%, 600 Hz to 2 kHz 44%, 2 to 5 kHz 10%, above 5 kHz 0.2%.

**Limits of this check**

- The original `weapons/357_shot1.wav` is not in the game folders this server was given, so the report could not compare against the real file. Only the picture was used.
- The band targets came from the report's "points off" lines. I worked backwards from them to a rough target, so they are estimates.
- Nothing has been listened to. The report cannot judge how it sounds, its volume in the game, or the map's room. Someone needs to play it in the game and A/B it against the original.

**The spec** (one `build` call, final version)

```json
{"spec":"smak.sound/1","name":"weapons/357_shot1.wav","class":"gunshot","seed":1,"length":1.06,"layers":[{"id":"crack","kind":"noise","color":"white","filter":[{"type":"highpass","f":1500}],"env":{"attack":0.001,"decay":0.02},"gain":-4},{"id":"blast","kind":"noise","shape":[[60,-2],[200,0],[600,0],[1000,0],[2000,-3],[4000,-26],[11000,-40]],"env":{"attack":0.002,"hold":0.03,"decay":0.4},"gain":0},{"id":"thump","kind":"tone","f":110,"wave":"sine","sweep":{"to":40,"time":0.25},"env":{"attack":0.001,"decay":0.25},"gain":-6},{"id":"tail","kind":"noise","color":"pink","filter":[{"type":"lowpass","f":3000}],"env":{"attack":0.02,"decay":0.55},"gain":-10}],"finish":{"saturate":3,"room":{"decay":0.2,"wet":0.08},"limit":{"crest":10,"release":0.002},"peak":-0.5},"reference":"weapons/357_shot1.wav","picture":"pictures/sound.png"}
```

The spec is only in this message, not saved to a file in the project. If you want it kept for re-running, I can commit it as a script.
