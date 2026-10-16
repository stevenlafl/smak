The sound builds OK with no warnings, and the file is at `work:sound/weapons/sbarrel1.wav`. I could not hear it, and I could not open the original WAV itself, so the comparison is against the original's picture and facts file, not its samples.

**What it is:** a shotgun blast, class `gunshot`. It is built from layers only: a sub-boom, a low-mid body of pink noise, a mid blast, a particle tail, and a short crack added after the limiter. No recording generator was used, so no licence applies to this file.

**Measured against the original's picture (same length, close decay, close spectrum):**

| Measure | Original (from picture) | Made |
| --- | --- | --- |
| Length | 1.04 s | 1.04 s |
| T20 (time to -20 dB) | 0.458 to 1.013 s | 0.868 s |
| Centroid (brightness) | 615 Hz | 536 Hz (13% low) |
| Under 150 Hz | 36% | 34% |
| 150 to 600 Hz | 32% | 36% |
| 600 Hz to 2 kHz | 26% | 26% |
| Crest (peak over RMS) | about 11 dB | 10 dB |

All 22 of the game's gunshot features are in range. The centroid is inside the 15% tolerance, but it is the weakest match.

**Choices I made that you may want to change:**
- **16-bit, not 8-bit.** The original is 8-bit, but 8-bit adds a hiss under the tail that the build flags as static. I left the depth out. Say so if you want 8-bit to match the original's grain.
- **Tail fades to silence by 1 s.** The build's limiter was lifting a held quiet floor into a loud tail. I ended each envelope at -90 dB to stop that.

Next step, if you want it in the game: copy `sound/weapons/sbarrel1.wav` from the work folder into your mod's `sound/` folder. I have not copied it anywhere.

Final spec:

```json
{"spec":"smak.sound/1","name":"weapons/sbarrel1.wav","class":"gunshot","rate":22050,"seed":7,"length":1.04,"picture":"pictures/sound.png",
 "layers":[
  {"id":"sub","kind":"tone","f":70,"wave":"sine","sweep":{"to":40,"time":0.35},"env":{"attack":0.002,"decay":0.25},"gain":2},
  {"id":"boom","kind":"tone","f":110,"wave":"sine","sweep":{"to":50,"time":0.3},"env":{"attack":0.002,"decay":0.3},"gain":-1},
  {"id":"body","kind":"noise","color":"pink","filter":[{"type":"lowpass","f":850,"q":0.7},{"type":"highpass","f":120,"q":0.7}],"env":{"points":[[0,-3],[0.008,0],[0.1,-8],[0.2,-20],[0.25,-40],[0.28,-90]]},"gain":2},
  {"id":"blast","kind":"noise","color":"white","filter":[{"type":"bandpass","f":1000,"q":0.9}],"env":{"attack":0.001,"decay":0.12},"gain":-7},
  {"id":"tail","kind":"particles","rate":700,"band":[150,600],"grain":0.004,"env":{"points":[[0,-40],[0.05,-12],[0.3,-16],[0.7,-24],[0.95,-40],[1.0,-90]]},"gain":-4},
  {"id":"crack","kind":"noise","color":"white","filter":[{"type":"highpass","f":2000}],"env":{"attack":0.0005,"decay":0.008},"gain":-12,"post":true}],
 "finish":{"saturate":2.5,"limit":{"crest":10,"release":0.002},"peak":-0.5}}
```

I did not save a memory note: the memory write tool is disabled in this session.
