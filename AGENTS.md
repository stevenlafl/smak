# SMAK: guide for the agent

SMAK (Studio Model Agent Kit) is a set of JavaScript modules for making and changing GoldSrc studio models: the
`.mdl` files Half-Life and its mods use for weapons, players, monsters and props. You, an AI agent, are its user.
You write short Node scripts over the library, run them, look at the pictures the kit draws, and repeat until the
model is right. The person you work for sees the result in their game. They also have a page for touching up
animations, events and textures by hand (`smak edit`); when they use it, the two of you share a project file, and
`editor/AGENTS.md` says how you work on it.

It also works on the game's **maps**: a compiled map (`.bsp`) read, checked, drawn and its entities changed; a new
map made from brushes in a script and compiled; texture files (`.wad`) read and made. See "Maps", below.

This file is the whole briefing. `docs/API.md` lists every function; `docs/ENGINES.md` covers GoldSrc against Xash;
`docs/MAPS.md` (a compiled map, and the pictures of maps) and `docs/MAPS-MAKING.md` (brushes and the compile) hold
the vocabulary for maps.

## What it needs

- **Node 18 or later.** Nothing else: no `npm install`, no browser, no compiler, no Blender, no studiomdl.
- **The mod's own model files**, for any work that changes an existing model. They are not in this kit. Ask the
  person where the mod is installed (for example `…/Half-Life/ts/models/`).
