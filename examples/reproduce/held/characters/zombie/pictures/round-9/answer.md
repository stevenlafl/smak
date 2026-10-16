The zombie is not finished. The last build (`work:zombie.mdl`) says **NOT OK**, and I could not get it to OK in this session.

**What the build is:** a carved body from the six-sided sheet (`sides.png`) on Gordon's skeleton, `floor: 0`, `symmetric`, 128 cells, texture projected from the sheet and the four angles, with the arm pose set by hand. It has about 488 triangles.

**What still fails** (from the report):

| Check | Result | Asked |
| --- | --- | --- |
| Outline vs front picture | 0.64 (fault under 0.7) | 1.0 |
| Outline vs top and below | 0.49 and 0.49 | 1.0 |
| Outline vs back-right (yaw 215) | 0.44 | 1.0 |
| Length (x) | 34.7 | 38.5 |
| Width (y) | 45 | 53.8 |
| Thin pieces lost | 30, mostly the claws and the arms' ends | none |

**Why I could not close it:**

1. **Claws land about 36 units low.** `fingers` parts are placed in the base's bind pose without the floor lift that the carved body gets. In the render they sit near the knees, not at the wrists. Moving the carve to `at: [0,0,-36]` made the body and the bones agree, so the body renders on the floor. The claws still did not follow. Claws built as `cylinder` parts on the hand bones did not land on the hands either.
2. **The arms do not reach out.** The zombie's hands sit about 27 units out and about 28 forward. Gordon's arm keys (`x` and `y` turns on the upper arms) bring the hands down, but the carved arms, which hang on those bones, hug the body. Outline and width both suffer.
3. **Pose fit** (`pose: { fit: true }`) reached only 0.57 overlap and put the hands in odd places, so I did not keep it.

**What I did not do:** I did not try the walk (`motion`), and I did not add a second skeleton.

**Choices for you:**
- **(a)** I report the claw lift to the smak maintainers (the `fingers` part and the bind pose) and stop here. This is my recommendation, because the claw problem is in the kit, not the spec.
- **(b)** I keep going on the spec: hand-built arms with `span` and `blob` pieces, so the arms can reach out without depending on the bones. This is more work and may still not reach 0.7 on the top view.
- **(c)** You have another base with arms that reach out and down (a monster skeleton, if one is on your machine). I would check it first.
