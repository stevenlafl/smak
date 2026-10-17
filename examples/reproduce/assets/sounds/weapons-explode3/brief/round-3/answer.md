The sound is built: `work:sound/weapons/explode3.wav`, a 1.6 s mono 22050 Hz 16-bit file. The last build said OK, with one soft note left (see below).

**What it is:** A blast generated from a text caption ("a hand grenade exploding, one sharp blast with a short debris scatter, close-miked, dry"). The generator is `woosh-dflow`, which is CC-BY-NC 4.0 (Creative Commons Attribution, Non-Commercial), so the file is non-commercial. You said the person accepts that for this test. I took seed 0 of the four takes, started it at its blast (0.33 s in, skipping the lead-in), low-passed it at 2.8 kHz, added a 110 Hz sine that falls to 45 Hz as a sub thump, and gave it a short room, saturation and a limiter.

**How to try it:** Copy `sound/weapons/explode3.wav` into the mod's `sound/weapons/` folder. The game loads it in place of its own file, with no code change.

**Checks against the explosion class ranges:** 20 of 22 features are in range. The two remaining notes are small:
- Its flatness (how much of it is noise rather than tone) is a little low (0.011, the class wants 0.05 to 0.15).
- Its under-150 Hz share is at the bottom edge of the range (25.8%, wanted 26 to 46%).

**Limits:** No game folders were available on this machine, so I could not compare it to the game's actual `explode3.wav`. The comparison was against the class ranges only. Whether it is at least as good as the original, how loud it plays, and how it sits in the mix are for the person to judge by ear in the game.

**Spec used:**
```json
{"spec":"smak.sound/1","name":"weapons/explode3.wav","class":"explosion","seed":1,"length":1.6,
 "layers":[
  {"id":"boom","kind":"sample","file":"work:gen/grenade_explode_s0.wav","from":0.33,"length":1.6,
   "env":{"attack":0.002,"hold":0.12,"decay":0.9},"filter":[{"type":"lowpass","f":2800,"q":0.7}]},
  {"id":"body","kind":"tone","f":110,"wave":"sine","sweep":{"to":45,"time":0.5},
   "env":{"attack":0.002,"hold":0.05,"decay":0.6},"gain":-3}],
 "finish":{"room":{"decay":0.25,"wet":0.12},"saturate":2,"limit":{"crest":8,"release":0.002},"peak":-0.5}}
```

If they find it too soft or too thin, the easiest knobs are the body tone's `gain` and the sample's `lowpass` frequency.
