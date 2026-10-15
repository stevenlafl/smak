# Open music generation models run locally, as a source of music for SMAK

Experiment, 2026-10-14 to 15. The question: can an open music model, run on this machine with no outside
service, make background music in the style of Half-Life's soundtrack (1998: industrial and electronic,
breakbeat drums, synth pads and arpeggios, dark ambient drones, short cues and longer tracks), good enough for a
mod, and how would it fit SMAK? The sister leg for sound effects is `local-sound-generators.md`; this one shares
its folder, its venv where it can, and its design for an MCP `generate` tool.

Abbreviations: VRAM (video memory), ROCm (AMD's GPU compute stack), DiT (diffusion transformer), VAE (variational
autoencoder), LM (language model), LUFS (loudness units relative to full scale, EBU R128), LU (loudness units),
LRA (loudness range, the spread of loudness over a track in LU), BPM (beats per minute), HF (Hugging Face), NC
(non-commercial), MCP (Model Context Protocol), bf16 (bfloat16, a 16-bit float), CD (compact disc).

Everything lives under `/media/Data3/Packages/local-audio/` (scripts, venvs, weights, out/music). Nothing in this
repository changed except this file and a section of `backlog.md`. The takes are in `~/stignored/music-review/`.

## Result in short

Two models ran on the GPU here, in four set-ups: **ACE-Step 1.5** (MIT) as its 2B turbo, its 4B XL turbo, and
the 2B with its 1.7B planner writing the music first; and **MusicGen stereo large** (Meta, CC-BY-NC). Each made
four cues with four seeds: a driving action track (75 s), a tense ambient track (75 s), a stinger (8 to 10 s)
and a loop bed (30 s). They are in `~/stignored/music-review/` for Steven to hear beside the game's tracks, with
the commands to play each pair in its `README.txt` and section 6 here.

| | ACE-Step 1.5 turbo (2B) | ACE-Step 1.5 XL turbo (4B) | ACE-Step 2B with planner | MusicGen stereo large |
| --- | --- | --- | --- | --- |
| Licence of the weights | **MIT**; the card says outputs may be sold | **MIT** | **MIT** | CC-BY-NC 4.0 |
| Seconds for a 75 s track (after loading) | **3.7 to 4.2** | 10 to 13.5 | 18 to 23 | 149 to 189 |
| Peak VRAM (torch) | 10.8 GB | 12.4 GB (with CPU offload) | 14.6 GB | 8.3 GB |
| Rate, channels, longest | 48 kHz stereo, 10 to 600 s | same | same | 32 kHz stereo, 30 s a window |
| Tempo asked (140) kept | 4 of 4 (measured 143.6, the estimator's step) | 4 of 4 | 0 of 4 (92 to 112) | 2 of 4 (144, 136; then 112, 103) |
| Ambient told "beatless" came out beatless (pulse under 0.2) | 2 of 4 (0 of 4 when given a tempo) | 2 of 4 | 4 of 4 | 4 of 4 |
| Loops | its own repaint makes the seam (section 4) | same | same | a 2 s crossfade |

The numbers say where each take sits against the game's tracks; they do not say whether it sounds like Half-Life
or is any good (the sound leg found that). Read from the numbers and the pictures, the models make **steady
grooves and steady drones**: the game's action tracks rise and fall (loudness range 7.7 LU, median) and the
models' hardly move (ACE-Step 2.0 to 2.5 LU). And all of them put far more of their power under 150 Hz than the
game does. Neither model makes a stinger as the game's are: they make short pieces of music.

Steven listened (section 6a): ACE-Step follows music theory best, and over all four action seeds XL wins on
sound; the planner and MusicGen are out. So **ACE-Step 1.5 XL turbo** is the music default and the 2B the fast
choice: MIT, twenty times faster
than real time here, with tempo, key and metre as inputs and its own repaint for loops and fixes. It shares the
sound leg's `generate` tool (a `model` that is a music model) and a small spec of its own, `smak.music/1`, that
cuts, loops, levels and names the file for the game.

## 1. Candidates

Facts from each model's card or repository on 2026-10-14 unless marked "secondary". Dates are first release.

| Model | Date | Licence (weights) | Size | Rate, channels | Longest | Instrumental | Conditioning | Here |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACE-Step 1.5 turbo (ACE Studio, StepFun) | 2026-01 | **MIT**; card: outputs may be used commercially; trained on licensed, royalty-free and synthetic music | 2B DiT, 0.6B text encoder, planner LMs 0.6B / 1.7B / 4B | 48 kHz stereo | 10 to 600 s | yes (`[Instrumental]`, `instrumental`) | caption, BPM, key, metre, length; repaint, cover, reference audio; the base model also extracts and adds stems | **ran** |
| ACE-Step 1.5 XL turbo | 2026-04 | MIT | 4B DiT | same | same | yes | same | **ran** |
| ACE-Step v1 | 2025-04 | Apache 2.0 | 3.5B | 48 kHz | 240 s | yes | tags, lyrics | not run: 1.5 replaces it |
| MusicGen stereo large (Meta, audiocraft) | 2023-10 | CC-BY-NC 4.0; code MIT | 3.3B | 32 kHz stereo | 30 s window; longer by continuation | only | text; melody (the melody models); continuation from audio | **ran**, through `transformers` |
| MAGNeT (Meta) | 2024-01 | CC-BY-NC 4.0 | 0.3B, 1.5B | 32 kHz mono | 10 to 30 s | only | text | not run: MusicGen's family, not better |
| JASCO (Meta) | 2024-12 | CC-BY-NC 4.0, gated by hand | 0.4B, 1B | 16 kHz | 10 s | only | text, chords, drums, melody | not run: gated, 10 s |
| Stable Audio Open 1.0 (Stability) | 2024-06 | Stability AI Community Licence, gated | 1.2B | 44.1 kHz stereo | 47 s | mostly | text; init audio | not run: gated |
| Stable Audio 3 small-music, medium (Stability) | 2026-05 | "other" on the card, gated | (card not readable without accepting) | stereo | minutes (secondary) | (secondary: yes) | (secondary: inpainting, continuation) | not run: gated |
| Magenta RealTime 2 (Google DeepMind) | 2026-05 | **CC-BY 4.0**; code Apache 2.0; Google claims no rights in outputs | 230M small, 2.4B base | 48 kHz stereo | streaming, endless | mostly instrumental | text, audio style, **MIDI** notes, frame by frame | not run: JAX or MLX only; offline on NVIDIA or Apple, no ROCm path given |
| YuE2 3B (M-A-P) | 2026-09 | CC-BY-NC 4.0 | 3B | 48 kHz stereo | full songs | songs with vocals | lyrics, style | not run: NC, vocal songs, 24 GB NVIDIA |
| MiniMax Music 3 | 2026-08 | MiniMax community licence: commercial use if "MiniMax-Music3" is shown, written leave over $20M revenue | 8B + 0.6B LMs, 2.4B flow | 32 kHz stereo | 5 min | songs; `[Instrumental]` sections | lyrics, structured caption with BPM and key | not run: card says it needs CUDA, 24 GB (8 GB with slow offload) |
| DiffRhythm 2 (ASLP, Xiaomi) | 2025-10 | Apache 2.0 | (not stated) | 48 kHz (secondary) | full songs | **not yet**: its card lists instrumental generation as to do | lyrics, style | not run |
| HeartMuLa oss 3B | 2026-01 | Apache 2.0 | 3B | (not stated) | songs | songs with lyrics | lyrics, tags | not run |
| SongGeneration / LeVo (Tencent) | 2025-10, v2 2026-02 | not stated on the card | (secondary: 4B) | 48 kHz (secondary) | songs | songs, with a pure-music mode (secondary) | lyrics, prompt audio | not run: licence unclear |
| SongBloom (Tencent) | 2025-06 | only re-uploads found on HF | | | 150 to 240 s | songs | lyrics, audio prompt | not run |
| InspireMusic (Alibaba) | 2025-02 | Apache 2.0 (secondary) | 1.5B | 24 or 48 kHz | long form | yes | text, continuation | not run: no official HF repository found, only GGUF re-uploads |

Why these two: ACE-Step 1.5 is the newest instrumental-capable model with permissive weights, a ROCm
requirements file of its own, tempo and key as inputs, and an inpainting mode (repaint) that a loop needs.
MusicGen is the common baseline in every paper above, instrumental only, and runs through `transformers` in the
sound leg's venv with no changes. The song models (YuE2, DiffRhythm 2, HeartMuLa, SongGeneration, SongBloom,
MiniMax Music 3) are built for lyrics and vocals; a game's background music is the case they serve least.
Magenta RealTime 2 is the one worth a later try: CC-BY weights, mostly instrumental training, and MIDI as an
input (an agent could write the notes and the model play them), but it runs on JAX or MLX only.

