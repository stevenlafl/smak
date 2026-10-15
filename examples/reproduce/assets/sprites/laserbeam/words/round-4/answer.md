The sprite builds OK: `work:sprites/laserbeam.spr`, 32x64, 1 frame, additive, placed as a beam (render mode 5, framerate 10). It is close to the description but not a faithful match, and I could not verify the pixel layout closely.

The build's own numbers for the final version:

| Measure | This sprite | Original (per the description) |
| --- | --- | --- |
| Size and frames | 32x64, 1 frame | 32x64, 1 frame |
| Format | additive, parallel | additive, parallel |
| Border light (edge brightness) | 0.138 | near black (fades 2 to 4 px from the edges) |
| Dark share | 0.36 | roughly 0.15 to 0.2 |
| Brightest | 1.0 | near white |

The problems:

- **Edges too bright.** The border reads about 0.14 where the original fades to black. The halo needs to fall off sooner at the sides; I could not get that without thinning the halo too far.
- **Dark share too high.** The halo is narrower than the original, so more of the frame is black.
- **Core position unverified.** The core is built from a flat band at the centre, but the preview thumbnails seemed to show it right of centre. I could not measure the pixels to confirm or fix it, so it may need a one-pixel shift left.
- **Striations and mottling.** The halo has streak and noise settings, but I could not check how they read at full size.

The spec I ended on, as a single inline sprite with two beam layers:

```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/laserbeam.spr","class":"beam","use":"beam","size":[32,64],"frames":1,"loop":false,"fps":10,"type":"parallel","format":"additive","origin":"centre","layers":[{"kind":"beam","core":0.32,"noise":0.5,"profile":"flat","shoulder":0.2,"streaks":0.7,"colour":[0.55,0.6,0.7],"gain":0.9},{"kind":"beam","core":0.28,"noise":0,"profile":"flat","shoulder":0.04,"colour":[1,1,1],"gain":1}]}]}
```

Next steps if you want it closer: give me a reference picture of the original (a sheet or a frame) and I can measure against it with the `reference` field. That would settle the core offset and the edge fade directly.
