# What changed, version by version

The newest first. A version that changes what a model's file looks like, or that a model made before needs
mending for, says so under **Mind**.

## 0.15.0 (2026-10-15)

Re-skins in one step, and a fight that chooses and moves. Agents making a map's monsters found that a body made
from nothing reads as crude beside a game's own, and that the person wanted the game's models re-skinned: this
version makes a re-skin a short list of rules. And a fight played by one step could not go for a healer first,
walk round a crowd or step out of a marked circle, so every reading of difficulty was a worst case.

- **Re-skins in one step, and composing on a bought rig.** `reskin` repaints a game's model by rules (in a script
  or `smak reskin`): a rule recolours a hue keeping the shading, darkens or tints, rusts, mosses, dirties or greens
  by place on the body, or paints, kept to textures, islands, colour ranges, pixel boxes or places; each changed
  texture comes out before and after. `ownPixels` gives an island, body or mesh a texture of its own copied from
  the pixels it wore, so one plate of an armour whose one rust covers every plate can be marked alone.
  `addSequenceFrom` and `smak sequence-add --from x --frames 80-57` make an animation from another's frames,
  forward or backward. `importRigged` returns `parts`, so a bone and a piece can be added before `buildMdl`.
  `animate.reach` takes `aim` and `grip`; new `animate.hold` keeps a bone at its own turn in the model,
  `animate.grounded` lifts falls onto the floor; the quaternion helpers are exported. `workshop.skinned`,
  `zoneOn`, `span` hold the scarecrow's tubes and lofts. `check --source` marks warnings the original also has as
  inherited. `--yaw`/`--pitch` now turn front/side/top views. Texture flags are documented (flag 4, full bright:
  Xash honours it; GoldSrc not known). New: src/reskin.mjs, src/skinned.mjs, tests 46-49.
