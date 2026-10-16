The build says OK. `frenzy_new.wad` has all 37 textures the map references, each at its original name and size. The spec is saved as `work:frenzy_new/frenzy_new.spec.json`, and the contact sheet is `work:frenzy_new/frenzy_new-textures.png`. I read "every texture" as every name in the map's texture table, not only the faces' textures. Six of them (`-1genpipe1`, `-2genpipe1`, `+a~fifts_lght01`, `+a~generic86`, `+amedkit`, `aaatrigger`) have no face wearing them, so the build refuses to lift them and I painted them instead.

**Where each texture came from**

| Source | Count | Textures |
|---|---|---|
| Lifted from the normal picture | 14 | `c3a1_w3a`, `c3a1_w2`, `c3a1b_w3`, `tnnl_flr7`, `tnnl_flr7c`, `silo2_wetdr`, `c3a2b_reac2c`, `c3a1b_w2`, `c3a2_bth1`, `black`, `tnnl_brd1`, `crete4_stp01`, `babtech_ceil01`, `-0genpipe1` |
| Lifted from the darker picture at brightness 0.5 | 7 | `c3a1b_w1`, `c3a1b_w7`, `c3a1b_w1a`, `+0~fifts_lght01`, `+a~fifties_lgt2`, `+0~fifties_lgt2`, `+0~generic86` |
| Painted: the picture was lit by one strong colour | 4 | `crete2_flr01`, `c2a4x_glu`, `c3a2a_tnk1b`, `yellow` |
| Painted: no picture of the texture | 12 | `-1genpipe1`, `-2genpipe1`, `+a~fifts_lght01`, `+a~generic86`, `+0medkit`, `+amedkit`, `medkitedge1`, `c2a3rustdoor1`, `aaatrigger`, `{grate4a`, `{ladder1`, `{rail1b` |

The lifts used the map's views as well, so they show more of each texture. The `c3a1_w3a` lift covers 29% of its texels and `babtech_ceil01` covers 5%. The build reports the rest as repeated from that part.

**What is a guess**

- **The 12 painted with no picture.** Their looks come from their names. The red cross on the medkit, the rust on the door, and the grate, ladder and rail holes are my reading, not the originals. These are the ones most likely to differ from the originals.
- **The 4 blue-lit ones.** The views show `crete2_flr01`, `c2a4x_glu` and `c3a2a_tnk1b` only under blue light, and `yellow` only as a white lamp, so their real colours can't be read. On the map they read blue, which matches the blue originals in their views.
- **Duplicates.** `-1genpipe1` and `-2genpipe1` are painted pipes rather than copies of `-0genpipe1`, because the build can't lift a texture no face wears. `+a~fifts_lght01` and `+a~generic86` are painted lamp frames for the same reason.

**Warnings still open**

- `+a~generic86` and `aaatrigger` have no visible patches. Both are small (16x16), and I left them that way.
- `yellow` is more coloured than Valve's walls (0.20 against 0.076). I kept it yellow on purpose, since the name says so.

I did not compare the finished textures side by side with the originals beyond the contact sheet and the map preview. The preview's per-texture readings are in the build output if you want to check them against the pictures.
