# Research backlog

Every concrete recommendation or build item from the reports in `research/`, checked against the code, docs and
git history: first as of 2026-10-14 (commit 7acbcac), brought up to date the same day after the sprite,
video, repeated-failure and map-failure work (commit 13c7c25), and again after the asset and held-model
failure research and the work on them (commit 877280e). This is the one list to work from: when an item
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
| A benchmark of known-good and broken-on-purpose specs, with a build-error rate to track | PARTLY | `test/46-specs.mjs` names broken shapes and maps; the worked cases in `examples/prompts/`, rebuilt on any two kits and compared by sentences and by texture colours (`rebuild-all.mjs --compare`, `--compare-pictures`); no tracked invalidity rate |
| JSON Patch (RFC 6902) edits for large specs | OPEN | Whole specs are resent; low value |

## local-3d-generators.md (open-source text or image to 3D, run here)

| Item | Status | Where / what is missing |
| --- | --- | --- |
| Generators as an optional Python pre-step outside the kit | DONE | `/media/Data3/Packages/local-3d/` (scripts, venvs, weights); the kit stays dependency-free |
| Hunyuan3D-2mini shape for rounded, organic forms | DONE | `local-3d/scripts/hunyuan_mini_shape.py`, used again in `photo-to-model-experiments.md` |
| A spec part from a generated `.obj` (placed, scaled and painted by the spec) | DONE | Part kind `mesh` (`src/spec/model.mjs`: reduced, fitted, laid out and projected as `carved`); the MCP tool `generate` makes the `.obj` with Hunyuan3D-2mini (`kind: "shape"`, from a picture or from words through SD-Turbo); `test/57-generate.mjs` |
| Gate every import on `soundness`, `seeThrough`, the points limit and a sheet | PARTLY | A `mesh` part goes through the model spec's checks; `smak obj` still does not run `soundness` |
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
| LUFS loudness (ITU-R BS.1770) | DONE | `loudness` in `src/audio/loudness.mjs` (EBU's tone at -23.0, ffmpeg's meter matched on a take); used by the music spec, not yet in a sound's report |
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

## local-sound-generators.md (open text-to-audio models, run here)

| Item | Status | Where / what is missing |
| --- | --- | --- |
| Generators installed and run on ROCm: TangoFlux, EzAudio, Woosh Flow and DFlow, six sounds by four seeds | DONE | `/media/Data3/Packages/local-audio/` (`scripts/install.sh`, `generate.py`, `finish.mjs`); outside the kit |
| Steven listens to the four models' takes beside Haiku's and Valve's | DONE | 2026-10-15: Woosh-DFlow the most accurate and the default, iterated over seeds; Woosh-Flow the best hit; other models selectable (report, "Steven's listening") |
| Sound layer kind `sample`: a work-folder WAV, cut by `from`/`length` or `onset`, with the layer's env, filter, pitch and gain; provenance from a sidecar, an NC licence told as a fact | DONE | `src/spec/sound.mjs`, `readWav` (24, 32-bit, float, extensible) and `resample` in `src/audio/wav.mjs`; `test/47-audio.mjs` |
| MCP `generate` tool running a locally installed model, found by `--generators` or `SMAK_GENERATORS` (option A) | DONE | `mcp/generate.mjs`, `generators/worker.py` (one model kept loaded), `generators/install.sh` and `install-music.sh`, `generators.json` (Woosh-DFlow and ACE-Step XL the defaults); `test/57-generate.mjs` with a stand-in worker; run end to end here. Missing: EzAudio and Stable Audio in the worker |
| Stable Audio Open 1.0, Open Small, Stable Audio 3 small SFX | OPEN | Gated on HF: Steven accepts the terms and logs in (report, section 8); `generate.py sao` is written, not run |
| Per-model prompts and lengths, more DFlow seeds; EzAudio inpainting for loop seams and longer loops | OPEN | Report, "Next" |
| A takes-picker that prefers one onset for a one-shot and shows the picture | OPEN | The class score picked noise beds over hits (report, section 4) |
| Makers that shape a take rather than drop it | OPEN | Sounds rounds 3 to 6 (2026-10-15, Haiku makers, `generate` offered; 4, 6, 5, 7 of 20): most makers called `generate`, then built from layers because no take matched the picture as it came (late or spiky onsets, the wrong envelope, too short) and because the report's non-commercial warning on Woosh told them a take "may not be sold". The kit has what shaping needs (`from: "onset"`, `env` on a sample layer, filters, layers over it); what is missing is a take nearer at the start (several prompts, the class's length) or the guidance to shape one. Steven's call (2026-10-15): the licence is a fact in the report, not a warning |
| TangoFlux | DECLINED | This report: slowest here, loose on length, NC; nothing Woosh and EzAudio lack |
| AudioLDM 2, Tango 2, AudioGen, MAGNeT, Make-An-Audio 2 (16 kHz), MOSS-SoundEffect 8B (16 GB) | DECLINED | This report, section 1 |

## local-music-generators.md (open music models, run here)

