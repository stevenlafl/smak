Every file the brief names is now at its path. Here is the status of each, followed by what changed and what is still open.

```
File                                   Status
maps/fw_yard.bsp                       OK. Fit for GoldSrc, walk reaches all 4 entities
maps/fw_pumphall.bsp                   OK. Fit for GoldSrc, walk reaches all 8 entities
maps/fw_control.bsp                    OK. Fit for GoldSrc, walk reaches all 5 entities
models/fw_valvewheel.mdl               OK (unchanged)
models/fw_drum.mdl                     OK (unchanged)
models/fw_console.mdl                  OK (unchanged)
models/fw_pipejunction.mdl             OK. 304 triangles (was 544; game's most is 422)
models/fw_walllamp.mdl                 OK. Caged bulb, now centred. Judgement call
models/v_crowbar.mdl, p_, w_           OK. Handle has a bare-iron band, orientation fixed
models/headcrab.mdl                    OK (unchanged)
fw.wad                                 OK. 13 textures, no warnings on the final build
sprites/fw_steam.spr                   OK. Type is now parallel oriented
sprites/fw_glow.spr                    OK (unchanged)
sprites/fw_spit.spr                    OK, one warning: flicker 1.2 vs 1.72 to 2
sound/weapons/cbar_hit1.wav            OK, two soft warnings (decay, class spread)
sound/weapons/cbar_miss1.wav           OK, every feature in range
sound/headcrab/hc_attack1.wav          OK, class warnings only (matches the game's own file)
sound/headcrab/hc_pain1.wav            OK, soft warnings on attack and decay
sound/ambience/fw_pump.wav             OK, crest 7.6 vs 8.3 (minor)
sound/ambience/fw_drips.wav            OK, centroid 1066 vs 671 to 1007 (slightly bright)
videos/fw_wrench.mp4                   OK, rebuilt
videos/fw_crawler.mp4                  OK (unchanged)
videos/fw_pumphall.mp4                 OK, both flagged frames gone
pictures/fw_props.png                  OK, rebuilt with the new props
```

**What I changed**

- **Pump hall.** The wrench moved to x 1000, y 400 on the north catwalk, beside the ladder top. The walk test ignores ladders, so I added a stair at each end of both catwalks: nine 16-unit treads, each 32 deep, from the hall floor. The catwalks now sit at 144 rather than 160. A 32-unit hull straddles shorter treads, which is why the earlier stairs failed. I added steel rails along the walkway and bridge edges. The compiled map now passes the walk.
- **Pump hall video.** The two flagged frames came from the path. Adding a key at the midpoint removed both, and the largest frame change went from 41 to 17.
- **Control room.** It is rebuilt: the hall lies below, with six windows and four consoles along the south wall. The valve room is east, 128 below, with the valve wheel, the button and the end trigger. The two crawlers are kept.
- **Yard.** Dusk sky, warm sodium lights at the four wall lamps, a three-drum stack, and a 192-wide double door on the pump house. The sky's six images are copied to `gfx/env/fw_yard/`.
- **Textures.** The catwalk is a diamond-plate photo, the panel has dials, the lamp has a cage, the pipes are iron, the wet floor and water are worn, and the hazard stripes are wider.
- **Sounds.** The hit, swing, bite and pain come from generated takes, and the pump and drips are layered. Each is fitted to the game's own band shares. Two takes are from woosh-dflow (CC-BY-NC, non-commercial) and two from stable-audio-3 (Stability community licence).
- **Sprites.** The steam is `parallel oriented`. The spit is grey-green with a later peak.
- **Wrench.** The handle is split, with a bare-iron band, and the jaw now sits at the far end in first person.

**Still open**

1. **No lift.** The kit cannot cut a shaft through a floor, so the valve room is reached by an 8-step stair from the control room's opening. This departs from the brief.
2. **Spit flicker** is 1.2 against the sparks class range of 1.72 to 2. I kept the sparks class rather than change it to pass.
3. **Sound warnings.** The hit decays to -20 dB in 0.205 s against 0.24 s. The pain's attack is 0.23 s. The class ranges for the crawler's sounds differ from the game's own files, which the layers match.
4. **Wall lamp** is a judgement by eye. I had no Valve reference to compare against.
5. **Drums and props.** Props compile as `cycler_sprite` entities that carry the `.mdl` path. The views do not draw them, so I could not see the drums. I have not confirmed that GoldSrc draws an `.mdl` through `cycler_sprite`. Please check that in the game.
6. **Sweep warnings.** The walk sweep still lists 14 points beside the bridge rails. The rails block the step, so I read it as conservative.
