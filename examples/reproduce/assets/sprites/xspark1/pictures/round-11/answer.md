The sprite builds OK and is written to `work:sprites/xspark1.spr`, with `-sheet.png` and `-animated.png` beside it. Two warnings are still open, so it is not as close as the report's bars ask.

**What it is:** a soft cyan spark cluster on a dark ground. Each frame has a bright white-cyan core, lumpy edges, and a dim cyan halo that falls off to nothing at the border.

**Spec used** (`smak.sprite/1`):
- Name `sprites/xspark1.spr`, `use: env_sprite`, `type: parallel`, `format: additive`, `origin: centre`, size 32×32.
- `reference: pictures/frames.png`, so the report measures against your original sheet.
- `frames: 10`, `loop: true`, `fps: 10`. The file has 11 frames, the first repeated at the end, matching the original's 11.
- Layer 1, `glow`: radius 0.95, core 0.3, colour (0.16, 0.75, 1), gain 0.6, masked to the reference's lit outline so the halo stays inside the original's shape.
- Layer 2, `blobs`: 9 blobs, radius 0.32, spread 0.6, core 0.4, soft 0.5, with `ramp: "reference"` so its colours are the original's own.

**Choices I made:**
- Class `glow`, not `sparks`. `sparks` is a one-shot that must end dark, and the original stays lit through all its frames.
- The frame rate of 10 is my guess. The input folder gives no fps.
- The glow's outline is taken from your original's pictures via the reference mask. That is the spec's documented way to match a shape, and the input is the sprite you asked me to reproduce.

**Measured against the original:**
- Colour: mean delta E 5.1 (bar 15).
- Dark share: 0.50 against 0.46.
- Border light: 0 against 0.145 at its brightest, within range.
- Frame count: 11 against 11.
- Shape overlap: mean 0.75 (bar 0.8).

**Still open:**
- **Shape overlap, 0.75 against the 0.8 bar.** The original's core sits in a steady cluster; my blobs are placed afresh each frame, so they do not follow its shape closely. I tried more blobs, larger spread and a stronger envelope. Those lowered the overlap or broke the loop, so I kept this version.
- **Peak timing.** My brightest frame falls at 0.8 of the loop, against 1.0 in the original. The original is nearly flat in brightness, so this matters less than the overlap.

If you want the overlap closed, the next step is hand-placing the blobs to match the original's cluster in each frame, or accepting 0.75 as the best the blob layer can reach.
