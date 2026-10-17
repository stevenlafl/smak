The crowbar is built and the build says **OK**. It is a `held` spec named `crowbar.mdl`, with `weapon: { like: "crowbar" }` and a length of 32.

**What it is**
- One continuous round steel bar, about 31.4 long (the build's measure of the 32 you asked for), 1.1 across. It runs from the grip end along the length, then bends up into a hook at the far end.
- Painted deep red over the whole bar.
- Worn to bare metal at both ends: the grip end and the hook tip are painted steel, which the paint and wear pass lighten, so they read as bare metal.

**How it was made**
- Spec: `work:crowbar.spec.json`. Built with the kit's `held` kind and `weapon: { like: "crowbar" }`, so the build fits it into the game's own files.
- Output: `work:crowbar_weapon/v_crowbar.mdl`, `p_crowbar.mdl` and `w_crowbar.mdl`. They keep the game's names, so to test in the game, copy them into the mod's `models` folder and they replace Half-Life's.
- The first versions faulted. Joining separate closed pieces end to end gave faces counted twice, so I made the bar one continuous tube and painted the steel ends on instead of building them as separate parts.

**What to check in the game**
- The hook is round and thin. Half-Life's own crowbar head is flatter and wider, so it may look weaker in the hand. This is the first thing to compare.
- The first-person picture looks right in the attack frames, but I have not run it in the game.
- Triangle count is 96 in the first-person file. The game's own is about 600 at the high end, so this is light.
