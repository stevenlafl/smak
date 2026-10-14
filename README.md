# SMAK: Studio Model Agent Kit

Tools for making and changing GoldSrc models (`.mdl`: Half-Life and its mods), built to be driven by an AI
coding agent such as Claude Code. You say what you want; the agent writes small scripts with this kit, draws the
result into pictures to check its own work, and hands you a `.mdl` to try in the game.

Version 0.14.0. An early release, made for an agent to work. For the person it has two pages in the browser: a
**viewer** that shows any two models side by side, turning and playing their animations together, and an
**editor** for touching up a model by hand (its animations, events and textures; not its shape), on a project
file the agent can work on too (`editor/README.md`).

## What it does

- **Textures**: takes them out of a model, puts new ones in (PNG or BMP), recolours, or paints them by rule.
- **Shapes**: replaces a weapon or item inside an existing model, keeping its hands, skeleton and animations;
  or writes a whole new model for a prop or pickup, from triangles or from a Wavefront `.obj` file made in
  any other tool (`smak obj`).
- **Animations**: reads them, changes them, replaces them in place or adds new ones, with their sound events.
- **By place**: paints wear, damage or markings where a point is on the body, across every texture it has, or a
  garment on chosen islands of a picture, in passes and with soft edges, over layers that say what the old picture
  is (mail, plate, a strap) and how far their edges are; adds a body again in another texture; finds
  a model's loose pieces (a pack, a pouch, a helmet) and takes them off; moves a part from one model to another
  that shares its skeleton.
- **Items**: adds a new weapon, shield or bow to the files a game already shows its kind from, as new
  submodels after the ones it has, laid on the game's own, with the numbers its script needs (`smak item`).
- **Bought models**: an .fbx, .glb/.gltf or .obj made a prop, a weapon in a game's own files, or a model with
  its skeleton and animations (`smak import`, `smak item mace.fbx ...`; docs/IMPORT.md).
- **Checking**: tells whether a model stays inside what GoldSrc, or Xash3D, can load.
- **Pictures**: draws any model from any side, or as the player sees a weapon, so the agent can see what it made.

It reads and writes the `.mdl` file directly. No decompiler, no studiomdl, no Blender, no `.smd` or `.qc`.

## What you need

- [Node.js](https://nodejs.org) 18 or later. Nothing to install after that: the kit has no dependencies.
- An AI coding agent that can run commands and look at images (Claude Code, or similar).
- Your mod's own model files.

## Starting

1. Unpack this folder somewhere, for example next to your working folder.
2. Check it runs: `node test/selftest.mjs` should end with `0 failed`.
3. Open your agent in a working folder and tell it where the kit is:

   > Read `smak/AGENTS.md`. I want to work on models for my GoldSrc mod; its models are in `C:\…\ts\models`.

   Agents that read `AGENTS.md` or `CLAUDE.md` on their own pick it up if you start them inside the `smak` folder.
4. Ask for what you want, with the model's file name. For example:
   - "Show me what is in `v_katana.mdl`."
   - "Make the blade texture of `v_katana.mdl` darker and more worn."
   - "Replace the knife in `v_knife.mdl` with a longer combat knife with a black cord grip."
   - "Slow the draw animation of `v_katana.mdl` down a little and add a sound at the frame the blade clears."
   - "Make three versions of this player model, more battle-worn each time, and one without its backpack."
5. The agent gives you a new `.mdl` and pictures of it. Copy the `.mdl` into your mod's `models` folder (keep a
   copy of the original) and look at it in the game.

Start with a texture change. It is the smallest step and proves the whole route on your game before anything
larger.

## Trying it yourself

```
node bin/smak.mjs info  path/to/model.mdl
node bin/smak.mjs sheet path/to/model.mdl -o sheet.png
node bin/smak.mjs strip path/to/v_model.mdl -o draw.png --seq 0 --view first
node bin/smak.mjs check path/to/model.mdl
node bin/smak.mjs view  path/to/a/folder/of/models
node examples/01-new-model.mjs out
```

