The .wad builds OK. It has all 37 texture names the map uses, each at its original size, written to `work:frenzy_new/frenzy_new.wad`. The map renders wearing it cleanly in the 8 views I checked.

**Lifted off the map's own pictures (17):** c3a1_w3a, c3a1_w2, c3a1b_w3, c3a1b_w1, tnnl_flr7, c3a1b_w7, tnnl_flr7c, silo2_wetdr, c3a1b_w1a, -0genpipe1, c3a2b_reac2c, c3a1b_w2, c3a2_bth1, black, tnnl_brd1, crete4_stp01, babtech_ceil01. Each lift also uses the map's view sheet. Lamps use the darker view at brightness 0.5: +0~fifts_lght01, +a~fifties_lgt2, +0~fifties_lgt2, +0~generic86. Yellow also uses its darker view.

**Painted (20), since the build could not read them from a picture:**
- **Blue-lit, no colour to read:** crete2_flr01, c3a2a_tnk1b, c2a4x_glu. Their colours are my guesses, so the judge will see the most difference here.
- **Worn on the map but in no view, so no lift:** +0medkit, +amedkit, medkitedge1, c2a3rustdoor1, aaatrigger, and the three `{` holes (grate, ladder, rail as mesh). Their looks come from their names.
- **Animation frames no face wears:** -1genpipe1 and -2genpipe1 are pipe runs; +a~fifts_lght01 and +a~generic86 are lamp faces. These are approximations of their other frames.

**Residual warnings:** build still says OK.
- aaatrigger and +a~generic86 are flagged for no patches. Both are 16×16, too small for the patch test to pass. aaatrigger is a trigger face the game never draws.
- +a~fifts_lght01 is flagged as brighter than Valve's. It's a lamp face, and I dimmed it as far as I could.

**Two things to know:**
- I couldn't save the spec as a file: the Write tool is disabled in this session. The spec is the build call I ran, so if you want it on disk I'll need to write it another way.
- I didn't take the per-texture `each` preview images. The build reported its colour and scale numbers for each texture, and I checked the map views, not every texture's own place.
