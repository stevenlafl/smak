The sprite builds OK with no warnings. It is written as `work:sprites/flare1.spr`, with `-sheet.png` and `-animated.png` beside it.

**Spec used:**

```json
{"spec": "smak.sprite/1", "sprites": [{"name": "sprites/flare1.spr", "class": "flare", "use": "env_sprite", "size": [64, 64], "frames": 1, "type": "parallel", "format": "additive", "reference": "pictures/frames.png", "layers": [{"kind": "glow", "radius": 1.0, "core": 0.4, "falloff": "smooth", "gain": 1.0, "ramp": "reference"}, {"kind": "flare", "core": 0.1, "gain": 0.3, "ramp": "reference", "rays": {"count": 48, "length": 0.9, "jitter": 0.5, "width": 0.012, "gain": 0.25}}]}]}
```

**What it is:** a lens-flare glow, a white-to-mauve soft halo with a bright centre and faint cross rays. It is 64x64, one frame, parallel to the camera, additive (black is clear), and placed as an `env_sprite` in render mode 5 (Additive).

**Final measures against the original (from the build report):**

| Measure | Original | Mine |
| --- | --- | --- |
| Mean colour (delta E, 15 or under is near) | reference | 8.7 |
| Share that is dark (0.39 reference) | 0.39 | 0.38 |
| Brightest pixel | 0.91 | 0.91 |
| Pixels over 0.7 brightness | 530 | 222 |
| Border light | 0 | 0 |
| Shape overlap, frame by frame | | 0.97, 0.91, 0.66 (mean 0.85) |

**Known gaps:**
- The original's hot middle covers more pixels over 0.7 (530 against 222). The build does not flag this because it is under the warning bar, but it is the largest visible difference.
- The original's rays are fainter and more even than mine. Mine read as a sharper cross.
- The overlap at the faint outer edge (0.97) is close, but the core overlap (0.66) is the weakest of the three bands.

**Things I learned about the tool, since they affect the spec:**
- A `glow` with `falloff: "power"` ignores `radius`; it reaches to 1.5 regardless. I switched to `"smooth"` so that `radius` took effect.
- The `finish: "edge"` I tried first made no difference to the output, so I dropped it.

I did not copy the sprite into the examples folder under `assets/sprites/flare1/`; it is only in the work folder.
