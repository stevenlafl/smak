The sprite builds OK and is written to `work:sprites/zerogxplode.spr` (with `-sheet.png` and `-animated.png` beside it). The build still prints warnings, though, so it does not fully match the original yet.

**What it is:** an explosion, drawn as a `tempent` (a map explosion), `parallel` (faces the camera), `additive` (black is clear), 64x64, 15 frames, one-shot (not looping), centred. The frames follow the original: a small white spot grows to a bright white ball by frame 2–4, cools to golden tan with dark crevices, then fades to dark red and is gone by frame 13–14.

**How it's built:** two billow layers (lit clouds of spheres). The first gives the body, plus flecks of debris. The second is wider and masked to the original's lit outline, so its shape follows the reference frame by frame. Colours come from the reference's own sheet (`ramp: "reference"`), and the reference is `pictures/frames.png`, 128px cells, 8 columns.

**Measured against the original (last build):**

| Measure | Original | Ours | Bar |
| --- | --- | --- | --- |
| Mean colour (delta E) | — | 4.1 | 15 or under |
| Share that is dark | 0.72 | 0.70 | within 0.05 |
| Brightest frame (share of play) | 0.36 | 0.43 | within 0.08 |
| Light at the border | 0.82 | 0.64 | 0.08 short or past |
| Shape overlap, mean | — | 0.50 | 0.8 |

**Still open:**
- **Shape overlap (0.50 against a bar of 0.8).** Frame 0 is empty in ours; the original has a small spot there. The envelope starts at zero, and I couldn't find a setting that lights frame 0 without moving the peak. Frames 10–13 also fade faster than the original's.
- **Border light (0.64 against 0.82).** It got closer as the masked layer widened; the remaining gap is not closed.

I tried several variants (a decay of 0.9 made colour and border worse, and a shorter attack moved the peak later), so I kept the best one.

**Assumptions I made, since the input gives only size, frames, type and format:** the frame rate is 30 fps (the original's rate is not recorded anywhere I could read), the class is explosion, and the origin is centred. Change any of these if you know the original's values.
