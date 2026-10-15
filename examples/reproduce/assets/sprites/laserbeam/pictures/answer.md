The sprite is built and the build says **OK** with no warnings: `sprites/laserbeam.spr` in the work folder, with `-sheet.png` and `-animated.png` beside it.

**Spec used** (`smak.sprite/1`):

```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/laserbeam.spr","class":"beam","use":"beam","type":"parallel","format":"additive","size":[32,64],"frames":1,"reference":"pictures/frames.png","layers":[{"kind":"beam","profile":"flat","core":0.5,"shoulder":0.3,"noise":0.3,"colour":[0.85,0.9,1]}]}]}
```

**What it is and how it matches the original:**

| Measure | Original | Mine |
| --- | --- | --- |
| Size, frames | 32x64, 1 frame | 32x64, 1 frame |
| Type, format | parallel, additive | parallel, additive (render mode 5) |
| Mean colour (delta E, 15 or under is near) | reference | 8.9 |
| Dark share (near = within 0.05) | 0.02 | 0.06 |
| Border brightness, mean | 0.251 | 0.235 |
| Shape overlap, frame 0 (judge's bar 0.8) | | 0.94 |

- **Shape:** a flat beam, full width, with a bright core in the middle and softer shoulders to each edge, lit across the whole frame like the original.
- **Colour:** a pale blue-white.
- **Frames and motion:** one frame, no animation, since the original has one.
- **Type and format:** `use: beam`, so it tiles along its length when placed as a beam.

**Judgement calls to check:**
- The facts file gives only size, type and format, so `use: beam` and `class: beam` are my reading of a file called laserbeam, not something the original states.
- The noise and colour values were tuned against the original's measures, not copied from it.
- The original's dark share is 0.02 and mine is 0.06. Both are near-black pixels in the same small range, so this is within the bar, but it is the one measure I'd tighten first if you want it closer.

I couldn't open the original's files directly from here (the reference was only reachable through the kit), so the comparison rests on the kit's measurements of `pictures/frames.png`, not a side-by-side look at the pixels.
