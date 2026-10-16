The scientist is built as `work:scientist.mdl` on Gordon's skeleton with `floor: 0`. The build says OK, with one colour warning left.

**What it is**
- Carved from the six-side sheet and the four angle pictures, so the outline follows the originals: 680 triangles, one body, painted from the pictures (glasses, grey hair at the sides, blue shirt, striped tie, white coat, brown shoes).
- Stance fitted to the pictures. The first frame matches the original's stride, with the spine turned 3 degrees.
- Size is 33 long, 21.5 wide and 68 high, against the original's 33.3, 21.7 and 68.
- Each view's outline matches the picture at 0.85 to 0.91 (the report's measure, with 0.8 as the warning line), and its own carve at about 0.98.

**What I chose**
- Gordon's skeleton and animations, since the scientist has none of its own. The run cycle is Gordon's, so the coat hem flaps in a few frames of it (frames 9 and 13 of `run2`).
- The triangle target is 680. The base body is 362, so a character over 724 is a fault.
- Pictures' stance over a stock idle, since the original's first animation is not available to check.

**Left to fix or accept**
- One warning remains: the head seen from below (colour mean 11.8, worst cell 37) takes some of the hair's colour. I tried 600 and 680 triangles, and each left one colour warning, in a different view.
- The tie is a soft red patch at a distance, where the original has crisp stripes.

Previews are in the work folder as `scientist-fl.png` and `scientist-fr.png`, and the spec is `scientist.spec.json`.
