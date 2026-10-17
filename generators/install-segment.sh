#!/usr/bin/env bash
# The subject finders and the mask cutter for the generators' folder: a named subject found in a picture by
# open-vocabulary detection (OWLv2, Grounding DINO, YOLO-World) and cut by SAM 2 from its box. Read by
# generators/segment.py, which the tool generate (`subject`) and src/maps/photo.mjs run.
#
#   bash generators/install-segment.sh <the local-3d folder>      (/media/Data3/Packages/local-3d here)
#
# Idempotent: a venv or a model already there is kept. Caches stay in the folder (never ~/.cache). Undo: delete
# venvs/segment-rocm (15.4 GB as du reads it alone, but the ROCm torch wheel is hardlinked from the uv cache: about 0.46 GB more on disk) and the three models under weights/hf/hub (google--owlv2-base-patch16-ensemble,
# IDEA-Research--grounding-dino-base, facebook--sam2.1-hiera-small) and weights/yolo.
set -euo pipefail
cd "${1:?the local-3d folder}"
[ -n "${UV_CACHE_DIR:-}" ] || export UV_CACHE_DIR=$PWD/.uv-cache
export HF_HOME=$PWD/weights/hf YOLO_CONFIG_DIR=$PWD/weights/yolo
S=venvs/segment-rocm/bin/python
[ -x "$S" ] || uv venv -q -p 3.12 venvs/segment-rocm
uv pip install -q -p "$S" --index-url https://download.pytorch.org/whl/rocm6.4 torch torchvision
uv pip install -q -p "$S" transformers accelerate safetensors huggingface_hub Pillow numpy ultralytics ftfy \
  "clip @ git+https://github.com/ultralytics/CLIP.git@7ffa84b3bfa40c42ecc1c77147a855e69cb2dd40"
# the weights: the detectors and the cutter from the Hugging Face hub; YOLO-World's from its own release
"$S" -I -c "
from huggingface_hub import snapshot_download
for repo in ['google/owlv2-base-patch16-ensemble', 'IDEA-Research/grounding-dino-base', 'facebook/sam2.1-hiera-small']:
    print(repo, snapshot_download(repo, ignore_patterns=['*.bin', '*.pt', '*.msgpack', '*.h5']))
"
mkdir -p weights/yolo
# YOLO-World and its text encoder (CLIP ViT-B/32, 338 MB, fetched on first use) into weights/yolo and
# weights/yolo/clip: Ultralytics reads weights_dir when imported, so one run writes the settings file and the
# next fetches the weights
( cd weights/yolo && "../../$S" -I -c "
from ultralytics import settings
import os; settings.update({'weights_dir': os.getcwd()})" && "../../$S" -I -c "
from ultralytics import YOLOWorld
m = YOLOWorld('yolov8x-worldv2.pt'); m.set_classes(['a chair'])" )
"$S" -I -c "import torch, transformers, ultralytics; print('segment-rocm: torch', torch.__version__, 'transformers', transformers.__version__, 'ultralytics', ultralytics.__version__, 'GPU', torch.cuda.is_available())" 2>&1 | grep -v amdgpu.ids
