The sprite builds OK: `work:sprites/laserbeam.spr`, with `-sheet.png` and `-animated.png` beside it.

The spec I built from:

```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/laserbeam.spr","class":"beam","use":"beam","size":[32,64],"frames":1,"type":"parallel","format":"additive","origin":"centre","finish":{"edge":3},"layers":[{"kind":"beam","core":0.28,"shoulder":0.3,"profile":"flat","noise":0.6,"streaks":0.8,"colour":[0.82,0.88,1.0]}]}]}
```

- **What it is:** a beam, `use` beam, placed as render mode 5 (Additive), 32x64, one frame, parallel.
- **Shape:** a flat core about 28% of the width (roughly 9 px) with soft shoulders, then the halo fades out. The edge fade is 3 px.
- **Colour:** white at the centre, a slightly cool grey-blue halo (0.82, 0.88, 1.0).
- **Texture:** mottling and vertical streaks (noise 0.6, streaks 0.8), with the top and bottom lit so it tiles end to end.
- **Frames:** one still frame, so nothing animates inside the sprite.

Where I could not match the description:
- **Core lean:** the beam layer has no offset, so the core sits centred, not a pixel or two to the left.
- **Right halo:** it is not brighter than the left, for the same reason.
- **Border measure:** the build reports the border at 0.125 light. That is probably the tiled top and bottom rows, which the beam keeps lit by design, but I could not confirm it from the picture alone.
- **Not measured:** there is no reference sheet here, so the build made no comparison against the original. The "against Half-Life's beam: 0 of 0" line is empty, so the shape and colour are unverified against the real file.

I also could not open the sheet PNG for a closer look; the picture shown with each build is the only view I had. Check the sprite in the game before you rely on it.
