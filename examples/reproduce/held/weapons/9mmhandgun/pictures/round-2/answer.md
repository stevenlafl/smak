The build says OK on the last run (every check passed), and all three files are written. It's the Glock-style pistol: slide, frame under the barrel, raked grip, trigger guard and trigger. It's fitted into the game's v_, p_ and w_ 9mmhandgun files, which keep their own hands, bones and animations.

- **Spec:** `work:9mmhandgun.spec.json` (model `work:9mmhandgun.mdl`)
- **Game files:** `work:9mmhandgun_weapon/v_9mmhandgun.mdl`, `p_9mmhandgun.mdl`, `w_9mmhandgun.mdl`

**How it matches the original:**
- **Size:** 14.7 long, 9.5 wide, 2.8 high, against the original's 14.8, 9.5 and 2.8. The parts' sizes come from measuring sides.png (about 26.4 pixels a unit).
- **Colours and markings:** all ten of your pictures (the six sides and four angles) are laid onto the shape as its texture. That carries over the slide's stripes, the rear serrations, the stippled grip and the black muzzle bore. To make that work, I built the gun in the world model's own pose (muzzle toward -x, grip toward +y) so each picture lines up with its camera.
- **Views:** the in-hand (p_) view lines up with in-hand.png almost exactly. In first person it sits in the same place in the hand, pointing up and to the left, through the whole shoot animation. The world (w_) views match sides.png and the four angles in pose and outline.

**Where it falls short, or has extras:**
- **Hidden grip boxes:** the fit turned the world model about 6° off from the original no matter how I turned the spec. It follows the shape's overall mass, and putting two boxes inside the grip corrected it. They can't be seen, but they cost 24 triangles, so the gun is 96 triangles against the original world model's 76.
- **World model texture:** the build always gives the w_ file a 64x64 texture, and setting a larger one in the spec didn't change it. So the lying-in-the-world gun looks blockier than the original, which used several larger textures.
- **First-person colour:** the first-person gun uses the same pictures, which come from the world model. It comes out a bit lighter grey than the original's darker first-person texture, and looks slightly smaller there.
- **Grip shape:** the grip is a box tilted 5°, so its bottom edge leans about half a unit where the original's runs straight. It also has no chamfer on the front bottom corner.
- **A bug in the kit:** setting `"turn": "as drawn"` for the w_ file crashes the fit ("Cannot read properties of undefined (reading 'join')"), and the file is left as the game's own gun. The final spec doesn't use it.
