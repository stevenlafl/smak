The sprite is built: `work:sprites/glow01.spr`, and the build says OK with no warnings.

What I made, as a `smak.sprite/1` spec:
- **Name and use:** `sprites/glow01.spr`, placed as an `env_glow` (render mode 3, Glow).
- **Class:** `glow`.
- **Size and frames:** 64x64, one frame, no loop.
- **Type and format:** `parallel` and `additive`, so black is clear.
- **Shape:** one glow layer, `radius` 1.0, `core` 0.26, `colour` [1, 1, 1] (white). The core is a bright white centre that falls off smoothly to dark at the frame's edge.

Against the reference, measured by the kit's judge:

| Measure | Reference | Ours |
| --- | --- | --- |
| Mean colour (delta E, 15 or under is near) | | 1 |
| Share that is dark (within 0.05 is near) | 0.47 | 0.46 |
| Border brightness | 0 | 0 |
| Frames | 1 | 1 |
| Shape overlap, mean (bar 0.8) | | 0.84 |

The shape overlap is only just above the 0.8 bar, so it is the figure most likely to slip if the judge sees the two side by side. The colour came out close on the first pass after I changed it from the default warm tan to white.

Two things to check:
- I could not read the original's `facts.txt` or the source folder under `Packages/`, because the tools refuse paths outside the models and work folders. I worked from the copy in the work folder, `pictures/frames.png`, which I looked at by eye and measured the build against. If the original differs in a way the reference copy doesn't show, that is the first place to look.
- The build also wrote `sprites/glow01-sheet.png` and `sprites/glow01-animated.png` beside the sprite in the work folder. I did not open them.
