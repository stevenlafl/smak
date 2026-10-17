The flame is built and the build says OK. It is in the work folder as `sprites/fire.spr`, ready to drop in as the mod's `sprites/fire.spr`.

**What it is**
- A looping flame, 64 by 96 pixels, 16 frames plus the first frame again at the end so the loop wraps.
- Drawn as an additive sprite (black is see-through), placed as an `env_sprite` (the entity the game uses for world sprites) at 10 frames a second, the most the engine will change frames.
- Origin at the bottom, so it sits on its base like a fire on a barrel.

**How it was made** (spec at `work:sprites/fire.json`)
- Outer layer: a broad orange fire, tall and tongued, so it breaks into separate licks that rise and die.
- Inner layer: a narrower fire, offset slightly up, with a colour ramp from dark red through orange and yellow to a near-white hot tip. This gives the yellow core inside the orange tongues.
- Glow: a soft orange halo at the base, at a low gain, so the light spills onto the ground around it.

**What the build checked**
- OK, with no errors or warnings after the two fixes (colour values given as 0 to 1, and frame rate lowered from 12 to 10 for `env_sprite`).
- Against Half-Life's own fire loop class, five of five measures are in range (colour, dark share, border light, frame count, shape).
- Brightness peaks at about 0.88 of the top, and the loop wraps smoothly.

**What I did not check**
- The build has no copy of Half-Life's `fire.spr` to compare pixel by pixel, so "at least as good as the game's" rests on the class measures, not a side-by-side. The in-game look is the real test. If it reads too small or too dim beside the original, the size and gains in the spec are the knobs to turn.

**Files in the work folder**
- `sprites/fire.spr`: the sprite.
- `sprites/fire-sheet.png`: all frames.
- `sprites/fire-animated.png`: the animation.
- `sprites/fire.json`: the spec to rebuild it.
- `sprites_fire.spec.json`: a file the build wrote that I did not create. I left it alone.
