The sound is built and the build says OK with no warnings. It is at `work:sound/weapons/sbarrel1.wav`, and it replaces the game's `weapons/sbarrel1.wav` when placed in the mod's `sound` folder. Nobody has heard it yet. The modder needs to listen in the game to decide.

**What I made**

- **Source:** a generated take from the local `stable-audio-3-sfx` model, prompt "a pump action shotgun firing, a loud blast followed by a metallic pump rack, close-miked, dry", seed 1. Its licence is the Stability AI Community Licence, which you said you accept for this test. Commercial use is free for organisations under US$1M annual revenue, and an enterprise licence is needed above that.
- **Cut:** the blast only, starting at the take's onset and lasting about 0.8 s. The take's pump rack is not in this cut. Seed 0 has a rack after the blast, but I did not use it because a firing sound that ends in a rack would play the rack on every shot. If the modder wants the pump in the shot, say so and I'll use seed 0.
- **Shaping:**
  - A high-pass at 35 Hz removes a DC offset the first build flagged.
  - A low-pass at 1900 Hz tames the brightness of the raw take.
  - A small boost at 350 Hz adds body.
  - A short sine boom (120 Hz falling to 50 Hz, quiet) adds weight under the blast.
  - A short room (0.3 s decay, 12% wet) gives it the space the game's gunshots have.
  - Saturation of 3 and a limiter at a 9 dB crest keep it punchy, like Valve's weapon sounds.
- **Checks:** 22 of 22 features are in range of the game's gunshot sounds. Length is 0.8 s, T20 (time to fall 20 dB) is 0.51 s, centroid is 1094 Hz, and the peak is -0.5 dBFS.

**The spec used** (inline, so it can be rebuilt; I did not save it as a file):

```json
{"spec":"smak.sound/1","name":"weapons/sbarrel1.wav","class":"gunshot","seed":1,"length":1.0,
 "layers":[
  {"id":"shot","kind":"sample","file":"work:gen/shotgun_pump_s1.wav","from":"onset","length":1.0,
   "env":{"attack":0.002,"hold":0.3,"decay":0.6},
   "filter":[{"type":"highpass","f":35},{"type":"lowpass","f":1900,"q":0.7},{"type":"peak","f":350,"q":0.8,"gain":4}]},
  {"id":"body","kind":"tone","f":120,"wave":"sine","sweep":{"to":50,"time":0.2},"at":0,
   "env":{"attack":0.002,"decay":0.18},"gain":-12}],
 "finish":{"saturate":3,"room":{"decay":0.3,"wet":0.12},"limit":{"crest":9,"release":0.002},"peak":-0.5}}
```

**What the build cannot tell**

The checks measure the sound against the game's gunshots, not against how it feels to play. Whether it is at least as good as the original depends on the listening test, so the modder should compare it with the original in the game. Two things they should check by ear: the volume, since the peak is at full level and the original may sit lower, and the mix with the map's room, which this build does not include.
