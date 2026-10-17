# Specs: a model or a map from a person's words

A spec is a description in plain JSON of a model, a map, a sound or a music track. The person says what they want, in words and
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
6. **Given pictures of the thing** (its sides, some angles), let the pictures do what they can measure: a
   `carved` part takes its outline from them at once (then paint it); a character's `pose: { fit: true }` and
   `motion` take its stance and its run from them; a map's `.wad` textures are found by the `info` tool's
   `like` and `rect`. Build the rest by hand: what an outline cannot show (a hollow, a handle's hole, a face).
7. **The person asks for a change** ("looks good, now add a fridge next to the cabinet"): change the spec
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
| `base` | For a character: `{ file }`, the game's model whose skeleton and animations it keeps, looked for beside the spec and then in the game folders. A spec that takes the model's place under its own name (`headcrab.mdl` on `headcrab.mdl`) reads the game's, not its own last build; the same holds for `contract` |
| `weapon` | For a weapon: `{ like: "crowbar" }`, the game's weapon whose v_, p_ and w_ files it takes the place of (below) |
| `size` | What the person asked for: `{ height, length, width }` (any of them). Off by more than 10% is warned of, more than 25% is a fault |
| `texture` | `{ width, height }` of the shared picture (256 x 256 unless told, 512 x 512 when it projects pictures; 512 x 256 for a larger thing) |
| `materials` | Names for materials the parts share: `{ "oak": { "base": "wood", "tone": [r, g, b] } }`. A part may also name a base itself (`"material": "iron"`) |
| `parts` | The parts, each placed on one listed above it |
| `prefabs` | `{ name: <another model spec> }`, for parts of kind `prefab` |
| `allow` | `{ open: [ids], floating: [ids] }`: parts open or apart on purpose (a part can say `open: true` or `loose: true` itself) |
| `finish` | What a painter adds over the materials, read from the shape (below): `{ light, wear, grime, vary }`, each 0 to 1, or `false` for none. A part may have its own |
| `project` | The person's pictures of the thing laid onto it as its texture (below, "Pictures projected onto it") |
| `smooth` | The angle (degrees) under which faces are shaded as one surface: 40 unless told; a round part (turn, cylinder, sphere, tube of 5 sides or more) is shaded round across its own sides unless told, so 8 sides read round. A part may have its own. A tube of 4 meets itself at 90 degrees and is shaded flat, each face with normals of its own: a rib cost 104 normals for 44 points. Over its faces' angle (100 for 4 sides) it is shaded round with a normal a point: the engine holds 2048 normals a body |
| `contract` | `{ file }`: a model whose contract with a mod's code this one must keep: every bone, every animation at the same number with its activity, its attachments on the same bones, its bodyparts with as many bodies. A model built for a mod on another's skeleton (a player of The Specialists, whose code plays its dives and rolls by name) is checked against it; what it breaks is a FAULT. `smak contract <mdl> [--against ref.mdl]` shows one |
| `budget` | The most triangles the model may have: over it is a FAULT. Without one, a prop over 576 is warned of. The report lists the heaviest parts and the thin boxes that could be painted |
| `layout` | `"regions"`: the picture laid as Valve lays its own (research/valve-uv.md): each part, and on a skeleton each region of the body it covers by its bones (the head at twice the texels, the chest, the hips, the legs, the feet, the arms, the hands), seen flat from the front and the back, a side only for faces that look nearly square to it, from above and below for faces that look up or down; each such picture every face of it, connected or not (both legs' fronts on one), and a right part or limb that is its left's mirror on the left's pixels. What the materials painted is carried over point for point. Every triangle then lies on a flat projection (a robot of boxes 100 in 100, against 31 for the charts each part has unless told; a generated guard 88 against 32), so a front and a back picture land on it near one to one. Use it for a body painted from pictures of its front and back, and for a thing made of boxes; leave it out (each part laid in its own zone, `parts`) where a part's own charts pack its picture tighter (61 against 46 in 100 of the robot's sheet in use) |
| `palette` | `"own"`: a character's projected pictures keep their colour. Unless told, they are pulled to its base's palette (below, "Pictures projected onto it") |
| `fidelity` | `"game"` (unless told): held to Half-Life's own of its kind and size, warned past them. `"high"`: a person's own model made to look its best: the larger picture (512 x 512) unless `texture` says, and its triangles against Half-Life's told as a fact, not warned. Use it only when the person asks for detail over the game's budget; a `budget` still binds |

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
| `carved` | `size: [x, y, z]` (the thing's size: its outlines are stretched to it), `sheet` (a picture of six sides laid as the kit's sheets are: front, left, back; right, top, below), `pictures` (more views: `[{ picture, view or yaw and pitch, area, rect }]`, the three-quarter ones), `cells` (64 on its longest side; more for thin parts), `triangles` (what it is reduced to: leave it out, and it is what three quarters of Half-Life's props of its size have under them; a copy over twice its original's count fails), `symmetric` (below), `layout` (`charts` unless told: its picture laid out in regions by the side that sees each best, packed to fill its zone; `sides`: six patches, one a side, which share texels and speckle), `clip` (a height in its own space under which the carve is left out: a coat carved to its hem, the legs under it built as parts of their own) | a shape carved from the outlines of pictures of the thing (a visual hull), centred on x and y, from z 0 up: every outline right at once, which parts built one by one rarely get. A hollow no picture sees into is filled; a part thinner than a cell is lost. Paint it with `project`, and give the spec `smooth: 80` so its normals fit |
| `blob` | `pieces`: each `{ span: [bone, bone], radius }` (a limb from joint to joint, `radius` a number or `[start, end]`), `{ at: bone or [x, y, z], radius }` (round a joint or a point: a number, or `[x, y, z]` for an egg) or `{ from: [x, y, z], to: [x, y, z], radius }`, each with `offset` and `bone` if it likes; `blend` (3: the units over which pieces melt into each other, 0 a plain union), `cells` (64), `triangles`, `symmetric` (give one side's limbs: each piece is copied to the other side's bones, or through y 0) | one smooth surface over many pieces: a torso running into its shoulders, a coat into its hem, a creature's body into its legs, with no seam between them. On a base each corner hangs on the bone of the piece nearest it, so the body bends at its joints. Placed by its pieces (no `attach`, `at`, `rotate`); laid out and painted as `carved` is, by its material and `project` |
| `mesh` | `file` (an `.obj` of the work folder: a shape the tool `generate` made, or any), `size: [x, y, z]` (it is stretched to it: give its own proportions, which the report says), `triangles` (what it is reduced to: unless told, what three quarters of Half-Life's props of its size have under them), `up` (`y` unless told, an .obj's own way; `z`), `turn` (degrees about the upright, when its front is not towards +x), `symmetric` (below), `layout` (as `carved`'s) | a shape made elsewhere, centred on x and y, from z 0 up, laid out and painted as `carved` is: by its material and the finish, or by `project` from the picture it was made from (generate's `_cut.png`, its subject cut out, so that its outline is found). Faces wound inwards on the whole are turned round. A generator guesses what its picture does not show: look at every side |
| `superquadric` | `size: [x, y, z]`, `round: [up, round]` (each 0.05 to 2: 0.1 a box with its corners eased, 0.3 a rounded block, 1 an egg or a ball, 2 a diamond; 0.3, 0.3 unless told), `sides` (16) | centred on x and y, from z 0 up to z: a boot, a fist, a helmet's shell, a padded block, in one part |
| `turn` | `rings: [[s, r], ...]` (s along the axis, growing; r its radius, `[ra, rb]` an oval, 0 makes a point; `{ s, r, crease: true }` a hard edge, `{ s, r, off: [a, b] }` its middle moved off the axis), `caps: [start, end]` (true: flat; a number: a dome that high; false: open, which needs `open: true` or a `lining`), `lining: { inset }` (an inside: a cup, a bowl, a helmet, a pipe; the rings then run from the open rim, so the first ring is the open end and `caps` is `[false, ...]`: a pipe open at its front is built from the front back, `rotate: [180, 0, 0]`), `axis` (`z`), `sides` (16) | along its axis from its first ring |
| `fingers` | `hand` (a base's hand bone), `count` (4), `length` (6), `radius` (`[at the hand, near the tip]`), `spread` (40 degrees across), `curl` (30 degrees forward), `palm` (1.5: how far past the hand's joint they start), `sides` (4) | on a character only: tubes out of the hand along its forearm's line, fanned across and curled forward, each to a point, hung on the hand. Long thin fingers and claws are thinner than a carve's cells and come out of a carve as fragments: build them so |
| `tube` | `path: [[x, y, z, r], ...]` (a bent pipe, an arm, a horn, a rope, a rim round a circle; r 0 at an end makes a point), `sides` (8) | as the path's numbers say |
| `leaf` | `width`, `height`, `bend` (how far its middle bulges), or `rows` of points (a grid: a sagging awning; a column of points every row keeps within 0.25 of the line through its neighbours is left out, and the report says how many) | a sheet seen from both sides, in the x-z plane: a flag, a sign, a pane, a sail |
| `cards` | `size: [x, y, z]` (the crown's box), `count` (4), `card: [width, height]` (each card's size: leave it out for cards crossed through the crown's middle, each the crown's size, the last laid flat; give it smaller for `count` cards scattered through the crown), `tilt` (30: the degrees a scattered card may lean) | a tree's crown, a bush, a fern, a hedge: thin sheets seen from both sides, all wearing one picture of leaves with holes between (`material` `leaves` unless told), thinning to a ragged egg inside each card. How GoldSrc's trees are made: a crown of solid spheres or blobs reads as a toy. Centred on x and y, from z 0 up |
| `band` | `on: { part, s }`, `width`, `height` | a hoop round a turned part (`s` 0 at its first ring, 1 at its last). Moves with that part |
| `boss` | `on: { part, s, angle }`, `radius`, `height` | a round stud (a rivet, a knob, a gem) on a turned part; `angle` in degrees round it: for a part along `z`, 0 faces +x and 90 +y; along `x`, 0 faces +y and 90 +z (up); along `y`, 0 faces +z and 90 +x |
| `ridge` | `on: { part, path: [[s, angle], ...] }`, `width`, `height` | a raised line along a turned part (a stripe, a seam) |
| `studs` | `on: { part, path }`, `count`, `radius`, `height` | a row of studs along that path |
| `kit:sword`, `kit:axe`, `kit:blunt`, `kit:bow`, `kit:firearm` | `options`: the kit's own (its header in `kits/`; a blade's `half` as `{ "taper": [base, tip] }`; a firearm's `preset`, `pistol`, `shotgun`, `smg` or `rifle`, and any part over it) | lying along +x, grip at the origin |
| `prefab` | `prefab` (a name of `prefabs`), `spec` (one given here) or `file` (a .json beside this spec: another case's model, reused), `scale` | the prefab as it was built |

**Symmetric things are built symmetric.** A chair, a person, a car, a crate, most things made are the same on
their left as on their right, and a carve, a generated mesh or a blob seldom is: a picture's light, a three-quarter
view or a generator's guess leaves one side fuller. Give such a `carved` or `mesh` part `"symmetric": true`: its
left half (+y) is kept and the right made its mirror, so the two meet on the same points (`turn` its front to +x
first). Built parts are symmetric when their sizes are: give the other side with `mirror: "y"`, never as a second
part placed by eye. Leave it off only for what is lopsided in the pictures too (a held gun, a coat open on one side).

Every part takes `texels`: how finely its picture is painted against the others' (1). A face, a badge or a
label at 2 gets twice the texels a unit of the body does; a sole or an inside that is hardly seen at 0.5 half.
Half-Life's characters give their faces two to three times the body's.

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

A crate there is 26 triangles, its planks and bands painted on; a can, 28; a person (Barney, a scientist) about 750,
the zombie 844, a small creature (the houndeye) 308. A character over twice its base's own body is a FAULT: choose a
base near its size, and paint what a spine or a fin does not change in the outline. A character's report gives
the median, third quartile and most of Half-Life's creatures and people of its size, and warns past the most: a
judge holds a creature to the most of the game's own (the headcrab's size: 478). A
prop's report gives the median and third quartile of Half-Life's props of its size, and warns past the third
quartile: a copy is judged against twice its original's count. A filing cabinet there is 14 triangles, its
drawers, handles and rails all painted on a box.
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
  copies it across, and a mirrored part on an `L` bone hangs its copy on the `R` one. A mirrored part stays on
  its own side: one that reaches across the middle runs into its copy (a boot 24 wide on a calf 5 off the
  middle made both boots one block over both legs), a FAULT on a character and a warning elsewhere.
- `pose`: the stance it is built and judged in, when the original stands otherwise than the base:
  `"pose": { "keys": { "Bip01 L Thigh": { "turn": { "y": 20 } }, "Bip01 R UpperArm": { "turn": { "y": -10 } } } }`,
  degrees about the model's axes as each bone stands in the first frame (`y` over 0 swings a hanging limb back,
  `x` over 0 out to the left). Every frame of the first animation is turned so (its number, length and
  activity kept), and the parts are placed as the base then stands. Turn the walking plane's joints (hips,
  knees, ankles, spine, upper arms, forearms) forward and back; a twist reads as wrong at once.
  `"pose": { "fit": true }` finds the stance for you: the model is built, its first frame fitted to the
  outlines of the spec's `project` pictures (or `fit`'s own list of views, as `project` takes them), and
  built again in it. Only forward and back swings of the hips, knees, spine and arms, and the upper arms a
  little out, are tried. The report gives the outlines' overlap before and after and the keys it chose, to
  keep or change; `keys` given beside `fit` win over it. `"pose": { "fit": "shape" }` fits the base to the
  spec's own `mesh` or `carved` body instead, by its outlines from the front and the side, which the body has in
  3D: a picture of the front alone guesses the forward and back swings, the body's side settles them, and the
  base's bones are laid in its limbs before each corner takes one.
  `"pose": { "from": "walk" }` makes the first animation one of the base's own (its frames, rate, looping and
  travel), starting at `frame`, or, with none given, at the frame whose box of the base's body comes nearest the
  spec's `size`: an original whose first animation is a walk stands mid-stride in it (Half-Life's scientist is
  33 long so, where a standing body is 22), and words that say so are a frame of the base's walk, not a stride
  turned by hand. `keys` and `fit` then turn it further. `smak info` on the base lists its animations.
  `"pose": { "aim": { "L arm": { "out": 8, "forward": 25, "bend": 15 }, "R leg": { "forward": -12 } } }` says where
  each limb points, whatever the base's own stance: from its top joint, `out` degrees from the body seen from the
  front, `forward` degrees (under 0 back) from hanging straight down seen from the side, and its elbow or knee bent
  `bend` degrees, at the base's own lengths. A description that gives the stance in angles ("the left upper arm 8
  degrees out and 25 forward, the elbow bent 15") is written so, number for number: `keys` turn a bone from where
  the base has it, and Gordon's first frame holds a gun forward, so turns read off a description land elsewhere.
  Limbs: `L arm`, `R arm`, `L leg`, `R leg`. After `from`, before `keys`.
  `"bind": true` beside any of these binds the body in that stance and writes the base's own first animation back:
  each corner is kept in its bone's own space, so the body then stands as the base stands. A body made in a stance
  that is not the game's (arms held out, so that they come apart from the trunk) wants it: without it the first
  animation stands in the stance, and the character idles in the game with its arms held out.
