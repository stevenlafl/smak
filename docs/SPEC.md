# Specs: a model or a map from a person's words

A spec is a description in plain JSON of a model, a map or a sound. The person says what they want, in words and
maybe a drawing; you, the agent, turn that into a spec; the tool `build` (or `buildModelSpec` and
`buildMapSpec` in a script) builds it, checks it and draws it. You write no code and no coordinates of
brushes or triangles: parts are placed by saying what they sit on, rooms by saying what they are next to.
Nothing in the kit reads the person's words itself.

```
build { spec: {...} }                        a model, a map, its textures or a sound, from the spec given
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
| `project` | The person's pictures of the thing laid onto it as its texture (below, "Pictures projected onto it") |
| `smooth` | The angle (degrees) under which faces are shaded as one surface: 40 unless told; a round part (turn, cylinder, sphere, tube of 5 sides or more) is shaded round across its own sides unless told, so 8 sides read round. A part may have its own. A tube of 4 meets itself at 90 degrees and is shaded flat, each face with normals of its own: a rib cost 104 normals for 44 points. Over its faces' angle (100 for 4 sides) it is shaded round with a normal a point: the engine holds 2048 normals a body |
| `contract` | `{ file }`: a model whose contract with a mod's code this one must keep: every bone, every animation at the same number with its activity, its attachments on the same bones, its bodyparts with as many bodies. A model built for a mod on another's skeleton (a player of The Specialists, whose code plays its dives and rolls by name) is checked against it; what it breaks is a FAULT. `smak contract <mdl> [--against ref.mdl]` shows one |
| `budget` | The most triangles the model may have: over it is a FAULT. Without one, a prop over 576 is warned of. The report lists the heaviest parts and the thin boxes that could be painted |

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

A `box` may carry words on a face: `"print": { "text": "NOODLES", "face": "front", "ink": [0.7, 0.1, 0.1],
"size": 0.6 }` (or a list of them), in plain capitals and digits as large as the face holds (`size`: the
share of its height), over its material. `face`: `front`, `back`, `left`, `right`, `top`.

Any part may be **painted, not built**: `"paint": true`. It is built and placed as any part, then baked into
the faces it sits on (within 1.5 units of them): their texels take its colour where a short ray out from them
meets it, its own faces' turn shading it so an edge still reads, and its triangles are left out. A strap, a
drawer's front, a vent's slats, a plate, a pull: whatever stands off a surface by less than it shows.

A box may carry painted **panels** on its faces: `"panels": [{ "face": "front", "at": [11, 29], "size":
[20, 17] }, { "face": "front", "at": [11, 32], "size": [5, 2], "shape": "round", "style": "raised",
"material": "chrome" }]`: a drawer's front, a door, a slot, a vent, a pull, a screen. `at` is the panel's middle
and `size` its width and height, in units from the face's bottom left as one facing it sees it; `shape` rect
(unless told), round (corners of `radius`) or ellipse; `style` inset (unless told: a gap, a recess), raised
(a plate, a pull) or flat (a painted patch); `edge` the bevel's width (0.4); `material` its own (the box's
unless told). The bevel is painted lit from the top left, so it reads as relief, and costs no triangle.
Later panels go over earlier ones.

A turned part (`turn`, `cylinder`, `sphere`, `tube`) may carry painted **marks**: `"marks": [{ "path": [[0.2,
130], [0.2, 230]], "width": 1.1, "material": "stripe", "ends": "point" }]`. A path is a ridge's (`s` 0 to 1
along the part, the angle in degrees round it; `[[0.5, 0], [0.5, 360]]` is a ring round it); `width` in
units; `material` a word of `materials` or a base (near-black unless told); `ends` `round` (unless told) or
`point`, or one of each. A mark is painted into the part's picture and follows it wherever it is placed.

**Shape or paint.** Build it (`ridge`, `band`, `boss`, a part of its own) when it changes the outline: it
stands off the surface by a unit or more on a thing a player's size, it is seen edge-on (a brim, an ear, a
collar), or it moves on a bone of its own. Paint it (`marks`, `print`, `panels`) when it lies on the
surface or stands off it by less than a unit: stripes, spots, a painted line, a seam, a label, a drawer's
front, a pull, a vent, a rivet seen from two steps away. A built ridge 0.3 high changes
nothing the engine's flat light shows, and costs triangles, normals (2048 a body) and a part that can come
apart. Holes in a thin sheet (a fence, a net, a grate) are a third way: a `mesh` material, see-through.

**How many sides.** A round part's sides show only in its outline: an n-sided ring strays from its circle by
`r * (1 - cos(180 / n))`. Take the fewest that keep that under half a unit on a prop (a quarter on what a
player holds): 8 for a radius of 6, 6 for a pipe seen only lengthways, more only for a wheel seen side-on.

**How many triangles.** Half-Life's own models, counted (the first frame of each, by kind):

| Kind | A quarter have under | Half under | Three quarters under |
| --- | --- | --- | --- |
| Pickup lying in the world (`w_`) | | 28 | 104 |
| Prop, plant, creature, person | 60 | 176 | 576 |
| Weapon in another player's hands (`p_`) | 88 | 142 | 187 |
| First-person weapon with its arms (`v_`) | 523 | 615 | 832 |

A crate there is 26 triangles, its planks and bands painted on; a can, 28; a large monster, 500 to 1,000.
Build to that: the shape in triangles, the detail in the picture.

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
- Bones may be named in English or as the base names them. 3ds Max's Biped names its bones in the language
  it ran in: The Specialists' own player (`player/gordon/gordon.mdl` of the `ts` folder, every stunt in
  it) says `Bip01 Testa`, `Bip01 SX Mano`, `Bip01 Dorso1`, `Bip01 Dito mano DX0` where Half-Life's says
  `Bip01 Head`, `Bip01 L Hand`, `Bip01 Spine1`, `Bip01 R Finger0`, and Half-Life's older limbs (`Bip01 L
  Arm1`, the upper arm) are the newer `UpperArm`. A name is turned into the base's own (the report notes it).
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
- `animations`: animations of its own in place of the game's, in the first-person file, where the game's
  do not fit what it is (a broom sweeps where a crowbar chops):
  `[{ "replace": "attack1", "from": "idle1", "frames": 11, "fps": 22, "keys": [{ "at": 0 }, { "at": 3,
  "turn": { "Bip01 R Arm1": { "y": 40, "z": -20 } }, "ease": "out" }, ...] }]`. Each takes the place of
  the game's animation of that name, so its number stays and the game's code plays it; the keys turn bones
  about the model's axes (+x forward, +y left, +z up, from the eye) as they stand in the `from` frame, and
  the frames between are eased. Keep its length: the game times its hits by it, and the report warns past a
  quarter off. Its events stay as they were. A key may say where the weapon is to be on the screen
  instead of how to turn: `"aim": [across, up]`, shares of the distance ahead from the eye (`[0.45, -0.35]`
  low on the right), and the build finds the turns of the arm and the hand (`bones`, the right arm's unless
  told) that put the weapon's far end there, and says them. Draw it (the build shows the first attack).
- `sounds`: `[{ "spec": <a sound spec>, "event": { "sequence": "reload", "frame": 70 } }]`: its sounds (see
  "A sound"), written under `sound/` with its files. Most of a weapon's sounds are played by the game's code
  under fixed names (the crowbar's hit is `weapons/cbar_hit1.wav`, the .357's shot `weapons/357_shot1.wav`):
  give the sound that name and the game plays it. One an animation plays (a reload's clicks) takes `event`:
  the build writes event 5004 at that frame of the first-person file with the sound's path, keeping the
  others, and warns when the sound runs on past the animation.
- One picture: a weapon's parts share one texture, so leave out `neon`, `flame` and `glass` (each of those
  is a picture of its own).

The pictures: the game's first-person view beside the new one, the other views, and the attack as the
player sees it. `examples/prompts/22-weapon-wrench` is a worked one.

### Materials

`base` is one of: `wood`, `darkwood`, `planks`, `iron`, `steel`, `brass`, `gold`, `copper`, `leather`,
`cloth`, `rope`, `stone`, `brick`, `plaster`, `tile`, `metal`, `grass`, `dirt`, `glass`, `flame`, `neon`,
`hazard` (stripes of its tone and black), `asphalt`, `water`, `paint`, `bone`, `mesh` (a net, a wire fence,
a grille: cords in its tone with holes between, seen through as in the game; `cell` the holes' size, 2;
`weave: "diamond"` runs the cords on the diagonals, as chain-link's do). `tone: [r, g, b]` (0 to 1)
changes its colour, or words: `"tone": "dark warm grey"` (the XKCD colour survey's 949 names, with `dark`,
`light`, `pale`, `muted`, `bright`, `deep`, `warm`, `cool`, `grimy` and `-ish`). A colour read off a picture is
lighter or darker than its paint by the picture's light: give it as `seen` (`"seen": [0.4, 0.38, 0.35]` or
words) and the build takes the paint as the colour over the pictures' light (0.8); read off a view of a map,
give the light the preview reports for that face as well (`"seen": { "colour": [0.4, 0.3, 0.2], "light": [1.1,
1.05, 0.9] }`), and the paint is the colour over it, channel by channel. A pattern's size, in texels of its
picture (made to divide it, so that it tiles): `cell` a `tile`'s or a `metal` panel's (32, or `[w, h]`),
`course` and `length` a `brick`'s (16 and 32), `board` a plank's width (16), `stripe` and `angle` a `hazard`'s
stripe width and slant (1.06 at 45 degrees). `rust` (0 to 1) a metal's rust; `flags: ["fullbright"]` makes it shine in the dark
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

### Pictures projected onto it

When the person gives pictures of the thing taken straight on (a front, a side, a top: drawn, rendered or
photographed), they can be its texture, as they are, on the shape you built:

```json
"project": [
  { "picture": "work:pictures/front.png", "view": "front" },
  { "picture": "work:pictures/sides.png", "view": "left", "area": [512, 0, 1024, 512] },
  { "picture": "work:pictures/quarter.png", "yaw": 35, "pitch": 20 }
]
```

- `view`: `front`, `left`, `back`, `right`, `top` or `below`, or `yaw` and `pitch` in degrees as `render`
  takes them (yaw 0 looks at the front, 90 at the left side; pitch 90 looks down). The picture must look that
  way with no perspective (or very little: a photo from far off).
- `area`: the part of the picture to look in, `[x0, y0, x1, y1]` in pixels (one view of a sheet of several).
- `rect`: where the thing's outline is in the picture. Found unless told: the largest patch that is not the
  background (its border's colour, or the see-through dots of a cut-out), with every patch a hundredth its size
  or more, leaving out a caption in the area's top left corner. The report says what it found.
- `parts`: only these parts take it.

Each texel takes the colour of the pictures that see it, weighted by how squarely each does, where nothing of
the model hides it from that view; a texel no picture sees keeps its material. The picture's own light comes
with it, so the finish is not painted over what it covers. The shape decides how well it fits: the outline in
each view must match the picture's, faces should be square to the views (an eight-sided column with flats to
the front, not a corner), and a part the pictures show stands where they show it.

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

## A sound

A sound, or a set of them, made from layers into GoldSrc's own files (mono PCM, 22050 Hz 16-bit unless
told), checked as the engine needs them, and measured against the game's own sounds of its kind.

```json
{
  "spec": "smak.sound/1",
  "name": "weapons/cbar_hit1.wav",
  "class": "metal hit",
  "seed": 3,
  "layers": [
    { "id": "click", "kind": "noise", "filter": [{ "type": "highpass", "f": 1500 }], "env": { "decay": 0.012 }, "gain": -2 },
    { "id": "ring", "kind": "modes", "f": 760, "ratios": "bar", "decay": 0.7, "damping": 1.2 }
  ],
  "finish": { "saturate": 1.5, "room": { "decay": 0.35, "wet": 0.15 } },
  "variants": [{ "name": "weapons/cbar_hit2.wav", "seed": 4, "pitch": 3 }]
}
```

| Field | |
| --- | --- |
| `name` | Its path under `sound/`, lower case, `.wav`. A sound the game's code plays keeps the game's name (the crowbar's hit is `weapons/cbar_hit1.wav`): that name is the one the game loads, with no code |
| `class` | What it is held against: `metal hit`, `flesh hit`, `swing`, `gunshot`, `reload`, `click`, `pump`, `shell`, `launcher`, `grenade cock`, `grenade bounce`, `explosion`, `step concrete`, `step metal`, `step dirt`, `step tile`, `step grate`, `step vent`, `loop drips`, `loop crickets`, `loop machine`, `loop drone`, `loop fire` |
| `rate`, `bits` | 22050 and 16 unless told; 11025, 44100 and 8 too. Never stereo: GoldSrc plays mono only |
| `seed` | Every random choice: the same spec makes the same bytes |
| `length`, `pitch` | Seconds (unless told, the longest layer's end); a pitch in percent |
| `layers` | Each `{ id, kind, at (s), length (s), gain (dB), env, filter }` (below) |
| `finish` | `room: { decay, wet, tone }` (keep it short: the map's `env_sound` adds the room), then `saturate` (a drive, 1 to 8: what makes a shot loud, its room's tail squashed up to its blast), `peak` (dBFS, -0.5) |
| `loop` | `true` or `{ crossfade }`: a cue point at its start, its seam crossfaded; the engine loops it |
| `variants` | More files from the same layers: `{ name, seed, pitch, gain }` (`cbar_hit2`, `pl_step1` to `4`) |
| `reference` | The game's files to draw beside it (unless told, the first of its class), read from the game folders the server was given and never copied |
| `sounds` | A set: a list of sounds, the spec's other fields their defaults |

The kinds of layer:

| kind | fields | what it is |
| --- | --- | --- |
| `noise` | `color`: `white`, `pink`, `brown` | a hiss, a whoosh, a blast, a scrape: shaped by its filters |
| `tone` | `f`, `wave` (`sine`, `square`, `saw`, `triangle`), `sweep: { to, time }` | a boom that falls (`f` 140, `to` 45), a beep |
| `fm` | `f`, `ratio`, `index`, `indexDecay` | a bell, a metallic ring, a machine |
| `modes` | `f` and `ratios` (`bar`, `clamped`, `plate`, `bell`, `tube`, or a list), `gains`, `decay` (s to -60 dB), `damping`, `detune`; or `modes: [{ f, gain, decay }]` | a struck thing ringing: a wrench, a bell, a casing, a plate |
| `particles` | `count` or `rate` (a second), `band: [lo, hi]` Hz, `grain` (s) | gravel, a rattle, debris, crackle |

`env`: `{ attack, hold, decay }` in seconds (`decay` to -60 dB), `{ shape: "bell", decay }` (a swell up and
down, a swing's whoosh), or `points: [[t, dB], ...]`. `filter`: a list of `{ type: lowpass | highpass |
bandpass | peak | notch, f, q, gain, sweep: { to, time } }`. A layer's `at` puts it later: a pump is two
clacks 0.2 apart, a step a heel and a toe.

What the report says of a sound: each file's rate, length, peak, RMS and crest; its attack, T20 and T40
(seconds to -20 and -40 dB), centroid (Hz: bright or dark), flatness (0 a pure tone, 1 white noise),
onsets, and its power in five bands; then, with a `class`, how many of its features are in the range of
the game's own of that kind, and each one off in words with which way to go (`centroid 881 Hz (1074 to
1654): too dark: more 600 to 5000 Hz`). `FAULT`s are what the engine would do wrong: clipping, an offset,
silence before it starts (it plays late), an end that clicks, a loop with no cue or a seam that jumps. The
picture is each file's waveform over its spectrogram (log frequency, 50 Hz at the bottom), the game's own
of its kind under them at the same time scale. What it cannot say is how it sounds, or how the game plays
it (its volume, its pitch, the map's room): say so, and the person listens in the game.

## Textures for maps (a .wad)

```json
{
  "spec": "smak.wad/1",
  "name": "lab.wad",
  "materials": { "panel": { "base": "metal", "tone": [0.55, 0.57, 0.6] } },
  "textures": [
    { "name": "lab_wall1", "size": [128, 128], "material": "panel", "grime": 0.5,
      "panels": [{ "at": [64, 96], "size": [112, 48], "edge": 2 }, { "at": [64, 30], "size": [112, 40], "style": "raised" }],
      "print": { "text": "B-12", "size": 0.12, "ink": [0.8, 0.6, 0.1] } },
    { "name": "{lab_grate", "size": [64, 64], "material": { "base": "mesh", "cell": 8 } }
  ],
  "preview": { "map": "models:lab.bsp", "views": 6 }
}
```

Each texture is a material laid seamlessly (one texel a unit, as a map draws it), with `panels` and `print`
as a box face has them (in texels from the bottom left) and `grime` (0 to 1) gathered toward its foot. `wear`
makes it a used surface and not a fill: `{ "stains": 0.6, "streaks": 0.5, "cracks": 0.4, "scratches": 0.3,
"speckle": 0.8 }`, each 0 to 1 (`seed` another pattern), every layer tiling with the texture. `relief` raises
machinery over it, lit from the top left with the dark of a recess round what stands out, each part in texels
from the bottom left with a `material` of its own where it has one: `{ "kind": "pipe", "path": [[0, 100],
[128, 100]], "radius": 6 }` (bends where the path turns), `bars` (`at`, `size`, `count`, `width`, `axis`: a
grille over a dark hole), `louvre` (`at`, `size`, `count`), `rivets` (`from`, `to`, `count`, `radius`), `seam`
(`from`, `to`, `width`, `notched`: a groove) and `lamp` (`at`, `size`, `colour`: a lamp's face bright in its
middle; name the texture with `~` and light it with the map's texture lights). A game's concrete
has a texel's own grain all over it (`speckle`) and blotches (`stains`); its machinery, streaks and scratches.
A plain fill reads as flat beside it. A name
is one word of 15 letters at most and its first letters mean what a map's do (`{` holes, `!` a liquid, `+0` an
animation's first frame, `-0` the first of random tiles); sides are multiples of 16, 512 at most. The build
writes the .wad and a sheet of its textures. With `preview.map`, a compiled map of the models or work folder is
drawn wearing them: textures of the same names stand in for the game's, the way a mod replaces a game's look,
and the report names the textures the map wears that the .wad does not have. With `preview.each: true` as well,
each texture is drawn on its own place in the map, its largest face lit in every colour, from the camera and at
the brightness (4.5) a reproduction test's judge looks from: set it beside a picture of the original's place.
For each, the report says how many texels the view spans across (its scale), how far the picture's top is
turned from up or north on that face (the map may turn it), and the light on the face, `[r, g, b]`, which a
colour read off such a view is the paint times. A texture the map keeps inside itself is the one the game
wears; the report says so. `render` takes `wad` to draw any map wearing one.

## A sprite

A sprite (`.spr`): the flat picture the game turns to the eye, a torch's flame, a glow, an explosion, sparks,
a beam. Made of layers of effects by rule, quantised to the one palette its format needs, written, read back,
measured against Half-Life's own of its kind, and drawn as a sheet of its frames and an animated picture.

```json
{
  "spec": "smak.sprite/1",
  "sprites": [
    { "name": "sprites/torch.spr", "class": "fire loop", "size": [32, 64], "frames": 16, "loop": true, "fps": 10,
      "origin": "bottom", "layers": [{ "kind": "fire" }, { "kind": "glow", "at": [0, -0.3], "radius": 0.6, "gain": 0.3 }] },
    { "name": "sprites/blast.spr", "class": "explosion", "use": "tempent", "size": [64, 64], "frames": 16,
      "layers": [{ "kind": "explosion", "env": { "attack": 0.05 } }] }
  ]
}
```

| Field | |
| --- | --- |
| `name` | Its path under the mod, `sprites/...spr`. A sprite the game loads by name keeps that name to replace it |
| `use` | `env_sprite` (unless told), `env_glow`, `tempent` (a muzzle flash, an explosion), `beam`, `hud`. A beam may be lit to its ends (it tiles along its length); anything else keeps its border dark |
| `class` | What it is held against: `explosion`, `fire loop`, `smoke loop`, `smoke puff`, `sparks`, `glow`, `flare`, `ring`, `beam` |
| `size` | `[w, h]`, multiples of 8, 256 at most to be drawn as made (512 at most) |
| `frames`, `loop`, `fps` | A loop of `frames` is written with its first frame again at the end, as the engine wraps; an `env_sprite` changes frame at most 10 times a second |
| `type`, `format` | `parallel` (unless told: faces the camera), `upright`, `facing upright`, `oriented`, `parallel oriented`; `additive` (unless told: black is clear), `index alpha` (coverage, tinted by `colour`), `alpha test` (holes), `normal` |
| `origin` | `centre` (unless told), `bottom` (a flame on its base), or `[x, y]` pixels |
| `layers` | Each `{ kind, gain, env: { attack, decay }, ... }`, summed: the kinds below. Coordinates run -1 to 1 across the longer side; `v` is up |
| `finish` | `edge`: pixels faded at the border (2) |
| `reference` | A contact sheet of the sprite this one reproduces (the picture given as input), `"pictures/frames.png"` or `{ picture, cell, cols }` as it was drawn (128 and 8): the report measures this sprite against it. Measures only: nothing of it goes into a frame |

| Layer | Its own fields |
| --- | --- |
| `glow` | `radius`, `core`, `colour`, `at`; `falloff`: `smooth` (unless told: cut to nothing between 0.55 and 1 of `radius`) or `power` (`1 / (1 + (r / core)^power)`, `power` 2, eased to nothing only at `reach`, 1.5: past a square frame's corner, so a lens's glow fills its frame) |
| `flare` | `core`, `colour`, `at`, `streaks: [{ angle, length, width, half, gain, taper, blur, haze }]` (`half`: out from the core along `angle` only); for every streak unless it says, `taper` (that many times its width wider toward its middle: a wedge), `blur` (a Gaussian across, the light spread and not lost), `haze` (a faint glow four times as wide under the arm); `rays: { count (48), length (0.9), jitter (0.5), width (0.012), gain (0.5) }`: many thin half streaks round it of seeded lengths, a lens flare's fine rays |
| `fire` | `ramp`, `width`, `rise`, `turbulence`, `height`; `taper` (0.65: how much narrower at its top; 0 no cone), `tongues` (0 to 1: noise four times as tall as wide, rising with the flame and cut at a level that climbs with height, so it parts into licks with dark between) |
| `smoke` | `density`, `spread`, `colour`, `rise` |
| `explosion` | `ramp`, `growth`, `cool`, `turbulence`: a ball, unlit |
| `billow` | A lit cloud: `count` (24) spheres in a disc of `spread` (0.5) about `at`, each `size` (0.3) or so, carried out as it grows (`growth`), rising (`rise` 0.25) and drifting (`drift` 0.12); their front joined smoothly (`blend` 0.4; 0 a crease), its edge lumpy (`lumps` 0.4), lit from the top left (`light`), coloured by heat times light through `ramp` (`blast`), a white middle early (`hot`: 0.4 of its life), cooling (`cool`); `dissolve` (0.7) breaks it into wisps as it ages; `debris: { count, speed, gravity, trail }` throws flecks. Under `index alpha` its light is in its coverage (a puff keeps its shading) |
| `blobs` | `count` (9) soft discs placed afresh every frame round a core (`radius` 0.32, `spread` 0.6, `core` 0.4, `soft` 0.5): sparks' flicker, nothing to follow from frame to frame |
| `sparks` | `count`, `speed`, `gravity`, `trail`, `colour` |
| `ring` | `from`, `to`, `width`, `colour` |
| `beam` | `core`, `noise`, `colour`; `profile`: `round` (unless told) or `flat` (full across `core` of the width, then soft shoulders `shoulder`, 0.3, wide); `streaks` (0 to 1: mottling that changes across the beam and hardly along it, still tiling end to end) |

`ramp` (on `fire`, `explosion` and `billow`; on `glow`, `flare`, `beam` and `blobs` it colours the light by its
own brightness, a white middle to a dark rim, in place of `colour`): `fire`, `blue`, `green`, `blast` (white,
cream, tan, brown: an explosion's smoke) and `muzzle` (white, peach, tan), or a list of `[heat, [r, g, b]]`
stops. `blast` and `muzzle` are the mean colours of Half-Life's own explosion and muzzle flash at each tenth of
brightness.

The report gives each sprite's colours, the border's light, how it starts and ends, how smoothly a loop wraps
and how much it flickers, each against Half-Life's own of its class, and the render mode to place it with.
With a `reference`, it gives the judge's measures of both, each read off a sheet of the same drawing: mean
colour (delta E; 15 or under is near), the share that is dark (within 0.05 is near), the border's light and the
frame count, with a note for each that is off.
FAULTs: a loop that jumps at its wrap, a one-shot that does not end dark, light at the border.

## A video

A video of the kit's models and maps, for sharing: shots one after another, each a camera move drawn frame by
frame and checked for smoothness, previewed as a contact sheet before it is made.

```json
{
  "spec": "smak.video/1",
  "name": "showcase",
  "size": [960, 540], "fps": 30,
  "shots": [
    { "kind": "title", "seconds": 2, "text": "LAMP POST" },
    { "kind": "turntable", "model": "lamp.mdl", "seconds": 6, "pitch": 10, "caption": "lamp, 210 triangles" },
    { "kind": "flyover", "map": "square.bsp", "seconds": 8, "height": 600, "turns": 0.5 },
    { "kind": "walk", "map": "square.bsp", "from": "info_player_start", "to": "weapon_shotgun", "speed": 200 }
  ]
}
```

| kind | what it draws | fields |
| --- | --- | --- |
| `title` | words on a plain ground | `text`, `seconds` |
| `turntable` | the model turning on the spot, at one scale over the shot | `model`, `seq` (played as it turns), `turns` (1), `from` (20), `pitch`, `zoom`, `body`, `skin` |
| `sheet` | the six-sided sheet, playing an animation | `model`, `seq` |
| `animations` | animations one after another, from one camera | `model`, `seqs`, `each` (seconds), `view` (`side` with `ground`) |
| `flyover` | the map from above, circling its middle | `map`, `height` (400), `turns` (0.5), `from`, `fov` |
| `walk` | through the map at a player's eye, along the walk test's way | `map`, `from` and `to` (entities by class, name or number), `speed` (160), `eye` (64) |
| `path` | a camera along keys, eased at its ends | `map`, `keys: [{ t, at, look ([x, y, z] or ahead), fov }]` |

Every shot takes `seconds` (unless its path says), `caption`, and for a map `brightness`, `fov`, `entities`.
`build` gives a contact sheet of four frames a shot unless told `preview: false`; then it draws every frame,
tells each shot's change from frame to frame (a FAULT for a frame that jumps, or an eye in a wall) and writes
`work:<name>.mp4` (H.264, through ffmpeg) or a GIF (`format: "gif"`, or when there is no ffmpeg). On the
command line: `smak video spec.json -o folder [--preview] [--models folder]`.

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
| `sounds` | `[{ spec, room, at, z, volume, radius }]`: sounds made with the map (`spec`: a sound spec, or `{ file }`) and played where they are put by an `ambient_generic`: `volume` 1 to 10, `radius` `everywhere`, `small`, `medium` or `large`; looped when the sound loops (a hum, a fire), once otherwise. The files go under `sound/` beside the map, for `<mod>/sound` |

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
  `"none"`, or `{ count, brightness, color }`. A floor lit under 24 of 255 after the compile is a fault, unless
  the room says `dark: true` (meant so: a cellar, a dim corridor, a copy of a map that is dark there).
- `test: true`: a room only for trying a module alone (a stretch of street before a shop), left out when
  the module is included.

### Buildings that stand in the open

A room carved out of rock is a hole: from a street it is a wall with a door in it. A house, a shop or a shed
that stands in a yard, with its own walls and a roof, is a **building**: its first room is placed `in` an
open room with `stand: true`, and the rooms placed against that one (`east_of`, `above`...) are of it too.

```json
{ "id": "living", "size": [320, 256, 112], "floor": 8, "place": { "in": "yard", "offset": [256, 256], "stand": true },
  "building": { "walls": "outside", "roof": { "material": "roof", "pitch": 30, "overhang": 12 } } },
{ "id": "kitchen", "size": [192, 256, 112], "place": { "east_of": "living" } }
```

- Its shell is `wall` thick out from each room's face, from the open room's floor to over its top room, of
  `building.walls` outside (the theme's `outside`, siding unless told) and its rooms' own surfaces inside.
- Its roof is a gable over its longer side (`roof: { material, pitch, overhang }`, the theme's `roof`,
  shingles unless told), or flat with `roof: false`. The open room's sky must clear the ridge.
- A way out is a link between a room of it and the open room round it, with `side`: the wall it goes
  through (`"south"`). A door, a window and glass are as between rooms. Keep its floor within a step (18)
  of the open room's.
- A storey over it is a room `above` one of its rooms, with stairs as between any stacked rooms.
- `siding` (clapboards) and `shingles` are materials of their own, for its outside and its roof. A theme
  word may name one of the spec's `textures` (`"outside": "siding_blue"`).
- Furniture and props in the open room must stand clear of it: one inside its walls is a fault.
- The pictures add each building seen from the corner of its open room on the side of its front door.

### Links

`{ between: [a, b], kind, width, height, along, sill, glass }`. The two rooms must be side by side (or
stacked) with the wall's rock between them, and the link goes through that rock:

- `opening` (unless told): a way through, 64 wide and 96 high unless told.
- `door`: the same with a door in it (a `func_door` that slides up; `door: { keys }` for more; `material`
  for its own, the theme's `door` unless told).
- `window`: 48 by 48, `sill` (40) over the higher floor. Nothing walks through a window. `glass: true` (or
  `{ alpha, health, material }`) glazes it: a `func_breakable` pane, half see-through, that shatters.
- `stairs`: for rooms stacked one above the other: a stair in the lower room up through a hole in the
  floor of the upper (the lower room needs `rise / 16 * 24 + 32` of length along x). It climbs along x
  against the south wall, or with `along: 1` the north (between, a share): keep it clear of a doorway.
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

A piece is `{ box: [min, max] }`, `{ wedge: [min, max], high: "+x" }` (a ramp), `{ cylinder: { centre:
[x, y], radius, from, to, sides } }` or `{ prism: { outline: [[x, y], ...], from, to } }` (a convex outline
stood up: a corner cut at 45 degrees, an octagon's wall, a slanted pillar's foot; put in the world with
`as: "world"` it shapes the room itself), in units from the point on the floor where it is put, with a
`texture` that is a word of `theme`, `textures` or a base. A prefab may instead be a `.map` file (`file`),
as Hammer's are: its brushes and its entities (a candle's light) moved and turned as one; its textures
named `SM_` and a word of the spec's materials (`SM_FURNITURE`). `furniture: [{ prefab: "table", room:
"hall", at: "centre", rotate: 90 }]` puts one (turned by a multiple of 90). `entity: "func_breakable"` (or
`{ class, keys... }`) makes its brushes a brush entity: a crate that breaks (`material: 1`, wood), a
`func_wall`, a `func_illusionary`. Furniture wearing a `mesh` (a chain-link fence: a box 2 thick in
`{ "base": "mesh", "cell": 6, "weave": "diamond" }`) or a game's `{` texture is a `func_wall` in render mode
4 unless told, the only way the game draws its holes; its texture is named with `{` (`{SM_CHAIN_LINK`).
Unless told, other furniture is a `func_detail`: it cuts no portals, so a
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

### The same map, changed everywhere: `replace`

`"replace": { "textures": { "lawn": { "base": "snow" } }, "models": { "tree_summer": "tree_winter" } }`
swaps every texture (and theme word) of that name, and every prop of that model, in the map and in every
module it takes in (`ranch_lawn`, `park_tree_summer`): the same town in winter, every tree bare. A model put
in place of another is one of the spec's own `models`. The report says what each replaced, and the change
report tells a thing swapped where it stood as one (`things swapped where they stood: ...`). The seasons
of `examples/prompts/35-map-neighbourhood` are worked ones.

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
every staircase; a view at a man's height towards each room's props; and every model the map builds, one
by one and named, close enough to judge.
