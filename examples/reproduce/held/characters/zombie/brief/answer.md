The build says OK, with three warnings and no faults. The parasite is still tan, which is the part of the feedback I could not fix.

**What I changed**

- **Claws:** longer and thicker. They are now 10 units long (was 4.5), 1.3 units thick at the hand (was 1), with 3 claws per hand (was 3, but short). The spec is `work:zombie.spec.json`, `claws_left` and `claws_right`.
- **Parasite:** replaced the sphere with a superquadric (a rounded box with eased corners), 14 by 11 by 8 units. It sits over the skull, 3 units further forward than before, so the back half no longer hangs out past the head in side view. It uses a dark olive tone (`slime`).
- **Tendrils:** the single tentacle is now two tubes, `tendril_left` and `tendril_right`, hanging from the parasite's sides and down toward the collar. A third tendril at the back was removed because it stuck out into the side view.
- **Triangles:** 690 of 724. Claws have 3 per hand, and tendrils have 3 sides each.
- **Nothing else:** the body mesh, pose, bind, floor and arm angles are as they were.

**What the build says now**

| Check | Result |
|---|---|
| Build | OK |
| Faults | none |
| Front outline | 0.829 (passes the 0.8 line) |
| Side outlines | 0.796 and 0.778 (warning, just under 0.8) |
| Triangles | 690 of 724 |
| Limb joins | 36 triangles join limbs at the trunk, which may tear (warning, existed before) |
| Colour | some parts take a neighbour's colour (warning, see below) |

**What's still open**

- **The parasite is still tan.** On a character, any surface that no picture sees takes the colour of the front picture at the same height. The parasite sits at the head's height, so it takes the skin colour. I tried projecting a generated dark olive parasite picture onto it, but the picture's outline failed the front check (0.143), so I reverted it. The fix would need either a hand touch-up of its texture in the editor, or a different approach to the colour rule.
- **Right claws** still sit a few units off the coat in the front view. Changing that means redrawing the body's right arm or angling the arms, which broke the see-through check earlier.
- **Left claws** are hidden behind the coat in the front view. They are visible from the side and in motion.
- **Walk and run** strips show the claws following the arms. There is no attack animation in this skeleton.

**What I made**

- `work:zombie.mdl`, built from `work:zombie.spec.json` on Gordon's skeleton with `floor: 0` and a height of 68.
- The body is the earlier mesh: zimage-turbo picture, hunyuan3d-mini shape, hunyuan3d-paint sides.
- Pictures of the sheet, the head close-up, and the walk strip are in the work folder.

**Licences:** the body mesh is from hunyuan3d-mini, whose source headers say non-commercial. You accepted the local generators' licences for this test only.
