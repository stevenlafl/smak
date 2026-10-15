`barney.mdl` builds OK, but it is not yet as close to the original as you asked. The build's own warnings say the silhouettes are short of the bar in every view.

**What it is**
- Built on `player/gordon/gordon.mdl` from the Half-Life install, keeping its 42 bones and 77 animations, with `floor: 0`.
- Parts: a superquadric helmet, shirt, vest, hips and boots; cylinder spans for the legs and arms; a skin blob for the head, neck and hands.
- Colours and markings (the blue helmet band, the SECURITY print, the badge) come from projecting the eight reference pictures onto the body, not from hand-set materials.
- Size: 22.2 long, 28.5 wide, 75.3 high, against the original's 22.8, 30.2 and 75.3.
- 628 triangles, under the 724 limit (twice the base body's 362).
- The spec is `work:barney.spec.json`, and the sheet is `work:barney-sheet.png`.

**Pose**
- The base's first frame holds the right hand forward, as Gordon's gun pose does. I hung the right forearm down so the fist sits by the thigh, as in the reference. That is the only pose key.
- The left foot, the boots and the vest are placed from the base's measured foot and spine positions.

**What is still off**
- Outline overlap against the pictures: front 0.77, back 0.77, left 0.71, right 0.73. The quarter views (35 and 145 degrees) are 0.60 to 0.62. The bar is 0.8.
- The side view has the front leg about 3 to 5 units further back under the hip than the reference. Swinging the left thigh forward made the side and quarter views worse, so I reverted it.
- The render's auto-scale differs slightly from the pictures', so I judged by the build's overlap numbers rather than by eye.
- Boots and trousers are simplified blocks and tubes. The projection gives them the right colours, but the shapes are rougher than the original's.

**Next step if you want it closer:** the quarter-view gap points at how the body's depth and width are spread across the diagonals, and the side gap at the leg stance. The next thing to try is a `carved` torso from the outlines, or a `fit` on the legs only, with the boots re-placed from the fitted feet. I did not do either, since a rigid carved body would come apart in the run frames.
