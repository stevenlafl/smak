# More checks of a map, with no game running

Beside `docs/MAPS.md` and `docs/MAPS-MAKING.md`: what was added after agents built two maps of a series and
met these faults. Each is a function of `maps` and, where it says so, a command.

## The walk test: what a class is

`reachOf` counts "the entities a player goes to". Three lists say what the classes alone do not, each by
number, classname (`*` for any letters) or targetname, and a mod's profile may carry them (`exits`,
`markers`, `wiring`, `off`):

| option | what it names | and then |
| --- | --- | --- |
| `exits` | a way out of the map (`msarea_transition`) | counted, and floor it is reached from is no one-way place |
| `markers` | a point a player is to get to though its class is wiring's (an `info_target` a script puts a chest at) | counted |
| `wiring` | what is fired by name and works wherever it stands (a line of text, a counter, a spawn area's own origin) | never counted, wherever it is |
| `off` | classnames that are an entity switched off (`disabled_*`: a class the game does not have) | no wall; one whose class would be a way out is looked for and told apart |

An entity of a class the game does not have is never made by the engine, so a brush entity so named stops
nothing (`spaceOf` takes `off` too). A switched-off way out is the way on that is not opened yet: it is in
`entities` with `off: true`, a fact says whether it is reached, and it is neither a way out nor, when it is
not reached, a warning.

The triggers that are only fired (`trigger_counter`, `trigger_relay`, `trigger_auto`,
`trigger_changetarget`, `trigger_camera`, `trigger_transition`) are left out by themselves, made of a brush
or not: nobody walks to a counter. And a `trigger_counter` with no brush is not said to have "no shape": its
code never asks for one.

`reach.walked(x, y, under)` is a **height**, and a floor at 0 is 0: compare with `null`, or ask
`reach.on(x, y, under)`, which gives `{ floor, stands, walked, jumped, trapped }` as yes and no.

**With `mod`, the profile's four lists are used without being given again** (`reachOf`, `spaceOf` for `off`,
`smak map-reach --mod`, `openingViews` with `mod`): a list given by name is added to the
profile's, never put in its place, so naming `wiring: ["ms_text"]` beside a profile that has it changes
nothing. To walk without one of the profile's, hand over the profile without it (`mod: { ...profile, wiring:
[] }`). The Barrow Road's walk gave its wiring again; the fourteen walks of its script come out the same
without it.

## The walk test: what carries it on, and why a part is not walked to

What an agent rebuilding a map met: a body asked for by its name threw a TypeError; a temple walked "a
third" with nothing to say why; a ladder in a shaft 3 wide was never climbed. Now (docs/MAPS.md, the walk
test):

- **A body by its name**: `space.blocked(x, y, "point")`, `restOf(space, feet, "crouching")`, `climbs` the
  same; anything else is refused in a sentence that says what is wanted and what was given (`bodyOf`).
- **What carries the walk on**: teleports (for every way tried, not the walk alone; the landing is no place
  to go to; one that leads nowhere is a warning), ladders off the grid (asked along lines a unit apart), the
  doors of every kind open unless told, and what breaks or is switched off (`func_breakable`,
  `func_wall_toggle`, `func_pushable`) a wall unless `walls: "gone"`; a toggled wall that starts off is not
  there.
- **How much and why**: `share` and `standable` (the floor a standing player fits on, and the part walked),
  and `parts`, each part of the floor not walked to with `how` (`jump`, `crouch-jump`, `crouch`, `wall`,
  `air`, `none`), `why` (where the way leaves the walked floor, or the brush entities in the way, by name),
  `nearest` and `behind`. A fact says when a map is meant to be jumped through. `parts: false` skips it.

The share is counted on the walk's own grid: each place and each stretch of heights a standing player fits in
there, over a floor not too steep to stand on. On Master Sword's maps, on foot with the profile: demontemple
27.3 in 100 (62.3 with `jump: true`, 99.1 with `walls: "gone"` as well), edanasewers 52.9 before the ladders'
shafts and 55.5 after (84.2 with jumps), cleicert_old 5.8 (92.4 with its toggled walls gone: the walk named
them, "behind 72 func_wall_toggle "mainorb1" ..., then 74 func_wall_toggle "freetogo"").

## Scripts of one's own against the game's

For a mod whose maps and scripts name scripts by path, and which lays one's scripts over its own pack: a
file at a path the pack has takes that script's place; one at a new path does something only if something
names it. `scriptsPlaced` tells the three apart:

```
smak scripts content/scripts maps/yard.bsp --mod profile.mjs --game <mod folder> [--shipped <the pack unpacked>]

