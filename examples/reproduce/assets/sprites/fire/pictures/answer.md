The sprite builds with no faults, but the build still carries one warning: its shape matches the original at 0.68 overlap, under the 0.8 bar. I could not get past about 0.73 without losing the colour match, so the build says OK but is not at the judges' standard.

**Written:** `work:sprites/fire.spr`, with `-sheet.png` and `-animated.png` beside it.

**What it is:** a flame, 32x96, 15 frames, type parallel oriented, format additive. Placed as an `env_sprite` in render mode 5 (Additive), 10 frames a second.

**Build summary (final version):**

| Measure | Original | Ours | Bar |
| --- | --- | --- | --- |
| Mean colour (delta E) | reference | 8.7 | 15 or under: passes |
| Share that is dark | 0.38 | 0.40 | within 0.05: passes |
| Frames | 15 | 15 | passes |
| Shape overlap, mean | reference | 0.68 | 0.8: warning |
| Border light | 0.275 | 0.111 brightest | no warning |

Half-Life's own fire loop class: 4 of 4 measures in range.

**Choices I made:**
- **Frames:** `loop` is false so the file holds the original's 15 frames. With looping on, the engine adds a sixteenth frame. Looping is the cost: the sprite does not wrap on its own, so the game's animation has to play it through once.
- **Shape:** the flame's outline is set by a `mask: "reference"` layer that reads the original's lit area frame by frame. The guide describes this as the way to take a reference's shape, so this is a trace of the original's outline, not a free design. Its colours come from my own ramp.
- **Colour:** a custom orange-to-cream ramp, chosen after the built-in `fire` ramp came out too bright and yellow (delta E 15.2 to 17.7).
- **Origin:** `bottom`, so the flame stands on its base.

**Tried and rejected:**
- A glow layer over the fire raised the colour error past the bar.
- A second, brighter core layer also raised the colour error (to 12.9).
- Wider, taller fire rarely lifted the overlap past 0.73 and pushed the colour off.

The spec used for the final build:

```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/fire.spr","class":"fire loop","type":"parallel oriented","format":"additive","size":[32,96],"frames":15,"loop":false,"fps":10,"origin":"bottom","layers":[{"kind":"fire","ramp":[[0,[0,0,0]],[0.3,[0.45,0.08,0.02]],[0.6,[0.9,0.35,0.06]],[1,[1,0.8,0.45]]],"width":1.0,"rise":1.6,"height":2.6,"taper":0.2,"tongues":0.5,"turbulence":0.5,"mask":{"from":"reference","low":0.01,"high":0.05}}],"reference":{"picture":"pictures/frames.png","cell":32,"cols":8}}]}
```

**Open items:**
- The file is in the server's work folder; I could not copy it to a local path from here.
- To close the overlap warning, the next thing to try is a different fire seed or a second masked layer that fills the lit area without raising the colour error. Say if you want me to keep going on that.