| Item | Status | Where / what is missing |
| --- | --- | --- |
| ACE-Step 1.5 (2B turbo, XL turbo, 2B with its planner) and MusicGen stereo large installed on ROCm; four cues by four seeds each; the game's 27 tracks measured in place | DONE | `/media/Data3/Packages/local-audio/` (`scripts/install-music.sh`, `generate-music.py`, `finish-music.py`, `measure-music.py`, `music-pictures.mjs`); takes in `~/stignored/music-review/` |
| Steven listens to the takes beside the game's tracks | DONE | 2026-10-15: ACE-Step follows music theory best and XL wins on sound over four seeds; the planner and MusicGen out (report, section 6a) |
| Music entries in the `generate` tool's manifest (`kind: "music"`, `bpm`, `key`, `metre`, `loop`), ACE-Step XL in bf16 as the music default and the 2B as the fast choice; loops by turn-and-repaint in whole bars | DONE | `generators/worker.py`, `generators.example.json`. Missing: `metre`; prompts for EDM (naming the genre made it worse, Steven 2026-10-15) |
| `smak.music/1`: a take cut, looped, faded, levelled to -14 LUFS, EQ, sound layers mixed in, written as 44.1 kHz stereo MP3 under a `media/` name or a CD `track`, or a looped WAV for `ambient_generic`; measured against the game's groups | DONE | `src/spec/music.mjs`, the `build` tool; `test/47-audio.mjs`. Missing: sound layers mixed in, `bars` with a tempo |
| Map spec `music`: `trigger_cdaudio` / `target_cdaudio` (with `trigger_auto` for the start) by track, single-player warning, the mod profile saying when the mod plays music its own way | PARTLY | `music` in `src/spec/map.mjs`. Missing: the mod profile's own way of music (Master Sword's `mp3 play`) |
| In-game tests: a mod's `media/Half-LifeNN.mp3` found before valve's, the MP3 loop gap through Miles, `worldspawn` `sounds`, the `mp3` subcommands' arguments | OPEN | Read from code and engine strings only |
| Magenta RealTime 2 (CC-BY, MIDI input) through JAX on ROCm; Stable Audio 3 music models once their terms are accepted | OPEN | Report sections 1, 10 |
| MusicGen, and ACE-Step with its planner, as the music generator | DECLINED | Steven's ear (section 6a); MusicGen is also NC, forty times slower than ACE-Step here, in 30 s windows |
| Song models (YuE2, DiffRhythm 2, HeartMuLa, SongGeneration, SongBloom, MiniMax Music 3) | DECLINED | This report, section 1: built for vocals; NC, CUDA-only or 24 GB |

## 3d-fidelity-methods.md (photo or prompt to a prop that keeps its look)

