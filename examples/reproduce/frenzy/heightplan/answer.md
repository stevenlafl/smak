The map builds **OK**: it compiles, has no leaks, and every start and deathmatch point is reached on foot. It is not yet a faithful copy in three respects: the doors, ladders and triggers are missing, the lighting is a guess, and the entity positions are read by eye.

**Output:** `work:frenzy_copy/frenzy_copy.bsp` (with `.map`, `.wad` and plan pictures beside it).

**What matches**
- **Layout, sizes, floor heights, stairs, ledges and drops:** carved from the four height layers with `floorplan: { dir: "work:heightplan/" }`. The plan picture has the same octagonal rooms, the central shaft and the east stairs as the original plan.
- **Starts:** 1 `info_player_start` and 14 `info_player_deathmatch`, all reached on foot.
- **Textures** from halflife.wad: floor `CRETE4_FLR01`, walls `BASEWALL01A`, ceilings `CRETE3_CEIL01`, doors `LAB1_DOOR1`. These are my choices, since the originals were not given as pictures.

**What does not match, or is a guess**
- **Doors and lifts:** none. The floor plan carves every space open, and a map built this way has no rooms or links to hang doors on. The original has 2 `func_door`, 2 `func_ladder` and 12 `func_wall` brushes, plus 2 triggers. None are placed.
- **Entity positions:** read by eye from `plan.png` at about 2.5 units a pixel, so expect errors of roughly 8 units.
- **Item and weapon classes:** the plan's legend text was too small to read each number, so the classes on the cyan dots are approximate. Counts and types may differ from the original.
- **Lights:** 9 `light` entities at z 80, brightness 300 (6 at the original's yellow dots, 3 added in large rooms). The original's 8 `env_glow` sprites are not placed. Floor light is low: the build reports an average of 19 of 255, so the views are dark. The brightness was my choice, since the light was left to me.
- **Dropped lights:** three candidate lights sat over open sky or inside rock and made lamp rods reach 4000+ units, so I removed them.

**Open warnings**
- The build warns `floorplan: not a field of a map spec, left out`. The carve still happens (the fact line confirms it), so I left it alone. Someone should check whether the key is spelled right for this kit version.
- The walk test reports 49 drops of 336 units that a player can fall from. These are the level's own ledges, so I kept them, but the warning says to rail or mean each one.

**Limits of this session:** I have no file-writing tool, so the spec exists only in my build calls and is not saved as a script in the repo. Someone who wants to rebuild it needs that spec saved to a file.