replaces  monsters/wolf
new       yard/keeper: named by the map yard (entity 161 ms_npc "keeper")
new       yard/map_startup: named by the game itself, when the map yard starts
UNNAMED   world/server/maps
WARN  1 scripts are new (the game ships none of that name) and nothing names them: ...
```

A new script is live when a map's entity names it, when the game runs or lists it by itself, or when a live
script's text names it (the game's own scripts, ours in their place, and every new one made live in turn).
How scripts are named is the profile's `scriptPack` (`shipped`, `loose`, `ofEntity`, `aliases`, `started`:
`src/maps/scripts.mjs`). `map-check --scripts <folder>` says the same of that map's folders, and warns of a
script named by nothing only when it is that map's own (under a folder of the map's name, or as the
profile's `mapOf` says) or named only by one of its own: another map's script is named by that map, which
is not looked at, and is counted in a fact instead. `--all` warns of every one, as `smak scripts` does
(`scriptsPlaced({ ..., only: ["yard"] })` in a script). What it cannot see is a name put together while the
game runs: a script reached only so is "named by nothing", a warning.

## A compile that is seen, and stopped

`compileMap` always had a time for each program (2 minutes for hlcsg and hlbsp, 15 for hlvis and hlrad;
`timeout: { hlvis: ms }`); a program that passes it is stopped, the error says so, and no `.bsp` is written.
New:

- `progress: true` hands on what the compilers print as they work (to standard error; a file descriptor
  will do). `smak map-compile` does it by itself on a terminal, `--progress` / `--no-progress` say otherwise,
  and `--timeout 600` or `--timeout hlvis=600,hlrad=1200` sets the times in seconds.
- `result.portals`: `{ leaves, portals, seconds }`, read from the `.prt` hlbsp leaves. The portals are
  hlvis's work. Measured: 5088 portals, 219 seconds of full hlvis on 12 threads; 269 portals, 0.01. The
  time is taken to grow with the square of the count, so `seconds` is a GUESS from one map, and no floor:
  595 portals were guessed at 3 seconds and took a tenth of one. The summary says what a full hlvis took
  once it has run, and a guess only from 60 seconds on, called a guess (`portalsLine(result)`); under that
  it counts the portals and foretells nothing. From 4000 portals, or when the guess passes hlvis's time, a
  warning says so **before** hlvis begins.
- `result.facts`: a draft (`fast`) says what it is: hlrad bounced no light (its own log: `bounces 0` where
  the full compile has 8), so what no lamp sees directly is black.
- the summary and the command print each program's seconds, "stopped" for one that was, and the portals.

## The light on the floor

A view's `brightness` is the mean of one picture: walls, ceiling and floor together. A lamp high in a room
makes a bright picture of a room whose floor is dim, and the game lights whatever stands in a room (a
monster, a chest) by the light of the floor under it. `lightReport` reads the lightmaps of the floors:

```js
const light = maps.lightReport(bsp, { rooms: { hall: { min, max }, tomb: { min, max } } });
// light.floor { area, mean, least, most, darkShare }, light.rooms [{ name, mean, dark, dim }], light.patches
```

```
smak map-light map.bsp [--rooms rooms.json] [--dark 24] [--walked]
```

A room is **dark** when its floor's samples average under 24 of 255 (this kit's own line), and **dim** when
it has under 0.6 of the light of the map's middling room: the eye settles to the rooms it came through.
Without rooms, the dark of the floor is gathered into stretches and listed with their places. With
`reach` (`--walked`), only floor a player walks is counted.

The numbers are the bytes hlrad stored. The engine (Xash's GL renderer, its defaults) shows texture x
sample x 2; this kit's views use 1.55. Both are a straight multiply, so a view is as true as the lightmaps
are: of a draft it shows the draft's light.

## A band left empty on purpose

A spawn area's place has one template for each strength of party (`reqhp` "0;150", "150;500", "500" in
Master Sword), and the profile's `bands` rule warns when the ranges at a place do not meet: "nothing has 150
to 500, between 0;150 and 500". A map may leave a place empty in one band on purpose (the Barrow Road keeps
some of its places for the weak and the strong only), and then the warning hid the true faults among 18 that
were meant.

The rule's `open` names a key by which the map says so, on the place's templates: Master Sword's profile reads
`reqhp_none`, the ranges left empty there parted by commas.

```
msmonster_skeleton  spawnarea road1_spawn  reqhp "0;150"  reqhp_none "150;500"   (and the one of "500" the same)
```

- A range said to be empty fills the gap: the place's ranges meet, and nothing is said.
- A gap the key does not cover is still told ("nothing has 500 to 600, between 150;500 (left empty) and
  600"), and so is a range said to be empty that a template has ("150;500 (left empty) and 150;500
  overlap"), and a value that is no range.
- The game reads no such key: it is a note for the check, and the check of keys a class does not define
  passes over a key a rule of the profile names as its `open`. A profile without `open` reads none (the key
  is then a key its class does not define, and the gap a gap).

Measured: maps/barrowroad (msr-web) had 18 such warnings, each a place meant to be empty in the middle band;
with `reqhp_none` on its templates (its monsters the same) its `checkPlan` and `checkBsp` say 0 warnings.
