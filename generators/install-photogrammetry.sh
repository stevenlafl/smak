#!/usr/bin/env bash
# The photogrammetry venv for a map's pictures (src/maps/photo.mjs, generators/photogrammetry.py): OpenCV for
# features and PnP, pycolmap for structure from motion and bundle adjustment, numpy. CPU only, about 350 MB; no
# model weights. Idempotent: run it again and it finds what is there.
#
#   bash generators/install-photogrammetry.sh <folder>      e.g. /media/Data3/Packages/local-3d
#
# Makes <folder>/venvs/photogrammetry with Python 3.12 (uv). Its caches go under <folder> too, never ~/.cache.
# Then give the server or the command line its python: SMAK_PHOTOGRAMMETRY=<folder>/venvs/photogrammetry/bin/python
# (or --python). Undo: delete <folder>/venvs/photogrammetry.
set -euo pipefail
folder="${1:?the folder to make the venv under, e.g. /media/Data3/Packages/local-3d}"
export UV_CACHE_DIR="$folder/.uv-cache" XDG_CACHE_HOME="$folder/.cache"
venv="$folder/venvs/photogrammetry"
if [ ! -x "$venv/bin/python" ]; then
  mkdir -p "$folder/venvs"
  uv venv -q -p 3.12 "$venv"
fi
uv pip install -q -p "$venv/bin/python" opencv-python-headless pycolmap numpy
"$venv/bin/python" -c 'import cv2, pycolmap, numpy; print("photogrammetry venv:", "opencv", cv2.__version__, "pycolmap", pycolmap.__version__, "numpy", numpy.__version__)'
echo "SMAK_PHOTOGRAMMETRY=$venv/bin/python"
