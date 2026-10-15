I built `sprites/flare1.spr` and the build reports OK with every check passing.

**Spec details:**
- **Format:** 64x64, 1 frame, parallel (always faces the viewer), additive.
- **Placement:** set up as an `env_glow`, so the engine uses render mode 3 (Glow). Any pulsing has to come from the engine's scale and brightness settings.
- **Halo:** a broad, round glow centred in the frame that reaches almost to the edges. Its colour runs from white in the middle through warm pinkish white and dusty rose-mauve to dark violet-grey, then black.
- **Core:** a smaller glow on top gives a fully bright white disc about a quarter of the frame wide, with no hard edge.
- **Streaks:** 44 thin rays of varied length spread evenly around the full circle, kept faint and low contrast. There are no long spikes and no cross shape.
- **Edges:** the outer 3 pixels are faded. The build measured the border at 0, so no square outline shows.

**Build figures:**

```
colours             143
dark share          0.33
border brightness   0
vs Half-Life flare  1 of 1 measures in range
```

**What wasn't checked:**
- I couldn't compare it to the original numerically because no reference picture was supplied. The match is to the written description only.
- The only image I have is the build's 128-pixel thumbnail; the render tool wouldn't draw a `.spr` larger. At that size the core, halo and colours look right and the rays show as faint grain. How strong the streaks look is the part I'd check first against the original.
- In my first version one ray stood out as a horizontal spike. I removed the flare's main streaks, and it no longer shows in the thumbnail.

The sprite is in the work folder at `sprites/flare1.spr`, with `-sheet.png` and `-animated.png` beside it.
