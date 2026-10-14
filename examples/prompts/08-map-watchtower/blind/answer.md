The watchtower map is built, and the second build passed every check. The file is **`work/watchtower/watchtower.bsp`**; its source is `watchtower.map` and its textures are in `watchtower.wad`, both in the same folder.

The first build failed one check because I'd put your start point on the bottom of the staircase. I moved it to the guard room's north-west corner and rebuilt.

```
Room         Size (x by y by height)   Floor height   Floor light (0-255)
guard_room   320 x 320 x 160            0             173
lookout      320 x 320 x 128           176            197
corridor     256 x 128 x 112            0             214
storeroom    256 x 320 x 160            0             149
cellar       320 x 320 x 208           -96             31 (dim)
```

- **Guard room:** this is where you start, in the north-west corner facing east. An 11-step staircase runs west to east along the south wall, up through a hole in the ceiling.
- **Lookout:** directly above the guard room, the same footprint and 128 high. The crossbow is in the middle of the floor.
- **Corridor:** 128 wide and 256 long, heading east, with a 96-wide opening at each end.
- **Storeroom:** the battery is in the middle of the floor.
- **Cellar:** east of the storeroom, with its floor 96 lower. A 64-wide opening leads to 6 steps down into it, and the zombie waits in the north-east corner, facing west.
- **Materials:** stone walls and floors, wooden plank ceilings, and a darker stone for the cellar's walls and floor.
- **Lighting:** every room has lamps. The cellar has a single dim one, and its floor reads 31 out of 255. That's just above the point where the tool calls a room too dark (24).
- **Walking:** the walk test reached all of the standable floor and all four entities without jumping. It also found a way back to the start from everywhere, including down the cellar stairs and up to the lookout.

**Choices I made where you left it open:**
- **Cellar height:** it's 208 high, more than you'd expect for a cellar. The tool needs the room at the bottom of stairs to reach as high as the top of the doorway it climbs to, and that doorway is 96 above the cellar floor.
- **Corridor height:** I made it 112 high.
- **Doorways:** the openings are plain, with no doors in them.

Nothing you asked for was left out.
