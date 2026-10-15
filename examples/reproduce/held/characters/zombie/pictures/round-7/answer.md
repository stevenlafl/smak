The zombie character builds and the build says OK, with some warnings left. The file is `zombie.mdl` in the work folder (with `zombie.spec.json` beside it). I did not copy it into the game folder.

**What it is:** a character on Gordon's skeleton (`valve/models/player/gordon/gordon.mdl`, found under the Half-Life install), `floor: 0`, keeping all of Gordon's 77 animations. The original zombie's own model was not used.

- **Body:** carved from the six-side sheet (`sides.png`), 450 triangles, so its outline follows the original's silhouette.
- **Claws:** eight tubes, four per hand, hung on the hand bones, 16 triangles each.
- **Colours and markings:** projected from the sheet and the four angled pictures onto the texture, 512 by 512.
- **Stance:** the arms are set forward and the spine leans forward 8 degrees, by fixed keys rather than the automatic fit, because the fit moved with every part I added.

| Measure | Original | Built |
| --- | --- | --- |
| Length (x) | 38.5 | 37.7 |
| Width (y) | 53.8 | 53.2 |
| Height (z) | 68.4 | 68.4 |
| Triangles | none given | 578 (limit 724, twice the base's 362) |

**Warnings still in the build (not faults):**
- The carve drops the thinnest strands of the original, so the claws are four solid tubes per hand, not the original's fine fingers.
- Outline overlap with the pictures is 0.70 to 0.80 in most views, under the 0.8 the check wants. The front-left and back-left views sit at 0.71 and 0.70.

**Known gaps:**
- The body is boxier than the original. The torso and legs are bulkier, and the coat does not taper as it does in the pictures.
- The right arm's claws are faint from the front-left camera.
- Walking is rough: dark slivers appear at the feet in the walk strip. The first frame is what I checked. I tried fitting the walk to `motion.png`, but the fit scored worse (0.53), so I left the walk as Gordon's own.

I did not save a memory note on this: the memory tool is disabled in this session.
