# MCP parity with the CLI and the rest of the kit

Audit of 2026-10-16. Question: can a client that has only the Model Context Protocol (MCP) server, possibly
started with `--no-run`, do everything the command-line interface (CLI, `bin/smak.mjs`) and the kit's other
features do? Read from the code; every claim cites file:line. No code was changed.

Owner's principles this report is held to:

1. The MCP server inherits every feature.
2. No duplicate code: the MCP uses the existing code paths, and where the logic lives only in `bin/smak.mjs`,
   it moves to `src/` (or one shared module) so that the CLI and the MCP call one function.
3. A concern that applies to every kind (models, maps, sounds, sprites, textures, music) gets one mechanism and
   one statement, not a copy per kind.

## Summary

The MCP server has 11 tools (`mcp/tools.mjs:1123-1325`): guide, models, info, check, render, build,
decompile, entities, run, and with flags materials and generate. The CLI has 51 commands
(`bin/smak.mjs:2482-2903`).

```
Class      Count  Commands
FULL         2    build, video
PARTIAL     22    info, check, render, sheet, strip, gif, uv, obj, map-info, map-check, map-entities,
                  map-plan, map-view, map-views, map-reach, map-section, map-storeys, map-openings,
                  wad, wad-make, map-compile, map-decompile
RUN-ONLY    24    textures, islands, layers, retexture, sequence, sequence-set, sequence-add, reskin,
                  inline, pieces, import, item, scripts, map-fgd, map-learn, map-set, map-sweep,
                  map-textures, map-heights, map-light, map-measure, map-compare, play, contract
NONE         2    view, edit
n/a          1    mcp (the server itself)
```

So with `--no-run` a client loses 24 commands outright and most flags of 22 more. Everything that changes an
existing model or map (retexture, animations, re-skin, entity edits, compile of an edited .map) is RUN-ONLY.

Outputs a shell-less client cannot get even when the command runs: the protocol answers only `text` and
`image` (`mcp/protocol.mjs:23-30`) and serves only `initialize`, `ping`, `tools/list`, `tools/call`
(`mcp/protocol.mjs:93` and `mcp/README.md:164`). There is no audio content and no way to read a file back. So a built or generated
sound is a picture only (`mcp/tools.mjs:946`, `mcp/generate.mjs:229-230`); a video is a contact sheet, its
MP4 (MPEG-4 video) only on disk (`mcp/tools.mjs:848-853`); a GIF (Graphics Interchange Format animation) is a
strip of its frames (`mcp/tools.mjs:718-721`); a .map, a .json or a .wad written to the work folder cannot be
read or edited without `run`.

Duplication found: 22 places where `mcp/*.mjs` re-implements logic `bin/smak.mjs` or `src/` already has
(section "Duplication: MCP against CLI"), 8 copies of "read a model with its `<name>t.mdl`", and 9 places
where one rule or code path is repeated per kind (section "Repeated per kind").

The proposal closes every gap with 3 new tools and 3 extensions, all calling the CLI's own command functions
after those move out of `bin/smak.mjs` into `src/commands/`, so that no new parallel implementation is made.

## How the MCP server reaches the kit today

- Files: every tool reads only from `--models`, `--work`, the material library, or (for a `.mdl` named by its
  game path) the `--wads` game folders (`mcp/folders.mjs:138-174`); writes go to the work folder only
  (`mcp/folders.mjs:151-161`).
- `run` spawns Node on a script in the work folder with the kit linked as `smak` (`mcp/run.mjs:69-79` links
  the kit, `mcp/run.mjs:113-144` spawns and times out the child), kills it at its timeout,
  120 s unless told, 600 s at most (`mcp/run.mjs:30-31`). So a page or a session started inside `run` dies
  with the script.
- `run` scripts import `smak`, `smak/workshop`, `smak/maps`, `smak/play`, `smak/animate`, `smak/kits/*`,
  `smak/src/*` (`package.json` "exports"). `editor/project.mjs` is not exported: a script reaches it only by
  the relative path `./node_modules/smak/editor/project.mjs`.
