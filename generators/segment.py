"""A named subject found in a picture and cut out: open-vocabulary detection by words, then SAM 2 cuts its mask
from the box (or from a point). The tool generate (`subject`) and src/maps/photo.mjs (masking a screenshot's
people, monsters and HUD) run it; the kit's own colour logic and BiRefNet (worker.py) stay as fallbacks.

One request a line on stdin, one answer a line on stdout (JSON), the models kept loaded between them:
  { "id": 1, "picture": "/abs/x.png", "subject": "the chair", "detector": "owlv2", "out": "/abs/x" }
      -> { "id": 1, "ok": true, "box": [x0, y0, x1, y1], "score": 0.42, "detector": "owlv2", "boxes": [...],
           "mask": "/abs/x_mask.png", "cut": "/abs/x_cut.png", "took": 1.9 }
  "detector": owlv2 (google/owlv2-base-patch16-ensemble, Apache-2.0), gdino (IDEA-Research/grounding-dino-base,
  Apache-2.0) or yoloworld (yolov8x-worldv2, AGPL-3.0); "all" gives every detector's best box ("boxes") and cuts
  the highest score's. "point": [x, y] cuts from a click instead of a box. "every": true cuts every box over
  "threshold" (0.1) into one mask: a screenshot's people and monsters.
Run: venvs/segment-rocm/bin/python -I generators/segment.py --root <local-3d>  (HF_HOME under it)
"""
import json, os, sys, time
from pathlib import Path

root = (Path(sys.argv[sys.argv.index("--root") + 1]) if "--root" in sys.argv else Path.cwd()).resolve()
os.environ.setdefault("HF_HOME", str(root / "weights/hf"))
os.environ.setdefault("YOLO_CONFIG_DIR", str(root / "weights/yolo"))
os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("PYTORCH_KERNEL_CACHE_PATH", str(root / "weights/torch-kernels"))
# YOLO-World fetches its text encoder (CLIP ViT-B/32) to <weights_dir>/clip, weights_dir read from Ultralytics'
# settings when it is imported and relative to the working folder until set: a run from the repository wrote it
# there. The settings file in weights/yolo names weights/yolo (install-segment.sh); the working folder is that too,
# for a settings file not written yet. Every path a request names is absolute
(root / "weights/yolo").mkdir(parents=True, exist_ok=True)
os.chdir(root / "weights/yolo")

import numpy as np
import torch
from PIL import Image

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
loaded = {}


def say(obj):
    sys.stdout.write(json.dumps(obj) + "\n")
    sys.stdout.flush()


def owlv2(image, words):
    from transformers import Owlv2Processor, Owlv2ForObjectDetection
    if "owlv2" not in loaded:
        name = "google/owlv2-base-patch16-ensemble"
        loaded["owlv2"] = (Owlv2Processor.from_pretrained(name), Owlv2ForObjectDetection.from_pretrained(name).to(DEVICE).eval())
    proc, model = loaded["owlv2"]
    inputs = proc(text=[[words]], images=image, return_tensors="pt").to(DEVICE)
    with torch.no_grad():
        out = model(**inputs)
    # OWLv2 pads the picture to a square: its boxes are in that square's frame, the longer side's
    side = max(image.size)
    res = proc.post_process_grounded_object_detection(out, threshold=0.0, target_sizes=torch.tensor([[side, side]]))[0]
    return [(b.tolist(), float(s)) for b, s in zip(res["boxes"], res["scores"])]


def gdino(image, words):
    from transformers import AutoProcessor, AutoModelForZeroShotObjectDetection
    if "gdino" not in loaded:
        name = "IDEA-Research/grounding-dino-base"
        loaded["gdino"] = (AutoProcessor.from_pretrained(name), AutoModelForZeroShotObjectDetection.from_pretrained(name).to(DEVICE).eval())
    proc, model = loaded["gdino"]
    text = words.lower().strip().rstrip(".") + "."
    inputs = proc(images=image, text=text, return_tensors="pt").to(DEVICE)
    with torch.no_grad():
        out = model(**inputs)
    res = proc.post_process_grounded_object_detection(out, inputs.input_ids, threshold=0.05, text_threshold=0.05, target_sizes=[image.size[::-1]])[0]
    return [(b.tolist(), float(s)) for b, s in zip(res["boxes"], res["scores"])]


