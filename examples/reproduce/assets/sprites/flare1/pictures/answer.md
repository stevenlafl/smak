The sprite builds **OK** with no warnings. It is written as `sprites/flare1.spr` in the smak work folder, with `-sheet.png` and `-animated.png` beside it.

**Final spec** (sent as the build input, not saved as a file):

```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/flare1.spr","class":"flare","use":"env_sprite","size":[64,64],"frames":1,"type":"parallel","format":"additive","origin":"centre","reference":"pictures/frames.png","finish":"edge","layers":[{"kind":"glow","radius":1.0,"core":0.5,"colour":[1,0.7,0.9],"gain":1.0},{"kind":"flare","core":0.12,"colour":[1,0.95,1],"gain":0.7,"streaks":[],"rays":{"count":48,"length":0.9,"jitter":0.5,"width":0.012,"gain":0.35}}]}]}
```

**Measured against the original** (the build's judge, on the contact sheet `pictures/frames.png`):

| Measure | Original | Mine | Bar |
| --- | --- | --- | --- |
| Mean colour (delta E) | — | 7.1 | 15 or under |
| Share that is dark | 0.39 | 0.38 | within 0.05 |
| Border light | 0 | 0 | none |
| Frames | 1 | 1 | 1 |
| Shape overlap, faint edge / body / core | — | 0.97 / 0.95 / 0.91 (mean 0.95) | 0.8 |

**What it is:** a soft, round, lilac-pink glow with a bright near-white core and faint radial rays, on a dark border. One static frame, 64x64, parallel to the camera, additive, placed as an `env_sprite` (render mode 5, Additive).

**Choices I made:**
- **Glow:** a smooth-falloff glow, radius 1.0 with a wide core (0.5), coloured `[1, 0.7, 0.9]`. The falloff edge is trimmed by `finish: edge` so no light reaches the border.
- **Rays:** a flare layer with no cross streaks (`streaks: []`), only the 48 fine rays at gain 0.35, plus a white core.
- **Colours:** the colour values are 0 to 1 in this spec format, not 0 to 255.

**Limits:** I compared against the 128-pixel contact sheet only, not a full-size original, so fine ray pattern and exact hue are judged from that sheet. The `-animated.png` and `-sheet.png` pictures were not separately inspected beyond the build's own output.
