# Why round 1 of sprites, sounds and textures failed, and what the kit lacks

Written 2026-10-14 from round 1 of the blind test in `examples/reproduce/assets.mjs` (rubric:
`examples/reproduce/rubric.md`, "Textures, sounds and sprites"). Results: sprites passed 2 of 16 legs, sounds
5 of 20, frenzy's textures 1 of 25 on each leg; every decoy failed. Every `judge.json` and `spec.json` was read
and tallied. Valve's originals in `~/.steam/steam/steamapps/common/Half-Life/valve` were measured in place and
never copied. The experiments were throwaway scripts in the session scratchpad; each is described well enough
below to write again.

## The short version

1. **Some failures came from the harness, not the kit.** They are cheap to fix and should be fixed before
   round 2. Four of frenzy's 25 textures are shown to the judge on faces the map leaves unlit, so they are
   black on both sides. The judge never sees a texture on its own, although the rubric says it does, so it
   cannot confirm a `+0` animation's frames or a `-0` texture's random siblings. The words leg of a sprite is
   not given the sprite's type, and two legs lost R5 for that. The sound judge is never given the class
   ranges that S2 refers to.
2. **Sprites: the layers cannot fill the frame the way Valve's do.** R2 ("fill") scored 1 on 14 of 16 legs.
   On 4 legs it was the only failed item, so fill alone would move sprites from 2 of 16 legs to 6. The glow
   cuts off at its radius, a flare's streaks are lines of one width, the beam is a Gaussian, and the fire
   always tapers to a cone. No layer makes a lit, lumpy billow (explosion, steam) or a cluster of blobs that
   changes every frame (xspark1). The only flame ramp runs red to orange, where Valve's explosion runs white,
   cream, tan and brown.
3. **Sounds: the blocks cannot make Valve's steep spectra or its density.** The filters are second-order
   (biquad) only. When I fitted octave-band noise layers to the pictures by closed loop, the kit's own blocks
   met S3 on **0 of 10** sounds. Noise shaped in the frequency domain to the same picture met it on **8 of 10**.
   Valve's weapon sounds have a crest (peak over average loudness) of 5.7 to 9.5 dB. Ours came out at 8.6 to
   18. The kit has a tanh drive but no limiter, so the opening crack is squashed along with the body. That
   crack is the item judges named most (8 legs).
4. **Textures: the kit paints flat colour, and agents cannot see their texture the way the judge does.**
   Valve's concrete walls have a fine-detail score (mean absolute Laplacian, a measure of texel-to-texel
   detail) of 25 to 38. The agents' concrete walls scored 2 to 10. T5 ("quality") was 0 or 1 on 23 of 25
   textures on each leg. Agents also got the brightness of the paint wrong by a factor of 0.14 to 2.2, because
   they read colour off a lit view with no way to remove the map's light. The hazard base has a fixed stripe
   period of 3 texels, which alone gave tnnl_brd1 its T3 of 0.
5. **The pictures legs carry more than the rubric intends.** A sprite's contact sheet gives back 99.1 to 100%
   of its pixels within 2 levels (7 of 8 sprites): the sheet is the sprite. A texture's in-map view, mapped
   back onto the texture with the map's own geometry and divided by its lightmap, gives every lit texture with
   a per-texel luminance correlation of 0.96 to 1.00. Reading either one back is copying. **Measuring** them
   (scale, rotation, average paint, statistics) is legitimate. I recommend the kit build the measuring tools
   and refuse the copying. Whether the rubric changes its pictures inputs is Steven's call.

## 1. What failed, item by item

### Table 1: sprites (16 legs; score of 2 means right)

