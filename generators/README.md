# Generators: sound and music models run on this machine

The MCP tool `generate` makes sounds and music with open models run locally, on the GPU, with no outside
service. The kit stays Node alone; the models live in a folder of their own (tens of GB), each in a Python
venv, and the server is pointed at it: `smak mcp --work <dir> --generators <folder>` (or `SMAK_GENERATORS`).

Which models, and why: `research/local-sound-generators.md` and `research/local-music-generators.md`. In
short, Woosh-DFlow for sounds (the most accurate to Steven's ear; Woosh-Flow had the best hit) and ACE-Step
1.5 XL for music (the 2B is the fast choice).

## Filling the folder

```
bash generators/install.sh <folder>          the sound models: Woosh Flow and DFlow (and TangoFlux, EzAudio), venvs/audio-rocm
bash generators/install-music.sh <folder>    the music models: ACE-Step 1.5 2B and XL, venvs/acestep-rocm (after install.sh)
cp generators/generators.example.json <folder>/generators.json
```

Both scripts are idempotent and say how to undo them in their headers. They need uv, git with GitHub ssh
access, gh, curl, sox and ffmpeg; no sudo. They install PyTorch for ROCm (an AMD card, as here); on NVIDIA,
take the CUDA wheels instead. About 95 GB in all. On this machine the folder is
`/media/Data3/Packages/local-audio`.

## generators.json

```json
{ "models": [{ "name": "woosh-dflow", "kind": "sound", "python": "venvs/audio-rocm/bin/python",
               "licence": "CC-BY-NC 4.0 (weights; code MIT)", "default": true, "longest": 5 }] }
```

`name` is one `worker.py` knows (`woosh-dflow`, `woosh-flow`, `acestep`, `acestep-xl`); `kind` `sound` or
`music`; `python` the venv's interpreter, from the folder; `licence` is written into every take's sidecar, and
a sound spec built from a take under a non-commercial one says so; `default` the kind's model when a call
names none; `longest` the most seconds the model makes; `env` more environment for its process.

## The worker

`worker.py` loads one model and keeps it: the server starts it on the first call to that model and stops it
for another (one fits on a 16 GB card at a time) or after ten minutes unused. It reads a request a line on
stdin and answers a line on stdout (its header has the format); everything the libraries print goes to
stderr. Measured here (RX 9070 XT): Woosh-DFlow loads in 45 to 65 s and makes a take in 0.4 s; ACE-Step 2B
loads in 45 to 65 s and makes 12 s of music in 3 s, XL loads in about 3 minutes and makes 4 minutes in 20 s.
