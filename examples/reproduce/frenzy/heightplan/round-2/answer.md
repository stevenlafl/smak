The map builds OK: `frenzy_copy` compiles to a `.bsp`, the build reports no leaks, and all 54 entities a player goes to are reached on foot. It does not match the original closely yet. The layout and floor heights come from your height plans, but the entity positions, the lighting and the textures are my approximations, and several of the original's entities are missing.

**What the build does** (`/tmp/smak-repro-cbayz2/work/frenzy_copy/frenzy_copy.bsp`, source `frenzy_copy.map`)
- Layout and floor heights: the four height-plan layers carve the space (`floorplan: work:heightplan/`), so the rooms, stairs, ledges and drops follow your pictures.
- Starts: `info_player_start` and 14 `info_player_deathmatch`, placed from the labels on `plan.png`.
- Weapons, ammo and items: 33 point entities placed from the plan and storey labels.
- Textures: Half-Life's own, picked by name words and colour: floor `C1A3FLOOR02`, walls `METAL_BORD08`, ceiling `BABTECH_CEIL02`.
- Light: the engine's 24 automatic lamps under the largest spaces.

**What is not reproduced, and why**
- Not placed: 12 `func_wall`, 2 `func_door`, 2 `func_ladder`, 1 `func_healthcharger`, 2 `trigger_multiple` and 8 `env_glow`. Floor-plan entities are points only, and the spec has no brush entities on the plan, so the doors, lifts and ladders are missing. The gallery that depends on a ladder is unreachable as a result.
- Lights: I placed the original's 8 lights by hand, but any light entity switches off the automatic lamps, and eight of them came out far dimmer. I went back to the automatic lamps.
- `ammo_snarks` is not a class in Half-Life's entity list, so I used `weapon_snark`. The other ammo names were corrected to the list's spelling.

**Accuracy caveats**
- Entity positions and floor layers are read by eye from `plan.png` and the storey pictures. Only one entity (the deathmatch start at 611,503) is on the upper layer; the rest are on layer 0.
- I could not compare against the original's views: the input folder is not readable as a directory, and there is no original `.bsp` to draw. So the "matches side by side" judgement is still open.
- The build warns "floorplan: not a field of a map spec" on every run, yet the floor plan is used (the build reports 4 layers). I did not resolve that warning.
- The walk test finds 48 places where a player can fall more than 210 units. I left them, since the upper galleries are the source of those drops; the build asks to rail or mean each one.

Next steps, if you want to push closer: add the brush entities (doors, ladders, the healthcharger) once the spec can place them, and check the upper-gallery entity layers against the original's views.
