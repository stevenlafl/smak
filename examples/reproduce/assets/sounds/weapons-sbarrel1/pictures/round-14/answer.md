The sound is built and the build says OK: `work:sound/weapons/sbarrel1.wav`, mono 22050 Hz 16-bit, 1.02 s. Copy it into `<mod>/sound/weapons/` and it takes the place of the game's file. I can't listen, so the judgement of how it sounds is yours.

The take is from a generator (woosh-dflow, seed 2), licence CC-BY-NC 4.0 (Creative Commons, non-commercial). You said that's accepted for this test; it would not suit a commercial mod.

| Measure | Original (picture) | Made | Note |
|---|---|---|---|
| Length | 1.04 s | 1.02 s | 2% short |
| Power under 150 Hz | 36% | 36.5% | within 1 point |
| Power 150 to 600 Hz | 32% | 33.4% | within 2 points |
| Power 600 Hz to 2 kHz | 26% | 26.1% | within 1 point |
| Power 2 to 5 kHz | 4% | 3.8% | within 1 point |
| Power over 5 kHz | 1% | 0.2% | |
| Centroid | 615 Hz | 536 Hz | 13% dark; inside the 15% aim |
| Time to fall 20 dB (T20) | 0.604 s | 0.743 s | inside the gunshot class range, not matched |
| Crest (peak over RMS) | about 11 dB | 8.9 dB | inside the 3 dB reading tolerance |

The build's checks pass against the gunshot class: 22 of 22 features are in range. Its warnings are cleared, and nothing is flagged for clipping, offset, or a late start.

What I did: I took the generator's take closest to the target spectrum and set its envelope and filtering on it. The envelope is a 40 ms attack, then the level falls 20 dB by 0.25 s, then it runs on to -40 dB at 1.04 s. A 4 kHz lowpass brings the centroid down from about 730 Hz. The saturation and limiter give it the blast's squash. The tail is still longer than the original's; I couldn't get the envelope to shorten it further.

The spec, as built inline:

```json
{"spec":"smak.sound/1","name":"weapons/sbarrel1.wav","class":"gunshot","seed":2,"length":1.04,
 "layers":[{"id":"take","kind":"sample","file":"work:gen/sbarrel_s2.wav","from":"onset","length":1.04,
   "env":{"points":[[0,0],[0.023,0],[0.25,-20],[1.04,-40]]},
   "filter":[{"type":"lowpass","f":4000,"q":0.7}]}],
 "finish":{"saturate":2,"limit":{"crest":9,"release":0.002},"peak":-0.5},
 "bands":{"<150":36,"150-600":32,"600-2k":26,"2k-5k":4,">5k":1},"picture":"pictures/sound.png"}
```

The spec lives only in this session. If you want it re-runnable, I can save it into the project.