- `--no-run` removes `run` (`mcp/tools.mjs:1324`).
- `guide` serves AGENTS.md, docs/API.md, ENGINES.md, MAPS.md, MAPS-MAKING.md, SPEC.md, and modules of
  `examples/` and `kits/` (`mcp/guide.mjs:19-28`, `fileOf` at `mcp/guide.mjs:53-59`). It cannot serve
  docs/IMPORT.md, docs/ITEMS.md, docs/PLAY.md, docs/MAPS-CHECKS.md or editor/AGENTS.md, though AGENTS.md
  sends readers to them.

## The matrix

```
Command or feature | Class | How through MCP | What is missing
-------------------+-------+-----------------+----------------
info <mdl>         | PARTIAL | info { model, full } (tools.mjs:129-194) | activity, actweight, movement, speed, motion type (bin 340-357, 433-439); --hitboxes list (bin 477-481; MCP gives only a count, tools.mjs:187); --boxes (bin 443); bone controllers (bin 458-465); eyes and header boxes (bin 300-308, 466); --json (bin 392). Events only with full.
check <mdl>        | PARTIAL | check { model, engine } (tools.mjs:406-429) | --source original.mdl: inherited warnings (bin 488-489; smak.check takes { source }, check.mjs:441)
render <mdl>       | PARTIAL | render { model, kind:"view", side|yaw/pitch, zoom, dist, first, body, seq, frame, size, save } (tools.mjs:444-458) | --view side|front|top orthographic (bin 268, render.mjs:63), --ground (bin 286), --skin (bin 272), --no-light, --no-cull (bin 284-285), --fov (bin 276), separate --width/--height (size only)
sheet <mdl>        | PARTIAL | render { kind:"sheet" } (tools.mjs:459) | --skin, --no-light, --no-cull; --size is derived from size/3
strip <mdl>        | PARTIAL | render { kind:"strip", seq, count, first, yaw, pitch } (tools.mjs:460-476) | --cols, --from, --to (bin 281-283), --view side --ground (the walk check AGENTS.md asks for), --skin, --no-light, --no-cull
gif <mdl>          | PARTIAL | render { kind:"gif", seq or "all", save, size, side|yaw/pitch, first, body } (tools.mjs:702-723) | --skin; view and ground are read (tools.mjs:705) but not in the schema (tools.mjs:1193-1228), so a client is never told; the GIF itself cannot be seen, only a strip
textures <mdl>     | RUN-ONLY | run: textureOf, rgbaOf, png | export of every texture as PNG or 8-bit BMP (bin 556-569). render kind uv shows one with triangles over it, not the plain picture
uv <mdl>           | PARTIAL | render { kind:"uv", texture, save } (tools.mjs:477-482) | one texture a call (bin 572-581 does all); otherwise same uvMap (render.mjs:629)
islands <mdl>      | RUN-ONLY | run: uvIslands (islands.mjs:55), islandMap (islands.mjs:176) | the list and the tinted pictures (bin 744-795)
layers <mdl>       | RUN-ONLY | run: layersOf (layers.mjs:79), layerMap (layers.mjs:109) | everything (bin 854-882). Its name=expression form compiles JavaScript (bin 801), so it is code by nature
retexture          | RUN-ONLY | run: textureFrom (image.mjs:492), replaceTexture (mdl.mjs:1536) | everything (bin 583-597)
sequence           | RUN-ONLY | run: readSequence (mdl.mjs:1679) | an animation as JSON (JavaScript Object Notation) (bin 608-626)
sequence-set       | RUN-ONLY | run: replaceSequence (mdl.mjs:1839) | everything (bin 648-666)
sequence-add       | RUN-ONLY | run: addSequence (mdl.mjs:1902), addSequenceFrom (mdl.mjs:1990) | everything (bin 648-690)
reskin             | RUN-ONLY | run: rulesOf (reskin.mjs:461), reskin (reskin.mjs:431) | everything (bin 694-720), even rules given as .json, which are data
inline             | RUN-ONLY | run: withTextures (mdl.mjs:1590) | writing the inlined file (bin 598-605); MCP reads t.mdl transparently (tools.mjs:79-86) but cannot save it
pieces             | RUN-ONLY | run: pieces (pieces.mjs:72), bodyOf (mdl.mjs:1627) | the list (bin 723-743)
obj                | PARTIAL | build: a model spec part { kind:"mesh", file:".obj" } (docs/SPEC.md:98) | not the same path: objModel (obj.mjs:632) keeps the .obj's own .mtl pictures, normals, scale/up/turn/ground/centre (bin 897-965); the spec part is re-laid-out, reduced and repainted by material. No .mtl pictures used
import             | RUN-ONLY | run: readModelFile (import-files.mjs:54), importModel (import-model.mjs:162), importRigged (import-rig.mjs:141), importFolder (import-files.mjs:176) | .fbx/.glb/.gltf, rigged import with animations, folder import, the summary (bin 1014-1096). docs/IMPORT.md not in guide
item               | RUN-ONLY | run: addItem (items.mjs:369), importPiece (import-model.mjs:323) | everything (bin 1127-1186). Needs a profile with items, and the only profile is a module (profiles/mastersword.mjs). docs/ITEMS.md not in guide
scripts            | RUN-ONLY | run: maps.scriptsPlaced (maps/scripts.mjs:60) via a profile's scriptPack | everything (bin 1238-1254); needs a module profile
view               | NONE | (run could start viewer/serve.mjs, but run kills it at its timeout, run.mjs:30-31) | a page the person keeps open; the agent's own check is render anyway
edit               | NONE | run can drive editor/project.mjs and editor/core.mjs by relative path only (not exported, package.json); the page cannot be kept up | the page; editor/cli.mjs's 15 commands (editor/cli.mjs:696-765); editor/AGENTS.md not in guide
map-info           | PARTIAL | info { model: x.bsp, full } (tools.mjs:212-271) | lumps table, title, light styles, visibility (bin 1495-1581); --json. MCP adds texture area shares (tools.mjs:238-265) the CLI lacks
map-check          | PARTIAL | check { model: x.bsp|x.map, engine, against } (tools.mjs:362-429) | --game (server's folders only), --wad for a .map's textures (bin 1614), --cache, --scripts/--shipped/--all (bin 1625-1630); a module profile is refused (tools.mjs:377-379); --learned is folded into against by sniffing (tools.mjs:375)
map-fgd            | RUN-ONLY | run: definitionsOfCode (maps/code.mjs:110), definitionsOfDll (maps/dll.mjs:86), joinDefinitions (maps/mod.mjs:201), writeFgd (maps/fgd.mjs:400) | everything (bin 1642-1672)
map-learn          | RUN-ONLY | run: learnEntities (maps/learn.mjs:214) | everything (bin 1677-1719); check against takes its output (tools.mjs:375) but nothing can make it
map-entities       | PARTIAL | info { model: x.bsp, full: true } (tools.mjs:225, 198-207) | --class filter, --json (bin 1722-1755)
map-set            | RUN-ONLY | run: setKey, removeKey, moveEntity, addEntity, removeEntity (maps/entities.mjs:350-418), withEntities (maps/entities.mjs:451) | everything (bin 1786-1835)
map-plan           | PARTIAL | render { kind:"plan", z, heights, grid, legend, reach, wad, size, save } (tools.mjs:516-528) | --area, --scale, --no-slice, --list, --no-entities/--labels, --light/--brightness/--no-light, --sky/--no-sprites, --models/--model/--body, --mod, --game (bin 1400-1451, 1838-1873); reach uses the walk test's defaults only
map-view           | PARTIAL | render { kind:"view", at, yaw, pitch, size, wad } (tools.mjs:529-539) | --to, --fov (bin 1875-1890), and every picture option above
map-views          | PARTIAL | render { kind:"views", count } (tools.mjs:540-550) | --cols and the picture options
map-sweep          | RUN-ONLY | run: sweepOf (maps/sweep.mjs:29) | everything (bin 2718-2728)
map-reach          | PARTIAL | check { walk, goal, doors } (tools.mjs:338-354); a tinted plan via render { kind:"plan", reach } | --jump (and speed, gravity), --start, --open, --shut, --exit, --walls, --cell, --no-parts, --no-slopes, --body, --mod, --json (bin 1453-1482, 1949-1973)
map-section        | PARTIAL | render { kind:"section", from, to, size } (tools.mjs:551-552) | --z, --scale, --near, --no-heights, --no-entities, --labels, --doors, --mod (bin 1974-2009)
map-storeys        | PARTIAL | render { kind:"storeys", reach } (tools.mjs:553-557) | --z list, --cols, --doors, picture options (bin 2010-2028)
map-openings       | PARTIAL | render { kind:"openings", count } (tools.mjs:558-567) | --both, --cols, walk options (bin 2029-2050)
map-textures       | RUN-ONLY | run: texturesFor (maps/wad.mjs:222), embeddedTexture (maps/bsp.mjs:642), textureRgba (maps/miptex.mjs:157) | everything (bin 2062-2085)
wad                | PARTIAL | info { model: x.wad } lists (tools.mjs:320-324); info { like, rect } matches a patch (tools.mjs:292-318, MCP only) | -o: each texture as PNG (bin 2086-2099)
wad-make           | PARTIAL | build a smak.wad/1 spec whose materials take picture with filter "literal" (docs/SPEC.md:359-410) | not the same path: writeWad of the pictures as given (bin 2101-2119, maps/wad.mjs:132); the spec route resizes and filters
map-heights        | RUN-ONLY | run: heightPlanOf (maps/heightplan.mjs:38) | everything (bin 2126-2139); a map spec's floorplan { dir } reads its output, which MCP cannot make
map-light          | RUN-ONLY | run: lightReport (maps/light.mjs:183) | everything (bin 2141-2156); build reports light per room of a spec map only
map-measure        | RUN-ONLY | run: maps.measure (maps/measure.mjs:187), measureTable (maps/measure.mjs:438) | everything (bin 2179-2214)
map-compare        | RUN-ONLY | run: compareOf (maps/draw.mjs:2624) | everything (bin 2219-2255)
map-compile        | PARTIAL | build of a map spec compiles (tools.mjs:816); decompile compiles its own output (tools.mjs:1066-1078) | compiling a .map the client wrote or edited: no tool takes a .map, and no tool can write one without run. --fast, --no-vis, --no-light, --wadinclude, --timeout, --progress (bin 2274-2301)
map-decompile      | PARTIAL | decompile { map, name, compile } (tools.mjs:1047-1080) | --no-canon/--no-tips/--no-cuts/--no-merge (bin 2319-2322); the .wad folders differ (MCP: --wads only, tools.mjs:1053; CLI adds the folder above maps/, bin 2314)
play               | RUN-ONLY | run: smak/play (playSession play.mjs:801, browserDriver play-browser.mjs:300, serveSession play-session.mjs:55, attachSession play-session.mjs:224) | everything (bin 2341-2480); a --serve session dies with the run script; docs/PLAY.md not in guide
build              | FULL | build { spec, reference, focus, preview } (tools.mjs:803-1034) | the CLI calls the MCP tool (bin 1288-1305)
contract           | RUN-ONLY | run: contractOf, compareContract (contract.mjs:13, 40) | everything (bin 1312-1329)
video              | FULL | build { spec: smak.video/1, preview } (tools.mjs:835-855) | --models is the server's folders; the MP4 cannot be watched by a remote client
mcp                | n/a  | the server itself | bin 1277-1285 does not pass --hide/--refuse, which mcp/server.mjs:50-51 accepts
-------------------+-------+-----------------+----------------
Other features
viewer (smak view) | NONE | see view | a long-lived page server
editor + project   | NONE/RUN-ONLY | see edit | page NONE; project file RUN-ONLY by relative import
video              | FULL | build | MP4 not viewable remotely
play (Playwright)  | RUN-ONLY | run | needs Playwright and the browser build on the server machine; sessions do not outlive run
generators         | FULL with --generators | generate (tools.mjs:1299-1322, generate.mjs) | takes are .wav/.obj on disk; a sound is a picture only (no audio content); filling the generators folder (generators/install*.sh) is setup, outside MCP
materials library  | FULL with --materials | materials (tools.mjs:1288-1298, materials.mjs:42) | filling it (generators/fetch-materials.mjs) is setup, outside MCP
mod profiles       | PARTIAL | check { against: "goldsrc" | profile.json } (tools.mjs:362-384) | the kit's only mod profile is a module (profiles/mastersword.mjs), refused without run (tools.mjs:377-379); profiles/ is not inside the folders, so even a .json profile must be copied into work; --mod is absent from every render kind
spec smak.model/1  | FULL | build | (prop, held weapon, character on a base: docs/SPEC.md:44-500)
spec smak.map/1    | FULL | build | (docs/SPEC.md:840-1179)
spec smak.sound/1  | FULL | build | the .wav cannot be heard by the client
spec smak.music/1  | FULL | build | the .mp3/.wav cannot be heard
spec smak.wad/1    | FULL | build |
spec smak.sprite/1 | FULL | build | the -animated.png written beside it is not returned (tools.mjs:870-871)
spec smak.video/1  | FULL | build | see video
guide documents    | PARTIAL | guide { doc } | IMPORT.md, ITEMS.md, PLAY.md, MAPS-CHECKS.md, editor/AGENTS.md (mcp/guide.mjs:19-26)
```

