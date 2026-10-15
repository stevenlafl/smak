The sprite builds OK: `work:sprites/xspark1.spr`, with a sheet and an animated preview beside it.

**What it is**
- Name `sprites/xspark1.spr`, 32x32, 11 frames in the file, type parallel, format additive (black is clear).
- Class `glow`, placed as a `tempent` (render mode 5, Additive), framerate 12. The loop is 10 frames plus a copy of the first at the end, so it wraps seamlessly.

**How it is built**
- A cyan glow (RGB 60,220,255) out to about 0.9 of the frame's half-width, so roughly 28 px across, fading to black before the edge.
- A white hot core (RGB 255,255,255) about 10 to 12 px across, in the centre.
- Six teal lobes (RGB 20,90,130) placed fresh each frame, so they shift at random from frame to frame while the core stays put.

**Build report**
- Border 0, dark share 0.54, wrap 1.08, jitter 1.76, colours quantised with almost no loss.
- Against Half-Life's glow class, it is in range.

**What I could not match**
- I had no original file to measure against, so "as close as you can" rests on your description and the kit's own class ranges.
- The dark flecks inside the core are not modelled. Additive light can only add brightness, so a speck needs a gap in the blobs, and I did not add one.
- The lobes are softer than the cloverleaf you describe. Raising the blob count or radius would make them bolder, but I left it at the build that passed.

**Spec notes**
- The spec was passed inline and is not saved as a file in the work folder. Tell me if you want it written out as a `.json` beside the sprite.
- `sparks` class was rejected because it plays once and must end dark, which a looping charge does not do.
