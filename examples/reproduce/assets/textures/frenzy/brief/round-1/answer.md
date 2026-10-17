The `frenzy_new.wad` build says OK. It has 29 textures covering the 26 you listed, with the random pipe set and the lamp animation frames made as their own entries.

**Files:** the spec is `work:frenzy_new.json` and the compiled wad is `work:frenzy_new/frenzy_new.wad`, with a contact sheet at `work:frenzy_new/frenzy_new-textures.png`.

**How they were made:** each texture is a material built from a base (concrete as stone or plaster, machinery as metal or paint, floors as tile), with a tone, grime, and wear. Some use CC0 photographs from the material library for grain (wall and floor concrete, the damaged ceiling). Relief adds the machinery: seams, bars, a pipe, louvres, rivets, and lamp faces. The animations work like this:
- `+0~fifts_lght01`, `+0~fifties_lgt2` and `+0~generic86` are the lit frames, with a lamp face.
- `+a~` frames are the same texture dimmed to 0.4 or 0.5 (0.5 for `+a~generic86`), so they read as switched off.
- `-1genpipe1` is `-0genpipe1` flipped, and `-2genpipe1` is it shifted half a tile.

**What I changed after the first build:** several pale walls came out near white in the map preview, so I darkened them to a mid grey. I also added grain to the plain lamp and ceiling textures.

**What the build still reports:**
- `black`, `yellow` and `c2a3rustdoor1`-style plain fills are flagged as too even and bright. That is expected for plain fills you asked for.
- `c2a4x_glu` and `c3a2a_tnk1b` are flagged as more coloured than Valve's walls. That is the blue you asked for.
- `babtech_ceil01` is flagged for noise-like grain. I did not fix it, and it is the one I would look at first.
- `c3a2_bth1`'s ochre is coloured but within the metal range I chose.

**Things to check:**
- The blue panels are opaque. Your description said the blue is where the map shows through, but the names have no `{` hole prefix, so I kept them solid. Tell me if you want them as holes.
- `c3a1_w3a` and `c3a1_w2` read very dark on the preview face (about 9 to 22 of 255). That is what "dark" gave, but it may be darker than the game's wall. Only your side-by-side can say.
- The preview map also uses `+0medkit`, `c2a3rustdoor1`, `medkitedge1`, `{grate4a`, `{ladder1` and `{rail1b`. You did not list them, so I did not make them, and the map keeps the game's versions for those.

I could not compare against the game's own textures here, since they are not in this environment. The judgement of "at least as good" is yours and theirs in the game.
