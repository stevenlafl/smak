The model builds **OK** as `scientist.mdl`, but it is **not at least as good as Half-Life's own scientist**. It is blockier, wider in the hips and back, and has a cruder head. Your modder should look at it beside the game's before deciding.

**What I made**

- **Spec:** `work:scientist.spec.json`, a `character` on `barney.mdl`'s skeleton, with `floor: 0` and a height of 68.
- **Model:** `work:scientist.mdl`, 960 triangles, 68.4 units tall, feet at 0. It keeps Barney's 71 animations, including walk and run. The build's check reports "fit for GoldSrc" with one warning: some textures are not a power of two (they are unused Barney textures left in the file).
- **Body:** soft blob pieces on the skeleton for the coat torso, arms and legs. Boxy superquadric shoes and a head. The coat, shirt, tie, glasses and face come from a front picture projected onto the body.
- **Why Barney's skeleton:** Gordon's first frame is a stride with the legs apart. Barney is a monster with its origin at its feet, so it suited better. The user said "or another that suits it", so this is within the brief.
- **Pictures:** `work:gen/scientist_pic_s2.png`, drawn by the local zimage-turbo model (Apache-2.0). Its cut-out is `work:gen/scientist_shape_s0_cut.png`, made by a run of the hunyuan3d-mini shape generator (Tencent licence, non-commercial, accepted for this test). That run's mesh is not in the model; only its cut-out is used.

**How it compares**

| Check | Result |
| --- | --- |
| Build | OK, with warnings |
| Front outline against the picture | 0.70 (warned under 0.8) |
| Animation contract against the game's scientist | Faults: 112 of 128 animations missing, 15 at other numbers, the needle body missing |
| Run strip | Plausible, no visible tearing at this size |

The game's scientist is slimmer, with proper proportions, a face and a belt. Ours has these problems:

- **Torso and back:** the hips and back read as a bulky sack.
- **Head:** a box-like shape. The face is readable from the front and close-up, but the hair is a grey block.
- **Shoulders:** skin-coloured patches from the single front projection appear in every view.
- **Stance:** Barney's standing idle has one foot forward, so the feet are not together.
- **Mesh tears:** 8 triangles join the arms to the trunk. This is a minor tear risk in motion.
- **Animations:** the scientist's own animations are not in this model. Walk and run are Barney's. Code that plays scientist animations by number (the needle, sit and so on) may break in game.
- **Animation files:** 43 animations are read from the game's external `barney01.mdl` group file, so the mod depends on it being present. The file exists in the game folder.
- **Internal name:** the header still says `valve/models/barney.mdl`, inherited from the base. The file name is `scientist.mdl`.

**What I tried and dropped**

- **A generated mesh of the whole figure:** the outline came out at 0.45 and the body tore badly in the run.
- **A narrower torso:** it dropped the outline to 0.69, which is a fault, so I reverted to the broader version.
- **A carved body from front and side views:** the side-view prompt returned front-facing figures every time, so I could not build it.

**Next steps, if you want a better one**

- Draw a true side view, or use hand-tuned proportions, and carve the body from front and side silhouettes.
- Restrict the front projection so the shoulders stop picking up skin.
- Check the in-game behaviour of walk and run, and any scientist-specific behaviour that plays animations by number.
