The sprite builds OK and is written as `work:sprites/laserbeam.spr`, with `-sheet.png` and `-animated.png` beside it. The build passes every check, but it is not a close match yet: the dark share is off, and the colour is only just inside the bar.

**The spec I settled on** (`smak.sprite/1`, one sprite):
- **What it is:** a vertical laser beam, `class: beam`, `use: beam`, placed as a beam with render mode 5 (additive).
- **Shape and size:** 32×64, one frame, `loop: true`, `fps: 10`, `origin: centre`, `type: parallel`, `format: additive`.
- **Colours:** a round beam with a ramp of black at the rim, blue-grey `[40,60,100]` to `[60,80,120]` through the middle, and white at the core. The ramp's lowest stop has to be black: any non-black floor lights the whole frame in additive mode, which I saw when I tried it.
- **Edges:** `finish: edge` fades the border so it stays dark, matching the reference's border light.
- **Motion:** none. The source is a single frame, and I did not invent any animation.

**Measured against the original** (the `reference` is `pictures/frames.png`):

| Measure | Original | Mine | Bar |
| --- | --- | --- | --- |
| Mean colour (delta E) | — | 13.2 | 15 or under: near (pass) |
| Dark share | 0.02 | 0.12 | within 0.05: near (miss) |
| Border brightness (mean) | 0.251 | 0.246 | — |
| Shape match (mean) | — | 0.91 | — |
| Frames | 1 | 1 | — |

The remaining miss is the dark share. The report says the beam covers too little of its frame, so too many pixels fall to black at the rim. I tried a wider core, a flat profile, and a lighter rim, and each made something else worse: a wider core or a flat profile brought back the bright border, and a non-black floor lit the whole frame. The rim black cannot be lifted without one of those, so I stopped here rather than keep guessing.

The build is OK, but the dark share does not match the original. If you want that closed, the next step is probably a different beam profile or a per-pixel fill, which needs a call from you.
