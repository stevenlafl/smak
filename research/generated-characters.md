# A brief character from the local shape generator, against primitives

Experiment, 2026-10-16/17. The question: brief characters built from primitive parts (boxes, superquadrics,
blobs) are picked out of a line-up beside Half-Life's own people. Does a character made through the kit's local
shape generator (SD-Turbo draws it from words, BiRefNet cuts it out, Hunyuan3D-2mini makes the mesh), put on a
game skeleton as a `mesh` part and painted by `project` from the generated cut-out, look closer to Valve's?

Subject: the "barney" brief of `examples/reproduce/briefs.json` (a security guard, blue shirt, blue-violet
trousers, helmet with visor, black vest, holster, about 75 tall), on the base the harness's brief build used
(`player/gordon/gordon.mdl`, `"floor": 0`).

No kit source changed. Everything made is under `research/out/generated-characters/` (gitignored by `out/`).

## Result in short

| | Primitive brief build (harness) | Generated mesh (this run, `a_s1_v2`) |
| --- | --- | --- |
| Triangles (body) | 694 | 700 (Valve's barney body 709; Gordon base body 362, cap 724) |
| `check goldsrc` | clean | clean |
| Build report | OK | OK, no faults, no warnings |
| Line-up test, 4 Haiku readings, "which was not made by Valve" | picked 4 of 4 (told apart) | picked 2 of 4 (passes: the harness calls 3 or more told apart) |
| First frame, front and three-quarter | blocky toy: a box vest, a cap, slab boots | reads as a person in a uniform: face, vest pouches, knee pads, boots |
| Back | as built | plain blue material, the helmet's back fused into the shoulders like a hood |
| In motion (run) | holds | tears: shards and webs between hands, thighs and torso |

Verdict: **for a still picture, yes, clearly.** In the line-up the generated guard sits with the gman and the
scientist, where the primitive build stood out as a toy at every reading. **As a character that moves, not yet.**
The generated body fuses arms to torso and hands to thighs, so with each corner on its nearest bone the run
tears visibly, and the back is untextured. A maker could not fix either through a spec. So it beats primitives
on the line-up (M6) and loses on motion (C1). It is worth pursuing only if the arm-and-torso fusing gets solved
(see "What the kit or the guidance would need").

Two readings of four is a small sample: chance alone picks ours one reading in four, so 2 of 4 is
"sometimes caught", against the primitive's "always".

## What ran

Scripts, all rerunnable, in `research/generated-characters/`:

| Script | Does |
| --- | --- |
| `generate.mjs <work> <name> <seeds> "<prompt>"` | calls `mcp/generate.mjs` `generate()` with `openFolders` and `openGenerators`, exactly as the MCP server does (`--generators /media/Data3/Packages/local-audio`, whose `hunyuan3d-mini` entry points at `../local-3d`); writes the takes, their pictures and cut-outs, and the tool's contact sheet `<work>/gen/<name>-takes.png` |
| `build.mjs <spec.json> <out>` | `buildModelSpec(spec, { folder: <spec's folder>, games: [valve] })`, prints every ERROR/FAULT/WARN/NOTE/FACT to `report.txt`, `check goldsrc`, writes the `.mdl`, `sheet.png` (seq 0), `run.png` (run2 from the side, 8 frames, with the ground line), `lineup.png` (gman, scientist, hassassin, ours, one camera, yaw 35 pitch 20, first frame, as `brief.mjs` `lineupOf` draws it), and `lineup-with-primitive.png` (the same five wide with the harness's primitive build) |
| `detect.mjs <mdl> <out> [label]` | the brief leg's line-up test (`brief.mjs` `detect`): 4 shuffled line-ups, each put to a fresh judge (`runAgent`, Haiku) "which one was not made by Valve?" |
| `specs/*.json` | the specs built (copied into the work folder, since their `work:` names resolve against the spec's folder) |

Commands, from the kit's folder (W = `research/out/generated-characters/work`):

```
node research/generated-characters/generate.mjs $W guard_a 0,1 "a security guard man standing straight, full body from head to boots, front view, arms down at his sides, blue uniform shirt, blue-violet trousers, dark blue helmet with a visor, black bulletproof vest, pistol holster on his belt, black boots"
node research/generated-characters/generate.mjs $W guard_b 2,3 "full body photo of a security guard standing, front view, arms hanging down, light blue short-sleeve uniform shirt, blue trousers, blue police helmet, black bulletproof vest, pistol in a holster on his belt, black shoes"
node research/generated-characters/generate.mjs $W guard_c 4,5 "a security guard man standing straight, full body from helmet to boots, feet visible, front view, empty hands, arms held a little away from his body, blue uniform shirt, blue-violet trousers, dark blue helmet with a visor, black bulletproof vest, pistol holster on his belt, black boots"
node research/generated-characters/generate.mjs $W guard_d 6,7 "a security guard man in an A-pose, arms stretched out diagonally down away from his body, full body from helmet to boots, front view, blue uniform shirt, blue-violet trousers, dark blue helmet with a visor, black bulletproof vest, holster on his belt, black boots"
cp research/generated-characters/specs/guard_a_s1*.json $W/
node research/generated-characters/build.mjs $W/guard_a_s1.json     research/out/generated-characters/a_s1_v1
node research/generated-characters/build.mjs $W/guard_a_s1_aim.json research/out/generated-characters/a_s1_v2
node research/generated-characters/build.mjs $W/guard_a_s1_sym.json research/out/generated-characters/a_s1_v3
O=$PWD/research/out/generated-characters    # absolute: the judge reads only the folder it is given
node research/generated-characters/detect.mjs $O/a_s1_v2/barney_gen.mdl $O/detect-generated generated
node research/generated-characters/detect.mjs $PWD/examples/reproduce/held/characters/barney/brief/built/barney.mdl $O/detect-primitive primitive
```

One generation ran at a time; builds and judges ran on the CPU only.

## Times and memory

| Step | Time |
| --- | --- |
| Hunyuan3D-2mini worker load (with SD-Turbo and BiRefNet on first use) | 80 to 123 s |
| A take (picture, cut-out, 30 steps, reduced to 20,000 triangles) | 28 to 88 s |
| A call of 2 seeds, load included | 168 to 302 s |
| `buildModelSpec` of the mesh character | 3.2 to 5.4 s |
| Line-up test, 4 Haiku readings | about a minute |

The worker's peak RSS, sampled every 2 s during `guard_d`, was **18.7 GB**, with about 17 to 18 GB available on
the machine at the time (swap already full). It ran, but there is no headroom: a game, or a second heavy job,
would push it into the OOM killer. Generators/README.md does not mention this figure for the worker.

## The takes

Eight takes over four wordings (the brief asked for 2 to 4; the later ones tried to get a pose the rig handles
better). The pictures are `work/gen/guard_*-takes.png`.

| Take | Picture | Mesh | Usable |
| --- | --- | --- | --- |
| guard_a s0 | a man cut off at the head, a spare shirt on a hanger, a rifle on his shoulder | three objects fused | no |
| **guard_a s1** | the whole man, front view, blue helmet, black vest, knee pads, a pistol in his right hand | clean, one piece, feet and helmet whole | **yes: the one built** |
| guard_b s2 | cut off at the knees, a logo in the corner | no feet | no |
| guard_b s3 | holding a rifle across the chest | rifle fused to the arms | no |
| guard_c s4 | dark uniform, holding a rifle | rifle fused | no |
| guard_c s5 | peaked cap, not a helmet; hand on the belt | clean | second best |
| guard_d s6 | kneeling, one arm out | wrong stance | no |
| guard_d s7 | holding a rifle | rifle fused | no |

SD-Turbo ignores pose words: "empty hands", "arms held a little away from his body" and "A-pose" gave a gun
in hand or a kneel. A guard prompt pulls in a gun 5 times in 8. The worker's fixed style suffix says
"three-quarter view", yet every take was drawn straight on, which suits `project`. That is luck, not control.

## The builds

All three from `guard_a_s1.obj` (19,996 triangles reduced to 700), `size: [17.6, 31.5, 75]` (its own
proportions 0.23 : 0.42 : 1, so no stretch warning), material `uniform` (cloth, blue), `smooth: 80`, `project`
the cut-out as `front`.

| Build | Pose | Report | What the pictures show |
| --- | --- | --- | --- |
| v1 | `"fit": true` | OK. Outline 0.845 to 0.889 fitted; keys Spine1 y 15, R Leg y -24, L Leg1 y 21, R Arm1 y -39 x 12 | Fit from one front view chose forward and back swings it cannot see. The run tears at the legs |
| **v2** | `aim`: arms out 12, bend 10; legs out 5 | **OK, no warnings** | Front and three-quarter good. In the run, hands and forearms drag webs off the thighs |
| v3 | as v2, `symmetric: true` | OK, 2 warnings: outline 0.797 (under 0.8); 10% of triangles stretch past 3 times in run2 (Pelvis + R Leg, R Leg + R Leg1, **R Finger12 + R Leg**, L Leg + L Leg1) | Mirroring took the pistol off but still tears; worse fit |

No FAULT or ERROR was met in any build, and `check goldsrc` was clean each time. Triangles: 700 against Valve's
barney body at 709 (scientist 465, gman 576, hassassin 1510), and the cap of twice Gordon's 362.

Pictures to look at:

- `research/out/generated-characters/a_s1_v2/sheet.png`: six views. The front and three-quarter are
  convincing. The back is the plain material. The side shows the helmet's back merged into the shoulders.
- `research/out/generated-characters/a_s1_v2/run.png` and `run9.png` (run2 frame 9, close): the tearing.
- `research/out/generated-characters/a_s1_v2/lineup.png`: gman, scientist, hassassin, ours.
- `research/out/generated-characters/a_s1_v2/lineup-with-primitive.png`: the same three, the primitive build
  and the generated one side by side.
- The primitive's own: `examples/reproduce/held/characters/barney/judge/brief/lineup.png` (column D).

### The line-up, honestly

Beside the gman and the scientist, the generated guard reads as a person of the same family. The primitive's
box vest and slab boots never did. What still sets it apart: its blue is far more saturated than anything in
Valve's palette, its texture is a photograph with photographic contrast (Valve's are photo-sourced too but
flatter and duller), and its silhouette is a little lumpy where the cut-out's edge shows. Haiku caught it 2
readings in 4 (the readings it missed, it picked the scientist and the hassassin). It caught the primitive 4 in
4, run on the same script and the same three Valve models as a control.

The line-up shows only the first frame from the front-left. A judge shown the back (sides.png) or the run
(motion.png) would see the hood and the tears at once.

## Findings for the kit and the MCP guidance

1. **A generated body with arms against the torso tears in motion, and nothing in a spec separates them.** The
   `mesh` part rigs each corner to the nearest limb, which is right, but the generated mesh (and more so after
   reduction to 700) has triangles bridging hand to thigh and forearm to torso. A `carved` part has `clip`; a
   `mesh` has nothing like it. A maker would need a way to cut a mesh's triangles that span far-apart bones (an
   "unweld across limbs" step: drop or split triangles whose corners land on bones not adjacent in the
   skeleton, such as `R Finger12 + R Leg`), or a generator picture in an A-pose, which SD-Turbo will not draw.
2. **The tear warning missed v2.** The check warns past 8% of triangles stretched 3 times. v1 and v2 tear
   visibly in every run frame yet stay under it; v3 hit 10%. A finer test would flag triangles whose corners sit
   on bones that are not parent and child (hand and thigh) at any share, since those always tear.
3. **Only the front is painted.** One picture means the back keeps the material and the generator's guess of
   the back (a helmet fused into a hood). A second, consistent view (Hunyuan3D-2mv takes several; or an
   image model that draws a turnaround) would be needed. A spec cannot mirror the front onto the back.
4. **`pose: { fit: true }` from a front view alone picks swings it cannot see** (forward and back). With one
   front picture the guidance should say to use `aim` (arms out, legs out) instead, or `fit` should try only
   sideways swings when every view is front or back.
5. **The worker cannot be steered on view or pose.** Its style suffix is fixed to "three-quarter view, single
   object", and SD-Turbo drops pose words. A `view` or character mode for the shape tool (front, full body,
   arms apart, no props) and a stronger image model would raise the share of usable takes above 1 in 8.
