The build is OK: compiled, no leak, all 58 places a player goes to are reached on foot. It is not a full match, and several deviations were forced by how the floor-plan path works.

**Output:** `work:frenzy_copy/frenzy_copy.bsp` (source `frenzy_copy.map`, textures `frenzy_copy.wad`). It sits at `/tmp/smak-repro-FnOy1f/work/frenzy_copy/`.

**What matches**
- Layout, room sizes and floor heights come from the height plan (`work:heightplan/`). The walk and the plan match the reference's plan.
- All 85 point entities are placed at the marks' x and y: starts, 14 deathmatch starts, weapons, ammo, batteries, longjump, snark, and the 8 glows.
- Textures, chosen by matching the views against halflife.wad: `CRETE1_WALL01` walls, `CRETE3_FLR05` floor, `LAB1_PANEL1` ceiling, `LAB1_DOOR2A` door. These are near matches, not exact.
- The health charger is a brush entity at (-20, 0).

**Deviations, in order of how much they will show**
1. **Lights.** The reference's 8 light entities are not used as lights. In a floor-plan map a user `light` gets a rod up to the nearest floor above, and where no floor is above, the rod runs past the 4096 limit and fails the build. The rooms are lit by the spec's own 24 lamps instead. The 8 marks are `env_glow` sprites only.
2. **Shelves.** The reference's aisles are lined with shelves of cans. I did not model them; the walls are bare concrete. This is the most visible difference.
3. **Doors.** Only the north door (-1312, 336) is in. The south door (-1312, -336) cuts the only route to the west strip, so the build fails with it. The door is a `func_door` that opens on touch; there are no triggers.
4. **Items on raised floors.** The two `ammo_ARgrenades` at (-664, ±152) and the `item_longjump` at (-72, 0) sit on floor 0 at z 16, not on the z 320 gallery, which cannot be walked to in this layout. The other items on raised floors stay where the marks put them.
5. **Not reproduced.** The 12 `func_wall` pieces, the 2 `func_ladder` pieces (ladders need rooms, and this path has none), and the 2 `trigger_multiple` pieces.
6. **Heights.** The spec lowers placed entities from their marks: players by 28 units and items by 16. The marks are the reference's `z`, so the placed origins sit a little below them.
7. **Warning left.** 48 places let a player fall more than 210 units, the worst 336 at (-520, 416, 336). These are the gallery edges. The reference has the same drops; railing them is a choice for you.

I did not compare the views with `views.png` side by side at the reference's cameras, beyond checking that the start views are lit and concrete.

The spec JSON is not saved on disk: the Write tool is disabled in this session, so the build call is the only record of it. Saving it to the reproduce folder would need that tool or your go-ahead to use another way.
