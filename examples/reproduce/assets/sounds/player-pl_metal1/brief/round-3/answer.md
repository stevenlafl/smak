I made a replacement for `player/pl_metal1.wav`, and the build says OK. It is at `work:sound/player/pl_metal1.wav`, and it is not yet in any mod folder.

**What it is:** 0.66 s, 22050 Hz, 16-bit mono WAV, peak -0.5 dBFS. It is a generated take with a light heel tap and a second, softer tap about 0.2 s later, with a bright, hollow ring after the hit. The generator was woosh-dflow, and its licence is CC-BY-NC 4.0 (non-commercial). You accepted that for this test, and it would need a different sound before any commercial use.

**How I made it:**
1. I asked woosh-dflow for four takes from the caption "a light footstep on a thin metal vent grate, a hollow tinny tap and a short metallic rattle, close-miked, dry" (seeds 4 to 7, 1 s each). I picked seed 4 because it had the clearest two-tap shape. Seeds 0 to 3 from an earlier 0.6 s set were duller and lower.
2. The spec took that take from its first hit (`from: "onset"`) and shaped it:
   - a highpass at 1000 Hz to cut the boom,
   - a +4 dB peak at 2800 Hz for the tinny edge,
   - a lowpass at 7000 Hz,
   - an envelope that holds for 0.4 s, then decays,
   - a short room (decay 0.35, wet 0.2),
   - a limiter with crest 16 and peak -0.5.

**Spec used** (passed inline to `build`):
```json
{"spec":"smak.sound/1","name":"player/pl_metal1.wav","class":"step vent","length":1.0,
 "layers":[{"id":"tap","kind":"sample","file":"work:gen/pl_metal1b_s4.wav","from":"onset","length":1.0,
   "env":{"attack":0.002,"hold":0.4,"decay":0.5},
   "filter":[{"type":"highpass","f":1000},{"type":"peak","f":2800,"q":1.2,"gain":4},{"type":"lowpass","f":7000}]}],
 "finish":{"room":{"decay":0.35,"wet":0.2},"limit":{"crest":16,"release":0.002},"peak":-0.5}}
```

**What the checks still say:**
- The tail dies to -20 dB in 0.36 s. The game's step sounds take at least 0.44 s, so it sounds drier than theirs.
- Its centroid is 904 Hz, against 136 to 336 Hz for the game's step sounds. That is deliberate: a tinny vent should be brighter than a boot on concrete. The judge does not know that, so it still flags it.
- Its length is 0.66 s, which is shorter than the 0.64 to 1.06 s range of the game's step sounds. The sample's own decay sets this, and I could not stretch it without adding a steady noise or a bell.

**What I could not check:** I had no game folder to read, so I could not compare the file against the game's own `pl_metal1.wav`. Whether it is at least as good is for the modder to hear in the game. In-game volume and the map's room are also not checked here.

**Next steps if they want them:** copy `work:sound/player/pl_metal1.wav` to `<mod>/sound/player/`, listen in the game, and tell me if it should be longer, darker or drier. I can also try other seeds or a different caption.
