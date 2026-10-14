# From a prompt to a model or a map: specs, building, automatic checks

Research for SMAK, 2026-10-14. The question: how an LLM agent (the MCP client) should turn a person's request
into a declarative JSON spec that the SMAK server builds deterministically into a `.mdl` or a `.map`/`.bsp`,
then checks for holes, gaps, inverted or upside-down geometry and odd shapes, and draws pictures for the agent
to look at. There is no AI inside the server and no third-party service. Everything below aims at code in this
repository.

Abbreviations used: LLM (large language model), MCP (Model Context Protocol), CSG (constructive solid
geometry), CAD (computer-aided design), IR (intermediate representation), WFC (Wave Function Collapse), BSP
(binary space partitioning), COM (centre of mass).

## 1. Summary of recommendations

1. Add two specs, `smak.model/1` and `smak.map/1`, as plain JSON validated against a JSON Schema the `guide`
   tool serves. The server builds them with a new `build` tool that runs no client code, so it works under
   `--no-run`. The `run` tool stays for everything a spec cannot say.
2. A model spec is a part assembly: named parts, each one of a small set of primitives that the workshop
   already has (`turn`, `tube`, `leaf`, `plate`, box, the four kits), placed by **relations between named
   anchors** (attach, stack, mirror, repeat around an axis), never by raw world coordinates. This is
   ShapeAssembly's idea (cuboids attached at face points) on SMAK's richer primitives.
3. A map spec is a **graph**: rooms with sizes, links (door, opening, window, stairs) and contents, placed by
   compass relations ("study east_of hall"). A small solver turns it into boxes for `carve`, so the map is
   sealed by construction. The LLM never writes brush coordinates.
4. Functions in kit options (`edges(k)`, `half(k)`, `paint(q)`) become tables (`[[k, value], ...]`) or named
   presets in the spec. A spec carries data only.
5. Every validation error names its JSON path, says what was expected in words, lists the valid choices and
   suggests the nearest name. This matches how the kit already reports.
6. A new geometry QA module (`src/qa.mjs`) runs on each part's own triangles and on the whole posed model:
   welded edge counts (open and non-manifold edges, winding consistency), Euler characteristic, signed volume
   per closed piece, degenerate and sliver triangles, floating pieces, gaps between parts declared touching,
   self-intersection inside a part, ground contact, centre of mass over the base, size against the declared
   size, and up/front from principal axes.
7. A render-based check adds the pixel difference between a culled and an unculled render. Back faces showing
   mean a hole or an inverted piece. `render()` already has `cull: false`.
8. `check()` today cannot see a solid built inside out: `meshOf` derives the stored normals from the winding,
   so faces and normals always agree. Signed volume on the spec's parts is the check that catches it.
9. Map checks are mostly there already: `checkPlan` (sound brushes, leak hint, buried entities), `reachOf` (walk
   test, openings, one-way places), `sectionOf`/`storeysOf`, `lightReport`. The spec layer adds graph checks
   before building (every room linked to a start, links between rooms that are adjacent, stair rise of 18 or
   less, sizes that fit a player) and afterwards matches each declared link to an opening `reachOf` found.
10. The build report is one structured object with errors, warnings, facts and measurements, keyed by part
    and room ids from the spec, plus a fixed set of pictures (sheet, culled-vs-unculled diff, plan, views). The
    agent edits the spec by id and builds again.

## 2. Intermediate representations LLMs write well for 3D shapes

### 2.1 What the literature shows

| Approach | IR | What carries over to SMAK |
| --- | --- | --- |
| ShapeAssembly (Jones et al., SIGGRAPH Asia 2020) | A program of cuboid part proxies attached to one another at points on their faces, with reflect/translate symmetry, hierarchical | Placement by attachment between named parts; symmetry as an operator, not copied coordinates. The authors report generated shapes more plausible and physically valid than other methods, because attachment keeps parts connected by construction |
| StructureNet (Mo et al., 2019) | Hierarchy of n-ary graphs: nodes are parts, edges are relations (adjacency, symmetry) | Semantic parts in a tree; relations as edges with a type |
| CAD-as-code: CAD-Recode (Rukhovich et al., ICCV 2025), Text2CAD (Khan et al., NeurIPS 2024), CADCodeVerify (Alrashedy et al., ICLR 2025) | CadQuery Python, sketch-and-extrude sequences | LLMs write code well because they saw a lot of it, but code fails to run or produces invalid solids: Text2CAD reports an "invalidity ratio", CADCodeVerify a compile rate. CADCodeVerify's fix is a loop: render, ask yes/no questions about the picture, correct. SMAK's agent loop is that loop already |
| LLM agents writing Blender code: 3D-GPT (2023), SceneCraft (ICML 2024), LL3M (2025) | Python against Blender's API | LL3M notes plain LLM-written Blender scripts often fail or look poor, and adds retrieval of API docs plus visual self-critique. Same lesson: a small, documented vocabulary and pictures every turn |
| CGA shape grammar (Muller et al., SIGGRAPH 2006) | Split, repeat and component rules on boxes, context-sensitive (a window never crosses a wall edge) | `repeat` and `split` along a part as spec operators; context rules as checks |
| L-systems (Prusinkiewicz and Lindenmayer) | String rewriting with turtle geometry | Branching shapes (antlers, trees, roots) as `tube` paths from a few rules; optional, later |
| Holodeck (Yang et al., CVPR 2024) | LLM proposes objects and spatial relations, an optimiser places them | The LLM gives relations, a solver gives coordinates. That is the central design choice for both specs here |
| LayoutGPT (Feng et al., NeurIPS 2023) | CSS-like style sheet of boxes with numbers | LLMs handle numeric layout well when the format is familiar and flat. Plain JSON with named fields suits them |
| SceneScript (Avetisyan et al., ECCV 2024) | A few typed commands: `make_wall`, `make_door` (references its wall by id), `make_window`, `make_bbox` | A small command vocabulary with typed parameters, and children that name their host by id |

### 2.2 What makes a spec robust when an LLM writes it

These come from the papers above and from how SMAK's own guide is written:

- **Relative placement over coordinates.** Errors in absolute numbers compound; "the lid sits on the body's
  top" can't drift. Holodeck and ShapeAssembly both rely on this.
- **Named anchors.** Each primitive exposes a fixed set: `top`, `bottom`, `centre`, `front`, `back`, `left`,
  `right` (box faces), `start`/`end` (a turn or tube's two ends, which `turn` already returns as `ends`), and
  a point on a surface by `[s, angle]` (what `surface.at(s, angle, out)` already gives).
- **Semantic part ids.** `"hoop_top"`, not `"part3"`. Errors and checks refer to them; the agent edits by id.
- **Defaults for everything optional.** The spec for a barrel should be ten lines. Sides 12, material
  `iron`, texture size chosen by `allot`, touching gap 0.
- **Small closed vocabularies.** Enumerations for `kind`, `material`, anchor names, link kinds. JSON Schema
  `enum` makes the valid set visible to the client.
- **Units and axes stated once.** Game units (about an inch), `+z` up, front `+x`, as in AGENTS.md.
- **Validation errors in words with a path.** `parts[3].attach.to: no part called "bdy". Parts are: base,
  body, lid. Did you mean "body"?` Use JSON Pointer paths (RFC 6901).
- **Intent declared, so checks can test it.** `solid: true` (closed volume expected), `touch: true` (must
  meet its parent), `loose: true` (a separate piece on purpose), `sheet: true` (one-sided, two-faced leaf).
  Without intent a checker can only guess whether a gap is a fault.
- **Determinism.** A `seed` at the top. The same spec gives the same bytes, so a diff of two builds is a diff
  of two specs.
- **Stable ids for edits.** The agent changes one part and resends the whole spec; RFC 6902 JSON Patch is an
  option for large specs later. `run`'s `edits` already does the code version of this.

## 3. Level and map generation from text

### 3.1 What the literature and the tools show

| Approach | What it gives | Fit for GoldSrc brush maps |
| --- | --- | --- |
| Room/mission graphs, cyclic generation (Dormans, Unexplored) | The level's logic (rooms, locks and keys, loops) as a graph, separate from its space | The right thing for an LLM to write: rooms, links and what is where. Lock-and-key maps onto a door with a `targetname` and a button that targets it |
| BSP dungeons (RogueBasin) | Recursive split of a box; one room a leaf; siblings joined. Rooms never overlap | A fallback layout when the spec gives no relations. Guarantees the gap of rock that `carve` needs between unlinked rooms |
| Constraint and optimisation floor plans (Merrell et al. 2010; Holodeck; Infinigen Indoors' constraint DSL; ProcTHOR) | A program of rooms and adjacencies realised by stochastic optimisation | Too much for a first version. A grid placement from compass relations does the job for axis-aligned box rooms |
| OBLIGE (Doom and Quake level generator) | Version 3 onwards builds from brushes on a grid of 192-unit "seeds", then CSG to the game's format | Evidence that a coarse grid plus brushes is a workable way to build Quake-family maps procedurally. Snap rooms to a grid of 16 |
| WFC (Gumin; Karth and Smith 2017) | Tile adjacency constraint solving from an example | Good for filling detail, a poor thing for an LLM to write. Not recommended for the spec |
| LLM level generation (Todd et al. 2023, Sokoban; Word2World 2024, with a playability check; Word2Minecraft 2025) | LLM writes tile grids or story-derived tiles | Raw grids from an LLM are often unplayable. Word2World adds a reachability check, which is what `reachOf` is |

### 3.2 How a GoldSrc map is built sealed

SMAK already has the answer: `carve(rooms, wall, texture)` makes one block of rock round every room and
subtracts the rooms, so "what is not a room is rock" and the map cannot leak. Doorways and windows are small
rooms through the rock between two rooms. Constraints that follow from `carve` and the docs:

- Rooms are axis-aligned boxes. Other shapes are furniture inside: `arch` in a doorway, chamfers with
  `prism`, `terrain` hung from a ceiling for a cave, `stairs` in a box.
- **Rooms that touch or overlap join** into one space. Two rooms that are not linked need at least the wall
  thickness of rock between them, or the spec's "no link" turns into an open wall.
- All rooms must go through **one** `carve` call: rooms carved in separate calls fill each other with rock
  where their blocks overlap (MAPS-MAKING.md).
- Rock wears one texture set. A room's own floor, ceiling or a sky goes on as a 16-thick lining box inside the
  carved space (MAPS-MAKING.md, "The limits"). A courtyard's sky is a lining box with the `sky` texture under
  its ceiling.
- Sizes (MAPS-MAKING.md, "Units and sizes"): player 32 x 72, doorway about 64 x 96, step at most 18,
  corridor 96 to 128 wide, ceiling 128 to 192, wall 8 to 32, everything within 4096 of the origin.

### 3.3 How an LLM should specify a level

A graph of rooms, links and contents, with relations for placement. Coordinates are an optional override.
Reasons: the LLM gets sizes right (it knows a hall from a cupboard) and gets coordinates wrong (overlaps,
off-by-a-wall gaps, a door that misses the wall). A solver that knows the wall thickness and the grid places
rooms exactly, and the relation also says which wall a door goes through.

## 4. Automatic geometry QA

### 4.1 Topology from welded edges

Weld corners within a tolerance, then count each undirected edge's uses (as trimesh's `is_watertight`,
`is_winding_consistent` and `euler_number` do, and MeshLab's topological measures):

- **Open (boundary) edges**: used once. A part declared solid with any is not closed: a missing cap, a gap at
  a seam, a `turn` with `caps: [false, ...]` and no `lining`.
- **Non-manifold edges**: used three or more times. Two parts welded into one by accident, or a fin glued on
  an edge.
- **Winding consistency**: in a closed oriented surface each edge is used once in each direction. Edges used
  twice in the same direction mean a flipped triangle or a flipped patch.
- **Euler characteristic** V - E + F = 2 - 2g for a closed, connected surface of genus g. A barrel is genus 0;
  a ring is genus 1. An unexpected genus means a tunnel or a pinch.

### 4.2 Inside out, and inside or outside

- **Signed volume** of a closed piece: the sum over triangles of `dot(a, cross(b, c)) / 6`. Negative means
  inside out (with the workshop's outward counter-clockwise winding; the file stores them the other way round,
  `FRONT = -1` in `src/mesh.mjs`, so measure on the spec's triangles or flip the sign for `readMesh` output).
- **Generalised winding number** (Jacobson et al., SIGGRAPH 2013) answers "is this point inside" robustly
  even for open or self-intersecting meshes. Useful for penetration depth between parts and to place things
  (a point of attachment inside the parent). The kit's `clearance()` in `src/wear.mjs` already does a ray
  version for a shell over a head.

### 4.3 Connectivity, gaps and intersections

- **Floating pieces**: connected components (`touching()` in `src/pieces.mjs`, by shared point) whose
  surface distance to every other component exceeds a tolerance and that are not declared `loose`.
- **Gap between parts declared touching**: the least distance between the two parts' surfaces (point to
  triangle on sampled points, with a uniform grid to keep it fast). Parts in game models usually overlap
  rather than share edges, so "touching" means gap at most a tolerance, overlap allowed.
- **Self-intersection** inside one part: Moller's triangle-triangle test (1997) on non-adjacent triangle
  pairs from a uniform grid. Between parts it is normal (a hoop sunk into a barrel) and only deep
  interpenetration is told.
- **Degenerate triangles**: area near zero (the workshop drops those under 1e-9; `obj.mjs` and
  `import-rig.mjs` count them). **Slivers**: longest edge over shortest altitude above a ratio; they light
  badly in GoldSrc's per-vertex lighting.

### 4.4 Orientation and plausibility

- **Up axis**: a prop stands on z = 0. Lowest point within a tolerance of 0 when `ground` is asked.
- **Centre of mass over the base**: COM from the signed-volume integrals; support polygon is the convex hull
  of points within a tolerance of the lowest z. COM projected outside it means it would tip over.
- **Front and long axis**: `mainAxes()` in `src/vec.mjs` gives principal axes from weighted samples. A held
  piece's long axis should be `+x` (AGENTS.md, "A piece's own axes"); a prop's tallest extent should be z if
  the spec says it stands.
- **Size**: bounding box against the spec's declared size, and against reference sizes (player 72 tall,
  pistol about 8 long, doorway 96).

### 4.5 Render-based checks

- **Back-face diff**: render with `cull: true` and `cull: false` from six sides; pixels that differ show the
  inside through a hole or an inverted face. The renderer draws back faces as the game does (it skips them),
  so this is the game's own failure seen directly.
- **Silhouette**: share of the frame covered from each side. An empty picture is the "blank submodel" case
  AGENTS.md already warns of; a sliver-thin silhouette from one side flags a flat model by mistake.
- **Pictures for the agent**: CADCodeVerify and LL3M both close the loop by looking at renders. Here: the
  `sheet` (six views), the diff picture tinted, and a strip for anything animated.

### 4.6 Metrics in papers and what applies here

| Metric | Where | Use here |
| --- | --- | --- |
| Chamfer distance, F-score | CAD-Recode, Text2CAD, MeshGPT | Only against a reference shape. Use it to compare a build against the game's own piece of the same kind (`bodyIn` gives the triangles) |
| Invalidity ratio, compile rate | Text2CAD, CADCodeVerify | Yes: share of specs in a fixed prompt set that build with no error. The regression number to track |
| COV, MMD, 1-NNA on Chamfer distance; FID, KID on renders | MeshGPT, MeshXL | Measure a generator's distribution against a dataset. Not useful for one build |
| Watertight share, component count | Mesh dataset filtering (trimesh-style checks) | Yes, per part, as in 4.1 and 4.3 |

A small benchmark in `test/` (in the spirit of CADPrompt's 200 prompt-and-reference pairs): twenty specs of
known-good things (barrel, crate, lamp, sword via kit, two maps) whose QA must pass, and twenty broken on
purpose (cap missing, part floating, flipped part, room unlinked, stair 24 high) whose QA must name the
fault. That is the "add a check so it can't come back" test set.

## 5. Mapping to SMAK

### 5.1 Models

| Need | What the kit has | What is missing |
| --- | --- | --- |
| Primitives | `workshop.shape`: `turn` (rings, caps, domes, lining, crease, seam), `tube`, `leaf`, `plate`, `lathe`, `quad`/`tri`; on a surface: `ridge`, `band`, `boss`, `studs`. Kits: `sword`, `axe`, `blunt`, `bow` | A box primitive with named faces (a `turn` with `sides: 4` and a quarter-pi twist does it, but a box is common enough to name). A torus/ring outside axekit's `rings` |
| Placement | `turn`'s `at(s, a, b)`, `surface.at(s, angle, out)`, `ends`; triangles are plain data to move | Anchor table per primitive, attach/stack/mirror/repeat solver, rotation from "align axis to axis" |
| Texture | `sheet.zone`, `allot` (shares a picture by part sizes), materials `steel`, `iron`, `wood`, `leatherWrap`, `rust`, `cylinderLight` | Material name to zone painter table; automatic `allot` from parts |
| Writing | `buildMdl` (prop, monster), `putBody` (a new body in a model that is there), `swapMesh` (weapon in place) | Spec `target` choosing one of the three |
| Function options of kits | Kits take `edges(k)`, `half(k)`, `curve(k)`, `paint(q)` | Table-to-function adapter (piecewise linear or smooth), named presets (`taper`, `crescent`, `flared` exist) |
| Engine checks | `check()`: limits, vertices per submodel, bones, textures, bases, loops, faces against normals (5% share) | It does not see a consistently inside-out solid (normals come from the faces) |
| Pieces | `pieces()` and `dropTriangles()`: connected groups by shared point at 2 decimals | Distances between pieces; intent (`loose`) |
| Fit and clearance | `clearance()`, `boxIn`, `bodyIn`, `facingOf`, `fitBetween` | Nothing for the spec's first version |
| Pictures | `render` (`cull`, `ground`, named views), `sheet`, `strip`, `lineup`, `together` | Cull diff picture and its pixel count |

New code, in order:

1. `src/qa.mjs`: `meshQA(tris, { weld, solid })` returns open, non-manifold and inconsistent edge counts,
   components, Euler characteristic, signed volume, degenerate and sliver counts, box; `partsQA(parts, intents)`
   returns gaps and floating pieces; `standQA(tris)` ground, COM and support; `cullDiff(mdl, opts)` the pixels.
   Pure functions on `{ p }` triangles, so they also run on `posed()` output of any model, including the
   game's own and imported ones.
2. `src/spec/model.mjs`: `validateModelSpec(spec)` (errors in words with paths), `buildModelSpec(spec)` to
   `{ mdl, parts: { id: tris }, report, pictures }`.
3. `src/spec/map.mjs`: `validateMapSpec`, `layoutMapSpec` (rooms to boxes), `buildMapSpec` to `{ map, text,
   report, pictures }`, then `compileMap` if VHLT/SDHLT is found.
4. MCP: a `build` tool (`spec`, `out`, `pictures`) that runs without `run`; the schemas and examples behind
   `guide { doc: "spec" }`. `check` gains `qa: true` for any model.

### 5.2 Maps

| Need | What the kit has | What is missing |
| --- | --- | --- |
| Rooms, sealed | `carve`, `hollow`, `subtract` | Layout solver from relations; wall-gap rule between unlinked rooms |
| Connections | Doorways and windows as small carved rooms; `arch`, `bend`, `stairs`, `wedge` | Link kinds to these builders; side chosen from relation |
| Per-room surfaces | Lining boxes (documented pattern) | Spec field `surfaces` building the linings |
| Entities | `playerStart`, `light`, `spotLight`, `sunLight`, `pointEntity`, `brushEntity`, mod profiles (`profiles/mastersword.mjs`, `maps.GOLDSRC`) | Placement words ("centre", "against north wall", "corner ne") to points via `floorUnder`/`restOf` |
| Plan checks | `checkPlan`: convex sound brushes, range, grid, texture names against `.wad`, buried entities, leak hint, mod entity check | Graph checks before building |
| Walk test | `reachOf`: unreachable entities with reasons, stuck bodies, openings with width and height, one-way places, jumps | Match each declared link to an opening; each room to walked floor |
| Light | `lightReport` (dark floor under 24), `map-light` | Spec's "auto" light count per room area |
| Pictures | `planOfSource`, `drawSource` (before compile), `planOf`, `viewsOf`, `sectionOf`, `storeysOf`, `openingViews` | Section automatically through each stairs link |
| Compile | `compileMap` with VHLT or SDHLT, leak trail, timeouts | Nothing |

## 6. The model spec

### 6.1 Shape of it

```
{
  "spec": "smak.model/1",
  "name": "barrel.mdl",
  "target": "new" | { "putBody": { "into": "models:x.mdl", "bone": "Bip01 Spine2", "bodypart": 0 } }
            | { "swapMesh": { "into": "models:v_knife.mdl", "body": 3, "size": "own" } },
  "seed": 1,
  "kind": "prop" | "held" | "worn",           // decides which checks apply (ground for prop, +x long axis for held)
  "size": { "height": 40 } | { "length": 30 }, // target, checked within 10%
  "texture": { "width": 256, "height": 256 },  // default from the part count
  "materials": { "<name>": { "base": "wood|iron|steel|leather|cloth|stone|glass|flat", "tone": [r,g,b],
                             "rust": 0..1, "flags": ["masked","additive","chrome","fullbright"] } },
  "parts": [ Part, ... ],
  "allow": { "openEdges": ["part ids"], "floating": ["part ids"] }   // explicit exceptions
}

Part = {
  "id": "body",                                 // unique; letters, digits, _
  "kind": "turn" | "tube" | "leaf" | "box" | "plate" | "band" | "boss" | "ridge" | "studs"
        | "kit:sword" | "kit:axe" | "kit:blunt" | "kit:bow",
  "material": "oak",
  ...kind-specific fields (below),
  "attach": { "at": "bottom", "to": "base", "toAt": "top", "gap": 0, "spin": 0 },   // or
  "on": { "part": "body", "s": 0.9, "angle": 0 },                                  // surface features
  "mirror": "y",                                 // a copy reflected across the plane y = 0 of the model
  "repeat": { "count": 6, "around": "z", "of": "wheel_hub" },                      // or "along": [dx,dy,dz]
  "solid": true, "touch": true, "loose": false   // intent, defaults by kind
}
```

Kind-specific fields map one to one onto the workshop:

| kind | fields | workshop call |
| --- | --- | --- |
| `turn` | `rings: [[s, r] or {s, r, crease, off, tilt}]`, `caps`, `sides`, `lining`, `axis` (`z` default for props, `x` for held) | `M.turn(rings, zone, { name: id, sides, caps, lining, at })` |
| `tube` | `path: [[x,y,z,r] ...]` relative to the attach point, `sides` | `M.tube` |
| `leaf` | `rows` of points, or `{ width, height, bend }` | `M.leaf` (two-sided by construction, so `solid: false`) |
| `box` | `size: [x,y,z]`, `bevel` | `turn` with `sides: 4` and quarter-pi twist, or `quad`s |
| `plate` | `stations`, `thick` | `M.plate` |
| `band`, `boss`, `ridge`, `studs` | `on` plus their own (`width`, `height`, `radius`, `count`, `path: [[s, angle]]`) | `M.band`, `M.boss`, `M.ridge`, `M.studs` on the parent's returned surface |
| `kit:*` | the kit's own options with functions given as tables `[[k, v], ...]` or a preset name | `sword()`, `axe()`... |

`s` in `on` and `attach` is a share of the parent's length (0 to 1) unless written `"12u"` for units; that
keeps placements valid when a length changes.

### 6.2 Build steps

1. Validate (schema, then semantic: ids unique, references exist, no cycles in `attach`, rings increasing in
   `s`, radii positive, `kit:*` options known).
2. Order parts by attachment (topological sort), build each in its own local frame with `allot` giving zones
   from each part's reported `length` and `girth`.
3. Place: solve each `attach` as "move my anchor onto the parent's anchor, my anchor's outward normal against
   the parent's, then `spin` about it"; apply `mirror` and `repeat`.
4. Paint zones by material. Write with `buildMdl`, `putBody` or `swapMesh`.
5. Run `check()`, the QA list below, and draw the pictures. Return one report keyed by part id.

### 6.3 Examples

Simple: a barrel with two hoops.

```json
{
  "spec": "smak.model/1",
  "name": "barrel.mdl",
  "kind": "prop",
  "size": { "height": 40 },
  "materials": { "oak": { "base": "wood" }, "hoopiron": { "base": "iron", "rust": 0.3 } },
  "parts": [
    { "id": "body", "kind": "turn", "material": "oak", "sides": 16,
      "rings": [[0, 11], [20, 13], [40, 11]], "caps": [true, true] },
    { "id": "hoop_low", "kind": "band", "material": "hoopiron", "on": { "part": "body", "s": 0.15 }, "width": 2, "height": 0.4 },
    { "id": "hoop_high", "kind": "band", "material": "hoopiron", "on": { "part": "body", "s": 0.85 }, "width": 2, "height": 0.4 }
  ]
}
```

Medium: a standing oil lamp (turned base and post, a curved arm, a lantern with glass panes).

```json
{
  "spec": "smak.model/1",
  "name": "streetlamp.mdl",
  "kind": "prop",
  "size": { "height": 110 },
  "texture": { "width": 512, "height": 256 },
  "materials": {
    "cast": { "base": "iron", "tone": [0.12, 0.12, 0.13] },
    "glass": { "base": "glass", "tone": [0.9, 0.8, 0.5], "flags": ["additive"] }
  },
  "parts": [
    { "id": "foot", "kind": "turn", "material": "cast", "sides": 12,
      "rings": [[0, 9], [3, 9], { "s": 4, "r": 5, "crease": true }, [10, 3]], "caps": [true, false] },
    { "id": "post", "kind": "turn", "material": "cast", "sides": 8, "rings": [[0, 2.2], [88, 1.6]], "caps": [false, true],
      "attach": { "at": "start", "to": "foot", "toAt": "end" } },
    { "id": "arm", "kind": "tube", "material": "cast", "sides": 6,
      "path": [[0, 0, 0, 1], [6, 0, 4, 1], [14, 0, 4, 0.8]],
      "attach": { "at": "start", "to": "post", "toAt": { "s": 0.95, "angle": 0 } } },
    { "id": "lantern", "kind": "box", "material": "cast", "size": [8, 8, 2],
      "attach": { "at": "top", "to": "arm", "toAt": "end", "gap": 0 } },
    { "id": "pane", "kind": "leaf", "material": "glass", "width": 7, "height": 9,
      "attach": { "at": "top", "to": "lantern", "toAt": "front" },
      "repeat": { "count": 4, "around": "z", "of": "lantern" } },
    { "id": "cap", "kind": "turn", "material": "cast", "sides": 4, "rings": [[0, 6], [5, 0.5]], "caps": [true, false],
      "attach": { "at": "start", "to": "arm", "toAt": "end", "gap": 0 } }
  ]
}
```

Complex: a handcart prop, with spokes repeated round each wheel, sides, wheels and handles mirrored, a
kit-made tool lying in the bed, and a part that is loose on purpose.

```json
{
  "spec": "smak.model/1",
  "name": "handcart.mdl",
  "kind": "prop",
  "seed": 7,
  "size": { "length": 80 },
  "texture": { "width": 512, "height": 512 },
  "materials": {
    "planks": { "base": "wood", "tone": [0.45, 0.32, 0.2] },
    "iron": { "base": "iron", "rust": 0.5 },
    "sack": { "base": "cloth", "tone": [0.6, 0.55, 0.4] }
  },
  "parts": [
    { "id": "bed", "kind": "box", "material": "planks", "size": [48, 30, 2], "bevel": 0.3 },
    { "id": "side", "kind": "box", "material": "planks", "size": [48, 1.5, 8],
      "attach": { "at": "bottom", "to": "bed", "toAt": { "face": "top", "u": 0.5, "v": 0.02 } }, "mirror": "y" },
    { "id": "axle", "kind": "turn", "material": "iron", "axis": "y", "sides": 8, "rings": [[-18, 0.8], [18, 0.8]],
      "caps": [true, true], "attach": { "at": "centre", "to": "bed", "toAt": "bottom", "gap": -1 } },
    { "id": "wheel_rim", "kind": "turn", "material": "iron", "axis": "y", "sides": 20,
      "rings": [[0, 12], [2, 12]], "caps": [false, false], "lining": { "inset": 1 },
      "attach": { "at": "centre", "to": "axle", "toAt": "end" }, "mirror": "y" },
    { "id": "spoke", "kind": "tube", "material": "planks", "sides": 5, "path": [[0, 0, 0, 0.5], [0, 0, 11, 0.4]],
      "attach": { "at": "start", "to": "wheel_rim", "toAt": "centre" },
      "repeat": { "count": 8, "around": "y", "of": "wheel_rim" }, "mirror": "y" },
    { "id": "handle", "kind": "tube", "material": "planks", "sides": 6,
      "path": [[0, 0, 0, 1], [30, 0, 6, 0.9]],
      "attach": { "at": "start", "to": "bed", "toAt": { "face": "back", "u": 0.1, "v": 0.5 } }, "mirror": "y" },
    { "id": "shovel", "kind": "kit:blunt", "material": "iron", "loose": true,
      "options": { "preset": "spade", "length": 36 },
      "attach": { "at": "bottom", "to": "bed", "toAt": "top", "spin": 15 } },
    { "id": "sack", "kind": "turn", "material": "sack", "axis": "x", "sides": 10,
      "rings": [[0, 0.5], [2, 5], [12, 6], [16, 2]], "caps": [true, true],
      "attach": { "at": "bottom", "to": "bed", "toAt": { "face": "top", "u": 0.7, "v": 0.5 } } }
  ]
}
```

(`kit:blunt` with a `preset` assumes a preset table added to the kits; today they take full option objects.)

### 6.4 Model check list and thresholds

Units are game units. "Part" means one spec part's own triangles, before placement; "model" means the posed
whole. Weld tolerance 0.01 units for topology (the workshop's points agree to far better; `pieces.mjs` keys
by 2 decimals).

| # | Check | On | Error | Warning |
| --- | --- | --- | --- | --- |
| 1 | Engine limits, bones, textures, loops | file | as `check()` today | as `check()` |
| 2 | Open edges | part with `solid` | any | |
| 3 | Non-manifold edges | part | | any |
| 4 | Edges wound the same way twice | part with `solid` | any | |
| 5 | Signed volume | each closed part | below 0 (inside out) | under 1% of its box volume (flat, collapsed) |
| 6 | Euler characteristic | each closed part | | genus not what the kind gives (0 for a capped `turn`, 1 for a ring) |
| 7 | Degenerate triangles | part | | area under 1e-6 sq units; count |
| 8 | Slivers | part | | longest edge / least altitude over 30 on more than 5% of triangles |
| 9 | Self-intersection | part | any pair (non-adjacent) | |
| 10 | Gap between attached parts | pair | gap over 0.1 when `touch` | overlap deeper than half the smaller part's thickness along the attach normal |
| 11 | Floating component | model | gap over 0.25 to everything else, not `loose` | |
| 12 | Back-face diff (cull on vs off, six views) | model | over 2% of model pixels | over 0.2% |
| 13 | Ground contact (`prop`) | model | lowest z off 0 by more than 0.5 | |
| 14 | COM over support (`prop`) | model | outside the support polygon | within 5% of its width from the edge |
| 15 | Size against `size` | model | off by more than 25% | off by more than 10% |
| 16 | Long axis (`held`) | model | | principal axis not within 20 degrees of +x |
| 17 | Faces against stored normals | file | | over 5% (existing `TURNED_SHARE`) |
| 18 | Triangle budget | model | over 2048 vertices a submodel (existing) | over 1500 triangles for a prop or held piece (AGENTS.md budget) |
| 19 | Silhouette | each of six views | an empty view | under 1% of the frame from a side the kind is seen from |
| 20 | Texture zones | part | UV outside 0..1 | zone under 8 pixels on a side (paint will not show) |

Thresholds 2 to 11 are proposals to tune on the benchmark set in 4.6; 12's numbers likewise.

## 7. The map spec

### 7.1 Shape of it

```
{
  "spec": "smak.map/1",
  "name": "keep",
  "mod": "goldsrc" | "<profile path>",          // passed to checkPlan and reachOf
  "wad": ["halflife.wad"],
  "theme": { "floor": "TEX", "wall": "TEX", "ceiling": "TEX" },
  "grid": 16, "wall": 16,                         // rock between rooms; also the least gap between unlinked rooms
  "rooms": [ Room, ... ],
  "links": [ Link, ... ],
  "entities": [ Entity, ... ]
}

Room = {
  "id": "hall",
  "size": [320, 256, 160] | "small" | "medium" | "large" | "corridor",   // presets from MAPS-MAKING sizes
  "floor": 0,                                     // relative to the room it is placed against, or absolute when first
  "place": { "east_of": "yard", "align": "centre" | "north" | "south" | ..., "gap": 16 }
         | { "above": "cellar" } | { "at": [x, y, z] },                 // first room defaults to the origin
  "surfaces": { "ceiling": "sky", "floor": "TEX" },                     // lining boxes
  "light": "auto" | { "count": 2, "brightness": 200, "color": [255, 220, 180] } | "none",
  "furniture": [ { "kind": "pillars", "count": 4 } | { "kind": "stairs", "to": "gallery" } | { "kind": "arch_doorways" } ]
}

Link = {
  "from": "hall", "to": "study",
  "kind": "door" | "opening" | "window" | "stairs" | "corridor",
  "width": 64, "height": 96,                      // defaults by kind
  "along": "centre" | 0.25,                       // where on the shared wall
  "door": { "class": "func_door", "locked_by": "lever1" }   // optional: a func_door with a targetname
}

Entity = {
  "class": "info_player_start" | "monster_zombie" | "item_healthkit" | "func_button" | ...,
  "room": "hall",
  "at": "centre" | "corner ne" | "against north" | "near link study" | [x, y],  // in the room
  "facing": "east" | "link study" | 90,
  "keys": { ... }, "id": "lever1"                  // id becomes the targetname
}
```

### 7.2 Build steps

1. Validate: ids, references, every room in one connected component with a start, link endpoints adjacent
   after layout, sizes at least player-sized, stair rise per step 18 or less (`stairs` refuses more), floor
   difference across a `door` or `opening` within 18 (or a `stairs` link), corridor and door widths at least
   32 (warn under 48, under 64 for a `large` monster mod profile).
2. Lay out: place rooms in order of `place` dependencies; `east_of` puts the room's west face at the other's
   east face plus `gap`, aligned as asked, snapped to `grid`. Unplaced rooms are put by a BSP split of the
   remaining space next to their first link. Then reject overlaps between unlinked rooms and gaps under `wall`.
3. Links to boxes: a `door`, `opening` or `window` becomes a small room through the shared wall (as
   `examples/07-a-small-map.mjs` does), a `door` also a `func_door` brush entity filling it, a `stairs` link a
   `stairs()` in the lower room or a corridor between, a `corridor` a room of its own.
4. `carve` all rooms and link boxes in one call; add linings, furniture, lights (auto: one light of 200 per
   roughly 256 x 256 of floor, the "about 200 lights a room" rule of thumb), entities placed by
   `floorUnder`/`restOf`.
5. `writeMap`, `checkPlan`, `planOfSource`, `drawSource` from each start, `reachOf` with every room's centre
   and every entity as goals, `sectionOf` through each stairs link, then `compileMap` when VHLT or SDHLT is
   present, and `planOf`, `viewsOf`, `lightReport` on the result.

### 7.3 Examples

Simple: one room, a start and a light.

```json
{
  "spec": "smak.map/1",
  "name": "box_room",
  "wad": ["halflife.wad"],
  "theme": { "floor": "C1A0_LABFLR", "wall": "C1A0_LABW4", "ceiling": "C1A0_C1" },
  "rooms": [{ "id": "room", "size": [256, 256, 160], "light": "auto" }],
  "links": [],
  "entities": [{ "class": "info_player_start", "room": "room", "at": "centre", "facing": "east" }]
}
```

Medium: the kit's example 7 as a spec, plus a corridor with stairs to a lower store room.

```json
{
  "spec": "smak.map/1",
  "name": "lab_wing",
  "wad": ["halflife.wad"],
  "theme": { "floor": "C1A0_LABFLR", "wall": "C1A0_LABW4", "ceiling": "C1A0_C1" },
  "wall": 32,
  "rooms": [
    { "id": "hall", "size": [320, 256, 160] },
    { "id": "study", "size": [256, 256, 128], "floor": 16, "place": { "east_of": "hall", "align": "south" } },
    { "id": "passage", "size": [96, 384, 128], "place": { "north_of": "hall", "align": "west" } },
    { "id": "store", "size": [256, 192, 128], "floor": -96, "place": { "north_of": "passage", "align": "centre" } }
  ],
  "links": [
    { "from": "hall", "to": "study", "kind": "door", "width": 64, "height": 96 },
    { "from": "hall", "to": "study", "kind": "window", "width": 48, "height": 48, "along": 0.8 },
    { "from": "hall", "to": "passage", "kind": "opening", "width": 96, "height": 112 },
    { "from": "passage", "to": "store", "kind": "stairs", "width": 96 }
  ],
  "entities": [
    { "class": "info_player_start", "room": "hall", "at": "corner sw", "facing": "link study" },
    { "class": "monster_headcrab", "room": "store", "at": "centre" },
    { "class": "item_healthkit", "room": "study", "at": "against east" }
  ]
}
```

Complex: a small keep with a sky-lit yard, a gatehouse door opened by a lever, a tower of two storeys, a
cellar and monsters, checked against a mod profile.

```json
{
  "spec": "smak.map/1",
  "name": "keep",
  "mod": "profiles/mastersword.mjs",
  "wad": ["msstone.wad"],
  "theme": { "floor": "STONEFLR", "wall": "STONEWALL", "ceiling": "WOODCEIL" },
  "grid": 16,
  "wall": 32,
  "rooms": [
    { "id": "road", "size": [512, 256, 256], "surfaces": { "ceiling": "sky" }, "light": { "count": 0 } },
    { "id": "gatehouse", "size": [192, 192, 160], "place": { "north_of": "road", "align": "centre" } },
    { "id": "yard", "size": [640, 512, 384], "surfaces": { "ceiling": "sky", "floor": "GRASS" }, "light": "none",
      "place": { "north_of": "gatehouse", "align": "centre" } },
    { "id": "tower_low", "size": [256, 256, 160], "place": { "east_of": "yard", "align": "north" },
      "furniture": [{ "kind": "stairs", "to": "tower_high" }] },
    { "id": "tower_high", "size": [256, 256, 160], "place": { "above": "tower_low" } },
    { "id": "cellar", "size": [384, 256, 128], "floor": -160, "place": { "west_of": "yard", "align": "south" } },
    { "id": "hall", "size": "large", "place": { "north_of": "yard", "align": "west" } }
  ],
  "links": [
    { "from": "road", "to": "gatehouse", "kind": "door", "width": 96, "height": 128,
      "door": { "class": "func_door", "locked_by": "gate_lever" } },
    { "from": "gatehouse", "to": "yard", "kind": "opening", "width": 128, "height": 144 },
    { "from": "yard", "to": "tower_low", "kind": "door" },
    { "from": "tower_low", "to": "tower_high", "kind": "stairs" },
    { "from": "yard", "to": "cellar", "kind": "stairs", "width": 96 },
    { "from": "yard", "to": "hall", "kind": "door", "width": 128, "height": 128 },
    { "from": "tower_high", "to": "yard", "kind": "window", "width": 32, "height": 48 }
  ],
  "entities": [
    { "class": "ms_player_begin", "room": "road", "at": "centre", "facing": "link gatehouse" },
    { "class": "ms_player_spawn", "room": "road", "at": "against south", "facing": "north" },
    { "class": "func_button", "id": "gate_lever", "room": "road", "at": "against north", "keys": { "target": "gate" } },
    { "class": "msmonster_skeleton", "room": "cellar", "at": "centre", "count": 3 },
    { "class": "msmonster_bandit", "room": "tower_high", "at": "near link yard" },
    { "class": "light_environment", "room": "yard", "keys": { "pitch": -60, "_light": "255 240 200 300" } }
  ]
}
```

(Class names in the complex example are illustrative; the builder must take them from the mod's profile,
FGD and `map-learn` output, never from memory, as AGENTS.md says.)

### 7.4 Map check list and thresholds

| # | Check | When | Error | Warning |
| --- | --- | --- | --- | --- |
| 1 | Spec graph connected; every room reachable from a start through links | before layout | any room cut off | |
| 2 | Link rooms adjacent after layout (share a wall face, or a stack for `above`/stairs) | layout | not adjacent | |
| 3 | Unlinked rooms separated by at least `wall` | layout | under `wall` (they would join) | |
| 4 | Room sizes | layout | under 32 x 32 x 72 | ceiling under 112, corridor under 64 wide |
| 5 | Link sizes | layout | door or opening under 32 wide or 72 high | under 48 x 80; under 64 x 64 where the profile has large monsters |
| 6 | Floor step across a level link | layout | over 18 with no stairs | |
| 7 | Inside the world range | layout | beyond 4096 on any axis (`SOURCE_LIMITS.range`) | within 256 of it |
| 8 | `checkPlan` (sound brushes, textures, buried entities, leak hint, mod entities) | source | its errors | its warnings |
| 9 | `reachOf`: every room's centre and every entity reached on foot | source and bsp | an entity not reached that the spec puts in a linked room | reached only by a jump |
| 10 | `reachOf` openings vs links | source | a declared link with no opening found | opening width or height under the link's by more than 8 |
| 11 | One-way places | source | | any not on a declared drop |
| 12 | Bodies in solid or hanging | source | in solid | hanging over 2 |
| 13 | Compile | bsp | leak, any `BAD_LINE` error | compiler warnings |
| 14 | Light | bsp | | a room whose floor `lightReport` finds under 24 (`DARK_FLOOR`) |
| 15 | Section through each stairs link | source | | a riser over 18 or a ceiling under 72 over a step (from `sectionOf` facts) |

## 8. MCP shape

- New tool `build { spec, out, pictures }`: validates, builds, writes `out` under `--work`, runs the check
  lists, returns the report and up to three pictures (sheet and cull diff for a model; plan and a view for a
  map). It runs no client code, so it stays available with `--no-run`, which makes text-to-model usable on a
  server where `run` is off.
- `guide { doc: "spec" }`: the two JSON Schemas, the anchor table, the material and link vocabularies, and the
  six examples above. Kept short, as the tool descriptions are (README: about 1100 tokens for all six tools).
- `check { model, qa: true }`: the model QA on any model, including the game's own and imported ones, so the
  checks are useful outside the spec path too.
- The report keys every finding by spec id (`parts.hoop_low`, `rooms.cellar`, `links[3]`) so the client edits
  that entry and builds again.

## 9. Things to decide (flagged, not decided here)

- Whether `attach` accepts partial overlap by default (game models overlap parts freely) or asks for exact
  contact; the thresholds above assume overlap is fine and gaps are not.
- Whether the map layout solver should also handle non-axis rooms through `bend` (a turning passage), or
  leave those to `run`.
- Preset tables for the kits: which presets, and whether a preset is a named option object in each kit file.
- Thresholds in 6.4 and 7.4 are starting values; tune them on the benchmark set before relying on them.

## Sources

- ShapeAssembly: https://arxiv.org/abs/2009.08026
- StructureNet: https://arxiv.org/abs/1908.00575
- CAD-Recode: https://arxiv.org/abs/2412.14042
- Text2CAD: https://arxiv.org/abs/2409.17106 and https://proceedings.neurips.cc/paper_files/paper/2024/hash/0e5b96f97c1813bb75f6c28532c2ecc7-Abstract.html
- CADCodeVerify (Generating CAD Code with Vision-Language Models for 3D Designs): https://arxiv.org/abs/2410.05340
- 3D-GPT: https://arxiv.org/abs/2310.12945
- SceneCraft: https://mlanthology.org/icml/2024/hu2024icml-scenecraft
- LL3M: https://arxiv.org/abs/2508.08228
- Holodeck: https://arxiv.org/abs/2312.09067
- LayoutGPT: https://arxiv.org/abs/2305.15393
- SceneScript: https://arxiv.org/abs/2403.13064
- CGA shape grammar (Procedural Modeling of Buildings): https://history.siggraph.org/?p=113547 (PDF copy: https://course.ccs.neu.edu/cs5150f13/readings/muller_buildings.pdf)
- L-systems, The Algorithmic Beauty of Plants: http://algorithmicbotany.org/papers/#abop
- Infinigen: https://arxiv.org/abs/2306.09310; Infinigen Indoors: https://arxiv.org/abs/2406.11824
- ProcTHOR: https://arxiv.org/abs/2206.06994
- Computer-generated residential building layouts (Merrell et al.): https://www.cs.princeton.edu/courses/archive/spring11/cos598A/pdfs/Merrell10a.pdf
- Cyclic dungeon generation (Unexplored): https://www.gamedeveloper.com/design/unexplored-s-secret-cyclic-dungeon-generation- ; https://www.boristhebrave.com/2021/04/10/dungeon-generation-in-unexplored/ ; https://www.boristhebrave.com/2021/02/27/lock-and-key-dungeons
- BSP dungeons: https://www.roguebasin.com/index.php/Basic_BSP_Dungeon_generation ; https://notimetoplay.org/games/roguelike/bsp-howto/
- OBLIGE: https://oblige.sourceforge.net/doc_history.html ; https://oblige.sourceforge.net/doc_glossary.html
- WaveFunctionCollapse: https://github.com/mxgmn/WaveFunctionCollapse
- Level Generation Through Large Language Models (Todd et al.): https://arxiv.org/abs/2302.05817
- Word2World: https://arxiv.org/abs/2405.06686 ; Word2Minecraft: https://arxiv.org/abs/2503.16536
- trimesh (watertight, winding consistency, Euler number, volume): https://pypi.org/project/trimesh/
- Generalized winding numbers (Jacobson et al. 2013): https://users.cs.utah.edu/~ladislav/jacobson13robust/jacobson13robust.pdf
- Moller triangle-triangle intersection test (1997): https://cs277.stanford.edu/resources/papers/Moller1997b.pdf
- MeshGPT (COV, MMD, 1-NNA, FID, KID): https://arxiv.org/abs/2311.15475 ; MeshXL: https://arxiv.org/abs/2405.20853
- JSON Pointer (RFC 6901): https://www.rfc-editor.org/rfc/rfc6901 ; JSON Patch (RFC 6902): https://www.rfc-editor.org/rfc/rfc6902
- Kit files read: `AGENTS.md`, `mcp/README.md`, `src/check.mjs`, `src/mesh.mjs`, `src/pieces.mjs`,
  `src/workshop.mjs`, `src/build.mjs`, `src/wear.mjs`, `src/render.mjs`, `src/vec.mjs`, `kits/swordkit.mjs`,
  `kits/axekit.mjs`, `src/maps/source.mjs`, `src/maps/plan.mjs`, `src/maps/reach.mjs`, `src/maps/light.mjs`,
  `docs/MAPS-MAKING.md`, `examples/07-a-small-map.mjs`
