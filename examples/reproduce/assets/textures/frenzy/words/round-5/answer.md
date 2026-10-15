The build says OK, and the `.wad` is written to `work:frenzy_new/frenzy_new.wad`. It has 29 of the map's 37 textures. The map also wears 8 it doesn't have a description for, and I haven't made those.

**Made (29):** your 25, plus 4 I derived from the same descriptions: `-1genpipe1` and `-2genpipe1` (random-tile variants of `-0genpipe1`), and `+a~fifts_lght01` and `+a~generic86` (the unlit alternates of the lights). The last two don't appear on the map's world faces.

**Not made (8):** `+0medkit`, `+amedkit`, `medkitedge1`, `c2a3rustdoor1`, `aaatrigger`, `{grate4a`, `{ladder1`, `{rail1b`. You didn't describe them, and the map's info lists the `{` ones as coming from the game's own `.wad` files. I didn't copy game textures. If you want these, send a description or a picture of each.

The preview draws each texture on its own place in the map from the camera and brightness of your pictures. I can't compare against the originals, since they aren't here.

**Known gaps:**
- `c2a4x_glu`: its flat, hard-edged blue shapes are approximated with round pipes, so the shapes look soft and tubular. This is the weakest texture.
- `c3a2a_tnk1b`: the black lower 40% is a dark radius-13 pipe, so it shades rather than being flat black.
- `c3a1b_w1` and `c3a1b_w1a`: the olive and cream paint stripes are round pipes, so they shade like tubes.
- `c3a1b_w1a`: the optional yellow-and-black hazard band at the bottom is left out.
- `c3a1_w2`: the darker band above the seam is not drawn.
- `c3a1_w3a`: the build warns that its grain reads as noise. Two photos were tried and the warning stayed, so this one is worth a look.
- The build warns that `c3a1b_w7` is brighter than most of Valve's. That is the colour you gave, so I kept it.
- The black, pure-blue and yellow textures are uniform by design. The lights are brighter than Valve's by design.

**Names:** I kept the names exactly as you gave them. `c2a4x_glu` and `c3a2a_tnk1b` have no `{` prefix, so their blue draws as solid blue rather than as holes. If the originals are holes, those names need the `{` prefix.

The spec was passed to the build inline. I have no tool to save a JSON file, so it exists only in this session's build call. The preview PNG is at `work:frenzy_new/frenzy_new-textures.png`.
