The build says OK: `sprites/fire.spr` is written to the work folder as `work:sprites/fire.spr`, with a contact sheet and an animated preview beside it.

**What I made**

It's a 64×128 looping flame, 16 frames plus the first frame again at the end (17 in the file), 10 frames a second. It is a `parallel oriented` sprite in `additive` format, placed as an `env_sprite` with render mode 5 (Additive). The spec is `work:fire.sprite.json`.

Two layers:
- **Fire:** the orange-to-yellow fire colour ramp, with tongues cut up the height (`tongues: 1.0`), a slight taper to the top, and the flame rising from its base (`origin: bottom`).
- **Glow:** a soft orange halo at the base of the flame, so it lights the area around it.

**How it checks out**

- The build's report says the sprite is in range against Half-Life's own fire loop on all 5 measures.
- The loop wraps smoothly (wrap score 0.9).
- The border is dark, so it won't show a box in the game.

**Things the modder should look at in game**

- Frames 5 and 6 dim a lot (the flame almost goes out for a moment), which may read as a pulse or flicker. If it looks too weak there, that is the first thing to change.
- I did not compare it against the game's own `fire.spr` pixel by pixel: the work folder holds no copy of the game's sprite, so the comparison is only against the report's built-in figures for Half-Life's fire loops.
- The render check (`render` kind `strip`) failed on this sprite, so I judged it from the contact sheet and the build report.

To use it, copy `work:sprites/fire.spr` over the game's `sprites/fire.spr` in their mod folder (keeping a backup of the original).