`view` prints an address (http://127.0.0.1:8098/) to open in the browser. It lists every model in the folders
you give it; press A or B beside two of them, drag to turn, pick an animation. Give it your originals' folder
and the agent's output folder together to compare before and after.

For a map: `node bin/smak.mjs map-info path/to/map.bsp`, `map-plan path/to/map.bsp -o plan.png` and
`map-views path/to/map.bsp -o views.png` say what is in it and draw it.

For a new item, a mod's scripts and a map's light:

```
node bin/smak.mjs item   piece.mjs --mod profile.mjs --game <mod> --family <name> --name club -o out --pictures
node bin/smak.mjs scripts <your scripts> <map.bsp> --mod profile.mjs --game <mod>
node bin/smak.mjs map-light map.bsp [--rooms rooms.json]
```

`node bin/smak.mjs help` lists every command. If a picture comes out empty, the model keeps a blank submodel at
body 0: `info` shows the body numbers, and `--body N` picks one.

## What is in the folder

| | |
| --- | --- |
| `AGENTS.md` | The briefing for the agent: how a model is put together, the rules, the recipes. Worth a read yourself. |
| `docs/API.md` | Every function. |
| `docs/ENGINES.md` | GoldSrc against Xash: limits and differences. |
| `docs/MAPS.md` | Maps: a compiled map (`.bsp`) read, checked, its entities changed, its textures and `.wad` files, pictures of it (a plan, views from inside, a side section, its storeys), and the walk test. |
| `docs/MAPS-MAKING.md` | Maps: brush source (`.map`) written from a script, checked, drawn, and compiled with VHLT, an outside program. |
| `bin/smak.mjs` | The command line. |
| `src/` | The library: the model reader and writer, pictures, fitting, drawing, checking, working by place, and the workshop for building shapes and painting textures. |
| `src/maps/` | Maps, exported as `maps`: reading and checking a `.bsp`, entities, `.wad` files, brush source, the compile, pictures of a map, and the walk test. |
| `kits/` | Builders for swords and knives, axes, blunt weapons and bows. |
| `viewer/` | The page that shows models side by side, and its small server. |
| `editor/` | The page for re-timing and re-posing animations, events and textures by hand, its server, and the same edits from a terminal. |
| `examples/` | Seven scripts, one for each kind of work; the seventh makes a small map. |
| `profiles/` | One mod's profile (Master Sword Classic's), as an example of what a mod's own is: what its maps' entities are checked against. No part of the kit's core, and it holds no game content. |
| `mcp/` | The kit as an MCP server, for a client with no shell: `mcp/README.md`. |
| `test/` | The kit checking itself: `selftest.mjs` runs the files beside it, one an area. `test/fixtures/` holds the kit's own small map. |

## Limits worth knowing first

- GoldSrc models only (version 10). Not Source.
- A new model written from nothing has no hit boxes and no attachments. For a weapon's first-person model, the
  kit replaces the shape inside the model your mod already has, which keeps both.
- One bone a vertex, as the format has it.
- Animations kept in separate `name01.mdl` files cannot be edited.
- The kit's pictures and its viewer use a plain light of their own. Shape, size, texture and pose are true;
  brightness is not.
- Written for GoldSrc's limits by default, so the same files load in Xash3D. See `docs/ENGINES.md`.
- It was built for another GoldSrc mod (Master Sword). Thirteen player models of The Specialists have been read,
  changed and drawn with it, but **nothing it made has been loaded by The Specialists yet**: your first model in
  the game is the real test.
- Many models give the left and right side of the body the same pixels of a texture. A mark painted on one side
  then shows on the other; the kit reports how much of each texture is shared.

## What changed in 0.14.0

- **Bought models** (`smak import`, docs/IMPORT.md): FBX, glTF and OBJ read whole, checked against Blender;
  a prop, a weapon in a game's own files (`smak item mace.fbx --family ...`), or a model with its bones and
  animations.
- **A fight played and counted by one step** (`fight`, with `repeat`, `tap`, `faceAt`; docs/PLAY.md), and a
  wait that no longer misses a line said in the same instant as the one before.
- **A map beside the game's**: `map-measure` (a map in numbers), `map-compare` (maps at one scale), and why
  the floor is not walked (`reach.share`, `reach.parts`).

## What changed in 0.13.0

- **A map played in the game, and tested by what the game says** (`smak play`, `src/play.mjs`, docs/PLAY.md):
  steps such as walk, face, look, say, goto, a mouse button held, run in an Xash3D browser build through the
  caller's own Playwright. Every line the game tells the player is written down with its time; a step waits
  for a line (`until`) and a run is held to lines (`expect`, `expectNot`), so it passes or fails without its
  pictures being read. `--serve` keeps the game up: a second run is in the game in seconds. What is one
  game's (how a player gets in, how a thing is said, which messages it speaks in) is in its profile.
- **A new item in one call** (`addItem`, `addFitted`, `smak item`; docs/ITEMS.md): a family is data in a
  mod's profile; the piece is laid on the game's own weapon in each file, and the script's numbers come back.
  A bodypart that is not the last can be added to, and `check` tells a wrong `base`.
