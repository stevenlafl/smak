The sprite builds OK: `work:sprites/xspark1.spr`, with a contact sheet and an animated preview written beside it.

**What it is:** a 32x32 additive, parallel, env_sprite glow, drawn as a white-cyan core with a cloverleaf halo of soft blobs and a dim teal rim fading to black. Frame rate is 10 a second, the most the engine allows for an env_sprite.

**Build choices:**
- **Frames:** the file holds 11 frames: 10 distinct frames that loop, with the first repeated at the end, as the engine wraps. That matches your 11.
- **Class:** `glow`, not `sparks`. The `sparks` class is a one-shot that must end dark, which would fail a looping flicker.
- **Core:** a glow about 10 px across with a white middle.
- **Halo:** six blobs, re-placed randomly each frame. The outline reaches about 26 to 28 px and jitters frame to frame, with the core steady.
- **Colours:** rim (0.05, 0.3, 0.45) at low brightness, aqua (0.2, 0.85, 1.0) in the middle, near-white (0.92, 1.0, 1.0) at the core. Black sits at the bottom of the ramp so the border reads as clear.
- **Edges:** soft, with no hard lines or rays.

**The build's measures:** border light 0, dark share 0.67, loop wrap 1.06 and jitter 1.92, with no faults. The report puts the glow class's measures in range.

**What I could not do:**
- No reference sheet of the original was supplied, so the report did not compare against it side by side. The numbers above are against Half-Life's own glow class, not against xspark1.
- The original's dithered speckle is not in this build. The spec's layers have no dither option, so the edges are soft but smooth.
- I did not run the sprite in the game.
