I've built frenzy_copy and it says OK: it compiled with no leak, every pickup is reached on foot, and there are no one-way places. I compared it with the original from the same cameras, and the layout lines up closely. The interiors are close, and dimmer in a few spots (see the last list).

**What matches the original:**
- **Layout and heights:** I measured floors and ceilings from sections every 64 units across the original. The plan matches, mirrored about y=0 as the original is:
  - the central eight-sided hall at floor 0;
  - the balcony ring at 160 around it;
  - the middle walkway with its grated windows and the health charger;
  - the upper floor at 320 with the long-jump item;
  - the long north–south upper corridors at 320 and 512, and the 160 spine and side wings;
  - the loop of corridors round the outside;
  - the north-east room with its step-down stairs from 160 to 0.
- **Doors, ladders and lifts:** there are no lifts. Both west doors are there, each opened by its trigger like the original. The two ladders in the south are at the same positions.
- **Places to start and pickups:** all 94 entities are at the original's positions, with the same keys. That covers the start, 14 deathmatch starts, every weapon, ammo and item, the 8 lights with their glow sprites, the railings and grates (see-through, as in the original), the health charger, the doors and their triggers.
- **Textures:** all from halflife.wad and the same set the original uses. The panelled walls (C3A1B_W3 and _W1/_W1A), the C3A1_W3A ceilings, both TNNL floors, and the BTH1 and GENPIPE1 trim are on the same bands and surfaces.

**Light:** the original lights most of the map from its ceiling lamp textures, not from light entities. I copied its 8 lights and added the same lamp textures in the same places, set to glow. I also added a small minimum brightness so no room goes black.

**Where it still differs, judged from the pictures:**
- A few corridors are darker than the original, mainly the east passage near (656, 0) and the outer west wall of the hall.
- The ceiling lamp fittings are flatter than the original's lamps.
- Some small details I couldn't read exactly (beam spacing, trim widths) are close but not exact.

The scratch builds frenzy_test, tex_test and lt_test are also in the work folder; you can delete them.

The map is at `work/frenzy_copy/frenzy_copy.bsp`, with its source `frenzy_copy.map`. To play it, copy the `.bsp` into `valve/maps/` and type `map frenzy_copy` in the console.