| Item | Status | Where / what is missing |
| --- | --- | --- |
| 1. Cut-out with `birefnet-general` instead of rembg's default (BRIA RMBG-2.0, non-commercial); words-to-box step | PARTLY | `local-3d/scripts/hunyuan_mini_shape.py` names `birefnet-general` since 2026-10-14; the words-to-box step (Grounding DINO or OWLv2) is open |
| 2. QEM decimator in Node (attributes, crease penalty, boundary planes, link and flip checks, staged), with chart-locked mode (Sander et al.) | PARTLY | `reduce` in `src/qem.mjs` (boundaries kept, `test/54-carve.mjs`). Missing: attributes, crease penalty, chart-locked mode |
| 3. Normals codebook (or crease angle raised until a body fits 2048 normals) | PARTLY | A spec's `smooth` angle per part trades normals by hand (commit 8769256); no automatic codebook |
| 4. BVH ray caster and AO / cavity bake from an outside dense mesh | OPEN | `finish` paints light, wear and grime from the spec's own shape, with no rays and no outside mesh |
| 5. Silhouette pose fit of a photo (mask render, chamfer cost, Nelder-Mead or CMA-ES) | PARTLY | A character's stance fitted to its pictures' outlines (`pose.fit`, `src/spec/posefit.mjs`, coordinate descent, commit 877280e). Missing: a prop's camera fit to a photo; CMA-ES |
| 6. Projective texture with visibility, MRF labels, seam levelling, symmetry fill, push-pull | PARTLY | `src/spec/project.mjs`: straight-on pictures with a depth test; only the views within 0.95 of the squarest blend (headcrab local contrast 4.04 to 5.20, Valve's 6.00); ground only where joined to the border; colour bled three texels past every cut; 512 x 512 by default. Missing: per-face labels, seam levelling, mirror fill, push-pull for the unseen, perspective cameras, the last of the sharpness gap |
| 7. View-based or photo-based charting, small charts merged, mirrored charts, LSCM | OPEN | Measured in Python only (`charts_by_view.py`) |
| 8. Handle removal (voxel closing) before reduction | OPEN | Measured in Python only (`charts_closing.py`) |
| 9. Image-driven last reduction stage | OPEN | Only if experiment 7.2 says it pays |
| 10. Try TripoSG and Hunyuan3D-2.1 shape; Hunyuan3D-2 paint after `sudo apt install libhipblaslt-dev` | PARTLY | Hunyuan3D-2 paint (turbo) runs here since 2026-10-15: the rasteriser hipifies and builds, 16 s and 10.7 GB from one picture to six views (`character-texturing.md`, E7); on the zombie its views were flat colour. TripoSG and 2.1 shape not tried |
| Palette: k-means refinement or Wu's quantiser instead of median cut alone | OPEN | `indexed` in `src/image.mjs` is median cut |
| De-lighting: spherical-harmonic shading division; multi-view median | OPEN | |
| Experiments 7.1 to 7.9 and U1 (reduction, bake, camera, texture, de-light, isolation, generator, charts) | OPEN | Folded into the benchmark plan of `photo-to-model-experiments.md` |
| Learned retopology, differentiable-rendering simplification, TRELLIS.2, Pixal3D, SAM 3D | DECLINED | This report, "Deferred": licences, CUDA only, or over 16 GB of video memory |
| Tuning xatlas options | DECLINED | Measured no help (section 6.1) |

## improvements-research.md (judging, characters, textures, sounds, maps)

| Item | Status | Where / what is missing |
| --- | --- | --- |
| 1. An independent judge that sees only pictures and the prompt | PARTLY | `examples/reproduce/judge.mjs`: a fresh agent scores reproductions against measurements, with box and other-subject decoys; Haiku, two readings a model (each item the better), the identical-original control and its one-pixel `touched` form, the model prompt told to count small parts and tell paint from shape; Steven's blind reviews in `examples/reproduce/reviews/` (rubric amendments of 2026-10-14). Missing: run on the 38 prompt cases, a non-Claude judge, DSG questions from the prompt alone, recognition without the prompt, pairwise ranking, an agreement figure (Cohen's kappa) once enough reviews are in |
| 2. Quantise in OKLab with k-means refinement | OPEN | `src/image.mjs` median cut in RGB |
| 3. Map measures: loops, dead ends, choke points, depth, fill, light rhythm, held against stock maps | OPEN | |
| 4. AO and curvature bakes into `finish` | OPEN | `grime` is still the 2-unit contact rule (`src/spec/finish.mjs`) |
| 4. Warm-cool light and value bands in `finish` | OPEN | `light` changes value only |
| 5. Sound metrics: CLAP, KAD, PAM, production quality against leave-one-out ranges of the game's own | OPEN | |
| 6. Modal frequencies from the part's size and material (`"from": "part:head"`) | OPEN | |
| 7. One-listener MUSHRA page | OPEN | |
| 8. Smooth characters: SDF smooth union, SQM-style mesh, projection, heat-cut bones (`kind: "blob"`) | PARTLY | Part kind `blob` (2026-10-15, `src/spec/blob.mjs`, the mesher shared with carve in `src/spec/surface.mjs`): capsules along limbs and ellipsoids at joints, a smooth minimum, each corner on its nearest piece's bone; `test/59-blob.mjs`. Not yet shown to help: Haiku makers score 0 of 7 characters with or without it, and the older Opus specs rebuild at 11 to 15 of 18, so its worth needs an Opus round (Steven's call). Its first use swallowed a squared vest: the guide keeps it to soft forms, 600 triangles unless told |
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
| 4. A `views` part kind: carved hull, Node reducer, then `project` | DONE | Kind `carved` (`src/spec/carve.mjs`, `src/qem.mjs`), refined at 160 to 256 cells for thin parts; it now reports the thin pieces it lost (a headcrab's claws), view by view, for the maker to add as parts |
| 5. `seen` colours, the XKCD names with modifiers, warmer metal defaults | DONE | `src/spec/colours.mjs`, `materialOf` (commit 601def7) |
| 6. Painted part shapes (cup pull, vent, grille, screen, hex nut, knob) and built ones (wheel, rail, leg, strap, superquadric, cut) | PARTLY | `superquadric` part kind (commit fd5dea0). Missing: the painted shapes, wheel, rail, leg, strap, cut |
| 7. `project` divides out the pictures' light per surface direction | OPEN | |
| 8. A spec `wear` layer list over accessibility and dust masks; the "too clean" ratios in the harness | OPEN | |
| 9. RANSAC planes and cylinders on a carved hull | OPEN | After 4 |
| Learned primitive fitting (Tulsiani, Paschalidou, CSGNet) | DECLINED | The report: needs training and a GPU; the agent is the fitter |

## map-reproduction-failures, AF asset-reproduction-failures, HF held-reproduction-failures.md (what the map reproductions failed on, round 1)

| Item | Status | Where / what is missing |
| --- | --- | --- |
| 1. The MCP map renderer gets the game's `.wad` folders | DONE | `mapFolders` in `mcp/tools.mjs` (commit 857b6fe) |
| 2. Which texture each face of a `.bsp` wears | PARTLY | `info` with `full` gives each texture's share of the world's faces and whether on walls, floors or ceilings. Missing: a per-face or per-room listing |
| 3. Dark rooms allowed | DONE | A room's `dark: true` |
| 4. A labelled grid on the plan, storeys and sections | PARTLY | `grid` on plans (`planOf`, `planOfSource`, `map-plan --grid`, the render tool), and the reproduction's map inputs. Missing: storeys and sections |
| 5. Polygon room outlines and `prism` / `solid` pieces | PARTLY | Prefab `prism` pieces. Missing: a room with a polygon outline, `solid` pieces |
| 6. The calibrated texture-light values by default | OPEN | Being ported with bsp2map; the report's SDHLT light anomaly is unexplained |
| 7. A texture-identification tool (surface patches matched against a `.wad` in texture space) | PARTLY | `matchTextures` and the `info` tool's `like` and `rect` (commit 5a2aedd): a view patch by its colour histogram with the brightness divided out, 5 of frenzy's 25 first, 9 in the first 8. Missing: the report's texture-space matching (62% first) |
| 8. Measurements for P5, P6 and P9 given to the judge (texture match, light, SSIM of views) | OPEN | |
| 9. Port bsp2map (Steven agreed); a "bsp + decompiler" leg beside the bsp leg | DONE | `src/maps/decompile.mjs` (the same text as bsp2map on all 126 maps), `smak map-decompile`, the MCP `decompile` tool, the `decompile` and `plans` legs in `examples/reproduce/subjects.json` (commit fefe723) |
| 10. Later: a plan tracer, text-to-texture search | OPEN | |

## asset-reproduction-failures.md (sprites, sounds and textures, round 1)

| Item | Status | Where / what is missing |
| --- | --- | --- |
| H1 to H5: lit faces, flat sheets, facts to the words leg, class ranges to the sound judge, the scene cache by texture | DONE | `examples/reproduce/assets.mjs`, `maps.texturePlaces`, `src/maps/draw.mjs`; rubric amendment (commits 29eee74, fb5aabd) |
| 2. A place preview per texture; paint under the map's light | DONE | `preview.each`, `material.seen: { colour, light }` (commit fb5aabd) |
| 3. Size parameters for tile, brick, metal, planks, hazard | DONE | `cell`, `course`, `length`, `board`, `stripe`, `angle` (commit fb5aabd) |
| 4. Sprite fill options, the `blast` and `muzzle` ramps | DONE | `src/sprite/effects.mjs` (commit 603c920; `research/sprite-layers-results.md`) |
| 5. Spectral noise, a limiter, `post` layers, periodic particles | DONE | `src/audio/spectral.mjs`, `synth.mjs` (commit ee496d7; `research/sound-shape-results.md`: the limiter at Valve's crest costs the spectrum) |
| 6. The judge's measures in the sprite and sound build reports | DONE | `reference` and `picture` in those specs (commits 603c920, ee496d7) |
| 7. A texture weathering stack | DONE | `wear` (`src/spec/weather.mjs`, commit e4b217e) |
| 8. `audio.fromPicture` to a draft spec | DONE | `src/audio/picture.mjs` (commit ee496d7) |
| 9. Sprite `billow` and `blobs` | DONE | Commit 603c920. Missing: steam1's column of wisps, fire's heat that falls with height |
| 10. Texture relief: pipes, bars, louvres, rivets, seams, lamps | DONE | `src/spec/relief.mjs` (commit 17f9552) |
| 11. Room early reflections; statistics matching for textures | PARTLY | Heeger-Bergen tried (`research/grain-trial.mjs`, not wired): on four of frenzy's textures from their views, blotchy grain with the right colours and no cracks, seams or panel lines. A photograph's detail matched to Valve's grain, patches and colour by kind is built (`reference.mjs`, `reference-textures.md`). Missing: Portilla-Simoncelli's joint statistics; room early reflections |
| A sound picture's onsets read as the judge counts them (`pictureMeasures` matched `features` on 5 of 10 of the test's sounds: drips 8 for 4, doormove 7 for 2, cbar_hit1 0 for 1); then a build warning when a sound's onsets differ from its picture's (the judges' commonest S4 reason in sounds round 5) | OPEN | Tried and reverted 2026-10-15: on the present reading it would mislead. Reading on `features`' own grid (picture frames merged in pairs) also matched 5 of 10, other ones: the count sits on its threshold (mean and two deviations of the flux), so small changes of frames flip it; a judge's onset count is itself fragile. Also the lowest band of a short sound reads low (pl_step1 13% for 27%) |
| Read-back of pictures into pixels (sprites, textures) or samples | DECLINED until Steven decides | Section 7: measures and drafts are in; texels and samples are copying |

## held-reproduction-failures.md (weapons and characters, round 1)

| Item | Status | Where / what is missing |
| --- | --- | --- |
| 1. Weapon placement by the old pair's registration; "as drawn" in the spec's axes | PARTLY | "as drawn" keeps the built axes (commit e2caa54, `src/fit.mjs`); a hidden `v_` weapon at 0.56 of its size, the median (commit ee496d7). Missing: the registration, which reads the hidden files: Steven's decision |
| 2. A character's floor | DONE | `floor` (commit ee496d7) |
| 3. Budgets for every kind | PARTLY | A character warned past twice its base's body (commit b5f8c0a); a prop's report gives Half-Life's triangles for its size (commit 904eebe). Missing: per weapon file, fewer sides in `p_` and `w_` |
| 4. The three small bugs | DONE | The caption finder, `at: "start"` on a bone (commit 7a67d94), "as drawn" (above) |
| 5. Texture layout: sorted packing, a part's texels weight | DONE | `allot` tallest first, `texels` (commit aa674fe). Missing: a default texture size from the area |
| 6. A character's `pose`, keys and `fit` | DONE | `pose.keys`, `pose.fit` (commits 62a1607, 877280e). Missing: CMA-ES, joint limits by bone |
| 7. Per-view parts and chrome for weapons | DONE | A part's `views`, `weapon.chrome` (commit 269dd89) |
| 8. Superquadric parts, then a skin round a chain of joints | PARTLY | `superquadric` (commit fd5dea0). Missing: the skin |
| 9. A monster's activities against its base; motion refitted from the motion pictures | OPEN | |
| 10. Carved hull for characters | OPEN | After the Node QEM |
| 11. A creature's own skeleton and gait in a spec | OPEN | |
| The pictures leg's `project` hands back Valve's own texture | DECLINED until Steven decides | Section 6: copying by the section-7 line |
| A weapon at its own size held at its grip (the piece's origin, as `held` defines it), not at the old weapon's low end | OPEN | `atOwnSize` (`src/build.mjs`) keeps the piece's low end where the old one's was. The game's crowbar runs -5.9 to 20 along the hand bone, so every weapon keeps 6 units behind the hand: the original mod's 18-unit pipe wrench (16 drawn) was held a third of the way up its handle, its jaw low in first person (W1 1, 2026-10-17). Holding the origin at the old grip changes every held leg (passing 3 of 3): rebuild them and judge before keeping it |
| An NPC character on a player's skeleton idles holding a gun | OPEN | Gordon's `look_idle` raises the forearms for a weapon; Barney's and the scientist's own idles hang the arms. A hands-down idle written for an NPC brief (`animate.poseOf`, arms down), the order kept. Proposed to Steven 2026-10-17, not yet approved |

## Steven's blind reviews (examples/reproduce/reviews/, from 2026-10-14)

| Item | Status | Where / what is missing |
| --- | --- | --- |
| A review page: a local server that queues judge disagreements, near-misses, a sample of passes and a decoy, shows original and copy turning side by side (as `smak view`), and takes his scores, tags and comments as data | OPEN | Agreed as the way to calibrate the judges; reviews so far go by PNG sheets and pasted notes |
| Textures softer than Valve's on every prop | PARTLY | Measured again 2026-10-15 (`research/sharpness.mjs`: local contrast in the outline both share, six views): the copies are not softer on the whole (median 1.41 times the originals' over 14 pictures legs; props 0.85 to 3.21, characters 1.41 to 2.89, weapons and players 0.84 to 1.02). The judges' "softer" (M5, every held leg) is the fine markings, lettering and stripes, which cannot be crisper than the pictures they are projected from; a sharpening pass would add to the grain that already passes theirs. Earlier: seams, grazing smear and view blending fixed (FM 6); the 256-colour cut costs nothing (measured). Missing: the last sharpness gap (headcrab 5.20 against 6.00). Not texel density: at 1024 x 1024 it is 5.08. Left: the carved surface's fit to Valve's, and the pictures' baked light lit again (RF 7) |
| Judges missed small parts (the headcrab's claws, a 7-sided cylinder for 8) | PARTLY | The prompt counts small parts; the carve reports thin pieces it lost. Missing: a measure of a round part's side count against the pictures |
| A judge charges texture to shape | DONE | Prompt: paint differences are M4 or M5 |
| Haiku makes up surface-detail faults on identical inputs | DONE | Two readings a model; controls 16 of 16 |
| Forklift: the lift shifted in the side view, the back's slopes built as blocks, a half-sphere helmet; the medkit's strap route | OPEN | Maker faults the outline warning names; the strap route still wrong in three rounds |
| Maps: Steven's walks of kaupo_v2 | DONE | First walk: hinged doors opened and closed with the use key; ways through raised to 96 and 90 over a step (the shed's ducked lintel); props of the kit's own furniture (`kit:toilet`...) with CLIP collision instead of boxes; a room under 64 by 96 that a way leads into is a fault (the closet); stairs and the floor at their foot kept clear of furniture. Second walk: every leaf painted as a panelled door with a handle in its material's tone (a pale tone keeps only the grain that fits under white), door and ladder pictures fitted to their faces, wall pictures standing on their room's floor, railings on stairs' open sides, every door toggled by use. The original maker spec now builds NOT OK on all of it. Texture choice: the kit's map pictures were flatter than nine in ten of 347 Valve walls and floors; they are now painted worn (patches, a tone a tile with lit bevels, grain), and `src/spec/look.mjs` warns of any map or wad picture, the kit's or a spec's own `.wad`'s, past Valve's 90th in brightness or colour or under their 10th in grain and patches (`research/texture-stats.mjs`). His next walk found the added grain read as static: it is now grit, the measure names noise (`structure`), and a material may take its detail from a photograph (`research/reference-textures.md`). Open: whether that is what Steven sees as better (his walk), the maker acting on the warning, a sloped handrail in place of the stepped one |
| Maps: Steven's checklist (reviews/maps-2026-10-14.json) | PARTLY | Done: the env_glow crash refused at the writers; the sweep (`smak map-sweep`: drops that hurt, lights in mid-air) in builds and the map judge; every spec lamp hung from the ceiling; furniture that floats is a fault; hinged doors stay open; `ladders` built as Valve's (func_ladder and see-through rungs). Floating solid (the sweep, checked finely for thin posts), floating glows (not the game's invisible lights), wall textures on their floor: done. Open: uneven stairs (a check by rises found nothing in frenzy_words, whose stairs are stacked furniture, and flagged a seam in Valve's: needs where Steven saw it, or treads measured too); walls meeting floors by a vertex or overhanging them (furniture set on an edge or a corner is now warned of; in frenzy_pictures they are rock left between carved rooms, over a pit, which needs a check of its own). Texture alignment on walls is done both ways: each wall's picture stands on its room's floor and starts at the room's corner (`onFloor` in `src/maps/source.mjs`; every wall's u runs positive along it, so one offset serves both) |

## The reproduction harness (examples/reproduce/, 2026-10-15)

| Item | Status | Where / what is missing |
| --- | --- | --- |
| Every kind rebuilt from its maker's spec with no agent | DONE | `rebuild.mjs` (props and maps, a map compiled with SDHLT), `assets.mjs rebuild` (sounds, sprites, textures, with the takes a leg keeps under `takes/`): sounds and sprites rebuild byte for byte |
| No game file in the repository, now or in its history | DONE | `scripts/no-game-files.mjs [--history]`: bytes, every .wad and model texture by its pixels, every sound by its samples; 3862 file versions clean |
| The asset judges given the name and the read-back (R5, S5) | DONE | `assets.mjs`; a wrong name caps them at 1 |
| A leg's run varies by about as much as a kit change moves it | OPEN | Sounds 7, 6, 5, 6, 5 of 20 and textures 1, 4, 2 of 25 over rounds of the same kit: a change wants several runs, or the judges' variance measured (Steven's call on cost) |
| Which maker | DONE for sounds and sprites | Sonnet matched Haiku (sounds 6 of 20, sprites 1 of 16, $6.31): makers stay Haiku (Steven). For characters Haiku is far behind the older Opus specs (0 of 7 against 11 to 15 of 18 rebuilt) |
| The sound judges cannot hear | OPEN | Steven's ear is the verdict (`reviews/sounds-2026-10-15.json`); his notes became the kit's noise, swell and dryness warnings. CLAP or another listening measure is item 31 |

## reference-textures.md (map pictures from photographs; grain that is not noise)

| Item | Status | Where / what is missing |
| --- | --- | --- |
| A JPEG reader: baseline and progressive, CMYK, restarts, EXIF orientation; every picture reader takes it | DONE | `src/jpeg.mjs` (within 3 of 255 of ImageMagick's decode), `unpicture` in `src/image.mjs`; `test/56-reference-textures.mjs` |
| A measure white noise cannot meet: how alike a texel's grain is to its neighbours' (`structure`), and Valve's ranges by kind | DONE | `src/spec/look.mjs` (`VALVE_KINDS`, "grain that is noise"); `research/texture-stats.mjs` |
| Procedural grain as grit, pictures sampled four times a texel, wood and iron drawn at a texel's scale | DONE | `src/spec/paint.mjs`. The softest bases stay under Valve's 10th in texel contrast and are told "little grain" (the decision in the report) |
| A material's `picture`: the valve, literal and aged filters, `rect`, `size`, `tile`; maps, .wads and the MCP build | DONE | `src/spec/reference.mjs`; docs/SPEC.md, "A material from a photograph" |
| A seam cut along the least different path (image quilting) instead of a cross-fade | OPEN | |
| A small crop's repeat hidden by quilting patches of it at random | OPEN | Seen on the sheet (`~/stignored/reference-textures/compare.png`): plaster from its photograph shows a grid |
| Metal from its photograph comes out tinted purple and green | OPEN | Same sheet; the photograph or the tone match, not yet told apart |
| Valve's scale measured: whether their features are drawn larger than an inch a texel | OPEN | |
| A model part's material from a photograph | DECLINED for now | A model's parts take pictures by `project` |
| A library of photographs for makers with no web | DONE | `generators/fetch-materials.mjs` (Poly Haven's 863 CC0 textures at 1k, 615 MB, an index of kind and real size), the MCP tool `materials` and `picture: "library:<name>"`; `test/58-materials.mjs`. In texture rounds the photo-based textures score higher on quality (T5 1.33 against 1.08) but single rounds swing (1 to 4 of 25 a leg); colour (T2) and layout (T3) are what fail next |

## character-texturing.md (a character's texture from pictures; the zombie review)

| Item | Status | Where / what is missing |
| --- | --- | --- |
| CT 1. A character's outline under 0.7 IoU against a `project` picture is a FAULT, and a check that the first frame's hands are where the pictures' are | OPEN | Today a WARN under 0.8 (`OUTLINE_FAIR`, `src/spec/model.mjs`); the zombie maker shipped at 0.26 to 0.42 with Gordon's gun-holding forearms (the "sledgehammer") |
| CT 2. `carved` on a character: the hull hung on each corner's nearest bone segment in the fitted pose | OPEN | A carved prop of the zombie scores M4 8.3 against the maker's 16.9, texturing unchanged (E2) |
| CT 3. Bone lengths in a character spec (`base.scale`), the animations' translations scaled to match | OPEN | Steven's design call: it changes the base's reach. Gordon's arm 22 against the zombie's 28.4 plus 10 to 13 of fingers |
| CT 4. View charts for `carved`, `blob` and `mesh` parts (best view, Potts, overlap split, small charts merged, packed) in place of the six-side grid | OPEN | Prototype `~/stignored/texturing-research/charts.mjs`: M4 8.3 to 7.7, no shared-texel speckle, equal to Valve's layout on the true shape (E4) |
| CT 5. Fingers as tapered tubes along the base's finger chains, thin parts painted by position along them from the pictures' centre line, sharing one strip | OPEN | Projection error on claws rises 60% at a third of a unit of misfit (E6); a carve loses them (E2) |
| CT 6. Fill of worn texels no picture sees (push-pull or nearest across the surface) | OPEN | 1.4 to 8.6% of texels (E5); same as FM 6's push-pull |
| CT 7. Generative fill for the words leg: Hunyuan3D-2 paint at full weights, StableGen-style SDXL with a reference image, as a `generate` kind giving pictures for `project` | OPEN | Turbo paint runs here but gave flat colour on the zombie (M4 16.3 to 15.2, real pictures 7.7; E7) |
| CT 8. A speckle measure beside local contrast (texels unlike all eight neighbours) | OPEN | Local contrast rewards misplaced-colour speckle (E4) |
| Silhouette warping of each picture before projecting; a VLM seam planner; xatlas tuning | DECLINED | E3: no M4 gain on the maker's shape or the true one; the layout is not the bottleneck (E4, FM 6.1) |

## map-geometry.md (maps from a sketch, a plan or screenshots; Valve's placement; staged maps)

| Item | Status | Where / what is missing |
| --- | --- | --- |
| MG 1. Harness: `alignMaps` also tries the copy where it was built; for campaign maps P2 on every standable floor (walls gone), a rubric amendment | OPEN | `examples/reproduce/judge.mjs` searches 128 about the boxes' centres only (c1a1 0.44 against 0.79 in place) and walks from the starts only (c1a2: a right copy 0.29, 0.92 on every standable floor). Needed before cXaY subjects |
| MG 2. A height plan picture: each layer of floor coloured by height and by headroom, with a printed legend; in the pictures, plans and bsp legs' inputs | OPEN | Experiment A read exactly: frenzy P2 0.898 (best leg 0.689), c1a0 0.98, c1a0d 0.945; every standable floor 0.83 to 0.94 on six maps. Heights were the legs' main loss (2D overlap 0.84 to 0.86, 3D 0.61 to 0.69) |
| MG 3. A `trace` tool: a plan picture (the kit's or a person's sketch with a legend) to a draft floor plan | OPEN | Prototype `~/stignored/map-research/trace-heightplan.mjs` (cells grown by one, merged into boxes) |
| MG 4. A floor-plan form in the map spec: cells keyed to floor and ceiling, several layers, merged into boxes; `terrain` where ground | OPEN | Columns blow the brush limit on terrain (c2a5: 57,000 brushes) |
| MG 5. The build's plan against the reference picture: pixel IoU of floor masks per layer, with the diff drawn | OPEN | `research/map-floor-diff.mjs` draws the judge's version of it |
| MG 6. Prefab wiring: rename every key whose FGD type names an entity (`LightningStart`, `m_iszEntity`, `TriggerTarget`...), turn `angle` with the prefab, `wire` parameters for names given outside it | OPEN | `prefabFromMap` in `src/spec/map.mjs` renames `NAME_KEYS` and `multi_manager` keys and turns `angles` only |
| MG 7. Point entity heights by class (items 4 to 16 over their floor, starts 36 to 64, wall lamps 8 off) and a warning outside Valve's range | OPEN | Numbers in the report, section 3.4. Snapping alone lowered the pictures leg (0.81 to 0.76) while its floors were wrong; 0.931 on right floors |
| MG 8. Brush-entity rules as checks, and a library of Valve-like wired prefabs written by the kit as `.map` files (vending machine with buttons and `env_beverage`, charger, scanner and door, breakable vent, crate stack, cabinet drawer) | OPEN | Rules in the report, section 7.1; Valve's 141 readable library prefabs listed in 3.7 |
| MG 9. Light placed as Valve's: texture-lamp faces, wall lamps 8 off the wall, brightness held to the views | OPEN | |
| MG 10. Screenshot depth (DA-V2 metric indoor small, scaled by the eye's 64) as a helper outside the kit, for heights and a room's shape | OPEN | 14 to 16 views see 24 to 30% of a map's floor; model depth 72 to 74% right indoors, 54% on frenzy |
| MG 11. VGGT for screenshots with unknown cameras; RoomFormer for photographed paper plans | OPEN | Not tried |
| Readers for Valve's sources: RMF 1.6, 1.8 and 2.2, and Hammer's prefab libraries (`.ol`) | DONE (research) | `research/rmf-read.mjs`; `old stuff.ol` not parsed. Whether the kit should read RMF (for a person's own Hammer files) is open |

## Open, by priority

Most value for least work first. Each line names its report: CF compiler-features, GR generation-research,
L3 local-3d-generators, SG sound-generation, FM 3d-fidelity-methods, IR improvements-research, DV
directed-video, PE photo-to-model-experiments, SP sprite-generation, RF repeated-failures, MF
map-reproduction-failures, LS local-sound-generators, LM local-music-generators, RT reference-textures, CT
character-texturing, MG map-geometry.

00. Maps in stages (MG): the harness's P2 fixed for campaign maps (MG 1), then the floor plan: a height plan picture, the `trace` tool, the floor-plan form and the plan measure in the report (MG 2 to 5); then prefab wiring and entity heights (MG 6, 7); then brush-entity rules and wired prefabs, light by Valve's placement (MG 8, 9); screenshot depth and VGGT last (MG 10, 11).
0. Characters from pictures: the shape before the paint. The outline fault and hand check, `carved` on a character, bone lengths (Steven's call), then view charts and fingers painted by length (CT 1 to 5); guide text for makers meanwhile.
1. Words-to-box before the cut-out (Grounding DINO or OWLv2, Apache 2.0), to pick one subject of several (FM 1, PE). (The BiRefNet switch is done.)
2. Two doc lines on SDHLT's faults (`-subdivide 512`, `%NAME`), and SPLITFACE in `SEALS_NOTHING` (CF).
3. Run `soundness` and `seeThrough` from `check` (MCP and command line) on any model (GR).
4. The calibrated texture lights by default (MF 6).
4a. Judge measurements for maps: texture match, light parity, view SSIM (MF 8).
4b. A map spec's `sprites` field; `sprite-make` from PNG frames; worked sprite and video cases (SP 2, 7; DV 5).
4c. The review page for Steven, and the map checklist from his frenzy review (the reviews section above).
4d. Texture-space matching for the identification tool (MF 7); polygon room outlines (MF 5); the views part kind is done (RF 4).
4d2. Map pictures from photographs: a seam by the least different path, a small crop's repeat hidden by quilting, Valve's scale measured (RT).
4e. The held list's open items: a weapon's per-file budgets and sides, the joint-chain skin, a monster's activities against its base, its motion from pictures (HF 3, 8, 9); room early reflections and texture statistics matching (AF 11).
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
17. Judge: prompt-only DSG questions, a non-Claude VLM, recognition without the prompt, pairwise ranking, run on the 38 cases, an agreement figure against Steven's reviews (IR 1).
18. AO and curvature bake, warm-cool light and value bands in `finish` (IR 4).
19. Sound presets from the recipe table, each scored against its class as a test (SG).
19a. The Stable Audio models in the generate worker once Steven accepts their terms (LS). (The `sample` layer and the `generate` tool are done.)
19b. The in-game tests of a mod's `media/` file and the MP3 loop gap; a mod profile's own way of music (LM). (`generate`'s music, `smak.music/1` and the map's `music` are done.)
20. Footsteps with `materials.txt`, the per-weapon role table of code-named sounds, mod profiles naming sounds (SG).
21. Loop start other than 0, loop RMS and whole-cycle checks, seam picture, LUFS (SG).
22. Sound layer kinds `sequence` and `sound` (SG).
23. (Done: the `mesh` part and `generate`'s shapes.) Next for shapes: TripoSG and Hunyuan3D-2.1 in the worker, a three-quarter picture's camera for `project` (L3, FM 5).
24. Map checks: link-to-opening match, graph connectivity before layout, lock-and-key `locked_by`, mission check (GR, IR).
25. Model checks: genus, slivers, self-intersection, centre of mass over the base, long axis of a held piece, silhouettes, texture zones (GR).
26. Model spec: `plate` kind, box `bevel`, torus, kit presets, a new body into an existing model (GR).
27. Room size presets, `corridor` links, placement of unplaced rooms (GR).
28. JSON Schema for each spec, served by `guide` (GR).
29. `compileMap({ leakOnly })`; `func_detail` level, chopdown and priority keys; hulls refused unless the profile allows (CF).
30. A tracked build-error rate over a fixed set of good and broken specs (GR).
31. Sound metrics CLAP, KAD, PAM and production quality with leave-one-out ranges; a MUSHRA page for Steven (IR 5, 7).
32. The photo benchmark: cut-outs, generators (TripoSG, Hunyuan3D-2.1, SPAR3D, 2mv), reduction, charts, texture, bake, each measured (PE, FM experiments, L3).
33. The QEM reducer's chart-locked mode, handle removal first, normals codebook (FM 2, 3, 8).
34. BVH and AO / cavity bake from a dense mesh (FM 4).
35. A prop's camera fit to a photo; MRF labels, seam levelling, symmetry fill and push-pull in `project` (FM 5, 6).
36. View-based and mirrored charts with LSCM (FM 7).
37. De-lighting (spherical harmonics, multi-view median) (FM).
38. Smooth characters: the `blob` part is built; its worth wants an Opus characters round (Steven's call); SQM mesh and heat-cut bones not tried; record the short-legs rule (IR 8).
39. Sightlines and visibility graph; expressive range of the map cases (IR 9).
40. Video later items: `--entities`, `play` recording, fades, soundtrack, APNG (DV 6).
41. Lower-ranked map spec forms: hints, currents, `invisible`, `unlit`, light fade, spots, sun spread, per-material smooth and translucent, VIS `maxDistance`, hull file, shadow colour, the remaining RAD switches (CF).
42. Hunyuan3D-2 paint after `libhipblaslt-dev`; image-driven reduction stage; LLaMA-Mesh (FM 9, 10, L3).
43. Wave Function Collapse dressing; exemplar texture synthesis (IR 10, 11).
44. JSON Patch edits; `smak play` recording audio (GR, SG).
45. Painted part shapes and built part kinds (wheel, rail, leg, strap, cut) (RF 6).
46. `project` divides out the pictures' light; a model spec `wear` layer list and the "too clean" ratios (RF 7, 8).
47. Sprites: re-measuring the game's sprites by a research script, `picture` and `shape` layers, `.spr` in `info` and `render`, fluid smoke, decals, HUD sheets (SP).
48. Map pictures: the grid on storeys and sections; per-face textures of a `.bsp`; a plan tracer; text-to-texture search (MF 2, 4, 10).
49. Kits refuse an option they do not have, in words: the firearm kit does (2026-10-17); given one, the sword, axe and bow throw an internal error and the blunt kit passes it over. Each kit lists its options and refuses others, as `firearm` does (OPTIONS in kits/firearmkit.mjs).
