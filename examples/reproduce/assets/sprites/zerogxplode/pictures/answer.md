The sprite is built and the build says OK: `work:sprites/zerogxplode.spr` is 64x64, 15 frames, type parallel, format additive. The game will draw it in additive render mode.

It's a lit cloud of fire. Frame 0 is a small white ball. The cloud swells to its whitest around frames 3–5, cools through cream and orange-tan, breaks into brown wisps, and is dark by frame 14. Small flecks of debris fly out around it, like in the original.

How it measures against the original, on the judge's own measures:

```
measure                    original   mine    note
mean colour (delta E)      -          4.3     15 or under counts as near
share of frame dark        0.72       0.71    within 0.05 counts as near
frames                     15         15
brightest pixel at border  0.818      0.144   mean border light 0.005 vs 0
```

It also passed all 5 checks against Half-Life's own explosions.

Two things a side-by-side judge may notice:
- **Shape:** the original has two clear lobes, a brighter one at the upper right and one at the lower left, with the upper lobe lasting longest as it fades. Mine is a rounder lumpy mass. An earlier, smaller build had more of that stacked look but filled less of the frame (0.77 dark against 0.72). I kept the one that matches size and colour.
- **Border:** some of the original's debris flecks reach the frame edge. Mine stay inside, since the build requires a dark border unless the sprite is a beam.

The sprite's sheet and animated preview are written next to it as `-sheet.png` and `-animated.png`.
