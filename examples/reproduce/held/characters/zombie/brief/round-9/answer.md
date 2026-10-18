The build says OK. The left claws now sit on the left hand, and the right claws are closer but still stand a few units outside the coat.

**What I changed**

- **Claws moved from the hand joint to the forearm joint.** Each `fingers` part now hangs on `Bip01 L Arm2` / `Bip01 R Arm2` instead of the hand bone, with `palm: 8`. The hand joint sat about 10 units outboard of the mesh's hand, so the claws floated off the side. The forearm joint plus `palm` puts the claws at the hand, and because they hang on the forearm bone they move with the arm in every animation. The walk strip shows them following the arms.
- **Arms still at 30 degrees out.** I tried pulling them in to 16, 22 and 26 degrees to bring the hand joints closer, but each one tripped a FAULT: the side pictures see through the body, at 0.26% to 0.32%. The passing configuration measured 0.11%, so I kept 30 on both arms.
- **Body kept at 500 triangles.** I also tried 560, which still failed the see-through check, so I reverted it.
- **Nothing else changed.** The parasite, tentacle, coat, pose, bind and floor settings are as they were.

**What's left**

- **Right claws:** in the front view they stand a few units outboard of the coat, because the mesh's right hand is tucked behind the coat. Fixing that needs the body's right arm redrawn, or the arms angled differently, which brings back the see-through fault. I did not verify the right side from every angle.
- **Attack frames:** Gordon's skeleton has no `attack` animation, so the frames the person reviewed as "attack" are not in this model. Walk, run and idle are the ones to judge.
- **Warnings (not faults):** the front outline is 0.78 against the pictures' (under the 0.8 line), 36 triangles join arms to the trunk and may tear, and some look parts take a neighbour's colour.
- **Triangles:** 658 in use, against a limit of 724 (twice the base's 362).

**What I made**

- `work:zombie.mdl` (1.1 MB), with its spec at `work:zombie.spec.json`, on Gordon's skeleton with `floor: 0`, 68 units tall.
- Its body is the earlier mesh: zimage-turbo picture, hunyuan3d-mini shape, hunyuan3d-paint sides. Claws are `fingers` parts, and the parasite is a sphere on the head with one tentacle.

**Licences:** the mesh is from hunyuan3d-mini, whose source headers say non-commercial. You accepted the local generators' licences for this test only.
