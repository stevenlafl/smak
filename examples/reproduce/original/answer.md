The Flooded Works mod is built in the work folder: all 26 brief files plus the supporting files the maps need. The one part I could not build as briefed is the lift. The kit can't cut a lift shaft, so the control map's valve room is reached by a 16-step stair. Nothing has been run in the game, so every check below is the kit's own, not a play test.

**Deviation to decide:** the lift is a stair. Making a real lift needs a shaft cut through the floor, and the kit only builds a stair for stacked rooms. If you want a lift, it needs an editor pass on `fw_control`.

**What I made**

```
Brief file                      Status
maps/fw_yard.bsp                built, walk test passes, all entities reached
maps/fw_pumphall.bsp            built, walk test passes, corridor exit reached
maps/fw_control.bsp             built, walk test passes (stair, not lift)
models/fw_valvewheel.mdl        344 triangles, 32 across, red spokes and hub
models/fw_drum.mdl              272 triangles, rusted, hazard stripe
models/fw_console.mdl           24 triangles, screens, dials, switch row
models/fw_pipejunction.mdl      504 triangles, bolted flanges, hazard band
models/fw_walllamp.mdl          caged, sodium-orange glass, glows
models/v_crowbar.mdl            pipe wrench, first person (crowbar hands kept)
models/p_crowbar.mdl            pipe wrench, in another player's hands
models/w_crowbar.mdl            pipe wrench, lying in the world
models/headcrab.mdl             sludge crawler on the headcrab's skeleton
fw.wad                          12 textures, all named in the brief
sprites/fw_steam.spr            animated, rises and thins
sprites/fw_glow.spr             sodium glow
sprites/fw_spit.spr             animated splash
sound/weapons/cbar_hit1.wav     wrench strike
sound/weapons/cbar_miss1.wav    wrench swing
sound/headcrab/hc_attack1.wav   crawler bite
sound/headcrab/hc_pain1.wav     crawler pain
sound/ambience/fw_pump.wav      pump loop
sound/ambience/fw_drips.wav     drip loop
videos/fw_wrench.mp4            turntable, 8 s
videos/fw_crawler.mp4           turntable, walk cycle, 8 s
videos/fw_pumphall.mp4          walk through the hall, 8 s
pictures/fw_props.png           the five props side by side
```

Extra files the maps need: `fw_yard.wad`, `fw_pumphall.wad` and `fw_control.wad` (map-only textures), the yard sky under `gfx/env/fw_yard/`, and `models/fw_yard/fw_pipesection.mdl`, the broken truck-sized pipe in the yard.

**How the chain works**
- `fw_yard`: starts by the gatehouse, leaves through the pump house's double doors into `fw_pumphall`, via a trigger that names landmark `fw_land_1`. Both maps carry that landmark.
- `fw_pumphall`: a flooded hall with three pumps, catwalks, a bridge, ladders, the wrench and three crawlers. It leaves by a stair up to a corridor, through a trigger naming `fw_control` and landmark `fw_land_2`.
- `fw_control`: arrives at the entry, looks down through four windows onto the flooded hall, and has four consoles and the valve room below. The valve wheel's trigger ends the mod.

**What I checked**
- Every map, model, sprite and sound passed its build checks. The builds report no engine errors.
- Every map's walk test reaches its entities on foot, and the changelevel names and landmarks match across maps.
- Every picture the builds drew was looked at.

**Known weak spots**
- The wrench rim is steel, while the spokes and hub are red. The brief asked for red paint worn to steel at the rim.
- The sound takes are at the edge of the game's ranges. The wrench hit, the swing, the bite and the yelp all have spectral or decay notes in the report. Only listening in the game will settle them.
- The pump-hall flight is a walk-through at eye height, not a free flight. A camera path kept clipping solids.
- Map lights are the kit's plain white lamps. The sodium colour comes from the glows and the lamp props only.
- A few drops of 210 units or more sit at stair edges. I left them unrailed.

**Licences (you accepted these for this test):** the wrench swing uses woosh-dflow, licensed CC-BY-NC 4.0, which is non-commercial. The other takes use stable-audio-3-sfx, under the Stability AI Community Licence: commercial use is free only for an organisation under US$1M annual revenue. The headcrab and the sprites were built from the kit's own models and layers.
