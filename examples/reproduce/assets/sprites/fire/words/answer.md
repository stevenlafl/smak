The sprite is built and the build says OK: `work:sprites/fire.spr`, with `-sheet.png` and `-animated.png` beside it. I could not compare it against the original (no reference picture was given), so the match is by your description and the report's measures, not by eye against the real file.

**Final spec**

```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/fire.spr","class":"fire loop","type":"parallel oriented","format":"additive","size":[32,96],"frames":14,"loop":true,"fps":10,"origin":"bottom","layers":[{"kind":"fire","ramp":"fire","width":1.25,"height":1.6,"taper":0.4,"tongues":0.5,"rise":0.35,"turbulence":0.4},{"kind":"glow","at":[0,-0.6],"radius":0.7,"core":0.3,"colour":[1,0.549,0.157],"gain":0.25}],"finish":"edge"}]}
```

**What the report says**
- 32x96, 15 frames in the file, additive, parallel oriented. The file is 15 frames as you described, but this is a loop of 14 with its first frame repeated at the end, so the loop closes without a jump.
- Against Half-Life's own fire loop, all 5 measures are in range. The border is dark (0.024), so the square frame does not show.
- Wrap 0.76 and jitter 1.64. The wrap is the loop's smoothness and it is not perfect, so the cycle joins a little less cleanly than I would like.

**Choices I made**
- **Frame rate: 10 fps.** You did not give one. The engine's limit for an env_sprite is 10 changes a second.
- **Shape:** the flame fills about 40 of the 96 pixels in width at its base and reaches to within about 10 to 15 pixels of the top. Its tongues are soft, not sharply split. Wider or taller settings either hit the frame edges or lost the loop smoothness.
- **Colour:** the fire ramp gives white-hot to orange to red-brown, with a warm glow added low in the frame.
- **Frame count:** I used 14 plus the wrap, so the file has 15 frames as the original does.

**Where it may differ from the original**
- Its tongues are less ragged and split than a painted flame would be.
- The flicker is procedural, so the sway and pulse are a fair approximation, not a copy of the original's motion.