The licence concern, once: ACE-Step's weights are MIT and its card says outputs may be used commercially;
MusicGen's weights are non-commercial, and whether that reaches what it makes is not settled. A free mod is
non-commercial; a sold one is not. Steven decides.

## 2. The game's music

27 tracks in `valve/media/`: `Half-Life01` to `17`, `Prospero01` to `05` and `Suspense01`, `02`, `03`, `05`,
`07`. All 44.1 kHz stereo MP3, 128 to 253 kbps (variable), 8 to 134 s. Measured in place by
`local-audio/scripts/measure-music.py` (it decodes with ffmpeg into memory; nothing is copied). The whole table is
in `local-audio/out/music/valve-measures.json`.

What the measures are: loudness and loudness range (EBU R128, ffmpeg's `ebur128`); crest (peak over RMS, dB);
tempo (librosa); **pulse**, how strong a beat is (the onset envelope, less its 2 s moving mean, autocorrelated at
the beat's lag: about 0 with no beat, 0.4 and over a steady one); onsets a second; **perc**, the share of power
in the percussive half of a harmonic/percussive split (drums and hits against pads and drones); the share of
power under 150 Hz (sub), 150 to 600 (low), 600 to 2000 (mid), 2000 to 5000 (hi) and over 5000 Hz, SMAK's bands;
mean centroid; mean flatness (0 a tone, 1 noise); **swing**, the 90th less the 10th percentile of 1 s RMS (dB).

By those numbers the tracks fall into four groups. Median, then the range in brackets:

| Group | Tracks | Length s | LUFS | LRA LU | Pulse | Onsets/s | Perc % | Sub % | Low % | Mid % | Hi % | Centroid Hz | Swing dB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Action (a beat) | HL 01, 02, 03, 06, 08, 12, 13, 16, 17 | 106 (62 to 132) | -12.2 (-14.8 to -10.4) | 7.7 (3.9 to 11.2) | 0.63 (0.47 to 0.73) | 4.3 (3.5 to 6.8) | 33 (24 to 66) | 52 (43 to 72) | 28 (19 to 43) | 10 (2 to 21) | 2 (0.3 to 16) | 1601 (816 to 2751) | 12.2 (5 to 19) |
| Tense ambient (no beat) | HL 04, 07, 09, 10, 14, Prospero 01 to 04 | 98 (75 to 134) | -15.5 (-21.3 to -12.7) | 9.2 (5.7 to 16.2) | 0.02 (0 to 0.16) | 2.2 (0.5 to 4.2) | 17 (5 to 28) | 45 (1 to 90) | 35 (8 to 64) | 12 (1 to 36) | 0.3 (0 to 5) | 814 (590 to 1208) | 13.0 (6.5 to 17) |
| Between (a weak beat) | HL 05, 11, 15, Prospero 05 | 61 (38 to 87) | -13.7 | 7.1 | 0.12 (-0.04 to 0.24) | 1.6 | 12 (2 to 43) | 56 | 29 | 14 | 2 | 1017 | 10.5 |
| Stingers | Suspense 01, 02, 03, 05, 07 | 18 (8 to 25) | -13.6 (-18.7 to -12.5) | 14.6 (8.4 to 17.6) | 0.04 (0.03 to 0.16) | 1.4 (0.1 to 2.8) | 9 (7 to 30) | 40 (3 to 61) | 55 (34 to 63) | 6 (4 to 34) | 0.1 (0.1 to 6) | 619 (493 to 1545) | 19.4 (14 to 22) |

What that says of the style:

- **Bass-heavy and dark.** In every group over three quarters of the power is under 600 Hz and almost none over
  2 kHz, except the brightest action tracks (01, 02, 17: 7 to 16% at 2 to 5 kHz). Centroids are 500 to 1600 Hz.
- **Drums against pads.** The action tracks are a third percussive (24 to 66%); the ambient tracks a sixth; the
  stingers a tenth. The rest is pads, drones and bass.
- **Tempo.** The action tracks' beat measures 100 to 136 BPM: 01 and 02 at 129, 03 at 108 or 161 (the estimator
  is torn), 06 and 17 at 120, 08 at 105, 12 at 136, 13 at 112, 16 at 99 or 132. Tempo estimates of breakbeats are
  often off by a half or a third, so take these as "around 120, a few faster". The brief's 140 to 170 is above
  most of the game's; the prompts asked 140.
- **They change.** The action tracks have breakdowns and returns (Half-Life01's picture: a full beat, a bare
  middle at 50 to 70 s, the beat back): loudness range 7.7 LU and a 12 dB swing.
- **The stingers are swells, not hits.** Suspense 01 to 05 are 10 to 25 s of rising and falling noise and
  drone; only Suspense07 (8 s) builds to a peak and stops. The loudness range (15 LU) is the widest of any group.

### How GoldSrc plays music

- The engine plays MP3 from the game folder's `media/` through Miles (`libMiles.so`). The CD track numbers of
  the 1998 release are mapped to files by a table built into the engine (`hw.so`'s strings, in order):
  track 2 is `media/Half-Life01.mp3`, then `Prospero01`, `Half-Life12`, `Half-Life07`, `Half-Life10`,
  `Suspense01`, `Suspense03`, `Half-Life09`, `Half-Life02`, `Half-Life13`, `Half-Life04`, `Half-Life15`,
  `Half-Life14`, `Half-Life16`, `Suspense02`, `Half-Life03`, `Half-Life08`, `Prospero02`, `Half-Life05`,
  `Prospero04`, `Half-Life11`, `Half-Life06`, `Prospero03`, `Half-Life17`, `Prospero05`, `Suspense05`, and track
  27 `Suspense07`. The Valve Developer wiki and the303.org list the same table and say the file names are fixed
  (gamestartup.mp3, the menu's music, is a 29th).
- **A map plays a track** with `trigger_cdaudio` (a brush trigger: the player touches it, or it is fired) or
  `target_cdaudio` (a point entity: fired, or the player comes within its `radius`). In the SDK
  (`hlsdk/dlls/triggers.cpp`, `PlayCDTrack`) both take the track in the key `health`, send the first client
  `cd play <track>` (or `cd stop` for -1), and remove themselves: one use, and **single player only** (they
  look up client 1). `worldspawn`'s key `sounds` sets `cdAudioTrack` (`world.cpp`); none of Half-Life's maps is
  known to use it, and whether the Steam engine plays it at load is untested here.
- **Console**: `cd play <n>`, `cd stop`, `cd fadeout`; `MP3Volume`, `MP3FadeTime`; and an `mp3` command whose
  subcommands, by the engine's strings, include `play`, `loop`, `playfile`, `loopfile` and `stop` (`play` and
  `loop` beside a `%s.mp3` format). Master Sword's client plays its own music with `mp3 play music/<file>.mp3`
  (`MSC-Source/source/cl_dll/MasterSword/HUDMusic.cpp`, line 182). The exact argument forms are not tested here.
- **What a mod's own track must be**: an MP3 at 44.1 kHz (the wiki's and the303's word, and every file the game
  ships), stereo as the game's are. Since the table is fixed, a mod that plays music through the CD entities
  ships its file **under one of those 26 names** in `<mod>/media/`, which the engine's file system finds before
  `valve/media/` (as for any game file; not tested here). A mod with code of its own (Master Sword, its scripts
  and `mp3 play`) names any file it likes.
- **Converted here as**: MP3, MPEG-1 layer III, 44.1 kHz stereo, LAME variable bit rate quality 2 (178 to 208
  kbps measured), no ID3 tags, loudness -14 LUFS with true peak under -1 dBTP (section 3). Why: the game's own
  are 44.1 kHz stereo VBR at 128 to 253 kbps, and -14 LUFS is their middle (-10.4 to -21.3, median -14.3), so a
  new track sits at the game's level.
- **Loops**: an MP3 has no loop point. The `loop` subcommands loop a whole file, and an MP3's encoder delay and
  padding (LAME adds about 1,100 samples, 25 ms, before the music, and pads the end) make a small gap at each
  turn unless the decoder reads LAME's gapless header; whether Miles does is untested. A bed that must loop
  without a gap can be a WAV with a cue point played by `ambient_generic`, as SMAK's sound spec already writes
  (mono, 22050 Hz, so it loses the stereo and the top octave).

## 3. What ran, and how

Same machine as the sound leg: AMD Radeon RX 9070 XT (gfx1201, 16 GB), the ROCm runtime inside the PyTorch
wheels, no sudo. One heavy GPU job at a time.

### Setup

`local-audio/scripts/install-music.sh` does all of it after the sound leg's `install.sh`, and is idempotent (run
again from the installed state: 26 s, nothing changed):

