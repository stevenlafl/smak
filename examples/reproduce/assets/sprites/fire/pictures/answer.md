The sprite builds OK as `sprites/fire.spr` (32x96, 15 frames plus the wrap frame, additive, parallel oriented, 10 fps, origin at the bottom). It is in the work folder with its sheet and animated preview beside it. I have not compared it with the original side by side, so the closeness is unverified.

**Final spec:**
```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/fire.spr","class":"fire loop","type":"parallel oriented","format":"additive","size":[32,96],"frames":15,"loop":true,"fps":10,"origin":"bottom","layers":[{"kind":"fire","ramp":"fire","width":0.6,"height":1.6,"rise":0.3,"turbulence":0.2,"taper":0.5,"tongues":0.6}]}]}
```

**What the build reports:**
- It is placed as an `env_sprite`, render mode 5 (Additive), framerate 10.
- The loop wrap measure is 0.53 and the jitter is 1.66. The report flags no fault at the wrap.
- It is 5 of 5 in range against Half-Life's own fire loop.
- The dark share is 0.78. I did not check this against the original, because the original's measure was never taken.

**What I could not do:**
- **The reference comparison.** The original's contact sheet is 256x192 with 32x96 cells, and the `reference` field only takes one square cell size. The build rejects anything but a number, and the reference measures are not in the report. I did not use `reference`, so the report does not measure this against the original.
- **Reading the original.** The original folder is outside the allowed paths, so I could not read its files directly. I worked from the contact sheet copy in the work folder (`pictures/frames.png`) and from `facts.txt` (the 32x96, 15 frames, parallel oriented, additive facts).

**Choices I made:**
- The flame's width, height and tongues were tuned by eye against the sheet over five builds. The final build has a wider, taller flame than my first try, which was too thin. Its tip reaches near the top of the frame, and its colour runs orange to yellow with a red edge.
- The loop was not tuned for a smoother wrap beyond the five builds. The wrap measure of 0.53 is the number to check if the judge flags the loop.

If you can give me a square reference sheet, or let me read the original's source to see how it expects the cell, I can put the original's measures into the report and tune against them.
