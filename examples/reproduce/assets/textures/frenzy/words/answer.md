I've built all 25 textures into one spec, `frenzy_new.wad`. The final build says **OK** with every check passed. Each texture has the original's exact name and size, and the map preview shows the map wearing ours.

**Files** (in the work folder):
- `work:frenzy_new/frenzy_new.wad`
- `work:frenzy_new/frenzy_new.spec.json`, the spec, so it can be rebuilt
- `work:frenzy_new/frenzy_new-textures.png`, a sheet of all 25

**Kinds kept:**
- **Lights:** `+0~fifts_lght01`, `+0~fifties_lgt2`, `+a~fifties_lgt2` and `+0~generic86` keep their `~` light names and are set to shine in the dark. `+a~fifties_lgt2` is the same 16x64 size as its `+0` frame.
- **Random tiles:** `-0genpipe1` keeps its name.
- **Holes:** none of the 25 is a `{` holed texture, so there were no holes to keep.

**How I built the harder ones:**
- **c3a1b_w2:** The tool's `bars` grille blacks out everything behind it. So I drew the dim olive and tan machinery first, then laid the 9 vertical and 4 horizontal bars over it as raised strips.
- **c3a1b_w1 and c3a1b_w1a:** These follow the band layout from top to bottom. The window has rounded corners, khaki, olive and cream pipe rows and white gauges. The mullion is at two thirds on w1 and central on w1a. Below that come the ledge, the olive or cream stripe, the base with its vent grilles, and the hazard band on w1a.
- **tnnl_flr7 and tnnl_flr7c:** 16 tiles of 30 px each, set on a paler fill so the gaps read as 2 px light grout lines.
- **c2a4x_glu:** The wedge and its navy edge are built from stacked 2 px columns, so its diagonal steps slightly.

**Where it falls short of the descriptions:**
- **tnnl_brd1:** The dark stripes are black rather than dark olive-grey. The tool's hazard material only pairs its colour with black.
- **c3a1_w3a:** The cracks are spread over the whole wall. I couldn't confine them to the upper half, and they're dark lines rather than slightly lighter ones.
- **c3a2a_tnk1b:** The darker blue swirls are hard-edged ovals over a blotchy blue, not soft clouds.
- **babtech_ceil01:** The beige, sage and pinkish patches are small rectangles. The cracks form a fairly regular network rather than wandering fissures.
- **Preview pictures:** For `babtech_ceil01` and `yellow`, the preview's camera shows mostly the surrounding corridor rather than the texture close up.
- **Colours:** I used the RGB values from the descriptions as the paint colours. I had no originals to measure, so I haven't checked how either set reads under the map's light.

**Not included:** The map also uses 12 textures that weren't on your list:
- `+0medkit`, `+amedkit` and `medkitedge1`
- `c2a3rustdoor1`
- `{grate4a`, `{ladder1` and `{rail1b`
- `aaatrigger`
- `-1genpipe1` and `-2genpipe1`
- `+a~fifts_lght01` and `+a~generic86`

The preview reports six of them as drawn flat: the medkit pair, the rust door, and the grate, ladder and rail. I can add any of them if you want the whole set. The two missing `+a` light frames and the other two `genpipe1` tiles would complete those animations and random tiles.
