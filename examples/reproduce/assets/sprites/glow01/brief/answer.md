OK, built and every check passed. The sprite is `work:sprites/glow01.spr`.

**What I made:** a single-frame, 64 x 64 white glow. It is brightest at the centre and falls off smoothly to nothing at the edge of the frame, so there is no visible ring. It is parallel (faces the camera) and additive (black is clear), the same type and format as the game's `glow01.spr`. The build placed it as an `env_glow` with render mode 3 (Glow), so it draws the way the game's glow does.

**How:** I wrote a `smak.sprite/1` spec with one `glow` layer: radius 1 (the frame's edge), colour white `[1, 1, 1]`, smooth falloff, gain 1, centred origin. The build's report says it is 91 colours after quantising, with its border at 0 light, and it is in range against Half-Life's own glow on the one measure it compares.

**What I did not check:** I could not put it beside the game's own `glow01.spr` in the game. The tools here only see the work folder and the models folder, and the build's comparison is a set of numeric measures, not a side-by-side look. So the "at least as good" call is for your modder to make in game. The likely differences are size and how far the glow reaches; if it reads too small or too tight, the `radius` and `falloff` values in the spec are where to change it.

The spec is saved as `work:sprites_glow01.spec.json`, and the preview pictures are `work:sprites/glow01-sheet.png` and `work:sprites/glow01-animated.png`. To use it, the modder copies `sprites/glow01.spr` into their mod's `sprites/` folder, which replaces the game's file of that name.
