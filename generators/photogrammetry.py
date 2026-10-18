"""Photogrammetry for a map's pictures, by its standard parts: features matched across pictures (OpenCV's SIFT), a
camera from 2D-3D matches (solvePnPRansac), and structure from motion with bundle adjustment (pycolmap), its points
then fitted with axis-aligned planes by RANSAC. Called by src/maps/photo.mjs, one job a run, its answer one line of
JSON on stdout. Runs on the CPU: the venv is made by generators/install-photogrammetry.sh.

  python photogrammetry.py locate <job.json>   job: { picture, render, points, width, height, fov, matcher }
      the picture's camera against the map as built: features of the picture matched to those of a render of the
      map at a guessed camera, each matched render pixel's point of the map read from `points` (Float32 x, y, z a
      pixel, NaN where nothing is drawn), and the camera from them by PnP with RANSAC. `matcher`: "sift" (OpenCV,
      ratio test; the default) or "lightglue" (DISK keypoints matched by LightGlue, learned; it needs the
      learned-match venv, generators/install-learned-match.sh).
      -> { ok, from, yaw, pitch, roll, matches, inliers, error }
  python photogrammetry.py vggt <job.json>     job: { pictures: [...], eye: 64, conf: 50 }
      cameras and dense points from the pictures in one pass of VGGT-1B (bf16, on the GPU; the learned-match venv),
      its points kept over the `conf` percentile of their confidence, then stood up, scaled and planed as sfm's
      are. -> as sfm, with { seconds, peak } (the model's pass, and the card's peak memory in GB)
  python photogrammetry.py sfm <job.json>      job: { pictures: [...], fov, work, eye: 64 }
      cameras and sparse points from the pictures alone (pycolmap: SIFT, exhaustive matching, incremental mapping,
      bundle adjustment, the intrinsics held at the given fov); the scene turned so that the cameras' up is +z (a
      game's camera has no roll) and scaled so that the cameras stand `eye` over the floor (the lowest large
      level plane); then planes fitted to the points by RANSAC, each kept level or upright and turned to the
      walls' main way (rooms are square to each other).
      -> { ok, registered, cameras: [{ picture, from, yaw, pitch }], points, planes: [{ axis, at, inliers,
           extent }], error }
"""
import json
import math
import os
import sys

import cv2
import numpy as np


def intrinsics(width, height, fov):
    f = width / 2 / math.tan(math.radians(fov) / 2)
    return np.array([[f, 0, width / 2], [0, f, height / 2], [0, 0, 1]], dtype=np.float64)


def camera_of(R, t):
    """Our camera from OpenCV's world-to-camera R, t: the eye, yaw and pitch (and the roll it found)."""
    eye = -R.T @ t.reshape(3)
    forward = R[2]
    up = -R[1]
    yaw = math.degrees(math.atan2(forward[1], forward[0]))
    pitch = math.degrees(math.asin(max(-1, min(1, forward[2]))))
    # roll: how far the camera's up leans from the world's up about the forward axis
    level_right = np.cross(forward, [0, 0, 1])
    n = np.linalg.norm(level_right)
    roll = 0.0
    if n > 1e-6:
        level_up = np.cross(level_right / n, forward)
        roll = math.degrees(math.atan2(np.dot(np.cross(level_up, up), forward), np.dot(level_up, up)))
    return [round(float(v), 2) for v in eye], round(yaw, 2), round(pitch, 2), round(roll, 2)


def sift_pairs(picture, render):
    """SIFT features matched by the ratio test: [(picture x, y), ...], [(render x, y), ...]."""
    sift = cv2.SIFT_create(nfeatures=4000)
    kp1, d1 = sift.detectAndCompute(picture, None)
    kp2, d2 = sift.detectAndCompute(render, None)
    if d1 is None or d2 is None or len(kp1) < 8 or len(kp2) < 8:
        raise ValueError(f"too few features: {len(kp1 or [])} in the picture, {len(kp2 or [])} in the render")
    pairs = cv2.BFMatcher(cv2.NORM_L2).knnMatch(d1, d2, k=2)
    good = [m for m, n in (p for p in pairs if len(p) == 2) if m.distance < 0.8 * n.distance]
    return [kp1[m.queryIdx].pt for m in good], [kp2[m.trainIdx].pt for m in good]


