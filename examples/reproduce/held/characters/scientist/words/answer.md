The model builds **OK** with every check passing. It is `scientist.mdl` in the work folder, on Gordon's skeleton (`player/gordon/gordon.mdl` from the game's `valve/models` folder), with `"floor": 0`. All 77 of Gordon's animations are kept, and the first frame of the first animation is posed to your stance numbers.

**What it has:**
- **Head:** bald egg-shaped skin head with prominent ears and a short grey band of hair at ear level, painted on the sides and back. Heavy black glasses (lenses, bridge and temples) are built as parts.
- **Coat:** one soft white body over the torso, skirt and sleeves, with the hem at about 0.32 height.
- **Shirt, tie, belt and buckle:** painted onto the coat front, so the blue band, the red tie and the black belt show through the open coat.
- **Trousers and shoes:** off-white tube legs, brown leather shoes.
- **Hands:** skin-coloured fists.

**Stance:** upright torso leaning 5° forward, level head, left arm 8° out and 25° forward with a 15° elbow bend, right arm 8° out and 20° back, right leg forward at 15° with a 5° knee, left leg back at 11°.

**Where it differs from the description, and why:**
- **Leg length:** Gordon's skeleton puts the crotch about 39 units above the sole. The description says about 29. The skeleton's hip joint can't be moved, so the coat hides the difference below the belt. Visually the legs below the hem still read as the original's length. No other human skeleton on this machine is shorter; Barney's is about the same.
- **Head width:** the description gives 0.08 width and says the head is "a little taller than wide". I used the numbers, so the head is 8.8 units tall and 5.6 wide.
- **Left fist:** the arm angles as given put the fist about 14 units in front of the shoulder, not "just in front of the thigh". I followed the angles. Check this against the original.
- **Triangles:** 608, under the 724 limit (twice Gordon's body).
- **Left out:** the coat's fold creases, the trouser creases, a painted mouth, and the lighter grey strands. The coat's "near white" warning is left on purpose, since the description says the coat is white.
- **Motion:** `sides.png`, `motion.png` and `facts.txt` are not in the work folder, so I built from your text only. I did not fit the run cycle, so the run and walk animations are Gordon's.

I couldn't see the original, so I have not compared the pictures to it. The views I checked (six sides, a quarter view, a back view and a close view of the lower body) match the stance numbers and read as the described figure, but the head and face are rough at this scale.

The probe files from my first trial builds (`scientist_probe.*`) are still in the work folder. I have no delete tool here, so they need removing by hand.
