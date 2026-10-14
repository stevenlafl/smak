# Research backlog

Every concrete recommendation or build item from the reports in `research/`, checked against the code, docs and
git history: first as of 2026-10-14 (commit 7acbcac), brought up to date the same day after the sprite,
video, repeated-failure and map-failure work (commit 13c7c25). This is the one list to work from: when an item
is built, declined or changed, update its row here, and add rows when a new report lands. Background,
measurements and sources stay in the reports themselves.

Status: **DONE** (built; where), **PARTLY** (what exists, what is missing), **OPEN** (not started),
**DECLINED** (decided against, with where and why).

Abbreviations: MCP (Model Context Protocol), VIS / RAD / CSG / BSP (the four map compilers: visibility,
radiosity light, constructive solid geometry, binary space partition), QEM (quadric error metric), AO (ambient
occlusion), VLM (vision-language model), DSG (Davidsonian Scene Graph, prompt-only yes/no questions), BVH
(bounding volume hierarchy), MRF (Markov random field), LSCM (least squares conformal maps), KAD (kernel audio
distance), CLAP (contrastive language-audio pre-training), PAM (prompt-based audio quality measure), MUSHRA
(Multiple Stimuli with Hidden Reference and Anchor, a listening test), FPS (frames per second).

## compiler-features.md (SDHLT features against the map spec)

| Item | Status | Where / what is missing |
| --- | --- | --- |
| 1. `-threads` on all four compilers, default all cores | DONE | `compileMap` `threads = availableParallelism()` (`src/maps/compile.mjs`), spec `compile.threads`; commit df6792a |
| 2. Furniture and prefabs as `func_detail` | DONE | `src/spec/map.mjs` `detailed()`, spec `detail: false` / `as: "world"`; df6792a. Missing: the `detail: { level, chopdown, priority }` keys (`zhlt_detaillevel`, `zhlt_chopdown`, `zhlt_coplanarpriority`) |
| 3. Simple collision: `zhlt_noclip 1` on detail plus a `CLIP` box per piece (`collide: "box"`) | OPEN | No `zhlt_*` key is written anywhere in `src/spec/map.mjs`. Measured gain: clipnodes -60% |
| 4. `zhlt_usemodel` for repeated brush entities (`share: true`) | OPEN | Measured: models 25 to 2, faces 1486 to 152 |
| 5. Texture scale per material, spec-level `lightScale` | OPEN | Builders take `{ name, scale }`; the spec still passes a word only |
| 6. `NULL` on hidden faces: piece texture by face, `hidden: "auto"` | OPEN | Spec pieces still take one texture word (`src/spec/map.mjs` line 232) |
| 7. `-nohull2`, `-nohull3` | DONE | `compile.hulls: { large, crouch }` in `compileOptions` (`src/spec/map.mjs`). Missing: refusal unless the mod's profile allows it |
| 8. Decoration with no collision (`collide: "none"`, `-clipeconomy`) | PARTLY | `compile.clipEconomy` writes `-clipeconomy`; `collide: "none"` (`zhlt_noclip`) not built |
| 9. The compilers' chart in the report | DONE | `limitsOf()` into `result.limits`, warning from 75%, the spec report's `the engine's limits` fact; df6792a |
| 10. Studio model shadows on props (`zhlt_studioshadow`), compile in `work/maps` so RAD finds `models/` | OPEN | Props are still `cycler_sprite` with no shadow key |
| 11. Light quality switches | PARTLY | `compile.quality` and `light: { bounce, ao, extra, softShadows }` done. Missing: `minlight` (RAD `-minlight`, `info_minlights` per material, worldspawn `_minlight`), `blur`, `ambient`, `smooth`, `pre25` |
| 12. `SOLIDHINT` on hidden terrain sides; `zhlt_lightflags 2` (`opaque: true`) on furniture and doors | OPEN | |
| Doc line: `-subdivide 512` breaks RAD | OPEN | Nothing in `docs/` |
| Doc line: `%NAME` without a number gives no minlight | OPEN | Nothing in `docs/` |
| Plan check: SKIP leaks, NOCLIP and NULLNOCLIP seal hull 0 | DONE | `SEALS_NOTHING` in `src/maps/plan.mjs`; df6792a |
| Plan check: SPLITFACE leaks too | OPEN | `SEALS_NOTHING` does not match `splitface` |
| Walk test: SOLIDHINT is solid to a body | DONE | `NOTHING_TO_A_BODY` in `src/maps/space.mjs`; df6792a |
| Tool texture list: BEVELHINT, SPLITFACE, the six `!cur_` | DONE | `TOOL_TEXTURES` in `src/maps/plan.mjs` |
| `compileMap` per-tool `args` | DONE | `args` option in `compileMap`, used by `compileOptions` |
| VIS time guess taken with 12 threads | DONE | Moot now that every tool gets all threads; `VIS_MEASURED` comment says 12 threads |
| `checkBsp` warns of SDHLT's 8192 world leaves and 32768 world faces | PARTLY | The compile chart warns from 75% of SDHLT's own numbers; `checkBsp` on a `.bsp` alone still holds leaves to 32767. Which limit today's engine has is unsettled (the report says so) |
| Walk test reads `zhlt_noclip` on a source map | OPEN | Waits on item 3 |
| `compileMap({ leakOnly })` for a draft leak check | OPEN | |
| Lower-ranked spec forms: `hints`, water `current`, `invisible`, `unlit` (`zhlt_striprad`), light `fade`, spot lights, sun `spread`, per-material `smooth` / `translucent`, VIS `maxDistance` with fog, `hullfile` from the profile, custom shadow colour | OPEN | All "later" in the report; none built |
| HINT brushes, `-maxnodesize`, other `-cliptype`s, `zhlt_clipnodedetaillevel 0`, BEVEL on terrain, `-chop` | DECLINED | Measured no gain or worse (report, "What did not pay") |

