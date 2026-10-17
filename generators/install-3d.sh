#!/usr/bin/env bash
# Install the local 3D generator of research/local-3d-generators.md (in SMAK): Hunyuan3D-2mini (a shape from a
# picture), SD-Turbo (a picture from words, for a prompt with no picture) and BiRefNet (cutting the subject out);
# and Z-Image-Turbo with its pose ControlNet, a character's picture from words held to its base's pose.
# Idempotent: a step already done is skipped or a no-op. Needs uv and git with GitHub ssh access. No sudo; the
# ROCm runtime comes inside the PyTorch wheels.
#   bash generators/install-3d.sh <folder>      (here: /media/Data3/Packages/local-3d)
# Undo: delete venvs/torch-rocm, venvs/zimage-rocm, repos/Hunyuan3D-2 and weights/ (about 57 GB in all).
set -euo pipefail
ROOT=${1:?the 3D generators folder: bash generators/install-3d.sh <folder>}
mkdir -p "$ROOT" && cd "$ROOT"
[ -n "${UV_CACHE_DIR:-}" ] || export UV_CACHE_DIR=$PWD/.uv-cache
export HF_HOME=$PWD/weights/hf U2NET_HOME=$PWD/weights/u2net
mkdir -p repos venvs weights out
P=venvs/torch-rocm/bin/python

[ -d repos/Hunyuan3D-2 ] || git clone -q git@github.com:Tencent/Hunyuan3D-2.git repos/Hunyuan3D-2
git -C repos/Hunyuan3D-2 checkout -q f8db630
[ -x "$P" ] || uv venv -q -p 3.12 venvs/torch-rocm
uv pip install -q -p "$P" --index-url https://download.pytorch.org/whl/rocm6.4 torch torchvision
# transformers 5 renames the DINOv2 weights Hunyuan3D-2 loads; diffusers 0.41 needs huggingface_hub 1, which
# transformers 4 refuses
uv pip install -q -p "$P" filelock Pillow tqdm scikit-image scipy numpy trimesh pyyaml fast-simplification xatlas \
  einops opencv-python-headless omegaconf pymeshlab pygltflib rembg onnxruntime safetensors accelerate soundfile \
  "transformers<5" "diffusers<0.36" "huggingface_hub<1"
uv pip install -q -p "$P" --no-deps -e repos/Hunyuan3D-2

"$P" -I -c "
from huggingface_hub import snapshot_download as d
d('tencent/Hunyuan3D-2mini', allow_patterns=['hunyuan3d-dit-v2-mini/*'])
d('stabilityai/sd-turbo', allow_patterns=['*.json', '*.txt', '*fp16.safetensors'])
from rembg import new_session; new_session('birefnet-general')"
"$P" -I -c "import torch; print('torch-rocm: torch', torch.__version__, 'GPU', torch.cuda.is_available())" 2>&1 | grep -v amdgpu.ids

# A character's picture (research/character-image-models.md): Z-Image-Turbo, its transformer as a Q8 GGUF (7.2 GB
# in place of the repo's 24.6 GB fp32), its Qwen3-4B text encoder (8 GB) and VAE, and the Fun ControlNet Union 2.1
# lite (2 GB), all Apache-2.0, in a venv of their own (diffusers 0.41 has the Z-Image pipelines; Hunyuan3D-2's
# venv keeps diffusers under 0.36). About 17.5 GB of weights. Undo: venvs/zimage-rocm, weights/zimage-controlnet-2.1-lite,
# and the three models' folders under weights/hf/hub.
Z=venvs/zimage-rocm/bin/python
[ -x "$Z" ] || uv venv -q -p 3.12 venvs/zimage-rocm
uv pip install -q -p "$Z" --index-url https://download.pytorch.org/whl/rocm6.4 torch torchvision
uv pip install -q -p "$Z" "diffusers>=0.41" transformers accelerate safetensors gguf huggingface_hub Pillow numpy
"$Z" -I -c "
from huggingface_hub import snapshot_download as d, hf_hub_download as f
d('Tongyi-MAI/Z-Image-Turbo', allow_patterns=['model_index.json', 'scheduler/*', 'text_encoder/*', 'tokenizer/*', 'vae/*', 'transformer/config.json'])
f('unsloth/Z-Image-Turbo-GGUF', 'z-image-turbo-Q8_0.gguf')
f('alibaba-pai/Z-Image-Turbo-Fun-Controlnet-Union-2.1', 'Z-Image-Turbo-Fun-Controlnet-Union-2.1-lite-2602-8steps.safetensors')"
# the lite file applies control at three layers (VideoX-Fun's config/z_image/z_image_control_2.1_lite.yaml), which
# diffusers cannot tell from the file and would take for 1.0's
mkdir -p weights/zimage-controlnet-2.1-lite
cat > weights/zimage-controlnet-2.1-lite/config.json <<'JSON'
{
  "_class_name": "ZImageControlNetModel",
  "add_control_noise_refiner": "control_noise_refiner",
  "all_f_patch_size": [1],
  "all_patch_size": [2],
  "control_in_dim": 33,
  "control_layers_places": [0, 10, 20],
  "control_refiner_layers_places": [0, 1],
  "dim": 3840,
  "n_heads": 30,
  "n_kv_heads": 30,
  "n_refiner_layers": 2,
  "norm_eps": 1e-05,
  "qk_norm": true
}
JSON
"$Z" -I -c "import diffusers, torch; print('zimage-rocm: diffusers', diffusers.__version__, 'GPU', torch.cuda.is_available())" 2>&1 | grep -v amdgpu.ids
