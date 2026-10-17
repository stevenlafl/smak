The flame sprite builds OK: `sprites/fire.spr` is in the work folder, with a contact sheet (`fire-sheet.png`) and an animated preview (`fire-animated.png`) beside it.

**What it is**
- A 64 by 128 looping flame of 16 frames, plus the first frame again at the end for the wrap, at 10 frames a second.
- Type parallel oriented and format additive, as the game's own. Black is clear, so it shows as light on dark backgrounds.
- Placed as an `env_sprite`, render mode 5 (additive).
- Its base is at the bottom of the frame, so it stands on the barrel or wreck it is placed on.
- The fire layer uses the game's fire colour ramp, which runs from a yellow-white core to orange and dark red at the tips. The tongues are cut so the flame breaks into licks that climb, with dark between them.
- A faint orange glow sits low in the frame to warm the base.

**How I made it**
- I wrote the spec at `work:fire-sprite.json`. The first build failed on two things: a colour given as 0 to 255 instead of 0 to 1, and a frame rate above the 10 an `env_sprite` can change at. I fixed both.
- The first version read as one narrow cone. I widened it, raised the tongue setting to its maximum, and lowered the taper, so the licks show in the middle frames. The second build passed every check.

**What I could not do**
- I could not put it beside Half-Life's own `fire.spr`. This server has no game folder configured, so I could not read the original. The report only compares the flame against Half-Life's fire-loop class in general (five of five measures in range), not against that file. The modder needs to make the side-by-side comparison in the game.
- Some frames (around 6 and 13) dim noticeably, which is the flicker the report measures. It loops cleanly (wrap score 0.91).

To try it, the modder copies `sprites/fire.spr` into their mod's `sprites` folder, which replaces the game's file when the mod loads.
