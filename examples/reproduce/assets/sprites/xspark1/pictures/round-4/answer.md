The sprite builds OK and is written to `work:sprites/xspark1.spr`, with `-sheet.png` and `-animated.png` beside it.

**What it is:** a flickering cyan spark-cloud, the kind of soft glow you'd see at a Xen spark. The original's 11 frames are clusters of soft cyan blobs, each with a bright white core, on a dark ground.

**The spec I built:**
- **Class:** `glow`. The `sparks` class is held to a one-shot that must end dark, and the original doesn't do that: its last frame is as bright as its first.
- **Size:** 32x32, origin at centre.
- **Frames:** 11, looping at 10 fps. The spec writes the first frame again at the end, so the report counts 12.
- **Type and format:** parallel and additive, as your facts file says. The report places it as an `env_sprite`, render mode 5 (Additive), framerate 10.
- **Layer:** 9 soft blobs (`blobs`), with radius 0.3, spread 0.5 and core 0.4. The blobs are redrawn each frame, which gives the flicker the original shows.
- **Colour:** a ramp from black at the rim, through a mid cyan, to a pale cyan and white at the core. Black is clear in additive, so the border goes dark.
- **Finish:** an edge fade of 2 pixels, so no light reaches the square's border.

**Measured against your reference sheet:**
- Mean colour delta E is 3.9, inside the 15 "near" band.
- Border light is 0, against the reference's brightest 0.145.
- Shape overlap with the reference is 0.74 on average; the judge's bar is 0.7.

**Left open:**
- Dark share is 0.53 against the original's 0.46. The spec's near band is 0.05 and this is 0.07 outside it. Widening the blobs from 0.26 to 0.3 barely moved it, so I stopped there rather than keep tuning.
- The 12-against-11 frame count is the loop's wrap copy, which the spec writes by design. Dropping the loop would fail the sprite's own check, since it would then have to end dark.
- I guessed the 10 fps and the looping. Your facts file doesn't give either, and the original's frame rate isn't recorded anywhere I could read.

I couldn't read the input folder directly: it's a directory, and the render tool wouldn't take the PNG. I worked from the `frames.png` contact sheet, which is what the build's reference uses.
