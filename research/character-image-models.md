# Character pictures: image models better than SD-Turbo, on this card

Research, checked 2026-10-17. No download, install or change was made; the only things run were short
measurements on the existing venv `local-3d/venvs/torch-rocm` (torch 2.9.1+rocm6.4) with weights already on disk.

The question: the generator route (`generators/worker.py`, `load_hunyuan`) draws a character with SD-Turbo
(4 steps, 512x512, image to image at strength 0.7 over the base's grey guide figure), cuts it out with BiRefNet,
makes a mesh with Hunyuan3D-2mini and projects the picture onto the mesh. The picture is the paint, so it caps
fidelity (`research/generated-characters.md`). What can draw a better picture, paint the back and sides
honestly, and run on a 16 GB RDNA 4 card under ROCm?

Abbreviations: VRAM (video memory), ROCm (AMD's GPU compute stack), RDNA 4 (the RX 9000 generation; its
compiler target is gfx1201), DiT (diffusion transformer), SDPA (PyTorch's scaled dot-product attention),
GGUF (a block-quantised weight file format), bf16 / fp16 (16-bit float formats), LoRA (a small add-on
fine-tune), NC (non-commercial).

Provenance tags: **[measured]** run here today; **[read: X]** read from the source linked; **[derived]**
worked out from read figures (parameters times 2 bytes for bf16, and similar); **[known]** general knowledge,
not re-checked.

## The answer in short

Rank order for this card, best expected gain first:

```
| Rank | What | Replaces | Licence | New download | Expected gain |
| 1 | Z-Image-Turbo (6B, 8 steps) + Fun ControlNet Union 2.1 (pose and depth), drawn at 1024 from SMAK's own pose and depth render of the base | SD-Turbo img2img at 512 | Apache-2.0, both | ~13 GB (GGUF Q8 transformer 7.2 GB, Qwen3-4B text encoder 8.0 GB, VAE 0.2 GB, ControlNet lite 2.0 GB or full 6.7 GB) | large: a coherent face, straps, belt, holster and boots at 4x the pixels; the stance held by pose control instead of by noise strength |
| 2 | Hunyuan3D-Paint 2.0 turbo multiview net, fed SMAK's own normal and position renders of the mesh, the step-1 picture as reference | front-only projection, back carried from the front | Tencent Hunyuan Community (excludes EU, UK, South Korea) | none: already on disk (11.0 GB in local-3d/weights) | the back and sides painted from views aligned to our mesh, consistent with the front |
| 3 | A head (and hands) re-drawn at 1024 from a crop of the step-1 picture (Z-Image inpaint, same weights) | a 30 px face | Apache-2.0 | none beyond rank 1 | a readable face, the single biggest gap to Valve's barney |
| 4 | Qwen-Image-2.1 (7B, Turbo 8 steps) instead of Z-Image, with its own Fun ControlNet Union and a multiple-angles LoRA | rank 1, and optionally rank 2 | Qwen Research Licence: non-commercial only | ~20 GB quantised (GGUF Q8 7.6 GB, Qwen3-VL-8B encoder int8 9.4 GB, VAE 0.7 GB, ControlNet int8 3.8 GB) | best open model on the arenas today; native transparent output (no cut-out step); one model for draw, edit and turnaround. Heavier and newer: try only if rank 1 falls short |
| fallback | SDXL fine-tune (RealVisXL V5) + xinsir ControlNet Union (OpenPose, depth) + an 8-step Lightning LoRA | rank 1 | OpenRAIL++ / Apache-2.0 | ~12 GB | medium: 1024, pose held, mature on ROCm; clearly below the 2025-26 DiTs on hands, faces and prompt following |
```

Not recommended for this card: FLUX.1-dev and -schnell (superseded, 12B, need quantising and still rank
below Z-Image-Turbo), HiDream-I1 (17B plus Llama 3.1 8B), SD 3.5 Large (8B, below the newer models), FLUX.2-dev
(32B), FLUX 3 klein (31 GB peak at bf16 by its own card, four days old), HiDream-O1 (pixel-space 8B, wants
flash-attn), Hunyuan3D-Paint 2.1 (21 GB), PSHuman (over 40 GB), Era3D (AGPL, CUDA install), SV3D (orbit video,
NC, not aligned to a mesh). Details below.

The one finding to act on whatever model is chosen: **on this stack fp16 matrix multiplies run at 4 to 12
TFLOPS and bf16 at 39 to 46 [measured]**. The worker loads SD-Turbo and Hunyuan3D in fp16. Every model above
ships in bf16 and should run in bf16 here. SD-Turbo itself draws a 512 picture in 0.27 s in bf16 against 0.91 s
in fp16 [measured].

## The machine, measured today

```
| | Value | How |
| GPU | Navi 48, gfx1201; torch reports 32 work-group processors (64 compute units: the RX 9070 XT, not the 9070), 17.1 GB | lspci, torch.cuda.get_device_properties [measured] |
| Torch | 2.9.1+rocm6.4 in every existing venv; diffusers 0.35.2 (local-3d) to 0.39.0 (acestep) | [measured] |
| bf16 matmul, 4096 / 8192 square | 45.6 / 39.3 TFLOPS | [measured] |
| fp16 matmul, 4096 / 8192 square | 12.3 / 4.2 TFLOPS, on hipBLASLt and on rocBLAS alike | [measured] |
| SDPA, 24 heads x 4608 tokens x 128, bf16 | flash 4.9 ms (0.15 GB), memory-efficient 4.8 ms (0.18 GB), math 97.5 ms (5.0 GB) | [measured] |
```

So the memory-efficient attention that DiTs at 1024 need works on gfx1201 in this torch (its AOTriton ships
gfx1201 kernels; AOTriton 0.14 adds a newer gfx1201 backend
[read: https://newreleases.io/project/github/ROCm/aotriton/release/0.14b]). A model whose code insists on the
`flash-attn` package (HiDream's, Era3D's xformers) needs patching to SDPA; diffusers pipelines use SDPA by default
[read: https://huggingface.co/docs/diffusers/main/en/api/pipelines/z_image].

SD-Turbo on this card, 4 steps, one picture (same venv, the worker's own weights):

```
| dtype | 512 x 512 | 1024 x 1024 | Peak torch VRAM (512 / 1024) |
| fp16 (what the worker uses) | 0.91 s | 4.35 s | 4.3 / 9.0 GB |
| bf16 | 0.27 s | 1.04 s | 4.3 / 9.0 GB |
```

Mean of three pictures after a warm-up, text to image, `guidance_scale=0` [measured]. bf16 is 3.4 to 4.2 times
faster for the same picture budget. The worker's two `torch_dtype=torch.float16` lines (SD-Turbo, and Hunyuan's
`variant="fp16"` load) are the cheap change; whether Hunyuan3D-2mini's output holds in bf16 is not checked.
The first run of each size also spent over a minute in one-off kernel set-up (MIOpen), not counted above.

Reported speeds of the same chip elsewhere: SDXL at 1024, 20 steps, 4.6 it/s on AMD's Radeon AI PRO R9700
under ROCm 7.1 [read: https://rocm.blogs.amd.com/artificial-intelligence/comfyui-radeon-9000/README.html,
2026-03-09], which is the full Navi 48 die of the RX 9070 XT with 32 GB
[read: https://heise.de/-10392042]; but users on ROCm 6.3 to 6.4 saw 1.0 to 1.5 it/s and out-of-memory at the
VAE decode until tiled decoding was used [read: https://github.com/Comfy-Org/ComfyUI/issues/7332,
https://github.com/ROCm/ROCm/issues/4846]. AMD recommends `PYTORCH_HIP_ALLOC_CONF=expandable_segments:True` and
tiled VAE decoding on 16 GB cards (the blog above). The fp16 finding above may explain part of the users' slow
numbers (SDXL is commonly run in fp16) [derived, not tested].

The 60 GB of RAM matters: diffusers' model and group offloading keep the text encoder and VAE in RAM and move
them in only for their step, so a model whose parts add up to more than 16 GB still runs, if the denoiser
itself (plus ControlNet) fits [read: https://huggingface.co/docs/diffusers/main/en/quantization/gguf, which
uses `enable_model_cpu_offload` in its examples]. GGUF weights in diffusers are dequantised on the fly in plain
PyTorch; the optional CUDA kernels are only a 10% speed-up, so GGUF should work on ROCm [read: same page;
not tested here].

## 1. Image models

Sizes are what a run needs (bf16 denoiser, text encoder, VAE), from the Hugging Face API file lists
[read: https://huggingface.co/api/models/{id}?blobs=true, 2026-10-17]. VRAM at 1024 is the denoiser's
weights plus 1 to 3 GB of activations with the text encoder offloaded [derived] unless a figure is quoted.

```
| Model (repo) | Params | Disk for a run | VRAM at 1024 | Steps | Licence | ROCm gfx1201 today | Pose / depth control |
| SD-Turbo (stabilityai/sd-turbo), current | 0.9B UNet | ~5 GB fp16 | 4.1 GB measured at 512 | 1-4 | Stability AI NC Research Community licence [known; repo shows no tag] | runs (measured) | img2img only; 512 native |
| SDXL base / fine-tunes (stabilityai/stable-diffusion-xl-base-1.0, SG161222/RealVisXL_V5.0) | 2.6B UNet | ~7 GB | 8-10 GB [known]; OOM at VAE decode reported without tiling | 25-30, or 4-8 with SDXL-Lightning (ByteDance/SDXL-Lightning, OpenRAIL++) | CreativeML OpenRAIL++-M | runs: AMD lists it; 1.0-4.6 it/s reported | xinsir/controlnet-union-sdxl-1.0 (Apache-2.0, OpenPose, depth, normal and 9 more) and xinsir/controlnet-openpose-sdxl-1.0 |
| SDXL-Turbo (stabilityai/sdxl-turbo) | 2.6B | ~7 GB | as SDXL at 512 | 1-4 | Stability NC community (sai-nc-community) | as SDXL | as SDXL; 512 native |
| Playground v2.5 (playgroundai/playground-v2.5-1024px-aesthetic) | 2.6B (SDXL shape) | ~7 GB | as SDXL | 25-50 | Playground v2.5 Community Licence | as SDXL | SDXL ControlNets are not trained on it |
| PixArt-Sigma (PixArt-alpha/PixArt-Sigma-XL-2-1024-MS) | 0.6B DiT + T5-XXL | ~11 GB | ~3 GB + T5 offloaded [derived] | 20 | OpenRAIL++ | plain diffusers, should run | few, unmaintained |
| Sana 1.6B (Efficient-Large-Model/Sana_1600M_1024px_diffusers) | 1.6B + Gemma-2 2B | ~10 GB | ~5 GB [derived] | 20 | tagged Apache-2.0 on the diffusers repo | plain diffusers, should run | ControlNet exists upstream, not checked |
| SD 3.5 Medium (stabilityai/stable-diffusion-3.5-medium) | 2.5B | ~10 GB with T5 | ~7 GB [derived] | 28-40 | Stability AI Community (free under US$1M revenue) | plain diffusers, should run | Large has depth/canny/blur ControlNets (stabilityai/stable-diffusion-3.5-large-controlnet-depth); Medium has none official |
| SD 3.5 Large / Large Turbo | 8B | ~27 GB | 16 GB weights: needs 8-bit or GGUF | 28 / 4 | Stability AI Community | should run quantised | depth, canny, blur (Stability) |
| FLUX.1-schnell (black-forest-labs/FLUX.1-schnell) | 12B | 23.8 GB transformer + 9.5 GB T5 | 23.8 GB bf16: needs Q8 GGUF (~12.7 GB) | 1-4 | Apache-2.0 | GGUF path should run; no gfx1201 report found | dev ControlNets loosely |
| FLUX.1-dev | 12B | as schnell | as schnell | 20-50 | FLUX.1-dev Non-Commercial | as schnell | Shakker-Labs/FLUX.1-dev-ControlNet-Union-Pro-2.0 (pose, depth; 4.3 GB; same NC licence) |
| HiDream-I1-Fast / Full | 17B + Llama-3.1-8B + T5-XXL | 47 GB repo | 34 GB bf16: no | 16 / 50 | MIT weights; Llama 3.1 Community for its encoder | recommends flash-attn and CUDA 12.4 | none found |
| FLUX.2-klein 4B (black-forest-labs/FLUX.2-klein-4B) | 4B + Qwen3-4B | 7.8 + 8.1 GB | "~13 GB" by its card | 4 | Apache-2.0 (the 9B is FLUX NC) | plain diffusers (Flux2KleinPipeline), should run | none official; community reference-pose LoRA xocialize/refcontrol-FLUX.2-klein-4B-pose-lora (for klein-base) |
| Z-Image-Turbo (Tongyi-MAI/Z-Image-Turbo) | 6B + Qwen3-4B | repo stores fp32 (24.6 GB); bf16 12.3 GB; GGUF Q8 7.2 GB (unsloth/Z-Image-Turbo-GGUF) | "fits comfortably within 16G" by its card | 8 | Apache-2.0 | plain diffusers (ZImagePipeline, Img2Img, Inpaint, ControlNet pipelines), should run | alibaba-pai/Z-Image-Turbo-Fun-Controlnet-Union-2.1 (Apache-2.0): canny, HED, depth, pose, MLSD, scribble, gray; 6.7 GB or lite 2.0 GB; in diffusers as ZImageControlNetPipeline |
| Qwen-Image (Qwen/Qwen-Image, Aug 2025) | 20B + Qwen2.5-VL-7B | 40.9 + 16.6 GB | needs Q4 GGUF | 50 | Apache-2.0 | GGUF path | InstantX/Qwen-Image-ControlNet-Union (Apache-2.0) |
| Qwen-Image-2.1 / -Turbo (Qwen/Qwen-Image-2.1, Sep-Oct 2026) | 7B + Qwen3-VL-8B | 14.2 + 17.5 GB bf16; Q8 GGUF 7.6 GB; int8 encoder 9.4 GB | 14.2 GB bf16: tight; Q8 fits | 40 / 8 | Qwen Research Licence: non-commercial (research or evaluation) only | diffusers main (QwenImage21Pipeline), should run; no AMD report found | alibaba-pai/Qwen-Image-2.1-Fun-Controlnet-Union (7.6 GB, same licence) |
| HiDream-O1-Image (May 2026) | 8B pixel-space, no VAE | ~35 GB | not stated; 2048 default | 50 / 28 (Dev) | MIT | wants flash-attn; patch needed | "skeleton conditioning" built in |
| FLUX 3 klein (black-forest-labs/flux-3-image-klein, 2026-10-13) | 5.6B + Qwen3-VL-4B | 11.1 + 8.9 GB | 31 GB peak bf16 on a B200 by its card | 16 | FLUX Kommunity Licence (NC; commercial output under US$5M revenue) | too new; ModularPipeline on diffusers main | boxes only |
```

Sources for the table: each repo's model card on huggingface.co (the Z-Image-Turbo, FLUX.2-klein-4B,
Qwen-Image-2.1, Qwen-Image-2.1-Turbo, HiDream-I1-Fast, HiDream-O1-Image, FLUX 3 klein and xinsir cards were read
in full today); licence tags from the Hugging Face API; diffusers class names from
`src/diffusers/__init__.py` on main [read: https://raw.githubusercontent.com/huggingface/diffusers/main/src/diffusers/__init__.py];
Z-Image ControlNet in diffusers [read: https://raw.githubusercontent.com/huggingface/diffusers/main/src/diffusers/pipelines/z_image/pipeline_z_image_controlnet.py,
whose example loads alibaba-pai/Z-Image-Turbo-Fun-Controlnet-Union at `controlnet_conditioning_scale=0.75` on a pose picture];
the Fun ControlNet's controls and recommended scale 0.65 to 1.0
[read: https://huggingface.co/alibaba-pai/Z-Image-Turbo-Fun-Controlnet-Union-2.1].

**Quality ranking.** Artificial Analysis' text-to-image arena, read today
[read: https://artificialanalysis.ai/text-to-image/arena/leaderboard-text], open-weights entries by Elo:
Qwen-Image-2.1 1042, FLUX.2 [dev] 1000, HiDream-O1-Image 974, Z-Image Turbo 934, FLUX.2 [klein] 9B 931, Qwen
Image (2025) 902, FLUX.2 [klein] 4B 838, FLUX.1 [dev] 841, FLUX.1 [schnell] 740. Arena.ai also puts
Qwen-Image-2.1 first among open models [read: https://x.com/arena/status/2102416020678008986]. SDXL, SD 3.5,
PixArt and Playground are no longer on the board. Arena votes are general pictures, not "a full-body character
on white, front view"; they rank prompt following and anatomy, which is what fails at 512 here.

**Why Z-Image-Turbo first, not Qwen-Image-2.1.** Qwen-Image-2.1 scores higher, but: (a) its licence is
research-only (fine for Steven's non-commercial work, but say so); (b) its 7B transformer and 8B encoder need
quantising on 16 GB, where Z-Image's 6B fits in Q8 with the ControlNet beside it; (c) it is four weeks old with
no AMD report; Z-Image has been in diffusers since late 2025 with img2img, inpaint and ControlNet pipelines.
Qwen-Image-2.1 has two things Z-Image has not: transparent output (no BiRefNet step, a clean alpha edge for the
projection) and editing with up to 10 references in the same model, which is also the turnaround route (rank 4).

**Holding the stance.** Today the stance comes from img2img at strength 0.7 over a grey figure, which keeps
the silhouette but also the grey, and two seeds of four drew the figure's back
(`generated-characters.md`, follow-up). A pose ControlNet takes a skeleton picture instead. SMAK knows the base's
bones in the stance it builds in, so it can draw the OpenPose skeleton itself (coloured limbs, OpenPose's fixed
colour per limb; the colours encode left and right, so the front is unambiguous) and a depth picture of the grey
figure from its own renderer, with no pose detector. Union ControlNets (xinsir for SDXL, Fun for Z-Image and
Qwen) take either. This is the change most likely to raise the share of usable takes [derived from the
documented controls; not tested here].

## 2. Multi-view: painting the back and sides

Two families. **Free** multi-view models invent views from one picture with their own cameras; the views are
not aligned to our mesh, so each needs a camera fit before projecting (`3d-fidelity-methods.md`, "Finding the
camera of each photo"). **Geometry-conditioned** ones take renders of our mesh (normals, positions or depth)
from known cameras, so their pictures land on the mesh exactly. We already have the mesh before painting, so
the second family fits the pipeline.

```
| Model | Family | Views out | Size | VRAM | Licence | ROCm | Notes |
| Hunyuan3D-Paint 2.0 / 2.0 turbo (tencent/Hunyuan3D-2) | geometry: normal + position renders, reference picture | 6 at 512: azimuth 0, 90, 180, 270, top, bottom (weights 1, 0.1, 0.5, 0.1, 0.05, 0.05) | paint-turbo 6.7 GB + delight 4.3 GB; on disk already | 16 GB "shape and texture in total" by its README | Tencent Hunyuan Community (excludes EU, UK, South Korea) | multiview net is a diffusers custom pipeline; only custom_rasterizer is CUDA, and it hipifies (stopped on libhipblaslt-dev, 3d-fidelity-methods.md) | the net itself needs no rasteriser if SMAK renders the normal and position maps |
| Hunyuan3D-Paint 2.1 PBR (tencent/Hunyuan3D-2.1) | geometry, PBR (albedo, metal, rough) | 6 at 512 (example config) | 6.9 GB | ~21 GB by its README; community says 20 GB+ | Tencent Hunyuan Community 2.1 | no report of paint on AMD | does not fit 16 GB; PBR is wasted on GoldSrc's one diffuse texture |
| MV-Adapter ig2mv (huanngzh/mv-adapter) | geometry (image + mesh) on SDXL or SD2.1 | 6 at 768 (SDXL) | 3.6 GB adapter + SDXL | SDXL ig2mv "more than 16 GB"; SD2.1 variant under 10 GB | Apache-2.0 | plain diffusers for the views; its texture baker needs CV-CUDA | takes any SDXL fine-tune as base; SDXL variant over budget here |
| Zero123++ v1.2 (sudo-ai/zero123plus-v1.2) | free | 6 fixed: azimuth 30-330 every 60, elevation 20 / -10 | 5.6 GB | ~5 GB, 5.7 with depth ControlNet | code Apache-2.0, weights CC-BY-NC 4.0 | plain diffusers custom pipeline | 320 px views: low for a face; objects more than people |
| Era3D (pengHTYX/MacLab-Era3D-512-6view) | free, with normals | 6 at 512 | 3.8 GB | not stated | AGPL-3.0 (code); weights tagged Apache-2.0 | xformers, tiny-cuda-nn, nvdiffrast in its install | AGPL and CUDA install |
| SV3D_u / _p (stabilityai/sv3d) | free, orbit video | 21 frames at 576 | 18.7 GB repo | not stated | Stability NC community | generative-models repo | a turntable, not a turnaround on a mesh |
| PSHuman (pengHTYX/PSHuman_Unclip_768_6views) | free, human-specific, with SMPL-X | 6-7 at 768 | ~5 GB | over 40 GB by its README | MIT code; weights not stated | CUDA 12.1 wheels, kaolin | too big |
| CharacterGen (zjp-shadow/CharacterGen), StdGEN (hyz317/StdGEN) | free, A-pose characters | 4 views | not checked | not checked | Apache-2.0 | not checked | trained on anime characters |
| Qwen-Image-Edit-2511 + Multiple-Angles LoRA (fal/Qwen-Image-Edit-2511-Multiple-Angles-LoRA) | free, by edit prompt | any of 8 azimuths x 4 elevations x 3 distances, at the edit model's resolution | 0.3 GB LoRA + 20B edit model (Q4 GGUF 12-13 GB) | Q4 just fits | LoRA Apache-2.0, model Apache-2.0 | GGUF path | trained on 3,000+ Gaussian-splat renders; no character examples |
| Qwen-Image-2.1 + Multiple-Angles LoRA (akhaliq/Qwen-Image-2.1-Multiple-Angles-LoRA, 2026-10-06) | free, by edit prompt | as above | 0.3 GB + rank 4 stack | as rank 4 | LoRA Apache-2.0; model Qwen Research | as rank 4 | eleven days old; untested by anyone we can cite |
```

Sources: Hunyuan3D-2's view list and 512 view size read from the local clone
(`local-3d/repos/Hunyuan3D-2/hy3dgen/texgen/pipelines.py` lines 40-45, `utils/multiview_utils.py` line 28,
commit f8db630) and its README [read: https://github.com/Tencent-Hunyuan/Hunyuan3D-2]; Hunyuan3D-2.1
[read: https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1]; MV-Adapter [read: https://github.com/huanngzh/MV-Adapter];
Zero123++ [read: https://github.com/SUDO-AI-3D/zero123plus]; Era3D [read: https://github.com/pengHTYX/Era3D];
SV3D [read: https://huggingface.co/stabilityai/sv3d]; PSHuman [read: https://github.com/pengHTYX/PSHuman];
the multiple-angles LoRA [read: https://huggingface.co/fal/Qwen-Image-Edit-2511-Multiple-Angles-LoRA];
licences of CharacterGen and StdGEN from the GitHub API.

**The route for the back.** Hunyuan3D-Paint 2.0's multiview net is the one already on disk, sized for 16 GB,
and conditioned on our own mesh. Its inputs are a reference picture plus, for each of six cameras, a normal map
and a position map of the mesh at 512 (`multiview_utils.py`, `__call__`). SMAK's renderer can draw both, so the
only CUDA part of Hunyuan's paint stage (`custom_rasterizer`) can be skipped: Python runs the net on pictures
SMAK made, and SMAK's `project` bakes the six views with its own visibility test. Two cautions: its views are
512, so the front stays the step-1 picture and the side views only fill what the front cannot see; and it was
trained on Objaverse objects, so it may paint a person's back plainly. The delight model (an InstructPix2Pix
fine-tune) can also take the baked-in light out of the front picture before projection.

The alternative for the back is a turnaround drawn by an editing model (rank 4's multiple-angles LoRA): sharper
and in the same style as the front, but not aligned, so it needs the silhouette camera fit first.

## 3. Bigger Hunyuan3D for the shape

```
| | 2mini (now) | 2.0 full | 2mv | 2.1 | 2.5 / 3.0 |
| Shape params | 0.6B | 1.1B | 1.1B | 3.3B | - |
| Weights for shape | in 12.3 GB repo | 24.6 GB fp32 folder (turbo 9.9) | in 14.8 GB repo | 7.4 GB DiT + 0.7 GB VAE | not open |
| VRAM, shape | ~5 GB measured | 6 GB (README) | 6 GB (README) | 10 GB (README) | - |
| On this card | runs | same code: should run | same code; several views in | not run here; a gfx1201 user hit empty marching-cubes results on 2.0 (issue 304); an RX 6900 XT ran 2.1 shape | API only |
```

Sources: README figures [read: https://github.com/Tencent-Hunyuan/Hunyuan3D-2,
https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1]; AMD reports
[read: https://github.com/Tencent-Hunyuan/Hunyuan3D-2/issues/304, https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1/issues/126,
https://github.com/Tencent-Hunyuan/Hunyuan3D-2/issues/373 (Turbo shape end to end on an 8 GB gfx1012, with
hipified custom_rasterizer)]; an open PR today adds head-chunked attention for shape on AMD
[read: https://github.com/Tencent-Hunyuan/Hunyuan3D-2/pull/382]; Tencent's Hugging Face organisation lists only
Hunyuan3D-1, 2, 2mini, 2mv, 2.1, Omni and Part [read: https://huggingface.co/api/models?author=tencent,
2026-10-17], so 2.5 and 3.0 are still not open, as `3d-fidelity-methods.md` found.

Would a bigger shape model beat 2mini on detail? Tencent's own 2.1 paper shows its paint beating 2.0 on CLIP-FID,
CMMD, CLIP-I and LPIPS, and its shape beating other models, but gives no 2.1 against 2mini row for shape. For
this use the question matters less: the mesh is cut to about 700 triangles, so what survives is the silhouette
and the big masses, and what tore in motion was arms fused to the torso, which comes from the picture's stance,
not the shape model's size (`generated-characters.md`). Two shape changes are worth more than a bigger single-
view model: a better-separated picture (sections 1 and 4), and 2mv fed the front plus side and back views from
section 2's turnaround, which gives the back its true shape instead of a hood. 2.1 shape fits (10 GB) and is a
reasonable later test; its paint does not fit.

## 4. The recommended stack

1. **Picture.** A new venv on the existing ROCm torch wheel (diffusers from main, for ZImageControlNetPipeline)
   with:
   - `Tongyi-MAI/Z-Image-Turbo`: `text_encoder/` (8.0 GB), `vae/` (0.17 GB), tokenizer and configs; the
     transformer as `unsloth/Z-Image-Turbo-GGUF` `z-image-turbo-Q8_0.gguf` (7.2 GB) instead of the 24.6 GB fp32
     folder (or the bf16 GGUF, 12.3 GB, if Q8 shows artefacts).
   - `alibaba-pai/Z-Image-Turbo-Fun-Controlnet-Union-2.1`: `Z-Image-Turbo-Fun-Controlnet-Union-2.1-lite-2602-8steps.safetensors`
     (2.0 GB) first, the full 2602 file (6.7 GB) if control is too weak. Check that the diffusers
     ZImageControlNetModel loads the 2.1 files (its example names the 1.0 and 2.0 repos; hlky's diffusers
     conversion is of 1.0).
   - Run in bf16, text encoder offloaded after encoding, 1024 x 1024 (or 768 x 1024 portrait), 8 steps, control
     scale 0.65 to 1.0, control picture = SMAK's OpenPose skeleton of the base (and/or its depth render).
   - Expected: ~13 GB VRAM peak [derived], roughly 20 to 40 s a picture [derived from 6B parameters, 4,600
     tokens and the measured 39 TFLOPS; not run].
2. **Face and hands.** Crop the head from the 1024 picture, upscale to 1024, redraw with ZImageInpaintPipeline
   or Img2Img at strength ~0.4, paste back. No new weights.
3. **Back and sides.** Hunyuan3D-Paint 2.0 turbo multiview net (on disk) fed SMAK's normal and position renders
   of the mesh; bake with `project`. No new weights. Needs a small Python entry in the worker and a renderer
   output in SMAK for the two map types.
4. **Shape.** Keep 2mini; try 2mv once step 3 or a turnaround gives side and back views. Download if tried:
   `tencent/Hunyuan3D-2mv` (`hunyuan3d-dit-v2-mv-turbo` folder, a few GB of its 14.8 GB repo).
5. **If step 1 falls short:** `Qwen/Qwen-Image-2.1-Turbo` with `unsloth/Qwen-Image-2.1-GGUF` Q8_0 (7.6 GB), the
   Qwen3-VL-8B encoder in int8 (Comfy-Org repackage, 9.4 GB; or bf16 17.5 GB kept in RAM), VAE 0.7 GB, and
   `alibaba-pai/Qwen-Image-2.1-Fun-Controlnet-Union` (7.6 GB, or the 3.8 GB int8 repackage). Research licence.

**Expected gain over SD-Turbo for this use.** Not measured; reasoned from the facts above:
- Pixels: a full-body figure at 1024 is ~900 px tall against ~450 at 512; the face goes from ~30 to ~70 px, and
  with step 2 to several hundred. A GoldSrc body texture is a few hundred pixels a side, so the gain is not
  texture resolution but whether small parts are drawn correctly at all (the face, lettering, straps, a
  holster), which is what separated Valve's barney from ours.
- Model: SD-Turbo is a 2023 one-to-four-step distillation of SD 2.1 at 512; Z-Image-Turbo is a 2025 6B DiT
  with a Qwen3 text encoder that follows long prompts (vest with straps, belt, holster, boots) instead of
  dropping words, which `generated-characters.md` saw SD-Turbo do ("SD-Turbo drops pose words").
- Stance: pose control replaces img2img over grey, so the colours are not pulled toward grey and the facing is
  fixed by the skeleton's left and right colours.
- Back: painted from mesh-aligned views instead of carried from the front.
- Cost: about 13 GB of new weights and one venv; seconds per picture rise from about one to tens.

## What is not verified

- None of the new models was run here. "Should run" means plain PyTorch/diffusers code with no CUDA-only part
  found, on a torch whose bf16 matmul and SDPA kernels were measured working today.
- That Z-Image-Turbo's Fun ControlNet 2.1 files load in diffusers' ZImageControlNetModel.
- That GGUF dequantisation in diffusers runs on ROCm (it is plain PyTorch by the docs).
- How Hunyuan3D-Paint 2.0 paints a person's back, and whether SMAK's normal and position renders match the
  convention the net was trained on (its `render_normal`/`render_position` in `differentiable_renderer/`
  define it; read before writing SMAK's).
- Speeds in section 4 are estimates, not measurements.

## Measured after install (2026-10-17)

Installed by `generators/install-3d.sh` into `/media/Data3/Packages/local-3d`: a venv `venvs/zimage-rocm` (torch
2.9.1+rocm6.4, diffusers 0.41.0, which has the Z-Image ControlNet pipeline in a release, transformers 5.20), and
in its HF cache `Tongyi-MAI/Z-Image-Turbo` without its fp32 transformer (text encoder 8.05 GB, VAE 0.17 GB),
`unsloth/Z-Image-Turbo-GGUF` Q8_0 (7.22 GB) and `alibaba-pai/Z-Image-Turbo-Fun-Controlnet-Union-2.1` lite 2602
(2.02 GB): 17.5 GB in all, not the 13 estimated above (the text encoder was counted short).

Found on the way, not in any card:
- The lite ControlNet file applies control at layers 0, 10 and 20 with both refiner layers
  (VideoX-Fun `config/z_image/z_image_control_2.1_lite.yaml`); diffusers 0.41 cannot tell that from the file
  and takes it for 1.0's layout. The install writes the right config beside the weights.
- `enable_model_cpu_offload` fails with this ControlNet (it borrows the transformer's embedders, left on the
  CPU). The 8 GB text encoder and the 9 GB transformer with ControlNet do not fit together: the worker swaps
  them on the card for each new prompt and keeps each prompt's embedding.
- The VAE's tiling starts only above its tile size, so a 1024 control picture's encoding asked 4.5 GB at once
  and ran out: its tile size is set to 512.

```
| | SD-Turbo (old route) | Z-Image-Turbo + ControlNet lite (new route) |
| Picture | 512, img2img 0.7 over a grey figure | 1024, held to an OpenPose picture of the base |
| Load (worker) | with Hunyuan3D, 85 s | 107 to 166 s |
| A picture | 0.27 s in bf16 (0.89 in fp16, which the worker used before) | 11.3 s (the first about 80: kernel set-up) |
| Card memory | 4.3 GB | 11.2 GB peak |
| The guard brief, 4 seeds | washed grey from the guide, no face or lettering, one from behind | all four facing front: blue shirt, blue-violet trousers, helmet and visor, black vest lettered SECURITY, holster, boots |
| Stance | held by the guide's grey | at control scale 0.8 all four strode ("runs and fights" in the brief); at 1.0 two stood in the stance, two strode |
```

One take through the whole route (`generate { kind: "shape", base }`, the real models): Z-Image's picture,
then Hunyuan3D-2mini's mesh of it in 41 s, 378 s in all with both loads; the mesh has the helmet, the vest's
plates, belt, holster and boots, and its arms and legs stand apart from the trunk.

bf16 for the worker's other models, one fixed seed: SD-Turbo 0.27 s against 0.89 in fp16, a different picture of
the same quality (bf16 now); Hunyuan3D-2mini 16.8 s against 14.8, 222,396 faces against 226,728, its box 1.18
wide and 0.71 deep against 0.95 and 0.93: no faster and its shape drifted, so it stays fp16.

**Three inputs, three routes** (Steven: "some of these models may work best with pictures; other models might
be better at replicating other models", "like real life pictures"), each kept until a test across several
examples picks:

```
| Input | Route now | Better candidates (sections 2 and 3) |
| Words or a brief | Z-Image-Turbo + pose ControlNet draws the picture, Hunyuan3D-2mini shapes it (built) | Qwen-Image-2.1 if Z-Image falls short |
| Real photographs (a person's photo of a real thing) | the photo to the shape model as it is (built: `picture`); BiRefNet cuts it | photo-trained shape models take it best; Hunyuan3D-Paint 2.0's delight model takes the photo's light out before projection |
| Renders of an existing game model (reproduction legs: flat-lit, known cameras) | the one picture to the shape model (built) | Hunyuan3D-2mv from front, side and back renders (not on disk: tencent/Hunyuan3D-2mv, the hunyuan3d-dit-v2-mv-turbo folder, a few GB of its 14.8 GB repo) |
```

Today `generate` tells words from a picture by its arguments (`prompt` alone, or `picture`). Telling a photograph
from a render would be one more argument, `source: "photo" | "render"`, or inferred from the picture (a render
is flat-lit on one plain colour with hard edges; the reproduction legs know they give renders). Not built: the
render route waits on 2mv, which is not installed.

## Sources (all checked 2026-10-17)

- Hugging Face API file lists and licence tags: https://huggingface.co/api/models/{repo}?blobs=true for every repo named above.
- Model cards: https://huggingface.co/Tongyi-MAI/Z-Image-Turbo, https://huggingface.co/alibaba-pai/Z-Image-Turbo-Fun-Controlnet-Union-2.1,
  https://huggingface.co/black-forest-labs/FLUX.2-klein-4B, https://huggingface.co/Qwen/Qwen-Image-2.1,
  https://huggingface.co/Qwen/Qwen-Image-2.1-Turbo, https://huggingface.co/Qwen/Qwen-Image-2.1/raw/main/LICENSE,
  https://huggingface.co/HiDream-ai/HiDream-I1-Fast, https://huggingface.co/HiDream-ai/HiDream-O1-Image,
  https://huggingface.co/black-forest-labs/flux-3-image-klein, https://huggingface.co/xinsir/controlnet-union-sdxl-1.0,
  https://huggingface.co/stabilityai/sv3d, https://huggingface.co/fal/Qwen-Image-Edit-2511-Multiple-Angles-LoRA.
- Diffusers: https://huggingface.co/docs/diffusers/main/en/api/pipelines/z_image,
  https://huggingface.co/docs/diffusers/main/en/api/pipelines/flux2,
  https://huggingface.co/docs/diffusers/main/en/quantization/gguf,
  https://raw.githubusercontent.com/huggingface/diffusers/main/src/diffusers/__init__.py.
- Leaderboards: https://artificialanalysis.ai/text-to-image/arena/leaderboard-text, https://x.com/arena/status/2102416020678008986.
- ROCm on this chip: https://rocm.blogs.amd.com/artificial-intelligence/comfyui-radeon-9000/README.html,
  https://github.com/Comfy-Org/ComfyUI/issues/7332, https://github.com/ROCm/ROCm/issues/4846,
  https://newreleases.io/project/github/ROCm/aotriton/release/0.14b, https://heise.de/-10392042,
  https://rocm.docs.amd.com/projects/comfyui/en/docs-26.04/how-to/hunyuan3d-workflow.html (Hunyuan3D 2.1 in
  ComfyUI on ROCm; no paint-stage detail),
  https://huggingface.co/docs/bitsandbytes/v0.50.0/installation (lists gfx1201 for ROCm 6.4.4+ builds).
- 3D: https://github.com/Tencent-Hunyuan/Hunyuan3D-2, https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1, issues
  304, 373 and PR 382 of the first and issue 126 of the second, https://github.com/huanngzh/MV-Adapter,
  https://github.com/SUDO-AI-3D/zero123plus, https://github.com/pengHTYX/Era3D, https://github.com/pengHTYX/PSHuman.
- In this repo: `research/generated-characters.md`, `research/3d-fidelity-methods.md`, `research/local-3d-generators.md`.
