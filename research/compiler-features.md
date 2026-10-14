# SDHLT's features, against the kit and the map spec

What the compilers SMAK drives can do, read from their source and docs and measured where it matters, and how
each should reach the map spec (`smak.map/1`). The compilers are SDHLT v1.3.0 (seedee's fork of Vluzacn's ZHLT
v34), built at `/media/Data3/Packages/SDHLT` (sources `src/sdhlt/*`, binaries and `sdhlt.fgd`, `settings.txt`,
`wad.cfg`, `lights.rad` in `tools/`). Researched 2026-10-14. Nothing in the kit was changed.

Names used below: CSG is `sdHLCSG` (constructive solid geometry: brushes cut against each other, textures
looked up), BSP is `sdHLBSP` (binary space partition: the draw tree, the three collision trees called clip
hulls, leak finding), VIS is `sdHLVIS` (what can be seen from where), RAD is `sdHLRAD` (radiosity: the baked
light), RIPENT is `sdRIPENT` (entity and texture import and export on a finished `.bsp`). A luxel is one
sample of baked light: one every 16 texture pixels of a face. AllocBlock is the engine's packing of every
face's lightmap into 128 x 128 blocks, 64 of them at most ("AllocBlock: full" when they run out).

The scripts and their output are in `research/compiler-bench/` (`harness.mjs`, `bench1.mjs` to `bench4.mjs`,
`bench*.out`, `seal-tests.json`); "Measurements" below says what each case was.

## Summary: the twelve to implement first

Ranked by value for generated maps, the near-limit tricks first. Every number is from the measurements below.

| # | Feature | What it buys (measured) | Kit today | Proposed spec form |
| --- | --- | --- | --- | --- |
| 1 | `-threads N` on all four tools | On Linux SDHLT runs ONE thread unless told (`threads.h:24`). VIS of the furniture hall: over 600 s single-threaded (stopped), 77.5 s with 12. RAD of the detail hall: 4.04 s against 0.65 s | `compileMap` passes no `-threads` (`compile.mjs:442`); its VIS guess was measured on Windows with 12 threads | `"compile": { "threads": "auto" }`, and `compileMap({ threads })` defaulting to `os.availableParallelism()` |
| 2 | Furniture and prefabs as `func_detail` | Portals 2592 to 4, VIS 77.5 s to 0.01 s, faces 2791 to 1987, luxels 66039 to 42488, AllocBlock 5 to 3. Clipnodes unchanged (2113 to 2094). It does NOT seal: a `func_detail` in a hole leaks | Every prefab and furniture box is a world brush (`spec/map.mjs:376`, `:628`) | `"furniture": [{ "prefab": "table", "as": "detail" }]`, spec default `"detail": true`; `"detail": { "level": 1, "chopdown": 0, "priority": 0 }` on a prefab for the rest of the `zhlt_*` keys |
| 3 | Simple collision for detailed furniture: `zhlt_noclip 1` on the detail, one `CLIP` box round each piece of furniture | Clipnodes 2094 to 832 (-60%), planes 1292 to 810 | Not offered | `"collide": "box"` on a prefab or a furniture entry (the box of its pieces, or `"collide": [[min, max], ...]`); `"collide": "none"` for what nobody bumps (a lantern, a beam overhead) |
| 4 | `zhlt_usemodel` for brush entities repeated (24 tables as `func_wall`) | Models 25 to 2, faces 1486 to 152, clipnodes 2130 to 106. Every copy wears the template's baked light | Not offered | `"furniture": [{ "prefab": "table", "as": "wall", "share": true }]`: the first of a prefab becomes the template (`targetname`), the rest point entities with `zhlt_usemodel` and an `origin`; the template needs an ORIGIN brush, and the copies keep its turn |
| 5 | Texture scale per material (luxels follow the texture: one every 16 texels) | Room surfaces at scale 2: luxels 42488 to 24044, light 128 KB to 73 KB, AllocBlock 3 to 2; at scale 4: 19431, 59 KB | Builders take `{ name, scale }` (`source.mjs:193`), the spec does not pass it through (`spec/map.mjs:431`) | `"theme": { "wall": { "base": "plaster", "scale": 2 } }` and the same on `textures`; a spec-level `"lightScale"` that multiplies every room surface |
| 6 | `NULL` on faces no one sees | NULL under the 48 table and bench tops: faces 1987 to 1603, marksurfaces 3452 to 3004, luxels 42488 to 39450. NULL seals (a NULL wall stopped the leak) | Piece textures take `{ top, bottom, sides }` (`source.mjs:196`) but the spec takes one word a piece | Piece texture as faces: `{ "box": [...], "texture": { "top": "furniture", "bottom": "null" } }`, and `"hidden": "auto"` that NULLs piece faces lying within 1 unit of a room's floor, wall or ceiling |
| 7 | `-nohull2`, `-nohull3` | World hall: clipnodes 2113 to 1384 (no hull 2) or 1408 (no hull 3). Large monsters and pushables (hull 2) or crouching players (hull 3) then pass through the world | Not offered | `"compile": { "hulls": { "large": false, "crouch": false } }`, refused unless the mod's profile says it has no such bodies |
| 8 | Decoration with no collision | `func_illusionary` still gets clip hulls (2954 clipnodes) unless CSG has `-clipeconomy` (528). `zhlt_noclip` does it on any entity without the flag | Not offered | `"collide": "none"` (item 3) writes `zhlt_noclip 1`; `"compile": { "clipEconomy": true }` for maps with `func_illusionary` |
| 9 | The compilers' own chart in the report | SDHLT prints `* AllocBlock 5/64`, `* worldleaves 771/8192`, `* worldfaces 2791/32768` and every lump after each tool (`bspfile.cpp:1050-1068`). Its AllocBlock matched a GLQuake-style packing written for this research in every case | `compileMap` reads errors and leaks only; `checkBsp` has no AllocBlock or 8192-leaf check | `report.limits`: each chart row as `{ used, most }`, a warning from 75% (the kit's `NEAR_LIMIT`) |
| 10 | Studio model shadows (`zhlt_studioshadow`, `zhlt_shadowmode`) | Floor under a 64-unit crate model: 175 without, 37 with (mode 1 or 2) | Props are `cycler_sprite` with no shadow key (`spec/map.mjs:680`). RAD looks for the `.mdl` in the parent of the map's folder (`qrad.cpp:4219`, `studio.cpp:19`); `compileMap` works in `/tmp/smak-map-*/name.map`, so it would look in `/tmp/models/` | `"props": [{ "model": "crate", "shadow": true }]` (`"box"` for mode 0, `"thick"` for mode 2); `compileMap` compiles in `work/maps/` with `work/models` pointing at the spec's `models/` |
| 11 | Light quality switches | `-bounce 0`: floor mean 94 to 79; `-ao`: floor mean 94 to 92, 6% more RAD time; `-extra` 45% more RAD time; `%20NAME` floor 0 to 63; `_minlight 0.3` to 132; `-minlight 40` to 40 | `compileMap` has `fast` only; the spec has room lamps, sun, night sky, texture lights | `"compile": { "quality": "final", "light": { "extra": true, "ao": true, "bounce": 8, "pcf": 1, "minlight": 0 } }`; per material `"minlight": 0.2` (written to `info_minlights`) |
| 12 | `SOLIDHINT` on hidden terrain sides; `zhlt_lightflags 2` on brush entities | Terrain: leaves 357 to 268, portals 1491 to 1002, faces 795 to 577, VIS 4.2 s to 2.7 s. Opaque `func_wall` furniture: floor mean 99 to 94 (it now shadows; a `func_wall` does not by default) | `terrain()` takes `{ top, sides, bottom }`; brush entities never get `zhlt_lightflags` | `terrain(..., { hidden: "solidhint" })` and the same in a spec terrain; `"opaque": true` on a furniture entry, a door link (`"door": { "opaque": true }`) |

