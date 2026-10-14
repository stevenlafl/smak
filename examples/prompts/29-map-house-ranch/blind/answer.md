The house is built and the build says OK: every check passed (no leaks, every room lit, every room reachable from the street). The file is `work/ranch_house/ranch_house.bsp` (load it with `map ranch_house`). The source spec isn't saved as a file because I passed it inline, so for a later change, ask me and I'll rebuild under the same name.

**From the street:** a pale blue clapboard house with a grey shingle gable roof sits on a lawn behind a low hedge. The front door has a bush on each side, the big glazed front window is to its right, and a concrete driveway runs through the gap in the hedge up the east side to the kitchen's back door.

**Inside:** the front room picture shows the green sofa facing the TV on the west wall, with the coffee table between them, the armchair and the potted plant. The kitchen picture shows white tiles with the fridge, sink and stove along the back wall and the small table with two chairs.

| What you asked for | What I made |
| --- | --- |
| Ranch house, one storey | 6 rooms on one floor, about 590 × 580 units, 8 units above the lawn |
| Pale blue siding, grey shingle gable | Blue clapboard outside, grey shingle gable roof with a 16-unit overhang |
| Lawn, gap to the street for a driveway | Grass lot with a low hedge along the street. The driveway gap is 160 wide, with a concrete strip up to the side yard |
| Living room | Front door, a big 112 × 64 glass front window, a second window on the west wall, sofa facing the TV, coffee table, armchair (also facing the TV), plant |
| Kitchen | Through a 128-wide opening from the living room. White tiled floor, fridge, sink and stove along the back (north) wall, small table with 2 chairs, back door out to the east side yard, windows on the south and east walls |
| Main bedroom | Double bed and dresser, windows on the north and west walls |
| Bathroom | Pale blue tile on the floor and walls, a tub and a toilet |
| Kid's room | Single bed with orange bedding and a dresser, windows on the north and east walls |
| Glass in the windows | Every window has a glass pane (a pane that can be shot out) |
| Yard | 2 trees (front west, back east), 2 bushes by the front door, a bench and a 2-seat swing set in the back yard |
| Lit inside | Lamps in every room. Floor light runs from 201 (hall) to 245 (bath) out of 255, and the check fails a room under 24 |
| Walkable from the street | The walk test reaches every room from a start point in the street, and there's no place you can get into but not back out of |

**Things I added or decided myself:**
- **A hallway:** a 64-wide hall runs across the back from the living room to the three back rooms, each through its own door. Without it, one bedroom would have opened straight off the kitchen.
- **Neighbourhood fit:** the lot is the first room, with its front on the south side. The street is a test-only room, so it drops out when the house is included in a larger map, and the street map links to the lot by its prefixed id.

**Things that didn't come out as wanted:**
- **High hedge walls:** the lot's side and back edges are 480-unit walls painted as hedge. Each lot is a room cut out of solid rock, so it can't be open on those sides yet. From the street it looks like a tall green box behind the house. Once neighbouring lots sit beside it, the shared edges could be opened up the same way the street side is.
- **Furniture is plain shapes:** everything is built from boxes, so a tree is a trunk with two blocky leaf layers and the swing ropes are thin bars.
- **Kitchen looks washed out:** it renders very bright in these pictures. The pictures only approximate the game's lighting, so check it in the game.
- **No sky picture:** the preview couldn't find the desert sky picture, so the sky shows as flat blue. The game will draw its own sky.
- **Not tested in the game:** I couldn't run the game, so the doors opening and the glass breaking only show there.
