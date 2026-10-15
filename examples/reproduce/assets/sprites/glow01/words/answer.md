The sprite is built and the build says OK: `work:sprites/glow01.spr`, with `-sheet.png` and `-animated.png` beside it.

What it is, as specified:
- **Size and frame:** 64 by 64 pixels, one frame, with no animation.
- **Type and format:** parallel (faces the viewer flat), additive (black is clear), placed as an `env_sprite` in render mode 5 (Additive).
- **Colour:** neutral white with no tint. My first build came out cream, so I set the glow colour to `[1, 1, 1]`. The palette has 55 colours and the quantising loss is 0.0037.
- **Shape:** a single centred radial glow, no rays or noise. Its falloff is `power` 2 with a core of 0.3125 (10 pixels), so it sits at mid grey at 10 pixels and about 20% brightness at 20 pixels. Its reach is 32 pixels, so the corners and edges are pure black (border 0).

The build reports the glow is in range of Half-Life's own glow class (1 of 1). Its checks don't compare pixels against your original, because I was not given a reference picture. The 10, 20 and 30 pixel values come from the falloff formula, not from measuring the original, so a side-by-side judge may see small differences in the hot spot (I didn't tune its size to 4 to 6 pixels) and in the exact haze at 30 to 32 pixels. If you can send a picture of the original, I can set the spec's `reference` and tune against it.

The spec I used:

```json
{"spec": "smak.sprite/1", "sprites": [{"name": "sprites/glow01.spr", "class": "glow", "use": "env_sprite", "size": [64, 64], "frames": 1, "type": "parallel", "format": "additive", "origin": "centre", "layers": [{"kind": "glow", "radius": 1.0, "core": 0.3125, "falloff": "power", "power": 2, "reach": 1.0, "colour": [1, 1, 1]}]}]}
```