What did not pay in these tests, so it stays lower: HINT brushes (an L-shaped hall: 8 leaves seen on average
without, 9 with), `-maxnodesize` (no change on terrain), `-cliptype` other than the default `simple` (precise
and smallest gave 24% and 54% more clipnodes on terrain, with "Ambiguous leafnode content" warnings),
`zhlt_clipnodedetaillevel 0` (2094 to 2117), `BEVEL` and `BEVELHINT` on terrain sides (clipnodes 3150 to
4500), `-chop`/`-texchop` (RAD time only; the `.bsp` is the same size).

Three faults found on the way, each worth a line in the kit's docs:

- `-subdivide 512` makes RAD stop with `Bad surface extents (30 x 16)`, and the `.bsp` is left with no light.
  Keep the default 240 (`bsp5.h:36`: 15 luxels a side).
- `%NAME` with no number gives no minlight at all, though the README says it means 1.0
  (`lightmap.cpp:5520-5547`: the `else` belongs to the length test). `%20NAME` works, and the number is light
  before gamma: 20 came out as 63 in the lightmap, as did `_minlight` (0.3 gave 132). `-minlight 40` is the
  final byte (40).
- The kit's plan check counts a `SKIP` brush as a wall (`plan.mjs:36`, `SEALS_NOTHING` has no `skip`), but it
  leaks (measured). Its walk test counts `SOLIDHINT` as nothing to a body (`space.mjs:93`), but it seals hull 0
  and all three clip hulls.

## The full table

Columns: what it does; the limit or quality problem it answers; where the kit stands; the proposed spec form.
"Not for generated maps" means no case in the spec's reach needs it.

### Texture names

