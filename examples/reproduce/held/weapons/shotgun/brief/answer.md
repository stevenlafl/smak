The shotgun model builds **OK**. The spec is named `shotgun.mdl` and the game's files are replaced in place.

**What I made**

- A pump shotgun, about 30.6 units long (you asked for about 30), 1.7 wide, 6.1 high, 224 triangles. Valve's own first-person guns run 276 to 363 triangles without hands, so it is in the same range.
- Black metal receiver, barrel, magazine tube, trigger and guard, with bright metal showing on the edges.
- Wood stock and a wood pump (forend) under the barrel.
- The gun is built by smak's firearm kit with the shotgun preset, then fitted into the game's own `v_shotgun.mdl`, `p_shotgun.mdl` and `w_shotgun.mdl`. The hands, bones, animations and events are Valve's.

**How I got there**

1. The first build was 41.6 long, which the check flagged as 39% over 30. I shortened the stock to 9, the barrel and magazine tube to 13, and the pump to 9.6 long.
2. The second build was OK, but the pump sat 0.3 units short of the receiver, so I moved it forward to overlap the receiver. The third build is the one that passed.
3. One note is left: the trigger sits 0.31 units from the trigger guard. It is inside the guard as a real trigger would be, and the build does not fault it, so I left it.

**Where the files are**

- The game-ready files are in `work:shotgun_weapon/`: `v_shotgun.mdl`, `p_shotgun.mdl`, `w_shotgun.mdl`. To try them, copy them into the mod's `models` folder, which replaces the game's copies there.
- The spec is `work:shotgun.spec.json`, and the contact sheet is `work:shotgun-sheet.png`.

**What I did not check**

- I have not run the game. The pictures from the build show the first-person, other-player and world views, and they look right, but the in-game judgement is theirs.
- The pump does not move on its own. The forend is part of the static gun, and I did not give it a bone to slide on. The game's own animations still drive the hands and the gun as a whole. If the modder wants the pump to slide back and forth between shots, that needs a `bone` on the forend and an animation for it, and I can add that next.
