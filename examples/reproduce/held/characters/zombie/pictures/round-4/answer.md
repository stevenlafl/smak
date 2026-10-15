I built `zombie.mdl` on Gordon's skeleton. The build says OK, but with four warnings, and it is not a close match yet. The judge would see clear differences in the arms, the width and the silhouettes.

**What the build is**
- Base: `player/gordon/gordon.mdl` from the installed Half-Life `valve` folder, keeping its 42 bones and 77 animations. `floor` is 0, so the feet stand at the origin.
- Body: a blob torso with a coat skirt, and blob legs and arms on their bones. The head is a superquadric on the head bone, with a pale skull colour.
- Hands: a sphere on each hand bone, with three claws per hand, pointing down and forward.
- Shoes: boxes on the feet, in dark red.
- Colour: the four angle pictures and the six sides are projected onto it, so the coat, the blood and the skull come from the original's own pictures.
- Pose: a forward lean through the spine, the head forward and down, and the upper arms swung slightly forward and rolled outward. I set these by hand, because the automatic pose fit pushed the figure into a running stance.

**What the build still reports**
- Length is 33.2 against 38.5, and width is 44.5 against 53.8.
- Outline overlap against the original's views is 0.30 to 0.56 on most views, against the 0.8 the tool asks for.
- The triangle count is 1240, over twice Gordon's own body, which is a warning only.

**Why the arms are short**
Gordon's arm from shoulder to wrist is about 22 units on this skeleton. The original's arm reaches down to about 32 units, so its hands hang near floor 25. Ours stop near floor 38 at the claw tips, and the shape is narrower because the arms cannot splay further without lifting the hands. Each forward swing of the upper arm raised the hand toward shoulder height, so I kept the arms nearly hanging. That trade costs the reach and the width. I tried three other arm settings, and this one had the best side-view overlap.

**Choices I made that you may want to change**
- The legs are left straight on the skeleton, so the hips and knees are Gordon's. I did not bend the knees, because bending them far enough to match the original's hip height would have made it look crouched.
- The skirt, the torso and the claws are approximations of the coat's hem and the fingers, not traced from the pictures.
- I did not check it in the game. Everything above is from the build report and the sheet pictures.

**If you want it closer**
- Carve the torso and arms from the original's silhouettes (the `carved` kind), keeping the blobs for the joints. The tool may not allow that on a character, so I have not tried it.
- Accept the arm shortfall as the cost of Gordon's skeleton. A monster with his arm lengths would look closer to a human than to the original.

The files are in the server's work folder: `zombie.mdl`, `zombie.spec.json` and `zombie-sheet.png`. I could not save a memory note, because the write tool is disabled in this session. The pose sign findings are in the report above instead.
