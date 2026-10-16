"""A local generator, kept loaded, for the MCP tool `generate` (mcp/generate.mjs).

  <venv>/bin/python -I generators/worker.py --model <name> --root <generators folder>

It loads one model once, then reads requests from stdin, one JSON object a line:

  { "id": 1, "prompt": "...", "length": 2.5, "seed": 3, "out": "/abs/gen/hit_s3.wav",
    "bpm": 120, "key": "D minor", "loop": false }
  { "id": 2, "prompt": "...", "picture": "/abs/refs/chair.png", "seed": 0, "out": "/abs/gen/chair_s0.obj" }  (a shape)

and for each writes the take (the model's own rate and channels, 32-bit float) and answers on stdout, one line:

  { "id": 1, "ok": true, "file": "...", "rate": 48000, "channels": 1, "seconds": 2.5, "took": 1.9, "vram": 3.8 }
  { "id": 2, "ok": true, "file": "...obj", "faces": 20000, "box": [[x, y, z], [x, y, z]], "picture": "...png", "took": 31 }
  { "id": 1, "ok": false, "error": "..." }

(`vram`: the most GB torch has held on the card since the model loaded.)

Its first line is { "ready": true, "model": ..., "load": seconds } once the model is in memory. Everything else
the libraries print goes to stderr, so stdout carries nothing but these lines. The models and how each is
called are those of research/local-sound-generators.md and local-music-generators.md; the folder is the one
generators/install.sh and install-music.sh fill.
"""
import argparse, json, os, sys, time
from pathlib import Path

PROTOCOL = os.fdopen(os.dup(sys.stdout.fileno()), "w", buffering=1)
sys.stdout = sys.stderr  # the libraries' prints go to stderr


def say(obj):
    PROTOCOL.write(json.dumps(obj) + "\n")
    PROTOCOL.flush()


def load_woosh(root, model):
    import torch
    sys.path.insert(0, str(root / "repos/Woosh"))
    os.chdir(root / "weights/woosh")  # its configs name the other checkpoints as checkpoints/<name>
    from woosh.components.base import LoadConfig
    if model == "woosh-dflow":
        from woosh.inference.flowmap_sampler import sample_euler
        from woosh.model.flowmap_from_pretrained import FlowMapFromPretrained
        ldm = FlowMapFromPretrained(LoadConfig(path="checkpoints/Woosh-DFlow")).eval().to("cuda")

        def sample(noise, cond):
            return sample_euler(model=ldm, noise=noise, cond=cond, num_steps=4, renoise=[0, 0.5, 0.5, 0.3], cfg=4.5)
    else:
        from woosh.inference.flowmatching_sampler import flowmatching_integrate
        from woosh.model.ldm import LatentDiffusionModel
        ldm = LatentDiffusionModel(LoadConfig(path="checkpoints/Woosh-Flow")).eval().to("cuda")

        def sample(noise, cond):
            return flowmatching_integrate(ldm, noise=noise, cond=cond, cfg=4.5, atol=0.001, rtol=0.001,
                                          device="cuda", dtype=torch.float64)

    def gen(r):
        # its trained window: 501 latent frames, 5 s at 48 kHz; the take is cut to the length asked
        torch.manual_seed(r["seed"])
        noise = torch.randn(1, 128, 501, device="cuda")
        cond = ldm.get_cond({"audio": None, "description": [r["prompt"]]}, no_dropout=True, device="cuda")
        with torch.inference_mode():
            a = ldm.autoencoder.inverse(sample(noise, cond))
        x = a[0].float().cpu().numpy().T
        return x[: int(min(5.0, r["length"]) * 48000)], 48000
    return gen


def load_ezaudio(root, model):
    import numpy as np
    sys.path.insert(0, str(root / "repos/EzAudio"))
    os.chdir(root / "repos/EzAudio")  # its config is ckpts/ezaudio-xl.yml, by relative path
    # Woosh's editable install also claims the top-level name `api`: EzAudio's file loaded by its path
    import importlib.util
    spec = importlib.util.spec_from_file_location("ezaudio_api", root / "repos/EzAudio/api/ezaudio.py")
    ez = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(ez)
    m = ez.EzAudio("s3_xl", ckpt_path=str(root / "weights/ezaudio/ezaudio_s3_xl.pt"),
                   vae_path=str(root / "weights/ezaudio/vae/1m.pt"), device="cuda")

    def gen(r):
        # generate_audio() multiplies seconds by the latent rate and fails on a fraction: the same call, in frames
        frames = int(round(min(r["length"], 10) * m.params["autoencoder"]["latent_sr"]))
        pred = ez.inference(m.autoencoder, m.unet, None, None, m.tokenizer, m.text_encoder, m.params,
                            m.noise_scheduler, r["prompt"], None, frames, 5, 0.75, 50, 1, r["seed"], "cuda")
        return pred.cpu().numpy().squeeze().astype(np.float32), m.params["autoencoder"]["sr"]
    return gen


