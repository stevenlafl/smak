The sprite is built: `sprites/flare1.spr` is at `work:sprites/flare1.spr` (with `-sheet.png` and `-animated.png` beside it). The last build said OK with no faults and no warnings.

**What it is:** a 64x64 lens-flare glow. It has one frame, is parallel (it faces the camera), and is additive (black is clear). A soft lavender halo reaches the frame edge, and a bright white core sits in the middle with faint radial rays. The edge is fully dark.

**Measured against the original picture (`pictures/frames.png`, the reference the report measures against):**

| Measure | Original | Built |
| --- | --- | --- |
| Colour difference (delta E, 15 or under is near) | — | 5.6 |
| Dark share of the frame (within 0.05 is near) | 0.39 | 0.38 |
| Border light | 0 | 0 |
| Frames | 1 | 1 |
| Shape overlap, faint edge / body / core | — | 0.97 / 0.95 / 0.94 |

**Spec used** (smak.sprite/1, inline):

```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/flare1.spr","class":"flare","use":"env_sprite","size":[64,64],"frames":1,"type":"parallel","format":"additive","origin":"centre","finish":"edge","reference":{"picture":"pictures/frames.png","cell":128,"cols":8},"layers":[{"kind":"glow","radius":0.98,"core":0.5,"gain":1.0,"falloff":"smooth","colour":[0.8,0.55,0.75]},{"kind":"flare","core":0.3,"gain":0.8,"colour":[1,0.95,1],"streaks":[],"rays":{"count":48,"length":0.9,"jitter":0.5,"width":0.012,"gain":0.4}}]}]}
```

**Things to know:**
- Colours in the spec are 0 to 1, not 0 to 255. My first two builds used 0 to 255, which clipped the frame to solid white.
- The lavender halo colour and the ray strength were chosen by eye and tuned against the report's numbers. The report does not say which ray pattern the original used, so the rays are the least certain part.
- The original's rays are not drawn as separate streaks. The rays come from the `rays` setting, so the match to the original is on overall shape and colour, not on each ray.
- I could not write the spec to a file (the tools here only build), so the JSON above is the only copy of it. The sprite itself is in the work folder.
- I could not read the original's input folder directly: the read was denied for the directory. I used the copy in the work folder, which holds the same `facts.txt` (64x64, 1 frame, parallel, additive) and `frames.png`.
