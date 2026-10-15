`sprites/flare1.spr` is built. The build says OK with no warnings, and the sprite is written to the work folder as `sprites/flare1.spr`.

It matches the original's type and format: 64x64, 1 frame, parallel, additive. I set `use` to `tempent`, so the report places it with render mode 5 (additive).

The picture is a bright pinkish-white core inside a pale rose halo, with fine rays fading out to a dark border. It is made of two glow layers plus a ring of 96 thin rays and no long streaks.

Measured against the original's picture:

| Measure | Original | Mine |
| --- | --- | --- |
| Mean colour difference (delta E) | n/a | 6.5 (15 or under counts as near) |
| Share that is dark | 0.39 | 0.42 (within 0.05 counts as near) |
| Border brightness | 0 | 0 |
| Frames | 1 | 1 |
| Shape overlap (lit pixels both have) | n/a | 0.87 (the bar is 0.8) |

My first attempt was too small and had a stray horizontal streak. It scored 0.6 on shape overlap, so I widened the glows and dropped the streaks.

I only compared the two sheets by eye and by those measures, not pixel by pixel. The sprite comes out with 155 colours after quantising, and the report puts the loss from that at 0.0031.
