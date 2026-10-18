The arms-out take at 680 triangles builds OK. Its remaining shading is facets and texture on the flank, not holes, so I'm stopping here and reporting what I changed.

## What I changed

**Cause.** The dark wedges were geometry, not paint. The first shape was reduced from about 20,000 triangles to 600, and the arms hung against the coat. The reduction joined each arm to the trunk with thin sliver triangles, and those faces turn away from the light, so they render dark. A render with lighting turned off showed the same wedges as the lit one, which points at the shape.

**Fix.** I remade the shape with the arms out, which is the kit's documented fix for this.

1. I drew four front-and-back pictures with the arms out in Gordon's stance (zimage-turbo, Apache-2.0) and used seed 0. It has the glasses, the blue shirt, the red tie, the light trousers and the dark shoes.
2. I made the shape from that front picture (hunyuan3d-mini, Tencent Hunyuan Community Licence, non-commercial, which you accepted for this test). Its sides were painted by hunyuan3d-paint.
3. I built the spec with the same pose, size and floor, projecting the new front, back and side pictures.

**Triangle counts tried:**

| Shape | Triangles | Build | Note |
|---|---|---|---|
| First picture | 598 (600 target) | OK | the wedges you saw |
| First picture | 648 | OK | wedges still there, arms still fused |
| First picture | 700 | NOT OK | pictures see through the side at 0.3% |
| Arms out | 648 | NOT OK | see-through at 0.4% |
| **Arms out** | **680** | **OK** | **current** |

The build's median for people and creatures of this size is 740 triangles, so 680 is under it.

**Files in the work folder**
- `scientist.mdl` and `scientist.json`: the current model (arms out, 680 triangles), built OK.
- `scientist-600tri.mdl` and `.json`: the version you looked at, kept for comparison.
- `scientist-650tri-fusedarms.mdl` and `.json`: the first picture at 650, kept.
- `gen/scientist_arms_s0.png` and `gen/scientist_arms_s0.obj`: the new picture and shape.

## What is left

- **The look changed.** The new picture is a different drawing. The colour check against its front picture now gives a mean difference of 21 (the warning starts at 10), up from 16. The outline agreement dropped to 0.875 from 0.896. The build still says OK, but the colour is further from the picture than before.
- **Some shading remains.** There is still a small dark notch at the right armpit, and the flank has pale streaks in the paint where no picture sees it. Under lighting, the glasses read as a dark speckled smudge in the close side views.
- **Legs and coat.** The build warns that 45 triangles join the legs to the trunk under the coat hem, which can tear in motion. I looked at the 22-frame run strip and saw no tear, but that is not a full motion check.
- **Not tested in the game.** I have not copied it into the game folder or compared it with the game's scientist, which is not available here. Please check the side-by-side in the game, as you did before.

To try it, copy `work:scientist.mdl` over the game's `models/scientist.mdl` and keep the game's copy as a backup.
