The sound is built and the build says OK: `work:sound/weapons/357_shot1.wav`, a 22050 Hz, 16-bit mono WAV, 1.06 s long, peak -0.5 dBFS. To use it, copy it to `<mod>/sound/weapons/357_shot1.wav`. The game then loads it in place of its own file, with no code change.

**What I made**

- I generated four takes with the local `woosh-dflow` model from the caption "a large revolver firing a single loud gunshot, sharp crack, metallic hammer click, outdoor echo". I used take 0, the one with the clearest, earliest hit. Takes 1 to 3 were weaker or started late.
- The spec takes that take from its first hit onward and shapes it:
  - A loudness envelope (fast attack, about 0.6 s decay) so the tail falls at a gunshot's rate instead of ringing.
  - A low-pass at 5 kHz to take off the harshest top end.
  - A small boost at 90 Hz and a cut at 320 Hz to shift the body away from the boxy middle.
  - A short room, and a saturation and limiter stage so it hits hard for its peak level.

The spec, to redo or change it:

```json
{"spec":"smak.sound/1","name":"weapons/357_shot1.wav","class":"gunshot","seed":1,"length":1.2,
 "layers":[{"id":"shot","kind":"sample","file":"work:gen/357_shot_s0.wav","from":"onset","length":1.2,
   "env":{"attack":0.002,"hold":0.05,"decay":0.6},
   "filter":[{"type":"lowpass","f":5000,"q":0.7},{"type":"peak","f":90,"q":0.8,"gain":5},{"type":"peak","f":320,"q":1,"gain":-5}]}],
 "finish":{"room":{"decay":0.25,"wet":0.12},"saturate":2,"limit":{"crest":9,"release":0.002},"peak":-0.5},
 "variants":[]}
```

**How it measures**

- The final build says OK and reports 22 of 22 features in range for the game's gunshot sounds: decay, brightness, loudness spread and tonal balance.
- The first builds failed in two directions. The raw take had a tail of about 1.5 s, which was too long. Cutting the tail short made it too brief and too bright, so I settled between the two.

**Licence**

- The take comes from `woosh-dflow`, licensed CC-BY-NC 4.0 (non-commercial). You accepted that for this test. If the mod is ever sold or otherwise used commercially, this sound needs replacing or a different generator.

**What I could not check**

- I did not listen to it, and the build cannot judge how it sounds to a person. The 22 of 22 result is a measurement, not a verdict on quality. The modder needs to play it in the game next to the original and decide.
- The game's own volume and the map's room can change how it sounds, and those are not in the file. If it sounds too quiet or too loud in play, the level can be changed in the spec's `peak` value.
