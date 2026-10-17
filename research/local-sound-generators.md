# Open sound generation models run locally, as a source of sounds for SMAK

Experiment, 2026-10-14. The question: can an open text-to-audio model, run on this machine with no outside
service, make game sound effects of Half-Life quality, and how would it fit SMAK? It was asked after Steven
listened to six sounds an agent synthesised through the kit for a small mod and called them horrible.

Abbreviations: VRAM (video memory), ROCm (AMD's GPU compute stack), DiT (diffusion transformer), VAE
(variational autoencoder, the part that turns latents into a waveform), ODE (ordinary differential equation,
what a flow model integrates), MCP (Model Context Protocol), dBFS (decibels relative to full scale), RMS (root
mean square level), T20 (seconds to fall 20 dB), HF (Hugging Face), NC (non-commercial), SAO (Stable Audio
Open).

Everything lives under `/media/Data3/Packages/local-audio/` (repos, venv, weights, out, scripts). Nothing in
this repository changed except this file and a section of `backlog.md`.

## Result in short

Four models ran on the GPU here: TangoFlux, EzAudio, and Sony's Woosh in its full (Flow) and distilled
(DFlow) forms. Each made the six sounds with four seeds. They are in `~/stignored/sounds-review/models/` for
Steven to listen to beside `haiku/` (the synthesis he disliked) and `valve/` (the game's).

| | TangoFlux | EzAudio XL | Woosh-Flow | Woosh-DFlow |
| --- | --- | --- | --- | --- |
| Licence of the weights | NC research only | **MIT** | CC-BY-NC 4.0 | CC-BY-NC 4.0 |
| Seconds a take (load once) | 18 (90 s load) | 5 for 1.5 s, 19 for 6 to 8 s (82 s load) | 9 to 18 (49 s load) | **0.4** (69 s load) |
| Peak VRAM (torch) | 6.8 GB | 9.8 GB | 3.8 GB | 3.8 GB |
| One-shots | often fill the length asked: two clangs, a cry, a pause, a cry | fill the length with a dense bed; few single events | **one event of natural length** (hit 0.43 s, swing 0.26 s) | as Flow, rougher |
| Loops | dense beds; drips with no room | best drips by the numbers | drips as clean single drops with silence between (a loop fault) | as Flow |
| Features in range, best takes, of 64 | 34 | 36 | 40 | 36 |

**The numbers cannot settle it, and the Haiku synthesis shows why**: the six sounds Steven called horrible
score 42 of 64 on the same measures, more than any model's best takes. SMAK's class measures (length, level,
crest, decay, centroid, flatness, five bands) say whether a sound sits where Half-Life's do; they do not say
whether it sounds like a wrench. So this report gives the numbers and the pictures, and the verdict is
Steven's ears. Read by the pictures, Woosh-Flow is the only model whose metal hit, swing and drips look like
the events asked for (section 4).

Recommendation (section 7): if Steven hears what the pictures suggest, use **Woosh** as an optional local
generator, its output brought into a sound spec as a new layer kind `sample` and finished by SMAK (trim,
envelope, filters, a synthesised bed or click, the loop seam, the class checks). Expose it as an MCP tool
`generate` that runs the installed model (option A of section 6), off unless the person points the server
at it. Woosh's weights are non-commercial; EzAudio is the MIT fallback; the Stable Audio models need Steven to
accept their licence on HF before they can be tried.

Second round (section 9, 2026-10-16): MOSS-SoundEffect v2.0 (Apache-2.0) and Stable Audio 3 small SFX
(Stability AI Community Licence) installed and run beside Woosh-DFlow and EzAudio. In Steven's blind
listening Stable Audio 3 was picked most often, and it is now the default (section 10).

## Steven's listening (2026-10-15)

He listened to the best takes beside Valve's and Haiku's synthesis:

| Model | What he heard |
| --- | --- |
| Woosh-DFlow | The most accurate of all; but its metal hit sounds like an electrical buzz |
| Woosh-Flow | The best hit |
| TangoFlux | Hit OK, but clanky like a pipe; the creature's attack and pain like a cat meowing |
| All | The attack and pain sound like aliens: the prompts said "alien creature", "screech", "squealing yelp", where the brief's crawler is a low, wet, six-legged thing (a gurgle, a chitter, a hiss would fit) |

His call then: **Woosh-DFlow the default**, iterated over seeds (its 0.4 s a take makes a seed search cheap),
with the other installed models selectable. So the `generate` tool takes a `model` and makes many seeds a
call. The default became Stable Audio 3 after the blind listening of section 10.

## 1. Candidates

Facts from each project's model card or repository unless marked "secondary". Check those before relying on
them.

| Model | Date | Licence (weights) | Size | Rate, channels | Longest | Audio-to-audio | Gated on HF | Here |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Stable Audio Open 1.0 (Stability) | 2024-06 | Stability AI Community Licence: free under $1M yearly revenue, else paid | 1.2B | 44.1 kHz stereo | 47 s | init audio (style transfer) through `stable-audio-tools` | yes | not tried: gated, no token here |
| Stable Audio Open Small (Stability, Arm) | 2025-05 | same | 0.5B | 44.1 kHz stereo | 11 s | no | yes | not tried: gated |
| Stable Audio 3 small SFX (Stability) | 2026-05 | same; Gemma terms for a bundled part | 433M (repository README) | 44.1 kHz stereo (repository README, its SAME autoencoder) | 120 s (repository README) | inpainting and continuation | yes ("auto") | **ran** (2026-10-16 round); the default since |
| TangoFlux (declare-lab) | 2024-12 | NC research only, plus SAO's licence (it uses SAO's VAE) | 0.5B (secondary) | 44.1 kHz stereo | 30 s | no | no | **ran** |
| EzAudio (Hai et al.) | 2024-09 paper; MIT weights | **MIT** (HF card; repository LICENSE MIT) | XL DiT, 3.5 GB checkpoint; flan-T5-XL text encoder | 24 kHz mono | 10 s | **editing and inpainting** (a masked span regenerated) | no | **ran** |
| Woosh (Sony AI) | 2026-04 | CC-BY-NC 4.0; code MIT (video parts Apache 2.0) | Flow and distilled DFlow, 1.3 GB each, plus AE, CLAP, text conditioner | 48 kHz mono | a 5 s window (501 latent frames) | video-to-audio; none for audio | no (GitHub release) | **ran**, both forms |
| AudioLDM 2 (CVSSP) | 2023 | CC-BY-NC-SA 4.0 | 0.35B to 1.1B | 16 kHz mono | about 10 s | none built in | no | not run: 16 kHz, older |
| Tango 2 (declare-lab) | 2024 | CC-BY-NC-SA 4.0 | 0.87B (secondary) | 16 kHz mono | 10 s | no | no | not run: TangoFlux replaces it |
| AudioGen medium (Meta, audiocraft) | 2023 | CC-BY-NC 4.0 | 1.5B | 16 kHz mono | 5 to 10 s | continuation from an audio prompt | no | not run: 16 kHz, audiocraft pins an old torch |
| MAGNeT audio (Meta, audiocraft) | 2024 | CC-BY-NC 4.0 | 0.3B, 1.5B | 16 kHz mono | 10 s | no | no | not run: as AudioGen |
| Make-An-Audio 2 (Zhejiang U.) | 2023 | code MIT; weights' terms unclear | about 0.9B (secondary) | 16 kHz mono | 10 s | no | no | not run |
| MMAudio (Cheng et al.) | 2024-12 | CC-BY-NC 4.0 (secondary) | 0.16B to 1.03B | 44.1 kHz | 8 s | video-to-audio; text alone works | no | not run |
| MOSS-SoundEffect (OpenMOSS) | 2026 | **Apache 2.0** | 8B, autoregressive (v1) | not stated | long | no | no | not run: 8B in bf16 is 16 GB, the whole card |
| MOSS-SoundEffect v2.0 (OpenMOSS) | 2026-05 | **Apache 2.0** (HF card; Qwen3-1.7B text encoder Apache 2.0) | 1.3B DiT, DAC VAE | 48 kHz mono | 30 s | no | no | **ran** (2026-10-16 round) |

Why these three: Woosh is the newest, made for sound effects, and its paper reports beating SAO and TangoFlux;
TangoFlux is the strongest open model that needs no token; EzAudio is the only one with permissive weights
and audio editing. All three are 24 to 48 kHz; the 16 kHz models were left out, since 16 kHz loses everything
over 8 kHz and GoldSrc plays 22050 Hz.

The licence concern, once: of the models run, only EzAudio's weights allow commercial use. TangoFlux and Woosh
are non-commercial, and the Woosh mirror's notes say generated audio inherits that. A free mod is
non-commercial; a sold one is not. Steven decides.

## 2. What ran, and how

Same machine as `local-3d-generators.md`: AMD Radeon RX 9070 XT (gfx1201, 16 GB), no system ROCm, the ROCm
runtime inside the PyTorch wheels, no sudo. One heavy job at a time.

### Setup

`/media/Data3/Packages/local-audio/scripts/install.sh` does all of it and is idempotent (run once again from
an installed state to prove it):

- one venv, `venvs/audio-rocm`: Python 3.12, `torch 2.9.1+rocm6.4` (the same wheels as local-3d, through its
  uv cache, so they hardlink), transformers 4.57, diffusers 0.35, huggingface_hub below 1;
- repositories `TangoFlux` (164420f), `Woosh` (7f238bb), `EzAudio` (86f1826), cloned over ssh, the first two
  installed editable with `--no-deps` (their pins, torch 2.4 and CUDA torch 2.8, are ignored);
- weights: Woosh's release zips by `gh release download` (5 of its 10: AE, CLAP, Flow, DFlow,
  TextConditionerA), EzAudio's XL checkpoint and VAE by URL, TangoFlux and flan-T5 by HF on first use.

