The sprite is built and the build says OK: `sprites/flare1.spr` is in the work folder, with its sheet and animated picture beside it.

What it is: a soft round lens-flare glow, 64x64, one frame, type parallel, format additive, placed as an `env_sprite` (render mode 5, Additive). It has a bright white-pink core, a mauve halo that fades to nothing before the frame edge, and a faint fine-ray texture.

Measures against the original (from the build's report):

| Measure | Original | Built |
| --- | --- | --- |
| Size, frames, type, format | 64x64, 1, parallel, additive | 64x64, 1, parallel, additive |
| Mean colour (delta E, 15 or under is near) | reference | 5 |
| Dark share (within 0.05 is near) | 0.39 | 0.43 |
| Border light | 0 | 0 |
| Shape overlap (bar 0.7) | reference | 0.87 |
| Half-Life flare range | | in range |

The spec I used, for reference:

```json
{"spec":"smak.sprite/1","sprites":[{"name":"sprites/flare1.spr","class":"flare","use":"env_sprite","size":[64,64],"frames":1,"type":"parallel","format":"additive","origin":"centre","reference":"pictures/frames.png","finish":"edge","layers":[{"kind":"glow","radius":0.97,"core":0.42,"colour":[0.8,0.6,0.72],"falloff":"smooth","gain":0.8},{"kind":"flare","core":0.26,"colour":[1,0.92,0.97],"rays":{"count":48,"length":0.8,"jitter":0.5,"width":0.012,"gain":0.2}}]}]}
```

Choices I made that you may want to check:
- I used `smooth` falloff rather than `power`. `power` kept light at the frame edge (border 0.006 to 0.009, outside Half-Life's 0 to 0.005 range), and shrinking the radius did not clear it.
- I dropped the long horizontal and vertical streaks from my first attempt. The original shows only a faint star texture, not a cross.
- Colours are set by eye from the picture, not sampled from pixels; the delta E of 5 says they're close.
- I did not copy the spec into the reproduce folder under `/media/Data3/Packages/smak/examples/reproduce/`, since you asked only for the sprite. The sprite lives in the work folder.
