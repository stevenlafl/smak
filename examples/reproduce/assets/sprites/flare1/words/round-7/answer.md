`sprites/flare1.spr` is built and the build says OK. It is 64x64, 1 frame, type parallel, format additive. The report measures it against Half-Life's own flare and puts it in range. I had no reference picture to measure against, so I judged it by eye from your description.

- **Core:** a bright white disc, saturated in the middle with no hard edge.
- **Halo:** it falls off smoothly toward the edges. The colour shifts from warm white to dusty rose-mauve, then dark violet-grey, then black.
- **Border:** pure black, so no square outline shows.
- **Rays:** 48 fine radial rays spread evenly around the circle, at low contrast, with no cross or dominant spikes. They are faint in the render, so the sunburst grain may be subtler than the original's.
- **Use:** placed as an `env_sprite` at render mode 5 (additive). Any flicker has to come from the engine.

The first build had a cross-shaped streak pattern and light at the border. I removed the streaks and set the halo's darkest colour to pure black. I also widened the edge fade, which brought the border light to 0.
