**frenzy_copy is built and the final build says OK.** It compiled with no leak, all 64 pickups and spawns can be reached on foot from the starts, there are no one-way places, and it's well within GoldSrc's limits. The final compile is at normal quality. I haven't run it in the game.

The files are `work:frenzy_copy/frenzy_copy.bsp` and `frenzy_copy.map`. The map takes all its textures from halflife.wad.

**What matches the original:**
- **Layout and floor heights:**
  - Two tall wings (floor 160, ceiling 640) whose outer east and west walls lean out above 320.
  - Four pits down to 0 and an octagonal central room.
  - The north-south spine at 320 with its crossbeams, running out to the north spawn and RPG.
  - Ground corridors at 0 under the walkways, the east annex with its stairs up to 160, and the 512 roof slabs.
  - My x=0 and y=-272 sections line up closely with the originals.
- **Center room:** four bridge pieces at 320 hang off the spine, with the 9mmAR platform at 160 between them and the health charger on the east wall. The west and east ledges at 320 hold the grenades and the longjump.
- **Entities:**
  - Every class and count from the original's list: 1 player start, 14 deathmatch spawns, all weapons, ammo and items, and 12 func_walls.
  - The 2 ladders, the 2 doors (door01 and door02) with their trigger_multiples, and the 8 lights with their 8 glows in the annex.
  - Positions are read off the plan and storeys pictures.
- **Textures and light:**
  - C3A1B_W1 for the walls (the concrete with green circuit bays) and brown tile floors.
  - Grey concrete on the spine, which is how the original's views look.
  - The light comes mostly from ~LIGHT4A ceiling fixtures, as in the original, rather than dozens of lamp entities. From the original cameras, the spine, the south corridor, the start view and the annex look much like views.png.

**Where it may differ** (I worked only from the pictures, so some of this is my reading of them):
- **Center room:** how it opens at ground level and the exact outline of its roof are my best reading of conflicting pictures. Ground floors, sizes and heights are accurate to roughly ±16–32 units.
- **West doors:** what doors 46/47 actually do is a guess. I made them sliding doors in partitions across the west walkway, each opened by its trigger.
- **Ladders:** how players reach the spine (two ladders at the south end) is inferred.
- **Entity numbers:** my brush entities come first in the file, so the numbers on my plan don't line up one-to-one with the original's (my start is 20, not 1).
- **Extra entity:** there's one info_texlights entity, which the original doesn't have. Without it the light fixtures don't glow.
- **Harmless warning:** the build warns that info_texlights names "angles". The spec writer adds that key itself, and it has no effect.

To play it, put the .bsp in `valve/maps/` and type `map frenzy_copy`.
