The model is built and the build says **OK**, with two warnings left. It is `work:scientist.mdl`, with its spec at `work:scientist.json`. I have not put it into the game folder or run it in the game. To use it, copy `scientist.mdl` over the game's `models/scientist.mdl` (keep the game's copy as a backup).

**What it is**
- **Look:** an older bald man with grey hair at the sides, round glasses, a white lab coat open over a blue shirt, a red tie, light trousers and dark shoes. It is about 68 units tall, standing with its feet at the origin (`floor: 0`).
- **Skeleton and animations:** Gordon's (`player/gordon/gordon.mdl`), so the model keeps all 77 of its animations, including walk, run, die and idle. The stance is arms out about 30 degrees, bound to the skeleton so it stands as the base does.
- **Body:** one shape of 598 triangles, against Half-Life's median of 740 for people and creatures of this size.
- **Paint:** front and back pictures plus two side views, projected onto the shape, with the texture at 512 x 512.

**How I made it**
1. I generated a front and back picture (zimage-turbo, Apache-2.0) held to Gordon's pose, and picked the seed that had all the clothing and the glasses.
2. I made the shape from that front picture (hunyuan3d-mini, Tencent Hunyuan Community Licence: non-commercial, not for the EU, UK or South Korea) and painted its sides (hunyuan3d-paint).
3. I reduced the 20,000-triangle shape to 600 and wrote the spec.

**What I tried and dropped**
- At 800 triangles the build failed: it was over twice Gordon's body (362) and the pictures looked through the model.
- I then tried carving the body from silhouettes with the legs as separate parts. It came out blocky, with boxy arms and head, and failed the outline check. I went back to the single shape.

**What the build still warns about**
- **Coat tearing when it moves:** 61 triangles join the coat to the legs and spine. In the run cycle the coat hem flares and tears in several frames (frames 0, 9, 13). I did not fix this. It would need the coat and the trousers cut into separate pieces.
- **Colour differences from the pictures:** the look differs from the front picture by a mean of 16, and the worst spot is the top of the head. A mean over 10 is the warning threshold.

**Points for you to judge**
- The source picture is a soft, cartoon-like render, so the model reads smoother than Half-Life's own scientist. Side by side is the real test, and I have not run that.
- The check against the game's scientist for bodygroups and sequence contract is not run, because the game's own file is not here. If its code switches heads or bodygroups, check this model against it.