- `motion`: an animation of the base fitted to a strip of pictures of the original doing it, as the kit's
  `strip` draws one from the side with the floor as a line: `"motion": [{ "seq": "run2", "fit": { "picture":
  "pictures/motion.png", "count": 8, "cols": 4 } }]`. The strip's cycle is matched to the animation's (it may
  start at another point of the stride), each of its frames fitted by the pose's swings, and the swings spread
  over every frame, round the loop. The animation keeps its number, length and travel. Seen from the side,
  arms over the body barely change the outline: legs and lean are what it finds.
- `floor`: where its feet stand. A player model's origin is the middle of its hull, so its feet are at -36; a
  monster's origin is its feet, at 0. A monster made on a player's skeleton (Gordon's) gives `"floor": 0`, and
  every animation is lifted so that it stands on the floor and not sunk to its hips; a player keeps -36.
- Bones may be named in English or as the base names them. 3ds Max's Biped names its bones in the language
  it ran in: The Specialists' own player (`player/gordon/gordon.mdl` of the `ts` folder, every stunt in
  it) says `Bip01 Testa`, `Bip01 SX Mano`, `Bip01 Dorso1`, `Bip01 Dito mano DX0` where Half-Life's says
  `Bip01 Head`, `Bip01 L Hand`, `Bip01 Spine1`, `Bip01 R Finger0`, and Half-Life's older limbs (`Bip01 L
  Arm1`, the upper arm) are the newer `UpperArm`. A name is turned into the base's own (the report notes it).
- A joint that bends far (an elbow, a knee) wants a sphere on it, or a limb part with `over`: two boxes
  that meet end to end open a gap as soon as it bends.
- **A soft body of one surface: `blob`.** Parts built one by one meet at hard seams, and judges call such a body
  stiff ("the coat is a stiff box with a squared hem"). What is soft is a `blob`: skin, a creature's body and legs,
  bare arms, a coat's drape (a piece for each limb along its bones, `span`; an egg round the chest or the hips,
  `at`; a skirt as a cone from the waist, `from` and `to`, its radius growing), blended over a few units. What is
  squared stays as parts: a vest, a helmet, a holster, boots (`superquadric`, `box`); a blob rounds every corner, and
  one that swallowed a squared vest lost the outline. Keep a blob to what is round: its outline against the
  pictures says so at once. 40 triangles a piece unless told, 600 at most.
- **Given pictures of the character, carve its body from them** (`carved`, with `sheet` or `pictures`, and no `at`:
  it stands on the base's own feet, where the skeleton stands before `floor` lifts it; `at: [0, 0, 0]` hangs it over
  its bones, 36 units on Gordon's, each corner on the wrong limb): each corner hangs on the base's limb nearest it, so the one shape bends at the
  knees and elbows, and its outline is the pictures' at once. Turn the base to the pictures' stance first (`pose:
  { fit: true }`, or keys: the forearms down where the pictures' hands hang; Gordon's first frame holds a gun
  forward in both hands). Then add what a carve loses as parts on their bones: long fingers and claws as `fingers`
on each hand (the carve's report names the thin pieces it lost), a jaw as a part of its own. With `project`, a
  character whose outline shares under 0.7 with a picture's is a FAULT: its texture follows its shape, and on a
  shape that far off no projection comes near.
- A generated body (`mesh`) whose arms hang against its trunk, or whose hands touch its thighs, is fused there
  where a game's body keeps them apart: its triangles across the two tear in every motion, whatever bone each
  corner takes. The report warns past a few triangles that join limbs meeting 4 or more joints apart on the trunk
  (`54 triangles join limbs ... most between R Arm1 + Spine2`). Choose a take with its limbs clear of the body,
  or build the limbs as parts of their own. The tool `generate` makes such a take with `base`: it draws the
  character over its base's figure with the arms out and the legs a little apart, and the spec builds it in that
  stance, `"pose": { "aim": <the stance its answer gives>, "bind": true }`. A guard so made ran clean (2.4% of its
  triangles past three times their length, against 7.4% for one drawn from words alone with its hands on its
  thighs), and Haiku picked it out of a line-up beside the gman, the scientist and the assassin 1 reading in 4,
  chance, against 4 in 4 for one built of primitives (research/generated-characters.md).
- The picture is the character's paint: its face, its vest, its lettering, its boots are what the picture has,
  and no more. Draw the pictures first, `generate { kind: "shape", prompt, base, only: "picture" }` (seconds a
  picture, no shape), look at each against what was asked part by part, draw again with other words or seeds
  until one has it all, then make the shape of that one, `generate { kind: "shape", picture: "work:<it>", base }`,
  and paint the body with `project` from its cut-out. A body painted one flat colour with boxes on it for what
  the picture lacked (a run's guard: a box vest, a box helmet, no face) is what a line-up picks out.
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

- `like`: the game's weapon, as its files are named: `crowbar`, `357`, `rpg`, `tripmine`. Its files are read from the game folders first, then from beside the spec: a copy of a build's own put beside it is never fitted to in the game's place.
- A gun is best one part, `{ "kind": "kit:firearm", "options": { "preset": "shotgun", ... } }` (`kits/firearmkit.mjs`
  lists every field: receiver, frame, barrel, grip, guard, trigger, magazine, stock, forend, sights, `finish`,
  `wear`, and `length`: the whole gun made that long in proportion, for a brief's "about 10 long", its real gun's
  size without it; an option it has not is refused): a receiver, a grip, a closed guard and a magazine that read as a gun's, at its real size (`size: "own"`),
  180 to 300 triangles (Valve's own first-person guns are 276 to 363 without the hands). Its stock is left out of the first-person file as
  Valve's are (`stock: { "firstPerson": true }` keeps it), and it is laid the right way up and round in each file
  where its outline alone cannot tell. The report names its parts (`gun.receiver`, `gun.stock`).
- `views`: `["v", "p", "w"]` unless told.
- `size`: `"old"` (unless told) stretches it to the old one's length; `"own"`: build it at the **real weapon's
  length** (a crowbar about 24, a pistol about 7), and it is laid in each file at the size Valve draws that very
  weapon there: 0.82 of life in another player's hands, and in first person and the world as the game's own
  file draws it against that (its crowbar 0.82 and 1.37, where its guns' median is 1.24 and 1.81: a pickup is
  drawn large, to read on the floor). Without the game's files, the median. Its grip goes where the old grip was. In another player's hands
  and in the world the build lays a lighter mesh, as Valve's are: 0.59 of the first person's triangles and 254
  at most, the shape and picture kept (the report says how many).
- `rig`: `"carry"` (unless told) hangs it all on the bone that carried the old one; `"nearest"` gives each
  corner the bone of the old one's nearest corner, so that a part over a slide or a drum moves with it.
- A part may be in some of the files only: `"views": ["p", "w"]` leaves it out of first person (a stock behind
  the camera, as Valve's own first-person weapons leave theirs out), `["v"]` keeps it there alone (a sight).
- `chrome: ["v"]` gives the weapon's picture in those files the engine's chrome (a moving reflection over it), as
  Valve's first-person weapons have it.
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
`hazard` (stripes of its tone and black), `flat` (its tone and nothing else: no grain, patches or wear, as the game's own BLACK and YELLOW are; a plain colour a person asks for), `leaves` (pointed leaves on two layers with holes between, a masked texture: a crown's `cards`; `cell` a leaf's size in units, 2.5, `fill` the share of places that hold one, 0.75), `asphalt`, `water`, `paint`, `bone`, `door` (maps: a panelled door with
its handle, fitted to the leaf), `mesh` (a net, a wire fence,
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

A map's pictures are painted as used surfaces, as Valve's are: patches a little lighter and darker, each tile and
panel a tone of its own with its bevel lit from the top left, and a soft grit two to four texels across (not glass,
flames, neon or water). Pick tones within Valve's: nine in ten of Half-Life's walls and floors are no brighter than
0.57 and no more coloured than 0.18 (a pixel's highest channel less its lowest), and half are under 0.33 and 0.08.
A white wall is 0.55 to 0.6 there, not 0.9: the game's light brightens it again. A pale tone keeps less of a
wood's grain, as paint over it does. The report warns of each of the map's own pictures past nine in ten of Valve's
(`WARN N of the map's own textures look unlike...`), saying which way: brighter, more coloured, too even, little
grain, or grain that is noise (texels unlike their neighbours: static, not a material). Grain and patches are
held to Valve's of the material's kind (their wood is grainier than their concrete). Snow and bone may be bright,
and brass, gold, copper, leather, rope, `paint` and `hazard` coloured. The softest bases (cloth, dirt, grass,
paint, snow...) have less texel contrast than nine in ten of Valve's and say so: a photograph gives them more.

