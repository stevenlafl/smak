The mod's assets are built, but three of the brief's output locations don't match what the tools wrote, and two parts need your check in the game. Nothing has run in the game, so the gameplay is untested.

## What's made

Paths are relative to `work/`. Each file passed its build checks, and I looked at the pictures for each one.

```
Asset                      Written to                          Status
maps (3)                   fw_yard/fw_yard.bsp                 compiled, walk test passes
                           fw_pumphall/fw_pumphall.bsp         compiled, walk test passes
                           fw_control/fw_control.bsp           compiled, walk test passes
props (5)                  fw_valvewheel.mdl, fw_drum.mdl,     built; wheel and junction
                           fw_console.mdl, fw_pipejunction.mdl, have triangle-count warnings
                           fw_walllamp.mdl
weapon (3)                 v_crowbar_weapon/v_crowbar.mdl      fit over the game's own
                           v_crowbar_weapon/p_crowbar.mdl      crowbar files
                           v_crowbar_weapon/w_crowbar.mdl
enemy                      headcrab.mdl                        on the game's headcrab
                                                               skeleton, contract kept
textures                   fw/fw.wad                           12 textures, no warnings
sprites (3)                sprites/fw_steam.spr, fw_glow.spr,  pass class checks
                           fw_spit.spr
sounds (6)                 sound/weapons/cbar_hit1.wav,        all written; most features
                           cbar_miss1.wav,                     in class range
                           sound/headcrab/hc_attack1.wav,
                           hc_pain1.wav,
                           sound/ambience/fw_pump.wav,
                           fw_drips.wav
videos (3)                 fw_wrench.mp4, fw_crawler.mp4,      rendered 960x540, 30 fps
                           fw_pumphall.mp4
picture                    pictures/fw_props.png               all five props in one sheet
```

## Needs your action

The tools put several files in different places from the brief, and I have no shell to move them. These are the commands I'd run:

```
mkdir -p maps models videos
mv fw_yard/fw_yard.bsp fw_pumphall/fw_pumphall.bsp fw_control/fw_control.bsp maps/
mv fw_valvewheel.mdl fw_drum.mdl fw_console.mdl fw_pipejunction.mdl fw_walllamp.mdl headcrab.mdl models/
cp v_crowbar_weapon/v_crowbar.mdl v_crowbar_weapon/p_crowbar.mdl v_crowbar_weapon/w_crowbar.mdl models/
mv fw/fw.wad fw.wad
mv fw_wrench.mp4 fw_crawler.mp4 fw_pumphall.mp4 videos/
cp -r fw_yard/models/fw_yard fw_pumphall/models/fw_pumphall models/
cp -r fw_yard/gfx gfx
```

- **Map wads.** Each map names its own wad (`fw_yard.wad`, `fw_pumphall.wad`, `fw_control.wad`) because the tool only resolves wads beside the map. Those wads carry copies of the fw textures. I haven't confirmed where the engine looks for them, so check that in the game.
- **Test leftovers to delete.** `v_crowbar.mdl` at the root is the unfitted early wrench, and `fw_probe/`, `fw_probe2/`, `sprites_fw_steam.spec.json` and `weapons_cbar_hit1.spec.json` are test output.

## Known issues

- **Prop class.** The compiled maps write props as `cycler_sprite`, not `cycler`, which is the usual class for models. I can't set the class from the spec. Check that the props show in the game.
- **Light colour.** The sodium colour didn't reach the lights. Point lights keep the default white, and room lights come out warm white. The orange comes from the lamp models' glass.
- **Yard brightness.** The yard floor averages about 35 of 255 at dusk, which reads dim. Raising the sun didn't change the measured light.
- **Valve route.** The walk test can't see a lift, so I added a stair from the control room down to the valve room. The lift is also there. The button fires `trigger_endsection`, which should end the game with credits in single-player. That is unverified.
- **Hall view.** The control map includes a copy of the hall as a view through the windows.
- **Stair ledge.** The pump hall has a ledge at the stair top where a player could fall 216 units, mostly into water. It's flagged as a warning.
- **Wrench.** It reads as a wrench in the attack frames, but the first-person idle is crude, and its handle points toward the camera.
- **Sounds.** Most features are in range. The hit, swing and crawler sounds have a few spectral measures outside the game's range.
- **Crawler.** It is built on the game's skeleton with the contract kept. The first build read the base from the work folder, not the game's original.

## Choices I made

- The crawler's teeth hang on the spine, and its legs start inside the body, so the parts stay joined through the animations.
- The valve room is a sunken room beside the control room, with a stair from the opening and the lift against the far wall.
- The yard's broken pipe is a model built with the map, since the brief named none.
