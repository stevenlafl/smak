The `.357` shot is built and the build says OK: every check passed, and all 22 of the game's gunshot measures are in range. The file is at `work:sound/weapons/357_shot1.wav`. For the mod, it goes in `<mod>/sound/weapons/357_shot1.wav`, where it replaces the game's own file with no code.

**What it is:** a 1.2 second, 22050 Hz, 16-bit mono WAV, peak -0.5 dBFS. It is one take from a local generator, `stable-audio-3-sfx`, given the prompt "a heavy revolver gunshot, a loud sharp crack and deep boom, outdoors, close-miked, dry". I generated four takes and picked seed 1, the cleanest and the quickest. The take's tail was too long for a gunshot and its peak was too spiky, so I trimmed it to 1.2 seconds and squashed the peaks.

**How it was made:** the spec's one layer is that take, cut from its first hit. Its filters cut the rumble below 35 Hz and the hiss above 9 kHz, and lift 1.2 kHz by 7 dB to get the crack and body the first build lacked. The finish adds a saturation of 2 and a limiter with a crest of 9 dB. The spec, to rebuild it:

```json
{"spec":"smak.sound/1","name":"weapons/357_shot1.wav","class":"gunshot","seed":1,"length":1.2,
 "layers":[{"id":"shot","kind":"sample","file":"work:gen/357_shot_s1.wav","from":"onset","length":1.2,
   "filter":[{"type":"highpass","f":35},{"type":"lowpass","f":9000},{"type":"peak","f":1200,"q":0.8,"gain":7}]}],
 "finish":{"saturate":2,"limit":{"crest":9,"release":0.002},"peak":-0.5}}
```

The first build warned that 600 Hz to 2 kHz held too little power (13% against a range of 13 to 54), so the peak lift was added for that.

**Things to know:**
- **Licence:** the take comes from Stability AI's Community Licence. It is free for an organisation under US$1M annual revenue, and needs an enterprise licence above that. You said the licences of the local generators are accepted for this test. For a release, that limit needs checking.
- **Not checked here:** how it sounds, and how the game plays it (its volume and the map's room). Only a listen in the game can settle whether it is at least as good as the original. If it is too loud or too boomy, the filters and the `peak` in the spec are the places to change.
