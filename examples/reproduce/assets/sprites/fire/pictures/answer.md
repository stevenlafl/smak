`sprites/fire.spr` is built and the build says OK, but one shape warning is left, so it is not as close to the original as I'd like.

**Settings, same as the original:** 32x96, 15 frames, type parallel oriented, format additive, flame origin at the bottom. I set it as a one-shot rather than a loop, so no extra wrap frame is written. The frame rate of 10 was my choice, since the original's wasn't given.

**Against the original:**

| Measure | Original | Mine | Verdict |
| --- | --- | --- | --- |
| Mean colour (delta E) | – | 7.6 | near (15 or under) |
| Share dark | 0.38 | 0.39 | near (within 0.05) |
| Frame count | 15 | 15 | match |
| Border brightest | 0.275 | 0.189 | slightly darker edge |
| Shape overlap, mean over frames | – | 0.75 | under the 0.8 bar |

**Still off:** the shape warning (overlap 0.75, bar 0.8). Frame 0 is the one named: the original's core runs rows 46-84 and mine rows 48-77, so my hot centre is shorter. Frames 7, 11 and 12 score lowest, at 0.68 to 0.70. The frame-to-frame flicker is 1.89 against Half-Life's fire loops (1.33 to 1.79).

**How it's made:** a faint fire layer, plus two glow layers masked to the original's lit outline. The masking is how I got the broad, edge-to-edge flame; it uses the original's outline only, not its colours.

Looking at the sheet, my flame has a smoother, more uniform glow than the original's licking tongues.

I stopped here, since the last few builds each moved the overlap by only 0.02 to 0.03.
