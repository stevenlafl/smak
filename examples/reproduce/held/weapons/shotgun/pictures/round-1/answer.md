The build says **OK** and the spec is `shotgun.mdl` (saved as `work:shotgun.spec.json`). The world and in-hand views match the original closely, but the first-person view doesn't, and I couldn't fix that with what the spec exposes.

**What it is:** a SPAS-style pump shotgun, 40.8 × 13.4 × 5 units like the original, in 344 triangles. It has a barrel with the magazine tube under it, a receiver with flared plates on each side, a pump with matching flares, front and rear sights, and a hooked pistol grip that slopes back into a rounded rear. The colours and markings come from your ten reference views projected onto the shape. The game's three files are written to `work:shotgun_weapon/`: `v_shotgun.mdl`, `p_shotgun.mdl` and `w_shotgun.mdl`.

**Compared with the originals at the same cameras:**

| View | Result |
| --- | --- |
| World model (`sides.png`, the four angles) | Lines up in outline, scale and framing: muzzle, sights, pump, receiver and hook are all in the same place. My copy renders a bit darker, because the light baked into the pictures gets shaded again. |
| In another player's hands (`in-hand.png`) | Same pose and placement, hook at the top, muzzle at the bottom. |
| First person (`first-person.png`, attack) | **Doesn't match.** The barrel, pump and left hand sit where the original's do, but the grip lands right in front of the eye, so a large dark slab covers the right third of the screen in every frame. |

**Why first person is off:** the build fits one shape into all three files by lining up its main axes, weighted by surface area. The game's first-person shotgun is a different model from its world model; its proportions point to a stock behind the hand. So a grip that fits the world model pulls the first-person fit about 10° tail-up and toward the camera. Things I tried that didn't work:
- **No grip at all:** first person matches well, but the hook disappears from every other view.
- **Hidden balancing surfaces inside the receiver:** barely helped first person and visibly tilted the world model.
- **Giving the grip its own bone:** doesn't take it out of the fit.
- **Pinning the size (`size: "own"`):** put the grip end at the eye instead.
- **Forcing each of the four turns:** none gives the right pose with a full grip.

**Decision for you:** a grip about half as deep keeps first person acceptable. The cost is a visibly shorter hook in 6 of the 8 reference pictures, and the texture projection would need re-aligning. I kept the true shape because it's right in most of what will be judged. Say if you'd rather have the shorter grip.

Turn settings the spec needs, since "as drawn" doesn't keep the drawn orientation:
- **World model:** `"z"`, which puts the grip at the bottom right of the top view as in the original.
- **First person:** `"z"`, the only turn with the muzzle away from the player, the grip down and the sights up.
- **In hand:** the automatic pick was already right.
