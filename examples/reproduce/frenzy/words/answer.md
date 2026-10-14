I've built frenzy_copy, and the final build says OK: it compiles with no leak, and the walk test reaches all 64 spawns and pickups on foot from the 15 places to start. I had no original to compare against, though. There's no frenzy.bsp in the models folder, so I built it from your description alone and haven't put the two side by side.

**What's in it**
- **Size and levels:** it spans x −1480 to 944 and y −990 to 1040. The floors are at z 0, 160 and 320, with ledges at 512 and a roof light well at about 600–680 above the bridge.
- **Spine:** a ground corridor 224 wide, the z 320 corridor (ceiling 448) running the full length, a bridge where it crosses the atrium, and hazard-striped ceiling beams. At the south tip, two func_ladders with thin func_walls beside them climb from the ground stub through a hatch to z 320.
- **Atrium:** x −890 to −40, y −300 to 300, open to 600. It has the bridge, chamfered corner bays, z 160 shelves on both sides, z 320 balconies joined to the bridge by walkways along the atrium's north and south ends, the z 512 ledges, and the health charger on the east wall with spawn 60 facing it.
- **Wings:** z 160 mezzanines, four pits down to z 0 (each with a 64×64 pillar), and ground rooms under the middle bands. The two west doors are func_door, each opened by a trigger_multiple. The outer walls lean in, and beams cross under the 470 ceiling.
- **Ring and annex:** a ground ring corridor about 128 wide with chamfered corners. The NE annex is 300 high, with a 12-step stair rising south to a z 120 landing, then a walkway up to the east mezzanine. Eight orange lights and eight env_glow sprites light it.
- **Entities:** every spawn, weapon, ammo and item you listed is placed at your coordinates or as close as the rooms allow.
- **Textures:** all from halflife.wad except the ladders. Walls are CRETE3_WALL01, floors GRATE_RUST (dark brown grating), and the spine floor METAL_BORD03. A band of LAB1_COMP1 racks at 40–110 and a yellow C1A3YELLOW base stripe run along the corridors. halflife.wad has no ladder texture, so the build made a plain one for the two ladders in the map's own .wad.
- **Light:** dim and cold almost everywhere (floors at about 75–110 of 255), and brightest in the atrium (186). The annex is warm orange but dim (74).

**Where it will differ from the original**
- **Entity numbers are offset by 19.** The kit writes brush entities (func_walls, ladders, doors, charger, triggers) before point entities, so the player start is 20 instead of 1, spawn 32 is 37, and so on. The brush entities do keep the original's order among themselves.
- **I added stairs** from each pit up to z 160, plus the balcony walkways. The description never says how players get up to the mezzanines or balconies, and without them the gauss, tripmines and long jump couldn't be reached.
- **I narrowed the east wing** to x −272 to 524 so the annex (x 540 to 944) doesn't overlap it.
- **I guessed the shapes** of the bays, the low func_wall boxes (3, 12), the railings (2, 4, 5, 6) and the band-edge plates (7, 14, 15) from short phrases.
- **I treated the pillars' "64 × 128"** as 64 square and 160 tall, reaching the mezzanine floor.

The doors, triggers and ladders pass the kit's geometry checks, but whether the doors open and the ladders climb only shows in the game: run `map frenzy_copy`. The files are in `work/frenzy_copy/`: the .bsp, the .map source, the map's own .wad and the plan and view pictures.
