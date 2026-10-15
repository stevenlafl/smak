I built `sprites/glow01.spr` and the build says OK, with no warnings left against the original. It's in the work folder, with a sheet and an animated picture beside it.

It's a soft white glow: 64x64 pixels, 1 frame, type parallel (it always faces the camera), format additive (black shows as clear). There's no animation. The build places it as an `env_glow`, the game's glow entity, with render mode 3 (Glow).

How it measures against the original:

```
                          original   mine
mean colour difference    -          2.7   (15 or under counts as near)
share of frame dark       0.47       0.44
brightest                 0.91       0.91
pixels over 0.7           37         32
light at the border       0          0
shape overlap             -          0.83  (bar is 0.8)
  faint edge / body / core           0.90 / 0.87 / 0.72
```

It's made of two white glows added together: a broad one (radius 1.0, gain 0.65) for the soft body and a small one (radius 0.25, gain 0.35) for the bright centre. It took three builds:
- **First:** too small and too dark (overlap 0.55).
- **Second:** too wide, with too hot a centre (overlap 0.77).
- **Third:** sized between the two, and all checks passed.

The core is the closest-run part: it overlaps the original's by 0.72, against 0.87 to 0.90 for the rest of the shape.
