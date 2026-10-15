The sprite builds with every check passing. It's at `work:sprites/fire.spr`, with `fire-sheet.png` and `fire-animated.png` beside it.

**What it is:**
```
size        32x96, 15 frames in a loop (16 written: the engine wants frame 0 again at the end)
type        parallel oriented
format      additive (render mode 5), placed as an env_sprite at 10 fps
origin      bottom (the flame stands on its base)
colours     173, nothing lost when reduced to the palette
border      0 (no light at the frame's edge)
dark share  0.82 of the pixels
loop wrap   0.79 (smooth, no jump at the wrap)
vs Half-Life's own fire loops: 5 of 5 measures in range
```

The flame is a single fire layer. Its colour ramp runs black → dark rust → red-brown → orange → yellow-orange, with no blue and no smoke. It's wide at the base and narrows into ragged, flickering tongues ("tongues" 0.9, "turbulence" 0.9), and the outer 4 pixels fade out so the base and edges are soft.

**Where it may still differ from the original:**
- **Core too pale:** in the build's small preview the middle of the flame looks pale yellow-white, not saturated orange. I lowered the gain and capped the top of the ramp at yellow-orange, but the preview didn't visibly change between those last tries, so I can't tell whether the sprite really is that pale or the preview is just washing it out.
- **Size and shape:** at that preview size the flame looks a bit narrower and more pointed than "fills most of the width at its base".
- **Frame rate:** 10 fps is a guess because the description doesn't give one. It's also the most an env_sprite will play.

I had no picture of the original, so the build only compared it against Half-Life's own fire sprites, not against the one it's meant to copy.