| Sprite | pictures | words | Items under 2, and the judges' reason |
| --- | --- | --- | --- |
| glow01 | pass | pass | none |
| flare1 | 9/10 | 8/10 | R2: hard white disc, halo stops short (dark share 0.48 and 0.53, original 0.39); words R3: delta E 19.6 |
| laserbeam | 9/10 | 9/10 | R2: core about 8 dots wide where Valve's fills columns 8 to 24, smooth falloff with no streaks (dark 0.44 against 0.02) |
| fire | 9/10 | 6/10 | R2: a narrow cone, never touches the sides (border max 0.071 / 0.009 against 0.275); words R3: yellow-white core; words R5: type "upright" (the describer's words), original "parallel oriented" |
| muzzleflash1 | 7/10 | 7/10 | R2: thin, hard-edged arms where Valve's are broad soft wedges; R3: delta E 26.3 and 37.2, too saturated, no haze |
| xspark1 | 8/10 | 8/10 | R2: a tidy four-lobed clover; R4: lobes do not rearrange each frame (jitter 0.7 against 1.51 on words) |
| zerogxplode | 7/10 | 7/10 | R2: round centred ball (border max 0.048 against 0.818); R3: red-orange rim where Valve's is cream, tan, brown; R4: peaks at 0.57 against 0.36; no debris flecks |
| steam1 | 7/10 | 5/10 | R1: a disc, not a billowing cloud; R2: no wispy column below; R4: fades as one ball, never breaks up; words R5: type "parallel" |

| Item | Legs under 2 (of 16) |
| --- | --- |
| R1 what it is | 2 |
| R2 shape and size (fill) | 14 |
| R3 colour | 6 |
| R4 motion | 6 |
| R5 type and format | 2 (both words legs, both the type) |

Provenance: `examples/reproduce/assets/sprites/*/*/judge.json`.

### Table 2: sounds (20 legs)

| Item | Legs under 2 | What the reasons name |
| --- | --- | --- |
| S1 what it is | 10 | missing opening crack or blast (357_shot1, explode3, sbarrel1, pl_metal1); missing metal ring line (cbar_hit1); dry plinks against a room's tail (drips) |
| S2 envelope | 11 | attack 0.09 to 0.35 s where Valve's is 0.005 (explode3, 357_shot1, pl_metal1); no full-scale plateau in the first 0.25 s (sbarrel1); a hard step down (cbar_hit1 words); judges say "no class range was given" |
| S3 spectrum | 7 | bands off by 14 to 51 points, nearly all on the words leg (energy put in the wrong band) |
| S4 character | 18 | onsets missing; tonal lines added or missing; a door stop that is one thud where Valve's is a train of pulses; medkit crackle missing |
| S5 fit for the game | 0 | |

Passing: debris/bustmetal1 (pictures), doors/doormove1 (words), player/pl_metal1 (words), player/pl_step1
(both). Four more legs failed on one must-have item only: sbarrel1 words (S2), doormove1 pictures (S3,
centroid 27% off), drips words (S2), smallmedkit1 pictures (S2).

Provenance: `examples/reproduce/assets/sounds/*/*/judge.json`.

### Table 3: frenzy's textures (25 a leg; counts of scores 0 / 1 / 2)

| Item | pictures | words |
| --- | --- | --- |
| T1 what it is | 2 / 19 / 4 | 2 / 15 / 8 |
| T2 colour (measured in the map's views) | 1 / 14 / 10 | 2 / 6 / 17 |
| T3 layout and scale | 6 / 15 / 4 | 2 / 17 / 6 |
| T4 tiling | 0 / 0 / 25 | 0 / 10 / 15 |
| T5 quality | 14 / 9 / 2 | 8 / 15 / 2 |
| T6 kind kept | 0 / 4 / 21 | 1 / 3 / 21 |

The words the judge used again and again: "flat", "cartoon-flat", "vector", "featureless", "grain and grime
lost", "a grid 2.5 times finer", "stripes several times finer". The only pass on each leg was `black`.

Provenance: `examples/reproduce/assets/textures/frenzy/*/judge.json`.

## 2. Faults in the harness (fix before round 2)

| # | Fault | Evidence | Fix | Work |
| --- | --- | --- | --- | --- |
| H1 | `texturePlaces` picks each texture's largest face even when it has no light. c3a1b_w7, crete2_flr01, c3a2a_tnk1b and c2a4x_glu are black or nearly black in both views, so the judge gave 1 for "cannot confirm" | The rectify experiment (section 6) found 100% of those faces' pixels under 5% light | Pick the largest face whose mean lightmap is over a floor (`faceLightmap`), or draw that view with `light: false` as well | an hour |
| H2 | The rubric says the judge sees textures "each on its own", but the harness shows only in-map views. T6 was 1 on `+0~...` and `-0genpipe1` with the reason "the other frames cannot be confirmed" | judge.json reasons, T6 | Add sheets of each texture flat, the original's and the replacement's, every `+n`/`+a` frame and `-n` sibling included | an hour |
| H3 | The words leg of a sprite gets only the describer's words. fire's said "upright", steam1's gave no type at all, and both lost R5 (0) | `words.md` of both against `input/facts.txt` | Give `facts.txt` verbatim to the words leg as well: it is the format, not the look | minutes |
| H4 | S2 says "within the class's range (measured)", but the sound judge is never given the ranges. Five reasons say "no class range was given" | sounds judge.json | Put `audio.rangesOf(class)` of the original's class into the measurements | minutes |
| H5 | The renderer's scene cache (`sceneOf` in `src/maps/draw.mjs`) is keyed by texture **names**, not by their pixels. Two drawings of one parsed map with different textures of the same names show the first set twice | found while writing the rectify experiment, which rendered the wrong pass until it re-read the map | Key on an identity of the given textures (a counter per call), or document it. The harness is safe today: its two views differ in `folders` | minutes |

## 3. Sprites: what the kit lacks

What Valve's look like (measured with `measureSprite` on the originals; the shapes are from viewing the
judges' sheets):

| Sprite | Size x frames | Border max | Dark share | Look |
| --- | --- | --- | --- | --- |
| flare1 | 64x64 x1 | 0 | 0.39 | soft core with many fine radial rays reaching nearly to the edges |
| laserbeam | 32x64 x1 | 1.0 (a beam tiles) | 0.02 | core about half the width, streaky mottling across the whole width |
| fire | 32x96 x15 | 0.275 | 0.42 | dim red-orange tongues filling the width, dark streaks, no white core |
| muzzleflash1 | 64x64 x2 | 0.02 | 0.76 | five broad tapering wedges, blurred, tan-peach, small core, a haze |
| xspark1 | 32x32 x11 | 0.145 | 0.46 | overlapping soft cyan blobs, rearranged every frame |
| zerogxplode | 64x64 x15 | 0.818 | 0.73 | a lit, lumpy, off-centre billow (shaded as a 3D render is), white to cream to tan to brown smoke, debris flecks, peak at 0.36 of its length |
| steam1 | 32x48 x16 | 0.341 | 0.64 | a lumpy white puff with soft internal shading that grows, then thins into a column of wisps |

What the kit makes (`src/sprite/effects.mjs`):

| Gap | In the code | Effect in round 1 |
| --- | --- | --- |
| Glow falls to zero at `radius` (a smoothstep from 0.55 to 1 of it) | `glow` | flare1 dark 0.48 to 0.53 against 0.39 |
| Streaks are Gaussian lines of one `width` and a power falloff. They do not taper, blur or carry a haze | `flare` | muzzleflash1's thin hard arms; R3 off by 26 and 37 |
| No many-ray glow | none | flare1's fine rays are absent |
| Beam is `exp(-(u/core)^2)`. Its noise varies along the beam only, never across it | `beam` | laserbeam: narrow core and no mottling, dark 0.40 to 0.44 against 0.02 |
| Fire always tapers (`half = width * (1 - 0.65 h)`) and its heat falls with height | `fire` | the cone; border max 0.009 to 0.071 against 0.275 |
| Explosion is a radial ball with a noisy edge, unlit, coloured by the red `fire` ramp | `explosion` | the round ball, red rim, late peak |
| No lit billow, no break-up, no per-frame blob cluster | none | steam1 R1, R2 and R4; xspark1 R4; zerogxplode R2 and R4 |
| Ramps: `fire`, `blue`, `green` only | `RAMPS` | zerogxplode R3 (cream to brown wanted) |

### Methods to close them

| Method | What it is, implementable | Source | Verdict |
| --- | --- | --- | --- |
| Fill options on the existing layers | glow `falloff: "power"` with `reach` past the frame's corner (no hard cut); flare streaks `taper` (width grows toward the core), `blur` (a Gaussian across of its own), `haze` (a glow under the arms); `rays: { count, length, jitter }`: many thin streaks of random length; beam `profile: "flat"` (a flat top with soft shoulders) and `streaks` (noise varying across u, stretched along v); fire `taper: 0` and `tongues` (fbm stretched 1:4 upward, thresholded) | the kit's own layers | **Do first.** About a day. Aims at R2 on fire, flare1 and laserbeam, which on 4 legs is the only failed item |
| Ramps `blast` (white, cream, tan, brown) and `muzzle` (white, peach, tan) | stops measured off the original sheets (mean colour of the hot, middle and cool frames) | the judges' sheets | **Do.** An hour. muzzleflash1 R3 and zerogxplode R3 |
| Billow (lit metaballs) | N spheres (30 to 60, small), each with a seeded offset, radius, drift and rise; per pixel take the front-most sphere's height and normal, shade by a fixed light (top left), colour by heat x shade through the ramp, radius displaced by fbm for lumps; `dissolve`: an fbm threshold that rises with age, so the cloud breaks into wisps. For index alpha, alpha = coverage x (0.6 + 0.4 shade) so the puff keeps its inner shading | Blinn, "A Generalization of Algebraic Surface Drawing", ACM Transactions on Graphics 1982 (blobby objects); Ebert et al., *Texturing and Modeling: A Procedural Approach*, 3rd ed. 2003 (fbm and turbulence) | **Build, after tuning.** The 12-sphere prototype (section 6, experiment S) reads as a lit, lumpy, cream-to-tan billow, which the judges asked for. On my overlap metric it was no better: frame-mask IoU 0.43 against round 1's 0.41 on zerogxplode, and worse on steam1 (0.31 against 0.51). It needs more and smaller spheres, a hot white core early, and debris (the existing `sparks` with few, short trails) |
| Blob cluster | K soft discs (K about 9) placed afresh from a seed per frame round a core | xspark1 itself | **Build with billow** (same code path). The prototype matched the flicker but not the colour (delta E 23): needs its ramp |
| Flipbook simulation (smoke solver) | a 2D stable-fluids solver advecting density and temperature, rendered per frame | Stam, "Stable Fluids", SIGGRAPH 1999 | **Not now.** Several hundred lines; billow plus dissolve covers the eight sprites |
| Measuring against the input sheet | the build reports the judge's own measures (mean colour delta E, dark share, border, envelope, jitter) against a picture the agent names | the harness's `measureSpriteCopy` | **Do.** Measures only (see section 5). Lets the pictures leg aim at numbers, not at the look |

First experiment: add the fill options and the two ramps, then rebuild the round-1 specs for fire, flare1,
laserbeam and muzzleflash1 with only those options changed. **Metric**: the harness's own measures (dark share,
border max, border mean, mean colour delta E) against the original. The bar is the original's value within 0.05
for dark share and within 15 for delta E. Then rerun the judge on those 8 legs.

## 4. Sounds: what the kit lacks

What Valve's are (measured with `audio.features` and `audio.checks` on the originals):

| Sound | Rate, bits | Crest (dB) | Share of samples over 0.9 | Onsets | Note |
| --- | --- | --- | --- | --- | --- |
| weapons/explode3 | 22050, 8 | 5.7 | 10.5% | 1 | nearly square: limited hard |
| weapons/sbarrel1 | 22050, 8 | 8.3 | 7.4% | 1 | |
| weapons/357_shot1 | 22050, 8 | 8.5 | 6.5% | 3 | 73 samples in a row at full scale (the kit calls that a fault) |
| weapons/cbar_hit1 | 11025, 8 | 9.5 | 2.2% | 1 | one steady ring line through its length |
| debris/bustmetal1 | 11025, 8 | 12.7 | 1.1% | 0 | |
| items/smallmedkit1 | 22050, 8 | 11.1 | 0 | 1 | ends at 0.26 of full scale (the kit calls that a click) |
| doors/doormove1 | 11025, 8 | 13.9 | 0 | 2 | |
| player/pl_metal1 | 11025, 8 | 15.5 | 0 | 0 | |
| player/pl_step1 | 11025, 8 | 21 | 0 | 0 | |
| ambience/drips | 11025, 8 | 26.9 | 0 | 4 | |

The round-1 agents' weapon sounds had crests of 8.6 to 11.2 dB (judge.json `measured`). Both of my synthetic
experiments came out at 15 to 21 dB for the weapons. That is the "thinner, no saturated block" the judges described.

| Gap | In the code (`src/audio/synth.mjs`) | Effect |
| --- | --- | --- |
| Filters are RBJ biquads: 12 dB an octave for low- and high-pass, 6 for band-pass. A steep or many-peaked spectrum needs many stacked layers, and their skirts leak into each other | `biquad`, `filterChain` | Experiment A2 below: a closed-loop fit of octave-band noise layers to each picture could not converge. Bands stayed 7 to 30 points off and S3 passed on 0 of 10 |
| Loudness comes from `saturate` only: a static tanh over the whole mix, after the room | `render` finish | the opening crack is squashed into the body. 357_shot1 words had a 2 ms click layer at +6 dB, and after `saturate: 8` the harness found 1 onset of Valve's 3. Crest cannot be aimed at |
| Particles fall at random times only. No periodic pulse train | `particles` | doormove1's stop "a train of separate pulses" came out as one smooth swell |
| Room is decaying low-passed noise with no early reflections, and its length is the user's guess | `withRoom` | drips "dry plinks" against Valve's ringing tails in a room |
| No way to read the input picture as numbers | none | in the pictures leg the agent eyeballs a spectrogram whose colours are exactly invertible (`src/audio/draw.mjs`: R = 255 min(1, 1.5v), G = 255 max(0, 1.6v - 0.6), B = 110 max(0, 1 - 2v), v = (dB + 80)/80) |

### Methods to close them

| Method | What it is, implementable | Source | Verdict |
| --- | --- | --- | --- |
| Spectral noise layer | `{ kind: "noise", shape: [[Hz, dB], ...] }`, or a shape that moves: `shape: { keys: [{ at, curve }] }`. Noise made in the frequency domain: short-time Fourier frames (512, hop 128, Hann window) with random phase and magnitudes from the curve interpolated in log frequency and time, overlap-added. Optionally 20 to 40 Griffin-Lim iterations to make the phase consistent. About 80 lines over the kit's own `fft` | Griffin and Lim, "Signal estimation from modified short-time Fourier transform", IEEE Transactions on Acoustics, Speech, and Signal Processing 1984; Perraudin, Balazs and Søndergaard, "A fast Griffin-Lim algorithm", IEEE Workshop on Applications of Signal Processing to Audio and Acoustics (WASPAA) 2013 | **Do first.** Experiment A1: S3 measured within limits on 8 of 10 sounds, where the biquad fit managed 0 of 10 and round 1's pictures leg 6 of 10 |
| Limiter finish | `finish: { limit: { crest, release } }`: a look-ahead peak limiter (gain = min over a 2 ms window of ceiling / abs(x), smoothed with an instant attack and an exponential release), its ceiling found by bisection so that the crest reaches the target. A layer's `drive` saturates that layer alone, so a crack can sit on top of a squashed body | Zölzer (ed.), *DAFX: Digital Audio Effects*, 2nd ed. 2011, chapter 4 (dynamics processing) | **Do.** Valve's weapons are at 5.7 to 9.5 dB, ours at 15 to 21 dB without it. It also makes S2's "plateau" possible |
| Crack transient | a preset of the existing blocks: 1 to 3 ms of white noise high-passed at 1 to 3 kHz, attack 0, placed after the limiter (a `post: true` layer) so it keeps its onset | Farnell, *Designing Sound*, MIT Press 2010, the gunshot and explosion chapters | **Do** with the limiter. It is the item the judges named most (8 legs) |
| Periodic pulses | `particles: { every, jitter }`: grains at a period, each a short band-passed burst | as above | **Do.** A small change. doormove1 S4 |
| Room with early reflections | 6 to 12 early taps (10 to 40 ms, decaying), then the existing late noise tail. `decay` read off the picture's tail | Schroeder, "Natural sounding artificial reverberation", Journal of the Audio Engineering Society 1962; Moorer, "About this reverberation business", Computer Music Journal 1979 | **Later.** One sound (drips) |
| A picture read back to parameters | `audio.fromPicture(png)`: the outline as envelope points (it is exact to 1 column, 0.7 to 7 ms), band levels over time from the decoded spectrogram, tone lines (a row 6 dB over its neighbours two rows away in over 60% of columns; it found cbar_hit1's ring at 1063 Hz and a second line at 2991 Hz), onsets. It returns a draft spec: `noise` with a moving `shape`, `modes` for each tone line, envelope points. The agent edits it | the experiments here | **Do, as measures and a draft** (section 5 explains why this is reproduction) |
| Sound-texture statistics | match marginal moments and cross-band correlations of a cochlear subband envelope for stationary textures (drips, rain, fire loops) | McDermott and Simoncelli, "Sound texture perception via statistics of the auditory periphery", Neuron 2011 | **Not now.** Heavy; one sound in the set |
| Modal synthesis from recordings | fit the decay rate of each partial, frequency by frequency | van den Doel, Kry and Pai, "FoleyAutomatic", SIGGRAPH 2001 | **Already covered** by `modes`, once the tone lines are found |

First experiment: add the `shape` noise and the limiter, then rebuild round 1's ten pictures-leg specs. Replace
each spec's noise layers by one shaped layer whose curve comes from `fromPicture`, keep its `modes`, and add a
crack and a limiter at the original's crest. **Metric**: the harness's caps (length within 25%, centroid within
20%, every band within 10 points), plus attack within the class range and crest within 2 dB. The bar is S2 and
S3 capped at 2 on 8 of 10.

## 5. Textures: what the kit lacks

### Table 4: Valve's textures against the round-1 ones, texel by texel

Mean luminance (0 to 255), luminance standard deviation, fine detail (mean absolute 4-neighbour Laplacian,
wrapped), distinct colours and chroma, measured on the textures themselves (Valve's from `halflife.wad`):

| Texture | Valve: mean / sd / detail / colours | pictures leg | words leg |
| --- | --- | --- | --- |
| c3a1_w3a (cracked concrete) | 108 / 15 / 29.9 / 256 | 46 / 4 / 4.3 / 10 | 30 / 2 / 1.9 / 8 |
| c3a1_w2 (concrete, seam) | 131 / 29 / 37.8 / 254 | 85 / 10 / 9.1 / 62 | 56 / 5 / 5.7 / 20 |
| c3a1b_w3 (metal panel, notched seams) | 114 / 20 / 25.0 / 256 | 160 / 31 / 23.5 / 108 | 99 / 23 / 19.2 / 99 |
| c3a1b_w2 (wall with grille) | 100 / 39 / 30.9 / 255 | 140 / 54 / 37.9 / 168 | 99 / 22 / 16.7 / 97 |
| tnnl_flr7 (floor tiles) | 106 / 8 / 13.5 / 26 | 153 / 24 / 34.2 / 62 | 121 / 12 / 22.0 / 55 |
| tnnl_flr7c | 71 / 9 / 16.2 / 87 | 127 / 27 / 35.0 / 52 | 85 / 17 / 22.6 / 104 |
| c3a1b_w7 | 122 / 10 / 17.7 / 176 | 17 / 2 / 2.8 / 6 | 8 / 0 / 0.1 / 2 |
| babtech_ceil01 | 93 / 9 / 22.5 / 45 | 141 / 7 / 11.9 / 87 | 110 / 7 / 10.1 / 63 |
| c3a2_bth1 | 127 / 30 / 31.0 / 254 | 130 / 6 / 10.3 / 39 | 99 / 3 / 7.3 / 28 |
| -0genpipe1 (pipes) | 31 / 29 / 20.2 / 252 | 68 / 38 / 53.1 / 117 | 58 / 43 / 50.2 / 115 |

Two things show. **Detail**: Valve's concrete is at 25 to 38 and ours at 2 to 10. T5's "flat" and "featureless"
are a fact of the pixels, not the judge's taste. **Brightness of the paint**: ours ranges from 0.14 times
Valve's (c3a1b_w7) to 2.2 times (genpipe). The agents read colour off a view lit by the map, at 4.5 times its
light, and had no way to divide the light out. Their own preview (`viewsOf` at the default brightness, other
cameras) never showed them their texture as the judge would see it. The in-map T2 still passed often, because
dark faces hide it, but the textures are wrong anywhere else the map lights them.

### Gaps in the code (`src/spec/wad.mjs`, `src/spec/paint.mjs`, `mcp/tools.mjs`)

| Gap | Where | Effect |
| --- | --- | --- |
| Materials are a tone times weak fbm (plaster: 12% roughness, 10% speckle). No stains, streaks, cracks, scratches, chipping or painted light | `colourAt` | T5 0 or 1 on 23 of 25 textures a leg; agents drew cracks as dozens of 1-texel "panels" |
| Panels are flat fills with an edge bevel. No relief: no pipe (a cylinder shaded along a path), grille, louvre, rivet row, notched seam, or lamp face with a glow gradient | `paintPanels` | "cartoon-flat", "vector-like" (c3a1b_w1, w1a, w2, reac2c, genpipe1, fifties lights) |
| Pattern sizes are fixed: tile 32, metal panel 32, brick 16 by 32, hazard stripe period 3 texels | `surfacePicture`, hazard in `colourAt` | tnnl_brd1 T3 0 ("stripes several times finer") came from the base itself |
| The preview draws `viewsOf` at default brightness. It never shows each texture from the camera and at the brightness the judge uses | `mcp/tools.mjs` wad branch | scale (tnnl_flr7: grid 2.5 times too fine), orientation (genpipe1: pipes turned 90 degrees, because the face rotates its texture) and brightness could not be checked |
| `seen` colours assume the kit's stand-in lamp (`SEEN_LIGHT` 0.8, a model's light), not the map's lightmap | `materialOf` | the brightness errors above |

### Methods to close them

| Method | What it is, implementable | Source | Verdict |
| --- | --- | --- | --- |
| A place preview per texture | export the harness's `texturePlaces` as `maps.texturePlaces`; `preview: { map, each: true }` draws every texture on its largest lit face from the judge's camera at the judge's brightness, beside the agent's picture of it when one is given; the report says the face's texels across the view, its texture rotation and the mean light on it | the harness | **Do first.** Hours. It addresses T3 scale, orientation and T2 brightness on both legs |
| Paint, not light | `material: { seen, where: "map" }` divides a colour read off a map view by that face's light (lightmap mean x brightness); the report gives the light | `faceLightmap`, the renderer's rule texture x sample/255 x brightness (`lightTable` in `src/maps/draw.mjs`) | **Do with the preview** |
| Sizes as parameters | `tile: { cell }`, `brick: { course, length }`, `metal: { panel }`, `hazard: { width, angle }` | the kit | **Do.** An hour. tnnl_brd1 and the floors |
| A weathering stack | per texture, seamless (noise periodic over the texture): `stains` (low-frequency fbm blotches, multiply 0.75 to 1.25), `streaks` (noise stretched 1:8 downward from seams and the top), `cracks` (Worley cell borders F2 - F1 under a threshold, jittered, drawn as a dark line with a light line one texel above: an emboss), `scratches` (short random segments), `speckle` (texel noise of 4 to 8 levels), `edgeWear` (lighter on raised edges, darker in grooves, by distance to panel edges) | Worley, "A cellular texture basis function", SIGGRAPH 1996; Perlin, "An image synthesizer", SIGGRAPH 1985; Ebert et al. 2003 | **Do.** Two to three days. The largest single T5 gain. Metric: detail and sd in Valve's band (Table 4) |
| Relief painting | each texture gets a height field as well as colour: panels raise or sink, `pipe` (a cylinder along a polyline with elbows), `bars`, `grille` (bars over a dark recess), `louvre` (slats), `rivets` (a row), `seam: "notched"`; the colour is then lit by the gradient of the height field from a fixed top-left light, with an ambient-occlusion term from a blurred height difference (dark in recesses) | standard bump shading: Blinn, "Simulation of wrinkled surfaces", SIGGRAPH 1978 | **Do after the stack.** Three to four days. Machinery, grates, pipes and lights are about 10 of the 25 |
| Statistics matching | from the agent's own picture (or a de-lit view, measures only): match the luminance histogram per Laplacian-pyramid band of the procedural grain, and the mean and covariance of colour | Heeger and Bergen, "Pyramid-based texture analysis/synthesis", SIGGRAPH 1995; Portilla and Simoncelli, "A parametric texture model based on joint statistics of complex wavelet coefficients", International Journal of Computer Vision 2000 | **Later.** It uses a few dozen numbers, not pixels. Good for the stochastic concrete, after the stack |
| Example-based synthesis from the view | patch copying from the original's view into a new arrangement | Efros and Leung, International Conference on Computer Vision (ICCV) 1999; Efros and Freeman, "Image quilting", SIGGRAPH 2001; Kwatra et al., "Texture optimization", SIGGRAPH 2005 | **No.** Its output is made of Valve's pixels: a copy rearranged |

First experiment: the place preview and the size parameters, then rebuild round 1's pictures-leg spec with
only the scale, orientation and paint brightness corrected from the preview. **Metric**: per texture, the
in-map delta E (the judge's T2) and the paint's mean luminance against Valve's (Table 4), plus the grid period
read by autocorrelation of the replacement's view against the original's. The bar is T2 within 15 on 20 of the
21 judgeable textures and period within 10%. Second experiment, for the stack: rebuild the four concrete walls
and score detail and sd against Table 4. The bar is within 25% of Valve's on both, then judge T5.

## 6. The experiments run here

| # | What | How | Result |
| --- | --- | --- | --- |
| T-R | A texture rectified from its in-map view and de-lit | the view rendered three more times from the input's camera: the texture replaced by one whose palette codes its column (pass 1) and its row (pass 2), with `light: false`, then by plain white at brightness 1 (the light). Each screen pixel then names its texel and its light, and the paint is seen / (light x 4.5), skipping clipped pixels | 18 textures. On the 14 with light, texels recovered 5% to 100%, mean colour delta E against Valve's 1.1 to 12.4, **per-texel luminance correlation 0.96 to 1.00**, mean luminance within 1 to 12. The 4 unlit faces gave nothing (harness fault H1) |
| A1 | A sound from its picture by spectral shaping | the outline as the envelope; the spectrogram's colours inverted to dB; noise shaped frame by frame in the frequency domain, 0 or 40 Griffin-Lim iterations; the envelope laid on | 40 iterations: length within 1.5% on all 10; **S3 within limits on 8 of 10** (failing: pl_step1 centroid 89% off, doormove1 band 12 points). Crest 16 to 29 dB against Valve's 5.7 to 27 (no limiter) |
| A2 | The same from the kit's own blocks | one `noise` layer an octave (band-pass), envelope points read off the picture, `modes` for each tone line found, gains fitted in a closed loop (5 passes) | **S3 on 0 of 10**: centroid 10% to 90% off, bands 7 to 30 points. The coupled skirts of second-order filters cannot make the spectra |
| S | A billow and a blob cluster | 12 lit spheres (shade = 0.45 + 0.75 n.L), cream-to-brown ramp, fbm dissolve; 9 soft discs per frame round a core | Visually a lit, lumpy billow. Mask overlap (IoU) per frame: zerogxplode 0.43 (round 1: 0.41 and 0.39), steam1 0.31 (round 1: 0.51 and 0.52), xspark1 0.64 (round 1: 0.76 and 0.75). Mean colour delta E 14.9, 8.2 and 23.3. Inconclusive: needs tuning and a better shape measure |
| R-S | A sprite read off its contact sheet | the ground taken away, the whole-number enlargement undone | 7 of 8 sprites: **99.1% to 100% of pixels within 2 levels** of the original (fire's 32x96 cell did not line up in my reader; not pursued) |

I could not listen to any sound. All the sound results are features, not hearing.

## 7. Using the pictures more directly: what is reproduction and what is copying

The rubric's rule is that pictures of the asset in use are allowed inputs and the asset's file is not. Its own
words for textures are "never the texture itself, which would be a copy". AGENTS.md rule 7 says a game's
textures belong to its authors. The measured facts:

| Way | What comes back (measured) | Verdict |
| --- | --- | --- |
| Sprite frames read off the contact sheet | the sprite's pixels, 99.1% to 100% within 2 levels | **Copying.** The sheet is the sprite, enlarged. Reading it back makes Valve's file again. The rubric's pictures input for sprites makes this possible. To keep the leg a test of the kit, Steven could change the input (the sprite seen in a map view, scaled and over a scene, or animated at a size other than whole-number multiples), or rule that read-back is forbidden. **Measuring** the sheet (mean colour, dark share, border, envelope, jitter: the judge's own measures) is legitimate and worth building |
| Texture rectified and de-lit from its view | Valve's texels, correlation 0.96 to 1.00, wherever the view covers them | **Copying** if the texels are used: it is the texture itself, which the rubric names as a copy. **Legitimate as measures**: texels across the view, rotation, offsets, the paint's mean colour, panel and seam positions, tile period, and histogram or spectrum statistics. The tool should return measures only |
| Example-based synthesis from the view | a new arrangement of Valve's pixels | **Copying** |
| Statistics matching (Heeger and Bergen, Portilla and Simoncelli) | a few dozen to a few hundred numbers, synthesized from noise | **Reproduction**: like reading a colour off a picture |
| A sound inverted from its spectrogram (Griffin-Lim) | a sound with the original's band energies at 512-sample frames and its outline. The phase is new, so the waveform is not the original's | **A traced copy.** It is legitimate by the letter, since the picture is an allowed input. But it measures how much the harness's picture holds, not whether the kit can make the sound, and the file is a lossy transcode of Valve's recording, so rule 7 applies. Keep it as the upper bound in research |
| A sound's picture read back to parameters (envelope points, band curve, tone lines) feeding the kit's synthesis | an editable spec of tens of numbers | **Reproduction**: what a sound designer does matching a reference |

The line I recommend: tools that turn a picture into **measures or a parametric draft** are in, and tools that
turn it into **samples or texels** are out. That needs a sentence in the rubric. Its pictures inputs for sprites
(and for textures, at about a texel a pixel) give far more than "a picture in use" suggests. Both are Steven's
decision.

## 8. Ranked by expected gain for the least work

| Rank | Build | Kind | Work | What it should move (round-1 evidence) |
| --- | --- | --- | --- | --- |
| 1 | H1 to H4: lit faces, flat sheets, facts to the words leg, class ranges to the judge | harness | half a day | 4 textures' T1, T3 and T5 become judgeable; T6 on the 4 animated or random-tile textures a leg; R5 on 2 sprite legs; S2 judged against a range |
| 2 | Per-texture place preview, paint by the map's light, texels-across and rotation in the report | textures | 1 day | T2 and T3 on both legs; the brightness errors (0.14 to 2.2 times) |
| 3 | Size parameters for tile, brick, metal, hazard | textures | an hour | tnnl_brd1 T3, floors' T3 |
| 4 | Sprite fill options and the `blast` and `muzzle` ramps | sprites | 1 day | R2 on fire, flare1, laserbeam (4 legs fail on R2 alone: 2 of 16 to 6 of 16); R3 on muzzleflash1 and zerogxplode |
| 5 | Spectral noise `shape` and the limiter, crack layer after it | sounds | 1 to 2 days | S3 (A1: 8 of 10 in limits); S1, S2 and S4 on the 8 legs that miss the crack or plateau |
| 6 | Sheet and picture measures in the build report (the judge's numbers against the input) | sprites, sounds | half a day | lets the pictures legs aim at the judge's numbers |
| 7 | Weathering stack | textures | 2 to 3 days | T5 and T1 on the concrete, floors and ceilings (about 12 textures) |
| 8 | `audio.fromPicture` draft spec; periodic pulses | sounds | 1 day | the words-leg S3 failures (bands 14 to 51 points off) are the describer's; this helps the pictures leg only |
| 9 | Billow and blob layers, tuned | sprites | 2 days | zerogxplode, steam1, xspark1 (6 legs; R1, R2, R4) |
| 10 | Relief painting (pipes, grilles, louvres, rivets, lamp faces) | textures | 3 to 4 days | T5 and T1 on about 10 machinery, grate and light textures |
| 11 | Room with early reflections; statistics matching for textures | both | 1 to 2 days each | drips; concrete grain |

## 9. Build list

1. Harness: `texturePlaces` picks the largest lit face; texture sheets flat beside the views (every `+n`, `+a`,
   `-n`); `facts.txt` to the sprite words leg; class ranges in the sound judge's measurements; the scene cache
   keyed on the given textures, not their names.
2. `maps.texturePlaces` exported; the wad preview `each: true` from the judge's camera and brightness, with
   texels-across, rotation and the face's light in the report; `material.seen` with `where: "map"`.
3. Size parameters: `tile.cell`, `brick.course` and `length`, `metal.panel`, `hazard.width` and `angle`.
4. Sprite layers: glow `falloff` and `reach`; flare `taper`, `blur`, `haze`, `rays`; beam `profile` and
   `streaks`; fire `taper` and `tongues`; ramps `blast` and `muzzle`.
5. Sound: noise `shape` (static and keyed), STFT synthesis with optional Griffin-Lim; `finish.limit` with crest
   target; a layer's `drive` and `post`; `particles.every`.
6. Measures against a reference picture in the sprite and sound build reports (measures only).
7. Texture weathering stack: stains, streaks, cracks (Worley), scratches, speckle, edge wear.
8. `audio.fromPicture` to a draft spec.
9. Sprite `billow` (with dissolve) and `blobs`.
10. Texture relief: height field, pipes, bars, grilles, louvres, rivets, notched seams, lamp faces; bump-lit with
    occlusion.
11. Later: room early reflections; Heeger-Bergen statistics matching; a rubric sentence on read-back (Steven).

## 10. What I could not verify

- How any sound sounds: nothing was listened to. Every sound statement is a feature or a picture.
- Whether the billow layer would pass R2 and R4 once tuned. The prototype was 12 spheres, untuned, and my
  overlap measure did not separate it from round 1.
- How a judge would score sounds made by A1. I measured only the harness's caps (S2 length, S3) and features,
  not S1 or S4.
- Why tnnl_flr7's pictures-leg grid came out 2.5 times too fine. Valve's is 4 tiles of 32 across 128. The words
  said "8 x 8 tiles of 16" (the describer's misreading). For the pictures leg I infer missing scale information
  from the view, but did not trace the agent's reasoning.
- The pl_step1 and doormove1 misses in A1. They are probably the decoding at the spectrogram's -80 dB floor, but
  that is not checked.
- The fire sheet read-back. My reader's cell geometry did not fit a 32x96 frame in a 128 cell; the other seven
  were exact.
- Whether Valve's sprites were rendered from 3D. The lit look of zerogxplode and steam1 suggests it; I found no
  source.
- The literature is cited from the papers' known titles and venues. I did not fetch them this session.
