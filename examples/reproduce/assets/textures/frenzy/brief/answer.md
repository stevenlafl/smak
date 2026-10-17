The texture pack is built and the build says OK. It is at `work:frenzy_new/frenzy_new.wad`, made from the spec `work:frenzy_new.json`, and the map preview is `models:frenzy.bsp` with every texture drawn on its own place.

I could not compare these against Half-Life's own textures, because the game's textures are not in this environment. The judgement of "at least as good as the game's" is the modder's, in the game. The build's own read-out is that the walls and floors come in at Valve's ranges, and the preview views look right in the map.

**What I made:** 29 textures. Your 25 names, plus the other frames of the animations and random sets the map uses (`-1genpipe1`, `-2genpipe1`, `+a~fifts_lght01`, `+a~generic86`). Every size is a multiple of 16, as the game needs. Each one is generated from a material (concrete, tile, metal, paint, hazard) with grime, cracks, stains or speckle, and some have relief parts (seams, pipes, louvres, grilles, lamp faces).

```
Texture            Size      What it is
c3a1_w3a           256x208   dark grimy concrete, cracked and blotchy
c3a1_w2            256x160   dark blue-grey concrete, one long seam
c3a1b_w3           128x160   cool grey panel, drip stains, notched joints
c3a1b_w1           128x160   corridor wall, bands and a barred window strip
c3a1b_w1a          128x160   same band, window split in two
c3a1b_w2           128x160   recessed wall with a barred window
tnnl_flr7          128x128   square concrete tiles
tnnl_flr7c         128x128   same tiles, dirtier and warmer
c3a1b_w7            96x96    plain pale concrete filler
silo2_wetdr        192x128   dark metal grating and pipe beams
-0genpipe1          64x128   metal pipe running along its length
-1genpipe1          64x128   pipe variant (flipped from -0)
-2genpipe1          64x128   pipe variant (shifted, dimmed from -0)
c3a2b_reac2c       128x64    yellow machine housing with louvred vents
c3a2_bth1          192x32    dirty ochre painted metal strip
black               32x32    plain black
crete2_flr01       128x128   plain concrete floor
+0~fifts_lght01     64x80    1950s ceiling panel, glowing
+a~fifts_lght01     64x80    same panel, switched off
+0~fifties_lgt2     16x64    1950s wall light, lit
+a~fifties_lgt2     16x64    same wall light, switched off
+0~generic86        16x16    small glowing square light
+a~generic86        16x16    same light, switched off
c3a2a_tnk1b         64x64    blue and black panel with blue screen
c2a4x_glu           64x64    blue and black shapes
babtech_ceil01      64x64    old damp cracked concrete ceiling
yellow              16x16    plain yellow
tnnl_brd1           16x128   yellow and black hazard strip
crete4_stp01       128x16    edge of a concrete step
```

**How:** Each texture is written in the spec with its name and size, so the map picks it up in the place of the game's own. The lit and switched-off light frames are the same picture, with the off frame at 40% brightness. The pipe variants are copies of `-0genpipe1` that are flipped or shifted, so they tile as a set.

**Things the modder should know:**

- **Blue "where the map shows through" (`c3a2a_tnk1b`, `c2a4x_glu`):** GoldSrc only lets a texture show through where its name starts with `{`, and these names do not. I made the blue parts glowing screens instead. If they need true see-through holes, the names would have to change, and the map's faces would need to match.
- **Switched-off frames:** I read the `+a` frames of the lights as the off state, by analogy with the wall light you described. If the game uses them the other way round, that is a quick swap.
- **Build warnings (7, all accepted on purpose):** the lit lamp faces come out brighter than Valve's walls, which is what a lamp should do. The plain `black` and `yellow` textures have little pattern, and you asked for them plain. The off frames have no pattern of their own because they copy the lit frame.
- **Not replaced:** the map also uses `+0medkit`, `+amedkit`, `c2a3rustdoor1`, `medkitedge1`, `{grate4a`, `{ladder1`, `{rail1b` and `aaatrigger`. They were not on your list, so the game still shows its own versions of those.