- A way for you to look at a PNG. You must look at what you make; see "The loop".
- **For a map**: the map's own file, and the game's folders when its textures are in `.wad` files (most maps').
  **To compile** a new map: VHLT, an outside program the person installs once (`VHLT_DIR`); everything else
  about maps needs Node alone.

First thing on a new machine, from this folder:

```
node test/selftest.mjs
```

It makes a model from nothing and exercises every part of the kit. If every test passes, the kit works here.

## What it can and cannot do

| It can | It cannot |
| --- | --- |
| Read everything in a `.mdl`: bones, meshes, textures, animations (with their activity, how far they travel, their box), events, attachments, hit boxes, bone controllers | Read Source engine models (`.mdl` version 44+), or `.smd` / `.qc` source files |
| Write a whole new model from triangles, with bones and animations | Write an animation of several blends into a new model (one that is there keeps and takes them) |
| Give a model, new or old, what a monster has: hit boxes (yours, or the ones studiomdl would make), attachments, bone controllers, where it sees from, each animation's activity and travel | Take a walk's travel out of its frames: you give the frames walking on the spot and say the travel. Say what a mod's code does with an activity or a hit group: that is the mod's |
| Make a model from a Wavefront `.obj` file (Blender, a script, any tool), with its `.mtl` and PNG or BMP pictures | Read `.fbx`, `.gltf` or `.blend`, or JPG or TGA pictures |
| Replace a mesh inside an existing model, keeping its skeleton and animations | Weight one vertex to several bones (the format has one bone a vertex) |
| Replace or add textures; recolour by palette; export and import PNG / BMP | Edit animations kept in separate `name01.mdl` files |
| Replace or add animations, and the events (sounds) on their frames | Show the engine's real lighting: its pictures are a plain stand-in |
| Add bones to a model | Run or test anything inside the game |
| Check a model against GoldSrc's and Xash's limits | |
| Draw a model from any side, or as the player sees a weapon, into a PNG | |
| Paint a model by where a point is on its body, across all its textures | Give the two sides of a body different marks where they share the same pixels of a texture |
| Add a body again as a new body in a texture of its own, and paint a garment on chosen islands of it | |
| Tell what an old picture is, pixel by pixel (mail, plate, a strap), as layers that every pass of paint reads, with the distance to their edges and their regions' places on the body | Tell what a picture shows without a rule from you: a layer is your function of colour, texture and place |
| Find a model's loose pieces and take them off; move a part between models on one skeleton | Put a body under armour that has none: taking such a piece off leaves a gap |
| Build a new shape from turned surfaces, tubes, ridges, bosses and thin sheets, each knowing where it is, and put it in a model as a new body on a bone | Bend a worn piece with the body: it hangs on one bone, as the game's own helmets and pauldrons do |
| Measure a worn piece against the head or body under it, and against the game's own of its kind | Tell whether it looks right on a moving body: draw the animations, and it still only shows in the game |
| Change a shape after its texture was painted, and carry the picture over to the new shape | Carry paint to a part that has no counterpart in the old shape: that is left to paint |
| Draw several models on one skeleton as one (a helmet on a head with an armour) | |
| Show models side by side in the person's browser, turning and animated | |
| Read everything in a compiled map (`.bsp`, GoldSrc's version 30): faces, textures, light, what is solid where, what is seen from where, entities | Read Quake's or Source's maps (versions 29, BSP2, `IBSP`, `VBSP`) |
| Draw a map: a plan from above with every entity marked, views from inside lit by the map's own baked light, several views in one picture, a side section with the floors' heights, the storeys side by side, a view through each doorway; what stands in it at its true size (its box, or its model where one is named, with its textures and their holes, in the body, skin, sequence, scale and angles its entity gives); its sprites and its sky's own picture, from the game's folders | Draw decals, a door open, an animation playing, or a monster's model that only its script names (unless you name it) |
| Walk a map with no game: which entities a player cannot reach on foot and why, which stand in something solid or hang, how wide and high each opening is, how far the walk is, where a player gets in and not out again (a one-way place), which floor is too steep to stand on, and with jumps what only a jump reaches | Play the rest of the game's movement: friction, a door's push, speed gained in the air, what a monster's AI or a script does. The walk test is geometry with the engine's numbers, never measured against the game |
| Change a compiled map's entities: move a start, add a monster, change a door's keys, take a point entity out | Change the brushes, the light or the visibility of a compiled map: that is a recompile from its source |
| Make a new map from brushes in a script, check it and draw it before any compile, and compile it with VHLT (an outside program) | Compile without VHLT; cut one brush by another; place brushes by hand as an editor does |
| Read a `.wad`, take a map's textures out as pictures, and make a `.wad` from pictures | Run the game: a door that opens, a trigger that fires and a script that runs only show there |

When a task needs something in the right-hand column, say so to the person instead of working round it silently.

## The loop

Every task goes the same way. Do not skip the last two steps: a model that parses can still be inside out, tiny,
or held by the wrong end, and only the picture shows it.

1. **Look at what is there.** `node bin/smak.mjs info model.mdl`, then `sheet` or `strip` to see it.
2. **Write a script** in a working folder of your own (not inside this kit) that reads the model, changes it and
   writes the result to a **new** file.
3. **Check it.** `check(mdl, "goldsrc")` in the script, or `node bin/smak.mjs check out.mdl`. Fix every error.
4. **Draw it and look at the PNG.** Compare with the picture from step 1. Iterate on the script.

Always start from the original file, not from your last output: every change appends to the file and leaves the
old data unused inside it, so stacking runs makes it grow. Keep the originals untouched and write elsewhere.

## The command line

```
node bin/smak.mjs info <mdl> [--json] [--hitboxes] [--boxes]   bones, bodyparts with their body numbers, textures, animations
                                                   (activity, travel and speed), events, attachments, hit boxes
node bin/smak.mjs check <mdl> [--engine xash]      errors and warnings; exit code 1 on an error
node bin/smak.mjs sheet <mdl> -o s.png             six views in one picture
node bin/smak.mjs render <mdl> -o r.png --yaw 30 --pitch 15 [--view first|side|front|top] [--ground]
node bin/smak.mjs strip <mdl> -o a.png --seq reload --count 12 [--view first]   (a walk: --view side --ground)
node bin/smak.mjs textures <mdl> -o dir [--bmp]    every texture as a file
node bin/smak.mjs uv <mdl> -o dir                  every texture with the triangles that wear it drawn over it
node bin/smak.mjs islands <mdl> [-o dir] [--body n]  the islands each picture is cut into, listed; with -o, drawn tinted and numbered
node bin/smak.mjs layers <mdl> [layers.mjs] ["name=expression" ...] --texture t [--body n] [-o l.png]
                                                   layers of a texture (what is mail, what is strap): their regions listed; with -o, drawn tinted
node bin/smak.mjs retexture <mdl> <texture> <picture> -o out.mdl
node bin/smak.mjs sequence <mdl> <anim> -o a.json  /  sequence-set  /  sequence-add
node bin/smak.mjs inline <mdl> -o out.mdl          put the textures of <name>t.mdl inside the model
node bin/smak.mjs obj <file.obj> -o out.mdl [--scale n] [--up y|z] [--turn deg] [--ground] [--centre] [--name x.mdl]
                                                   a model from a Wavefront .obj, its .mtl and pictures found beside it
node bin/smak.mjs pieces <mdl> [--body n]          its loose pieces, each with its number, place and size (--body: that body's only)
node bin/smak.mjs view <folder|mdl> [more ...]     the viewer, for the person: two models side by side in the browser
node bin/smak.mjs mcp --work <dir> [--models <dir>]  the kit as an MCP server, for a client with no shell (mcp/README.md)
node bin/smak.mjs edit <folder|mdl>                the editor, for the person: animations, events and textures by hand
```

For maps (their recipes are under "Maps"):

```
node bin/smak.mjs map-info <bsp> [--json]          size, lumps, entities by class, textures and which are wanted from .wad files, light
node bin/smak.mjs map-check <bsp> [--engine xash] [--game <folder> ...]   errors and warnings; exit code 1 on an error
node bin/smak.mjs map-check <bsp|map> --mod <profile.mjs|.json|goldsrc> [--fgd <file.fgd>] [--learned <file>] [--game <folder> ...]
                                                   its entities against the mod: classes, keys, values, names, the mod's rules, files
node bin/smak.mjs map-learn <folder of .bsp> -o learned.json [--class name]   what a mod's own maps say of its entities
node bin/smak.mjs map-entities <bsp> [--class x] [--json]   every entity with its number, class, place and keys
node bin/smak.mjs map-set <bsp> -o out.bsp --entity <n|class> key=value ... [--move x,y,z] [--unset key]
node bin/smak.mjs map-set <bsp> -o out.bsp --add <class> [--at x,y,z] key=value ...   /   --remove <n|class>
node bin/smak.mjs map-plan <bsp|map> -o p.png [--z height] [--area x0,y0,x1,y1] [--scale px] [--list]   from above, entities marked
node bin/smak.mjs map-view <bsp|map> -o v.png [--from x,y,z | --at <entity n|class>] [--yaw 90] [--pitch 0]   from inside
node bin/smak.mjs map-views <bsp> -o v.png [--count 8]   from the places to start and the largest rooms, in one picture
node bin/smak.mjs map-reach <bsp|map> [-o walked.png] [--goal <n|class>] [--jump] [--doors closed] [--open <name>] [--shut <name>]
                                                   the walk test: what is not reached and why, what stands in solid, the openings,
                                                   the one-way places (--exit <name>: a way out of the map); exit code 1 on a fault.
                                                   --jump: with jumps, up 45 and across gaps (--speed 320 --gravity 800); --no-slopes
node bin/smak.mjs map-section <bsp|map> -o s.png --from x,y --to x,y   a side section along that line, floors with their heights
node bin/smak.mjs map-storeys <bsp|map> -o s.png [--z a,b,c] [--reach]   one plan for each storey, side by side
node bin/smak.mjs map-openings <bsp|map> -o o.png [--both]   a view through each gate and doorway the walk test finds
node bin/smak.mjs map-textures <bsp> -o dir        every texture of a map as a PNG
node bin/smak.mjs wad <file.wad> [-o dir]          a .wad's textures listed; with -o, each as a PNG
node bin/smak.mjs wad-make <pictures...> -o out.wad   a .wad from PNG or BMP pictures, each named after its file
node bin/smak.mjs map-compile <file.map> -o out.bsp --wad a.wad [--wadinclude] [--fast] [--vhlt <folder>]
node bin/smak.mjs map-compile <file.map> ... [--timeout 600 | --timeout hlvis=600,hlrad=1200] [--progress]   a stage seen and stopped
node bin/smak.mjs map-light <bsp> [--rooms rooms.json]   the light on the floors, room by room: what the game lights a figure by
node bin/smak.mjs scripts <script folders, maps...> --mod <profile> [--shipped <folder>]
                                                   each script of one's own: replaces a game's, is named, or is named by nothing
node bin/smak.mjs item <piece.mjs> --mod <profile> --game <mod> --family <name> --name <word> -o dir [--pictures]
                                                   a new weapon, shield or bow in the game's own model files, and its script's numbers (docs/ITEMS.md)
node bin/smak.mjs play <url> --map <name> [--steps steps.json] -o dir [--mod <profile>] --playwright <folder>
                                                   the map in the game itself, where the person has a browser build of it and Playwright:
                                                   entered, walked, spoken in, pictures taken, and every line the game says written down;
                                                   steps wait for a line (until) and a run passes or fails by lines (expect): docs/PLAY.md.
                                                   --serve keeps the game up and --attach runs in it: seconds a run, not a minute
```

The three that draw take `--width`, `--height`, `--game <folder>` (the mod's folder, then `valve`: where the map's
`.wad` files are; the map's own folder is always looked in), `--wad <file.wad>`, `--no-light`, `--light steady|all`,
`--brightness n` and `--entities all|models|game|none`. `map-plan` also takes `--heights` (each floor's height
written on it), `--legend` (the entities listed beside it) and `--reach` (the walk test tinted on it). An
entity that stands is drawn as the box it moves with: `--body <class|targetname>=large` says which box;
`--models` draws the models that are named, from the `--game` folders, and `--model <class|targetname|scriptfile>=models/x.mdl`
names one. With `--game` the sky is its own picture and each sprite its first frame (`--no-sky`, `--sky r,g,b`,
`--no-sprites` say otherwise); `--no-model-scale` draws models at their own size. Every one of these commands
takes `--mod <profile>` as `map-check` does (with `--game`, and `--scripts <folder>` for scripts not in the
game yet): the mod's folders, the box each of its classes moves with, its ways out for the walk test and, with
`--models`, the model the mod gives an entity that names none: a monster is then drawn as the model its
script picks, with nothing named by hand.

`view` keeps running until stopped: start it in the background, give the person the address it prints, and stop
it when they are done. It is for them to look and compare; your own checking is still `render`, `sheet` and
`strip`, whose pictures you can read.

`render`, `sheet` and `strip` take `--seq <name|number|rest>`, `--frame`, `--body`, `--skin`, `--width`,
`--height`, `--no-light` (the texture as it is) and `--no-cull` (both sides of every triangle). `--view side`,
`front` and `top` look from there with no perspective (`side` is the left side: the front is to the picture's
left), and with `side` or `front`, `--ground` draws the floor (z = 0) as a line across the picture.

**If a picture comes out empty**, the body number shows an empty submodel. Many models keep a blank submodel at
body 0. `info` lists the body number of each submodel; pass it with `--body`.

**Which way is the front depends on the pose.** Yaw 0 looks at `+x`, and a model faces `+x` *as its animations
stand it*. Its rest pose (`--seq rest`, `seq: null`) can be turned from that: one armour's bones rest a quarter
turn from frame 0 of its animation, so that "front" at rest showed its side, and a point measured at rest was
not where the animated model had it. Draw, measure and paint in a pose the game shows (`--seq 0`, or
`{ seq: "idle", frame: 0 }`), use the same pose for every step of a job, and compare one picture at rest with
one animated before trusting either.

## Bought models (docs/IMPORT.md)

`smak import <file>` first: it says the axes, units, size at true scale, meshes, materials and which picture
it found for each. Readers give GoldSrc's axes (+x forward, +z up) in the file's units, with v counted from
the top. Fit sizes (`--fit`): packs are not to scale. For a weapon use `smak item <file.fbx> --family ...`,
read the `assumed:` lines, and look at `--pictures`; correct with `--axis/--grip/--flip/--as`. For a rigged
file use `--anim`, then `smak strip`. A bone count over 128 is refused; one bone a point. Never copy a bought
file into a repository: its licence almost always forbids it.

## Testing in the game, and maps beside the game's

- To test a fight, write `{ "fight": { "heal": 0.5, "post": [...] }, "until": "<the line that ends it>" }`,
  not a loop outside: the summary line is the measure of difficulty.
- A held mouse button charges in Master Sword: use `tap`.
- `map-measure new.bsp game.bsp --every --mod <profile>` and `map-compare new.bsp game.bsp -o same.png --z
  100,-` set a new map beside the game's.

## How a studio model is put together

You need this model in your head; the API mirrors it exactly.

- **Bones.** A tree. Each has a rest position and rotation relative to its parent. Hand and weapon bones of
  first-person models are usually named `Bip01 R Hand` and the like; check with `info`.
- **Bodyparts → submodels → meshes.** A model has bodyparts (`weapons`, `arms`). Each bodypart holds submodels,
  of which the game shows one, chosen by a **body number**. Each submodel holds meshes, one per texture.
  A file like `v_knife.mdl` may hold several weapons as submodels of one bodypart.
- **Vertices live in the space of one bone.** Each vertex belongs to exactly one bone and is stored relative to
  it. To get a point in model space, multiply by that bone's matrix: `apply34(pose[bone], p)`.
- **Textures** are inside the file: 8 bits a pixel with a 256-colour palette each. Texture coordinates are stored
  in **pixels** of that texture, from its top left.
- **Animations (sequences)** hold, for each frame and each bone, six numbers: position x, y, z from the parent and
  rotation about x, y, z in radians. Events (a sound, a muzzle flash) are fastened to frames.
- **Attachments** are named points on bones: where a muzzle flash or a shell appears.
- **Hit boxes** are boxes on bones, each in its bone's space and each with a **group** (head, chest, a leg):
  what a shot or a blow is traced against, and by the group, how much it hurts. A model with none is traced
  as its entity's one box.
- **An animation also says** an **activity** (the number a monster's code asks for "a walk" by, whatever
  the animation is called), **how far the model travels** in one play of it (`movement`; the frames
  themselves stay on the spot, and the game moves the monster at the speed that makes), and a **box** about
  the model through its frames, by which the engine decides whether it is in view.
- **Bone controllers** are bones the game's code turns by itself: a head that follows, a mouth that talks.

### Conventions

| | |
| --- | --- |
| Axes | `+x` forward, `+y` left, `+z` up. A model faces `+x` as its animations stand it; its rest pose may be turned from that (see "The command line"). |
| Units | About an inch. A player is 72 tall; a pistol about 8 long. |
| First-person models | The eye is at the model's origin looking along `+x`. |
| Matrices | 3 rows of 4 (`[[r r r t] ×3]`), taking a bone's space to the model's. `mul34`, `apply34`, `inverse34`. |
| A piece's own axes | `+x` its length (grip or butt at low x, tip at high x), `+y` its width, `+z` its thickness. |
| A triangle (in the kit) | Three corners `{ p: [x, y, z], uv: [u, v] }`, `uv` from 0 to 1 from the picture's top left. |
| An image | `{ width, height, rgb }`, three bytes a pixel. |
| A texture | `{ name, width, height, pixels, palette, flags }`: one palette index a pixel, 768 bytes of palette. |
| Texture flags | 1 flat shaded, 2 chrome, 4 full bright, 32 additive (a glow), 64 masked (palette index 255 is a hole). |
| Which way triangles go | Decided for you by `meshOf` / `buildMdl` / `swapMesh`. `check` reports triangles that face inwards. |

## Rules that keep a model working in the game

1. **Never reorder or remove animations.** Game code plays a weapon's animations by number (`info` lists them in
   order). Replace one where it stands (`replaceSequence`) or add after the last (`addSequence`).
2. **Never renumber submodels, bones or attachments** of a model the game already uses. Everything in this kit
   that adds, adds at the end, so numbers stay. Do not work round that.
3. **Keep an animation's frame count and rate close to the original** when the game times something by it (a
   reload that fills the magazine when the animation ends). If you change its length, tell the person.
4. **Keep to the engine's limits.** Run `check` for `goldsrc` unless told the target is Xash only. The ones you
   will meet: 2048 vertices and 2048 normals a submodel, and 128 bones (errors). A texture may be of any size,
   and the games' own files have sizes like 488x498: GoldSrc stretches a side that is not a power of two to one
   when it loads the model, a little softer (`check` only notes it), and draws a side over 512 shrunk (a
   warning). So a texture you replace keeps the size it had, whatever that is; for a new one, 256x256 and
   512x256 are the sizes drawn exactly as painted.
5. **Keep texture names unique** inside one file, and end them in `.bmp` as the format expects. `retexture`,
   `replaceMesh` and `putBody` wear the file's own texture when given one of a name it has. On a model with
   several skins, give a replaced texture the size it had, or replace every texture a mesh wears across its
   skins at the same new size: `replaceTexture` says on the console when they are left apart.
6. **Never write over the mod's original files.** Write to a working folder; the person installs the result.
7. **Do not copy a game's models or textures into this kit** or into anything that is shared: they belong to the
   game's authors.
8. **A new model file has to be named when the map starts.** The engine loads (precaches) models as a map
   begins, and refuses one asked for later. Tried in Master Sword: a new `.mdl` showed only once a script that
   runs at map start named it; a script that first named it during play did not get it loaded. So a model
   under a **new file name** needs the mod's code or scripts to name it at map start; a model that **replaces**
   a file the game already loads needs nothing. Ask the person which it is before choosing a file name.

## Recipes

Each has a runnable example in `examples/`. Read the example first; it is the template.

### A new texture on an existing model (reskin): `examples/03-reskin.mjs`

The least risky change. Three ways, cheapest first:

```js
import { readFileSync, writeFileSync } from "node:fs";
import { textureOf, replaceTexture, textureFrom, check } from "./smak/src/index.mjs";

const src = readFileSync("v_knife.mdl"), old = textureOf(src, "knife.bmp");
// 1. the palette alone: every pixel keeps its place
const dark = replaceTexture(src, "knife.bmp", { ...old, palette: old.palette.map((v) => Math.round(v * 0.6)) });
// 2. a picture painted elsewhere (PNG or BMP, any size): corners are moved to match a new size
const mine = replaceTexture(src, "knife.bmp", { ...textureFrom(readFileSync("painted.png"), old.name), flags: old.flags });
```

Before painting, run `smak uv` to see which part of the picture each part of the shape takes its colour from.
To paint by rule, turn the texture into an image (`rgbOf({ width, height, rgba: rgbaOf(old) })`), change its
`rgb`, and bring it back with `indexed(image, old.name)`. A masked texture (flag 64) goes through `masked` so
that its holes stay holes.

### A new shape in place of an old one: `examples/02-swap-mesh.mjs`

Use this for any weapon or item the game already has a model for. The model keeps its hands, bones, animations,
events and attachments, so the game notices nothing.

```js
import { swapMesh, indexed, shrink, check } from "./smak/src/index.mjs";

const piece = makeMyPiece();                       // { tris, image }: see "Making a shape"
const texture = indexed(shrink(piece.image, 2), "mygun_smak.bmp");
const { mdl, report } = swapMesh(src, { body: 3, piece, texture, size: "own" });
```

- `body`: the number `info` shows beside the submodel to replace.
- `pick`: which of its meshes are the old piece. By default all but those whose texture name contains `hands`,
  `arms` or `body`. If the mod names its hand textures otherwise, pass your own `(mesh) => boolean`.
- `size: "old"` stretches the piece to the old one's length (like for like). `size: "own"` keeps the size you
  drew it at, in units, and holds its low-x end (the grip) where the old one's was.
- `place: "bone"` skips the fitting: the piece's points are already in the space of the bone that carried the
  old one. Use it when the automatic fit turns the piece the wrong way; measure with `measure()` and `frameOf()`.
- `report.left` is how far the new outline is from the old, in units. Large means look closely at the picture.

A weapon usually has two or three models: `v_` (first person), `p_` (in another player's hands) and `w_` (lying
in the world). Do all of them, the world ones with a smaller texture (`shrink(image, 4)`).

### A whole new model: `examples/01-new-model.mjs`

For a prop, a pickup, a thrown thing, something worn. `buildMdl` takes bones, triangles, textures and
animations and returns the file. Unless told (see "A monster from nothing") it has no hit boxes or
attachments. For a first-person weapon, whose animations and attachments the game's code knows by number,
swap a mesh in an existing one instead.

### From an .obj file: `examples/06-from-obj.mjs`

For a shape made elsewhere: Blender, a script, any tool that writes Wavefront .obj. One line when the .obj has
its .mtl and its pictures (PNG or BMP) beside it:

```
node bin/smak.mjs obj hut.obj -o hut.mdl --scale 39.37 --ground
```

or in a script, where the pictures are yours to read:

```js
import { readObj, objModel, check, sheet, png } from "./smak/src/index.mjs";

const obj = readObj(readFileSync("hut.obj", "utf8"), { mtl: readFileSync("hut.mtl", "utf8") });
const textures = { planks: readFileSync("hut_planks.png") };          // by material: a PNG or BMP file, a texture or an image
const { mdl, warnings, report } = objModel(obj, { name: "hut.mdl", textures, scale: 39.37, up: "y", ground: true });
console.log(warnings, report.textures, check(mdl).errors);            // then draw it: sheet(mdl, { seq: "idle" })
```

- **Which way is up, and which is the front.** An .obj is usually `+y` up with its front towards `+z` (what
  Blender writes unless told otherwise: "Forward -Z, Up Y"); `up: "y"`, the default, stands it up with that
  front towards `+x`. A file already in GoldSrc's axes takes `up: "z"`. If the drawing shows it facing the
  wrong way, `turn: 90` (or 180, 270) turns it about its upright axis. Look at the `sheet`: "front" must be
  the front.
- **Size.** An .obj has no units and a unit of the game is about an inch: `scale: 39.37` for a file in metres,
  `0.3937` for centimetres. The command prints the model's size in units; a player is 72 tall.
- **Where the origin goes.** As in the file, unless `ground: true` (its lowest point at z = 0: a thing that
  stands on the floor) or `centre: true` (its middle at the origin: a thing that is thrown or carried).
- **Materials.** One mesh and one texture a material, named after it. A material with `map_Kd` wears the
  picture you hand over under its name; one with `Kd` alone, or whose picture is missing, a small flat
  picture of that colour. A picture over 512 a side is made smaller (`maxTextureSize`).
- **Smooth and sharp.** Where the file has normals (`vn`) they are kept, so the model is lit as the tool that
  made it lit it: faces that give a point the same normal are smooth across it and the others meet in a crease
  (triangles whose normals look the other way from their faces have theirs worked out, with a warning). To
  `putBody`, say `ownNormals: true` to keep them. Without normals its
  smoothing groups (`s`) say it; without either, faces that meet at less than 40 degrees are smooth.
- **Read `warnings`** (the command prints them): triangles of no area left out, a picture made smaller or not
  given, texture coordinates that repeat the picture (it is then laid side by side in a larger texture, since a
  studio model's picture is not trusted to repeat), and a model of more points than a submodel holds (2048), which
  is shared out over several bodyparts, all shown by body 0 (with a faint line in the light where two meet on a
  smooth surface, when the file has no normals of its own): a shape for GoldSrc is better made with fewer.
- It has one bone, `root`, at the origin and one still animation, `idle`: a prop, a pickup, scenery. No hit
  boxes or attachments.
- **As a new body of a model that is there** (a pack on a back, a helmet): `objMeshes(obj, { up: "y", scale })`
  gives the triangles stood up, one list a material, and `putBody` takes a list as it is:
  `putBody(src, { name: "pack", tris: objMeshes(obj).meshes[0].tris, texture, bone: "Bip01 Spine2", pose: { seq: 0, frame: 0 } })`.
  A body wears one picture, so make such a piece with one material. See "A new body from triangles".
- A face of more than three corners that bends inwards (concave) is cut wrongly: triangulate in the tool
  (Blender: "Triangulated Mesh" in the export).

### Animations: `examples/04-animate.mjs`

```js
import { readSequence, replaceSequence, addSequence, bones, events, setEvents } from "./smak/src/index.mjs";

const reload = readSequence(src, "reload");        // .frames[frame][bone] = [x, y, z, rx, ry, rz]
const b = bones(src).findIndex((x) => x.name === "Bip01 R Hand");
const frames = reload.frames.map((f, t) => f.map((v, i) => (i === b ? [v[0], v[1], v[2] - 2 * Math.sin(Math.PI * t / (reload.frames.length - 1)), v[3], v[4], v[5]] : v)));
let mdl = replaceSequence(src, "reload", { frames });                       // same place in the list
mdl = addSequence(mdl, { name: "inspect", fps: 30, frames, events: [{ frame: 10, event: 5004, options: "weapons/slide.wav" }] });
```

- A bone's numbers are **relative to its parent**. Moving the hand moves the fingers and whatever it holds.
- Rotations are Euler angles applied about x, then y, then z. Small edits to existing frames are safe; building
  a large rotation from nothing is easier by starting from a frame that already has the bone near where you want.
- To see a pose before writing it: `render(src, { pose: poseOf(src, frame), view: "first" })`.
- `strip` draws an animation frame by frame. Look at it: a wrist bent backwards is obvious in the picture and
  invisible in the numbers.
- Event 5004 plays a sound on the client; 5001 is the first muzzle flash. Read the mod's existing events with
  `info` and follow what it already does.
- A bone that has to move further than the file's scale for it allows is given a wider scale automatically, and
  the model's other animations are rewritten to match (same motion, very slightly coarser for that bone).

### A monster from nothing

A thing that walks, is hit and dies needs more of the format than a prop: `buildMdl` takes it all, and the
setters give it to a model that is there.

```js
import { buildMdl, HITGROUP, MOTION, check, strip, png } from "./smak/src/index.mjs";

const mdl = buildMdl({
  name: "beast.mdl", bones, bodyparts,                // as for any model; corners say their `bone`
  sequences: [
    { name: "idle", fps: 15, loops: true, frames: idle, activity: 1 },                       // ACT_IDLE
    { name: "walk", fps: 20, loops: true, frames: walk, activity: 3, movement: [48, 0, 0],   // ACT_WALK
      events: [{ frame: 4, event: 1004, options: "common/npc_step1.wav" }] },
    { name: "bite", fps: 20, frames: bite, activity: 30 },                                   // ACT_MELEE_ATTACK1
  ],
  hitboxes: { groups: { head: HITGROUP.head, spine: HITGROUP.chest } },   // or "auto", or your own list
  attachments: [{ name: "mouth", bone: "head", pos: [6, 0, -1] }],
  controllers: [{ bone: "head", type: MOTION.ZR, start: -60, end: 60 }],
  eyes: [0, 0, 30],
});
```

- **A walk is given walking on the spot**, and `movement` says how far one play of it carries the model:
  measure it off your own frames (how far a planted foot slides back is how far the body goes forward).
  `info` prints the speed it makes, `distance * fps / (frames - 1)`, in units a second: that is the speed the
  game moves the monster at while it plays, so a wrong `movement` is feet that slide. Half-Life's zombie walks
  at 72, its grunt runs at 304.
- **A looping animation's last frame is its first again.** The engine plays from the first frame up to the
  last and starts over at the first, taking the two for one moment: a walk of 20 steps has 21 frames, the
  21st a copy of the 1st. Every looping animation in the games' own files is made so; `check` warns of one
  that is not, naming the bone.
- **Write the animations as poses, not as numbers** (`src/animate.mjs`, exported as `animate`). A frame is
  six numbers a bone in the bone's own axes, which is no way to make a walk. Say the pose in the MODEL's axes
  and let the kit work the numbers out:

  ```js
  import { animate as A } from "./smak/src/index.mjs";
  const rig = A.rigOf(bones);                                              // a model's bytes, or a bone list
  const stand = A.poseOf(rig, { spine: { turn: { y: 8 } }, "arm.L": { turn: { x: -25 } } });
  const step = A.reach(rig, stand, { bones: ["thigh.L", "calf.L", "foot.L"], to: [10, 5, 2], level: true });
  const frames = A.animate(rig, { frames: 25, loops: true, keys: [{ at: 0, pose: stand }],
    each: (pose, frame, part) => /* the pose of this frame: put the feet with reach */ pose });
  const { speed, slide } = A.stride(rig, frames, { feet: ["foot.L", "foot.R"], fps: 20 });
  ```

  A `turn` is in degrees about the model's `x`, `y`, `z` (for a limb that hangs: `y` over 0 swings it back,
  `x` over 0 out to the left, `z` turns it about the upright), from where the bone rests and carried by its
  parent, whatever the bone's own axes are. `reach` bends a limb of two bones so that its end is at a place
  (a foot on the ground, by arithmetic). `mirror` changes left and right over. `animate` joins key poses by
  the shortest turn, eased, and closes a loop; `each` makes every frame from a formula, which is how a cycle
  is made to close by itself. Then MEASURE: `stride` gives the speed the planted feet ask for (set the
  sequence's `movement` to `speed * (frames - 1) / fps`) and how much they slide; `seam` a loop's gap;
  `track` where a joint goes. And LOOK: `strip(mdl, { seq, view: "side", ground: true })`, the feet against
  the line. Make the skeleton with every bone unturned at rest when it is yours to make: the numbers in the
  file are then the model's axes too. A stand-in body of a box a bone is enough to judge motion by, before
  the real body exists.
- **Hit boxes.** `"auto"` makes the ones studiomdl makes for a model whose source names none: for each bone a
  box about what it carries, reaching to the bones that hang from it. Give `groups` by bone (the bones under
  one take its group), or a list of your own boxes, each in its bone's space. `autoHitboxes(mdl)` returns
  the list without writing it; `setHitboxes(mdl, list)` writes one into a model that is there.
  `smak info --hitboxes` lists them with their sizes.
- **Activities** are the game's own numbers (`ACTIVITY` names the ones this kit knows; `info` on a monster of
  the game shows what its animations use). Several animations may share one, picked by `actweight`. A mod
  that plays animations by name (as Master Sword's scripts do) needs none: look at how its own monsters'
  files are made, and follow them.
- **Each animation's box** is measured for you from the model's points through its frames, as studiomdl does:
  nothing to do, unless you change frames by some way of your own.
- **Look at it from the side**: `strip(mdl, { seq: "walk", view: "side", ground: true })` (`smak strip ...
  --view side --ground`) draws every frame by one camera with the floor as a line: feet that sink, float or
  slide show there. It is still only a picture: how it moves in the game shows in the game.
- What the game does with all this is the mod's: its code or scripts name the model (rule 8), choose its
  size and its hull, and decide what a hit group or an attachment means. Ask the person, and read one of the
  mod's own monsters with `info` first.

### Wear, damage and markings by place: `examples/05-by-place.mjs`

A character has several textures and a wound, a burn or a layer of mud crosses them. `paint` calls your function
for every pixel that some triangle wears, with the point of the body that pixel colours:

```js
import { paint, surface, spot, workshop as W } from "./smak/src/index.mjs";

const pose = { seq: "idle", frame: 0 };                       // measure in a pose the model is usually seen in
const surf = surface(src, pose), hit = spot(surf, [20, 0, 50], [1, 0, 0]);        // the place on its front nearest that point
const { mdl, shared } = paint(src, ({ p, n, rgb, tex }) => {
  const d = Math.hypot(p[0] - hit.p[0], p[1] - hit.p[1], p[2] - hit.p[2]);
  const soot = Math.max(0, W.fbm3(p, 0.3, 7) - 0.6) * 5;      // noise in space: the same on both sides of a seam
  return W.mix(W.mix(rgb, [0.05, 0.05, 0.05], Math.min(1, soot)), [0.02, 0.02, 0.02], d < 0.6 ? 1 : 0);
}, { pose });
```

- `p` is in model space (units; `+z` up), `n` the way the surface faces, `rgb` the colour there now, 0 to 1.
  Return nothing to leave a pixel alone. The function is also told where it is in the model's own terms: `bone`
  (the name of the bone the point follows), `where`, `body` and `tri` (its mesh, body number and triangle),
  `tex`, `u`, `v` (the pixel) and `island` (the patch of the picture it is in), and what the picture was there before
  any painting (`orig`, `busy`, and the `layers` you declare): see the next recipe.
- Make stages by building each from the **original** with more in the function, not by painting over the last.
- **Read `shared`.** It gives, for each texture, the share of its pixels that two places of the body both wear.
  Arms, legs and gear are often mirrored like that: a mark on the left shows on the right. Tell the person when a
  one-sided mark they asked for cannot be one-sided. Trousers and torsos are usually not shared.
- Textures keep their size and are cut back to 256 colours each, once a call. A masked texture keeps its holes.
  Painting the result again cuts it again: for several layers give one call a list of passes (next recipe).
- The palette alone (recipe "A new texture") is still the way to change a colour everywhere: a team colour, a
  camouflage. Turn only the colours that are clearly coloured and leave the greys, or the reverse.

### A garment or a plate over an old picture: layers, then passes, with soft edges

How a game adds an armour or a uniform: the same body again as a new body, wearing a texture of its own that
begins as a copy of the old one. Two things say where paint goes. The picture of a body is cut into **islands**
(the trunk's front, its back, a sleeve, a boot), and a garment belongs on some of them. And the old picture says
what each pixel **is** (mail, plate, a strap, a rim line): you declare that once, as **layers**, and every pass
reads them, however much the passes before have painted over.

Three steps, each with a picture to look at before the next.

**1. The body and its islands.**

```js
import { copyBody, uvIslands, layersOf, layerMap, paint, textureOf, png, workshop as W } from "./smak/src/index.mjs";

const base = copyBody(src, "armor", "orchard", { ...textureOf(src, "armor1.bmp"), name: "orchard.bmp" });
const body = 40, pose = { seq: 0, frame: 0, body }, TEX = "orchard.bmp";          // its number: `info` lists it, after the bodies that were there
const mine = uvIslands(base, pose).list.filter((e) => e.tex === TEX && e.uses.some((u) => u.body === body));
const FRONT = mine.find((e) => e.tris > 50 && e.bones[0].startsWith("Bip01 Spine") && e.n[0] > 0.5).id, LEGS = mine.find((e) => e.tris > 60 && e.bones.some((b) => /Leg$/.test(b))).id;
```

`smak islands base.mdl --body 40 -o dir` draws them numbered and lists their ids, boxes, bones, places and the
way each faces; `uvIslands(src, pose).list` is the same list for a script. Choose by `id` read off the picture,
or by `tex`, `bones`, `mid`, `n` (`n[0] > 0.5` looks forwards) and `tris`. An island that two bodies lay on the
same pixels counts its triangles for both in `tris`; `bodies` has the count for each.

**2. The layers, declared from the old picture, and looked at.**

```js
const lum = (c) => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
const LAYERS = {
  mail: { fn: ({ busy, blur }) => busy(3) > 0.25 && lum(blur(5)) > 0.05, drop: 90, smooth: 3 },       // told by its texture, not its colour
  leather: { fn: ({ rgb: [r, g, b] }) => r > g + 0.05 && lum([r, g, b]) < 0.3, blur: 2 },
  plate: ({ rgb, layer, dist }) => dist.mail < -1.5 && layer.leather < 0.2 && lum(rgb) > 0.2,         // a later layer reads the ones before it
  strap: ({ rgb, layer, island, v }) => island === LEGS && v > 400 && layer.mail < 0.5 && lum(rgb) < 0.12,
  buckle: ({ rgb, island, v }) => island === LEGS && v > 400 && rgb[0] > rgb[2] + 0.08 && lum(rgb) > 0.2,
};
const L = layersOf(base, LAYERS, { pose, tex: TEX }), map = layerMap(base, TEX, L);
writeFileSync("layers.png", png(map.width, map.height, map.rgba));                 // look at it before painting
// things found by rule, with their place on the body: each buckle, and the strap it sits on
const straps = L.buckle.regions.filter((b) => b.size >= 60).map((b) => { const parts = L.strap.regions.filter((r) => r.size >= 100 && b.mid[2] > r.mn[2] && b.mid[2] < r.mx[2]); return { z0: Math.min(...parts.map((r) => r.mn[2])), z1: Math.max(...parts.map((r) => r.mx[2])), at: b.centre }; });
```

- A layer is a number from 0 to 1 a pixel, from a function of what `paint` hands its own (`rgb`, `p`, `island`,
  `u`, `v`, `edge`, `blur`...) or from an image (`{ image }`: a mask painted by hand). It is made from the
  picture **as it was**, over every pixel the pose's triangles wear.
- **`busy(r)`** measures local contrast: about 0.03 on smooth plate, 0.35 on mail's chequer. Mail and plate are
  often the same grey; their texture tells them apart.
- **Clean a layer where you declare it**: `blur: 2` softens it (with `over: "lit"`, counting only the pixels of
  that earlier layer, so that it does not fade into a black shadow), `drop: 90` takes out regions under 90 pixels (a
  belt hole is not mail), `fill: 20` closes pinholes, `smooth: 3` straightens its boundary so that a rim drawn
  beside it is one even line.
- **Try a rule before writing it down**: `smak layers base.mdl "mail=busy(3)>0.25" "dark=lum<0.12&&!layer.mail"
  --texture orchard.bmp --body 40 -o try.png` draws the layers tinted over the texture and lists every region
  with its box, centre, size and place on the body. With the declarations in a module of their own
  (`export const layers = {...}`), `smak layers base.mdl layers.mjs -o l.png` draws the very ones the script
  paints with.
- **Regions** (`L.strap.regions`) are a layer's connected patches: `size`, `box` and `centre` in pixels, `mn`,
  `mx`, `mid` in model space. Find a thing by what it is and where it is ("the dark patches behind the knee,
  between z 11 and 14"), never by a pixel measured off a picture: the rule survives another model.

**3. The passes.**

```js
const TAN = [0.74, 0.57, 0.33], LINE = [0.08, 0.04, 0.03], PLUM = [0.19, 0.09, 0.14], copper = (l) => W.mix([0.09, 0.05, 0.03], [0.8, 0.59, 0.35], l);
const { mdl, shared } = paint(base, [
  // 1. the ground: cloth where the old picture has mail, metal elsewhere, lit by the plate's own light (no mail or rim in the sum)
  ({ rgb, blur, layer }) => (layer.mail > 0.5 ? W.times(PLUM, 0.6 + 1.6 * lum(blur(5))) : layer.leather > 0.5 ? W.times(rgb, 0.8) : copper(lum(blur(5, { within: "plate", orig: true })))),
  // 2. a pale rim on the plate's side of the mail's edge, a dark line inside it: one expression on the distance
  { soft: 3, fn: ({ dist }) => (dist.mail > -2 && dist.mail <= 0 ? TAN : dist.mail > -3 && dist.mail <= -2 ? LINE : undefined) },
  // 3. a mark on the chest, by place, kept clear of the rim
  { soft: 3, islands: [FRONT], fn: ({ p, dist }) => (dist.mail < -4 && Math.hypot(p[1], p[2] - 55) < 2 ? [0.35, 0.06, 0.04] : undefined) },
], { pose, only: [TEX], layers: L, islands: mine.map((e) => e.id) });
```

- **`layer.mail`** is the layer at the point asked about; **`dist.mail`** how far that point is from the layer's
  edge in pixels, **over 0 inside it and under 0 outside**: `0 < d && d < 2` is a band just inside the edge,
  `-2 < d && d < 0` one just outside. `region.mail` is the id of the region there. `layerAt(name, u, v)` and
  `distAt(name, u, v)` read any other pixel; `distSmooth(name, r)` is the distance averaged, when the layer was
  not declared `smooth`.
- **Passes.** A list in place of the function: each pass sees in `rgb` what the one before left, in full colour,
  and the picture is cut to 256 colours once, after the last. A pass is a function, or `{ fn, islands, only,
  soft, pose }` where it differs from the call's options. Do not chain `paint(paint(...).mdl, ...)` for layers.
- **`orig(u, v)`** is the picture as it was before the first pass, from any pass (`orig()`: this pixel);
  `at(u, v)` and `blur(r)` see what the pass before left.
- **`blur(r)`** is the picture smoothed over `r` pixels about this one, from this island only: an old picture's
  fine detail (the "ghost" of what the cloth covers) is lost and its shading kept. `blur(r, { within: "plate" })`
  takes only pixels of that layer, `{ not: "mail" }` leaves a layer out, `{ orig: true }` smooths the picture as
  it was: so a plate's light does not go grey beside its mail.
- **`islands: [ids]`** paints those and nothing else, as `only` does for textures. Without it a rule by place
  alone spills: a skirt's rim hangs on the leg bones, and a trunk and its arms are one piece in space.
- **`soft: 3`** asks the function at 3x3 points inside each pixel and averages: the edge of any shape decided by
  `p`, `u`, `v`, `edge`, `layer` or `dist` comes out soft instead of as a staircase. It costs nine calls a
  pixel; use it on the passes that draw shapes.
- **`edge`** is how far the pixel is from its *island's* border, in pixels, and `open` the same to the nearest
  open stretch of it, where no triangle goes on across it in space (a hem, an armhole, a neckline; Infinity when
  the island has none): a hem line is `open < 2`. A layer's `dist` is for boundaries that lie *inside* an island,
  as a plate's edge against its mail does. `per` is the units a pixel covers there.
- A pixel or so past an island's border is painted too, so that no seam of the old colour shows; where two
  islands touch on the picture, that pixel is the neighbour's edge.
- `copyBody` takes the body by its submodel's name or by its body number, and the texture as a name already in
  the file, a texture, or `{ name, ...image }`. The new body's number is the old count of submodels of that
  bodypart (times the bodypart's `base`): tell the person, since the game's scripts choose bodies by number.
- Read `shared` as before, and draw the result from four sides in the pose you painted in.

### Taking pieces off, and moving parts between models

```js
import { pieces, dropTriangles, graft } from "./smak/src/index.mjs";

const P = pieces(src, pose);                                  // P.list: [{ id, tex, tris, mid, mn, mx }]; `smak pieces` prints it
const { mdl } = dropTriangles(src, (t) => [59, 36].includes(P.of(t)), pose);          // those two pieces off
const helmetOff = graft(dropTriangles(src, (t) => HELMET.includes(P.of(t)), pose).mdl, other, (mesh) => /head/i.test(mesh.texture.name));
```

- A piece is a group of triangles that touch. Tell what each is from its place and size, then **draw the model
  without it before trusting it**: what looks like armour is often the body itself, with no limb under it.
  A gap in the picture means the piece has to stay.
- `dropTriangles` also takes any rule on a triangle's place: `(t) => t.mid[2] > 60`, or on the island of the
  picture it is in: `const I = uvIslands(src); dropTriangles(src, (t) => I.of(t) === 12)`.
- `smak pieces <mdl>` lists every submodel's pieces; `--body n` lists those of the submodels that body shows.
- `graft` needs both models on the same skeleton and finds bones **by name**, so the two files may number them
  differently. It throws when a bone is missing; with `{ missing: "ancestor" }` as its sixth argument the corners
  of such a bone (a head's jaw, on a body that has none) hang on the nearest bone above it that the target has.
  Draw a run or a jump afterwards: a part on the wrong bone shows at once in motion.
- To **look** at several models as one (a helmet on a head with an armour), nothing has to be grafted by hand:
  `sheet(together([{ mdl: armour, body: 40 }, { mdl: head, body: 3 }, { mdl: helmets, body: 34 }]), { seq: 0 })`.
- A new piece of gear made in the workshop goes into a model with `putBody`: see the next recipe.
- None of this touches bones, animations, hit boxes or attachments.

### A new body from triangles, in a model that is there

How a game adds a helmet, a pack or a weapon skin to a file of them: one more **body** (a submodel) after the
ones it has, chosen by its number. The triangles come from the workshop (see "Making a shape"); `putBody` puts
them in.

```js
import { putBody, indexed, check, sheet, png, workshop as W } from "./smak/src/index.mjs";

const M = W.shape(256, 256), S = W.sheet(256, 256);                          // the triangles and their picture
const BODY = { x: 4, y: 4, w: 200, h: 120 }, LID = { x: 4, y: 130, w: 60, h: 60 };
M.turn([[0, 3], [5, 3.4], { s: 6, r: 3, crease: true }], BODY, { name: "flask", sides: 10, caps: [true, { dome: 1.5, zone: LID }] });
S.zone(BODY, (u, v) => W.iron(u / 12, v / 12, W.cylinderLight(v / BODY.h), 7)); S.zone(LID, (u, v) => W.iron(u / 12, v / 12, 1, 9));

const { mdl, body, warnings } = putBody(src, { name: "flask", tris: M.tris, texture: indexed(S.image(), "flask.bmp"), bone: "Bip01 Pelvis" });
console.log(`body ${body}`, warnings, check(mdl).errors);                    // tell the person the number: scripts choose bodies by it
const six = sheet(mdl, { body, seq: 0 }); writeFileSync("flask.png", png(six.width, six.height, six.rgba));
```

- **`name`** makes a new body, after the others of its bodypart: its number is the old count (times the
  bodypart's `base`), and every body the game knows keeps its number. **`body`** instead (a number or a
  submodel's name) puts the triangles in that body's place.
- **`bone`** is the bone it hangs on, and the triangles' points are **in that bone's own space**: `[0, 0, 0]` is
  the bone's joint, and its axes are the bone's, not the model's (in a biped's head bone `+x` is up the head and
  `+y` forwards). Measure before building: `boxIn(src, body, bone)` gives the box of a body the game already
  hangs there. If you would rather build in model space, as the model stands in a pose, pass `pose: { seq: 0,
  frame: 0 }` and `putBody` takes each point into its bone's space.
- One bone a corner, so a piece does not bend: hang it on the bone that moves least under it (a spine bone for
  the back, a thigh for a holster). A corner may name its own `bone` where a piece spans two.
- **Read `warnings`.** They are also printed. One says that the body you replaced was painted for another
  layout (next recipe but one); one that the file already has a texture of that name with another picture, which
  the body then wears: give yours a name of its own, or change the file's with `replaceTexture`.
- `texture` is a texture, an image with a `name`, or the name of a texture the file has (a second body in the
  same picture: the woman's helmet beside the man's).
- A whole new **file** is `buildMdl` ("A whole new model"); a new shape in the place of a **weapon** the game
  holds is `swapMesh` ("A new shape in place of an old one"), which also fits it to the old one's grip.

### A helmet, or any worn piece: placed where the game's own sits, checked against what is under it

A worn piece that looks right alone can sit too high, cut through the head or float off the collar. Measure the
game's own piece of that kind first, build yours to those numbers, and check it by number and by picture.

```js
import { bodyIn, boxIn, facingOf, fitBetween, clearance, bodyCounts, putBody, together, lineup, png } from "./smak/src/index.mjs";

const HEAD = "Bip01 Head", theirs = bodyIn(helmets, 2, HEAD), box = boxIn(helmets, 2, HEAD);       // the game's great helm, in the head bone's space
const crown = facingOf(theirs.filter((t) => t.every((c) => c.p[0] > box.mx[0] - 1.6)));           // which way its top looks: how it is tilted
const tilt = Math.atan2(-crown[1], crown[0]), place = ([h, f, l]) => [h * Math.cos(tilt) + f * Math.sin(tilt), -h * Math.sin(tilt) + f * Math.cos(tilt), l];
const mine = makeMyHelm().map((t) => t.map((c) => ({ ...c, p: place(c.p) })));                    // built upright (h up, f forwards, l left), then stood as theirs stands

const head = bodyIn(reference, 3, HEAD, { only: true, bodypart: 1 }), fit = clearance(head, mine);
console.log(fit.fits, fit.outside, fit.tightest.gap, fit.tightest.at);                             // none outside; the tightest place and where
const woman = fitBetween(theirs, bodyIn(helmets, 16, HEAD));                                       // the game's woman's helm from the man's
const hers = mine.map((t) => t.map((c) => ({ ...c, p: woman.at(c.p) })));

const man = putBody(helmets, { name: "my_helm", tris: mine, texture, bone: HEAD }), both = putBody(man.mdl, { name: "my_helm_female", tris: hers, texture: texture.name, bone: HEAD });
const worn = (file, body) => together([{ mdl: armour, body: 40 }, { mdl: reference, body: 3, pick: (mesh, model) => model.name === "head_visible" }, { mdl: file, body }]);
const pic = lineup([["the game's", worn(helmets, 2)], ["mine", worn(both.mdl, man.body)]], { yaws: [0, 90, 180, 270], seq: 0, zoom: 2.7, target: [1.5, 0.5, 67.5] });
```

1. **Where theirs sits.** `boxIn(file, body, bone)` is a body's box in the bone's own space: its rim, its top,
   how far it stands off the face. `bodyIn` gives its triangles there, and `facingOf` of its top ones the tilt of
   its crown (one game's helmets lean 8 degrees forward of the head bone's axis: a helm built straight up the
   bone looks thrown back). `bodyCounts(file)` lists every body's triangles and their `median`: what a helmet
   weighs in that file.
2. **The head.** The player's body is usually another file on the same skeleton; `only: true` takes just the
   triangles on the head bone, `bodypart` the bodypart that holds heads (`smak info` lists them). The same bone's
   name means the same space in both files.
3. **`clearance(head, shell)`** counts the head's corners inside the shell, poking **outside** it, and **open**
   (not covered: the neck, below the rim), and gives the tightest place: `gap` units from the wall, at `at`. A
   lining, or a dark cone closing the inside, is not counted as wall. Aim for none outside and a gap of a
   quarter unit or more; a brow or a nose at 0.1 will flicker through.
4. **The other sex, or another build.** Games often keep a second body for each piece, a scaled and shifted
   copy. `fitBetween(theirs, theirOther)` finds that fit (`k`, `t`), from the points when the two have the same
   ones in the same order and from their boxes otherwise (`by` says which); `fit.at(p)` applies it to yours.
5. **Worn, in a picture.** `together` makes one model of the armour's body, a head and a helmet's body; draw it
   from four sides, zoomed on the head, next to the game's own worn the same way. Look at the collar: the rim
   must neither float above it nor cut into it. `clearance(armourPoints, mine)` counts what of the armour is
   under the helm.
6. Draw it alone from below as well (`pitch: -45`): an open helmet shows its inside, which is what a `lining`
   is for.

### Changing a shape after it was painted

A texture is painted for one layout: each pixel colours one place of the shape. Change the shape and the
painting may no longer fit, and nothing looks wrong until the model is drawn.

```js
const before = makeHelm(D), after = makeHelm({ ...D, WALL: taller });           // the same script, another description
const next = putBody(painted, { body: 36, tris: after.tris, texture: "helm.bmp", bone: "Bip01 Head" });
console.log(next.warnings);                // "64 in 100 of the pixels of helm.bmp that body 36 wears now colour another place..."
const { mdl, report } = carryPicture(painted, next.mdl, { body: 36, was: before.tris, is: after.tris, soft: 2 });
```

- **Keep each part in a zone of its own**, written down in the script (`workshop.allot` shares a picture out
  once; paste what it gives). A part that changes then moves nothing but itself, and a part that only moves in
  space (a finial that goes up with the crown) keeps its pixels as they are.
- **`putBody` warns** when the body it replaces was painted for another layout, and `layoutMoved(old, now,
  { body })` gives the share of pixels on its own.
- **`carryPicture(old, now, { body, was, is })`** repaints the new shape's texture from the old one. With `was`
  and `is` (the old and the new triangles, from the same script run with the old and the new description) it goes
  part by part: a ring that both have is the same place, so what was painted beside it stays beside it, and the
  bands that grew are stretched. Without them it goes by place: the nearest point of the old shape facing the
  same way, which is right wherever the shape did not move, and is also how the paint of a shape made another
  way is put on a new one (`{ body: 36, from: 34, tex: "new.bmp", fromTex: "old.bmp", reach: 1.5 }`).
- If the painting was done outside the file (dropped on a texture in the editor), hand it over: `picture:
  unpng(readFileSync("painted.png"))`.
- Read `report`: `lost` pixels found no place and are as the new file had them. A part with no counterpart (a
  lining where there was none) is yours to paint. Then draw before and after side by side.
- To add a ring **without** moving anything on the picture, give `turn` the old build's `places`
  (`M.turn(rings, zone, { places: old.places })`): the rings that were there stay on their pixels.

### Making a shape

A shape is a list of triangles and a painted picture. `src/workshop.mjs` gives the two tools:

```js
import { workshop, indexed } from "./smak/src/index.mjs";
const S = workshop.sheet(512, 256);                // the picture being painted
const M = workshop.shape(512, 256);                // the triangles being built

// a turned part: a barrel 10 long, radius 0.6, drawn in a zone of the picture
const BARREL = { x: 8, y: 8, w: 300, h: 60 };
const barrel = M.turn([[0, 0.6], [9.5, 0.6], [10, 0.5]], BARREL, { name: "barrel", sides: 10, caps: [true, true] });
S.zone(BARREL, (u, v) => workshop.iron(u / 12, v / 12, workshop.cylinderLight(v / BARREL.h), 7));
// a sight on top of it: a small ridge on the barrel's own surface, in a zone of its own
M.ridge(barrel, [[8.6, Math.PI / 2], [9.4, Math.PI / 2]], { x: 8, y: 76, w: 60, h: 12 }, { name: "sight", width: 0.2, height: 0.25, ends: ["run", "cut"] });

const piece = { tris: M.tris, image: S.image() };
```

**A turned surface: `M.turn(rings, zone, options)`.** Rings along an axis, joined: barrels, grips, pots,
helmets, bottles, magazines with `sides: 4`. A ring is `[s, radius]`, or an object when it is more than a circle:

```js
const dip = (a) => -2.2 * Math.max(0, Math.cos(a)) ** 3;                    // the rim drops at the front (angle 0): a chin
const wall = M.turn([{ s: 0.3, r: [5.25, 4.3], ds: dip }, [3.4, [5.5, 4.5]], [7.2, [5.5, 4.5]], { s: 9.9, r: [5.4, 4.4], crease: true }], Z.WALL, {
  name: "wall", sides: 16, seam: Math.PI, lie: "across", at: (s, a, b) => [s, 1 + a, b],
  caps: [false, { dome: 3.1, rings: 3, zone: Z.CAP }], lining: { inset: 0.12, zone: Z.INSIDE, to: 2, cap: 2.5 } });
```

- **A ring's outline**: `r` is a radius, `[ra, rb]` (an oval) or a function of the angle. `ds(angle)` moves its
  points along the axis (a rim that dips); `off: [a, b]` moves its centre; `tilt` leans it; `crease: true`
  makes a hard edge there (elsewhere bands that meet gently are smooth).
- **Caps**: each end `false` (open), `true` (flat), a number (a dome that high; under 0 a dimple), or
  `{ dome, rings, profile, zone }`. Give a dome a `zone` and it is laid there as a disc, the way a round thing
  is painted.
- **`lining`** is the inside: the same rings facing inwards, `inset` units in, in a zone of its own, with a
  `rim` between outside and inside and a `cap` that closes its far end. Without it an open shape seen from
  below shows nothing: the game draws a face from its front only.
- **`seam`** is the angle where the picture's two edges meet: put it at the back. **`lie: "across"`** stands
  the surface up in its zone (the turn left to right, the first ring at the bottom), the way a helmet's wall or
  a label is easiest to paint.
- **`at(s, a, b)`** places a point (x, y, z unless told): to stand a part on another, or along another axis.
- **The picture follows the real surface**: each band gets the share of the zone that it has of the shape, and
  a ring's `w` weighs its band up or down. `workshop.allot(width, height, { WALL: [girth, length], CAP: [...] })`
  shares a whole picture out by the parts' real sizes, which a surface reports (`length`, `girth`, `reach`): run
  it once, paste the zones into the script and keep them, so that a later change of shape moves none.
- It **returns the surface**: `wall.at(s, angle, out)` is the point of the built faces at `s` along and `angle`
  round, `out` units off them, with the normal there and its place in the picture: `{ p, n, uv }`. `wall.ends`
  are the middles of its two ends (the dome's point) and the way each looks: where a finial stands.

**On a surface.** These take the surface a `turn` or a `tube` returned, and a zone of their own:

```js
M.ridge(wall, [[0.9, 0], [7.0, 0]], Z.BAR, { name: "bar", width: 0.9, height: 0.21 });                  // a bar down the face
M.band(wall, 9.4, Z.BAND, { width: 0.6, height: 0.12 });                                               // a hoop round it
M.studs(wall, [[7.6, 0.4], [7.6, 2 * Math.PI - 0.4]], Z.RIVET, { count: 14, radius: 0.17, height: 0.1 });   // a row of rivets, one picture for all
M.boss(wall, [8.2, 0], Z.BOSS, { radius: 0.7, height: 0.3, rings: 2 });                                 // a domed stud on the brow
```

A path is `[[s, angle], ...]` on the surface. A ridge's `ends` are `"point"` (it narrows and falls to a point),
`"run"` (it falls into the surface at its full width), `"cut"` or `"open"`; its feet go a little under the
surface (`sink`) so that no gap shows. Whether a rivet is worth its eight triangles or is better painted is
yours to judge: a painted one costs nothing and reads as well from two steps away.

**Along a curve, and thin sheets.**

```js
M.tube([[0, 0, 13, 0.3], [0.5, 0, 15, [0.85, 1.3]], [-2.9, 0, 15.3, [1.3, 2]], [-5.4, 0, 12, 0]], Z.PLUME, { name: "plume", sides: 6 });   // x, y, z, radius: to a point
M.leaf([[[0, 0, 0], [0, 2, 0]], [[0, 0, 3], [0, 2, 3]]], Z.FLAG, { name: "flag" });                                                   // a grid of points: seen from both sides
```

- `M.tube(path, zone)`: a tube, a horn, a tail, a strap: `[x, y, z, r]` along its middle line, `r` a radius or
  `[up, sideways]`, 0 at an end for a point. It returns a surface too (`s` is the length along the path).
- `M.leaf(rows, zone)`: a plume's feather, a cloth flap, a leaf, a fin. One call makes both sides, each with
  its own normals, so it is there from both and lit on each. (A `plate` with no thickness is not: it shows
  from one side only.)

**The older tools**, still what the kits are made of:

- `M.lathe(profile, zone, options)`: the first turned solid. Its picture goes by the profile's own numbers and
  its seam is at angle 0; anything new is better made with `turn`.
- `M.plate(stations, zoneA, zoneB, options)`: a flat thing with a section and a thickness, two faces. Blades,
  slides, stocks.
- `M.quad` / `M.tri` with `M.V(point, [pixelX, pixelY])`: anything else, corner by corner. The last argument is
  a point inside the solid, so that the face is turned outwards for you.

**The picture.**

- `S.zone({ x, y, w, h }, (u, v) => [r, g, b])`: paints that rectangle; colours are 0 to 1.
- Materials: `steel`, `iron`, `wood`, `leatherWrap`, `rust`; noise: `fbm`, `noise`; shading helpers:
  `cylinderLight`, `bell`, `step`, `mix`, `times`, `rivet`.
- Or put the shape in a model first and paint it **by place** (`paint`): the function is told the point of the
  shape each pixel colours, so a seam line, a slot or a dent is placed in units on the shape and not in pixels
  on a zone, and nothing has to be worked out from the layout.
- **Paint the light into the picture.** The engine lights models softly and flatly; edges, bevels, grooves and
  wear have to be in the texture. Keep painted shadow gentle: the piece is seen from every side.

Every part the newer calls make names itself (`name`), and its corners carry that (`of`) with their place in the
part: it is what lets a painted picture follow the shape when you change it ("Changing a shape after it was
painted"). A shape's triangles are plain data: move them all with
`tris.map((t) => t.map((c) => ({ ...c, p: move(c.p) })))`.

`kits/` holds four finished builders made this way, each a function from a description to `{ tris, image }`:
`sword` (any blade: knives, katanas, machetes), `axe`, `blunt` (bats, clubs, hammers, batons) and `bow`. Their
headers document every option. For anything else (a firearm, a grenade, a tool), write the piece from `shape`
and `sheet` directly, a part at a time, checking each in a picture; the kits are the worked examples to read.

Budget: a first-person weapon of 300 to 1500 triangles with one 512x256 or 512x512 texture is typical for
GoldSrc; a world model a third of that with a 128 or 256 texture.

## Maps

A map is three kinds of file. Its **source** (`.map`) is text: brushes (convex solids) and entities (a light, a
door, a place to start). The **compiled map** (`.bsp`) is what the game loads: the brushes cut into faces, with
the light baked onto them and what is seen from where worked out, and the entities as text inside it. Its
**textures** are named in both and kept in `.wad` files, unless they were put inside the `.bsp`. Units are the
models': about an inch, `+z` up; on a plan `+x` is east and `+y` north. `docs/MAPS.md` and `docs/MAPS-MAKING.md`
hold the vocabulary; in a script, `import { maps, png } from "./smak/src/index.mjs"`.

The loop is the models' loop: look at what is there, change it in a script or with a command, check it, **draw
it and look at the picture**. Never write over a map of the game's: write a new file.

### Looking at a map

```
node bin/smak.mjs map-info gatecity.bsp                          what is in it
node bin/smak.mjs map-check gatecity.bsp --game <mod> --game <valve>   would the engine take it; are its .wad files there
node bin/smak.mjs map-check gatecity.bsp --mod <profile> --game <mod> --game <valve>   and would the mod: its entities, names, rules, files
node bin/smak.mjs map-plan gatecity.bsp -o plan.png              from above: where everything IS
node bin/smak.mjs map-views gatecity.bsp -o views.png            from each start and the largest rooms
node bin/smak.mjs map-view gatecity.bsp -o v.png --from -191,-802,-433 --yaw 90
```

- **The plan is the picture to find things by.** `+y` is up it and `+x` to its right. Every point entity is a
  dot (places to start, lights, monsters and the rest each in a colour), every brush entity an outline, each
  with its number, the one `map-entities` and `map-set` go by. The command prints each mark's pixel (`--list`
  for a big map). A big map labels only its starts: `--area x0,y0,x1,y1` draws a part closer.
- **A view is taken from a point inside** (`--from`, with `--yaw` 0 along `+x`, 90 along `+y`), or from an entity
  (`--at 12`, `--at info_player_start`). A start is looked from at a player's eye height. Read what the command
  prints under the picture's line: an eye "in solid" is inside a wall or outside the map.
- **The light is the map's own**, baked by its compiler, at about the brightness the game shows. A dark picture
  is a dark place (the line says so): `--brightness 4` looks into it, `--no-light` shows the textures alone.
- **What stands is drawn at its true size.** A place to start, a monster and an NPC are the box they move
  with (32 x 32 x 72; `--body name=large` for 64 x 64 x 64): in a view a box that stands on the floor, hangs
  over it or goes into it; on a plan its outline. `--models` (with `--game`) draws a prop that names its
  `.mdl` as that model, with its textures, in the `body`, `skin`, `sequence`, `scale` and `angles` its
  entity gives; a masked texture's holes are open, so a tree's crown hides what the game's hides and no
  more. A monster's own comes from its script: `--mod <profile>` with `--models` draws it where the
  profile can read it (`modelOf`), and `--model name=models/x.mdl` names one by hand. A door is
  drawn shut.
- **With `--game`, the sky is the map's own** (`skyname`: the six pictures of `gfx/env`) **and a sprite is
  drawn** (`env_sprite`, `env_glow`: its first frame at its `scale`, blended by its render mode; a small
  cross on a plan). `--entities game --no-labels` draws only what the game shows, with no boxes: the picture
  to lay beside a screenshot. A `{` texture has its holes only on an entity in render mode 4, as in the game:
  a view that says `N faces wear a \`{\` texture ... the game draws their holes filled` has found a fence
  with no `rendermode`.
- **One plan is one height.** `map-plan --heights` writes each floor's height on it; `map-storeys` lays a
  plan for each storey side by side; `map-section --from x,y --to x,y` cuts the map upright along a line: the
  picture for a cellar under a terrace, a stair, a ceiling's height, a thing sunk in the floor.
- **`map-reach` walks the map** from its places to start, as the box of a standing player: steps of 18, any
  drop, doors open, ladders climbed, a slope too steep to stand on (over 45.6 degrees) slid down and never
  walked up. It lists the entities that are not reached, each with what it would take (a jump, a crouch, an
  opening that is not there), those that stand in something solid, every opening with its width and height,
  and the **one-way places**: floor a player gets into and finds no way out of, by a step, a jump or a
  crouch (a pit, the foot of a steep slope, a room a teleport leads into). Mend each or mean it; `--exit
  <class|name>` names a way out of the map that is no fault. `--jump` walks with jumps (up 45, and across a
  gap as far as a run carries: 215 for the body's middle) and tells apart what only a jump reaches: a roof
  a player was not meant to stand on shows there. `-o` draws the plan with the walked floor green, the rest
  red, floor only a jump reaches blue and one-way places amber. It is geometry, not the game: say so when
  you report it. `map-openings` looks through each opening it found.
- **A crowded plan** writes an entity's number alone where its label has no room: `--legend` lists every
  number with its class beside the plan.
- A face in one flat colour is a texture that was not found: `--game` the mod's folder and `valve`, or `--wad`.
- In a script: `maps.planOf(bsp, { z, area })`, `maps.drawMap(bsp, { from, yaw })`, `maps.viewsOf(bsp)`,
  `maps.sectionOf(bsp, { from, to })`, `maps.storeysOf(bsp)`, `maps.openingViews(bsp)`, each giving `{ width,
  height, rgba, facts }`, and `maps.reachOf(bsp)` (`{ warnings, facts, entities, openings ... }`);
  `maps.contentsAt(bsp, point)`, `maps.floorUnder` and `maps.restOf(maps.spaceOf(bsp), feet)` answer "is this
  spot open, and does a body fit" before you put something there (`docs/MAPS.md`).

### Changing what is in a compiled map

Entities are read by the game when the map starts, so they can be changed with no compile:

```
node bin/smak.mjs map-entities gatecity.bsp --class ms_player_spawn        their numbers and keys
node bin/smak.mjs map-set gatecity.bsp -o work/gatecity.bsp --entity 266 --move -688,-3300,-330 "angles=0 90 0"
node bin/smak.mjs map-set gatecity.bsp -o work/gatecity.bsp --add monster_zombie --at 96,300,36 "angles=0 180 0"
node bin/smak.mjs map-set gatecity.bsp -o work/gatecity.bsp --entity 24 speed=40      a door's speed
node bin/smak.mjs map-plan work/gatecity.bsp -o plan.png                              the dot has moved: look
```

- One change a command, each from the file the last one wrote when several are wanted; in a script
  (`maps.moveEntity`, `setKey`, `addEntity`, `removeEntity`, then `maps.withEntities(bytes, entities)`) any
  number at once, from the original.
- **What takes effect**: where things and monsters stand and face, what they are, their keys, targets and
  scripts. A point entity's origin is its middle: a player's or a monster's is 36 over the floor for a
  standing one (`maps.floorUnder(bsp, point, { hull: 1 })`).
- **What does not, without a recompile from the source**: light (a `light` entity added or moved lights
  nothing: the light is baked into the faces), the brushes (a wall, a door's shape), what is seen from where,
  and collision. A brush entity cannot be added or taken out; it can be shifted (`origin`), hidden
  (`rendermode=2 renderamt=0`) or have its keys changed. The command says so in its last line every time.
- A new class the mod does not know does nothing; a monster whose model the game has not loaded on that map
  may be refused (rule 8). Look at how the map's own entities of that kind are written, and copy their keys.

### A new map

`examples/07-a-small-map.mjs` is the template; `docs/MAPS-MAKING.md` has the vocabulary (rooms carved out of
rock so that nothing can leak, boxes, stairs, arches, cylinders, lights, starts) and the sizes a player needs.

1. **Describe it in a script**: rooms as `{ min, max }` boxes of empty space (`maps.carve`), what stands in
   them, the entities. `maps.writeMap` gives the `.map`'s text.
2. **Check the plan**: `maps.checkPlan(map, { textures })`. Fix every error; read the leak hint. **For a mod,
   give its profile**: `maps.checkPlan(map, { mod })` (`smak map-check x.map --mod <profile>`). A map's
   entities are text that only the game's code reads, and what that code does not know it drops without a
   word: a class the mod does not have, a key on an entity where the game never reads it, a name nothing
   answers to, more monsters than an area holds. Neither a compiler nor a picture shows any of it. With a
   profile the check does: against the mod's FGD, its own maps (`smak map-learn <mod>/maps -o learned.json
   --class <name>` shows how the mod's authors write a class: copy that, do not guess), the classes its
   program has, and its rules. The kit ships Half-Life's profile (`maps.GOLDSRC`) and no mod's:
   `docs/MAPS-MAKING.md`, "A mod's profile", is how to get from nothing to a checked one, and
   `profiles/mastersword.mjs` is one mod's, as the example. **Never write an entity for a mod from memory.**
3. **Draw the source and look**: `maps.planOfSource(map)` and `maps.drawSource(map, { from, yaw })`, or
   `smak map-plan x.map -o p.png` and `smak map-view x.map -o v.png`. Flat colours, no light, a tenth of a
   second, no compilers: stairs in front of a doorway, a window in the wrong wall, a start outside its room.
   Mend the script and draw again until the shapes are right.
4. **Walk it and cut it**: `maps.reachOf(map)` (or `smak map-reach x.map -o walked.png`): fix every entity
   that is not reached or stands in something solid, mend or mean every one-way place, and read each
   opening's width and height against what has to pass it (a player 32 x 72, a large monster 64 x 64). Walk
   it once more with `{ jump: true }` (`--jump`) and read what only a jump reaches. `maps.sectionOf(map, { from, to })` through
   every stair and every place where one room lies over another, and `maps.storeysOf(map)`: rooms carved in
   separate `carve` calls fill each other with rock where their blocks overlap, and only a section or the
   walk test shows it.
5. **Compile**: `maps.compileMap(file, { wads })` or `smak map-compile`. It needs VHLT; ask the person where it is.
6. **Read what came back**: every error is a sentence. A **leak** names the entity it was found from and where
   the trail leaves the world: look at the wall there.
7. **Draw the result and look**: `smak map-plan`, `map-views`, `map-view` on the `.bsp`. Now the textures and
   the baked light are there: a lamp's colour, a room left dark, a grate's holes; with `--game` and `--models`,
   the sky, the sprites and the models as the game will show them. `smak map-check` and
   `smak map-reach` too: the compiled map is walked by its own clip hulls.
8. **The game is the real test.** Tell the person the file, where it goes (`<mod>/maps/`, its `.wad` beside the
   mod's unless the compile was `--wadinclude`), and `map <name>` in the console. A mod may want its own
   entities to start a player (Master Sword: `ms_player_begin` and `ms_player_spawn`): its profile's `starts`
   say which, and with no profile the plan check and the walk test count Half-Life's two and those two, as
   they did before there were profiles. Say what the entity check went by (an FGD, the mod's maps, its
   program, which rules), and what the walk test could not tell: whether a monster is dropped to its floor, whether a jump it found is one a
   player makes in the game, anything a script does.

### Textures for a map

A map names its textures; the pictures are in a `.wad`. To make one from pictures of your own:

```js
import { maps } from "./smak/src/index.mjs";
writeFileSync("mine.wad", maps.writeWad([{ name: "my_stone", image: stone }, { name: "{my_bars", image: bars }]));
```

or `smak wad-make my_stone.png "{my_bars.png" -o mine.wad`, each texture named after its file.

- An image is `{ width, height, rgb }` or `{ width, height, rgba }`, drawn by code (as the models' textures are)
  or read from a file (`unpng`). **Both sides are multiples of 16**; a name is at most 15 letters, one word.
- **A name's first letters mean something**: `{name` has holes where the picture is see-through (bars, a
  fence), and goes on a brush entity with `rendermode: 4, renderamt: 255`; `!name` is a liquid; `sky` is the
  sky; `+0name` an animation's frame. The table is in `docs/MAPS-MAKING.md`, "Textures".
- A texture is drawn one texel a unit: a 64 wide picture repeats every 64 units. Draw it to tile.
- `smak wad <file.wad>` lists a `.wad`; `smak map-textures <bsp> -o dir` takes a map's out as PNGs. A game's
  textures are its authors': do not put them, or a map compiled with them inside, in anything shared (rule 7).

## When something is wrong

| What you see | What it is |
| --- | --- |
| `the map LEAKS ...` (compile), `the map looks OPEN to the void` (plan) | The inside is not sealed from the outside by world brushes. Look at the wall near the point it names. Was a wall made a brush entity? Is an entity outside? Build rooms with `carve` (`docs/MAPS-MAKING.md`, "Leaks"). |
| `the texture X is in none of the .wad files given` (compile); a face in a flat colour, `facts.missing` (pictures) | A wrong name, or the `.wad` not given: `--wad`, `--game <folder>`, `wads`, `folders`. `smak wad` lists what a `.wad` has. |
| `N classes are in none of the definitions given`, `are not in the game's own program`; `N keys their class does not define`; `N entities name something no entity of the map is called`; a sentence with a reason in brackets (`... (a spawn area holds 32 monsters ...)`) | The map's entities against its mod (`map-check --mod`, `checkPlan(map, { mod })`): the game would drop or pass over each of these without a word. `docs/MAPS-MAKING.md`, "When something is wrong", has each; a reason in brackets is a rule of the mod's profile |
| A map's picture is dark, or black | It is the map's own light. No `light` there, lights buried in walls, or (all black, `LIGHT none` in `map-info`) a leak. A light added to a compiled map lights nothing: recompile. `--brightness 4` only looks. |
| `map-check` says a count is over what the engine holds | The map is too big or too finely cut for GoldSrc (`docs/MAPS.md`, "Limits"). Fewer, larger brushes; small pieces made `func_wall`; or Xash only (`--engine xash`). |
| `this needs the map compilers VHLT ...` | They are not installed, or not named: ask the person, then `VHLT_DIR` or `--vhlt <folder>`. Everything but the compile works without. |
| `not a GoldSrc map`, a version that is not 30 | A Quake or Source map, or a file cut short. Not read. |
| `the eye is in solid` under a view | `--from` is inside a wall or outside the map. Take a point off the plan, or `--at` an entity. |
| A moved entity is not where it was put, in the game | The game loaded another file of that name. Ask where the mod looks first. |
| `not a studio model, version 10` | A Source model, a sprite, or a `name01.mdl` / `namet.mdl` side file. Open the main file. |
| Meshes have `texture: null`; grey model | The textures are in `<name>t.mdl`. The command line reads them itself; in a script call `withTextures(src, readFileSync("namet.mdl"))` first. |
| `an animation kept in another file` | The model has `name01.mdl` sequence files. Those animations cannot be read or changed. |
| An empty picture | A blank submodel. Use the right `--body`. |
| `the file is cut short or broken` | Something in it points past its end. Copy it again from the mod. |
| `the bodypart X has no submodel` | The engine needs one at least: give it one with no meshes. |
| A sword's `extra` or an axe's fittings refused | A sword's `extra` needs `tall: true`; an axe's turned parts and rings take a row of its texture each, ten in all (twenty-one with veins). A lattice grip in a colour of your own wants `mottle: "own"`. |
| Holes in the model in the picture | Triangles facing inwards. `check` counts them. If you built corners by hand, your `inside` point is outside. |
| A thin part is there from one side and gone from the other | A sheet with one face (a `plate` with no thickness, a quad by hand). Make it with `M.leaf`. |
| An open shape (a helmet, a cup) shows nothing inside from below | It has no inside faces. Give its `turn` a `lining`. |
| `smak: putBody: ... now colour another place` | The body you replaced was painted for another layout. `carryPicture` carries the old picture over. |
| A painted detail sits beside the part it was painted for after a change of shape | The same: the texture was left as it was. `carryPicture(old, new, { body, was, is })`. |
| A worn piece sits askew, too high, or the face shows through it | It was built along the bone's axis instead of where the game's own sits. Measure theirs (`boxIn`, `facingOf`) and check yours (`clearance`). |
| `graft: the target has no bone called ...` | The part hangs on a bone the other skeleton lacks. `{ missing: "ancestor" }`, or `together` for a picture only. |
| The new piece is back to front or upside down | The automatic fit chose the wrong turn (it happens with symmetric shapes). Use `place: "bone"`. |
| A model from an .obj lies on its side, or faces sideways | The file's up axis is not the one assumed, or its front is not towards `+z`. `up: "z"` / `--up z`, and `turn` / `--turn 90`. |
| A model from an .obj is a speck, or fills the room | The file's units: `scale` (39.37 for metres). `smak obj` prints its size in units. |
| `readObj: line n: the face names point ...` | The .obj is cut short or broken: export it again. |
| The piece is in the right place and huge or tiny | `size: "old"` against `size: "own"`. |
| `the looping animation X does not come back to where it starts` | Its last frame is not its first again. Make the last frame a copy of the first (see "A monster from nothing"). |
| `N animations have a box of no size` | A file made elsewhere, or a box told as zero: `replaceSequence(mdl, name, { frames: readSequence(mdl, name).frames })` measures it again. |
| `hit box N is on bone M, and the model has ...` | A hit box (or an attachment, or a bone controller) names a bone that is not there: `setHitboxes` with a right list. |
| `it has no hit boxes: traces against it use the entity's box` | A note: a thing that is shot at usually has them. `hitboxes: "auto"`, or `setHitboxes(mdl, autoHitboxes(mdl))`. |
| `moves further than its scale holds` | Should not happen: `replaceSequence` and `addSequence` widen a bone's scale themselves. Tell the person; it is a fault in the kit. |
| `too long for one animation` | Over 64 KB of values. Fewer frames, or split it in two. |
| Texture looks blurry in the game but not in the picture | Larger than `gl_max_size`, or not a power of two. See `docs/ENGINES.md`. |
| A mark painted on one arm is on both | The two share the same pixels (`paint` reports it as `shared`). It cannot be one-sided without laying that texture out again. |
| A hole where a piece was taken off | It was part of the body, not gear over it. Leave it on. |
| The model shows in the picture and not in the game | Run `check`. If it passes, the game is loading another file: ask where the mod looks first. |

## Reporting to the person

They cannot read the model; you can. When you hand work over, say what file to put where, what you changed in
plain terms, what `check` said, and show them the picture. For several models, or anything that moves, start the
viewer for them (`smak view`) on the originals' folder and yours together. Say plainly what you could not verify: the kit's
pictures are not the game, and timing, lighting and how a weapon sits in the hand while moving only show there.
