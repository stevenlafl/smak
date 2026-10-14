I built `sprites/flare1.spr` and the build said **OK** with every check passing. It's in the work folder, with `-sheet.png` and `-animated.png` beside it.

What it is:
- **Size and frames:** one 64×64 frame, no animation, centred.
- **Type and format:** `parallel`, so it always faces the viewer, and `additive`, so black is clear.
- **Use:** I set it up as an `env_glow`, so the tool placed it with render mode 3 (Glow). Any flicker or pulsing has to come from the engine.
- **Shape:**
  - A white core about a third of the frame wide. It's fully bright in the middle and has no hard edge.
  - A broad halo that fades smoothly almost to the frame's edges.
  - The last 3 pixels at the edge are faded to black. The border measured 0, so no square outline shows.
- **Colours:** warm pinkish-white around the core, then dusty rose-mauve, then dark violet-grey before black. The palette came out at 104 colours.
- **Rays:** 36 thin rays every 10°, alternating long/short and wide/narrow, at low strength. The glow looks slightly grainy, like a sunburst, with no strong spikes or cross.

Checks:
- The tool measured it against Half-Life's own flare sprite and it came out in range.
- The drawn result matches the description. The rays are faint and spread evenly all the way round.

One thing to know: the guide doesn't document the units for `colour` or whether the ray layer accepts one, so I found them by testing. Colours are on a 0 to 1 scale; a first try on 0 to 255 came out as a flat, overblown disc. The rays took the colour I gave them in the render, but the tool never said it reads that field.

Final layers in the spec:
```
glow   radius 1.1   colour 0.60 0.45 0.62   gain 1.7   (outer mauve halo)
glow   radius 0.65  colour 1.00 0.82 0.90   gain 0.7   (warm pink mid)
glow   radius 0.3   core 0.3   white        gain 1.0   (core)
flare  36 rays, length 0.65-0.85, width 0.015-0.02, gain 0.12
finish edge 3
```
