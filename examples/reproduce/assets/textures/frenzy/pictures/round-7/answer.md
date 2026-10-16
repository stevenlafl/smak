The build says OK, and `frenzy_new.wad` holds all 25 textures under the original names and sizes. Three warnings are left. Two are on purpose: `black` and `crete2_flr01` are flat in the original, so no grain would match them. The third is `yellow`, which still has no patches.

Files are in the server's work folder: `work:frenzy_new/frenzy_new.wad` and the contact sheet `work:frenzy_new/frenzy_new-textures.png`. The preview with `each: true` drew every texture on its own place from the original's camera and brightness.

I did not feed in any of the game's pictures. Each texture is a base material with a library photograph (CC0 scan) where one fits, tuned by eye to the pictures' colours. The pictures were used only to measure colour and pattern.

Not made: the map also wears six textures that aren't in your 25 pictures, so I left them out: `+0medkit`, `c2a3rustdoor1`, `medkitedge1`, `{grate4a`, `{ladder1`, `{rail1b`. Those stay on the game's own wads.

Where I'm least sure:
- **Identification.** Several input pictures are in-game views, not flat tiles. I named `yellow`, `babtech_ceil01`, `c3a2a_tnk1b`, `c2a4x_glu`, `tnnl_brd1`, `crete4_stp01` and the two `fifties` lights from those views, so they may be off.
- **`tnnl_brd1`.** The original has three bands across its 16-texel width. I made one hazard-stripe pattern with two seams, so the grey and grid bands are missing.
- **`-0genpipe1`.** The pale left column is a concrete base with a dark panel over the right side, so the edge won't match exactly.
- **Reliefs.** Grilles, louvres and pipes are placed by eye, not measured against the original.
