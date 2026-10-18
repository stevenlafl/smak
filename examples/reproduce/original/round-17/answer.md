Every file on the brief's list is at its path, and each build says OK. I could not run the game, so the sounds were judged by their measures and pictures, and the in-game checks are listed at the end.

```
File                               Build  This revision
maps/fw_yard.bsp                   OK     landmark fw_lm_yard now written; dusk sun; fw.wad textures;
                                          hazard trim, 2 pillars, 2 floor grates; 6 wall lamps
maps/fw_pumphall.bsp               OK     landmarks now named fw_lm_yard and fw_lm_hall (nothing else)
maps/fw_control.bsp                OK     valve room sunk 128 into the control floor, reached by a lift;
                                          wheel on its east wall; landmark fw_lm_hall; fw.wad textures
models/fw_pipejunction.mdl         OK     elbow is a bent pipe, not a ball; 6 bolts on each flange
models/v_ p_ w_crowbar.mdl         OK     spec length 16.2 (was 19); about 18 long when laid
sprites/fw_steam.spr               OK     rise 0.6 (was 0.25): the puff climbs as it spreads
fw.wad                             OK     panel: 6 round rivets as dials; catwalk: grooved seams;
                                          water: speckle; lamp face: bars removed; concrete and rust speckled
sound/weapons/cbar_hit1.wav        OK     centroid 1617 Hz, inside 1074 to 1654; flatness 0.146, crest 14.4
sound/headcrab/hc_attack1.wav      OK     four strikes at 0.1, 0.4, 0.5, 0.7 s; 2 of 4 counted; T20 0.34 s
sound/headcrab/hc_pain1.wav        OK     quieter cry, pulses at alternating levels; 1 of 14 counted
sound/ambience/fw_drips.wav        OK     loop crossfade 0.05 s; 22050 Hz, 16-bit, mono written out
videos/fw_wrench.mp4               OK     re-rendered from the new model (10 s)
pictures/fw_props.png              OK     re-rendered with the new pipe junction
```

The crawler and pump-hall videos, the headcrab, the wall lamp and the drum, console and valve wheel models are unchanged. The pump hall was changed only in its landmark names.

**What the fixes were**

- **Landmarks (yard, control):** the kit ignored `targetname` on `info_landmark` in a map spec. The key is `id`. I read the yard and control source files back and both now carry `targetname` "fw_lm_yard" and "fw_lm_hall". I did not read back the pump hall file.
- **Lift:** the kit puts stairs at any opening between rooms whose floors differ by more than 18. So a sunk valve room with a door-sized opening always gets stairs, and they blocked the lift. The valve room is now sunk into the control room's floor with no opening between them, so it is one space with no stairs. The lift is flush with the control floor at the pit's edge and drops 128 units. The walk test reaches all five places.
- **Wrench:** the length comes from the geometry, which went from 19 to 16.2 units. The first build gave 21.1 from 19, so the same factor gives about 18.0 now. The check does not print bounds, so this is derived, not measured.
- **Sounds:** the hit uses a lower-passed take with a grit layer; the attack has four knocks and a shorter body; the pain is a train of separate pulses over a quieter cry.

**What I could not get right, or did not check**

1. **Wrench, first person:** the jaw still sits at the bottom edge of the frame, as before.
2. **Wrench length:** please measure `models/v_crowbar.mdl` in your tool. I expect about 18.
3. **Sounds, by measure:**
   - Hit: flatness 0.146 (range 0.16 to 0.28), crest 14.4 (over 12.5), RMS -14.9 (under -12.9).
   - Attack: 2 of 4 hits counted, T20 0.34 s (over 0.3), crest 17.9.
   - Pain: 1 of 14 pulses counted, T20 0.73 s. The judge counts equal, evenly spaced pulses as one hit.
4. **Pipe junction:** 440 triangles against a median of 99 for props of its size. The judge warns, and I left it.
5. **Props as `cycler_sprite`:** the kit writes every prop this way. The yard's drums show in the renders, but nothing confirms GoldSrc draws a `.mdl` this way. This is the first thing to check in the game.
6. **Lights:** the kit writes the wall-lamp lights as white (255 255 255 200), whatever colour the spec gives. The sodium look comes from the orange glow sprites and the dusk sun, not the lights.
7. **Control room:** the four consoles and the wheel are present at the right places in the compiled map. The renders draw props as boxes unless their models are given, so I could not see them in the views.
8. **Yard:** the pipe section is still a plain column; the wall lamps have no size in the brief, so none was checked.

**Licences:** the hit, the swing and the attack use woosh-dflow takes, which are CC-BY-NC 4.0 (Creative Commons, non-commercial). You said that was acceptable for this test.

**Files I added:** `specs/fw.wad` is a copy of the built `fw.wad`, because the kit only finds wads beside a spec. The source specs are in `specs/`.
