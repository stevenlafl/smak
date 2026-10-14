I've built kaupo_house and it compiles OK: no leak, the build's checks all pass, and every room is reached on foot from the start. Four things don't match the drawings exactly, and you need to copy one extra wad for it to load in the game.

**Where to find it:** the map is `work/kaupo_house/kaupo_house.bsp`, with its own `kaupo_house.wad`. It also needs `work/kaupo/kaupo.wad`, which holds the vertical tongue-and-groove boards I made for the walls, ceilings, floors and outside siding. The map's own texture list can't make boards that run vertically, so those live in a separate file. The engine check flags this: GoldSrc will refuse to load the map unless `kaupo.wad` sits in the mod folder beside `kaupo_house.wad`. Everything else comes from halflife.wad (the corrugated metal on the roof and shed) or the map's own wad.

**Orientation:** the map matches the drawing as it sits on the sheet, so map north is the top of the plan. Going by the sheet's compass, that is true west. The lanai and front steps face true east, and the shed is at the west end.

**What's in it.** The outside is 28'×34', as written on the plan. Floors are 4'6" above the ground, taken from section B-B (18'-6" from the front steps to the ridge, minus 14'-0" from the floor to the ridge). Ceilings are 9'-0" to the plate. Room sizes below are clear inside dimensions:

```
room          built (ft)     drawing label
living        14'8 x 19'2    16 x 18   (scales to ~15'5 x 19'11; I followed the scale and the 34' overall)
kitchen       14'8 x 6'8     7 x 16
lanai         14'8 x 4'10    6 x 16'6 (to the wall centre, open rail on two sides)
bedroom W/E   10'10 x 10'10  11 x 11
bathroom      6'8 x 9'0      7 x 9
closets (2)   3'4 x 3'4/3'7  (scaled)
shed          5'6 x 6'10, store 3'4 x 3'2, shower 3'4 x 2'10 (outside 11'4 x 8'6; drawn 11'1½ x 8'5½)
```

- **Doors:** all seven doors on the plan are door entities that open: the front door, the kitchen side door, two closet doors, the two bathroom doors and the shed store door. The cased openings into the kitchen and both bedrooms are open doorways, as drawn.
- **Windows:** all 19 sashes from the elevations are glazed and breakable, at their sill and head heights. That includes the low three-sash kitchen window over the shed roof. The lanai has open railing bays at 3' high on two sides.
- **Outside:** wooden front steps run down to a concrete slab. The kitchen has a side landing with steps down to the shed's slab, and the shed is entered at grade through its west opening.
- **Furniture:** the kitchen counter and shelves, the living-room corner shelf, the tub, toilet, sink and shelf in the bathroom, and the east bedroom's cabinet and shelf, all where the plan puts them.
- **Surfaces, from the photos:** white painted vertical boards inside, white board ceilings, wood floors, and tile in the kitchen. The bedroom marked sheet flooring has plain sheet flooring and the lanai and bathroom have plywood. Outside is weathered vertical siding with a corrugated metal roof, and the shed is corrugated metal. The photos are black and white, so all colours are my guesses.

**Walk test:** the player starts inside the front door, facing in. I ran a separate test build with a marker item in every room, including the shower and both closets, and all 18 targets were reached. That build is `work/kaupo_reachtest/`, and the two `kaupo_test` maps there are my experiments; all three can be deleted. The final build still gives two warnings:
- The middles of the bathroom and shower aren't walked, because the tub stands in the bathroom's middle and the shower is only 2'10" deep on the walk test's 8-unit grid. The marker items prove both rooms are reached.
- Two doorways measure 32 units, just wide enough for a player.

**Where it departs from the drawings:**
- **Walls are 10" thick instead of about 5".** With thinner walls the kit sealed off the openings between rooms and showed the inside boards on the outside. To keep the 28'×34' outside, every room is about 4–6" smaller than drawn.
- **The roof is a gable, not the hip roof in the elevations.** The kit can only make gable or flat roofs. The 4/12 pitch, the ridge running the long way, and the 2'-9½" eaves are as drawn.
- **There's no open crawlspace.** The kit builds the house as solid down to the ground, so I put a dark skirt with posts around it to read like the shadowed piers in the photos. There are no diagonal braces.
- **Doors are 3'0" wide and slide up, rather than swinging.** The closet and bathroom doors are drawn 2'6", and a GoldSrc player is 2'8" wide. The shed rooms are similarly squeezed so a player fits.

The windows are plain glass with no sash or muntin detail, and the sky is halflife's desert sky because the game has no Maui one.
