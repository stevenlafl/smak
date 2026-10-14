# Sounds from a spec: what the engines take, how to make them in code, how to check them without ears

Research for SMAK, 2026-10-14. The question: can the kit make the sounds a GoldSrc mod needs (a wrench's
swing and hit, a revolver's shot and its reload clicks, a shotgun's pump, a launcher's whoosh, a grenade's
pin, footsteps on each surface, ambient loops) from a JSON spec an agent writes, with every bit of the
synthesis in plain JavaScript in this repository, no npm dependency, no service and no AI inside. And how
does the agent, who cannot listen, tell whether what it made is any good.

Abbreviations used: PCM (pulse-code modulation, plain uncompressed samples), RIFF (Resource Interchange
File Format, the container a `.wav` is), dBFS (decibels relative to full scale: 0 is the loudest a sample
can be), RMS (root mean square, the average level), DC (direct current: a constant offset of the waveform
from zero), ADSR (attack, decay, sustain, release), FM (frequency modulation), RT60 / T20 / T40 (the time a
sound takes to fall 60, 20 or 40 dB), FFT (fast Fourier transform), FGD (Forge game data, the entity list
an editor reads), SDK (software development kit), VDC (Valve Developer Community wiki), MCP (Model Context
Protocol), LUFS (loudness units relative to full scale, ITU-R BS.1770).

## 1. Summary

1. **Write mono 16-bit PCM at 22050 Hz by default**, 8-bit or 11025 Hz on request. Both engines take 8 and
   16-bit mono PCM at 11025, 22050 and 44100 Hz. Half-Life's own 2,542 sounds are 93% 11025 Hz 8-bit, 7%
   22050 Hz 8-bit; its only stereo files are seven launcher menu sounds. Quake's loader, which GoldSrc's
   descends from, refuses stereo; VDC lists stereo as not supported in GoldSrc. Never write stereo.
2. **A loop is one `cue ` point** at the sample where the loop starts, the file trimmed where it ends. Both
   engines loop any file that has a cue chunk until the sound is stopped, from the cue point to the end.
   No `ltxt` length marker (VDC: end markers "can prevent the sound from looping in GoldSrc"). All 136
   looped Half-Life sounds have exactly one cue point; 135 at sample 0, `weapons/rocket1.wav` at 23395
   (a start, then a loop of the rest).
