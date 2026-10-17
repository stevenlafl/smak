# Generators: sound and music models run on this machine

The MCP tool `generate` makes sounds, music and shapes with open models run locally, on the GPU, with no
outside service. The kit stays Node alone; the models live in a folder of their own (tens of GB), each in a Python
venv, and the server is pointed at it: `smak mcp --work <dir> --generators <folder>` (or `SMAK_GENERATORS`).

Which models, and why: `research/local-sound-generators.md` and `research/local-music-generators.md`. In
short, Stable Audio 3 small SFX and Woosh-DFlow for sounds, both (level in Steven's blind listening, each better
at some sounds: a call draws takes from each), ACE-Step 1.5
XL for music (the 2B is the fast choice), and for shapes Hunyuan3D-2mini (`research/local-3d-generators.md`):
a picture of the thing, its subject cut out by BiRefNet, made into a mesh; with words alone a picture is drawn
first: a character's by Z-Image-Turbo held to its base's pose (`research/character-image-models.md`), else by
SD-Turbo. Each input keeps its own route: a picture given (a photograph, a render of a model) goes to the shape
model as it is.

## Filling the folder

```
bash generators/install.sh <folder>          the sound models: Woosh Flow and DFlow (and TangoFlux, EzAudio), venvs/audio-rocm;
                                             MOSS-SoundEffect v2.0, venvs/moss-rocm; Stable Audio 3 small SFX, venvs/sa3-rocm
                                             (gated: HF_TOKEN in the environment, its terms accepted on Hugging Face)
bash generators/install-music.sh <folder>    the music models: ACE-Step 1.5 2B and XL, venvs/acestep-rocm (after install.sh)
bash generators/install-3d.sh <folder3d>     the shape model: Hunyuan3D-2mini, SD-Turbo, BiRefNet, venvs/torch-rocm; the picture
                                             model: Z-Image-Turbo (Q8 GGUF), its Fun ControlNet Union 2.1 lite, venvs/zimage-rocm
bash generators/install-segment.sh <folder3d>  the subject cutter: OWLv2, Grounding DINO, YOLO-World with CLIP, SAM 2.1 small,
                                             venvs/segment-rocm
cp generators/generators.example.json <folder>/generators.json   (its shape model's root is ../local-3d: change it to <folder3d>)
```

Both scripts are idempotent and say how to undo them in their headers. They need uv, git with GitHub ssh
access, gh, curl, sox and ffmpeg; no sudo. They install PyTorch for ROCm (an AMD card, as here); on NVIDIA,
take the CUDA wheels instead. About 150 GB in all. On this machine the folders are
`/media/Data3/Packages/local-audio` and, for shapes, `/media/Data3/Packages/local-3d`.

## generators.json

```json
{ "models": [{ "name": "stable-audio-3-sfx", "kind": "sound", "python": "venvs/sa3-rocm/bin/python",
               "licence": "Stability AI Community Licence", "default": true, "longest": 120,
               "env": { "HF_HUB_OFFLINE": "1" } }] }
```

`name` is one `worker.py` knows (`woosh-dflow`, `woosh-flow`, `moss-sfx`, `stable-audio-3-sfx`, `ezaudio`, `acestep`,
`acestep-xl`, `hunyuan3d-mini`, `zimage-turbo`, `hunyuan3d-paint`, `segment`);
`kind` `sound`, `music`, `shape`, `picture` (a picture model: what draws a character from words for a shape),
`paint` (what paints a character's sides from its front picture) or `segment` (what cuts a named subject out of a
picture); `root` the model's own folder, from this one (the 3D models live apart);
`python` the venv's interpreter, from its root; `licence` is written into every take's sidecar, and
a sound spec built from a take under a non-commercial one says so; `default` the kind's model when a call
names none (marked on several sound or music models, a call draws its seeds from each, the files named after
the model; a shape takes the first); `longest` the most seconds the model makes; `env` more environment for its process.

## The worker

`worker.py` loads one model and keeps it: the server starts it on the first call to that model and stops it
for another (one fits on a 16 GB card at a time) or after ten minutes unused. It reads a request a line on
stdin and answers a line on stdout (its header has the format); everything the libraries print goes to
stderr. Measured here (RX 9070 XT): Woosh-DFlow loads in 45 to 65 s and makes a take in 0.4 s, Stable Audio 3 small SFX loads in about 30 s and makes a take in 0.4 s, holding 2.3 GB; MOSS-SoundEffect
loads in 80 to 115 s and makes any take up to 30 s in 15.5 s (its first in about 40, compiling), holding 11 to 12 GB;
ACE-Step 2B
loads in 45 to 65 s and makes 12 s of music in 3 s, XL loads in about 3 minutes and makes 4 minutes in 20 s;
Hunyuan3D-2mini loads in about 2 minutes and makes a shape (a picture drawn, cut out, 30 steps, reduced to
20,000 triangles) in under a minute; its process peaked at 18.7 GB of memory (resident, not the card's), so
leave it room: not beside a game, or another heavy job. A character's take (`generate`'s `base`) is drawn over
its base's figure in the stance it will be built in, image to image (`GUIDE_STRENGTH` 0.7 of `GUIDE_STEPS` 6 in
`worker.py`), so its limbs stand clear of its body: from words alone SD-Turbo drew a guard's hands on its thighs,
and the mesh fused there tore in every run. `only: "picture"` draws the pictures and stops (seconds each, the
model loaded): look at them first, and make the shape of the one chosen with `picture`. SD-Turbo runs in bf16:
on this card fp16 multiplies at a third of bf16's speed, and SD-Turbo drew a picture in 0.27 s against 0.89 at
the same quality; Hunyuan3D-2mini stays fp16 (no faster in bf16, and its shape drifted).

