The model is built and the build says **OK**: every check passed, and the GoldSrc check says "fit for goldsrc".

**Files (in the work folder)**
- `scientist.mdl`: the model, 950 KB. Its texture is embedded, so no separate texture file is needed.
- `scientist.spec.json`: the spec it was built from. Rebuilding from it reproduces the model.
- `scientist-sheet.png` and `scientist-quarter.png`: pictures of it.

**How it was made**
- It is a character on the skeleton of `player/gordon/gordon.mdl`, with `floor: 0` so the feet stand at the origin. All 77 of Gordon's animations are kept, including walk, run, crouch, jump and death, so it walks, runs and follows the way Gordon's body does.
- The arms are set to hang at the sides; Gordon's own first frame holds a gun forward.
- The body is 708 triangles. Half-Life's scientist is about 750 by the kit's count, so the polygon budget is similar.
- It is 69.7 units tall against the 68 asked for (about 2.5% over), because Gordon's head sits that high on his skeleton.

**What it looks like**
- Older man with a white lab coat over a blue shirt and a red tie, painted on the coat's front, plus a pocket with a blue pen.
- Light tan trousers and dark brown leather shoes.
- Glasses: two lenses, a bridge and two temple arms.
- Grey hair round the back and sides, with the crown bald.

**Where it may fall short of Half-Life's own**
- The face is plain pale skin. It has no painted eyes, nose or mouth, where Half-Life's has a textured face.
- The coat is a single white shape with no lapels or open front, so it reads more like a white jacket than a lab coat.
- The shape and proportions read as an older man at the distance a player sees him. I can't render the game here, so whether it is at least as good is your call in the game beside the original.

**Things to check in the game**
- The model carries Gordon's animation list. If the mod's scientist code asks for an activity Gordon's list lacks, that animation won't play.
- It has one head variant. If the code picks a head by body number, it gets this one.

To try it, back up the mod's `models/scientist.mdl`, then copy the new file over it.