_learned = {}


def lightglue_pairs(picture, render):
    """DISK keypoints matched by LightGlue (cvg/LightGlue, Apache-2.0; DISK through kornia, Apache-2.0), on the GPU
    when there is one: [(picture x, y), ...], [(render x, y), ...]. The models are loaded once a process."""
    import torch
    from lightglue import LightGlue, DISK
    from lightglue.utils import rbd
    if "disk" not in _learned:
        _learned["disk"] = DISK(max_num_keypoints=2048).eval()
        _learned["glue"] = LightGlue(features="disk").eval()

    def run(dev):
        _learned["disk"].to(dev)
        _learned["glue"].to(dev)
        tensor = lambda g: torch.from_numpy(cv2.cvtColor(g, cv2.COLOR_GRAY2RGB)).permute(2, 0, 1).float().div(255).to(dev)
        with torch.no_grad():
            f0 = _learned["disk"].extract(tensor(picture))
            f1 = _learned["disk"].extract(tensor(render))
            return f0, f1, _learned["glue"]({"image0": f0, "image1": f1})

    # on the card when it has room; a card another job holds (a generator's worker, VGGT) put LightGlue's attention
    # out of memory (5.9 GB asked) and every such shot fell to the edges: on the CPU then, slower but the same
    f0 = f1 = out = None
    if torch.cuda.is_available():
        try:
            f0, f1, out = run("cuda")
        except torch.OutOfMemoryError:
            torch.cuda.empty_cache()
    if out is None:
        f0, f1, out = run("cpu")
    f0, f1, out = rbd(f0), rbd(f1), rbd(out)
    m = out["matches"]
    k0 = f0["keypoints"][m[:, 0]].cpu().numpy()
    k1 = f1["keypoints"][m[:, 1]].cpu().numpy()
    if len(k0) < 8:
        raise ValueError(f"too few matches: {len(k0)}")
    return [tuple(map(float, p)) for p in k0], [tuple(map(float, p)) for p in k1]