- **ACE-Step 1.5** in its own venv, `venvs/acestep-rocm`: it wants `diffusers >= 0.37` and TangoFlux in
  `audio-rocm` wants `< 0.36`. Python 3.12, the same `torch 2.9.1+rocm6.4` wheels (hardlinked from the shared uv
  cache), the repository's `requirements-rocm-linux.txt`, then the package itself with `--no-deps` (its
  `pyproject.toml` pins CUDA torch). Repository at `ca1e85f` (2026-08-29). Weights: `ACE-Step/Ace-Step1.5`
  (turbo DiT, VAE, text encoder, 1.7B planner) and `ACE-Step/acestep-v15-xl-turbo` into `weights/acestep`,
  found by `ACESTEP_CHECKPOINTS_DIR`.
- **MusicGen stereo large** through `transformers` 4.57 in the existing `audio-rocm` venv; weights into the
  shared HF cache.

Disk: `venvs/acestep-rocm` 16 GB, `weights/acestep` 28 GB (the XL DiT is most of it), MusicGen 6.5 GB,
`out/music` 2.7 GB, the review folder 1.3 GB.

### What had to be fixed to run on this card

| Model | Problem | Fix (in `scripts/`, nothing in the repositories changed) |
| --- | --- | --- |
| ACE-Step | `torchao` newer than 0.16 imports `torch.nn.functional.ScalingType`, which torch 2.9 lacks; `transformers` then cannot load the DiT | `torchao==0.16.0`, the project's own pin (`install-music.sh`) |
| ACE-Step | on ROCm it loads in float32 by default (`ACESTEP_ROCM_DTYPE`, against segfaults on some AMD iGPUs): 17 to 40 s a 75 s track, and the loop's repaint ran out of 16 GB | `ACESTEP_ROCM_DTYPE=bfloat16`: 3.7 to 4.2 s a track, 10.8 GB, no fault on this card |
| ACE-Step XL | its VAE encodes a repaint's 30 s source in one piece and runs out of memory beside the 4B DiT | the handler's own tiled encode, 12 s tiles, forced for XL (`generate-music.py`); with CPU offload of the DiT |
| ACE-Step | every piece ends with 2 to 4 s of fade to near silence (it writes an ending), which came round into the loops' middles as 30 to 60 dB dropouts | a loop's take is made 6 s longer and its ending cut off before the turn and repaint |
| ACE-Step | its planner backend `nano-vllm` needs CUDA | `backend="pt"` (PyTorch) for the planner |
| MusicGen | a 30 s window | windows of 30 s, each next one continuing from the last 10 s of the one before (its audio prompt) |

