**Blocked: I can't build this yet, because the game's skeleton isn't in this session.** The SMAK server's models folder is empty. `models` lists only the work folder (`pictures/`), and `player/gordon/gordon.mdl` isn't found. I checked whether the kit can build without a base, and it can't: a character is a body put on a game model's bones and animations, so there's nothing to build on. I haven't written or built a spec.

What I did confirm:
- All the reference pictures are in the work folder under `pictures/` (`sides.png`, `motion.png`, `front-left.png`, `front-right.png`, `back-left.png`, `back-right.png`, `facts.txt`). I looked at the sides, the run strip and three of the angles.
- The creature is a low, wide oval body with a round, dark, bumpy maw on the front. It has five or six ridged fins across the back, olive-yellow skin with teal and brown stripes, and four thin legs with pale feet. The run strip shows the legs reaching forward and back.

Before we pick a base, one thing to consider: Gordon is a two-legged player skeleton. The Houndeye walks on four legs, so Gordon's bones would not match its stance, and its run would be a biped run. A four-legged monster's own skeleton from the game would suit it better. I'd rank the options like this:

1. **A four-legged monster skeleton from the game** (the best fit for its run). Tell me the folder, and I'll check which one fits.
2. **Gordon's skeleton with bones added for the legs.** This works, but the run would be a poor match.

To go on, I need one thing from you: the path to the game's `models` folder (for example `…/Half-Life/valve/models/` or `…/Half-Life/ts/models/`). The SMAK server has to be started with `--models` pointing at it. Once it's there, I'll pick the base, write the spec with `"floor": 0`, build it, and check it against the pictures until it says OK.
