The sprite builds **OK** with no warnings, written as `work:sprites/flare1.spr` (with `-sheet.png` and `-animated.png` beside it).

Final spec:

```json
{
  "spec": "smak.sprite/1",
  "sprites": [
    {
      "name": "sprites/flare1.spr",
      "class": "flare",
      "use": "env_sprite",
      "size": [64, 64],
      "frames": 1,
      "type": "parallel",
      "format": "additive",
      "origin": "centre",
      "reference": "work:pictures/frames.png",
      "finish": { "edge": 2 },
      "layers": [{ "kind": "glow", "radius": 0.98, "core": 0.5, "gain": 1.3, "ramp": "reference" }]
    }
  ]
}
```

Measured against the original (the build's report, which reads both sheets the same way):

| Measure | Original | Made | Bar |
| --- | --- | --- | --- |
| Mean colour (delta E) | reference | 3.6 | 15 or under |
| Share dark | 0.39 | 0.36 | within 0.05 |
| Brightest | 0.91 | 0.91 | within 0.08 |
| Pixels over 0.7 | 530 | 548 | not half again |
| Shape overlap (frame 0) | | 0.91 | 0.8 or over |
| Border light | 0 | 0 | none |
| Frames | 1 | 1 | |

Choices I made:
- **Type and format:** `parallel` and `additive`, the defaults you said to use, matching the original's stated type and format.
- **Class and use:** `flare` and `env_sprite`. Half-Life's own flare is in range on the build's check.
- **Colour:** `"ramp": "reference"`, so the glow takes the original's own colour at each brightness rather than a guessed tint.
- **Shape:** a single soft glow with a power falloff softened by the build's edge fade. That gave the wide, dark-edged halo the original has.

Caveat: I couldn't open `frames.png` to look at it myself. The only copy I could reach through the tools is the work folder's (the path you gave was outside the tools' allowed folders), so my match rests on the build's measurements, not a side-by-side look. The rendered sheet looks like a soft white-pink glow, which fits the measured colours, but it's worth a visual check against the original before you judge it.
