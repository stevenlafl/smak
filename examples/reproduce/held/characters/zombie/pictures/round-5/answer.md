**The build is NOT OK. `zombie.mdl` is written to the work folder, but it still has 17 detached body pieces at rest, and the check fails on them.**

The file on disk is the best version I got. It has a carved body from the ten pictures at 48 cells, with a wrist sphere and five claws per hand attached to the hand bone. Its outlines match the pictures at 0.71 to 0.80 in every view, and the front view looks like the original, but its carved hand and hem slivers float.

```
Build                                          Result
Carve, 10 views, 48 cells, short claws         Best silhouette (outline 0.71-0.80 in all views); 17 pieces float at rest, 10-14 in animations
Carve, 10 views, 64 cells                      33 pieces; floats 0.3-2.8
Carve, 10 views, 40 cells                      Arms lost (length 31.9 against 38.5)
Carve, 6 views only                            27 pieces float, outline 0.55-0.79
Carve, symmetric                               Side outline 0.38; worse
Carve plus joint spheres                       Spheres sit outside the body; floats unchanged
Carve plus extended claws                      Claws match the pictures; floats unchanged; side outline 0.39
Blob body (eggs and spans), no carve           No carved floats; arms hang straight, side outline 0.16, length 20.7 against 38.5
```

Why it is stuck:
- **Placement:** parts hung on bones (claws, wrist, blob pieces) use the base's raw joint positions, which sit 36 units below the body's floor-space position. Each needs `offset: [0, 0, 36]`. I applied that, and the claws now sit at the hands.
- **Carved floats:** the visual hull at 48 cells leaves small islands of the body that don't touch the main body at rest. They are not at the joints or the feet, and I could not find them. The build reports distances, not positions, and I have no tool to highlight islands or to clean the picture's specks.
- **Pose fit:** it turns only the first animation, so the other animations keep the base's stance and separate further from the carve. Leaving the pose off gave the best silhouettes.

I also could not save a memory note on these findings, because the Write tool is disabled in this session.

Choices for you:
1. Accept a carved body with a few detached specks, and the check still reports NOT OK. I would not mark it OK by allowing the body to float, since the specks would show in the pictures.
2. Push on with the blob body and fix its arms: pose the arms forward and out, widen the torso, and place the claws to match. That should clear the float check, but the outline will be softer than the carve.
3. Clean the sheet first: a silhouette without the claw fringe and the coat-hem specks would let the carve pass. That needs a picture you can edit, since the tools here cannot.

I'd suggest option 2, because it can pass the check. Tell me which you want and I'll carry it on.
