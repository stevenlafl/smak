The sprite is built and the build says OK with no notes. It is written to `work:sprites/glow01.spr`, with `-sheet.png` and `-animated.png` beside it.

**What it is:** a soft white glow, one frame, 64x64. It is a round, neutral-white light that is brightest at the centre and fades out smoothly to black at its edge, so the frame's corners stay empty.

**Spec used:**

```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/glow01.spr","class":"glow","size":[64,64],"frames":1,"type":"parallel","format":"additive","reference":"pictures/frames.png","layers":[{"kind":"glow","radius":0.94,"core":0.3,"colour":[1,1,1]}]}]}
```

**Measured against the original** (the report's own measures, read off the original's contact sheet):

| Measure | Original | Mine |
| --- | --- | --- |
| Share of frame that is dark | 0.47 | 0.48 |
| Mean colour difference (delta E; 15 or under is near) | — | 3.6 |
| Shape overlap (bar 0.7) | — | 0.83 |
| Border brightness | 0 | 0 |
| Frames | 1 | 1 |

**Type and format:** parallel (faces the camera), additive (black is clear). The report places it as an `env_sprite` with render mode 5 (additive).

**Choices I made:**
- **Colour:** neutral white. My first build used the glow's default, which came out warm tan, and the original is not warm.
- **Size of the glow:** `radius` 0.94 means the lit disc reaches about 0.94 of the half-width, which matches the original's fade-out at its edge. The dark share only matched once I went past my first guesses (0.8, then 0.9).
- **Core:** `core` 0.3 gives a bright centre about 20 pixels across, close to the original's.

**Caveats:**
- The reference is `pictures/frames.png` in the work folder. It is the same 2937-byte file as the input's `frames.png`, but I did not compare the bytes directly.
- I could not read the original's pixel values myself (no shell here), so the colour and falloff match rests on the report's measures and a visual comparison, not on a pixel-by-pixel check.
- The sprite is not copied into `/media/Data3/Packages/smak/examples/reproduce/assets/sprites/glow01/`. It is in the work folder only.
