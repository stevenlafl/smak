`frenzy_new.wad` is built and the build says OK. It holds 29 textures, written to `work:frenzy_new/frenzy_new.wad`, with the sheet at `work:frenzy_new/frenzy_new-textures.png`. I did not check it against the original pictures because I don't have them.

**What's in it**

- **Your 25 textures**, each at its exact name and size. Concrete walls and floors are built from CC0 library photos (for example concrete_floor_worn_001 and brushed_concrete_04), with their pattern, scale and tone set to your descriptions. The tile floors use a grid of 32 px tiles. The pipe wall, the window machinery, the stair nosing, the hazard strips and the light faces are built from shapes and colour, not photos.
- **Four variants the map also uses:** +a~fifts_lght01 and +a~generic86 (the second light frames), and -1genpipe1 and -2genpipe1 (other random-tile pipe walls). Your list didn't name these, so I made them the way their counterparts are described. They don't appear on the map's world faces in the preview, so I couldn't check them in place.
- **Colours** are taken as the paint colour itself. If your RGB values were what someone saw in the game under the lights, the paint should be divided by the light the preview reports for each face. Some faces would then need paint above 1.0, which can't be right, so I didn't do that. Tell me if you meant seen colours and I'll switch.

**What's approximate**

- The c2a4x_glu wedge is a stepped shape, and its thin navy edge is missing.
- c3a1_w2 has the seam but not the darker band above it.
- The hazard stripes are yellow and black, not yellow and dark olive-grey.
- The window gauges are small rivets, and the vent grilles are simple bars.
- The c3a2a_tnk1b swirl is simplified to a few bands.
- The +0~generic86 glow is three flat rings, not a smooth gradient.
- The +0~fifties_lgt2 corner tints are missing.

**Warnings the build still gives**

These come from the descriptions and can't be fixed without going against them: black, pure blue and pure yellow are too even; the light faces are much brighter than Valve's; c3a1b_w7 is brighter; and c3a2_bth1 is more coloured. Two more warnings were about crete2_flr01 and the light faces (little grain).

**Not made**

Eight textures on the map have no description from you, so I didn't invent their looks: +0medkit, +amedkit, medkitedge1, aaatrigger, c2a3rustdoor1, {grate4a, {ladder1 and {rail1b. The preview draws the ones on the map's faces flat. If you describe them, I'll add them.

**One thing to check**

You described the yellow rod as looking very dark in the map. In our preview at the map's brightness it reads bright yellow. Either the original is lit differently there, or the description is off. I left the texture as you described it.
