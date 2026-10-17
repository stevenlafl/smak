I made `sprites/glow01.spr` with a spec and it builds OK. The build passed every check, but I could not put it beside Half-Life's own glow, so the final judgement is yours in game.

**What it is**
- A single frame, 64×64, white, with a smooth round falloff. The centre is full white and the light fades to nothing at the border (border brightness 0).
- Type `parallel` and format `additive`, as you asked, so black is clear and the light adds to what is behind it.
- The build places it as an `env_glow`, render mode 3 (Glow). The spec sets the `use` field to `env_glow`. If your lamps are `env_sprite` entities, the same file still works there, since it is the same picture.

**How it was made**
- Spec file: `work:glow01.json`. It has one sprite entry with one `glow` layer: radius 0.95, core 0.5, colour white, centred. The falloff is the default `smooth` one, which fades to nothing between 0.55 and 1 of the radius.
- Output: `work:sprites/glow01.spr`, with `glow01-sheet.png` and `glow01-animated.png` beside it.

**What the build reported**
- `OK: built, and every check passed`.
- 173 colours, quantising loss 0.0012, so no visible banding.
- Its one frame is within the range of Half-Life's own glow class (1 of 1 in range).

**What I could not do**
- The kit has no game folder set up here (`--wads none`), so I could not read Half-Life's `glow01.spr` and compare the two side by side. The "in range" check is against the kit's built-in figures for that class, not the real file.
- The sprite viewer returned an error on the 512 px render, so I looked at the sheet image instead. It shows a soft white disc with no hard edge.

To judge it, copy `sprites/glow01.spr` into the mod and put a lamp or light in a test map beside the original. Check how big the glow looks at your usual `scale`, and whether the centre is too hot.