### Running it

```
cd /media/Data3/Packages/local-audio
export HF_HOME=$PWD/weights/hf ACESTEP_CHECKPOINTS_DIR=$PWD/weights/acestep MIOPEN_FIND_MODE=FAST ACESTEP_ROCM_DTYPE=bfloat16
venvs/acestep-rocm/bin/python -I scripts/generate-music.py acestep out/music/acestep                      # first prompts
venvs/acestep-rocm/bin/python -I scripts/generate-music.py acestep out/music/acestep-v2 --prompts music-prompts-v2.json
venvs/acestep-rocm/bin/python -I scripts/generate-music.py acestep-xl out/music/acestep-xl --prompts music-prompts-v2.json
venvs/acestep-rocm/bin/python -I scripts/generate-music.py acestep out/music/acestep-lm --prompts music-prompts-v2.json --lm
venvs/audio-rocm/bin/python -I scripts/generate-music.py musicgen out/music/musicgen
venvs/audio-rocm/bin/python -I scripts/measure-music.py ~/.steam/steam/steamapps/common/Half-Life/valve/media --json out/music/valve-measures.json
venvs/audio-rocm/bin/python -I scripts/finish-music.py out/music/acestep ~/stignored/music-review/acestep   # and each run
node scripts/music-pictures.mjs ~/stignored/music-review ~/.steam/steam/steamapps/common/Half-Life/valve/media
```

The loop beds of the four ACE-Step runs were made again after the dropout fix (`--only bed`); their timings are
`raw/timings-bed.json` beside each run's `timings.json`.

### The prompts

Written in the late-1990s vocabulary; neither the game nor its composer is named in any prompt (neither model's
card says style names help, and a name invites copying). Lengths and tempos are inputs where the model has them.

