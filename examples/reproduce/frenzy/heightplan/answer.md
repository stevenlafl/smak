The map is built and the build says OK: it compiled, nothing leaks, and all 58 places a player goes to are reached on foot. It is at `/tmp/smak-repro-ydVBIx/work/frenzy_copy/frenzy_copy.bsp`, with the `.map` and `.wad` beside it. It is an approximation, not a match. The layout, floors and ledges come from your height plans. The textures, lighting and some entities are my choices or are missing.

**What's in it**
- **Layout and heights:** the floor plan carves the space and floors from the four height-plan layers. The plan picture lines up with the original.
- **Starts and items:** all 14 deathmatch starts, the one player start, and every weapon, ammo and item from `entities.txt` are placed on the floor under their marks.
- **Textures from `halflife.wad`:** walls are CRETE1_WALL01, floors are CRETE3_FLR05, and the western rooms use FIFTIES_CMP3A2 for the shelving. The ceiling is a dark grey metal paint because I found no clean Half-Life match for the orange-striped ceilings.

**What differs from the original**
- **Missing:** the two doors and their triggers, the two ladders, the 13 moving wall panels (the orange lines), and the health charger. They are brush entities, and a floor plan only carves space, so they are not in the map.
- **Lights:** four of the eight marked lights (at the top-right plaza) are removed. Their lamp rods ran to the top of the world. The other four are kept at their marked heights.
- **Lamps I added:** SMAK has no ambient light setting, so the rooms only read as lit with automatic lamps. That adds 146 lamps the original doesn't have. Their colour (230, 235, 255) and brightness (120) are my choices, not measured from the views.
- **Glows:** the glow sprites on the lights are not added. The build rejected the sprite key I wrote, and I did not get it working.
- **Three items moved:** the walk test found three items on a ledge with no walkable access. I moved each onto the walkable spot it named:
  - ammo_ARgrenades (-664, 152) to (-592, 104)
  - ammo_ARgrenades (-664, -152) to (-592, -104)
  - item_longjump (-72, 0) to (-176, -72)
  Heights are unchanged.
- **Start heights:** the starts stand 36 above the floor, the engine's standard, not at the marked heights of 64 to 384.
- **Drops:** the build warns of 48 places where a player can fall more than 210 units, from the upper ledges. These come straight from your height plan. I did not add railings.

**Not done**
- **Side-by-side check:** I did not do a close comparison with `views.png`. The views now show lit rooms, but the start room is still not as bright as the original's.
- **Saved spec:** I could not save the spec as a file, because the Write tool is disabled in this session. It is in this conversation, and I can write it to the work folder if you enable Write.
