The build of `seal.mdl` says **OK** and every check passes. The contract with `player/gordon/gordon.mdl` holds: all 34 bones, the 171 animations in the same order, and the same attachments and bodyparts.

**What it is**
- **Size:** 25.0 long, 25.5 wide, 70.1 high. The original is 23.9, 24.5 and 70.1, so it is about a unit over in length and width.
- **Pose:** it stands as the original does in frame 0 of its first animation. It is hunched, the left leg is forward, the boots splay outward, and both gloved hands meet in front of the belt on the right side.
- **Parts:**
  - a black balaclava head and neck
  - a black vest, two pieces on the spine bones, with a flat back that slopes forward at the top
  - an olive shirt band and trousers, with puffy shoulders and sleeves
  - grey elbow pads and big grey knee pads
  - black gloves
  - laced boots: a shaft plus a rounded foot
- **Colours and markings:** all ten of your pictures are projected onto the shape: the six sides and the four close angles. That carries over the vest's pouches and zip, the trident badge on the back, the belt, the knee-pad straps, the bootlaces and the orange around the eyes.
- **Triangles:** 1,336.

**Checked against the originals:** I compared it from the same cameras: the front, both sides, back, yaw ±35 and yaw 145. The outlines line up closely. Two judgement calls in the fit:
- The original's left upper arm sits about 3.5 units behind the line of its shoulder bone, so I placed it where the pictures show it rather than along the bone.
- The vest is narrowed to the width the pictures show.

The run and the forward dive (`dive_f_akimbo`) both animate cleanly, and the body stretches out flat in the dive as `stunt.png` shows.

**Where it still differs:**
- The trident badge on the back is softer than the original's. Everything shares one 512×512 texture, so the badge only gets a small patch of it.
- The vest is an oval turn with 12 sides. Its edges are rounder than the original's boxier vest, which shows most in the back-left view.
- The build leaves one note: the right forearm passes 0.55 units from the vest. That isn't a joint meant to close, so I left it.

There is also a leftover test file, `work:boottest.mdl`, from trying out the boot shape. It isn't part of the model and can be deleted.

Files are in the work folder:
- `seal.mdl`
- `seal.spec.json`
- `seal-sheet.png`
