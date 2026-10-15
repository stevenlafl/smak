The build says OK: `frenzy_new.wad` holds all 37 textures under the map's names and sizes, and every check passes. The file is at `work:frenzy_new/frenzy_new.wad`, with a texture sheet beside it.

**What I built**

- You listed 25 textures, but the map wears 37. I made all 37, so the 12 extras are my own designs: `-1genpipe1`, `-2genpipe1`, `+a~fifts_lght01`, `+a~generic86`, `c2a3rustdoor1`, `+0medkit`, `+amedkit`, `medkitedge1`, `aaatrigger`, `{grate4a`, `{ladder1`, `{rail1b`.
- Concrete textures use CC0 concrete photographs from the library, with colour set to your numbers. Machinery, pipes, panels, vents and hazard bands are built from the spec's relief and panel parts. Lights are neon-based, and the colour-keyed pieces are plain fills.
- The preview draws each texture on its own face of the map. Brightness and camera are the build's own, since the originals are not in this environment.

**Warnings left (6)**

- `black`, `crete2_flr01` and `yellow` are uniform in the original, so I kept them flat. The checker only flags a lack of grain.
- `c3a1b_w7` is brighter than Valve's walls (0.66 against 0.33 typical). That matches your description (160, 165, 195).
- `+a~generic86` and `aaatrigger` are flat and have no pattern. `aaatrigger` is invisible in the game.

**Known differences from the descriptions**

- `c3a1_w3a`: the cracks are dark, not lighter.
- `c2a4x_glu`: the diagonal wedge is a five-pixel staircase, not a true slope.
- `c3a1b_w7`: no faint horizontal banding.
- `tnnl_flr7`: the doubled joints are not there.
- `c3a1b_w1` and `c3a1b_w1a`: the window corners are square.
- `c3a2a_tnk1b` and `c2a4x_glu`: the names have no `{`, so they are solid in the game, as the map names them. Your description calls them masked or cut-out, so tell me if you want holes.
- The medkit and the unlit light variants are guesses, since you gave no description of them.

**Open points**

- The preview shows a pale strip under `c3a2b_reac2c`. It is not in the texture: the sheet and the texture built alone are both clean. I think it comes from the preview's surroundings, but I did not confirm that. Check it in the game.
- The spec exists only in this conversation, because I can't write files here. To rebuild, save it as a `.json` file and build that. I can do this if you tell me where it should go.
