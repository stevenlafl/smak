The shotgun model is built and the build says OK, with no warnings and no faults. It replaces the game's shotgun in all three of its files.

**What I made**

A pump-action combat shotgun: black steel receiver, barrel, magazine tube, pistol grip and front sight, with a darkwood stock and a darkwood pump (forend) under the barrel. It is 30 units long, the grip at the back and the muzzle at the front. It has 596 triangles, and the game's own first-person shotgun is about 600 as well, so it is in the same weight class.

**How I made it**

I wrote a spec and built it as a `held` model with `weapon: { like: "shotgun", size: "own", rig: "nearest" }`. The build fits the new weapon into the game's `v_shotgun.mdl`, `p_shotgun.mdl` and `w_shotgun.mdl`. Their hands, bones, animations and events stay as Valve made them. Only the weapon's meshes change.

- The pump is tied to the game's `Bone01`, which the first-person file uses. The game's own `pump` animation moves it, so the forend is meant to slide back and forth between shots.
- I changed the magazine tube to 6 sides and the pump's height so it meets the barrel. That cleared the build's only warning and note.

**Files** (in the work folder)

- `work:shotgun_weapon/v_shotgun.mdl`, `p_shotgun.mdl`, `w_shotgun.mdl`: the three files, under the game's own names.
- `work:shotgun.mdl`: the single model, for the viewer.
- `work:shotgun.spec.json`: the spec, so the build can be redone.
- `work:shotgun-sheet.png`: the picture sheet.

**To install:** copy the three `_shotgun_weapon` files into the mod's `models` folder under the same names as the game's. The game then loads them in place of its own. No code changes are needed.

**What I did not check**

- I could not compare it with the game's shotgun in the game engine, so "at least as good as the game's own" is for the modder to judge in game.
- I did not confirm that the forend slides separately from the rest of the gun. The pump strip shows the whole weapon moving, and at that size I cannot tell whether the forend moves on its own. This is the first thing to look at in game.
- The shotgun's sounds, including the pump click, are the game's own. The shell ejection is also the game's.
