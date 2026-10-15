#!/usr/bin/env bash
# Install the local music generators of research/local-music-generators.md (in SMAK). Run after install.sh
# (which makes venvs/audio-rocm, where MusicGen runs through transformers).
# Idempotent: a step already done is skipped or a no-op. Needs uv, git with GitHub ssh access, ffmpeg with
# libmp3lame. No sudo; the ROCm runtime comes inside the PyTorch wheels.
#   bash generators/install-music.sh <folder>   (after install.sh)
# Undo: delete venvs/acestep-rocm, repos/ACE-Step-1.5, weights/acestep and
# weights/hf/hub/models--facebook--musicgen-stereo-large (about 40 GB in all).
set -euo pipefail
ROOT=${1:?the generators folder: bash generators/install-music.sh <folder>}
mkdir -p "$ROOT" && cd "$ROOT"
# uv's cache: UV_CACHE_DIR when set; on this machine local-3d's, so the torch wheels hardlink; else beside the models
[ -n "${UV_CACHE_DIR:-}" ] || { [ -d /media/Data3/Packages/local-3d/.uv-cache ] && export UV_CACHE_DIR=/media/Data3/Packages/local-3d/.uv-cache || export UV_CACHE_DIR=$PWD/.uv-cache; }
export HF_HOME=$PWD/weights/hf
mkdir -p repos venvs weights/acestep out/music
[ -x venvs/audio-rocm/bin/python ] || { echo "run generators/install.sh <folder> first (venvs/audio-rocm)"; exit 1; }

# ACE-Step 1.5: its own venv, since it wants diffusers >= 0.37 and TangoFlux (in audio-rocm) wants < 0.36.
# Its pyproject pins CUDA torch; the ROCm requirements file is used instead, with the same ROCm torch as
# audio-rocm, and the package itself installed with --no-deps.
[ -d repos/ACE-Step-1.5 ] || git clone -q git@github.com:ace-step/ACE-Step-1.5.git repos/ACE-Step-1.5
git -C repos/ACE-Step-1.5 checkout -q ca1e85f
P=venvs/acestep-rocm/bin/python
[ -x "$P" ] || uv venv -q -p 3.12 venvs/acestep-rocm
uv pip install -q -p "$P" --index-url https://download.pytorch.org/whl/rocm6.4 torch==2.9.1 torchvision==0.24.1 torchaudio==2.9.1
uv pip install -q -p "$P" -r repos/ACE-Step-1.5/requirements-rocm-linux.txt diskcache python-multipart typer-slim \
  pytorch-wavelets pywavelets "setuptools<72" "diffusers>=0.37"
# torchao newer than 0.16 imports torch.nn.functional.ScalingType, which torch 2.9 lacks: transformers then
# fails to load ACE-Step's DiT. The project's own pin is >=0.16,<0.17.
uv pip install -q -p "$P" "torchao==0.16.0"
uv pip install -q -p "$P" --no-deps -e repos/ACE-Step-1.5

# weights: the main model (turbo DiT, VAE, text encoder, 1.7B planner) and the XL turbo DiT, into weights/acestep
# (the code finds them by ACESTEP_CHECKPOINTS_DIR)
"$P" -I -c "
from huggingface_hub import snapshot_download as d
d('ACE-Step/Ace-Step1.5', local_dir='weights/acestep')
d('ACE-Step/acestep-v15-xl-turbo', local_dir='weights/acestep/acestep-v15-xl-turbo')"

# MusicGen stereo large (CC-BY-NC weights), into the shared HF cache, for venvs/audio-rocm
venvs/audio-rocm/bin/python -I -c "
from huggingface_hub import snapshot_download as d
d('facebook/musicgen-stereo-large', allow_patterns=['*.json','*.safetensors','*.model','*.txt'])"

"$P" -I -c "import torch, torchao; print('acestep-rocm: torch', torch.__version__, 'torchao', torchao.__version__, 'GPU', torch.cuda.is_available())" 2>&1 | grep -v amdgpu.ids
