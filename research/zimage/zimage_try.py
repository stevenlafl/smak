# Z-Image-Turbo (GGUF Q8 transformer) with the Fun ControlNet Union 2.1 lite on this card: loads, and draws a prompt
# held to a pose picture at 1024, seeds in turn, timing each and the peak memory.
#   <local-3d>/venvs/zimage-rocm/bin/python research/zimage/zimage_try.py <pose.png> <out folder> "<prompt>" [seeds]
import os, sys, time, json
from pathlib import Path
root = Path("/media/Data3/Packages/local-3d")
os.environ.setdefault("HF_HOME", str(root / "weights/hf"))
os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("PYTORCH_HIP_ALLOC_CONF", "expandable_segments:True")
import torch
from PIL import Image
from huggingface_hub import hf_hub_download, snapshot_download
from diffusers import ZImageControlNetPipeline, ZImageControlNetModel, ZImageTransformer2DModel, GGUFQuantizationConfig

pose, out, prompt = sys.argv[1], Path(sys.argv[2]), sys.argv[3]
seeds = [int(s) for s in (sys.argv[4] if len(sys.argv) > 4 else "0,1,2").split(",")]
out.mkdir(parents=True, exist_ok=True)
# the repo without its fp32 transformer (24.6 GB): the GGUF stands in for it
base = snapshot_download("Tongyi-MAI/Z-Image-Turbo", allow_patterns=["model_index.json", "scheduler/*", "text_encoder/*", "tokenizer/*", "vae/*", "transformer/config.json"])
t = time.time()
transformer = ZImageTransformer2DModel.from_single_file(
    hf_hub_download("unsloth/Z-Image-Turbo-GGUF", "z-image-turbo-Q8_0.gguf"),
    quantization_config=GGUFQuantizationConfig(compute_dtype=torch.bfloat16), config=base, subfolder="transformer", torch_dtype=torch.bfloat16)
controlnet = ZImageControlNetModel.from_single_file(
    hf_hub_download("alibaba-pai/Z-Image-Turbo-Fun-Controlnet-Union-2.1", "Z-Image-Turbo-Fun-Controlnet-Union-2.1-lite-2602-8steps.safetensors"),
    config=str(root / "weights/zimage-controlnet-2.1-lite"), torch_dtype=torch.bfloat16)
pipe = ZImageControlNetPipeline.from_pretrained(base, transformer=transformer, controlnet=controlnet, torch_dtype=torch.bfloat16)
# the ControlNet borrows the transformer's embedders, which model offload leaves behind: so the text encoder (8 GB)
# encodes on the card and goes back to RAM, then the transformer, the ControlNet and the VAE stay on the card
pipe.text_encoder.to("cuda")
with torch.no_grad():
    embeds, _ = pipe.encode_prompt(prompt, device="cuda", do_classifier_free_guidance=False)
pipe.text_encoder.to("cpu")
torch.cuda.empty_cache()
for part in (pipe.transformer, pipe.controlnet, pipe.vae):
    part.to("cuda")
# the VAE at 1024 wants 4.5 GB at once beside the 10.4 the models hold: in tiles (AMD's advice for 16 GB cards)
pipe.vae.enable_tiling()
# its tiles start above the tile size (1024): smaller, so a 1024 control picture's encoding is tiled too
pipe.vae.tile_sample_min_size = 512
pipe.vae.tile_latent_min_size = 64
load = round(time.time() - t, 1)
control = Image.open(pose).convert("RGB").resize((1024, 1024))
res = {"load_s": load, "takes": []}
for seed in seeds:
    torch.cuda.reset_peak_memory_stats()
    t = time.time()
    image = pipe(prompt_embeds=embeds, control_image=control, controlnet_conditioning_scale=float(os.environ.get("SCALE", "0.8")), height=1024, width=1024, num_inference_steps=8,
                 guidance_scale=0.0, generator=torch.Generator("cuda").manual_seed(seed)).images[0]
    took = round(time.time() - t, 1)
    image.save(out / f"zimage_s{seed}.png")
    res["takes"].append({"seed": seed, "s": took, "peak_gb": round(torch.cuda.max_memory_allocated() / 1e9, 2)})
    print(json.dumps(res["takes"][-1]), flush=True)
(out / "zimage.json").write_text(json.dumps(res, indent=1))
print(json.dumps(res))
