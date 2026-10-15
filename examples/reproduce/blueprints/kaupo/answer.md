`kaupo_house` builds with status OK. It compiled with no leak, and the walk test reaches all 11 entities on foot. The map doesn't match the drawings in several places, listed below.

**Sizes and storey.** It is a single storey, since the drawings show no upper floor. Floors sit 42 units (3.5 ft) above the yard, on piers. Ceilings are 102 (8.5 ft) in the main house, and the shed and shower are the same. I read the ceiling height off the elevation: the ridge is 14 ft above the floor, and the eave height scales to about 8.5 ft. The plan's 28 ft width and 34 ft depth fix the other sizes, at 12 units a foot with 8-unit walls.

**Rooms, placed by the floor plan:**

| Room | Size in feet (as built) |
| --- | --- |
| Kitchen | 15.7 × 6.7 |
| Living room | 15.7 × 20 |
| Lanai (porch) | 15.7 × 6 |
| North bedroom | 11.7 × 12 |
| South bedroom | 11.7 × 11.5 |
| Bathroom | 5.7 × 9.2 |
| Closet | 5.3 × 9.2 |
| Shed | 5.3 × 8 |
| Shower | 5.3 × 8 |

**Doors.** There are 10 hinged doors, all `func_door_rotating`, opened with the use key:
- living room to lanai, which is the front door
- living room to each bedroom
- each bedroom to the bathroom
- each bedroom to the closet
- kitchen to shed
- shed to shower
- the kitchen's west door, with its steps down

The hinges are the game's default, and I didn't match each swing to the plan's arcs. The kitchen to living room opening and the lanai's south opening, with its three steps down, are open gaps. **Windows.** There are 19 glazed, breakable windows on the exterior walls and 3 unglazed windows between the living room and lanai.

**Start.** The player starts inside the living room next to the front door, and every room is reachable from there.

**Surfaces and light.** The floors, walls and ceilings use Valve's `TRRM_WOOD2` from `halflife.wad`. The outside is siding, and the gable roof is corrugated metal (`METAL_BORD021`). The yard is open sky with grass. Floor light is 233–241 out of 255 in every room, so none are dark. The only props are a toilet, a sink cabinet in the kitchen and a bench on the lanai.

**Where it differs from the drawings:**
- The two closets are one room with two doors, one from each bedroom. The map needs a walk-in room at least 64 × 96 for a door, and two closets can't fit in that wall run.
- The bathroom is 5.7 ft wide instead of 7 ft, because of that closet. The living room is 20 ft long instead of the labelled 18.
- Bathtub and bathroom sink are missing. Either one would sit in the door-clear zones at both ends of the bathroom, which the checks reject.
- The roof is a gable at 4:12 pitch, not the drawn hip roof, because the spec only builds gables.
- Window sizes are all 48 × 48, so the drawn window groupings, such as the wide living room windows, are only approximated.
- The shed sits at house floor level, not at its drawn lower level.
- Only the south bedroom's south windows are on that wall. The plan's other drawn windows (lanai side, kitchen north cluster) are fewer than drawn.
- Interior shelves and the plan's other fixtures are left out.
- The bedrooms, closet, shed and shower have nothing in them, and the report warns about that.
- One report warning remains about three brushes off the 1-unit grid, which I left.

I looked at the plan and room views but did not compare them side by side with the drawings. The files are in `work/kaupo_house/`, including `kaupo_house.bsp`.