| Name | What it does (source) | Answers | Kit | Spec |
| --- | --- | --- | --- | --- |
| `NULL` | Face not drawn, no lightmap, stripped by BSP (`textures.cpp:800`, `qbsp.cpp:859`). A brush all NULL is solid and seals (measured) | faces, marksurfaces, luxels, AllocBlock | Builders take it; plan knows it as a tool texture (`plan.mjs:29`) | Item 6 |
| `SKIP` | Face removed; a brush of it is empty (`brush.cpp:963`). With HINT it fills the hint brush's other faces | hint brushes | Plan wrongly counts it as sealing | Only inside hint brushes the kit writes |
| `HINT` | Faces that make BSP split there, then removed (`qbsp.cpp:892`); the brush is empty (leaks, measured) | VIS time, leaves seen | Not offered | `"hints": [{ "between": ["hall", "yard"] }]`, low rank |
| `SOLIDHINT` | Like HINT but on faces inside solid: removes the face without splitting (`qcsg.cpp:406`, `brush.cpp:955`). Brush contents NULL: seals (measured) | faces, leaves, portals on hidden sides | Not offered; walk test treats it as passable | Item 12 |
| `BEVEL` | Face turned NULL and marked bevel: no bevel planes from it in the clip hulls (`map.cpp:283`) | clipnodes on odd shapes; measured worse on terrain sides | Not offered | Not now |
| `BEVELBRUSH` | Whole brush bevel-marked, faces NULL (`map.cpp:278`) | as BEVEL | No | Not now |
| `BEVELHINT` | SOLIDHINT and BEVEL at once (`map.cpp:288`, README) | as both; measured worse on terrain sides | Not in the kit's tool list | Not now |
| `CLIP` | Solid in hulls 1 to 3 only, empty in hull 0 (`map.cpp:292-309`, `:609-640`); a brush mixing CLIP and other faces is split in two | clipnodes of detailed shapes; invisible walls | Builders take it; walk test knows `clip` (`space.mjs:94`) | Item 3 |
| `CLIPHULL1/2/3` | CLIP in that hull alone (`map.cpp:296`) | per-body walls (a monster-only gap) | Name known to plan | `"collide": { "hulls": [1] }` later |
| `CLIPBEVEL`, `CLIPBEVELBRUSH` | CLIP with BEVEL on the face, or the brush (`map.cpp:300-307`) | smoother sliding on clip ramps | Name known | Not now |
| `NOCLIP`, `NULLNOCLIP` | Brush NULL with no clip hulls (`map.cpp:273`): seals hull 0, leaks hulls 1-3 (measured) | clipnodes | Plan counts it as sealing nothing (wrong for hull 0) | Through `zhlt_noclip` instead |
| `ORIGIN` | The brush's middle becomes the entity's `origin`; brush removed (`map.cpp:507`) | rotating entities, `zhlt_usemodel` | `originBrush` (`source.mjs:1050`) | Used by item 4 |
| `BOUNDINGBOX` | Sets `zhlt_minsmaxs` of a brush entity; refused in the world (`map.cpp:557`; measured error) | entity box size | No | Not for generated maps |
| `CONTENTEMPTY`, `CONTENTSOLID`, `CONTENTWATER`, `CONTENTSKY` | Brush takes that contents, faces NULL (`brush.cpp:903-910`, `map.cpp:481`) | invisible water, invisible solid | Plan lists EMPTY and WATER | Not now |
| `SPLITFACE` | Cuts the faces it touches along its edges, then gone (`map.cpp:476`, `brush.cpp:959`) | lighting seams, like `zhlt_chopdown` | Not in kit's list | Not now |
| `AAATRIGGER` | Made NULL unless `-nonullifytrigger` (`map.cpp:489`) | trigger faces | Plan knows it | As is |
| `sky`, `env_sky` | Sky contents; faces not lit (`brush.cpp:911-917`); a sky brush also gets a clip brush (`-noskyclip` stops it, `map.cpp:598`) | | Rooms with `sky: true` | As is |
| `!name` | Water; `!lava`, `!slime` (also `*!lava`); `!cur_0`, `!cur_90`, `!cur_180`, `!cur_270`, `!cur_up`, `!cur_dwn` are currents (`brush.cpp:921-946`) | | Room `water` (`spec/map.mjs:563`) | `"water": { "current": "east" }` later |
| `%name`, `%Nname` | Minlight for faces wearing it (`lightmap.cpp:5520`); `%N` before gamma; `%` alone with no digit does nothing (measured; README disagrees) | dark corners | No | Prefer `info_minlights` (item 11): no renaming |
| `@name`, `translucent*` | Brush contents TRANSLUCENT (`brush.cpp:966-970`) | not investigated | No | No |
| `{name` | RAD alpha-tests it for opaque entities' shadows (`trace.cpp:696`, `loadtextures.cpp:382`) | shadows through grates | Kit makes `{` textures (`miptex.mjs:251`) | As is |
| `+0name`, `-0name` | CSG pulls in every frame of an animated or random set (`textures.cpp:511`); the rest is the engine's | | Kit docs | As is |
| `~name` | Nothing in SDHLT; a naming habit for texture lights | | Kit docs say so | As is |

### Entities and keys

