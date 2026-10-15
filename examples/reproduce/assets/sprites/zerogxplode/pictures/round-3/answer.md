The sprite builds with OK, but it falls short of the original on shape. I'd call it a close approximation, not a match for the judge.

**Output:** `work:sprites/zerogxplode.spr`, with `-sheet.png` and `-animated.png` beside it. It is in the server's work folder, not in the reproduce folder, so copy it from there if you want it in the repo.

**What I built** (spec in this chat, not saved to a file):
- **What it is:** a one-shot explosion, a cloud of lit smoke-ball lobes with debris flecks, placed as a temporary entity (`tempent`).
- **Size and frames:** 64x64, 15 frames, not looped. The cloud starts small at frame 0, is largest around frames 2 to 5, then shrinks and cools.
- **Colours:** a white-hot core early, then cream, tan and brown with a dark rim, using the explosion colour ramp.
- **Motion and fade:** the envelope peaks mid-life and ends at zero, so the last frame is dark and the border stays dark.
- **Type and format:** `parallel` (faces the camera), `additive` (black is clear), render mode 5, 15 frames per second.

**Measured against the original:**
| Measure | Original | Mine | Bar |
| --- | --- | --- | --- |
| Mean colour (colour difference, delta E) | reference | 6.6 | 15 or under |
| Share that is dark | 0.72 | 0.62 | within 0.05 |
| Shape overlap across frames | | 0.42 | 0.7 |
| Border light | 0.005 | 0.004 | dark |

**Known gaps:**
- The shape overlap is well under the bar. The original is broader in frames 2 to 5 and has a more even lit body. I could not close that with the tuning I tried: larger growth filled the square and left light on the border.
- Frame 0 starts a little too bright against the Half-Life explosion range, and it is blank where the original has a small flash. Setting the attack to zero gives the flash, but the attack at 0.03 or above drops it.
- The original's late frames keep a faint ember at frame 14. Mine goes blank there.

If you want me to keep going, the next thing I'd try is a second, smaller billow layer for the early flash, then re-measure the overlap.