| Cue | Length | First prompts (`music-prompts.json`) | Second (`-v2`), where different |
| --- | --- | --- | --- |
| action | 75 s, 140 BPM, D minor | late 1990s industrial electronic instrumental, driving breakbeat drums at 140 BPM, distorted analog synth bass, metallic clanging percussion, sparse detuned synth lead, dark and tense, sci-fi action, gritty sampler production, no vocals | same |
| ambient | 75 s, C minor | dark ambient instrumental, low droning synthesizer pads, distant metallic hits and echoes, slow evolving pads, ominous and tense, empty underground research facility, no drums, no vocals, late 1990s sci-fi soundtrack (with 60 BPM) | beatless dark ambient soundscape, no drums, no rhythm, sustained low synthesizer drones, slow swelling pads, occasional distant metallic clangs with long reverb, ominous, late 1990s sci-fi film score, no vocals (no tempo) |
| stinger | 8 s (ACE-Step's least is 10) | short dramatic musical sting, one heavy orchestral synth hit with a metallic crash, then a rising white noise riser, dark industrial electronic, instrumental, no vocals (100 BPM) | short cinematic horror sting, no beat, no rhythm: one loud synth stab and metallic crash, a long dark reverb tail, then a rising noise sweep, dark industrial sound design, no vocals (no tempo) |
| bed (loop) | 30 s, A minor | dark ambient drone, steady low synthesizer pad, faint mechanical hum, constant unchanging texture, no drums, no melody, no vocals, seamless background loop (60 BPM) | beatless dark ambient drone, no drums, no rhythm, ... (no tempo) |

The second prompts came after the first ACE-Step run: given a tempo, ACE-Step put a beat under every ambient
take (pulse 0.29 to 0.62). MusicGen ran on the first prompts only (it takes no tempo input; its prompt names one).

### Finishing (`scripts/finish-music.py`)

Every take the same way: a loop is made (ACE-Step's by its repaint, already; MusicGen's 34 s take crossfaded,
equal power, its last 2 s past 30 s over its first 2 s); a stinger is cut after its last moment over -50 dB of
its peak, with a 0.3 s fade, at most 10 s; then loudness to -14 LUFS with true peak at most -1 dBTP (two passes
of ffmpeg's `loudnorm`, linear); written as 44.1 kHz stereo WAV and MP3 (section 2); a loop also played three
times round as `_x3.wav`. Then measured, and held against the game's group for its cue: each measure's distance
from the group's median in units of the group's spread, averaged ("dist"). The take with the least is copied as
the folder's best. That pick is by numbers only.

## 4. Loops

Two ways were tried:

- **ACE-Step's repaint.** The take is made 6 s longer than the loop, its ending cut off, turned round by half
  (its middle becomes its two ends, so the end runs on into the start without a join), and the join, now in the
  middle, regenerated by repaint over 4 s. No crossfade. 4.8 to 5.8 s a loop on the 2B, 16 to 23 s on XL.
- **Crossfade** (MusicGen, which cannot inpaint): 2 s, equal power.

A seam measure (`seam` in `finish-music.py`): the spectral change from the last 46 ms to the first 46 ms, over
the median change between neighbouring 46 ms frames inside the file. About 1 is a seam as smooth as the music.

| Run | seam, four seeds | the quietest half second against the median |
| --- | --- | --- |
| ACE-Step 2B, first prompts | 1.02, 1.19, 4.23, 1.14 | 10 to 22 dB under |
| ACE-Step 2B, second prompts | 1.00, 2.42, 3.15, 1.17 | 11 to 18 dB under |
| ACE-Step XL | 0.93, 1.40, 3.32, 0.94 | 8 to 9 dB under |
| ACE-Step 2B with planner | 1.17, 1.05, 2.33, 0.97 | 2 to 22 dB under |
| MusicGen, crossfade | 1.01, 0.96, 1.03, 0.95 | (not measured) |

Four of the five takes with a seam over 2 are beds that came out with a beat (pulse 0.42 to 0.73): a 30 s loop
is not a whole number of bars, so a beat stumbles at the turn. A bed with a beat needs its length in bars (ACE-Step is
told the tempo; 30 s at 120 BPM is 15 bars). Before the fix, ACE-Step's own ending (2 to 4 s of fade to near
silence) came round into the middle of every loop as a hole 15 to 45 dB under the median; the numbers above are
after it. The quietest moment that remains is in the repainted middle (11 to 18 s) in half the takes, the
planner's all four: listen to `bed_x3.wav`.

## 5. Measured

Best take of each run (the one nearest the game's group), beside the group's median. LUFS is -14 for every take
by the finishing, so it is left out.

| Cue | Source | Len s | LRA | Crest | BPM | Pulse | Onsets/s | Perc % | Sub % | Low % | Mid % | Hi % | Centroid | Swing | Dist |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| action | game, median of 9 | 106 | 7.7 | 16.0 | 100 to 136 | 0.63 | 4.3 | 33 | 52 | 28 | 10 | 2.0 | 1601 | 12.2 | |
| action | ACE-Step 2B, s0 | 75 | 2.0 | 14.5 | 143.6 | 0.57 | 4.2 | 43 | 84 | 10 | 3.4 | 1.2 | 2312 | 4.3 | 0.85 |
| action | ACE-Step XL, s0 | 75 | 2.1 | 13.1 | 143.6 | 0.60 | 5.5 | 27 | 73 | 14 | 8.1 | 3.2 | 2178 | 4.8 | 0.86 |
| action | ACE-Step planner, s1 | 75 | 2.5 | 13.7 | 92.3 | 0.61 | 5.9 | 25 | 89 | 5.9 | 2.2 | 1.3 | 2835 | 7.6 | 1.15 |
| action | MusicGen, s0 | 75 | 6.9 | 16.0 | 143.6 | 0.39 | 4.9 | 21 | 89 | 9.3 | 0.4 | 1.1 | 2189 | 8.3 | 0.90 |
| ambient | game, median of 9 | 98 | 9.2 | 18.2 | | 0.02 | 2.2 | 17 | 45 | 35 | 12 | 0.3 | 814 | 13.0 | |
| ambient | ACE-Step 2B first prompts, s0 | 75 | 3.1 | 12.3 | 117.5 | 0.29 | 1.7 | 15 | 91 | 8.9 | 0.4 | 0.1 | 655 | 4.1 | 1.81 |
| ambient | ACE-Step 2B second, s3 | 75 | 8.4 | 14.6 | | -0.03 | 1.2 | 1.7 | 63 | 36 | 0.8 | 0.2 | 840 | 13.0 | 0.85 |
| ambient | ACE-Step XL, s2 | 75 | 7.7 | 16.2 | | 0.03 | 1.3 | 2.6 | 28 | 66 | 6.0 | 0.2 | 1089 | 8.8 | 0.92 |
| ambient | ACE-Step planner, s1 | 75 | 6.9 | 12.7 | | 0.06 | 0.3 | 0.5 | 94 | 5.5 | 0.4 | 0.1 | 843 | 11.7 | 1.18 |
| ambient | MusicGen, s1 | 75 | 9.4 | 10.8 | | 0.00 | 0.2 | 1.4 | 99.8 | 0.2 | 0.0 | 0.0 | 438 | 7.9 | 1.42 |
| stinger | game, median of 5 | 18 | 14.6 | 16.9 | | 0.04 | 1.4 | 9 | 40 | 55 | 6.0 | 0.1 | 619 | 19.4 | |
| stinger | ACE-Step 2B first, s3 | 6.6 | 2.7 | 14.5 | 99.4 | 0.30 | 1.4 | 7.6 | 58 | 35 | 6.1 | 0.6 | 1186 | 8.5 | 2.23 |
| stinger | ACE-Step 2B second, s0 | 7.9 | 11.1 | 15.6 | | -0.00 | 2.2 | 12 | 84 | 15 | 0.7 | 0.1 | 751 | 28.1 | 2.01 |
| stinger | ACE-Step XL, s1 | 8.4 | 4.0 | 12.0 | | 0.25 | 0.4 | 5.2 | 93 | 5.4 | 1.2 | 0.5 | 1149 | 23.2 | 3.13 |
| stinger | ACE-Step planner, s0 | 7.6 | 4.0 | 13.2 | | 0.06 | 5.1 | 7.8 | 92 | 7.2 | 0.8 | 0.1 | 538 | 5.4 | 2.68 |
| stinger | MusicGen, s3 | 7.9 | 6.6 | 12.8 | | 0.06 | 0.5 | 6.9 | 85 | 12 | 1.6 | 0.9 | 994 | 9.9 | 2.94 |
| bed | game ambient, median | | 9.2 | 18.2 | | 0.02 | 2.2 | 17 | 45 | 35 | 12 | 0.3 | 814 | 13.0 | |
| bed | ACE-Step 2B first, s3 | 30 | 8.0 | 14.5 | | 0.18 | 2.8 | 1.2 | 74 | 25 | 1.7 | 0.0 | 520 | 13.2 | 1.28 |
| bed | ACE-Step 2B second, s1 | 30 | 6.9 | 15.1 | | -0.03 | 0.9 | 2.9 | 74 | 25 | 1.5 | 0.0 | 500 | 14.5 | 1.07 |
| bed | ACE-Step XL, s0 | 30 | 2.2 | 10.3 | | 0.05 | 1.3 | 3.8 | 65 | 31 | 3.5 | 0.3 | 869 | 2.6 | 1.20 |
| bed | ACE-Step planner, s0 | 30 | 8.1 | 14.4 | | 0.05 | 0.4 | 3.3 | 79 | 20 | 0.7 | 0.1 | 1251 | 13.5 | 1.09 |
| bed | MusicGen, s1 | 30 | 15.1 | 7.6 | | 0.03 | 0.1 | 0.3 | 96 | 3.8 | 0.1 | 0.1 | 1247 | 11.2 | 1.57 |

Every take's line is in `~/stignored/music-review/<run>/takes/measures.json`. What the numbers say is off:

- **Too much under 150 Hz.** Every model's best takes put 63 to 99.8% of their power there (the game's: 40 to
  52%), and 0.4 to 8% at 600 to 2000 Hz where the game has 6 to 12%. The game's music is dark, but in its low
  mids (150 to 600 Hz) more than its sub-bass. A low shelf cut and a mid lift in the finishing would move every
  take towards it; not tried.
- **Too steady.** The action takes' loudness range is 2.0 to 2.5 LU on ACE-Step (game 7.7) and their swing 4 to 8
  dB (game 12): a groove from start to end, where the game's tracks break down and come back. MusicGen's 6.9 LU
  comes from sudden changes (next section), not sections.
- **Tempo.** ACE-Step keeps the tempo it is given: every take of both DiTs at 143.6 BPM, the estimator's step
  nearest the 140 asked. With its planner writing the music, 92 to 112 (it seems to choose its own feel).
  MusicGen, which takes no tempo, gave 144, 136, 112 and 103.
- **Stingers** sit furthest from the game's of any cue (dist 2.0 to 3.1): the game's are 10 to 25 s swells; the
  models' are 6 to 10 s pieces.

### Time and memory

| Run | Load | 75 s track | 8 to 10 s stinger | 30 s loop (with its repaint) | Peak VRAM (torch) |
| --- | --- | --- | --- | --- | --- |
| ACE-Step 2B turbo, bf16, 8 steps | 36 to 75 s | **3.7 to 4.2 s** (8.2 the first) | 1.5 s | 4.8 to 7.6 s | 10.8 GB |
| ACE-Step 2B turbo, float32 (its ROCm default) | 71 s | 17 to 40 s | 3.2 to 4.9 s | out of memory | 14.4 GB |
| ACE-Step XL turbo, bf16, DiT offloaded to the CPU | 149 to 155 s | 10 to 13.5 s | 6.4 to 6.8 s | 16 to 23 s | 12.4 GB |
| ACE-Step 2B with the 1.7B planner | 114 to 126 s | 18 to 23 s | 3.8 to 3.9 s | 11.6 to 19 s | 14.6 GB |
| MusicGen stereo large, fp16, guidance 3 | 37 to 80 s | 149 to 189 s | 17 to 20 s | 70 to 74 s (34 s) | 8.3 GB |

"Peak VRAM" is what torch allocated; the runtime and the desktop take 2 to 3 GB more of the 16. ACE-Step's 2B
makes music about twenty times faster than real time here; MusicGen at about half real time.

## 6. For Steven to listen

`~/stignored/music-review/<run>/` holds the best take of each cue (`action`, `ambient`, `stinger`, `bed` with
`bed_x3.wav`, each `.wav` and `.mp3`), and `takes/` all four seeds with a picture of each.
`~/stignored/music-review/pictures/<cue>.png` has two of the game's tracks over each run's best take.
`README.txt` there lists every command. The pairs, the game's played where it lies (never copied):

```
G=~/.steam/steam/steamapps/common/Half-Life/valve/media; R=~/stignored/music-review
ffplay -nodisp -autoexit $G/Half-Life01.mp3;  pw-play $R/acestep/action.wav;  pw-play $R/acestep-xl/action.wav
ffplay -nodisp -autoexit $G/Half-Life17.mp3;  pw-play $R/acestep-lm/action.wav;  pw-play $R/musicgen/action.wav
ffplay -nodisp -autoexit $G/Prospero01.mp3;   pw-play $R/acestep-v2/ambient.wav;  pw-play $R/acestep-xl/ambient.wav
ffplay -nodisp -autoexit $G/Half-Life10.mp3;  pw-play $R/acestep-lm/ambient.wav;  pw-play $R/musicgen/ambient.wav
ffplay -nodisp -autoexit $G/Suspense07.mp3;   pw-play $R/acestep/stinger.wav;  pw-play $R/acestep-xl/stinger.wav
ffplay -nodisp -autoexit $G/Suspense01.mp3;   pw-play $R/acestep-v2/stinger.wav;  pw-play $R/musicgen/stinger.wav
ffplay -nodisp -autoexit $G/Prospero03.mp3;   pw-play $R/acestep-v2/bed_x3.wav;  pw-play $R/acestep-xl/bed_x3.wav
ffplay -nodisp -autoexit $G/Half-Life07.mp3;  pw-play $R/acestep-lm/bed_x3.wav;  pw-play $R/musicgen/bed_x3.wav
```

`acestep/ambient.wav` (first prompts, given a tempo) is there to hear the beat that the second prompts removed.
`acestep-v2/action*` is the first prompts' action again (same prompt and seed; the files differ only in float
rounding).