def yoloworld(image, words):
    from ultralytics import YOLOWorld
    if "yoloworld" not in loaded:
        # for a later run when no settings file named it yet (see the top)
        from ultralytics import settings
        settings.update({"weights_dir": str(root / "weights/yolo")})
        loaded["yoloworld"] = YOLOWorld(str(root / "weights/yolo/yolov8x-worldv2.pt"))
    model = loaded["yoloworld"]
    model.set_classes([words])
    res = model.predict(image, conf=0.01, verbose=False, device=0 if DEVICE == "cuda" else "cpu")[0]
    return [(b.tolist(), float(s)) for b, s in zip(res.boxes.xyxy.cpu(), res.boxes.conf.cpu())]


DETECTORS = {"owlv2": owlv2, "gdino": gdino, "yoloworld": yoloworld}


def overlap(a, b):
    """Two boxes' intersection over their union."""
    ix = max(0, min(a[2], b[2]) - max(a[0], b[0]))
    iy = max(0, min(a[3], b[3]) - max(a[1], b[1]))
    i = ix * iy
    u = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - i
    return i / u if u > 0 else 0


def clip_scores(image, boxes, words):
    """How well each box's crop matches the words, by CLIP ViT-B/32 (the text encoder YOLO-World fetched)."""
    import clip
    if "clip" not in loaded:
        model, pre = clip.load("ViT-B/32", device=DEVICE, download_root=str(root / "weights/yolo/clip"))
        loaded["clip"] = (model.eval(), pre)
    model, pre = loaded["clip"]
    crops = []
    for b in boxes:
        # a little of what is round it: a crop cut at the box's edge loses the outline CLIP reads
        w, h = b[2] - b[0], b[3] - b[1]
        crops.append(pre(image.crop((max(0, b[0] - 0.08 * w), max(0, b[1] - 0.08 * h), min(image.width, b[2] + 0.08 * w), min(image.height, b[3] + 0.08 * h)))))
    with torch.no_grad():
        img = model.encode_image(torch.stack(crops).to(DEVICE)).float()
        txt = model.encode_text(clip.tokenize([f"a photo of {words}"]).to(DEVICE)).float()
    img = img / img.norm(dim=-1, keepdim=True)
    txt = txt / txt.norm(dim=-1, keepdim=True)
    return (img @ txt.T).squeeze(1).tolist()


def vote(found, image, words):
    """The detectors' boxes (each one's best three, near copies merged) held to the words by CLIP: the crop most like
    them wins. Each detector misses different subjects, and two agreeing on one box can both be wrong (the security
    guard: OWLv2 and YOLO-World on the same chair, 2026-10-17)."""
    # each detector's own best: a second or third box is a weaker part of the same thing as often as not, and CLIP
    # took a crop of the scientist's coat over the whole scientist
    bests = {}
    for f in found:
        bests.setdefault(f["detector"], f)
    picks = list(bests.values())
    # all agreeing is taken as it is; otherwise the crop most like the words
    if len(picks) >= 3 and all(overlap(p["box"], q["box"]) > 0.5 for p in picks for q in picks):
        lead = max(picks, key=lambda p: p["score"])
        return [{**lead, "detector": f"vote ({lead['detector']}, all {len(picks)} agree)"}] + [p for p in picks if p is not lead]
    sims = clip_scores(image, [p["box"] for p in picks], words)
    for p, s in zip(picks, sims):
        p["clip"] = round(s, 4)
    picks.sort(key=lambda p: -p["clip"])
    lead = picks[0]
    return [{**lead, "detector": f"vote ({lead['detector']}, CLIP {lead['clip']})"}] + picks[1:]


