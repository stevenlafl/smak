The crowbar builds OK at 32 units long, and I checked it against Half-Life's own crowbar in renders. I haven't seen it running in the game, so the modder's in-game look is the real test.

**What I made**

- A spec named `crowbar.mdl`, kind `held`, with `weapon: { like: "crowbar" }`, saved as `work:crowbar.json`.
- The shaft is red paint with edge wear. The grip end is bare steel, flared a little like Half-Life's, and the far end has a flat steel claw, so the tips show bare metal.
- Three parts: the shaft, the grip, and the claw. The build reports 96 triangles, which is well under the game's own weapon budget.

**Files the modder installs**

```
work:crowbar_weapon/v_crowbar.mdl   first person, with the game's hands and animations
work:crowbar_weapon/p_crowbar.mdl   in another player's hands
work:crowbar_weapon/w_crowbar.mdl   lying in the world
work:crowbar.mdl                    the standalone model, not used by the game
```

Copy the three weapon files into `<mod>/models/`. Their names match the game's, so the game loads them in place of its own with no code changes.

**How it compares**

- The first-person render has the same layout as Half-Life's: long shaft, grip at the bottom, claw at the top.
- Half-Life's claw is dark and slightly wider. Ours is bright steel, as the brief asked.
- The claw is a flat sheet, so from some angles it looks thinner than the game's.
- The game's crowbar is about 24 units long according to the guide. Ours is 32, as asked, so it will look longer than Valve's in the game.

**Choices I made**

- I kept the weapon size at `"own"`, which lays the model at the game's own scale for a weapon.
- The first build had a neck part the build flagged as too fine for its picture. I removed it.
- The first claw was short, so I moved it to the far end to reach 32.
