# Generators: sound and music models run on this machine

The MCP tool `generate` makes sounds, music and shapes with open models run locally, on the GPU, with no
outside service. The kit stays Node alone; the models live in a folder of their own (tens of GB), each in a Python
venv, and the server is pointed at it: `smak mcp --work <dir> --generators <folder>` (or `SMAK_GENERATORS`).

Which models, and why: `research/local-sound-generators.md` and `research/local-music-generators.md`. In
short, Woosh-DFlow for sounds (the most accurate to Steven's ear; Woosh-Flow had the best hit), ACE-Step 1.5
XL for music (the 2B is the fast choice), and for shapes Hunyuan3D-2mini (`research/local-3d-generators.md`):
a picture of the thing, its subject cut out by BiRefNet, made into a mesh; with words alone, SD-Turbo draws
the picture first.

## Filling the folder

```
bash generators/install.sh <folder>          the sound models: Woosh Flow and DFlow (and TangoFlux, EzAudio), venvs/audio-rocm;
                                             MOSS-SoundEffect v2.0, venvs/moss-rocm; Stable Audio 3 small SFX, venvs/sa3-rocm
                                             (gated: HF_TOKEN in the environment, its terms accepted on Hugging Face)
bash generators/install-music.sh <folder>    the music models: ACE-Step 1.5 2B and XL, venvs/acestep-rocm (after install.sh)
bash generators/install-3d.sh <folder3d>     the shape model: Hunyuan3D-2mini, SD-Turbo, BiRefNet, venvs/torch-rocm
cp generators/generators.example.json <folder>/generators.json   (its shape model's root is ../local-3d: change it to <folder3d>)
```

Both scripts are idempotent and say how to undo them in their headers. They need uv, git with GitHub ssh
access, gh, curl, sox and ffmpeg; no sudo. They install PyTorch for ROCm (an AMD card, as here); on NVIDIA,
take the CUDA wheels instead. About 150 GB in all. On this machine the folders are
`/media/Data3/Packages/local-audio` and, for shapes, `/media/Data3/Packages/local-3d`.

## generators.json

```json
{ "models": [{ "name": "woosh-dflow", "kind": "sound", "python": "venvs/audio-rocm/bin/python",
               "licence": "CC-BY-NC 4.0 (weights; code MIT)", "default": true, "longest": 5 }] }
```

`name` is one `worker.py` knows (`woosh-dflow`, `woosh-flow`, `moss-sfx`, `stable-audio-3-sfx`, `ezaudio`, `acestep`,
`acestep-xl`, `hunyuan3d-mini`);
`kind` `sound`, `music` or `shape`; `root` the model's own folder, from this one (the 3D models live apart);
`python` the venv's interpreter, from its root; `licence` is written into every take's sidecar, and
a sound spec built from a take under a non-commercial one says so; `default` the kind's model when a call
names none; `longest` the most seconds the model makes; `env` more environment for its process.

## The worker

`worker.py` loads one model and keeps it: the server starts it on the first call to that model and stops it
for another (one fits on a 16 GB card at a time) or after ten minutes unused. It reads a request a line on
stdin and answers a line on stdout (its header has the format); everything the libraries print goes to
stderr. Measured here (RX 9070 XT): Woosh-DFlow loads in 45 to 65 s and makes a take in 0.4 s; MOSS-SoundEffect
loads in 80 to 115 s and makes any take up to 30 s in 15.5 s (its first in about 40, compiling), holding 11 to 12 GB;
ACE-Step 2B
loads in 45 to 65 s and makes 12 s of music in 3 s, XL loads in about 3 minutes and makes 4 minutes in 20 s;
Hunyuan3D-2mini loads in about 2 minutes and makes a shape (a picture drawn, cut out, 30 steps, reduced to
20,000 triangles) in under a minute.

## A library of materials

Not a model: photographs. `node generators/fetch-materials.mjs <folder>` fetches every texture Poly Haven gives away
(CC0: 862 of them, their diffuse map at 1k, about 600 MB) with an index of what each is and its real size in game
units. The MCP server takes it as `--materials <folder>` (or `SMAK_MATERIALS`): the tool `materials` searches it, and a
map's or a .wad's material takes `picture: "library:<name>"`. Idempotent; rerun it to fetch what failed. On this
machine the folder is `/media/Data3/Packages/material-library`.