Disk: venv 16 GB, weights 35 GB (HF cache 18 GB: TangoFlux, flan-T5-large and XL; Woosh 13 GB with its 6.3 GB
of zips kept; EzAudio 3.5 GB), repositories 0.5 GB.

### What had to be fixed to run on this card

| Model | Problem | Fix (in `scripts/generate.py`, nothing in the repositories changed) |
| --- | --- | --- |
| TangoFlux | its `generate()` never passes the seed: every seed gave the same bytes | call `model.inference_flow(..., seed=)` directly |
| TangoFlux | it always makes its 30 s window of latents and decodes all of it; the VAE took 23 to 61 s a call on ROCm, and a 1 s crop of a 30 s window came out silent | decode only the first (length + 1.5) s of latents: 18 s a take in all |
| Woosh | its configs name the other checkpoints by relative path | run from `weights/woosh` |
| EzAudio | Woosh's editable install claims the top-level name `api`, which EzAudio's code imports | load `EzAudio/api/ezaudio.py` by its path |
| EzAudio | `generate_audio()` passes seconds times the latent rate as a size, and fails on any fraction | call its `inference()` with whole frames |
| EzAudio | its VAE loader wants `config.json` beside the checkpoint | the config copied beside it in `weights/ezaudio/vae/` |

`MIOPEN_FIND_MODE=FAST` was set for every run (MIOpen, AMD's kernel library, otherwise searches for kernels at
length on each new shape).

