The sprite builds OK, but the build still reports two warnings: the peak sits at 0.8 of the play rather than the last frame, and the shape overlap is 0.72 against the 0.8 bar.

**Result:** `sprites/xspark1.spr` is written to the work folder as `work:sprites/xspark1.spr`, with a sheet and an animated preview beside it. I could not open the original's input folder directly (it is outside the work folder), so I measured against the contact sheet in `pictures/frames.png` and `facts.txt`.

**What it is, as built:**
- **Type and format:** `parallel`, `additive` (black is clear). The report places it as an `env_sprite`, render mode 5 (Additive).
- **Class:** `glow`. The `sparks` class is one-shot and must end dark, and the original's last frame stays bright, so `sparks` faulted.
- **Size and frames:** 32x32, 11 frames, played once (`loop: false`). A loop would write a repeated first frame and make 12 frames, so I did not loop it.
- **Colours:** a cyan halo, colour (0.235, 0.745, 1), with a white hot centre. Colour is read from the reference frame by frame (`ramp: "reference"`).
- **Shape:** a soft glow core (radius 0.9, smooth falloff, gain 0.5) plus nine soft blobs (radius 0.34, spread 0.65, gain 0.8) that are placed afresh each frame, so the cluster flickers the way the sheet shows.

**Measured against the original's sheet:**

| Measure | Original | Mine |
|---|---|---|
| Mean colour (delta E, 15 or under is near) | — | 1.9 |
| Share of dark pixels | 0.46 | 0.44 |
| Border brightness | 0.145 | 0.149 |
| Frame count | 11 | 11 |
| Shape overlap (bar 0.8) | — | 0.72 |
| Brightest frame (share of play) | 1.0 | 0.8 |

**Guesses, not measured from the original:** the frame rate (10 fps), `use: env_sprite`, and `loop: false`. The sheet carries no timing, so I chose these defaults. They are the first things to check against the original's data if it has any.

**Not yet passed:**
- The peak timing. Changing the envelope attack to 1 still peaks at 0.8, so the peak is driven by where the blobs land, not by the envelope.
- The shape overlap of 0.72. Widening the blobs or the halo pushed the dark share out of line, so I stopped at the best trade-off I found.

The spec was passed inline to the build and not saved as a file. If you want it kept for re-running, I can write it into the project as a script.
