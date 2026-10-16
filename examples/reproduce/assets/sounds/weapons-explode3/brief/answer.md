The sound is built and the build says OK. It is at `work:sound/weapons/explode3.wav`, and it goes in the mod's `sound/weapons/` folder to replace the game's `explode3.wav`.

**What I made**

- **Source:** the local `woosh-dflow` generator, prompted with "a hand grenade exploding, one sharp blast with a deep boom and debris scattering after, outdoors, close-miked, dry". I generated four takes and used take 0 because it had the clearest blast with a body, not a long tail.
- **Licence:** `woosh-dflow` is CC-BY-NC 4.0 (non-commercial). You said the licences of the local generators are accepted for this test. If the mod is ever sold or distributed commercially, this file needs replacing or a different generator.
- **Shaping:**
  - The take starts 0.28 s in, past its slow build-up, so the blast hits at once.
  - A 1.5 s body with a decay of about 0.6 s.
  - Two peaks, at 1.5 kHz and 350 Hz, to bring out the middle, and a lowpass at 4 kHz to tame the top.
  - A short white-noise crack and a pink-noise grit layer, added after the limiter for the initial snap and debris.
  - Saturation of 3 and a limiter with a crest of 7 dB.
- **Format:** mono, 22050 Hz, 16-bit, 1.5 s, peak -0.5 dBFS.

**Build result:** OK, with no warnings. Against the game's explosion sounds, 21 of 22 features are in range. The one miss is that it sounds too tonal (flatness 0.018 against the game's 0.05 to 0.15). I tried adding more noise and it made the other features worse, so I left it.

**Spec used** (rebuild with this spec in `smak.sound/1` format):

```json
{"spec":"smak.sound/1","name":"weapons/explode3.wav","class":"explosion","seed":7,"length":1.6,
 "layers":[
  {"id":"blast","kind":"sample","file":"work:gen/grenade_explode_s0.wav","from":0.28,"length":1.5,
   "env":{"attack":0.002,"hold":0.3,"decay":0.6},
   "filter":[{"type":"peak","f":1500,"q":0.8,"gain":5},{"type":"peak","f":350,"q":0.7,"gain":3},{"type":"lowpass","f":4000,"q":0.7}]},
  {"id":"crack","kind":"noise","color":"white","filter":[{"type":"highpass","f":2000}],"env":{"attack":0.001,"decay":0.008},"gain":-2,"post":true},
  {"id":"grit","kind":"noise","color":"pink","filter":[{"type":"bandpass","f":800,"q":0.6}],"env":{"attack":0.002,"decay":0.12},"gain":-6,"post":true}],
 "finish":{"saturate":3,"limit":{"crest":7,"release":0.002},"peak":-0.5}}
```

**What the checks cannot tell you:** how it sounds to a person, how loud it plays in the game, and how the map's room changes it. Those need an ear in the game. The modder should compare it to the original `explode3.wav` at the same volume.
