I've built frenzy_copy and the build says OK: it compiles, has no leak, and all 64 entities a player goes to are reached on foot from the 15 spawn points, with no one-way spots. I matched it by eye against your pictures, and it is close in some places but not exact everywhere.

**How close it is**
- **Plan:** shown side by side with yours at the same scale, the layout lines up. That covers the two tall halls with the raised north–south corridor between them, the sunken pits, the arms and walkways at z 160, the middle bridge, the north and south ground corridors, the stair annex in the north-east and the ladder shaft at the south end.
- **Section at y=0:** almost the same as yours. Floors at 0, 160, 320 and 512, the slanted outer walls from z 320 up, the ceiling over the middle at about 540, the health charger wall, and the annex at 160–320.
- **Section at x=-272:** the corridor's ceiling beams, the covered passages at 160 under it, the south corridor and the four slabs in the middle all match.
- **Storeys:** I added the covered walkways your top storey shows: the west hall's south side and the east hall's north and south-east are roofed at 296. I also added the balcony at z 320 in the east hall.
- **Entities:** all 93 are in, with the same classes and counts, at positions read off your plan and storeys. That includes the 15 spawns with their facing, the weapons and ammo, both doors with their triggers (door01/door02), both ladders, the 12 func_walls, the health charger, and the 8 lights and 8 env_glows in the annex.
- **Light:** dim like yours, with fluorescent fixtures. Rooms' floors measure 33–105 out of 255.

**Where it differs or I'm unsure**
- **Measurements:** I read them off pictures at about 2.5 units per pixel, so walls and items can be off by 10–30 units.
- **Wall texture:** I couldn't find the original's computer-bank wall in halflife.wad. The walls are plain concrete (CRETE3_WALL01) with a strip of computer panels (LAB1_COMP3D) at eye height. Floors are TNNL_FLR7C, which looks close.
- **Entity numbers:** the kit numbers brush entities first, so the numbers on my plan don't match yours even though the entities do. There is also one extra entity, an `info_texlights`, which makes the fixtures give light.
- **Guesses:** the four small squares in the pits (I made them ceiling lamps), the trenches along the north and south walls, the exact shape of the central octagon's walls, and the height of a few items (the gauss and 9mmAR ammo on the middle platforms, the ammo near the north wall).
- **Not tested in the game:** the doors opening, the triggers firing and climbing the ladders. The kit can't run the game; its walk test only checks the geometry, including the ladders.

Files are in /tmp/smak-repro-Oc6BpR/work/frenzy_copy/:
- frenzy_copy.bsp
- frenzy_copy.map
- frenzy_copy.wad
