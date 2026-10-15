The sprite is built and the build says **OK**: `work:sprites/fire.spr`, with a contact sheet and an animated preview beside it.

**What it is:** a campfire or torch flame, drawn with the `fire` layer and a soft `glow` at its base. It has no logs or ground, and its edges are soft and streaky.

**Spec used:**
```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/fire.spr","class":"fire loop","use":"env_sprite",
 "size":[32,96],"frames":14,"loop":true,"fps":10,"type":"parallel oriented","format":"additive","origin":"bottom",
 "layers":[{"kind":"fire","ramp":[[0,[0,0,0]],[0.3,[0.45,0.15,0.05]],[0.6,[0.9,0.45,0.15]],[0.9,[1.0,0.75,0.45]]],
   "width":0.9,"height":2.0,"taper":0.5,"tongues":0.8,"turbulence":0.6,"rise":0.5},
  {"kind":"glow","at":[0,-0.45],"radius":0.45,"core":0.18,"colour":[1.0,0.667,0.353],"gain":0.25}]}]}
```

**Choices I made:**
- **Colours:** the ramp runs from black, through the rim brick-red (0.45, 0.15, 0.05), the saturated orange middle (0.9, 0.45, 0.15), to the pale orange-yellow core (1.0, 0.75, 0.45). Nothing reaches pure white.
- **Frames:** 15 in the file, as you specified. The kit writes a loop's first frame again at the end, so the spec asks for 14 animated frames and the file holds 15. If you meant 15 animated frames plus the wrap copy (16 in the file), change `frames` to 15.
- **Speed:** 10 fps, the engine's maximum for `env_sprite`. An earlier 12 fps was rejected.
- **Type and format:** parallel oriented, additive. The build placed it as render mode 5 (Additive), framerate 10.
- **Size:** I raised the flame's width and height over three builds until it filled most of the 96-pixel frame. I judged that by eye on the contact sheet; I did not measure it in pixels against your 70 to 85 pixel figure.

**What I could not check:** no reference picture of the original was supplied, so the build compared the sprite only with the kit's own class of fire loop ("5 of 5 in range"). That is not a comparison with your original. The report's colour, shape and brightness figures against the original need its contact sheet. If you can supply it as a picture, I can add it as `reference` and tune against it.
