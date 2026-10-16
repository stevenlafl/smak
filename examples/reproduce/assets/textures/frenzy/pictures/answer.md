The build says OK, and `frenzy_new.wad` has all 37 of the map's textures under their exact names and sizes. It is at `work:frenzy_new/frenzy_new.wad`, with a sheet at `work:frenzy_new/frenzy_new-textures.png`. One warning is left: `aaatrigger` still reads as plainer than Valve's. It is the invisible trigger texture, so it never shows in play.

The 37 names are the map's full texture list, which is more than the 25 you listed. I took the extra 12 from the map's info:

```
Source                          Count  Textures
Lifted from its picture            22  c3a1_w3a, c3a1_w2, c3a1b_w3, c3a1b_w1, tnnl_flr7,
                                       c3a1b_w7, tnnl_flr7c, silo2_wetdr, c3a1b_w1a,
                                       -0genpipe1, c3a2b_reac2c, c3a1b_w2, c3a2_bth1, black,
                                       +0~fifts_lght01, tnnl_brd1, crete4_stp01,
                                       +a~fifties_lgt2, +0~fifties_lgt2, +0~generic86,
                                       babtech_ceil01, yellow
Made from another texture            6  -1genpipe1, -2genpipe1 (-0genpipe1 flipped),
                                       +a~fifts_lght01, +a~generic86 (on frames at 0.4),
                                       +amedkit (+0medkit at 0.4)
Painted from its name (no usable     6  crete2_flr01, c3a2a_tnk1b, c2a4x_glu,
picture)                               +0medkit, c2a3rustdoor1, medkitedge1
Holes, painted (mesh)                3  {grate4a, {ladder1, {rail1b
Plain, painted                       1  aaatrigger
```

What I'd like you to know:

- **The lifts:** the lamps and the darker pictures were lifted at brightness 0.5, as the brief said. Each lift used the map's views to see more of the texture. The lifted textures warn of only partial coverage (29% to 37% for a few), with no white or tinted parts.
- **Three textures are guesses.** `crete2_flr01`, `c3a2a_tnk1b` and `c2a4x_glu` came back 100% under the blue lamp, so their true colour cannot be read from the map. I painted them as grey stone and grey metal. They read blue in the map's place view, as the originals do. Their true colours may be different.
- **The painted ones are guesses too.** The six painted from their names have no picture. Their colours and shapes are my reading of the names, and they are not on the world faces, so the per-place preview cannot show them. The off-frame factor of 0.4 is a convention from the guide, not measured from the game.
- **Spec not saved as a file.** I have no tool to write files here, so the spec went in inline. Re-run it from the 37 entries above if you want it on disk.
