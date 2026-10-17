The shotgun is built and the build says **OK**. It is a `held` spec named `shotgun.mdl` with `weapon: { like: "shotgun", size: "own", views: ["v","p","w"] }`, so it replaces the game's `v_shotgun.mdl`, `p_shotgun.mdl` and `w_shotgun.mdl`.

**What it is**

| Part | Look | Material |
| --- | --- | --- |
| Receiver, barrel, magazine, trigger guard, pistol grip, front sight | Dark steel, with the guard a four-sided loop | Black metal |
| Pump (forend) | A wooden cylinder under the barrel | Wood |
| Stock | A wooden block at the back, with a hinge block where it meets the receiver | Wood, black hinge |
| Hook | A curled tube at the stock's end that rises and turns forward over the top | Black metal |

It is 31 units long, 4.4 high, and has 268 triangles. Valve's first-person shotgun has 276 to 363 without hands, so the count is in range.

**How it is fitted**

- The stock, hinge and hook are only in the other-player and world files, as Valve's first-person stock is out of view.
- The game's own animations, hands and events are kept. The pump animation moves the whole gun with the hand, as the game's does.
- Files written: `work:shotgun.mdl`, and `work:shotgun_weapon/v_shotgun.mdl`, `p_shotgun.mdl`, `w_shotgun.mdl`. To test in the game, copy the three weapon files into the mod's `models` folder. They keep the game's names, so they replace its own with no code.

**Choices you may want to change**

- I built the gun from primitive parts instead of the kit's shotgun preset. The preset has its own picture, and the build refuses a weapon with two pictures, so the hook could not be added to it. The preset looks more like Valve's gun, but has no hook.
- The folding stock is a hinge block, not a working fold. A model cannot fold.
- The pump is a plain wooden cylinder, not a sliding forend.

**Known gaps, found while building**

- The preset's stock and forend options (for example `stock: { folding: true }`) are accepted without error and change nothing. I could not find a setting that gives a hooked or folding stock, so I did not use the preset.
- The build still has two notes: the hinge and front sight are thin boxes that could be painted instead, and the guard sits 0.3 units from the stock. Neither is a fault.

I could not judge whether it is "at least as good" as Half-Life's own. I have not seen it in the game. The first-person detail is likely coarser than Valve's, so the modder should compare it in the game beside the original.
