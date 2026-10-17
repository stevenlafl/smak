The model is built and the build says OK: `work:houndeye.mdl` (516 KB, with a spec file beside it, `houndeye.spec.json`). Put it in the mod's `models/` folder under the name `houndeye.mdl`. Because it replaces the game's file of that name, the mod's code needs no change to load it.

**What I made**

- **Skeleton:** the game's `bullsquid.mdl`, kept as a character on its skeleton with `floor: 0`, so the feet stand at the origin. I chose it over Gordon's because the bullsquid's leg joints are about the right height for a squat 45-unit creature. Gordon is a biped and would not read as a monster of this shape. The headcrab's skeleton was about half the scale. Every one of the bullsquid's animations is kept with its number and length. Six of them live in separate files, which the kit cannot edit, and they are kept as they are.
- **Body:** a yellowish hide (a leather material tinted pale yellow) on a rigid, rounded body that hangs on the spine. Dark stripes run along the back and sides, with a few dapples. These are painted marks, not geometry.
- **Head and eye:** a blob head on the neck, with one large dark red eye on the front, built as a sphere.
- **Legs:** three thin legs. Two are at the rear, one on each side, and one is at the front on the left.
- **Size:** 53 long, 45 wide, 46.5 tall. The brief asked for 49 long and 45 tall.

**What the check said**

- Length is 53.1 against the 49 asked for, which is 8% over. That is within the 10% the kit allows without a warning. I could not get it closer. The bullsquid's rear feet sit far back, at 26 units behind the origin, so the body could not come forward without the legs floating.
- Height is 46.5 against 45, also inside the tolerance.
- No faults, no open edges, and no floating parts across the run and walk frames.

**Where it will differ from the game**

- **The third leg is a stilt.** The bullsquid's rear feet are joints that are far apart, so each rear leg is a span from the hip to the knee, with a straight post from the knee down to the floor. The front leg uses the same arrangement, from a limb joint down. The posts do not bend, so in motion the feet will look like they slide. The post is attached to the knee and moves with it.
- **No sonic blast.** The model has no blast animation of its own. Its attack has to come from the mod's code, using an animation the bullsquid already has, or a new one.
- **Pictures are plain stand-ins.** The kit draws the model with a flat lighting picture. I could not run the game, so how it looks beside Half-Life's own, and whether it moves convincingly, has to be judged in the game.

**Things you may want to check**

- The file `work:probe_bullsquid.mdl` is a scratch build from my first test. Ignore it or delete it.
- If the mod's hull or speed is tied to the game's houndeye, those values belong to the mod's code and are not set by this file.
