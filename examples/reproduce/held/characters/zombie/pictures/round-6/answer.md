The build is **NOT OK**, so I'm not delivering it as finished. The file on disk is the best variant I reached, `work:zombie.mdl`, but it still has faults the build reports.

**What the current file is**
- Kind `character` on `player/gordon/gordon.mdl` (found in Half-Life's `valve/models`), `floor: 0`, size requested 38.5 × 53.8 × 68.4. The report measures 38.3 × 52.9 × 68.2.
- One carved body from the six-sided sheet plus the four angle pictures, at 160 cells and 720 triangles. Its pose is pinned to the stance the fit chose: left thigh turned 9 degrees, left upper arm turned 21 degrees and 6 degrees out.
- Paint comes from `project` (the sheet and the four angles), at 512 × 512.
- The per-view outline match against your pictures is 0.79 to 0.87.

**What still fails**
- **FAULT, loose pieces at rest** (`look_idle` frame 0): 19 pieces, two of them 9.1 and 3.6 units from the body. These are finger tips the carve kept as separate shards. The same problem shows in every animation.
- **WARN, thin parts lost:** the carve dropped 57 fingers and claws thinner than a cell. The tool asks for these as parts of their own.
- **WARN, outline:** the left view is at 0.792, under the 0.8 line.

**What I tried, and why I stopped there**

| Variant | Worst outline | Loose pieces at rest | Result |
|---|---|---|---|
| Carve 128 cells, 700 triangles, pinned pose | 0.77 (yaw 35) | 6.7 and 6.1 | Floats, outline warn |
| Carve 160 cells, 720 triangles (on disk) | 0.79 (left) | 9.1 and 3.6 | Floats, thin-part warn, outline warn |
| Plus 8 claw tubes on the hand bones | 0.37 to 0.64 (yaw -35, yaw 145, back, top) | 3.7 to 5 | Outline faults |
| Carve 380 triangles | 0.28 (yaw -35) | 7 | Outline fault |
| Blobs at the joints | Pose fit collapsed (0.43) | Blobs fell below the floor | Abandoned |

- **Claws break the outline check.** Thin claw tubes placed a few units off the picture's claws lower the cell-based match a lot. Dropping the top and below views did not help.
- **The pose fit moves with the parts.** Adding claws changed the fitted arm angles, so I pinned the keys.
- **Attach offsets use the unlifted base frame.** Parts attached to a bone take offsets in the base's frame, which is 36 units lower than the model's floor-lifted frame. This cost me a few runs; it may be worth a note in the smak docs.
- **Motion not used.** `motion.png` (the walk) is not matched; the build holds the standing pose only.

**Choices for you**
1. **Accept with waivers:** allow the body's loose pieces (`allow.floating`) and accept the thin-part and outline warnings. That gets to OK, with the fingers visibly as dark shards rather than claws.
2. **Hands rebuilt by hand:** make the claws as proper parts, accept a lower outline on the arms, and have the build name the faults for the arms.
3. **Closer pictures of the hands:** if you can give me close-ups of each hand from front and side, I can place the claws precisely enough to pass the outline check.

I'd pick option 3, then option 1 as the fallback. Tell me which, and I'll finish it.