## Duplication: MCP against CLI

Each line: what is done twice, the MCP side, the CLI or `src/` side.

```
 #  What                                         MCP side                       CLI / src side
 1  read a .mdl with its <name>t.mdl             mcp/tools.mjs:79-86            bin/smak.mjs:255-264
 2  the header constants for #1                  mcp/tools.mjs:58-60            bin/smak.mjs:21-22
 3  "rest"/digits/name to an animation           mcp/tools.mjs:88-93 (seqOf)    bin/smak.mjs:235-245 (firstSeq, seqAsked, seqOf)
 4  a model's info (bones, bodies, textures,     mcp/tools.mjs:129-194          bin/smak.mjs:292-371 (describe), 390-482
    animations, attachments), built twice and
    differently (MCP drops activity, movement...)
 5  texture flag names                           mcp/tools.mjs:119-123          bin/smak.mjs:385-389
 6  a compiled map's info                        mcp/tools.mjs:212-271          bin/smak.mjs:1495-1581 (describeMap, mapInfo)
 7  an entity as a line (place, key=value)       mcp/tools.mjs:198-207          bin/smak.mjs:1740-1752
 8  a .wad's texture list                        mcp/tools.mjs:320-324          bin/smak.mjs:2086-2099
 9  the check verdict lines ("fit for ...",      mcp/tools.mjs:417-428          bin/smak.mjs:490-499, 1618-1635
    "N errors: not fit for ...")
10  --mod/--fgd/--learned into checkBsp options  mcp/tools.mjs:362-384          bin/smak.mjs:1587-1604
    (goldsrc -> GOLDSRC with folders)            (againstMod)                   (profileOf, definitionsGiven)
11  the walk test's report lines                 mcp/tools.mjs:338-354          bin/smak.mjs:1937-1944 (sayReach)
12  "9, keeper" to entity numbers/names          mcp/tools.mjs:328-335          bin/smak.mjs:1427 (entityName)
13  where a map's .wad files are looked for       mcp/tools.mjs:488 (mapFolders) bin/smak.mjs:1390 (gameFolders); different order
14  a view's eye from a point or an entity       mcp/tools.mjs:491-499          bin/smak.mjs:1875-1890 (standOf)
15  "x y" points parsed                          mcp/tools.mjs:502-510          bin/smak.mjs:1364-1373 (numbersOf)
16  map picture options per kind                 mcp/tools.mjs:515-568          bin/smak.mjs:1838-2050
17  what a map picture shows, as lines           mcp/tools.mjs:571-615          bin/smak.mjs:1866-1870, 1905-1913, 1997-2008,
                                                                                2023-2027, 2045-2049
18  "body N shows no triangles. Its body         mcp/tools.mjs:433-440, 682-683 bin/smak.mjs:520-528
    numbers: ..."
19  named camera sides                           mcp/tools.mjs:65-73 (SIDES)    src/render.mjs:63-67 (NAMED_VIEWS): two vocabularies
20  GIF file naming <stem>-<nn>-<name>.gif       mcp/tools.mjs:715              bin/smak.mjs:543
21  decompile, with its .wad folders and a       mcp/tools.mjs:1047-1080        bin/smak.mjs:2310-2333; the four .wad names are
    hard-coded list of Valve .wad names                                         hard-coded at mcp/tools.mjs:1063 only
22  the server's flags parsed twice              mcp/server.mjs:41-55           bin/smak.mjs:1277-1285 (drops --hide, --refuse)
```

