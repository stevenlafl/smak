The map `frenzy_copy` is built and the build says OK: it compiled, there's no leak, and all 64 entities a player goes to can be reached on foot from the 15 places to start. It's a close copy of the layout but not an exact one. The differences are listed below.

**What matches the original**
- **Overall shape:** an octagonal building split by a north–south corridor at height 320 that runs the full length. Each half is a tall hall up to 640 with a walkway ring at 160 and four pits down to 0. The angled walls are at 45°, and the corner walls of the central hall are at 28°.
- **Central hall:** floor at 0 with a balcony at 160, a bridge at 320, four platforms (the func_walls), ledges at 320, and the 512 roof sitting over a 320 ledge, as in the side section.
- **Ground level:** the passages at 0 are there (north, south, west and east, plus the ring under the corridor), as are the crossings at 160 under the corridor and the sloped outer walls.
- **Northeast room:** stairs up to a landing at 120, a balcony at 160, the annex, and the original's 8 lights with their glow sprites.
- **Doors:** the two west doors, each opened by a trigger_multiple, with targetnames door01 and door02 as in the original.
- **Entities:** every one of the original's 93 is placed at the position I read off the plan and storeys. That covers 1 + 14 starts, all the weapons, ammo and items, the health charger, both ladders and the 12 func_walls.
- **Default views:** the default view set picks the same 8 start spots as the original's views.png. I also checked the two room cameras the original uses, and the stairs/corridor view in the northeast room lines up.

**Where it differs**
- **Entity numbers:** the tool numbers brush entities and doors first, so my start is #20, not #1, and the other numbers are shifted too. The positions are right.
- **Lights:** the original is lit mostly by light-emitting textures, which the spec can't make. I added 36 light entities on top of its 8, so mine shows more light markers. I kept the 36 as few as I could and still keep every room above the darkness limit.
- **Textures:** I couldn't find the original's exact wall texture (concrete with a band of computer racks). I used C1A3_W1E (concrete with a green band), C1A1_FLR2C (brown tile floor) and C1A4TNNL1 (concrete ceiling).
- **Simplified shapes:**
  - The 512 roof and the four platforms are rectangles, where the original's follow the hex outline.
  - The raised 320 area in the southeast is a plain block.
  - The original's corridor marks at "Z 480" I read as ceiling beams.
- **Readings from the pictures:** the 512 roof, the 320 ledges and the southeast area could only be read approximately, so some heights and extents there may be off by a few dozen units. Two pickups, the hand grenades and AR grenades on the central platforms, are about 50 units inward of where the original has them, because my platforms are narrower.
- **Not checked in the game:**
  - The walk test is geometry only.
  - The doors opening, the ladders being climbable and the charger working only show in the game.
  - Ladder 11 only reaches the top of its shaft (136), so you can't climb it up into the room above.
  - The tool's own view renders couldn't find halflife.wad, so they drew flat colours; the build's own pictures show the textures.

Files are in `work:frenzy_copy/`: `frenzy_copy.bsp`, plus the `.map`, the plan and the view pictures.
