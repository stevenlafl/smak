The build says OK. It wrote `work:frenzy_new/frenzy_new.wad` (the WAD texture package), with a sheet beside it at `frenzy_new-textures.png`. The map preview with each texture on its own place is also drawn. I checked those pictures by eye against the originals; I have no pixel measurement of how close they are.

Two gaps to know about first:

- **12 textures have no original picture**, so I painted them from what each one is, and nothing was checked against an original: `+0medkit`, `+amedkit`, `medkitedge1`, `+a~fifts_lght01`, `+a~generic86`, `-1genpipe1`, `-2genpipe1`, `aaatrigger`, `c2a3rustdoor1`, `{grate4a`, `{ladder1`, `{rail1b`.
- **Three originals are flat blue in their pictures**: `crete2_flr01`, `c2a4x_glu`, `c3a2a_tnk1b`. The renderer seems to have drawn a placeholder colour where it could not find the texture, so I matched the flat blue in the pictures. If the real game textures are not flat, these three are wrong, and only the game can say.

How each was made:

```
lifted from the map's view (view shows most of it):
  c3a1b_w3, c3a1b_w1, c3a1b_w1a, c3a1b_w2, c3a1b_w7,
  tnnl_flr7, tnnl_flr7c, silo2_wetdr, -0genpipe1, c3a2b_reac2c

painted (view shows little, is saturated white, or is a placeholder):
  c3a1_w3a (9%), c3a1_w2 (19%), c3a2_bth1 (3%), crete4_stp01 (41%),
  tnnl_brd1 (38%), babtech_ceil01 (5%), crete2_flr01, c2a4x_glu,
  c3a2a_tnk1b, yellow (100% white in view), black

lamps (a '~' name, lit by the map's own lights, painted with a lamp face):
  +0~fifts_lght01, +a~fifts_lght01, +0~fifties_lgt2, +a~fifties_lgt2,
  +0~generic86, +a~generic86

holes ('{' names, painted as mesh): {grate4a, {ladder1, {rail1b
```

Build warnings remaining (18 textures): the lamps are brighter than Valve's by design, `black` is too even, and the three flat-blue ones are less grained and more coloured than Valve's. These match the pictures, so I kept them. `c3a1_w3a`'s grain reads as noise in the report, and I left it.

The spec is inline in this session; I did not save it as a file, so a rebuild needs it pasted again.
