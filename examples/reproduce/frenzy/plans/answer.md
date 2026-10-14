The map is built and the build says **OK**: it compiled with no leak, every one of the 65 entities a player goes to is reached on foot, and there are no one-way places. The engine check says "fit for goldsrc".

The files are in the work folder under `work/frenzy_copy/`: `frenzy_copy.bsp`, `frenzy_copy.map` and the rendered pictures. I had no file-writing tool, so the spec itself only exists as the last `build` call in this conversation. The `.map` is the reproducible source.

**What matches the reference:**
- **Layout:** two tall halls (floor 160, ceiling 640) with slanted outer walls, the west alcove, the NW box, and the NW/SW diagonal passages behind doors.
- **Pits and tunnels:** four ground-level pits at 0 with the tall square pillars, and the ground tunnels under the walkways, including the north tunnel out to the NE wing.
- **Arena:** the octagonal arena with its ledges at 320, pillars and roof at 512. The corridor crosses it at 320 under a 544 ceiling, with beams.
- **Under the corridor:** the rooms at 160, the south shaft with both ladders, and the pit at the south end.
- **East side:** the 160 bridge across the arena, the healthcharger wall, the NE block and diagonal band, the NE wing with its stairs, the east alcove, and the SW/SE boxes.
- **Entities:** all of the reference's classes are present at their counts except `light` (see below), with names `door01`/`door02` and the triggers targeting them.
- **Sections:** both cuts (y=0 and x=−272) line up closely with the reference ones: same floor heights, ledges and ceiling drops.

**Where it differs:**
- **Lighting:** the spec can't pass an `info_texlights` key, a `~LIGHT` panel doesn't glow, and light colour and brightness are ignored. The map is therefore lit by 57 white `light` entities instead of the reference's 8, and the plan's legend will show that count.
- **Entity numbers:** the kit writes brush entities first, so the plan labels are shifted (for example "37 INFO_PLAYER_DEATHMATCH" where the reference has 32).
- **Arena beam:** func_wall 13 sits 16 lower than in the reference, with a narrow plank from the east bridge. Without that, the 9mmAR on it could only be reached by a jump.
- **Storey cuts:** my NE stair steps start at floor level, so my lowest storey is cut at z 52 instead of 36.
- **Textures:** these were guesses, as you said: concrete walls (CRETE3_WALL01), tunnel floor (TNNL_FLR5C), metal ceiling (BABTECH_CEIL02), metal trim (METAL_BORD05) and blue glass (GLASSBLUE1). Nothing in the drawings shows the real ones.
- **Least certain readings:** the SE diagonal band, the arena's inner ledges, the glass partitions 14/15/7, and the small details I left out (narrow slots beside the corridor, a "Z 320" shelf in the SE box).
- **Doors:** as in the reference, the NW door's trigger is only on the passage side and the SW door's only on the alcove side. Nothing here runs the game, so the doors and ladders are untested.
