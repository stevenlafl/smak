The sprite builds OK with no faults or notes. It is written to `sprites/muzzleflash1.spr` in the work folder, with a sheet and an animated preview beside it.

It is a five-point star: a white-hot centre with peach rays fanning out, on black. It is 64x64, two frames, parallel (faces the camera), additive (black is clear), placed as a muzzle flash (`tempent`, render mode 5).

Measured against the original's frames (`input/frames.png`), in a fenced table:

```
Measure                         Original    Mine
Mean colour difference          (0)         2.9   (under 15 is near)
Share of frame that is dark     0.76        0.76  (within 0.05 is near)
Border light                    0.02        0
Frames                          2           2
Shape overlap, frame 0          (1)         0.82
Shape overlap, frame 1          (1)         0.73
Shape overlap, mean             (1)         0.76  (bar is 0.70)
```

The "Original" column is the judge's reading of the reference, so the colour and dark figures are its own. The shape overlap is the share of pixels lit in both drawings, so it has no reference value of 1.

How I got there: I tried three versions before this one. The first had fat wedge-shaped rays and covered too much of the frame. The second had rays too thin and sparse. The third blurred so much that the rays merged into a disc with light at the border. This version has five thin rays with a light taper and a small glow.

Choices I made that the original's sheet can't tell me:
- **Frame rate:** 15 per second, which is my guess. The two frames are a loop-free one-shot, and the frame timing of the original is not in the picture.
- **Use:** `tempent`, class `flare`, origin centre, edge fade of 2 pixels.

The spec is inline in the build call and is not saved to a file, so I haven't written it into the reproduce folder.
