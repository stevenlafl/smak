The sprite is built and the build says OK, but four warnings remain, mainly on how closely the shape matches the original. It is at `work:sprites/steam1.spr`, with `-sheet.png` and `-animated.png` beside it.

**What it is:** a steam puff. It starts as a small dot, grows to its fullest in frames 4 to 8, then thins into wisps and is gone by frame 14. It is one-shot, not a loop.

**The spec as built:**

| Field | Value |
| --- | --- |
| Name | `sprites/steam1.spr` |
| Class, use | smoke puff, `env_sprite` (renders as render mode 4, Solid, at 10 fps) |
| Size, frames | 32x48, 16 frames, not looped |
| Type, format | parallel oriented, index alpha |
| Origin | centre |
| Layer | one billow (a lit cloud): 24 spheres, spread 0.5, size 0.34, growth 0.6, rise 0.25, drift 0.12, dissolve 0.5, envelope attack 0.1, decay 0.8, finish edge 2 |
| Colour | `ramp: "reference"`, the original's own colour at each brightness, read off the contact sheet |

**How it measures against the original:**

| Measure | Original | Mine |
| --- | --- | --- |
| Mean colour difference (delta E, 15 or under is near) | | 2.7 |
| Share that is dark | 0.63 | 0.66 |
| Light at the frame border | 0.341 | 0.341 |
| Brightest frame's place in its play | 0.40 | 0.33 |
| Frames 0 and 15 | dot / faint | empty / empty |
| Shape overlap (bar 0.8) | | 0.49 |

**What is still off:**
- **Shape overlap, 0.49 against the 0.8 bar.** Frame by frame the puff matches the lit area well in frames 2 to 9 (about 0.65 to 0.71), but misses the original's late frames 11 to 13, where its core lingers. Frame 0 is empty where the original has a small dot. I tried four routes and none passed the bar: a larger cloud (it spilled past the frame edge), a longer attack, a slower dissolve, and the layer mask below.
- **The mask.** Adding `mask: "reference"` raised the overlap to 0.56 to 0.58, but it dragged the border light down to 0.02 to 0.05 against 0.341 and moved the peak early to 0.27. I left it out, so the final version is the unmasked one.

**The reference:** the input folder was not readable from here (a permission prompt), so I used the server's copy of the same contact sheet, `pictures/frames.png`, and `pictures/facts.txt` (32x48, 16 frames, parallel oriented, index alpha). The colours come from that sheet, via `ramp: "reference"`, as the guide suggests for copying a picture. The report measures the sprite against that same sheet.
