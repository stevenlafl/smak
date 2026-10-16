`scientist.mdl` builds OK, and the engine-limit check reports "fit for goldsrc".

I built it on Gordon's skeleton (`player/gordon/gordon.mdl`) with `"floor": 0`, so the feet stand at the origin. All 77 of Gordon's animations are kept. This is the reading I took of "as the original stands in the first frame of its first animation": the 33-unit length only comes from a mid-stride frame, so the stance is Gordon's walk frame 14, as the guide describes for Half-Life's scientist.

| Figure | Target | Built |
| --- | --- | --- |
| Height | 68 | 68.1 |
| Length (front to back) | 33.3 | 33.8 |
| Width (across hands) | 21.7 | 23.0 (within the 10% tolerance) |
| Triangles | under 724 (twice Gordon's body of 362) | 702 |

**What's in it**
- **Head:** a bald, elongated skull in pale pinkish-beige, a long nose, small ears, and a grey-white band of hair from ear to ear. The glasses are four thin black bars per lens plus a bridge and arms, painted onto the head.
- **Coat:** a white torso with a flared skirt to just above the knee, and sleeves that end at the wrists. The shirt, tie and belt are painted on the front of the coat. The belt is black with a grey buckle.
- **Trousers and shoes:** off-white trousers, and dark reddish-brown shoes.
- **Pose:** arms hang at the sides with curled hands, the spine tilts forward, and the head juts slightly forward.

**Deviations and trade-offs**
- **First animation:** the keys and the walk frame change the content of animation 0 (Gordon's `look_idle`). It now plays the scientist's stance, not Gordon's idle. Animations 1 to 76 are Gordon's own.
- **Hips and hands:** the hip line is at about 39 of 68 units, against the described 34, because Gordon's pelvis is fixed by his walk. The fists rest at about 36 units, above mid-thigh (about 30), because the arm length limits how low they can reach.
- **Coat and face:** the coat is a smoothed blob, so it is blockier than real cloth folds. The face has no hollow cheeks or sunken eyes; those are not modelled. The tie is hazard stripes in dull red and black, not navy and red.
- **White coat:** the build warns that the coat is nearly white. The guide says a lab coat is white by what it is, so I left it.

**Not verified**
- I had no picture of the original, so proportions come from your description alone. I could not compare the two side by side.
- I have not run this in the game. The build's checks cover geometry and the engine's limits, not how it looks or behaves in play.
