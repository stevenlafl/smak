The forklift is built and the build says **OK**. It is in the work folder as `forklift.mdl`, with its spec at `forklift.spec.json` and a six-view sheet at `forklift-sheet.png`.

**What's in it**

- **Size:** 187 long, 60 wide, 113 high, as asked, standing on z 0.
- **Body:** yellow painted chassis and hood, a rear counterweight in yellow and black hazard stripes, and an overhead guard on four posts with a roof.
- **Mast and forks:** two steel uprights up to the full 113, three crossbars, and a carriage with two forks. The carriage sits at about 36 units, so the forks are raised a little off the floor.
- **Wheels:** two larger drive wheels at the front and two small steer wheels at the back.
- **Driver:** a seated figure built from simple shapes (blue torso and trousers, a head, arms on a steering wheel, a steering column). The seat and backrest are cloth blue.
- **Triangles:** 516 in all, under the 576 point where the kit starts warning and near Half-Life's own median of 288 for props this size.

**How I built it**

I wrote a plain JSON spec (`smak.model/1`, kind `prop`) with one box, cylinder, sphere or tube per part, placed by its position. The first build failed on one fault: the mast crossbars' ends sat exactly on the uprights' outer faces, which the kit reads as shared edges. I shortened the bars and cut the wheel and arm sides to bring the count down. The second build passed every check, and `check` for GoldSrc says "fit for goldsrc".

**What to check before you swap it in**

- **Replacing the game's file:** the file replaces `models/forklift.mdl`, so the game loads it without any new precache. Back up the original first.
- **Animations:** this model has one pose and no animations, and the mast is fixed in its raised position. If the game's code plays animations on the original forklift by number, the swap will break those. I could not check the original, because it isn't in this kit. Tell me if the code plays any, and I can add them.
- **Colour:** the kit warns that the yellow is more saturated than Valve's textures (38% strongly coloured against under 30% for Valve's). I kept the yellow because you asked for it, but it is the most likely place it reads differently from the game's own.
- **The driver:** it is blocky primitives, not a detailed figure. It reads as a seated person from the side, but it won't match a Half-Life character.
- **Not tested in the game:** the kit's pictures are not the game's engine, so I can't say whether it is as good as Half-Life's forklift. Your in-game comparison is the real test.
