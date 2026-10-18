The build says **OK: built, and every check passed**. It still reports two warnings, listed below.

**What I changed**

- **Hide:** I replaced the zebra stripe picture with a softer dappled picture, `work:gen/hide_soft_s0.png` (seed 0 of four takes from the local shape generator). The tone is now a paler yellow-tan, and the picture is scaled up from 24 to 60, so the spots are body-sized instead of grain.
- **Body:** a squat dome, lower and wider, with the head built into its front blob. The old separate head part is gone, because it floated when the creature bent in a jump.
- **Eye:** it now sits on the front-top of the head, set in the body's blob, with the pupil in front of it.
- **Legs:** the three legs are unchanged in count. The front leg is now part of the body blob, so it stays attached in the crouch.

```
                 before            now
height           48.1              47.1  (spec 45)
length           50.2              47.8  (spec 49)
triangles        496               496
legs             3                 3
eye placement    beside body       on the head's front
hide             zebra stripes     dappled spots
```

**What the build still reports**

- A warning that 13% of the triangles stretch past three times their length in the run (`run2`). It is on the front and hind leg joints.
- A warning that 8 triangles join the two thighs. They are where the legs meet at the hips.

Both are warnings, not faults, and the build says OK. I did not fix them, because the legs' thickness was already at the edge of what built clean.

**What I could not do**

- I could not put it beside the game's own houndeye. The original brief said its own model is not available, so the comparison with the game's own has not been run. The line-up result from the person is the only evidence on the new look.
- The hide now reads as leopard spots, not stripes. The brief asked for striped and dappled. The stripe picture read as zebra, so I traded the stripes for spots. If the person wants stripes back, I need a new picture with broad, low-contrast stripes.
- The attack is still not fixed. That is the open choice from last time: a side-view charge strip for the `motion` key, or a hand-keyed edit. The sequence `shoot_1` still moves only the arms and spine.

**Files**

- The spec is `work:houndeye.spec.json`; the model is `work:houndeye.mdl`; the new sheet is `work:houndeye-sheet.png`.
- The new hide is `work:gen/hide_soft_s0.png`. The spec no longer uses `hide_stripe_s1.png`.
- I did not delete the old files in the work folder (the stripe takes, `hide_s0`/`s1`, the older `houndeye_*` takes, `houndeye-sheet-rev.png` and `shoot_1.json`). I have no delete tool here; say which to remove.