6. **Colour.** The projected photograph is far more saturated than Half-Life's people. A finish or project
   option to pull a projection toward the game's muted palette (desaturate and lower contrast) would close
   most of the remaining gap in the line-up. The memory's "GoldSrc aesthetic" note says the same.
7. **Memory.** The shape worker peaks near 19 GB RSS. generators/README.md gives load and take times but not
   this; it should say so, so the server can warn when a game is running.
8. **The guidance a maker gets** (the tool's answer text, SPEC.md's `mesh` row) says to pick the take "whose
   shape is right" and look at every side. For a character it should add: reject takes holding anything; prefer
   arms clear of the body; build with `aim`, not `fit`; draw the run before anything else, since a clean first
   frame says nothing about tearing.

Side note, not part of this question: `brief.mjs` `detect` asks its one-letter question through `runJudge`,
which retries until the answer holds a JSON object (`/\{[\s\S]*\}/`). A one-letter reply never does, so by the
code every reading runs three times with a minute between, and none is cached (read from the code, not timed). `detect.mjs` here calls
`runAgent` directly. Worth checking in the harness.

## What a maker could do on its own, before the follow-up

Through MCP alone: `generate { kind: "shape", prompt, seeds }`, pick the take from the contact sheet, write the
spec above, build, look. All of it works, and the first frame comes out well. What it cannot do is stop the
arms tearing or paint the back. The result would pass the line-up and fail a motion judge.