## generation-research.md (prompt to spec, building, automatic checks)

| Item | Status | Where / what is missing |
| --- | --- | --- |
| Two specs, `smak.model/1` and `smak.map/1`, built by an MCP `build` tool that runs no client code | DONE | `src/spec/model.mjs`, `src/spec/map.mjs`, `build` in `mcp/tools.mjs`; commit f3af182. A third, `smak.sound/1`, came later |
| A JSON Schema for each spec, served by `guide` | PARTLY | `guide { doc: "spec" }` serves `docs/SPEC.md` prose and the examples; no JSON Schema exists |
| Model parts placed by named anchors (attach, mirror, repeat), not coordinates | DONE | `attach`, `mirror`, `repeat`, surface anchors `{ s, angle }` (`docs/SPEC.md`, "Placing a part") |
| Part kinds: turn, tube, leaf, box, band, boss, ridge, studs, the four kits | DONE | `KINDS` in `src/spec/model.mjs`, plus `cylinder`, `sphere`, `prefab` |
| Part kind `plate`, box `bevel`, a torus | OPEN | Not in `KINDS` |
| Kit presets (`kit:blunt` with `preset: "spade"`), functions as tables | PARTLY | A sword's `half` takes `{ taper: [base, tip] }`; no preset tables |
| Spec `target`: put a body into an existing model (`putBody`) | PARTLY | `kind: "character"` (base skeleton) and `weapon: { like }` (swapMesh) done; a plain new body in an existing model (a helmet into a file of helmets) not |
| Validation errors in words with a path and "did you mean" | DONE | `nearest()` in `src/spec/model.mjs`, same style in map and sound specs |
| `seed` for determinism | DONE | Model and sound specs |
| Intent flags `solid` / `touch` / `loose` | DONE | `open`, `loose`, `allow: { open, floating }` |
| Map spec as a graph: rooms placed by compass relations, links, sealed by one `carve` | DONE | `place: { east_of, above, in ... }`, `links`, `layout` drawing too |
| Map entity placement words (`centre`, `corner ne`, `against north`, `near`) | DONE | `docs/SPEC.md`, "Where things go in a room" |
| Room size presets (`small`, `large`, `corridor`), link kind `corridor`, BSP split for unplaced rooms | OPEN | `LINK_KINDS` is door, opening, window, stairs |
| Lock and key: a door `locked_by` a button | PARTLY | Entity `id` becomes `targetname` and `door: { keys }` takes more, so it can be written by hand; no `locked_by` or check that the key comes before the lock |
| Auto lights per floor area | DONE | `light: "auto"`, one lamp per 256 x 256 (`src/spec/map.mjs`) |
| Geometry QA module: open, non-manifold (crowded), flipped edges, signed volume (inside out), floating pieces | DONE | `soundness`, `shapeSoundness` in `src/sound.mjs` (named for soundness, not audio); commit fafb18e |
| Back-face (cull on against off) render check | DONE | `seeThrough` in `src/sound.mjs`, a fault in the model report |
| Gap between parts meant to touch | DONE | `nearly touch and do not` note (`NEAR_MISS` 0.6) in `src/sound.mjs` |
| Size against the spec's `size` (10% warning, 25% fault) | DONE | `docs/SPEC.md`, "What the report says of a model" |
| Ground contact for a prop | DONE | A `prop` is stood at z 0 by construction |
| Euler characteristic and genus | OPEN | |
| Degenerate and sliver triangles counted and reported | PARTLY | Triangles of no area are left out (`NO_AREA`); slivers not counted |
| Self-intersection inside a part | OPEN | |
| Centre of mass over the base (a prop that tips) | OPEN | |
| Long axis along +x for a `held` piece | OPEN | |
| Silhouette check (an empty or sliver-thin view) | OPEN | |
| Texture zone checks (UV outside 0..1, zone under 8 px) | OPEN | |
| Triangle budget warning (over 1500 for a prop or held piece) | DONE | A spec's `budget` is a fault when passed; a prop over 576 (three quarters of Half-Life's) is warned of; the heaviest parts and thin boxes named (`src/spec/model.mjs`, commit 7846e1f) |
| `check { qa: true }`: the shape QA on any model (game's, imported) | OPEN | `soundness` runs only inside a spec build; neither the MCP `check` tool nor `smak check` calls it |
| Map checks before building: graph connected, links adjacent, sizes | PARTLY | Links not side by side are an error; a room whose middle is not walked to is a warning; no graph check before layout |
| Map: each declared link matched to an opening the walk test found | OPEN | |
| Map: walk test, plan check, compile, dark floors, sections through stairs | DONE | `buildMapSpec` check phase (`src/spec/map.mjs`, lines 1150 to 1270) |
| Report keyed by part and room ids, with fixed pictures | DONE | Model and map reports; `focus`, `reference`; change report (`src/spec/changes.mjs`) |
| A benchmark of known-good and broken-on-purpose specs, with a build-error rate to track | PARTLY | `test/46-specs.mjs` names broken shapes and maps; 38 worked cases in `examples/prompts/`; no tracked invalidity rate |
| JSON Patch (RFC 6902) edits for large specs | OPEN | Whole specs are resent; low value |

## local-3d-generators.md (open-source text or image to 3D, run here)

| Item | Status | Where / what is missing |
| --- | --- | --- |
| Generators as an optional Python pre-step outside the kit | DONE | `/media/Data3/Packages/local-3d/` (scripts, venvs, weights); the kit stays dependency-free |
| Hunyuan3D-2mini shape for rounded, organic forms | DONE | `local-3d/scripts/hunyuan_mini_shape.py`, used again in `photo-to-model-experiments.md` |
| A spec part from a generated `.obj` (placed, scaled and painted by the spec) | OPEN | The model spec has no `obj` part kind; `prefab` takes `.json` only. Today an `.obj` becomes a whole model through `smak obj` |
| Gate every import on `soundness`, `seeThrough`, the points limit and a sheet | PARTLY | `local-3d/scripts/qa.mjs` does it by hand; nothing in the kit gates an import |
| Try TripoSG (MIT) | OPEN | Carried into the benchmark plan of `photo-to-model-experiments.md` |
| Research reduction to a budget | DONE | `3d-fidelity-methods.md` section 1 and the measured comparison in `photo-to-model-experiments.md` |
| Multi-view pictures (Hunyuan3D-2mv) or prompts that show the whole object | OPEN | |
| LLaMA-Mesh through llama.cpp | OPEN | Not tried; low priority |
| Shap-E | DECLINED | This report: weak shapes at any budget |
| Hunyuan's texture stage, TRELLIS, InstantMesh, SF3D ported to ROCm | DECLINED | This report: texture comes from SMAK's paint. Hunyuan's paint stage is reopened as item 10 of `3d-fidelity-methods.md` |

## sound-generation.md (sounds from a spec)

| Item | Status | Where / what is missing |
| --- | --- | --- |
| WAV read and write: mono, 8 and 16 bit, one cue point, never stereo, TPDF dither at 8 bit | DONE | `src/audio/wav.mjs`; commit 792e709 |
| Hard checks: format, clipping, DC, level, silence at the ends, unfaded end, loop cue and seam | DONE | `checks()` in `src/audio/measure.mjs`. Missing: loop RMS match across the seam, whole cycles of each tone in a loop |
| Name checks: lower case, under `sound/`, 63 characters | DONE | `src/spec/sound.mjs` (`LONGEST_NAME`) |
| Features: length, peak, RMS, crest, attack, T20, T40, centroid, roll-off, flatness, bands, onsets | DONE | `features()` in `src/audio/measure.mjs` |
| LUFS loudness (ITU-R BS.1770) | OPEN | Optional in the report |
| Synthesis blocks: seeded noise, biquads, envelopes, oscillators with sweep, FM, modes, particles, room, saturation, finish | DONE | `src/audio/synth.mjs` |
| Layer kinds `sequence` and `sound` (a sound as a prefab) | OPEN | `KINDS` in `src/spec/sound.mjs` is noise, tone, fm, modes, particles; a layer's `at` covers simple sequences |
| `preset` (a layer or sound from the recipe table), `recipes.mjs` | OPEN | No presets; every spec writes its layers |
| Loop with a start other than 0 (`loop: { start }`) | OPEN | The cue is always at sample 0 |
| `smak.sound/1` spec, `build` dispatch, report, variants | DONE | `src/spec/sound.mjs`, `docs/SPEC.md` "A sound" |
| Reference ranges as data, re-measurable from the game | DONE | `src/audio/classes.mjs`, `research/sound-classes.mjs` |
| Picture: waveform over spectrogram, the game's beside it, loop start marked | DONE | `soundPicture` in `src/audio/draw.mjs`. Missing: a loop's seam drawn close, the loop drawn twice end to end |
| `info`, `check` and `render` take a `.wav` | OPEN | Neither `bin/smak.mjs` nor the MCP tools read a `.wav` outside `build` |
| Weapon `sounds` with a 5004 event at a frame, warned when longer than the animation | DONE | `weapon.sounds` in `src/spec/model.mjs`; commits 4a8e31a, 33f752d |
| A table of each Half-Life weapon's code-named sounds by role (`fire`, `hit`, `pump`...) | PARTLY | The spec gives the file the game's name by hand; no role table |
| Map `ambient_generic` sounds, flag 32 when not looped | DONE | Map spec `sounds` (`src/spec/map.mjs` line 1091) |
| Footsteps: `footsteps: { "M": ... }` writing the four fixed files and saying which textures `materials.txt` gives that letter | OPEN | |
| A mod profile names a mod's sounds and where they are precached | OPEN | |
| Worked cases: the wrench's six sounds, a looped hum on a map, the revolver's sounds | DONE | `examples/prompts/38-sound-wrench`, case 13's `result-04-fridge-hum` revision, commit 33f752d |
| Presets for the eight targets, steps and loops, each scored against its class as a test | OPEN | `test/47-audio.mjs` tests the blocks, not presets |
| `smak play` recording the game's audio | OPEN | Out of scope in the report |

## 3d-fidelity-methods.md (photo or prompt to a prop that keeps its look)

| Item | Status | Where / what is missing |
| --- | --- | --- |
| 1. Cut-out with `birefnet-general` instead of rembg's default (BRIA RMBG-2.0, non-commercial); words-to-box step | PARTLY | `local-3d/scripts/hunyuan_mini_shape.py` names `birefnet-general` since 2026-10-14; the words-to-box step (Grounding DINO or OWLv2) is open |
| 2. QEM decimator in Node (attributes, crease penalty, boundary planes, link and flip checks, staged), with chart-locked mode (Sander et al.) | OPEN | No reducer in `src/` |
| 3. Normals codebook (or crease angle raised until a body fits 2048 normals) | PARTLY | A spec's `smooth` angle per part trades normals by hand (commit 8769256); no automatic codebook |
| 4. BVH ray caster and AO / cavity bake from an outside dense mesh | OPEN | `finish` paints light, wear and grime from the spec's own shape, with no rays and no outside mesh |
| 5. Silhouette pose fit of a photo (mask render, chamfer cost, Nelder-Mead or CMA-ES) | OPEN | `project` takes the view as given (`view`, `yaw`, `pitch`) and only finds the outline's box |
| 6. Projective texture with visibility, MRF labels, seam levelling, symmetry fill, push-pull | PARTLY | `src/spec/project.mjs` (commit fcfcc0f): straight-on pictures blended by how squarely they see, with a depth test. Missing: per-face labels, seam levelling, mirror fill, push-pull for the unseen, perspective cameras |
| 7. View-based or photo-based charting, small charts merged, mirrored charts, LSCM | OPEN | Measured in Python only (`charts_by_view.py`) |
| 8. Handle removal (voxel closing) before reduction | OPEN | Measured in Python only (`charts_closing.py`) |
| 9. Image-driven last reduction stage | OPEN | Only if experiment 7.2 says it pays |
| 10. Try TripoSG and Hunyuan3D-2.1 shape; Hunyuan3D-2 paint after `sudo apt install libhipblaslt-dev` | OPEN | Steven installed the package on 2026-10-14; the build of the paint stage is not tried yet |
| Palette: k-means refinement or Wu's quantiser instead of median cut alone | OPEN | `indexed` in `src/image.mjs` is median cut |
| De-lighting: spherical-harmonic shading division; multi-view median | OPEN | |
| Experiments 7.1 to 7.9 and U1 (reduction, bake, camera, texture, de-light, isolation, generator, charts) | OPEN | Folded into the benchmark plan of `photo-to-model-experiments.md` |
| Learned retopology, differentiable-rendering simplification, TRELLIS.2, Pixal3D, SAM 3D | DECLINED | This report, "Deferred": licences, CUDA only, or over 16 GB of video memory |
| Tuning xatlas options | DECLINED | Measured no help (section 6.1) |

## improvements-research.md (judging, characters, textures, sounds, maps)

| Item | Status | Where / what is missing |
| --- | --- | --- |
| 1. An independent judge that sees only pictures and the prompt | PARTLY | `examples/reproduce/judge.mjs` (commit 1387d2b): a fresh agent scores reproductions of Valve's models and maps against measurements, with box and other-subject decoys. Missing: it is not run on the 38 prompt cases, the judge is the same model family (Claude), no DSG questions from the prompt alone, no recognition-without-prompt step, no pairwise Bradley-Terry ranking, no calibration (Cohen's kappa) against Steven |
| 2. Quantise in OKLab with k-means refinement | OPEN | `src/image.mjs` median cut in RGB |
| 3. Map measures: loops, dead ends, choke points, depth, fill, light rhythm, held against stock maps | OPEN | |
| 4. AO and curvature bakes into `finish` | OPEN | `grime` is still the 2-unit contact rule (`src/spec/finish.mjs`) |
| 4. Warm-cool light and value bands in `finish` | OPEN | `light` changes value only |
| 5. Sound metrics: CLAP, KAD, PAM, production quality against leave-one-out ranges of the game's own | OPEN | |
| 6. Modal frequencies from the part's size and material (`"from": "part:head"`) | OPEN | |
| 7. One-listener MUSHRA page | OPEN | |
| 8. Smooth characters: SDF smooth union, SQM-style mesh, projection, heat-cut bones (`kind: "blob"`) | OPEN | The cat (case 36) was improved inside its spec instead: a pear-shaped body over the legs and a painted belly (commits c4fd8f5, ac44c3b) |
| Short legs on Gordon's skeleton: say so, or build the leg surface shorter (a design choice for Steven) | PARTLY | Case 36 hides the thighs under the body; the choice is not recorded as a kit rule or a report warning |
| 9. Sightlines and visibility graph | OPEN | |
| 10. Wave Function Collapse dressing of walls and floors | OPEN | |
| 11. Exemplar texture synthesis with guide channels | OPEN | Large; wait for the judge |
| 12. Bot playtests | DECLINED | This report: out of scope for now |
| Expressive range of the map cases (are all maps boxes in a row) | OPEN | |
| Mission check (a lock's key before it, the goal not in a dead end) | OPEN | |

## directed-video.md (a camera on a path)

| Item | Status | Where / what is missing |
| --- | --- | --- |
| 1. `sheet` honours a passed `within` | DONE | `src/render.mjs` line 561; commit 7acbcac |
| 2. `src/camera.mjs`: centripetal Catmull-Rom, arc length, ease, look-ahead with smoothed yaw, Ramer-Douglas-Peucker | DONE | `src/camera.mjs` (commit 13c7c25) |
| 3. `src/video.mjs`: shots to frames in worker threads, smoothness metric, eye clearance check, contact sheet | PARTLY | `src/video.mjs`: shots, smoothness faults, eye-in-solid check, contact sheet. Missing: worker threads (one thread: a 25-second clip in about a minute), clearance as a distance from walls |
| 4. Encoders: ffmpeg on standard input (MP4 H.264), a plain-JS GIF writer with global palette, changed rectangles, ordered dither | PARTLY | ffmpeg from raw frames on its input; a GIF writer with a palette a frame. Missing: global palette, changed rectangles, dither |
| 5. `smak video`, `smak.video/1` in `docs/SPEC.md`, MCP `video` tool, a worked case, a selftest | PARTLY | `smak video`, the spec, the MCP `build` tool takes it (`preview`), `test/49-video.mjs`. Missing: a worked case in `examples/prompts/` |
| 6. `--entities` (`trigger_camera` and `path_corner` written into a `.bsp`) | OPEN | Later |
| 6. A `play` recording step in the browser build | OPEN | Later; stepping the engine's frame loop is unsolved |
| 6. Fades, a soundtrack from the sound module, APNG | OPEN | Later |
| MJPEG in AVI, a VP8 encoder in JS | DECLINED | This report: no inline playback, ffmpeg is there |
| HLTV director paths and GoldSrc `startmovie` | DECLINED | This report: reuse the keyframe idea only; not drivable headless |

## photo-to-model-experiments.md (photo to prop, experiments)

| Item | Status | Where / what is missing |
| --- | --- | --- |
| Decide every stage by a benchmark of objects (car, barrel, lamp post, chair, statue, hydrant, character, rock), from text and real photos | OPEN | The plan is written (commit eea04da); no benchmark run yet |
| Cut-out options compared (BRIA, BiRefNet, Grounding DINO or OWLv2 then SAM 2) | OPEN | And see item 1 of `3d-fidelity-methods.md`: the script still uses BRIA |
| Generators compared (Hunyuan3D-2mini, TripoSG, Hunyuan3D-2.1 shape, SPAR3D) | OPEN | |
| Reduction compared, including a Node quadric reducer, with and without closing | OPEN | Python comparison done once on the car (`reduce_compare.py`); the Node reducer is not built |
| Charts compared (xatlas, photo charts, view-based merged, mirrored) | OPEN | |
| Texture compared (per-texel blend, best photo per face with levelling, symmetry fill, fill for the unseen) | PARTLY | The kit's `project` does the per-texel blend for straight-on pictures (`src/spec/project.mjs`); the rest is Python experiments |
| Bake compared (none, AO, AO plus cavity) | OPEN | |
| Winners move into the kit in Node: reducer, normals codebook, bake, camera fit, projection, charts | PARTLY | Only the projection, in its straight-on form |
| Roof and underside no photo sees; reflections baked in; underside fins | OPEN | Named as still wrong; wait on symmetry fill, de-lighting and the generator comparison |

## sprite-generation.md (sprites from a spec)

| Item | Status | Where / what is missing |
| --- | --- | --- |
| 1. Writer and byte-exact round trip; the reader keeps every field | DONE | `src/sprite/spr.mjs`, `readSpr` keeps radius, beam, sync, groups; all 170 of Half-Life's sprites round-trip byte for byte (`test/46-specs.mjs`, commit adc09ae) |
| 2. One palette per format | DONE | `src/sprite/palette.mjs` (additive black at 0, index alpha, alpha test, normal) |
| 2. `smak sprite-make` from PNG frames | OPEN | No command; no `picture` layer |
| 3. Measures and Half-Life's classes | PARTLY | `src/sprite/measure.mjs` (wrap, jitter, border, envelope, dark) and its class table from the report's numbers. Missing: a research script measuring the game's sprites again, as `sound-classes.mjs` does |
| 4. Contact sheet and an animated PNG | DONE | `src/sprite/draw.mjs`, `apng()` in `src/image.mjs` |
| 5. Layer kinds | PARTLY | glow, flare, fire, smoke (noise), explosion, sparks, ring, beam in `src/sprite/effects.mjs`. Missing: `picture`, `shape`, fluid smoke |
| 6. `smak.sprite/1`, the MCP branch, the guide's section | DONE | `src/spec/sprite.mjs`, `build`, `docs/SPEC.md` "A sprite". Missing: worked prompts in `examples/prompts/` |
| 7. A map spec's `sprites` field (`env_sprite`, `env_glow`) | OPEN | |
| `info` and `render` take a `.spr` | OPEN | |
| 8. Later: fluid smoke with vorticity, decals into a `.wad`, HUD sheets, an image-model pre-step | OPEN | SD-Turbo over frames measured and judged not worth building in |

## repeated-failures.md (what the reproductions failed on, round 1)

| Item | Status | Where / what is missing |
| --- | --- | --- |
| 1. A triangle budget as a fault, per-part triangles, `paint: true` | DONE | `src/spec/model.mjs`, `src/spec/bake.mjs` (commit 7846e1f) |
| 2. Round parts shaded smooth by default; the sides rule | DONE | `smoothOf` in `src/spec/model.mjs`; `docs/SPEC.md` "How many sides" |
| 3. The harness's empty views; M4 on smoothed pictures; the angle pictures' yaw and pitch in the prompt | DONE | Steven's amendment in `examples/reproduce/rubric.md`; `lib.mjs`, `judge.mjs`, `reproduce.mjs` (commits 88a7ce2, 7846e1f) |
| 4. A `views` part kind: carved hull, Node reducer, then `project` | OPEN | The carving was measured in Python (headcrab 0.75 to 0.95 overlap); needs the Node reducer (FM 2) |
| 5. `seen` colours, the XKCD names with modifiers, warmer metal defaults | DONE | `src/spec/colours.mjs`, `materialOf` (commit 601def7) |
| 6. Painted part shapes (cup pull, vent, grille, screen, hex nut, knob) and built ones (wheel, rail, leg, strap, superquadric, cut) | OPEN | |
| 7. `project` divides out the pictures' light per surface direction | OPEN | |
| 8. A spec `wear` layer list over accessibility and dust masks; the "too clean" ratios in the harness | OPEN | |
| 9. RANSAC planes and cylinders on a carved hull | OPEN | After 4 |
| Learned primitive fitting (Tulsiani, Paschalidou, CSGNet) | DECLINED | The report: needs training and a GPU; the agent is the fitter |

## map-reproduction-failures.md (what the map reproductions failed on, round 1)

| Item | Status | Where / what is missing |
| --- | --- | --- |
| 1. The MCP map renderer gets the game's `.wad` folders | DONE | `mapFolders` in `mcp/tools.mjs` (commit 857b6fe) |
| 2. Which texture each face of a `.bsp` wears | PARTLY | `info` with `full` gives each texture's share of the world's faces and whether on walls, floors or ceilings. Missing: a per-face or per-room listing |
| 3. Dark rooms allowed | DONE | A room's `dark: true` |
| 4. A labelled grid on the plan, storeys and sections | PARTLY | `grid` on plans (`planOf`, `planOfSource`, `map-plan --grid`, the render tool), and the reproduction's map inputs. Missing: storeys and sections |
| 5. Polygon room outlines and `prism` / `solid` pieces | PARTLY | Prefab `prism` pieces. Missing: a room with a polygon outline, `solid` pieces |
| 6. The calibrated texture-light values by default | OPEN | Being ported with bsp2map; the report's SDHLT light anomaly is unexplained |
| 7. A texture-identification tool (surface patches matched against a `.wad` in texture space) | OPEN | Measured: 62% right first, 71% in the top 20 |
| 8. Measurements for P5, P6 and P9 given to the judge (texture match, light, SSIM of views) | OPEN | |
| 9. Port bsp2map (Steven agreed); a "bsp + decompiler" leg beside the bsp leg | PARTLY | Being ported into `src/maps/decompile.mjs`; SDHLT copies reconciled (both carry both of Steven's fixes) |
| 10. Later: a plan tracer, text-to-texture search | OPEN | |

## Open, by priority

Most value for least work first. Each line names its report: CF compiler-features, GR generation-research,
L3 local-3d-generators, SG sound-generation, FM 3d-fidelity-methods, IR improvements-research, DV
directed-video, PE photo-to-model-experiments, SP sprite-generation, RF repeated-failures, MF
map-reproduction-failures.

1. Words-to-box before the cut-out (Grounding DINO or OWLv2, Apache 2.0), to pick one subject of several (FM 1, PE). (The BiRefNet switch is done.)
2. Two doc lines on SDHLT's faults (`-subdivide 512`, `%NAME`), and SPLITFACE in `SEALS_NOTHING` (CF).
3. Run `soundness` and `seeThrough` from `check` (MCP and command line) on any model (GR).
4. Finish the bsp2map port; the "bsp + decompiler" leg; the calibrated texture lights (MF 6, 9).
4a. Judge measurements for maps: texture match, light parity, view SSIM (MF 8).
4b. A map spec's `sprites` field; `sprite-make` from PNG frames; worked sprite and video cases (SP 2, 7; DV 5).
4c. The `views` part kind with the Node reducer (RF 4, FM 2).
4d. A texture-identification tool for maps (MF 7); polygon room outlines (MF 5).
5. Quantise palettes in OKLab with k-means refinement (IR 2, FM).
6. Map graph measures: loops, dead ends, choke points, depth, fill, light rhythm, against stock maps (IR 3).
7. `NULL` on hidden furniture faces and piece textures by face (CF 6).
8. Texture scale per material and `lightScale` (CF 5).
9. `collide: "box"` and `collide: "none"` (`zhlt_noclip` plus CLIP boxes), and the walk test reading `zhlt_noclip` (CF 3, 8).
10. Minlight: RAD `-minlight`, `info_minlights` per material, `_minlight` (CF 11).
11. `zhlt_usemodel` for repeated brush furniture (CF 4).
12. `zhlt_lightflags 2` for opaque furniture and doors; SOLIDHINT on hidden terrain sides (CF 12).
13. Studio model shadows on props, compiling where RAD finds `models/` (CF 10).
14. `.wav` in `info`, `check` and `render` (SG).
15. Modal frequencies from a part's size and material (IR 6).
16. Video: worker threads, a global-palette GIF with changed rectangles, wall clearance by distance (DV 3, 4).
17. Judge: prompt-only DSG questions, a non-Claude VLM, recognition without the prompt, pairwise ranking, controls, run on the 38 cases, calibrated against Steven (IR 1).
18. AO and curvature bake, warm-cool light and value bands in `finish` (IR 4).
19. Sound presets from the recipe table, each scored against its class as a test (SG).
20. Footsteps with `materials.txt`, the per-weapon role table of code-named sounds, mod profiles naming sounds (SG).
21. Loop start other than 0, loop RMS and whole-cycle checks, seam picture, LUFS (SG).
22. Sound layer kinds `sequence` and `sound` (SG).
23. A spec part from an `.obj`, gated on the soundness checks: the bridge to the generators (L3).
24. Map checks: link-to-opening match, graph connectivity before layout, lock-and-key `locked_by`, mission check (GR, IR).
25. Model checks: genus, slivers, self-intersection, centre of mass over the base, long axis of a held piece, silhouettes, texture zones (GR).
26. Model spec: `plate` kind, box `bevel`, torus, kit presets, a new body into an existing model (GR).
27. Room size presets, `corridor` links, placement of unplaced rooms (GR).
28. JSON Schema for each spec, served by `guide` (GR).
29. `compileMap({ leakOnly })`; `func_detail` level, chopdown and priority keys; hulls refused unless the profile allows (CF).
30. A tracked build-error rate over a fixed set of good and broken specs (GR).
31. Sound metrics CLAP, KAD, PAM and production quality with leave-one-out ranges; a MUSHRA page for Steven (IR 5, 7).
32. The photo benchmark: cut-outs, generators (TripoSG, Hunyuan3D-2.1, SPAR3D, 2mv), reduction, charts, texture, bake, each measured (PE, FM experiments, L3).
33. Node QEM reducer with chart-locked mode, handle removal first, normals codebook (FM 2, 3, 8).
34. BVH and AO / cavity bake from a dense mesh (FM 4).
35. Silhouette pose fit, then MRF labels, seam levelling, symmetry fill and push-pull in `project` (FM 5, 6).
36. View-based and mirrored charts with LSCM (FM 7).
37. De-lighting (spherical harmonics, multi-view median) (FM).
38. Smooth characters (`blob`: smooth union, SQM mesh, heat-cut bones); record the short-legs rule (IR 8).
39. Sightlines and visibility graph; expressive range of the map cases (IR 9).
40. Video later items: `--entities`, `play` recording, fades, soundtrack, APNG (DV 6).
41. Lower-ranked map spec forms: hints, currents, `invisible`, `unlit`, light fade, spots, sun spread, per-material smooth and translucent, VIS `maxDistance`, hull file, shadow colour, the remaining RAD switches (CF).
42. Hunyuan3D-2 paint after `libhipblaslt-dev`; image-driven reduction stage; LLaMA-Mesh (FM 9, 10, L3).
43. Wave Function Collapse dressing; exemplar texture synthesis (IR 10, 11).
44. JSON Patch edits; `smak play` recording audio (GR, SG).
45. Painted part shapes and built part kinds (wheel, rail, leg, strap, superquadric, cut) (RF 6).
46. `project` divides out the pictures' light; a spec `wear` layer list and the "too clean" ratios (RF 7, 8).
47. Sprites: re-measuring the game's sprites by a research script, `picture` and `shape` layers, `.spr` in `info` and `render`, fluid smoke, decals, HUD sheets (SP).
48. Map pictures: the grid on storeys and sections; per-face textures of a `.bsp`; a plan tracer; text-to-texture search (MF 2, 4, 10).
