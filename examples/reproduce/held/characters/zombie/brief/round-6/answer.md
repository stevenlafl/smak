The revision builds OK, but it does not yet look like the game's own zombie. The person's verdict still stands on the coat and the head.

**What I changed**

| Part | Before | Now |
|---|---|---|
| Claws | 10 units, stubby | 15 units, thinner, forked, 4 per hand |
| Parasite colour | Olive | Pale cream-tan, closer to the reference head |
| Chest | Clean coat | A dark red flesh blob on the upper chest (`chest_wound`, 40 triangles) |
| Legs and arms | Out 30 / 6 | Unchanged |

Parasite shape, the lean and the arms are as the previous revision had them.

**What I tried and reverted**

- Arms reaching forward and bent legs: the front outline dropped below 0.8, so I took both out.
- Body cut from 340 to 320 triangles: the outline dropped too. I restored 340 and took the 20 back from the chest wound.
- A dirtier coat through the body's finish: the build ignores a finish on this mesh body, so I removed the key.

**Final checks** (`work:zombie.mdl`, from `work:zombie.json`)

- Build says OK, every check passed.
- Height 69.8 (asked for about 68).
- 722 triangles: body 340, parasite 150, chest wound 40, claws 192. The reference median for creatures this size is 655, and the largest is 731.
- Warnings still standing:
  - Front outline 0.765, under 0.8. The longer claws stick out past the front picture. The 10-unit claws gave 0.805, so I chose the reach over the outline.
  - 26 triangles join the arms to the trunk and may tear in some motions. This was already there.
  - The look check flags the parasite and wound against the coat's picture (mean difference 11.3, worst at the top middle). That is expected, since they are deliberately different paint.

**What is still short of the reference**

- The coat is still clean white. The coat is the picture's paint, and I can't repaint it here. Making it bloodied and torn needs a new body picture, then a new shape, then a carve.
- The head still reads as a striped cap, from the parasite's facets.
- The stance is still upright. A real hunch needs a body carved to a bent pose, which changes the outline.
- The chest wound barely shows in the front view.

Earlier revisions are kept: `work:zombie_v2.mdl` and `.json` (the one the person judged), and `work:zombie_v1.*`.

The next real step is a new body picture of a bloodied, torn coat with an exposed chest, a shape from it, and a carve in a bent pose. That changes the body and needs its own outline check. Do you want me to go that way? It is a larger change than this revision.

Licence note: the shape model is non-commercial and not allowed in the EU, UK or South Korea. This is for the test only, not for shipping commercially.
