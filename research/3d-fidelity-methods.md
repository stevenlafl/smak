# From a photo or a prompt to a GoldSrc prop that keeps its look: methods review

Literature and methods review, 2026-10-14, with a few measurements on this machine. Builds on
`research/local-3d-generators.md` (Hunyuan3D-2mini and Shap-E run locally, quadric reduction, first numbers);
nothing said there is repeated here.

The pipeline under study: a person's text or real photo becomes a dense mesh from a local image-to-3D model
(about 300k triangles), which must come down to a GoldSrc studio model: about 1000 to 3000 triangles, at most
2048 points and 2048 normals a submodel, an 8-bit palette texture (256 colours) up to 512x512, no normal or
specular maps, soft flat lighting, so form has to be painted into the colour texture.

Abbreviations, at first use and here: QEM (quadric error metric), UV (texture coordinates), MRF (Markov random
field), AO (ambient occlusion), SDF (signed distance function), DiT (diffusion transformer), VRAM (video
memory), PBR (physically based rendering: base colour, roughness, metal maps), SfM (structure from motion),
MVS (multi-view stereo), IoU (intersection over union), PSNR (peak signal-to-noise ratio), SSIM (structural
similarity), LPIPS (learned perceptual image patch similarity), FLIP (NVIDIA's perceptual image difference),
LSCM (least squares conformal maps), ABF (angle-based flattening), BFF (boundary first flattening), VSA
(variational shape approximation), ICM (iterated conditional modes), CMA-ES (covariance matrix adaptation
evolution strategy), PnP (perspective-n-point), ONNX (open neural network exchange format), HIP (AMD's CUDA-like
GPU language), AGPL / GPL (GNU Affero / General Public Licence), NC (non-commercial).

Provenance marks: **[read]** = I opened the primary source (paper page, repository file or licence text) in
this session; **[known]** = a classic paper cited from my own knowledge, not reopened (venue and DOI believed
right, check before citing outward); **[secondary]** = a figure from a third-party page; **[measured]** = run
on this machine today. Scripts for the measurements are in `/media/Data3/Packages/local-3d/scripts/`
(`charts_*.py`), next to the earlier experiment's.

## Result in short

| Question | Answer |
| --- | --- |
| Cut faces without losing fidelity | Staged QEM is the right core; add (1) removal of the generator's tiny handles before reducing (the car has **genus 32** [measured]: 32 tunnels kept by topology-preserving collapse), (2) a normals codebook so 1500+ triangles fit the 2048-normal limit, (3) feature and silhouette weights. Learned retopology (MeshAnything V2, BPT, DeepMesh) is CUDA-bound and mostly non-commercial: not now. |
| Keep detail with no normal maps | Bake the dense mesh into the low mesh's colour texture: AO, cavity/curvature, and lighting from the dense normals under GoldSrc's own light direction. All plain ray casting; fits SMAK in Node. |
| Photos as the texture | Find each photo's camera by silhouette alignment (render, compare to the mask, optimise 7 numbers), project with a visibility test, choose one photo per face with an MRF and level the seams (Lempitsky and Ivanov 2007; Waechter et al. 2014), fill the unseen by mirror symmetry, then push-pull inpainting. Implementable in Node over SMAK's renderer. |
| UV fragmentation (Steven's follow-up) | xatlas options barely move it: 185 charts at default, 172 to 214 across option sets [measured]. The cause is the mesh, not the options: a quarter of the low car's edges fold over 60 degrees, and the handles force cuts. View-based charting (a face goes to the view that sees it, Potts smoothing, small charts merged) gets 83 to 96 charts [measured]; better still is charting from the photos themselves. |
| Subject isolation | Box from words with Grounding DINO or OWLv2 (Apache 2.0), mask from the box with SAM 2 (Apache 2.0), edge from BiRefNet (MIT). Avoid Ultralytics models (AGPL, YOLO26 and YOLOE included) and BRIA RMBG-2.0 (non-commercial), **which rembg now uses by default and which the earlier experiment used without noticing** [measured: `weights/u2net/models/bria-rmbg/bria-rmbg.onnx`, 1.0 GB]. |
| Newer generators on this card | Worth trying: TripoSG (MIT, 8 GB, one CUDA import to stub), Hunyuan3D-2.1 shape (10 GB, same pure-PyTorch shape path as 2mini), SPAR3D (10.5 GB, has CPU baker). Out of reach: TRELLIS.2 and Pixal3D (24 GB NVIDIA, CUDA stack), SAM 3D Objects (32 GB NVIDIA), Step1X-3D with texture (27 GB), Direct3D-S2 (torchsparse). Hunyuan3D 2.5 and 3.0 have no open weights. |
| Hunyuan3D-2's texture stage on ROCm | Closer than thought: its rasteriser hipifies cleanly, and the build stops only on a missing header package, `libhipblaslt-dev` [measured]. Its de-lighting model is plain diffusers and should run as it is. |

## 1. Simplification that keeps appearance

### 1.1 QEM and its attribute extensions

**Garland and Heckbert 1997**, "Surface Simplification Using Quadric Error Metrics", SIGGRAPH 97,
doi:10.1145/258734.258849 **[known]**.

- Each face's plane `n·x + d = 0` gives a quadric `K_p = p pᵀ` with `p = [a b c d]`. A vertex's quadric
  `Q_v = Σ area_f · K_f` over its faces. The error of putting a vertex at `v̄ = [x y z 1]` is `v̄ᵀ Q v̄`, the sum
  of squared distances to the planes.
- Contracting edge (i, j): `Q = Q_i + Q_j`; the optimal point solves `∂(v̄ᵀ Q v̄)/∂v = 0`, a 3x3 linear system
  (upper-left block of Q against the negated last column); if singular, take the best of the ends and the
  midpoint. Cost = `v̄ᵀ Q v̄`.
- Keep all candidate edges in a min-heap by cost; pop, contract, recompute neighbours' costs. Reject a collapse
  that flips a neighbour face's normal (dot of old and new normal under some threshold, typically 0) or
  breaks the link condition (the two ends share more than two neighbours: the collapse would make a
  non-manifold edge).
- Boundary edges get a perpendicular "penalty plane" quadric with a large weight, so open borders stay.

**Garland and Heckbert 1998**, "Simplifying Surfaces with Color and Texture using Quadric Error Metrics",
IEEE Visualization 98, doi:10.1109/VISUAL.1998.745312 **[known]**. Each vertex is a point in `R^(3+m)`
(position plus m attributes: colour, UV), and each face defines an affine 2-plane in that space; the quadric
measures squared distance to it, as an `(m+4)×(m+4)` matrix. Attributes then fall out of the same linear
solve.

**Hoppe 1999**, "New Quadric Metric for Simplifying Meshes with Appearance Attributes", IEEE Visualization 99,
doi:10.1109/VISUAL.1999.809869 **[known]**. Keeps the geometric error purely geometric and adds, per attribute,
the squared deviation of the attribute from its linear field over the face, giving a smaller, sparser matrix and
attribute errors that do not distort the geometry. This is the form modern libraries use; meshoptimizer's
`simplifyWithAttributes` exposes per-attribute weights in the same spirit **[read: js/README.md]** (whether it
follows Hoppe exactly is not checked).

**Feature and silhouette variants worth borrowing.**
- Discrete curvature-weighted quadrics (Kim, Kim and Kim 2002, Pacific Graphics, "Discrete differential
  error metric") and a dihedral-angle penalty on creases **[known]**: protects body edges of a car.
- Structure-aware decimation (Salinas, Lafarge and Alliez 2015, Computer Graphics Forum, "Structure-Aware Mesh
  Decimation") adds quadrics of detected planes, so planar proxies survive **[known]**.
- Silhouette preservation: weight each face's quadric by how often it is on a silhouette over a set of views
  (or by `1 - |n·view|` summed over views); cheap to precompute, matches GoldSrc's game where outline is what
  reads at distance. Lindstrom and Turk 2000 (below) measure it directly instead.
- Staged collapse (halving per pass, as the earlier experiment did) is not in the literature as such; it acts
  like a crude multi-resolution schedule. The measured gain (mean 0.24 to 0.18 units, non-manifold edges 28 to 0)
  is real but the topology it preserves includes the generator's noise (section 6.1).

**Appearance-preserving simplification**, Cohen, Olano and Manocha 1998, SIGGRAPH 98,
doi:10.1145/280814.280832 **[known]**. Decouple appearance from geometry: store the dense mesh's normals (and
colours) in a texture over a parameterisation that is kept consistent through simplification, and bound the
texture deviation (how far a texel's 3D point moves) in 3D, converted to screen pixels. For GoldSrc there are
no normal maps, so the method's lesson is the second half: measure error as texture deviation, and bake the
dense mesh's appearance into the texture of the low one (1.4).

**Image-driven simplification**, Lindstrom and Turk 2000, ACM Transactions on Graphics 19(3),
doi:10.1145/353981.353995 **[known]**.
- Render the current mesh from about 20 viewpoints on a sphere (they used 20 to 24, luminance only), keep the
  images. For each candidate collapse, re-render only the affected region and compute the RMS change in
  luminance over all views; that is the cost. Use a lazy heap: costs are recomputed when popped.
- It captures silhouettes and shading directly, at the price of many renders; they relied on graphics hardware.
- **Fit here**: as the cost function it is too slow in Node for 300k triangles. As the *last* stage
  (QEM to about 3k, image-driven from 3k to 1.5k) it is affordable with SMAK's software renderer at
  128x128 per view, and it measures what the person sees. Worth an experiment (7.2).

**Differentiable-rendering simplification**, Hasselgren, Munkberg, Lehtinen, Aittala and Laine 2021,
"Appearance-Driven Automatic 3D Model Simplification", Eurographics Symposium on Rendering, arXiv:2104.03989
**[read: search abstract]**. Start from a decimated mesh, then jointly optimise vertex positions and textures
so its renders match the dense model's under random views and lights, by gradient descent through nvdiffrast.
Code `nvdiffmodeling` under the NVIDIA Source Code Licence (non-commercial), CUDA only. **Fit**: the idea is the
strongest for "fidelity at a budget", but it needs a differentiable rasteriser on this GPU; nvdiffrast is CUDA
(its licence is NVIDIA's 1-way commercial licence **[read: LICENSE.txt]**). A ROCm route is PyTorch3D's
pure-PyTorch rasteriser path or a small custom one; that is a porting project. Defer; take the texture half of it
(1.4) now.

**Robust low-poly meshing**, Chen, Pan, Wu, Vouga and Gao 2023, "Robust Low-Poly Meshing for General 3D Models",
ACM Transactions on Graphics 42(4), doi:10.1145/3592396 **[read: search abstract, SIGGRAPH history page]**.
Extracts a feature-preserving offset surface that is watertight, manifold and self-intersection free, then
simplifies and flows it back towards the input. Exactly the "game prop from messy mesh" problem. No code found
(the method is patented by the authors' employer: US12094060 and siblings **[read: search result]**).
**Fit**: the envelope idea is cheap to imitate (a voxel closing, section 6.1); the full method is a research build.

### 1.2 Remeshing first

| Method | Paper | What it does | Code licence | Fit |
| --- | --- | --- | --- | --- |
| Isotropic explicit remeshing | Botsch and Kobbelt 2004, "A remeshing approach to multiresolution modeling", SGP, doi:10.1145/1057432.1057457 **[known]** | Repeat: split edges longer than 4/3·L, collapse shorter than 4/5·L, flip to valence 6, tangential smoothing, project back | in pymeshlab (GPL-3.0) | Removes slivers; measured no gain over staged QEM on the car [earlier experiment, remesh_1500] |
| Instant Meshes | Jakob, Tarini, Panozzo and Sorkine-Hornung 2015, ACM TOG 34(6), doi:10.1145/2816795.2818078 **[known]** | Smooth a 4-RoSy orientation field and a position field by local Gauss-Seidel, extract a quad-dominant mesh at a target size | BSD-style **[read: LICENSE.txt]**, CPU | Quad layout follows curvature; at 750 quads the car's features would be lost before QEM could keep them. Good for organic shapes, not as the last step |
| QuadriFlow | Huang, Zhou, Nießner, Shewchuk and Guibas 2018, Computer Graphics Forum 37(5), doi:10.1111/cgf.13498 **[known]** | As Instant Meshes, with a min-cost flow pass that removes singularities: cleaner quads, watertight | BSD-style **[read: LICENSE.txt]**, CPU | Same verdict; useful before UV unwrapping a smooth organic shape (fewer, larger charts) |

Remeshing to a target is, for GoldSrc budgets, a pre-conditioner, not a reducer: it evens out triangle sizes
and kills slivers, which helps charting and baking. The measured car numbers do not argue for it as the main step.

### 1.3 Learned artist-mesh generation and retopology

These turn a dense shape (as points) into a mesh with an artist's topology, autoregressively, token by token.

| Model | Paper | Faces | Code / weights licence | Needs | Verdict |
| --- | --- | --- | --- | --- | --- |
| MeshGPT | Siddiqui et al., CVPR 2024, arXiv:2311.15475 **[known]** | ~800 | no official weights | | historical |
| MeshAnything V1 / V2 | Chen et al., arXiv:2406.10163 and 2408.02555 **[read: search]** | 800 / under 1600 | **S-Lab Licence 1.0, non-commercial** **[read: LICENSE.txt]** | ~8 GB, flash-attn, CUDA 11.8 tested; input should be marching-cubes-like, `--mc` **[read: README]** | right shape of tool, wrong licence; README warns feed-forward generators' meshes give poor results |
| BPT | Weng et al., "Scaling Mesh Generation via Compressive Tokenization", CVPR 2025 **[read: repo]** | 8k+ | **Tencent Hunyuan 3D 2.0 Community Licence** (excludes EU, UK, South Korea) **[read: LICENSE]** | 12 GB fp16, ~2 min a mesh | budget too high anyway; licence as Hunyuan |
| DeepMesh | Zhao et al. 2025, arXiv:2503.15265 **[read: abstract]**; ICCV 2025 [secondary] | not stated | **Apache 2.0** **[read: LICENSE]** | flash-attn built from source, xformers, sageattention, triton (CUDA) **[read: README]**; 0.5B weights | the one permissive option; porting the attention to PyTorch's SDPA is plausible, untried |
| Meshtron | Hao et al. 2024, arXiv:2412.09548 **[read: search]** | up to 64k | no weights found | | not available |
| LLaMA-Mesh | Wang et al. 2024, arXiv:2411.09595 **[known]** | small | Llama 3.1 licence [secondary, earlier report] | runs on CPU via llama.cpp | text-only, no conditioning on a shape: not a retopologiser |
| FastMesh | Kim, Lan, Fortes, Chen and Pan 2025, arXiv:2508.19188 **[read: search]** | V1K / V4K | **S-Lab Licence 1.0, non-commercial** **[read: LICENSE]** | | as MeshAnything |
| Mesh Silksong | Song et al. 2025, arXiv:2507.02477 **[read: search]** | | not found | | |
| MeshRipple | Lin et al. 2025, arXiv:2512.07514 **[read: abstract]** | | no code linked | | |
| OptimusMesh | arXiv:2610.01148 (October 2026) **[read: search result only]** | compact | not checked | | too new to judge |

How they work, enough to reimplement: quantise coordinates (7 to 10 bits), sort faces (by lowest vertex, or
BFS order over adjacency), serialise to tokens (9 coordinates a face, compressed by sharing a vertex with the
previous face: MeshAnything V2's adjacent tokenisation, BPT's block-and-patch indexing), and train a decoder-only
transformer to predict the sequence, cross-attending to a point-cloud encoding of the target shape. DeepMesh and
Mesh-RFT add preference optimisation (DPO) against geometric scores. Training needs tens of thousands of artist
meshes and many GPU-days: **not a custom build for this project**.

**Verdict**: not now. The permissive one (DeepMesh) is CUDA-bound and its face budget unknown; the others are
non-commercial or Tencent-licensed. Revisit if one ships with SDPA attention and a permissive licence. The
deterministic pipeline below gets most of the value.

### 1.4 Baking the dense mesh into the low mesh's colour texture

With no normal maps, everything the dense mesh had beyond the low silhouette goes into the diffuse texture.
This is what makes a 1500-triangle prop look like the 300k one in GoldSrc's flat light.

**Correspondence (the core of every bake).** Cignoni, Montani, Rocchini and Scopigno 1998, "A General Method
for Preserving Attribute Values on Simplified Meshes", IEEE Visualization 98, doi:10.1109/VISUAL.1998.745285
**[known]**: for each texel of the low mesh's texture, find its 3D point `p` and interpolated normal `n` on the
low mesh, cast a ray along ±n (within a cage distance, a few percent of the bounding box) to the dense mesh,
and take the dense surface's attributes at the hit. Fallback: nearest point. Needs a bounding volume hierarchy
over the dense mesh (300k triangles: a binary BVH with surface-area heuristic, Node, a few seconds to build).

**What to bake, each a channel to combine:**

| Channel | Method | Source |
| --- | --- | --- |
| Ambient occlusion | At the dense hit point, cast k rays (64 to 256) over the cosine-weighted hemisphere of the dense normal; AO = fraction unblocked within distance R. Zhukov, Iones and Kronin 1998, "An Ambient Light Illumination Model", Rendering Techniques 98 (obscurances); Landis 2002, SIGGRAPH course "Production-Ready Global Illumination" | **[known]** |
| Cavity / accessibility | Miller 1994, "Efficient Algorithms for Local and Global Accessibility Shading", SIGGRAPH 94, doi:10.1145/192161.192244: radius of the largest sphere that touches the point; cheap substitute: short-range AO (R a few units) | **[known]** |
| Curvature (edge wear, convex highlights) | Mean curvature per dense vertex by the cotangent Laplacian (Meyer, Desbrun, Schröder and Barr 2003, "Discrete Differential-Geometry Operators for Triangulated 2-Manifolds") or by per-face fitting (Rusinkiewicz 2004, 3DPVT); bake signed, then lighten convex, darken concave | **[known]** |
| Lighting from normals | `L = ambient + k·max(0, n_dense · light)` with the dense normal, under a soft fixed light (GoldSrc's studio light is top-front; a world prop is lit by the floor light under it plus a direction) | standard |
| Normal difference | `1 - n_dense·n_low`: where the low mesh lost a bevel; use it to paint in a highlight line | standard |

Combine as `colour = albedo × (a + b·AO) × (c + d·lightFromNormals) + e·curvatureHighlight`, with the weights
gentle: SMAK's rule already says the piece is seen from every side, so a strong painted key light is wrong from
behind. A good default is AO plus a weak top light only.

**SMAK already has** half of this: `surface` / `spot` (points of a model), `paint` with `p`, `n` per texel,
`carryPicture`'s nearest-surface search. Missing: a BVH ray cast against an outside dense mesh, and AO. Both are
small, dependency-free Node (estimate 300 to 500 lines).

**Palette.** SMAK quantises by median cut (`indexed`, `src/image.mjs`). Baked AO gives smooth gradients that
median cut bands. Two cheap improvements, both classic: Wu 1991 ("Efficient Statistical Computations for Optimal
Color Quantization", Graphics Gems II) or a few k-means (Lloyd) passes started from median cut; and no dithering
(GoldSrc textures are usually undithered and dithering shimmers under texture filtering) **[known]**.

## 2. Texture from photos onto a mesh

### 2.1 Finding the camera of each photo

The generator's mesh is in its own canonical frame, at its own scale; the photo's camera is unknown. Three ways:

**(a) Silhouette alignment, analysis by synthesis.** Lensch, Heidrich and Seidel 2001, "A Silhouette-Based
Algorithm for Texture Registration and Stitching", Graphical Models 63(4), doi:10.1006/gmod.2001.0554
**[known]**. Parameters: rotation (3), translation (3), focal length (1). Render the mesh's silhouette `S(θ)`,
compare with the photo's mask `M`, minimise an image distance.
- Cost: `1 - IoU(S, M)` is flat far from the optimum; better a chamfer cost: precompute the distance transform
  of M's outline (Felzenszwalb and Huttenlocher 2012, "Distance Transforms of Sampled Functions", Theory of
  Computing 8, linear time **[known]**), and sum it over S's outline pixels, plus the same the other way.
- Optimiser: 7 parameters, no gradients needed: Nelder-Mead or CMA-ES (Hansen, "The CMA Evolution Strategy: A
  Tutorial", arXiv:1604.00772 **[known]**), coarse to fine (64 px, then 128, then 256), started from the
  generator's prior (it was conditioned on a front view, so the input camera looks along a known axis at small
  elevation) and from a few yaw seeds for real photos.
- Each evaluation is one silhouette render; at 128x128 a 1500-triangle mesh is under a millisecond in plain JS.
  A few thousand evaluations: seconds. **Fits SMAK in Node** (the renderer exists; it needs a mask-only mode
  and a free camera with focal length).
- Ambiguity: a symmetric object's silhouette is the same mirrored; break the tie with colour (b) or by
  asking which side the photo shows.

**(b) Differentiable rendering**: SoftRas (Liu et al., ICCV 2019), PyTorch3D (Ravi et al. 2020, BSD), nvdiffrast
(Laine et al. 2020, NVIDIA licence, CUDA) **[known]**. Gradient-based pose and even shape refinement. Only
needed if (a) is not precise enough; PyTorch3D's pure-PyTorch rasteriser path may run on ROCm (untried).

**(c) Features and PnP**: render the textured or shaded mesh, match features to the photo (RoMa, LoFTR, or
MASt3R matching), solve PnP with RANSAC (EPnP: Lepetit, Moreno-Noguer and Fua 2009, IJCV,
doi:10.1007/s11263-008-0152-6 **[known]**). Fragile on an untextured generated mesh against a photo; use only to
refine (a).

**Several real photos of one object**: estimate all cameras together, independent of the mesh, with a
feed-forward reconstructor, then align that camera rig to the mesh once by silhouettes:

| Tool | Licence | Notes |
| --- | --- | --- |
| VGGT (Wang et al., CVPR 2025 best paper, arXiv:2503.11651) | code allows commercial use; only the `VGGT-1B-Commercial` checkpoint is commercial, gated by a form **[read: README]** | cameras, depth, point maps from 1 to many photos; plain PyTorch, falls back to CPU |
| MapAnything (Meta, 2025) | Apache 2.0 **[read: GitHub API]** | metric feed-forward reconstruction |
| π³ (Pi3, ICLR 2026) | BSD-3-Clause **[read: GitHub API]** | permutation-equivariant, no reference view |
| MASt3R (Naver) | not standard (CC BY-NC-SA per my knowledge) **[known]** | NC |
| COLMAP | BSD **[known]** | classic SfM; needs texture and 10+ photos; dense MVS needs CUDA |

### 2.2 Projective texturing with visibility

For each texel of the low mesh (point `p`, normal `n`) and each photo `i` with camera `P_i`:
- project `x = P_i p`; inside the image and inside the mask;
- visible: depth of `p` in camera i is within ε of the z-buffer rendered from camera i (render the **dense** mesh
  for the z-buffer, so the low mesh's simplification does not cause false occlusions);
- quality weight `w_i = max(0, n·v_i)^k × (projected texel footprint in pixels)`, i.e. prefer frontal and close
  views (Lempitsky and Ivanov's data term), down-weight near the mask's edge (matting halos) and near
  depth discontinuities.

### 2.3 Choosing and blending photos

**Per-face labelling with an MRF**, Lempitsky and Ivanov 2007, "Seamless Mosaicing of Image-Based Texture Maps",
CVPR 2007, doi:10.1109/CVPR.2007.383078 **[known]**.
- Labels: which photo textures face f. Energy `E(l) = Σ_f D_f(l_f) + λ Σ_(f,g adjacent) V_fg(l_f, l_g)`.
- Data `D_f(i)`: penalises oblique / small views (e.g. `-area of f's projection in image i`, ∞ if unseen).
- Smoothness `V_fg(i, j)`: 0 if i = j, otherwise the integral over the shared edge of the colour difference
  between image i and image j sampled along it.
- Minimise by alpha-expansion graph cuts (Boykov, Veksler and Zabih 2001, TPAMI, doi:10.1109/34.969114
  **[known]**); with a few photos and 1500 faces, ICM or a simple loopy belief propagation is enough in Node.
- **Seam levelling**: per vertex and per label an additive colour correction `g`; minimise
  `Σ_seam vertices (f_left + g_left - f_right - g_right)² + (1/λ) Σ_adjacent same-label (g_u - g_v)²`, a sparse
  least squares solved by conjugate gradient. Then add the interpolated `g` to the texels.

**"Let there be color!"**, Waechter, Moehrle and Goesele 2014, "Let There Be Color! Large-Scale Texturing of 3D
Reconstructions", ECCV 2014, doi:10.1007/978-3-319-10602-1_54 **[known]**; code `mvs-texturing`, BSD-3
**[read: LICENSE.txt]**.
- Data term: the integral of the image gradient magnitude over the face's projection (sharp, close, in-focus
  views win; GMI).
- **Photo-consistency check**: per face, the mean colours from all views that see it; mean-shift to the dominant
  mode; views far from it (an occluder, a pedestrian, **a moving reflection**) are dropped for that face. This is
  the step that matters most for real photos of cars.
- Potts smoothness (0 or a constant) instead of colour differences; global seam levelling as above but
  per-vertex-per-label on the seam only; then **local Poisson editing** (Pérez, Gangnet and Blake 2003,
  doi:10.1145/882262.882269 **[known]**) in a strip of about 20 pixels along each seam.

**Other refinements**, for later: Gal et al. 2010, "Seamless Montage for Texturing Models", Computer Graphics
Forum 29(2) (labels also choose a small image-space shift per face, fixing misregistration); Zhou and Koltun 2014,
"Color Map Optimization for 3D Reconstruction with Consumer Depth Cameras", ACM TOG 33(4),
doi:10.1145/2601097.2601134 (optimise camera poses plus a non-rigid image warp for photometric consistency); Bi,
Kalantari and Sen 2017, "Patch-Based Optimization for Image-Based Texture Mapping", ACM TOG 36(4),
doi:10.1145/3072959.3073610 **[known, all three]**. With a generated (not reconstructed) mesh the geometry is
not the photo's object exactly, so some misregistration is certain: the Gal et al. shift is the cheapest fix.

**Fit**: all of it is CPU graph work on 1500 faces and a few photos: Node, no dependency. Priority: MRF labels +
global levelling first; the photo-consistency check as soon as there are 3+ photos; Poisson strips last.

### 2.4 Filling what no photo sees

In order of preference:
1. **Mirror symmetry** for symmetric objects (cars, barrels, most props). Find the plane: PCA axes as
   candidates, refine by ICP between the mesh and its reflection (Mitra, Guibas and Pauly 2006, "Partial and
   Approximate Symmetry Detection for 3D Geometry", SIGGRAPH, doi:10.1145/1141911.1141924 **[known]**, for the
   general case). An unseen texel at `p` takes the colour of the reflected point's texel if that was seen. Even
   better for GoldSrc: mirror the **charts** too, so both halves share pixels (6.4): half the texture budget,
   twice the texel density.
2. **Rotational repetition** (wheels, barrels): same as 1 with a rotation.
3. **Generated texture for the rest**, conditioned on the photo:

| Method | Paper | Licence | Needs | Fit |
| --- | --- | --- | --- | --- |
| TEXTure | Richardson et al., SIGGRAPH 2023, arXiv:2302.01721 **[known]** | MIT **[read: GitHub API]** | Stable Diffusion depth-to-image, iterative views with trimap (keep / refine / generate) | old, slow; the trimap idea (only generate where unseen) is the one to copy |
| Text2Tex | Chen et al., ICCV 2023, arXiv:2303.11396 **[known]** | not stated **[read: GitHub API: NOASSERTION]** | depth-aware inpainting, view selection | as above |
| Paint3D | Zeng et al., CVPR 2024, arXiv:2312.13913 **[known]** | Apache 2.0 **[read: LICENSE]** | coarse multi-view then a UV-space inpainting / lighting-free refinement model | the UV-inpainting stage is a good match for "fill holes in the atlas" |
| MV-Adapter | Huang et al., ICCV 2025, arXiv:2412.03632 **[known]** | Apache 2.0 **[read: LICENSE]** | SDXL adapter for geometry-conditioned multi-view images; texturing pipeline included | plain diffusers; likely ROCm-friendly except its baker |
| Hunyuan3D-2 / 2.1 paint | Tencent, arXiv:2501.12202 / 2506.15442 **[known]** | Tencent community licences (exclude EU, UK, South Korea) **[read: 2.1 LICENSE]** | delight model, multi-view diffusion conditioned on the photo, `custom_rasterizer` (CUDA, see below), 2.1 is PBR, ~21 GB for texture **[read: README]** | best quality of the open ones; 2.0 paint is within reach on ROCm |
| Step1X-3D texture | StepFun, arXiv:2505.07747 **[known]** | Apache 2.0 **[read: LICENSE]** | SDXL-based, reuses Hunyuan's rasteriser, nvdiffrast, pytorch3d, cupy-cuda12x **[read: requirements.txt]**; 27 GB with geometry **[read: README]** | too big, CUDA stack |

**Hunyuan3D-2 texture stage on this machine [measured].** In the local clone
(`/media/Data3/Packages/local-3d/repos/Hunyuan3D-2`), the stage is: `Light_Shadow_Remover` (a
StableDiffusionInstructPix2PixPipeline in plain diffusers, `hunyuan3d-delight-v2-0`), multi-view diffusion
(diffusers), `mesh_processor` (plain C++ with a Python fallback) and `custom_rasterizer` (one `.cu` kernel).
Building `custom_rasterizer` with the ROCm PyTorch wheel (`ROCM_HOME=/usr PYTORCH_ROCM_ARCH=gfx1201 python
setup.py build_ext --inplace`, in the scratchpad, nothing installed): PyTorch's hipify **converted the CUDA
source successfully**; compilation stopped on `fatal error: hipblaslt/hipblaslt.h: No such file or directory`,
a header the PyTorch ROCm headers include. Ubuntu has it as `libhipblaslt-dev` (candidate 7.1.1); the system HIP
is 7.1 (`/usr/bin/hipcc`, from Ubuntu's packages) while the wheel is ROCm 6.4, so a version mismatch may follow.
For Steven, if he wants this tried: `sudo apt install libhipblaslt-dev`. Not tried further.

4. **Classic inpainting as the last resort, in UV space**: push-pull (fill holes from a mip pyramid of the
   known texels: Gortler, Grzeszczuk, Szeliski and Cohen 1996, "The Lumigraph", SIGGRAPH **[known]**) for gutters
   and small holes; Telea 2004 (fast marching, Journal of Graphics Tools 9(1)) or PatchMatch (Barnes et al. 2009,
   ACM TOG 28(3), doi:10.1145/1531326.1531330) **[known]** for larger ones. Better done in 3D (diffuse colours
   over the mesh surface from seen to unseen texels, by surface adjacency across chart seams) than in the 2D
   atlas, where neighbours across a seam are far apart. Then multiply by the baked AO (1.4), which gives an
   unseen region its form even when its colour is a guess.

### 2.5 De-lighting the photo

A photo's colours are albedo × shading + specular. GoldSrc lights the model itself, so baked-in sun, shadows
and reflections double up.

| Approach | Source | Licence | Fit |
| --- | --- | --- | --- |
| **Several views, robust per texel** | Waechter et al.'s photo-consistency (above); per-texel median or a low percentile of luminance across views | own code | **Best for cars**: a reflection moves between views, the paint does not. Needs 3+ photos |
| Shading from the mesh | divide the photo's luminance by the shading the mesh predicts under an estimated low-order lighting (fit 9 spherical-harmonic coefficients to `photo_luminance ≈ albedo_const × SH(n)` over the visible texels, then divide) **[known: Ramamoorthi and Hanrahan 2001]** | own code | cheap, Node; removes the broad sun gradient, not reflections |
| Specular removal by the dichromatic model | Shafer 1985; Tan and Ikeuchi 2005 (TPAMI, specular-free image); Yang, Wang and Ahuja 2010 (ECCV, bilateral filtering) **[known]** | own code | removes highlights on dielectrics; does not handle mirror-like car paint reflections |
| Hunyuan3D-2 delight | InstructPix2Pix fine-tune, in the clone **[measured: code read]** | Tencent 2.0 community licence | plain diffusers: expected to run on ROCm as it is (untried) |
| Marigold-IID Lighting / Appearance | Ke et al. 2025, arXiv:2505.09358 **[read: search]** | CreativeML Open RAIL++-M **[read: model card via search]** | albedo + shading + residual; SD2 based, diffusers, ROCm-friendly |
| Colorful diffuse intrinsic | Careaga and Aksoy 2024, ACM TOG, arXiv:2409.13690 | **academic use only** **[read: LICENSE]** | NC |
| RGB↔X | Zeng et al., SIGGRAPH 2024, arXiv:2405.00666 **[known]** | not checked | |

Recommendation: multi-view robust colour when there are several photos; spherical-harmonic shading division
always; a learned de-lighter (Marigold-IID Lighting, or Hunyuan delight) as an option for a single photo.
Afterwards clamp saturation and value spread to what GoldSrc textures use, which the palette step wants anyway.

## 3. Subject isolation from cluttered photos

The job splits in two: **which object** (words to a box) and **its exact outline** (box to a mask, with a good
edge). "Yolo2" most likely means YOLO26: YOLOv2 is Redmon and Farhadi's 2017 "YOLO9000" (CVPR 2017,
arXiv:1612.08242 **[known]**), long superseded.

### Current YOLO versions **[read]**

| Version | By | Date | Segmentation | Licence |
| --- | --- | --- | --- | --- |
| YOLOv8, YOLO11 | Ultralytics | 2023, 2024 | yes | AGPL-3.0 or paid Enterprise |
| YOLOv12 | Tian et al. (sunsmarterjie/yolov12) | Feb 2025 | yes | AGPL-3.0 (GitHub API) |
| YOLOv13 | iMoonLab | Jun 2025 | | AGPL-3.0 (GitHub API) |
| YOLOE (open vocabulary, text prompts) | Wang et al. (THU-MIG), arXiv:2503.07465 | Mar 2025 | yes; YOLOE-26 checkpoints from Ultralytics 8.4.0 | AGPL-3.0 |
| **YOLO26** | Ultralytics | **14 Jan 2026** (release v8.4.0) | yes, NMS-free | AGPL-3.0 or Enterprise |
| YOLO27 | Ultralytics | **not released**: docs page says "final R&D", no date, weights not available | announced | |

Sources: GitHub API licences; `ultralytics` release v8.4.0; `docs/en/models/yolo27.md` and `yoloe.md` from a
sparse clone of `ultralytics/ultralytics`. Roboflow and Qualcomm listings (secondary) also give AGPL for YOLO26.

**AGPL matters**: shipping software that uses these models, or a service built on them, obliges releasing the
whole program's source under AGPL, or buying the Enterprise licence. A permissive real-time alternative exists:
**RF-DETR-Seg** (Roboflow), Apache 2.0 for the segmentation checkpoints Nano to 2XLarge, January 2026
**[read: search, Roboflow blog]**; note its XL and 2XL *detection* models are on DINOv3 under a separate Platform
Model Licence [secondary]. Closed-vocabulary detectors (COCO's 80 classes) do know "car", "truck", "chair", but
not "street lamp" or "barrel": for props, open vocabulary is the useful kind.

### Words to a box

| Model | Licence | Notes |
| --- | --- | --- |
| Grounding DINO (Liu et al., ECCV 2024, arXiv:2303.05499) | Apache 2.0 **[read: LICENSE]** | free text phrases; the Hugging Face `transformers` port is pure PyTorch (the original has an optional CUDA op) |
| OWLv2 (Minderer et al., NeurIPS 2023, arXiv:2306.09683) | Apache 2.0 (scenic **[read: GitHub API]**) | in `transformers`; strong on rare classes |
| Florence-2 (Microsoft, arXiv:2311.06242) | MIT [secondary] | phrase grounding and referring expressions in one small model |
| Qwen3-VL | Apache 2.0 **[read: GitHub API]** | a vision-language model that answers "the car on the left" with a box; Steven has LM Studio installed (`/opt/LM-Studio`), which may serve it (untried) |
| SAM 3 (Meta, 19 Nov 2025, arXiv:2511.16719) | **SAM Licence**: royalty-free, commercial allowed, but forbids uses "related to ... the development or use of guns or illegal weapons" and ITAR **[read: LICENSE]**; gated weights; 848M parameters; install is CUDA 12.6+ **[read: README]**; SAM 3.1 on 27 Mar 2026 | text-prompt *concept* segmentation (all instances of "car"); its model card says it does **not** support referring expressions like "the car on the left" **[secondary: arXiv model card via search]** |
| YOLOE-26 | AGPL-3.0 | real-time, text prompts |

"The car on the left" is a referring expression; a noun-phrase detector returns all cars. Resolve the spatial
part in code: detect all boxes for "car", then pick by the words (leftmost, largest, nearest centre). A
vision-language model does both at once.

### Box to a mask, with a clean edge

| Model | Licence | Notes |
| --- | --- | --- |
| SAM 2 (Ravi et al. 2024, arXiv:2408.00714) | Apache 2.0 **[read: GitHub API]** | box or point prompt, good topology, edges a little soft; Grounded-SAM-2 (Apache 2.0) wires Grounding DINO to it |
| BiRefNet (Zheng et al. 2024, arXiv:2401.03407) | MIT **[read: README]** | dichotomous segmentation, sharp high-resolution edges; 1024x1024, 3.5 GB fp16; variants lite, HR (2048), matting, dynamic (256 to 2304); ONNX files published **[read: README]**; in rembg as `birefnet-general` |
| BEN2 Base (Prama LLC) | MIT **[read: model card and GitHub API]** | the open base model; the full model is API-only |
| rembg | MIT code; model licences differ **[read: README]** | default is now **`bria-rmbg` (RMBG-2.0), which needs a paid agreement for commercial use**; `u2net`, `isnet-general-use`, `birefnet-*` are the permissive choices |

**Recommended chain**: (words) Grounding DINO or OWLv2 → box (pick by the spatial words) → crop with margin →
BiRefNet on the crop for the mask → SAM 2 from the same box as a check (IoU between the two under 0.85 means a
human should look). For a photo with one obvious subject, BiRefNet alone. Feed the generator the masked crop
on white, as the earlier experiment did. All of this is Python, ROCm through PyTorch or ONNX Runtime's CPU path
(BiRefNet on CPU at 1024 px takes seconds; acceptable).

**Fix for the earlier experiment**: Hunyuan's `BackgroundRemover` calls `rembg.new_session()` with no model
name, which in rembg 2.0.85 is BRIA RMBG-2.0 (non-commercial). Pass `new_session("birefnet-general")`.

**Occluded subjects** (a car half behind a pole): the mask has a hole the generator will reproduce. SAM 3D
Objects (Meta, 19 Nov 2025, arXiv:2511.16624) is built for exactly this, masked objects in cluttered real
photos to shape, texture and pose, under the SAM Licence, but needs **an NVIDIA GPU with 32 GB**, pytorch3d and
kaolin **[read: doc/setup.md]**: out of reach here. Practical alternative: ask for another photo, or amodal
completion of the image first (inpaint the occluder with a diffusion inpainting model, then segment).

## 4. Newer image-to-3D and multi-view generators

| Model | Date | Licence | VRAM | CUDA-only parts | On this card (16 GB, ROCm) |
| --- | --- | --- | --- | --- | --- |
| Hunyuan3D-2mini / 2mv | Mar 2025 | Tencent 2.0 community (excl. EU, UK, KR) | ~5 GB [measured, earlier] | shape: none | **runs** (2mini measured); 2mv takes several views, same stack: should run |
| Hunyuan3D-2.1 | 13 Jun 2025 | Tencent 2.1 community (excl. EU, UK, KR) **[read: LICENSE]** | shape ~10 GB, texture ~21 GB, both ~29 GB **[read: README]** | texture: custom_rasterizer, mesh painter | shape: likely (same design as 2.0), untried; PBR texture: no (VRAM) |
| Hunyuan3D-Omni, -Part | Sep 2025 | not asserted on GitHub **[read: API]** | | | controllable / part generation; not checked |
| Hunyuan3D 2.5, 3.0 | 2025 | **no open weights**: Tencent's GitHub and Hugging Face list only 1, 2, 2mini, 2mv, 2.1, Omni, Part **[read: GitHub org and HF API]** | | | API only |
| TripoSG | Mar 2025 | MIT **[read: LICENSE]**, but its NOTICE lists code derived from HunyuanDiT and FlashVDM under Tencent licences and RMBG-1.4 under BRIA's licence **[read: NOTICE]** | 8 GB+ **[read: README]** | `from diso import DiffDMC` at import (a CUDA extension) used only by the "flash" extractor; the default path uses scikit-image marching cubes **[read: code]** | **likely with a stubbed import**; the best next try |
| SPAR3D (Stability) | Jan 2025 | Stability AI Community Licence (free under $1M revenue) **[read: LICENSE.md]** | 10.5 GB, 7 GB low-VRAM mode **[read: README]** | texture baker and UV unwrapper have CPU (and Metal) paths; `SPAR3D_USE_CPU` exists | likely (GPU net, CPU baker); outputs a UV-unwrapped textured mesh with a remesh option, interesting as a low-poly baseline |
| Step1X-3D | May 2025 | Apache 2.0 **[read: LICENSE]** | 27 to 29 GB with texture **[read: README]** | nvdiffrast, pytorch3d, cupy-cuda12x, sageattention | geometry alone maybe; texture no |
| Direct3D-S2 | NeurIPS 2025 | MIT **[read: GitHub API]** | 10 GB at 512³, ~24 GB at 1024³ **[read: README]** | torchsparse, triton 3.1, flash-attn | no (torchsparse has no ROCm build that I found) |
| TRELLIS.2 (4B) | 2025 (repo active to Jul 2026) | MIT; nvdiffrast / nvdiffrec under their own **[read: README]** | **24 GB minimum, NVIDIA, tested A100 / H100** **[read: README]** | flash-attn, nvdiffrast, nvdiffrec, cumesh, o-voxel, flexgemm | no |
| Pixal3D (Tencent ARC, SIGGRAPH 2026, arXiv:2605.10922) | May 2026, multi-view Sep 2026 | MIT, third parties per NOTICE **[read: README]** | low-VRAM mode exists, no figure | builds on TRELLIS.2; natten built for a CUDA arch | no (TRELLIS.2 stack). Notable: **pixel-aligned** generation, output consistent with the input view, so projecting the photo needs no pose search |
| SAM 3D Objects | Nov 2025 | SAM Licence | 32 GB NVIDIA **[read: setup.md]** | pytorch3d, kaolin | no |

Also seen, not evaluated: Sparc3D and Ultra3D appear to be closed, commercial [secondary]; AssetFurnace
(Apache 2.0) is a wrapper around Pixal3D / TRELLIS.2 / Hunyuan3D, not a model [secondary].

**Several real photos to 3D**: two routes. (1) Multi-view conditioned generators: Hunyuan3D-2mv (runs here
in principle), Pixal3D's `inference_mv.py` with cameras in a `transforms.json` (not here). (2) Classic: SfM
plus MVS (COLMAP, OpenMVS (AGPL **[read]**), Meshroom) needs 20+ textured photos and dense MVS wants CUDA;
cars' shiny, untextured paint is the worst case for it. Route (1) plus feed-forward cameras (VGGT, π³,
MapAnything) for texturing is the practical one.

**ROCm in general**: the shape (DiT plus VAE plus marching cubes) half of most of these is plain PyTorch and
runs; what blocks is (a) compiled CUDA extensions (rasterisers, sparse convolution, mesh tools), (b) flash-attn
(replaceable by PyTorch SDPA in most repos via an environment variable), (c) VRAM. Hipify plus the missing header
package (2.4) may unlock the Hunyuan-family rasteriser; nvdiffrast's CUDA kernels and OpenGL interop make it a
real port, not a rebuild.

## 5. Recommended pipeline for SMAK

Python stays an optional pre-step (as `local-3d-generators.md` decided); everything after "a dense mesh, its
photo(s), their masks" is Node in SMAK, dependency-free.

```
photo(s) ─► [py] isolate: Grounding DINO/OWLv2 box ─► BiRefNet mask (SAM 2 check)
          ─► [py] generator: Hunyuan3D-2mini/2mv now; TripoSG, Hunyuan3D-2.1 shape next ─► dense.obj
          ─► [py, optional] cameras for several photos: VGGT / π³
dense.obj + photos + masks ─► [node] smak:
   1. clean: drop floaters, remove small handles (closing), fix orientation
   2. reduce: staged QEM with crease + silhouette weights, link and flip checks ─► low mesh, ≤ budget
   3. normals codebook: snap normals to ≤ 2048 (k-means on the sphere) so the budget is triangles, not normals
   4. charts: from the photos' views (each face to the photo that sees it best), else view-based on 6-10 directions;
      mirror charts for symmetric objects; LSCM inside each chart where not projected; pack
   5. cameras: silhouette alignment of each photo to the low (or dense) mesh
   6. texture: project + visibility; MRF labels; seam levelling; symmetry fill; push-pull for the rest
   7. bake: AO + cavity + soft light from the dense mesh, multiplied in; quantise to 256 colours
   8. check, sheet, compare against the photo from the found camera
```

### What to build, in priority order

| # | Build | Where | Size (estimate) | Why first |
| --- | --- | --- | --- | --- |
| 1 | Fix rembg model choice (`birefnet-general`) and add a words-to-box step | Python pre-step | small | licence exposure today; clutter is Steven's ask (c) |
| 2 | QEM decimator in Node: Garland-Heckbert with Hoppe-style attribute terms (UV and normal), crease penalty, boundary planes, link-condition and flip checks, staged schedule | `src/` | 500 to 700 lines | removes pymeshlab (GPL-3.0) from the path, makes reduction part of the kit, allows the custom weights below |
| 3 | Normals codebook (k-means of normals per submodel to ≤ 2048, or simply a crease-angle increase until it fits) | `meshOf` neighbourhood | 100 lines | the measured limit at 1500 triangles was normals, not points |
| 4 | BVH ray caster + AO / cavity bake from an outside dense mesh into `paint` | `src/` | 300 to 500 lines | biggest visual gain per line for GoldSrc's flat light |
| 5 | Silhouette pose fit (mask-only render mode, chamfer cost, Nelder-Mead / CMA-ES) | `src/` | 300 lines | prerequisite for photo projection (b) |
| 6 | Projective texture with visibility, MRF labels (ICM), seam levelling (conjugate gradient), symmetry fill, push-pull | `src/` | 600 to 900 lines | Steven's ask (b) |
| 7 | View-based / photo-based charting with small-chart merging and mirrored charts; LSCM for non-projected charts | `src/` | 400 to 600 lines | Steven's UV follow-up; also improves 6 |
| 8 | Handle removal (voxel closing or offset envelope) before reduction | Python first (pymeshlab), Node later | | genus 32 on the car |
| 9 | Image-driven last stage (Lindstrom-Turk cost from 3k to 1.5k) | `src/` | 200 lines over 2 | only if 7.2 says it pays |
| 10 | Try TripoSG and Hunyuan3D-2.1 shape; Hunyuan3D-2 paint after `libhipblaslt-dev` | Python | | better dense input; generated fill for unseen parts |

Deferred: learned retopology (licences, CUDA), differentiable-rendering simplification (needs a ROCm
differentiable rasteriser), TRELLIS.2 / Pixal3D / SAM 3D (VRAM and CUDA).

## 6. UV charts after reduction (Steven's follow-up)

### 6.1 Why the decimated car fragments, measured

On `out/car/reduce/quadric_in_halves_1500.obj` (the staged-QEM car, 1500 triangles), with xatlas 0.0.11
through its Python binding, packing to 512 px with 2 px padding [measured, `charts_xatlas_options.py`]:

| xatlas chart options | Charts | Charts under 0.2% of the area | Largest chart | Utilisation | Seam length / √area |
| --- | --- | --- | --- | --- | --- |
| default (normal deviation 2, roundness 0.01, straightness 6, normal seam 4, max cost 2, 1 iteration) | 185 | 123 | 20.2% | 81.6% | 27.6 |
| max cost 8 | 172 | 111 | 16.1% | 77.8% | 28.4 |
| max cost 8, 4 iterations | 174 | 111 | 16.0% | 79.0% | 27.6 |
| normal deviation 1, max cost 8, 4 iterations | 174 | 111 | 16.0% | 77.6% | 27.6 |
| normal deviation 0.5, straightness 2, max cost 16, 4 iterations | 175 | 115 | 16.2% | 78.5% | 27.7 |
| every weight 0, max cost 1000, 4 iterations | 214 | | | 71.5% | |

The same on the plain-quadric car (177 to 199 charts) and the remeshed car (179 to 187). **The options barely
matter.** Even with every growth cost at zero, xatlas makes *more* charts, so the splits come from its
parameterisation stage (a chart whose flattening folds over or stretches too far is split), not from chart
growth. Why the mesh resists [measured, `charts_why.py`, `charts_closing.py`]:

| Mesh | Faces | Genus | Edges folding over 60° | Slivers (quality < 0.1) |
| --- | --- | --- | --- | --- |
| dense car from Hunyuan3D-2mini | 296,376 | **32** | 0% | 3% |
| staged QEM (topology kept) | 1500 | 32 | 27% | |
| remeshed then staged QEM | 1500 | 32 | 25% | 1% |
| plain quadric | 1498 | (not watertight) | 22% | 11% |

1. **Handles.** The generator's car has 32 tunnels (marching-cubes noise, thin gaps at mirrors, wheel arches,
   grille). Topology-preserving collapse keeps every one, spending triangles on them; each handle needs a cut to
   flatten, and the triangles around it are thin and folded.
2. **Folds.** A quarter of the low mesh's edges bend more than 60 degrees. A smooth 1500-triangle car body should
   have few: these are small features collapsed into crumpled fans. Each fold region ends up a chart of 1 to 3
   triangles (103 of the 183 charts).
3. **Closing first helps, a bit**: a voxel closing (dilate then erode by d, pymeshlab's uniform resampling)
   before the staged reduction gave 167 charts at d = 0.29 units, 162 at 0.58 and 124 at 1.16, at a mean surface
   error of 0.25, 0.34 and 0.32 units (against 0.18 without). So handles explain part, folds the rest.

### 6.2 Chart segmentation methods

| Method | Paper | Algorithm | Verdict |
| --- | --- | --- | --- |
| VSA | Cohen-Steiner, Alliez and Desbrun 2004, "Variational Shape Approximation", SIGGRAPH, doi:10.1145/1186562.1015817 **[known]** | Lloyd iteration over k planar proxies: assign faces to proxies by flood fill from seeds with the L²,¹ metric `‖n_f - n_proxy‖² · area`, refit each proxy's normal as the area-weighted mean, reseed, repeat; add a proxy where error is largest until under tolerance | **best fit for a low-poly car**: k = 20 to 40 near-planar panels are exactly a good chart set. Easy in Node (~200 lines) |
| D-Charts | Julius, Kraevoy and Sheffer 2005, "D-Charts: Quasi-Developable Mesh Segmentation", Computer Graphics Forum 24(3), doi:10.1111/j.1467-8659.2005.00879.x **[known]** | Lloyd as VSA but each proxy is a cone (axis, angle), so cylinders and cones (wheels, poles, barrels) are one chart; cost adds compactness and boundary straightness | better than VSA for turned parts; more work (cone fitting) |
| Hierarchical face clustering | Garland, Willmott and Heckbert 2001, I3D **[known]** | greedy dual-graph edge contraction by planarity + compactness, a QEM over faces | what xatlas does in spirit; same failure on folds |
| Iso-charts | Zhou, Snyder, Guo and Shum 2004, SGP **[known]** | spectral (geodesic distance) segmentation driven by stretch | heavier; no gain here |

All of these work on the shape; none fixes a fold, which a 1-triangle chart is. The fold has to go into a
neighbour's chart (accepting distortion: a 1500-triangle prop at 512 px has about 170 texels a triangle, so a
little stretch is invisible) or be avoided in the decimation (6.4).

### 6.3 Parameterisation inside a chart

| Method | Paper | What it does | Fit |
| --- | --- | --- | --- |
| LSCM | Lévy, Petitjean, Ray and Maillot 2002, SIGGRAPH, doi:10.1145/566654.566590 **[known]** | per triangle, the conformal energy `|∂u/∂x + i ∂u/∂y|²`-style residual is linear in UVs; pin 2 vertices, solve a sparse least squares (conjugate gradient on the normal equations) | **build in Node**: 150 lines, robust, free boundary |
| ABF++ | Sheffer, Lévy, Mogilnitsky and Bogomyakov 2005, ACM TOG 24(2), doi:10.1145/1061347.1061354 **[known]** | optimise angles under consistency constraints, then reconstruct | less distortion than LSCM, more code; not needed at this size |
| ARAP parameterisation | Liu, Zhang, Xu, Gotsman and Gortler 2008, SGP **[known]** | local-global: per-triangle best rotation, then a global Poisson solve | a few iterations after LSCM removes area distortion; cheap |
| BFF | Sawhney and Crane 2017, "Boundary First Flattening", ACM TOG 37(1), doi:10.1145/3132705 **[known]** | prescribe boundary scale or angle (even straight edges or a rectangle), solve via the Cherrier formula; conformal | lets a chart be flattened to a **rectangle or polygon that packs well**; MIT code exists (C++) |
| OptCuts | Li, Kaufman, Kim, Solomon and Sheffer 2018, ACM TOG 37(6), doi:10.1145/3272127.3275042 **[known]** | jointly optimise seams and distortion: for a distortion bound, minimise seam length by topology moves (split, merge) | the principled answer to "fewest seams under a stretch limit"; a substantial build |
| AutoCuts | Poranne, Tarini, Huber, Panozzo and Sorkine-Hornung 2017, ACM TOG 36(6), doi:10.1145/3130800.3130845 **[known]** | one energy for distortion plus a soft seam term, optimised continuously | as above; interactive tool in the paper |

Seams and distortion trade: one chart per car side with LSCM has visible stretch on the folds; a hundred charts
have none and waste texels. For GoldSrc at this budget, accept moderate stretch (stretch L² under ~1.3) to keep
charts above about 1% of the area.

### 6.4 Chart-aware decimation, symmetry, and simplifying with UVs kept

- **Texture mapping progressive meshes**, Sander, Snyder, Gortler and Hoppe 2001, SIGGRAPH,
  doi:10.1145/383259.383307 **[known]**: partition the *dense* mesh into charts first, then simplify under the
  constraint that chart boundaries are only simplified along themselves (a collapse may not cross a boundary,
  and boundary vertices only collapse along the boundary), so every level keeps the same charts; texture stretch
  is the parameterisation metric. **This is the method for this problem**: chart the dense mesh with VSA or
  D-Charts (dense surfaces are smooth, no folds, so charts come out large), then decimate with chart boundaries
  locked as in Garland and Heckbert's boundary planes. Folds can then only form inside a chart, where the
  flip check rejects them. Build in the Node QEM (item 2 of 5) as a flag.
- **UV-preserving simplification**: once a dense mesh has a good atlas, Garland-Heckbert 1998 / Hoppe 1999
  quadrics with UV as attributes, plus "do not collapse across a UV seam", keep it. meshoptimizer's `simplify`
  infers attribute seams from indices and keeps them **[read: js/README.md]**.
- **Mirrored charts**: find the symmetry plane (2.4), decimate one half and mirror it (the low mesh becomes
  exactly symmetric, which also halves the decimation error budget), unwrap one half, give the mirrored faces the
  same UVs. GoldSrc allows overlapping UVs (SMAK's `paint` reports such sharing as `shared`). Doubles texel
  density. Costs the ability to have one-sided marks (a number plate on one side), so keep one non-mirrored
  strip for those when needed.
- **Remeshing or smoothing before unwrapping**: compute charts on a smoothed copy of the low mesh (a few
  Taubin passes, which keep volume) and apply the face-to-chart assignment to the real mesh; then LSCM per chart.
  Folds stay folds in 3D but no longer decide the charts.

### 6.5 View-based charting from the photos

The texture comes from photos, so let the photos decide the charts.

1. Label each face with the photo (or, with no photos, one of 6 to 10 fixed directions) that sees it best:
   the data and Potts terms of Waechter et al. 2014 (2.3). That labelling is already a chart segmentation.
2. Within a label, connected patches are charts; their UVs are the **projected photo coordinates** themselves
   (perspective-correct texel positions in that photo, scaled), so the photo's pixels are copied, not
   resampled through a second parameterisation. This is what "projective texture atlases" do in photogrammetry
   tools (mvs-texturing writes such an atlas).
3. Merge charts under a size threshold into the neighbour with the longest shared edge, if every face still
   faces that view (cos > 0.05); otherwise LSCM the leftovers into a "misc" area.
4. Check overlap: a projected chart overlaps itself if two of its faces cover the same photo pixels (a fold
   facing the camera). Detect by rasterising the chart into a face-id buffer; split where it overlaps.
5. Pack (xatlas's packer alone, or a simple skyline packer in Node), with 2 px padding, scaled so texel density
   is even across charts (or deliberately higher on the side the game shows).

Measured with fixed views on the same car [measured, `charts_by_view.py`]: data `(1 - cos) × area`, faces
facing a view by less than cos 0.1 forbidden, Potts weight × shared edge length², ICM for 10 sweeps:

| Views and smoothing | Charts | Charts of 1-3 faces | Area-weighted cos(normal, view) | Seam length / √area |
| --- | --- | --- | --- | --- |
| cube (6), no smoothing | 328 | 244 | 0.92 | 39.0 |
| cube, Potts 0.5 | 137 | 71 | 0.87 | 23.4 |
| cube, Potts 2 | 142 | 77 | 0.86 | 23.4 |
| cube + 4 diagonals, Potts 2 | 163 | 88 | 0.86 | 24.3 |
| cube, Potts 0.5, charts ≤ 4 faces merged | **96** | 33 | 0.86 | |
| cube, Potts 0.5, charts ≤ 10 faces merged | **83** | 30 | 0.85 | |

So half of xatlas's count with seams 15% shorter, and every chart still faces its view (minimum cos 0.06), which
is what lets a photo be projected straight into it. Overlap (step 4) and packing efficiency were **not**
measured. The remaining 30 tiny charts are folds facing no neighbour's view: they want the fold fixed in the
reduction (6.4), not a smarter charter.

### 6.6 Verdicts and the experiment

| Approach | Verdict |
| --- | --- |
| Tune xatlas options | does not help on this mesh (measured) |
| Clean handles before reducing | helps some (185 to 124 charts at d = 1.16 units), costs surface error; do it with a small d |
| VSA / D-Charts on the low mesh | better than xatlas's growth on a car; still stuck on folds |
| Sander et al. chart-locked decimation (charts from the smooth dense mesh) | **the real fix**: build into the Node QEM |
| View / photo-based charts with merging, UVs = photo projections | **use for photo texturing**: fewest resamplings, charts that projection can fill |
| Mirrored charts | yes for symmetric props: double texel density |
| BFF to rectangles, OptCuts / AutoCuts | later, if packing or distortion measurements say so |

Experiment U1: for each approach on the car, the barrel and the lamp (dense meshes from the earlier
experiment), at 1500 triangles and 512x512:

| Metric | How |
| --- | --- |
| chart count; charts under 0.5% of the area | connected components in UV |
| texel utilisation | covered texels / all, after packing with 2 px padding |
| distortion | area-weighted mean and 95th percentile of the singular-value stretch `σ_max/σ_min` and the L² stretch of Sander et al. 2001 |
| seam length | 3D length of UV boundary edges / √(surface area) |
| fill ratio from photos | texels with a photo colour / texels of faces the photos see |
| look | SMAK `sheet` of the textured result next to the photo from the found camera |

## 7. Experiments to decide between options

All on the car (photo-based) plus the barrel, lamp and cart (prompt-based) from `local-3d-generators.md`.
Image-space metrics use SMAK's renderer: render the dense mesh and the low model from the same 20 views
(a sphere, Lindstrom-Turk's setup) at 256x256. The dense mesh exceeds a submodel's limits; `smak obj` already
splits a large mesh over bodyparts for drawing (that is how the raw meshes were drawn before), or the comparison
render can be done in Python.

| # | Decides | Options | Metrics | Bar |
| --- | --- | --- | --- | --- |
| 7.1 | Reduction | staged QEM (pymeshlab) vs Node QEM vs Node QEM + crease/silhouette weights vs + closing | two-way Hausdorff mean / RMS / max (Metro: Cignoni, Rocchini and Scopigno 1998, Computer Graphics Forum 17(2) **[known]**), silhouette IoU over 20 views, non-manifold edges, genus, points and normals per submodel | mean ≤ 0.18 units on the 116-unit car (today's best), no non-manifold edges, fits one submodel |
| 7.2 | Image-driven last stage | QEM to 1500 vs QEM to 3000 then image-driven to 1500 | per-view luminance RMS (shaded, no texture), silhouette IoU | worth it if RMS drops ≥ 10% |
| 7.3 | Normals | crease angle raise vs k-means codebook of 512 / 1024 / 2048 | normals count; per-view shaded RMS against unquantised normals | 1500 triangles in one submodel with RMS change under 1% |
| 7.4 | Bake | none vs AO vs AO + cavity vs AO + soft light | per-view RMS and FLIP (Andersson et al. 2020, BSD-3 [known]) between the low model rendered **with light off** (texture only) and the dense mesh rendered shaded | the bake should halve the gap |
| 7.5 | Camera | silhouette chamfer vs IoU cost; Nelder-Mead vs CMA-ES | final mask IoU; reprojection error of 4-8 hand-clicked points; time | IoU ≥ 0.95 on the car photos |
| 7.6 | Texture | nearest view vs MRF + levelling vs + photo-consistency vs + Poisson strips | PSNR / SSIM / LPIPS between the photo and the textured low model rendered from the found camera, inside the mask; seam visibility = mean colour jump across chart seams | LPIPS improves at each stage or the stage is dropped |
| 7.7 | De-light | none vs SH division vs multi-view median vs Marigold-IID | variance of texture colour across one painted panel (should drop), hue preserved | |
| 7.8 | Isolation | rembg u2net vs BiRefNet vs Grounding DINO + SAM 2 vs + BiRefNet | mask IoU against 10 hand masks of cluttered photos; boundary F-score at 2 px | pick the cheapest within 0.01 IoU of the best |
| 7.9 | Generator | Hunyuan3D-2mini vs TripoSG vs Hunyuan3D-2.1 shape vs SPAR3D | silhouette IoU against the input mask from the input view; genus; folds after reduction; time, VRAM | |
| U1 | Charts | section 6.6 | section 6.6 | ≤ 40 charts, utilisation ≥ 75%, 95th-percentile stretch ≤ 1.5 |

## Could not verify

- The arXiv numbers and DOIs marked **[known]** were not reopened in this session.
- TRELLIS.2's paper reference and exact release date (the README gives neither).
- Whether Hunyuan3D-2.1's shape stage, TripoSG (with `diso` stubbed), SPAR3D, Hunyuan3D-2mv and Marigold-IID run
  on this ROCm setup: inferred from their code and requirements, not run.
- Whether `custom_rasterizer` builds and runs after `libhipblaslt-dev` is installed (version mismatch between
  the system HIP 7.1 and the wheel's ROCm 6.4 is possible).
- MeshAnything V1's licence (V2's is S-Lab non-commercial); BPT's and DeepMesh's face limits; whether DeepMesh
  runs with SDPA attention in place of flash-attn.
- SAM 3's statement that it does not handle referring expressions comes from its model card as summarised by
  a search tool, not read directly.
- Florence-2's MIT licence and RF-DETR-Seg's Apache 2.0 are from secondary pages; Text2Tex, Hunyuan3D-Omni,
  Hunyuan3D-Part, SPAR3D and nvdiffrast have no SPDX licence on GitHub (their own licence files: Stability
  Community for SPAR3D, NVIDIA 1-way commercial for nvdiffrast, not read for the rest).
- MASt3R's licence (CC BY-NC-SA) is from memory; GitHub reports no SPDX id.
- Whether Hunyuan3D 2.5 and 3.0 will be opened: only their absence from Tencent's GitHub and Hugging Face today
  is checked.
- Whether Qwen3-VL runs in Steven's LM Studio with box output.
- Projected charts' self-overlap and packing efficiency (6.5) were not measured; the chart counts there are
  from a 6-direction stand-in, not real photo cameras.
- Pixal3D's camera handling (whether it estimates focal length) is not stated in the abstract.
