The sprite is built and the build says OK with no warnings. It is written to the work folder as `sprites/glow01.spr`, with a sheet and an animated preview beside it.

**What it is:** a soft round glow with a bright white centre fading to black, the same picture as the original. The original is a 64x64 sprite with one frame, type parallel (faces the camera) and format additive (black is clear). The build places it as an `env_sprite` with render mode 5 (Additive).

**Final spec (as built):**

```json
{
  "spec": "smak.sprite/1",
  "sprites": [{
    "name": "sprites/glow01.spr", "class": "glow", "use": "env_sprite",
    "size": [64, 64], "frames": 1, "type": "parallel", "format": "additive", "origin": "centre",
    "reference": "pictures/frames.png",
    "layers": [
      { "kind": "glow", "radius": 1.0, "core": 0.4, "colour": [1, 1, 1], "at": [0, 0], "falloff": "smooth", "gain": 0.6 },
      { "kind": "glow", "radius": 0.4, "core": 0.1, "colour": [1, 1, 1], "at": [0, 0], "falloff": "smooth", "gain": 0.3 }
    ]
  }]
}
```

**Measured against the original (the contact sheet, `pictures/frames.png`):**

| Measure | Original | Built |
| --- | --- | --- |
| Colour (mean delta E, 15 or under is near) | — | 1.3 |
| Share that is dark (within 0.05 is near) | 0.47 | 0.43 |
| Brightest pixel | 0.91 | 0.88 |
| Pixels over 0.7 brightness, per frame | 37 | 32 |
| Shape overlap (bar 0.8) | — | 0.84 |
| Frames | 1 | 1 |

The first attempts were off in two ways: the glow was too tight, or too hot at the centre, and too broad. Splitting it into a broad halo and a small, dimmer centre fixed both.

**Choices I made:**
- The original's colour is pure white, so I used `[1, 1, 1]` as the 0-to-1 colour value.
- The shape match is 0.84, so I did not push it further. The core's overlap (0.76) is the weakest of the three bands.
- The file is in the work folder. I did not copy it into `examples/reproduce/assets/sprites/glow01/` because that folder is inside the smak repo, and you did not ask for that.
- I have not checked it in the game itself. The measures are from the build report only.
