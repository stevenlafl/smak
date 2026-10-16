The set is built and the build says OK: `work:frenzy_new/frenzy_new.wad`, with a sheet of its textures beside it. It holds all 25 of the map's textures, each under its original name and size.

**How each texture was made**

```
Lifted off the map's own view (17): the build's views sheet was added to
  each lift where it shows more of the wall
  c3a1_w3a, c3a1_w2, c3a1b_w3, c3a1b_w1, tnnl_flr7, c3a1b_w7, tnnl_flr7c,
  silo2_wetdr, c3a1b_w1a, -0genpipe1, c3a2b_reac2c, c3a1b_w2, c3a2_bth1,
  black, tnnl_brd1, crete4_stp01, babtech_ceil01

Painted (8): the view is white or tinted there, so a lift would copy the lamp
  crete2_flr01        stone, mid grey, stains, speckle, cracks
  c3a2a_tnk1b         metal, dark blue grey, grime, streaks
  c2a4x_glu           hazard stripes, blue
  yellow              paint, muted yellow, speckle, stains
  +0~generic86        paint, yellow frame, lamp face in the middle
  +0~fifts_lght01     metal, lamp face over most of it
  +0~fifties_lgt2     metal, lamp face, speckled
  +a~fifties_lgt2     metal, lamp face, speckled
```

**What the build still reports**

- Five textures are brighter than Valve's, which is expected for lamp faces. `yellow` and `+0~generic86` are also flagged as having no grain, so I added wear to both.
- `c3a1_w3a` shows 29% of its texels, `black` 12% and `babtech_ceil01` 5%. The views sheet was added to each, so that is as much of each as the map's views show.
- The colours of `crete2_flr01`, `c3a2a_tnk1b` and `c2a4x_glu` are my estimates. Their views are a single strong blue light that hides red and green, so only the blue can be read. The name and the shape of each place set the rest. These three are the most likely to be off against the originals.

**What I checked**

- The build's sheet shows all 25 textures.
- I rendered the map's six start views with the .wad worn in place. The map's start views look right and the lamps read as the originals do.
- I did not compare each texture's own place against its original picture one by one. The per-texture previews (`preview.each`) are in the build, but I did not open them individually.

**Not done**

- The map also wears six textures that are not in your list and have no picture here: `+0medkit`, `c2a3rustdoor1`, `medkitedge1`, `{grate4a`, `{ladder1`, `{rail1b`. I did not make them. If you send their pictures, they can go in the same spec.
- The spec was passed to the build inline. I have no file-writing tool here, so it is not saved in the work folder. I can save it as a JSON file beside the .wad if you want it kept for a rebuild.