Reverse dependency, not a copy but in the wrong place: `bin/smak.mjs:1288-1305` (build) and
`bin/smak.mjs:1342-1357` (video) import `mcp/tools.mjs` to build a spec, so the spec pipeline's file writing
lives in the MCP module (`mcp/tools.mjs:803-1034`) instead of `src/spec/`.

## Duplication: CLI against src, and inside the CLI

```
 #  What                                         Where
 1  read a .mdl with its <name>t.mdl: 8 copies   bin/smak.mjs:255-264, bin/smak.mjs:1331-1336 (a second copy in
                                                 the same file), mcp/tools.mjs:79-86, viewer/serve.mjs:92-95,
                                                 editor/project.mjs:56-61, src/spec/model.mjs:2402 and 2523,
                                                 src/maps/figures.mjs:91-93. Three different tests for "no
                                                 textures inside" (header int at 180; readMdl().textures.length;
                                                 none at all in figures.mjs). Belongs next to withTextures,
                                                 src/mdl.mjs:1590
 2  picture format sniffing                      bin/smak.mjs:2104-2109 (wad-make) against unpicture,
                                                 src/image.mjs:471
 3  obj reads only PNG and BMP                   bin/smak.mjs:915 against AGENTS.md ("PNG, BMP or JPEG") and
                                                 unpicture; a second picture rule
 4  check of both engines, printed once          bin/smak.mjs:950-963 (obj) is sayChecks, bin/smak.mjs:994-1009
 5  model info built only in the CLI             bin/smak.mjs:292-371 (describe): logic, not printing, in bin
 6  map info built only in the CLI               bin/smak.mjs:1495-1533 (describeMap)
 7  flags into reachOf, plan, view options       bin/smak.mjs:1400-1482: logic the MCP needs, held in bin
 8  editor's own render and strip                editor/cli.mjs:626-687 wrap smak.render/strip again with
                                                 their own option parsing
```

