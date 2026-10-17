I built the mod's assets, but the three maps are not yet in the `maps/` folder the brief asks for, and I need one thing from you to finish that.

**Blocker: map placement.** The maps compile through the build tool, which has VHLT (Vluzacn's ZHLT compilers), but the command line cannot find VHLT and I have no way to move files. The compiled maps are at `work/fw_yard/fw_yard.bsp`, `work/fw_pumphall/fw_pumphall.bsp` and `work/fw_control/fw_control.bsp`. Either give me the folder that holds `hlcsg`, `hlbsp`, `hlvis` and `hlrad`, and I'll recompile into `work/maps/`, or tell me to leave them where they are.

**What's made** (all under the work folder unless noted)

| Brief file | Where | Status |
|---|---|---|
| `maps/fw_yard.bsp` | `work/fw_yard/` | Compiles, walk test passes, lit to 76/255 |
| `maps/fw_pumphall.bsp` | `work/fw_pumphall/` | Compiles, every entity reached on foot, hall lit to 66/255 |
| `maps/fw_control.bsp` | `work/fw_control/` | Compiles, every entity reached, lift and ladder give a way out |
| `models/fw_valvewheel.mdl` | `models/` | Passes, 280 triangles, red paint with worn steel rim |
| `models/fw_drum.mdl` | `models/` | Passes, 240 triangles, rust and hazard stripe |
| `models/fw_console.mdl` | `models/` | Passes, but 24 triangles: a box with painted dials, screens and switches. It reads boxy |
| `models/fw_pipejunction.mdl` | `models/` | Passes, 528 triangles, over the median for a prop |
| `models/fw_walllamp.mdl` | `models/` | Passes; the glass is inside its cage, so the check flags its triangles as hidden |
| `v_crowbar.mdl`, `p_crowbar.mdl`, `w_crowbar.mdl` (pipe wrench) | `work/fw_wrench_weapon/` | Built with the game's names. The build puts weapon files in a folder named after the spec, not in `models/` |
| `models/headcrab.mdl` (sludge crawler) | `work/headcrab.mdl` | Passes, keeps all the base's animations and contract, 580 triangles. Its belly and teeth render dark brown; I could not find the cause |
| `fw.wad` | `work/fw.wad` | 13 textures; `fw_hazard` and `fw_door` are flagged as too coloured |
| `sprites/fw_steam.spr`, `fw_glow.spr`, `fw_spit.spr` | `work/sprites/` | Pass; the steam matches Half-Life's smoke puffs on all five measures |
| 6 sounds (`cbar_hit1`, `cbar_miss1`, `hc_attack1`, `hc_pain1`, `fw_pump`, `fw_drips`) | `work/sound/` | Pass with spectral warnings; the hit and swing are darker or brighter than their classes |
| `videos/fw_wrench.mp4`, `fw_crawler.mp4` | `work/` | Encoded, turntables pass |
| `videos/fw_pumphall.mp4` | `work/` | Encoded, a straight flight down the hall. One frame jumps at about 3.4 s, when a ladder or monster enters the view |
| `pictures/fw_props.png` | `work/pictures/` | Sheet of the five props, side by side |

The walk test passes all three maps. The yard's drums, pipe section and gatehouse door are in place, and the pump hall's landmarks match the yard's and the control map's. The control room's windows look into a flooded viewing bay with pumps, not the hall itself: maps cannot see each other.

**Where I departed from the brief**
- The lift is a `func_plat` in a shaft, with a ladder back up so the pit is not a one-way drop. The shaft's edge still draws a fall warning.
- The yard's sun barely lit the open sky, so it uses nine sodium-coloured lights hung at 100.
- The pump-hall flight is a straight run down the hall at y = 120, not a walk through the test route, which jumped at every corner.

**Licences.** The hit, swing, bite, pain and drip sounds were generated with woosh-dflow (Creative Commons non-commercial) and stable-audio-3-sfx (Stability AI community licence: free under US$1M revenue). The sounds are non-commercial as a result.

I couldn't save a memory note from here, so the build quirks I hit are in `work/notes-smak-quirks.txt`.
