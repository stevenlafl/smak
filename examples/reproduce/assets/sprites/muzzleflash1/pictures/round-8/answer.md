The sprite is built and written to the work folder as `sprites/muzzleflash1.spr`, with its sheet and animation pictures beside it. The build opens with "OK: built, and every check passed", but it still prints one warning, so the shape match is not met.

**The spec** (also saved as `sprites_muzzleflash1.spec.json`):

```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/muzzleflash1.spr","use":"tempent","class":"flare","size":[64,64],"frames":2,"type":"parallel","format":"additive","reference":"pictures/frames.png",
"layers":[{"kind":"glow","radius":0.6,"ramp":"muzzle"},
{"kind":"flare","core":0.1,"ramp":"muzzle","streaks":[
{"angle":0,"length":0.95,"width":0.02,"half":true,"gain":0.5,"haze":0,"blur":0},
{"angle":90,"length":0.95,"width":0.02,"half":true,"gain":0.5,"haze":0,"blur":0},
{"angle":45,"length":0.6,"width":0.02,"half":true,"gain":0.3,"haze":0,"blur":0},
{"angle":135,"length":0.6,"width":0.02,"half":true,"gain":0.3,"haze":0,"blur":0}]}]}]}
```

**Measured against the original** (the build's own reading of `pictures/frames.png`):

| Measure | Original | This sprite | Bar |
| --- | --- | --- | --- |
| Mean colour (delta E) | reference | 2.9 | 15 or under |
| Share that is dark | 0.76 | 0.74 | within 0.05 |
| Frames | 2 | 2 | 2 |
| Shape overlap, frame 0 / frame 1 | | 0.58 / 0.58 | 0.8 |
| Colours | | 92 | |
| Border brightness | 0.02 | 0 | |

**Choices made:**
- Type `parallel`, format `additive`, use `tempent`, class `flare`, 64x64, 2 frames, as you gave.
- The colours come from the built-in `muzzle` ramp (white, peach, tan), which the measures put close to the original.
- A soft glow gives the body, and four thin streaks (horizontal, vertical, and two diagonals) give the spikes.
- Both frames come out identical in shape. The original's second frame is a touch wider, but I could not measure that difference in the tool.

**What is still open:** the shape overlap stays at about 0.58, under the 0.8 bar. I tried about ten variations (glow radius, core size, streak width and gain). Colour and darkness moved with them, but no variation lifted the overlap above about 0.6. I could not open the original picture myself: the file is not reachable from this sandbox, so every change was tuned from the numbers the build reports, not by eye. If you can give me the original as a file reachable here, or tell me how its bright core and spikes look, I can aim the shape directly.
