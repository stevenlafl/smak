The sound is built: `work:sound/items/smallmedkit1.wav`, 22050 Hz, 8-bit mono, 0.76 s. The last build says OK with no warnings. Copy it into `<mod>/sound/items/` to replace the game's file.

Measured against the picture of the original (the picture is what I had; the game's own WAV was not on this machine):

| Measure | Original (from picture) | Made | Off by |
|---|---|---|---|
| Length | 0.76 s | 0.76 s | 0% |
| Centroid (brightness centre) | 1936 Hz | 2018 Hz | 4% |
| Worst band (600 to 2k Hz) | 600 to 2k share | within 5 points | 4.9 points |
| T20 (time to fall 20 dB) | 0.41 to 0.68 s | 0.52 s | in range |
| Crest (peak over RMS) | about 11.5 dB | 11.1 dB | -0.4 dB |

The first three builds failed the picture check (too quiet, then too bright), so I changed the swell's loudness and spectrum and added a low 300 Hz partner to the beeps until the numbers came in.

Spec I used, so it can be rebuilt:

```json
{"spec":"smak.sound/1","name":"items/smallmedkit1.wav","length":0.76,"rate":22050,"bits":8,
 "picture":{"file":"pictures/sound.png","length":0.76,"rate":22050,"row":0},
 "layers":[
  {"id":"beep0","kind":"tone","f":660,"wave":"sine","at":0.0,"length":0.04,"gain":-9,"env":{"attack":0.003,"hold":0.015,"decay":0.015}},
  {"id":"beep1","kind":"tone","f":660,"wave":"sine","at":0.05,"length":0.1,"gain":-6,"env":{"attack":0.004,"hold":0.075,"decay":0.02}},
  {"id":"beep2","kind":"tone","f":660,"wave":"sine","at":0.169,"length":0.1,"gain":-6,"env":{"attack":0.004,"hold":0.075,"decay":0.02}},
  {"id":"body1","kind":"tone","f":300,"wave":"sine","at":0.05,"length":0.1,"gain":-14,"env":{"attack":0.004,"hold":0.075,"decay":0.02}},
  {"id":"body2","kind":"tone","f":300,"wave":"sine","at":0.169,"length":0.1,"gain":-14,"env":{"attack":0.004,"hold":0.075,"decay":0.02}},
  {"id":"tail","kind":"noise","color":"pink","at":0.264,"length":0.256,"gain":-18,"filter":[{"type":"highpass","f":150},{"type":"lowpass","f":4000}],"env":{"points":[[0,-30],[0.13,-14],[0.16,-18],[0.256,-40]]}},
  {"id":"swell","kind":"noise","iterations":32,"at":0.52,"length":0.24,"gain":0,"shape":[[100,-30],[600,-24],[1300,-14],[3700,-8],[8900,-3],[11000,-3]],"env":{"points":[[0,-14],[0.08,-6],[0.16,-3],[0.24,-2]]}}
 ],
 "finish":{"limit":{"crest":11,"release":0.002},"peak":-1}}
```

What the spec is built on:
- **Event:** the two tone bursts at about 660 Hz (the medkit's beeps), a quieter low-level tail with a spike near 0.4 s, then a bright hiss swell from 0.52 s to the end.
- **Choices I made:** the picture's bursts were read by eye, so the 300 Hz partner, the tail's band limits and the swell's curve are my estimates. I did not match the original's exact waveform.
- **Not checked:** how it sounds to a person and how the game plays it (volume, the map's room). Please listen in the game before shipping.
