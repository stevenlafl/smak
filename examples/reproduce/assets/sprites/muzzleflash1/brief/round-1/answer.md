The muzzle flash is built and the build says OK: `work:sprites/muzzleflash1.spr`, with a spec at `work:muzzleflash.json` and preview pictures beside the sprite (`-sheet.png`, `-animated.png`).

**What it is**
- A four-frame, one-shot star: a warm white-yellow core with four thin streaks (horizontal, vertical, and two diagonals at a shorter length).
- 64 by 64 pixels, drawn as a `tempent` (a temporary entity, the way the game uses muzzle flashes), so the engine places it as an additive sprite: black is clear and the light adds to what is behind it.
- Played at 25 frames a second, so the flash lasts about 0.16 seconds. It peaks in the second frame and is fully dark by the last one, so it does not pop or leave a leftover frame.

**How I made it**
- A `smak.sprite/1` spec with two layers, summed: a `glow` in the game's own muzzle colours (`ramp: "muzzle"`) for the hot centre, and a `flare` layer for the streaks.
- The first build failed on a colour written as 0 to 255. I rewrote it as 0 to 1 and rebuilt.
- The first passing build left frame 0 dark, so the flash would have started one frame late. I raised the starting level of both layers (`start: 0.6`) and rebuilt. Frame 0 now sits at 0.84 of the peak.

**What I could not check**
- There is no game folder on this server, so I could not put Half-Life's own `muzzleflash1.spr` beside it. The build's comparison is against the game's flare class only, and it is in range. It is not a side-by-side with the original.
- Size, brightness and streak length are my judgment from the kit's pictures. Whether it is at least as good as the game's should be settled in the game. If it looks too faint or too small against the original, the spec's `gain` and `size` are the knobs to change.
- How it sits in a first-person view while the gun moves only shows in the game.

To try it, copy `sprites/muzzleflash1.spr` into the mod's `sprites` folder so it replaces the game's file of the same name.
