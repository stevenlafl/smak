The sprite builds OK: `work:sprites/xspark1.spr`, with a sheet and an animated preview beside it. I could not compare it with Half-Life's own `xspark1.spr`, because this server has no game folder (`game:` lookups fail with "the server's game folders are none"). The build's "1 of 1 in range" is against its class's glow measures, not the real xspark1, so the "at least as good" call has to come from the modder looking at it in the game.

**What it is:**
- Name `sprites/xspark1.spr`, type `parallel`, format `additive` (both kept as asked), `use: env_sprite`.
- 32×32 pixels, centred, 8 frames that loop (the build writes the first frame again at the end, so 9 frames in the file), 10 fps (the engine's cap for an `env_sprite`).
- Two layers:
  - A soft glow fading from black at the edge through blue to a white middle, radius 0.5.
  - Five small soft blobs placed fresh each frame round the centre. That is what makes it flicker in place rather than drift.
- Edges are faded (`finish.edge` 2). The background is black, which additive rendering shows as clear.

**Checks:** brightest at the centre, border 0 (no square edge showing), the loop wraps smoothly (wrap 0.96), and the flicker is visible across frames (jitter 1.98).

**How to rebuild:** the spec is `work:xspark1.json`. Change the colour stops in the two `ramp` lists, the `radius` on the glow, or `count` and `spread` on the blobs, then run `build` on it again.

If the modder finds it too big, too dim or too uniform, the first things to try are the glow `radius` and the blob `count`.
