Everything on the brief's list is built, with the exact file names, and the pieces that needed a game-side check are passing their checks. Nothing has been run in the game itself.

**What's in the work folder**

```
maps/fw_yard.bsp, fw_pumphall.bsp, fw_control.bsp   (+ each map's .wad, which holds its ladder textures)
models/fw_valvewheel.mdl, fw_drum.mdl, fw_console.mdl, fw_pipejunction.mdl, fw_walllamp.mdl
models/headcrab.mdl, v_crowbar.mdl, p_crowbar.mdl, w_crowbar.mdl
fw.wad                       12 textures
sprites/fw_steam.spr, fw_glow.spr, fw_spit.spr
sound/weapons/cbar_hit1.wav, cbar_miss1.wav, sound/headcrab/hc_attack1.wav, hc_pain1.wav
sound/ambience/fw_pump.wav, fw_drips.wav
videos/fw_wrench.mp4, fw_crawler.mp4, fw_pumphall.mp4
pictures/fw_props.png        the five props side by side
```

Also in the folder: `gfx/env/fw_yard/` (the yard's dusk sky, which the mod needs), and every build input under `specs/`. The sound takes the sounds came from are in `gen/`.

**What I made**

- **fw_yard**: a 1440-unit sky-open yard inside a 240-unit wall, a gatehouse with a swinging door and a control console, a pump house with 96-unit double doors, four drums, the valve wheel, the pipe junction, a broken pipe section, and two caged lamps. The pump house holds the changelevel to fw_pumphall.
- **fw_pumphall**: a 2300-unit hall with 110 units of water, three pumps (one labelled PUMP 3), catwalks on posts both sides, a bridge over the middle, two ladders, the wrench on the north catwalk, and three crawlers in the water. A corridor raised 120 units at the east end holds the changelevel to fw_control.
- **fw_control**: a hall view with water and pumps, seen through five windows; a control room with two consoles; and a sunken valve room with a ramp down and a lift platform. The valve wheel's trigger fires `game_end`, which ends the mod.

**Choices you may want to change**

- Ladders sit at the catwalk ends (x ±866). A ladder in mid-wall is blocked by the catwalk slab, and the walk test confirmed it.
- The crawler keeps the headcrab's four limbs and adds two mid-body legs on the spine, for six. It passes the contract check.
- The lift is a `func_plat` that rides down 224 units.
- Sounds are generated takes (woosh-dflow and stable-audio-3), chosen by spectrogram and measures, then shaped to the game's own bands.

**Checks run**

- Every asset passed the build, and every map compiled with VHLT and passed the entity check against Half-Life's FGD (`fit for goldsrc`).
- The walk test reaches all of each map's entities.
- The videos and props sheet were drawn and read frame by frame.

**Open warnings I accepted**

- Spit sprite jitter is 1.27 against Half-Life's 1.72 to 2.
- The crawler's mouth and teeth are small, and the checker reports they barely change the outline.
- The pipe junction has 384 triangles, above Half-Life's median of 99 for its size and under the 422 maximum.
- The drip loop is 5 s, against the game's 5.5 to 9 s, and it has a faint bed of noise so it isn't silent.
- The lift's headroom check and the 19 drop edges in the control room have no railing.

**Not verified in the game**

Changelevel and landmark transitions, the lift, the window and door behaviour, the wrench in hand, crawler AI, the trigger ending, and how loud the sounds are. Please listen and walk through in the game.

**Licences**

Takes from woosh-dflow (CC-BY-NC) went into the wrench hit and swing, the crawler attack and pain, and parts of the drips. stable-audio-3 (Stability community licence) went into the pump and the other part of the drips. You accepted the local generators' licences, so I've left those as they are.
