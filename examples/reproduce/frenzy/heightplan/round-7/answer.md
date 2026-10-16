The map builds OK: `frenzy_copy` compiles with no leak, and every entity a player goes to is reached on foot. It is not a faithful match yet. I did not compare the picture sets from the same cameras, and several parts of the original are missing or changed.

Output: `/tmp/smak-repro-lR70Et/work/frenzy_copy/frenzy_copy.bsp` (with `.map`, `.wad` and plan pictures beside it). The spec used the height plans through `floorplan`, with `halflife.wad` textures, all 93 entity marks, and two areas with shelf walls.

**What matches**
- Layout, room sizes, floor heights, and the stairs and ledges come from the height plans.
- All the start points and item marks are placed at their heights: 15 starts, the weapons, ammo, batteries, longjump, and the glow sprites.
- The plan picture lines up with the original's storeys picture.

**What I changed to get OK**
| Change | Why |
|---|---|
| Two gauss-clip and AR-grenade pickups at z 320 moved to floor 16 at (-592, ±104) | Their platform is reached only by the original's moving walls, which plan mode can't express |
| Longjump moved to (-176, -72), floor 16 | Same reason |
| Four lights at z 256 to 292 removed | No ceiling in the headroom picture, so their lamp rods ran to 4000+ units |
| My eight light entities replaced by the map's 24 automatic lamps | Explicit lights left most rooms black; the floor light went from 54 to 74 of 255 |
| Two `func_door` boxes at (-1312, ±336) | Orientation is a guess |

**What is missing or approximate**
- Not reproduced: 13 `func_wall` (the orange moving walls, the lifts), 2 `func_ladder`, 2 `trigger_multiple`, and 1 `func_healthcharger`.
- The upper plateaus (160 to 512) are not walked to; the original reaches them by those lifts and ladders. The build reports this as a fact, not a fault, so it still says OK.
- Textures are a close pick, not a per-area match: floor `TNNL_FLR7C`, walls `CRETE1_WALL01`, ceiling `CRETE3_CEIL01`, shelves `C1A4_W4` in the two long halls. The original's lower wall band and hazard ceilings are not reproduced.
- The build warns of 48 drops over 210 units (the original has these too).

I could not read the `reproduce/frenzy` folder listing (permission denied), but the files I needed read fine.
