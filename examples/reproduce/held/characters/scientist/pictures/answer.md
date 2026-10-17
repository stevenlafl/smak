The scientist model is built and the build says OK: "built, and every check passed". It is written as `work:scientist.mdl`, with its spec beside it at `work:scientist.spec.json`. I haven't copied it into the game's models folder, since you didn't ask for that.

How it's made:
- **Skeleton:** Gordon's (`player/gordon/gordon.mdl`), keeping all its bones and animations. The floor is set to 0, so it stands with its feet at its origin.
- **Stance:** the pose is the frame-0 stride of Gordon's walk. That frame's body length (33.2 against the original's 33.3) and its outline matched the reference pictures best. I tried a fitted stance and a different frame, and both matched worse.
- **Body:** one carved shape from all ten reference views (the sheet plus the four angled pictures), 362 triangles, not mirrored. Mirroring the shape across the middle collapsed the stride, so I turned it off.
- **Colours and markings:** painted by projecting the reference pictures onto the body. That gives the white coat and trousers, blue shirt, striped tie, dark-framed glasses, grey hair at the sides and brown shoes.
- **Checks:** every silhouette check passes, between 0.86 and 0.91 against the pictures. The warnings left are these:
  - 9% of triangles stretch in the run (run2 frames 6, 9 and 18). The coat and legs are one piece on the bones, so they tear a little when running. This is a warning, not a fault.
  - One patch on the front view takes a neighbour's colour (a strap on the upper left).

What is not in the model:
- Fingers, and the glasses and hair are painted rather than built.
- The legs are carved as part of the coat rather than built as their own limbs, so the walk animations tear more than a separate set of legs would.

If the running tears matter to you, the next step is to build the trousers as separate limbs under a coat that stops at the hem. That is a larger change, so I'll leave it unless you ask.
