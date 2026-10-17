The muzzle flash builds **OK**: `work:sprites/muzzleflash1.spr`, with a sheet and an animated preview beside it.

**What I made**
- A 64×64 parallel, additive sprite, placed as a temporary entity (`tempent`), render mode 5 (additive), 16 frames per second.
- Frame 1 is a white-hot centre with a peach glow and eight streaks: four long ones on the axes and four shorter ones on the diagonals. That gives the star shape.
- Frame 2 is fully dark. The build requires a one-shot sprite to end dark, so the flash shows for one frame and then goes out. Frame 2 is not a visible second step.
- The colour ramp is the `muzzle` preset (white, peach, tan), taken from Half-Life's own muzzle flash.

**How**
- The spec is `work:muzzleflash.json`, `smak.sprite/1`, with one entry for `sprites/muzzleflash1.spr`. Rebuild it with `build` on that file.

**What the build says**
- OK, with every check passed. It reports 116 colours, no quantising loss, and an envelope that peaks at the first frame and ends at zero.
- Against Half-Life's flare class it is in range (1 of 1).

**What I could not check**
- The game's own `sprites/muzzleflash1.spr` is not in this environment, so there is no reference sheet. I could not measure it side by side, and I cannot say it is at least as good as the original. The comparison is only against the class norm.
- Drop it into the mod beside the original and look at it in game. The modder should judge it there.

**One choice to confirm**
- If they want the second frame to show as a fainter, smaller star rather than going dark, the one-shot rule has to be relaxed. I would need their say-so before changing that.
- There is a scratch file `work:muzzleflash-try.json` left in the work folder. It is an unused copy of the spec and can be deleted.