- **Long runs, and files changed while the game is up.** `attachSession` reads a run's answer by `node:http`,
  with no limit of time; the server sends its headers at once and a `{ beat }` line every 30 s of a quiet run
  (`serveSession({ beat })`). A run of over five minutes used to end in the attaching process with
  `FAILED: terminated` while it went on in the game; runs of 10 and 11 minutes now say their real result.
  `smak play --serve --over msc=<folder>` marks a folder laid over the game's files, and each `--attach ...
  --over` puts what changed in it since (`playSession({ over })`, `run({ over })`).
- **A fight that chooses and moves.** `prefer: "lantern"` (or a list) goes for that kind first, by the profile's
  new `play.target.prefer` and `unprefer` (Master Sword: `trial prefer {word}`); one that cannot be got at is let
  be for 20 s while the nearest is fought. With `chase`, the bot sidesteps round others in the way (`sidestep`,
  600 ms or `false`), walks at a far enemy as long as the way takes (up to 1.5 s a round), swings no blow at the
  air, and strikes three blows a round in reach. `dodge` steps away from a place a line warns of (a test copy's
  line: the game shows a sprite). The fight line gains preferred kills, sidesteps and dodges. In a map's bay
  with a healer behind a guard, all of it now dies (nothing did); a boss's marks struck 19 of 41 times with
  `dodge`, 31 of 32 without. A fight whose time ran out on a chase step is "ended by its time". `block` is not
  made: Master Sword says nothing before a blow lands.
- **A band left empty on purpose.** The `bands` rule takes `open`, a key naming ranges a place leaves empty
  (Master Sword: `reqhp_none "150;500"`): the check names only true faults (a map's 18 warnings to 0, its
  monsters unchanged).
- New: tests 50-52.

**Mind**: a named view given a yaw or pitch no longer ignores it. `ownPixels` renumbers islands (the moved
  ones last). Moved triangles are written as strips of three (more corners drawn). Fights with `chase` read otherwise than in 0.14 (sidesteps, longer walks, three
blows a round). A fight runs in the serving process: after a change to SMAK, stop the session and serve again.

## 0.14.0 (2026-10-13)

Bought models, and a fight played by one step. A person's folder of bought low-poly packs (some 1750 .fbx,
1600 .glb, 1150 .obj) is now read whole; a bought mace, shield and bow went into a game's own weapon files with
`check` clean, and a rigged zombie came in with its skeleton and both its animations. And the faults agents met
building a second map with 0.13 are mended: a fight is one step, a wait no longer misses a line, a map is
measured beside the game's.

- **Bought models.** `readFbx` (binary FBX 7.0-7.7 with zlib arrays, and the text form) and `readGlb` (.glb,
  .gltf with its .bin) read meshes, texture coordinates, normals, materials and their pictures, every node's
  place, the file's axes and units, skins and animations into one shape, which `readObj` now shares through
  `importedObj`. `importModel` makes a prop of it at its true size, or `fit`; `importPiece` makes a piece for
  `addItem` (a haft, a shield, by outline; its grip found or told); `importRigged` makes a model with the
  file's bones and animations, each point on its heaviest bone. `unjpeg` reads baseline JPEG. Commands:
  `smak import <file|folder>` (what is in it; `-o` a prop; a folder: props, sheet.png, import.json; `--anim`),
  and `smak item` takes a .fbx/.glb/.gltf/.obj in place of a piece module. Checked against Blender 5.2 and
  against the same models shipped in two formats (docs/IMPORT.md).
- **A fight played by one step, and steps that repeat.** `fight` faces the nearest living enemy (the
  profile's new `play.target`: commands and the line that answers, or a function) and strikes
  (`play.fight.attack`), heals under a share of health (`play.heal`), puts a fallen player back at `post`, and
  ends by a line, a time, or when no enemy is left (`quiet`). What happened (seconds, blows, hits dealt and
  taken with their sums, heals, deaths, the slain, enemies at once and on the player, the least health) is a
  `fight` line of the log and `fights` in result.json. `repeat` runs a block until a line, a count or a time.
  `faceAt` turns to a place, or to `"target"`. `tap` presses and lets go; a held button only charges a blow in
  Master Sword. A wing of 14 monsters fought by an outside loop guessing where to face took about 14 minutes
  and died 11 times; by one step file, 6 minutes and none.
- **From where an `until` hears.** A step that does a thing hears from its own beginning; a wait hears from
  the last step that did a thing, so a line said in the same instant as the one before, or during its wait,
  is no longer missed. No `until` stops at a line another stopped at. `since` goes on `until` too (and
  `"deed"`).
- **A run that stays stays**: `stay` with `put` no longer leaves the map.
- **The walk test says how much of the floor it walks, and why not the rest**: `reach.share`, `standable`,
  and `parts` (each part not walked, `how`: jump, crouch-jump, crouch, wall, air, none; the brush entities in
  the way by name; the walked floor nearest). Ladders off the grid are climbed, teleports followed by every
  way it tries, `walls: "gone"` (`--walls`) for what breaks, toggles or is pushed. A body is asked for by name
  (`bodyOf`). With `mod`, a list given adds to the profile's.
- **A map in numbers, beside the game's** (`maps.measure`, `measureTable`, `smak map-measure`): width bands,
  medians and quartiles, headroom of corridors and rooms, sight lines, openings, storeys, footprint and fill.
  **Maps at one scale** (`maps.compareOf`, `smak map-compare`).
- **Views from places to start**: starts that stand together get one view; a view nearly one colour is
  dropped for the next room (`facts.dropped`).
- **stairs** takes `top: false` and `tread`; the default is as before.
- **A compile says what hlvis took**, and guesses only where the guess is a minute or more (`portalsLine`).
- **map-check --scripts** warns of the checked map's own unnamed scripts only; `--all` of every one.
- The Master Sword profile: no "Graphics test" box (`ms_didbloomcheck 1` before entering), a box with no
  title read as its text, `eye`, `heal`, `target` (`trial nearest`), `fight`.
- New: src/fbx.mjs, src/glb.mjs, src/import-*.mjs, src/maps/measure.mjs, docs/IMPORT.md, tests 34-39 and
  41-45 with their fixtures (written in code: no bought file is in the kit).

**Mind**: `until` hears from a step's beginning or from the last deed, and never matches a stopped-at line
again: a run that relied on a stale line now behaves otherwise. `compileMap`'s words for the portals changed.
`map-check --scripts` warns less unless `--all`. An imported rigged model has each point on one bone (it
may crease at shared joints) and is no monster yet: no activities, events or travel are set.

## 0.13.0 (2026-10-13)

A weapon in one recipe, a game that is heard, and the faults agents met building two maps. Three agents
making a second map and its first weapon for Master Sword Classic spent over half their time testing in the
game by reading pictures, each run paying over a minute of loading; this version is what they asked for.

- **`smak play` hears the game, and a run passes or fails by what it says.** What the server tells the player
  (HUD lines, boxes, chat, a script's console lines) is read from the engine's own user messages, with nothing
  of the game changed, and written with its time to log.txt and log.jsonl. `until` on any step waits for a
  line instead of the clock (`within`, `every`); `expect` and `expectNot` (steps, and `--expect`,
  `--expect-not`) hold a run to lines: it ends with 1 when one fails, and says which.
- **A session that stays up**: `smak play <url> --serve`, then `smak play <session> --attach --map ...` as often
  as wanted (`--stay`, `--close`); several `--map`/`--steps` in one command; a `map` step; `--put place=file`
  writes a rebuilt map or pack into the running engine. Measured: in the game 6 s after a run begins in a
  session and 18 s from a cold start, where 0.11's fixed waits took 79.
- **New steps**: `mouse` (a button held), `mouseDown`/`mouseUp` (held across steps), `look` and `face` (the
  view set in degrees), an exact `turn`, `where` (the player's place and view, in the log), `goto` (by the
  profile's `play.goto`, read back). A contact sheet of each run's pictures (`sheet.png`), and `result.json`.
- **A profile's `play`** gains `loaded` (the line a loaded map prints), `goto`, `messages` (which user
  messages to read, and how); its `enter` steps may wait by `until`. Master Sword's profile enters with one
  click repeated until the game answers, reads HUDInfoMsg, TextMsg, SayText, HP and MP, and says a thing with
  `cmd say_text 1` (its old `setsay` moved the way of speaking on by one each time).
- **A new item in a game's own models** (`src/items.mjs`, docs/ITEMS.md). `addFitted`: a piece as a new
  submodel after the ones a bodypart has, laid on one that is there (by its outline, as a shield on its back,
  or as given), on the bone asked for, with `bones` for the corners a piece marks by `part`, `rig: "nearest"`
  for what bends, `keep` for meshes taken along (a bow's nocked arrow). `addItem`: one piece in every file
  and place of a family (data: files, bodyparts, bones, the thing each is laid on, how a script's numbers
  follow), returning the files and the constants (`itemConstants`). `keptWhole`: that what a file had is where
  it was. `itemSheet`: each new submodel beside the one it was laid on. `smak item`. A file that holds the
  item already is kept when it is the same thing (`existing: "same"`) and refused when it is another.
- **A bodypart that is not the last may be added to**: `addModel` (and so `putBody`, `copyBody`) raises the
  `base` of the bodyparts after it; `check` warns of a base that is not the product of the counts before it
  (`basesByRule`) and refuses a base of 0.
- **An icon's tile** (`src/icon.mjs`): `iconPicture` draws one body on black as it stands or with its long
  axis on the diagonal, heavy end up; `reducedPicture`. `render` takes `parts`.
- **`check` and the hundred textures**: the 100 is the compiler's (studiomdl's MAXSTUDIOSKINS), not an
  engine's. For goldsrc the warning says so; for xash it is a fact above 256.
- **The walk test is told what a class is**: `markers`, `wiring`, `off` beside `exits`, as options and as a
  profile's fields. A class the game does not have is no wall; a way out so written is looked for and told
  apart. Triggers that are only fired are not gone to. `reach.on(x, y)` answers yes or no where `walked`
  gives a height that may be 0.
- **A `trigger_counter` with no brush** is no longer said to have no shape.
- **Scripts placed against the game's** (`maps.scriptsPlaced`, `smak scripts`, `map-check --scripts`): each
  of ours replaces a game script, is new and named, or is new and named by nothing (a warning). The rules
  are a profile's `scriptPack`.
- **A compile that is seen and stopped**: `progress`, `--timeout`, "stopped" in the summary, and the portals
  hlbsp left (`result.portals`), with a warning before hlvis when they foretell minutes. A draft says in
  `result.facts` that its light has no bounces.
- **The light on the floor** (`maps.lightReport`, `smak map-light`): the mean of the floors' lightmap samples,
  by room or as dark stretches. The views say what their light is.
- `bowkit` marks the middle of its string `part: 1`.
- The Master Sword profile: `ITEM_FAMILIES` (blunt1h, shield, bow, bow_bending) as `items`; `wiring`;
  `scriptPack`; `play`.
- New: src/items.mjs, src/icon.mjs, src/maps/scripts.mjs, src/maps/light.mjs, src/maps/compile-run.mjs,
  src/play-browser.mjs, src/play-session.mjs, src/play-sheet.mjs, docs/ITEMS.md, docs/MAPS-CHECKS.md,
  docs/PLAY.md, tests 31 to 33 and 40.

**Mind**: a body number that shows another than the first submodel of a LATER bodypart changes when a
submodel is added before it (the bases grow). A brush `trigger_counter` is no longer among a walk's entities.
`compileMap`'s result has `facts` and `portals`. The bending bow family creases where two bones meet and has
not been in a game; the rigid one is the sound one. Reading the game's text and setting the view find the
engine's tables in memory: tried against one Xash3D FWGS browser build only.

## 0.12.0 (2026-10-13)

A monster made from nothing. Until now the kit made things that are carried, worn or stood somewhere; the
first monster made with it was a scarecrow for Master Sword Classic: 17 bones, a body of 857 triangles and
five animations, every one written in code. In the game it came to the player on feet that did not slide,
struck him, took a blow (so its hit boxes are where a blade goes) and fell dead on its back. Two things the
game would not have forgiven were learned from its code before a frame was made: a model with no hit boxes
cannot be hit at all, and a walk whose sequence says it travels nowhere moves the monster nowhere.

- **Animations written as poses** (`src/animate.mjs`, exported as `animate`). A frame in the file is six
  numbers a bone in the bone's own axes: arithmetic on them nudges an animation that exists and makes none.
  `rigOf`, `poseOf` (a `turn` in degrees about the MODEL's axes, from rest and carried by the parent, the
  same on a skeleton whose bones are turned as a Biped's), `reach` (a limb of two bones bent to put its end
  at a place: feet planted by arithmetic), `mirror`, `between`, `animate` (key poses joined by the shortest
  turn, eased; a loop closed; `each` for a frame made by a formula), `valuesOf`, `worldOf`, `matricesOf`
  (a pose drawn by `render` without being an animation). And the measures: `seam` (a loop's gap), `track`
  (where a joint goes), `stride` (the speed the planted feet ask for, and how much they slide). The
  scarecrow's walk asks for 33.3 units a second and its sequence travels exactly that; the game's own
  skeleton and boar slide.
- **A monster's parts, read and written** (`src/mdl.mjs`, `src/build.mjs`): hit boxes (`setHitboxes`,
  `autoHitboxes`: the boxes studiomdl makes, which match Valve's own files box for box where those were
  made so), attachments (`setAttachments`), bone controllers (`boneControllers`, `setBoneControllers`), and
  for a sequence its travel (`movement`, with the motion bits), `activity`, `actweight` and its box, measured
  from the posed vertices as studiomdl measures it (within 0.024 units of the files' own). `writeMdl` and
  `buildMdl` take them all, with `eyes` and the header's boxes; `MOTION`, `HITGROUP`, `ACTIVITY` name the
  numbers. Written back through the setters, Half-Life's zombie and grunt and Master Sword's skeleton and
  rat read the same.
- **`info`** prints each animation's travel and the speed it makes, its activity, the hit boxes
  (`--hitboxes` lists them), attachments, controllers and eyes. **`check`** tells of a hit box on a bone that
  is not there, an animation with a box of no size, a loop that does not come back to where it starts, and,
  as a fact, a model that travels and has no hit boxes.
- **`render` and `strip` take `--view side|front|top` and `--ground`**: an animation from the side, every
  frame from one camera, over the line of z = 0. A walk is judged by its feet against that line.
- **The Master Sword profile's `play` and one more rule**: a map with neither an `ms_player_spec` nor an
  `ms_player_spawn` drops a player as he connects (found by making a yard to try the monster in, then read
  in the game's code; all 100 of the game's maps have one or the other).

**Mind**: `replaceSequence` with new frames, and `addSequence`, now measure the animation's box where they
kept or copied one; `addSequence`'s `like` copies a box only when given.

## 0.11.0 (2026-10-13)

What the first map made with the kit still had to be done by hand for: seeing it in the game itself, naming
each monster's model for a picture, and telling the walk test where the mod's maps end.

- **A map played in the game** (`play.play`, `play.playOf`, `play.browserDriver`, in `src/play.mjs`;
  `smak play <url> --map <name> --steps steps.json -o <folder>`): a list of steps (`command`, `say`, `walk`,
  `turn`, `button`, `hold`, `press`, `click`, `wait`, `shot`) run through a driver, and what happened
  given back: the pictures in order, each step with its time, the console's lines. The one driver shipped
  is for an Xash3D build in a browser, through Playwright, which is the caller's and never the kit's
  (`--playwright <folder>`). What is the game's own is in its profile's `play`: the steps that get a player
  in after the map has loaded, how a thing is said, how long a load takes. Tried on Master Sword's browser
  build: it chose the character, walked, turned, spoke to an NPC and was answered. No step places the
  player: the engine has no command for it. Turns are by time and inexact; loads are waited for by the clock.
- **A profile says what an entity looks like** (`modelOf(keys)` in a profile; `maps.modelsOf(mod, map)`):
  with `models`, the pictures draw an entity whose keys name no model as the one its mod gives it.
  `profiles/mastersword.mjs` reads it from the monster's script (`scriptModel`, `packScripts`): the
  `setmodel` line, a word given its value with `const` or `setvard`, and the scripts taken in with
  `#include`; 670 of the game's 875 monster and NPC scripts give a model this way, the rest being bases and
  the players' side. Not read: `setmodelbody`, and a model chosen while the game runs.