### Running it

```
cd /media/Data3/Packages/local-audio
export HF_HOME=$PWD/weights/hf MIOPEN_FIND_MODE=FAST
venvs/audio-rocm/bin/python -I scripts/generate.py woosh-flow out/woosh-flow     # or tangoflux, ezaudio, woosh-dflow
node scripts/finish.mjs out/woosh-flow       # GoldSrc format, SMAK's measures, best take to the review folder
node scripts/measure.mjs ~/stignored/sounds-review/haiku
node scripts/compare.mjs ~/stignored/sounds-review out/compare
```

`generate.py` also has a branch for SAO 1.0 through diffusers (`sao`), untested until the licence is accepted.

The prompts (`scripts/prompts.json`), one each, with the length asked:

| Sound | Length asked | Prompt |
| --- | --- | --- |
| cbar_hit1 | 1.5 s | a heavy steel pipe wrench strikes a metal pipe, one loud metallic clang with a short ring |
| cbar_miss1 | 1.0 s | a heavy wrench swung fast through the air, one short whoosh |
| hc_attack1 | 1.5 s | a small wet alien creature's aggressive attack screech, a slimy hissing shriek |
| hc_pain1 | 1.2 s | a small wet alien creature cries out in pain, a short squealing yelp |
| fw_pump | 6 s | a mechanical pump droning steadily, constant motor hum and rhythmic piston thump, industrial machinery |
| fw_drips | 8 s | water dripping in an empty concrete room, drops falling one after another with a light echo |

Woosh ignores the length (it always makes 5 s) and EzAudio caps it at 10 s.

### Finishing (`scripts/finish.mjs`)

Every take, the same way: sox makes it mono 22050 Hz 16-bit; then a 25 Hz high-pass (DC); a one-shot is
trimmed from 2 ms before the first 5 ms window over -45 dB of its peak to 20 ms after the last over -40 dB,
never longer than the length asked, with a 2 ms fade in and a 30 ms fade out; a loop keeps the length asked,
drops its first 0.15 s and has its seam crossfaded over 0.5 s (equal power), with a cue at sample 0. Peak
-0.5 dBFS, except the swing at -8.9 dBFS, the level of the game's own swing, so that its RMS is held against
the game's at the same peak (the brief said -0.5 for all; the swing is the one place that would move a
measured feature by itself). Written by SMAK's `writeWav`, checked by `checks`, scored by `scoreAgainst`.

The best take of each sound: no fault first, then the most features in range, then SMAK's points (2 in
range, 1 near), then the fewest warnings. Every take is also in `models/<model>/takes/`, because section 4
shows the numbers pick badly.

## 3. Measured

Features "in range" are those inside the class's widened range (`rangesOf`, section 5.4 of
`sound-generation.md`): 11 for a one-shot, 10 for a loop (no T20). SMAK has no creature class; for the attack
and pain cries the ranges were made the same way from Half-Life's `headcrab/hc_attack1..3` and `hc_pain1..3`,
measured in place, read only (so Valve's own file scores full marks by construction there).

Best take of each model; in brackets the range over its four seeds; F n is how many of the four takes have a
fault; then the finished length.

| Source | cbar_hit1 (metal hit) | cbar_miss1 (swing) | hc_attack1 | hc_pain1 | fw_pump (loop machine) | fw_drips (loop drips) | Sum of 64 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Valve (the game's) | 11 | 11 | 11 | 11 | (no file) | 10 | |
| Haiku synthesis | 8 | 8 | 6 | 4 | 10, F (silent 73%) | 6, F (silent 95%) | 42 |
| TangoFlux | 6 (2-6), 1.5 s | 5 (1-5), 1.0 s | 5 (2-5), 0.63 s | 7 (5-7), 1.2 s | 7 (4-7), 5.35 s | 4 (2-4), 7.35 s | 34 |
| EzAudio | 5 (1-5), 1.5 s | 6 (3-6), 0.45 s | 6 (5-6), 1.5 s | 7 (4-7), 1.2 s | 5 (2-5), 5.35 s | 7 (3-7), 7.35 s | 36 |
| Woosh-Flow | 5 (3-5), 0.43 s | 7 (5-7), 0.26 s | 8 (6-8), 1.5 s | 6 (5-6), 1.2 s | 9 (6-9), 4.35 s | 5 (3-5), F4, 4.35 s | 40 |
| Woosh-DFlow | 3 (2-3), 1.5 s | 7 (5-7), 0.29 s | 8 (7-8), 1.5 s | 10 (6-10), 1.2 s | 6 (5-6), 4.35 s | 2 (2-5), F3, 4.35 s | 36 |

Faults: the only engine faults any model take had were drip loops silent 72 to 90% of the time (Woosh, seven
of eight takes), the fault SMAK added after the Haiku run. Woosh-Flow's best drip take still has it (all four
did). No take clipped, started late, clicked at its end or at a loop seam.

What the numbers say is off, best takes (the full lines are in `out/<model>/best.json`):

- **Metal hit**: every model's is too long or too pure (flatness under 0.16) and misplaces the 600 to 2000 Hz
  band, where 74% of the game's crowbar hit sits. Woosh-Flow's is 0.43 s with T20 0.22 s (the game's 0.32 to
  0.56) but puts 83% of its power at 2 to 5 kHz: brighter than the crowbar.
- **Swing**: Woosh's are the right length (0.26 to 0.29 s, the game's 0.34) but dark, 60 to 70% under 150 Hz
  where the game's whoosh is 66% at 150 to 600 Hz. TangoFlux's and EzAudio's run their whole length.
