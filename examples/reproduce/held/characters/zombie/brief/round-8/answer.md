The zombie model builds OK, with no faults. I changed only the claws. `work:zombie.mdl` is 1,145,676 bytes, and the spec is `work:zombie.spec.json`.

**What I changed**

- **Claws now hang on a hand bone, not in the air.** Each hand has three claws, each 5 units long, on `Bip01 L Hand` (mirrored to the right). Before, the claws were placed by the `fingers` kind and floated off the hands. The body mesh's hands sit a few units away from the bones, and the claws did not follow them.
- **A flesh knuckle on each hand.** The claws missed the mesh hand in some frames, so each hand now has a sphere (radius 2.6) on the hand bone. It overlaps the mesh hand, so the claws and hand are one connected piece. The spheres move with the hand, so the claws follow the arm in the attack and walk frames.
- **Thumb claw removed.** The thumb bone sits behind the mesh hand, so its claw floated and could not be fixed by moving it.
- **Body, pose, parasite and tentacle unchanged.**

**Result**

- Build says **OK**. Every check passed, with no faults.
- 694 triangles, under Half-Life's median of 740 for creatures and people this size.
- The `2handshoot` strip shows the knuckle and claws moving with the arm.

**What is left**

- **Knuckles look pale.** The front picture paints them, so they show the coat's white. They read as white balls at the wrists rather than dark hands. Making them dark needs a separate material that the projection does not paint, which I have not tried.
- **Claws are thin and point forward.** From the front they foreshorten to small points. They show clearly from the sides and three-quarter views.
- **Outline warnings.** The front outline is 0.77 and the side is 0.71. Both are under the 0.8 warning line, but the side is just above the 0.7 fault line. The 36 triangles that join arms to the trunk are the same warning as before.
- **No melee animation.** The game's zombie slash still will not play on Gordon's skeleton, as before.

**Licences:** the body mesh comes from hunyuan3d-mini, whose source headers say non-commercial. This is for the test only, as you accepted.