- **An icon's tile** (`iconPicture`): a long thing on the diagonal, the arms left out.
- **The walk test knows what a class is** (`markers`, `wiring`, `off`), and `reach.on` answers yes or no.
- **Scripts placed against the game's** (`smak scripts`): which replace, which are named, which nothing names.
- **A compile seen and stopped** (`--progress`, `--timeout`), with hlvis's work foretold from the portals.
- **The light on the floor** (`smak map-light`): room by room, from the lightmaps; a view's brightness is
  not a room's.

## What changed in 0.12.0

A monster made from nothing: the first was a scarecrow for Master Sword, its skeleton, body and five
animations written in code, and it walked, struck, was struck and died in the game.

- **Animations written as poses** (`src/animate.mjs`, exported as `animate`): a turn said in the model's
  axes whatever a bone's own are, a leg bent to put its foot at a place (`reach`), a pose mirrored, keys
  joined into frames, and the result measured: a loop's seam, the speed a walk's planted feet ask for.
- **A monster's parts of the format**: hit boxes (`"auto"`, as studiomdl makes them), attachments, bone
  controllers, and a sequence's travel, activity and box, read and written; `info` prints them.
- **Motion judged by the feet**: `strip --view side --ground` draws an animation from the side over the
  line of the floor.

## What changed in 0.11.0

- **A map played in the game** (`smak play <url> --map <name> --steps steps.json`, `src/play.mjs`): steps
  such as walk, turn, say and shot, run in an Xash3D browser build through the caller's own Playwright, and
  the pictures given back. What is one game's (how a player gets in, how a thing is said) is in its profile.
- **A profile says what an entity looks like** (`modelOf`) **and where its maps end** (`exits`): the pictures
  draw a monster as the model its script picks, and the walk test knows the mod's ways out.
- **Every picture command takes `--mod`**, as `map-check` and `map-reach` did.

## What changed in 0.10.0

A map's entities held against the game that will read them. A map can compile, look right in every picture,
and still be wrong for its mod: a game drops a class it does not have and passes over a key it never reads,
and says so nowhere.

- **Entity definitions** from three places, used alone or together: a game's `.fgd` files
  (`maps.definitionsOf`), the mod's own maps (`maps.learnEntities`, `smak map-learn`: a hundred maps in under
  half a second, kept in a file), and the classes its own program has (`maps.classesOfDll`).
- **The entity check**, in `checkPlan` and `checkBsp` when they are given `mod` or `definitions`
  (`smak map-check --mod`, `--fgd`): a class that does not exist, a point class made of brushes, a key its
  class does not have, a value of the wrong kind, a name nothing answers to, a file the game does not have or
  has in other capitals than the map writes.
- **Mod profiles**: one plain object for a mod (its folders, its definitions, its start classes, the boxes
  its classes move with, its doors, its rules), taken as `mod` by the checks, the walk test and the pictures.
  The kit ships Half-Life's (`maps.GOLDSRC`) and no mod's; `profiles/mastersword.mjs` is one mod's, as the
  example, with each rule's source written over it. `docs/MAPS-MAKING.md`, "A mod's profile", is how to get
  from nothing to a checked profile for a mod the kit has never seen.
- **Rules** a profile carries, as data: how many entities may name one other, a key that works only beside
  another, ranges that must meet and not overlap, a count that must end, a name that must exist.
- The self-test has 21 cases for it, against a made-up game of the kit's own.
- **A map's pictures show the game's own files**: with `models`, each model with its textures (a masked
  one's holes open: a tree's crown is leaves and air), in the body, skin, sequence, scale and angles its
  entity gives, lit by the floor under it; with the game's folders, each sprite as its first frame, blended
  by its render mode, and the sky as its own six pictures. A `{` texture has its holes only where the game
  gives them.
- **The walk test plays more of the game**: a slope too steep to stand on is slid down and never walked up;
  a place a player gets into and not out of (a pit, the foot of such a slope, a room a teleport leads into)
  is a warning with where it is; and with `jump` a jump across a gap is part of the walk, from the engine's
  own numbers, with what only a jump reaches told apart. 20 cases more, 21 where the compilers are.

## What changed in 0.9.0

A map judged with no game running. An agent that drafted a map could not tell a good one from a bad one: its
entities were dots, nothing said whether a player could get anywhere, and a plan showed one height.

