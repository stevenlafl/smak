I built `scientist.mdl` on Gordon's skeleton and it passes every check (the build says OK). It's 68.5 units tall, 2,036 triangles, with a 512x512 texture. The files are `work:scientist.mdl`, `work:scientist.spec.json` and `work:scientist-sheet.png`.

**What it has:**
- **Build:** thin and narrow-shouldered, with the upper back slightly rounded. The neck and head jut forward of the chest, and the hip line is just under half his height.
- **Head:** bald and slightly elongated, about one eighth of his height, in pinkish-beige skin. A grey-white band of hair runs round the back at ear level. He has a long nose, slightly prominent ears, sunken eyes with shading under them, hollow cheeks, forehead lines and a thin mouth.
- **Glasses:** black rectangular frames, a bridge, and arms running back to the ears.
- **Coat:** bright white with grey painted folds, open down the front. It has a turned-down collar, lapel lines, long sleeves to the wrist and a back seam. The tails reach the knee.
- **Underneath:** a mid-blue collared shirt in the opening, a narrow navy tie with diagonal dull-red stripes down to the belt, and a black belt with a grey buckle.
- **Legs:** off-white loose trousers with wrinkles at the knees and ankles, and dark reddish-brown shoes with rounded toes.
- **Hands:** bare loose fists, nothing held.

**Where it will differ from the original side by side:**
- **The pose.** Gordon's model is the only one in the game folder (there's no scientist, barney or gman player model to use instead), and I can't change his poses. So the figure stands in Gordon's first frame, `look_idle`, not the scientist's mid-stride walk. Both feet are on the ground and his right fist is held forward at chest height, where Gordon holds a gun. In that frame the model is 20.3 units front to back and 26.9 across the hands, against the original's 33.3 and 21.7. It also isn't hunched with both arms hanging.
- **The movement.** He keeps Gordon's animations, so his run is Gordon's 23-frame athletic run, not the scientist's 19-frame anxious, loping one with pumping arms. It holds together through the whole run with nothing coming apart. The coat tails swing with the thighs because I hung each tail on its thigh bone. The tie is painted on, so it doesn't move.
- **The coat tails.** Since they're two tubes, one per thigh, they read a little like split panels in the still pose rather than one flared hem.
- **Smaller details.** The ears are round bumps rather than tall ear shapes. The face is painted on the texture, so it's a stylised low-detail face rather than modelled lines.

I also hit a bug in the build tool: placing a part on a bone with the anchor `"at": "start"` crashes the build ("Cannot read properties of undefined"). I used the `bottom` and `back` anchors instead, which work.
