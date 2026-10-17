"""Hunyuan3D-Paint 2.0 turbo's six views of a mesh from one picture, on ROCm, without its CUDA rasterizer.

Its normal and position maps are drawn here in numpy, exactly as its MeshRender draws them (the mesh turned and
scaled as set_mesh does, get_mv_matrix's cameras, the orthographic box of 1.2, custom_rasterizer's pixel and depth
convention: row 0 at the bottom, the nearest kept), then its delight model and its multiview diffusion run as its
pipeline runs them. The views are written as PNGs, cut out by the mesh's mask, with their cameras (views.json):
SMAK's project bakes them, view 1 (azimuth 90) at yaw 90, its left, and view 3 at yaw 270. Weights from the Hunyuan3D-2 snapshot already on disk; nothing downloaded.

  python paint_views.py <mesh.obj> <reference.png> <out dir> [--steps 10]
"""
import argparse
import json
import math
import os
import sys
import time
from pathlib import Path

import numpy as np
import torch
import trimesh
from PIL import Image

REPO = Path("/media/Data3/Packages/local-3d/repos/Hunyuan3D-2")
SNAP = Path("/media/Data3/Packages/local-3d/weights/hf/hub/models--tencent--Hunyuan3D-2/snapshots/9cd649ba6913f7a852e3286bad86bfa9a2d83dcf")
AZIMS = [0, 90, 180, 270, 0, 180]
ELEVS = [0, 0, 0, 0, 90, -90]
ORTHO = 1.2
DISTANCE = 1.45
SCALE = 1.15
SIZE = 512


def mv_matrix(elev, azim):
    # get_mv_matrix
    elev, azim = -elev, azim + 90
    e, a = math.radians(elev), math.radians(azim)
    cam = np.array([DISTANCE * math.cos(e) * math.cos(a), DISTANCE * math.cos(e) * math.sin(a), DISTANCE * math.sin(e)])
    look = -cam / np.linalg.norm(cam)
    up = np.array([0, 0, 1.0])
    right = np.cross(look, up)
    if np.linalg.norm(right) < 1e-9:  # straight up or down: the cross is nothing; take +x as right
        right = np.array([1.0, 0, 0]) if elev > 0 else np.array([-1.0, 0, 0])
    right /= np.linalg.norm(right)
    up = np.cross(right, look)
    up /= np.linalg.norm(up)
    R = np.stack([right, up, -look], axis=-1)
    w2c = np.eye(4)
    w2c[:3, :3] = R.T
    w2c[:3, 3] = -R.T @ cam
    return w2c


def ortho():
    o = np.eye(4)
    l, r, b, t, n, f = -ORTHO / 2, ORTHO / 2, -ORTHO / 2, ORTHO / 2, 0.1, 100
    o[0, 0], o[1, 1], o[2, 2] = 2 / (r - l), 2 / (t - b), -2 / (f - n)
    o[0, 3], o[1, 3], o[2, 3] = -(r + l) / (r - l), -(t + b) / (t - b), -(f + n) / (f - n)
    return o


