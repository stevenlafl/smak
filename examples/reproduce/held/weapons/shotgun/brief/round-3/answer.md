The shotgun is built and the build says OK. The three game-named files are in `work:shotgun_weapon/`: `v_shotgun.mdl`, `p_shotgun.mdl` and `w_shotgun.mdl`. Copy them into the mod's `models/` folder and they replace Half-Life's own in the game.

**What I made**

A `held` model called `shotgun.mdl`, with `weapon: { like: "shotgun" }` and size `"own"` at 30 units long. The build fits it over the game's own shotgun in each of the three files, so Valve's hands, bones and animations are kept.

The parts, from the butt forward:

- **Stock and comb**: dark wood box, with a black butt pad.
- **Receiver**: black box, with a black pistol grip under it.
- **Barrel**: black tube, about 13 units long, with a small square front sight.
- **Magazine tube**: black tube under the barrel.
- **Pump**: wood forearm round the magazine tube. It is set to the game's `Bone01`, the bone the game's first-person file has near the forearm, so it moves with the game's pump animation. I rendered that animation; the whole gun moves with the hand, and the forearm moves with it.

The build has 224 triangles in the first-person file, against about 248 for Valve's first-person weapon. The gun's own pictures use one texture.

**Checks**

- Final build: OK, with no faults.
- One warning came up and was fixed: the front sight was over the triangle budget, so it is now a small box.
- The build did not show Valve's shotgun beside this one, so the side-by-side comparison is for the modder to make in the game.

**What is not changed**

- No new sounds. The game's shotgun sounds play with it.
- No chrome on the metal, and no new animations. The game's own reload, pump and draw are used.
- The spec is in `work:shotgun.json`, so the model can be rebuilt or changed later.
