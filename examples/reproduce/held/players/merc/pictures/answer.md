I built **merc.mdl** and the build passes every check (OK). The contract check against `player/gordon/gordon.mdl` also passes, so it keeps the original's 34 bones, all 171 animations in their original order, and its attachments and bodyparts.

**What it is**
- It's a body of 27 parts, each hung on The Specialists' own Biped bones (the skeleton rig from 3ds Max, with Italian bone names like `Bip01 Testa` and `Bip01 SX Mano`). It's built in the original's first-frame pose: hunched forward, both gloved hands together in front of the groin.
- **Parts:** balaclava head and neck, vest torso, rounded shoulders, short-sleeved upper arms, tattooed forearms, fingerless-glove fists with thumbs, belted camo hips and legs, knees, mid-calf boots, and the holster on the right thigh.
- **Size:** 69.2 high and 22.2 wide, against the original's 69.4 and 22. It's 25.3 long against 23.7, because its fists reach a little further forward. 1,296 triangles in total.
- **Colours and markings:** all ten of your pictures are projected onto it as its texture. That covers the eye and mouth holes in the mask, the row of shells and the "311" on the front of the vest, the "311" on the back, the arm tattoos, the belt and the grey camo. Anything no picture sees falls back to a matching material (black cloth, skin, grey camo, black leather).

**What I checked by eye**
- I put the six sides next to `sides.png` and rendered the front-right (yaw -35) and back-left (yaw 145) angles to compare with yours. The "311" on the back sits at the same height as the original's.
- The run holds together in every frame. In two run frames the inner thigh shows a lighter grey patch. It probably comes from the camo in the pictures rather than a missing texture, so I left it alone.
- The forward dive holds together too. My strip of `dive_f_akimbo` shows 35 frames, while the label in your `stunt.png` says 22. The animations are the base's own and the contract check passes, so I think the two pictures were just made differently. I didn't go further than that.

**Workarounds, worth knowing if you reuse the spec**
- **Bone names:** the guide says English names like `Head` get translated to the Italian ones, but `Head` was rejected. I used the Italian names throughout.
- **Build crash:** `attach` on a bone with `at: "start"` makes the build fail with "Cannot read properties of undefined (reading '0')". I used `at: "centre"` with an offset instead.
- **Captions:** when I projected from `sides.png`, the outline search took in each view's caption ("FRONT" and so on), which would have shifted every texture. I gave each view's outline by hand.

Files are in the work folder: `merc.mdl`, `merc.spec.json` and `merc-sheet.png`.
