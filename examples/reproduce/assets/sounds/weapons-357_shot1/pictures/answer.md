The sound is built and the build says **OK** with no warnings: `work:sound/weapons/357_shot1.wav`, 22050 Hz, 16-bit mono, 1.07 s. Drop it into `<mod>/sound/weapons/` and it takes the place of the game's file.

**Against your numbers (the original's picture, read by the build):**

| Measure | Original | Made | Off by |
| --- | --- | --- | --- |
| Length | 1.06 s | 1.07 s | 1% |
| Centroid | 921 Hz | 902 Hz | 2% |
| Power under 150 Hz | 21% | 16.3% | -4.7 points |
| Power 150-600 Hz | 26% | 25.8% | -0.2 points |
| Power 600-2k Hz | 46% | 49.9% | +3.9 points |
| Power 2k-5k Hz | 6% | 7.8% | +1.8 points |
| Power over 5k Hz | 2% | 0.2% | -1.8 points |
| Crest | about 10 dB | 11.2 dB | +1.2 dB |

The build's class check against the game's gunshots came back 22 of 22, every feature in range. The only soft spot is RMS, at -11.7 dBFS, which sits right on the class's lower edge. The build's T20 (time to fall 20 dB) is 0.98 s, close to the top of the class range of 0.46 to 1.01 s.

**Choices I made:**
- **No generated audio in the final.** I generated four takes with the local woosh-dflow model. They were too long, too spiky, or too dark, so I built the shot from layers instead: a short high-passed crack, a falling sine boom, a shaped noise body with a decaying envelope, and a light room. Because no take is used, the non-commercial licence of that model does not apply to this file.
- **The limiter is off.** A crest limiter lifted the quiet tail back up, so the sound never died away. Saturation alone sets the crest.
- **I could not open the original's picture directly.** I worked from your numbers and the build's reading of the picture. I did not check the original's T20, so I aimed at the class range.
- **Not checked here:** how it sounds to a person and how the game plays it (volume, pitch, the map's room). Please listen in the game.

The spec, for reuse (I could not save it to a file in this session, so here it is):

```json
{"spec":"smak.sound/1","name":"weapons/357_shot1.wav","class":"gunshot","seed":7,"length":1.06,"picture":"pictures/sound.png","bands":{"<150":21,"150-600":26,"600-2k":46,"2k-5k":6,">5k":2},"layers":[{"id":"crack","kind":"noise","color":"white","filter":[{"type":"highpass","f":2500}],"env":{"attack":0.0005,"decay":0.012},"gain":-6,"post":true},{"id":"boom","kind":"tone","f":150,"wave":"sine","sweep":{"to":42,"time":0.15},"env":{"attack":0.001,"decay":0.22},"gain":-3},{"id":"body","kind":"noise","color":"white","shape":[[60,-3],[150,-2],[300,2],[600,1],[1000,0],[1500,-3],[2000,-7],[2500,-13],[4000,-24],[6000,-32],[10000,-42]],"env":{"points":[[0,-30],[0.03,-4],[0.25,-10],[0.6,-16],[1.0,-28],[1.06,-40]]},"gain":0},{"id":"tail","kind":"noise","iterations":16,"shape":[[100,-6],[300,-3],[700,0],[1500,-1],[2500,-7],[5000,-24],[9000,-36]],"env":{"points":[[0,-30],[0.03,-4],[0.25,-10],[0.6,-16],[1.0,-28],[1.06,-40]]},"gain":-4}],"finish":{"room":{"decay":0.1,"wet":0.05},"saturate":5,"peak":-0.5}}
```