- **The walk test** (`maps.reachOf`; `smak map-reach`), of brush source and of compiled maps: from the places
  to start, as the box of a standing player (steps of 18, any drop, doors open, ladders climbed), it says
  which entities are not reached and what it would take (a jump, a crouch, an opening that is not there),
  which stand in something solid or hang over their floor, how wide and high each gate and doorway is, and
  how far the walk is. It is geometry: nothing of it was measured against the game.
- **Entities at their true size**: a place to start, a monster and an NPC are drawn as the box they move with
  (32 x 32 x 72, or `bodies: { name: "large" }`), in views, on plans and on sections; with `models` and the
  game's folders, an entity that names a `.mdl` is drawn as that model.
- **Heights**: `maps.sectionOf` (a side section along a line, each floor with its height), `maps.storeysOf`
  (a plan for each storey, side by side), and `heights: true` on a plan. `smak map-section`, `map-storeys`.
- **A plan that can be read when it is crowded**: a label that has no room moves to another side of its dot,
  then becomes the number alone; `legend: true` lists the entities beside the plan. `reach` tints the walk
  test on it. `maps.openingViews` (`smak map-openings`) looks through every opening the walk test found.
- **The plan check knows a mod's starts**: Master Sword's `ms_player_begin` and `ms_player_spawn` count
  without being asked, and its facts say which were found. It numbers entities as the pictures do.
- The MCP server's `check` takes `walk`, and its `render` the kinds `section`, `storeys` and `openings`.
- The self-test has 165 cases, 170 where the compilers are.

## What changed in 0.8.0

Maps. The kit read, made and drew studio models; it now does the same for a level, under `maps`
(`import { maps } from "smak"`), with `docs/MAPS.md` and `docs/MAPS-MAKING.md` and a Maps section in AGENTS.md.

- **A compiled map read** (`maps.readBsp`, GoldSrc `.bsp` version 30): entities, faces, textures, lightmaps,
  the collision hulls, visibility. Of the 472 maps on the machine it was written on, 470 read; the other two
  are 2-byte files. `maps.checkBsp` checks one against GoldSrc's and Xash's limits, as `check` does a model.
- **Its entities changed** with nothing else in the file touched (`maps.withEntities`; `smak map-set`): a start
  moved, a key set, a point entity added or removed. Unchanged, a map is written back byte for byte. Light,
  visibility and collision stay as they were compiled.
- **Textures**: `.wad` files read and written (`maps.readWad`, `maps.writeWad`; `smak wad`, `smak wad-make`), so a
  map can wear pictures made with the kit.
- **A map made from code** (`maps.box`, `solid`, `prism`, `wedge`, `cylinder`, `arch`, `bend`, `stairs`,
  `terrain`, `carve`, `hollow`, entities and lights; `maps.writeMap` and `readMap` for Valve 220 `.map`
  text), checked before any compile (`maps.checkPlan`, with a hint of where it would leak), and compiled by
  the VHLT compilers where they are installed (`maps.compileMap`; `smak map-compile`), a leak reported with
  its points and the nearest entity. **The compilers are an outside program** (VHLT, Vluzacn's ZHLT v34): the
  kit finds them in a folder given, in `VHLT_DIR` or on the PATH, and says so plainly when they are not there.
- **Pictures of a map**, so that it can be looked at: `maps.planOf` (from above: floors, walls, every entity
  marked and numbered, a scale and north), `maps.drawMap` (a view from inside, textured and lit by the map's own
  lightmaps), `maps.viewsOf` (several in one), and `drawSource` / `planOfSource` for brushes before any
  compile. `smak map-plan`, `map-view`, `map-views`, `map-info`, `map-check`, `map-entities`, `map-textures`.
  A view of a map of 15,000 faces takes about a tenth of a second.
- **The MCP server** lists, describes, checks and draws maps with the six tools it had.
- `examples/07-a-small-map.mjs`: two rooms, written, checked, drawn, and compiled where the compilers are.
- The self-test has 144 cases, 149 where the compilers are; its map is the kit's own (`test/fixtures/`).

## Where it comes from

SMAK is the model tooling of the msr-web project, taken out so that it stands on its own. The kits for swords,
axes, blunt weapons and bows were made for that project's medieval weapons; for firearms and anything else the
agent builds shapes from the workshop's parts (`AGENTS.md`, "Making a shape").

## Licence

MIT (see `LICENSE`): use it, change it and pass it on freely, for any purpose. That covers the kit's code only.
The models and textures of a game belong to that game's authors, and what you make from them is theirs to allow.
