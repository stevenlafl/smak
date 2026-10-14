I built `scientist.mdl` and the build says **OK**, with every check passed. It's in the work folder with its spec (`work:scientist.spec.json`) and contact sheet.

**How it's built**
- **Skeleton:** It sits on Gordon's skeleton (`player/gordon/gordon.mdl`, 42 bones) and keeps all 77 of his animations. It has `"floor": 0`, so every animation is lifted 36 units and the feet stand at the origin.
- **Size:** It comes out 33 long, 21.2 wide and 68.3 high, against the original's 33.3 × 21.7 × 68.
- **Parts:**
  - a hunched torso under an open lab coat, with a coat tail that flares back
  - grey trousers
  - brown shoes
  - coat sleeves and fists
  - a short neck and a bald head with a nose and ears
  - black glasses
  - grey hair around the back of the head
- **Colours and markings:** All ten reference pictures (the six sides and the four close angles) are projected onto the shape as its texture. That carries over the blue shirt, the striped red tie, the belt, the face and glasses, the grey hair and the shoe colour.
- **Pose:** The first frame stands in the original's walking stride: right foot forward, left arm forward and right arm swung back. I started from the kit's automatic pose fit, then tuned it by hand against the side and angled views. I dropped the collarbones about 2.5 units to get the original's lower, sloped shoulders, brought the feet in toward the middle, and straightened the backswing arm.

**Where it still differs from the original**
- **Other animations:** Only the first animation is posed this way. The others keep Gordon's own motion, including his higher shoulders, so the run differs from the scientist's own run in `motion.png`.
- **Smudges:** The texture has some soft blending smudges where my shape doesn't line up exactly with the pictures, mostly on the coat edges and the face.
- **Triangle count:** It has 1,192 triangles, about three times the 362 in Gordon's own body. The build warns about this, but it isn't a fault.