With a picture model (`zimage-turbo`, kind `picture`) and a biped base, a character's pictures are Z-Image-Turbo's
instead, at 1024, held by the Fun ControlNet Union 2.1 lite to an OpenPose picture SMAK draws from the base's
bones in the stance it is built in (`src/openpose.mjs`), whose colours fix which way the figure faces; the shape
is then made from each. It loads in about 2.5 minutes and draws a picture in 11 s (its first about 80, setting
up kernels), holding 11.2 GB of the card: the 8 GB text encoder and the transformer are swapped on the card by
hand for each new prompt, and the VAE works in tiles. Its process holds the text encoder in RAM besides. On the
guard brief all four takes faced the viewer with the vest's lettering, helmet, holster and boots, where SD-Turbo's
were washed grey and one in four from behind; at a control scale of 1.0 (`CONTROL_SCALE`) two in four stood in
the base's stance and two strode, as a brief that says the character "runs" pulls them. Its root is the 3D folder;
`HF_HUB_OFFLINE` and `PYTORCH_HIP_ALLOC_CONF=expandable_segments:True` in its `env` (generators.example.json).
With `turnaround: true` it draws a character's front and back side by side in one 2048 x 1024 picture, held to the
base's skeleton drawn from the front and from behind (no nose or eyes on the back, its right shoulder to the
picture's right), and cuts it in two; the worker takes a `width` and a `height` for it. The shape worker cuts the
back out with BiRefNet beside the front (its request's `cuts`), so that both project with their outlines found.

The sides neither picture sees are painted by Hunyuan3D-Paint 2.0 turbo (`hunyuan3d-paint`, kind `paint`, in
`venvs/torch-rocm` with the 3D folder as its root: `generators/paint.py`, from the Hunyuan3D-2 snapshot and repo
`install-3d.sh` puts there). Once a character's shape is made (`generate`'s `base`, unless `sides: false`), the
shape model is let go and the paint model paints six views of the mesh from its front cut-out; the answer gives the
spec's `project` with the views from its left and right at `yaw` 90 and 270. Its CUDA rasterizer is not needed:
the normal and position maps it is given are drawn in numpy exactly as its MeshRender draws them, and SMAK's
`project` bakes the views. The multiview net stays loaded (8.1 GB on the card); the de-lighting model is loaded for
each take and let go (4.3 GB), so the two never share the card. On the guard: maps in 16 s, de-lighting in 32 s,
six views at 512 in 63 s, about 55 s of that loading. Its unet's weights are read from the snapshot's
`.safetensors` (the repo asks for a `.bin`), its image-prompt adapter's keys left out. By hand: `python
generators/paint.py <mesh.obj> <picture_cut.png> <out dir>`.

## Cutting a named subject out of a picture

A shape's picture is cut by BiRefNet, which takes whatever stands out most, and the kit's projection by the
colour of the picture's border: both fail on a cluttered photograph (the chair, not the table). The segment model
(`segment`, kind `segment`, `generators/segment.py` through `worker.py`) finds the subject by its words with three
open-vocabulary detectors, OWLv2 (Apache-2.0), Grounding DINO base (Apache-2.0) and YOLO-World v2 x (AGPL-3.0),
holds each one's best box to the words with CLIP ViT-B/32 (MIT) unless all three agree, and cuts the winner with SAM
2.1 small (Apache-2.0). `generate { kind: "segment", picture, subject }` writes `_mask.png`, `_cut.png` (the
background clear) and `_white.png` (the subject alone on white, cropped) under `work:gen/`, with each detector's box
and score; `point: [x, y]` cuts from a click instead; `generate { kind: "shape", picture, subject }` cuts first and
makes the shape of the white picture. `src/segment.mjs` (`segmentOf`, `every: true` for all of a kind) is the same
outside the server, for the photogrammetry's masks of people, monsters and HUD.

Measured (`research/segment/compare.mjs`; the game's own models laid over a cluttered photograph, the true mask
known; mean IoU over six subjects): OWLv2 0.53, Grounding DINO 0.64, YOLO-World 0.63, the vote 0.84, BiRefNet 0.33,
the colour logic 0.02. Where a detector finds the right thing SAM 2's cut scores 0.91 to 0.98: every miss is the
wrong box, and each detector misses different subjects (OWLv2 and YOLO-World both took a chair for "a security
guard"; the vote still takes a crop of the scientist's coat over the scientist). A request takes about 6 s with the
three detectors loaded; the first, loading them, a minute. Its venv reads as 15.4 GB, 13.8 of it torch and 0.9
triton, but uv hardlinks those from its cache into every venv of the folder with the same wheel: on disk it adds
about 0.46 GB. Its models are about 3.8 GB.

## A library of materials

Not a model: photographs. `node generators/fetch-materials.mjs <folder>` fetches every texture Poly Haven gives away
(CC0: 862 of them, their diffuse map at 1k, about 600 MB) with an index of what each is and its real size in game
units. The MCP server takes it as `--materials <folder>` (or `SMAK_MATERIALS`): the tool `materials` searches it, and a
map's or a .wad's material takes `picture: "library:<name>"`. Idempotent; rerun it to fetch what failed. On this
machine the folder is `/media/Data3/Packages/material-library`.
