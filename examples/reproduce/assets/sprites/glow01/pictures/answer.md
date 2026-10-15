The sprite is built and written to `work:sprites/glow01.spr` (with a sheet and an animated preview beside it). The build says OK, but one quality warning remains, so the result is close rather than exact.

**What it is:** a soft white radial glow, one 64x64 frame, parallel to the camera, additive (black is clear), placed as an `env_sprite`. It matches the original's stated facts: 64x64, 1 frame, parallel, additive.

**Final settings:** one glow layer, radius 1.0, core 0.26, colour white, centred. Full spec:

```json
{"spec": "smak.sprite/1", "sprites": [{"name": "sprites/glow01.spr", "class": "glow", "use": "env_sprite", "size": [64, 64], "frames": 1, "type": "parallel", "format": "additive", "origin": "centre", "reference": "pictures/frames.png", "layers": [{"kind": "glow", "radius": 1.0, "core": 0.26, "colour": [1, 1, 1], "at": [0, 0]}]}]}
```

**Measured against the original (from the final build):**

| Measure | Original | Mine |
| --- | --- | --- |
| Mean colour (delta E, 15 or under is near) | — | 0.9 |
| Share that is dark (within 0.05 is near) | 0.47 | 0.46 |
| Brightest | 0.91 | 0.91 |
| Pixels over 0.7 in a frame | 37 | 88 |
| Shape overlap (bar 0.8) | — | 0.84 |
| Border light | 0 | 0 |

**Still off:** the hot middle. My centre has about 88 pixels over 0.7 brightness against the original's 37, so the centre is a little too broad and bright. I tried core sizes from 0.2 to 0.3, a power falloff, a dimmer white and a smaller radius. Smaller cores fixed the middle but lost shape overlap (down to 0.68), and the other changes made things worse. I stopped at the best trade-off.

**Choices I made:**
- Used the work folder's `pictures/frames.png` as the reference. I could not read the input folder directly (the tool rejects directories and I could not find the picture file by name), so the reference is the contact-sheet copy the server holds.
- Set the colour to pure white, since the original's centre and mean colour match that.
- Did not add a flicker or an animation; the original is a single frame.
