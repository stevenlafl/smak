I built `sprites/laserbeam.spr` and the build says OK, with every check passing.

It's a vertical laser beam, 32x64, 1 frame, type parallel, format additive. It's set up to be used as a beam, so it gets render mode 5 (Additive) and is lit to its top and bottom ends so it repeats cleanly along its length. It's made of two layers:
- **Core:** a bright white stripe down the middle with soft, rounded edges and a little streaking.
- **Edge glow:** a wider, faint, slightly blue-grey layer with heavy streaking, which gives the grey shoulders and the mottled, not-quite-black edges of the original.

How the build's measurements compare with the original picture:

```
measure                 original   mine    near enough when
mean colour (delta E)   -          9.6     15 or under
dark share              0.02       0.07    within 0.05
border mean brightness  0.251      0.264   -
border brightest        0.914      0.914   -
frames                  1          1       -
```

"Delta E" is a standard measure of how far apart two colours look; lower is closer. Colour, border and frame count all match. The dark share is 0.05 off, right at the "near" line. It's because my edge glow fades to black a little sooner than the original's. The previous build had the colour closer (7.6) but its edges were much too dark (0.25), so I kept this one. Looking at the two side by side, my white core may also be a bit wider than the original's.

The sprite is in the work folder at `sprites/laserbeam.spr`, with a sheet and an animated picture saved next to it.