def sam2(image, boxes=None, point=None):
    from transformers import Sam2Processor, Sam2Model
    if "sam2" not in loaded:
        name = "facebook/sam2.1-hiera-small"
        loaded["sam2"] = (Sam2Processor.from_pretrained(name), Sam2Model.from_pretrained(name).to(DEVICE).eval())
    proc, model = loaded["sam2"]
    if point is not None:
        inputs = proc(images=image, input_points=[[[point]]], input_labels=[[[1]]], return_tensors="pt").to(DEVICE)
    else:
        inputs = proc(images=image, input_boxes=[boxes], return_tensors="pt").to(DEVICE)
    with torch.no_grad():
        out = model(**inputs, multimask_output=False)
    masks = proc.post_process_masks(out.pred_masks.cpu(), inputs["original_sizes"])[0]
    m = masks.reshape(-1, *masks.shape[-2:]).any(0).numpy()
    return m


def handle(r):
    t0 = time.time()
    image = Image.open(r["picture"]).convert("RGB")
    out = Path(r["out"])
    out.parent.mkdir(parents=True, exist_ok=True)
    found = []
    detector = r.get("detector") or "vote"
    if r.get("point") is None:
        names = list(DETECTORS) if detector in ("all", "vote") else [detector]
        for name in names:
            for box, score in DETECTORS[name](image, r["subject"]):
                found.append({"detector": name, "box": [round(v, 1) for v in box], "score": round(score, 4)})
        if not found:
            return {"ok": False, "error": f"no {r['subject']} found by {', '.join(names)}"}
        found.sort(key=lambda f: -f["score"])
        if detector == "vote":
            found = vote(found, image, r["subject"])
    if r.get("point") is not None:
        mask = sam2(image, point=r["point"])
        best = {"detector": "point", "box": None, "score": None}
    elif r.get("every"):
        keep = [f for f in found if f["score"] >= r.get("threshold", 0.1)] or found[:1]
        mask = sam2(image, boxes=[f["box"] for f in keep])
        best = keep[0]
    else:
        best = found[0]
        mask = sam2(image, boxes=[best["box"]])
    Image.fromarray((mask * 255).astype("uint8")).save(str(out) + "_mask.png")
    rgba = np.dstack([np.asarray(image), (mask * 255).astype("uint8")])
    Image.fromarray(rgba, "RGBA").save(str(out) + "_cut.png")
    # the subject alone on white, cropped round it with a margin: what a shape model (or a projection that reads a
    # picture's background by its border) takes; an RGBA cut read as RGB brings the clutter back
    ys, xs = np.nonzero(mask)
    white = np.where(mask[..., None], np.asarray(image), 255).astype("uint8")
    if len(xs):
        m = int(0.08 * max(xs.max() - xs.min(), ys.max() - ys.min())) + 4
        white = white[max(0, ys.min() - m):ys.max() + m + 1, max(0, xs.min() - m):xs.max() + m + 1]
    Image.fromarray(white).save(str(out) + "_white.png")
    # every detector's own best box, for a comparison
    bests = {}
    for f in found:
        bests.setdefault(f["detector"], f)
    return {"ok": True, "box": best["box"], "score": best["score"], "detector": best["detector"], "boxes": list(bests.values()),
            "mask": str(out) + "_mask.png", "cut": str(out) + "_cut.png", "white": str(out) + "_white.png", "covered": round(float(mask.mean()), 4), "took": round(time.time() - t0, 2)}


def main():
    for line in sys.stdin:
        if not line.strip():
            continue
        r = json.loads(line)
        try:
            say({"id": r.get("id"), **handle(r)})
        except Exception as e:  # a request that fails says so; the process goes on
            say({"id": r.get("id"), "ok": False, "error": f"{type(e).__name__}: {e}"})


if __name__ == "__main__":
    main()
