I've built `frenzy_new.wad` from one smak.wad/1 spec, and the last build says **OK** with every check passing. It holds all 37 textures the map uses, each under its original name and size. With the preview, the map draws entirely in ours and nothing is reported missing.

The map wants 12 more textures than your list of 25: the off frames (`+a~fifts_lght01`, `+a~generic86`, `+amedkit`), the pipe variants `-1genpipe1` and `-2genpipe1`, plus `+0medkit`, `medkitedge1`, `c2a3rustdoor1`, `{grate4a`, `{ladder1`, `{rail1b` and `aaatrigger`. Without them the map would still use the game's versions for those, so I made them too. None of these 12 has a picture, so I drew them from what Half-Life's own textures look like, not from a reference.

**Kinds kept:**
- **Animations:** each `+0`/`+a` pair is an on and an off frame. The on frames of the lights and the health charger light are fullbright.
- **Random tiles:** `-0`/`-1`/`-2genpipe1` all have the same pipes, with the vertical runs and valves in different places.
- **Holes:** the `{` textures have real see-through holes.

**Seams:** anything that crosses a tile edge is split into two halves, since panels don't wrap. In `c3a1b_w1`/`w1a` that's the crack, the vent and the groove under the pillar between windows, so the walls repeat without a seam.

Where to look first when judging:

1. **The originals are in-game screenshots, not texture dumps.** Colours and scale are read off the screenshots, so they include the map's lighting, and the scale is estimated. That affected the floor grid most: I chose 16-texel tiles for the two `tnnl_flr7` floors.
2. **I read `black`, `c2a4x_glu` and `c3a2a_tnk1b` as glowing blue.** In their screenshots the logo letters and tank bands are saturated flat blue. So `c2a4x_glu` is solid bright blue and `c3a2a_tnk1b` is blue glow bands on near-black. If those surfaces are actually grey under blue light, these two are wrong.
3. **`c3a1b_w7` is near-black** because its picture is fully black.
4. **The `{` textures are rougher than the rest.** The kit ignores panels on mesh textures, so they're plain grids. `{ladder1` is one rail and one rung per 32-texel tile. `{rail1b` is a 16-texel grid so it tiles cleanly across 48x32, not the original's bar layout.

Files are in the work folder: `frenzy_new/frenzy_new.wad` and the contact sheet `frenzy_new/frenzy_new-textures.png`. I checked it with the build's contact sheet, its six map views and two close renders of the corridor walls. I haven't run it in the game.
