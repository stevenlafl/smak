The model builds to OK and is written as `scientist.mdl` in the work folder (`work:scientist.mdl`, with its spec at `work:scientist.spec.json`). It is not a close match yet, so treat it as a first pass.

**What I built:** a character on Gordon's skeleton from the Half-Life install (`floor: 0`, so the feet stand at the origin). The body is one carved shape made from the six-view sheet and the four angle pictures, at 33.4 × 21.6 × 68 units against the original's 33.3 × 21.7 × 68. The pose was fitted to the pictures (outline overlap 0.88), and the colours and markings come from projecting the pictures onto the shape. The tie, glasses, grey side hair, blue shirt and brown shoes are in the texture, not in separate geometry. The carve is 680 triangles, under the base's double-count warning.

**What is still off:**
- **Texture:** the projected colour is blotchy. The blue shirt and striped tie read as dark smudges, not clean stripes, and the front shows a few grey streaks on the coat.
- **Below view:** the report warns that the underside's colour differs from the picture (mean 11.7, worst cell 41, at the bottom middle).
- **Run animation:** the carved body's lower corners flare into long triangles at the feet in the run strip. The report does not flag this, and I did not fit the run to `motion.png`, so it still shows the base's run with the carved body.
- **Parts:** there is no separate tie, glasses or shoe geometry, so anything the pictures do not show exactly comes out soft.

I did not change the game's files or the base skeleton. The kit reports the base as the Half-Life install's `valve/models/player/gordon/gordon.mdl`, which is the only game file it used.
