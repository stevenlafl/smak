The sprite is built and the build says OK, with one warning left: its shape overlaps the original at 0.68 against the 0.8 bar. The file is `work:sprites/steam1.spr`, with `steam1-sheet.png` and `steam1-animated.png` beside it in the server's work folder.

**What it is:** a steam puff. It starts as a faint dot, grows into a white-grey cloud around frames 4 to 8, then thins and fades to nothing by frame 15. It is not a loop.

**The spec I built from:**
- Name `sprites/steam1.spr`, class `smoke puff`, use `env_sprite`, 32 by 48 pixels, 16 frames, not looping, 10 frames a second.
- Type `parallel oriented`, format `index alpha`, origin at the centre.
- One `billow` layer, masked to the original's lit area frame by frame, with its colours read from the original (`ramp: "reference"`). Its peak is at 0.4 of the play, as in the original.
- The reference is `pictures/frames.png` read as 8 columns of 64 by 96 cells. The default 128 cell misreads this sheet, so I passed 96.

**Measured against the original (the last build):**

| Measure | Original | Mine | Result |
| --- | --- | --- | --- |
| Mean colour (delta E) | n/a | 0.7 | near (15 or under) |
| Share dark | 0.63 | 0.66 | near |
| Frames | 16 | 16 | match |
| Brightest frame, share of play | 0.40 | 0.40 | match |
| Light at the border | 0.341 | 0.399 | within range |
| Shape overlap, mean | n/a | 0.68 | below the 0.8 bar |

**What is left:** the shape overlap is 0.68. Frames 3 to 11 sit at 0.88 to 0.92, but the faint first frame (0.17) and the late frames 12 to 14 (0.47 to 0.74) pull the mean down. Changing the dissolve or the decay to fix the late frames made the middle too small, so I reverted. A closer match would likely need a per-frame rebuild of the cloud's outline, which the spec does not offer directly.

I did not save the spec as a file in the project; it was passed inline. I can save it as a `.json` next to the sprite if you want it kept for a later rebuild.
