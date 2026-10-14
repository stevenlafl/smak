I built `scientist.mdl` on Gordon's skeleton (`player/gordon/gordon.mdl`) with `"floor": 0`. The build says **OK** and every check passed. Gordon's 77 animations are kept, and the run animation stays in one piece in every frame.

**Size against the description:**

| | Target | Built |
|---|---|---|
| Height | 68 | 69.3 |
| Width across hands | 21.7 | 22.8 |
| Front to back (mid-stride) | 33.3 | 32.3 |
| Triangles | — | 1,360 |

**How it stands:** In the first frame he's mid-walk: left leg forward, right leg back with the heel lifted, and his whole weight on the floor. He has a slight stoop, with the neck and head pushed forward but the head kept level. Both arms hang straight with loose fists. Gordon's own first frame holds a gun forward in the right hand, so I lowered that forearm.

**What's on him:**
- **Head:**
  - Bald, slightly long, pale pink-beige skull, with a band of grey-white hair round the back at ear level.
  - Black rectangular glasses whose arms run back to the ears.
  - Sunken eyes, hollow cheeks and a thin mouth.
  - A long straight nose and ears that stick out a little; these two are built, the rest is painted.
- **Coat:** A white lab coat, open down the front, with a turned-down collar, lapel lines and long sleeves. It comes to below mid-thigh with a flare at the hem, and a seam runs down the back.
- **Under the coat:** A collared chambray-blue shirt shows in the opening. The tie has diagonal stripes, and the black belt has a grey buckle.
- **Trousers and shoes:** Off-white trousers that gather over dark reddish-brown shoes.

**Where it falls short:**
- **Proportions:** Gordon's bones are longer than this scientist's. The pose can only turn bones, not move them, so I couldn't lower the hips. The hip line ends up about 38 units up instead of just under half his height (about 33). His fists only reach the top of the thigh, not mid-thigh. To keep him near 68 tall, the head sits low and close on the shoulders.
- **Tie colours:** The tie's stripes are dull red and black, not red and navy. The striped paint the kit offers only pairs a colour with black.
- **Running:** Run and the other animations are Gordon's own, including an athletic run with a 23-frame cycle. The coat tails follow the thighs, but nothing flaps on its own and the tie doesn't move.
- **Triangles:** The build warns that 1,360 is more than twice the 362 in Gordon's own body. That's a warning, not a fault.
- **A minor note:** The build notes a 0.45-unit gap between the left upper arm and the chest. Both parts touch other parts, so it isn't a fault.

**Kit bug:** the close-up view (`focus`) ignores the floor lift, so it aims 36 units too low; asking for the head showed the hips. To check the face I built a throwaway copy without the lift, `work:probe.mdl`. You can delete it; the tools here can't.

The files are in the work folder: `scientist.mdl`, `scientist.spec.json` and `scientist-sheet.png` (the six views).
