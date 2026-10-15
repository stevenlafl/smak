"""A local generator, kept loaded, for the MCP tool `generate` (mcp/generate.mjs).

  <venv>/bin/python -I generators/worker.py --model <name> --root <generators folder>

It loads one model once, then reads requests from stdin, one JSON object a line:

  { "id": 1, "prompt": "...", "length": 2.5, "seed": 3, "out": "/abs/gen/hit_s3.wav",
    "bpm": 120, "key": "D minor", "loop": false }

and for each writes the take (the model's own rate and channels, 32-bit float) and answers on stdout, one line:

  { "id": 1, "ok": true, "file": "...", "rate": 48000, "channels": 1, "seconds": 2.5, "took": 1.9 }
  { "id": 1, "ok": false, "error": "..." }

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


LOADERS = {"woosh-dflow": load_woosh, "woosh-flow": load_woosh, "acestep": load_acestep, "acestep-xl": load_acestep}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True, choices=sorted(LOADERS))
    ap.add_argument("--root", required=True)
    a = ap.parse_args()
    root = Path(a.root).resolve()
    os.environ.setdefault("HF_HOME", str(root / "weights/hf"))
    os.environ.setdefault("MIOPEN_FIND_MODE", "FAST")
    import soundfile as sf
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
            x, rate = gen(r)
            torch.cuda.synchronize()
            out = Path(r["out"])
            out.parent.mkdir(parents=True, exist_ok=True)
            sf.write(out, x, rate, subtype="FLOAT")
            say({"id": r["id"], "ok": True, "file": str(out), "rate": rate, "channels": 1 if x.ndim == 1 else x.shape[1],
                 "seconds": round(len(x) / rate, 3), "took": round(time.time() - t, 2)})
        except Exception as error:
            say({"id": r.get("id"), "ok": False, "error": f"{type(error).__name__}: {error}"})
    return 0


if __name__ == "__main__":
    sys.exit(main())
