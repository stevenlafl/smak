The mod is built to the brief, but it is not verified in the game. Every file exists, and every model, map, sprite, sound and video passed its build checks, apart from the items listed below.

**Where the files are.** The tool can't write model names with folders, so models sit at the work root, and the maps, wad, held weapon and sounds sit in folders named after them. Copy them into the mod's folders to match the brief.

```
brief                          written to (work folder)
maps/fw_yard.bsp               fw_yard/fw_yard.bsp
maps/fw_pumphall.bsp           fw_pumphall/fw_pumphall.bsp
maps/fw_control.bsp            fw_control/fw_control.bsp
models/fw_valvewheel.mdl       fw_valvewheel.mdl
models/fw_drum.mdl             fw_drum.mdl
models/fw_console.mdl          fw_console.mdl
models/fw_pipejunction.mdl     fw_pipejunction.mdl
models/fw_walllamp.mdl         fw_walllamp.mdl
models/v_crowbar.mdl           fw_wrench_weapon/v_crowbar.mdl
models/p_crowbar.mdl           fw_wrench_weapon/p_crowbar.mdl
models/w_crowbar.mdl           fw_wrench_weapon/w_crowbar.mdl
models/headcrab.mdl            headcrab.mdl
fw.wad                         fw/fw.wad
sprites/fw_steam.spr           sprites/fw_steam.spr
sprites/fw_glow.spr            sprites/fw_glow.spr
sprites/fw_spit.spr            sprites/fw_spit.spr
sound/weapons/cbar_hit1.wav    sound/weapons/cbar_hit1.wav
sound/weapons/cbar_miss1.wav   sound/weapons/cbar_miss1.wav
sound/headcrab/hc_attack1.wav  sound/headcrab/hc_attack1.wav
sound/headcrab/hc_pain1.wav    sound/headcrab/hc_pain1.wav
sound/ambience/fw_pump.wav     sound/ambience/fw_pump.wav
sound/ambience/fw_drips.wav    sound/ambience/fw_drips.wav
videos/fw_wrench.mp4           videos/fw_wrench.mp4
videos/fw_crawler.mp4          videos/fw_crawler.mp4
videos/fw_pumphall.mp4         videos/fw_pumphall.mp4
pictures/fw_props.png          pictures/fw_props.png
```

Also in the work folder: `fw_wrench.mdl` (the held source for the weapon files) and each spec's JSON and preview sheets. Those can be ignored.

**What I made**

- **Maps.** `fw_yard`: a 1500-unit dusk yard with the gatehouse (door) and pump house (double doors), drums, a broken pipe section and the pipe junction. `fw_pumphall`: the flooded hall, 80 units of water, three pumps, catwalks with a bridge, four ladders, a ramp to each catwalk, the wrench on the west catwalk and three crawlers in the water, leaving by a stair to a corridor. `fw_control`: consoles under four glass windows looking down on a lower water room, a valve pit with a lift and the wheel, which ends the game through `trigger_endsection`, and two crawlers. Level changes are `trigger_changelevel` brushes: yard → pump hall via landmark `fw_lm_yard`, pump hall → control via `fw_lm_hall`, with each landmark placed in both maps.
- **Props.** Valve wheel (32 across, red paint worn at the rim), drum (rusted, hazard band), console (dials, two screens, switches), pipe junction (flanged elbow, bolts), caged lamp (sodium-orange glow).
- **Wrench.** A held model on the crowbar's skeleton, 18 long, red handle and a toothed jaw. In the first-person views it holds with the red handle in the hand.
- **Crawler.** A character on the headcrab's skeleton, with the same animations and contract. It has six legs (the hind and fore limbs plus two mid legs), a ring of teeth and a pale belly.
- **Textures.** `fw.wad` holds all twelve named textures, including the lit lamp face, the water and the "PUMP 3" sign.
- **Sprites.** Steam puff, sodium glow, and a splash, all checked against the game's own of their kind.
- **Sounds.** The hit and swing are real recordings shaped with filters. The crawler's bite and pain, the pump drone and the drips are also recordings.
- **Videos and sheet.** Wrench and crawler turntables, the pump hall flyover, and the props sheet.

**What still needs your attention**

- **The pump hall video has pink walls.** The video renderer doesn't find the wad, so textures show as the engine's stand-in. The map views render with correct textures, so the cause is the video path, which I couldn't redirect. Fix it by running the video with `fw.wad` at the mod root, or by compiling with the textures embedded.
- **Sounds still off their game classes.** The hit is too bright (about 2.4 kHz centroid, where the game's metal hits sit at 1.1 to 1.7 kHz). The bite and pain are off their flesh-hit range, and the drips loop is 4.8 seconds where the game's run 5.5 to 9. The pump drone passes.
- **Licence.** The recordings were made by woosh-dflow, which is CC-BY-NC 4.0, non-commercial. That suits a free mod, but it's your call.
- **Triangle counts.** The valve wheel (328) and pipe junction (432) are well over Half-Life's prop median of 62. The wrench head is blocky in first person.
- **Fidelity.** The spit splash reads pale grey, not sludge green. The crawler's skin is green where the brief says grey-green.
- **Maps.** All three compile with VHLT and pass the walk test (every entity reached, no one-way places). The overlook room is only a view, so it is not walkable by design. Nothing has been run in the game, so the lift, the doors and the monsters' behaviour are untested.
- **Mod layout.** `fw.wad` must be at the mod root, because the maps name it and the checks say it is not in the folders given.