def rasterize(clip, faces, values, size, bg):
    """custom_rasterizer's convention: pixel = (ndc * 0.5 + 0.5) * (size - 1) + 0.5, row 0 at ndc y -1, nearest kept."""
    ndc = clip[:, :3] / clip[:, 3:4]
    px = (ndc[:, 0] * 0.5 + 0.5) * (size - 1) + 0.5
    py = (ndc[:, 1] * 0.5 + 0.5) * (size - 1) + 0.5
    d = ndc[:, 2] * 0.49999 + 0.5
    zbuf = np.full((size, size), np.inf)
    out = np.tile(np.array(bg, dtype=np.float64), (size, size, 1))
    for f in faces:
        x0, x1, x2 = px[f]
        y0, y1, y2 = py[f]
        lo_x, hi_x = int(max(0, math.floor(min(x0, x1, x2)))), int(min(size - 1, math.ceil(max(x0, x1, x2))))
        lo_y, hi_y = int(max(0, math.floor(min(y0, y1, y2)))), int(min(size - 1, math.ceil(max(y0, y1, y2))))
        if lo_x > hi_x or lo_y > hi_y:
            continue
        area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0)
        if abs(area) < 1e-12:
            continue
        xs, ys = np.meshgrid(np.arange(lo_x, hi_x + 1) + 0.5, np.arange(lo_y, hi_y + 1) + 0.5)
        w1 = ((xs - x0) * (y2 - y0) - (x2 - x0) * (ys - y0)) / area
        w2 = ((x1 - x0) * (ys - y0) - (xs - x0) * (y1 - y0)) / area
        w0 = 1 - w1 - w2
        inside = (w0 >= 0) & (w1 >= 0) & (w2 >= 0)
        if not inside.any():
            continue
        z = w0 * d[f[0]] + w1 * d[f[1]] + w2 * d[f[2]]
        sub = zbuf[lo_y:hi_y + 1, lo_x:hi_x + 1]
        near = inside & (z < sub)
        if not near.any():
            continue
        sub[near] = z[near]
        val = w0[..., None] * values[f[0]] + w1[..., None] * values[f[1]] + w2[..., None] * values[f[2]]
        out[lo_y:hi_y + 1, lo_x:hi_x + 1][near] = val[near]
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("mesh")
    ap.add_argument("reference")
    ap.add_argument("out")
    ap.add_argument("--steps", type=int, default=10)
    a = ap.parse_args()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    t0 = time.time()
    mesh = trimesh.load(a.mesh, force="mesh")
    # set_mesh: x and y negated, then y and z swapped; centred and scaled into a sphere of 1.15 across
    pos = np.array(mesh.vertices, dtype=np.float64)
    pos[:, [0, 1]] = -pos[:, [0, 1]]
    pos[:, [1, 2]] = pos[:, [2, 1]]
    centre = (pos.max(0) + pos.min(0)) / 2
    scale = np.linalg.norm(pos - centre, axis=1).max() * 2.0
    pos = (pos - centre) * (SCALE / scale)
    faces = np.array(mesh.faces)
    fn = np.cross(pos[faces[:, 1]] - pos[faces[:, 0]], pos[faces[:, 2]] - pos[faces[:, 0]])
    fn /= np.linalg.norm(fn, axis=1, keepdims=True) + 1e-12
    vn = trimesh.geometry.mean_vertex_normals(vertex_count=len(pos), faces=faces, face_normals=fn)
    position_value = 0.5 - pos / SCALE
    normals, positions = [], []
    P = ortho()
    for elev, azim in zip(ELEVS, AZIMS):
        mv = mv_matrix(elev, azim)
        clip = (np.c_[pos, np.ones(len(pos))] @ mv.T) @ P.T
        n = rasterize(clip, faces, (vn + 1) * 0.5, SIZE, [1, 1, 1])
        p = rasterize(clip, faces, position_value, SIZE, [1, 1, 1])
        normals.append(Image.fromarray((np.clip(n, 0, 1) * 255).astype(np.uint8)))
        positions.append(Image.fromarray((np.clip(p, 0, 1) * 255).astype(np.uint8)))
    # the rasterizer's row 0 is ndc y -1, and its camera's up comes out at the top as PIL writes it: kept as drawn
    for i, (n, p) in enumerate(zip(normals, positions)):
        n.save(out / f"normal_{i}.png")
        p.save(out / f"position_{i}.png")
    print(f"maps drawn in {time.time() - t0:.1f} s", flush=True)

    sys.path.insert(0, str(REPO))
    from hy3dgen.texgen.utils.dehighlight_utils import Light_Shadow_Remover
    from hy3dgen.texgen.utils.multiview_utils import Multiview_Diffusion_Net

    class Config:
        device = "cuda"
        light_remover_ckpt_path = str(SNAP / "hunyuan3d-delight-v2-0")
        multiview_ckpt_path = str(SNAP / "hunyuan3d-paint-v2-0-turbo")
        pipe_name = "hunyuanpaint-turbo"

    reference = Image.open(a.reference)
    # recenter_image: the subject cropped by its alpha, a fifth of its size round it, on a transparent square
    if reference.mode == "RGBA":
        alpha = np.array(reference)[:, :, 3]
        rows, cols = np.nonzero(alpha)
        crop = reference.crop((cols.min(), rows.min(), cols.max() + 1, rows.max() + 1))
        w, h = crop.size
        side = max(int(w * 1.4), int(h * 1.4))
        square = Image.new("RGBA", (side, side), (255, 255, 255, 0))
        square.paste(crop, ((side - int(w * 1.4)) // 2 + int(w * 0.2), (side - int(h * 1.4)) // 2 + int(h * 0.2)))
        reference = square
    t1 = time.time()
    light = Light_Shadow_Remover(Config)
    delit = light(reference)
    delit.save(out / "reference_delit.png")
    del light
    torch.cuda.empty_cache()
    print(f"delit in {time.time() - t1:.1f} s, peak {torch.cuda.max_memory_allocated() / 1e9:.1f} GB", flush=True)
    t2 = time.time()
    # its unet's loader asks for diffusion_pytorch_model.bin; the snapshot holds the same weights as .safetensors
    from safetensors.torch import load_file
    torch_load = torch.load

    def load(path, *args, **kwargs):
        p = str(path)
        if p.endswith(".bin") and not os.path.exists(p) and os.path.exists(p[:-4] + ".safetensors"):
            # the safetensors carry an image-prompt adapter (image_proj_model, to_k_ip, to_v_ip) the repo's
            # UNet2p5DConditionModel has no place for; every key it does have is there: those are left out
            weights = load_file(p[:-4] + ".safetensors")
            return {k: v for k, v in weights.items() if "image_proj_model" not in k and "_ip." not in k}
        return torch_load(path, *args, **kwargs)

    torch.load = load
    net = Multiview_Diffusion_Net(Config)
    camera_info = [(((azim // 30) + 9) % 12) // {-20: 1, 0: 1, 20: 1, -90: 3, 90: 3}[elev] + {-20: 0, 0: 12, 20: 24, -90: 36, 90: 40}[elev] for azim, elev in zip(AZIMS, ELEVS)]
    net.pipeline.set_progress_bar_config(disable=True)
    views = net.pipeline([delit.resize((SIZE, SIZE))], num_inference_steps=a.steps, width=SIZE, height=SIZE, num_in_batch=len(AZIMS),
                         camera_info_gen=[camera_info], camera_info_ref=[[0]], normal_imgs=[normals], position_imgs=[positions],
                         generator=torch.Generator(device="cuda").manual_seed(0)).images
    # each view cut out by where the mesh is in its normal map (white there is the background), so project finds
    # its outline: the network paints its background a flat grey
    for i, v in enumerate(views):
        mask = (np.array(normals[i]) != 255).any(axis=-1)
        rgba = np.dstack([np.array(v.convert("RGB").resize((SIZE, SIZE))), (mask * 255).astype(np.uint8)])
        Image.fromarray(rgba, "RGBA").save(out / f"view_{i}.png")
    print(f"views in {time.time() - t2:.1f} s, peak {torch.cuda.max_memory_allocated() / 1e9:.1f} GB", flush=True)
    (out / "views.json").write_text(json.dumps([{"file": f"view_{i}.png", "azim": az, "elev": el} for i, (az, el) in enumerate(zip(AZIMS, ELEVS))], indent=1))


if __name__ == "__main__":
    main()
