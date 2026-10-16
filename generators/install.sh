#!/usr/bin/env bash
# Install the local sound generators of research/local-sound-generators.md (in SMAK) from nothing.
# Idempotent: a step already done is skipped or a no-op. Needs uv, git with GitHub ssh access, gh (for the
# Woosh release), curl, sox, and HF_TOKEN in the environment for Stable Audio 3 (gated). No sudo; the ROCm
# runtime comes inside the PyTorch wheels.
#   bash generators/install.sh <folder>      (here: /media/Data3/Packages/local-audio)
# Undo: delete venvs/{audio-rocm,moss-rocm,sa3-rocm}, repos/{TangoFlux,Woosh,EzAudio,MOSS-TTS,stable-audio-3},
# weights/ (about 70 GB in all).
set -euo pipefail
ROOT=${1:?the generators folder: bash generators/install.sh <folder>}
mkdir -p "$ROOT" && cd "$ROOT"
# uv's cache: UV_CACHE_DIR when set; on this machine local-3d's, so the torch wheels hardlink; else beside the models
[ -n "${UV_CACHE_DIR:-}" ] || { [ -d /media/Data3/Packages/local-3d/.uv-cache ] && export UV_CACHE_DIR=/media/Data3/Packages/local-3d/.uv-cache || export UV_CACHE_DIR=$PWD/.uv-cache; }
export HF_HOME=$PWD/weights/hf
mkdir -p repos venvs weights/woosh weights/ezaudio/vae out
P=venvs/audio-rocm/bin/python

clone() { [ -d "repos/$1" ] || git clone -q "$2" "repos/$1"; git -C "repos/$1" checkout -q "$3"; }
clone TangoFlux git@github.com:declare-lab/TangoFlux.git 164420f
clone Woosh git@github.com:SonyResearch/Woosh.git 7f238bb
clone EzAudio git@github.com:haidog-yaqub/EzAudio.git 86f1826

[ -x "$P" ] || uv venv -p 3.12 venvs/audio-rocm
uv pip install -p "$P" --index-url https://download.pytorch.org/whl/rocm6.4 torch==2.9.1 torchvision==0.24.1 torchaudio==2.9.1
# transformers >= 4.57 for Woosh, < 5 and diffusers < 0.36 for TangoFlux; the projects' own pins (torch 2.4,
# transformers 4.44, torch 2.8 for CUDA) are ignored by installing them with --no-deps
uv pip install -p "$P" "transformers>=4.57.2,<5" "diffusers<0.36" "huggingface_hub<1" "datasets<4" accelerate \
  sentencepiece protobuf torchlibrosa librosa soundfile tqdm einops "hydra-core>=1.3.2" "lightning>=2.5.6" \
  "timm>=1.0.22" "torchdiffeq>=0.2.5" "pydantic>=2.12.4" omegaconf av requests safetensors scipy pyyaml \
  alias_free_torch vector_quantize_pytorch julius torch_stoi flatten-dict argbind randomname pandas tensorboard \
  ffmpy rich importlib_resources matplotlib encodec ipython
uv pip install -p "$P" --no-deps hear21passt==0.0.26 -e repos/TangoFlux -e repos/Woosh

# Woosh: the text-to-audio parts of the v1.0.0 release (about 6.3 GB zipped)
if [ ! -f weights/woosh/checkpoints/Woosh-Flow/weights.safetensors ]; then
  (cd weights/woosh && gh release download v1.0.0 -R SonyResearch/Woosh --skip-existing \
     -p Woosh-AE.zip -p Woosh-CLAP.zip -p Woosh-Flow.zip -p Woosh-DFlow.zip -p TextConditionerA.zip \
   && for z in *.zip; do unzip -q -o "$z"; done)
fi
# EzAudio: the XL model and its VAE, the VAE's config beside it (its loader looks there)
[ -f weights/ezaudio/ezaudio_s3_xl.pt ] || curl -sSL -o weights/ezaudio/ezaudio_s3_xl.pt \
  https://huggingface.co/OpenSound/EzAudio/resolve/main/ckpts/s3/ezaudio_s3_xl.pt
[ -f weights/ezaudio/vae/1m.pt ] || curl -sSL -o weights/ezaudio/vae/1m.pt \
  https://huggingface.co/OpenSound/EzAudio/resolve/main/ckpts/vae/1m.pt