- **A profile names the ways out of its maps** (`exits`; Master Sword's `msarea_transition`): floor one is
  reached from is no one-way place, with no `--exit` given each time. A way out is now an entity a player
  goes to whatever its class: before, one that was no `trigger_` or `msarea_` by name was never reached.
- **Every picture command takes `--mod`** (`map-view`, `map-views`, `map-plan`, `map-section`,
  `map-storeys`, `map-openings`; `map-views` also takes `--body`, `--models` and `--model` now): the mod's
  folders, its classes' boxes and its models, as `map-check` and `map-reach` took its rules and starts.

## 0.10.0 (2026-10-13)

A map's entities held against the game that will read them. The first draft of the first map made with the
kit used three classes its mod does not have, put a key on entities where the game never reads it, left a
spawn point without the key that makes it one, named an item by its script's path where the game wants the
item's name, and would have put 39 monsters in an area that holds 32. It compiled, and every picture of it
was right. A person found all five, by reading a hundred maps and the game's C++; the kit had said nothing.

- **Entity definitions from `.fgd` files** (`maps.readFgd`, `loadFgd`, `definitionsOf`, in
  `src/maps/fgd.mjs`): the Valve format read into plain data: `@BaseClass`, `@PointClass`, `@SolidClass`,
  `base(...)`, `size(...)`, `studio(...)`, every key with its type, choices, flags and default, `@include`
  followed. Six FGDs found on one machine (Half-Life's as Master Sword ships it, Master Sword's two, The
  Specialists', Counter-Strike's, VHLT's) are read whole.
- **Definitions learned from a mod's own maps** (`maps.learnEntities`, `entitiesOfFile`, in
  `src/maps/learn.mjs`; `smak map-learn <folder> -o <file>`), for a mod with no FGD or a wrong one: each
  class with how often it appears and whether as a point or of brushes, each key with how often and its
  commonest values, the keys every entity of a class gives and the keys that are always given together. Only
  each map's header and entity text are read: Master Sword's 100 maps (593 MB) take under half a second, and the
  answer is kept in a file the caller names until a map of the folder changes. Used in place of an FGD, more
  weakly ("never seen in any of the mod's 100 maps" is a warning, with the count), and beside one.
- **The classes a game's own program has** (`maps.classesOfDll`, `definitionsOfDll`, in `src/maps/dll.mjs`):
  the engine makes an entity by calling the function of the game's library that bears the classname, so the
  library's exported names are the one certain list of the classes that exist. With it, a class the program
  does not have is an error whatever an FGD says, and one it has is no fault though no FGD and no map uses
  it: Master Sword's FGD and all its 100 maps lack `msmonster_giantspider`, which its program has.
- **The entity check** (`maps.checkEntities`, in `src/maps/rules.mjs`), which `checkPlan` (brush source) and
  `checkBsp` (a compiled map) run when given **`mod`** or **`definitions`**: a class that is not defined; a
  point class given brushes and a brush class given none; a key its class does not define (a warning: a mod
  reads keys its FGD forgets, and a key the mod's own maps give that class is not told); a value that is not
  of its key's type or not among its choices (not told when the mod's own maps do the same: the FGD is then
  the one that is wrong); a `target`, `killtarget`, `master` or any `target_destination` that names no entity;
  the targetnames nothing names, as a fact.
- **Mod profiles** (`maps.GOLDSRC`, `modOf`, `loadMod`, `withMod`, `bodiesOf`, `definitionsFor`,
  `joinDefinitions`, in `src/maps/mod.mjs`): one plain object a mod: its folders and `.wad` files, where its
  definitions come from, its start classes, the classes that walk with their boxes and where a thing's origin
  is in its box, the classes that open, the classnames that switch an entity off, its rules. `checkPlan`,
  `checkBsp`, `reachOf` and every picture take `mod` and no longer need the same options one by one. A
  class's FGD `size(...)` is the box the walk test and the pictures move it with. The kit ships `GOLDSRC`,
  Half-Life's own, with nothing of any mod in it; a mod's profile is data the caller passes or loads from a
  file, never built in.
- **Rules a profile carries**, as data with the reason of each, and small functions: no more than so many
  entities may name one other (`limit`); a key that does something only beside another (`beside`); ranges that
  must meet and not overlap among the entities at one place (`bands`); an entity that waits for others, each
  of which must have a count that ends (`finite`); a key whose value must be the name of something that
  exists, in the map or wherever a function of the profile looks (`names`: a script, an item).
- **Files**: every model, sprite, sound, sky picture and `.wad` an entity or the worldspawn names is looked
  for in the mod's folders and then `valve`. One that is found only in other capitals than the map writes is
  told: Windows finds it, a server on Linux does not (`maps.fileFinder`).
- **`profiles/mastersword.mjs`**: Master Sword Classic's profile, as one mod's and an example, outside the
  kit's core. It holds no game content: it reads the installed game's program, FGDs, maps and script pack when
  it is made. Every rule has its source over it, most of them a line of the game's C++. On the game's own 100
  maps: no map breaks the limit of 32; `reqhp` stands without `spawnarea` in 1 map; no ranges gap or overlap;
  26 spawn areas in 9 maps wait on `fireallperish` for a monster with no `lives`, which the game's code says
  never fires; 20 classnames in 11 maps are not in the program (misspellings such as `func_monsterclips`).
- **Commands**: `smak map-check` takes a `.map` as well as a `.bsp`, and `--mod <profile.mjs|.json|goldsrc>`,
  `--fgd`, `--learned`, `--scripts`, `--cache`; `smak map-learn <folder> -o <file> [--class name]`; `smak
  map-reach --mod`. The MCP tool `check` takes `against` (FGDs, learned definitions, a profile that is data).
- The self-test has 21 cases for all of this (`test/24-maps-mods.mjs`), with an FGD and a made-up game of the
  kit's own in `test/fixtures/` and no game's content. The five faults above are cases of it.

And what the pictures and the walk test could not show of that same map: its trees were blue blobs, its
torches boxes, its sky one colour, and nothing said that a player who dropped into a pit could not leave it.

- **Models in a map's pictures wear their textures** (`src/maps/figures.mjs`): each triangle its own, the
  nearest pixel of it, seen from its front as the game draws it. A masked texture's holes are open (a crown
  is leaves and air; it was one flat colour, the mean of its picture with the blue of its holes in it); an
  additive one is added to what is behind it. A model takes the light of the floor under it. An entity's own
  keys stand it: `angles` (all three, by the engine's own arithmetic), `body`, `skin`, `sequence` and
  `frame`, `scale` (`modelScale: false` where a mod's drawing does not scale models). A model is read once
  and kept: twelve views of a map with sixty-five models take under a second together.
- **Sprites** (`maps.readSpr`, `spritesOf`, `boardOf`, in `src/maps/sprites.mjs`): with the game's
  `folders`, an entity that names a `.spr` (`env_sprite`, `env_glow`) is drawn as its first frame at its
  `scale`, set up by the sprite's kind and blended by the entity's render mode (whole, with holes, added,
  tinted, a glow that grows with its distance), as Xash3D FWGS draws one. A small cross on a plan.
- **The sky's own picture** (`maps.skyOf`, `skyColour`, `readTga`, in `src/maps/sky.mjs`): the six sides
  the worldspawn's `skyname` names (`gfx/env/<name>rt.tga` and its like, or `.bmp`), where the engine lays
  them; a flat colour where they are not found, and a note that names the file.
- **A `{` texture has its holes where the game gives them**: on a brush entity in render mode 4. On the world
  and in any other mode a view fills them with the texture's last colour, as the game does, and says how
  many faces: a fence left without its `rendermode` is seen before the game shows it.
- **`entities: "game"`** (`--entities game`): only what the game shows is drawn (models and sprites, no box
  for a start or a monster): with `labels: false`, a picture to lay beside a screenshot.
- **One-way places** (`reachOf(...).oneWay`, `trapped(x, y)`; a warning): floor a player gets to from the
  places to start and from which there is no way back to one, by a step, a jump of 63, a jump across a gap,
  crouching or a teleport: a pit, the foot of a slope too steep to climb, a room a teleport leads into. Each
  with where it is, how large, how it is entered and what is in it. `trigger_changelevel` is a way out, and
  `exits` (`--exit`) names a mod's own. A plan with `reach` tints such a place amber.
- **Slopes as the engine has them**: how each floor lies is read from the map (a brush's plane; a compiled
  map's clip hull), and one whose normal has a z under 0.7 is slid down and never walked or jumped up.
  `spaceOf(...).blocked` gives each stretch's `slant`. `slopes: false` (`--no-slopes`) walks as 0.9.0 did.
- **Jumps across gaps** (`jump: true`, `--jump`): one arc at a run, from the engine's own numbers (a throw
  of 268.3 units a second up, a gravity of 800, a run of 320: the body's middle goes 215 landing level;
  `speed`, `gravity`), with the whole body clear on the way. What only a jump reaches is told apart: an
  entity's `how` is `"jump"`, `leaps` lists the jumps, `jumped(x, y)` is that floor (blue on a plan). An
  entity a walk does not reach says which jump would: `a jump of 144 across a gap, from ... to ...`. The
  numbers and where each is from are in `docs/MAPS.md`, "The engine's numbers".
- **Commands**: `map-reach --jump --speed --gravity --no-slopes --exit`; the map pictures take
  `--entities game`, `--no-sprites`, `--no-sky`, `--sky r,g,b`, `--no-model-scale`.
- The self-test has 20 cases for these, 21 where the compilers are (`test/25-maps-seen.mjs`,
  `test/26-maps-play.mjs`): a card of two triangles for a model, sprites and skies written byte by byte, a
  hall cut by a trench and a hall with a ramp.

**Mind**

- **With no `mod`, nothing changes**: `checkPlan` and `reachOf` still count `START_CLASSES` (Half-Life's two
  starts and Master Sword's two), and no entity is looked up. With a profile, the starts are the profile's:
  `GOLDSRC` asks for Half-Life's alone. `checkPlan`'s sentence for a map with no start now ends with the two
  ways of naming a mod's own (`mod`, `starts`).
- **`bodyFor`: a box of exactly a hull's size is that hull.** `bodies: { name: { half: 32, height: 64 } }` was
  "a box of its own", which a compiled map's walk passes over; it is now walked as the large hull.
- **Not measured in a game.** The entity check holds a map against what was written down (an FGD), counted
  (the maps) or read (the program's class list, a profile's rules). It does not run the game: a key that
  exists and is given the wrong meaning passes.
- **Pictures given `folders` look different**: sky faces show the sky's picture where the folders have it
  (`sky: false` for the flat colour), and an entity that names a sprite is drawn as it and no longer as a
  small box (`sprites: false`). `facts.marked[].drawn` may be `"sprite"`; the note `N as their model, in flat
  colours` is `N as their model, with its textures`. `figuresOf` gives each figure `surfaces` and `pose`;
  its `triangles` are still `{ points, colour }`, the colour now without the blue of a masked texture's
  holes. A model is seen from its front only, where both sides of every triangle were drawn.
- **A model follows its entity's `scale`, `body`, `skin`, `sequence` and all three `angles`**, where only its
  yaw was read. The engine's own drawing does not scale a model and Master Sword's does: `modelScale: false`
  for a mod that does not.
- **A `{` texture on the world, or on an entity that is not in render mode 4, is drawn filled.** It was
  drawn with holes everywhere, which the game does not do.
- **The walk test no longer walks up a slope steeper than 45.6 degrees**, which it did wherever each 8 units
  rose no more than 18. On the two maps it was run on, the floor walked is 1.3 and 2.7 in 100 smaller and
  the same entities are reached. `slopes: false` is the old walk.
- **With `jump`, an entity only a jump reaches has `how: "jump"`**, where it had `"walk"`; it is `reached`
  as before. A jump is now also one across a gap, so `jump: true` reaches more floor than it did.
- **`reachOf` warns of one-way places**, which is one more warning a map may have. `map-reach` still ends
  with 1 only for an entity that is not reached or stands in something solid.
- **Not measured in a game.** The models, the sky and the trees of one map were laid beside the game's own
  screenshots and agree in place, turn, size, holes and sky (`docs/MAPS.md`, "Against the game"); a sprite
  was not looked at there. A model's pitch and roll, a sprite's glow and every jump the walk test finds are
  the engine's arithmetic read from its source (Xash3D FWGS's drawing; Half-Life's `pm_shared.c`), not seen
  in a game. The MCP server draws the sky and the sprites when its models folder is the game's; it does not
  take `jump`, `models` or `exits` (its tools' descriptions are kept short): they go by `run`.

## 0.9.0 (2026-10-12)

A map judged with no game running. The first map drafted with the kit (a farm, three terraces and a cellar,
from a script) showed what its maker could not tell: entities were dots, nothing said whether a player could
get from the start to each place, and a plan showed one height at a time.

- **The walk test** (`maps.reachOf`, in `src/maps/reach.mjs`; `smak map-reach`), of brush source and of
  compiled maps. From the places to start it floods the floor as the box of a standing player: up a step of
  18, down any drop, doors open (`doors: "closed"`, `open`, `shut`), ladders and liquids climbed, teleports
  followed. It says, in sentences: the entities a player goes to that are not reached, each with what it
  would take (`only by a jump`, `only crouching` with where and how low, `open air leads to it` with how near
  the walked floor comes, `no opening leads to it`, `inside something solid`); the entities whose box does
  not fit where they stand, and how far to lift one sunk in its floor; those that hang; every opening with
  its width and height, and those a large monster's box does not pass; the walk to chosen entities, with its
  way. Brush source is measured by growing each brush by the body, as the compilers grow their clip hulls; a
  compiled map by its own clip hulls. On the kit's own two rooms the two give the same floor to the unit.
- **The space** (`maps.spaceOf`, `restOf`, `bodyFor`, `BODIES`, in `src/maps/space.mjs`): at a place, the
  heights at which a body fits; whether one fits with its feet at a point, and the floor under it.
- **Entities at their true size** (`src/maps/figures.mjs`): a place to start, a monster and an NPC are drawn
  as the box they move with (32 x 32 x 72; `bodies: { name: "large" }` for 64 x 64 x 64) in `drawMap` and
  `drawSource`, outlined on `planOf` and `planOfSource`, and on a section. With `models` and `folders`, an
  entity that names a `.mdl` (or that `models` names one for) is drawn as that model, in flat colours.
  `--body`, `--models`, `--model` on the command line.
- **A side section** (`maps.sectionOf`; `smak map-section`): an upright cut along a line, floors with their
  heights written under them, the entities on the line.
- **The storeys side by side** (`maps.storeysOf`, `maps.storeyCuts`; `smak map-storeys`): the cuts that show
  every floor are found, and each plan marks the entities of its own storey. `heights: true` (`--heights`)
  writes each floor's height on any plan.
- **A view through each opening** (`maps.openingViews`; `smak map-openings`).
- **Plans**: `reach` tints the walk test (walked floor green, floor with room to stand and no way to it red,
  the ways asked for as lines, the openings numbered); `legend` lists the entities beside the plan; a label
  with no room is tried on the other sides of its dot and then written as the number alone, where it was
  left out before; `only` marks the entities named.
- **`checkPlan` counts a mod's starts**: `starts` is `START_CLASSES` unless told (`info_player_start`,
  `info_player_deathmatch`, Master Sword's `ms_player_begin` and `ms_player_spawn`), and a fact says which
  were found and how many.
- **The MCP server**: `check` takes a `.map` (its plan's faults) and `walk` (the walk test); `render` has the
  kinds `section`, `storeys` and `openings`, and `heights`, `legend` and `reach` for a plan. No new tool.
- The self-test has 165 cases, 170 where the compilers are (`test/23-maps-walk.mjs`).

**Mind**

- **`checkPlan` numbers entities from 1**, as the pictures, `smak info` and `viewFrom` do (the world is 0).
  Its sentences said `entity 14` for the one the plan labels 15.
- **Pictures of a map with monsters or starts look different**: each was a box of 16 units, and is now its
  whole box. `facts.marked` has `drawn` and `size`; the note `N point entities are marked by a box` is now
  `N point entities are drawn: ...`. `entities: false` leaves them out as before.
- **Not measured in a game.** The walk test is geometry. A monster's origin is taken to be at its feet (a
  start's is its middle), from how Master Sword's own maps place theirs; a jump clears 45 and 63, as mappers
  measure it; a jump across a gap, a slope's slide and what a script does are not played.

## 0.8.0 (2026-10-12)

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

**Mind**: a point entity's model is not drawn in a map's pictures (a labelled box stands for it), nor a sprite,
an open door or the sky's picture; a dark map is drawn dark (`brightness` lifts it). The brightness of a view
was matched to the game's own screenshots of one map in Xash. A map made here was loaded by the local game
(Master Sword Classic in the browser); not tried: GoldSrc itself, a dedicated server, a change of level. For
Master Sword a new model's file is only loaded if a script that runs at the map's start names it.

## 0.7.1 (2026-10-12)

The faults found by reading the code for 0.6.1, mended, each with a case that failed before. A script that
worked gives the same model as in 0.7.0.

- **Command lines**: `smak` and the editor's answer every wrong or missing argument with one sentence and exit
  code 1 (of 213 wrong command lines tried, 95 gave a stack trace or quietly did something else; a project is no
  longer written with a value that was not a number). `--seq rest` in `islands` and `pieces`; `-o` asked for
  before the work is done; a bone the model has not is answered with those it has.
- **Servers**: an address that cannot be read is answered with 400 by the editor and the viewer, where it could
  stop the server; a refused call is 400, not 200; a taken port is said; the timeline no longer throws when a
  dragged key cannot be moved.
- **Library**: `check` reports a file cut short instead of throwing; `poseAt` says which bone's values end
  early; `retexture` wears the file's own texture of that name, with no duplicate; `writeMdl` refuses a bodypart
  with no submodel; `replaceTexture` tells when a new size leaves a mesh with pictures of two sizes across
  skins; a handle straight along z is fitted; `unpng` refuses what it cannot read; a layer's `over` that names
  no layer is refused at once; `strip` on a model with no animations says so.
- **An .obj's own normals are kept** (`vn`): the model is lit as the tool that made it lit it, and a big one
  split over bodyparts shows no line at the cut. `meshOf` takes a corner's `n`; `buildMdl` and `putBody` with
  `ownNormals: true`.
- **Examples**: 02 and 05 write nothing when the check refuses the result; every wrong argument is one line.
- **Kits**: a sword's `extra` without `tall: true`, and more fittings on an axe than its texture has rows for
  (10; 21 with veins), are refused in words where the part silently wore another's picture; bluntkit honours a
  ring's `flatten`; `grip.mottle: "own"` mottles a lattice grip towards its own colour; an axe may be a head
  with no haft; the headers name every option the code reads.
- **Tried**: an .obj written by Blender 5.2 (a textured Suzanne: upright, the right way round, its picture in
  place), and the MCP server with a real client (a Claude session with nothing else made a barrel that passes
  the check, for about a third less than one with a shell and the whole guide; one run of one task).
- The self-test has 100 cases; the editor's browser tests need no outside file but the sword's model.

**Mind**: a flag that takes a value and is given none is refused (`smak check x.mdl --engine` alone meant
goldsrc). An .obj with normals gives other bytes than in 0.7.0, lit by the file's normals. A blunt weapon
whose script passed `flatten` to a ring, which was ignored, now has the flat ring it asked for. Not tried:
anything made from an .obj in the game.

## 0.7.0 (2026-10-12)

Two ways in for people who do not write SMAK scripts by hand.

- **From an .obj file**: `smak obj file.obj -o out.mdl`, or `readObj` / `objToMdl` (`src/obj.mjs`). Geometry made
  anywhere (Blender, another tool's output) becomes a model the game can load, with its .mtl's pictures (PNG, BMP)
  or flat colours as textures, stood up from Y-up, scaled, grounded or centred. One bone, one still animation.
  What the format cannot hold is met and said (a large picture shrunk, a big mesh split over bodyparts, tiling
  texture coordinates laid out) or refused in words. `objMeshes` gives the triangles for `putBody`, to add an
  .obj as a new body on a bone of a model that is there. `examples/06-from-obj.mjs`.
- **An MCP server**: `smak mcp --work <folder> [--models <folder>]` (`mcp/`, with no dependencies: JSON-RPC on
  stdin and stdout by hand). For a client with no shell, such as Claude Desktop. Six tools: `guide` (this kit's
  guide a section at a time, in place of reading all of AGENTS.md), `models`, `info`, `check`, `render` (a view,
  a sheet, a strip or a texture's layout, as a picture in the conversation) and `run` (a script over the kit in
  the work folder: it runs code on the machine; `--no-run` leaves it out; a script kept by
  `name` is changed by `edits` and run again without being sent whole). `mcp/README.md` has the settings.
- The self-test has 68 cases.

**Mind**: an .obj's own normals are not stored; they decide where the creases are. Not tried: an .obj written
by Blender itself, either of these in the game, and the server with a real client.

## 0.6.1 (2026-10-12)

No change in what the kit does: the same calls give the same bytes. The code itself was rewritten to be read,
after a reader from outside found it too dense to follow.

- **One statement a line**, at 110 columns, kept so by Prettier (`npm run format`; a tool for whoever works on the
  kit, not something the kit needs to run).
- **The formats' numbers have names.** Every offset and size read from a model is a field of a table named after
  the format's own structure (`HDR` for studiohdr_t, `SEQ` for mstudioseqdesc_t and so on, at the top of
  `src/mdl.mjs`); the same for BMP and PNG in `src/image.mjs`. Tolerances and defaults elsewhere are named too.
- **Words for names**, separate declarations, long functions cut into named steps.
- **Smaller files.** `src/place.mjs` is now a list of what it gives, from `surface`, `islands`, `layers`,
  `paint`, `pieces`, `bodies` and `carry`; the editor's page is `app.mjs` and eleven modules beside it; each
  command of `smak` and of the editor's command line is a function of its own; the self-test is one file an area
  under `test/`, still run by `node test/selftest.mjs`, the same 49 cases.

**Mind**: nothing for a model. For a script that reaches inside rather than through `src/index.mjs`: the short
names in the page's `window.ed.S` are words now (`id` is `modelId`, `n` is `animNumber`; `frame`, `bone`,
`tex`, `project`, `saved`, `ready`, `busy` and `live` are as they were), and the editor's `core.trackOf` gives
`{ frames, values, turns }`.

## 0.6.0 (2026-10-12)

Out of the first trial with a new shape, not paint on one of the game's: a great helm with a domed crown, bars,
an apple finial and a plume. It was made through the lathe's escape hatches and with corners built by hand, its
first version failed review on shape, and a third of its script reproduced what the kit already knew (where the
lathe's own faces are, where the head is, how the game's helmets sit).

- **`M.turn(rings, zone, options)`**: the lathe's successor, beside it. A ring has its own outline (`r` a radius,
  an oval `[ra, rb]` or a function of the angle; `ds(angle)` for a rim that dips; `off`, `tilt`); an end is open,
  flat, or a **dome** (`caps: [false, { dome, rings, zone }]`, laid as a disc in a zone of its own; under 0, a
  dimple); **`lining`** is the inside, facing inwards at an inset, with its rim and a closed end, in its own zone;
  **`seam`** says where the picture's edges meet; **`lie: "across"`** stands the surface up in its zone. Its
  picture **follows the real surface**: each band is as long in the zone as on the shape after `at`, a ring's `w`
  weighs its band, and `workshop.allot` shares a whole picture out between parts by their sizes.
- **A built surface says where it is**: `turn` returns it, and `surface.at(s, angle, out)` is the point of the
  built faces themselves, the normal there and its place in the picture. On it: **`M.ridge`** (a ridge or a bar
  along a path, its ends falling to a point, running out into the surface, or cut), **`M.band`** (round it),
  **`M.boss`** and **`M.studs`** (a row of rivets in one zone).
- **`M.leaf(rows, zone)`**: a thin sheet seen from both sides, each side with its own faces and normals (a `plate`
  with no thickness showed from one). **`M.tube(path, zone)`**: a tube or a tapering tail along a curve, to a
  point if its last radius is 0; it returns a surface too.
- **Creases**: a ring marked `crease: true` is a hard edge however gentle the bend, and a part's `smooth` is its
  own angle. Underneath, a corner may carry `group` and `smooth`, which `meshOf`, `buildMdl`, `swapMesh` and
  `putBody` honour; corners without them are smoothed as before.
- **`putBody(src, { name or body, tris, texture, bone, pose })`**: a body made from triangles into a model that is
  there, as a new body or in the place of one, on a bone, from points in the bone's space or in model space in a
  pose. It **warns** (in its result and on the console) when the body it replaces was painted for another layout,
  and when the file has a texture of that name with another picture. `layoutMoved(old, now, { body })` is the
  measure behind the first.
- **`carryPicture(old, now, { body, was, is })`**: a painted picture carried to a changed shape. A triangle that
  lies on the picture as it did keeps its pixels; with the old and the new triangles from the workshop the rest
  goes part by part, a ring that both shapes have being the same place and the bands that changed stretched; and
  without them by place, the nearest point of the old shape that faces the same way, which also puts the paint of a
  shape made another way on a new one. `places` on `turn` keeps the old rings on their pixels when one is added.
- **Measuring what is worn** (`src/wear.mjs`): `bodyIn` and `boxIn` (a body's triangles and its box in a bone's
  own space), `facingOf` (how a crown is tilted), `fitBetween` (the scale and shift from a man's piece to the
  woman's, from their points or their boxes), `clearance` (is the head inside the helmet, how many corners poke
  out, and the gap at the tightest place), `bodyCounts` (a body's triangles against the others of its file).
- **`graft(..., { missing: "ancestor" })`**: corners on a bone the target lacks (a jaw) hang on the nearest bone
  above it that it has, instead of the call throwing.
- **`together([...])`**: several models that share a skeleton by bone name as one model to draw: a helmet on a head
  with an armour is `sheet(together([armour, head, helmet]))`.
- `AGENTS.md`: the shape recipes use the new calls, and there are three new ones: a new body from triangles in a
  model that is there, a worn piece placed where the game's own sits and checked against what is under it, and
  changing a shape after it was painted.

Nothing that 0.5.0 had was changed or removed: `lathe`, `plate`, `tri`, `quad`, `meshOf`, `buildMdl`, `swapMesh`,
`graft` without its new option, `copyBody`, `paint` and the four kits give the same bytes as before on the
self-test's shapes, the kits and the five examples. A shape made by the newer calls has four fields more on each
corner (`of`, `q`, `group` and, when told, `smooth`).

**Mind**: `turn` is not the lathe under another name. Its picture is laid by the real surface and fills its zone
(the lathe went by `px` and the profile), and it turns its faces by how it is built, with no `inside` point. A
shape moved from `lathe` to `turn` needs its picture painted again, or carried: `carryPicture(old, new, { body })`.

## 0.5.1 (2026-10-12)

Out of three trials in which agents drove the editor's page as a person would (a surcoat, a plate armour, two
helmets): what was wrong in the page, and what they had to go round.

- **A body whose stored normals are all nothing is no longer drawn solid black** in the page (some of the game's
  own models store 0, 0, 0 for every corner: bodies 0 to 4 of Master Sword's `p_helmets.mdl`). The page's shader
  made a direction of them and got none; it now leaves such a normal as nothing, as `render` always did, and the
  two pictures agree: half lit.
- `copyBody` of such a body stores one normal where the original stores hundreds (282 to 1 on a helmet). That is
  left as it is, and a test now holds it: a copy stores each pair of bone and normal once, the engine lights a
  mesh's stored normals one by one from the bone and the three numbers alone, and a corner takes its light by
  its normal's number, so every corner is lit as before (read in Xash's `gl_studio.c`; `docs/ENGINES.md`).
- **`smak's picture` keeps the camera in use.** Ticking it switched the view to first person, and a model that
  is not a view model left the picture. It is now drawn from the page's own camera, whichever it is: in orbit
  from where the camera stands, what it turns about and how near, with the page's perspective.
- **`smak's picture` follows the camera**: asked for again when a drag of the camera ends, a moment after the
  wheel rests, and when the view changes size (it was redrawn only on a change of frame, body or project).
- **Both sides of every triangle**: the `both sides` box, or <kbd>F</kbd>. A face that is inside out and a thin
  sheet seen from behind show; off by default, as the game draws. `smak's picture` follows it, and
  `editor/cli.mjs render` takes `--both`.
- **A second body beside the first**: the `second body` box, or <kbd>V</kbd>. Another body of the same model,
  chosen by its own selects at the top of its view, from the same camera, animation and frame. For looking
  only: bones are picked and posed in the first view.
- **Adjustments for chosen colours only.** A click on a texture's picture in the *Textures* tab chooses a
  colour; the sliders then change only the palette colours like it (*how like*, 0 to 100, and *every colour
  but those* for the inverse), and the picture shows what is left alone dimmed. *All colours* is as before. It
  is kept in the project with the adjustments (`adjust.select: { colour, tolerance, invert }`) and baked the
  same by the page's server and by `editor/cli.mjs texture`, which takes `--select r,g,b`,
  `--select-at x,y`, `--tolerance n`, `--invert`, `--no-invert`, `--all-colours` and `--mask out.png`. How
  like two colours are counts their hue and its strength in full and their brightness by half, so a metal's
  light and dark shades are chosen together and the steel beside a brass is not. One selection a texture.
- **A picture dropped on a texture that has adjustments says so.** The adjustments stay and apply on top, and
  *Export PNG* gives the adjusted picture, so export, paint, drop tinted twice with no hint. The *Textures* tab
  now has a line saying that the replaced picture has adjustments on top, with *No adjustments* beside it; the
  status line says it when the picture is dropped; and *PNG without adjustments* (`--export out.png --plain`
  on the command line) gives the picture to paint on while the adjustments stand.
- **Hex digits for the tint that cannot be read are said** in the status line, and nothing is written. Before,
  the line was written over at once, and the tint became whatever shorter text had been readable on the way
  (`#c08` of `#c0804`).
- **A double click on the model in Orbit** makes the camera turn and zoom about that point; a double click
  beside the model, about its middle again.
- `render` takes `dist`: an orbit view with perspective, the eye that many units from `target`, `fov`
  degrees across. It is how the editor's server draws the page's orbit camera.
- The page's top bar goes onto a second row when the window is too narrow for it (it was cut off).

Projects made by 0.5.0 load as they are and bake to the same bytes, and `render` without `dist` draws the same
picture. Four things in the page behave otherwise: ticking `smak's picture` no longer changes the camera; in
orbit that picture is drawn from the page's camera with perspective, where it was a view without perspective
fitted to the model from the same side; unreadable hex digits for the tint write nothing; and a double click
on the 3D view moves what the orbit camera turns about (each of its two clicks still picks the bone under it).

## 0.5.0 (2026-10-12)

Out of a full plate armour painted with 0.4.0: a third of that agent's code was a mask module of its own, made
again in every round, because `paint` could not remember what was mail, strap or rim in the picture it began from.

- **Layers**: `paint(src, passes, { layers: { mail: fn, strap: fn } })`. A layer is a number from 0 to 1 for
  every pixel of a texture, made once from the picture as it was before the first pass (from a function of what
  `paint` hands its own, or from an image) and read in every pass as `layer.mail`, at the point asked about, so
  that with `soft` its edges come out soft. `layerAt(name, u, v)` reads it anywhere else. A later layer may read
  the ones declared before it.
- **Distance to a layer's edge**: `dist.mail`, in pixels, over 0 inside the layer and under 0 outside, so a rim
  is `0 < d < 2` and its dark line `2 < d < 3` where the plate's boundary lies inside an island and `edge` cannot
  serve. `distSmooth(name, r)` is that distance averaged, for a line that does not wander with the layer's noise.
- **Cleaning where a layer is declared**: `{ fn, blur, drop, fill, smooth }` softens it, drops regions under a
  size, closes pinholes and straightens its boundary (the layer, its regions and its distance then go by one line).
- **Regions**: `layersOf(src, layers, { pose, tex })` makes the layers on their own and gives each one's connected
  regions with their box, centre and size in pixels and their place on the body (`mn`, `mx`, `mid`): three straps
  and their buckles are found by rule and not with a measuring probe. `region.mail` in a pass is the region's id
  there. What `layersOf` returns can be handed to `paint` as its `layers`.
- **The original picture from any pass**: `orig(u, v)`, and `blur(r, { orig: true })`. `at` and `blur(r)` still
  see what the pass before left.
- **A blur that respects a layer**: `blur(r, { within: "plate" })`, `blur(r, { not: "mail" })`, still inside the
  island.
- **`busy(r)`**: how busy the picture was about a pixel (local contrast), for telling mail from plate by its
  texture where the colour is the same.
- **Seeing layers**: `layerMap(src, texture, layers)` and `smak layers <mdl> [layers.mjs] [name=expression ...]
  -o out.png` draw a texture with the layers tinted over it and list every region, as `islandMap` and
  `smak islands` do for islands. A layer can be tried in one line: `smak layers m.mdl "mail=busy(3)>0.25"`.
- `uvIslands` gives each island `bodies: [{ body, tris }]`: an island that two bodies lay on the same pixels
  counted its triangles for both in `tris` (it still does), and `smak islands --body n` now lists that body's own
  count and the sum.
- The editor: a run of arrow-key presses on a texture slider is one revision and one line of the log, written
  when the keys stop for a moment or the slider is left (each press wrote its own); the picture follows every
  press as before.
- The editor: a picture dropped on a texture no longer stays in `<name>.tex/` for ever. When another is dropped on
  that texture, its files that the project no longer names are removed but for the newest eight, so undo finds
  its picture eight replacements back; beyond that it says in words that the picture is gone.

Nothing that 0.4.0 had was changed or removed: the same calls of `paint`, `uvIslands`, `islandMap`, `pieces`,
`dropTriangles`, `copyBody`, `surface`, `check` and `render` give the same bytes as before, and a list of islands
has one field more. `paint` hands its function eight things more than it did and takes about a tenth longer over
the same call. Two things behave otherwise: `smak islands --body n` prints a body's own triangle counts where it
printed the sum over every body, and the editor writes a run of key presses once, a little after the last.

## 0.4.1 (2026-10-12)

- **The editor's page takes up by itself what changes under it**, within a second and without a reload: a model
  written into the folder (an empty folder's page opens the first that appears), the open model's file written
  anew by a script (read again, with the camera, body, frame, bone and undo kept), and, as before, every change
  to the project. A mark at the top right says `live`, what last changed and when, or `server away`.

## 0.4.0 (2026-10-12)

Out of an agent's first armour texture made with the kit, and what got in its way.

- **`paint` tells its function where it is painting**: beside the point, the normal, the colour and the texture,
  now the bone the point follows, its mesh, body and triangle, the pixel's `u` and `v`, and the **island** of the
  picture it is in (a trunk's front, a sleeve), with how far the pixel is from that island's border (`edge`) and
  from the nearest open stretch of it, a hem or an armhole (`open`).
- **Islands**: `uvIslands(src, pose)` lists them (texture, box, bones, place, the way each faces, how much of its
  border is open), `islandMap` and `smak islands <mdl> -o dir` draw each texture with its islands tinted and
  numbered, and `paint`'s new `islands` option paints the chosen ones only.
- **Soft edges**: `paint(..., { soft: 3 })` asks the function at 3x3 points inside each pixel and averages them.
- **Passes**: `paint(src, [pass, pass], options)` paints several layers in full colour and cuts each picture to
  256 colours once, at the end. A pass can read the picture as it stood before it at any pixel (`at`) and
  smoothed within its island (`blur`), to lose an old picture's fine detail and keep its light and shade.
- **`copyBody(src, body, name, texture)`**: a body again, as a new body after the others, wearing another texture.
- `smak pieces <mdl> --body n` lists that body's pieces (it listed every submodel's); `pieces` gives each piece's
  mesh (`where`), `dropTriangles` each triangle's number (`tri`), `posed` both and each corner's bone.
- The editor's texture sliders: a focused slider takes the arrow keys (they stepped the timeline instead), each
  has a number box beside it and the tint colour a box for its hex digits, and one change of the tint is one line
  of the project's log.
- `AGENTS.md` now says what is true of texture sizes (any size loads; `check` notes what GoldSrc stretches or
  shrinks) and that a model's rest pose can be turned from its animated one.
- The editor's browser tests take their models and their Playwright from `SMAK_MODELS` and `SMAK_PLAYWRIGHT`.

Nothing that 0.3.0 had was changed or removed: the same calls of `paint` write the same bytes, and scripts
written for it run as they are. One thing behaves otherwise in the editor's page: letting a slider go where it
stood no longer writes a revision that changes nothing.

## 0.3.0 (2026-10-12)

- **The editor** (`editor/`): `node bin/smak.mjs edit <folder of models>`, a page in the browser. Play and re-time
  an animation, pose a bone at a frame, thin an animation's keys so that it can be shaped by hand, add and move
  events, replace or adjust a texture, and save a model checked for GoldSrc or Xash. The models are only read: the
  work goes to a project file beside the saved model, and an agent makes the same edits on that file with
  `node editor/cli.mjs` (`editor/AGENTS.md`).
- It opens any model. A weapon in the player's hands (`v_<name>.mdl`) is shown as the player sees it, anything else
  from outside.
- An animation the game mixes from several (a player's aim up and down) is not posed, by the page or the command
  line: written from one set of frames it would lose the others. Its speed, looping and events can be changed, and
  a copy of it posed freely.
- The self-test covers the editor without a browser: 22 cases.

## 0.2.1 (2026-10-12)

- **A fault mended: models written by 0.2.0 and before can end a dedicated server (HLDS, ReHLDS) on a change of
  level.** They were written with their texture table, new textures or new animations after the first textures;
  the server's engine does not look there (`docs/ENGINES.md`, "The same file, appended to"). The clients draw such
  a file without complaint. Every function that changes a model now returns it laid out as the server reads it,
  and `check` refuses a file that is not.
- `engineLayout` (`src/layout.mjs`), which lays a model out so.

**Mind**: a model made with an earlier version that a server loads has to be mended once:
`writeFileSync(file, engineLayout(readFileSync(file)))`. Its numbers, shapes, animations and textures stay as they
were.

## 0.2.0 (2026-10-11)

- Working by place (`src/place.mjs`): `paint` across a texture's seams, `surface`, `spot`, `pieces` (a model's
  loose pieces), `dropTriangles`, and `graft` (parts from one model onto another with the same skeleton).
- The viewer: `smak view <folders>`, any two models side by side, turned and animated together.
- `smak pieces <mdl>`, `lineup` for before-and-after pictures, `workshop.fbm3` and `workshop.seeded`.
- `examples/05-by-place.mjs`.
- First run against another game: 13 player models of The Specialists, 20 variants made from them.

## 0.1.0 (2026-10-11)

The first release: the model tooling of the msr-web project, taken out to stand on its own.

- The reader and writer of GoldSrc studio models (`.mdl`, version 10): bones, bodyparts, meshes, textures, skins,
  animations, events, attachments, hit boxes; a model built from nothing (`buildMdl`), meshes replaced and added,
  textures replaced, animations replaced and added.
- `check` for GoldSrc and for Xash, pictures of a model (`render`, `sheet`, `strip`, `uvMap`), fitting a shape to
  a hand or a body, and the workshop for building shapes and painting textures.
- Kits for swords and knives, axes, blunt weapons and bows.
- The command line (`bin/smak.mjs`), four examples, the self-test, and the guide for an agent (`AGENTS.md`).
