The sprite is built and the build says OK. It is at `work:sprites/fire.spr`, with `-sheet.png` and `-animated.png` beside it.

**Final spec** (`sprites/fire.spr`):

```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/fire.spr","class":"fire loop","use":"env_sprite","size":[32,96],"frames":15,"loop":false,"fps":10,"type":"parallel oriented","format":"additive","origin":"bottom","layers":[{"kind":"fire","ramp":"fire","width":1.0,"height":2.0,"taper":0.3,"tongues":0.8,"turbulence":0.5}]}]}
```

**What it is:** a flame on its base, 32x96 pixels, 15 frames, type parallel oriented, format additive (black is clear). It is placed as an `env_sprite` in additive render mode (5) at 10 frames per second (fps). The build reports 162 colours, with the flame's colour ramp running from a yellow-white core to orange and dark red at the edges.

**What I could not do exactly:**
- **No reference measures.** The `reference` field only takes a square cell (the error said "the sheet's cell in pixels (128)"), and the original's cells are 32x96. I could not write a re-laid-out picture here, so the report's measures against the original are missing. I compared by eye with the original sheet instead.
- **Frame rate is a guess.** The original's fps can't be read from the sheet, so I used 10, which is typical for a fire loop.
- **The wrap is not measured.** With `loop: false`, the file holds exactly 15 frames like the original, but the report does not score the wrap from frame 14 back to frame 0. Frame 14 looks close to frame 0 by eye. With `loop: true` the file would hold 16 frames, so I chose the frame count.

**Tuning history:** the first default build was too thin and short. The `height` field scales the flame up (lower values shorten it), so I set it to 2.0. I then widened the base with `width` 1.0 and tapered the top with `taper` 0.3. Raising `tongues` to 0.8 put the dark gaps between licks back. The build's checks: 4 of 4 measures in range against Half-Life's fire loop, border light 0.005 (the edge is dark), dark share 0.56, jitter 1.63.
