The sprite is built and the build says OK: `work:sprites/steam1.spr`, with a contact sheet (`-sheet.png`) and an animated preview (`-animated.png`) beside it. I could not compare it against Half-Life's own `steam1.spr`, so the decision on whether it is at least as good is still open.

**What I made** (spec at `work:steam1.json`)
- **Name and placement:** `sprites/steam1.spr`, kept as `parallel oriented` with `index alpha`, as you asked. The build places it as an `env_sprite`, framerate 10.
- **Size and length:** 64×64 pixels, 16 frames, centred, one shot that starts small and ends fully dark (no loop).
- **Look:** a lumpy cloud (`billow`) that grows, rises, and breaks into wisps as it ages, under a thin `smoke` layer. Its colours run from dark grey at the rim through mid grey to near-white at the middle.
- **Motion:** it rises through the frames and thins out after about frame 10, with no jump at the start or end.
- **Measured by the build:** the colours and the way it starts and ends are in range for the built-in smoke puff class (5 of 5 checks). The brightest frame is around frame 3, a white flash in the middle of the cloud, which may read a little brighter than "grey" for a leak.

**What I could not check**
- **Half-Life's own sprite:** this kit has no game folder set up here, and the models folder is empty. So the build compared the sprite only against its built-in idea of a smoke puff, not against the file in the game. To compare it properly, give me a picture of the original's frames (a contact sheet) or point me at a game folder, and I'll add it as the reference and rebuild until the comparison is clean.
- **In the game:** I cannot run the game here. The modder has to look at it beside the original, and the render mode the build chose (Solid) is what the tool recommends for this sprite, not something I tested in the engine.
