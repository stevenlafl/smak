The model is built and the build says **OK**. I couldn't compare it with Half-Life's own zombie, because that file isn't in the models folder I can read. So I can't say whether it is at least as good. That needs a look in the game.

**What I made**

- **File:** `zombie.mdl` in the work folder (about 940 KB, 664 triangles, 69 units tall). The spec is `zombie.spec.json` beside it, and `zombie-sheet.png` shows six views.
- **Skeleton:** `player/gordon/gordon.mdl`, with `floor: 0` so it stands on its feet at its origin. I chose Gordon over the scientist (`scientist.mdl`). The scientist's animations are mostly kept in other files, and the hunched pose needs to rewrite the walk, which the tool refuses to do there.
- **Body:**
  - A white lab coat, with two torn tails at the hem and a blood smear on the chest.
  - Trousers, grey-green skin, and a brown parasite cap over the head, with two short side lumps and a stalk down the neck.
  - Four bone-coloured claws on each hand.
- **Pose:** the spine and neck lean forward, so it stands hunched. Gordon's walk, run and die animations are kept, so the walk cycle is his walk.
- **Slash:** Gordon has no melee animation. The nearest is `ref_shoot_crowbar` (animation 26), a crowbar swing. I did not add a new slash.

**Things the modder should know before judging it**

- **It's a rough stand-in.** The coat reads as a white blob. The parasite reads more as a brown hood than a crab-like body. The face barely shows.
- **Animation activities are not set.** The walk and slash are found by number, not by the activity a monster's code asks for. If their zombie code asks for "walk" or "melee attack" by activity, those will not be found. I could not set activities through this spec, and I did not check whether the game's zombie code does this.
- **Walk speed is Gordon's.** The walk moves at Gordon's own speed, which may not match the zombie's. Feet can slide if the code moves it at a different speed.
- **Hit boxes are Gordon's.** They are not tuned to a 68-unit monster.

If the parasite and face need to read better, the next step is more triangles on the head, which the budget allows a little of.
