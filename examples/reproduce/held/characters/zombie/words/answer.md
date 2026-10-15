The model is built and the build says **OK** with every check passed. It is in the work folder as `zombie.mdl`, with its spec in `zombie.spec.json` and a contact sheet in `zombie-sheet.png`. It was built on Gordon's skeleton (`player/gordon/gordon.mdl`), with `"floor": 0`.

I worked from your written description only. I had no picture of the original, so I have not compared it side by side.

**Measurements** (model units; the tool reports them from the sole up)

| Feature | Original | Ours |
| --- | --- | --- |
| Height | 68 | 66.9 |
| Width across claws | 54 | 51.6 |
| Depth | 38.5 | 21.5 (short) |
| Legs, sole to hip | about 34 | about 39 (high) |

**What is in it**
- **Head:** a cream dome with an ochre rim, and three red strands of flesh under it.
- **Torso:** a white coat with a dark gash down the front, two holes in the back, and blood smears on the chest and hem.
- **Legs:** pale grey trousers with blood stains, and dark red-brown shoes.
- **Arms:** dark flesh arms under coat sleeves, with five long clawed fingers on each hand. The fingers hang straight down.
- **Stance:** the spine, neck and head are bowed forward, the knees are bent, and the arms hang out from the body. This is applied to the first animation's frames.

**Limits you should know about**
- **Animations are Gordon's.** You asked me to keep the skeleton's animations, so the walk is Gordon's gait, not the slow shamble you described. Matching that would need pictures of the original's walk.
- **Depth is short.** The stoop and the forward head do not reach 38.5. Only the stance was adjusted, so this is what the skeleton gives.
- **Fingertips reach about mid-thigh,** not knee height. Gordon's arms are too short for knee height.
- **Triangles:** 696 per body. That is under the 724 limit (twice Gordon's own body), and the check passes.
- **Floor:** the check passed, but I checked the feet by eye in the idle strip, not by measurement.

I also saved two pictures in the work folder: `zombie-idle-strip.png` and `zombie-left.png`.
