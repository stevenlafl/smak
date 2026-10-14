zombie.mdl is built and the build says OK: every check passed, 2,012 triangles, and its size matches the description exactly (68 tall, 54.6 wide, 38.5 deep).

**Base skeleton: gman.mdl, not Gordon.** I tried two others first:
- **Gordon's** first frame has the right hand forward holding a gun, nothing like the zombie's rest pose.
- **Barney's** first frame was a better pose, but his holstered pistol is a separate bodypart that the body swap can't remove. It showed as a dark sliver on the hip. Also, 43 of his animations live in barney01.mdl, which a file named zombie.mdl won't find.
- **gman** has a single body, all 14 animations inside the file, and a first frame standing with the arms hanging. Those animations are kept.

**What's built:**
- **Head:** a cream bone-white dome over the head down to the jaw, with an ochre/mustard rim band, dark red folds, and three red strands hanging where the face would be. It sits forward and low on a jutting dark-red neck.
- **Torso:** a slim white coat (about 11.5 wide at the chest), hunched at the upper back, with a narrow collar and lapel lines. It's smeared pink-red, worst at the chest, cuffs and hems.
- **Torn front:** dark red flesh from collarbone to belly, three ribs, and a black midline gash with tooth-like edges.
- **Back:** two oval holes over the spine and lower back, showing dark flesh and vertebrae edged in red.
- **Coat skirt:** hangs to mid-thigh, one panel on each leg so it moves with the legs.
- **Arms:** sleeves end at the elbow; the forearms are thin, dark and streaked red. Each hand has five long jointed fingers ending in dark claws tipped bright crimson. They splay out and down to knee height.
- **Legs:** about half the height. Loose pale grey trousers spotted with blood, and dark red-brown shoes with blood smears.

**Where it falls short of the original:**
- **Movement:** the animations are gman's. The walk is his steady 21-frame stride, not the 60-frame shamble with arms swinging out of step. There are no attack, flinch or death animations.
- **Posture:** gman stands upright. The stoop comes only from the hunched back and the head hanging forward, not from a bent spine or bent knees.
- **Smaller notes:** the build listed 8 pairs of parts sitting within 0.6 units of each other without touching, all at the finger bases and the coat's edges. None is a fault, and nothing comes apart in the walk.

A test file from checking gman, `probe.mdl` with its spec and sheet, is still in the work folder; the tools here can't delete it, so you can remove it.

Files are in the work folder:
- zombie.mdl
- zombie.spec.json
- zombie-sheet.png