def locate(job):
    picture = cv2.imread(job["picture"], cv2.IMREAD_GRAYSCALE)
    render = cv2.imread(job["render"], cv2.IMREAD_GRAYSCALE)
    width, height = job["width"], job["height"]
    if picture.shape[1] != width:
        picture = cv2.resize(picture, (width, height), interpolation=cv2.INTER_AREA)
    points = np.fromfile(job["points"], dtype=np.float32).reshape(height, width, 3)
    try:
        ours, theirs = (lightglue_pairs if job.get("matcher") == "lightglue" else sift_pairs)(picture, render)
    except ValueError as e:
        return {"ok": False, "error": str(e), "matches": 0, "inliers": 0}
    image_pts, world_pts, render_px = [], [], []
    for (u, v), (x, y) in zip(ours, theirs):
        p = points[min(height - 1, int(y)), min(width - 1, int(x))]
        if np.all(np.isfinite(p)):
            image_pts.append((u, v))
            world_pts.append(p)
            render_px.append((min(width - 1, int(x)), min(height - 1, int(y))))
    if len(world_pts) < 6:
        return {"ok": False, "error": f"{len(world_pts)} features matched to points of the map: too few for a camera", "matches": len(ours), "inliers": 0}
    K = intrinsics(width, height, job.get("fov", 90))
    ok, rvec, tvec, inliers = cv2.solvePnPRansac(np.array(world_pts, dtype=np.float64), np.array(image_pts, dtype=np.float64), K, None, reprojectionError=4.0, iterationsCount=2000, flags=cv2.SOLVEPNP_EPNP)
    if not ok or inliers is None or len(inliers) < 6:
        return {"ok": False, "error": "no camera agreed with enough matches (RANSAC)", "matches": len(world_pts), "inliers": 0 if inliers is None else len(inliers)}
    idx = inliers.reshape(-1)
    rvec, tvec = cv2.solvePnPRefineLM(np.array(world_pts)[idx].astype(np.float64), np.array(image_pts)[idx].astype(np.float64), K, None, rvec, tvec)
    R, _ = cv2.Rodrigues(rvec)
    eye, yaw, pitch, roll = camera_of(R, tvec)
    proj, _ = cv2.projectPoints(np.array(world_pts)[idx].astype(np.float64), rvec, tvec, K, None)
    error = float(np.mean(np.linalg.norm(proj.reshape(-1, 2) - np.array(image_pts)[idx], axis=1)))
    # every match, the inliers and the rest: where it is in the picture and which render pixel it came from, so the
    # caller can tell which face of the map each lies on and how far that face must move for its matches to agree
    pairs = [[round(float(image_pts[i][0]), 2), round(float(image_pts[i][1]), 2), int(render_px[i][0]), int(render_px[i][1])] for i in range(min(len(image_pts), 3000))]
    # leave one plane out: the camera from every other plane's matches. A wall built off draws RANSAC's camera
    # with it when most features lie on it (a camera 32 units off for a wall 32 off, 2026-10-17); without it, the
    # rest pin the camera and that wall's own shift shows
    without = {}
    if job.get("planes"):
        labels = np.fromfile(job["planes"], dtype=np.int32).reshape(height, width)
        lab = np.array([labels[y, x] for x, y in render_px])
        W = np.array(world_pts, dtype=np.float64)
        I = np.array(image_pts, dtype=np.float64)
        counts = {int(p): int((lab == p).sum()) for p in np.unique(lab) if p >= 0}
        for p, n in sorted(counts.items(), key=lambda kv: -kv[1])[:6]:
            keep = lab != p
            if n < 12 or keep.sum() < 30:
                continue
            ok2, rv, tv, inl = cv2.solvePnPRansac(W[keep], I[keep], K, None, reprojectionError=4.0, iterationsCount=1000, flags=cv2.SOLVEPNP_EPNP)
            if not ok2 or inl is None or len(inl) < 30:
                continue
            ii = inl.reshape(-1)
            rv, tv = cv2.solvePnPRefineLM(W[keep][ii], I[keep][ii], K, None, rv, tv)
            R2, _ = cv2.Rodrigues(rv)
            e2, y2, p2, r2 = camera_of(R2, tv)
            pr, _ = cv2.projectPoints(W[keep][ii], rv, tv, K, None)
            err2 = float(np.mean(np.linalg.norm(pr.reshape(-1, 2) - I[keep][ii], axis=1)))
            without[str(p)] = {"from": e2, "yaw": y2, "pitch": p2, "roll": r2, "inliers": int(len(ii)), "of": int(keep.sum()), "error": round(err2, 2), "left": n}
    return {"ok": True, "from": eye, "yaw": yaw, "pitch": pitch, "roll": roll, "matches": len(world_pts), "inliers": int(len(idx)), "error": round(error, 2), "pairs": pairs, "without": without}


def ransac_planes(P, axis, rng, tries=400, tol=2.0, least=40):
    """Planes square to `axis` (0, 1, 2 of the turned scene) found in the points one after another: each the
    offset most points lie within `tol` of, those points then taken out."""
    planes = []
    left = P.copy()
    for _ in range(12):
        if len(left) < least:
            break
        best, best_in = None, None
        for _ in range(tries):
            at = left[rng.integers(len(left)), axis]
            inl = np.abs(left[:, axis] - at) < tol
            if best_in is None or inl.sum() > best_in.sum():
                best, best_in = at, inl
        if best_in.sum() < least:
            break
        at = float(np.median(left[best_in, axis]))
        others = [a for a in range(3) if a != axis]
        ext = [[round(float(left[best_in, a].min()), 1), round(float(left[best_in, a].max()), 1)] for a in others]
        planes.append({"axis": "xyz"[axis], "at": round(at, 1), "inliers": int(best_in.sum()), "extent": ext})
        left = left[~best_in]
    return planes


