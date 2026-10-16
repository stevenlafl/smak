The map `frenzy_copy` builds OK at normal compile quality: it compiles, has no leaks, and all 64 entities a player goes to are reached on foot. It is not yet a close copy, though. Several parts are my estimates, and I did not compare the pictures with the original's cameras side by side.

**Built from the original**
- **Layout and floor heights:** the four height plans (the walkable floor at each place, in four layers) are carved into the map. The ledges and drops come from those plans. The compiled map is at `/tmp/smak-repro-TduQoF/work/frenzy_copy/frenzy_copy.bsp` (the BSP is the compiled map file), with its source `.map` beside it.
- **Entities:** all 176 entries from the list are placed at their marks: 15 player starts (1 start, 14 deathmatch), the weapons, ammo and items, 8 lights with their 8 glow sprites, and the brush entities.
- **Brush entities:** 12 `func_wall`, 2 `func_ladder`, 2 `func_door`, a `func_healthcharger` and 2 `trigger_multiple`, each placed at its mark. The two triggers point at the two doors.

**Estimated, not measured from the original**
- **Brush sizes and orientation:** the plan picture gives only the marks, so each wall is a 16 by 96 by 128 block, all facing the same way. The doors are 100 wide, the ladders and charger are small blocks, and the triggers are thin blocks. These will not match the original's shapes.
- **Textures:** each was picked by look from the views against the game's `halflife.wad`. The walls, the shelving and the lower band are close. The floor and ceiling are weaker matches than the rest, and the original's brown grid floor is not reproduced.
- **Areas:** only three coarse zones (west, centre, east), each with its own wall. The original has more parts than that.
- **Light:** the lamps are set to brightness 145. The mean floor light is 69 to 86 of 255 in the three zones, against the original's mean of 69. The dark share is 1 to 12%, against the original's 10 to 37%, so the map runs a little brighter than the original.

**Items moved to reachable spots**

Seven items sat in places the walk cannot reach or inside a wall, so I moved them:

| Item | From (x y, height) | To (x y, height) |
| --- | --- | --- |
| ammo_buckshot | -208 -184, 336 | -184 -184, 336 |
| weapon_handgrenade | -560 -184, 336 | -536 -184, 336 |
| weapon_handgrenade | -560 184, 336 | -536 184, 336 |
| ammo_gaussclip | -208 184, 336 | -184 184, 336 |
| ammo_ARgrenades | -664 152, 336 | -592 104, 320 |
| ammo_ARgrenades | -664 -152, 336 | -592 -104, 320 |
| item_longjump | -72 0, 336 | -176 -72, 320 |

**Warnings left**
- 48 places where a player can step off and fall more than 210 units. The original has these ledges, so I kept them.

**Things to know**
- The `func_wall` entities are kept static. In the original they may be lifts; the item heights suggest that, but the map does not show it.
- The build spec was passed inline. The Write tool is disabled in this session, so I could not save it as a file. A second person would need the spec saved to rebuild without this conversation.
