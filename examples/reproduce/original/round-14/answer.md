What is stuck: the pump hall (`fw_pumphall`) fails the walk test, because its wrench on the catwalk is reached only by a jump, and the pump-hall flight video flags two frames. Everything else is built and checked; the details follow.

## What I made

All files are in the work folder, under the names in the brief.

| File | Status | Notes |
|---|---|---|
| `maps/fw_yard.bsp` | OK | Sky yard about 1532 by 1532 units. Gatehouse with a door, pump house with double doors, drums, pipe section, lamps. Textures embedded. |
| `maps/fw_pumphall.bsp` | **Not OK** | Dry hall, pool of water 128 deep, three pumps, catwalks each side, bridge, ladders, stair to corridor, three crawlers, wrench on catwalk. Textures embedded. The walk test fails on the wrench (see below). |
| `maps/fw_control.bsp` | OK | Consoles, six windows onto a gallery, a lift (`func_plat`) down to a valve room with the valve wheel, a button that ends the mod through `trigger_endsection`. Two crawlers. |
| `models/fw_valvewheel.mdl` | OK | 32 across, red paint, steel rim. 372 triangles. |
| `models/fw_drum.mdl` | OK | Rusted, hazard band, rim hoops, bung. |
| `models/fw_console.mdl` | OK | Waist high, two screens, dials, switches, hazard trim. Low detail (24 triangles), which the report accepts as painted detail. |
| `models/fw_pipejunction.mdl` | OK | Two pipes, elbow, bolted flanges. 544 triangles against a median of 99 for props this size. |
| `models/fw_walllamp.mdl` | OK | Caged lamp with an orange glass. |
| `models/v_crowbar.mdl`, `p_crowbar.mdl`, `w_crowbar.mdl` | OK | Pipe wrench in place of the crowbar, 18.8 units long, keeps the game's hands and animations. |
| `models/headcrab.mdl` | OK | Sludge crawler on the headcrab skeleton, keeps all animations and the contract. 438 triangles. |
| `fw.wad` | OK | 13 textures: concrete (two), wet floor, grate, catwalk, pipes, hazard, rust, panel, sodium lamp face (fullbright), water, "PUMP 3" sign, door. |
| `sprites/fw_steam.spr` | OK | Animated, rises and thins. |
| `sprites/fw_glow.spr` | OK | Sodium glow. |
| `sprites/fw_spit.spr` | OK, one warning | Animated splash. Flicker is 1.44 where the game's sparks are 1.72 to 2. |
| `sound/weapons/cbar_hit1.wav`, `cbar_miss1.wav` | OK, warnings | Layered synthesis. Spectrum differs from the game's. |
| `sound/headcrab/hc_attack1.wav`, `hc_pain1.wav` | OK, warnings | Same. |
| `sound/ambience/fw_pump.wav`, `fw_drips.wav` | OK, warnings | Loops. Drips are no longer silent for most of the loop. |
| `videos/fw_wrench.mp4` | OK | 10 s turntable. |
| `videos/fw_crawler.mp4` | OK | 10 s turntable with the walk cycle. |
| `videos/fw_pumphall.mp4` | **Not OK** | 14 s flight through the hall. Two frames (at 5 s and at the end) flagged as jumps, whatever the camera path. |
| `pictures/fw_props.png` | Done | The five props side by side. |

Textures and pictures come from the library of CC0 photographs. No generated sound or shape took went into the files, so the non-commercial generator licences do not apply to them.

## Chain of maps

- `fw_yard` → `fw_pumphall`: trigger in the pump house, `map fw_pumphall`, `landmark fw_lm_yard` (info_landmark in both).
- `fw_pumphall` → `fw_control`: trigger at the corridor's far end, `landmark fw_lm_hall` (info_landmark in both).
- `fw_control` ends the mod: the valve button triggers `trigger_endsection`.

## Open problems

1. **Pump hall walk test.** The test says the wrench on the catwalk is reached only by a jump. The catwalks, ladders, a stair, a ramp and an east walkway all failed to make it reachable. With the test's `--jump` option, the wrench is reached. The game's own player can probably climb the ladders, but I can't confirm it here.
2. **Pump hall video.** Two frames jump at the same times across every camera path I tried, so the cause is not the camera. I did not find it.
3. **Yard sky.** It uses the default daytime sky, not dusk.
4. **Sounds and spit.** The warnings are spectral: the layered sounds don't match the game's spectrum. Only listening in the game settles whether they sound right.

## Decisions I made

- The walk-test wrench is the only entity the test flags; I kept it on the catwalk, as the brief asks.
- The crawler's four extra legs hang on the spine and do not animate.
- Hall and pool sizes: I shrank the pool to the middle 400 units so the walkways stay dry.

Which would you like for the wrench?
1. Keep it on the catwalk and accept the walk-test fault.
2. Move it to a floor spot the test can reach (breaks the brief).
3. Keep trying to make the catwalk reachable on foot.
