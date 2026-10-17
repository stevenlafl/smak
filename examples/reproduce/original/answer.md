The mod is mostly built, but the wrench, the sludge crawler and two of the three videos are blocked: the server can't see Half-Life's own game files. Everything else is in the work folder and checked.

**Blocked: I need the Half-Life `valve` folder path.** The server reports "the server's game folders are 0 valve", so it can't read `headcrab.mdl`, `v_crowbar.mdl`, `p_crowbar.mdl`, `w_crowbar.mdl` or `halflife.wad`. Those are needed for the wrench (replacing the crowbar's models), the crawler (replacing the headcrab's), and the `fw_wrench` and `fw_crawler` turntable videos. I did not fake them with generic models, since the brief requires the game's hands and animations. Give me the folder path and the server's game-folder setting, and I'll finish those four. The compile tools (VHLT) are also not installed, which is a separate issue below.

```
Asset                            status
maps/fw_yard.bsp                 built, walk reaches all 4 entities
maps/fw_pumphall.bsp             built, walk reaches all 7 entities
maps/fw_control.bsp              built, walk reaches all 4 entities
models/fw_valvewheel.mdl         built, fits GoldSrc (392 triangles)
models/fw_drum.mdl               built, fits GoldSrc (400 triangles)
models/fw_console.mdl            built, fits GoldSrc (24 triangles)
models/fw_pipejunction.mdl       built, fits GoldSrc (568 triangles)
models/fw_walllamp.mdl           built, fits GoldSrc (268 triangles)
models/v_crowbar, p_crowbar,     BLOCKED (needs the game folder)
  w_crowbar, headcrab.mdl
fw.wad                           built, 13 textures, grate holes kept
sprites/fw_steam.spr             built, animated, rises and thins
sprites/fw_glow.spr              built, sodium glow
sprites/fw_spit.spr              built, animated splash
sound/weapons/cbar_hit1.wav      built (+ cbar_hit2 variant)
sound/weapons/cbar_miss1.wav     built
sound/headcrab/hc_attack1.wav    built
sound/headcrab/hc_pain1.wav      built
sound/ambience/fw_pump.wav       built, loop
sound/ambience/fw_drips.wav      built, loop
videos/fw_pumphall.mp4           built (title, then flight down the hall)
videos/fw_wrench.mp4             BLOCKED (needs the wrench)
videos/fw_crawler.mp4            BLOCKED (needs the crawler)
pictures/fw_props.png            built, five props side by side
```

**What the maps do**
- `fw_yard`: a 1500 by 1500 yard with a high rock wall and dusk sky. The gatehouse door opens, six drums stack by the wall, a truck-sized pipe lies on blocks, and the pump house's double doors lead to a trigger that changes to `fw_pumphall`.
- `fw_pumphall`: a 2500-long hall with 96 units of water, catwalks on both sides and a bridge, three pumps, a "PUMP 3" sign, a wrench on the bridge, three crawlers, and a stair up to a corridor that changes to `fw_control`.
- `fw_control`: a control room with three consoles under five windows over a sunken hall, and a lift down to a valve room where the wheel is. The valve room's trigger is `trigger_endsection`, so walking up to the wheel ends the mod.
- The changelevel landmarks are `fw_land1` (yard to pumphall) and `fw_land2` (pumphall to control), each in both maps.

**Things that need your attention**
- **The compiled maps are not VHLT output.** VHLT isn't installed here. The `.bsp` files come from the kit's own compile, which passes its checks, but the lighting is the kit's, not VHLT's.
- **Extra files the maps need.** `fw_yard.wad`, `fw_pumphall.wad` and `fw_control.wad` are at the work root beside `fw.wad`. The yard's sky (`work/fw_yard/gfx/env/fw_yard/`) and its pipe model (`work/fw_yard/models/fw_yard/pipesection.mdl`) must be copied into the mod.
- **Props are `cycler_sprite`.** The kit writes map props as `cycler_sprite`; a `.mdl` is normally a `cycler`. I left it as the kit writes it. It's the first thing to check in the game.
- **Lift and end trigger are unverified.** The lift is a `func_plat` in a shaft; nothing has been run in the game.
- **Sounds.** The metal hit, swing and creature sounds are shaped from woosh-dflow (CC-BY-NC, non-commercial) takes. The creature sounds are shorter than the game's, and the spectra still differ from the game's classes. The pump and drip loops are layers.
- **Heavy props.** The drum (400 triangles) and pipe junction (568) are well above Half-Life's median for props of their size (99). The console is very plain (24 triangles): its dials read as small squares.
- **Build outputs.** The `models/` copies were made with `reskin` (a no-op rule), which re-encodes one texture slightly. Checks pass on all five.

**Notes:** `work/notes_flooded_works.md` has the workarounds (which commands move files and why). I couldn't save to the memory folder, since I only have the SMAK tools.