## 6a. What Steven heard (2026-10-15)

| Model | His words |
| --- | --- |
| ACE-Step 2B | "seems to follow music theory the best" |
| ACE-Step XL | "Variability was higher" |
| ACE-Step with planner | "didn't care for" |
| MusicGen | "sucked" |

His favourite take: `acestep/action.wav` ("I quite like it"), the 2B's seed 0 on the first action prompt (75 s,
140 BPM, D minor; section 3). That prompt is the starting point for an action cue.

Then, after the 2B's and XL's four action seeds side by side: "the sound fidelity is great with XL, I would
almost prefer it", and "XL wins overall".

So: ACE-Step XL is the default music model (12.4 GB with its DiT offloaded, 10 to 13.5 s a 75 s track), the 2B
stays in the manifest as the fast choice (4 s), and the planner and MusicGen are dropped.

## 7. What each did, by the numbers and the pictures

Not by ear: that is section 6.

- **ACE-Step 2B turbo**: fast enough to try twenty seeds in the time MusicGen makes one track. Holds tempo and
  length exactly. The action takes are a full-band groove to a written ending (a 2 to 4 s fade), the best with a
  sparser opening of about 20 s, and no breakdown. Given a tempo it puts a beat under anything, the
  ambient and the bed too; told "beatless" with no tempo, half its ambient takes are. Its ambient outline is
  steady with few swells. Its stingers are short pieces: the first prompts' best is a beat that rises into a hit
  at the end (a riser and a hit, the wrong way round), the second's a stab and a tail.
