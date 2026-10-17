The sound is built and the check says OK: `work:sound/doors/doormove1.wav`. It is ready to drop into the mod as `<mod>/sound/doors/doormove1.wav`, where it replaces the game's own file. I have not listened to it, so whether the hum really rises in pitch is the one thing to judge by ear.

**What it is**
- A 2.4-second, 22050 Hz, 16-bit mono file, the format GoldSrc expects.
- The source is a take from a local text-to-audio model (stable-audio-3-sfx, seed 0). I prompted it with: "a sliding door driven by an electric motor, a smooth electronic hum rising in pitch, then a solid metal thud as it stops, close-miked, dry".
- The take is used as it came, with two changes: a high-pass at 70 Hz to remove rumble under the hum, and a low-pass at 9 kHz. The mix is limited to a crest of 14 dB, with peak at -0.5 dBFS.
- The build's measurements: the thud lands at about 1.4 s, the hum sits before it, and the tail falls to -20 dB about 0.7 s after the peak. The spectrogram shows a steady hum band that swells into the thud. The rise in pitch is not something the numbers confirm.

**The spec**
```json
{"spec":"smak.sound/1","name":"doors/doormove1.wav","seed":1,"length":2.8,
 "layers":[{"id":"door","kind":"sample","file":"work:gen/doormove1_take_stable-audio-3-sfx_s0.wav","from":0,"length":2.8,
   "filter":[{"type":"highpass","f":70},{"type":"lowpass","f":9000}]}],
 "finish":{"limit":{"crest":14,"release":0.002},"peak":-0.5}}
```

**Licences:** This take comes from stable-audio-3-sfx under the Stability AI Community Licence. It is free for an organisation under US$1M annual revenue and needs an enterprise licence above that. I also generated takes from woosh-dflow, which is CC-BY-NC 4.0 (non-commercial). I did not use those. You said the licences of the local generators are accepted for this test. For a mod that is shipped or sold, the licence still needs a decision.

**Other choices I made**
- I did not set a `class`, because the kit has no door class and forcing one would have judged it against the wrong sound.
- The build did not compare it with the game's own `doors/doormove1.wav`, so I can't say how the two levels compare. Playing both in the game is the real test.