## Repeated per kind

One concern, written again for each kind:

```
 #  Concern                                      Copies
 1  "write the spec beside what it made"         mcp/tools.mjs:815 (map), 847 (video), 864 (sprite), 884 (wad),
                                                 939 (sound), 955 (music), 975 (model): seven branches, seven
                                                 file-name rules
 2  how a spec reads a picture or a file         pictureReader (mcp/tools.mjs:783-796) for map and wad; ad hoc
                                                 readers at 859 (sprite), 928 (sound), 968 (model); readFile at
                                                 816, 879, 928, 951, 968. A sprite or a sound cannot name a
                                                 picture beside its spec file, a map can
 3  "written: work:..." lines                    mcp/tools.mjs:821, 851, 873, 885, 945, 961, 979, 997
 4  what changed since the last build            only map and model (mcp/tools.mjs:819, 976); sound, music,
                                                 sprite, wad and video never say
 5  the material-photograph rule, restated       mcp/tools.mjs:1112 (paintedOnly), 1236 (build's description),
                                                 1291 (materials' description), mcp/materials.mjs:51,
                                                 docs/SPEC.md:359. One paragraph should be referenced
 6  "use a generated take in a spec", restated   mcp/tools.mjs:934 (sound build note), 1303 (generate's
                                                 description), mcp/generate.mjs:225 and 285, docs/SPEC.md:589
 7  sidecar .json of a take                      mcp/generate.mjs:207 (sound/music) and 268 (shape)
 8  map picture option assembly in the CLI       bin/smak.mjs:1841-1844, 1893-1897, 1918-1921, 1984-1985,
                                                 2015-2018, 2034-2037, 2231-2234: seven commands repeat
                                                 pictureOptions + figureOptions + profileOf
 9  walk test folded into a plan                 bin/smak.mjs:1856 (map-plan) and 2021 (map-storeys)
```

