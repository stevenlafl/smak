The sound is built: `work:sound/debris/bustmetal1.wav`. The build says OK, with three judge warnings left (below). I can't listen to it, so the check was the numbers and the waveform. Whether it beats the game's own is for the modder to hear in the game.

**What it is**

- A mono, 22050 Hz, 16-bit, 0.8 s file named `debris/bustmetal1.wav`, so it replaces the game's file with no code.
- It starts with a short white-noise crack at the hit, then a cut of a generated take of a metal crate breaking apart. The take is from the local model `woosh-dflow`, seed 2, with the caption "a metal crate breaking apart, sheet metal cracking and clattering debris falling, one sharp bang, close-miked, dry".
- A burst of high-pitched debris particles follows at 0.08 s.
- A small room reverb, saturation, and a limiter finish it. The peak is -0.5 dB full scale.

**Licence:** `woosh-dflow` is CC-BY-NC 4.0 (non-commercial). You said the test accepts the local generators' licences. A commercial release would need a different take, or a licence check on the file itself.

**Remaining warnings**

- The sample's own attack is about 75 ms, so the hit is a little soft rather than instant.
- Its spectrum is somewhat brighter and more noise-like than the class's ranges, and the 600 to 2000 Hz band is heavier than usual.
- The crest is a little spiky (13 dB against a range of 5 to 12.5).

I stopped there because the generated take's noisy body limits what filtering can fix, and further passes were giving small gains. The modder should judge it by ear.

**How to use it**

Copy the file to `<mod>/sound/debris/bustmetal1.wav`.

**Spec used (to rebuild it)**

```json
{"spec":"smak.sound/1","name":"debris/bustmetal1.wav","class":"metal hit","seed":1,"length":0.8,
 "layers":[
  {"id":"crack","kind":"noise","color":"white","at":0,"env":{"attack":0.001,"decay":0.012},"filter":[{"type":"highpass","f":1500}],"post":true,"gain":0},
  {"id":"crash","kind":"sample","file":"work:gen/bustmetal_woosh-dflow_s2.wav","from":0.12,"length":0.7,"env":{"attack":0.002,"hold":0.03,"decay":0.22},"filter":[{"type":"highpass","f":300},{"type":"peak","f":1000,"q":1,"gain":-3},{"type":"lowpass","f":2500}]},
  {"id":"debris","kind":"particles","at":0.08,"count":30,"band":[700,2000],"grain":0.01,"env":{"attack":0.001,"decay":0.35}}],
 "finish":{"room":{"decay":0.25,"wet":0.12},"saturate":3,"limit":{"crest":9,"release":0.002},"peak":-0.5}}
```

The spec is not saved as a file in the work folder; I only had the build call to pass it through. The take is in `work:gen/`, so the sound can be rebuilt from this text.
