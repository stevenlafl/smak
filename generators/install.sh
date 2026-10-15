#!/usr/bin/env bash
# Install the local sound generators of research/local-sound-generators.md (in SMAK) from nothing.
# Idempotent: a step already done is skipped or a no-op. Needs uv, git with GitHub ssh access, gh (for the
# Woosh release), curl, sox. No sudo; the ROCm runtime comes inside the PyTorch wheels.
#   bash generators/install.sh <folder>      (here: /media/Data3/Packages/local-audio)
# Undo: delete venvs/audio-rocm, repos/{TangoFlux,Woosh,EzAudio}, weights/ (about 50 GB in all).
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
"$P" -I -c "import torch; print('torch', torch.__version__, 'GPU', torch.cuda.is_available())" 2>&1 | grep -v amdgpu.ids
