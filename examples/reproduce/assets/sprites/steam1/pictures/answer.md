The sprite is built and the build says OK, but with one warning left: the shape match is 0.51 against the judges' bar of 0.8. The file is `work:sprites/steam1.spr`, with its spec at `work:sprites/steam1.json`.

**What it is:** a steam puff, a soft white cloud that puffs out, grows, then greys and breaks into wisps. It is a `smoke puff` class, `env_sprite` use, `parallel oriented` type, `index alpha` format (coverage tinted by colour), 32 by 48 pixels, 16 frames, one-shot (not looping), 10 frames a second. Placed as an `env_sprite` with render mode 4 (Solid).

**The spec's choices**
- One `billow` layer (a lit cloud of 36 spheres), centred slightly low, rising 0.45, dissolving 0.6 as it ages.
- Timing: quick rise to a peak at 0.4 of its play, then a slow fall to nothing at the last frame.
- The original's contact sheet is the `reference`, given as the plain path `pictures/frames.png`. The `cell`/`cols` form I tried first read the grid in the wrong place, so I dropped it.

**Measures against the original**

| Measure | Original | Mine | Bar | Result |
|---|---|---|---|---|
| Mean colour (delta E, colour difference) | | | 15 or under | 0.1 |
| Share of dark pixels | 0.63 | 0.67 | within 0.05 | pass |
| Light at the border | 0.341 | 0.316 | within 0.08 | pass |
| Brightest frame (share of play) | 0.4 | 0.4 | within 0.08 | pass |
| Frame count | 16 | 16 | | pass |
| Shape overlap (lit pixels both share) | | 0.51 | 0.8 | **warning** |

The shape gap is mostly in the late frames (10 to 12), where the original is taller and more broken up, and in the dot at frame 0, which sits a little higher in the original.

**What I tried for the shape**
- A `mask: "reference"` on the cloud layer lifted the shape to 0.57 to 0.58, but it dropped the border light to 0.04 to 0.21, and adding an unmasked halo layer to fix the border left a visible grey ring round each frame. I rejected both as looking less like the original.
- `finish: { edge: 2 }` made no change to the border reading.

**Not done:** I did not copy the file into the models folder, as you asked only for a build. Say if you want it moved.