| Entity or key | What it does (source) | Answers | Kit | Spec |
| --- | --- | --- | --- | --- |
| `func_detail` | Brushes join the world but do not cut visleafs for VIS (`map.cpp:951`) | VIS time, faces, luxels; does not seal | No | Item 2 |
| `zhlt_detaillevel` | Detail level; higher levels do not chop lower ones (`map.cpp:174`, FGD) | face splits between details | No | Item 2 `detail.level` |
| `zhlt_chopdown`, `zhlt_chopup` | Let a detail chop faces below it, or be chopped (`map.cpp:175-176`) | lighting seams on terrain against walls | No | `detail.chopdown` |
| `zhlt_clipnodedetaillevel` | Detail level of the clip hulls; 0 trades clipnodes for "ambiguous leafnode" safety (FGD) | clipnodes; measured no gain | No | Not now |
| `zhlt_coplanarpriority` | Which of two coplanar faces shows (`map.cpp:177`) | z-fighting decals on floors | No | `detail.priority` |
| `zhlt_noclip` | No clip hulls for the entity's brushes (`map.cpp:167`) | clipnodes | No | Items 3, 8 |
| `zhlt_invisible` | All its faces NULL (`map.cpp:126`); `-nullfile` lists classes or names for the same | faces of invisible walls | Drawn as invisible (`draw.mjs:837`) | `"invisible": true` on a brush entity |
| `zhlt_usemodel` | The entity uses another's model by `targetname`; its own brushes dropped; needs an ORIGIN brush (`map.cpp:536`, `:717`, `qcsg.cpp:1005-1032`) | models (512), faces, clipnodes | No | Item 4 |
| `zhlt_transform` | Scale and move an entity's brushes at compile (`map.cpp:737`) | | No | Not needed: the kit moves brushes itself |
| `zhlt_hull1..3` + `info_hullshape` | Another shape than a box for a hull's expansion (`map.cpp:212`, `:992`, `brush.cpp:1535`) | round pillars' clip hulls | No | Not now |
| `func_group` | World brushes grouped for an editor (`map.cpp:950`) | | No | Not needed |
| `zhlt_lightflags` | 2 opaque (casts shadows), 8 non-solid opaque for `{` textures (`qrad.h:380`, `qrad.cpp:1617`) | brush entities that shadow | No | Item 12 |
| `zhlt_customshadow` | Shadow colour or transparency of an opaque entity (`qrad.cpp:1626`) | tinted glass shadows | No | `"shadow": [r, g, b]` later |
| `light_origin` | Light a brush entity as if it stood at the named entity (`qrad.cpp:1600`, `qcsg.cpp:1454`) | doors lit where they open to | No | Later |
| `zhlt_striprad` | No lightmap for the entity's faces (`lightmap.cpp:4910`) | light bytes (126720 to 91158 measured) | No | `"unlit": true` on a brush entity (for fullbright or hidden ones) |
| `zhlt_embedlightmap`, `zhlt_embedlightmapresolution` | Light baked into a texture for translucent entities (`loadtextures.cpp:1067`) | lit glass and water entities | No | Later |
| `zhlt_copylight` | A point entity samples light from another place (`lightmap.cpp:5220`) | models lit wrongly inside a wall | No | `"lightFrom": "<id>"` on a prop, later |
| `zhlt_usestyle` | A texture light follows another light's switching style (`qcsg.cpp:1096`) | switchable glowing panels | No | Later, with switched lights |
| `zhlt_stylecoring` | Threshold under which a light style is dropped (`lightmap.cpp:1801`) | light bytes on styled lights | No | No |
| `zhlt_studioshadow`, `zhlt_shadowmode`, `env_static` | A `.mdl` casts a shadow: 0 box per triangle, 1 triangles with alpha, 2 thick triangles (`studio.cpp:115-175`; README) | props' contact shadows | No | Item 10 |
| `light` `_light`, `_fade`, `style`, `targetname`, `_fast` | Colour and brightness; falloff (`lightmap.cpp:1901`); styles; `_fast 1` light by patch (`:1861`) | | `light()` takes any key | `"fade"` on spec lights |
| `_falloff` | Not read by SDHLT (no match in the source) | | | Leave out |
| `light_spot` `_cone`, `_cone2`, `pitch`, `angles`, `target` | Cone (`lightmap.cpp:1916-1984`) | | `spotLight()` | `"spot": { "at": ..., "cone": 45 }` on spec lights |
| `light_environment` `_diffuse_light`, `_diffuse_light2`, `_spread`, `_sky`, `pitch`, `angles` | Sun, sky light colour, sun spread angle (`lightmap.cpp:1996-2080`); global unless `-noskyfix` | night, soft sun shadows | `sunLight()`; spec night uses `_diffuse_light` (`spec/map.mjs:716`) | `"sun": { "spread": 3 }` |
| `info_sunlight` | A fake `light_environment` for the game's sky colour and direction (`bspfile.cpp:1546`) | several suns | No | No |
| `light_surface` | A texture light with filters (`_tex`, `_frange`, `_fdist`, `_fclass`, `_fname`), `_texcolor`, `_cone`, `_scale`, `_chop`, `_texlightgap` (FGD, `qrad.cpp:1396`, `lightmap.cpp:1692-1760`) | glowing panels that light one room only | `info_texlights` only | `"glow": { "brightness", "color", "reach" }` on a material, later |
| `info_texlights` | Texture name to `brightness` or `r g b brightness` (`qrad.cpp:3109`) | | `textureLights()`, spec glow materials | As is |
| `lights.rad`, `<map>.rad`, `-lights file` | The same from a file beside the map, the tool, or the working folder (`qrad.cpp:3153-3200`) | | Not used | Keep `info_texlights` |
| `info_minlights` | Texture name to minlight 0 to 1, before gamma (`qrad.cpp:3089`; measured 0.3 to 131) | dark corners | No | Item 11 |
| worldspawn or brush entity `_minlight` | Minlight for that entity's faces (`lightmap.cpp:5515`; 0.3 to 132) | | No | `"minlight"` at spec level |
| `info_smoothvalue` | Smoothing angle per texture (`qrad.cpp:1089`) | faceted pillars | No | `"smooth": 60` on a material |
| `info_translucent` | Light through thin faces per texture (`qrad.cpp:1123`) | cloth, paper screens | No | `"translucent": 0.5` on a material |
| `info_angularfade` | Metal-like light falloff per texture (`qrad.cpp:1185`) | | No | No |
| `info_chopscale` | Patch size per texture (`qrad.cpp:1048`) | | No | No |
| `light_shadow`, `light_bounce` | Switchable shadow and bounce of an opaque entity (FGD, `bspfile.cpp:1590`) | breakable walls | No | No |
| `info_overview_point` | Everything visible from here; `reverse` for a 3D sky (`vis.cpp:1863`) | | No | No |
| `info_portal` + `info_leaf` | Forces one leaf visible from another (`vis.cpp:1877`) | | No | No |
| `func_vis` | Not compiled: `ZHLT_ZONES` is never defined | | | Leave out |
| `info_compile_parameters` | Compile options from the map (`qcsg.cpp:83`, `qbsp.cpp:94`, `vis.cpp:133`, `qrad.cpp:179-287`) | | No | Not needed: the kit passes options |
| Lights with no `targetname` and no `style` | Left out of the game's entity list (`map.cpp:1044`); named lights sharing name and style merged (`bspfile.cpp:1628`, `-nolightopt` stops it) | entity count | Automatic | Nothing to do |

### Command-line options

Options of every tool: `-threads #`, `-low`/`-high`, `-console #`, `-lang`, `-chart` (on by default),
`-estimate`/`-noestimate`, `-verbose`, `-dev #`, `-noinfo`, `-nolog`, `-texdata #`, `-lightdata #`. Of these
only `-threads` matters: SDHLT on Linux defaults to one thread. `settings.txt` adds `-low` to all unless
`-high` is given.