- **ACE-Step XL**: by the pictures its ambient has the outline most like the game's (Prospero01's slow swells),
  though its bands lean further into 150 to 600 Hz (66%) than the game's (35%); the action much like the 2B's. Three times slower, needs the DiT offloaded and the tiled
  encode, and its weights take 20 GB.
- **ACE-Step with its planner**: every ambient take beatless, built of phrases with near-silences between them
  (its picture); the action at its own slower feel (92 to 112 BPM measured, not the 140 asked) with the
  strongest pulse of any (0.61 to 0.77). Five times slower than without.
- **MusicGen**: slow on this card, NC, 32 kHz. Its 75 s tracks come in 30 s windows, and the pictures show
  sudden changes of level and texture partway (the best action's level drops near 20 s and its texture changes
  near 37 s; the ambient steps up near 37 s), which the windows may cause. Its ambient and bed are near pure
  drones (96 to 99.8% under 150 Hz). Its crossfade loops have the smoothest seams (0.95 to 1.03).

## 8. How music fits SMAK (a design; nothing built)

### The tool: the sound leg's `generate`, with music models in its manifest

The sound leg's option A stands: an MCP tool `generate`, offered only when `smak mcp` is pointed at a generators
folder (`--generators <folder>` or `SMAK_GENERATORS`), whose `generators.json` names each model with its Python,
its worker script, rate, window, licence and VRAM. Music adds entries, not a tool:

```json
{ "name": "acestep", "kind": "music", "python": "venvs/acestep-rocm/bin/python", "script": "scripts/worker.py",
  "rate": 48000, "channels": 2, "length": [10, 600], "inputs": ["bpm", "key", "metre", "loop"],
  "licence": "MIT", "vram": 11, "env": { "ACESTEP_ROCM_DTYPE": "bfloat16" } }
```

- **Inputs**: `{ model, prompt, length, seeds, name }` as for a sound, plus for music `bpm`, `key`, `metre` and
  `loop: true`. With no `model`, a `kind: "music"` call takes the manifest's first music model (ACE-Step XL,
  Steven's pick; Woosh-DFlow stays the sound default, his call), so an agent says what it wants, not which
  model. A model's `inputs` says what it honours; a field it does not take is reported, not dropped silently.
- **Loops in the worker**: for a model that can repaint (ACE-Step), the turn-and-repaint of section 4, with the
  length rounded to whole bars when there is a tempo; for one that cannot, the take 4 s long for the spec's
  crossfade.
- **Outputs**: as for a sound: each take's file in the work folder with its sidecar (model, prompt, seed,
  tempo, key, licence), and for each take the measures of this report (length, LUFS, loudness range, tempo,
  pulse, percussive share, bands), its distance from the game's group when a `group` is given, the loop seam,
  and one picture of all the takes, one under another (`soundPicture`), returned as an image.
- **Time**: one worker process kept alive per server, as for sounds. ACE-Step XL is 10 to 13.5 s a 75 s track
  after a 150 s load, so four seeds of a track cost about a minute (the 2B: 4 s, about 20 s); the tool's timeout is minutes.
- **Memory**: ACE-Step XL 12.4 GB with its DiT offloaded, the 2B 11 GB: one model loaded at a time, and the worker stopped after
  idle minutes so a game can have the card back.

### The spec: `smak.music/1`

A music file is not a sound: stereo MP3 at 44.1 kHz under `media/`, judged by loudness not peak, a minute or
two long, often a loop. The sound spec's rules (mono WAV, 22050 Hz, `sound/`, peak level, variants by pitch) fit
none of that, so a small spec of its own, built by the same `build` tool, deterministic, reading files and never
running a model:

```json
{ "spec": "smak.music/1", "name": "media/Half-Life04.mp3", "group": "ambient",
  "from": { "file": "gen/lab_ambient_s3.wav", "start": 0, "length": 75 },
  "fade": { "in": 2, "out": 4 }, "loudness": -14,
  "eq": [{ "type": "lowshelf", "f": 150, "gain": -4 }, { "type": "peak", "f": 400, "q": 0.8, "gain": 2 }],
  "layers": [{ "id": "clang", "spec": "work:sounds/distant_clang.json", "at": [12, 31, 50], "gain": -9 }] }
```

