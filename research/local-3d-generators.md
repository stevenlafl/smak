# Open-source 3D generators run locally, as a source of shapes for SMAK

Experiment, 2026-10-14. The question: can an open-source text-to-3D or image-to-3D model, run on this machine
with no outside service, make shapes worth importing into a SMAK model spec as a part, for organic or
irregular forms the spec's primitives cannot express?

Abbreviations: VRAM (video memory), RAM (system memory), ROCm (AMD's GPU compute stack), DiT (diffusion
transformer), UV (texture coordinates), RSS (resident set size, the RAM a process holds).

Everything lives under `/media/Data3/Packages/local-3d/` (repos, venvs, weights, inputs, outputs, scripts).
Nothing in this repository changed except this file.

## Result in short

| | Shap-E (text-to-3D) | SD-Turbo picture, then Hunyuan3D-2mini (image-to-shape) |
| --- | --- | --- |
| Ran on | GPU, ROCm | GPU, ROCm |
| Time per object | 10 to 15 s | about 1 s for the picture; 2 to 9 s for the shape (turbo, 5 steps), 18 s (full model, 50 steps) |
| Peak VRAM (torch) | 4.9 GB | 4.1 GB (picture), 4.5 to 4.9 GB (shape) |
| Peak RAM (RSS) | 7.2 GB | 5.6 GB (picture), 16 to 20 GB (shape) |
| Raw triangles | 7.5k to 352k | 113k to 778k |
| Colour | vertex colours, blurry | none (shape only) |
| Barrel | recognisable, lumpy | clean, stave seams visible |
| Street lamp | lantern floats free of the pole | clean, one piece (pole cut short by the picture) |
| Cart | melted, no wheels | wheels and bed right in outline, spokes a tangle at any budget |

Recommendation: **worth it as an optional pre-step for closed, rounded, organic shapes** (barrels, rocks,
pots, statues, creature heads, tree stumps), using Hunyuan3D-2mini for shape and SMAK for paint. **Not worth
it for mechanical objects with thin parts** (carts, lamps with arms, weapons, furniture with legs): the spec's
primitives do those better and with clean topology. Shap-E is not worth integrating. Reducing the triangle count
is now the weak link and needs its own research (see "Next").

## Machine

| | |
| --- | --- |
| GPU | AMD Radeon RX 9070 XT, gfx1201 (RDNA 4), 16 GB VRAM, about 2.2 GB in use by the desktop |
| ROCm | no system ROCm (`/opt/rocm` absent, no `rocm-smi`); the PyTorch ROCm wheels bring their own runtime. `/dev/kfd` and the `render` group are enough |
| PyTorch | `torch 2.9.1+rocm6.4` from `download.pytorch.org/whl/rocm6.4`, Python 3.12 via uv. gfx1201 is detected and runs fp16 (50 4096x4096 matmuls in 0.7 s). Harmless warning on every start: `/opt/amdgpu/share/libdrm/amdgpu.ids: No such file or directory` |
| RAM | 60 GB total, about 36 GB free with the desktop and Steam running |

No sudo, no driver or system change. First runs compile GPU kernels (MIOpen): the first SD-Turbo picture
took 56 s, the rest 1 s.

## 1. Candidates

Licences and VRAM below are from the projects' own files where cloned (Shap-E, Hunyuan3D-2) and from model
cards or secondary listings otherwise. The secondary figures are marked; check before relying on them.

