The sound is built and the build says OK: `work:sound/player/pl_step1.wav`, 11025 Hz, 8-bit mono, 0.25 s. Copy it to `<mod>/sound/player/pl_step1.wav` to replace the game's file.

**What it is:** a concrete footstep. A generated take of a footstep on concrete (seed 3) carries the heel strike. A short noise crack adds the high-frequency edge, a small second hit at 0.09 s stands in for the toe, and a faint particle tail carries the end.

**Against the original's picture (what the report measures):**

| Feature | Original | Copy | Note |
| --- | --- | --- | --- |
| Length | 0.27 s | 0.25 s | 7% short |
| Centroid (brightness) | 902 Hz | 854 Hz | 5% off |
| Band 150 to 600 Hz | about 60% | 55.5% | within 5 points |
| T20 (time to -20 dB) | in range | 0.10 s | in the class range |
| Crest (peak over RMS) | about 21.8 dB | 17.8 dB | the picture's figure is read off its outline, within 3 dB |

Against the game's own step-on-concrete sounds, 20 of 22 features are in range. The two off are flatness (0.165, a little too pure) and the under-150 Hz band (14.8%, a little low).

**Remaining warnings, which I left in place:**
- **8-bit hiss:** the original is 8-bit, so I kept 8-bit to match the format. The build says 16-bit would be cleaner. Switch with `"bits": 16` if the hiss is audible in the game.
- **Noise over a take:** the crack and the toe are short (about 30 ms and 50 ms), not steady. The build still flags them as static risk. Moving the crack to `post: true` made the spectrum too dark, so I reverted it.

**Licence:** the take comes from woosh-dflow, CC-BY-NC 4.0 (weights; code MIT). You said to accept the local generators' licences for this test, so it is in. It is non-commercial only.

**Limits:** I could not listen to it, and I could not read the original's folder directly (permission was denied). I worked from the copy in the work folder's `pictures/` (`sound.png`, `facts.txt`), which the build also reads. The final check is hearing it in the game.

**Spec used** (inline; I could not write a file in this session, so this is the record for rebuilding):

```json
{"spec":"smak.sound/1","name":"player/pl_step1.wav","class":"step concrete","rate":11025,"bits":8,"seed":3,"length":0.27,"picture":"pictures/sound.png",
 "layers":[
  {"id":"heel","kind":"sample","file":"work:gen/step_concrete_s3.wav","from":"onset","length":0.27,"env":{"attack":0.001,"decay":0.22},
   "filter":[{"type":"highpass","f":180},{"type":"peak","f":300,"q":1,"gain":4},{"type":"peak","f":1200,"q":0.8,"gain":-6}]},
  {"id":"crack","kind":"noise","color":"white","shape":[[150,-26],[600,-16],[1500,-4],[3000,0],[6000,-2],[10000,-8]],"env":{"attack":0.001,"decay":0.03},"gain":-4},
  {"id":"toe","kind":"noise","color":"pink","at":0.09,"length":0.05,"filter":[{"type":"bandpass","f":300,"q":0.6}],"env":{"attack":0.002,"decay":0.025},"gain":-14},
  {"id":"tail","kind":"particles","rate":60,"band":[300,3000],"grain":0.006,"at":0.1,"length":0.17,"env":{"attack":0.005,"decay":0.16},"gain":-14}],
 "finish":{"room":{"decay":0.25,"wet":0.12},"saturate":1,"limit":{"crest":21,"release":0.002},"peak":-0.5}}
```

The generated take `work:gen/step_concrete_s3.wav` must exist first (`generate`, prompt "a single footstep on a concrete floor, a leather-soled boot heel landing once, short, dry, close-miked, no reverb, no background noise", length 1, seed 3).
