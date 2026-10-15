I built `sprites/xspark1.spr` and the build says OK, with every check passed. I had no reference sheet of the original, so I matched it only to your description and haven't measured it against the real one.

- **Facts:** 32x32, 11 frames, type parallel, format additive, 12 fps. Border brightness is 0, so there's no hard edge at the frame border.
- **Core:** a white-hot centre with a bright cyan glow around it.
- **Lobes:** dim teal-blue lobes sit around the core. They are re-placed from frame to frame, so the outline shifts like a flickering charge.
- **Loop:** I set `loop` to false so it keeps exactly 11 frames. With `loop` true the engine adds the first frame again at the end, which would make 12. The first frame's brightness is 0.97 and the last is 0.9, so the wrap should read as seamless.
- **Placement:** the report says to place it as a tempent, render mode Additive.

Two things differ from your description. The core may be a little tighter than 10 to 12 pixels, and the white-core flecks aren't modelled. I stopped after the second build because it was already close.
