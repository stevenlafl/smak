The build says OK, and the map renders wearing the new wad (`work:frenzy_new/frenzy_new.wad`). All 25 textures are in it, each at its original name and size.

**How each one was made**

- **17 are lifted from their pictures** (c3a1_w3a, c3a1_w2, c3a1b_w3, c3a1b_w1, tnnl_flr7, c3a1b_w7, tnnl_flr7c, silo2_wetdr, c3a1b_w1a, -0genpipe1, c3a2b_reac2c, c3a1b_w2, c3a2_bth1, black, tnnl_brd1, crete4_stp01, babtech_ceil01). Each lift also used the map's views and camera sheet. None of these got a white or tinted warning. Coverage ranges from 1% to 100% of the texels; c3a1_w3a is 29%, babtech_ceil01 is 5%, and black is 12%. The build warns about that coverage, but the colours it did see are within its accuracy bound.
- **8 are painted**, because their views were white or lit by one strong colour, so the true colour can't be read back: crete2_flr01 (concrete floor, stone), +0~fifts_lght01 and +0~fifties_lgt2 / +a~fifties_lgt2 (light panels with a lamp face; the `~` in their names is what the lamp needs), +0~generic86 and yellow (yellow paint), c3a2a_tnk1b (steel) and c2a4x_glu (dark metal). These colours are my estimates from the names and the views, not measurements, so they are the part to check first against the originals.

**Warnings left standing**

- +0~fifts_lght01 is brighter than Valve's walls (0.59 against 0.33). That is the light panel's look; the original is near white.
- +0~generic86 and yellow are 16-texel textures and read as too even. Wear was added, but a 16-texel tile has little room for grain.

**Not in this set**

- The map also names textures that are not in the 25 pictures, so I did not make them: +0medkit, c2a3rustdoor1, medkitedge1, {grate4a, {ladder1, {rail1b. The build drew them flat. Two alternate frames, +a~fifts_lght01 and +a~generic86, are in the map's texture list but have no picture; the build did not name them as worn.

The spec is the build call itself, not a file in the work folder. I could not read the `examples/reproduce` folder (permission denied), so I worked from the pictures and the spec guide only.
