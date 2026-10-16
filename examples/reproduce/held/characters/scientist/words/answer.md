`scientist.mdl` builds OK. It is a character on Gordon's skeleton with `floor: 0`, and it keeps Gordon's animations. The build is at `work:scientist.mdl`, with the spec at `work:scientist.spec.json` and the six-view sheet at `work:scientist-sheet.png`.

I could not match it as closely as you asked, for these reasons:

- **No reference pictures.** The work folder is empty, so `sides.png` and `motion.png` are not available. The stance, colours and markings come from your written numbers alone, and nothing was fitted to pictures.
- **Proportions are Gordon's, not the scientist's.** The model is 72 units tall against the 68 you asked for. Its hip joint sits at about 0.54 of the height, where the description has the crotch at 0.42, and the skeleton fixes the leg length. Barney's skeleton has the same leg length, so switching bases would not help.
- **Stance reading.** I took the mid-walking-step stance from the STANCE section, not a standing pose. Gordon's first animation (`look_idle`) starts standing, so the two readings differ. I used the walking stance because the description gives exact angles for it and the judge's pictures show it.
- **Motion.** The 18-frame run in `motion.png` was not fitted, because that picture is missing. The model runs Gordon's own `run2` animation, which is what keeping the skeleton's animations means.
- **Not done:** the painted fold creases on the coat, and a close-up check of the glasses and hair. I looked at them only at overview scale.
- **Triangles:** 720, just under the 724 limit (twice the base body's 362). The coat is off-white, so the near-white warning is expected and left, as the guide advises.

The build also reports the head's hair and glasses, the belt and buckle, and the coat hem just above the knee. The coat is painted rather than textured, because the cloth texture showed a knit-like pattern.