| Field | |
| --- | --- |
| `name` | Where it goes in the mod: one of the 26 `media/` names when a map plays it by CD track (the table is fixed in the engine), or any path when the mod plays music by its own code (the mod's profile says which) |
| `track` | Instead of a name: the CD track number (2 to 27); the build writes the matching file name and the report says which of the game's tracks it stands in for |
| `from` | The take: a file in the work folder, the seconds to take; or `bars` with the take's tempo |
| `loop` | `{ crossfade: 2 }`, or `true` for a file already looped (ACE-Step's repaint); the report gives the seam measure and warns of a length that is not whole bars |
| `fade`, `loudness`, `eq` | The finishing: fades, -14 LUFS by default (the game's middle), true peak -1 dBTP, filters as the sound spec has them (a low-shelf cut answers section 5's excess under 150 Hz) |
| `layers` | Sound-spec layers, or whole sound specs, mixed in at times: a synthesised hit on a stinger, a clang in an ambient, the way the sound leg puts a synthesised bed under a generated take |
| `group` | `action`, `ambient`, `between` or `stinger`: the game's tracks of that kind, as numbers in the kit (as `CLASSES` are for sounds), to hold the result against |
| `as` | `mp3` (default; 44.1 kHz stereo, VBR) or `wav` (a bed for `ambient_generic`: mono 22050 Hz with a cue at 0, gapless, under `sound/`) |

The report: length, loudness and range, tempo and pulse, bands against the group, the seam of a loop, the
provenance from the sidecar with a warning on an NC licence, and a picture beside two of the game's tracks of the
group (their numbers, never their audio: the kit holds no game files). What the kit needs: an MP3 encoder (the
kit has none and should not grow one; `ffmpeg` with `libmp3lame` found on the path, as the map compilers are
found, or `as: "wav"` with no outside program), a WAV reader for 24-bit and float (the sound leg's item too),
a resampler, and LUFS (ITU-R BS.1770, about 60 lines; already open as a sound item).

### How a map plays it

The map spec gains `music`, written as the stock entities:

```json
"music": [
  { "track": 5, "when": "start" },
  { "track": 2, "when": { "enter": "control_room" } },
  { "stop": true, "when": { "enter": "exit_hall" } }
]
```

`when: "start"` writes a `trigger_auto` firing a `target_cdaudio`; `enter` a `trigger_cdaudio` brush filling the
room's doorway or floor; `stop` a track of -1. The map check warns that these entities play for one client only
(the SDK sends `cd play` to client 1: a multiplayer mod needs its own way), that each fires once, and, with a mod
profile, when the mod plays music by its own code instead (Master Sword's scripts), so that the agent writes what
the mod reads. A bed meant to loop without a gap goes in as a WAV under `sounds` (the existing `ambient_generic`
path), not as a CD track.

### What an agent with only the MCP server would write

For "a tense ambient bed for the lab and a stinger when the alarm goes":

```
generate { "kind": "music", "prompt": "beatless dark ambient drone, no drums, slow swelling synth pads, distant metallic clangs, ominous",
           "length": 32, "key": "A minor", "loop": true, "seeds": 4, "name": "gen/lab_bed", "group": "ambient" }
   -> four looped takes, their measures and seams, one picture; the agent picks s1 (no pulse, seam 1.0)
generate { "kind": "music", "prompt": "short horror sting, one loud synth stab and metallic crash, long dark tail",
           "length": 10, "seeds": 8, "name": "gen/alarm_sting", "group": "stinger" }
build { "spec": "smak.music/1", "name": "media/Half-Life07.mp3", "group": "ambient",
        "from": { "file": "gen/lab_bed_s1.wav" }, "loop": true,
        "eq": [{ "type": "lowshelf", "f": 150, "gain": -4 }] }
build { "spec": "smak.music/1", "track": 7, "group": "stinger", "from": { "file": "gen/alarm_sting_s5.wav", "length": 8 },
        "fade": { "out": 1.5 } }
build { "spec": "smak.map/1", ..., "music": [{ "track": 5, "when": { "enter": "lab" } }, { "track": 7, "when": { "fired": "alarm" } }] }
```

and tell the person which of the game's tracks the mod's files replace, and that the music only plays in single
player through these entities.

## 9. Recommendation

1. The numbers put every model's best takes about as near the game's as each other (dist 0.85 to 1.15 for
   action) and could not say which sounds like Half-Life; Steven's ear did (section 6a).
2. **ACE-Step 1.5 XL turbo in bf16** as the music default: MIT weights and a card that allows commercial use,
   tempo and key as inputs, repaint for loops and fixes, and to Steven's ear the best sound (section 6a), at
   10 to 13.5 s a 75 s track. **The 2B** as the fast choice, 4 s a track.
   The planner and MusicGen are dropped (his ear, and MusicGen is NC and forty times slower).
3. Prompts: give a tempo only to music that should have a beat; say "beatless, no drums, no rhythm" for ambient.
   Ask for the game's tempo range (100 to 136) rather than 140 to 170. Make loops a whole number of bars.
4. Build order: the sound leg's `generate` tool with music entries in its manifest; `smak.music/1` (cut, loop,
   level, EQ, MP3 through ffmpeg); the map spec's `music`. The MP3 loop gap and `worldspawn`'s `sounds` want a
   test in the game.
5. Later: **Magenta RealTime 2** (CC-BY, MIDI as an input, so an agent can write the notes) once a JAX ROCm path
   is tried; the Stable Audio 3 music models once Steven accepts their terms.

## 10. What Steven has to do

Nothing for what ran. Optional, for the models not tried:

1. **Stable Audio 3** (small-music, medium) and Stable Audio Open 1.0: gated. Accept the terms, signed in, at
   https://huggingface.co/stabilityai/stable-audio-3-small-music (and
   https://huggingface.co/stabilityai/stable-audio-3-medium,
   https://huggingface.co/stabilityai/stable-audio-open-1.0), make a read token at
   https://huggingface.co/settings/tokens, and log in so the token is kept beside these weights:

   ```
   HF_HOME=/media/Data3/Packages/local-audio/weights/hf /media/Data3/Packages/local-audio/venvs/audio-rocm/bin/hf auth login
   ```

2. Nothing to install for Magenta RealTime 2 yet: whether JAX's ROCm build runs it on this card is the next
   agent's question, not a step for Steven.

## Sources

- ACE-Step 1.5: github.com/ace-step/ACE-Step-1.5 (commit ca1e85f, `docs/en/INFERENCE.md`,
  `docs/en/ACE-Step1.5-Rocm-Manual-Linux.md`, `requirements-rocm-linux.txt`), huggingface.co/ACE-Step/Ace-Step1.5
  (MIT, model zoo), huggingface.co/ACE-Step/acestep-v15-xl-turbo (MIT, 2026-04-02), arXiv 2602.00744
- MusicGen: huggingface.co/facebook/musicgen-stereo-large (CC-BY-NC 4.0), `transformers` MusicGen
- Magenta RealTime 2: huggingface.co/google/magenta-realtime-2 (card, terms), github.com/magenta/magenta-realtime
- MiniMax Music 3: huggingface.co/MiniMaxAI/MiniMax-Music3 (card, LICENSE)
- YuE2: huggingface.co/m-a-p/YuE2-3B; DiffRhythm 2: huggingface.co/ASLP-lab/DiffRhythm2; HeartMuLa:
  huggingface.co/HeartMuLa/HeartMuLa-oss-3B; SongGeneration: huggingface.co/lglg666/SongGeneration-v2-large;
  JASCO: huggingface.co/facebook/jasco-chords-drums-melody-1B; Stable Audio 3: the HF API's model listings (dates,
  gating, licence field); dates and gating of all from the HF API on 2026-10-14
- InspireMusic, SongBloom, LeVo details: secondary (re-uploads, blog listings); not checked against an official card
- GoldSrc music: `hw.so` strings (the track table, the `mp3` subcommands); `hlsdk/dlls/triggers.cpp`
  (`trigger_cdaudio`, `target_cdaudio`, `PlayCDTrack`); `hlsdk/dlls/world.cpp` (`sounds`, `cdAudioTrack`);
  `MSC-Source/source/cl_dll/MasterSword/HUDMusic.cpp`; developer.valvesoftware.com/wiki/Trigger_cdaudio_(GoldSrc)
  and the303.org/tutorials/gold_audio.htm (track table, 44.1 kHz MP3; the wiki page read through a search
  summary, its page refused a direct fetch)
