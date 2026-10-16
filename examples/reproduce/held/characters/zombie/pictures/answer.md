The zombie builds with **OK** (`zombie.mdl`, written to the work folder with its spec as `zombie.spec.json`). It stands on Gordon's skeleton with `floor: 0`, and keeps all 77 of that skeleton's animations.

**What it is**
- **Body:** carved from the six-sided sheet plus the four angle pictures, so the outline follows the original's lean, hunch, coat, head and arms. Its colours and wounds are projected from the same pictures.
- **Claws:** eight tubes, four per hand, hung on the hand bones. The carve drops the thin claws, so these stand in for them.
- **Size:** 38.9 long, 52.9 wide, 68.3 high, against the original's 38.5, 53.8 and 68.4.
- **Triangles:** 628, under the 724 ceiling for a character (twice the base's 362).
- **Pose:** the first frame of its first animation (`look_idle`), which is the stance the carve was fitted to.

**Choices I made**
- I read "standing" as the first frame of the first animation. I did not fit the walk in `motion.png`, since you asked for the standing pose.
- The left-hand claws are shorter than the original's. Longer ones pushed the outline check for the back-left and front-right views under 0.7 (a FAULT), so I shortened them. They are the most likely place a side-by-side judge will see a difference.
- The base's pose fit found no change and failed to build, so I used the carve's own outline for the stance instead.

**What the report still says**
- A WARN that the carve lost 52 thin pieces, mostly claw tips and fragments. The tubes cover most of them, not all.
- A WARN that the front-left outline is 0.80, just above the 0.8 line.

I checked the renders from front-left and back-right against the originals. The silhouettes and colours match closely. I did not check the model in the game.