| Model | In | Out | Licence | VRAM | On ROCm | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Shap-E (OpenAI, 2023) | text or image | marching-cubes mesh, vertex colours | MIT | ~5 GB measured | **ran** | pure PyTorch. Weights from OpenAI's public blob, CLIP from GitHub |
| Hunyuan3D-2mini (Tencent, 2025), shape only | image | dense watertight mesh, no colour | Tencent Hunyuan Community Licence: excludes the EU, UK and South Korea; source headers also say "non-commercial" | ~5 GB measured | **ran** | 0.6B DiT, turbo (5 steps) and full (50). Shape path is pure PyTorch |
| Hunyuan3D-2 texture stage | mesh + image | textured mesh | same | 16 GB+ (project's figure) | not tried | needs its own compiled CUDA rasteriser |
| TripoSR (Stability + Tripo, 2024) | image | mesh, vertex colours (texture bake optional) | MIT | ~6 GB | likely | needs `torchmcubes` (compiled extension); older, weaker than Hunyuan3D-2 |
| TripoSG (VAST, 2025) | image | dense mesh | MIT (model card) | >8 GB (secondary) | likely | 1.5B rectified flow, Diffusers pipeline. The most permissive strong shape model: try next |
| Stable Fast 3D / SPAR3D (Stability, 2024-25) | image | UV-unwrapped textured mesh, low poly option | Stability AI Community Licence (free under $1M revenue) | ~6 to 7 GB | uncertain | custom CUDA extensions for UV unwrap and bake |
| InstantMesh (Tencent ARC, 2024) | image | mesh with texture | Apache 2.0 | ~10 GB+ | hard | nvdiffrast and FlexiCubes, CUDA only |
| TRELLIS / TRELLIS.2 (Microsoft, 2024 / 2025) | image (text for v1) | textured mesh or Gaussians | MIT | 16 to 24 GB (secondary, figures disagree) | hard | spconv, flash-attn, nvdiffrast, kaolin: CUDA stack; at or over this card's 16 GB |
| LLaMA-Mesh (NVIDIA, 2024) | text | OBJ as text, quantised coordinates, no UVs | Llama 3.1 licence (GGUF listings) | 8B: ~5 to 16 GB as GGUF; runs on CPU via llama.cpp | yes (CPU or Vulkan) | writes small meshes directly; one report says outputs can be dense. Not tried: no llama.cpp here |
| MeshAnything V2 (2024) | dense mesh or points | "artist-like" mesh under 1600 faces | unclear: demo says MIT, repo licence not confirmed | ~8 GB | uncertain (flash-attn) | a re-topology step, not a generator: the right shape of tool for the reduction problem |

## 2. What ran

### Setup (once)

```
mkdir -p /media/Data3/Packages/local-3d/{repos,venvs,weights,out,inputs,scripts}
cd /media/Data3/Packages/local-3d
export UV_CACHE_DIR=$PWD/.uv-cache
uv venv -p 3.12 venvs/torch-rocm
uv pip install -p venvs/torch-rocm/bin/python --index-url https://download.pytorch.org/whl/rocm6.4 torch torchvision
git -C repos clone git@github.com:openai/shap-e.git       # 5013101
git -C repos clone git@github.com:openai/CLIP.git
git -C repos clone git@github.com:Tencent/Hunyuan3D-2.git # f8db630
uv pip install -p venvs/torch-rocm/bin/python filelock Pillow fire humanize requests tqdm matplotlib scikit-image \
  scipy numpy blobfile ftfy regex trimesh pyyaml ipywidgets fast-simplification xatlas einops opencv-python-headless \
  omegaconf pymeshlab pygltflib rembg onnxruntime safetensors accelerate \
  "transformers<5" "diffusers<0.36" "huggingface_hub<1"
uv pip install -p venvs/torch-rocm/bin/python --no-deps -e repos/CLIP -e repos/shap-e -e repos/Hunyuan3D-2
```

The pins matter: transformers 5.x renames the DINOv2 weights Hunyuan3D-2 loads (`Unexpected key(s) in
state_dict: main_image_encoder...`), and diffusers 0.41 needs huggingface_hub 1.x, which transformers 4.x refuses.

Disk: venv 16 GB, weights 22 GB (Hunyuan3D-2mini's three subfolders and SD-Turbo 18 GB, Shap-E and CLIP
2.9 GB, the background remover's u2net 1 GB), repos 0.2 GB.

### Scripts (in `/media/Data3/Packages/local-3d/scripts/`)

| Script | Does |
| --- | --- |
| `shap_e_text.py` | Shap-E text-to-3D, 64 Karras steps, guidance 15, seed 0; writes `.obj` (vertex colours) and `.ply` |
| `sd_turbo_images.py` | four 512x512 pictures a prompt from SD-Turbo (4 steps), white background style suffix |
| `hunyuan_mini_shape.py` | background removal (rembg), then Hunyuan3D-2mini shape, octree 256, seed 12345, floater and degenerate-face removal |
| `to_prop.py` | dense mesh to a budget `.obj`: drop pieces under 2% of the faces, quadric decimation (fast-simplification), colours carried by nearest vertex, xatlas UV unwrap, colours baked to a PNG. `--target goldsrc` (1000 tris, 256 px), `goldsrc-hero` (3000, 512), `source2` (20000, 2048); `--faces` and `--tex` override |
| `qa.mjs` | SMAK's `soundness`, `seeThrough` and `check` on each `.mdl` |

### Run

```
cd /media/Data3/Packages/local-3d
export HF_HOME=$PWD/weights/hf HY3DGEN_MODELS=$PWD/weights/hy3dgen U2NET_HOME=$PWD/weights/u2net
P=venvs/torch-rocm/bin/python; S=/media/Data3/Packages/smak/bin/smak.mjs

# Shap-E, text to shape
$P -I scripts/shap_e_text.py out/shap-e "a wooden barrel" "a street lamp" "a small wooden cart"

# picture, then Hunyuan3D-2mini
$P -I scripts/sd_turbo_images.py inputs/sd-turbo "barrel=a wooden barrel with iron hoops" \
  "lamp=an old cast iron street lamp post with a lantern" "cart=a small wooden hand cart with two wheels"
$P -I scripts/hunyuan_mini_shape.py out/hunyuan-mini hunyuan3d-dit-v2-mini-turbo 5 \
  inputs/sd-turbo/barrel_2.png inputs/sd-turbo/lamp_2.png inputs/sd-turbo/cart_1.png
$P -I scripts/hunyuan_mini_shape.py out/hunyuan-mini-50 hunyuan3d-dit-v2-mini 50 inputs/sd-turbo/cart_1.png

# reduce, convert, check, draw (Shap-E is +z up: add --up z; Hunyuan is +y up, the obj default)
$P -I scripts/to_prop.py out/hunyuan-mini/barrel_2.obj out/hunyuan-mini/prop/barrel_2.obj --target goldsrc
node $S obj out/hunyuan-mini/prop/barrel_2.obj -o out/hunyuan-mini/prop/barrel.mdl --scale 30 --ground
node scripts/qa.mjs out/hunyuan-mini/prop/barrel.mdl
node $S sheet out/hunyuan-mini/prop/barrel.mdl -o out/hunyuan-mini/prop/barrel-sheet.png
```

Scales used: Shap-E barrel 22, lamp 60, cart 30; Hunyuan barrel 30, lamp 60, cart 30 (cart also `--turn 90`).
Both generators fill a cube of about 2 units, so `--scale` is the object's height or length in game units / 2.

The pictures picked from the four a prompt: `barrel_2`, `lamp_2`, `cart_1` (contact sheet at
`inputs/sd-turbo/contact.png`). Every lamp picture cuts the pole off at the foot, so the lamp shape has no base.

## 3. Numbers

### Time and memory

| Step | Load | Per object | Peak torch VRAM | Peak RSS |
| --- | --- | --- | --- | --- |
| Shap-E, 3 prompts | 224 s first run (weights download) | 9.3 to 10.8 s sampling, 10 to 15 s with the mesh | 4.9 GB | 7.2 GB |
| SD-Turbo, 12 pictures | 35 s | 56 s first (kernel compile), then 0.9 to 1.0 s | 4.1 GB | 5.6 GB |
| Hunyuan3D-2mini turbo, 3 pictures | 79 s | barrel 8.7 s, lamp 2.0 s, cart 4.9 s | 4.9 GB | 20.5 GB |
| Hunyuan3D-2mini, 50 steps, cart | 143 s (subfolder download) | 18.2 s | 4.5 GB | 16.3 GB |
| `to_prop.py` (decimate, unwrap, bake) | | a few seconds; the 778k-face cart about 30 s | CPU | under 4 GB |

The 16 to 20 GB of RAM for Hunyuan is the one figure to watch: it fits the 36 GB free, but not alongside a
second heavy job or a large game. Everything ran one job at a time.

### Triangles, against the GoldSrc budget

GoldSrc holds 2048 points and 2048 normals a submodel; a world prop is typically under about 1500 triangles.

| Model | Raw tris | Raw pieces | Reduced to | Points in .mdl | Fits one submodel |
| --- | --- | --- | --- | --- | --- |
| Shap-E barrel | 352,164 | 15 | 1000 | 492 | yes |
| Shap-E lamp | 7,464 | 7 | 998 | 505 | yes |
| Shap-E cart | 54,236 | 4 | 998 | 470 | yes |
| Hunyuan barrel | 607,850 | 1 | 998 | 501 | yes |
| Hunyuan lamp | 112,936 | 1 | 1000 | 487 | yes |
| Hunyuan cart | 777,814 | 2 | 998 / 1500 / 3000 / 20000 | | 1000 only; 1500 already split over 2 bodyparts |
| Hunyuan cart, 50 steps | 709,000 | 1 | 2998 | | no (split) |

A decimated mesh is faceted, so SMAK's smoothing gives it many normals: the 1500-triangle cart had 783 points
but went over the 2048-normal limit. In practice about 1000 to 1200 triangles fit one submodel from this path.
The raw meshes, converted as they are, split over 4 bodyparts (lamp, 7.5k) and 32 bodyparts (cart, 54k).

### Soundness (SMAK `soundness`, `seeThrough`, `check`) on the reduced models

| Model | open | crowded | flipped | touching | other faults | seeThrough | check |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Shap-E barrel | 0 | 13 | 0 | 18 | 10 shells inside out | none | clean |
| Shap-E lamp | 0 | 4 | 0 | 0 | 2 pieces float (lantern 11.4 units off the pole, a hook 3.1) | none | clean |
| Shap-E cart | 0 | 17 | 0 | 14 | 5 shells inside out | none | clean |
| Shap-E lamp, raw | 0 | 60 | 0 | 0 | 33 shells inside out, 4 pieces float | none | clean |
| Hunyuan barrel | 0 | 2 | 2 | 0 | | none | clean |
| Hunyuan lamp | 0 | 2 | 0 | 24 | | none | clean |
| Hunyuan cart, 1000 | 2 | 20 | 0 | 53 | | none | clean |
| Hunyuan cart, 1500 | 2 | 23 | 0 | 28 | | none | clean |
| Hunyuan cart, 3000 | 2 | 20 | 0 | 14 | | none | clean |
| Hunyuan cart, 50 steps, 3000 | 0 | 38 | 5 | 6 | | none | clean |

The raw Hunyuan meshes are watertight single pieces (trimesh). The crowded, flipped and open edges after
reduction come from the quadric decimation, which does not keep the surface manifold where thin parts collapse.
The Shap-E faults are mostly its own: the lamp's lantern floats in the raw mesh too, and its thin arm comes
out as a dotted line of blobs. The 33 inside-out shells on the raw Shap-E lamp may partly be the 4-way bodypart
split cutting shells; not looked into further.

## 4. How they look

Sheets are next to each model: `out/shap-e/prop/*-sheet.png`, `out/shap-e/*_raw-sheet.png`,
`out/hunyuan-mini/prop/*-sheet.png`, `out/hunyuan-mini-50/cart_hero-sheet.png`.

- **Shap-E barrel**: a barrel with hoops in the right places, lumpy outline, dark baked colour. Usable as
  background clutter, not better than a `turn` of four rings.
- **Shap-E lamp**: a pole and base, but the lantern floats beside it and the arm is lost. Not usable.
- **Shap-E cart**: a melted tray on a stick; no wheels to speak of, holes in the sides. Not usable.
- **Hunyuan barrel**: clean, even bulge, rim lip and stave lines in the geometry. Better than SMAK's own
  primitives would give with no effort, though a `turn` gives the same with more control.
- **Hunyuan lamp**: a clean ornate lantern with finial and a turned post: the kind of detail a spec is tedious
  for. The picture cropped the post, so it has no base.
- **Hunyuan cart**: bed, rims and axle in the right places, spokes a tangle. One picture cannot show the far
  wheel, so the model guesses it; even at 20,000 triangles the spokes are wrong. The 50-step model is cleaner
  (rounder wheels, fewer stray spokes) and still not a cart a person would ship.

No texture is worth keeping from either path: Shap-E's colours are a blur, Hunyuan gives none. SMAK's own
`paint` by place (wood, iron, rust from `workshop`) on the imported shape is the better way to colour it.

## 5. Recommendation

1. **Integrate as an optional, offline pre-step, not as part of the kit.** The kit stays Node with no
   dependencies; the generator is a separate Python tool the person installs if they want it. It writes an
   `.obj`, and the spec imports it as a part (the existing `readObj` / `objMeshes` / `putBody` path), placed
   and scaled by the spec like any other part, then painted by SMAK.
2. **Model: Hunyuan3D-2mini shape (turbo for drafts, full for keeps)**, fed by a local text-to-image picture.
   Licence caveat: Tencent's community licence excludes the EU, UK and South Korea. **TripoSG** (MIT) is the
   one to try next as a permissive alternative of similar class.
3. **Use it for**: closed, rounded, organic or ornate forms (barrels, urns, rocks, stumps, statues, lantern
   heads, creature heads). **Not for**: thin-part or mechanical objects (carts, ladders, weapons, chairs),
   where the spec's attached primitives are cleaner, cheaper and right by construction.
4. **Gate every import on SMAK's checks**: `soundness` (no open or flipped edges, one piece), `seeThrough`, the
   points limit, and a sheet the agent looks at. Reject or re-seed rather than repair.
5. **Shap-E: no.** Weak shapes at any budget.

## Next (not done here)

- **Reduction with a selectable target** is the weak link and its own research task. Quadric decimation to
  1000 triangles tears thin parts and leaves crowded edges. Worth comparing: decimation that preserves
  topology and boundaries (pymeshlab's quadric with topology preservation), remeshing to a target (Instant
  Meshes, QuadriFlow) then decimation, and learned re-topology to an "artist" mesh (MeshAnything V2, under
  1600 faces). `to_prop.py --target goldsrc|goldsrc-hero|source2` is the shape such a step would take; its
  numbers are first guesses and the Source 2 preset is untested in a Source 2 game.
- **LLaMA-Mesh** writes small meshes directly from text and runs on CPU through llama.cpp; it might suit a
  1998 look with no reduction step. Not tried (no llama.cpp on this machine).
- **Picture step**: the picture decides the shape. Several angles (Hunyuan3D-2mv takes multi-view) or prompts
  that show the whole object (the lamps were all cropped) would help more than a bigger shape model.
- Hunyuan's texture stage, TRELLIS, InstantMesh and SF3D need compiled CUDA extensions; making them run on
  ROCm is a porting job, not worth it while texture comes from SMAK's paint.

## Sources

- Shap-E: github.com/openai/shap-e (commit 5013101), LICENSE (MIT)
- Hunyuan3D-2: github.com/Tencent/Hunyuan3D-2 (commit f8db630), LICENSE, README (2mini series table),
  huggingface.co/tencent/Hunyuan3D-2mini
- SD-Turbo: huggingface.co/stabilityai/sd-turbo (Stability AI licence; check the card's current terms)
- PyTorch ROCm wheels: download.pytorch.org/whl/rocm6.4
- TRELLIS.2: huggingface.co/microsoft/TRELLIS.2-4B (MIT); VRAM figures from secondary sites
  (codesota.com/news/trellis-2-3d-generation, app.cinevva.com) disagree, 16 to 24 GB
- TripoSG: huggingface.co/VAST-AI/TripoSG (MIT); VRAM figure from promptlayer.com/models/triposg (secondary)
- LLaMA-Mesh: datacamp.com/tutorial/llama-mesh; GGUF licence from promptlayer.com/models/llama-mesh-gguf (secondary)
- MeshAnything V2: github.com/buaacyw/MeshAnythingV2; face limit from the official demo
  (yiwen-ntu-meshanythingv2.hf.space); licence not confirmed in the repository
