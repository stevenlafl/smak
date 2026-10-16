The zombie is built as `work:zombie.mdl`. The build says OK and the GoldSrc check says "fit for goldsrc". I had no reference pictures, so every proportion comes from your description, not from comparing against the original.

**What I built**
- **Base:** `player/gordon/gordon.mdl` from the Half-Life install, with `floor: 0`. Its 42 bones and 77 animations are kept.
- **Size:** 68.1 tall (asked 68), 53.9 across the claws (asked 54), 39.9 deep (asked 38.5).
- **Triangles:** 696, under the 724 limit (twice the base's 362).
- **Stance:** the first animation's first frame is turned into the stoop. The spine and neck lean forward, the head sits low, and the arms hang out about 35°.
- **Head:** a cream bone-coloured dome with an ochre band low on it, and two short red strands below.
- **Torso:** a narrow coat with a dark flesh gash down the front, rib lines in it, two dark holes on the back, and blood smears.
- **Hips and legs:** a coat skirt to mid-thigh with a blood-stained hem, pale grey trousers with blood spots, and dark red-brown shoes.
- **Arms:** dark sleeves to the elbow, dark forearms, large dark palms, and five crimson claws each about 22 units long. The tips reach about knee height.

**Choices I made**
- Fingers are one piece each, so they are not jointed.
- The dome is eight-sided and the body parts are six-sided, to keep under the triangle limit.
- The wounds and blood are painted onto the coat, not cut into it.
- The coat is closed at the front; the open front is not modelled.
- The knees are not bent.
- Both arms use the same relaxed pose, so the arms are not asymmetric.

**Not done**
- **Gait:** the walk is Gordon's own, because I had no motion pictures to fit a shamble to. The slow, drunken, lopsided walk and the drifting claws are missing.
- **Animation rest pose:** the stance is set by the pose, so its first animation is the stoop. The other animations keep Gordon's stance.

**Kit issue:** the guide says a part placed with `bone` and `at` hangs on that bone. In my tests, `bone` plus `at` put the part at the model origin, ignoring the bone's position. `attach` placed them correctly, so I used `attach` throughout. This is worth reporting to the kit's maintainers.
