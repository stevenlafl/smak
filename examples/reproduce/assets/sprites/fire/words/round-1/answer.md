I've built `sprites/fire.spr`, and the build says OK with every check passed. It's written to the work folder with a sheet image and an animated preview beside it.

```
Field         Value
------------  ------------------------------------------------------------
Size          32x96 per frame
Frames        a loop of 15; the first frame is repeated at the end, as the engine wraps, so the file holds 16
Type          upright (faces the viewer but stays upright)
Format        additive (black is clear)
Origin        bottom (the flame stands on its base)
Rate          10 fps; placed as an env_sprite, render mode 5 (Additive)
Colours       161 in the palette; nothing lost to quantising worth noting
Border light  0 brightest at the edge, with a 3 px soft fade
```

It measured within range on all 5 of the build's comparisons against Half-Life's own fire loops. The loop's wrap and frame-to-frame flicker both checked out, with no jump.

**What it looks like:** an orange flame that fills most of the width in the lower part and narrows upward, with a soft faded base. It's bright yellow-orange low down and fades through orange to dim red at the edges and tips. The flame flickers and sways in place from frame to frame.

**Where it falls short of the description:**
- **Tongues:** the outline reads more as a smooth teardrop or cone than as two or three separate ragged tongues. Raising turbulence from 0.6 to 1.0 made almost no visible difference, and the guide documents no other fire setting for splitting the flame.
- **White-hot core:** I tried a glow layer at the base for the near-white core. It blew out into a flat white disc even at low gain, so I dropped it. The brightest spot is yellow-orange rather than near-white.
- **Tip height:** I only saw the frames on the small contact sheet, so I haven't measured exactly how far below the top edge the tips end. The render tool won't open .spr files.
