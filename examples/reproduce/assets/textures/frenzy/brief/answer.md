The build says OK, and the map's preview draws your textures in place of the game's. Two things still need the modder's eye: it has seven advisory warnings, and I could not put the result beside Half-Life's own in the game.

The file is `work:frenzy_new/frenzy_new.wad`, with a sheet of all textures at `work:frenzy_new/frenzy_new-textures.png`. The spec is built from one `smak.wad/1` object with a preview of `models:frenzy.bsp` and `each: true`.

**What I made**

```
Wall, floor, ceiling and trim (29 textures in total)
c3a1_w3a      256x208  dark grimy concrete, stains and cracks
c3a1_w2       256x160  dark blue-grey concrete, one long seam
c3a1b_w3      128x160  cool grey panel, drip stains, notched joints at the sides
c3a1b_w1      128x160  corridor wall, concrete bands, recessed window strip
c3a1b_w1a     128x160  same band, window split in two
c3a1b_w2      128x160  wall with a barred window
c3a1b_w7       96x96   plain pale concrete
tnnl_flr7     128x128  square concrete tiles
tnnl_flr7c    128x128  same tiles, dirtier and warmer
crete2_flr01  128x128  plain concrete floor
crete4_stp01  128x16   step edge
babtech_ceil01 64x64   damp, cracked ceiling
silo2_wetdr   192x128  dark metal grating and beams
c3a2b_reac2c  128x64   yellow housing with louvred vents
c3a2_bth1     192x32   dirty ochre painted metal strip
tnnl_brd1      16x128  yellow and black hazard trim
black          32x32   plain black
yellow         16x16   plain yellow
c3a2a_tnk1b    64x64   teal rippled liquid
c2a4x_glu      64x64   pale blue-violet, speckled

Pipe (tiles along its length)
-0genpipe1    64x128   pipe down the middle
-1genpipe1    64x128   -0 flipped top to bottom
-2genpipe1    64x128   -0 flipped side to side, 0.9 brightness

Lights (glowing face, with the dim frame of each animation)
+0~fifts_lght01   64x80   ceiling panel, lit
+a~fifts_lght01   64x80   same, dimmed to 0.4
+0~fifties_lgt2   16x64   wall light, lit
+a~fifties_lgt2   16x64   same, dimmed to 0.4 (switched off)
+0~generic86      16x16   small glowing square, lit
+a~generic86      16x16   same, dimmed to 0.4
```

**How**

- Every texture is built from a material (stone, tile, metal, paint, hazard, water, plaster), with its own tone, grime and wear. Machinery is added as relief: seams, bars, louvres, the pipe and lamp faces.
- The dim frames are made from their lit frame, so each animation matches its set. The pipe tiles are made the same way.
- Nothing is lifted from the game's textures.

**Warnings left (advisory, the build still says OK)**

- The lamp faces and the small light are brighter than Valve's. That is what a glowing face is.
- `black` is plain as you asked, so it has no grain. `babtech_ceil01` reads as noisy.
- `yellow` is brighter than Valve's plain textures.

**Not covered**

- The map also uses `+0medkit`, `+amedkit`, `c2a3rustdoor1`, `medkitedge1`, `aaatrigger`, `{grate4a`, `{ladder1` and `{rail1b`. You didn't list them, so I left them to the game. The preview draws them flat.
- `crete2_flr01` and `c2a4x_glu` look solid blue in their single-texture previews. That is the preview's test light, not the textures.
- I could not run the game, so the side-by-side is still to do. The modder needs to add `frenzy_new.wad` to the map's `wad` list ahead of `halflife.wad`, or the game will keep using its own. I did not verify the game's load order.
