#!/usr/bin/env bash
# The learned-matching venv for a map's pictures (src/maps/photo.mjs, generators/photogrammetry.py's `learned`
# steps): PyTorch on ROCm, LightGlue with DISK (matching a shot to a render of the map, and shots to each other)
# and VGGT (cameras and dense points from a few uncalibrated shots in one pass). Apart from the CPU-only
# photogrammetry venv, which stays small. The venv is about 15 GB (ROCm's PyTorch wheels); weights on first use:
# DISK and its LightGlue (50 MB), VGGT-1B's safetensors (5.0 GB), all under <folder>/weights, never ~/.cache.
# Licences: LightGlue Apache-2.0, DISK (kornia) Apache-2.0, VGGT's code the VGGT Licence (research, with an
# acceptable-use policy), VGGT-1B's weights CC-BY-NC-4.0 (non-commercial). Idempotent.
#
#   bash generators/install-learned-match.sh <folder> [--weights]    e.g. /media/Data3/Packages/local-3d
#
# --weights fetches the weights now (else on first use). Then: SMAK_LEARNED_MATCH=<folder>/venvs/learned-match/bin/python
# Undo: delete <folder>/venvs/learned-match, <folder>/weights/torch-hub and VGGT-1B under <folder>/weights/hf.
set -euo pipefail
folder="${1:?the folder to make the venv under, e.g. /media/Data3/Packages/local-3d}"
export UV_CACHE_DIR="$folder/.uv-cache" XDG_CACHE_HOME="$folder/.cache" HF_HOME="$folder/weights/hf" TORCH_HOME="$folder/weights/torch-hub"
venv="$folder/venvs/learned-match"
P="$venv/bin/python"
if [ ! -x "$P" ]; then
  mkdir -p "$folder/venvs"
  uv venv -q -p 3.12 "$venv"
fi
uv pip install -q -p "$P" --index-url https://download.pytorch.org/whl/rocm6.4 torch torchvision
uv pip install -q -p "$P" opencv-python-headless numpy huggingface_hub einops safetensors pillow kornia
uv pip install -q -p "$P" "lightglue @ git+https://github.com/cvg/LightGlue.git" "vggt @ git+https://github.com/facebookresearch/vggt.git"
"$P" -I -c 'import torch, lightglue, vggt, cv2; print("learned-match venv: torch", torch.__version__, "GPU", torch.cuda.is_available(), "opencv", cv2.__version__)' 2>&1 | grep -v amdgpu.ids
if [ "${2:-}" = "--weights" ]; then
  "$P" -I -c 'from lightglue import LightGlue, DISK; DISK(max_num_keypoints=2048); LightGlue(features="disk"); print("DISK and LightGlue weights")'
  # the repo keeps the same weights twice (model.pt and model.safetensors): only what from_pretrained reads
  "$P" -I -c 'from huggingface_hub import snapshot_download; print(snapshot_download("facebook/VGGT-1B", allow_patterns=["*.json", "*.safetensors", "*.md"]))'
fi
echo "SMAK_LEARNED_MATCH=$P"
