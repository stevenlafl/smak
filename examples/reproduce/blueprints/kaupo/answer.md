The map builds OK. It compiles, has no leak, every room is reached on foot, the three-entity start check passes, and the floating-piece check is clean. It is at `work/kaupo_house/kaupo_house.map` (compiled to `kaupo_house.bsp`). I did not run it in the game, and I did not compare it against the photos beyond reading their surfaces and tones.

**What I built**

- **Layout:** a 28 by 34 foot house, with the plan's north at the top of the picture. The lanai is at the south-west, the living room above it, the kitchen above that, closets and bathroom in the east middle, the 11 by 11 north-east bedroom, a 10.7 by 11 south-east bedroom, and the shed and shower to the north.
- **Heights:** 9 foot walls, a 4:12 gable roof with an 18 unit overhang, and the shed under its own 6 unit overhang.
- **Doors:** 8 swinging doors, all as `func_door_rotating` opened with use. The front door opens from the lanai to the yard, and the start is inside the lanai just inside it, facing the living room. Doors are widened to 56 units, which is what a player passes at ease.
- **Openings:** living to kitchen, living to closet, closet to closet.
- **Windows:** 8 glazed windows: 2 on the living room's west wall, 1 on the kitchen's north wall, 2 on the north-east bedroom's east wall, 1 on its north wall, and 2 on the south-east bedroom's east wall.
- **Surfaces:** white tongue-and-groove walls and ceilings, planks in the bedrooms, dark grey tile in the living room and kitchen, plywood in the lanai and bathroom, concrete in the shed, corrugated metal roof, grey siding outside.
- **Choices I made:** the shed's west door opens to the yard, and I dropped the south-east bedroom's link to the hall because the plan shows none.

**Room sizes against the drawings**

| Room | Drawing (labelled) | Built |
|---|---|---|
| Lanai | 16'-6" x 6' | 16 x 6 |
| Living room | 16 x 18 | 16 x 18 |
| Kitchen | 7 x 16 | 16 x 7 |
| North-east bedroom | 11 x 11 | 11 x 11 |
| South-east bedroom | 11 x 11 | 11 x 10.7 |
| Bathroom | 7 x 9 | 5.7 x 8.7 |
| Closets (two drawn) | about 4 x 4 each | one closet, 5.3 x 8.7 |
| Shed and shower | 11'-1½" x 8'-5½" | 11 x 8.5 (shower 3.75 wide) |

**Where it departs from the drawings**

- **Floor height:** the house floor is 1.5 feet above grade. The drawings show 4 feet. The build rules cap the step between a house and its open ground at 18 units, and the stairs they tried to add failed (the yard had 1 unit of floor in front of the stairs). So the front steps and the kitchen steps are not built.
- **Under the house:** the underside is closed to the ground. The drawings show open piers and a crawl space.
- **Walls:** 8 units thick, against the drawing's 6 inches.
- **Closets and hall:** the two closets are merged into one room, too small in the drawing for a player to walk into. There is no separate hall.
- **Shed:** no exterior stairs on its west side, and its floor is at grade.
- **Furniture:** none placed. The drawings show shelves, a sink and a tub, which I left out.
- **Warning left open:** the build reports 8 warnings that the door spawnflags (256 and 32) are not defined in the game's entity definitions. The doors are set to use-only toggle as the spec asks, but I did not resolve that warning.
