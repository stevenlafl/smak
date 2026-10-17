The crowbar now builds OK, but I made it about 20 units long, not 32. That was the only way I found to match the in-hand size and placement the modder flagged. The build says "OK: built, and every check passed", with no warnings.

**What was wrong**

The first-person file is laid at 1.24 times the built geometry, and `weapon.size` ("own" or "old") made no difference to the file. At 32 long, the shaft was about 34 units in the first-person file, against about 24 for Valve's. That pushed the hook out of frame and made the weapon look larger, as the modder saw.

**What I changed in `work:crowbar.json`**

- **Length:** the shaft, grip, wrap band and claw are scaled along x to about 20 units (`size.length` 20). The radii are unchanged.
- **Kept as before:** the red shaft with its edge wear, the steel grip flare, the steel claw and tip, the dark wrap band near the grip, the weapon sizing, and the 168 triangles in the standalone model.

**How it compares now**

I rendered the first-person view for both, at the same size. The hook sits at the top right in both, the shaft has the same slope, and it runs out at the bottom right. Ours sits about 25 pixels lower at 640 by 480, so it is close, not exact. The modder should judge it in the game.

**Files for the modder** (the same paths as before, copy into `<mod>/models/`)

```
work:crowbar_weapon/v_crowbar.mdl   first person, with the game's hands and animations
work:crowbar_weapon/p_crowbar.mdl   in another player's hands (98 triangles)
work:crowbar_weapon/w_crowbar.mdl   lying in the world (98 triangles)
work:crowbar.mdl                    the standalone model, 20.2 long, not used by the game
```

**Decision for you or the modder**

The brief said about 32 long. Going back to 32 gives a first-person weapon about 40 units long in hand, which is what the modder rejected. If they want 32 kept, they will need to accept that it sits larger than Valve's. The build can't keep both a 32-long brief and the game's in-hand size.

**Not done**

I did not test the files in the game itself. The attack frames still show the weapon leaving the top of the picture on some swings, as the game's do. I left them as they were.

I wrote a short note of this finding to `work:notes-crowbar-fit.txt` in the work folder. It is not part of the mod.
