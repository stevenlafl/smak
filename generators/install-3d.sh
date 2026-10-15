#!/usr/bin/env bash
# Install the local 3D generator of research/local-3d-generators.md (in SMAK): Hunyuan3D-2mini (a shape from a
# picture), SD-Turbo (a picture from words, for a prompt with no picture) and BiRefNet (cutting the subject out).
# Idempotent: a step already done is skipped or a no-op. Needs uv and git with GitHub ssh access. No sudo; the
# ROCm runtime comes inside the PyTorch wheels.
#   bash generators/install-3d.sh <folder>      (here: /media/Data3/Packages/local-3d)
# Undo: delete venvs/torch-rocm, repos/Hunyuan3D-2 and weights/ (about 40 GB in all).
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