#### A material from a photograph

Valve's textures are photographs cut down: their fine detail is the material's own. Give a material a photograph
(a map's, a .wad's or a model's) and its picture is made from it:

```json
"textures": {
  "wall": { "base": "plaster", "picture": "work:refs/plaster.jpg", "size": 96 },
  "front": { "base": "door", "tone": "dark green", "picture": "work:refs/painted_planks.jpg" },
  "notice": { "base": "paint", "picture": "work:refs/notice.png", "filter": "literal", "size": [32, 48] }
}
```

- **Getting one.** When the server has a material library (the tool `materials`: hundreds of CC0 scans, each with
  its real size), search it first: `materials { match: "cracked concrete", show: [...] }`, then `"picture":
  "library:<name>", "size": <its width in units>`. Otherwise search the web for a photograph of the material seen straight on and evenly lit (plain white
  plaster wall, raw plywood, poured concrete, a painted panel door), and save it in the work folder (`refs/`), named
  for what it is. Texture sites that give scans away (Poly Haven, ambientCG: CC0) say their real size; a photo of a
  wall from a few steps away works too. PNG, BMP or JPEG (baseline or progressive).
- **A picture the person gave of the thing itself** (the door they want, the sign, the wall in their photo) is
  used as it is: `literal`, or `aged` to sit among Valve's, cropped to it by `rect`. They want it to look as their
  picture does, and a material redrawn from a photo of something like it does not. Whether they may use their
  picture is theirs to know, not the kit's to decide; a game's own files are still never put in anything shared
  (AGENTS.md, rule 7).
- `picture`: its path in the work folder (`work:refs/oak.jpg`) or beside the spec. Any base takes one but `mesh`.
  On a model it is laid over each part that wears the material at its real size (`size`, as for a map), at 4 texels a
  unit, in place of the base's own painted grain: a sofa's leather, a fridge's chipped enamel, a cabinet's worn
  wood. A plain painted base on a model reads as a toy; Valve's props are photographs too. Pictures of the thing
  itself, from its sides, are `project`'s (below).
- `filter`: what is done with it.
  - `valve` (unless told): the material's detail. The largest part of the picture that is one material is taken
    (or `rect`), its broad light divided out, laid one texel a unit at its real size, made to tile, its mean colour
    made the `tone` (the base's own unless told), and its grain, patches and colour moved into the range of Valve's
    textures of that kind. Then the base's own structure is drawn over it with no grain of its own: a door's frame,
    panels, bevels and handle; a tile's grout and bevels; bricks' courses; planks' seams; metal's panels. Use it for
    a surface: a wall, a floor, a door's wood or paint. A picture with a pattern of its own (tiles, bricks) doubles
    the base's: give it to `plaster` or `stone`, or use `aged`.
  - `literal`: the picture itself, cropped by `rect` and laid over the texture, nothing changed: a sign, a poster,
    a mural, a photo of one particular door. Made to tile only with `"tile": true`. It is not held to Valve's look.
  - `aged`: the picture's content as `literal`, its light flattened and its grain, patches, colour and brightness
    moved into Valve's range: a person's photo of a tiled floor, a brick wall or a door made to sit among Valve's
    textures, its pattern its own.
- `rect`: `[x0, y0, x1, y1]`, the part of the picture to take, in its pixels (a door in a photo of a street).
- `size`: the units of the game the picture's part spans across (or `[width, height]`), a unit about an inch: a
  door 36 wide, a sheet of plywood 48, a metre 39. For `valve` it sets the scale of the detail (unless told: about
  a photo of a surface of that kind, 48 for wood to 128 for ground); a part smaller than the texture repeats, so
  take a photo of more of the surface where the repeat shows. For `literal` and `aged` in a map it is the texture's
  own size (a 32 by 48 poster); in a .wad the texture's `size` is, and `size` makes the picture repeat within it.
- The report says what was done to each (`fact texture SM_WALL: valve: 1451x1963 of the picture at 341,85 ..., as
  79 across units, 2 by 1 times; its light divided out, made to tile; grain x2.33 ...`): look at the sheet, and
  give a `rect` when the part it took is not the material.

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
- `parts`: only these parts take it, and its outline is theirs: a picture of the body alone is laid over the
  body, not stretched over the gear beside it.

Each texel takes the colour of the pictures that see it, weighted by how squarely each does, where nothing of
the model hides it from that view. Only the ground joined to the picture's border is ground: a dark patch of
the ground's colour inside the outline is the thing's, and a texel whose dot is ground still takes the dot's
colour when no other picture sees it, so the thing's own blotches and specks come as the picture has them. A
texel no picture sees keeps its material; on a character it carries the colour the first picture shows at the
same height and side, softened over a few units, so the back of a shirt is the shirt (from one picture of its
front, a generated guard's back was its plain material). And a character's pictures are pulled to its base's
palette: a photograph's colour is far stronger than the game's own people's (a generated guard 0.43 in mean
saturation, Gordon 0.32, Barney 0.24), so each texel is moved toward its own grey, its lightness kept, until the
pictures' mean saturation is the base body's own; the report says by how much, and `"palette": "own"` keeps them. Only the views that see a texel nearly as squarely as the best one
blend in it, so a detail is not ghosted by two views that place it a little apart. Each picture's own light is
fitted to the way the surfaces face in it and divided out (a face seen head-on keeps its brightness), so the
game's light is not laid over a second shading; the finish is not painted over what the pictures cover. The shape decides how well it fits: the outline in
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
- `fact the shape's outline against each picture's`: with `project`, how much of the model's outline and each
  picture's are shared, view by view, both at their true proportions (as a judge measures it); under 0.8 is
  `WARN ... outline is off`: a part missing, too big or out of place in that view. Mend it, or carve the body.
- `fact its look against each picture's`: the painted model drawn from each picture's camera and set against
  the picture in cells (mean colour difference, and the worst cell with where it is); a mean over 10 or a cell
  over 45 is `WARN ... its look parts from the pictures`: a part a little out of place takes another's colour
  (a strap's texels reading the case behind it). Look at that view beside the picture and move the part.
- `WARN its pictures look unlike nine in ten of Valve's models'`: a picture with more near-white texels than
  Valve's (over 23%), more strongly coloured ones (over 30%), brighter on the whole (over 0.61), or with little grain
  (under 0.048), each against 287 textures of Half-Life's own models. Clean whites, toy colours and flat paint read as
  The Sims, not GoldSrc: a painted or manufactured white there (a fridge, a wall, a sign) is a used grey of 0.5 to
  0.6, its colours muted, its surfaces worn. Give tones nearer Valve's and the materials a photograph (`picture`).
  What is white by what it is stays white: the scientist's lab coat is 70 to 100% near white at 0.8 to 0.94, so a
  copy of a white garment keeps its original's white and the warning is read and left. Not told of pictures
  projected from the person's.
- `WARN N% of its triangles stretch past 3 times their length in motion`: on a character, a surface whose corners hang
  on several bones is pulled apart in the base's runs and walks, between the bones it names. A garment carved or
  blended into one surface with the limbs under it (a coat, a robe, a skirt) tears so: carve the garment alone
  (`clip` at its hem) and build the limbs under it as parts of their own, as the game's own characters are made.
- `WARN ... no outline from any side changes with it`: a part that, seen from every side at the size the game shows
  it (2 cells a unit), adds next to nothing to the outline, and costs more than 24 triangles. Valve keeps such a
  piece only as a few flat triangles (a lens in front of the face, teeth, a sole: 24 at most) and paints the rest:
  a tie, a belt, buttons, the folds of cloth (`research/paint-or-geometry.md`). Paint it on the part it lies on
  (`print`, `marks`, the material's detail), give it `paint: true`, or make it a few flat triangles. A part buried
  in another (a hand inside its sleeve) is said so too.
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
| `rate`, `bits` | 22050 and 16 unless told; 11025, 44100 and 8 too. Never stereo: GoldSrc plays mono only. 8 bits is warned of: its dither is a hiss under every quiet tail, heard as static and as a reverb that is not there; Valve's own sounds are often 8-bit, and a copy is not held to their depth |
| `seed` | Every random choice: the same spec makes the same bytes |
| `length`, `pitch` | Seconds (unless told, the longest layer's end); a pitch in percent |
| `layers` | Each `{ id, kind, at (s), length (s), gain (dB), env, filter }` (below) |
| `finish` | `room: { decay, wet, tone }` (keep it short: the map's `env_sound` adds the room), then `saturate` (a drive, 1 to 8: what makes a shot loud, its room's tail squashed up to its blast), then `limit: { crest, release }` (a peak limiter squashing the mix until its peak over its RMS is `crest` dB: Valve's weapons are 6 to 10, steps 15 to 21; `release` 0.002 s), `peak` (dBFS, -0.5); last, `fit: "bands"`: its power brought by arithmetic to the shares of the bands it is to have (its own `bands`, else its `picture`'s, else the game's own sound it takes the place of, else the middle of its class's), a gain a band laid smoothly over the spectrum, to within a point or two; the report says the gains. A band the sound has nothing in is not raised from nothing |
| `loop` | `true` or `{ crossfade }`: a cue point at its start, its seam crossfaded; the engine loops it |
| `variants` | More files from the same layers: `{ name, seed, pitch, gain }` (`cbar_hit2`, `pl_step1` to `4`) |
| `reference` | The game's files to draw beside it (unless told, the first of its class), read from the game folders the server was given and never copied |
| `bands` | The share of its power in each band, in %, as a description gives them: `{ "<150": 5, "150-600": 35, "600-2k": 45, "2k-5k": 12, ">5k": 3 }` (any of them). The report holds the made sound to them and warns of a band more than 7 points off, as it does against a `picture` |
| `t20` | The seconds from its loudest to 20 dB under it, as a description gives its decay ("falls about 20 dB in the next 0.44 s": 0.44). The report holds the made sound to it and warns past a fifth off (a copy is judged at a quarter) |
| `onsets` | How many hits a description counts ("three closely spaced hits": 3). The report counts the made sound's as a judge does (spectral flux peaks well over the sound's own mean: no hit in its first frames counts, and of several equal hits fewer count) and warns when they differ: build, read the count, and move the hits |
| `picture` | A picture of the sound it is to be, as the kit draws one (a waveform over a spectrogram, its length in its label): `"sound.png"`, or `{ file, length, rate, row }` when its label or marks cannot be read. The report then gives the numbers read off it beside the made sound's (below) |
| `sounds` | A set: a list of sounds, the spec's other fields their defaults |

The kinds of layer:

| kind | fields | what it is |
| --- | --- | --- |
| `noise` | `color`: `white`, `pink`, `brown`; or `shape` (below), `iterations` | a hiss, a whoosh, a blast, a scrape: shaped by its filters, or by a curve as steep as it says |
| `tone` | `f`, `wave` (`sine`, `square`, `saw`, `triangle`), `sweep: { to, time }` | a boom that falls (`f` 140, `to` 45), a beep |
| `fm` | `f`, `ratio`, `index`, `indexDecay` | a bell, a metallic ring, a machine |
| `modes` | `f` and `ratios` (`bar`, `clamped`, `plate`, `bell`, `tube`, or a list), `gains`, `decay` (s to -60 dB), `damping`, `detune`; or `modes: [{ f, gain, decay }]` | a struck thing ringing: a wrench, a bell, a casing, a plate |
| `particles` | `count` or `rate` (a second), `band: [lo, hi]` Hz, `grain` (s); or `every` (s) and `jitter` (0 to 1 of `every`) | gravel, a rattle, debris, crackle; with `every`, a train of pulses: a door's stop, a ratchet |
| `sample` | `file` (a `.wav` in the work folder: a generator's take, any rate, channels and PCM or float), `from` (seconds into it, or `"onset"`: its first hit), `length` | a recording: brought to the sound's rate, cut, then filtered, enveloped (only when `env` is given: it keeps its own loudness otherwise), pitched and finished as any layer. A sidecar beside it (`hit_s2.json`: `model`, `prompt`, `seed`, `licence`) is told in the report's facts, a non-commercial licence said so |

`env`: `{ attack, hold, decay }` in seconds (`decay` to -60 dB), `{ shape: "bell", decay }` (a swell up and
down, a swing's whoosh), or `points: [[t, dB], ...]`. `filter`: a list of `{ type: lowpass | highpass |
bandpass | peak | notch, f, q, gain, sweep: { to, time } }`. A layer's `at` puts it later: a pump is two
clacks 0.2 apart, a step a heel and a toe. Any layer also takes `drive` (1 to 20: that layer saturated
alone, at its own peak) and `post: true` (added after the finish's saturation and limiter, its `gain` in dB of
the squashed body's peak: a crack of 1 to 3 ms of white noise high-passed at 2 kHz keeps its onset that way).

A noise layer's `shape` is its spectrum, made in the frequency domain where the biquads cannot reach (their
skirts leak into each other): `[[Hz, dB], ...]`, straight between its points on a log scale of frequency
and held past its ends, 0 dB everywhere being the white noise of `color: "white"`; or a shape that moves,
`{ keys: [{ at, curve }] }`, each point's dB going straight from one key to the next (`at` in seconds from the
layer's start). `iterations` (0 to 200, 0 unless told; 32 is plenty) makes the frames' phases agree, so the
sound's spectrogram follows the curve closer; a long sound takes a second or more for it. The `env` still
gives its loudness.

```json
{ "id": "blast", "kind": "noise", "iterations": 32, "env": { "points": [[0, 0], [0.4, -3], [1.0, -40]] },
  "shape": { "keys": [{ "at": 0, "curve": [[60, -12], [300, 0], [1200, -2], [4000, -14], [11000, -30]] },
                      { "at": 0.5, "curve": [[60, -6], [300, 0], [1200, -8], [4000, -26], [11000, -45]] }] } }
```

**From a recording.** When the server offers the tool `generate`, a sound of a real thing (a hit, a shot, a step, a
door, debris, a medkit's click) begins best from a generated take, which has the grain, the ring and the room no
layer of noise and modes reaches. The models learned from short captions of real recordings (WavCaps' average 7.8
words; AudioCaps': "a dog barking in the distance", "a train passes by, blowing its horns"), so ask as such a caption
does: 5 to 15 plain words about the sound alone, its source, the action, the material and the space, the events in
order when there are several ("a heavy steel wrench striking a metal pipe, one sharp clang, close-miked, dry"). No
numbers, no frequencies, nothing only seen. Name the source of what is heard, not only the thing: "a sliding door" is
a door pushed by hand, "a sliding door driven by an electric motor, a rising whine" is the machine. A take carries
the room it imagines, which a game's own sounds mostly lack: say "dry" or "close-miked".

**The person's own words** go to `generate` as its `prompt` field says, for every kind it makes: as they are when the
person asks, otherwise rewritten and told to them.

Give its `length`, its `class`, and 4 to 8 seeds; another seed is another take, another wording another set. Choose
the take that is what was asked for and is clean (the measures flag clipping, a slow attack, a ringing tail of noise),
and put it in a `sample` layer `from: "onset"`. Add no `noise` or `modes` layer over a take: it has its texture and
its ring already. Steady noise added to it is heard as static (and, fading, as reverb; the build warns of it), and
modes laid on a hit or a step are heard as a bell. Shape it in the spec only
where it needs it: its `length`, the finish's `fit: "bands"` (a generated hit is often brighter than the game's,
and a filter by hand rarely lands every band: the fit does), `saturate` and `limit` (a shot is loud for its peak). Layers alone are for what has no
real source (a beep, a drone) or where no take comes near. Each take's sidecar names its model's licence, and the
report's facts say when it is non-commercial: tell the person, whose call it is. How a sound sounds is the person's
to say, by ear: the numbers find faults, not likeness.

**Static and reverb.** A steady `noise` layer is heard as static, and one that fades slowly as a reverb the sound
does not have: a real hit, shot or slide is grains and tones, not a smooth wash. Keep noise short (a crack, a
blast's first tenth of a second), and grains under about 3 kHz unless the sound sparkles (particles' `band` up
past 4 kHz is heard as glitter on a blast); make a long tail of `particles` (their `rate` falling) and `modes`, or of a noise
whose `shape` moves through keys. The build warns of smooth noise ringing past 0.3 s; with a `class`, of a struck
sound (a hit, a shot, a step) that takes over 50 ms to reach its peak (heard as played backwards) and of one that
dies sooner than the game's of its class (heard dry, as in a padded room: a short `room` gives it space, noise
does not), and, when it has no target of its own (`bands`, `picture`), of a spectrum off its class's as a judge measures it
(its centroid or a band's share outside the class's range), saying which way to move it. A sound named as one of the
game's own (`headcrab/hc_pain1.wav`), with the game's folders given, is held to that sound the same way, and to its
length within a quarter: it takes its place, and is judged beside it.

**From a picture.** `audio.fromPicture(png)` reads a sound's picture as the kit draws it (its label gives the
length, its marks the rate) and returns a draft spec of tens of numbers: one noise layer whose `shape` moves
through keys read off the spectrogram (where it starts, its loudest, and as it falls by 6, 12, 20, 30 and 45
dB), its `env` points, and a `modes` layer for each tone line it finds, with its level and decay. Edit it:
add a crack, a `limit` at the crest wanted, and change what the picture cannot say. It never gives samples:
a picture inverted to sound is a traced copy of the recording it was drawn from.

What the report says of a sound: each file's rate, length, peak, RMS and crest; its attack, T20 and T40
(seconds to -20 and -40 dB), centroid (Hz: bright or dark), flatness (0 a pure tone, 1 white noise, taken
under 5512 Hz so that a file at 22050 reads as one at 11025), onsets, and its power in five bands; then, with a `class`, how many of its features are in the range of
the game's own of that kind, and each one off in words with which way to go (`centroid 881 Hz (1074 to
1654): too dark: more 600 to 5000 Hz`); with a `picture`, the numbers read off it beside its own: length,
centroid and the band most off (each with how far off), T20 against its class's range (or the picture's own
within a quarter), crest (the picture's is read off its outline, within 3 dB), flatness and onsets, and a warning
(`further from its picture than a copy should be`) while its centroid is more than 15% off, a band more than 7 points,
its length more than 10%, its T20 out of range, or its flatness 1.6 times the picture's or under its share: a copy is
judged at 20% and 10 points, and a picture's reading may be a few off. Flatness is how much of it is noise (0 a pure
tone, 1 white noise); a sound too tonal for its picture is heard as a ring where the original has a crash or a
scrape. Build until it is gone, not only until `OK`. `FAULT`s are what the engine would do wrong: clipping, an offset,
silence before it starts (it plays late), an end that clicks, a loop with no cue or a seam that jumps, and a loop
silent more than 60% of the time (the game's own are at most about half silent: a drip loop is many drips). The
picture is each file's waveform over its spectrogram (log frequency, 50 Hz at the bottom), the game's own
of its kind under them at the same time scale. What it cannot say is how it sounds, or how the game plays
it (its volume, its pitch, the map's room): say so, and the person listens in the game.

## A music track

A take of music (the tool `generate`'s, `kind: "music"`, or any recording in the work folder) made into a track
the game plays: the game's music is 44.1 kHz stereo MP3 under `media/`, levelled by loudness.

```json
{ "spec": "smak.music/1", "track": 2, "group": "action",
  "from": { "file": "work:gen/action_s3.wav", "start": 0, "length": 75 },
  "fade": { "in": 0.5, "out": 3 }, "loudness": -14,
  "eq": [{ "type": "lowshelf", "f": 150, "gain": -3 }] }
```

| Field | |
| --- | --- |
| `track` | The CD track a map plays, 2 to 27: the engine's own table names the file (`media/Half-Life01.mp3` for 2, `Prospero01` for 3 ... `Suspense07` for 27), so the mod's file stands in for the game's. Or `name` instead |
| `name` | The file's path in the mod: `music/lab.mp3` for a mod whose code plays music its own way (`mp3 play`; a map cannot play it); with `as: "wav"`, a path under `sound/` |
| `from` | `{ file, start, length }`: the take, and the seconds of it to use |
| `fade` | `{ in, out }` in seconds (not on a loop) |
| `loudness` | LUFS (ITU-R BS.1770), -14 unless told: the game's tracks are -10 to -21, -14 their middle. Its peak is held under -1 dBFS, and the report says when that left it quieter |
| `eq` | Filters as a sound's: `lowpass`, `highpass`, `bandpass`, `peak`, `notch`, `lowshelf`, `highshelf` |
| `loop` | `{ crossfade: seconds }`: its end laid over its start; `true`: the take is a loop already (`generate`'s `loop`). An MP3 has no loop point: a bed that must loop without a gap is `as: "wav"` |
| `as` | `mp3` (unless told; through ffmpeg with libmp3lame, found on the PATH) or `wav`: 22050 Hz mono with a cue at its start, a bed a map's `sounds` plays by an `ambient_generic` |
| `group` | `action`, `ambient`, `between` or `stinger`: the game's tracks of that kind, their medians told beside it (not held to it: to the person's ear the share of bass said nothing of which take was better) |

The report gives its loudness before and after, its loudness range, its peak, its power by band, what made the
take (its sidecar) and whether its licence is non-commercial, and, for a track, how a map plays it. Its file is
written as the mod has it: `work:media/Half-Life01.mp3`, `work:sound/ambience/lab_bed.wav`. The map spec's
`music` plays a track.

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

A texture of a compiled map that a picture shows on its wall, as the map's place view draws it (`texturePlaces`,
`placeView`: the picture a textures leg is given), may be taken off that picture: `"lift": { "map":
"models:frenzy.bsp", "view": "work:pictures/c3a1b_w1.png" }`. Each pixel is told which texel of the wall it shows
and the light it was seen in, and the texel is its colour over that light; what the view does not show is the part
it shows repeated; with `"views": "work:pictures/views.png", "cameras": "work:pictures/views.json"` (a sheet of the
map's views and each tile's camera, as `viewsOf` drew them) the texels those show are taken too. The build says the
share of texels seen, the share white in the view (a lamp's colour is not there to read) and the share under a light
of one strong colour (a blue lamp leaves a teal wall's red and green too dark to divide back): use it on every
texture whose view is neither white nor tinted there, however little of it the view shows. A lamp's face is white at
the place view's brightness: drawn again darker (`placeView(bsp, place, { brightness: 0.5 })`), it is lifted with
`"brightness": 0.5` (frenzy's lamps came back within 2.5 to 9 of delta E, against 28 to 46). Paint only what no view
gives (a wall under a coloured lamp). A wall seen sparsely (far off, a pixel every few texels) has the gaps
between its seen texels closed from them before the rest is filled. On frenzy, a texture seen at 5% to 40% came back within 2 to 5 of delta E of the game's colour (a copy is
held to 15), where makers who painted those instead missed by 21 to 32; what a small view lacks is a pattern
larger than what it shows (a row of studs), which the map's views often add.

A texture may be made from another above it in the spec, `"from": "-0genpipe1"` or `{ texture, brightness, flip,
shift }`: that one's picture, dimmed or brightened (`brightness`, a multiple: 0.4 a lamp switched off), flipped (`"x"`,
`"y"`), shifted (`[x, y]` texels, wrapping) and fitted to its own size. A random set's other tiles (`-1`, `-2` beside
a lifted `-0`) and an animation's other frames (a lamp's `+a`) are not on the map's faces to be lifted: made apart they
do not match their set, made from it they do.

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
has grit all over it (`speckle`: specks two to four texels across) and blotches (`stains`); its machinery,
streaks and scratches.
A plain fill reads as flat beside it; every material is painted with some patches and grain already, and the
report warns, as a map's does, of a texture brighter, more coloured, more even or noisier than nine in ten of
Valve's ("Materials"). A material may take a photograph (`picture`, with `filter`, `rect`, `size`, `tile`: "A
material from a photograph"), read beside the spec or from the work folder: its detail under the texture's panels
and print (`valve`), or the photograph itself (`literal`, `aged`) as a sign or a mural. A name
is one word of 15 letters at most and its first letters mean what a map's do (`{` holes, `!` a liquid, `+0` an
animation's first frame, `-0` the first of random tiles); sides are multiples of 16, 512 at most. The build
writes the .wad and a sheet of its textures. With `preview.map`, a compiled map of the models or work folder is
drawn wearing them: textures of the same names stand in for the game's, the way a mod replaces a game's look,
and the report names the textures the map wears that the .wad does not have. With `preview.each: true` as well,
each texture is drawn on its own place in the map, its largest face lit in every colour, from the camera and at
the brightness (4.5) a reproduction test's judge looks from: set it beside a picture of the original's place.
For each, the report says how many texels the view spans across (its scale), how far the picture's top is
turned from up or north on that face (the map may turn it), and the light on the face, `[r, g, b]`, which a
colour read off such a view is the paint times, and what yours reads as in the middle of that view (`yours reads as
RGB ...`): a colour someone read off a picture of the original's place is set beside that, not beside the paint. A texture the map keeps inside itself is the one the game
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
| `class` | What it is held against: `explosion`, `fire loop`, `smoke loop`, `smoke puff`, `sparks`, `glow`, `flare`, `muzzle flash` (each frame a flash of its own, all bright: the engine shows one, at random, for one frame), `ring`, `beam` |
| `size` | `[w, h]`, multiples of 8, 256 at most to be drawn as made (512 at most) |
| `frames`, `loop`, `fps` | A loop of `frames` is written with its first frame again at the end, as the engine wraps; an `env_sprite` changes frame at most 10 times a second |
| `type`, `format` | `parallel` (unless told: faces the camera), `upright`, `facing upright`, `oriented`, `parallel oriented`; `additive` (unless told: black is clear), `index alpha` (coverage, tinted by `colour`), `alpha test` (holes), `normal` |
| `origin` | `centre` (unless told), `bottom` (a flame on its base), or `[x, y]` pixels |
| `layers` | Each `{ kind, gain, env: { attack, decay, start }, mask, ... }`, summed: the kinds below. `env`'s shares of the play: `attack` to its peak, `decay` from it, `start` its level at the first frame (0: an explosion that opens on a small flash wants 0.1 or so). Coordinates run -1 to 1 across the longer side; `v` is up. `mask: "reference"` (with a `reference`) keeps a layer inside the reference's lit area, frame by frame: its outline, eased in from 4% to 30% of each frame's brightest (`{ from: "reference", low, high }`), never its colours. A broad layer masked so takes the reference's shape (a cloud that rises off to one side, a flame's tongues) where layers alone do not reach it; the light inside it is still the layer's |
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
brightness. With a `reference`, `"ramp": "reference"` is the reference's own colour at each brightness, read off its
sheet, frame by frame where it has several (an explosion white at its height and orange as it cools, at one
brightness): give it whenever the sprite copies a picture of one, so that a halo is the original's peach and not a
violet read from a description.

The report gives each sprite's colours, the border's light, how it starts and ends, how smoothly a loop wraps
and how much it flickers, each against Half-Life's own of its class, and the render mode to place it with.
With a `reference`, it gives the judge's measures of both, each read off a sheet of the same drawing: mean
colour (delta E; 15 or under is near), the share that is dark (within 0.05 is near), the border's light and the
frame count, its shape frame by frame (the share of lit pixels both have) and its hot middle (its brightest, and
the pixels over 0.7), with a warning for each that is off: a colour over 15, a shape under 0.8 (where the judges
stop giving a shape full marks), a middle half again as large as the reference's or 0.15 brighter (a glow's core
too large reads at once to the eye), or under two thirds its size (a flare's core half as wide, which the shape's
mean over its levels did not see), its brightest frame more than 0.08 of its play from the reference's or its first
frame 0.2 brighter or fainter, its light frame by frame (over its brightest) more than 0.08 from the reference's on
average or 0.25 at any frame (a puff that grows three frames slower to the same peak, a flame that holds its light
where the reference's sinks), naming the frames, and its light at the border 0.08 short of or past the reference's (a halo that falls
off too soon, or spills). A loop with a reference starts at the frame where its light over the loop follows the
reference's, and of the starts that follow it nearly as well, the one that puts its brightest frame where the
reference's is: a loop has no first frame of its own. An additive sprite made a one-shot against a reference still lit
at its last frame (a one-shot ends dark) is told to loop, and a loop against one that starts and ends dark, not to. Build until they are gone, not only until `OK`. A light of one colour (a
white glow) is written as 255 steps of that colour, so its falloff shows no bands.
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
| `size` | What the person asked the map to measure across its plan: its longest side (`2500`), both sides (`[1500, 1500]`) or `{ length, width }`. Its rooms and the rock round them off by more than 10% is warned of, more than 25% is a fault, as a model's size is |
| `theme` | `{ floor, wall, ceiling, door, furniture }`: materials for every room's rock, its doors and furniture. Made into a .wad of the map's own, or taken from a game's .wad (below) |
| `textures` | More named materials, for furniture, prefabs and rooms' surfaces: `{ "counter": { "base": "darkwood" } }` |
| `wall` | Rock between rooms (16). Rooms placed side by side have exactly this between them |
| `rooms` | Boxes of empty space, each placed against one before it |
| `links` | The ways from room to room |
| `entities` | What is in the rooms: the start, monsters, items, lights of your own |
| `furniture` | Brush furniture put in rooms: a box, or a prefab of `prefabs` |
| `ladders` | `[{ room, side, along, width, height }]`: a ladder against that wall of the room (`side` north, south, east or west; `along` 0 to 1, 0.5 unless told; 32 wide and the room's height unless told), built as Valve's are: a `func_ladder` to climb and over it the rungs a player sees, a `func_wall` in render mode 4 in a texture with holes (`{LADDER1` when the game's `.wad` is given, a mesh of the map's own otherwise). Never make a ladder as furniture: a ladder texture without its holes reads as a vent |
| `prefabs` | `{ name: { pieces: [...] } }` or `{ name: { file: "table.map" } }`: brush furniture made once, put in many places |
| `models` | `{ name: <a model spec> }` or `{ name: { file } }`: models built with the map, for `props`. Each is written to `models/<map name>/<name>.mdl` beside the map, and its props name that path: copy the folder into `<mod>/models/` and the `.bsp` finds them, apart from the mod's own |
| `props` | Models put in rooms: `{ model, room, at, facing, z, solid }`. `model` is one of `models`, a `.mdl` path the game has, or the kit's own furniture as `"kit:<name>"` (the specs in `kits/furniture/`: toilet, bathtub, sink_cabinet, bed, sofa, armchair, dresser, stove, fridge, coffee_table, tv_stand, bench, sedan, trees and more), built with the map. A model is walked through in the game: kit furniture, or a prop with `solid: true`, gets a `CLIP` box of its footprint and height that stops a body and draws nothing. Furnish with these, not with boxes |
| `include` | Other map specs taken in as modules (below) |
| `layout` | A drawing of the plan (below), in place of placing rooms by words |
| `wads` | A game's .wad files to take textures from: `["halflife.wad"]`, found by name in the game's folder |
| `fgd` | Entity definitions to hold the entities against, beside the server's own (`--fgd`) |
| `night` | true: a dark sky, a dim moon and the sky's own light far under it; the views draw the sky dark |
| `sky`, `sun` | The sky: the name of one of the game's (`desert`), or the words of one to make (below, "A sky of its own"); and the sun's `{ pitch, yaw, brightness, color }`, for rooms under the sky |
| `compile` | How the compilers run: `{ quality: "draft" \| "normal" \| "final", threads, light: { bounce, ao, extra, softShadows }, hulls: { large: false, crouch: false }, clipEconomy: true }`. Every program gets all the machine's threads unless told |
| `detail` | `false` keeps furniture in the world; unless told, furniture is `func_detail` (below) |
| `fidelity` | `"game"` (unless told) or `"high"`: a map made to look its best, when the person asks for it. High adds trim (a baseboard along every wall under a roof, a casing round every door and opening, a sill and frame at every window, in the theme's `trim`, darkwood unless told: drawn, not solid, so a narrow room keeps its room), a lamp for each 192 x 192 of floor where `"auto"` gives one for each 256 x 256, and puts furniture of boxes named for a piece the kit has a model of (`toilet`, `tub`, `fridge`) in as that model, moved back inside its room if the model is larger than the boxes. The report says what it added |
| `music` | `[{ track, when }]`: the game's CD tracks, 2 to 27 (a music spec with that `track` makes the file): `when` `"start"` (unless told: a `trigger_auto` firing a `target_cdaudio` as the map begins) or `{ enter: "<room>" }` (a `trigger_cdaudio` over the room's floor, the first time a player walks in); `{ stop: true, when }` stops it. They play for the first player only, and each once: a multiplayer mod plays music its own way |
| `sounds` | `[{ spec, room, at, z, volume, radius }]`: sounds made with the map (`spec`: a sound spec, or `{ file }`) and played where they are put by an `ambient_generic`: `volume` 1 to 10, `radius` `everywhere`, `small`, `medium` or `large`; looped when the sound loops (a hum, a fire), once otherwise. The files go under `sound/<map name>/` beside the map, and its `ambient_generic` names them there: copy that folder into `<mod>/sound/` |

### A floor plan

A map whose plan is drawn already (a level's storeys, a building of floors over floors) takes its space from height
plans in place of rooms: `"floorplan": { "dir": "work:plans/" }`, the folder `smak map-heights` writes. One picture a
layer of floor (`floor-0.png` the lowest floor at each place, `floor-1.png` the next above it...), each cell's floor
height as a colour, `room-N.png` the headroom over it, and `legend.json` (the colour of each height and headroom,
the cell's size, and the world's x at the pictures' left edge, `x0`, and y at their top, `y1`). Every cell's open
space is carved out of rock in one, so a gallery over a hall and the hall under it are one space; the walked floor
is grown `grow` cells (1) to the walls, since a player's middle keeps 16 off them. Rooms may be left out; what
stands on the plan is in the room `"plan"`, `at: [x, y]` of the world, on the floor of its `layer` there (0, the
lowest, unless told; numbered as the height plan's pictures are) or under the `height` a plan gives it (the highest
floor at or under it), `z` over it:

```json
{ "spec": "smak.map/1", "name": "arena", "floorplan": { "dir": "work:plans/" },
  "entities": [{ "class": "info_player_deathmatch", "room": "plan", "at": [-512, 640] }, { "class": "weapon_shotgun", "room": "plan", "at": [128, 96], "z": 4 }] }
```

`areas: [{ min: [x, y] or [x, y, z], max, floor, wall, ceiling, light }]` gives parts of the plan their own: the
words of `theme`, `textures` or a base for the faces under, beside and over each (concrete in the hall, tiles in the
washroom, wood on the gallery), and `light` as a room's (`"auto"`, `"none"`, `{ brightness, color }`). The plan's
open space is cut at the areas' edges; the first area that holds a piece's middle is its. A plan of more than a
million square units of floor with fewer than two areas is warned of: one wall texture over a whole level reads as no
place in particular (frenzy's copy so wore one, and the judges gave its textures and its views 0). Give a level's
parts their own, each read off pictures of the place with the `info` tool's `like` and `rect`. Unless it has lights of
its own, in its entities or its areas, a lamp hangs under the ceiling of each of its largest open spaces (24 at most).
A light's `brightness` is a light entity's (a lamp's is 250), not a multiple: one under 40 is warned of. After the
compile, each area and the plan's floor outside them is a fault when more than half of its floor is dark (under 24 of
255; Valve's maps have 10 to 37% so), and an area whose box covers none of the plan's floor is warned of.
Frenzy's height plans read back so overlap its walked floor 0.898 (research/map-geometry.md); the textures, the
light and every entity are still the map's to give.

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
  material than the theme's (a lining 8 thick inside the rock). A wall's picture stands on its room's floor, as
  a mapper lines it up: a texture's bands and panels sit at the same height over the floor in every room.
- `water: 32` or `{ depth, material }`: water over its floor, swum in or waded; a `!` texture.
- `light`: `"auto"` (one lamp for each 256 x 256 of floor, hung no higher than 192 over it, and over a flight of
  stairs clear of a head on its top tread or at the ceiling; unless told),
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
  through (`"south"`). A door, a window and glass are as between rooms. A floor higher than a step (18) over
  the open room's (a house raised on piers or a crawl space) gets steps out from the wall into the open room,
  railed where they stand free: leave them room there (24 a step of 8 and a player's width past their foot).
- A storey over it is a room `above` one of its rooms, with stairs as between any stacked rooms.
- `siding` (clapboards) and `shingles` are materials of their own, for its outside and its roof. A theme
  word may name one of the spec's `textures` (`"outside": "siding_blue"`).
- Furniture and props in the open room must stand clear of it: one inside its walls is a fault.
- The pictures add each building seen from the corner of its open room on the side of its front door.

### Links

`{ between: [a, b], kind, width, height, along, sill, glass }`. The two rooms must be side by side (or
stacked) with the wall's rock between them, and the link goes through that rock:

- `opening` (unless told): a way through, 64 wide and 96 high unless told.
- `door`: the same with a door in it: a `func_door` that slides up into the wall over it, all the way, or with
  `door: { swing: true }` a door on hinges (`func_door_rotating`), as a house's are, turning a quarter away
  from whoever opens it about its hinge at the start of the way (`hinge: "end"` the other edge), opened as
  a player walks into it and shut by itself two seconds later, as Valve's doors are (`wait`: the seconds it stays
  open; a door that swings shut on a player turns back). A door to be used rather than walked into is a mod's to
  make, with a trigger. Other keys of `door` are the entity's (`speed`, `wait`, `targetname`); `material` its own, the theme's `door` unless told,
  which is the `door` base: a panelled wooden door with a brass handle, one picture fitted to the leaf. A
  material of another base (`{ "base": "wood", "tone": "white" }`) is painted as that door in its tone, unless
  it names a game's texture. A sliding door opens and shuts the same way. Any door's picture is fitted to its
  leaf, one whole picture across it.
- `window`: 48 by 48, `sill` (40) over the higher floor. Nothing walks through a window. `glass: true` (or
  `{ alpha, health, material }`) glazes it: a `func_breakable` pane, half see-through, that shatters.
- `stairs`: for rooms stacked one above the other: a stair in the lower room up through a hole in the
  floor of the upper (the lower room needs `rise / 16 * 24 + 32` of length along x). It climbs along x
  against the south wall, or with `along: 1` the north (between, a share): keep it clear of a doorway.
- Between rooms side by side whose floors differ by more than 18, any opening or door gets **stairs** in the
  lower room, up to the opening. The lower room must reach as high as the opening (its ceiling over the
  higher floor by the opening's height).
- `along`: where on the shared wall, 0 to 1 (0.5, the middle).
- A way a player walks through is never narrower than they pass at ease: an opening or a sliding door 48, a door
  on hinges 56 (its leaf stands in the way when open). A narrower `width` (a house's drawing gives 36) is widened
  and the report says so; a shared wall too short to hold it is a fault: make the rooms share more wall, or leave
  the way out. 32, a player's own width, is a squeeze the game may not let through. And it is 96 high at least,
  Valve's door height, and 90 over the lower floor where there is a step (the engine lifts the body by up to 18
  before it moves over one), as far as the rooms' ceilings allow.

### Where things go in a room

`at`: `centre`, `corner ne` (`nw`, `se`, `sw`), `against north` (`south`, `east`, `west`), `near <room>` (by
the wall towards that room), `[dx, dy]` from the room's middle, or `{ beside: "<id>", side: "west", gap: 4 }`:
against the side of a thing put before it, by both their real footprints, lined up with its middle.
`facing`: `north`, `east`, `south`, `west`, degrees (0 east, 90 north), or a room's id (looking towards
it). `z`: over the floor. `id` names a thing for `beside` (an entity's `id` is also its `targetname`).

Furniture and props must stay in their room: one that reaches into a wall is a fault. The floor 40 deep on
each side of a door or an opening is kept clear: furniture standing there, between a step over its floor and
a player's head, that leaves less than 48 of its width free is a fault (steps up to it, a slab, a hedge beside
a wide opening are not). So are stairs, over their treads and 40 past their foot, up to a player's head at their
top. Nothing floats: each piece of furniture rests on its room's floor, stands against a
wall (or a building standing in the room), reaches its ceiling, or touches a piece that does; one that touches
none is a fault (flush means flush: a sign 2 off a wall floats). A thing put
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
named `SM_` and a word of the spec's materials (`SM_FURNITURE`). A set piece wired of brush and point entities is one
too: Valve's soda machine is its body's brushes, five `func_button` brushes each `target`ing an `env_beverage` (`skin`
the can, `health` how many) at the slot. The names a prefab gives its own entities (`targetname`, and what targets
them) take `_1`, `_2`... at each one put, so each machine's buttons fire its own can; a name it only uses (the map's
own `lights_main`) is kept. `furniture: [{ prefab: "table", room:
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

### A sky of its own

`"sky": { "zenith": [0.2, 0.4, 0.8], "horizon": [0.75, 0.8, 0.9], "clouds": { "cover": 0.5 }, "hills": { "height": 5 } }`
makes the map's sky: six sides of 256, each pixel the colour along its way out of the eye (so the sides meet
with no seam), written as the game's own are (24-bit `.tga`) into `gfx/env/<map name>/` beside the map, and
named by the map's `skyname`. Copy that folder into `<mod>/gfx/env/`. Every word is optional:

- `zenith`, `horizon`, `ground`: the colour overhead, at the horizon and below it (0 to 1); `haze` (0 to 1) how
  far up the horizon's colour reaches.
- `sun`: `{ size, glow, colour }` (degrees), and `yaw` and `pitch` as the light's (the map's `sun` unless told,
  so the sun stands where the map's light comes from); `false` for none.
- `clouds`: `{ cover (0 to 1), colour, scale, seed }`, or `false`. They lie on a plane overhead, so they grow
  small and thin toward the horizon.
- `hills`: `{ height (degrees), colour, roughness, seed }`: a far skyline all round.
- `stars` (0 to 1); `night: true` (the map's `night` unless told) starts from a dark sky, a moon and stars.

### A game's textures

Name the game's .wad files in `wads` and give a material as a texture of them:

- `{ "texture": "C1A0_LABW4" }`: that one, by name.
- `{ "pick": { "words": ["labflr"], "tone": [0.6, 0.6, 0.55], "else": { "base": "plaster" } } }`: the
  best fit, by its name holding the words and by its average colour. The report says which it picked and
  the next three it weighed. Liquids, see-through and animated textures (`!`, `{`, `+`) are picked only when
  a word asks for them (`"!toxic"`).
- When nothing fits, that is a **gap**: the report says so, with the nearest, and the texture is made from
  `else` into the map's own .wad, which the map names beside the game's.

The `info` tool on a .wad lists its textures; with `like` (a picture, say a view of the map you are making
again) and `rect` (the patch of a wall in it, `[x, y, w, h]` in dots) it lists the dozen textures whose colours
are most like that patch's, its light divided out, and draws them beside it: look and choose, then name it.
It finds a wall's texture among a game's thousands about a third of the time first and often in the dozen;
under a coloured lamp, or on a texture smaller than the patch, it cannot. A game's textures are its authors': a map built with them
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
- `FAULT furniture[n] ... stands in front of links[m]`: in the way of a door or an opening; move it aside.
  `... stands on or at the foot of the stairs of links[m]`: the same for a flight of stairs.
- `WARN N rooms of a building have nothing in them`: a house's rooms are furnished unless the person asks for them
  bare; corridors and open rooms are not counted.
- `WARN N pieces of furniture are boxes where the kit has a model`: a prefab named for a thing the kit furnishes
  (`toilet`, `tub`, `wall_sink`, `fridge`) is built of boxes, which read as blocks in the game: put the kit's in
  as props (`"model": "kit:toilet"`), unless the boxes are meant.
- `WARN N of the map's own textures look unlike nine in ten of Valve's walls and floors`: each picture named
  with what is off: brighter or more coloured than Valve's (with the number and Valve's middle), or too even.
  Darken or soften its tone ("Materials").
- `FAULT no floor of <room> is walked to, though a way leads into it`: the way in is shut (furniture across it,
  a wall, or a step too high on the way there); `smak map-reach` draws the walk on the plan.
- `FAULT N pieces of furniture float`: touching no floor, wall, ceiling or other piece; each named with its height.
- `WARN N pieces of furniture stand on ... under half their footprint`: set on others, not on the floor or a wall,
  with less than half of what they stand on under them (on an edge or a corner when almost none): line each up
  with what holds it, unless it overhangs on purpose (a shelf, a balcony).
- `fact sweep: ...` (after the compile): the drops a player can step off and be hurt by (over 210 units, a
  warning: mean it or rail it), glows and sprites with nothing solid within 32 (a fault: an `env_glow` or
  `env_sprite` the spec puts more than 32 from its room's surfaces and its furniture is refused before the build;
  a `light` entity in open air is only noted, since the game draws it not), and solid that touches nothing,
  floating in the air (a fault: a slab or a wall left between carved rooms). Every lamp the spec hangs below a
  ceiling has a rod and a shade, so none floats; `smak map-sweep <bsp>` sweeps any map.
- `FAULT links[n]: the wall ... share is N long`: too short for a way a player passes at ease.
- `FAULT N ways a player walks through are under 48 wide`: furniture, or walls, too close together where the
  walk test goes through; each is named by its place.
- `FAULT ... is dark`: a room whose floor is lit under 24 of 255 after the compile.
- `ERROR links[n]: ... not side by side`: the two rooms of a link do not share a wall.
- `fact <word>: picked ... / a GAP ...`: where each game texture came from.
- `CHANGED since the last build ...`: what this build changed from the one before of the same name.
- `FAULT size: its plan is ... where the spec asks ...`: the rooms reach further (or less far) than the size asked.
- `ROOMS`: every room's box and the light on its floor.

The pictures: the plan of the result (every entity marked with its number and class; beside the person's
drawing when one is given); a view of every room from high in its south-west corner, looking down across
it, lit by the map's own light; the same three times as bright when the map is dark; a section through
every staircase; a view at a man's height towards each room's props; and every model the map builds, one
by one and named, close enough to judge.