- **Attack**: Woosh's takes are noisy bursts at the right centroid, over-long (the 1.5 s cap) and too tonal.
- **Pain**: Woosh-DFlow's best is in range on 10 of 11, off only on flatness.
- **Pump**: Woosh-Flow's best is in range on 9 of 10 (off: 4.35 s against 2.0 to 3.4). TangoFlux and EzAudio
  put 47 to 74% of the power under 150 Hz where the game's industrial loop is 94% at 150 to 600 Hz.
- **Drips**: all models' are too bright (centroid 2.1 to 2.3 kHz against 0.84 kHz).

### Time and memory

| Model | Load | Seconds a take | Peak VRAM (torch) |
| --- | --- | --- | --- |
| TangoFlux, 50 steps, partial decode | 90 s | 18 to 30 (any length up to 8 s) | 6.8 GB |
| EzAudio XL, 50 DDIM steps | 82 s | 5.1 to 5.6 for 1 to 1.5 s, 19 to 20 for 6 to 8 s | 9.8 GB (flan-T5-XL in fp32 is most of it) |
| Woosh-Flow, adaptive ODE | 49 s | 9.5 to 18 for its 5 s window | 3.8 GB |
| Woosh-DFlow, 4 steps | 69 s | 0.37 to 0.38 for its 5 s window (5.5 the first, compiling) | 3.8 GB |

"Peak VRAM" is what torch allocated; the runtime's own use comes on top (the card showed 11 to 13 GB in use
with the desktop while TangoFlux ran). First runs compile GPU kernels; the first take of each model is the
slow one.

## 4. How they look

