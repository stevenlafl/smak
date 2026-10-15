The sprite is built and the build says OK: `work:sprites/fire.spr`, with `-sheet.png` and `-animated.png` beside it.

**What I made:** a looping campfire flame, additive (black is clear), type parallel oriented, 32x96 per frame, 15 frames, drawn from the bottom origin so the flame stands on its base.

**Final spec:**
```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/fire.spr","class":"fire loop","type":"parallel oriented","format":"additive","size":[32,96],"frames":14,"loop":true,"fps":10,"origin":"bottom","layers":[{"kind":"fire","ramp":"fire","width":1.0,"rise":0.9,"turbulence":0.3,"height":1.6,"taper":0.35,"tongues":0.6},{"kind":"glow","at":[0,-0.6],"radius":0.45,"core":0.3,"colour":[1,0.78,0.35],"gain":0.4}]}]}
```

**Choices I made, so you can redirect:**
- **15 frames:** the build writes a loop's first frame again at the end, so I set `frames: 14` to get 15 written frames.
- **Frame rate 10 fps:** the build warns that an `env_sprite` changes frame at most 10 times a second, so 12 fps was dropped.
- **Glow core:** a small warm glow sits just above the base to hold the bright core steady, so the frame-to-frame brightness doesn't swing too far.
- **Shape:** the flame is about 1.0 of the frame's width at the base and tapers to tongues near the top. The tongues reach close to the top edge, in line with your description.

**What the build measured:**
- Colours and shape pass against Half-Life's own fire loop (5 of 5 in range).
- The loop wraps smoothly at 0.73, and the flicker is in range.
- Brightness stays steady across the frames, with the lowest frames at about 0.6 of the peak.

**Limits:**
- There is no reference picture, only your description, so the side-by-side comparison will be by eye; I did not have the original's frames to measure against.
- The loop's wrap score of 0.73 is the weakest number. The build did not flag it, but it is below the 0.9 or so that a clean loop would show. Raising turbulence improves it but makes the brightness swing more, and I chose steadiness.
- The `render` tool failed on this sprite with an offset error, so I checked the frames from the build's contact sheet rather than a full-size render.