## Proposal

### Step 0: one home for every command's logic (precondition, no new behaviour)

Move each command function out of `bin/smak.mjs` into `src/commands/<area>.mjs` (`model.mjs`, `map.mjs`,
`texture.mjs`, `play.mjs`, `editor.mjs` re-exporting editor/cli.mjs's table), changed in three ways only:

- It returns `{ lines, files, pictures, exit }` instead of `console.log` and `process.exit`.
- It takes plain options (`{ seq, body, jump, ... }`), produced from argv by the one parser that already exists
  (`parseArgs`, bin/smak.mjs:164, and its helpers numberOf, numbersOf, namedValues, seqAsked).
- It takes a `files` resolver: `{ read(name), write(name), exists(name) }`. The CLI passes plain paths; the
  MCP passes `pathOf` (mcp/folders.mjs:138), so the folders rule stays where it is.

`bin/smak.mjs` keeps `parseArgs`, `checkFlags`, HELP, and a printer of the result. Then:

- `describe` (bin 292) and `describeMap` (bin 1495) become `src/describe.mjs`; MCP `info` formats from them,
  deleting MCP duplicates 4, 5, 6.
- `pictureOptions`, `figureOptions`, `reachOptions`, `profileOf`, `definitionsGiven`, `standOf`, `gameFolders`
  (bin 1387-1604, 1875) become `src/commands/map-options.mjs`, taking plain values; the MCP `render` and
  `check` call them, deleting MCP duplicates 10 to 17 and per-kind copies 8 and 9.
- `readStudio(file)` beside withTextures (src/mdl.mjs:1590) replaces the 8 copies of reading `<name>t.mdl`.
- `seqOf` once in `src/` (render.mjs or mdl.mjs); MCP `SIDES` merged into `NAMED_VIEWS` (src/render.mjs:63).
- The spec pipeline (mcp/tools.mjs:803-1034) moves to `src/spec/build.mjs` with ONE `writeBuilt(kind, spec,
  files)` and ONE `readers(folders, specFolder)` used by every kind, and `changedSince` for every kind. The CLI
  `build`/`video` and the MCP `build` call it; `bin` no longer imports `mcp/`.
- `mcp` command: `bin/smak.mjs:1277` calls `mcp/server.mjs`'s own `parseArgs` (server.mjs:41) on the raw argv.

### New tool 1: `command` (closes every RUN-ONLY and PARTIAL line above with one mechanism)

```
command { name, args: [string], show: [png names] }
```

`name` is a CLI command; `args` are its words and flags exactly as the CLI takes them (HELP is the reference,
not restated in the tool's description: the description says "the CLI's commands, `guide { doc: "cli" }` lists
them"). It calls `src/commands/<area>.mjs` with `pathOf` as its resolver, so every flag the CLI has, the MCP
has, the day it is added. Output files go to the work folder (`-o` is a work path); `show` returns up to three
PNG files it wrote, as `run` does (mcp/run.mjs:227-235). The function each `name` reaches:

```
name          function (today's CLI call site)                               care
info          describe (bin 292 -> src/describe.mjs)                         -
check         smak.check (check.mjs:441; bin 489)                            -
render/sheet/ smak.render/sheet/strip (render.mjs:248/564/585; bin 530)      -
strip
gif           animationGif/animationGifs (anim-gif.mjs:16/42; bin 542, 550)  writes work files
textures, uv  textureOf/rgbaOf/bmp, uvMap (render.mjs:629; bin 556-582)      writes work files
islands       uvIslands, islandMap (islands.mjs:55/176; bin 744-795)         -
layers        layersOf, layerMap (layers.mjs:79/109; bin 854-882)            CODE: expressions and modules run
                                                                             JavaScript; refused under --no-run
retexture     textureFrom, replaceTexture (image.mjs:492, mdl.mjs:1536)      writes a new .mdl, never over models
sequence*     readSequence, replaceSequence, addSequence, addSequenceFrom    writes a new .mdl
              (mdl.mjs:1679/1839/1902/1990; bin 608-690)
reskin        rulesOf, reskin (reskin.mjs:461/431; bin 694-720)              .json rules: data; .mjs rules: CODE
inline        withTextures (mdl.mjs:1590; bin 598)                           -
pieces        pieces, bodyOf (pieces.mjs:72, mdl.mjs:1627; bin 723)          -
obj, import   objModel, readModelFile, importModel, importRigged,            folder import is long-running
              importFolder (obj.mjs:632, import-files.mjs:54/176,
              import-model.mjs:162, import-rig.mjs:141; bin 897-1096)
item          addItem (items.mjs:369; bin 1127-1186)                         piece .mjs and profile .mjs: CODE;
                                                                             a bought .fbx/.obj piece is data
scripts       scriptsPlaced (maps/scripts.mjs:60; bin 1238)                  needs a profile (CODE today)
contract      contractOf, compareContract (contract.mjs:13/40; bin 1312)     -
map-*         the bin map functions (bin 1534-2333) on src/commands/map.mjs  map-compile: long-running, runs
                                                                             the outside compilers (as build
                                                                             already does); map-fgd/map-learn
                                                                             over a whole mod: long-running
wad, wad-make readWad, writeWad (maps/wad.mjs:79/132; bin 2086-2119)         -
play          play.mjs functions (bin 2341-2480)                             starts a headless browser;
                                                                             long-running; --serve needs the
                                                                             session tool below
```

Under `--no-run`, `command` refuses only what loads code: a `.mjs`/`.js` argument (layers, reskin, item,
--mod) and `layers` name=expression. That is one rule, in one place (the resolver), not one per command.
`view` and `edit` are refused here and go to `page`.

Care for all: `command` writes only under `--work` (the resolver's `write` is `pathOf(..., { write: true })`);
a call that runs long takes the same `timeout` and cancellation as `run` (mcp/run.mjs:205, 217).

### New tool 2: `page` (view, edit, and a play session: the things that must outlive a call)

```
page { kind: "view" | "edit" | "play", files: [names], port, stop }
```

Starts `viewer/serve.mjs` (as bin 1259-1264), `editor/serve.mjs` (as bin 1265-1273, with `--work` the MCP work
folder) or a play session (`serveSession`, play-session.mjs:55, as bin 2444-2461) inside the MCP server's own
process, so it lives until `stop` or until the server exits; returns the address. Care: opens a port on the
person's machine; the page needs a browser on the machine the server runs on (fine for Claude Desktop and
Claude Code, which start the server locally); one page of each kind at a time. The editor's project commands
(editor/cli.mjs:696-765) are `command { name: "editor", args }`, so an agent works the shared project file as
editor/AGENTS.md describes, without `run`.

### New tool 3: `file` (see and write what was made: closes the "cannot get" outputs)

```
file { name, text }   no text: read; with text: write (work folder only)
```

Read returns, by kind, through one function: text for .map/.json/.txt/.fgd/.qc (cut as run's output is,
mcp/run.mjs:81-97), an image for .png/.gif first frame/.bmp/.jpg (through `pictureWithin`, run.mjs), AUDIO
content for .wav/.mp3 (a new `audio(bytes, mime)` beside `image` in mcp/protocol.mjs:26; MCP versions
2025-03-26 and later carry audio, and protocol.mjs:12 already offers them), and for other binaries its size
and a note. Write takes text files only (a .map to compile, rules.json, steps.json, rooms.json, seq.json), so
the decompile, edit, compile loop works with no `run`. Care: writes the work folder only, never models.

### Extensions

- `guide`: add `cli` (HELP from the COMMANDS table, bin 2904-2909), `import`, `items`, `play`,
  `maps-checks`, `editor` to DOCUMENTS (mcp/guide.mjs:19-26). One table, no other change.
- `build` and `generate`: return audio content for sounds and music through the same `audio()` (one place),
  and the sprite's animated picture; move the restated guidance (per-kind table rows 5 and 6) to one SPEC.md
  paragraph each, which the tools name by `guide { doc: "spec", find: ... }`.
- `info`, `check`, `render`: keep them (their short descriptions are what a client reads every conversation),
  but make each a thin call into the Step 0 functions, so that their output is the CLI's. Their missing flags
  are then either added to their schemas from the same option builders, or reached through `command`.

### What this leaves out

Setup that is not the kit's work stays outside MCP: installing generators (generators/install*.sh), filling
the material library (generators/fetch-materials.mjs), installing Playwright or the compilers. And
mcp/README.md is stale against the code: it says "all eight" tools (mcp/README.md:68-69) while there are
eleven, and its table lacks `decompile`.
