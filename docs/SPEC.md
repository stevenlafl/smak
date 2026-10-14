# Specs: a model or a map from a person's words

A spec is a description in plain JSON of a model or a map. The person says what they want, in words and
maybe a drawing; you, the agent, turn that into a spec; the tool `build` (or `buildModelSpec` and
`buildMapSpec` in a script) builds it, checks it and draws it. You write no code and no coordinates of
brushes or triangles: parts are placed by saying what they sit on, rooms by saying what they are next to.
Nothing in the kit reads the person's words itself.

```
build { spec: {...} }                        a model or a map, from the spec given
build { spec: "lamp.json" }                  the same, from a file of the work or models folder
build { spec: {...}, reference: "x.png" }    the person's drawing or picture drawn beside the result
build { spec: {...}, focus: ["lantern"] }    a model's parts seen close: from the front, the back, below
entities { match: "door" }                   the game's entity classes (its FGD); { class } their keys
```

`examples/prompts/` holds worked cases, each a person's request, its rubric, the spec it became and the
pictures of the result, from a barrel to a city of four shops and a sewer; read one like yours first.

## The loop

1. **Read what is asked, and list it.** Each thing the person names (a part, a room, a door, a count, a
   size, a colour) is a line of your list. That list is what you check the result against at the end.
2. **Write the spec.** Sizes in units (about an inch: a player is 72 tall, a door 64 by 96, a barrel 40
   tall). Ids are words that say what the part or the room is: `lid`, `hall`, never `part3`.
3. **Build it** and read the report from the top. `OK` is the shape and the map passing every check;
   `NOT OK` lists what to fix, each line naming the part or the room. Fix the spec, build again.
4. **Look at the pictures** against your list: a part in the wrong place, a size that reads wrong, a door
   in the wrong wall show there and in no check. The report also lists every part or room with where it
   ended up (from the lowest part up), which tells a stack built upside down at once.
5. **Large requests: prefabs and modules.** A request that needs more than one spec can say (a tavern with
   its tables, a city with its shops) is cut in pieces: each piece a spec of its own, built and checked
   alone, then put in the larger one: a model's `prefab` part; a map's `models`, `prefabs` (brushes, or a
   `.map` file) and `include` (a whole map spec as a module).
6. **The person asks for a change** ("looks good, now add a fridge next to the cabinet"): change the spec
   as little as the request needs and build it again under the same name. The report then says what
   changed since the last build (`CHANGED ... things added: ...`, `... are where they were`): tell the
   person that, and check that nothing changed that they did not ask for.

## A model

```json
{
  "spec": "smak.model/1",
  "name": "barrel.mdl",
  "kind": "prop",
  "size": { "height": 40 },
  "materials": { "oak": { "base": "wood" }, "hoop": { "base": "iron", "rust": 0.3 } },
  "parts": [
    { "id": "body", "kind": "turn", "material": "oak", "sides": 16,
      "rings": [[0, 11], [10, 12.5], [20, 13], [30, 12.5], [40, 11]] },
    { "id": "hoop_low", "kind": "band", "material": "hoop", "on": { "part": "body", "s": 0.15 }, "width": 2, "height": 0.4 },
    { "id": "hoop_high", "kind": "band", "material": "hoop", "on": { "part": "body", "s": 0.85 }, "width": 2, "height": 0.4 }
  ]
}
```