cp --update=none repos/EzAudio/ckpts/vae/config.json weights/ezaudio/vae/config.json
# TangoFlux and EzAudio's text encoder (flan-t5-xl) come from Hugging Face on first use, into weights/hf
"$P" -I -c "from huggingface_hub import snapshot_download as d; d('declare-lab/TangoFlux'); d('google/flan-t5-xl', allow_patterns=['*.json','*.model','*.safetensors'])"

# MOSS-SoundEffect v2.0 (Apache-2.0) and Stable Audio 3 small SFX (Stability AI Community Licence), each in a venv
# of its own on the same torch 2.9.1 ROCm wheels (their CUDA pins ignored): MOSS's descript-audiotools takes
# protobuf down to 3.19 and it pins diffusers 0.37, where audio-rocm keeps diffusers < 0.36 for TangoFlux; Stable
# Audio 3 wants transformers >= 5.8 and huggingface_hub >= 1.7. Neither needs flash-attn.
clone MOSS-TTS git@github.com:OpenMOSS/MOSS-TTS.git 934d682
clone stable-audio-3 git@github.com:Stability-AI/stable-audio-3.git 77e0398
M=venvs/moss-rocm/bin/python
[ -x "$M" ] || uv venv -p 3.12 venvs/moss-rocm
uv pip install -p "$M" --index-url https://download.pytorch.org/whl/rocm6.4 torch==2.9.1 torchvision==0.24.1 torchaudio==2.9.1
uv pip install -p "$M" "numpy<2" einops safetensors "transformers==4.57.1" "diffusers==0.37.1" ftfy regex soundfile \
  imageio "descript-audiotools==0.7.2" tqdm pillow accelerate "huggingface_hub<1"
uv pip install -p "$M" --no-deps -e repos/MOSS-TTS/moss_soundeffect_v2
S=venvs/sa3-rocm/bin/python
[ -x "$S" ] || uv venv -p 3.12 venvs/sa3-rocm
uv pip install -p "$S" --index-url https://download.pytorch.org/whl/rocm6.4 torch==2.9.1 torchaudio==2.9.1
uv pip install -p "$S" "einops>=0.8.2" "einops-exts>=0.0.4" "numpy>=2.2.6" packaging "safetensors>=0.7.0" tqdm \
  "huggingface-hub>=1.7.1" "transformers>=5.8.0" "soundfile>=0.13.1" sentencepiece
uv pip install -p "$S" --no-deps -e repos/stable-audio-3
# MOSS's weights (11.2 GB, not gated) into weights/moss-sfx, at the revision tested
[ -f weights/moss-sfx/transformer/diffusion_pytorch_model.safetensors ] || "$M" -I -c "from huggingface_hub import \
snapshot_download as d; d('OpenMOSS-Team/MOSS-SoundEffect-v2.0', revision='e35df4d82fbe87fcd5d14e5d100e349c0c3c076d', local_dir='weights/moss-sfx')"
# Stable Audio 3's (3.5 GB) into weights/hf. Gated: its terms accepted on Hugging Face by the account whose read
# token is in HF_TOKEN (the environment only; never written here). Without it this step says so and goes on.
"$S" -I -c "
import os
from huggingface_hub import snapshot_download as d, hf_hub_download as h
R, V = 'stabilityai/stable-audio-3-small-sfx', '05ca3857881c94a2b84026b1111c537d78f5f9f0'
try:  # the checkpoints themselves: the card alone is not gated, so its snapshot folder can be there without them
    for f in ('model.safetensors', 't5gemma-b-b-ul2/model.safetensors'): h(R, f, revision=V, local_files_only=True)
    print('stable-audio-3-small-sfx: in the cache')
except Exception:
    try:
        d(R, revision=V); print('stable-audio-3-small-sfx: downloaded')
    except Exception as e:
        print(f'stable-audio-3-small-sfx NOT downloaded ({type(e).__name__}): set HF_TOKEN, and accept the terms at https://huggingface.co/{R}')
"
"$P" -I -c "import torch; print('torch', torch.__version__, 'GPU', torch.cuda.is_available())" 2>&1 | grep -v amdgpu.ids
