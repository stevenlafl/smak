The sprite builds OK: `sprites/xspark1.spr` is written to the work folder, with its sheet and animated preview beside it.

- **What it is:** a blue-white plasma ball, drawn with a soft glow layer and a blob layer for the lobes.
- **Shape and size:** 32x32 pixels. The white core is about 11 px across, and the glow reaches about 29 px before fading to black.
- **Colours:** the core burns to white, the glow is cyan (60, 220, 255), and the outer lobes are teal (20, 90, 130).
- **Frames:** 11, with no repeated first frame at the end, so the loop wraps seamlessly. The lobes are randomised per frame, while the core and overall brightness stay steady.
- **Motion and type:** 12 fps, `tempent` use, parallel to the viewer, additive (black is clear).

The build reports a colour match of 1 of 1 in range against Half-Life's glow class, and no faults. I had no original file to compare against, so the match is to the class, not to your original. The dark flecks inside the core are not modelled separately; the dark share of 0.44 comes from the surrounding black. If you want them, I can add a sparks layer to the core.

Choices I made: I used `tempent` rather than `env_sprite`, because the description asks for 12 fps and `env_sprite` caps at 10. I set `loop` to false so the file holds exactly 11 frames, as the original does; the engine still cycles it.
