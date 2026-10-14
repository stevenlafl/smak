The underground is built and the build passes every check (leaks, walk test, light, nothing stuck in walls, entities checked against the Half-Life FGD, the file that lists the game's entity types).

**File:** `work/underground/underground.bsp`. The editable source is `underground.map` and its textures are in `underground.wad`, both in the same folder.

What I made of each thing you asked for:

```
Maintenance room   192 x 192 x 128, concrete, one dim bulb. You start here, facing east.
                   The city's alley would connect through its west wall; that side is left clear.
Stairs             Behind a sliding metal door, a 96-wide stairwell drops 224 in 14 steps
                   into the drain.
Storm drain        900 long, 256 wide, 384 tall.
  Channel          96 wide, sunk 48, holding 36 of dark water, with a dry walkway
                   (80 wide) on each side.
  Getting out      Two concrete steps at each end of the channel take you back up
                   to the walkway.
  Bridge           Metal deck 48 wide with railings, across the middle of the channel.
  Ducts            Square steel ducts, 32 x 32, along both walls, 288 to 320 up.
  Lights           5 small cold blue-green wall lamps that glow, alternating between
                   the two walls, plus a matching light at each.
  Zombies          2: one on the south walkway, one on the north.
Hideout            384 x 320, through a doorway in the drain's north wall.
                   Mattress, a desk of two crates with a plank top, two glowing cyan
                   screens, a generator with a small glowing green status light,
                   a shotgun on the desk, and one weak hanging bulb.
Culvert            At the east end, 128 wide and 104 high, through a 112-wide opening.
                   Water 36 deep (about half a man) that you wade through.
                   Headcrab in the water.
```

**Light:** dark but not black. Every floor measures over the 24-of-255 "too dark" line after the compile:

```
maintenance 41   stairwell 27   drain 35   channel 37   hideout 27   culvert 38
```

The hideout is lit mostly by the screens. Inside, the desk and screens read well; the rest of the room is shadowy.

**Reachability:** the walk test reaches every entity on foot with no jumps. It also found no spot you can get into but not back out of, so the steps out of the water work.

Things to know:
- **Under the bridge:** you can't get under it in the water, since it sits flush on the channel. The channel works as two halves, each with its own steps out at the end. The build flags this as a warning but not a fault.
- **The culvert is a dead end.** You asked for a culvert you wade through but didn't say where it leads, so it stops after 384 units. If it should come out somewhere, tell me where.
- **Attaching it:** the maintenance room is the first room so the map can be pulled into your city's spec as a module. Connect it with an opening between your alley and the maintenance room's west side. Its starting point is dropped automatically when it's included.
- **Not shown in my pictures:** the shotgun's model doesn't draw in the preview, so I checked its position from the compiled file: it's on the desk top (36 up). The sliding door and the zombies and headcrab moving only show in the game.
- **Leftover files:** two small test maps (`work/lt_test`, `work/underground_t`) are still in the work folder. I can't delete files through this tool, so remove them yourself if you like.
