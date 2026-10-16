The sprite builds **OK** and is written to `work:sprites/fire.sprite` as `sprites/fire.spr`, with its sheet and animated picture beside it. The build still lists two warnings, which I did not clear.

**What it is:** a 32x96 flame on its base (origin bottom), type parallel oriented, format additive, 15 frames looping at 10 fps. Placed as an env_sprite, render mode 5 (Additive). The build also says it sits within Half-Life's fire-loop ranges (5 of 5).

**The spec I settled on:**

```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/fire.spr","class":"fire loop","size":[32,96],"frames":14,"loop":true,"fps":10,"type":"parallel oriented","format":"additive","origin":"bottom","reference":"pictures/frames.png","layers":[
  {"kind":"fire","width":0.6,"taper":0.2,"tongues":0.5,"height":1.2,"gain":0.6,"ramp":"reference"},
  {"kind":"glow","at":[0,-0.25],"radius":1.1,"core":0.5,"gain":0.8,"ramp":"reference","mask":"reference"}]}]}
```

**Choices I made that you should know about:**
- **`reference` and `mask: "reference"`:** the glow layer is masked to the original's lit area, frame by frame. Without the mask the flame's shape overlapped the original only 0.38. The guide describes this for matching a picture, but it means the shape is traced from the original's outline, not invented from scratch.
- **`ramp: "reference"`:** the colours come from the original's own brightness-to-colour readings, not a guessed palette. Only the outline comes from the mask; the colours come from the ramp and the fire layer.
- **`frames: 14`:** the build writes a loop of 14 and repeats its first frame at the end, giving the original's 15.
- **Tuning:** I tried about ten builds, adjusting the fire's gain, the glow's gain, position and height, and checked each one's warnings. The best set is the one above.

**Remaining warnings (not cleared):**
- Shape overlap is 0.76 against the 0.8 bar. The core overlap is 0.51, which is the weakest part. The flame's bright core sits a little low and its top a little short against the original.
- The lit share is 0.43 against the original's 0.38. That is just outside the 0.05 near-band.

Mean colour is 14.1 delta E, under the 15 bar. The brightest frame is 0.65 against 0.69. Neither the middle nor the border is flagged.

I could not open the original's frames picture directly from the local path; the picture is only reachable through the server's work folder, so I measured the sprite against that copy through the build report, not by eye. Please look at `work:sprites/fire-sheet.png` and `work:sprites/fire-animated.png` beside the original before you judge it.
