The houndeye is built as `work:houndeye.mdl` (438 KB), with its spec at `work:houndeye.spec.json` and a sheet at `work:houndeye-sheet.png`. The build reports OK with every check passed, but it still carries one colour warning (below).

**Choices I made**

- **Skeleton: `headcrab.mdl`, not Gordon's.** Gordon's skeleton is two-legged, so the houndeye would have stood upright. Bullsquid and islave keep 6 and 8 of their animations in separate files, which this tool cannot carry. The headcrab has four legs, all 21 of its animations in one file, and an idle stance as its first animation.
- **Body: one carved shape from the six sides and four close angles,** at 120 cells, mirrored from its left half and 694 triangles. Its size is 49.3 by 33.5 by 44.7, with the feet on the floor (`floor: 0`).
- **Colours and markings** are painted from the same pictures, so the stripes, the belly and the dark mouth come from the original's own renders.
- **Stance** comes from the pictures' outlines, so the first frame stands as the original does without any pose fitting.

**Checks**

| Check | Result |
| --- | --- |
| Outline against the original, by view | 0.89 (front, back) to 0.96 (below) |
| Colour against the pictures | Warning: mean difference 10 to 12 in the back and top views, worst cells 45 to 50 at the top middle and lower left |
| Closed shell | Passes at 120 cells; 128 cells failed on the mirror seam |

**Known limits**

- **Motion is poor.** The headcrab's bones are about a third of the houndeye's size, so the carved body smears at the mouth in its walk (the dark flap in the walk strip). The stills are unaffected, but I did not fit the run in `motion.png`.
- **The mouth is painted, not hollow.** It reads as a dark recess from the same cameras, but the body is solid behind it.
- **Scratch files left in the work folder:** `probe_headcrab`, `probe_bullsquid` and `probe_islave` (each with its spec and sheet), from choosing the skeleton. I have no tool to delete them, so they are safe to remove by hand.

I could not open the reproduce folder directly (permission was not granted), so I used the copies of the pictures in the work folder.
