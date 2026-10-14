# 08 A watchtower (map, storeys, stairs up and down, a corridor)

## The prompt (138 words)

> A stone watchtower level. I start in the ground-floor guard room, about 320 square and 160 high. A
> staircase in the guard room climbs to a lookout room directly above it, the same size but 128 high,
> where a crossbow lies waiting. From the guard room a corridor about 128 wide leads east for about 256
> units to a storeroom (256 by 320) with a battery on the floor. Beside the storeroom to the east, and 96
> units lower, is a cellar about 320 by 320 reached by stairs going down from the storeroom; a zombie waits
> down there. Stone walls and floors throughout, a darker stone in the cellar, wooden ceilings. Every room
> lit, the cellar only dimly. I need to be able to walk to everything, up and down, with no jumping.

## The rubric (written before the spec)

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | Guard room 320 x 320 x 160 with the start | yes | 2 |
| 2 | A lookout room of the same plan directly above it, 128 high, reached by stairs from the guard room | yes | 2 |
| 3 | A corridor about 128 wide and 256 long east to the storeroom (256 x 320) | yes | 2 |
| 4 | A cellar beside the storeroom to the east, 96 lower, reached by stairs down | yes | 2 |
| 5 | The crossbow upstairs, the battery in the storeroom, the zombie in the cellar | yes | 2 |
| 6 | Stone walls and floors, darker stone in the cellar, wooden ceilings | no | 2 |
| 7 | Every room lit, the cellar dimmer than the rest | no | 2 |
| 8 | Sealed, compiled, every entity reached on foot without jumping, nothing in solid | yes | 2 |

**Score: 16 of 16 (100%). Passes.**

## How the prompt became the spec

- Five rooms placed by words: `lookout` `above` `guardroom` (the rock between is the lookout's floor),
  `corridor` `east_of` the guard room (256 by 128), `storeroom` `east_of` the corridor, `cellar` `east_of`
  the storeroom with `floor: -96`.
- Links: `stairs` from the guard room to the lookout (the kit puts 11 steps in the guard room and cuts
  their shaft through the floor above); openings guard room to corridor to storeroom; an opening from the
  storeroom to the cellar, for which the kit puts 6 steps down in the cellar, since the floors differ by
  more than a step.
- Stone theme with wooden ceilings; the cellar's floor lined with a darker stone and one dim lamp
  (`light: { count: 1, brightness: 110 }`).

## Iterations

1. `ERROR links[3]: the way from storeroom to cellar is 48 high`: the cellar, 96 lower and 144 tall, had
   its ceiling 48 over the storeroom's floor. The cellar was made 232 tall, its ceiling at 136.
2. The build crashed in the kit (`Cannot read properties of undefined`): the map builder wrote the walk
   test's faults itself from fields that are not always there. It now hands on the walk test's own
   sentences (`src/spec/map.mjs`). The faults it then gave were right: the start (`corner se`) stood on
   the stairs, and with no room to stand the walk reached nothing. The stairs were also off the grid (a
   run shared among the steps unevenly); the kit's stairs now have treads of 24.
3. The start moved to `corner ne`: clean. All 4 entities reached on foot, up the stairs and down to the
   cellar; floors lit 174, 197, 210, 156 and the cellar 35 (dim, over the dark line of 24). The build now
   also draws a section through every staircase (picture-3): the 11 steps rising from the guard room's
   floor to the lookout's at 176 through the stairwell, and the 6 steps down from the storeroom's floor
   to the cellar's at -96. The plan (picture-1) and the views (picture-2) show the rooms in a line from
   west to east, the stairwell in the lookout's floor and the dark cellar with its zombie.
