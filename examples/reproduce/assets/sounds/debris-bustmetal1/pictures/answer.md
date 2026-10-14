I built `debris/bustmetal1.wav` from a smak.sound/1 spec and the build says OK. Every engine check passed. It's in the work folder at `sound/debris/bustmetal1.wav`; put it in `<mod>/sound/debris/` and the game plays it where the original was.

**How it compares with the original's picture:**
- **Format:** 11025 Hz, 8-bit, mono, 0.874 s (the original is 0.87 s).
- **Envelope:** it starts at full level with no delay, stays loud for about the first 0.06 s, then fades smoothly. It's 20 dB down at 0.38 s and 40 dB down at 0.74 s, which follows the original's waveform.
- **Spectrum:** it covers the whole range, bright from about 600 to 5000 Hz, with some low-end weight only at the start, like the original's bottom bands.
- **Character:** a short white-noise crack, then a longer metallic crash. Four sets of struck-plate tones are slightly detuned, so you get the original's many thin ringing lines instead of one strong tone. A small rattle of particles and a short room tail sit on top.

The build's "metal hit" class compares the sound with the game's crowbar-type hits, and 14 of 22 measurements fall in their range. The ones outside say it's too long, too bright and too noisy. The original sound has those same traits, so I matched the original's picture and ignored those hints. The earlier versions that fit the class better looked less like the original.

All of this was checked from drawings and numbers only. Nobody has listened to it, and it hasn't been played in the game, where the engine's volume and pitch and the map's room effect will change how it sounds. Someone should listen in-game.

The final spec:

```json
{"spec":"smak.sound/1","name":"debris/bustmetal1.wav","class":"metal hit","rate":11025,"bits":8,"seed":7,"length":0.87,
"layers":[
{"id":"hit","kind":"noise","color":"white","env":{"attack":0.001,"decay":0.08},"filter":[{"type":"highpass","f":120}],"gain":-2},
{"id":"crash","kind":"noise","color":"white","env":{"attack":0.002,"hold":0.06,"decay":1.0},"filter":[{"type":"highpass","f":450},{"type":"peak","f":1600,"q":0.5,"gain":3}],"gain":-6},
{"id":"body","kind":"noise","color":"brown","env":{"attack":0.002,"hold":0.04,"decay":0.5},"filter":[{"type":"bandpass","f":300,"q":0.7}],"gain":-9},
{"id":"plate","kind":"modes","f":610,"ratios":"plate","decay":1.0,"damping":0.9,"detune":0.15,"gain":-10},
{"id":"plateb","kind":"modes","f":890,"ratios":"plate","decay":0.95,"damping":0.9,"detune":0.15,"gain":-11},
{"id":"plate2","kind":"modes","f":1270,"ratios":"bell","decay":0.9,"damping":1.0,"detune":0.15,"gain":-11},
{"id":"plate3","kind":"modes","f":2050,"ratios":"tube","decay":0.8,"damping":1.2,"detune":0.15,"gain":-12},
{"id":"rattle","kind":"particles","rate":110,"band":[1000,5000],"grain":0.004,"env":{"attack":0.001,"hold":0.1,"decay":0.75},"gain":-8}
],
"finish":{"saturate":3,"room":{"decay":0.3,"wet":0.12},"peak":-0.5}}
```
