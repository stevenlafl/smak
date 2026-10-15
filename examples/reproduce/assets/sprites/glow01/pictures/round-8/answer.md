The sprite builds OK with no warnings left. It's written to `work:sprites/glow01.spr` as a 64x64 single-frame glow.

**The final spec:**

```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/glow01.spr","class":"glow","use":"env_sprite","size":[64,64],"frames":1,"type":"parallel","format":"additive","origin":"centre","reference":"pictures/frames.png","layers":[{"kind":"glow","radius":1.1,"core":0.24,"colour":[1,1,1]}]}]}
```

**What it is and how it matches the original:**

| Measure | Original | This sprite |
| --- | --- | --- |
| Shape | Soft white centre fading to grey at the edge, centred | Same, a radial glow centred in the frame |
| Size | 64x64, 1 frame | 64x64, 1 frame |
| Colour | White centre, neutral grey falloff | White (`[1,1,1]`) |
| Mean colour, delta E (15 or under is near) | | 4.9 |
| Dark share (within 0.05 is near) | 0.47 | 0.46 |
| Shape overlap (bar 0.8) | | 0.82 (frame 0) |
| Border light | 0 | 0 |
| Type, format | parallel, additive | parallel, additive (render mode 5) |
| Motion | none (one frame) | none |

**Choices I made:**
- Used a smooth radial glow layer, the closest fit to the original's falloff. A power-law falloff scored worse (overlap 0.73, delta E 8.2), so I dropped it.
- Took the radius (1.1) and core (0.24) by building and reading the report's measures; these are the values that cleared every warning.
- Used `env_sprite` as the default `use` and `centre` as the default origin, since the original is a centred glow and nothing asked otherwise.

**Caveat:** I judged the shape from the report's measures and the rendered picture, not by a pixel-level side-by-side. The dark share and shape overlap are both near the bars but not exact (the shape overlap of 0.82 is only just over the 0.8 bar), so a stricter judge could still see a small difference in the outer falloff.
