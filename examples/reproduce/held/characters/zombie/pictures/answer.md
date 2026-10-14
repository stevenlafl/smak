`zombie.mdl` is built and the build says **OK**, with every check passing. It's in the work folder with its spec (`zombie.spec.json`) and sheet (`zombie-sheet.png`).

**What it is**
- It's on Gordon's skeleton (`player/gordon/gordon.mdl`), so it keeps all 42 of his bones and 77 animations. His first frame is a plain upright stance with the feet about where the zombie's are.
- The parts are the lab coat (in three sections), legs, shoes, neck and face, and a headcrab tilted forward with its legs down the sides of the head. Each arm has a white sleeve, a long dark-red forearm, a palm and four claws plus a thumb, all with bright red tips. That's 1,124 triangles.
- The pose is the zombie's hunched one: head hanging forward and low, a hump at the upper back, the right arm reaching forward and out, and the left arm hanging lower.
- The colours and markings are the original's own pictures laid onto the shape from the six straight views of `sides.png`. That carries over the open ribcage at the front, the two rib and spine wounds on the back, the blood on the coat and trousers, and the crab's pale top and orange back. The claws are painted with their own colours instead.

**Size against the original**

```
            original   mine
length (x)  38.5       38.7
width  (y)  53.8       53.7
height (z)  68.4       68.7
```

I compared my renders with the original from the six sides and two of the close angles (front-left and back-right), and the outlines line up to within a pixel or two at the same scale.

**Problems I hit, and what's still different**
- **Captions:** at first the projection put the texture in the wrong place. When it looked for the figure's outline in each view, it took the "FRONT"/"LEFT" captions in as part of it. I fixed this by giving each view's outline box myself.
- **Close-angle pictures:** I tried projecting the four close-angle pictures as well. They blurred the chest and back wounds, so I took them out and kept only the six straight views.
- **Movement won't match `motion.png`:** the zombie's own skeleton isn't available, so it moves with Gordon's player animations, not the zombie's shuffling walk. The claws are fixed to the forearm, so they don't flex at the wrist. In the run, crouch and jump tests nothing comes apart.
- **Smaller differences:** the shoes are plain boxes where the original's have rounded toes. There's also a faint seam at the waist where the coat sections meet.