`~/stignored/sounds-review/models/pictures/<sound>.png`: Valve, Haiku and each model's best take, one under
another at one time scale (SMAK's `soundPicture`, waveform over a log-frequency spectrogram). What they show,
which the class numbers do not:

- **Metal hit**: Woosh-Flow's is a struck thing: one sharp onset, a few ringing partials, a decay over 0.4 s,
  the same outline as the game's crowbar hit. TangoFlux's take is two clangs in 1.5 s (the first alone would
  be a hit). EzAudio's and Woosh-DFlow's "best" takes are continuous noise beds with no hit in them at all,
  yet score 5 and 3 of 11: the number picked a take a person would throw away.
- **Swing**: Woosh's two are short swells; EzAudio's a soft 0.45 s hiss; TangoFlux's a flat second of hiss.
- **Attack**: none is a single burst as the game's is (a few sharp transients and a tail). Woosh-Flow's has
  separate bursts with gaps, the closest in outline; TangoFlux's a single smooth tonal swell.
- **Pain**: Woosh-DFlow's is a steady buzzy harmonic tone, like the game's squeal in outline. TangoFlux's is a
  voiced cry with clear harmonics, then a pause, then another.
- **Pump**: all four are dense steady beds; only Woosh-Flow's shows a regular beat in its waveform.
- **Drips**: Woosh-Flow's are five clean drops, each with a short pitched ring as the game's have, but nothing
  between them (the game's has a quiet room under its drops). EzAudio's and TangoFlux's are a busy patter over a
  bed: in range on more numbers, less like drips in the picture.

So the models' one-shots need choosing and cutting: a take is often several events, or the event plus noise,
and the right one is found by its onset, not by the class score. That is the same job a sound designer does
with a library recording, and the reason the design below makes the generated file one layer of a spec, not
the finished sound.

### A trial of the design's main idea

`scripts/bed-trial.mjs` put a quiet band-passed noise bed (120 to 900 Hz, its own seam crossfaded) under
Woosh-Flow's drip loop, the "room" the game's drips have. At 28 dB under the drops' peak, the fault (silent
72% of the time) is gone and the features in range are unchanged (5 of 10, still too bright and too short);
at 40 dB under, the fault stays. A generated sample plus one synthesised layer clears a fault neither cleared
alone.

## 5. What each did well and badly, by the numbers and pictures

- **TangoFlux**: the most "produced" sound (voice-like cries with harmonics, a full metallic hit), but slow on
  this card (18 s a take after the decode fix), duration conditioning loose (it fills or overruns the length),
  and NC. Its pump and drips are the furthest from the game's bands.
- **EzAudio**: the fastest of the full-quality models on short sounds and the only permissive licence, with
  inpainting (regenerate a span of a file given the rest), which is what a loop seam or a too-long take needs.
  Its one-shots here are mostly beds, not events: shorter lengths or different prompts may help; not tried.
- **Woosh-Flow**: the cleanest one-shots and the only clear single hit, swing and drip events; pump 9 of 10.
  Fixed 5 s window, 48 kHz mono, NC. Its drips need a bed (or more drips) to pass the loop check.
- **Woosh-DFlow**: 0.4 s a take, so 30 seeds cost 12 s; one-shots rougher than Flow's (its best hit is noise),
  its best pain cry the closest of all to the game's by the numbers. Good for drafts and seed searches, then
  the chosen prompt run through Flow.

## 6. How it fits SMAK

### The spec side: a layer of kind `sample`

A sound spec layer that takes a WAV file from the work folder and treats it as any other layer:

```json
{ "id": "clang", "kind": "sample", "file": "gen/cbar_hit_s3.wav",
  "onset": 1, "length": 0.6, "pitch": -3, "gain": 0,
  "env": { "points": [[0, 0], [0.45, -12], [0.6, -60]] },
  "filter": [{ "type": "peak", "f": 1200, "q": 1, "gain": 4 }] }
```

| Field | |
| --- | --- |
| `file` | A `.wav` in the work folder (or the spec's own folder), any rate, 8, 16, 24 or 32-bit integer or 32-bit float, mono or stereo: mixed to mono and resampled to the spec's rate (a windowed-sinc resampler in the kit, about 40 lines) |
| `from`, `length` | Seconds into the file to take, and how much. Or `onset: n`: from the nth onset the kit finds (`features().onsets`, made to return times) to the next, or to `length`. This is the cut section 4 says every take needs |
| `at`, `gain`, `pitch`, `env`, `filter`, `drive`, `post` | As every layer has them: the sample is placed, levelled, pitched (resampled), shaped and filtered the same way |
| `reverse` | Played backwards (a swell into a hit) |

The rest of the spec is unchanged: other layers mix with it (a synthesised click on a generated clang, a bed
under generated drips, as the trial showed), `finish` saturates, limits and sets the peak, `loop` crossfades
the seam and writes the cue, `class` and `reference` hold it against the game's, `variants` make `hit2` by
pitch and gain. The build stays deterministic: it reads the file, never a prompt, so the same spec and file
give the same bytes, and the build never runs a model.

The report says, for a sample layer, the file's own rate and length, its hash, and, when a sidecar
`<file>.json` is there (written by the generator: model, version, prompt, seed, licence), that provenance, with
a warning when the licence is non-commercial. Two checks: a file over 30 s is refused (a sample layer is a
part, not a song), and a file the spec's `name` would overwrite is refused (a spec never consumes its own
output). Neither the repository nor the spec ever holds a generated file of a game's sound.

What the kit needs for it: `readWav` reading 24-bit, 32-bit and float (format 3) data; a resampler; onset
times from `features`; the layer in `src/spec/sound.mjs` and `synth.mjs`; `docs/SPEC.md` "A sound" and a worked
case. No dependency.

### Getting a generated file into the work folder: two options

**(A) An MCP tool `generate` on the server, running a locally installed model.** No outside API, no keys;
optional: without a generator installed the tool is not offered and the kit works as now.

- How the server finds it: `--generators <folder>` on `smak mcp` (as `--compilers` finds SDHLT or VHLT), or
  `SMAK_GENERATORS` in the environment. The folder holds a manifest, `generators.json`, one entry a model:
  `{ name, python, script, rate, window, licence, vram }`, pointing at the venv's Python and a script that takes
  one JSON line (prompt, length, seeds, out paths) and writes the WAVs and their sidecars. `local-audio` would
  carry that manifest and script; the kit carries only the tool.
- Inputs: `{ prompt, length (s), seeds: n or a list, model (default the manifest's first), name (a path in
  the work folder, "gen/cbar_hit"), class (optional) }`.
- Outputs: the files `work:gen/cbar_hit_s0.wav` ... at the model's own rate, each with a sidecar; for each
  take its length, peak, features, onsets with their times, faults, and with `class` the score against the
  game's; one picture of all the takes one under another (as `compare.mjs`), returned as an image, so the agent
  chooses by onsets and the picture, not by the score alone.
- How long a call takes: the model loads once a server (50 to 90 s, measured above), so the server keeps one
  worker process alive after the first call; then Woosh-DFlow 0.4 s a take, Woosh-Flow 10 to 18 s, EzAudio 5
  to 20 s, TangoFlux 18 to 30 s. A call of four Woosh-Flow seeds is about a minute; the tool's timeout should
  be minutes, not the `run` tool's seconds.
- GPU memory: 4 GB for Woosh, 7 for TangoFlux, 10 for EzAudio, plus the runtime's own. One model loaded at a
  time; the worker is stopped after some idle minutes so a game can have the card back.

**(B) The model as an offline step outside the server.** The person, or an agent with a shell (Claude Code),
runs `generate.py` and copies a take into the work folder; the spec then names it. A client with only the MCP
server can do this only through the `run` tool, by a script that starts the venv's Python as a child process,
which works only when the server was started without `--no-run` and runs arbitrary code; with `--no-run` the
person runs the command and says where the file is.

**Which: A.** Both keep the model out of the repository and the build deterministic, but only A lets a
client with no shell (the case the MCP server exists for) iterate: try four seeds, look at the onsets and the
picture, cut, layer and check, without asking the person to run a command between each step. The kit already
runs an outside program the person installs, found by a flag (the map compilers); a generator found by
`--generators` is the same contract. B stays the way for Claude Code and for anyone who wants the generator
nowhere near the server. Either way the spec names a file, never a prompt.

What the agent would write, under A, for the wrench's hit:

```
generate { "prompt": "a heavy steel pipe wrench strikes a metal pipe, one loud metallic clang with a short ring",
           "length": 1.5, "seeds": 4, "model": "woosh-flow", "name": "gen/cbar_hit", "class": "metal hit" }
   -> four takes, their onsets and scores, one picture; the agent picks s3 (one onset, 0.43 s ring)
build { "spec": "smak.sound/1", "name": "weapons/cbar_hit1.wav", "class": "metal hit", "seed": 1,
        "layers": [
          { "id": "clang", "kind": "sample", "file": "gen/cbar_hit_s3.wav", "onset": 1, "length": 0.6,
            "filter": [{ "type": "peak", "f": 1300, "q": 0.8, "gain": 5 }, { "type": "lowpass", "f": 4000 }] },
          { "id": "click", "kind": "noise", "filter": [{ "type": "highpass", "f": 1500 }], "env": { "decay": 0.012 }, "gain": -8 }
        ],
        "finish": { "peak": -0.5 },
        "variants": [{ "name": "weapons/cbar_hit2.wav", "pitch": -4 }] }
```

The filters there answer the numbers of section 3 (its 2 to 5 kHz excess, its missing 600 to 2000 Hz).

## 7. Recommendation

1. **Steven listens first.** The numbers cannot tell these apart from the synthesis he disliked; the files are
   in `~/stignored/sounds-review/models/<model>/` (best takes) and `.../takes/` (all four seeds), pictures in
   `.../models/pictures/`.
2. If they are better to his ear: **Woosh** (Flow for keeps, DFlow for a seed search) as the generator,
   **EzAudio** where the licence must allow commercial use and for inpainting a seam or a cut. TangoFlux adds
   nothing the other two lack here and is the slowest.
3. Build the `sample` layer kind first (it is useful with any WAV, a library recording or a generated one),
   then the `generate` MCP tool with `--generators` (option A).
4. Try the Stable Audio models once Steven accepts their terms (section 8): SAO 1.0 is the common baseline in
   every paper above, and Stable Audio 3's small SFX model (2026) has inpainting.
5. Do not judge generated sounds by the class score alone. A takes-picker should prefer one onset for a
   one-shot, and show the picture.

## 8. Gated models

The Stable Audio models are gated on HF (Stability AI Community Licence). A read token for the account
`stevenlafl` is kept outside the folder, and the install reads it from `HF_TOKEN` in the environment only.
Steven accepted the terms of Stable Audio 3 small SFX on 2026-10-16 and it was downloaded and run. Stable
Audio Open 1.0 and Small (`generate.py sao out/sao` runs 1.0 through diffusers; written, not run) would need
their own terms accepted.

## 9. Second round, 2026-10-16: models that may be used commercially

Woosh, the default, is CC-BY-NC. Steven asked for the best sound-effect models whose output can be sold, and
approved trying Stable Audio 3 under its community licence. Two were installed beside the others:

| | MOSS-SoundEffect v2.0 | Stable Audio 3 small SFX |
| --- | --- | --- |
| Licence as shipped | Apache-2.0 (HF card); Qwen3-1.7B text encoder Apache-2.0 | Stability AI Community Licence (free for an organisation under US$1M yearly revenue); its T5Gemma text encoder under the Gemma Terms of Use |
| Repository | github.com/OpenMOSS/MOSS-TTS, `moss_soundeffect_v2/` (934d682) | github.com/Stability-AI/stable-audio-3 (77e0398) |
| Weights | `OpenMOSS-Team/MOSS-SoundEffect-v2.0` at e35df4d, 11.2 GB, in `weights/moss-sfx` | `stabilityai/stable-audio-3-small-sfx` at 05ca385, 3.5 GB, into `weights/hf` |
| Venv | `venvs/moss-rocm` | `venvs/sa3-rocm` |
| Worker name | `moss-sfx` (longest 30 s) | `stable-audio-3-sfx` (longest 120 s) |
| State | **installed and run** | **installed and run** once the terms were accepted: loads in 31 s, 0.4 s a take (2.9 the first), 2.3 GB, 44.1 kHz stereo |

### How

`scripts/install.sh` (and its copy in this repository, `generators/install.sh`) gained a block for both, and
was run once again from the installed state to prove it idempotent. Each model has its own venv on the same
torch 2.9.1 ROCm 6.4 wheels as `audio-rocm`, hardlinked from the shared uv cache. Separate venvs were needed:

- MOSS needs `descript-audiotools` 0.7.2, which would take `audio-rocm`'s protobuf from 7.36 down to 3.19, and
  it pins diffusers 0.37 where TangoFlux needs diffusers under 0.36.
- Stable Audio 3 wants transformers 5.8 or later and huggingface_hub 1.7 or later; `audio-rocm` has 4.57 and
  0.36.

Both packages are installed editable with `--no-deps`, so their CUDA torch pins (2.9.0+cu128, 2.7.1+cu126) are
ignored. Neither needs flash-attn: Stable Audio 3's small models fall back to torch's attention, and only its
Medium asks for flash-attn.

`generators/worker.py` loads each (`load_moss`, `load_sa3`) and now also EzAudio (`load_ezaudio`, as
`scripts/generate.py` runs it), so the comparison could go through the worker. Each answer line now carries
`vram`, the peak GB torch has held since the load. `generators.json` has an entry for each new model with its
licence. Stable Audio 3's entry sets `HF_HUB_OFFLINE=1`, because its loader looks the gated files up on the
hub at every load, and the server's environment carries no token.

### Problems and fixes

| Model | Problem | Fix |
| --- | --- | --- |
| MOSS | it always denoises a 30 s window and crops it; decoding all 30 s with the DAC VAE in float32 ran out of the 16 GB card (11.7 GB already held by the DiT and Qwen3) | the worker decodes only the latents the length asked needs, plus half a second (`vae.decode` wrapped; DAC's hop is 960 samples, 50 latent frames a second) |
| MOSS | its DiT is wrapped in `torch.compile` with Triton CUDA graphs, which its card says may fail | it worked on ROCm as shipped (pytorch-triton-rocm 3.5.1): about 25 s of compiling on the first take, none after, since the window's shape never changes |
| Stable Audio 3 | gated "auto" on HF; the token's account was refused ("not in the authorized list") | Steven accepted the terms; nothing was tried round the gate |
| install | a check of whether Stable Audio 3 was cached passed falsely, because the card (not gated) had been cached alone | it now looks for the checkpoints themselves |

### Test

Five prompts at their natural length, seeds 0 to 3, through the worker exactly as the MCP server runs it
(`scripts/bench-worker.py`, prompts in `scripts/prompts-v2.json`). One call of the MCP `generate` path itself
(`openGenerators` on the real `generators.json`, then `generate` with `model: "moss-sfx"`) also ran, to prove
the new entry works end to end. Then each take was finished as in section 2 (`scripts/finish-v2.mjs`, the
drips made a loop) and measured.

| | MOSS-SoundEffect v2.0 | Woosh-DFlow | EzAudio XL |
| --- | --- | --- | --- |
| Load | 83 to 115 s | 65 s | 97 s |
| Seconds a take | 15.4 to 15.7 for any length up to 30 s (39 the first, compiling) | 0.41 (4.8 the first) | 3.0 for 0.4 s, 5.2 for 1 to 1.5 s, 7.2 for 3 s, 19.1 for 6 s (8.1 the first) |
| Peak VRAM (torch) | 11.1 to 11.9 GB | 3.8 GB | 9.5 GB |
| Rate | 48 kHz mono | 48 kHz mono | 24 kHz mono |
| Longest | 30 s | 5 s (the drips came out 5 s, not 6) | 10 s |

MOSS's time does not depend on the length: every take is its whole 30 s window at 100 steps with
classifier-free guidance. "Peak VRAM" is torch's; the card had about 3 GB more in use with the desktop.

One event, or a bed? "Span" is how long the sound lasts in the raw take (first 5 ms window within 45 dB of
the peak to the last within 40 dB). "Loud" is the share of the take within 30 dB of its peak: a bed is near
100%, a single event with silence after it much lower. Ranges over the four seeds; then the onsets SMAK
counts per seed, and features in range of the game's class where SMAK has one.

| Sound (asked) | MOSS-SoundEffect v2.0 | Woosh-DFlow | EzAudio XL |
| --- | --- | --- | --- |
| Clang (1 s) | **one event every seed**: span 0.47 to 0.52 s, loud 29 to 38%, onsets 1,1,1,0; 3 to 4 of 11 | events of 0.34 to 0.90 s, one starting 0.56 s late; onsets 1,2,2,0; 3 to 4 of 11 | fills the second (span 0.77 to 1.0 s, loud 61 to 100%); 2 to 5 of 11 |
| Shot (1.5 s) | a short event of 0.15 to 0.45 s, but **1.05 to 1.32 s into the take** after silence; 3 to 6 of 11 | three of four short events (0.18 to 0.83 s), one a 1.5 s bed; 1 to 6 of 11 | fills all 1.5 s every seed; 6 to 10 of 11 |
| Step (0.4 s) | one seed a 0.25 s event (loud 14%), three fill the 0.4 s | three of four events of 0.12 to 0.29 s, one fills; 2 to 6 of 11 | all four fill the 0.4 s with no onset; 2 to 3 of 11 |
| Door (3 s) | fills 3 s (loud 94 to 99%) | fills 3 s (loud 100%) | two seeds stop early (2.1, 2.4 s), two fill |
| Drips (6 s) | 10 to 15 onsets; two seeds sparse (loud 32 and 47%), two a dense bed (100%); 1 to 3 of 10 | 5 to 7 onsets over a bed (loud 100%), 5 s only; 4 to 7 of 10 | 6 to 13 onsets over a bed (loud 89 to 100%); 3 to 4 of 10 |

A door rolling open fills its length by nature, so "fills" is right there.

What the spectra say (centroid of the finished takes, over the four seeds, against the game's class):

| Sound | MOSS | Woosh-DFlow | EzAudio | The game's range |
| --- | --- | --- | --- | --- |
| Clang | 4100 to 6240 Hz | 2060 to 4620 Hz | 340 to 2380 Hz | 1074 to 1654 Hz (`metal hit`) |
| Drips | 3370 to 5700 Hz | 390 to 1150 Hz | 1180 to 2910 Hz | 671 to 1007 Hz (`loop drips`) |
| Step | 75 to 480 Hz | 170 to 380 Hz | 160 to 1740 Hz | 678 to 1024 Hz (`step concrete`) |

### What the measures suggest (no one has listened yet)

- **MOSS** follows "one" best on the clang: a single strike of about half a second on all four seeds. Woosh-DFlow
  managed that on some seeds, and EzAudio on none. Its shot is a single short event too, but placed late in
  the take, after a second of silence; finishing trims that off, and the shot is then short (0.15 to 0.45 s
  against the game's 0.78 to 1.71) and mostly under 150 Hz on seed 0, a thump more than a crack. Its sounds
  are bright: the clang's centroid is 2.5 to 6 times the game's and the drips' 3 to 8 times, with 26 to 90%
  of the clang's power and 28 to 69% of the drips' over 5 kHz, where the game's crowbar hit has 74% at 600
  to 2000 Hz. Half of its drips are drops with quiet between, the other half a bed. It is
  37 times slower than Woosh-DFlow and holds three times the memory, so a 16-seed search costs about four
  minutes.
- **Woosh-DFlow** is as section 3 found: quick, often one event, its drips a bed this time (a different
  prompt from the first round's).
- **EzAudio** fills the length asked on almost every one-shot. That is what the class score likes for the
  shot (up to 10 of 11), and what a listener may not.
- None of the numbers says whether a take sounds like the thing. The blind review (below) is the test.

### For Steven to listen

`~/stignored/sound-review-models/<model>/<sound>.wav`: the first seed of each sound from each model, not
picked, finished the same way (mono 22050 Hz 16-bit, trimmed, peak -0.5 dBFS). `README.txt` there gives the
pw-play lines grouped by sound, with the models lettered A, B, C in an order shuffled per sound; the files
it plays are copies in `blind/`, named by letter. `key.txt` says which is which. `scripts/blind-review.py`
deals the letters again once Stable Audio 3 is added. All four seeds of every model are in
`/media/Data3/Packages/local-audio/out/v2/<model>/final/`, their measures in `measures.json` beside them.

Stable Audio 3 small SFX was run the same way once its terms were accepted (`bench-worker.py
stable-audio-3-sfx out/v2/stable-audio-3-sfx`, `finish-v2.mjs`, then `blind-review.py` dealt four letters).
Its clang came out short and bright too (0.3 s, centroid about 5.3 kHz, one onset).

### Not verified

- MOSS with fewer steps, or a window shorter than 30 s, which would make it faster. Not tried, since the card's
  settings are what it was trained and tested with.
- Why MOSS puts the shot late. The prompt it gets ends in " duration: 1.5s", as in its training, and the other
  sounds start at once.
- Disk: 11.2 GB of MOSS weights; the two venvs' size was not measured (their torch is hardlinked from the
  shared uv cache).

## 10. Steven's blind listening, 2026-10-16

One unpicked take a model (first seed), lettered per sound; his picks, from `~/stignored/sound-review-models/`
(the whole record is `examples/reproduce/reviews/sounds-2026-10-16.json`):

| Sound | Pick |
| --- | --- |
| Crowbar hit | none: inconclusive, would re-prompt |
| Revolver | none sounds like the prompt |
| Step | Woosh-DFlow |
| Door | Stable Audio 3 ("they're all great") |
| Drips | Stable Audio 3, Woosh-DFlow second |

Stable Audio 3 small SFX was made the default. MOSS and EzAudio were never picked.

Then a blind A/B on the same ten briefs, Stable Audio 3 against Woosh-DFlow
(`examples/reproduce/reviews/sounds-2026-10-16.json`, third set): Woosh 4 (the concrete step, the medkit, the
metal break, the drips, "vastly superior"), Stable Audio 3 3 (the .357, the door, the grenade), neither 3. Over
both listenings the two are level at five each, each better at some sounds; Stable Audio 3's drips swelled into
each drop and cut off, heard as played backwards. So both are defaults, and the `generate` tool draws a call's
seeds from each.

## Next (not done here)

- Prompts and lengths tuned per model (shorter lengths for one-shots, "single", "isolated", "close-up"), and
  more seeds through Woosh-DFlow (0.4 s each).
- EzAudio's inpainting for a loop seam and to lengthen Woosh's 5 s loops to the 5.5 to 9 s of the game's drips.
- Woosh's audio-to-audio is not offered; whether its flow can start from a noised take of a synthesised sound
  (the synthesis shaping, the model finishing) is untested.
- A human-ear measure would help more than another model: the MUSHRA page and the CLAP and KAD measures of
  `improvements-research.md` items 5 and 7.

## Sources

- TangoFlux: github.com/declare-lab/TangoFlux (commit 164420f), huggingface.co/declare-lab/TangoFlux (licence
  terms), arXiv 2412.21037
- EzAudio: github.com/haidog-yaqub/EzAudio (commit 86f1826, LICENSE MIT), huggingface.co/OpenSound/EzAudio
  (MIT), arXiv 2409.10819
- Woosh: github.com/SonyResearch/Woosh (commit 7f238bb; README: code MIT, weights CC-BY-NC 4.0; release
  v1.0.0), arXiv 2604.01929, ai.sony/blog/introducing-woosh-sony-ais-sound-effect-foundation-model
- Stable Audio: huggingface.co/stabilityai/stable-audio-open-small (0.5B, 11 s, gated),
  huggingface.co/stabilityai/stable-audio-3-small-sfx (0.6B, gated, inpainting), stability.ai licence pages
- AudioGen: huggingface.co/facebook/audiogen-medium (CC-BY-NC 4.0, 1.5B)
- MOSS-SoundEffect: huggingface.co/OpenMOSS-Team/MOSS-SoundEffect (8B, Apache 2.0);
  huggingface.co/OpenMOSS-Team/MOSS-SoundEffect-v2.0 (card and model_index.json, revision e35df4d: Apache 2.0,
  1.3B DiT, DAC VAE, Qwen3-1.7B, 48 kHz, 30 s), github.com/OpenMOSS/MOSS-TTS `moss_soundeffect_v2/` (934d682)
- Stable Audio 3: huggingface.co/stabilityai/stable-audio-3-small-sfx (card, revision 05ca385; files listed,
  weights gated), github.com/Stability-AI/stable-audio-3 (77e0398: README model table, `model.py`), arXiv 2605.17991
- AudioLDM 2, Tango 2, MAGNeT, Make-An-Audio 2, MMAudio: from their model cards as remembered and the survey
  searches; not re-checked in detail since they were not run
