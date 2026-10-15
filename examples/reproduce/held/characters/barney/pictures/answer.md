The model is built as `barney.mdl` in the work folder. The build header reads OK, with one WARN left (see below).

**What it is:** a carved body on Gordon's skeleton (`player/gordon/gordon.mdl` from the Half-Life `valve` folder), with `floor: 0`. Gordon's 77 animations are kept. The body is one carved shape from the six sheet views and the four angled views. Its colours and markings (blue shirt and trousers, black vest, the SECURITY lettering, the chest badge, the holster, the boots) are projected from the pictures. The size is 22.9 long, 30.2 wide and 75.1 high, against 22.8, 30.2 and 75.3 asked for.

**Pose:** the stance is fitted to the pictures. Gordon's first frame was turned at the left leg and the left arm joints, so the first animation's frames are changed slightly. The render at the front-left camera matches the reference closely.

**Checks:**
- `check` says "fit for goldsrc" with 1400 triangles in all: 720 for the body, plus the base's own.
- The body is capped at 720 triangles because a character over twice the base's 362 is a FAULT.
- The build's WARN: the underside view's worst cell is 47, over the 45 limit, at the lower right. The mean is 8.8, which is fine. I think it is the black glove or holster there, but I did not confirm it.

**Limits to know about:**
- The judge-style outline overlap against each picture is 0.85 to 0.91. The carve's own outlines match at 0.98, and the renders look close, so I don't know where the gap comes from.
- The helmet, the face and the fists are carved shapes, not separate parts, so the face is soft at this size.
- The running motion in `motion.png` was not used. The character keeps Gordon's run.
