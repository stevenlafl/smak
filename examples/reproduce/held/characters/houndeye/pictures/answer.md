`houndeye.mdl` is built. The build says OK, and it is in the work folder with its spec (`houndeye.spec.json`).

**How it's made**
- **Base:** Gordon's skeleton from the Half-Life install (`player/gordon/gordon.mdl`), with `floor: 0` so the feet stand at the origin.
- **Body:** one carved part from the six-sided sheet plus the four quarter views. The shape is a visual hull, so its outline matches the pictures, and it sits in the stance of the original's first frame.
- **Colours:** the original's pictures are projected onto the shape. The maw, stripes and spines come from the pictures, not from paint.
- **Size:** 49.2 long, 33.6 wide, 44.6 high, against the original's 49.3, 33.5, 44.7.
- **Triangles:** 800, which is over the 362 of Gordon's own body but within the 500 to 1,000 the spec gives for a large monster. I raised it because at 362 the dorsal spines were soft bumps instead of fins.

**Outline match:** the shape shares 0.94 to 0.995 of its outline with each of the ten pictures.

**Known gaps**
- **Run animation:** Gordon's skeleton is biped and the houndeye is four-legged, so its animations use Gordon's human gait. The run strip shows the legs stretching into thin wedges. I did not fit the original's run from `motion.png`; that would only partly fix a biped gait on a four-legged body. A proper match needs a quadruped skeleton.
- **Warnings still showing:** the build warns that the back view's colours differ from the picture (mean 11.4, worst at the top middle of the back, where the chevron stripes are). It also warns that 800 triangles is over twice Gordon's body. Both are advisory, and the build still passes.
- **Fine detail:** the original's dark maw is slightly flatter and more recessed than mine, and its legs are a little thicker in the front view. I did not chase these.
