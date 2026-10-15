The sprite is built and the build says OK: `sprites/flare1.spr` is written to the work folder, with its `-sheet.png` and `-animated.png` beside it.

**Final spec** (env_sprite, parallel, additive, 64x64, 1 frame):

```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/flare1.spr","class":"flare","use":"env_sprite","size":[64,64],"frames":1,"type":"parallel","format":"additive","finish":"edge","reference":"pictures/frames.png","layers":[{"kind":"glow","radius":0.95,"core":0.35,"colour":[0.7,0.5,0.78],"falloff":"power","power":2},{"kind":"flare","core":0.3,"colour":[1,1,1],"rays":{"count":48,"length":0.9,"jitter":0.5,"width":0.012,"gain":0.35}}]}]}
```

**What the original is:** a lens-flare style light. A white-hot core, a soft mauve-lavender halo that fills most of the frame, and many fine radial rays. It is one frame, parallel to the camera, additive, with black as clear.

**How it compares** (the judge's measures against the original, from the build report):

| Measure | Original | Mine | Threshold |
| --- | --- | --- | --- |
| Mean colour, delta E | — | 12.4 | 15 or under is near |
| Dark share | 0.39 | 0.35 | within 0.05 is near |
| Border brightest | 0 | 0.019 (mean 0.003) | — |
| Frames | 1 | 1 | — |
| Shape, faint edge / body / core | — | 0.94 / 0.88 / 0.82 | under 0.8 is a warning |
| Shape, mean | — | 0.88 | — |

No warnings remain. The build reports one faint border value (0.019 at its brightest, mean 0.003) that the original does not have. I tried a smaller glow radius and `finish: "edge"`, and neither removed it. It likely comes from the ray tips reaching the edge. The fix would be shorter rays, but that cost shape match in an earlier try, so I left it.

**Choices I made:**
- The shape and rays come from a glow plus a flare layer, tuned against the reference picture. I did not copy the original's pixels.
- I used the work-folder copy `pictures/frames.png` as the reference. The original input folder holds `frames.png` and `facts.txt`, and `facts.txt` only says 64x64, 1 frame, parallel, additive.
- The core colour is white and the halo colour is my estimate by eye, since I could not read pixel values from the reference directly.