## Follow-up, 2026-10-17: the route made to work (Steven chose it)

Scripts added: `tear.mjs <mdl>` (the share of triangles past three times an edge in the runs and walks, as the
build measures, and the pairs of bones they join), `rig-plot.mjs <mdl> <png>` (each triangle in its bone's colour
from the front, the skeleton over it), `colour.mjs <mdl ...>` (mean saturation, luma and its spread over the
texels a body wears), `guide.mjs` (a base's guide picture as `generate` draws it), `guided-spec.mjs` (the spec a
maker would write for a guided take), and `../valve-character-colour.mjs` (the same colour numbers over the
line-up's 13 creatures and people: people 0.11 to 0.33 in saturation, creatures to 0.66).

**What tore.** The rig plot of the old v2 build showed it: the guard's hands hang beside its thighs and its
forearms lie on its trunk, and the base's arm bones (Gordon's, at Gordon's proportions) do not run down the
middle of the mesh's arms, so a hand's corners took the thigh's bone. 52 of its 700 triangles tore (7.4%), 65 joined
bones four or more joints apart across the trunk. Three repairs on that mesh failed and were left out:

| Tried | Torn | What went wrong |
| --- | --- | --- |
| Cut triangles across far limbs after rigging, the holes capped side by side | 4.5% | the forearm, two triangles wide at 700, was all across: the arm went with the cut; see-through 0.6% (a fault over 0.2%) |
| The same cut on the file's 20,000 triangles before reducing | 7.2% | nearest-limb labels at full detail are wrong where the bones miss the limbs: the chest's sides cut; see-through 2.2% |
| `pose.fit: "shape"` (the base fitted to the mesh's own outlines, front and side) | 6.0% | outlines' overlap 0.67 to 0.737, but turning bones cannot give Gordon's arms the mesh's length |

**What worked: draw the take in the base's stance.** `generate` with `base` draws the base as a grey figure on
white, arms 30 degrees out and legs 6 apart (`GENERATED_STANCE`), and SD-Turbo draws the take over it image to
image (strength 0.7). Four seeds of the old prompt: all four stood in that stance with empty hands (against one
usable take in eight from words alone); two came out seen from behind (the grey figure does not say which way it
faces). The worker peaked at 19.6 GB. Seed 3 (a helmet, a vest of pouches), built on Gordon in the same stance
with `bind`, at 700 triangles:

| | v2 (words alone) | guided, seed 3 |
| --- | --- | --- |
| Torn in the runs and walks | 7.4% (52) | 2.4% (17) |
| The run strip | webs from hands to thighs every frame | clean |
| Warned of: triangles across far limbs | 54 | 27 (the armpits) |
| Saturation (Gordon 0.32) | 0.43 as projected, pulled to 0.31 | 0.29, nothing to pull |
| Back | plain material, then carried from the front | carried from the front (the back of the head a blur of the face) |
| Line-up, 4 Haiku readings | picked 2 of 4 | picked 1 of 4 (chance) |

The kit's part, each through MCP alone: `generate { kind: "shape", prompt, base }`; the spec's `"pose": { "aim":
<the stance>, "bind": true }` (bind writes the base's own first animation back, so it stands as the base stands
and not with its arms held out); the projection carrying a character's front round to its back; its pictures
pulled to its base's palette; the warning of triangles across far limbs. Left: a guide that says which way the
figure faces (two seeds of four drew its back); the back of the head (carried from the face, a blur); a judged
brief round of the characters on this route.

## What a maker can do on its own now

`generate { kind: "shape", prompt, base: "player/gordon/gordon.mdl", seeds: 4 }`, pick a take seen from the front
with clear arms, and build the spec its answer gives (`guided-spec.mjs` writes one). Look at the run strip.