3. **Where a sound is used decides its name, and most names are fixed by code.** A weapon's fire, hit and
   pump sounds in Half-Life are named in the game's C++ (`dlls/crowbar.cpp`, `cl_dll/ev_hldm.cpp`), so a
   new sound replaces a file of the same name. Only reloads and the like are model events (`5004` with the
   path in the event's text), which the kit already writes. Footsteps are fixed names per surface
   (`player/pl_step1.wav` ...), the surface chosen by `sound/materials.txt`. Maps name sounds freely
   (`ambient_generic`'s `message`).
4. **Synthesis**: five building blocks cover every sound asked for, each a few dozen lines: noise through
   biquad filters, exponential envelopes, modal resonators (sums of damped sines at inharmonic ratios),
   pitch sweeps and FM tones, and a short synthetic room (convolution with decaying noise), then layering,
   saturation and a peak normaliser. A prototype of ten recipes is about 140 lines (section 4.4).
5. **Checking without ears** works in three tiers: hard checks on the bytes (format, clipping, DC, silence
   at the ends, loop seam), features measured against the game's own sounds of the same class (length,
   level, crest factor, attack, decay, spectral centroid, flatness, band shares, onsets), and a picture
   (waveform over a log-frequency spectrogram, the reference beside it) the agent reads. Section 5 has the
   reference ranges measured from Half-Life's files.
6. **The prototype's first gunshot measured nothing like the game's** (crest factor 16 dB against 8.5,
   centroid 345 Hz against 940 to 1050, 71% of energy under 150 Hz against 20 to 23%). Two passes guided
   only by the numbers and the spectrogram brought it to crest 10.2 dB, T20 0.56 s (game 0.61 to 0.81),
   centroid 1751 Hz (game 526 to 1048: still too bright, which the numbers also said). That is the loop the kit should offer the agent.
7. **What cannot be checked**: whether it sounds right to a person, in the game, through the game's mixer,
   its pitch randomising, its attenuation and room effect (`env_sound`). Say so in every report.

## 2. What GoldSrc and Xash accept

### 2.1 The file

| | GoldSrc (Half-Life, closed engine) | Xash3D FWGS (open) |
| --- | --- | --- |
| Container | RIFF `WAVE`, chunks `fmt `, `data`, optional `cue `, `LIST` | Same parser lineage; also MP3 inside a WAV (format 85) |
| Sample format | PCM (format 1), 8-bit unsigned or 16-bit signed | Same: `only 8 and 16 bit WAV files supported` |
| Channels | Mono. VDC's table marks stereo "not in GoldSrc"; Quake's loader prints `is a stereo sample` and refuses it | Mono or stereo (`only mono and stereo WAV files supported`) |
| Rates | 11025 and 22050 Hz; VDC: "other sample rates can sometimes be used, but they will be resampled to 22050 Hz". Half-Life ships two 44100 Hz files (`UI/valve_sound.wav`, `headcrab/hc_alert2.wav`), so 44100 loads | 11025, 22050, 44100 used as they are; anything else resampled to the next of those (`s_load.c` lines 130 to 135); mixes at 44100 (`SOUND_DMA_SPEED`) |
| Loop | A `cue ` chunk: loop from its first point's sample offset to the end | Same (`SOUND_LOOPED`), plus `ltxt` "mark" length when present |
| Lip sync | VDC: "lip-synched audio must be 8-bit" | 8 and 16 (`SND_MoveMouth8`, `SND_MoveMouth16`) |
| Streamed | A `*` before the name (`ambience/*speak2.wav`): not cached | `*` stripped and the file streamed |
| A sentence | A `!` before the name plays a line of `sound/sentences.txt` | Same |

Sources: Xash3D FWGS `engine/client/soundlib/snd_wav.c` (`Sound_LoadWAV`, commit e0ece3d, 2026-10-12),
`engine/client/sound/s_load.c`, `engine/client/sound.h`; id Software, Quake `WinQuake/snd_mem.c`
(`GetWavinfo`, https://github.com/id-Software/Quake/blob/master/WinQuake/snd_mem.c); VDC "WAV"
(https://developer.valvesoftware.com/wiki/WAV) and "Looping a Sound"
(https://developer.valvesoftware.com/wiki/Looping_a_Sound), read through the Wayback Machine since the wiki
now blocks scripted readers.

What Half-Life itself ships (measured: every `.wav` under `valve/sound`, read only):

```
format                     files   looped
11025 Hz  8-bit mono       2355    116
22050 Hz  8-bit mono        175     20
44100 Hz  8-bit mono          2      0
22050 Hz 16-bit mono          3      0     (UI/ button clicks)
22050 Hz 16-bit stereo        7      0     (common/launch_*: the launcher's menu)
total                      2542    136
largest: gman/gman_offer.wav, 829 KB, 77 s
```

Counter-Strike's 382 sounds are mostly 22050 Hz 8-bit (263), with odd rates (8000, 11000, 16000, 22000)
that both engines resample. So 8-bit is the house style of the era, not a limit. 8-bit has a noise floor
near -48 dBFS, which turns a quiet decay into hiss: the kit should default to 16-bit and dither (TPDF,
one least significant bit) when asked for 8-bit.

### 2.2 How a loop is read, byte for byte

Both Quake's `GetWavinfo` and Xash's `Sound_LoadWAV` do the same thing: find `cue `, skip 32 bytes from
the chunk's start (8 of header, 4 of point count, 20 into the first cue point) and read `dwSampleOffset`
as the loop start. Then, if a `LIST` chunk follows and has `mark` 28 bytes in (an `adtl`/`ltxt` sub-chunk),
the 4 bytes at offset 24 are the loop's length in samples, and the sound is cut to `loopstart + length`.
Xash checks the loop start is inside the sound and disables looping if not (`has bad loop start`).

The chunk the kit should write after `data` (28 bytes of body):

```
"cue " 28 | count 1 | id 1, position L, "data", chunkStart 0, blockStart 0, sampleOffset L
```

Half-Life's files are laid out `fmt `, `data`, `LIST` (INFO, "File created by GoldWave"), `cue `, `LIST`
(`adtl`). `ambience/crickets.wav` carries an `ltxt` whose length is the whole file; `weapons/rocket1.wav`
carries only `labl`/`note`. Writing no `ltxt` is the safe choice.

When a looped sound plays: Xash wraps the play position from the end back to `loop_start`
(`S_AdjustLoopedSamplePosition`, `s_main.c` line 66) as long as the channel was not started with
`SND_STOP_LOOPING`; it keeps a looped channel alive even while it is out of earshot (`s_mix.c` line 366),
and does not restart a looped sound already playing on the same entity and channel (`s_main.c` line 395).
VDC: "There is no need to mark a sound as looping when playing it, but if using ambient_generic ... the
'Is NOT Looped' flag must be set correctly if you want to stop the sound after it starts". The seam is the
sound designer's: "otherwise there will be a 'pop' as the waveform jumps".

### 2.3 Limits

| Limit | Value | Source |
| --- | --- | --- |
| Sounds precached in one map | 512 | ReHLDS `rehlds/common/qlimits.h` (`MAX_SOUND_INDEX_BITS 9`); Xash's GoldSrc-sized protocol `engine/common/protocol.h` line 194 (Xash's own: 2048) |
| A path | 64 characters (`MAX_QPATH`), from the mod folder; `sound/` is added by the engine | ReHLDS `qlimits.h` |
| A model event's text (the sound's path in a `5004`) | 64 bytes with its zero (`char options[64]`) | `src/mdl.mjs` `EVENT` (matches `studio.h`) |
| Size and length | None stated; memory only. The largest in Half-Life is 829 KB, 77 s | measured |
| `materials.txt` | 512 entries, the first 12 letters of a texture name | `pm_shared/pm_shared.c` (`CTEXTURESMAX`, `CBTEXTURENAMEMAX 13`) |
| `sentences.txt` | 2048 sentences (`CVOXFILESENTENCEMAX`), 200 groups (`CSENTENCEG_MAX`), names of 15 letters | `dlls/util.h`, `dlls/sound.cpp` |
| Channels mixing at once (Xash) | 60 dynamic + ambients, 256 static | `engine/client/sound.h` |

Rule 8 of AGENTS.md holds for sounds too: a sound must be precached as the map starts. A sound that
**replaces** a file the game already precaches needs nothing; a **new** name needs the mod's code or
scripts to precache it (`ambient_generic` precaches its own `message`, `CAmbientGeneric::Precache` in `dlls/sound.cpp`).

### 2.4 Where sounds are used

All paths below are relative to `<mod>/sound/`. Half-Life SDK paths are from
https://github.com/ValveSoftware/halflife (commit b1b5cf5).

**Model events** (the kit writes them: `addSequence`, `setEvents`). Client side, `cl_dll/entity.cpp`
`HUD_StudioEvent`:

| Event | What it does |
| --- | --- |
| 5004 | `pfnPlaySoundByNameAtLocation(options, 1.0, attachment[0])`: the text is the path, played at the first attachment, volume 1 |
| 5001, 5011, 5021, 5031 | Muzzle flash at attachment 0 to 3 (text: the sprite's scale and kind) |
| 5002 | Sparks at attachment 0 |

Server side, monsters (`dlls/scriptevent.h`, `dlls/monsterevent.h`, handled in `dlls/monsters.cpp`
`CBaseMonster::HandleAnimEvent`):

| Event | What it does |
| --- | --- |
| 1004 `SCRIPT_EVENT_SOUND` | Plays the named wave on `CHAN_BODY` at `ATTN_IDLE` (a footstep in a monster's walk, a thud) |
| 1008 `SCRIPT_EVENT_SOUND_VOICE` | The same on `CHAN_VOICE` |
| 1005 / 1009 | A sentence / a sentence group 25% of the time |
| 2001 / 2002 | Body drop, light / heavy (`common/bodydrop3.wav` or `4`, fixed names) |
| 2010 | Swish (`zombie/claw_miss2.wav`, fixed) |

So 1004 is "play this wave from the monster's body", which is what a monster's footsteps use, not an event
only for footsteps. In Half-Life's own first-person models only three use 5004, all for reloads:

```
v_357.mdl        reload@70           weapons/357_reload1.wav
v_9mmAR.mdl      reload@5, @24       items/cliprelease1.wav, items/clipinsert1.wav
v_9mmhandgun.mdl reload@4, @23       items/9mmclip2.wav, items/9mmclip1.wav  (and reload_noshot)
```

**Sounds named by the game's code** (a replacement keeps these names; precached by the weapon):

| Weapon | Files | Where |
| --- | --- | --- |
| crowbar | `weapons/cbar_hit1,2` (wall, pitch 98 to 101), `cbar_hitbod1..3` (flesh), `cbar_miss1` (swing) | `dlls/crowbar.cpp`, `cl_dll/ev_hldm.cpp` |
| 357 | `weapons/357_shot1,2` (volume 0.8 to 0.9), `357_reload1`, `357_cock1` | `dlls/python.cpp`, `ev_hldm.cpp` line 804 |
| shotgun | `weapons/sbarrel1` (pitch 93 to 124), `dbarrel1` (pitch 85 to 116), `scock1` (pump), `reload1`, `reload3`, `sshell1,3` | `dlls/shotgun.cpp`, `ev_hldm.cpp` |
| rpg | `weapons/rocketfire1`, `glauncher`, `rocket1` (the flying rocket's loop) | `dlls/rpg.cpp` |
| grenades | `weapons/grenade_hit1..3`, `debris1..3` (`dlls/ggrenade.cpp`), `g_bounce1..3` (`dlls/satchel.cpp`); the blast's `weapons/explode3..5` is the engine's (Xash `cl_tent.c`, the `Explode` sound list) | as named |
| tripmine | `weapons/mine_deploy`, `mine_charge`, `mine_activate` | `dlls/tripmine.cpp` |
| shell casings | `player/pl_shell1..3` (bullets), `weapons/sshell1..3` (shotgun): one per bounce, the first bounce then one in four | engine (Xash `engine/client/cl_tent.c` `CL_TempEntPlaySound`) |

The hand grenade has no pin sound in Half-Life (`dlls/handgrenade.cpp` plays only `common/null.wav`); a
pin pull is a 5004 event on its `pinpull` animation, which a mod adds to the model.

**Footsteps** (`pm_shared/pm_shared.c`, `PM_UpdateStepSound` and `PM_PlayStepSound`). The texture under
the player is looked up in `sound/materials.txt` (lines `<letter> <TEXTURENAME>`, first 12 letters, after
stripping a leading `-x`/`+x` and then `{`, `!`, `~` or a space); a name not listed is concrete. Each
surface plays one of four fixed files chosen at random:

| Surface (letter) | Files | Volume walking / running |
| --- | --- | --- |
| concrete (C, default) | `player/pl_step1..4` | 0.2 / 0.5 |
| metal (M) | `player/pl_metal1..4` | 0.2 / 0.5 |
| dirt (D) | `player/pl_dirt1..4` | 0.25 / 0.55 |
| vent (V) | `player/pl_duct1..4` | 0.4 / 0.7 |
| grate (G) | `player/pl_grate1..4` | 0.2 / 0.5 |
| tile (T) | `player/pl_tile1..5` | 0.2 / 0.5 |
| slosh (S) | `player/pl_slosh1..4` | 0.2 / 0.5 |
| ladder, wading | `pl_ladder1..4`, `pl_wade1..4` | 0.35, 0.65 |

A step every 300 ms running, 400 ms walking, slower ducking. Wood (W), computer (P), glass (Y) and flesh
(F) change only what a bullet's impact sounds like (`dlls/sound.cpp` `TEXTURETYPE_PlaySound`), not the
step. A new surface sound needs a new letter in the mod's code. Half-Life's own `materials.txt` has 406
lines.

**Map entities** (`dlls/sound.cpp`, flags in `dlls/util.h`):

- `ambient_generic`: `message` the path (or `!SENTENCE`), `health` volume 1 to 10, `pitch` 1 to 255 (100
  as recorded), `preset` 0 to 27 (pitch and volume patterns: "Huge Machine", "Slow Pulse" ...), fades,
  spin-up, LFO keys. Flags: 1 everywhere (no fall-off), 2 small radius (`ATTN_IDLE` 2.0), 4 medium
  (`ATTN_STATIC` 1.25, also the default), 8 large (`ATTN_NORM` 0.8), 16 start silent, 32 not looped
  (not toggled). The entity treats its sound as looping unless flag 32 is set; whether it actually loops
  is the file's cue chunk. VDC: "If using custom looping WAV files, cue points need to be added ... or
  the audio will not play!" (https://developer.valvesoftware.com/wiki/Ambient_generic_(GoldSrc)).
- `env_sound`: `radius` and `roomtype` 0 to 28 (0 off, 1 generic, 2 to 4 metal, 5 to 7 tunnel, 8 to 10
  chamber, 11 to 13 bright, 14 to 16 water, 17 to 19 concrete, 20 to 22 big, 23 to 25 cavern, 26 to 28
  weirdo). The engine's room effect; the kit's sounds should therefore be **dry or nearly dry** and let the
  map add the room (https://developer.valvesoftware.com/wiki/Env_sound).
- Doors, buttons, trains and plats choose their sounds by number from fixed lists in the game's code
  (`movesnd`, `stopsnd`, `locked_sound`); a new one replaces a file of that list.

**`sound/sentences.txt`**: one line a sentence, `NAME dir/word word(p110) (t40) word(e75)`: the first word
names the folder (default `vox/`), each following word is a `.wav` in it, and the bracketed options set
pitch (`p`), volume (`v`), start and end (`s`, `e`, percent of the word) and time compression (`t`).
Example from Half-Life: `HG_COVER3 hgrunt/clik(p120) (t40) two!(e75) hot!(e80) here! clik`. Speech is
not a target of this kit (it would need a voice synthesiser), but radio clicks and beeps for it are.

## 3. Prior art in game sound effects from parameters

| Work | What it is | What carries over |
| --- | --- | --- |
| sfxr (Tomas Pettersson, 2007, https://www.drpetter.se/project_sfxr.html), jsfxr, bfxr | About 20 parameters (wave, envelope, frequency slide, vibrato, arpeggio, duty, repeat, phaser, filters) and buttons "pickup", "laser", "explosion" that randomise inside a class | Class presets the agent mutates; one seed reproduces a sound |
| ZzFX (Frank Force, 2019, https://github.com/KilledByAPixel/ZzFX) | A 1 KB JavaScript synth: a sound is an array of 20 numbers | Proof that a whole game's effects fit in a few hundred lines of JS with no dependency |
| Andy Farnell, *Designing Sound* (MIT Press, 2010) | Procedural audio: analyse the physics, build a model in Pure Data. Practicals include footsteps, gunshots, explosions, rocket launch, switches, motors, fire, rain, wind, insects | The method: what makes the sound (a blast wave, a resonant body, friction), then the fewest layers that say it. The recipes in 4.3 follow his breakdowns |
| Perry Cook, *Real Sound Synthesis for Interactive Applications* (A K Peters, 2002) | Modal synthesis, physically informed stochastic models (PhISEM: shakers, gravel, rain as random particle collisions through resonant filters) | Modal impacts; particles for gravel, dirt, fire crackle |
| Perry Cook, "Modeling Bill's Gait: Analysis and Parametric Synthesis of Walking Sounds", AES 22nd International Conference, 2002 (https://soundlab.cs.princeton.edu/publications/billsgait.pdf) | Gait (tempo, left-right asymmetry), heel and toe events, resonances by linear prediction, particle statistics from a wavelet band | A step is two events (heel, toe) 20 to 40 ms apart, a body resonance per surface, particles for grit |
| van den Doel, Kry and Pai, "FoleyAutomatic: Physically-based Sound Effects for Interactive Simulation and Animation", SIGGRAPH 2001 | Modal resonators driven by contact forces | A hit is an excitation (short, its brightness the hardness) into a bank of modes (the object) |
| Chowning, "The Synthesis of Complex Audio Spectra by Means of Frequency Modulation", JAES 21(7), 1973 | FM with an index envelope gives evolving inharmonic spectra (bells, brass) | Cheap metallic rings, beeps, sci-fi |
| Bristow-Johnson, "Audio EQ Cookbook" (now W3C, https://www.w3.org/TR/audio-eq-cookbook/) | Biquad coefficients for low/high/band-pass, peak, shelf | The only filter the kit needs |
| Schroeder, "Natural Sounding Artificial Reverberation", JAES 10(3), 1962; Moorer, "About This Reverberation Business", CMJ 3(2), 1979 | Combs and all-passes; decaying noise as an impulse response | A short room by convolving with exponentially decaying filtered noise |
| Rob Maher, "Modeling and Signal Processing of Acoustic Gunshot Recordings", IEEE DSP Workshop, 2006 | Muzzle blast as a 3 to 5 ms N-shaped wave, then reflections | A gunshot's first few ms are a near-impulse; the rest is the room and the recording chain |
| Curtis Roads, *Microsound* (MIT Press, 2001) | Granular synthesis | Rain, fire, crickets, crowd beds: many short grains at a density |
| DAFX, ed. Udo Zolzer (Wiley, 2nd ed. 2011) | Reference for filters, delays, dynamics, saturation, time-frequency processing | Waveshaping (`tanh`), compression, crossfade looping |

## 4. Synthesis in a few hundred lines

### 4.1 The building blocks

| Block | Code | Parameters |
| --- | --- | --- |
| Noise | `Math.random`-free seeded generator (a 32-bit LCG or xorshift), white; pink by Voss-McCartney or a 3-pole filter; brown by a leaky integrator | `color`, `seed` |
| Biquad filter | RBJ cookbook, direct form I, 6 lines | `type` lp/hp/bp/peak/notch, `f`, `q`, `gain`; `f` may sweep (recompute every 32 to 64 samples) |
| Envelope | Attack linear (or quarter sine), hold, then `exp(-6.9078 t / t60)` (falls 60 dB in `t60` seconds); ADSR for held tones; a table of `[t, level]` points for anything else | `attack`, `hold`, `decay` (t60), `sustain`, `release` |
| Oscillator | Phase accumulator; sine, triangle, square, saw (band-limit with polyBLEP over 2 kHz) | `f`, sweep `{ from, to, time, curve: exp }`, `vibrato` |
| FM | `sin(phc + I(t) sin(phm))`, modulator at `ratio * f` | `ratio` (inharmonic: 1.4, 2.76), `index` with its own envelope |
| Modes | Sum of damped sines, each `{ f, gain, t60 }`, random phase, tiny detune | Base `f` and a ratio set: free bar 1, 2.756, 5.404, 8.933 (Euler-Bernoulli beam, free ends); clamped bar 1, 6.267, 17.55; circular plate 1, 1.59, 2.14, 2.30, 2.65, 2.92 (Bessel roots); tube/bell sets as tables. Higher modes decay faster: `t60_k = t60 / k^damping` |
| Particles / grains | Poisson process of events (rate per second, maybe swelling), each a tiny burst or a short modal ping, random pitch and level | `rate`, `length`, `spread`, the grain's own layer |
| Room | Convolve with filtered noise that decays by `t60`, `ir[0] = 0`, wet gain over the IR's energy; direct convolution is fine below 0.5 s at 22050 Hz, FFT convolution above | `t60` 0.15 to 1.2 s, `wet` 0.05 to 0.4, `lp` |
| Saturation | `tanh(drive x) / tanh(drive)`; a gunshot's loudness comes from this (section 6) | `drive` 1 to 8 |
| Finish | DC block (one-pole high-pass at 20 to 30 Hz), peak normalise (to -0.5 dBFS), trim below -60 dB plus 5 ms, 5 to 10 ms fade out, loop crossfade | `peak`, `trim`, `fade` |

Every random choice comes from the spec's `seed`, so a build is reproducible to the byte.

### 4.2 Layering

Nearly every effect is three layers in time (Farnell's "attack, body, tail"; the same split the game
industry calls transient, body and tail):

- **Transient**, 1 to 15 ms: a click of high-passed noise or an N-wave. It says hard or soft, near or far.
- **Body**, 30 to 700 ms: the object ringing (modes), a boom (a falling sine), a scrape (band-passed
  noise). It says what the thing is made of and how big it is.
- **Tail**, 100 ms to 2 s: the room or the air. It says where. For GoldSrc keep it short and let
  `env_sound` add the room.

### 4.3 Recipes

Times are seconds, frequencies Hz. "t60" is the decay to -60 dB. Each recipe ends with DC block, peak
normalise and trim unless said.

| Sound | Layers | Numbers |
| --- | --- | --- |
| **Wrench / crowbar on a wall** | click + modes (free bar) + rasp + room | Click: white noise, high-pass 1500, t60 0.012. Modes: f0 700 to 900, ratios 1, 2.756, 5.404, 8.933, gains 1, 0.6, 0.35, 0.2, t60 0.7, 0.45, 0.25, 0.12, detune 0.5%. Rasp: noise band-pass 1400 Q 0.9, t60 0.45, -6 dB. Thud: noise low-pass 400, t60 0.06. Saturate 1.5. Room t60 0.35, wet 0.15. Length 0.5 to 0.7. Variants: 2 seeds, f0 +-3% |
| **Wrench on flesh** | thud + slap | Noise low-pass 300 plus a sine sweep 120 to 60 Hz, t60 0.2; a 10 ms band-pass 1200 slap. 68% of energy under 150 Hz (measured). Length 0.3 |
| **Swing (whoosh)** | band-passed noise, centre swept | Noise through band-pass Q 1.2 to 1.5, centre `300 + 900 sin^2(pi u)` over the swing, amplitude `sin^3(pi u)`, attack about 170 ms to a peak at 0.2, length 0.3 to 0.35, peak -9 dBFS (the game's is quiet: RMS -23) |
| **Revolver shot** | N-wave crack + body noise held + low boom + room, then hard saturation | Crack: 6 ms of high-passed (800) noise, linear fall, x2. Body: noise high-pass 90, low-pass 3500 to 4500, peak +8 dB at 900, held at full for 0.12 then t60 0.9. Boom: sine sweep 140 to 45 over 0.25, t60 0.2, -6 dB. Room t60 0.9, wet 0.35. Saturate drive 6, then normalise to -0.3. Length 1.0 to 1.3. Variants: shot1/shot2 by seed |
| **Shotgun blast** | as the revolver, darker and longer | Low-pass 2500, boom 110 to 40, held 0.15, room t60 1.1; length 1.0 to 1.4; the game's `dbarrel1` puts 38% under 150 Hz |
| **Reload click, cock, dry fire** | tick + high modes | Tick: 2 to 4 ms noise band-pass 4000 to 6000 Q 2. Modes 3400, 6100, 8200 Hz, t60 0.02 to 0.04. Length 0.1 to 0.2. Two clicks 30 to 80 ms apart for a hammer cock |
| **Revolver reload (cylinder, shells)** | sequence of events | Cylinder open click, 0.1 s rattle (particles: 8 pings 2 to 5 kHz in 0.1 s), shell drops, close click. The model's 5004 event fires the whole file at frame 70 of 111 at 36 fps, so the file's own timing must match the animation from 1.94 s on |
| **Shotgun pump** | scrape + clack, twice | Back: band-passed noise 2500 Q 0.8, 0.08 s, sin^2 envelope at -10 dB, then clack: modes 1900, 4370, 7800 Hz t60 0.06 to 0.02 plus a 5 ms high-passed click. Forward 0.2 later: same, clack at 1500, +2 dB. Room t60 0.2, wet 0.1. Length 0.45 to 0.55 |
| **Shell casing** | one ping per file | Brass: modes 3150, 5830, 8400 t60 0.2, 0.15, 0.08, one or two bounces only: the engine plays one file per bounce. Shotgun shell (plastic and brass): lower, 1800 to 2500, duller (t60 0.08) plus a 10 ms noise tap |
| **Pipe launcher fire** | thump + whoosh | Thump: sine sweep 120 to 50 over 0.2, t60 0.15, x2. Whoosh: noise high-pass 600, low-pass 5000, attack 0.05, t60 0.6, the band-pass centre rising 800 to 2500 over 0.4. Room t60 0.4. Length 0.6 to 1.2 |
| **Projectile in flight (loop)** | noise + roar, looped | Noise low-pass 1500 with slow random wobble of the cutoff (0.5 to 2 Hz), a 80 to 120 Hz saw at -12 dB; 1 to 2 s; loop with crossfade |
| **Grenade pin** | ping + wire scrape | Modes 2900, 4700, 7300, t60 0.35, 0.2, 0.1; scrape band-pass 3500 Q 1.5, 60 ms, half-sine, -4 dB. Length 0.3. Then the spoon: a click 0.1 later |
| **Grenade bounce** | low thud + rattle | Sine 150 to 90 t60 0.08, noise low-pass 600; the game's `g_bounce1` is 86% under 150 Hz, 0.28 s |
| **Explosion** | crack + boom + debris particles + long tail | Noise burst 3 ms; noise low-pass 800 with peak 80 Hz, held 0.1, t60 1.5; sine 60 to 30; particles 30 per second for 1 s (debris ticks band-pass 2 to 4 kHz); saturate 4; length 1.5 to 3 |
| **Footstep, concrete** | heel + toe + grit | Heel: noise low-pass 1100, high-pass 120, t60 0.2, plus sine 110 to 70 t60 0.06 at -4 dB; toe 25 ms later at -4.5 dB; grit: band-pass 3000 noise t60 0.05 at -16 dB. Length 0.2 to 0.27. Four variants by seed, heel-toe gap 20 to 35 ms, level +-1.5 dB |
| **Footstep, metal** | concrete step + plate modes | Plate: f 180, ratios 1, 1.59, 2.14, 2.30, 2.65, 3.6, gains 1/k, t60 0.5 down to 0.2, at -6 dB. Length 0.5 to 0.6 (game: centroid 360 Hz, T20 0.42) |
| **Footstep, dirt / gravel** | soft heel + particles | Heel low-pass 600 t60 0.1; particles: 40 to 80 grains in 0.15 s, each 1 to 3 ms band-pass 1500 to 4000. Bright and noisy (game: centroid 1370, flatness 0.43) |
| **Footstep, tile / wood** | short tap + a few modes | Tile: low and dull in Half-Life (centroid 274, flatness 0.02), a 300 Hz mode t60 0.15. Wood: modes 220, 470, 820 t60 0.12, plus a 5 ms knock |
| **Footstep, grate / vent** | step + metal rattle | Grate: plate modes at 120 to 200 Hz, t60 0.6, plus 3 to 6 rattle pings 20 to 40 ms apart. Vent (duct): a hollow box: modes 150, 240, 410 t60 0.6, a boomy 0.85 s |
| **Ambient drone (loop)** | harmonics + band noise, LFO | 60 Hz and its 2nd, 3rd partials (0.5, 0.3, 0.15), slow amplitude LFO 0.5 Hz, band-pass 300 noise at -14 dB; 2 to 6 s, every periodic part a whole number of cycles in the loop, 0.25 s crossfade |
| **Wind (loop)** | noise through two swept band-passes | Pink noise, band-pass 400 to 900 Q 2 and 900 to 1600 Q 4, centres and level moved by smoothed random curves of period 2 to 5 s; 4 to 8 s |
| **Fire (loop)** | rumble + hiss + crackle particles | Brown noise low-pass 300; hiss band-pass 3000 at -20 dB; crackles: Poisson 6 per second, each 1 to 5 ms high-passed noise or a click (Farnell's fire) |
| **Drips (loop)** | sparse modal pings | 1 to 3 drips per second, each a sine sweep up 800 to 1600 over 30 ms (a bubble's resonance rising, Minnaert), t60 0.08; much silence; 5 to 8 s |
| **Crickets (loop)** | chirps of a 4.5 kHz tone | Bursts of 3 to 5 pulses at 4000 to 4800 Hz, 15 ms each, 30 ms apart, a chirp every 0.4 to 0.8 s; game's: 86% of energy 2 to 5 kHz |
| **Machine hum / computer** | FM or additive, modulated | FM carrier 220, ratio 1.5, index 0.5 to 2 by a slow LFO; beeps: sine 1000 to 2500, 50 to 120 ms, square-wave option |

### 4.4 The prototype

`~/stignored/smak-sound-research/synth.mjs` (outside the repository, with `measure.mjs` and `ref.mjs`; `node synth.mjs <out folder>`, `node measure.mjs <wav files>`, `node measure.mjs survey <sound folder>`) is the above in
about 140 lines: seeded noise, RBJ biquads, exponential envelopes, modes, sweeps, a convolution room,
`tanh` saturation, normalise, trim, and a WAV writer (mono, 8 or 16 bit, optional one-point cue). It wrote
ten recipes. A WAV writer with a loop and a feature measurer (`measure.mjs`, about 120 lines with an FFT)
are the core of what the kit needs; the spectrogram took 20 s with a naive DFT and needs the FFT the
measurer already has.

## 5. Checking and scoring a sound without ears

### 5.1 Hard checks (a fault fails the build)

| Check | Fault when |
| --- | --- |
| Format | Not RIFF/WAVE PCM; not mono; bits not 8 or 16; rate not 11025, 22050 or 44100 |
| Name | Over 63 characters from the mod folder (`sound/` included), not under `sound/`, spaces or upper case (the game's files are lower case; Linux servers are case-sensitive), a 5004 event's path over 63 bytes |
| Clipping | Any run of 3 or more samples at full scale (after the last normalise there should be none) |
| DC offset | Mean over 0.01 of full scale (the prototype's first footstep had 0.018, from an asymmetric sine sweep; a 30 Hz high-pass fixes it). Half-Life's 8-bit files sit at -0.004, which is 8-bit's half-step bias, not a fault |
| Level | Peak under -12 dBFS (too quiet: the game's volume only turns down), or the RMS more than 12 dB off the class's range |
| Silence | One-shot: over 20 ms of silence (-60 dB) before the onset (it plays late: a shot must start at sample 0); over 50 ms at the end (wasted precache). Half-Life's one-shots measure 0 ms at both ends |
| Ends | A one-shot whose last 5 ms is not faded (a click at the end) |
| Loop | Has a cue point at a sample inside the file; the seam (last sample to the loop start's sample) jumps by less than about 2 times the mean step between samples (Half-Life's loops: 0.0 to 0.81; the prototype's crossfaded drone: 0.82); the RMS of the last 50 ms within 3 dB of the first 50 ms after the cue (game: within 2.8 dB); every tone a whole number of cycles across the loop |
| Length | Outside the class's range by more than half again; a reload sound longer than its animation's time from the event's frame to the end |

### 5.2 Features (the measure of "like the game's")

Computed on the mono signal, with 5 ms RMS frames for the envelope and 1024-point Hann-windowed FFT frames
at 50% overlap for the spectrum:

| Feature | Definition | What it tells |
| --- | --- | --- |
| Length | seconds | |
| Peak, RMS (dBFS), crest factor | `peak - RMS` | Crest factor is how punchy or compressed: the game's shots are 7.5 to 8.7 dB, its footsteps 19 to 21 |
| Attack | 10% to 90% of the envelope's peak, ms; and when the peak is | 0 to 5 ms for a hit, 170 ms for a swing |
| Decay | T20 and T40: from the envelope's peak to where it last stays above -20 and -40 dB (Schroeder backward integration, JASA 37(3), 1965, is the refined form) | Ring length: a metal hit's T20 0.3 to 0.6 s, a click's 0.04 |
| Spectral centroid | Mean frequency weighted by power | Bright or dark |
| Roll-off | Frequency under which 85% of the power lies | |
| Spectral flatness | Geometric over arithmetic mean of the power spectrum (Wiener entropy), 0 tonal to 1 white | Noise-like (dirt step 0.43, click 0.5) or tonal (metal step 0.06, drone 0.001) |
| Band shares | Percent of power under 150, 150 to 600, 600 to 2000, 2000 to 5000, over 5000 Hz | Where the weight is |
| Onsets | Peaks of spectral flux over mean + 2 sd, at least 50 ms apart (Bello et al., "A Tutorial on Onset Detection in Music Signals", IEEE TSAP 13(5), 2005) | Two for a pump, one for a shot |
| Loudness | Optionally LUFS by ITU-R BS.1770 (K-weighting: a high shelf +4 dB over 1.5 kHz and a 38 Hz high-pass, then mean square) | Matching levels between sounds that play together |

Feature definitions follow Peeters, "A large set of audio features for sound description" (CUIDADO
project report, IRCAM, 2004).

### 5.3 Reference ranges measured from Half-Life

Measured with the scratch script from the game's own files in the person's install (read only; nothing
copied). These numbers are facts about the files, not the files, and could ship with the kit as a table.

```
class              file                 Hz    len   peak  RMS    crest atk  T20   T40   centroid flat   <150  150-600 600-2k 2k-5k >5k  onsets
metal hit          cbar_hit1           11025  0.69  -0.4  -9.9   9.5   5    0.56  0.65  1343     0.215  4.9   6.8     73.8   13.7  0.9  1
metal hit          cbar_hit2           11025  0.49  -0.4  -8.7   8.3   5    0.32  0.46  1378     0.224  4.5   6.1     73.7   14.6  1.0  0
flesh hit          cbar_hitbod1        22050  0.31  -0.5  -8.4   7.9   40   0.24  0.27   702     0.108  68.1  10.9    8.1    9.8   3.1  1
swing              cbar_miss1          22050  0.34  -8.9  -22.8  13.9  170  0.10  0.14   760     0.078  1.0   65.8    25.0   6.7   1.6  0
gunshot            357_shot1           22050  1.06   0.0  -8.5   8.5   5    0.75  1.00   937     0.110  20.3  27.5    43.9   6.7   1.6  3
gunshot            357_shot2           22050  1.06   0.0  -8.7   8.7   5    0.75  0.98  1048     0.149  23.3  26.0    36.1   12.1  2.4  2
gunshot            sbarrel1            22050  1.04  -0.4  -8.7   8.3   5    0.61  0.96   604     0.081  31.7  37.9    24.4   4.8   1.3  1
gunshot            dbarrel1            22050  1.37  -0.1  -7.5   7.5   5    0.81  1.13   526     0.047  38.0  33.4    23.4   4.5   0.7  2
reload             357_reload1         22050  0.58  -6.2  -28.5  22.3  175  0.25  0.39  3930     0.597  1.1   0.3     18.4   55.5  24.6 2
click              357_cock1           22050  0.12   0.0  -12.9  12.9  10   0.04  0.11  5923     0.481  0     0.1     2.5    39.1  58.2 0
click              dryfire1            22050  0.18  -0.3  -15.4  15.1  15   0.05  0.14  5922     0.455  0     0.2     6.6    34.7  58.4 0
click              reload1             22050  0.22  -0.1  -21.1  21.1  95   0.04  0.08  4579     0.524  0.1   0.1     12.5   51.0  36.3 1
pump               scock1              22050  0.53   0.0  -18.3  18.3  329  0.07  0.18  3996     0.516  0.2   0.6     18.3   51.5  29.4 2
shell              sshell1             22050  0.71  -4.0  -19.4  15.4  55   0.51  0.65  2117     0.115  0.7   0.4     46.3   42.7  9.8  2
launcher           rocketfire1         22050  0.43  -1.0  -9.1   8.1   75   0.30  0.35  2280     0.473  2.1   36.2    30.5   13.4  17.8 2
launcher           glauncher           22050  1.27   0.0  -12.2  12.2  0    1.14  1.19   862     0.140  21.8  43.1    22.5   10.2  2.4  1
grenade cock       gren_cock1          11025  0.75  -0.3  -18.9  18.6  180  0.37  0.55  1664     0.523  2.8   34.2    27.2   34.5  1.2  1
grenade bounce     g_bounce1           11025  0.28  -9.1  -21.2  12.2  75   0.20  0.21   152     0.010  85.8  12.8    0.8    0.4   0    0
explosion          explode3            22050  1.30  -0.4  -6.2   5.7   5    0.89  1.03   616     0.097  36.4  37.6    19.5   4.6   1.9  1
step concrete      pl_step1            11025  0.27  -0.1  -21.1  21.0  0    0.09  0.26   853     0.270  26.8  48.3    8.5    15.1  1.4  0
step concrete      pl_step2            11025  0.22  -0.6  -19.5  18.8  0    0.13  0.21   847     0.277  25.2  49.7    8.2    16.0  0.9  0
step metal         pl_metal1           11025  0.58   0.0  -15.5  15.5  25   0.42  0.54   360     0.057  34.8  43.8    19.6   1.8   0.1  0
step dirt          pl_dirt1            11025  0.34  -0.1  -21.3  21.2  5    0.26  0.34  1368     0.433  3.1   30.1    41.9   24.2  0.8  0
step tile          pl_tile1            11025  0.23  -2.3  -19.4  17.0  0    0.11  0.23   274     0.021  11.4  85.9    1.4    1.3   0    0
step grate         pl_grate1           11025  0.82   0.0  -14.8  14.8  35   0.68  0.73   199     0.019  53.6  41.2    4.6    0.5   0    1
step vent          pl_duct1            11025  0.85  -0.3  -14.1  13.8  160  0.59  0.68   236     0.003  64.3  15.5    20.2   0.1   0    1
step ladder        pl_ladder1          11025  0.36   0.0  -12.7  12.7  45   0.22  0.30   315     0.020  8.4   87.0    3.1    1.4   0.1  0
step slosh         pl_slosh1           11025  0.89  -0.1  -23.8  23.8  35   0.58  0.85   817     0.222  7.8   57.2    21.7   12.9  0.4  1
loop drips         ambience/drips      11025  7.31  -0.4  -27.3  26.9  cue 0                    839     0.095  1.2   23.2    72.3   2.5   0.7  4
loop crickets      ambience/crickets   11025  3.58  -0.1  -18.7  18.7  cue 0                   4499     0.086  0.1   0       0.7    86.2  13.0 3
loop machine       ambience/industrial1 11025 2.71  -0.4  -11.7  11.3  cue 0                    337     0.001  3.9   94.2    1.9    0     0    3
loop drone         ambience/labdrone1  11025  5.36  -0.1  -12.1  12.1  cue 0                    188     0.001  55.6  40.4    4.0    0     0    4
loop fire          ambience/burning1   11025  5.40   0.0  -13.1  13.1  cue 0                    585     0.200  16.3  63.1    14.2   5.5   1.0  5
(len, T20, T40 in s; atk in ms; peak, RMS, crest in dB; bands in % of power. All 8-bit mono.)
```

What the table teaches:

- **The game's sounds are loud.** Nearly every one-shot peaks at 0 to -0.5 dBFS; levels are set by the
  code's volume (footsteps 0.2 to 0.7), not by the file. Normalise one-shots to -0.5 dBFS, swings and
  ambient beds lower (-6 to -9).
- **Shots and explosions are heavily compressed**: crest 5.7 to 8.7 dB, against 15 to 21 for steps and
  clicks. A synthesised blast through a plain envelope comes out at 16 dB and sounds thin next to them;
  saturation after the room is what closes the gap.
- **Footsteps are short and dark** in Half-Life (centroid 270 to 850 Hz except dirt at 1370), metal and
  vents ring for 0.6 to 0.85 s.
- **Clicks live above 2 kHz** (87 to 97% of their power), with flatness near 0.5: noise-like, not tones.
- **Loops are 2 to 7 s at 11025 Hz** with a cue at 0 and seams below the mean sample step.

### 5.4 The score

For each sound the build gives, per feature, where the sound sits against its class's range (the min to
max of the references, widened by 25% or by a floor: 0.1 s for length, 3 dB for levels, 20% for
centroid, 10 points for a band share). A feature inside scores 2, inside twice the margin 1, else 0; the
report lists the out-of-range ones in words ("centroid 345 Hz, the class is 520 to 1050: too dark; more
600 to 2000 Hz"). The class is the spec's `class`, or `reference: [files]` given by the agent.

The prototype's revolver over three passes, against the four gunshots above:

```
pass  change                                                 crest  T20   centroid  <150   600-2k
1     boom 140->45 Hz loud, blast low-passed 2500             16.4   0.31   345      71.0    10.8
2     boom at -6 dB, blast low-pass 4500, peak +8 dB at 900   18.5   0.22  1382      10.0    60.7
3     blast held 0.12 s, saturation drive 6 after the room    10.2   0.56  1751       3.1    58.3
game  357_shot1/2, sbarrel1, dbarrel1                         7.5-8.7 0.61-0.81 526-1048 20-38 23-44
```

Pass 3 is within a step of the range on crest and T20, too bright by 700 Hz and short on low end: the next
pass would lower the body's low-pass to 2500 and give the boom back 6 dB. The numbers said all of that
without anyone listening. Pass 1's spectrogram against `357_shot1`'s showed the same at a glance: the
game's stays bright and loud for 0.4 s, the synthesised one fell away in 0.1 s.

### 5.5 The pictures

One PNG per sound, which the agent reads:

- Top: the waveform, min and max per column, with a line at -6 and -20 dBFS and the loop point marked.
- Below: a spectrogram, log frequency 50 Hz to Nyquist, 80 dB range, time along the same axis, labelled
  in Hz (100, 1k, 5k) and seconds.
- Beside it, at the same time scale, the reference (a game file the agent named, or the class's nearest),
  so "the game's stays loud for 0.4 s" is visible.
- For a loop: the waveform of the last 20 ms joined to the first 20 ms after the cue, and the whole loop
  drawn twice end to end.
- For a set (four footsteps, two shots): one row each, so variants that are too alike or too different
  show.

The kit already draws PNGs (`src/image.mjs` `png`), so this is one more drawing function.

### 5.6 A rubric for sound cases

The same shape as `examples/prompts/NN-*/prompt.md`: the prompt, a rubric written before the spec, each
item scored 0, 1 or 2, passing when every must-have scores 2 and the total is at least 85%. For example:

```
# 28 A wrench's sounds (sounds; the crowbar's files)

> The wrench needs its own sounds: a heavy steel clang when it hits a wall, a duller thud on a body,
> and a whoosh when it misses. Same files as the crowbar so the game uses them.

| # | Item | Must | Score |
| --- | --- | --- | --- |
| 1 | Six files with the crowbar's names (cbar_hit1, cbar_hit2, cbar_hitbod1..3, cbar_miss1), mono PCM, each passes every hard check | yes | 2 |
| 2 | The wall hits ring like steel: modal peaks in the spectrogram, T20 0.3 to 0.7 s, centroid 900 to 1800 Hz | yes | 2 |
| 3 | The body hits are dull: over 50% of power under 150 Hz, under 0.4 s | yes | 2 |
| 4 | The miss is a whoosh: attack over 100 ms, no onset, peak at -6 to -12 dBFS | yes | 2 |
| 5 | Each file's features within its class's range (section 5.4) on 8 of 10 or more | no | 2 |
| 6 | Variants differ (hit1 against hit2: centroid or T20 apart by 5% or more) and are alike (same class) | no | 2 |
```

The rubric's last line is always a note that the person has to listen in the game; the case records what
they said when they did.

## 6. A design for the kit

### 6.1 The spec: `smak.sound/1`

```json
{
  "spec": "smak.sound/1",
  "name": "weapons/cbar_hit1.wav",
  "class": "metal hit",
  "rate": 22050, "bits": 16,
  "seed": 3,
  "layers": [
    { "id": "click", "kind": "noise", "filter": [{ "type": "highpass", "f": 1500 }], "env": { "decay": 0.012 }, "gain": -2 },
    { "id": "ring", "kind": "modes", "f": 760, "ratios": "bar", "decay": 0.7, "damping": 1.2 },
    { "id": "rasp", "kind": "noise", "filter": [{ "type": "bandpass", "f": 1400, "q": 0.9 }], "env": { "attack": 0.001, "decay": 0.45 }, "gain": -6 }
  ],
  "finish": { "saturate": 1.5, "room": { "decay": 0.35, "wet": 0.15 }, "peak": -0.5 },
  "variants": [{ "name": "weapons/cbar_hit2.wav", "seed": 4, "pitch": 3 }],
  "reference": ["weapons/cbar_hit1.wav"]
}
```

| Field | |
| --- | --- |
| `name` | Path under `sound/`, lower case, `.wav`, at most 57 characters (so `sound/` + name fits 63) |
| `class` | A class from the kit's table (`metal hit`, `gunshot`, `click`, `pump`, `swing`, `shell`, `step concrete` ... `loop drone`): picks the reference ranges and the default length and level |
| `rate`, `bits` | 22050 and 16 unless told; 11025 and 8 allowed; never stereo |
| `seed` | Every random choice; same spec, same bytes |
| `layers` | Each `{ id, kind, at, gain (dB), env, filter, pitch }`. Kinds: `noise` (`color` white/pink/brown), `tone` (`wave`, `f`, `sweep`), `fm` (`f`, `ratio`, `index`, `indexEnv`), `modes` (`f`, `ratios` named set or list, `gains`, `decay`, `damping`, or `modes: [{ f, gain, decay }]`), `particles` (`rate`, `count`, `length`, `grain`: a layer), `sequence` (`events: [{ at, layer or sound, gain, pitch }]`: a pump, a reload, a step's heel and toe), `sound` (another spec or file of the work folder: a prefab) |
| `env` | `{ attack, hold, decay, sustain, release }` (seconds; decay is a t60) or `points: [[t, dB], ...]` |
| `filter` | A list of `{ type: lowpass|highpass|bandpass|peak|notch, f, q, gain, sweep: { to, time } }` |
| `preset` | A layer or a whole sound from the recipe table (`"preset": "gunshot"` with overrides), so a first spec is three lines |
| `finish` | `saturate`, `room { decay, wet, tone }`, `peak` (dBFS), `dcBlock` (on), `trim` (on for one-shots), `fade` |
| `loop` | `true` or `{ start, crossfade }`: writes the cue point, crossfades the seam, checks it |
| `variants` | More files from the same layers with another seed, pitch (percent), gain, so a set (`pl_step1..4`) is one spec |
| `reference` | Game files to measure and draw beside it (read from the folders the server already knows; never copied) |

Functions stay out of the spec, as in the model spec: curves are tables, randomness is the seed.

### 6.2 The tool

`build` in the MCP server takes a `smak.sound/1` spec as it takes the other two (`mcp/tools.mjs` line 664
dispatches on `spec.spec`), runs no client code, and writes `work:sound/<name>` plus every variant. Its
report, in the house format:

```
OK weapons/cbar_hit1.wav  22050 Hz 16-bit mono, 0.62 s, 27 KB, peak -0.5 dBFS, RMS -11.8, crest 11.3
fact     attack 0 ms, T20 0.31 s, T40 0.52 s, centroid 1102 Hz, flatness 0.05, onsets 1
fact     bands <150 0.2%  150-600 1.1%  600-2k 85.0%  2k-5k 12.9%  >5k 0.8%
class    metal hit: 8 of 10 in range; out: flatness 0.05 (0.17-0.27: too pure, more noise in the body),
         crest 11.3 dB (6.3-11.5, near the top)
picture  sound-cbar_hit1.png (waveform, spectrogram, weapons/cbar_hit1.wav beside it)
note     the game plays it at pitch 98 to 101 and through the map's env_sound room: listen in the game
```

A `NOT OK` names the layer when it can ("layer `ring`: modes over the Nyquist frequency 11025 are left
out: 8.933 x 1300 Hz"). `info` and `check` take a `.wav` too (format, cue, features), and `render` draws
one, so the agent can measure any game file it is told to match.

A new module, not `src/sound.mjs`: that name is already the geometry soundness check (`soundness`,
`seeThrough`), and `src/index.mjs` exports everything from it. Suggested: `src/audio/` with `wav.mjs`
(read, write, cue), `synth.mjs` (blocks), `recipes.mjs` (presets), `measure.mjs` (features, checks),
`draw.mjs` (pictures), `classes.mjs` (reference ranges as data), and `src/spec/sound.mjs` (validate,
build, report).

### 6.3 A weapon names its sounds

The weapon spec (`kind: "held"`, `weapon: { like }`) gets `sounds`:

```json
"weapon": { "like": "357" },
"sounds": {
  "fire":   { "spec": "revolver_shot.json" },
  "reload": { "spec": "revolver_reload.json", "event": { "sequence": "reload", "frame": 70 } }
}
```

- The kit keeps, for each Half-Life weapon it knows (`like`), the table of section 2.4: which names its
  code plays for `fire`, `hit`, `hitbody`, `miss`, `pump`, `shell`. A role the code names writes the file
  under that name (all variants: `357_shot1` and `357_shot2`).
- A role tied to an animation (`reload`, `draw`, `pinpull`, a second click) is a `5004` event: the build
  writes the event at `frame` of `sequence` in the `v_` file (`setEvents`, which keeps the others), with
  the sound's path. If the game's file already has a `5004` there, its path is the default name, so the
  game's reload sound is replaced in place.
- The build checks the event against the animation: the sound's length against the time from the frame
  to the sequence's end at its fps (`357` reload: 40 frames at 36 fps after frame 70 is 1.11 s), and says
  when a sound runs past it.
- For a mod with its own code or scripts (Master Sword's scripts name sounds), the profile gives the names
  and where they are precached, as it does for entities; a new name gets rule 8's warning.

A map spec gets the matching hook: an `ambient` entry `{ sound: "loops/hum.json", at: ..., radius:
"medium", volume: 8 }` builds the loop, writes `ambient_generic` with `message`, `health` and the radius
flag, sets flag 32 when the sound has no loop, and checks the file has a cue when it does. `footsteps: {
"M": "steps_metal.json" }` writes the four fixed files for that surface and says which textures of the map
`materials.txt` gives that letter.

### 6.4 What cannot be verified

- How it sounds to a person, and whether it reads as a wrench and not a bell. The features say "like the
  game's metal hits", not "good".
- The game's mixing: volume from the code (0.2 to 1), pitch randomising (`cbar_hit` 98 to 101, shotgun 85
  to 124), distance fall-off, the room effect `env_sound` adds, the 8-bit or 11025 Hz conversion if the
  person picks it, and how it sits against the music and other sounds.
- Timing in play: a reload's sound against the animation as the client predicts it, a footstep's interval.
  The kit checks the numbers (lengths against frames); only the game shows them together. `smak play`
  could later record the browser build's audio, which is out of scope here.
- Whether a mod's code plays the file at all (a name the code does not precache).

## 7. First implementation steps

1. `src/audio/wav.mjs`: read and write RIFF/WAVE PCM, mono, 8 and 16 bit, with one cue point; refuse
   stereo on write; a test that round-trips Half-Life-shaped files and one with a cue at 23395.
2. `src/audio/measure.mjs`: the hard checks of 5.1 and the features of 5.2 (an FFT of 60 lines); a test
   pinning the numbers on three synthetic signals (a sine, white noise, a decaying ping) whose features are
   known in closed form.
3. `src/audio/synth.mjs`: noise, biquad, envelope, oscillator with sweep, FM, modes, particles, room,
   saturate, finish. Each block a pure function of its parameters and the seed.
4. `src/spec/sound.mjs` and `build` dispatch: validate with paths and nearest-name suggestions as the model
   spec does; report as above; the picture of 5.5.
5. `src/audio/classes.mjs`: the reference ranges of 5.3 as data, and a script in `research/` (run where the
   game is installed) that measures them again from the game's files, so the numbers have provenance and
   no audio enters the repository.
6. Presets for the eight targets (metal hit, swing, gunshot, click, pump, shell, launcher, pin) and the
   step surfaces and three loops, each built and scored against its class as a test.
7. Two cases in `examples/prompts/`: the wrench's six crowbar sounds (5.6) and a looped machine hum on a
   map's `ambient_generic`; then `weapon.sounds` with the `5004` wiring on the revolver.