| Tool | Option | What it does | Answers | Spec (`compile`) |
| --- | --- | --- | --- | --- |
| CSG | `-cliptype smallest/normalized/simple/precise/legacy` | How brushes are expanded for the clip hulls; `simple` is the default (`csg.h:44`) | clipnodes; measured: `simple` least | `"cliptype"`, default left |
| CSG | `-clipeconomy` | Drops clip hulls of `func_illusionary`, `env_bubbles` and some flagged movers (`qcsg.cpp:1296-1350`); off by default (`csg.h:48`) | clipnodes (2954 to 528) | `"clipEconomy": true` |
| CSG | `-noclip` | No clip hulls at all | | Never for a playable map |
| CSG | `-nullfile file` | Classes or names whose brushes become NULL | | Not needed (`zhlt_invisible`) |
| CSG | `-wadinclude`, `-nowadtextures`, `-nowadautodetect`, `-wadconfig`, `-wadcfgfile` | Textures into the `.bsp`; `sdhlt.wad` is always included (`qcsg.cpp:1737`) | | `compileMap` has `wadinclude` |
| CSG | `-onlyents` | Entities only, onto an existing `.bsp` | quick entity edits | `smak map-set` covers it |
| CSG | `-noskyclip`/`-skyclip` | Clip brush behind sky faces (on) | | No |
| CSG | `-tiny #`, `-brushunion #` | Drop tiny faces; warn of overlapping brushes | | `-brushunion` worth a check run |
| CSG | `-hullfile file` | Other hull sizes (`hullfile.cpp`) | mods with other bodies | From the mod's profile |
| CSG | `-scale #`, `-worldextent #` | Scale the world; allow geometry past +/-32768 (`qcsg.cpp:1761`) | world size | No (the kit keeps to 4096, the engine's entity range: `bspfile.h:90`) |
| CSG | `-nolightopt`, `-nonullifytrigger`, `-nonulltex`, `-notextconvert`, `-viewsurface` | Keep named lights apart; keep AAATRIGGER faces; keep NULL faces; no ANSI to UTF-8 of `game_text`; write surface points | | No |
| BSP | `-nohull2`, `-nohull3` | No hull 2 (large monsters, pushables) or 3 (crouching) | clipnodes (-35%, -33%) | Item 7 |
| BSP | `-subdivide #` | Face subdivision, 240 default, 64 to 512 (`bsp5.h:32-36`) | 512 broke RAD (measured); 128 cost 24% more faces | Leave |
| BSP | `-maxnodesize #` | Largest leaf, 1024 default | no change on terrain | No |
| BSP | `-leakonly` | Stop after the leak test | fast leak check | `compileMap({ leakOnly })` for a draft check |
| BSP | `-notjunc`, `-nobrink`, `-nofill`, `-noinsidefill`, `-noopt`, `-noclipnodemerge`, `-noclip`, `-viewportal` | Debug switches, "not for final runs" | | No |
| VIS | `-fast`, `-full` | Rough, or thorough | VIS time | `"quality"` |
| VIS | `-maxdistance #` | Leaves beyond that distance not visible (`flow.cpp:1108`) | open maps with fog: terrain avg 223 to 176 leaves within distance | `"vis": { "maxDistance": 2048 }` with worldspawn fog |
| VIS | `-nofixprt` | Leave the `.prt` as it was (J.A.C.K.) | | No |
| VIS | `-postcompile` | Commented out (`vis.cpp:817`) | | No |
| RAD | `-extra` | 9-point oversampling | quality; RAD time +45% | `"quality": "final"` |
| RAD | `-fast` | No bounce, quick | drafts | `"quality": "draft"` |
| RAD | `-bounce #` | Radiosity bounces, 8 default (`qrad.h:55`) | light in shade (floor mean 94 vs 79 at 0) | `light.bounce` |
| RAD | `-ao`, `-aoscale`, `-aogain`, `-aolevel`, `-aominweight`, `-aostudiomode`, `-aoopacity`, `-aocolor`, `-aostats` | Ambient occlusion and its shape (README) | contact darkening; +6% RAD time | `light.ao: true` or `{ scale, gain, level }` |
| RAD | `-pcf #` | Soft shadow edges, #^2 rays | quality | `light.softShadows: 3` |
| RAD | `-blur #`, `-blurclamp #`, `-nobleedfix` | Lightmap blur and its clamp | | `light.blur` |
| RAD | `-chop #`, `-texchop #`, `-notexscale`, `-nosubdivide` | Patch size for bounces (64, 32), scaled by texture scale unless told | RAD time only; same `.bsp` size (measured) | No |
| RAD | `-minlight #` | Final floor of every luxel, 0 to 255 | | `light.minlight` |
| RAD | `-ambient r g b`, `-sky #`, `-softsky`, `-nospread`, `-noskyfix` | World ambient; sun's indirect share; sky smoothing; no sun spread; per-environment sun | | `light.ambient` |
| RAD | `-smooth #`, `-smooth2 #` | Smoothing angle (50), and across textures | faceted curves | `light.smooth` |
| RAD | `-gamma`, `-colourgamma`, `-scale`, `-colourscale`, `-dscale`, `-bscale`, `-texreflectgamma`, `-texreflectscale`, `-limiter`, `-pre25`, `-coring`, `-dlight` | Global light curve and limits; `-pre25` caps at 188 for pre-2023 Half-Life | old engines | `light.pre25` from the mod's profile |
| RAD | `-fade #`, `-texlightgap #`, `-noemitterrange` | Global fade; texture light gap | | No |
| RAD | `-nostudioshadow`, `-nopaque`/`-noopaque`, `-blockopaque #`, `-depth #`, `-customshadowwithbounce`, `-rgbtransfers` | Switch off model and entity shadows; translucency depth; coloured transfers | | No |
| RAD | `-vismatrix normal/sparse/off`, `-compress #`, `-rgbcompress #`, `-incremental` | Memory and speed of transfers | huge maps | No |
| RAD | `-waddir folder`, `-notextures`, `-lights file` | Where wads are; ignore texture colour; a lights file | | `compileMap` passes the wad folder |
| RAD | `-circus`, `-dump`, `-drawpatch`, `-drawsample`, `-drawedge`, `-drawlerp`, `-drawnudge`, `-drawoverload` | Debugging | | No |
| RAD | `-jitter`, `-colourjitter` | Dither noise | | No |
| RIPENT | `-export`, `-import`, `-parse`, `-textureexport`, `-textureimport`, `-textureparse`, `-writeextentfile`, `-deleteembeddedlightmaps`, `-pause` | Entities and textures out of and into a `.bsp` | | `maps.withEntities` does the entity part |

## Measurements

SDHLT v1.3.0 built on this machine, `-threads 12` (bench1, bench4) or 8 (bench2, bench3) unless the row says
otherwise, `-chart` on. Counts from `maps.readBsp`; "hull1/2/3" are the world's clipnodes reached from each
hull's head; "portals" from the `.prt`; "luxels" and "blocks" from a GLQuake-style AllocBlock written for this
(`harness.mjs: allocBlocks`); "chart" is SDHLT's own `* AllocBlock` line, which matched in every case.

### The furniture hall (bench1)

One hall 1536 x 1024 x 256 with a side room through a doorway, all `carve`d. In it 24 tables (top, four legs,
a bench, a 12-sided stool) and 8 pillars of 16 sides from floor to ceiling. Seven lights.

| Case | portals | avg leaves seen | faces | world faces | marksurfaces | clipnodes | hull 1/2/3 | planes | luxels | AllocBlock | light bytes | VIS s | RAD s |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A all world | 2592 | 602 | 2791 | 2791 | 4684 | 2113 | 692/729/692 | 1292 | 66039 | 5 | 198960 | 77.55 | 1.10 |
| A, one thread | | | | | | | | | | | | over 600 (stopped) | |
| B furniture and pillars `func_detail` | 4 | 4 | 1987 | 1987 | 3452 | 2094 | 688/717/689 | 1292 | 42488 | 3 | 128307 | 0.01 | 0.65 |
| B1 as B, default threads (1) | 4 | 4 | 1987 | 1987 | 3489 | 2114 | | 1292 | 42488 | 3 | 128307 | 0.01 | 4.04 |
| C as B, `zhlt_clipnodedetaillevel 0` | 4 | 4 | 1987 | 1987 | 3504 | 2117 | 699/722/696 | 1292 | 42488 | 3 | 128307 | 0.01 | 0.64 |
| D as B, `zhlt_noclip 1` + a CLIP box a table | 4 | 4 | 1987 | 1987 | 3481 | 832 | 275/283/274 | 810 | 42488 | 3 | 128307 | 0.01 | 0.66 |
| E furniture `func_wall` | 4 | 4 | 2059 | 427 | 2912 | 2955 | 183/165/183 | 1382 | 42843 | 3 | 126720 | 0.01 | 0.67 |
| F as E, `zhlt_noclip` + CLIP boxes | 4 | 4 | 2059 | 427 | 2914 | 844 | 282/280/282 | 810 | 42843 | 3 | 126720 | 0.01 | 0.67 |
| G furniture `func_illusionary` | 4 | 4 | 2059 | 427 | 2912 | 2954 | 183/166/183 | 1382 | 42843 | 3 | 126720 | 0.01 | 0.68 |
| G2 as G, CSG `-clipeconomy` | 4 | 4 | 2059 | 427 | 2922 | 528 | 183/166/179 | 769 | 42843 | 3 | 126720 | 0.01 | 0.64 |
| H as A, `-nohull2` | 2624 | 606 | 2791 | 2791 | 4707 | 1384 | 690/0/694 | 884 | 66039 | 5 | 198960 | 80.26 | 1.28 |
| I as A, `-nohull3` | 2595 | 601 | 2791 | 2791 | 4678 | 1408 | 692/716/0 | 1288 | 66039 | 5 | 198960 | 82.74 | 1.11 |
| J as A, `-cliptype smallest` | 2674 | 622 | 2787 | 2787 | 4982 | 2127 | 698/732/697 | 1292 | 65931 | 5 | 197985 | 203.65 | 1.20 |
| K as A, `-cliptype normalized` | 2599 | 603 | 2791 | 2791 | 4679 | 2171 | 685/797/689 | 1304 | 66039 | 5 | 198960 | 75.92 | 1.10 |
| L as A, `-cliptype precise` | 2583 | 604 | 2791 | 2791 | 4713 | 2117 | 699/721/697 | 1292 | 66039 | 5 | 198960 | 86.48 | 1.11 |
| M as A, `-cliptype legacy` | 2606 | 605 | 2791 | 2791 | 4655 | 2172 | 690/791/691 | 1304 | 66039 | 5 | 198960 | 85.88 | 1.18 |
| N as B, NULL under table and bench tops | 4 | 4 | 1603 | 1603 | 3004 | 2104 | 690/723/691 | 1292 | 39450 | 3 | 119193 | 0.01 | 0.59 |
| O as B, furniture texture scale 2 | 4 | 4 | 1895 | 1895 | 3394 | 2109 | 693/722/694 | 1292 | 36184 | 3 | 109401 | 0.01 | 0.61 |
| P as B, room texture scale 2 | 4 | 4 | 1875 | 1875 | 3171 | 2096 | 691/716/689 | 1292 | 24044 | 2 | 72975 | 0.01 | 0.41 |
| Q as B, room texture scale 4 | 4 | 4 | 1848 | 1848 | 3037 | 2102 | 691/717/694 | 1292 | 19431 | 2 | 59136 | 0.01 | 0.35 |
| R as E, `zhlt_striprad 1` | 4 | 4 | 2059 | 427 | 2896 | 2965 | 188/170/184 | 1382 | 42843 | 3 | 91158 | 0.01 | 0.66 |

Read with care: the clipnodes of brush entities are their own trees, so E's total (2955) is above A's though
its world hulls are small; the A to B gain is all VIS work, faces and luxels; the CLIP box trick (D, F) is
what cuts clipnodes. Leaves stay near 780 with `func_detail`: SDHLT still cuts leaves at detail brushes but
hands VIS only the 5 leaves the world brushes make.

### Terrain, seals, hint, minlight (bench2, bench4)

A courtyard 1024 x 1024 open to the sky with `terrain()` on a 64 grid (512 triangle brushes, hidden sides).

| Case | leaves | faces | clipnodes | hull 1 | portals | avg seen | VIS s |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T1 terrain world | 357 | 795 | 3154 | 1119 | 1512 | 226 | 9.63 (8 threads) |
| T2 terrain `func_detail` | 359 | 754 | 3153 | 1120 | 0 | 1 | 0.01 |
| T3 detail, `zhlt_chopdown 1` | 359 | 795 | 3158 | 1125 | 0 | 1 | 0.01 |
| T4 detail, `zhlt_clipnodedetaillevel 0` | 359 | 754 | 3155 | 1123 | 0 | 1 | 0.01 |
| T5 world, `-cliptype precise` | 357 | 795 | 3896 | 1475 | 1504 | 224 | 8.14 |
| T6 world, `-cliptype smallest` | 357 | 795 | 4870 | 1915 | 1503 | 224 | 7.51 |
| T7, T8 world, `-maxnodesize 256`, `4096` | 357 | 795 | 3150 | 1109, 1122 | 1500, 1498 | 224, 222 | 8.4, 8.6 |
| V0 world (12 threads) | 357 | 795 | 3150 | 1122 | 1491 | 223 | 4.18 |
| V1 world, VIS `-maxdistance 512` | 357 | 795 | 3156 | 1122 | 1498 | 223 (176 within distance) | 5.04; visdata 15555 to 14543 bytes |
| W1 sides `SOLIDHINT` | 268 | 577 | 3154 | 1119 | 1002 | 192 | 2.68 |
| W2 sides `BEVELHINT` | 358 | 795 | 4511 | 1634 | 1502 | 223 | 5.09 |
| W3 sides `BEVEL` | 358 | 795 | 4495 | 1630 | 1511 | 225 | 4.88 |
| W4 sides `NULL` | 357 | 795 | 3165 | 1124 | 1510 | 222 | 4.35 |

T5 and T6 printed "Ambiguous leafnode content (EMPTY and SOLID)" warnings in hulls 1 to 3.

Seals: a room 256 x 256 x 128 with a hole 128 x 96 through its east wall, the hole filled with one brush:

| Fills the hole | Hull 0 (the leak test, and VIS) | Clip hulls 1-3 |
| --- | --- | --- |
| nothing | leak | leak |
| a world brush, `NULL`, `SOLIDHINT`, `BEVELHINT`, `BEVEL` | sealed | sealed |
| `NOCLIP` | sealed | leak |
| `func_detail` | leak | sealed |
| `CLIP` | leak | sealed |
| `HINT`, `SPLITFACE` | leak | leak in hull 1, then BSP stopped |
| `SKIP`, `CONTENTEMPTY`, `func_wall` | leak | not reached: BSP stopped |
| `CONTENTWATER`, `!WATER` | leak | leak |
| `BOUNDINGBOX` | CSG refuses it in the world | |

An L-shaped hall between two rooms (L1/L2): without a hint 44 portals, 8 leaves seen on average; with a
diagonal HINT across each corner 45 portals, 9 seen. No gain at this size.

A room 512 x 512 x 128 lit by one light of brightness 20 in a corner, its floor's light (0 to 255):

| Floor | min | mean |
| --- | --- | --- |
| `WOOD` | 0 | 0 |
| `%WOOD` | 0 | 0 |
| `%20WOOD` | 63 | 63 |
| `info_minlights` `WOOD 0.3` | 131 | 131 |
| worldspawn `_minlight 0.3` | 132 | 132 |
| RAD `-minlight 40` | 40 | 40 |

### Light switches, models, shared models (bench3, bench4)

The detail hall (B) lit with each RAD option; light over every face and over the floor (0 to 255):

| RAD | all faces mean | floor mean | floor samples under 60 (of 8445) | RAD s |
| --- | --- | --- | --- | --- |
| default | 85 | 94 | 1330 | 0.95 |
| `-extra` | 85 | 94 | 1360 | 1.38 |
| `-chop 32 -texchop 16` | 85 | 94 | 1359 | 2.68 |
| `-chop 128` | 84 | 94 | 1312 | 0.64 |
| `-bounce 0` | 80 | 79 | 1727 | 0.38 |
| `-ao` | 82 | 92 | 1389 | 1.01 |
| `-pcf 3` | 85 | 94 | 1324 | 1.05 |
| `-fast` | 82 | 80 | 1599 | 0.28 |

Light bytes were 128307 for all but `-bounce 0` and `-fast` (107925, 106260: faces left black carry no style).
VIS `-fast` and `-full` changed nothing on a map of 4 portals.

A crate model (64 units, built by `buildModelSpec`) on the floor of a room 512 x 512 x 256 under a light at 240,
the map compiled in `Z?/maps/` with the model in `Z?/models/crate.mdl`. Floor light under it, 40 and 64 units
from its middle, and 160 away:

| Keys | under | 40 | 64 | 160 |
| --- | --- | --- | --- | --- |
| none | 175 | 170 | 166 | 135 |
| `zhlt_studioshadow 1` (mode 1, triangles) | 37 | 154 | 163 | 134 |
| `zhlt_studioshadow 1`, `zhlt_shadowmode 2` | 37 | 154 | 163 | 134 |
| `zhlt_studioshadow 1`, `zhlt_shadowmode 0` | 53 | 79 | 78 | 69 |

Mode 0 darkened far wider than the model in this test; modes 1 and 2 give a shadow the model's size.

24 tables as `func_wall` (U1), against one template and 23 `zhlt_usemodel` copies (U2): models 25 to 2,
leaves 650 to 29, faces 1486 to 152, clipnodes 2130 to 106, luxels 28300 to 19082. Floor light the same (43).

Furniture `func_wall` (X0) against `zhlt_lightflags 2` (X1): floor mean 99 to 94, floor samples under 60
1272 to 1330: the opaque furniture casts shadows; plain `func_wall` does not.

`-subdivide 128` on B: faces 1987 to 2467, luxels 42488 to 45944, AllocBlock 3 to 4. `-subdivide 512`: RAD
`Error: Bad surface extents (30 x 16)`, no light written.

## Notes for the kit beyond the spec

- `compileMap` should take `threads` (default all cores) and per-tool `args`; its VIS guess (`VIS_MEASURED`,
  `compile.mjs:87`) was taken with 12 threads and is at least 7 times too low for a single-threaded run.
- `compileMap` could read the chart each tool prints into `result.limits` (item 9); `checkBsp` could add the
  8192 world-leaves and 32768 world-faces lines SDHLT warns of (`bspfile.h:41-49`). The kit's own limits table
  (`docs/MAPS.md`, "Limits") gives GoldSrc 32767 leaves; SDHLT's comment says the engine shows missing leaves
  past 8192 when seen from outside. Which is right for today's GoldSrc is not settled here.
- The plan check's `SEALS_NOTHING` should add `skip` and `splitface` (both leaked) and drop `noclip` (it
  sealed hull 0, which is the leak test); the walk test's `NOTHING_TO_A_BODY` should drop `solidhint` (it sealed every
  hull). Its tool list (`plan.mjs:28`) lacks `BEVELHINT`, `SPLITFACE` and the six `!cur_` textures that
  `sdhlt.wad` has.
