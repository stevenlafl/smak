The build says OK: `frenzy_new.wad` holds all 25 textures under their original names and exact sizes, and the map preview draws it wearing them. It's at `work:frenzy_new/frenzy_new.wad`, with a contact sheet beside it at `frenzy_new-textures.png`.

**What I checked:**
- I looked at the contact sheet and at six in-map views. The layouts read as the descriptions say: the machinery bays with the olive or mustard stripes, the castellated seams, the 8x8 floor grids, the lattice grate, the pipe bundle, and the 45° hazard bands.
- The special kinds are kept. The `+0~` light faces and `+0~generic86` are fullbright, and `+a~fifties_lgt2` is the dimmer grey "off" frame. `-0genpipe1` keeps its random-tile name.
- `black`, `yellow` and `c2a4x_glu` are flat single values (0,0,0 / 255,255,0 / 0,0,255).
- Edge-to-edge features like the grout, beams, pipes and the `c3a1_w2` seam are placed so they line up when the texture repeats. The build reported no tiling problems, but I didn't zoom into the repeats to confirm by eye.

**Things to know before judging:**
- **`c3a1b_w2` had no description** in your list, so it's a guess: the same family as `c3a1b_w3` (grey-blue concrete panel, raised top band, side seams, drip stains), plus the olive stripe. If you have a description, I'll redo it.
- **Six textures the map uses aren't in your list**, so they're still drawn flat: `+0medkit`, `c2a3rustdoor1`, `medkitedge1`, `{grate4a`, `{ladder1`, `{rail1b`. The build OK covers the 25 you listed; the map isn't fully covered yet.
- **Detail is limited by what the spec can express.** Textures are built only from a base material, rectangle/rounded/ellipse patches, and grime. Patches can't be rotated, so the diagonal braces in `silo2_wetdr` and the hazard bands in `tnnl_brd1` are stepped in 2-3 px stairs. The tool's own hazard material only makes ~2 px stripes, not the 8 px bands described. The water stains on `c3a1b_w3` are oval patches and look a bit blobby up close.
- **Two tool quirks:** keys the tool doesn't know (like `rotate` on a patch) are dropped without a warning. Rendering a single texture straight from the .wad (`render kind: uv`) crashes with an offset-out-of-range error, so I could only see each texture at contact-sheet size.

I also made two small test wads while working out the hazard stripes (`work:hz_test/`). They can be deleted.
