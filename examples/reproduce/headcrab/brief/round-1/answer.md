The model built and the build says OK, but it is not yet good enough to put in the game in place of Half-Life's headcrab. It is a static pose with no animations, so the game would show it frozen.

**What I made:** `work:headcrab.mdl` (79 KB), with its spec beside it as `headcrab.spec.json` and a six-view picture `headcrab-sheet.png`. Nothing has been installed into the mod.

- **Size:** 25.5 long, 21.6 wide, 13 high, which matches the 26 by 13 you asked for.
- **Body:** a rounded tan dome, 16 by 13 by 9, with a leather-like finish.
- **Legs:** four tapered legs in two pairs. The front pair ends in pointed bone-coloured tips for the claws, and the back pair ends in points too.
- **Beak:** a pale bone-coloured horn under the front of the body, pointing forward and down.
- **Checks:** the build reports no errors. It warns that the model has 288 triangles, against a median of 62 for props of its size, which is a warning and not a fault.

**What is missing, and why it matters:** the build tool only writes a spec as a fixed shape. Animations, the walk and leap cycles, the bite, the death, and the hit boxes that the game's monster code needs all have to come from the kit's scripted route (`buildMdl`, with activities set). I cannot run scripts from this session, and the game's `headcrab.mdl` is not in the models folder I can read, so I cannot copy its animation list either. Without those, the game would play this as a single still pose, so it is not at least as good as the original yet.

**To finish it, I need one of these from you:**
1. Put Half-Life's `headcrab.mdl` in the models folder the kit reads. I would then use its skeleton and animations for the monster and only change the shape. It would be the better route, since the game's code already knows its animation numbers.
2. Or let me build it from scratch with the scripted route, which needs a way to run scripts. Tell me if you want that.

Either way, the mod's code must match whatever animation set the model ends up with, and the game's headcrab should be checked beside this one in the game, since I cannot run the game here.
