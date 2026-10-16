`frenzy_copy` builds OK: it compiles, has no leak, and all 64 entities a player goes to are reached on foot. It is a close approximation, not a match. The original was given only as pictures, so the brush boxes, heights and lights are estimates, and I could not check them against the real map.

**Files** (in `/tmp/smak-repro-o9K2C3/work/frenzy_copy/`): `frenzy_copy.bsp` (the compiled map, the `.bsp` the game loads), `.map` (its source), `.wad` (textures), and plan and view pictures.

**What matches the original**
- **Layout and floors:** from the four height-plan layers, with the walk reaching 84.2% of the standable floor.
- **Starts, weapons, ammo, items:** all 98 marks placed at their x, y and height. Two of the 98 are not where the marks say; see below.
- **Lights:** the eight marked lights, plus the glow sprites on them.

**What is approximate**
- **Walls, doors, ladders, charger, triggers:** boxes read off the plan's outlines. Thicknesses, lengths and the 128-unit wall height are guesses.
- **Textures:** picked by matching the views to the wad. Walls are C3A1_W1, floor C1A3FLOOR02, ceiling C2A4_PAN3, doors LAB1_PANEL1, brush furniture LAB1_SLOT1. The shelves with bins in the original are not modelled.
- **Light:** the marked lights alone left the views under 24 of 255, so I added automatic lamps over the whole plan (163 entities in all, 65 of them added by the compiler). The original's light values were not available, so the brightness of 300 is my choice.
- **Items moved for the walk:** two `ammo_ARgrenades` (at -664, ±152, height 336) and the `item_longjump` sit on 320-unit platforms the walk cannot climb from the height plan's floors. I moved them to nearby reachable floor, at (-592, ±120) and (-176, -72).

**Left as warnings**
- 48 drops of more than 210 units (the worst at -520, 416, from 336 down). The height plan has these, and I did not rail them.
- 18 patches of floor not walked to, mostly the 320 platforms and the tops of things.
- No stairs added where the height plan has steep ramps.
- Ladders are plain `func_ladder` boxes with no rung texture.

I compared two views with the original: the start at yaw 130 and the room at (640, 642, 64). Walls and floor are now in the right colour range, but the original's shelving is missing. Some high corridors, such as the one at (-384, 992, 384), are still dark.

**Not yet reproducible from disk:** the spec exists only in this session, since I have no file-writing tool here. The build call took it inline, and the `.map` and `.bsp` above are its output. To make it a committed file, the JSON needs saving in the work folder. Tell me a path I can write to and I'll save it there.
