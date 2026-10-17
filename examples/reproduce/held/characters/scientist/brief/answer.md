The model builds OK, with one warning that the guide says to leave alone. The output is `scientist.mdl` in the work folder (about 908 KB), with its spec beside it at `scientist.spec.json` and a six-view sheet at `scientist-sheet.png`.

**What it is**

- **Skeleton:** `player/gordon/gordon.mdl`. Its 42 bones and all 77 animations are kept, including walk (13), run (12) and run2 (3). The spec sets `floor: 0`, so the feet stand on the origin.
- **Height:** 68.2 units, against the 68 asked for.
- **Triangles:** 432, against the 362 of Gordon's body. Half-Life's own scientist is about 750 by the kit's count, so this is lighter.
- **Look:**
  - White lab coat with one chest pocket, falling to the thighs with coat tails.
  - Pale blue collar and a dark red tie.
  - Dark grey trousers and dark brown shoes.
  - Skin head with grey hair at the sides and back, bald on top.
  - Dark frame glasses.
  - Arms hang at the sides.
- **How:** I wrote the spec as a set of parts, each hung on a bone of Gordon's skeleton, with the arms and legs posed to stand relaxed. The spec is the file to edit.

**Checks**

- The build says OK, and every part is attached (none floats).
- The only warning is that the white coat is brighter than most of Half-Life's textures (33% near-white against the 23% limit). The guide says a lab coat is white by what it is, so I left it.
- The lowest point is at 0.04 units, so the feet sit on the floor.

**Where it falls short**

- I could not compare it with the game's own scientist, because that file is not on this machine. Whether it is at least as good is for the modder to judge in game. The kit can't judge likeness.
- By eye, the head, hair and glasses are blocky, and the glasses read as dark bars. The arms and legs are simple tubes.

**To check in the mod**

- Install it as `models/scientist.mdl`, replacing the game's file. Replacing a model the game already loads needs no change to the mod's code. Put it in the mod's own folder, not over the original game files.
- The file keeps Gordon's internal name in its header. The game uses the file path, so this should not matter.
- The scientist's AI may play animations by activity (idle, walk, run, flee). Gordon's animations are player animations, and I did not confirm that their activity numbers match what the scientist code expects. If the scientist stands still or does the wrong animation, that is the first place to look.
