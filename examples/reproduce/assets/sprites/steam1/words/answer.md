The sprite builds OK: `work:sprites/steam1.spr`, with `-sheet.png` and `-animated.png` beside it.

Final spec, which is the last build that passed:

```json
{"spec": "smak.sprite/1", "sprites": [{"name": "sprites/steam1.spr", "class": "smoke puff", "use": "env_sprite",
  "type": "parallel oriented", "format": "index alpha", "size": [32, 48], "frames": 16, "loop": false, "fps": 10,
  "origin": "bottom", "finish": {"edge": 3},
  "layers": [{"kind": "billow", "at": [-0.05, -0.25], "size": 0.25, "rise": 0.6, "growth": 0.8, "dissolve": 0.9, "env": {"attack": 0}}]}]}
```

Against your description, from the contact sheet:
- **Frames 0-3:** a small dot that grows to a white cloud, about 12 px in frame 1 and about 22 px in frame 3, low and near the middle.
- **Frames 4-7:** the cloud swells to nearly the full 32 px width, with a lumpy cauliflower edge.
- **Frames 8-11:** it rises into a taller, ragged column with gaps opening between the puffs.
- **Frames 12-15:** it breaks into thin streaks and is almost gone by frame 15.
- **Format:** 32x48, 16 frames, parallel oriented, index alpha, render mode 4 (solid), not looping.

Where it differs from the original:
- **Frame 0 dot:** about 6 px across, not 3 px. I could not shrink it without losing the frame 1-3 growth, so I kept the larger growth.
- **Greys:** the cloud reads as white with soft grey shading. I did not add separate grey tones for the underside.
- **Frames 12-15:** the wisp is thinner and more broken than the vertical column in your description, not a clean thin column near the middle.
- **Frame rate and origin:** you gave neither, so I chose 10 fps (the most an `env_sprite` can change, which avoids a frame-skip warning) and a bottom origin, so the steam rises from its base.

I had no picture of the original, only your description, so the build's comparison is against Half-Life's smoke puff class, not against this sprite. It is not a measured side-by-side match. If you can give me a contact sheet of the original, I can add it as `reference` and tune against it.