- The walk test on a source map treats a brush entity with `zhlt_noclip 1` as solid; after compile it is not.
  It should read the key once item 3 exists.

## Sources

SDHLT at `/media/Data3/Packages/SDHLT` (`src/sdhlt/...`, `tools/...`):

- `README.md` (features, AO, studio shadows, `%`, BEVELHINT, SPLITFACE, cur textures, options); `CHANGELOG.md`
  (1.3.0: AO, PCF, blurclamp, nohull3, Linux builds; 1.2.0: studio shadows, info_portal, info_minlights, `%`).
- `tools/sdhlt.fgd` (`func_detail` and its keys 249-269, `info_hullshape` 271-288, `light_surface` 184-247,
  `info_*` texture entities 145-182, `light_shadow`/`light_bounce` 19-92, `info_overview_point` 94-104,
  `info_portal`/`info_leaf` 106-120, `zhlt_studioshadow`/`zhlt_shadowmode` 5-15); `tools/settings.txt`;
  `tools/wad.cfg`; `tools/lights.rad`; `tools/sdhlt.wad` (27 tool textures, listed by `smak wad`).
- Each tool's usage, printed by running it with no map.
- `common/threads.h:20-25` (POSIX default one thread); `common/bspfile.h:11-90` (compile limits,
  `MAX_MAP_LEAFS_ENGINE` 8192, `MAX_MAP_WORLDFACES` 32768, `MAX_SURFACE_EXTENT` 16, `TEXTURE_STEP` 16,
  `ENGINE_ENTITY_RANGE` 4096); `common/bspfile.cpp:760-900` (AllocBlock 128 x 128), `:1050-1068` (chart),
  `:1425` (`info_compile_parameters`), `:1438-1600` (`info_sunlight`, `light_shadow`, `light_bounce`,
  `light_surface` conversion), `:1628` (light name optimisation).