def sfm(job):
    import pycolmap

    work = job["work"]
    os.makedirs(work, exist_ok=True)
    images = os.path.join(work, "images")
    os.makedirs(images, exist_ok=True)
    names = []
    for i, p in enumerate(job["pictures"]):
        name = f"{i:03d}.png"
        img = cv2.imread(p)
        cv2.imwrite(os.path.join(images, name), img)
        names.append(name)
    h, w = cv2.imread(os.path.join(images, names[0])).shape[:2]
    f = w / 2 / math.tan(math.radians(job.get("fov", 90)) / 2)
    db = os.path.join(work, "database.db")
    if os.path.exists(db):
        os.remove(db)
    reader = pycolmap.ImageReaderOptions()
    reader.camera_model = "PINHOLE"
    reader.camera_params = f"{f},{f},{w / 2},{h / 2}"
    pycolmap.extract_features(db, images, camera_mode=pycolmap.CameraMode.SINGLE, reader_options=reader)
    pycolmap.match_exhaustive(db)
    opts = pycolmap.IncrementalPipelineOptions()
    opts.ba_refine_focal_length = False
    opts.ba_refine_principal_point = False
    opts.ba_refine_extra_params = False
    opts.min_num_matches = 10
    recs = pycolmap.incremental_mapping(db, images, os.path.join(work, "sparse"), options=opts)
    if not recs:
        return {"ok": False, "error": "no reconstruction: too few pictures matched to each other", "registered": 0}
    rec = max(recs.values(), key=lambda r: r.num_reg_images())
    cams = []
    for image in rec.images.values():
        if not image.has_pose:
            continue
        pose = image.cam_from_world()
        R = pose.rotation.matrix()
        t = np.array(pose.translation)
        cams.append((image.name, R, t))
    pts = np.array([p.xyz for p in rec.points3D.values()]) if rec.points3D else np.zeros((0, 3))
    return stand_up(cams, pts, job)


