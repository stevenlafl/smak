I built `work:scientist.mdl` and the build says **OK**. Every check passed, including the walk, run, crouch and jump poses, with no parts coming apart. The spec is saved alongside it as `work:scientist.spec.json`.

**One thing it can't match: the pose.** The original stands mid-stride, because that's the first frame of its own first animation. Its own model isn't installed, and neither are the other human models I tried (barney and gman, as plain models and as player models). So I used the Gordon player skeleton. Its first frame (look_idle) is an upright stance with the right forearm held forward to hold a gun, and that's how the model stands in its first frame. Gordon's pose comes with keeping his skeleton's animations, so side by side the body shape and colours will match but the stance won't. In particular, the left and right views won't show the long stride.

**What it has, compared with the pictures:**
- **Head:** bald and skin-toned, with a grey band of hair round the back and sides plus small tufts over the ears. It has ears, a nose, a mouth line and black-framed glasses with tinted lenses and arms back to the ears.
- **Coat:** white, with the shirt showing down the open front, a navy collar round the neck, and sleeves down to bare fists. The coat hangs to just above the knee.
- **Shirt and tie:** blue shirt, and a tie in red and black stripes. The original's stripes are red on navy; the striped material only does a colour on black, so I went with that.
- **Below the waist:** a black belt visible in the coat's opening, light grey trousers and dark brown shoes.

**Size:** it's 73 units high against the original's 68, about 7% taller. That's within the build's 10% limit, but it will look slightly bigger at the same scale. Gordon's ankle and head joints are fixed, so the only way to shorten it would be a smaller head than the original's. Width (21.7) and length (33.3) don't compare directly because of the different stance.

**Remaining:**
- The build still notes a 0.4-unit gap between the nose and the bottom of the glasses. It's a note, not a fault.
- The model is 1,096 triangles.
- The face is built from shapes and painted lines. I didn't project the reference pictures onto it, because the pictures were taken in a different pose from this skeleton's and wouldn't line up.
