The sprite builds OK. It is written as `work:sprites/steam1.spr`, with a sheet and an animated preview beside it. It still carries a shape warning (overlap 0.5 against the 0.8 bar), so it is not as close to the original as I'd like.

**What it is:** a steam puff, class `smoke puff`, placed as an `env_sprite`. It is 32x48 with 16 frames at 10 fps. It is not a loop: it grows, peaks around frame 6 to 7, and dissolves to faint wisps by frame 14. Type is `parallel oriented`, format `index alpha`, origin centre. The spec is only in this chat, not saved as a file.

**Against the original, from the last build:**

| Measure | Original | Ours | Bar |
| --- | --- | --- | --- |
| Mean colour (delta E) | n/a | 0.6 | 15 or under |
| Dark share | 0.63 | 0.66 | within 0.05 |
| Border light | 0.002 | 0.005 | near 0 |
| Frames | 16 | 16 | n/a |
| Shape overlap (mean) | n/a | 0.50 | 0.8 |
| Envelope peak | n/a | 0.33 | 0.2 to 0.6 |

**Still open:**
- **Shape:** frames 1 to 9 overlap about 0.7, and the late frames fall off (frame 11 at 0.37, frame 14 at 0.06). Frame 15 is empty where the original has faint wisps. Moving the cloud down, adding spheres, and shortening the decay did not close the gap; the shorter decay made colour and border worse.
- **Lighting:** the billow's `light` option does not work. A number gave an internal spread error, and a vector or a word gave an empty sprite, so the default top-left lighting is used.

I took the sheet as 8 columns of 64-pixel cells (reading the sheet by eye, not by checking its dimensions), so the per-frame shape numbers depend on that assumption.
