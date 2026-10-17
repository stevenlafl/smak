The build says OK, and the textures are in `work:frenzy_new/frenzy_new.wad`, with a sheet beside it at `work:frenzy_new/frenzy_new-textures.png`. The spec is `work:frenzy_new.json`.

**One thing to set up before the game shows them:** `frenzy.bsp` does not hold its textures inside the file. It asks for them from `halflife.wad`, `decals.wad` and `liquids.wad`, which its `wad` key lists. To make the game use yours, `frenzy_new.wad` needs to sit in the mod's folder and be listed first in that key, ahead of `halflife.wad`. The first listed file that has a name wins. I have not changed the map. Say the word and I will add it.

**What I made:** all 29 textures from your list, each at its exact name and size. The frames you named are included: `-1genpipe1` and `-2genpipe1`, `+a~fifts_lght01` and `+a~generic86`.

```
name            size      made as
c3a1_w3a        256x208   concrete, cracked, stains and speckle
c3a1_w2         256x160   dark blue-grey concrete, one long seam across
c3a1b_w3        128x160   cool grey concrete panel, drip stains and streaks
c3a1b_w1        128x160   concrete bands, recessed window strip across
c3a1b_w1a       128x160   same bands, window split in two by a pillar
tnnl_flr7       128x128   square concrete tiles, 32 texels each
tnnl_flr7c      128x128   same tiles, warmer and dirtier
c3a1b_w7        96x96     plain pale concrete
silo2_wetdr     192x128   dark metal, bars over a hole, a pipe beam
-0genpipe1      64x128    metal pipe running the length
-1genpipe1      64x128    -0 shifted, so the set's pipe varies
-2genpipe1      64x128    -0 shifted and flipped
c3a2b_reac2c    128x64    yellow paint, louvred vents
c3a1b_w2        128x160   concrete with a barred window
c3a2_bth1       192x32    ochre metal, rivets, rust
black           32x32     flat black
crete2_flr01    128x128   plain concrete floor
+0~fifts_lght01 64x80     lit ceiling panel (lamp face)
+a~fifts_lght01 64x80     +0 at 0.85 brightness
tnnl_brd1       16x128    yellow hazard stripes, scratched
crete4_stp01    128x16    concrete step edge
+0~fifties_lgt2 16x64     wall light, lit
+a~fifties_lgt2 16x64     +0 at 0.4, switched off
+0~generic86    16x16     small lit square
+a~generic86    16x16     +0 at 0.4
c3a2a_tnk1b     64x64     teal liquid
c2a4x_glu       64x64     pale blue-violet plaster
babtech_ceil01  64x64     old concrete ceiling, cracks and stains
yellow          16x16     flat yellow
```

**How:** I wrote each texture from its description, not from the game's pixels, so they are new. Concrete is a stone material, the pipes and grating are metal, the tiles are tile, the stripes are hazard, and the black and yellow are flat, as the game's own are. Lit faces are lamp reliefs. Each "off" frame is its lit frame dimmed. The preview draws the map wearing them, and the sheet is in the work folder.

**What the build still warns about:**
- The lit lamp faces read brighter than Valve's walls. That is the glow you asked for.
- `+0~generic86` and `+a~generic86` have no visible pattern. At 16×16 there is too little to show one.

**What I could not check:** Half-Life's own textures are not in this environment, so I could not put yours beside them. The walls read dim in the map (for example `c3a1_w3a` reads about 18 to 19 in RGB where the light is 0.28). That is how the map is lit. Your in-game comparison will decide whether they are at least as good.

**Not replaced:** the map also uses six textures that are not on your list: `+0medkit`, `c2a3rustdoor1`, `medkitedge1`, `{grate4a`, `{ladder1` and `{rail1b`. They still come from the game's own files.
