The glow is built and the check says OK: `work:sprites/glow01.spr`, made from the spec in `work:glow01.json`.

**What it is**
- A single 64×64 frame, additive, drawn as an `env_glow` (render mode 3, Glow), so black is clear and only the light adds to what is behind it.
- One soft glow layer with its radius at the edge of the frame and a smooth falloff, so the light reaches nothing at the border.
- The colour follows brightness: a near-white hot core, warm amber in the halo, and black at the rim. The falloff is the default smooth cut-off, so no hard ring shows.

**What went wrong on the way and how it was fixed**
- The first build failed the border check: the rim had a brown tint, and additive blending turned that into a visible square around the glow. Fix: the rim colour is now black, so the outer edge contributes nothing.
- The ramp colours had to be written as 0 to 1 values, not 0 to 255. The spec wants them that way.

**What I could not check**
- I could not compare it with Half-Life's own `glow01.spr`. This machine has no game folder loaded, so the report only measured against its class norms: 1 of 1 in range, border light 0, colours and falloff within the expected range.
- The decision the modder needs (is it at least as good as the game's?) has to be made in the game. Put it beside the original in a `env_glow` on the same light and compare the core size, the warmth and how far the halo reaches. If it is too tight or too faint, I can change the `radius`, `core` or the ramp in `work:glow01.json` and rebuild.

Files, all in the work folder: `sprites/glow01.spr`, with `sprites/glow01-sheet.png` and `sprites/glow01-animated.png` beside it, and the spec `glow01.json`.
