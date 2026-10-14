I built `sprites/glow01.spr` and the build says OK with every check passing. Next to the original picture, the two look very close.

**What it is:** a plain white glow, 64x64, 1 frame, type parallel, format additive. There's no animation since it's a single frame. The build placed it as an `env_glow` with render mode 3 (Glow).

**How it matches the original:**
- **Shape:** a small, soft white peak in the middle, with a smooth grey halo fading out to about the frame's edge.
- **Colour:** pure white and grey, no tint. 46 palette colours, and almost nothing was lost when the image was reduced to that palette (0.0043).
- **Border:** fully dark (brightest border pixel is 0), so no visible square edge in game.
- It's in range for Half-Life's own glow sprites.

**What's left:** going by eye, the original's halo might be a touch brighter in the middle distance. I stopped there because the difference was hard to see.

The final spec is two glow layers:

```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/glow01.spr","use":"env_glow","class":"glow","size":[64,64],"frames":1,"type":"parallel","format":"additive","layers":[
  {"kind":"glow","radius":1.0,"core":0.38,"colour":[1,1,1],"gain":0.65},
  {"kind":"glow","radius":0.5,"core":0.05,"colour":[1,1,1],"gain":1.2}]}]}
```

A layer's `colour` takes values from 0 to 1, not 0 to 255, and the spec guide doesn't say so. My early builds used `[255,255,255]`, which multiplied the brightness 255 times. That's why they came out as solid white discs.

The sprite is at `work:sprites/glow01.spr`, with `-sheet.png` and `-animated.png` beside it.
