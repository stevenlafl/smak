Everything in the brief is in the work folder at its path. Most assets pass their checks. Some do not, and those are listed below.

```
maps/fw_yard.bsp            compiled map (BSP). 1500 x 1500 yard, sky, high walls,
                            gatehouse with door and console, pump house with double
                            doors, drums, broken pipe section. Changelevel to fw_pumphall.
maps/fw_pumphall.bsp        hall 2000 long, water 110 deep, 3 pumps, catwalks both sides,
                            bridge, ladders at opposite corners, wrench on the north
                            catwalk, 3 crawlers in the water. Stair (6 steps) up to a
                            corridor. Changelevel to fw_control.
maps/fw_control.bsp         arrival corridor, control room with 4 consoles under 4
                            windows over the hall, lift to a valve pit, valve wheel
                            with an end-of-mod trigger (trigger_endsection).
models/fw_valvewheel.mdl    31.9 across, red paint, steel rim. 194 triangles.
models/fw_drum.mdl          22.6 wide, 35 tall, hazard band, rolling hoops. 96 triangles.
models/fw_console.mdl       42 tall, 2 screens, 4 dials, 6 switches, hazard base.
models/fw_pipejunction.mdl  two pipes, flanged elbow, bolts. 276 triangles.
models/fw_walllamp.mdl      caged lamp, orange face. Built, not placed in any map.
models/v_crowbar.mdl        first-person wrench, the game's hands and 11 animations.
models/p_crowbar.mdl        in-hand wrench.
models/w_crowbar.mdl        world wrench.
models/headcrab.mdl         sludge crawler on the headcrab skeleton, 21 animations,
                            6 legs, pale belly, ring of 8 teeth. 412 triangles.
fw.wad                      14 textures, at the root.
sprites/fw_steam.spr        animated steam puff (12 frames, env_sprite).
sprites/fw_glow.spr         sodium glow (env_glow).
sprites/fw_spit.spr         animated splash ring with sparks (8 frames).
sound/weapons/cbar_hit1.wav, cbar_miss1.wav
sound/headcrab/hc_attack1.wav, hc_pain1.wav
sound/ambience/fw_pump.wav  looped drone
sound/ambience/fw_drips.wav looped drips
videos/fw_wrench.mp4        title and turntable.
videos/fw_crawler.mp4       title and turntable on the walk.
videos/fw_pumphall.mp4      title and a 30 s flight through the hall.
pictures/fw_props.png       props, wrench and crawler side by side.
```

**Open issues**

1. **Pump hall length.** The hall is 2000 long, not about 2500. With the entry, stair and corridor the level is 3320 across.
2. **Lift.** The walk test cannot model a lift, so it reports the valve pit as reachable only by a fall. This is a known limit of the check, not the lift design.
3. **Pump hall flight.** Six frames show large changes: at the entry opening, a pump edge and the stair. The file is written, but the tool still marks it NOT OK for those jumps.
4. **Sound spectra.** Filtered takes from the generator still sit outside the game's own bands. The hit and swing are off in opposite bands; the bite and the drips are too bright. I could not get them to zero by filtering. Listen in the game.
5. **fw.wad.** I rebuilt it from exported pictures, so the lamp face lost its fullbright flag. It is orange but not self-lit; the light comes from the map's light entities. Two textures are flagged for grain (wet floor, hazard).
6. **Triangle warnings.** The valve wheel (194) and pipe junction (276) are over the three-quarter line for their size. I kept the bolts and rim, since they carry the silhouette.
7. **Extra files the maps need**, which the brief did not list: `fw_yard.wad`, `fw_pumphall.wad`, `fw_control.wad` (map textures, at the root); `models/fw_yard/fw_pipesec.mdl`; and the yard sky, in `work:fw_yard/gfx/env/fw_yard/`, which must be copied into the mod's `gfx/env/`.
8. **Compile quality.** The yard is at normal quality. The pump hall and control room are at draft, because hlvis timed out at normal.
9. **Licence.** Six sounds are woosh-dflow takes under CC-BY-NC 4.0, non-commercial. You accepted that for this test. Textures come from the CC0 library.
10. **Work folder.** It holds build leftovers (`fw/`, `fw_test*`, duplicate root `.mdl` files). They are not part of the mod.

**Choices I made**

- The wrench is a held model on the crowbar's rig, sized at its real length (18.8).
- The crawler's middle legs are soft blob limbs on the spine, and the teeth are cones on the jaw.
- The valve room is a sunken pit reached by a func_plat lift, not a separate room.
- The stair is a raised corridor with a short opening stair. A long 376-unit stair failed the walk test even with headroom fixed.

Build-tool notes for the next session are in `work:NOTES-smak-paths.txt`. The memory folder was not writable from here, so they are in the work folder instead.
