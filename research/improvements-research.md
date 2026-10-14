# Improving what SMAK makes: judging, characters, textures, sounds, maps

Research for SMAK, 2026-10-14. The question from Steven: for anything we are not happy with in the results,
even where a case passed as written, find ways to do better. They need not be existing tools; a paper whose
method we can write ourselves is welcome. This file covers the five weaknesses named in the retrospective.
Mesh simplification, projecting photos onto models, cutting a subject out of a picture and image-to-3D
generators are in `research/3d-fidelity-methods.md` and are left out here.

Abbreviations, expanded once: VLM (vision-language model: a model that reads pictures and text), LLM (large
language model), CLIP (Contrastive Language-Image Pre-training, OpenAI 2021), CLAP (Contrastive Language-Audio
Pre-training), VQA (visual question answering), SDF (signed distance function: distance to a surface, negative
inside), LBS (linear blend skinning), AO (ambient occlusion), FAD (Fréchet Audio Distance), KAD (Kernel Audio
Distance), MMD (maximum mean discrepancy), MUSHRA (Multiple Stimuli with Hidden Reference and Anchor), WFC
(Wave Function Collapse), VGA (visibility graph analysis), BT (Bradley-Terry, the pairwise model behind Elo),
GPU (graphics processor), ROCm (AMD's GPU compute stack), PCG (procedural content generation).

Provenance: every paper below was looked up today (web search on arXiv, ACM, Eurographics, the authors' pages)
unless marked *(from memory, not re-checked)*. Figures marked *(secondary)* come from a summary, not the
paper.

## 1. What the results show today

The 38 cases in `examples/prompts/` score 100% on their own rubrics, all of them (a tally of the "Score:"
lines in every `prompt.md`). The ten blind runs (`blind/`) also score full marks. The same agent wrote the
prompt, the rubric, the spec and the score, and judged from its own pictures.

Two pictures make the problem concrete:

| Case | Rubric said | What the picture shows |
| --- | --- | --- |
| 36, the fat cat (`result/picture-1.png`) | 14 of 14: "a big round head", "a round body", "short thick legs, big oval feet" | A person's proportions in an orange suit: legs as long as a man's, a head narrower than the shoulders, the belly a pale disc stuck on, eyes too small to read from the front. Nobody shown it cold would say "fat cartoon cat" first |
| 09, the village square (`result/picture-2.png`) | full marks: rooms, doors, lights | Bare boxes of one plaster texture, the inn a single empty room, the light flat and over-bright with no pools of light or shadow |

Both pass every check the kit has, and both are right by the letter of the rubric. That is the gap: the
checks measure "is it there" and "is it sound", and the scorer is lenient with its own work. Sections 3 to 6
are about raising the floor of quality; section 2 is about measuring it honestly first, because without an
independent measure none of the later changes can be shown to help.

## 2. An independent judge that sees only pictures and the prompt

### 2.1 What the literature has

| Work | Year, venue | Method | What it shows for us |
| --- | --- | --- | --- |
| Wu et al., "GPT-4V(ision) is a Human-Aligned Evaluator for Text-to-3D Generation" (GPTEval3D) [arXiv 2401.04092](https://arxiv.org/abs/2401.04092) | CVPR 2024 | A VLM compares two 3D assets from multi-view renders (colour and normal maps) against stated criteria; the pairwise wins are fitted to Elo ratings | Pairwise plus Elo agrees with people better than absolute scores. Criteria in the paper: text-asset alignment, 3D plausibility, texture-geometry coherence, geometry details, texture details *(from memory of the paper; the search summary confirms pairwise, criteria and Elo)* |
| Zhang et al., 3DGen-Bench [arXiv 2503.21745](https://arxiv.org/abs/2503.21745) | 2025 | An arena of human pairwise votes on 3D outputs; a CLIP-based scorer (3DGen-Score) and an MLLM evaluator trained on them | Human pairwise votes are the ground truth to calibrate against |
| Duggal et al., Eval3D [arXiv 2504.18509](https://arxiv.org/abs/2504.18509), [code](https://github.com/eval3d/eval3d-codebase) | CVPR 2025 | Several foundation models used as probes; where they disagree across views marks a flaw. Interpretable, per-pixel | Disagreement between independent probes is a usable signal, better than one opaque score |
| Cho et al., Davidsonian Scene Graph (DSG) [arXiv 2310.18235](https://arxiv.org/abs/2310.18235) | ICLR 2024 | From the prompt alone, write atomic yes/no questions in a dependency graph (no question about a hat's colour if there is no hat); a VQA model answers each | Exactly a rubric written by someone who never saw the spec, mechanically |
| Lin et al., VQAScore [arXiv 2404.01291](https://arxiv.org/abs/2404.01291), `t2v_metrics` on PyPI | ECCV 2024 | Score = probability the VLM answers "Yes" to "Does this figure show '{text}'?" | Beats CLIPScore on compositional prompts; the paper reports it works on 3D renders too |
| Hessel et al., CLIPScore [arXiv 2104.08718](https://arxiv.org/abs/2104.08718) | EMNLP 2021 | `2.5 * max(cos(E_img, E_text), 0)` *(the 2.5 weight from memory)* | Cheap, but a bag of words: it cannot tell "a cat in a hat" from "a hat on a cat" (VQAScore paper) |
| Lee et al., Prometheus-Vision [arXiv 2401.06591](https://arxiv.org/abs/2401.06591) | ACL Findings 2024 | An open VLM trained to grade against a user-written score rubric (15K rubrics) | Rubric-grounded grading is a known, trainable task; open weights exist |
| Chen et al., MLLM-as-a-Judge [arXiv 2402.04788](https://arxiv.org/abs/2402.04788) | ICML 2024 | Benchmarks VLM judges on scoring, pairwise and batch ranking | Pairwise agrees with people well; absolute scores and batch ranking much less; judges show bias and hallucination even at GPT-4V level |
| Zheng et al., MT-Bench and Chatbot Arena [arXiv 2306.05685](https://arxiv.org/abs/2306.05685) | NeurIPS 2023 | Names position bias (prefers the first or second answer), verbosity bias, self-enhancement bias | The standard fix for position bias: ask both orders, count a win only when both agree |
| Panickssery, Bowman, Feng, "LLM Evaluators Recognize and Favor Their Own Generations" [arXiv 2404.13076](https://arxiv.org/abs/2404.13076) | NeurIPS 2024 | Self-recognition correlates linearly with self-preference | Shown on text summaries. For pictures of a model built from a spec it is an extrapolation, but the safe design is a judge from another model family |

### 2.2 The judge for SMAK

Inputs: the prompt's quoted words (the `>` block of `prompt.md`, nothing else) and the pictures in
`result/` (and `blind/result/`). Never the spec, the report, the rubric, or the iterations. A judge that
reads "a big round head" in the spec would see one.

Steps:

1. **Questions from the prompt alone (DSG).** A judge model in a fresh context turns the prompt into atomic
   yes/no questions with dependencies and a must flag. For case 36: "Is the figure a cat?", "Is the head
   wider than the shoulders?", "Are the legs short compared with the body?" (depends on "are there legs"),
   "Are the eyes large?", "Is there a cream belly?". The questions are written once, committed beside the
   case (`judge/questions.json`), and reused, so that every later build is held to the same questions.
2. **Answers per picture set (VQAScore).** Each question is asked of the pictures, with "answer yes or no".
   With a local model the answer is `p(yes) = softmax(logit_yes, logit_no)` from the first token's log
   probabilities; with a hosted model, a yes/no with a one-line reason before the answer. A case's score is
   the mean of `p(yes)`, with every must at 0.5 or more for a pass.
3. **Recognition without the prompt.** Show the six views alone and ask "what is this, in five words?". Then
   ask a text model whether that caption names the thing the prompt asked for. The fat cat must be called a
   cat by someone who was not told it is one. This is the cheapest strong signal of all.
4. **Pairwise for quality (GPTEval3D).** "Which of these two is the better *fat cartoon cat player model*?",
   on the criteria above plus "silhouette reads at a distance", asked in both orders; a win counts only when
   both orders agree, otherwise a tie. Opponents: the previous version (pictures from git history), the
   blind run, and a deliberately worse version (below). Wins are fitted by Bradley-Terry: `P(i beats j) =
   1 / (1 + 10^((R_j - R_i)/400))`, maximum likelihood over all pairs, which is Elo without order effects.
5. **Controls that catch leniency.** Every run includes:
   - a blank grey picture set: every question must come back "no" (`p(yes)` under 0.1);
   - another case's pictures (the barrel under the cat's questions): must fail;
   - a damaged copy (a part removed: the cat without its tail, the square without its inn's door): the
     question about that part must drop.
   The share of controls passed is the judge's own score. A judge that says yes to a grey square is not
   used.
6. **Calibration against Steven, once.** He answers about 100 of the questions by eye (yes/no, a few seconds
   each, a small page or a CSV). Report Cohen's kappa (agreement beyond chance, `κ = (p_o - p_e)/(1 - p_e)`)
   for the judge against him and for the building agent's own scores against him, and the leniency gap
   (mean judge or self score minus his). Target κ of 0.6 or more for the judge.

Which model: one from another family than the builder (the builder is Claude). Choices:

| Judge | Where | Licence | Cost here |
| --- | --- | --- | --- |
| Qwen2.5-VL-7B-Instruct ([report arXiv 2502.13923](https://arxiv.org/abs/2502.13923)) | local, llama.cpp (`llama-server` with `--mmproj`, [docs](https://github.com/ggml-org/llama.cpp/blob/master/docs/multimodal.md)) | Apache 2.0 for 7B *(secondary; check the model card)* | A Q8 GGUF is about 8 GB plus the vision encoder: fits the 16 GB card. Gives log probabilities, so true VQAScore. Seconds a question |
| Qwen3-VL (2B to 235B, GGUFs from Qwen on Hugging Face) | local | check the card | Newer; the small ones fit easily, the large ones do not |
| Prometheus-Vision ([code](https://github.com/kaistAI/prometheus-vision)) | local, PyTorch | check the repo | A 7B or 13B LLaVA base; built for rubric grading. PyTorch on ROCm: AMD lists gfx1201 (the RX 9070 XT) for recent ROCm and PyTorch builds ([AMD install page](https://rocm.docs.amd.com/projects/ai-ecosystem/en/latest/frameworks/pytorch/install.html)) |
| A hosted non-Claude VLM | API | terms of service | Pennies a case; needs a key and sends pictures out (they are the kit's own pictures, not the game's, except where a case renders game textures: keep those local) |
| OpenCLIP ViT-L/14 as a recognition sanity check | local, CPU is enough | MIT code, weights per card | Zero-shot: classify each view among the 38 case titles; top-1 accuracy over cases |

**Verdict: do this first.** It is a script (`examples/prompts/judge.mjs`, a Python helper or llama-server for
the model) and changes nothing in the kit. First experiment: questions and answers for cases 19 to 21 and 36
(the characters) and 09, 29, 33 (maps), plus the controls. Metric: judge κ against Steven on 100 questions,
and the self-score's leniency gap. My prediction, to be tested: the cat fails "head wider than shoulders" and
"short legs", and the village square fails questions about furnishing.

## 3. Characters: smooth organic bodies on the player's skeleton

### 3.1 Why they look as they do

Characters are unions of separate closed parts (spheres, cylinders, turns, tubes), each hung on one bone and
sunk into its neighbours so nothing opens in motion. Where two parts meet there is a crease line of
intersection, not a fillet: the jaw "intersects instead of attaching". Each part is its own picture patch, so
colour cannot flow across a join. Feet are boxes or turned ovals because those are the primitives. And the
proportions come from Gordon's skeleton as it stands: limbs are spanned joint to joint, so a "short thick
leg" is as long as Gordon's thigh plus shin whatever the spec says.

### 3.2 Methods

| Method | Paper | What it does | Fit for SMAK |
| --- | --- | --- | --- |
| Blobby / metaball surfaces | Blinn 1982, ACM TOG *(from memory, not re-checked)* | A field summed from Gaussian blobs; the surface is a level set. Joins blend smoothly | Blends, but bulges where blobs overlap; hard to control size exactly |
| Convolution surfaces | Bloomenthal and Shoemake, SIGGRAPH 1991 ([SIGGRAPH archive](https://history.siggraph.org/?p=120593)) | The field is a kernel convolved along skeleton segments and polygons; segments joined end to end give no bulge at the joint | The natural match: our skeleton *is* segments. Closed forms exist for line segments with some kernels (later work, e.g. McCormack and Sherstyuk, [PDF](https://users.monash.edu/~jonmc/research/Papers/CONVOLUT.PDF)) |
| SDF with smooth union | Inigo Quilez, "smooth minimum" (iquilezles.org/articles/smin; the page returned 404 today, formulas from memory of it) | Each part is an exact SDF (sphere, capsule, ellipsoid, rounded cone); two are joined by a smooth minimum that fillets the join over a width `k` | The simplest and most controllable. Size is exact away from joins; `k` per join says "blend jaw into head by 1.5 units" |
| B-Mesh | Ji, Liu and Wang, Computer Graphics Forum 29(7) 2010, [EG library](https://diglib.eg.org/handle/10.2312/CGF.v29i7pp2169-2177) | A skeleton with balls at its nodes is swept into a quad mesh: tubes along bones, joined at branch nodes; then subdivided and "evolved" (moved onto a smooth implicit surface) | Gives a low-poly mesh with edge loops round each limb, which is what an animator would make. Blender's Skin modifier is based on it, without the evolution step ([commit note](https://miikahweb.com/fi/blender/git-logs/commit/8801330c18b063e341e8263131c91695cd1b7bdf)); an open implementation exists ([CorentinDumery/BMesh](https://github.com/CorentinDumery/BMesh)) |
| SQM, skeleton to quad-dominant mesh | Bærentzen, Misztal and Wełnicka, Computers & Graphics 36(5) 2012, [project](https://people.compute.dtu.dk/janba/Research_in_Graphics/SQM.html) | For each branch node a polyhedron from the sphere there; branches bridged with quad tubes; the result is a polar quad mesh following the skeleton | Same family as B-Mesh, more robust at branches (pelvis, chest with arms and neck) |
| Sphere-meshes | Thiery, Guy, Boubekeur, SIGGRAPH Asia 2013, [PDF](https://www.telecom-paristech.fr/~boubek/papers/SphereMeshes/SphereMeshes.pdf) | A shape as the convex hulls of spheres along edges and triangles of a tiny mesh | A good *description* language for a spec: a "limb" is two spheres and the hull between them (a rounded cone). Its SDF is cheap |
| Teddy | Igarashi, Matsuoka and Tanaka, SIGGRAPH 1999, [PDF](https://www-ui.is.s.u-tokyo.ac.jp/~takeo/papers/siggraph99.pdf) | Inflate a 2D outline: wide parts fat, narrow parts thin, via the chordal axis | Useful for flat-ish parts from an outline (an ear, a foot seen from above, a hand); not for the whole body |
| Pinocchio | Baran and Popović, SIGGRAPH 2007, [PDF](https://people.csail.mit.edu/ibaran/papers/2007-SIGGRAPH-Pinocchio.pdf) | Embeds a given skeleton in a mesh; skins by "bone heat" | We already have the skeleton in place; the skinning half is what we need |
| RigNet | Xu et al., SIGGRAPH 2020, [arXiv 2005.00559](https://arxiv.org/abs/2005.00559) | A network predicts skeleton and weights | Not needed: our skeleton is given, and the heat method is enough. GPU and training data for little gain |

Meshing an implicit surface: marching cubes (Lorensen and Cline 1987), surface nets (Gibson 1998) and dual
contouring (Ju et al. 2002) *(all from memory, not re-checked)* give dense, unstructured triangles that then
need cutting down (the other research file's subject). For a 2048-point body the better route is the other
way round: start from a low-poly quad mesh with good loops (B-Mesh, SQM) and *project* its points onto the
smooth implicit surface. That is B-Mesh's evolution step, and it keeps the point count fixed.

### 3.3 Core equations

Smooth minimum, quadratic, with `k` the blend width in units (Quilez's normalised form; from memory):

```
h = max(k - |a - b|, 0) / k
smin(a, b, k) = min(a, b) - h * h * k / 4
blend factor for colour: m = h * h * 0.5, taken towards whichever of a, b is smaller
```

The cubic form (`h^3 * k / 6`) is smoother at the edge of the blend. The blend factor lets a texel's
colour mix the two parts' materials across the fillet: the jaw's cream fades into the head's orange instead
of meeting at a line.

Projection of a mesh point `p` onto the surface `f(p) = 0`: a few Newton steps `p <- p - f(p) * ∇f(p) /
|∇f(p)|^2`, with the gradient by central differences (6 evaluations of `f`). Then a few steps of Laplacian
smoothing tangent to the surface, re-projected, to even out the quads.

Bone heat (Pinocchio section on skin attachment, checked in the paper today): for each bone `i`, solve on the
surface mesh

```
(-Δ + H) w_i = H p_i
```

where `Δ` is the cotangent Laplacian of the mesh, `p_i(j) = 1` if bone `i` is the bone nearest vertex `j`
(and visible from it), else 0, and `H` is diagonal with `H_jj = c / d(j)^2`, `d(j)` the distance from vertex
`j` to that nearest bone (`c` about 1 in the paper, *from memory*). One sparse solve per bone, one matrix for
all.

**GoldSrc gives each vertex one bone.** So the weights are cut, not blended: each vertex takes the bone of
largest `w_i`. The heat method still matters, because "largest heat weight" follows the body's shape (the
armpit goes to the chest, not the upper arm) where "nearest bone segment" does not. And the cut should fall on
an edge loop: B-Mesh and SQM make a loop at each joint, so the whole ring goes to one bone and the triangles
of the next band stretch across the joint. The game's own player models are built this way. A second loop
close to each joint (a "joint band") makes the stretch even; the existing "come apart in a run, a walk, a
crouch, a jump" check stays the test.

### 3.4 What it means for the spec

A character could keep its parts as now and gain a `smooth` body:

```json
{ "id": "body", "kind": "blob", "material": "fur",
  "of": [ { "bones": ["Bip01 Spine", "Bip01 Spine2"], "radius": [16, 13], "oval": 1.2 },
          { "bones": ["Bip01 Neck", "Bip01 Head"], "radius": [9, 13] },
          { "bone": "Bip01 Head", "at": [2, 4, 0], "ellipsoid": [6, 5, 4], "material": "cream", "blend": 2 } ],
  "blend": 3, "budget": 1400 }
```

Each item is a rounded cone (two radii on two joints) or an ellipsoid; `blend` is `k`; the kit builds the SQM
mesh over the bones named, subdivides once, projects onto the smooth union, cuts bones by heat, and paints
each texel by the blend factor of the item it came from. Eyes are an ellipsoid each with a `fullbright`
material, left as separate parts (they should read as set in, not blended). Feet stop being boxes: a foot is
an ellipsoid on the foot bone blended into the shin.

Proportions: a spec that says "short legs" on Gordon's skeleton cannot get them by geometry alone, since the
bones are where they are. Two honest options: say so in the report (the rubric then cannot pass "short legs"),
or let a character lower the hips by building the leg's surface shorter than the bones and accepting that the
knee bends where the bone does. Flag this to Steven; it is a design choice, not a fix.

### 3.5 Cost and verdict

All of it is CPU arithmetic in Node: an SDF of 20 items evaluated at ~3000 points with 10 Newton steps and 6
evaluations each is under 2 million item evaluations, milliseconds. The cotangent Laplacian solve for 42
bones on 2000 vertices is a sparse system; conjugate gradients in Node, well under a second. No GPU, no
licence questions (all methods are published; the code would be ours).

**Verdict: worth it, medium work.** First experiment: the cat's head, jaw (muzzle) and neck only, as one
`blob` of three items, meshed by an SQM-style sweep, projected, cut by heat. Metrics: no open edges and the
existing apart-in-motion check (must stay clean); the number of crease edges over 60 degrees inside the head
(should fall to near zero); the point count against the old head; and the judge's question "does the muzzle
look attached to the head?" with a pairwise old-against-new.

## 4. Textures

### 4.1 Where the kit is

`src/spec/finish.mjs` paints `light` (up-facing lighter), `wear` (creases over 65 degrees, noise-broken),
`grime` (within 2 units of another part, and near the floor) and `vary` (per-part lightness). Materials are
procedural colours. `src/image.mjs` turns each picture into 256 colours by **median cut in RGB**, counting
colours at 6 bits a channel, each palette entry the pixel-weighted mean of its box, each pixel the nearest
entry in RGB.

### 4.2 Methods

| Method | Paper | Core of it | Fit |
| --- | --- | --- | --- |
| Non-parametric sampling | Efros and Leung, ICCV 1999 ([page](https://people.eecs.berkeley.edu/~efros/research/EfrosLeung.html)) *(venue from memory)* | Grow the output a pixel at a time: find exemplar neighbourhoods close (Gaussian-weighted SSD) to the pixel's known neighbours; pick among those within `(1 + ε)` of the best | Slow, beautiful; the basis of the rest |
| Tree-structured vector quantisation | Wei and Levoy, SIGGRAPH 2000 ([page](https://graphics.stanford.edu/papers/texture-synthesis-sig00/)) *(from memory)* | Same, scan order and a causal neighbourhood, multi-resolution, nearest neighbour sped up by a tree | Fast enough for 256x256 in Node |
| Image quilting | Efros and Freeman, SIGGRAPH 2001 ([PDF](https://people.csail.mit.edu/billf/papers/efrosFreeman.pdf)) | Lay square patches with overlap; choose each patch whose overlap error is low; cut the overlap along the minimum-error seam by dynamic programming: `E(i,j) = e(i,j) + min(E(i-1,j-1), E(i-1,j), E(i-1,j+1))` | Simple, fast, makes tileable swatches. Recommended for any exemplar work |
| PatchMatch | Barnes, Shechtman, Finkelstein, Goldman, SIGGRAPH 2009 ([page](https://gfx.cs.princeton.edu/pubs/Barnes_2009_PAR/)) *(from memory)* | Approximate nearest-neighbour field by random init, propagation from neighbours, random search at shrinking radii | The engine inside texture optimisation |
| Texture optimisation | Kwatra, Essa, Bobick, Kwatra, SIGGRAPH 2005 ([project](https://sites.cc.gatech.edu/gvu/perception/projects/textureoptimization)) | Energy `E = Σ_p min_q ||x_p - z_q||²` over overlapping neighbourhoods; alternate (M) find nearest exemplar patch for each, (E) set each pixel to the mean of the patches covering it; coarse to fine | With extra guide channels (material id, AO, curvature) it becomes "paint by numbers": the style of an exemplar placed by our own labels |
| Appearance-space synthesis | Lefebvre and Hoppe, SIGGRAPH 2006 ([project](https://www.hhoppe.com/proj/apptexsyn/)) | Synthesise in a PCA-reduced space of colour plus features (distance to edges, etc.) | The idea of adding feature channels to the exemplar; heavy for us |
| Warm-cool shading | Gooch et al., SIGGRAPH 1998 ([PDF](https://users.cs.northwestern.edu/~bgooch/PDFs/gooch98.pdf)) | Shade by hue as well as value: `t = (1 + n·l)/2`, colour `= t * warm + (1 - t) * cool`, where warm and cool are the base colour pushed towards yellow and blue (the paper's own sign convention differs; formula as given in [course notes](https://userpages.cs.umbc.edu/olano/class/435-04-2/npr.pdf)) | Exactly the painter's trick that late-1990s textures use: shadows go cooler and more saturated, lights warmer. Our `light` only changes value |
| Ambient occlusion / obscurance bake | Zhukov, Iones, Kronin 1998; Landis 2002 *(from memory, not re-checked)* | For each texel's surface point, the share of a cosine-weighted hemisphere of rays that escape within distance `d` | Replaces the `grime` contact heuristic with real occlusion: under the chin, the armpits, between legs, inside a mug |
| Curvature | Meyer, Desbrun, Schröder, Barr 2003 *(from memory)* | Mean curvature from the cotangent Laplacian: `H n = Δp / 2` per vertex | Convex edges wear lighter, concave crevices darker, on smooth bodies too, not just at 65-degree creases |

Palette quantisation:

| Method | Source | Core | Note |
| --- | --- | --- | --- |
| Median cut | Heckbert, SIGGRAPH 1982 *(from memory)* | What the kit does | Fast; boxes in RGB, splits by pixel count, not by error |
| Octree | Gervautz and Purgathofer 1988 *(from memory)* | Merge leaves of a colour octree | No better than median cut in quality |
| Wu's quantiser | Wu, Graphics Gems II 1991, pp. 126 to 133 ([record](https://experts.mcmaster.ca/scholarly-works/1909038)) | Greedy splits of RGB that minimise variance, using cumulative moment tables | The abstract claims a third of median cut's mean squared error *(secondary: abstract only)* |
| k-means refinement | Lloyd iteration, any text | Seed with median cut or Wu; repeat: assign each colour to its nearest centre, move each centre to the weighted mean | Never worse than its seed in mean error; 5 to 10 rounds |
| OKLab | Ottosson 2020 ([post](https://bottosson.github.io/posts/oklab/); [overview](https://en.wikipedia.org/wiki/Oklab_color_space)) | Linear sRGB to LMS (a 3x3 matrix), cube root, a second 3x3 matrix to L, a, b | Euclidean distance in OKLab is close to perceived difference; RGB distance over-weights green-blue and under-weights dark shades |
| libimagequant (pngquant) | [licensing](https://pngquant.org/licensing.html) | Modified median cut plus refinement *(algorithm from memory)* | GPL v3 or commercial: do not vendor; it is a benchmark to compare against, run outside the kit |
| Floyd-Steinberg dithering | Floyd and Steinberg 1976 *(from memory)* | Push each pixel's error to its neighbours 7/16, 3/16, 5/16, 1/16 | On a texture that the game magnifies and filters, dither turns into noise; on 256 colours of one material there is little to gain. Ordered or no dither, except in smooth gradients |

### 4.3 What to change, in order

1. **Quantise in OKLab and refine.** Keep median cut as the seed, run it on OKLab coordinates, then 8 rounds
   of weighted k-means in OKLab; assign pixels to the nearest centre in OKLab. Cost: 65,536 pixels of a
   256x256 picture against 256 centres is 17 million distances a round, about a second in Node for 8 rounds;
   less with the 6-bit colour counting the kit already does. Metric: mean and 95th-percentile OKLab
   difference between the full-colour picture and its 256-colour version, over every texture of the 38
   cases; and banding, counted as steps in a smooth gradient test card.
2. **Bake AO and curvature into the finish.** A per-texel hemisphere of 32 rays against a bounding-volume
   tree of the model's triangles (2,000 to 10,000 triangles): 65,536 texels x 32 rays is 2 million rays, a few
   seconds in Node. Use it as a new `occlusion` amount and to drive `grime` where the AO is low, instead of
   the 2-unit contact rule. Curvature drives `wear` on smooth parts. For a character, bake in the pose the
   game shows most (frame 0 of the idle), as the kit already paints.
3. **Warm-cool light and value bands.** Change `light` from a value change to a hue shift (cooler and a
   little more saturated in shadow, warmer in light), and optionally group values into 3 to 5 soft bands per
   material (posterise, then blur by a texel): the "hand-painted" look of the period is mostly broad value
   shapes with hue shifts, not noise. These are a few lines each in `finish.mjs`.
4. **Exemplar-based swatches, later.** Image quilting in Node to turn an exemplar into a tileable material
   swatch, then the finish over it. Exemplars must be the kit's own or CC0 (ambientCG and Poly Haven publish
   CC0 *(from memory: check each site's licence page)*), never the game's (rule 7). With guide channels
   (material, AO, curvature) Kwatra's optimisation transfers a painted style onto our layout. Big work;
   wait for the judge to show textures are the weakest axis.

**Verdict:** 1 is small work, certain gain, measurable without eyes. 2 and 3 are small to medium work and
are the largest visible gain for characters (the cat's belly and limbs would read as forms). 4 is
large work for an uncertain gain at 256x256. First experiment: 1 on every texture of the 38 cases, metric as
above; then 2 and 3 on case 36 and case 03, judged pairwise old-against-new by the judge of section 2.

## 5. Sounds

### 5.1 Where the kit is

`src/audio/classes.mjs` holds the measured features of one to four of Half-Life's files per class (23
classes); a made sound scores 2, 1 or 0 for each feature inside, near or outside the range widened by fixed
margins. That measures likeness to very few examples, on hand-picked features, and nothing of quality: a
sound can sit in every range and still sound synthetic (a pure modal ping with noise on top).

### 5.2 Methods

| Method | Paper | Core | Fit |
| --- | --- | --- | --- |
| FAD | Kilgour et al., Interspeech 2019, [arXiv 1812.08466](https://arxiv.org/abs/1812.08466) | Embed every clip (originally VGGish), fit a Gaussian to each set, `FAD = ||μ_r - μ_g||² + tr(Σ_r + Σ_g - 2(Σ_r Σ_g)^{1/2})` | Needs many clips per set; biased at small sizes |
| FAD∞ and per-clip FAD | Gui et al., ICASSP 2024, [arXiv 2311.01616](https://arxiv.org/abs/2311.01616), [fadtk](https://pypi.org/project/fadtk/) (MIT) | Extrapolate FAD to infinite sample size; per-song FAD finds outliers; choice of embedding matters | The per-clip form is what a one-sound-at-a-time kit needs |
| KAD | Chung et al., ICML 2025 workshop, [arXiv 2502.15602](https://arxiv.org/abs/2502.15602), [kadtk](https://github.com/YoonjinXD/kadtk) | Unbiased MMD with a Gaussian kernel: `MMD² = mean k(x,x') + mean k(y,y') - 2 mean k(x,y)`, the first two over distinct pairs only | Converges with few samples (authors' claim), which is our case: a class has 1 to 4 game files |
| CLAP | Wu et al. (LAION-CLAP), ICASSP 2023, [arXiv 2211.06687](https://arxiv.org/abs/2211.06687); checkpoints Apache 2.0 on Hugging Face | Audio and text in one embedding space | "Does this sound like *a metal wrench hitting metal*?" as a cosine; also a general audio embedding for KAD |
| PAM | Deshmukh et al., Interspeech 2024, [arXiv 2402.00282](https://arxiv.org/abs/2402.00282) | CLAP score of the audio against two opposed prompts ("clear, high quality" against "noisy, with artefacts"), softmaxed | A no-reference quality number. One prompt alone did not correlate with people; the opposed pair did |
| Audiobox Aesthetics | Tjandra et al. (Meta), 2025, [arXiv 2502.05139](https://arxiv.org/abs/2502.05139), [repo](https://github.com/facebookresearch/audiobox-aesthetics) | Predicts production quality, production complexity, content enjoyment, content usefulness, trained on about 97,000 rated clips including sound effects *(secondary)* | "Production quality" is the closest thing to "does it sound professionally made". Licence of weights: check the repo (CC BY 4.0 per a third-party listing) |
| Modal synthesis from geometry | van den Doel, Kry and Pai, "FoleyAutomatic", SIGGRAPH 2001, [PDF](https://www.cs.mcgill.ca/~kry/pubs/foleyautomatic/foleyautomatic.pdf); O'Brien, Shen, Gatchalian, SCA 2002 | An object rings as a bank of damped sines `y(t) = Σ a_n e^{-d_n t} sin(2π f_n t)`; frequencies and dampings from shape and material, gains from where it is struck. O'Brien et al. get the modes of any mesh from an eigenproblem | We have the shape. The kit's `modes` layer already takes ratios; the geometry could set `f` |
| Contact models | Hunt and Crossley 1975; Avanzini and Rocchesso, DAFx 2001 *(both from memory)* | Contact force `F = k x^α + λ x^α ẋ` for compression `x`: harder contact, shorter pulse, brighter excitation | Hardness as a number rather than a guessed noise click |
| Procedural sound design | Farnell, *Designing Sound*, MIT Press 2010; Cook, *Real Sound Synthesis*, 2002 | Already the basis of `research/sound-generation.md` | Footsteps there: a ground reaction force curve (heel, roll, ball) driving a surface texture (gravel as particles, concrete as short noise, metal as modes) |
| MUSHRA | ITU-R BS.1534-3 (2015, [ITU text](https://www.itu.int/rec/R-REC-BS.1534)), [webMUSHRA](https://www.audiolabs-erlangen.de/resources/webMUSHRA) | Listener rates several versions 0 to 100 against an open reference, with the reference hidden among them and low-pass anchors (3.5 kHz and 7 kHz) | Adapted for one listener, below |

### 5.3 What to change

1. **A wider reference, kept as numbers.** Measure every file under the game's `valve/sound` (a few
   thousand) into CLAP embeddings on Steven's machine. Commit only per-class statistics, as
   `classes.mjs` already commits feature numbers; never the audio (rule 7). Whether embedding statistics of
   the game's files may go in the repository is Steven's call; flagged. Then per made sound: KAD to its class
   (embedding MMD against all of the class's files), CLAP text score for the class's words, PAM, and
   Audiobox production quality. Report these beside the feature ranges, not instead of them: the ranges say
   *which way to go* in words, which an embedding distance cannot.
2. **Calibrate the numbers against the game's own.** Run the same metrics on the game's files themselves,
   held out one at a time (leave-one-out KAD, CLAP, PAM, PQ). That gives the range a real game sound gets.
   A made sound is "as good as the game's" when it falls inside that range; this is the bar, and it costs
   nothing to compute.
3. **Modal frequencies from the part.** For a part that is a bar (a wrench, a pipe, a crowbar), the free-free
   Euler-Bernoulli beam gives `f_n = (β_n L)² / (2π L²) * sqrt(E I / (ρ A))`, with `β_n L` = 4.730, 7.853,
   10.996 (ratios 1, 2.76, 5.40, the `bar` ratios). Worked: a steel bar 30 cm long and 1 cm thick (`E` 200
   GPa, `ρ` 7850 kg/m³, a rectangular section so `I/A = h²/12`) gives `sqrt(E h² / (12 ρ)) = 14.6 m/s`
   and `f_1 = 22.37 * 14.6 / (2π * 0.09) ≈ 576 Hz`, close to the 760 Hz the spec example guesses. A
   `"from": "part:head"` on a `modes` layer, with the material's E and ρ, would set `f` from the model's own
   size. For other shapes, a tetrahedral mesh and a sparse eigen-solve (O'Brien et al.) in a Python pre-step
   (scipy) is possible, but a bar, a plate and a shell cover most weapons.
4. **A listening test for one.** A page (webMUSHRA, or a small page of our own) per class: the game's file
   as the open reference and again hidden, a 3.5 kHz low-passed copy as the anchor, and 3 to 5 made variants.
   Steven rates 0 to 100; ten minutes a class. Rules for one listener: the hidden reference must score 90 or
   more and the anchor under 40, or that trial is discarded; randomise order every time; repeat a trial a day
   later to measure his own consistency. Over time these ratings are the ground truth that tells which of
   KAD, CLAP, PAM or PQ to trust.

Cost: CLAP and Audiobox Aesthetics run on CPU at a few clips a second *(estimate)*; the GPU helps but is not
needed. A few thousand game files once, then seconds per made sound.

**Verdict:** 2 and 1 are small to medium work (a Python pre-step and a JSON of statistics) and turn
"likeness to 2 files" into "inside the range of the game's own sounds on four independent measures". 3 is
small work and makes struck sounds follow the model. 4 is small work and the only thing that measures
quality; it needs Steven's ears for an hour. First experiment: case 38's six sounds plus the game's crowbar
files under leave-one-out KAD, CLAP and PAM; metric: whether each made sound sits inside the game's own
leave-one-out range, and whether the ranking agrees with a MUSHRA session by Steven on the same six.

## 6. Maps

### 6.1 Where the kit is

Maps are checked for leaks, reach on foot (with jumps), entities in solid, openings' sizes, one-way places,
and light on the floor (`lightReport`: dark under 24 of 255, dim under 0.6 of the middling room). Nothing
measures the layout's interest, the sightlines, how full a room is, or how the light is composed.

### 6.2 Methods

| Method | Paper | Core | Fit |
| --- | --- | --- | --- |
| Missions and spaces by graph grammar | Dormans, PCG workshop 2010, [PDF](https://www.pcgworkshop.com/archive/dormans2010adventures.pdf); Dormans and Bakkes, IEEE TCIAIG 2011 | A mission graph (tasks, locks, keys) rewritten by graph rules, then turned into space by shape rules | SMAK's map spec is already a graph the agent writes. The useful part is the *mission* layer: "the key opens the gate", "the loop back to the start". As a check, not a generator |
| Wave Function Collapse | Gumin 2016 ([repo](https://github.com/mxgmn/WaveFunctionCollapse)); Karth and Smith, FDG 2017 (DOI 10.1145/3102071.3110566) | Constraint solving over tiles with adjacency rules; collapse the cell of least entropy, propagate | Not for layout (the agent says the layout); for dressing: wall trim, pillars, window rhythm, floor tiling, clutter along walls, from a few tile prefabs |
| Isovists and visibility graphs | Benedikt 1979 *(from memory)*; Turner, Doxa, O'Sullivan, Penn, Environment and Planning B 28(1) 2001, [UCL](https://discovery.ucl.ac.uk/id/eprint/160/) | A grid of standing points; join each pair that can see each other; per point: isovist area, connectivity (how many points it sees), mean depth and integration (how few visual steps to everywhere) | Sightlines, hiding places, rooms that reveal themselves all at once, the visual "centre" of a map |
| Space syntax on the room graph | Hillier and Hanson 1984 *(from memory)* | Mean depth `MD` from each room; relative asymmetry `RA = 2(MD - 1)/(k - 2)` for `k` rooms; low RA is integrated | One number per room; deep rooms are private, shallow are through-ways |
| FPS design patterns | Hullett and Whitehead, FDG 2010 (pp. 78 to 85) | Named patterns (arena, choke point, sniper location, gallery, stronghold...) with their gameplay effects | A vocabulary to detect by geometry: a choke point is a cut vertex of the walk graph; a sniper location is a high point with long sightlines over open floor |
| Generic level evaluation | Liapis, Yannakakis, Togelius, AIIDE 2013, [AAAI](https://ojs.aaai.org/index.php/AIIDE/article/view/12680) | Area control, exploration and balance as formulas over a level's graph | Exploration (how much of the map a flood fill from a start must cover before reaching the goal) carries over to a single-player HL map directly |
| Evolving FPS maps | Cardamone, Yannakakis, Togelius, Lanzi, EvoApplications 2011 | Fitness from bot fighting time in Cube 2 | Bot playtests; our `play` command could in principle do this, but bots are a big project. Note only |
| Expressive range | Smith and Whitehead, PCG workshop 2010 *(secondary: described in [arXiv 2504.05334](https://arxiv.org/abs/2504.05334))* | Plot every generated level on two metrics (linearity, leniency) to see what the generator tends to make | Across the 38 cases: are all our maps the same shape (boxes in a row)? |
| Lighting by a perceptual objective | Shacked and Lischinski, Eurographics 2001, [PDF](https://pages.cs.huji.ac.il/danix-lab/cglab/research/ldesign/Shacked-eg2001.pdf) | Quality of an image as a weighted sum of six terms (checked in the paper today): shading gradients `f_grad`, visible edges `f_edge`, luminance variance `f_var` and mean `f_mean` against targets, histogram spread `f_hist`, light direction `f_dir` | Each term computes from one of our views and the map's geometry. Over-bright flat views (case 09) fail `f_mean`, `f_var` and `f_grad` |
| Lighting for attention | Seif El-Nasr et al., ELE and ALVA, 2004 to 2011 ([PDF](https://summit.sfu.ca/_flysystem/fedora/sfu_migrate/596/SeifEl-Nasr_IntelligentLighting.pdf)) | Light set so that the goal, exits and threats stand out by contrast, with visibility and depth kept | Turns into a check: is the way on lit brighter than the room around it? |

### 6.3 What to measure in SMAK

All from data the kit has (the walk grid of `reachOf`, the room graph of the spec, `lightReport`, the
views), in Node:

| Measure | How | Says |
| --- | --- | --- |
| Loops | `E - V + C` of the walk graph of rooms (independent cycles) | 0 is a corridor of rooms; a map with no loop is a museum walk |
| Dead ends | share of rooms of degree 1 that hold nothing (no entity, no item) | Rooms to cut or to fill |
| Choke points | articulation points (cut vertices) of the walk graph, by Tarjan's algorithm; betweenness of each opening | Every way between two halves; good on purpose, bad by accident |
| Depth | mean depth and RA per room from the start | Where the "deep" places are; does the goal sit deep? |
| Sightlines | for each walk cell at eye height (64 over the floor), rays every 5 degrees to the first solid (the kit's `contentsAt` and trace), isovist area and longest sightline | Sniper lanes, rooms seen whole from the door, places with no view |
| Visual integration | VGA on cells 32 apart: connectivity, then mean visual depth | The map's visual centre; a square that is not its centre is a layout fault |
| Fill | per room: share of floor covered by props and brush detail, props per 10,000 square units, count of distinct textures | Case 09's inn: one table in a big room |
| Light rhythm | per room: floor light mean, its spread inside the room (max/min), contrast between neighbours; is each doorway on the way on lit more than the room's mean | Flat light everywhere is no composition; ELE's attention test |
| Picture quality | Shacked's six terms on each view from `map-views`; the share of clipped pixels | Over-bright, washed out, no shading |
| VLM judge | section 2, with a level-design question set: "is there a clear focal point?", "does the room look lived in?", "can you tell where to go next?" | The parts no number catches |

Thresholds should come from the game's own maps, not from taste: run every measure on the stock Half-Life
maps on Steven's machine (`valve/maps`, read and measured, never copied), keep the per-measure ranges as
numbers, and hold made maps against them as the sound classes are held against the game's sounds.

### 6.4 Cost and verdict

The graph measures are milliseconds. The isovist rays: a map of 5,000 walk cells x 72 rays is 360,000
traces; at a few microseconds each in the kit's BSP trace, about a second. Full VGA (every pair of cells,
5,000² / 2 = 12.5 million line-of-sight tests) is tens of seconds to minutes in Node; do it on a 64-unit
grid or only within rooms and their neighbours. The light measures read lightmaps the kit already reads.

**Verdict:** the graph measures (loops, dead ends, choke points, depth), fill and light rhythm are small work
and directly name what is weak in cases 09, 29 to 35. Sightlines and VGA are medium work. WFC dressing is
medium to large work and only worth it after the measures show bare walls are the main weakness. Graph
grammars as generators are not needed (the agent writes the graph); as a check of the mission (a lock has
its key before it, the goal is not in a dead end off the start) they are small work. First experiment:
compute loops, dead ends, choke points, fill and light rhythm for the 20 map cases and for 10 stock
Half-Life maps; metric: how many of ours fall outside the game's range on each, and whether the judge's
pairwise preference follows the same measures.

## 7. Priorities

Biggest gain for least work first. "Work" is a rough size: small is a day or less, medium a few days, large
a week or more.

| # | What | Work | Gain | Section |
| --- | --- | --- | --- | --- |
| 1 | An independent judge: prompt-only questions (DSG), VQA answers, recognition without the prompt, controls, calibration against Steven on 100 answers | small to medium | Every later change can be shown to help; ends 100%-by-default scoring | 2.2 |
| 2 | Quantise in OKLab with k-means refinement | small | Certain, measurable colour fidelity on every texture | 4.3 (1) |
| 3 | Map measures: loops, dead ends, choke points, fill, light rhythm, held against stock maps | small | Names what is weak in every map case | 6.3 |
| 4 | AO and curvature bakes; warm-cool light; value bands | small to medium | Largest visible gain for characters and props | 4.3 (2, 3) |
| 5 | Sound metrics: CLAP, KAD, PAM, production quality against leave-one-out ranges of the game's own | small to medium | Sounds judged against the game's own spread, not two files | 5.3 (1, 2) |
| 6 | Modal frequencies from the part's size and material | small | Hits that follow the model | 5.3 (3) |
| 7 | One-listener MUSHRA page | small (plus an hour of Steven) | The only real quality measure for sound | 5.3 (4) |
| 8 | Smooth characters: SDF smooth union, SQM-style mesh, projection, heat-cut bones | medium | Fixes the jaw, the feet, the stuck-on belly; organic forms | 3.4 |
| 9 | Sightlines and visibility graph | medium | Sniper lanes, reveals, the map's visual centre | 6.3 |
| 10 | WFC dressing of walls and floors | medium to large | Rooms that look built, not boxed | 6.2 |
| 11 | Exemplar texture synthesis with guide channels | large | Uncertain at 256x256 | 4.3 (4) |
| 12 | Bot playtests for flow | large | Out of scope for now | 6.2 |

## 8. What I could not verify

- Inigo Quilez's smooth-minimum page returned 404 at both addresses tried; the formulas in 3.3 are from
  memory of that article and should be checked against it or a copy before use.
- Several classic papers are cited from memory without re-checking the text today: Blinn 1982, marching
  cubes, surface nets, dual contouring, Efros and Leung 1999, Wei and Levoy 2000, PatchMatch 2009, Heckbert
  1982, Gervautz and Purgathofer 1988, Floyd-Steinberg 1976, Zhukov 1998, Landis 2002, Meyer et al. 2003,
  Hunt and Crossley 1975, Avanzini and Rocchesso 2001, Benedikt 1979, Hillier and Hanson 1984. They are
  marked where cited.
- GPTEval3D's five criteria are from memory of the paper; the search confirmed the pairwise, criteria and
  Elo design only.
- Self-preference (Panickssery et al.) was shown on text. That a VLM judge prefers pictures of its own
  family's builds is an extrapolation; the design avoids the question by using another family.
- Licences of Qwen2.5-VL 3B and 72B, Audiobox Aesthetics' weights and RigNet's code were not confirmed from
  the primary page. Qwen2.5-VL-7B is Apache 2.0 by a secondary source.
- ROCm support for the RX 9070 XT (gfx1201) is listed on AMD's pages for recent ROCm and PyTorch builds; I
  did not run anything on this machine. llama.cpp's Vulkan back end is a fallback if ROCm wheels misbehave.
- Run times are estimates from operation counts, not measured.
- Whether CLAP statistics of the game's sound files, or measure ranges of its maps, may be committed is a
  rule-7 question for Steven. The kit already commits feature numbers of the game's sounds; embeddings are
  the same kind of thing, but it is his call.
- How GoldSrc filters 8-bit textures on load (it expands them to RGBA for OpenGL, so dither patterns are
  blurred under linear filtering) is from memory of the engine, not checked against its code.

## Sources

Section 2: [arXiv 2401.04092](https://arxiv.org/abs/2401.04092), [arXiv 2503.21745](https://arxiv.org/abs/2503.21745),
[arXiv 2506.18787](https://arxiv.org/abs/2506.18787) (3D Arena), [arXiv 2504.18509](https://arxiv.org/abs/2504.18509),
[arXiv 2310.18235](https://arxiv.org/abs/2310.18235), [arXiv 2404.01291](https://arxiv.org/abs/2404.01291),
[arXiv 2104.08718](https://arxiv.org/abs/2104.08718), [arXiv 2401.06591](https://arxiv.org/abs/2401.06591),
[arXiv 2402.04788](https://arxiv.org/abs/2402.04788), [arXiv 2306.05685](https://arxiv.org/abs/2306.05685),
[arXiv 2404.13076](https://arxiv.org/abs/2404.13076), [arXiv 2502.13923](https://arxiv.org/abs/2502.13923),
[llama.cpp multimodal docs](https://github.com/ggml-org/llama.cpp/blob/master/docs/multimodal.md),
[AMD PyTorch for ROCm](https://rocm.docs.amd.com/projects/ai-ecosystem/en/latest/frameworks/pytorch/install.html).

Section 3: [B-Mesh](https://diglib.eg.org/handle/10.2312/CGF.v29i7pp2169-2177), [SQM](https://people.compute.dtu.dk/janba/Research_in_Graphics/SQM.html),
[Sphere-meshes](https://www.telecom-paristech.fr/~boubek/papers/SphereMeshes/SphereMeshes.pdf),
[Convolution surfaces](https://history.siggraph.org/?p=120593), [Teddy](https://www-ui.is.s.u-tokyo.ac.jp/~takeo/papers/siggraph99.pdf),
[Pinocchio](https://people.csail.mit.edu/ibaran/papers/2007-SIGGRAPH-Pinocchio.pdf), [RigNet](https://arxiv.org/abs/2005.00559),
[Instant Meshes](https://rgl.epfl.ch/publications/Jakob2015Instant) (quad remeshing, an alternative to SQM for an existing mesh).

Section 4: [Image quilting](https://people.csail.mit.edu/billf/papers/efrosFreeman.pdf), [Texture optimisation](https://sites.cc.gatech.edu/gvu/perception/projects/textureoptimization),
[Appearance-space synthesis](https://www.hhoppe.com/proj/apptexsyn/), [Gooch 1998](https://users.cs.northwestern.edu/~bgooch/PDFs/gooch98.pdf),
[Wu 1991](https://experts.mcmaster.ca/scholarly-works/1909038), [OKLab](https://en.wikipedia.org/wiki/Oklab_color_space),
[pngquant licensing](https://pngquant.org/licensing.html).

Section 5: [FAD](https://arxiv.org/abs/1812.08466), [FAD∞, fadtk](https://arxiv.org/abs/2311.01616), [KAD](https://arxiv.org/abs/2502.15602),
[kadtk](https://github.com/YoonjinXD/kadtk), [LAION-CLAP](https://arxiv.org/abs/2211.06687), [PAM](https://arxiv.org/abs/2402.00282),
[Audiobox Aesthetics](https://arxiv.org/abs/2502.05139), [FoleyAutomatic](https://www.cs.mcgill.ca/~kry/pubs/foleyautomatic/foleyautomatic.pdf),
[O'Brien et al. 2002](https://escholarship.org/uc/item/41k3f19n), [MUSHRA overview](https://en.wikipedia.org/wiki/MUSHRA),
[webMUSHRA](https://www.audiolabs-erlangen.de/resources/webMUSHRA).

Section 6: [Dormans 2010](https://www.pcgworkshop.com/archive/dormans2010adventures.pdf), [Dormans and Bakkes 2011](https://research-portal.uu.nl/en/publications/generating-missions-and-spaces-for-adaptable-play-experiences/),
[Karth and Smith 2017](https://escholarship.org/uc/item/3rm1w0mn), [Turner et al. 2001](https://discovery.ucl.ac.uk/id/eprint/160/),
[Liapis et al. 2013](https://ojs.aaai.org/index.php/AIIDE/article/view/12680), [search-based PCG survey (on Cardamone et al.)](https://arxiv.org/abs/2311.04710),
[Hullett dissertation](https://eis.ucsc.edu/papers/khullett-fdg-doccon-camera-ready.pdf), [Shacked and Lischinski 2001](https://pages.cs.huji.ac.il/danix-lab/cglab/research/ldesign/Shacked-eg2001.pdf),
[Seif El-Nasr, intelligent lighting](https://summit.sfu.ca/_flysystem/fedora/sfu_migrate/596/SeifEl-Nasr_IntelligentLighting.pdf).