def load_moss(root, model):
    import torch
    from moss_soundeffect_v2 import MossSoundEffectPipeline
    pipe = MossSoundEffectPipeline.from_pretrained(str(root / "weights/moss-sfx"), torch_dtype=torch.bfloat16, device="cuda")
    # it always denoises its 30 s window and crops; decoding all 30 s in float32 runs out of 16 GB beside the
    # DiT and Qwen3, so only the latents the length asked needs (and half a second more) are decoded
    whole, hop, keep = pipe.vae.decode, pipe.vae.hop_length, {"s": 30.0}
    pipe.vae.decode = lambda z: whole(z[..., : int((keep["s"] + 0.5) * pipe.sample_rate / hop) + 1])

    def gen(r):
        keep["s"] = min(30.0, max(0.1, float(r["length"])))
        a = pipe(prompt=r["prompt"], seconds=keep["s"], num_inference_steps=r.get("steps") or 100, cfg_scale=4.0,
                 seed=int(r["seed"]), progress_bar_cmd=lambda x: x)
        return a[0].float().cpu().numpy().T, pipe.sample_rate
    return gen


def load_sa3(root, model):
    import torch
    from stable_audio_3 import StableAudioModel
    m = StableAudioModel.from_pretrained("small-sfx", device="cuda")  # gated on HF: HF_TOKEN, terms accepted

    def gen(r):
        # its defaults: 8 steps, cfg 1 (post-trained); it makes the length asked, not a fixed window
        a = m.generate(prompt=r["prompt"], duration=min(120.0, float(r["length"])), seed=int(r["seed"]))
        return a[0].float().cpu().numpy().T, m.model.sample_rate
    return gen


def load_acestep(root, model):
    import numpy as np
    import soundfile as sf
    sys.path.insert(0, str(root / "repos/ACE-Step-1.5"))
    os.environ.setdefault("ACESTEP_CHECKPOINTS_DIR", str(root / "weights/acestep"))
    os.environ.setdefault("ACESTEP_ROCM_DTYPE", "bfloat16")  # float32, its ROCm default, is 5 to 10 times slower
    from acestep.handler import AceStepHandler
    from acestep.llm_inference import LLMHandler
    from acestep.inference import GenerationParams, GenerationConfig, generate_music
    xl = model == "acestep-xl"
    dit = AceStepHandler()
    msg, ok = dit.initialize_service(project_root=str(root / "repos/ACE-Step-1.5"),
                                     config_path="acestep-v15-xl-turbo" if xl else "acestep-v15-turbo",
                                     device="cuda", offload_to_cpu=xl)
    if not ok:
        raise RuntimeError(f"ACE-Step failed to load: {msg}")
    if xl:
        # its VAE encodes a repaint's source in one piece, which beside the XL DiT runs out of 16 GB: 12 s tiles
        whole = dit.tiled_encode
        dit.tiled_encode = lambda audio, chunk_size=None, overlap=None, offload_latent_to_cpu=True: \
            whole(audio, chunk_size or 48000 * 12, overlap, offload_latent_to_cpu)
    llm = LLMHandler()
    tmp = root / "out/worker-tmp"
    tmp.mkdir(parents=True, exist_ok=True)

    def run(params, seed):
        cfg = GenerationConfig(batch_size=1, use_random_seed=False, seeds=[seed], audio_format="wav32")
        r = generate_music(dit, llm, params, cfg, save_dir=str(tmp))
        if not r.success:
            raise RuntimeError(r.error)
        a = r.audios[0]
        return a["tensor"].float().numpy().T, a.get("sample_rate", 48000)

    def gen(r):
        bpm, key, length = r.get("bpm"), r.get("key") or "", float(r["length"])
        common = dict(caption=r["prompt"], lyrics="[Instrumental]", instrumental=True, bpm=bpm, keyscale=key,
                      inference_steps=8, shift=3.0, seed=r["seed"])
        if not r.get("loop"):
            params = GenerationParams(task_type="text2music", timesignature="4" if bpm else "", duration=max(10.0, length),
                                      thinking=False, use_cot_caption=False, use_cot_metas=False, use_cot_language=False, **common)
            x, rate = run(params, r["seed"])
            return x[: int(length * rate)], rate
        # a loop: made 6 s longer (ACE-Step ends a piece with 2 to 4 s of fade), its ending cut off, turned round
        # by half, and the join, now in the middle, repainted: no crossfade
        if bpm:
            bar = 240.0 / bpm
            length = max(bar, round(length / bar) * bar)  # whole bars, so a beat does not stumble at the turn
        params = GenerationParams(task_type="text2music", timesignature="4" if bpm else "", duration=max(10.0, length + 6),
                                  thinking=False, use_cot_caption=False, use_cot_metas=False, use_cot_language=False, **common)
        x, rate = run(params, r["seed"])
        x = x[: int(length * rate)]
        half = len(x) // 2
        src = tmp / f"turned_{r['id']}.wav"
        sf.write(src, np.concatenate([x[half:], x[:half]]), rate, subtype="FLOAT")
        j = (len(x) - half) / rate
        rp = GenerationParams(task_type="repaint", src_audio=str(src), repainting_start=max(0, j - 2), repainting_end=j + 2,
                              chunk_mask_mode="explicit", duration=len(x) / rate, thinking=False, **common)
        y, rate2 = run(rp, r["seed"])
        src.unlink(missing_ok=True)
        return y, rate2
    return gen


