The zombie is built: `work:zombie.mdl`, from the spec `work:zombie.spec.json`. The build says OK, and `check` with the GoldSrc rules says "fit for goldsrc". I did not compare it side by side with the original, since no pictures of the original were available. Everything below is measured against your description.

**What's in it**
- **Base:** Gordon's skeleton from the Half-Life install (42 bones, 77 animations), with `floor: 0`. The feet stand at the origin and the model is 67.5 tall (you said about 68).
- **Stance:** the body stoops forward, the head bows, the knees are slightly bent, and the arms hang out from the body with the hands at about hip height. The first animation is `look_idle`, and the pose is applied to it.
- **Coat:** an off-white blob that hangs to mid-thigh, with pale grey lapels. It is closed, not open at the front.
- **Head:** a cream dome, an ochre rim underneath, and three red strands below it.
- **Arms and hands:** thin dark maroon arms. Each hand has five long fingers with crimson hook claws reaching about knee height. The claws span 53 units across (you said 54).
- **Legs:** pale grey trousers and dark red-brown shoes.
- **Wounds:** the chest gash, its ribs, two dark holes on the back, and blood smears on the coat's chest and hem and on the trousers. All of these are painted on, not carved.
- **Animations:** Gordon's own, so they keep his motion. The shambling, lopsided gait you described is not modelled.

**Gaps I did not close**
- **Depth:** the figure is 21.5 deep. You said 38.5. I did not reach that, because it would mean changing the stoop and the hand placement.
- **Tone:** the report says the textures are paler than Valve's (38% near-white against under 23% for Valve's). I kept the off-white and cream tones you described rather than darkening them.
- **Head rim:** a plain cylinder, so from some angles it reads as a yellow cap rather than wrinkled flesh.
- **Torso:** the open gash is paint on the coat, not a hole in it.

**A mistake I made:** one rebuild sent only the body parts and dropped the head, fingers, shoes and paint from the model. I rebuilt it in full straight after, and the final file is the complete spec.
