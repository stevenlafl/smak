The sound is built and the build says OK: `work:sound/weapons/sbarrel1.wav`, 1.04 s, 22050 Hz, 8-bit mono. I did not use a generator, since the sound is pure noise and layers cover it, so no licence applies here.

**Not verified against the original.** The server found no game folders, so `reference` could not load `weapons/sbarrel1.wav`. Every comparison below is against your description, not the real file. Put the game's folders in the server's config and rebuild to get a side-by-side picture and measures.

| Measure | Target (your description) | Made |
| --- | --- | --- |
| Length | 1.04 s | 1.04 s |
| Under 150 Hz | 35% | 40.8% |
| 150 to 600 Hz | 30% | 31.8% |
| 600 to 2000 Hz | 20% | 15.9% |
| 2000 to 5000 Hz | 10% | 8% |
| Over 5000 Hz | 5% | 3.5% |
| Time to fall 20 dB (T20) | fades by about 0.9 s | 0.86 s |
| Class check (gunshot) | n/a | 22 of 22 in range |

Shape of the sound:
- Full level from the first sample, with a short hard crack at the start and a second burst at 0.03 s.
- Held at full level to 0.4 s, falling from 0.4 to 0.6 s, then a low crackling tail that is silent by 1.04 s.
- Noise only, no tones and no pitch movement.

Two warnings remain, and I kept both on purpose:
- The 8-bit hiss under the quiet tail: the original is 8-bit as described, so I matched it.
- The flatness is 0.16, inside the gunshot range. Your description asks for noise, so I kept it.

The spec I built from (passed inline, since I have no file-writing tool here, so save it into the project if you want it kept):

```json
{"spec":"smak.sound/1","name":"weapons/sbarrel1.wav","class":"gunshot","seed":1,"rate":22050,"bits":8,"length":1.04,
"bands":{"<150":35,"150-600":30,"600-2k":20,"2k-5k":10,">5k":5},
"layers":[
{"id":"blast","kind":"noise","iterations":32,
 "env":{"points":[[0,0],[0.01,-0.5],[0.4,-0.5],[0.5,-10],[0.6,-18],[0.8,-30],[0.9,-40],[1.04,-60]]},
 "shape":{"keys":[{"at":0,"curve":[[40,4],[100,4],[150,1],[300,-4],[600,-7],[2000,-12],[5000,-16],[11000,-24]]},
                  {"at":0.5,"curve":[[40,4],[100,3],[150,0],[300,-5],[600,-10],[2000,-20],[5000,-30],[11000,-42]]}]}},
{"id":"barrel2","kind":"noise","at":0.03,"length":0.35,"gain":-3,
 "env":{"points":[[0,0],[0.01,-1],[0.2,-6],[0.35,-40]]},
 "shape":{"keys":[{"at":0,"curve":[[40,4],[100,4],[150,1],[300,-4],[600,-7],[2000,-12],[5000,-16],[11000,-24]]}]}},
{"id":"crack","kind":"noise","length":0.003,"filter":[{"type":"highpass","f":2000}],"env":{"decay":0.002},"post":true,"gain":2},
{"id":"crackle","kind":"particles","rate":60,"band":[200,1500],"grain":0.004,"at":0.45,"length":0.55,"gain":-10,
 "env":{"points":[[0,-60],[0.05,-6],[0.2,-12],[0.55,-60]]}}],
"finish":{"saturate":6,"limit":{"crest":8,"release":0.002},"peak":-0.5}}
```

Choices I made that you can redirect:
- The double barrel is a second noise burst 0.03 s after the first, slightly quieter.
- The tail's crackle is a train of short grains, not a smooth wash, which the checker prefers.
- I left out a room effect. It pushed the length past 1.04 s.

The next step that matters is listening in the game, since the checks cannot say how it sounds to a person.