def load_hunyuan(root, model):
    import torch
    import trimesh, fast_simplification
    from PIL import Image
    from rembg import remove, new_session
    from hy3dgen.shapegen import Hunyuan3DDiTFlowMatchingPipeline, FloaterRemover, DegenerateFaceRemover
    os.environ.setdefault("U2NET_HOME", str(root / "weights/u2net"))
    pipe = Hunyuan3DDiTFlowMatchingPipeline.from_pretrained("tencent/Hunyuan3D-2mini", subfolder="hunyuan3d-dit-v2-mini",
                                                            use_safetensors=True, variant="fp16", device="cuda")
    # BiRefNet (MIT) by name: rembg's default is BRIA RMBG-2.0, free for non-commercial use only
    session = new_session("birefnet-general")
    words = {}

    def picture_of(prompt, seed):
        # a prompt with no picture: SD-Turbo draws the thing alone, whole, on white (local-3d's sd_turbo_images.py)
        if "pipe" not in words:
            from diffusers import AutoPipelineForText2Image
            words["pipe"] = AutoPipelineForText2Image.from_pretrained("stabilityai/sd-turbo", torch_dtype=torch.float16, variant="fp16").to("cuda")
        style = ", single object, whole object in view, centered, three-quarter view, plain white background, studio lighting, 3d render"
        return words["pipe"](prompt + style, num_inference_steps=4, guidance_scale=0.0, width=512, height=512,
                             generator=torch.manual_seed(seed)).images[0]

    def gen(r):
        out = Path(r["out"])
        out.parent.mkdir(parents=True, exist_ok=True)
        if r.get("picture"):
            image = Image.open(r["picture"]).convert("RGB")
        else:
            image = picture_of(r["prompt"], r["seed"])
            image.save(out.with_suffix(".png"))
        cut = remove(image, session=session, bgcolor=[255, 255, 255, 0])
        cut.save(out.with_name(out.stem + "_cut.png"))
        mesh = pipe(image=cut, num_inference_steps=r.get("steps") or 30, octree_resolution=256, num_chunks=20000,
                    generator=torch.manual_seed(r["seed"]), output_type="trimesh")[0]
        mesh = DegenerateFaceRemover()(FloaterRemover()(mesh))
        # hundreds of thousands of triangles: brought to 20,000 here, the spec reduces it to its budget
        most = r.get("faces") or 20000
        if len(mesh.faces) > most:
            v, f = fast_simplification.simplify(mesh.vertices.astype("float32"), mesh.faces.astype("int32"), target_reduction=1 - most / len(mesh.faces))
            mesh = trimesh.Trimesh(v, f, process=True)
        mesh.fix_normals()
        mesh.export(out)
        return {"faces": int(len(mesh.faces)), "picture": None if r.get("picture") else str(out.with_suffix(".png")),
                "box": [[float(v) for v in mesh.bounds[0]], [float(v) for v in mesh.bounds[1]]]}
    return gen


LOADERS = {"woosh-dflow": load_woosh, "woosh-flow": load_woosh, "ezaudio": load_ezaudio, "moss-sfx": load_moss,
           "stable-audio-3-sfx": load_sa3, "acestep": load_acestep, "acestep-xl": load_acestep,
           "hunyuan3d-mini": load_hunyuan}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True, choices=sorted(LOADERS))
    ap.add_argument("--root", required=True)
    a = ap.parse_args()
    root = Path(a.root).resolve()
    os.environ.setdefault("HF_HOME", str(root / "weights/hf"))
    os.environ.setdefault("MIOPEN_FIND_MODE", "FAST")
    import torch
    t0 = time.time()
    try:
        gen = LOADERS[a.model](root, a.model)
    except Exception as error:  # the load failed: say so and stop
        say({"ready": False, "model": a.model, "error": f"{type(error).__name__}: {error}"})
        return 1
    say({"ready": True, "model": a.model, "load": round(time.time() - t0, 1)})
    for line in sys.stdin:
        if not line.strip():
            continue
        r = json.loads(line)
        try:
            t = time.time()
            made = gen(r)
            torch.cuda.synchronize()
            out = Path(r["out"])
            if isinstance(made, dict):  # a shape: written by its loader
                say({"id": r["id"], "ok": True, "file": str(out), **made, "took": round(time.time() - t, 2)})
                continue
            import soundfile as sf
            x, rate = made
            out.parent.mkdir(parents=True, exist_ok=True)
            sf.write(out, x, rate, subtype="FLOAT")
            say({"id": r["id"], "ok": True, "file": str(out), "rate": rate, "channels": 1 if x.ndim == 1 else x.shape[1],
                 "seconds": round(len(x) / rate, 3), "took": round(time.time() - t, 2),
                 "vram": round(torch.cuda.max_memory_allocated() / 1e9, 2)})
        except Exception as error:
            say({"id": r.get("id"), "ok": False, "error": f"{type(error).__name__}: {error}"})
    return 0


if __name__ == "__main__":
    sys.exit(main())
