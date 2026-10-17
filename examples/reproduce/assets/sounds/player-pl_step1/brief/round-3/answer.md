The footstep is built and the build says OK. It is at `work:sound/player/pl_step1.wav`. To use it, copy it to `<mod>/sound/player/pl_step1.wav`, and the game will play it in place of its own step sound with no code change. Please listen to it in the game before deciding. The build can check the numbers, but it cannot tell you how it sounds.

**How I made it**

1. I generated four takes with the local sound model `woosh-dflow` from the caption "a person walking, one shoe footstep on a concrete floor, a single short heel strike, close-miked, dry", length 1 second, class "step concrete". I chose seed 1 because it is one clean heel strike. Seed 0 had several hits, seed 2 had two, and seed 3 was mostly low rumble.
2. I built the take into the game's format with this spec, which is how the file was made:

```json
{"spec":"smak.sound/1","name":"player/pl_step1.wav","class":"step concrete","length":0.4,
 "layers":[{"id":"step","kind":"sample","file":"work:gen/step_concrete_s1.wav","from":"onset","length":0.4,
   "env":{"attack":0.002,"hold":0.05,"decay":0.2},
   "filter":[{"type":"highpass","f":90},{"type":"peak","f":300,"q":0.8,"gain":3},{"type":"peak","f":3500,"q":0.8,"gain":4}]}],
 "finish":{"limit":{"crest":20,"release":0.002},"peak":-2}}
```

- The take's tail was too long for a step, so I shortened it to 0.4 seconds with a decay envelope.
- The highpass removes rumble under 90 Hz. The two peak filters add some body at 300 Hz and some brightness at 3.5 kHz, because the first render was too dark.
- The limiter sets the loudness, and the peak is at -2 dBFS so the level sits in the range of the game's step sounds.

**Result:** 20 of the 22 measured features match the game's own concrete steps. The file is 22050 Hz, 16-bit, mono, 0.148 seconds long, with a 40 ms attack.

**Still off:** its flatness is 0.023, while the game's steps are 0.2 to 0.35. That means it is more tonal than the game's steps, with less hiss. I did not add a noise layer to fix that, because the guidance says steady noise over a generated take is heard as static. It may sound more like a knock than a scuff. That is the first thing to listen for.

**Licence:** `woosh-dflow` is non-commercial (CC-BY-NC 4.0 for the weights, MIT for the code). You accepted that for this test. It must not be used in a commercially sold mod without a different sound source.

**Not done:** I did not make `pl_step2` to `pl_step4`, since you asked only for step 1. The spec above is not saved to a file in the work folder, so copy it from here if the modder needs to rebuild it.
