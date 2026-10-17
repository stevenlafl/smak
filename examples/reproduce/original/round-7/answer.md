The mod is built, but three things are not as the brief asks: the headcrab and the weapon's three files are not in `models/`, and the pump hall's wrench is not reached by the walk test. Everything else is in place and passes the build checks.

**Where the files are (work folder)**

```text
maps/fw_yard.bsp            compiled, passes (dim dusk yard by design)
maps/fw_pumphall.bsp        compiled, one walk fault (see below)
maps/fw_control.bsp         compiled, passes with notes (see below)
models/fw_valvewheel.mdl    passes, 324 triangles
models/fw_drum.mdl          passes, 224 triangles
models/fw_console.mdl       passes, 36 triangles
models/fw_pipejunction.mdl  passes, 376 triangles
models/fw_walllamp.mdl      passes, 132 triangles
fw.wad                      12 textures, passes (lamp and door flagged for grain)
sprites/fw_steam.spr        passes, all 5 measures in range
sprites/fw_glow.spr         passes
sprites/fw_spit.spr         passes, all 5 measures in range
sound/weapons/cbar_hit1.wav        no faults; spectrum warning (too bright)
sound/weapons/cbar_miss1.wav       no faults; spectrum warning (too bright)
sound/headcrab/hc_attack1.wav      no faults; spectrum warning (too dark)
sound/headcrab/hc_pain1.wav        no faults; spectrum warning (too dark)
sound/ambience/fw_pump.wav         passes, every feature in range
sound/ambience/fw_drips.wav        no faults; spectrum warning (too dark)
videos/fw_wrench.mp4        turntable, encoded
videos/fw_crawler.mp4       turntable, encoded
videos/fw_pumphall.mp4      flight through the hall, encoded (70 degree lens)
pictures/fw_props.png       all five props side by side
```

**Not in the paths you asked for**
- `headcrab.mdl` is at the work root, `work:headcrab.mdl`. It is built on the game's headcrab skeleton and keeps its contract (no contract faults). The command line can't write it into `models/`, because it can't see the game folder.
- The pipe wrench's `v_crowbar.mdl`, `p_crowbar.mdl` and `w_crowbar.mdl` are in `work:pipewrench_weapon/`. The brief says the weapon's files are written under the game's names, so I took that folder as the location. They keep the crowbar's animations and pass the build.
- Build leftovers are in the work folder (`headcrab_probe.*`, `v_wrench_probe*`, `fw/`, `fw_tex/`, and the per-map build folders). I can't delete files with these tools, so please clear them.

**Map notes**
- Yard: the pump house door is a single door, not a double door, because the kit's door is one leaf. The broken pipe is a large inline section. The sky is set to dusk. The yard floor is at 15 of 255, marked `dark: true` on purpose, so the orange light comes from the lamps and sprites.
- Pump hall: three pumps, bridge, ladders, three crawlers, a corridor and stairs up to the control room. The walk test does not climb `func_ladder` ladders, so the catwalks and the wrench on the south catwalk show as not reached. That is the test's limit, not a level error; please check it in the game.
- Control room: four consoles under four windows looking into the hall, two crawlers, and the valve wheel with a button that fires `game_end`. The valve room is reached by stairs, not a lift, because the kit has no lift. The stairwell drops 272 units if a player steps into it, and it has no rail (flagged, not railed).
- Level chain: yard → pump hall via `fw_land_yard`, pump hall → control via `fw_land_hall`. Each landmark exists in the map it leads to.

**Weapon and enemy notes**
- Pipe wrench: 17.7 long, red handle with worn highlights, iron grip, toothed head. The rim-wear on the valve wheel reads red more than steel, so the "worn to steel at the rim" effect is weak.
- Headcrab: grey-green back, pale belly, and a ring of teeth. The legs read as flat fins from the side, which is the weakest part.

**Verification and tooling**
- Maps compiled through the build tool, which has VHLT. The command line can't find VHLT, so I copied each compiled file to `maps/` with `map-set`, changing nothing.
- Nothing has been run in the game. The sound, weapon and headcrab fit need a look and listen in Half-Life.
