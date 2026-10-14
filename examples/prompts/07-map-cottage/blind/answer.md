The cottage is built and the build passed every check. The map is `work/cottage/cottage.bsp` (load it with `map cottage`). The source `.map` and its own `.wad` are in the same folder.

| What you asked for | What's in the map |
| --- | --- |
| Main room about 384 × 320 | 384 × 320, 128 high, with a plank floor, plaster walls and a dark wood ceiling |
| Brick fireplace in the middle of the west wall | Brick, sitting flush against the middle of the west wall. Two side pillars and a lintel frame a firebox 64 wide and 64 high, on a brick hearth, with a narrower chimney breast going up to the ceiling |
| Fire glowing orange | A glowing flame block sits in the hearth with an orange light inside the firebox (colour 255 130 40). I gave the light a gentle flicker so it reads as fire; that's one setting if you'd rather it stayed steady |
| Start near the south-east corner, facing the fireplace | Your start is in the south-east corner, facing west. I checked the view from there and the fireplace sits straight ahead |
| Bedroom to the east through a wooden door, about 256 × 320, one step up | 256 × 320, with a wooden door that slides up, centred in the shared wall. Its floor is 16 units higher, a single step a player walks up with no stairs |
| Bed against the bedroom's east wall | A wooden bed frame with bedding and a headboard, against the east wall |
| Narrow pantry north of the main room, 384 × 160 | 384 × 160, the same width as the main room and lined up with it |
| Open doorway, with a serving hatch in the same wall | The doorway is 64 wide and 96 high, toward the west end of the wall. The hatch is a 48 × 48 window just east of it, starting 40 units above the floor |
| Shelves along the pantry's north wall, and a headcrab | Three wooden shelves on four uprights run nearly the full width of the north wall. The headcrab is in the middle of the pantry, facing the doorway |
| Every room lit | Each room has ceiling lamps as well as the fire light. Floor brightness is 204 in the main room, 167 in the bedroom and 137 in the pantry, on a 0 to 255 scale where the build calls anything under 24 dark |
| Walk everywhere | The walk test reaches all three rooms, the headcrab and the area behind the door. It covers 96% of the floor a player can stand on; the rest is the strips beside the furniture and along the walls |

**Limits:**
- The pictures are the tool's own stand-in for the game. Nobody has played the map, so the door opening, the flicker and the headcrab waking up are untested.
- The light was compiled in a quick draft mode with no bounced light, so in the game the rooms may look a bit different from the pictures.