| Field | |
| --- | --- |
| `name` | The file: letters, digits, `_ . -`, ending `.mdl` |
| `kind` | `prop` (stands on the floor: its lowest point is put at z 0), `held` or `piece` (left where it was built), `character` (a body on a game model's skeleton, below) |
| `base` | For a character: `{ file }`, the game's model whose skeleton and animations it keeps |
| `weapon` | For a weapon: `{ like: "crowbar" }`, the game's weapon whose v_, p_ and w_ files it takes the place of (below) |
| `size` | What the person asked for: `{ height, length, width }` (any of them). Off by more than 10% is warned of, more than 25% is a fault |
| `texture` | `{ width, height }` of the shared picture (256 x 256 unless told; 512 x 256 for a larger thing) |
| `materials` | Names for materials the parts share: `{ "oak": { "base": "wood", "tone": [r, g, b] } }`. A part may also name a base itself (`"material": "iron"`) |
| `parts` | The parts, each placed on one listed above it |
| `prefabs` | `{ name: <another model spec> }`, for parts of kind `prefab` |
| `allow` | `{ open: [ids], floating: [ids] }`: parts open or apart on purpose (a part can say `open: true` or `loose: true` itself) |
| `finish` | What a painter adds over the materials, read from the shape (below): `{ light, wear, grime, vary }`, each 0 to 1, or `false` for none. A part may have its own |

### Axes, and which way is up

`+x` is the front, `+y` the left, `+z` up. A prop stands on z 0. A part is built in its own space (below),
turned by `rotate`, then moved to its place. **Build things upright**: a post, a lamp, a barrel along `z`
(the turned kinds' default); a beam, a blade, a car's body or a log lying down along `x` (`"axis": "x"`).

### The kinds of part

| kind | fields | its own space |
| --- | --- | --- |
| `box` | `size: [x, y, z]` | centred on x and y, from z 0 up to z |
| `cylinder` | `radius`, `height`, `top` (radius at the top: a cone or a taper), `sides` (16) | along z from 0 to `height`, both ends closed |
| `sphere` | `radius`, `sides` | from z 0 to `2 * radius` |
| `turn` | `rings: [[s, r], ...]` (s along the axis, growing; r its radius, `[ra, rb]` an oval, 0 makes a point; `{ s, r, crease: true }` a hard edge, `{ s, r, off: [a, b] }` its middle moved off the axis), `caps: [start, end]` (true: flat; a number: a dome that high; false: open, which needs `open: true` or a `lining`), `lining: { inset }` (an inside: a cup, a bowl, a helmet, a pipe; the rings then run from the open rim, so the first ring is the open end and `caps` is `[false, ...]`: a pipe open at its front is built from the front back, `rotate: [180, 0, 0]`), `axis` (`z`), `sides` (16) | along its axis from its first ring |
| `tube` | `path: [[x, y, z, r], ...]` (a bent pipe, an arm, a horn, a rope, a rim round a circle; r 0 at an end makes a point), `sides` (8) | as the path's numbers say |
| `leaf` | `width`, `height`, `bend` (how far its middle bulges), or `rows` of points (a grid: a sagging awning) | a sheet seen from both sides, in the x-z plane: a flag, a sign, a pane, a sail |
| `band` | `on: { part, s }`, `width`, `height` | a hoop round a turned part (`s` 0 at its first ring, 1 at its last). Moves with that part |
| `boss` | `on: { part, s, angle }`, `radius`, `height` | a round stud (a rivet, a knob, a gem) on a turned part; `angle` in degrees round it: for a part along `z`, 0 faces +x and 90 +y; along `x`, 0 faces +y and 90 +z (up); along `y`, 0 faces +z and 90 +x |
| `ridge` | `on: { part, path: [[s, angle], ...] }`, `width`, `height` | a raised line along a turned part (a stripe, a seam) |
| `studs` | `on: { part, path }`, `count`, `radius`, `height` | a row of studs along that path |
| `kit:sword`, `kit:axe`, `kit:blunt`, `kit:bow` | `options`: the kit's own (its header in `kits/`; a blade's `half` as `{ "taper": [base, tip] }`) | lying along +x, grip at the origin |
| `prefab` | `prefab` (a name of `prefabs`), `spec` (one given here) or `file` (a .json beside this spec: another case's model, reused), `scale` | the prefab as it was built |

### Placing a part

A part is placed in one of two ways, then copied when asked:

- `attach: { to, toAt, at, offset }`: **its anchor `at` is put on the anchor `toAt` of the part `to`**.
  Anchors are the middles of the faces of a part's box: `top`, `bottom`, `front` (+x), `back`, `left`
  (+y), `right`, `centre`; `start` and `end` (the two ends of a turned part's axis, a tube's path, a box's
  bottom and top); and on a turned part `{ "s": 0.9, "angle": 90, "out": 0 }`, a point of its surface.
  Unless told, `at` is `bottom` and `toAt` is `top`: **"stands on"**. `offset: [x, y, z]` moves it on from
  there. A lid on a pot: `{ "to": "pot" }`. A lamp's arm out of its post near the top:
  `{ "to": "post", "toAt": { "s": 0.9, "angle": 0 }, "at": "start" }`. A second mug beside the first:
  `{ "to": "mug", "toAt": "left", "at": "right" }`.
- `at: [x, y, z]`: where its own space's origin goes.
- `rotate: [yaw, pitch, roll]` in degrees turns the part in its own space before it is placed: yaw about
  z (90 turns +x to +y), pitch about y (90 turns +x down to -z, so `[0, -90, 0]` stands a part made along
  x upright), roll about x.
- `mirror: "y"` adds a copy on the other side (left for right, through y = 0); `"x"`, front for back.
- `repeat: { count, around, start, axis }` makes `count` of it round an axis (`z`, upright, unless told;
  `y` for a wheel facing sideways, `x`) through the middle of the part `around` (or through `through: [x,
  y, z]`), the first turned `start` degrees: chair legs, a crown's points, a wheel's spokes. Copies of a
  part must not all begin at one point: start each a little off the axis.

Parts should touch: the check calls a part more than 0.25 units from every other **floating**. Let parts
sink a little into what they stand on (an `offset` of `[0, 0, -0.5]`), the way a real thing is made: a part
sunk into another, or cutting through it, touches it.

### A character on a game's skeleton

A player model or a monster is a body put on a model the game already has, so that it keeps that model's
bones and every animation: `"kind": "character"`, `"base": { "file": "player/gordon/gordon.mdl" }` (found
in the game's `models` folder). The parts are placed in model space as the base stands in its first
animation's first frame (the report's `fact base ...` lists every joint there; the pose is not symmetric:
Gordon's right hand holds a gun forward), each corner hung on one bone, and the body replaces each of the
base's bodies. Then the report holds it in that pose, the middle of a run, a walk, a crouch and a jump:
a part that comes apart in any of them is a fault (`in run2 frame 11: ... thumb_left 0.28 units away`).

- `span: { bones: [a, b], over }`: laid along a limb from joint `a` to joint `b`, its own z stretched to
  their distance and `over` units past each end (so that the joints overlap and stay closed when they bend),
  its x towards the front. A cylinder, a box or a turn: an upper arm, a thigh, the chest from `Spine1` to
  `Neck`. It hangs on `a`.
- `attach: { bone, at, offset }`: its anchor `at` (`centre` unless told) on that bone's joint: a head, a
  hand, a foot, a knob at a knee. Parts attached to it hang on its bone.
- `bone`: the bone a part placed by `at` hangs on (a rib built in the chest's space).
- Left and right are given apart, each on its own side's bones; `mirror: "y"` of a part on a middle bone
  copies it across, and a mirrored part on an `L` bone hangs its copy on the `R` one.
- A joint that bends far (an elbow, a knee) wants a sphere on it, or a limb part with `over`: two boxes
  that meet end to end open a gap as soon as it bends.
- GoldSrc holds 2048 points and 2048 normals a body: a character of many round parts wants few `sides`
  (6 for a limb, 4 or 5 for a finger). The check says when it is over.

`examples/prompts/19-model-robot-player` and `20-model-skeleton-player` are two worked ones.

### A weapon in place of a game's

A weapon is a `held` model (built lying along +x, its grip at the low-x end) with `weapon: { like, views,
size, rig }`: the build fits it over the game's own weapon in each of its files, `v_<like>.mdl` (first
person, with the hands), `p_<like>.mdl` (in another player's hands) and `w_<like>.mdl` (lying in the world),
found in the game's `models` folder. Each keeps its hands, bones, animations, events and attachments; only
the weapon's meshes are replaced (the hands are told by their textures' names: gloves, sleeves, arms).
The files keep the game's names, so the game loads them in place of its own with no code (a weapon under a
new name needs the mod's code). They are written in `work:<name>_weapon/`.

- `like`: the game's weapon, as its files are named: `crowbar`, `357`, `rpg`, `tripmine`.
- `views`: `["v", "p", "w"]` unless told.
- `size`: `"old"` (unless told) stretches it to the old one's length; `"own"` keeps the length it was built at,
  its grip where the old grip was.
- `rig`: `"carry"` (unless told) hangs it all on the bone that carried the old one; `"nearest"` gives each
  corner the bone of the old one's nearest corner, so that a part over a slide or a drum moves with it.
- A part that moves names the game's bone it moves with: `"bone": "cylinder_spin"` (a revolver's drum),
  `"hammer"`, `"trigger"`. `smak info` on the game's `v_` file lists its bones. A file without that bone
  (the `p_` and `w_` ones have few) keeps the part on the bone that carried the old weapon.
- `turn`: where the fit cannot tell which way round the piece goes (a box, a can are the same outline every
  way), `"as drawn"`, `"x"`, `"y"` or `"z"`, or one a view (`{ "v": "as drawn" }`). Unless told, the one
  whose outline follows the old weapon's best. Draw it and look at which face the player sees.
- One picture: a weapon's parts share one texture, so leave out `neon`, `flame` and `glass` (each of those
  is a picture of its own).

The pictures: the game's first-person view beside the new one, the other views, and the attack as the
player sees it. `examples/prompts/22-weapon-wrench` is a worked one.

### Materials

`base` is one of: `wood`, `darkwood`, `planks`, `iron`, `steel`, `brass`, `gold`, `copper`, `leather`,
`cloth`, `rope`, `stone`, `brick`, `plaster`, `tile`, `metal`, `grass`, `dirt`, `glass`, `flame`, `neon`,
`hazard` (stripes of its tone and black), `asphalt`, `water`, `paint`, `bone`. `tone: [r, g, b]` (0 to 1)
changes its colour; `rust` (0 to 1) a metal's rust; `flags: ["fullbright"]` makes it shine in the dark
(`flame` and `neon` are so already; such parts get a texture of their own).

### The finish

Over its material, each part's picture is painted from the shape itself, unless the spec says `"finish":
false`:

- `light` (0.3): the room's light painted in, gently: faces that look up lighter, down darker, as smooth as
  the engine's shading. The engine lights a model softly and flatly; the form has to be in the picture.
- `wear` (0.5): sharp edges (a box's corners, a rim, an end: faces meeting at more than 65 degrees, not the
  facets of a round thing) rubbed lighter, broken up by noise in space.
- `grime` (0.5): dirt in the corner where a part meets another at least half its size in front of it (a
  barrel against a counter, a brim over a face), and on a `prop` near the floor.
- `vary` (0.08): each part a little lighter or darker than the next, so that ten boxes of one material are
  not one colour.

A character's are gentler unless told (`wear` 0.15, `grime` 0.3): cloth and skin do not rub bright. A part's
own `finish` (the same fields, or `false`) is over the spec's: a glass pane, a clean blade. Glowing and
see-through materials are left as they are.

### What the report says of a model

- `FAULT ... open edges ... the first at x y z`: a hole, or a shape left open (a turn with a cap `false`
  and no `lining`). Open edges buried inside another part (a band's feet) are no fault.
- `FAULT ... shared by three triangles or more`: faces given twice, or copies of a part that begin at one
  point.
- `FAULT ... turned the wrong way` / `... inside out`: faces that look inwards.
- `FAULT ... float apart`: a part that touches nothing; move it onto what it should sit on.
- `note ... nearly touch and do not`: two parts within 0.6 of each other, not touching. A row of things
  (teeth, nails) is so on purpose; a joint meant to close (a stock against its receiver, a guard against
  its frame) is open by a sliver, which no fault catches when each part touches something else. Look at
  each pair close (`focus`) and sink one into the other where they were meant to meet.
- `FAULT the pictures look through the model`: seen from outside, the inside shows somewhere.
- `FAULT height ... where the spec asks`: the size is not what was asked.
- `fact from the lowest part up`: each part's height from and to. A roof under a floor is a stack built
  upside down.
- Then `PARTS`: every part's triangles and its box in the model's space.

The pictures: six sides of it; with `focus`, those parts close from the front, the back and below (a light
under a housing shows only from below); with `reference`, the person's picture beside a view of it.

## A map

```json
{
  "spec": "smak.map/1",
  "name": "two_rooms",
  "theme": { "floor": "stone", "wall": "plaster", "ceiling": "planks" },
  "rooms": [
    { "id": "hall", "size": [320, 256, 160] },
    { "id": "study", "size": [256, 256, 128], "place": { "east_of": "hall" }, "floor": 16 }
  ],
  "links": [{ "between": ["hall", "study"], "kind": "door" }],
  "entities": [
    { "class": "info_player_start", "room": "hall", "at": "against west", "facing": "study" },
    { "class": "item_healthkit", "room": "study", "at": "corner ne" }
  ]
}
```

| Field | |
| --- | --- |
| `name` | The map's name: what is typed in the console (`map two_rooms`) |
| `theme` | `{ floor, wall, ceiling, door, furniture }`: materials for every room's rock, its doors and furniture. Made into a .wad of the map's own, or taken from a game's .wad (below) |
| `textures` | More named materials, for furniture, prefabs and rooms' surfaces: `{ "counter": { "base": "darkwood" } }` |
| `wall` | Rock between rooms (16). Rooms placed side by side have exactly this between them |
| `rooms` | Boxes of empty space, each placed against one before it |
| `links` | The ways from room to room |
| `entities` | What is in the rooms: the start, monsters, items, lights of your own |
| `furniture` | Brush furniture put in rooms: a box, or a prefab of `prefabs` |
| `prefabs` | `{ name: { pieces: [...] } }` or `{ name: { file: "table.map" } }`: brush furniture made once, put in many places |
| `models` | `{ name: <a model spec> }` or `{ name: { file } }`: models built with the map, for `props` |
| `props` | Models put in rooms: `{ model, room, at, facing, z }` |
| `include` | Other map specs taken in as modules (below) |
| `layout` | A drawing of the plan (below), in place of placing rooms by words |
| `wads` | A game's .wad files to take textures from: `["halflife.wad"]`, found by name in the game's folder |
| `fgd` | Entity definitions to hold the entities against, beside the server's own (`--fgd`) |
| `night` | true: a dark sky, a dim moon and the sky's own light far under it; the views draw the sky dark |
| `sky`, `sun` | The sky's name (`desert`) and the sun's `{ pitch, yaw, brightness, color }`, for rooms under the sky |
| `compile` | How the compilers run: `{ quality: "draft" \| "normal" \| "final", threads, light: { bounce, ao, extra, softShadows }, hulls: { large: false, crouch: false }, clipEconomy: true }`. Every program gets all the machine's threads unless told |
| `detail` | `false` keeps furniture in the world; unless told, furniture is `func_detail` (below) |

### Rooms

`{ id, size: [x, y, z], place: { east_of: "hall", align, gap }, floor }`:

- `place`: one of `east_of`, `west_of`, `north_of`, `south_of` (side by side, `wall` of rock between),
  `above`, `below` (stacked, the rock between is the floor of the upper; `gap` for its thickness). The
  first room needs none: it stands at the origin. `at: [x, y, z]` puts a room's least corner anywhere.
- `in`: inside another room, `offset: [x, y]` from its least corner, `floor` from its floor: the two are one
  space (a channel sunk in a tunnel's floor, a pool in a lab, a raised dais). It need not hold a player.
- `align`: `centre` (unless told), or `north`, `south` (for rooms east or west of each other), `east`,
  `west` (for rooms north or south): those sides even. A number: so many units from the other's least side.
- `floor`: its floor this much over the room it is placed against (under 0: lower).
- `sky: true`: open to the sky (a yard, a street). It is lit by the sun (or the moon), not by lamps.
- `surfaces: { floor: "grass", ceiling: "planks", walls: "tile" }`: a floor, a ceiling or walls of another
  material than the theme's (a lining 8 thick inside the rock).
- `water: 32` or `{ depth, material }`: water over its floor, swum in or waded; a `!` texture.
- `light`: `"auto"` (one lamp for each 256 x 256 of floor, hung no higher than 192 over it; unless told),
  `"none"`, or `{ count, brightness, color }`. A floor lit under 24 of 255 after the compile is a fault.
- `test: true`: a room only for trying a module alone (a stretch of street before a shop), left out when
  the module is included.

### Links

`{ between: [a, b], kind, width, height, along, sill, glass }`. The two rooms must be side by side (or
stacked) with the wall's rock between them, and the link goes through that rock:

- `opening` (unless told): a way through, 64 wide and 96 high unless told.
- `door`: the same with a door in it (a `func_door` that slides up; `door: { keys }` for more).
- `window`: 48 by 48, `sill` (40) over the higher floor. Nothing walks through a window. `glass: true` (or
  `{ alpha, health, material }`) glazes it: a `func_breakable` pane, half see-through, that shatters.
- `stairs`: for rooms stacked one above the other: a stair in the lower room up through a hole in the
  floor of the upper (the lower room needs `rise / 16 * 24 + 32` of length along x).
- Between rooms side by side whose floors differ by more than 18, any opening or door gets **stairs** in the
  lower room, up to the opening. The lower room must reach as high as the opening (its ceiling over the
  higher floor by the opening's height).
- `along`: where on the shared wall, 0 to 1 (0.5, the middle).

### Where things go in a room

`at`: `centre`, `corner ne` (`nw`, `se`, `sw`), `against north` (`south`, `east`, `west`), `near <room>` (by
the wall towards that room), `[dx, dy]` from the room's middle, or `{ beside: "<id>", side: "west", gap: 4 }`:
against the side of a thing put before it, by both their real footprints, lined up with its middle.
`facing`: `north`, `east`, `south`, `west`, degrees (0 east, 90 north), or a room's id (looking towards
it). `z`: over the floor. `id` names a thing for `beside` (an entity's `id` is also its `targetname`).

Furniture and props must stay in their room: one that reaches into a wall is a fault. A thing put
`against` a wall stands 48 from it; a prefab whose origin is its back (a shelf, a bed's headboard) is put at
the wall itself (`[dx, dy]` with `dx` half the room's length).

### Prefabs of brushes

```json
"prefabs": {
  "table": { "pieces": [
    { "box": [[-32, -20, 28], [32, 20, 32]], "texture": "furniture" },
    { "box": [[-28, -16, 0], [-24, -12, 28]], "texture": "furniture" }
  ] },
  "bar": { "file": "bar.map" }
}
```

A piece is `{ box: [min, max] }`, `{ wedge: [min, max], high: "+x" }` (a ramp) or `{ cylinder: { centre:
[x, y], radius, from, to, sides } }`, in units from the point on the floor where it is put, with a
`texture` that is a word of `theme`, `textures` or a base. A prefab may instead be a `.map` file (`file`),
as Hammer's are: its brushes and its entities (a candle's light) moved and turned as one; its textures
named `SM_` and a word of the spec's materials (`SM_FURNITURE`). `furniture: [{ prefab: "table", room:
"hall", at: "centre", rotate: 90 }]` puts one (turned by a multiple of 90). `entity: "func_breakable"` (or
`{ class, keys... }`) makes its brushes a brush entity: a crate that breaks (`material: 1`, wood), a
`func_wall`, a `func_illusionary`. Unless told, furniture is a `func_detail`: it cuts no portals, so a
furnished map is seen through by `hlvis` in hundredths of a second where it took minutes; it still stops a
player, and it seals nothing (it never has to: the rooms' rock does). `as: "world"` keeps a piece in the
world. The report carries the compilers' own chart of the engine's limits (`allocblock 3 of 64`,
`worldleaves`, `worldfaces`, `clipnodes`), and warns from three quarters of any.

### Modules

A module is a map spec of its own (a shop, a sewer), built, walked and scored alone, then taken into a
larger map, as Hammer's prefabs are:

```json
"include": [{ "spec": "../13-map-noodle-bar/spec.json", "as": "noodle", "place": { "north_of": "street", "align": 96 } }]
```

Its rooms, links, furniture, props and entities come in with their ids prefixed by `as` and an underscore
(`noodle_shop`); its first room is placed by the include's `place` (or `at`), the rest where the module
places them against it; its `test` rooms and its starts are left out; its materials, prefabs and models
come with it, and its rooms keep their own floors, ceilings and walls. The larger map links to it by the
prefixed ids: `{ "between": ["street", "noodle_shop"], "kind": "opening" }`. Make a module's first room
the one that meets the larger map, with the way in on the side the larger map will be.

### A game's textures

Name the game's .wad files in `wads` and give a material as a texture of them:

- `{ "texture": "C1A0_LABW4" }`: that one, by name.
- `{ "pick": { "words": ["labflr"], "tone": [0.6, 0.6, 0.55], "else": { "base": "plaster" } } }`: the
  best fit, by its name holding the words and by its average colour. The report says which it picked and
  the next three it weighed. Liquids, see-through and animated textures (`!`, `{`, `+`) are picked only when
  a word asks for them (`"!toxic"`).
- When nothing fits, that is a **gap**: the report says so, with the nearest, and the texture is made from
  `else` into the map's own .wad, which the map names beside the game's.

The `info` tool on a .wad lists its textures. A game's textures are its authors': a map built with them
names them and the game's .wad, and copies nothing (AGENTS.md, rule 7).

### Entities

Write every entity's class and keys from the game's FGD, never from memory: the tool `entities` lists the
classes (`match` narrows them), and `{ class }` gives one's keys with their types, defaults, choices and
flags by name ("2 Texture", "256 Instant Crowbar"). Every build holds the entities against the FGDs the
server was given: a class the game does not have, or a key its class does not take, is told.

### A drawing of the layout

A plan drawn in text: a character a cell (`cell` units, 64 unless told), the first row the northmost. The
key gives each character a room (a letter) or a prefab (`{ "prefab": "table", "rotate": 90 }`); `.` is
rock. A room's cells (and the marks inside it) must make a rectangle. Rooms drawn so take their height
from `size` (a number) and their floor from `floor`; links, entities and the rest are given as for any
map. Leave one row or column of `.` (one cell of rock) between rooms that are not meant to join.

```json
"layout": { "cell": 64, "rows": [
  "HHHHH.KKK",
  "HHtHH.KKK",
  "HHHHH.KKK"
], "key": { "H": "hall", "K": "kitchen", "t": { "prefab": "table" } } }
```

With a layout the `wall` is the gap the drawing leaves (one cell), so set `"wall": 64` (or the cell size).
When a person gives a drawing as a picture, read the rooms and their labels off it into rows like these,
and pass the picture as `reference`: it is then drawn beside the plan of the result, to be compared.

### What the report says of a map

- `FAULT ... leaks` (the plan's flood or the compiler): a way to the void. A spec carved in one piece does
  not leak; it comes from a link or a room placed wrongly.
- `FAULT walk: ... not reached on foot ...`, `... stand in something solid ...`, `... one-way ...`: the
  walk test's own sentences, each saying why (no way in, a step too high, a gap of 28 where 32 is wanted).
- `FAULT ... reaches N into <room>'s <side> wall`: furniture or a prop standing in a wall.
- `FAULT ... is dark`: a room whose floor is lit under 24 of 255 after the compile.
- `ERROR links[n]: ... not side by side`: the two rooms of a link do not share a wall.
- `fact <word>: picked ... / a GAP ...`: where each game texture came from.
- `CHANGED since the last build ...`: what this build changed from the one before of the same name.
- `ROOMS`: every room's box and the light on its floor.

The pictures: the plan of the result (every entity marked with its number and class; beside the person's
drawing when one is given); a view of every room from high in its south-west corner, looking down across
it, lit by the map's own light; the same three times as bright when the map is dark; a section through
every staircase; and a view at a man's height towards each room's props.
