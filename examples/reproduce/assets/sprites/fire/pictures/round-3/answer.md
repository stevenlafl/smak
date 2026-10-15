The sprite is built and the build says OK. It's written to the work folder as `sprites/fire.spr`, with a contact sheet and an animated picture beside it. It is close to the original but not an exact match: the shape overlap is still just under the bar.

**What it is:** a torch-style flame, a tongue of fire on a dark ground, bright at the base and tapering up. It is a loop, meant to play as an `env_sprite` (a sprite placed in the map).

**The spec I ended on:**

| Field | Value | Source |
| --- | --- | --- |
| Size | 32 x 96 | original facts |
| Frames in file | 15 (loop of 14, first frame repeated at end) | original facts, 15 frames |
| Type | parallel oriented | original facts |
| Format | additive (black is clear) | original facts |
| Class | fire loop | chosen to match a flame |
| Origin | bottom (flame stands on its base) | chosen from the picture |
| Frame rate | 10 fps | my guess; not in the original's facts |
| Layer | fire, ramp `fire`, width 1.0, height 2.4, taper 0.2, tongues 0.5, gain 1.0 | tuned against the reference |

**Measured against the original (the report's own numbers):**

| Measure | Original | Mine | Bar |
| --- | --- | --- | --- |
| Frames | 15 | 15 | match |
| Mean colour difference (delta E, lower is closer) | — | 9.2 | 15 or under |
| Share that is dark | 0.38 | 0.35 | within 0.05 |
| Shape overlap with original | — | 0.65 | 0.7 |
| Border brightness | 0.275 | 0.106 | — |

The report also says the sprite is within range of Half-Life's own fire loop on all 5 of its measures.

**What's still off:**
- **Shape overlap (0.65 against a bar of 0.7).** The flame now reaches the top of the frame, as the original does. The remaining gap is mostly in the lower frames, where the original's lit area is wider. Lower frames are where I'd look next.
- **Border brightness.** The original's edge is brighter (0.275 against 0.106), so my flame fades out more at the frame edges.
- **Frame rate.** 10 fps is a guess. If you have the original's rate, set `fps` and it will change.

**Tuning I tried and rejected:** a soft glow layer filled the frame with a block of light rather than a flame shape, and a higher gain pushed the colour out of the bar (delta E 15.9 to 17.2).

**Things I couldn't confirm:** the `reference` field only takes one cell size, and these cells are 32 wide by 96 tall. I gave it the width, 32, and the report measured the sheet as 15 frames, which matches. I didn't read the kit's source to check how the height is read, because access to it was denied.
