The build says OK, and `frenzy_new.wad` is written to the server's work folder at `work:frenzy_new/frenzy_new.wad`, with its sheet at `work:frenzy_new/frenzy_new-textures.png`. It covers the 25 textures you gave pictures for, each at its original name and size.

- **Lifted from the map (18):** `c3a1_w3a`, `c3a1_w2`, `c3a1b_w3`, `c3a1b_w1`, `c3a1b_w1a`, `c3a1b_w2`, `c3a1b_w7`, `tnnl_flr7`, `tnnl_flr7c`, `tnnl_brd1`, `silo2_wetdr`, `-0genpipe1`, `c3a2b_reac2c`, `c3a2_bth1`, `crete4_stp01`, `c3a2a_tnk1b`, `babtech_ceil01`, `black`. Each used the map's own view with the view sheet and cameras, so the colour and grain come from the game's rendering.
- **Painted (7), because their view is white or lit by a single colour:**
  - `+0~fifts_lght01`, `+0~fifties_lgt2`, `+a~fifties_lgt2`, `+0~generic86`, `yellow` are lamps, with a lamp face over the paint. Their originals are white, so the brightness warning on them is expected.
  - `crete2_flr01` is my guess: grey stone with grime. Its view is lit by blue light alone, so its real colour can't be read.
  - `c2a4x_glu` is my guess: neon blue. Only the blue channel of its view is readable.

The map's view of the new textures renders, with no errors. I checked the views and the sheet, but not each texture's own placement image, so please look at those yourself.

**Not covered:** the map uses 37 textures, and only 25 pictures were given. These 12 are not in the spec, so the map draws them flat: `+0medkit`, `+amedkit`, `+a~generic86`, `+a~fifts_lght01`, `-1genpipe1`, `-2genpipe1`, `aaatrigger`, `c2a3rustdoor1`, `medkitedge1`, `{grate4a`, `{ladder1`, `{rail1b`. If you send their pictures, I'll add them to the spec the same way.
