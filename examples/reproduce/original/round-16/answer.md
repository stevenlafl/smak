All the flagged items are rebuilt, and each file is at its brief path. The walk test passes on the copied control map, and the copied yard map builds clean. Each build says OK, with the soft warnings listed below. Nothing has been run in the game.

```
File                          Build   Notes
maps/fw_yard.bsp              OK      walk reaches all 5 entities; fit for GoldSrc
maps/fw_control.bsp           OK      walk reaches all 5 entities; lift rides down to the valve floor
models/fw_walllamp.mdl        OK      172 triangles (was 488; the game's most is 194)
models/fw_pipejunction.mdl    OK      grey steel pipes, grey base plate, 304 triangles
models/v_ p_ w_crowbar.mdl    OK      handle is a bar now, not a spindle; first-person and in-hand checked
sprites/fw_steam.spr          OK      a fuller billowing puff that rises, spreads and dissolves
fw.wad                        OK      rust is brown-orange; wet floor and water have detail
sound/weapons/cbar_hit1.wav   OK      ringing clang; decay 0.57 s (was 0.21 s)
sound/headcrab/hc_pain1.wav   OK      pulsed cry, 0.8 s, decay 0.55 s to -20 dB
sound/headcrab/hc_attack1.wav OK      dense rattle in the first 0.25 s, snapped onset
sound/ambience/fw_drips.wav   OK      20 of 20 measures; even 8-drop loop, wrap gap 0.9 s
videos/fw_wrench.mp4          OK      re-rendered from the new model
pictures/fw_props.png         OK      re-rendered with all five props
```

**What I changed**

- **Wall lamp:** cut the cage to four bars and a half-ring each side; 172 triangles.
- **Pipe junction:** the pipes are `metal_plate_02` (grey steel with rust), the base plate is the same grey steel at a smaller scale, and the flanges are unchanged.
- **Wrench:** the handle is a constant-radius bar with a pommel, a bare-iron band, and a head with a fixed jaw and a moving jaw, each with teeth on the inner faces. The grip ends are flat. The fitted `p_` and `w_` files were collapsing the handle into a cone, so I added rings along the handle, which keeps it a rod.
- **Steam sprite:** changed from a thin column to a billowing puff.
- **Textures:** rust is `rust_coarse_01` with a brown-orange tone. The wet floor uses `anti_slip_concrete`. The water has speckle and no streaks.
- **Sounds:** the hit is a generated ringing clang (a woosh-dflow take), with its band target set brighter than the game's own. The pain is a 0.8 s pulse train over a saw-tone cry. The attack has a dense rattle and a longer decay. The drips have eight drops spaced 0.86 to 0.90 s, a loop seam that matches, lower tones, and less noise bed.
- **Yard:** the pump house has two 96-wide swing doors that meet in the middle. The pipe has a snapped end. Each wall lamp has a sodium-orange glow sprite at its glass. The tan walls were the sodium light on grey concrete, so I kept plain grey concrete. The "heights 242 to 304" were the pump roof, not a slope.
- **Control room:** there is no separate valve room now. The valve room is sunk into the control floor, 128 down. Its shaft walls stand to the control floor, with a 96-wide gap on the south side. A `func_plat` lift fills the shaft and rides down 112 units. The valve wheel is on the east wall, with the button and end trigger beside it. The lamps are sodium-orange, the consoles face the windows, the walls have a hazard base and a rust cornice, and two pipe junctions stand on the north wall.

**Still open, or not verified here**

1. **Wrench in first person:** the handle now rises across the frame, the way the game's crowbar does. The jaw still sits at the bottom edge, because the kit's automatic fit puts the head near the hand. Flipping the fit moved the jaw into the camera, which was worse. I'd call this open, and it needs a look in the game.
2. **Sound residuals:**
   - Hit: centroid 1922 Hz against the game's 1343 (the target class is 1074 to 1654), crest 12.7 against 12.5, RMS -13.2 against -12.9, flatness 0.118 against 0.16. I chose brightness over matching the game's dull hit; the reviewer can decide.
   - Attack: peak at 0.06 s, and length 0.74 s, against the class's 0.21 to 0.41 (the game's own file is 0.91 s).
   - Pain: the spectrum warnings are the same as the game's own pain, which is brighter than the class range.
3. **Props as `cycler_sprite`:** the kit writes every prop as a `cycler_sprite` with its `.mdl` path. I could not confirm in-game that GoldSrc draws an `.mdl` that way. `cycler` is the entity for `.mdl` props, so this is the one to check first.
4. **Lift:** the walk test follows the lift and the valve room is reached. The shaft is a walled pit rather than a cut-through shaft, and I have not ridden it in the game.
5. **Landmark:** `fw_lm_yard` is named in both the yard and the pump hall, and the check passed. The info printer does not show `targetname`, so I could not read the compiled name directly.
6. **Rust:** the rust texture is more coloured than Valve's walls by design (the brief asks for rust). The check says so.
7. **Spit sprite:** the flicker warning (1.2 against 1.72 to 2) is kept, as before.

**Licences:** the hit, the swing and the attack use woosh-dflow takes, which are CC-BY-NC (Creative Commons, non-commercial). The pain and the drips are synthesised. You said non-commercial takes are acceptable for this test.

I did not touch the pump hall map, the crawler and pump-hall videos, the headcrab, the valve wheel, drum and console models, or the pump and swing sounds. The glow and spit sprites were rebuilt from the same spec, and their output is unchanged.
