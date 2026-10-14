I built `sprites/xspark1.spr` and the build says OK, with every check passing. It's a decent match for the description, but four things fall short.

**What it is:**

```
size        32x32
frames      11, looping (the file holds 12: the format repeats the first frame at the end)
type        parallel (always faces the viewer)
format      additive (black counts as clear)
fps         10
colours     249 after fitting to the sprite's palette
border      0 (no light at the frame edge)
```

**What it looks like:** a white core about 12 pixels across, sitting in the middle. Around it is a cyan glow (about RGB 60,220,255). Further out are dim teal lobes (about RGB 26,107,153), five fixed and four that swell and fade at different frames, so the outline shifts like a rough cloverleaf. The glow reaches about 26 to 28 pixels across and fades to black before the edge. The core drifts a pixel or two between frames.

**Where it differs from the description:**
- **Frame rate:** I used 10 rather than 12 to 15. As an `env_sprite` (the usual map entity for placing a sprite), the engine changes frame at most 10 times a second, and anything faster just skips frames.
- **No dark specks in the core:** the kit's layers (glow, smoke, fire, explosion and so on) can't punch small dark flecks into a bright area. Smoke and fire also drift upward as columns, so I built the lobes from glows set off-centre.
- **Some swelling in the middle of the loop:** the kit times each layer once across the loop instead of repeating it. As a result, the glow is a little fuller in the middle frames, and the first and last frames are at 85% of the peak brightness. The description says it shouldn't grow or shrink overall, so a close look will show this.
- **The wrap is near the limit:** the change from the last frame back to the first is 2.34 times an average frame-to-frame change. The build flags anything over 2.5, so it passes, but only just.

The file is at `work:sprites/xspark1.spr`, with `-sheet.png` (all frames side by side) and `-animated.png` next to it.
