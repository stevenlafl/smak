The build says OK. `frenzy_new.wad` is written to `work:frenzy_new/frenzy_new.wad`, with a sheet at `work:frenzy_new/frenzy_new-textures.png`, and the `each` preview of the map wearing it is in the build output.

I made 25 textures, each under its original name and size:

```
How               Textures
----------------  -----------------------------------------------------------
Lifted, normal    c3a1_w3a, c3a1_w2, c3a1b_w3, tnnl_flr7, tnnl_flr7c,
view + sheet      silo2_wetdr, -0genpipe1, c3a2b_reac2c, c3a1b_w2, c3a2_bth1,
                  black, tnnl_brd1, crete4_stp01, babtech_ceil01
Lifted, dark      c3a1b_w1, c3a1b_w7, c3a1b_w1a (white in normal view)
view, bright 0.5  +0~fifts_lght01, +a~fifties_lgt2, +0~fifties_lgt2,
                  +0~generic86, yellow (lamp faces, white in normal view)
Painted           crete2_flr01, c3a2a_tnk1b, c2a4x_glu (blue light)
```

- **Lifted textures** come from the map's own views, with the light divided out. Each lift also takes the views sheet (`views.png`, `views.json`) so more of each texture is seen. The lifted textures' colours and grain come from the pictures; the build's fact lines show 29% to 100% of each texture seen, with no white or tinted texels left in the lifted set.
- **Painted textures** are the three that sit under a blue light. A blue light has no red or green to divide out, so their true colours can't be read from these pictures. I painted them from what their names say: `crete2_flr01` as a grey concrete floor, `c3a2a_tnk1b` and `c2a4x_glu` as dark metal. These are guesses, and they are the weakest part of the set. At the judge's brightness, the originals also read as flat blue there, so they are likely to be the closest match in the test.
- **Coverage gap:** the map names 37 textures, but the pictures cover only 25. The build reports that the map still wears `+0medkit`, `c2a3rustdoor1`, `medkitedge1`, `{grate4a`, `{ladder1` and `{rail1b` without a texture in this .wad. The map also names `-1genpipe1`, `-2genpipe1`, `aaatrigger`, `+a~generic86` and `+a~fifts_lght01`, which have no picture here. I did not copy any game textures to fill these in. Those textures need pictures from you, or they will keep the game's own look.
- **Remaining build notes:** the build still notes that `c3a1_w3a`, `black`, `babtech_ceil01` and `yellow` show only 5% to 29% of themselves, so a larger pattern than the visible part may be missing. Adding a wider view of each would close that.