- `sdHLCSG/map.cpp:126` (`zhlt_invisible`), `:167` (`zhlt_noclip`), `:173-206` (detail keys), `:212`
  (`zhlt_hullN`), `:272-310` (NOCLIP, BEVEL, BEVELBRUSH, BEVELHINT, CLIP, CLIPHULLn, CLIPBEVEL), `:456-500`
  (nullified faces, SPLITFACE, CONTENT, AAATRIGGER), `:507` (ORIGIN), `:536`, `:717` (`zhlt_usemodel`), `:557`
  (BOUNDINGBOX), `:598` (sky clip), `:609` (CLIP brushes), `:737` (`zhlt_transform`), `:951` (`func_detail`,
  `func_group` into the world), `:992` (`info_hullshape`), `:1044` (lights left out of the entity list).
- `sdHLCSG/brush.cpp:901-978` (contents by texture name); `sdHLCSG/textures.cpp:511`, `:789-823` (frames,
  special textures); `sdHLCSG/qcsg.cpp:1296-1350` (`-clipeconomy`), `:1005-1032` (`zhlt_usemodel` target),
  `:1096` (`zhlt_usestyle`), `:1442` (`light_origin`), `:1737` (`sdhlt.wad` always included), `:1744-2039`
  (options); `sdHLCSG/csg.h:34-69` (defaults); `sdHLCSG/hullfile.cpp`.