def stand_up(cams, pts, job):
    """Cameras [(name "NNN...", R, t)] (OpenCV's world-to-camera) and points of a scene in its own frame: turned so
    the cameras' up is +z, turned about z to the walls' main way, scaled so that the cameras stand `eye` over the
    floor (the lowest large level plane), and the level and upright planes RANSAC finds. As sfm answers."""
    if len(cams) < 2 or len(pts) < 20:
        return {"ok": False, "error": f"{len(cams)} cameras and {len(pts)} points: too few", "registered": len(cams)}
    # the world's up: a game's camera has no roll, so every camera's up (minus OpenCV's y) is the world's +z
    ups = np.array([-R[1] for _, R, _ in cams])
    up = ups.mean(axis=0)
    up /= np.linalg.norm(up)
    # turn the scene so up is +z
    def turn_to(a, b):
        v = np.cross(a, b)
        c = float(np.dot(a, b))
        if np.linalg.norm(v) < 1e-9:
            return np.eye(3) if c > 0 else np.diag([1, -1, -1])
        vx = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])
        return np.eye(3) + vx + vx @ vx * (1 / (1 + c))
    T = turn_to(up, np.array([0.0, 0.0, 1.0]))
    P = pts @ T.T
    eyes = np.array([(-R.T @ t) for _, R, t in cams]) @ T.T
    # the walls' main way: the points' horizontal directions of most structure (a histogram of their normals is
    # what a room's walls make); taken from the cameras' forward ways here is weak, so the points' own spread
    xy = P[:, :2] - P[:, :2].mean(axis=0)
    best_angle, best_score = 0.0, -1
    for deg in range(0, 90):
        a = math.radians(deg)
        rot = np.array([[math.cos(a), math.sin(a)], [-math.sin(a), math.cos(a)]])
        q = xy @ rot.T
        # walls square to the axes put many points at the same x or the same y
        score = max(np.bincount(np.clip(((q[:, 0] - q[:, 0].min()) / max(1e-6, np.ptp(q[:, 0])) * 200).astype(int), 0, 200)).max(),
                    np.bincount(np.clip(((q[:, 1] - q[:, 1].min()) / max(1e-6, np.ptp(q[:, 1])) * 200).astype(int), 0, 200)).max())
        if score > best_score:
            best_angle, best_score = a, score
    Rz = np.array([[math.cos(best_angle), math.sin(best_angle), 0], [-math.sin(best_angle), math.cos(best_angle), 0], [0, 0, 1]])
    P = P @ Rz.T
    eyes = eyes @ Rz.T
    # the scale: the floor is the lowest large level plane; the cameras stand `eye` over it
    rng = np.random.default_rng(1)
    level = ransac_planes(P, 2, rng, tol=0.02 * np.ptp(P[:, 2]) + 1e-9)
    if not level:
        return {"ok": False, "error": "no level plane among the points: no floor to scale by", "registered": len(cams)}
    below = [p for p in level if p["at"] < np.median(eyes[:, 2])]
    floor = min(below, key=lambda p: p["at"]) if below else min(level, key=lambda p: p["at"])
    height = float(np.median(eyes[:, 2]) - floor["at"])
    if height <= 0:
        return {"ok": False, "error": "the cameras are not over the floor found", "registered": len(cams)}
    k = job.get("eye", 64) / height
    P = (P - [0, 0, floor["at"]]) * k
    eyes = (eyes - [0, 0, floor["at"]]) * k
    planes = []
    for axis in (0, 1, 2):
        planes += ransac_planes(P, axis, rng, tol=2.0, least=max(30, len(P) // 50))
    out_cams = []
    for (name, R, t), eye in zip(cams, eyes):
        fwd = (Rz @ T @ R[2])
        out_cams.append({"picture": job["pictures"][int(name[:3])], "from": [round(float(v), 1) for v in eye], "yaw": round(math.degrees(math.atan2(fwd[1], fwd[0])), 2), "pitch": round(math.degrees(math.asin(max(-1, min(1, fwd[2])))), 2)})
    return {"ok": True, "registered": len(cams), "of": len(job["pictures"]), "points": int(len(P)), "cameras": out_cams, "planes": planes, "turn": [T.tolist(), Rz.tolist()], "scale": k}


def vggt(job):
    """VGGT-1B (facebook/VGGT-1B: CC-BY-NC-4.0, non-commercial) over the pictures in one pass, bf16 on the GPU: its
    cameras (OpenCV's world-to-camera) and its depth unprojected to points, kept over the `conf` percentile of their
    confidence, then stood up, scaled and planed as sfm's are."""
    import time
    import torch
    from vggt.models.vggt import VGGT
    from vggt.utils.load_fn import load_and_preprocess_images
    from vggt.utils.pose_enc import pose_encoding_to_extri_intri
    from vggt.utils.geometry import unproject_depth_map_to_point_map
    model = VGGT.from_pretrained("facebook/VGGT-1B").to("cuda").eval()
    images = load_and_preprocess_images(job["pictures"]).to("cuda")
    torch.cuda.reset_peak_memory_stats()
    t0 = time.time()
    with torch.no_grad(), torch.autocast("cuda", dtype=torch.bfloat16):
        preds = model(images)
    seconds = time.time() - t0
    extri, intri = pose_encoding_to_extri_intri(preds["pose_enc"], images.shape[-2:])
    extri = extri.squeeze(0).float().cpu().numpy()
    intri = intri.squeeze(0).float().cpu().numpy()
    depth = preds["depth"].squeeze(0).float().cpu().numpy()
    conf = preds["depth_conf"].squeeze(0).float().cpu().numpy()
    peak = torch.cuda.max_memory_allocated() / 1e9
    world = unproject_depth_map_to_point_map(depth, extri, intri)
    keep = conf > np.percentile(conf, job.get("conf", 50))
    pts = world[keep].reshape(-1, 3)
    # a dense cloud is far more than planes need
    if len(pts) > 200000:
        pts = pts[np.random.default_rng(1).choice(len(pts), 200000, replace=False)]
    cams = [(f"{i:03d}", extri[i][:, :3].astype(np.float64), extri[i][:, 3].astype(np.float64)) for i in range(len(extri))]
    answer = stand_up(cams, pts.astype(np.float64), job)
    answer.update({"seconds": round(seconds, 2), "peak": round(peak, 2)})
    return answer


if __name__ == "__main__":
    step, path = sys.argv[1], sys.argv[2]
    job = json.load(open(path))
    try:
        answer = {"locate": locate, "sfm": sfm, "vggt": vggt}[step](job)
    except Exception as e:  # said in the answer, never a crash the caller cannot read
        answer = {"ok": False, "error": f"{type(e).__name__}: {e}"}
    print(json.dumps(answer))
