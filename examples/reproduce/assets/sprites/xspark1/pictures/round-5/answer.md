The sprite builds **OK** and has no faults, but one warning is left: its shape matches the original at 0.71 against the 0.8 bar. I stopped there because the remaining gap comes from the blobs, which the sprite places randomly each frame, so I can't line them up with the original frame by frame.

The file is `work:sprites/xspark1.spr`, with `-sheet.png` and `-animated.png` beside it.

**What it is:** a 32x32 glowing spark. A bright white-cyan core with a blue halo, lumpy outer edges, and the lobes shifting from frame to frame, as in the original.

**Settings I chose:**

| Setting | Value | Basis |
| --- | --- | --- |
| Class | `glow` | Looping light, not a one-shot |
| Size | 32x32 | Your input |
| Frames | 11 written (10 plus the first again at the end) | Matches the original's 11 |
| Type | `parallel` | Your input |
| Format | `additive` | Your input |
| Frame rate | 10 fps | My choice; I couldn't read `facts.txt` for the original's rate |
| Placed as | `env_sprite`, render mode 5 (additive) | Reported by the build |

**Layers:**
- A glow: radius 0.55, core 0.3, shifted slightly right and up from centre.
- Nine blobs per frame, radius 0.35, spread 0.6.
- Both use one colour ramp: black at the rim (clear in additive), deep blue, cyan, then a near-white centre.
- A 2-pixel edge fade so no square border shows.

**Measures against the original (from the build report):**

| Measure | Original | Mine | Bar |
| --- | --- | --- | --- |
| Mean colour, delta E | — | 12.5 | 15 or under |
| Share that is dark | 0.46 | 0.49 | within 0.05 |
| Border brightness | 0.145 | 0.146 | — |
| Frame count | 11 | 11 | — |
| Shape overlap, mean | — | 0.71 | 0.8 |
| Loop wrap | — | 0.89 | — |

The shape warning is the one thing still open. I tried four placements and the best was 0.71, with per-frame overlap between 0.66 and 0.76. Getting over 0.8 would need the blobs placed by hand for each frame, which the sprite tool doesn't do.

**Spec used** (for a rebuild):

```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/xspark1.spr","class":"glow","size":[32,32],"frames":10,"loop":true,"fps":10,"type":"parallel","format":"additive","origin":"centre","reference":{"picture":"pictures/frames.png","cell":128,"cols":8},"finish":{"edge":2},"layers":[{"kind":"glow","radius":0.55,"core":0.3,"at":[0.1,-0.12],"ramp":[[0,[0,0,0]],[0.35,[0.05,0.3,0.7]],[0.7,[0.25,0.8,1]],[1,[0.95,1,1]]],"gain":0.6},{"kind":"blobs","count":9,"radius":0.35,"spread":0.6,"ramp":[[0,[0,0,0]],[0.35,[0.05,0.3,0.7]],[0.7,[0.25,0.8,1]],[1,[0.95,1,1]]],"gain":1}]}]}
```

I haven't copied the spec or the sprite into the reproduce folder; say if you want that.