- `sdHLBSP/qbsp.cpp:848-930` (NULL, HINT, SKIP, SOLIDHINT face types), `:1650-1877` (options);
  `sdHLBSP/bsp5.h:32-62` (subdivide, maxnodesize, defaults).
- `sdHLVIS/vis.cpp:1457-1647` (options), `:1863-1920` (`info_overview_point`, `info_portal`), `:817`
  (`-postcompile` commented out); `sdHLVIS/flow.cpp:1108` (`-maxdistance`); `sdHLVIS/zones.cpp` with
  `ZHLT_ZONES` undefined (`func_vis` not built).
- `sdHLRAD/qrad.cpp:1048-1220` (`info_chopscale`, `info_smoothvalue`, `info_translucent`, `info_angularfade`),
  `:1590-1700` (opaque entities, `zhlt_customshadow`), `:1802` (`zhlt_lightflags`), `:3089-3141`
  (`info_minlights`, `info_texlights`), `:3153-3200` (`lights.rad` search), `:3306-4187` (options), `:4219`
  (models looked for under the map folder's parent); `sdHLRAD/qrad.h:49-216` (defaults), `:378-384`
  (light flags); `sdHLRAD/lightmap.cpp:1692-1760` (`light_surface` keys), `:1855-2080` (light keys),
  `:4910` (`zhlt_striprad`), `:5220` (`zhlt_copylight`), `:5515-5550` (`_minlight`, `%`, `info_minlights`);
  `sdHLRAD/studio.cpp:10-30`, `:115-175` (studio shadows); `sdHLRAD/trace.cpp:696` (`{` alpha test);
  `sdHLRAD/loadtextures.cpp:1067-1086` (`zhlt_embedlightmap`).
- `sdRIPENT/ripent.cpp:917-1007` (options).

The kit, for where it stands: `src/maps/compile.mjs`, `src/maps/source.mjs`, `src/maps/plan.mjs`,
`src/maps/check.mjs`, `src/maps/space.mjs`, `src/maps/rules.mjs`, `src/spec/map.mjs`, `docs/SPEC.md`,
`docs/MAPS-MAKING.md`, `docs/MAPS.md` ("Limits").
