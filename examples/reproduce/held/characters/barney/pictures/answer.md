The build says **OK**: "built, and every check passed." It still prints three warnings about outlines and look, which are described below. The model is `barney.mdl` in the work folder, with its spec at `work:barney.spec.json`. I didn't render the original and mine through the same camera myself; the figures below are the build's own measures.

**What it is:** a standing security guard, built on Gordon's skeleton with `floor: 0`. It keeps all 77 of Gordon's animations, and `size` is set to 75.3 high, 22.8 long, 30.2 wide.

**Built from the pictures:**
- **Body:** one blob hung on Gordon's joints: chest and vest, hips, neck, head, helmet, arms, fists, legs, boots and holster. Joints give model-space positions, so the body comes out where the bones put it.
- **Pose:** the right forearm is turned 90° at the elbow, because Gordon's right hand holds a gun forward. The first frame has both arms hanging.
- **Colours and markings:** all ten pictures projected onto the body (the six sheet views and the four angles). That gives the black vest, lavender shirt and sleeves, the "SECURITY" lettering, the grey helmet, boots and skin.

**Measures against the originals:**

| Measure | Built | Original |
| --- | --- | --- |
| Height | 75.9 | 75.3 |
| Length | 21.6 | 22.8 |
| Width | 29.6 | 30.2 |
| Outline overlap, front | 0.80 | 1.0 is a perfect match |
| Outline overlap, back | 0.86 | |
| Outline overlap, right | 0.79 | |
| Outline overlap, left | 0.73 | |
| Outline overlap, top | 0.57 | |
| Outline overlap, below | 0.61 | |
| Outline overlap, the four angles | 0.64 to 0.67 | |

The build warns below 0.8, so the left, top, below and angled views are short of it. Colour difference is 4 to 8 in most views, and 15 from below.

**Known gaps:**
- **Shape:** the blob gives round forms, where the original vest and shoulders are squared off. That is the main reason for the low outline numbers.
- **Running:** in the run animation a dark flat wedge trails from the far side of the body. Removing the seat, the back plate, or blend (blend 0 also broke the normal limit) did not remove it. The standing first frame is clean, but this is not fixed.
- **Triangles:** 1,680 against the base's 362. It's a warning only.
