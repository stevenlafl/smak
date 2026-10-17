# fp16 against bf16 for the generator worker's two shape-route models, one fixed seed: SD-Turbo's picture and
# Hunyuan3D-2mini's mesh. research/character-image-models.md measured fp16 matrix multiplies at a third of bf16's
# speed on this card; this checks the output holds before the worker changes.
#   <local-3d>/venvs/torch-rocm/bin/python research/zimage/bf16_check.py <out folder>
import os, sys, time, json
from pathlib import Path
root = Path("/media/Data3/Packages/local-3d")
os.environ.setdefault("HF_HOME", str(root / "weights/hf"))
os.environ.setdefault("U2NET_HOME", str(root / "weights/u2net"))
os.environ.setdefault("HF_HUB_OFFLINE", "1")
import torch
from PIL import Image
from diffusers import AutoPipelineForText2Image
from rembg import remove, new_session
from hy3dgen.shapegen import Hunyuan3DDiTFlowMatchingPipeline, FloaterRemover, DegenerateFaceRemover

out = Path(sys.argv[1])
out.mkdir(parents=True, exist_ok=True)
prompt = ("a security guard in a blue uniform shirt, black armoured vest, blue helmet, holster, black boots, full body, "
          "front view, standing, arms held out from the body, empty hands, plain white background, studio lighting, 3d render")
res = {}
for name, dt in [("fp16", torch.float16), ("bf16", torch.bfloat16)]:
    pipe = AutoPipelineForText2Image.from_pretrained("stabilityai/sd-turbo", torch_dtype=dt, variant="fp16").to("cuda")
    pipe(prompt, num_inference_steps=4, guidance_scale=0.0, width=512, height=512, generator=torch.manual_seed(1))
    torch.cuda.synchronize()
    t = time.time()
    img = pipe(prompt, num_inference_steps=4, guidance_scale=0.0, width=512, height=512, generator=torch.manual_seed(1)).images[0]
    torch.cuda.synchronize()
    res[f"sdturbo_{name}_s"] = round(time.time() - t, 3)
    img.save(out / f"sdturbo_{name}.png")
    del pipe
    torch.cuda.empty_cache()
session = new_session("birefnet-general")
cut = remove(Image.open(out / "sdturbo_fp16.png").convert("RGB"), session=session, bgcolor=[255, 255, 255, 0])
cut.save(out / "cut.png")
for name, dt in [("fp16", torch.float16), ("bf16", torch.bfloat16)]:
    pipe = Hunyuan3DDiTFlowMatchingPipeline.from_pretrained("tencent/Hunyuan3D-2mini", subfolder="hunyuan3d-dit-v2-mini",
                                                            use_safetensors=True, variant="fp16", device="cuda", dtype=dt)
    torch.cuda.reset_peak_memory_stats()
    torch.cuda.synchronize()
    t = time.time()
    mesh = pipe(image=cut, num_inference_steps=30, octree_resolution=256, num_chunks=20000,
                generator=torch.manual_seed(0), output_type="trimesh")[0]
    torch.cuda.synchronize()
    res[f"hunyuan_{name}_s"] = round(time.time() - t, 1)
    mesh = DegenerateFaceRemover()(FloaterRemover()(mesh))
    res[f"hunyuan_{name}_faces"] = int(len(mesh.faces))
    res[f"hunyuan_{name}_box"] = [[round(float(v), 3) for v in b] for b in mesh.bounds]
    res[f"hunyuan_{name}_peak_gb"] = round(torch.cuda.max_memory_allocated() / 1e9, 2)
    mesh.export(out / f"hunyuan_{name}.obj")
    del pipe
    torch.cuda.empty_cache()
print(json.dumps(res, indent=1))
(out / "bf16.json").write_text(json.dumps(res, indent=1))
