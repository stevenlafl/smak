The build says OK: `work:sound/doors/doormove1.wav` is 11025 Hz, 8-bit mono, 5.04 s, peak -0.6 dBFS. I couldn't hear it, and I could only compare it against the original's picture, not the original file (no game folder had it).

**How it compares** (the original's band shares are inferred from the build's "points off" gaps, not read directly):

```
measure                  original (picture)      made
length                   5.04 s                  5.04 s
centroid (brightness)    589 Hz                  594 Hz
power <150 Hz            ~30%                    29%
power 150-600 Hz         ~38%                    40%
power 600-2k Hz          ~28%                    26%
power 2k-5k Hz           ~4%                     5%
crest (peak over RMS)    12.7 dB                 13.1 dB
T20 (time to fall 20 dB) within a quarter of picture   0.70 s, passes
onsets (clear hits)      7                       5 detected
```

**The spec** (I used `class: "loop machine"` since no door class exists; the report's loop-length and flatness flags don't apply to a sound that plays once):

```json
{"spec":"smak.sound/1","name":"doors/doormove1.wav","class":"loop machine","seed":1,"length":5.04,"rate":11025,"bits":8,"picture":"pictures/sound.png",
 "layers":[
  {"id":"motor","kind":"noise","color":"white","shape":[[40,-3],[100,-4],[150,-6],[300,-11],[600,-12],[1000,-15],[2000,-21],[3500,-30],[5500,-38]],"env":{"points":[[0,-8],[0.1,-6],[1.0,-6],[3.5,-6],[4.4,-8],[4.9,-16],[5.04,-30]]}},
  {"id":"line","kind":"noise","color":"white","filter":[{"type":"bandpass","f":445,"q":10}],"env":{"points":[[0,-20],[4.0,-20],[5.04,-34]]}},
  {"id":"c0","kind":"noise","color":"white","filter":[{"type":"highpass","f":1500}],"env":{"attack":0.001,"hold":0,"decay":0.02},"at":0.02,"gain":-12},
  {"id":"c1","kind":"noise","color":"white","filter":[{"type":"highpass","f":1500}],"env":{"attack":0.001,"hold":0,"decay":0.02},"at":0.8,"gain":-12},
  {"id":"c2","kind":"noise","color":"white","filter":[{"type":"highpass","f":1500}],"env":{"attack":0.001,"hold":0,"decay":0.02},"at":1.56,"gain":-12},
  {"id":"c3","kind":"noise","color":"white","filter":[{"type":"highpass","f":1500}],"env":{"attack":0.001,"hold":0,"decay":0.02},"at":2.52,"gain":-12},
  {"id":"c4","kind":"noise","color":"white","filter":[{"type":"highpass","f":1500}],"env":{"attack":0.001,"hold":0,"decay":0.02},"at":2.84,"gain":-12},
  {"id":"c5","kind":"noise","color":"white","filter":[{"type":"highpass","f":1500}],"env":{"attack":0.001,"hold":0,"decay":0.02},"at":3.4,"gain":-12},
  {"id":"c6","kind":"noise","color":"white","filter":[{"type":"highpass","f":1500}],"env":{"attack":0.001,"hold":0,"decay":0.02},"at":4.13,"gain":-12},
  {"id":"knock","kind":"noise","color":"white","filter":[{"type":"bandpass","f":450,"q":2.0}],"env":{"attack":0.005,"hold":0.1,"decay":0.35},"at":4.13,"gain":-4}],
 "finish":{"saturate":1.5,"peak":-0.5}}
```

**Choices and what I found on the way:**
- **No limiter.** The `limit` finish stage collapsed the envelope (the hum died after about 0.3 s), so I left it out and got the crest from the clacks and knock.
- **No `modes` layers.** In this kit, a `modes` layer seems to ignore its `at` and its level, and it started at 0 s and swamped the body. I replaced the tonal line with a narrow noise band. The kit's maintainers may want to know about this.
- **The main gap is onsets:** 5 detected against the original's 7. Two of the clacks sit 0.3 s apart and merge in the detector; I didn't push the clacks louder to split them because that cost the crest.
- **Attack reads 4.2 s** because the knock is the loudest point. The report doesn't flag it, and the original's attack reading isn't in the picture data, so I can't say how close it is.

I can save this spec beside the reproduce example if you want it kept in the repo. Listening in the game is still the real check.
