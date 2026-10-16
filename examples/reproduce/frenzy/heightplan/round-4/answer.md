The map builds OK and compiles, but it is not yet a faithful copy. Its layout, floors and most item and player placements follow the height plans. Four things differ from the original, and I could not add the doors, ladders and walls.

**Result:** `work:frenzy_copy/frenzy_copy.bsp` (plus `frenzy_copy.map` and `frenzy_copy.wad`), in `/tmp/smak-repro-HforUB/work/frenzy_copy/`. The build reports every entity reached on foot (58 of 58), no leaks, and all engine limits within range. It has one warning: 48 ledges that drop 336 units. The original has the same ledges, so I left them.

**What matches the original**
- The floors, rooms, corridors and ledges are carved from the four height plans.
- All 15 player starts, and every weapon, ammo and item from `entities.txt`, sit at their marked spots and heights, except the four below.
- The eight glow sprites sit at their marked spots.

**Where it differs**
- **Lights:** the original's eight `light` entities are not placed. Four of them hang fixtures up to z 4120, past the engine's 4096 limit, because the height plan gives those spots no ceiling. I let the map place its own 24 lamps instead. Their brightness and colour are not the original's.
- **Glow colour:** I set the glows to additive yellow (255 200 80). The original's colour is not in the inputs.
- **Three items moved:** the two ammo_ARgrenades at (-664, ±152) and the item_longjump at (-72, 0) stand on a raised floor the walker cannot reach. I moved them to the nearest reachable floor at the same height: (-592, ±104) and (-176, -72), 87 to 126 units away.
- **Textures:** the floor, wall and ceiling bases (metal, stone, metal) are my guesses from halflife.wad. The original's textures are not in the inputs.

**Not placed:** the brush entities. The height plans give only a mark for each, with no size, so I could not build them.
- 15 `func_wall`
- 2 `func_door`, with their 2 `trigger_multiple`
- 2 `func_ladder`
- 1 `func_healthcharger`

So the doors, ladders and walls are missing. Their sizes and their wall openings would need to come from the original's `.map` or the game.

**Not verified:** I have only the plan and storey pictures of the original, not its in-game views, so I could not compare the two side by side from the same cameras. The views I checked were of this map alone.

**One limit on the saved work:** the spec was passed to the build inline, and the file tools are disabled here, so no spec file is saved. The `.map` in the work folder is the build's output and is the source to keep. To rebuild it from a clean copy, the spec would need to be written to a file.
